# AGENTS.md — Permanent Developer & AI Agent Guidelines for JARVIS

This document defines the core architecture principles, engineering standards, security and privacy boundaries, memory rules, and workflow expectations for human developers and AI coding agents working on **JARVIS**.

All agents and developers **must read and adhere strictly** to the directives in this file before proposing or making changes to the repository.

---

## 1. Project Identity & Architecture Principles

**JARVIS** is a private, single-user, personal AI assistant. It is **not** a SaaS product, standard multi-tenant web application, or generic AI chatbot wrapper.

### Core Architectural Directives
1. **Private & Single-User**: Systems are engineered exclusively for one owner. Data isolation, key storage, and local access controls assume a single-tenant environment with maximum privacy.
2. **Modular & Replaceable Architecture**: Subsystems (AI providers, STT/TTS voice engines, vector memory backends, desktop shell, mobile client) must interact through clean, standard abstractions. No vendor or provider (e.g., OpenAI) may be hard-coded into core logic.
3. **Semantic Vector Memory First**: Primary long-term memory relies on vector embeddings, semantic retrieval, and multi-factor relevance scoring, not traditional relational SQL tables as the primary store.
4. **Deterministic Bypass & Intelligence Routing**: Trivial or deterministic tasks must bypass heavy LLMs. Tasks are routed based on **Difficulty** (determines model capability needed) and **Risk** (determines user approval requirements).
5. **Cinematic Minimal UI**: The visual identity must be dark-first, minimal, sophisticated, and technological — avoiding generic SaaS dashboard patterns, excessive cards, and rainbow gradients.

---

## 2. Memory System Directives

The memory architecture (detailed in `docs/MEMORY.md`) is a core product pillar.

### Key Memory Rules
* **5-Tier Hierarchy**: Ephemeral (session), Contextual (active conversation focus), Project (topic/codebase scoped), Preference (user habits & configurations), and Core (high-importance foundational facts).
* **Multi-Factor Retrieval Scoring**: Memories are retrieved by scoring:
  $$\text{Score} = f(\text{Similarity}, \text{Context Relevance}, \text{Recency}, \text{Importance}, \text{Confidence})$$
* **Strict Memory Surfacing Threshold**: **JARVIS must remember more than it exposes.** Memories must **never** be injected into prompt contexts or spoken aloud simply because they meet a semantic similarity threshold. Memories are surfaced **only** when they materially improve the accuracy or execution of the current user goal. Unrelated past conversations or projects must remain suppressed when out of context.

---

## 3. Intelligence, Model Routing & Risk System

### Matrix of Difficulty vs. Risk
* **Difficulty** (Low $\rightarrow$ High): Controls model selection (Deterministic / Fast low-cost LLM / Reasoning heavy LLM).
* **Risk** (Low $\rightarrow$ High): Controls execution permissions (Auto-execute / In-app notification confirmation / Biometric or explicit step-up authorization).

| Difficulty \ Risk | Low Risk | High Risk |
|---|---|---|
| **Low Difficulty** | Auto-execute via local script or cheap model (e.g. "Open Spotify") | Require explicit user confirmation before action (e.g. "Delete directory") |
| **High Difficulty** | Route to high-capability reasoning model automatically (e.g. "Debug rust compiler error") | Route to high-capability model, pause before execution for user review (e.g. "Deploy production infrastructure") |

### Tool Execution & Security Boundaries
* **Zero Secrets in Code**: No API keys, tokens, credentials, or private keys may ever be hard-coded or logged. Credentials must reside in OS Keychains or encrypted local environment vaults.
* **Sandbox Execution**: OS-level tool calls (terminal commands, file system writes) must run in isolated sandboxes with explicit file system scoping.
* **Audit Logging**: Every tool invocation and model decision must produce a structured, append-only local audit log.

---

## 4. Subsystem Independence

The following modules must be completely decoupled via interface abstraction layers:
* **`Voice Engine`**: Pipeline (`Mic Input` $\rightarrow$ `VAD` $\rightarrow$ `STT` $\rightarrow$ `JARVIS Core` $\rightarrow$ `TTS` $\rightarrow$ `Audio Output`) with hot-swappable STT/TTS providers.
* **`Calling Subsystem`**: Standalone WebRTC / LiveKit abstraction for real-time bidirectional audio calls (conceptually like a private VoIP call from JARVIS).
* **`Model Router`**: Abstract LLM driver interface (OpenAI, Anthropic, Ollama, vLLM, DeepSeek, Groq).
* **`Memory Store`**: Abstract Vector Database interface (LanceDB / Qdrant / Local storage).
* **`Clients`**: Mobile (React Native + Expo) and Desktop (Tauri) sharing common state & RPC client interfaces.

---

## 5. UI & UX Principles

* **Cinematic Dark Aesthetics**: Pure dark backgrounds (`#0A0A0C`, `#000000`), subtle glowing indicators, high contrast, clean typography.
* **Central Visual Core**: The primary interface is centered around the **JARVIS Core Visualizer**, displaying distinct animated states:
  * `Idle`
  * `Listening`
  * `Thinking`
  * `Speaking`
  * `Executing Tool`
  * `Awaiting Approval`
  * `Error`
  * `Offline`
* **Zero Dashboard Clutter**: Avoid widget grids, cards overload, SaaS sidebars, and generic template styling.

---

## 6. Coding Standards & Repository Guidelines

### Code Conventions
* **Language**: TypeScript (Node.js/Bun backend, React Native mobile, React/Tauri frontend) as primary runtime, with Rust/Python for specialized native modules if required.
* **Strict Typing**: Strict TypeScript mode enabled (`noImplicitAny: true`, `strictNullChecks: true`).
* **Clean Code**: Clear function boundaries, explicit error handling, typed return values, and zero unhandled promise rejections.

### Testing & Verification
* All core logic, memory retrieval algorithms, model routers, and permission checks must have comprehensive unit and integration tests.
* Markdown files must maintain valid internal relative links and consistent formatting.

### Rules for Repository Modifications
1. Always inspect existing code and architecture before editing.
2. Edit source code directly — never edit compiled build artifacts.
3. Test changes locally and run all available validation checks before submitting PRs.
4. Keep commit messages concise, clear, and scoped.

---

## 7. Definition of Done (DoD)

A task or PR is considered **Done** only when:
1. Code adheres strictly to TypeScript / project linting and formatting standards.
2. All unit and integration tests pass cleanly.
3. Architecture modifications are accurately reflected in `AGENTS.md`, `README.md`, and relevant `docs/*.md` files.
4. No credentials, tokens, or sensitive information are committed.
5. Verification checks confirm zero broken links or markdown defects.
