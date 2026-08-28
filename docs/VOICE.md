# VOICE.md — Ambient Voice Subsystem & Pipeline Architecture

## 1. Modular Voice Subsystem

The Voice Subsystem is an independent, decoupled module responsible for ambient hands-free communication. It manages microphone capture, Voice Activity Detection (VAD), Speech-to-Text (STT), interaction with the JARVIS Core, and Text-to-Speech (TTS) audio synthesis.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             VOICE PIPELINE ENGINE                               │
│                                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────────┐  │
│  │ Microphone   │ ──► │ Local VAD    │ ──► │ STT Engine   │ ──► │ Text Stream│  │
│  │ Audio Stream │     │ (Silero/Web) │     │ (Whisper)    │     │ to Core    │  │
│  └──────────────┘     └──────────────┘     └──────────────┘     └─────┬──────┘  │
│                                                                       │         │
│                                                                       ▼         │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────────┐  │
│  │ Speaker     │ ◄── │ Audio Stream │ ◄── │ TTS Engine   │ ◄── │ Core Text  │  │
│  │ Output       │     │ Buffer       │     │ (ElevenLabs) │     │ Stream     │  │
│  └──────────────┘     └──────────────┘     └──────────────┘     └────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Replaceable Provider Interfaces

Both STT and TTS engines are decoupled behind explicit interfaces:

```typescript
export interface STTResult {
  text: string;
  isFinal: boolean;
  confidence: number;
}

export interface ISpeechToText {
  readonly providerId: string;
  startListening(onResult: (result: STTResult) => void): Promise<void>;
  stopListening(): Promise<void>;
  transcribeChunk(audioBuffer: ArrayBuffer): Promise<STTResult>;
}

export interface TTSOptions {
  voiceId?: string;
  speed?: number; // Default 1.0
  pitch?: number;
}

export interface ITextToSpeech {
  readonly providerId: string;
  synthesizeStream(
    textStream: AsyncIterable<string>,
    options?: TTSOptions
  ): Promise<ReadableStream<Uint8Array>>;
}
```

---

## 3. Evaluated Providers & Fallback Matrix

| Subsystem | Preferred Provider | Local / Privacy Fallback | Cloud Low-Latency Option |
|---|---|---|---|
| **Speech-to-Text (STT)** | **Whisper (Local / API)** | **Whisper.cpp (Local)** | **Deepgram Nova-2** |
| **Text-to-Speech (TTS)** | **ElevenLabs (Turbo v2.5)** | **Piper TTS (Local)** | **System Native TTS** (macOS/iOS) |
| **VAD Engine** | **Silero VAD (ONNX Local)** | WebAudio Energy VAD | Native OS VAD |

---

## 4. Latency & Streaming Directives

1. **Chunked Streaming Synthesis**: TTS streaming begins on the **first completed sentence boundary** from the LLM stream, long before the entire LLM response finishes generation.
2. **Local Silero VAD**: Voice activity detection runs locally with sub-30ms latency, preventing unnecessary STT network calls when the user is silent.
3. **Barge-In Interruption**: If the user speaks while JARVIS is playing TTS audio, local VAD instantly triggers an `AudioInterrupt` signal:
   * Immediate halting of TTS audio playback.
   * State transition of core visualizer back to `Listening`.
   * Truncation of previous assistant response in Ephemeral Memory.
