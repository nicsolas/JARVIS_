# DEVELOPMENT.md — Developer Setup, Tooling & Workflows

## 1. Repository Layout

```
.
├── AGENTS.md               # Permanent Developer & AI Agent Guidelines
├── README.md               # Project Overview & Documentation Index
└── docs/                   # Architectural & System Documentation Foundation
    ├── PRODUCT.md          # Vision, User Positioning & Capabilities
    ├── ARCHITECTURE.md     # System Architecture & Subsystem Boundaries
    ├── DESIGN.md           # Visual Design System & UI/UX Principles
    ├── MEMORY.md           # 5-Tier Semantic Vector Memory Engine
    ├── AI.md               # Multi-Provider AI Abstraction Layer
    ├── MODEL_ROUTING.md    # Task Difficulty vs. Risk Evaluation Matrix
    ├── APPROVALS.md        # Risk Engine & Authorization Flows
    ├── TOOLS.md            # Modular Tool Registry & Sandbox Architecture
    ├── VOICE.md            # Ambient Voice Pipeline (STT/TTS/VAD)
    ├── CALLING.md          # In-App Real-Time VoIP Calling Engine
    ├── MOBILE.md           # React Native + Expo Mobile Architecture
    ├── DESKTOP.md          # Tauri Desktop Application Shell
    ├── SECURITY.md         # Zero-Secret Policy & Threat Model
    ├── PRIVACY.md          # Local-First Principles & Privacy Controls
    ├── DEVELOPMENT.md      # Developer Workflows & Validation
    └── ROADMAP.md          # Phased Milestone Roadmap
```

---

## 2. Validation & Quality Assurance Checks

To maintain high documentation and code standards, run the following validation steps locally:

### 2.1 Markdown Link & Structure Checks
Ensure all relative markdown links across `README.md` and `docs/*.md` resolve correctly without broken pointers.

### 2.2 Pre-Commit Verification Workflow
Before committing changes to the repository:
1. Verify no secret keys or API tokens are present in added files.
2. Confirm documentation changes are mirrored in `AGENTS.md` and `README.md` index files.
3. Validate strict TypeScript types across code additions once implementation begins.
