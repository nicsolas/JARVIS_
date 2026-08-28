# JARVIS — Private Personal AI Assistant

> **JARVIS** is an architectural framework and system design for a private, single-user personal AI assistant. Designed for high intelligence, context awareness, local-first privacy, fluid voice interactions, and cinematic user experience.

---

## Overview

JARVIS is built from the ground up to be a **true personal assistant**, not a generic multi-tenant AI chatbot or SaaS wrapper. It combines hierarchical semantic vector memory, dynamic model routing (evaluating task difficulty vs. risk), modular tool execution with explicit approval flows, replaceable AI/Voice providers, and a minimal cinematic dark user interface across desktop and mobile.

---

## Documentation Architecture

The complete system architecture, design specifications, and operational models are documented in detail below:

### 🏛 Architecture & Vision
* **[AGENTS.md](./AGENTS.md)** — Core developer principles, AI agent guidelines, coding standards, and Definition of Done.
* **[PRODUCT.md](./docs/PRODUCT.md)** — Product vision, single-user personal AI identity, core UX principles, and capability spectrum.
* **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — System architecture, subsystem boundaries, modular replaceability, and flow diagrams.
* **[DESIGN.md](./docs/DESIGN.md)** — Cinematic dark visual design system, Core visualizer states, typography, and UX patterns.

### 🧠 Memory & Intelligence
* **[MEMORY.md](./docs/MEMORY.md)** — Hierarchical vector memory system (ephemeral, contextual, project, preference, core), multi-factor retrieval scoring, and memory suppression rules ("remember more than exposed").
* **[AI.md](./docs/AI.md)** — Multi-provider LLM abstraction layer (cloud providers, local models via Ollama/vLLM, fallback strategies).
* **[MODEL_ROUTING.md](./docs/MODEL_ROUTING.md)** — Task Difficulty vs. Risk evaluation matrix, deterministic route bypasses, and dynamic model selection.
* **[APPROVALS.md](./docs/APPROVALS.md)** — Risk engine, multi-tier permission boundaries, biometric step-up, interactive confirmation flows, and audit logs.
* **[TOOLS.md](./docs/TOOLS.md)** — Tool registry, dynamic schema definition, secure sandboxed execution, and lifecycle management.

### 🎙 Clients, Voice & Infrastructure
* **[VOICE.md](./docs/VOICE.md)** — Modular voice pipeline (Mic $\rightarrow$ VAD $\rightarrow$ STT $\rightarrow$ Core $\rightarrow$ TTS), replaceable providers, and latency optimization.
* **[CALLING.md](./docs/CALLING.md)** — In-app VoIP/calling architecture (WebRTC / LiveKit abstraction) for private real-time audio calls.
* **[MOBILE.md](./docs/MOBILE.md)** — React Native + Expo iOS/Android mobile client design, background services, and native bridges.
* **[DESKTOP.md](./docs/DESKTOP.md)** — Tauri desktop application architecture, hotkeys, system tray, and OS-level integrations.
* **[SECURITY.md](./docs/SECURITY.md)** — Zero-secret policy, local credential keychains, sandbox boundaries, and threat model.
* **[PRIVACY.md](./docs/PRIVACY.md)** — Local-first principles, private single-user data isolation, telemetry policy, and cloud minimization.
* **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** — Project structure, tooling setup, markdown linting, and development workflow.
* **[ROADMAP.md](./docs/ROADMAP.md)** — Phased implementation roadmap from initial foundation to in-app voice calling and local AI deployment.

---

## Core System Highlights

```
                          ┌─────────────────────────┐
                          │   User Clients (UI)     │
                          │   Desktop (Tauri) /     │
                          │   Mobile (React Native) │
                          └────────────┬────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            JARVIS Orchestrator                              │
│                                                                             │
│  ┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐  │
│  │  Voice Subsystem│       │ Dynamic Router  │       │  Approval Engine │  │
│  │  (STT/TTS/Call) │       │ Difficulty/Risk │       │   (Risk & Auth)  │  │
│  └────────┬────────┘       └────────┬────────┘       └────────┬─────────┘  │
│           │                         │                         │            │
│           └─────────────────────────┼─────────────────────────┘            │
│                                     │                                      │
│                                     ▼                                      │
│                    ┌─────────────────────────────────┐                     │
│                    │   Hierarchical Memory Engine    │                     │
│                    │ (Vector Retrieval & Contextual) │                     │
│                    └────────────────┬────────────────┘                     │
└─────────────────────────────────────┼──────────────────────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
┌──────────────────────────┐                    ┌──────────────────────────┐
│  AI Provider Abstraction │                    │ Execution Sandboxes      │
│  (Cloud / Local Ollama)  │                    │ (Local Tools / System)   │
└──────────────────────────┘                    └──────────────────────────┘
```

---

## Key Principles

1. **Private Single-User**: Built exclusively for one user. No multi-tenant complexity or SaaS friction.
2. **Semantic Vector Memory**: Memory uses embeddings and semantic retrieval, with contextual activation and strict suppression thresholds so old or irrelevant facts are not improperly exposed.
3. **Difficulty vs. Risk Routing**: Simple tasks bypass LLMs or use cheap local models; risky tasks require explicit user authorization regardless of model size.
4. **Clean Replaceability**: All key dependencies (LLM, STT, TTS, Vector Store, Desktop Shell) are hidden behind abstract interfaces.

---

## License

Private / Confidential — Single-User Personal AI System Architecture.
