# ROADMAP.md — JARVIS Milestone Roadmap

## Overview

JARVIS is organized as a 20-milestone implementation plan. The roadmap builds from the private single-user core runtime into memory, provider abstraction, routing, multi-agent orchestration, controlled tools, multi-device clients, voice/calling, distributed workers, security hardening, and finally autonomous mode.

Each milestone must remain independently testable and must preserve the project directives in `AGENTS.md`: modular interfaces, semantic vector memory first, deterministic bypass where appropriate, explicit approval for risk, and cinematic minimal UI.

## Milestone Dependency Graph

```text
M1 Core
 │
 ├──→ M2 Memory
 │
 ├──→ M3 AI Providers
 │        │
 │        └──→ M4 Model Router
 │                    │
 │                    └──→ M5 Multi-Agent
 │                              │
 │                         ┌────┴────┐
 │                         ↓         ↓
 │                       M6        M7
 │                    Budget     Switcher
 │                         └────┬────┘
 │                              ↓
 │                             M8
 │                         Parallelism
 │
 ├──→ M9 Tools
 │
 └──────────────────────────────┐
                                ↓
                         M10 Desktop
                         M11 Mobile
                         M12 Voice
                         M13 Calling
                         M14 UI

M2 + M4 ───────────────→ M15 Long-Term Personal Intelligence
M5 + M8 + M15 ─────────→ M16 Autonomous Agent Workspace
M5 + M16 ──────────────→ M17 Jules/External Agent Integration
M8 + M17 ──────────────→ M18 Distributed Agent Pool
M9 + M13 + M18 ────────→ M19 Security Hardening
M16 + M18 + M19 ───────→ M20 JARVIS Autonomous Mode
```

## Milestone Plan

