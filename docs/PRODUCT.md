# PRODUCT.md — Product Requirements & Vision for JARVIS

## 1. Vision & Purpose

**JARVIS** is an ambient, highly intelligent, private personal AI assistant. It is designed to serve as an extended cognitive partner for a single user, assisting with software engineering, knowledge management, daily workflows, automation, and real-time decision support.

Unlike commercial AI web platforms or multi-tenant enterprise tools, JARVIS is built on three core pillars:
1. **Absolute Privacy & Single-User Focus**: Zero data collection for model training, zero multi-tenant leaks, completely private key management and single-tenant memory.
2. **Context-Aware Intelligence & Restrained Memory**: An assistant that understands context deeply, remembers user state across sessions, but strictly refrains from cluttering interactions with irrelevant past memories.
3. **Cinematic, Unobtrusive UX**: An aesthetic inspired by high-end technological HUDs — dark, elegant, minimal, and highly functional.

---

## 2. Product Positioning

| Dimension | Standard SaaS AI Chatbot | JARVIS Personal Assistant |
|---|---|---|
| **Target Audience** | Anonymous mass users / Multi-tenant teams | Single individual owner |
| **Data Storage** | Vendor-owned cloud DBs | Local-first, user-controlled vector store |
| **Memory Behavior** | Session-only or naive text search | 5-tier hierarchical semantic memory with suppression thresholds |
| **Tool Execution** | Fixed, restricted cloud tools | Sandboxed local/OS tools with risk-aware approval flows |
| **UI Aesthetics** | Card-heavy SaaS web dashboards | Cinematic dark, HUD-inspired visualizer with minimal interface chrome |
| **Model Routing** | Locked to a single LLM vendor | Multi-provider router evaluating difficulty & risk |

---

## 3. Core Capabilities

### 3.1 Personal Knowledge & Long-Term Memory
* **Hierarchical Organization**: Seamlessly categorizes information across Ephemeral, Contextual, Project, Preference, and Core memory tiers.
* **Contextual Recall**: Surfacing information when it directly aids the active task while suppressing unrelated project memories.
* **Continuous Synthesis**: Automatically extracts key preferences and facts from daily interactions without requiring explicit user tagging.

### 3.2 Intelligent Task Execution & Automation
* **Local OS & Development Integration**: Inspecting files, running builds, debugging code, managing local tasks, and controlling system applications.
* **Risk-Aware Execution**: Safe handling of system actions — auto-executing safe operations while requiring explicit confirmation for destructive or high-risk tasks.
* **Deterministic Shortcut Bypasses**: Executing simple system commands (e.g. media playback, window management) directly without invoking external LLMs.

### 3.3 Seamless Multimodal & Voice Interaction
* **Fluid Ambient Voice**: Natural hands-free communication via local VAD, streaming STT, and fast TTS output.
* **In-App Private VoIP Calling**: Initiating or receiving bidirectional voice calls with JARVIS from mobile or desktop devices.
* **Visual States & Telemetry**: Clear visual feedback indicating whether JARVIS is listening, processing, speaking, or waiting for user confirmation.

---

## 4. User Experience Principles

1. **Be Quiet Until Needed**: JARVIS does not offer unsolicited commentary or speak unless activated or delivering a high-priority system alert.
2. **Remember Everything, Surface Sparingly**: High recall with low noise. Surfacing a past memory requires high context relevance.
3. **Transparent Execution**: Every action taken on behalf of the user produces clear telemetry and auditability.
4. **Instant Response**: Sub-second feedback for ambient queries via fast model routing and streaming audio pipelines.
