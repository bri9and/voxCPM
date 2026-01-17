"use client";

import { useState, useMemo, useCallback } from "react";
import { Clock, Download, Trash2, Volume2, Users } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
} from "@/components/ui";
import { AudioPlayer } from "./AudioPlayer";
import { HistoryItem } from "@/lib/types";
import { getHistory, removeFromHistory, clearHistory } from "@/lib/storage";
import { formatTimestamp, base64ToBlob, downloadBlob } from "@/lib/utils";

interface HistoryListProps {
  refreshKey: number;
}

export function HistoryList({ refreshKey }: HistoryListProps) {
  const [localRefresh, setLocalRefresh] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Combine external and local refresh keys to trigger re-computation
  const history = useMemo(() => {
    // Using both keys ensures we refresh when either changes
    void refreshKey;
    void localRefresh;
    return getHistory();
  }, [refreshKey, localRefresh]);

  const handleDelete = useCallback((id: string) => {
    removeFromHistory(id);
    setLocalRefresh((r) => r + 1);
    setExpandedId((current) => (current === id ? null : current));
  }, []);

  const handleClearAll = useCallback(() => {
    if (confirm("Are you sure you want to clear all history?")) {
      clearHistory();
      setLocalRefresh((r) => r + 1);
      setExpandedId(null);
    }
  }, []);

  const handleDownload = useCallback((item: HistoryItem) => {
    const blob = base64ToBlob(item.audioBase64, "audio/wav");
    const filename = `${item.mode}-${new Date(item.createdAt).getTime()}.wav`;
    downloadBlob(blob, filename);
  }, []);

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            History
          </CardTitle>
          <CardDescription>Your past generations will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-zinc-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
            <p>No generations yet</p>
            <p className="text-sm">Try the TTS or Voice Clone tabs to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              History
            </CardTitle>
            <CardDescription>
              {history.length} generation{history.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClearAll}>
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="border border-zinc-200 rounded-lg overflow-hidden"
          >
            {/* Header Row */}
            <div
              className="flex items-center gap-3 p-3 bg-zinc-50 cursor-pointer hover:bg-zinc-100 transition-colors"
              onClick={() =>
                setExpandedId(expandedId === item.id ? null : item.id)
              }
            >
              {/* Mode Icon */}
              <div className="shrink-0">
                {item.mode === "voice-clone" ? (
                  <Users className="h-4 w-4 text-violet-600" />
                ) : (
                  <Volume2 className="h-4 w-4 text-emerald-600" />
                )}
              </div>

              {/* Text Preview */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {item.text}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatTimestamp(new Date(item.createdAt))} &middot;{" "}
                  {item.durationSeconds.toFixed(1)}s
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(item);
                  }}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  title="Delete"
                  className="text-zinc-400 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedId === item.id && (
              <div className="p-3 border-t border-zinc-200 space-y-3">
                {/* Audio Player */}
                <AudioPlayer
                  base64={item.audioBase64}
                  sampleRate={item.sampleRate}
                  filename={`${item.mode}-${item.id}.wav`}
                  showDownload={false}
                />

                {/* Settings */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-zinc-100 rounded text-zinc-600">
                    CFG: {item.cfgValue}
                  </span>
                  <span className="px-2 py-1 bg-zinc-100 rounded text-zinc-600">
                    Steps: {item.inferenceTimesteps}
                  </span>
                  <span className="px-2 py-1 bg-zinc-100 rounded text-zinc-600">
                    {item.normalize ? "Normalized" : "Raw"}
                  </span>
                  {item.hasPromptAudio && (
                    <span className="px-2 py-1 bg-violet-100 rounded text-violet-600">
                      Voice Cloned
                    </span>
                  )}
                </div>

                {/* Full Text */}
                <div className="text-sm text-zinc-700 bg-zinc-50 p-3 rounded">
                  {item.text}
                </div>

                {item.promptText && (
                  <div className="text-sm">
                    <span className="text-zinc-500">Prompt transcript: </span>
                    <span className="text-zinc-700">{item.promptText}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