| Milestone | Objective | Depends On | Exit Criteria |
| --- | --- | --- | --- |
| **M1** | 🧠 **Core Runtime** — task lifecycle, difficulty/risk classification, routing, approval, tools, and provider abstraction. | — | `JarvisCore` processes deterministic and AI paths; approvals block high-risk actions; tests cover routing, tools, memory interface, and provider abstraction. |
| **M2** | 🧠 **Vector Memory Engine** — 5-tier vector memory, retrieval, scoring, activation/suppression, and reasoning/surfacing distinction. | M1 | Vector store adapter, scoring formula, consolidation hooks, and tests for suppressed vs surfaced memory. |
| **M3** | 🤖 **AI Provider System** — multiple providers, fallback, streaming, cost/latency tracking, and quota handling. | M1 | Provider registry, typed streaming API, health/circuit state, usage metrics, and mock/local/cloud adapters. |
| **M4** | 🎯 **Intelligent Model Router** — choose model/provider by difficulty, risk, cost, latency, and availability. | M3 | Router uses provider capabilities and live health/usage data, with deterministic bypass preserved. |
| **M5** | 👥 **Multi-Agent Orchestrator** — create and coordinate Architect, Backend, Frontend, Designer, Tester, Security, and Reviewer agents. | M4 | Agent contracts, coordinator loop, role prompts, task assignment, result aggregation, and audit trail. |
| **M6** | 💰 **Token & Budget Regulator** — budgets per task/agent, quota tracking, rate limits, context limits, and consumption controls. | M5 | Budget ledger, per-agent limits, hard stops, soft warnings, and deterministic cost simulation tests. |
| **M7** | 🔄 **Agent Switcher & Recovery** — fallback when a model hits quota, fails, times out, or returns invalid output. | M5 | Retry policy, fallback graph, timeout handling, output validation, and resumable agent state. |
| **M8** | ⚡ **Parallel Task Engine** — dependency graph and parallel agent execution for independent tasks. | M6, M7 | DAG scheduler, dependency validation, concurrency limits, cancellation, and merged execution reports. |
| **M9** | 🛠️ **Advanced Tool System** — real tools, sandboxing, permission boundaries, controlled filesystem access, OS integration, and tool discovery. | M1 | Tool manifests, sandbox policy, permission scopes, structured audit logs, and safe local integrations. |
| **M10** | 🖥️ **Desktop Client** — Tauri app, tray, global hotkey, notifications, background service, and OS integration. | M1, M9 | Desktop shell connects to core, displays approvals, supports hotkey/tray, and runs in background. |
| **M11** | 📱 **Mobile Client** — React Native/Expo app, push notifications, background capabilities, and native bridge. | M1, M9 | Mobile client connects to core, handles approvals, supports push, and exposes secure native capabilities. |
| **M12** | 🎙️ **Voice Pipeline** — VAD → STT → JARVIS → tools/AI → TTS with streaming and wake word. | M1, M9 | Replaceable VAD/STT/TTS providers, streaming turn loop, interruption support, and latency metrics. |
| **M13** | 📞 **Calling Engine** — in-app VoIP, WebRTC/LiveKit, incoming/outgoing calls, and approval by call. | M1, M9, M12 | Calling abstraction, call lifecycle, audio bridge to voice pipeline, and approval challenge support. |
| **M14** | 🎨 **JARVIS Interface** — cinematic UI, visual core, and listening/thinking/executing/speaking/error states. | M1, M10, M11 | Shared state model, dark visual system, core visualizer, approval/error states, and no dashboard clutter. |
| **M15** | 🧠 **Long-Term Personal Intelligence** — project awareness, preference learning, memory consolidation, and personal context. | M2, M4 | Memory consolidation jobs, project scopes, preference learner, confidence scoring, and surfacing safeguards. |
| **M16** | 🏢 **Autonomous Agent Workspace** — manage complex projects end-to-end, assign tasks, monitor agents, and collect results. | M5, M8, M15 | Workspace model, project plans, progress monitoring, artifacts, verification gates, and handoff reports. |
| **M17** | 🔀 **Jules/External Agent Integration** — connect Jules and other coding agents as external workers. | M5, M16 | External worker adapter, capability discovery, job dispatch, result validation, and secure boundaries. |
| **M18** | 🌐 **Distributed Agent Pool** — multiple agents/models/machines available concurrently with dynamic scheduling/routing. | M8, M17 | Scheduler spans worker pool, tracks availability, routes by capability, and handles distributed recovery. |
| **M19** | 🔒 **Security Hardening** — threat model, credential vault, advanced sandboxing, audit, and biometric/step-up approval. | M9, M13, M18 | Threat model, vault integration, hardened sandbox, append-only audit verification, and step-up approval. |
| **M20** | 🚀 **JARVIS Autonomous Mode** — plan → delegate → parallelize → verify → correct → deliver, asking only necessary decisions. | M16, M18, M19 | Autonomous workflow gate, risk-aware pauses, verification/correction loop, and final delivery protocol. |

## Milestone-by-Milestone Build Execution

The roadmap is also represented in source code through `src/roadmap/milestones.ts`. That module exposes a typed build plan so the runtime and future autonomous workspace can answer:

* which milestones are already completed;
* which milestones are immediately buildable because dependencies are satisfied;
* which milestones remain blocked and by which prerequisites;
* which downstream milestones become available after a milestone is completed.

The current build frontier is:

1. **M2 Vector Memory Engine** — continue the active memory implementation layer.
2. **M3 AI Provider System** — build provider health, fallback, streaming, and usage tracking.
3. **M9 Advanced Tool System** — harden real tool execution in parallel with intelligence work, while keeping sandbox and approval boundaries intact.

## Current Implementation Alignment

* **M1 is the completed foundation layer.** The repository already contains `JarvisCore`, task lifecycle types, difficulty/risk classifiers, routing, approvals, mock AI provider, mock memory store, safe mock tools, and tests.
* **M2 is the active build layer; M3 and M9 are immediately buildable in parallel. M4 follows after M3.** They should be implemented before multi-agent orchestration so that agents inherit stable memory, provider, and routing primitives.
* **M9 should advance alongside M2–M4.** Real tools must keep sandbox, permission, and audit boundaries from the beginning instead of being added after the fact.
* **M10–M14 are client and interaction layers.** They must depend on stable core/tool/voice interfaces rather than duplicating business logic inside UI clients.
* **M15–M20 are autonomy layers.** They should not be implemented until the memory, routing, agent, budget, recovery, parallelism, tool, calling, and security foundations are in place.
