"use client";

import { useState } from "react";
import { Loader2, Volume2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Textarea,
  Label,
  Slider,
  Toggle,
} from "@/components/ui";
import { AudioPlayer } from "./AudioPlayer";
import { generateTTS, isError } from "@/lib/api";
import { DEFAULT_SETTINGS, HistoryItem } from "@/lib/types";
import { addToHistory, generateId } from "@/lib/storage";

interface TTSFormProps {
  onHistoryUpdate: () => void;
}

export function TTSForm({ onHistoryUpdate }: TTSFormProps) {
  const [text, setText] = useState("");
  const [cfgValue, setCfgValue] = useState(DEFAULT_SETTINGS.cfgValue);
  const [inferenceTimesteps, setInferenceTimesteps] = useState(
    DEFAULT_SETTINGS.inferenceTimesteps
  );
  const [normalize, setNormalize] = useState(DEFAULT_SETTINGS.normalize);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    audioBase64: string;
    sampleRate: number;
    timestamp: number;
  } | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError("Please enter some text to synthesize");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    const response = await generateTTS({
      text: text.trim(),
      cfgValue,
      inferenceTimesteps,
      normalize,
    });

    setIsLoading(false);

    if (isError(response)) {
      setError(response.error + (response.details ? `: ${response.details}` : ""));
      return;
    }

    const timestamp = Date.now();
    setResult({
      audioBase64: response.audioBase64,
      sampleRate: response.sampleRate,
      timestamp,
    });

    // Add to history
    const historyItem: HistoryItem = {
      id: generateId(),
      text: text.trim(),
      hasPromptAudio: false,
      cfgValue,
      inferenceTimesteps,
      normalize,
      audioBase64: response.audioBase64,
      sampleRate: response.sampleRate,
      durationSeconds: response.durationSeconds,
      createdAt: new Date().toISOString(),
      mode: "tts",
    };
    addToHistory(historyItem);
    onHistoryUpdate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Text to Speech
        </CardTitle>
        <CardDescription>
          Enter text to synthesize using the default VoxCPM voice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Text Input */}
        <div className="space-y-2">
          <Label htmlFor="tts-text">Text to synthesize</Label>
          <Textarea
            id="tts-text"
            placeholder="Enter the text you want to convert to speech..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Slider
            label="CFG Value"
            min={0.5}
            max={5}
            step={0.1}
            value={cfgValue}
            onChange={setCfgValue}
          />
          <Slider
            label="Inference Steps"
            min={5}
            max={50}
            step={1}
            value={inferenceTimesteps}
            onChange={setInferenceTimesteps}
          />
        </div>

        <Toggle
          pressed={normalize}
          onPressedChange={setNormalize}
          label="Normalize text (recommended for natural speech)"
        />

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isLoading || !text.trim()}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Speech"
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Result Player */}
        {result && (
          <div className="space-y-2">
            <Label>Generated Audio</Label>
            <AudioPlayer
              base64={result.audioBase64}
              sampleRate={result.sampleRate}
              filename={`tts-${result.timestamp}.wav`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
