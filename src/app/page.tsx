"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { TTSForm } from "@/components/TTSForm";
import { VoiceCloneForm } from "@/components/VoiceCloneForm";
import { HistoryList } from "@/components/HistoryList";
import { Disclaimer } from "@/components/Disclaimer";
import { Volume2, Users, Clock } from "lucide-react";

export default function Home() {
  const [historyKey, setHistoryKey] = useState(0);

  const refreshHistory = () => setHistoryKey((k) => k + 1);

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-zinc-900">VoxCPM Playground</h1>
          <p className="text-zinc-500">
            Text-to-speech and voice cloning powered by VoxCPM
          </p>
        </div>

        {/* Disclaimer */}
        <Disclaimer />

        {/* Main Tabs */}
        <Tabs defaultValue="tts">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="tts" className="gap-2">
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">TTS</span>
            </TabsTrigger>
            <TabsTrigger value="voice-clone" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Voice Clone</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tts">
            <TTSForm onHistoryUpdate={refreshHistory} />
          </TabsContent>

          <TabsContent value="voice-clone">
            <VoiceCloneForm onHistoryUpdate={refreshHistory} />
          </TabsContent>

          <TabsContent value="history">
            <HistoryList refreshKey={historyKey} />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="text-center text-sm text-zinc-400 pt-8">
          <p>
            Powered by{" "}
            <a
              href="https://github.com/OpenBMB/VoxCPM"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              VoxCPM
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
