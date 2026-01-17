import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/tts",
        destination: "http://localhost:5001/api/tts",
      },
    ];
  },
};

export default nextConfig;
