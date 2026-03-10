import { TTSRequest, TTSResponse, TTSError } from "./types";

// Route through the Next.js API route handler (/api/tts) which injects
// the API_SECRET_KEY server-side before proxying to Flask.
// This keeps the secret out of the browser.

export async function generateTTS(
  request: TTSRequest
): Promise<TTSResponse | TTSError> {
  try {
    const response = await fetch("/api/tts", {
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
