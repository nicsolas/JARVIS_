# DEVELOPMENT.md — Developer Setup, Tooling & Workflows

## 1. Repository Layout

```
.
├── AGENTS.md               # Permanent Developer & AI Agent Guidelines
├── README.md               # Project Overview & Documentation Index
├── package.json            # Node.js project configuration & scripts
├── tsconfig.json           # TypeScript configuration
├── .env.example            # Configuration & environment variables example
├── src/                    # JARVIS Core Runtime Source Code
│   ├── index.ts            # Core export entrypoint
│   ├── config/             # Environment configuration loader
│   ├── errors/             # Custom structured error definitions
│   ├── logging/            # Structured logger with secret sanitization
│   ├── core/               # Core Orchestrator, Task Models, Routing & Approvals
│   │   ├── agent/          # JarvisCore execution pipeline
│   │   ├── events/         # Typed EventDispatcher for kernel lifecycle signals
│   │   ├── state/          # Runtime StateEngine for visualizer/client state
│   │   ├── task/           # Task model, enums (TaskDifficulty, TaskRisk, TaskStatus)
│   │   ├── routing/        # Difficulty/Risk classifiers and ModelRouter
│   │   └── approvals/      # Risk policy & ApprovalEngine
│   ├── ai/                 # IAIProvider interface & MockAIProvider
│   ├── memory/             # IMemoryStore, VectorMemoryStore, scoring, embeddings
│   ├── tools/              # ToolRegistry, ITool interface & SafeMockTools
│   ├── voice/              # Voice pipeline interfaces
│   └── calling/            # In-app VoIP calling engine interfaces
├── tests/                  # Automated Test Suite (Vitest)
└── docs/                   # System & Architectural Documentation Specs
```

---

## 2. Running Local Development & Tests

### 2.1 Install Dependencies
```bash
npm install
```

### 2.2 Typecheck & Build
```bash
npm run typecheck
npm run build
```

### 2.3 Run Automated Tests
No paid API keys are required to execute the test suite. All tests run locally using mock providers:
```bash
npm test
```

### 2.4 Run the Local CLI Harness
```bash
npm run build
npm run cli -- "Open Spotify"
```

The CLI uses mock providers and the local vector memory store, so it is safe for merge verification without API keys.
