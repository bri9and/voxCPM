# VoxCPM Playground

A minimal web UI for testing VoxCPM text-to-speech and voice cloning capabilities.

## Features

- **Text-to-Speech**: Generate speech from text using VoxCPM's default voice
- **Voice Cloning**: Record a voice sample and generate speech in that voice
- **History**: View and replay past generations with their settings
- **Adjustable Settings**: Control CFG value, inference steps, and text normalization

## Prerequisites

- Node.js 18+
- Python 3.9+
- (Recommended) NVIDIA GPU with CUDA for faster inference
- ~4GB disk space for model weights

## Installation

### 1. Frontend Setup

```bash
cd Vox
npm install
```

### 2. Backend Setup

```bash
cd api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Note**: VoxCPM will download model weights (~2GB) on first run.

### 3. (Optional) Environment Configuration

```bash
cp .env.example .env.local
```

Edit `.env.local` to customize:
- `VOXCPM_MODEL`: Model to use (default: `openbmb/VoxCPM1.5`)
- `API_PORT`: Backend port (default: `5001`)

## Running

### Development (both servers)

```bash
npm run dev:all
```

This runs:
- Next.js frontend on http://localhost:3000
- Python API on http://localhost:5001

### Or run separately

Terminal 1 (Frontend):
```bash
npm run dev
```

Terminal 2 (Backend):
```bash
source api/venv/bin/activate
npm run api
```

## API Reference

### POST /api/tts

Generate speech from text.

**Request:**
```json
{
  "text": "Hello, world!",
  "promptAudioBase64": "...",
  "promptText": "Optional transcript of voice prompt",
  "cfgValue": 2.0,
  "inferenceTimesteps": 10,
  "normalize": true
}
```

**Response:**
```json
{
  "audioBase64": "UklGRv4A...",
  "sampleRate": 44100,
  "durationSeconds": 1.5
}
```

### Example curl Requests

**Basic TTS:**
```bash
curl -X POST http://localhost:5001/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is a test of VoxCPM text to speech."}' \
  | jq -r '.audioBase64' | base64 -d > output.wav
```

**With custom settings:**
```bash
curl -X POST http://localhost:5001/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This uses higher quality settings.",
    "cfgValue": 3.0,
    "inferenceTimesteps": 25,
    "normalize": true
  }' | jq -r '.audioBase64' | base64 -d > output.wav
```

**Voice cloning (with audio file):**
```bash
# First, encode your voice sample to base64
PROMPT_AUDIO=$(base64 -i voice_sample.wav)

curl -X POST http://localhost:5001/api/tts \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"This should sound like the voice sample.\",
    \"promptAudioBase64\": \"$PROMPT_AUDIO\",
    \"promptText\": \"Transcript of what was said in the voice sample\"
  }" | jq -r '.audioBase64' | base64 -d > cloned_output.wav
```

**Health check:**
```bash
curl http://localhost:5001/health
```

## Settings

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `cfgValue` | 2.0 | 0.5-5.0 | Guidance strength. Higher = more prompt adherence |
| `inferenceTimesteps` | 10 | 5-50 | Diffusion steps. Higher = better quality, slower |
| `normalize` | true | - | Enable text normalization for natural speech |

## Known Limitations

- **CPU-only mode is slow**: First generation may take 30+ seconds on CPU. GPU is strongly recommended.
- **Voice cloning quality**: Works best with 5-15 second clear voice samples with minimal background noise.
- **Browser recording format**: Audio is recorded as WebM/Opus and converted to WAV server-side. Quality may vary.
- **Model size**: VoxCPM1.5 requires ~4GB VRAM. Use VoxCPM-0.5B for lower memory systems.
- **History storage**: History is stored in browser localStorage (limited to ~5MB).

## Project Structure

```
Vox/
├── api/
│   ├── server.py           # Flask API server
│   └── requirements.txt    # Python dependencies
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Main page with tabs
│   │   └── globals.css     # Global styles
│   ├── components/
│   │   ├── ui/             # Reusable UI components
│   │   ├── TTSForm.tsx     # TTS tab
│   │   ├── VoiceCloneForm.tsx  # Voice clone tab
│   │   ├── HistoryList.tsx # History tab
│   │   └── AudioPlayer.tsx # Audio playback component
│   ├── hooks/
│   │   └── useAudioRecorder.ts  # Browser audio recording hook
│   └── lib/
│       ├── api.ts          # API client
│       ├── types.ts        # TypeScript types
│       ├── storage.ts      # localStorage helpers
│       └── utils.ts        # Utility functions
├── package.json
└── README.md
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, TypeScript
- **Backend**: Flask, VoxCPM, soundfile, pydub
- **Audio**: MediaRecorder API (browser), WebM to WAV conversion

## License

MIT
