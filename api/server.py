#!/usr/bin/env python3
"""
VoxCPM API Server

A minimal Flask server that wraps VoxCPM inference for text-to-speech
and voice cloning capabilities.
"""

import os
import sys
import base64
import tempfile
import time
import logging
import functools
from collections import defaultdict
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
import soundfile as sf
import numpy as np

# Configure logging - log metadata but NOT audio content
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# CORS: Only allow requests from the local Next.js frontend
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# --- API Key Authentication ---
API_SECRET_KEY = os.environ.get("API_SECRET_KEY")


def require_api_key(f):
    """Decorator that enforces API key authentication on an endpoint."""
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        if not API_SECRET_KEY:
            # If no key is configured, skip auth (dev mode convenience)
            logger.warning("API_SECRET_KEY not set — authentication disabled")
            return f(*args, **kwargs)

        # Accept key from Authorization: Bearer <key> or X-API-Key header
        auth_header = request.headers.get("Authorization", "")
        api_key_header = request.headers.get("X-API-Key", "")

        token = None
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
        elif api_key_header:
            token = api_key_header

        if not token or token != API_SECRET_KEY:
            logger.warning(f"Unauthorized request from {request.remote_addr}")
            return jsonify({"error": "Unauthorized — invalid or missing API key"}), 401

        return f(*args, **kwargs)
    return decorated


# --- In-Memory Rate Limiting ---
# Tracks {ip: [timestamp, ...]} for sliding window rate limiting
_rate_limit_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_MAX_REQUESTS = int(os.environ.get("RATE_LIMIT_MAX", "10"))
RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get("RATE_LIMIT_WINDOW", "60"))


def check_rate_limit() -> bool:
    """
    Check if the current request IP is within the rate limit.
    Returns True if the request is allowed, False if it should be rejected.
    Uses a sliding window approach.
    """
    ip = request.remote_addr or "unknown"
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS

    # Prune old entries outside the window
    _rate_limit_store[ip] = [
        t for t in _rate_limit_store[ip] if t > window_start
    ]

    if len(_rate_limit_store[ip]) >= RATE_LIMIT_MAX_REQUESTS:
        return False

    _rate_limit_store[ip].append(now)
    return True


# --- Input Validation ---
MAX_TEXT_LENGTH = 5000

# Global model instance (loaded once at startup)
_model = None
_model_name = os.getenv("VOXCPM_MODEL", "openbmb/VoxCPM-0.5B")


def get_model():
    """Get or initialize the VoxCPM model (singleton pattern)."""
    global _model
    if _model is None:
        logger.info(f"Loading VoxCPM model: {_model_name}")
        try:
            from voxcpm import VoxCPM
            _model = VoxCPM.from_pretrained(_model_name)
            logger.info("Model loaded successfully")
        except ImportError:
            logger.error("VoxCPM not installed. Run: pip install voxcpm")
            raise
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    return _model


def decode_audio_to_temp_file(audio_base64: str) -> str:
    """
    Decode base64 audio to a temporary WAV file.
    Handles WebM/Opus from browser MediaRecorder by converting to WAV.
    """
    audio_bytes = base64.b64decode(audio_base64)

    # Create a temp file for the input audio
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
        input_path = f.name
        f.write(audio_bytes)

    # Convert to WAV using pydub (handles various formats)
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(input_path)

        # Export as WAV
        output_path = input_path.replace(".webm", ".wav")
        audio.export(output_path, format="wav")

        # Clean up input file
        os.unlink(input_path)

        return output_path
    except Exception as e:
        # Clean up on error
        if os.path.exists(input_path):
            os.unlink(input_path)
        raise RuntimeError(f"Failed to convert audio: {e}")


