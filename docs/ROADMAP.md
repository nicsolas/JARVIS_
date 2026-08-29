# ROADMAP.md — Phased Implementation Roadmap

## Overview

The development of JARVIS follows a structured, multi-phase roadmap. Each phase delivers a complete, testable layer of functionality — building from core documentation and architecture up to ambient voice calling and multi-device clients.

---

## Phase 1: Foundation & Architecture Specification ✅ (COMPLETE)
* [x] Initialize repository architecture foundation & `AGENTS.md`.
* [x] Draft root `README.md` and complete technical specifications across `docs/*.md`.
* [x] Define multi-provider AI abstractions, difficulty vs. risk matrix, and 5-tier memory scoring model.
* [x] Establish dark-first cinematic HUD design system and visualizer states.

---

## Phase 2: Core Kernel & Memory Engine 🟢 (CURRENT / READY FOR MERGE)
* [x] Implement core Event Dispatcher and State Engine in TypeScript.
* [x] Integrate an embedded provider-backed vector memory store for 5-tier hierarchical memory storage.
  * Note: the production LanceDB adapter remains replaceable behind `IMemoryStore`; the merge-ready milestone uses the local deterministic vector store so tests run without network, credentials, or native database services.
* [x] Build multi-factor retrieval scoring algorithm with activation and suppression thresholds.
* [x] Construct abstract AI Provider router with provider/model capability boundaries and mock cloud/local routing seams.
* [x] Implement Task Difficulty vs. Risk evaluator and local CLI testing environment.

---

## Phase 3: Desktop Shell & Risk Approval Engine 🟣
* [ ] Scaffold **Tauri** desktop application shell with Rust backend integrations.
* [ ] Build interactive React HUD interface featuring the animated central JARVIS Core Visualizer.
* [ ] Implement global hotkey trigger (`Cmd+Shift+Space`) and system tray integration.
* [ ] Build Risk Approval Engine with interactive confirmation overlays and local append-only security logs.
* [ ] Register initial tool suite (file read/write, terminal bash runner, system metrics).

---

## Phase 4: Ambient Voice & Mobile Client 🟠
* [ ] Build ambient voice pipeline (Local Silero VAD + Whisper STT + ElevenLabs / Local TTS).
* [ ] Implement full-duplex barge-in voice interruption handling.
* [ ] Scaffold **React Native + Expo** mobile application client for iOS & Android.
* [ ] Implement push notifications and mobile biometric approval challenges (Face ID / Touch ID).

---

## Phase 5: In-App Real-Time VoIP Calling & Advanced Local AI 🔴
* [ ] Implement WebRTC / LiveKit abstraction for real-time bidirectional audio calls.
* [ ] Integrate iOS CallKit / Android Telecom native incoming call UI bridges.
* [ ] Deploy local offline AI inference models (Ollama / vLLM / Whisper.cpp) for full air-gapped fallback capability.
* [ ] Perform comprehensive end-to-end security audit and latency optimization.
