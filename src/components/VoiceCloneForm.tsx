"use client";

import { useState } from "react";
import { Loader2, Mic, Square, Trash2, Users } from "lucide-react";
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
  Input,
} from "@/components/ui";
import { AudioPlayer } from "./AudioPlayer";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { generateTTS, isError } from "@/lib/api";
import { DEFAULT_SETTINGS, HistoryItem } from "@/lib/types";
import { addToHistory, generateId } from "@/lib/storage";
import { formatDuration, blobToBase64 } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface VoiceCloneFormProps {
  onHistoryUpdate: () => void;
}

export function VoiceCloneForm({ onHistoryUpdate }: VoiceCloneFormProps) {
  const recorder = useAudioRecorder();
  const [promptText, setPromptText] = useState("");
  const [targetText, setTargetText] = useState("");
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
    if (!targetText.trim()) {
      setError("Please enter target text to synthesize");
      return;
    }
    if (!recorder.audioBlob) {
      setError("Please record a voice prompt first");
      return;
    }
    if (!promptText.trim()) {
      setError("Please enter what you said in the recording (prompt transcript is required for voice cloning)");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const promptAudioBase64 = await blobToBase64(recorder.audioBlob);

      const response = await generateTTS({
        text: targetText.trim(),
        promptAudioBase64,
        promptText: promptText.trim() || undefined,
        cfgValue,
        inferenceTimesteps,
        normalize,
      });

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
        text: targetText.trim(),
        promptText: promptText.trim() || undefined,
        hasPromptAudio: true,
        cfgValue,
        inferenceTimesteps,
        normalize,
        audioBase64: response.audioBase64,
        sampleRate: response.sampleRate,
        durationSeconds: response.durationSeconds,
        createdAt: new Date().toISOString(),
        mode: "voice-clone",
      };
      addToHistory(historyItem);
      onHistoryUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setIsLoading(false);
    }
  };

  const permissionIcon = () => {
    switch (recorder.permissionState) {
      case "granted":
        return <span className="text-emerald-600">Microphone ready</span>;
      case "denied":
        return <span className="text-rose-600">Microphone blocked</span>;
      case "prompt":
        return <span className="text-amber-600">Permission needed</span>;
      default:
        return <span className="text-zinc-500">Click to enable mic</span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Voice Cloning
        </CardTitle>
        <CardDescription>
          Record a voice sample and generate speech in that voice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recording Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Voice Prompt Recording</Label>
            <span className="text-xs text-zinc-500">{permissionIcon()}</span>
          </div>

          <div className="flex items-center gap-3">
            {!recorder.isRecording ? (
              <Button
                variant="secondary"
                onClick={recorder.startRecording}
                disabled={isLoading || recorder.permissionState === "denied"}
                className="gap-2"
              >
                <Mic className="h-4 w-4" />
                {recorder.audioBlob ? "Re-record" : "Start Recording"}
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={recorder.stopRecording}
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Stop Recording
              </Button>
            )}

            {recorder.isRecording && (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-3 h-3 rounded-full",
                    recorder.isPaused ? "bg-amber-500" : "bg-rose-500 animate-pulse"
                  )}
                />
                <span className="font-mono text-sm text-zinc-600">
                  {formatDuration(recorder.duration)}
                </span>
              </div>
            )}

            {recorder.audioBlob && !recorder.isRecording && (
              <Button
                variant="ghost"
                size="sm"
                onClick={recorder.clearRecording}
                className="text-zinc-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {recorder.error && (
            <p className="text-sm text-rose-600">{recorder.error}</p>
          )}

          {/* Recorded Audio Player */}
          {recorder.audioUrl && !recorder.isRecording && (
            <AudioPlayer
              src={recorder.audioUrl}
              showDownload={false}
              filename="prompt.webm"
            />
          )}
        </div>

        {/* Prompt Transcript */}
        <div className="space-y-2">
          <Label htmlFor="prompt-text">
            Prompt transcript{" "}
            <span className="text-rose-500 font-normal">(required)</span>
          </Label>
          <Input
            id="prompt-text"
            placeholder="Type exactly what you said in the recording..."
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-zinc-500">
            The model needs to know what words correspond to your voice sample
          </p>
        </div>

        {/* Target Text */}
        <div className="space-y-2">
          <Label htmlFor="target-text">Text to synthesize in cloned voice</Label>
          <Textarea
            id="target-text"
            placeholder="Enter the text you want spoken in the cloned voice..."
            value={targetText}
            onChange={(e) => setTargetText(e.target.value)}
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
          label="Normalize text"
        />

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isLoading || !targetText.trim() || !recorder.audioBlob || !promptText.trim()}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Cloned Speech"
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
              filename={`voice-clone-${result.timestamp}.wav`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