@app.route("/api/tts", methods=["POST"])
@require_api_key
def tts():
    """
    Generate speech from text, optionally with voice cloning.

    Request body:
    {
        "text": str,                    # Required: text to synthesize
        "promptAudioBase64": str,       # Optional: base64 encoded voice prompt
        "promptText": str,              # Optional: transcript of voice prompt
        "cfgValue": float,              # Optional: guidance value (default 2.0)
        "inferenceTimesteps": int,      # Optional: diffusion steps (default 10)
        "normalize": bool               # Optional: normalize text (default false)
    }

    Response:
    {
        "audioBase64": str,             # Base64 encoded WAV audio
        "sampleRate": int,              # Sample rate (44100 for VoxCPM1.5)
        "durationSeconds": float        # Duration in seconds
    }
    """
    # Rate limiting
    if not check_rate_limit():
        logger.warning(f"Rate limit exceeded for {request.remote_addr}")
        return jsonify({
            "error": "Rate limit exceeded",
            "details": f"Maximum {RATE_LIMIT_MAX_REQUESTS} requests per {RATE_LIMIT_WINDOW_SECONDS} seconds"
        }), 429

    start_time = time.time()
    prompt_wav_path = None

    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No JSON body provided"}), 400

        text = data.get("text", "").strip()
        if not text:
            return jsonify({"error": "Text is required"}), 400

        # Input length validation
        if len(text) > MAX_TEXT_LENGTH:
            return jsonify({
                "error": "Text too long",
                "details": f"Maximum {MAX_TEXT_LENGTH} characters allowed, got {len(text)}"
            }), 400

        # Log request metadata (not audio content)
        logger.info(f"TTS Request: text_length={len(text)}, "
                   f"has_prompt={'promptAudioBase64' in data}, "
                   f"cfg={data.get('cfgValue', 2.0)}, "
                   f"steps={data.get('inferenceTimesteps', 10)}")

        # Extract parameters with defaults
        # Note: normalize=False by default due to wetext library compatibility issues
        cfg_value = float(data.get("cfgValue", 2.0))
        inference_timesteps = int(data.get("inferenceTimesteps", 10))
        normalize = bool(data.get("normalize", False))
        prompt_text = data.get("promptText", "").strip() or None

        # Handle voice prompt audio
        prompt_audio_base64 = data.get("promptAudioBase64")
        if prompt_audio_base64:
            prompt_wav_path = decode_audio_to_temp_file(prompt_audio_base64)
            logger.info(f"Voice prompt decoded to: {prompt_wav_path}")

        # Get model and generate
        model = get_model()

        generate_kwargs = {
            "text": text,
            "cfg_value": cfg_value,
            "inference_timesteps": inference_timesteps,
            "normalize": normalize,
        }

        if prompt_wav_path:
            generate_kwargs["prompt_wav_path"] = prompt_wav_path
        if prompt_text:
            generate_kwargs["prompt_text"] = prompt_text

        wav = model.generate(**generate_kwargs)

        # Get sample rate from model
        sample_rate = model.tts_model.sample_rate

        # Convert to WAV bytes
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            output_path = f.name

        sf.write(output_path, wav, sample_rate)

        with open(output_path, "rb") as f:
            audio_bytes = f.read()

        os.unlink(output_path)

        # Calculate duration
        duration_seconds = len(wav) / sample_rate

        # Encode response
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

        elapsed = time.time() - start_time
        logger.info(f"TTS Complete: duration={duration_seconds:.2f}s, "
                   f"processing_time={elapsed:.2f}s")

        return jsonify({
            "audioBase64": audio_base64,
            "sampleRate": sample_rate,
            "durationSeconds": round(duration_seconds, 2)
        })

    except Exception as e:
        logger.error(f"TTS Error: {e}")
        return jsonify({
            "error": "TTS generation failed",
            "details": str(e)
        }), 500

    finally:
        # Clean up temp files
        if prompt_wav_path and os.path.exists(prompt_wav_path):
            os.unlink(prompt_wav_path)


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "model": _model_name,
        "model_loaded": _model is not None
    })


if __name__ == "__main__":
    port = int(os.getenv("API_PORT", 5001))

    # Pre-load model on startup
    logger.info("Pre-loading VoxCPM model...")
    try:
        get_model()
    except Exception as e:
        logger.warning(f"Model pre-load failed (will retry on first request): {e}")

    logger.info(f"Starting VoxCPM API server on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
