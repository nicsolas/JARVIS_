# PRIVACY.md — Privacy Architecture & Local-First Principles

## 1. Local-First Privacy Core

JARVIS is built as a **private, single-user system**. It operates under the strict assumption that all user data, interaction transcripts, code snippets, and personal facts remain under the complete control of the owner.

### Key Privacy Rules
1. **Zero Data Harvesting**: No user data, query history, or embeddings are transmitted to third-party telemetries or aggregated datasets.
2. **Local Storage Ownership**: Vector memory stores (LanceDB), logs, caches, and context states reside entirely on the owner's local machine or designated private server.
3. **Opt-in Cloud API Routing**: External cloud AI providers (Anthropic, OpenAI) are accessed **only** when requested by the model router for high-difficulty tasks ($D \ge 4$).

---

## 2. Cloud Minimization & Data Anonymization

When cloud providers are utilized:
* **Payload Minimization**: Only the immediate prompt context required for the task is sent. Ephemeral history is trimmed.
* **Sensitive Identifier Redaction**: Automated pattern matchers strip local path prefixes (e.g. `/Users/username/`), private IP addresses, and personal email addresses before API transmission.
* **Zero Training Agreement Verification**: All cloud API keys used must have commercial data privacy agreements enabled ensuring zero model training on inputs.

---

## 3. User Privacy Controls

* **Memory Erasure API**: The user can inspect, search, or purge vector memories by tag (`#project`, `#preference`, `#core`) or date range via CLI or UI commands.
* **Incognito Session Mode**: Toggleable state wherein session interactions are processed entirely in Ephemeral memory and discarded without vector encoding upon termination.
