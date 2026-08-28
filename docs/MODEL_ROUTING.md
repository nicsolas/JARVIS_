# MODEL_ROUTING.md — Task Difficulty vs. Risk Evaluation Matrix

## 1. Core Principle: Decoupling Difficulty & Risk

In conventional AI frameworks, model selection and safety checks are often conflated. JARVIS treats **Difficulty** and **Risk** as two orthogonal, independent dimensions:

* **Task Difficulty ($D \in [1, 5]$)**: Measures required reasoning capability, context window size, and problem complexity. **Difficulty determines which model tier executes the task.**
* **Task Risk ($R \in [1, 5]$)**: Measures potential impact, destructive capability, system mutation, or privacy sensitivity. **Risk determines whether explicit user approval is required before execution.**

---

## 2. Difficulty vs. Risk Classification Matrix

```
       HIGH RISK (R >= 4)
       ┌────────────────────────────────┬────────────────────────────────┐
       │ Quadrant 2: High Risk / Low D   │ Quadrant 4: High Risk / High D  │
       │ Example: "Delete this folder"  │ Example: "Deploy production DB"│
       │ Model: Fast Local / Script     │ Model: Deep Cloud Reasoning    │
       │ Approval: Mandatory User Auth  │ Approval: Mandatory User Auth  │
       ├────────────────────────────────┼────────────────────────────────┤
       │ Quadrant 1: Low Risk / Low D   │ Quadrant 3: Low Risk / High D  │
       │ Example: "Open Spotify"        │ Example: "Explain rust crash"  │
       │ Model: Deterministic / Local   │ Model: Deep Cloud Reasoning    │
       │ Approval: Zero (Auto-execute)  │ Approval: Zero (Auto-execute)  │
       └────────────────────────────────┴────────────────────────────────┘
       LOW RISK (R <= 3)
       LOW DIFFICULTY (D <= 2)           HIGH DIFFICULTY (D >= 4)
```

### Detailed Matrix Routing Rules

| Task | Difficulty ($D$) | Risk ($R$) | Selected Model Tier | Approval Flow |
|---|---|---|---|---|
| *"Open Spotify"* | 1 | 1 | **Deterministic Script** | Auto-execute immediately |
| *"Check system RAM usage"* | 1 | 1 | **Deterministic Script / Fast LLM** | Auto-execute |
| *"Explain why this Rust snippet panics"* | 4 | 1 | **Cloud Heavy Reasoning (Claude/GPT-4o)** | Auto-execute |
| *"Delete active repository folder"* | 1 | 5 | **Local Fast / Deterministic** | **Block & Request User Authorization** |
| *"Refactor database schema and drop table X"* | 5 | 5 | **Cloud Heavy Reasoning** | **Block & Request User Step-up Auth** |

---

## 3. Dynamic Router Mechanics

### 3.1 Deterministic Bypass Engine
Before invoking any LLM, the input passes through a pattern-matching **Deterministic Router**:
* Matching patterns (e.g., system commands, media playback, application launches, local timers) trigger native TypeScript OS APIs directly.
* **Latency**: $< 15\text{ms}$.
* **API Cost**: $\$0.00$.

### 3.2 Difficulty Estimator Algorithm
If no deterministic bypass matches, the **Difficulty Estimator** analyzes:
1. **Query Complexity**: Token length, nested clauses, technical terminology.
2. **Context Requirement**: Need for multi-document retrieval or long codebase inspection.
3. **Tool Dependency**: Multi-step tool chaining vs. single answer generation.

```typescript
export type ModelTier = 'DETERMINISTIC' | 'LOCAL_FAST' | 'CLOUD_FAST' | 'CLOUD_HEAVY';

export interface EvaluationResult {
  difficultyScore: number; // 1 to 5
  riskScore: number;       // 1 to 5
  recommendedTier: ModelTier;
  requiresApproval: boolean;
  reasoning: string;
}

export function evaluateTask(input: string, context: TaskContext): EvaluationResult {
  // 1. Check deterministic shortcut registry
  if (isDeterministicShortcut(input)) {
    return {
      difficultyScore: 1,
      riskScore: getShortcutRisk(input),
      recommendedTier: 'DETERMINISTIC',
      requiresApproval: getShortcutRisk(input) >= 4,
      reasoning: 'Matches local deterministic shortcut handler.'
    };
  }

  // 2. Compute Difficulty and Risk
  const difficulty = calculateDifficulty(input, context);
  const risk = calculateRisk(input, context);

  // 3. Select Tier based on Difficulty
  let tier: ModelTier = 'LOCAL_FAST';
  if (difficulty >= 4) {
    tier = 'CLOUD_HEAVY';
  } else if (difficulty === 3) {
    tier = 'CLOUD_FAST';
  } else if (context.isOffline) {
    tier = 'LOCAL_FAST';
  }

  return {
    difficultyScore: difficulty,
    riskScore: risk,
    recommendedTier: tier,
    requiresApproval: risk >= 4,
    reasoning: `Evaluated D:${difficulty}, R:${risk}. Tier selected: ${tier}`
  };
}
```

---

## 4. Latency & Cost Trade-Off Optimization

* **Deterministic**: $< 20\text{ms}$ response time.
* **Local Ollama (Llama-3 8B)**: $< 150\text{ms}$ TTFT, zero cost.
* **Cloud Fast (Groq / DeepSeek)**: $< 250\text{ms}$ TTFT, ultra-low cost.
* **Cloud Heavy (Claude 3.5 Sonnet / GPT-4o)**: $< 800\text{ms}$ TTFT, reserved for complex reasoning ($D \ge 4$).
