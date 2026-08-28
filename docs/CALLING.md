# CALLING.md — In-App Real-Time VoIP Calling Architecture

## 1. Overview & Calling Vision

JARVIS includes a dedicated **Calling Subsystem** designed to provide an interactive, real-time bidirectional voice call experience.

Conceptually, this feels like receiving a private VoIP call (e.g., Discord or FaceTime Audio) from your personal assistant:
* Accessible from both Mobile (React Native) and Desktop (Tauri).
* Operates as an active bidirectional audio stream over WebRTC or LiveKit.
* Enables hands-free continuous conversations while driving, walking, or working away from a screen.

---

## 2. In-App Calling Architecture

The calling subsystem operates as an independent protocol layer over real-time WebRTC media channels:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          IN-APP VOIP CALL ENGINE                        │
│                                                                         │
│   Client Device (Mobile / Desktop)               JARVIS Core Service    │
│   ┌─────────────────────────────┐               ┌────────────────────┐  │
│   │ Native Call UI (Incoming/   │ ── Signaling ─►│ Session Orchestrator│ │
│   │ Active HUD Overlay)         │               └─────────┬──────────┘  │
│   └──────────────┬──────────────┘                         │             │
│                  │                                        ▼             │
│                  │     ┌────────────────────────────────────┐           │
│                  └────►│ Bidirectional WebRTC Audio Media   │◄──────────┘
│                        │ Stream (Opus Codec / Low Latency)  │
│                        └────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. WebRTC / LiveKit Abstraction Layer

The system decouples real-time audio transport behind an abstract connection manager:

```typescript
export interface CallSessionConfig {
  sessionId: string;
  userId: string;
  enableNoiseCancellation: boolean;
  preferredAudioCodec: 'opus' | 'pcm';
}

export type CallState =
  | 'IDLE'
  | 'INCOMING_RINGTONE'
  | 'CONNECTING'
  | 'ACTIVE_TALKING'
  | 'ACTIVE_LISTENING'
  | 'MUTED'
  | 'ENDED';

export interface ICallingEngine {
  readonly currentState: CallState;

  initiateCall(config: CallSessionConfig): Promise<void>;
  answerCall(sessionId: string): Promise<void>;
  rejectCall(sessionId: string, reason?: string): Promise<void>;
  endCall(sessionId: string): Promise<void>;

  onStateChange(listener: (state: CallState) => void): void;
  sendAudioFrame(frame: ArrayBuffer): void;
}
```

---

## 4. Operational Flows & Mobile Native CallKit Integration

### 4.1 Native Call UI Integration
* **iOS Integration**: Bridges to **iOS CallKit**, rendering JARVIS incoming calls on the native lock screen.
* **Android Integration**: Bridges to **ConnectionService / Telecom API**, displaying full-screen incoming call notifications.

### 4.2 WebRTC Audio Optimization
* **Audio Codec**: Opus @ 24kbps mono (optimized for high voice clarity and low bandwidth).
* **Target Latency**: $< 200\text{ms}$ total round-trip latency from user spoken audio to initial return TTS stream.
* **Full-Duplex Interruption**: Continuous local VAD monitoring allows immediate voice interruption without needing push-to-talk.
