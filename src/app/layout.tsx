import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VoxCPM Playground",
  description:
    "Test harness for VoxCPM text-to-speech and voice cloning capabilities",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#047857",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50`}
      >
        {children}
        <span style={{ position: 'fixed', top: 8, right: 12, fontSize: 11, color: 'rgba(4,120,87,0.4)', zIndex: 9999, fontFamily: 'monospace', pointerEvents: 'none' }}>v2.0</span>
      </body>
    </html>
  );
}
