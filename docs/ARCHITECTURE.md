# ARCHITECTURE.md — System Architecture & Subsystem Boundaries

## 1. High-Level Architecture

JARVIS is engineered as a modular, event-driven system built on micro-kernel principles. The core orchestrator (`JarvisCore`) manages state transitions, routes events between specialized subsystems, and enforces memory, routing, and security policies.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER                                  │
│       ┌──────────────────────────────┐       ┌──────────────────────────────┐   │
│       │    Desktop App (Tauri)       │       │  Mobile App (React Native)   │   │
│       └──────────────┬───────────────┘       └──────────────┬───────────────┘   │
└──────────────────────┼──────────────────────────────────────┼───────────────────┘
                       │ RPC / WebSocket / IPC Protocol       │
                       ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 JARVIS CORE                                     │
│                                                                                 │
│   ┌──────────────────────────┐   ┌──────────────────────────┐                   │
│   │   Task Lifecycle Engine  │   │  Core Orchestration      │                   │
│   │   (Received -> Complete) │   │  (JarvisCore Pipeline)   │                   │
│   └────────────┬─────────────┘   └────────────┬─────────────┘                   │
│                │                              │                                 │
│                ▼                              ▼                                 │
│   ┌─────────────────────────────────────────────────────────┐                   │
│   │                   Intelligence Pipeline                 │                   │
│   │  ┌────────────────────┐       ┌──────────────────────┐  │                   │
│   │  │ Model Router       │       │ Risk & Approval      │  │                   │
│   │  │ (Difficulty Engine)│       │ Engine               │  │                   │
│   │  └─────────┬──────────┘       └──────────┬───────────┘  │                   │
│   │            │                             │              │                   │
│   │            ▼                             ▼              │                   │
│   │  ┌───────────────────────────────────────────────────┐  │                   │
│   │  │ Memory Interface (IMemoryStore)                   │  │                   │
│   │  └───────────────────────────────────────────────────┘  │                   │
│   └────────────────────────────┬────────────────────────────┘                   │
└────────────────────────────────┼────────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Voice & Calling │   │  AI Providers    │   │ Sandboxed Tool   │
│  Interfaces      │   │  (IAIProvider)   │   │ Registry         │
└──────────────────┘   └──────────────────┘   └──────────────────┘
```

---

## 2. Component Breakdown (Milestone 1 Implementation Status)

### 2.1 Core Orchestrator (`src/core/agent/JarvisCore.ts`)
* Implements the primary `processRequest` pipeline.
* Normalizes inputs, orchestrates routing, enforces approval checks, executes deterministic or AI paths, and handles structured errors.

### 2.2 Intelligence & Model Router (`src/core/routing/`)
* Uses independent `DifficultyClassifier` and `RiskClassifier`.
* Evaluates task difficulty (TRIVIAL to COMPLEX) to choose model tier, and task risk (LOW to CRITICAL) to enforce approval requirements.
* Features a deterministic shortcut bypass that executes registered system tools without calling LLMs.

### 2.3 Memory Interface (`src/memory/interfaces/`)
* Defines `IMemoryStore` with configurable `activationThreshold` and `suppressionThreshold`.
* Supports `purpose: 'reasoning'` (internal memory use) vs `purpose: 'user_surface'` (explicitly mentioned memory) to preserve UX clarity.

### 2.4 Risk & Approval Subsystem (`src/core/approvals/ApprovalEngine.ts`)
* Evaluates policy based on task risk severity.
* Categorizes approval levels (`AUTO_EXECUTE`, `CONFIRMATION_REQUIRED`, `STEP_UP_APPROVAL`).
* Blocks high-risk execution if user approval is denied.

### 2.5 Tool Execution Registry (`src/tools/`)
* Manages strongly-typed tools with input validation.
* Includes safe mock tools (`sys.open_app`, `media.control`, `sys.get_stats`, `fs.mock_delete`).

---

## 3. Replaceability & Decoupling Matrix

| Interface Boundary | Current Implementation / Mock | Production Target | Strategy |
|---|---|---|---|
| **Vector Memory** | `MockMemoryStore` | **LanceDB** / **Qdrant** | Abstract `IMemoryStore` interface |
| **AI Providers** | `MockAIProvider` | **Anthropic** / **OpenAI** / **Ollama** | Abstract `IAIProvider` interface |
| **STT/TTS Engine** | Interface spec (`IVoicePipeline`) | **Whisper** / **ElevenLabs** | Abstract `ISpeechToText` / `ITextToSpeech` |
| **VoIP Calling** | Interface spec (`ICallingEngine`) | **WebRTC** / **LiveKit** | Abstract `ICallingEngine` interface |
| **User Approvals** | `MockApprovalProvider` | **Desktop HUD / Mobile Biometrics** | Abstract `IApprovalProvider` interface |
