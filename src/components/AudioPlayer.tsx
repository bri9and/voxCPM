"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Play, Pause, Download } from "lucide-react";
import { Button } from "@/components/ui";
import { cn, formatDuration } from "@/lib/utils";

interface AudioPlayerProps {
  src?: string;
  base64?: string;
  sampleRate?: number;
  filename?: string;
  className?: string;
  showDownload?: boolean;
}

export function AudioPlayer({
  src,
  base64,
  sampleRate = 44100,
  filename = "audio.wav",
  className,
  showDownload = true,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Create data URL from base64 if provided (better browser compatibility than blob URL)
  const audioSrc = useMemo(() => {
    if (base64) {
      return `data:audio/wav;base64,${base64}`;
    }
    return src ?? null;
  }, [base64, src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset state when source changes
    setError(null);
    setIsLoaded(false);
    setIsPlaying(false);

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleCanPlayThrough = () => setIsLoaded(true);
    const handleError = () => {
      const mediaError = audio.error;
      const errorMessages: Record<number, string> = {
        1: "Audio loading aborted",
        2: "Network error loading audio",
        3: "Audio decoding failed",
        4: "Audio format not supported",
      };
      setError(mediaError ? errorMessages[mediaError.code] || "Unknown audio error" : "Failed to load audio");
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("canplaythrough", handleCanPlayThrough);
    audio.addEventListener("error", handleError);

    // Try to load the audio
    audio.load();

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
      audio.removeEventListener("error", handleError);
    };
  }, [audioSrc]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Playback failed");
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = parseFloat(e.target.value);
  };

  const handleDownload = () => {
    if (audioSrc) {
      const a = document.createElement("a");
      a.href = audioSrc;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (!audioSrc) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200",
        error && "border-rose-300 bg-rose-50",
        className
      )}
    >
      <audio ref={audioRef} src={audioSrc} preload="auto" />

      <Button
        variant="secondary"
        size="sm"
        onClick={togglePlay}
        className="shrink-0 w-10 h-10 p-0"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </Button>

      <div className="flex-1 space-y-1">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
        />
        <div className="flex justify-between text-xs text-zinc-500 font-mono">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {showDownload && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="shrink-0"
          title="Download"
        >
          <Download className="h-4 w-4" />
        </Button>
      )}

      {sampleRate && !error && (
        <span className="text-xs text-zinc-400 shrink-0">
          {(sampleRate / 1000).toFixed(1)}kHz
        </span>
      )}

      {error && (
        <span className="text-xs text-rose-600 shrink-0">
          {error}
        </span>
      )}
    </div>
  );
}
