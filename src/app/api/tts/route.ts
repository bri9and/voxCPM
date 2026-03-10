import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js API route that proxies TTS requests to the Flask backend.
 * Injects the API_SECRET_KEY server-side so it is never exposed to the browser.
 */

const FLASK_URL =
  process.env.FLASK_API_URL || "http://localhost:5001/api/tts";
const API_SECRET_KEY = process.env.API_SECRET_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (API_SECRET_KEY) {
      headers["X-API-Key"] = API_SECRET_KEY;
    }

    const response = await fetch(FLASK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Proxy error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }
}
