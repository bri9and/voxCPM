import { TTSRequest, TTSResponse, TTSError } from "./types";

// Call Flask API directly to avoid Next.js proxy timeout on long requests
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export async function generateTTS(
  request: TTSRequest
): Promise<TTSResponse | TTSError> {
  try {
    const response = await fetch(`${API_BASE}/api/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || "TTS generation failed",
        details: data.details,
      };
    }

    return data as TTSResponse;
  } catch (error) {
    return {
      error: "Network error",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function isError(
  response: TTSResponse | TTSError
): response is TTSError {
  return "error" in response;
}
