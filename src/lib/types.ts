export interface TTSRequest {
  text: string;
  promptAudioBase64?: string;
  promptText?: string;
  cfgValue?: number;
  inferenceTimesteps?: number;
  normalize?: boolean;
}

export interface TTSResponse {
  audioBase64: string;
  sampleRate: number;
  durationSeconds: number;
}

export interface TTSError {
  error: string;
  details?: string;
}

export interface HistoryItem {
  id: string;
  text: string;
  promptText?: string;
  hasPromptAudio: boolean;
  cfgValue: number;
  inferenceTimesteps: number;
  normalize: boolean;
  audioBase64: string;
  sampleRate: number;
  durationSeconds: number;
  createdAt: string;
  mode: "tts" | "voice-clone";
}

export interface TTSSettings {
  cfgValue: number;
  inferenceTimesteps: number;
  normalize: boolean;
}

export const DEFAULT_SETTINGS: TTSSettings = {
  cfgValue: 2.0,
  inferenceTimesteps: 10,
  normalize: false, // Note: normalize disabled due to wetext library compatibility
};
