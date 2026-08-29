# MEMORY.md — Hierarchical Vector Memory Architecture

## 1. Overview & Primary Storage Philosophy

JARVIS uses a **semantic vector/embedding memory engine** as its primary long-term memory system. It explicitly **does not rely on a conventional relational SQL database** for primary memory storage.

The memory system is designed around a fundamental core principle:
> **JARVIS must remember much more than it explicitly exposes.**

Memories must **never** be injected into prompt contexts or spoken aloud simply because they match a basic cosine similarity query. JARVIS surfaces past memories **only when they materially improve the accuracy, context, or execution** of the user's immediate goal.

---

## 2. The 5-Tier Memory Hierarchy

Memory in JARVIS is categorized into five logical tiers based on lifespan, scope, stability, and importance:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        5-TIER MEMORY HIERARCHY                         │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 5: Core Memory      │ Permanent facts, owner identity, system rules│
├──────────────────────────┼─────────────────────────────────────────────┤
│ Tier 4: Personal Memory  │ Long-term habits, explicit user preferences │
├──────────────────────────┼─────────────────────────────────────────────┤
│ Tier 3: Semantic Memory  │ Persistent facts, concepts, project knowledge│
├──────────────────────────┼─────────────────────────────────────────────┤
│ Tier 2: Episodic Memory  │ Timestamped events, experiences, task history│
├──────────────────────────┼─────────────────────────────────────────────┤
│ Tier 1: Working Memory   │ Ephemeral context, active scratchpad, turns │
└────────────────────────────────────────────────────────────────────────┘
```

### Tier Descriptions & Characteristics

1. **Tier 1 — Working Memory (and Ephemeral)**
   * **Scope**: Active interaction buffer, transient scratchpad, current turn state.
   * **Characteristics**: Short retention, highest recency dependence, strongly context-dependent.
   * **Tier Weight**: $0.60$

2. **Tier 2 — Episodic Memory (and Contextual)**
   * **Scope**: Timestamped events, completed tasks, previous interactions, decisions, outcomes.
   * **Characteristics**: Timestamped, contextual, decays over time, can consolidate into semantic memory.
   * **Tier Weight**: $0.70$

3. **Tier 3 — Semantic Memory (and Project)**
   * **Scope**: Stable knowledge extracted from experiences, codebase documentation, facts, concepts.
   * **Characteristics**: Less dependent on recency, high semantic persistence.
   * **Tier Weight**: $0.80$

4. **Tier 4 — Personal Memory (and Preference)**
   * **Scope**: User choices, coding styles, tools used, habits, explicit personal preferences.
   * **Characteristics**: High persistence, high importance when relevant, must not be surfaced unnecessarily.
   * **Tier Weight**: $0.90$

5. **Tier 5 — Core / Identity Memory**
   * **Scope**: Essential owner identity, fundamental preferences, permanent system configuration, core identity.
   * **Characteristics**: Extremely persistent, highest importance, very high confidence required; cannot be accidentally overwritten by lower tiers.
   * **Tier Weight**: $1.00$

---

## 3. Strongly Typed Memory Model

Every memory in JARVIS is represented by the `MemoryRecord` model (`src/memory/interfaces/index.ts`):

```typescript
export interface MemoryRecord {
  id: string;
  content: string;
  tier: MemoryTier;
  embedding?: number[];
  createdAt: number;
  updatedAt: number;
  lastAccessedAt: number;
  importance: number;   // 0.0 to 1.0
  confidence: number;   // 0.0 to 1.0
  relevance: number;    // 0.0 to 1.0
  accessCount: number;
  source?: string;
  projectId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  supersededBy?: string;
  isSuperseded?: boolean;
  reasoningEligible?: boolean;
  surfacingEligible?: boolean;
  suppressed?: boolean;
}
```

---

## 4. Embedding Abstraction Layer

Embedding generation is abstracted behind the provider-independent interface:

```typescript
export interface IEmbeddingProvider {
  readonly dimension: number;
  embed(text: string): Promise<number[]>;
}
```

* **Production Strategy**: Pluggable support for local embedders (e.g. Ollama `nomic-embed-text`, ONNX/Transformers.js) or cloud embedding models.
* **Local Test Backend (`MockEmbeddingProvider`)**: Deterministic local embedder using token hash projection with zero network calls and zero paid API keys required.

---

## 5. Vector Similarity

Vector similarity between query embeddings and memory embeddings uses **Cosine Similarity**:

$$\text{CosineSimilarity}(\vec{A}, \vec{B}) = \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|}$$

* **Edge Cases**: Zero vectors safely yield `0.0` without `NaN` or `Infinity` leakage.
* **Dimension Guard**: Mismatched dimensions throw an explicit error.

---

## 6. Multi-Factor Memory Scoring Model

JARVIS calculates a composite, deterministic **Retrieval Score** ($S_{\text{retrieval}} \in [0, 1]$) combining 7 weighted signals:

$$S_{\text{retrieval}} = w_1 \cdot \text{Similarity} + w_2 \cdot \text{Relevance} + w_3 \cdot \text{Importance} + w_4 \cdot \text{Confidence} + w_5 \cdot \text{Recency} + w_6 \cdot \text{AccessCount} + w_7 \cdot \text{TierWeight}$$

### Default Weights ($w_1 \dots w_7$)

| Factor | Weight ($w_i$) | Description |
| :--- | :--- | :--- |
| **Similarity** | $0.40$ | Cosine similarity between query and memory embedding |
| **Relevance** | $0.15$ | Match score between query scope/tags and memory scope |
| **Importance** | $0.15$ | Subjective significance of memory ($0.0 - 1.0$) |
| **Confidence** | $0.10$ | System confidence in accuracy ($0.0 - 1.0$) |
| **Recency** | $0.10$ | Exponential decay over time ($e^{-\lambda \cdot t}$) |
| **Access Count** | $0.05$ | Logarithmic access frequency factor ($\frac{\log_2(N+1)}{\log_2(100)}$) |
| **Tier Weight** | $0.05$ | Tier importance weight ($0.60 - 1.00$) |

### Exponential Recency Decay Formula

$$\text{Recency}(t) = e^{-\lambda \cdot t} \quad \text{where} \quad \lambda = \frac{\ln 2}{\text{HalfLifeMs}}$$

The default half-life is 72 hours. All other factors equal, newer memories score higher than older memories.

---

## 7. Activation & Suppression Thresholds

Candidates evaluate against configurable activation and suppression thresholds before prompt injection:

* **Activation Threshold ($T_{\text{activation}} = 0.72$)**: Memory score must meet or exceed $T_{\text{activation}}$ to become an active retrieval result.
* **Suppression Threshold ($T_{\text{suppression}} = 0.50$)**: Memories scoring below $T_{\text{suppression}}$, having low confidence ($< 0.30$), or marked as superseded are **suppressed**.

---

## 8. Reasoning Memory vs. User-Surfaced Memory

JARVIS strictly distinguishes between internal reasoning and user surfacing:

* **Internal Reasoning Memory (`reasoningEligible = true`)**: Memory that informs internal LLM reasoning or tool planning, but is not displayed directly in responses.
* **User-Surfaced Memory (`surfacingEligible = true`)**: Memory appropriate to explicitly state or expose to the user.

A memory candidate can be:
* `retrieved = true`
* `active = true`
* `reasoningEligible = true`
* `surfacingEligible = false`

This separation ensures internal scratchpads do not leak directly into user responses.

---

## 9. Conflict & Supersession Mechanism

When a new memory is added, JARVIS checks for high semantic similarity ($> 0.85$) with existing memories:

* **Rule**: A lower-tier memory **cannot overwrite or supersede** a higher-tier memory.
* If new memory is equal or higher tier $\rightarrow$ existing memory is marked `isSuperseded = true` and `suppressed = true`.
* If new memory is lower tier $\rightarrow$ new memory is marked `isSuperseded = true` and `suppressed = true`.

---

## 10. Vector Store Replaceability Architecture

High-level runtime components depend exclusively on the abstract `IMemoryStore` interface (`src/memory/interfaces/index.ts`):

```
JarvisCore
    ↓
IMemoryStore
    ↓
VectorMemoryStore
    ↓
IEmbeddingProvider
    ↓
Local/Mock Embedding Provider (e.g. MockEmbeddingProvider / ONNX / Ollama)
```

Future milestones can introduce external backends (LanceDB, Qdrant, SQLite + vec) without altering `JarvisCore` or high-level application code.
