# TOOLS.md — Modular Tool Registry & Sandbox Execution

## 1. Overview & Tool Architecture

JARVIS interacts with the user's local operating system, web APIs, developer environment, and local applications via a **Modular Tool Framework**. Every capability exposed to JARVIS is encapsulated as a strongly-typed tool with explicit schemas, sandbox permissions, and risk scores.

---

## 2. Tool Interface & Definition

Tools are defined using TypeScript interfaces and standard JSON Schema parameter specifications:

```typescript
export type ToolCategory = 'system' | 'file' | 'media' | 'web' | 'developer' | 'productivity';

export interface ToolParameterSchema {
  type: string;
  properties: Record<string, {
    type: string;
    description: string;
    enum?: string[];
    default?: unknown;
  }>;
  required: string[];
}

export interface ToolExecutionContext {
  userId: string;
  activeProjectId?: string;
  sandboxPath: string;
  isInteractiveSession: boolean;
}

export interface ITool<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: ToolCategory;
  readonly defaultRiskLevel: number; // 1 to 5
  readonly parameters: ToolParameterSchema;

  validateInput(input: TInput): boolean;
  execute(input: TInput, context: ToolExecutionContext): Promise<TOutput>;
}
```

---

## 3. Standard Tool Inventory

```
┌─────────────────┬─────────────────────┬────────────┬──────────────────────────────────────┐
│ Tool ID         │ Category            │ Risk Level │ Functionality                        │
├─────────────────┼─────────────────────┼────────────┼──────────────────────────────────────┤
│ `sys.open_app`  │ system              │ 1          │ Launch local app (e.g. Spotify)      │
│ `sys.get_stats` │ system              │ 1          │ Inspect CPU/RAM/Battery metrics      │
│ `fs.read_file`  │ file                │ 1          │ Read file contents in workspace      │
│ `fs.write_file` │ file                │ 3          │ Write/Update file in workspace       │
│ `fs.delete_file`│ file                │ 5          │ Delete local file or directory       │
│ `dev.run_cmd`   │ developer           │ 4          │ Execute terminal bash/zsh command    │
│ `web.fetch_page`│ web                 │ 1          │ Fetch and clean web page text        │
│ `media.control` │ media               │ 1          │ Pause/Play/Skip system audio         │
└─────────────────┴─────────────────────┴────────────┴──────────────────────────────────────┘
```

---

## 4. Execution Sandbox & Security Enclosure

### 4.1 Path Isolation & Traversal Prevention
File system tools are strictly locked within designated workspace boundaries (e.g. `/Users/owner/projects`). Any attempt to access system files outside the sandbox returns an explicit security violation:

```typescript
export function validatePath(requestedPath: string, sandboxRoot: string): string {
  const resolvedPath = path.resolve(sandboxRoot, requestedPath);
  if (!resolvedPath.startsWith(sandboxRoot)) {
    throw new Error(`SECURITY VIOLATION: Access outside sandbox root (${sandboxRoot}) denied.`);
  }
  return resolvedPath;
}
```

### 4.2 Process Execution Boundaries
Terminal commands executed via `dev.run_cmd` are spawned in non-root child processes with strict timeout limits (e.g., maximum 30s) and controlled environment variables.

---

## 5. Tool Lifecycle & Registration Flow

1. **Discovery & Registration**: Subsystems register tools at startup into the `ToolRegistry`.
2. **Schema Export**: Tools export OpenAPI / JSON Schema parameter maps to model prompt contexts.
3. **Execution Interception**: When LLM yields a tool call, `ToolRegistry` verifies inputs and routes the request through `ApprovalEngine`.
4. **Result Format**: Outputs are formatted and appended to `EphemeralMemory`.
