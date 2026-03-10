import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The /api/tts rewrite has been replaced by a Route Handler at
  // src/app/api/tts/route.ts which injects the API_SECRET_KEY
  // server-side before proxying to Flask.
};

export default nextConfig;
