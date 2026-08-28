# MEMORY.md — Hierarchical Vector Memory Architecture

## 1. Overview & Primary Storage Philosophy

JARVIS uses a **semantic vector/embedding memory architecture** as its primary long-term memory engine. It explicitly **does not rely on a conventional relational SQL database** for primary memory storage.

The memory system is designed around a fundamental UX requirement:
> **JARVIS must remember much more than it explicitly exposes.**

Memories must **never** be injected into prompt contexts or spoken aloud simply because they match a basic cosine similarity query. JARVIS surfaces past memories **only when they materially improve the accuracy, context, or execution** of the user's immediate goal.

---

## 2. The 5-Tier Memory Hierarchy

Memory in JARVIS is categorized into five distinct tiers based on lifespan, scope, and stability:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        5-TIER MEMORY HIERARCHY                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Core Memory        │ Immutable facts, user identity, core preferences│
├───────────────────────┼────────────────────────────────────────────────┤
│ 2. Preference Memory  │ Habitual settings, coding styles, tools used   │
├───────────────────────┼────────────────────────────────────────────────┤
│ 3. Project Memory     │ Codebase context, active repos, architectural  │
├───────────────────────┼────────────────────────────────────────────────┤
│ 4. Contextual Memory  │ Active conversation thread, recent sub-tasks    │
├───────────────────────┼────────────────────────────────────────────────┤
│ 5. Ephemeral Memory   │ Raw turns, transient buffer, working scratchpad│
└────────────────────────────────────────────────────────────────────────┘
```

### Tier Descriptions & Retention Policies

1. **Ephemeral Memory (Session Level)**
   * **Scope**: Active interaction buffer, immediate prompt history.
   * **Storage**: In-memory ring buffer (fast RAM).
   * **Retention**: Purged or consolidated upon session conclusion.

2. **Contextual Memory (Active Task/Topic)**
   * **Scope**: Current operational context (e.g., "Debugging Rust compiler issue in repo X").
   * **Storage**: High-density local vector index (LanceDB / Qdrant).
   * **Retention**: Active while topic persists; decays as conversation shifts.

3. **Project Memory (Codebase & Topic Scoped)**
   * **Scope**: Documentation, repository structures, project-specific decisions.
   * **Storage**: Vector index with metadata filters (`project_id: "jarvis"`).
   * **Retention**: Permanent per project, retrieved only when active scope matches.

4. **Preference Memory (User Habits & Style)**
   * **Scope**: User choices ("Prefers TypeScript over JS", "Uses tabs, 2 spaces", "Likes dark UI").
   * **Storage**: Embedded vector records marked with `#preference` tag.
   * **Retention**: Semi-permanent, updated via confirmation when preferences change.

5. **Core Memory (Foundational Knowledge)**
   * **Scope**: Essential facts about the owner, identity rules, high-importance instructions.
   * **Storage**: High-priority vector embeddings with explicit high importance weights.
   * **Retention**: Permanent until explicitly overwritten or revoked by owner.

---

## 3. Multi-Factor Retrieval Scoring Model

Basic vector search (cosine similarity alone) is insufficient because it causes "semantic hallucination of context" — bringing up old, unrelated topics simply because similar keywords were used.

JARVIS calculates a composite **Retrieval Score** ($S_{retrieval}$) for every memory candidate:

$$S_{retrieval} = w_1 \cdot \text{Similarity} + w_2 \cdot \text{ContextRelevance} + w_3 \cdot \text{Recency} + w_4 \cdot \text{Importance} + w_5 \cdot \text{Confidence}$$

### Factor Definitions

* **Semantic Similarity** ($\text{Similarity} \in [0, 1]$): Cosine similarity between query embedding and memory embedding.
* **Context Relevance** ($\text{ContextRelevance} \in [0, 1]$): Match score between memory project/topic tags and active session scope.
* **Recency Decay** ($\text{Recency} = e^{-\lambda \cdot t}$): Exponential decay based on time elapsed $t$ since last access or creation.
* **Importance Weight** ($\text{Importance} \in [0, 1]$): User-designated or model-assigned significance score.
* **Confidence Score** ($\text{Confidence} \in [0, 1]$): System confidence in memory accuracy.

---

## 4. Activation & Suppression Thresholds

To enforce the requirement that **JARVIS remembers more than it exposes**, retrieval candidates must pass strict activation and suppression evaluations before prompt injection:

```
                          Candidate Memory
                                 │
                                 ▼
                     Calculate Composite Score S
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
       S < Threshold_Suppression        S >= Threshold_Activation
                 │                               │
                 ▼                               ▼
       [ SUPPRESS MEMORY ]             [ INJECT INTO CONTEXT ]
   (Keep stored in vector DB,       (Pass to LLM prompt context
    do NOT mention in prompt)        or surface to user)
```

### Rules for Memory Surfacing
1. **Suppression Threshold ($T_{suppress} = 0.72$)**: Candidates scoring below $T_{suppress}$ are discarded immediately from prompt generation.
2. **Context Misalignment Blocking**: Even if a memory has a similarity score $> 0.85$, if its `project_id` or topic tag contradicts the active context (e.g. discussing cooking while user is debugging code), it is **suppressed**.
3. **Implicit Usage over Explicit Spoken Retrieval**: When a memory passes activation, JARVIS uses the knowledge to inform its answer **without** explicitly stating *"I remember from 3 weeks ago that you..."* unless specifically asked.

---

## 5. Vector Store Replaceability Architecture

Primary memory is abstracted behind the standard interface:

```typescript
export interface MemoryRecord {
  id: string;
  vector: number[];
  content: string;
  tier: 'ephemeral' | 'contextual' | 'project' | 'preference' | 'core';
  projectId?: string;
  importance: number; // 0.0 - 1.0
  createdAt: number;
  lastAccessedAt: number;
  metadata: Record<string, unknown>;
}

export interface IVectorMemoryStore {
  initialize(): Promise<void>;
  insert(record: MemoryRecord): Promise<void>;
  query(
    queryVector: number[],
    limit: number,
    filter?: Record<string, unknown>
  ): Promise<MemoryRecord[]>;
  delete(id: string): Promise<void>;
  consolidate(): Promise<void>;
}
```

* **Recommended Primary Vector Engine**: **LanceDB** (embedded, zero-server management, high speed, local vector store).
* **Alternative Vector Engines**: **Qdrant** (local container/remote), **Chroma**, or in-memory vector indexes.
