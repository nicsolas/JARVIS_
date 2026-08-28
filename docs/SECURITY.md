# SECURITY.md — Security Architecture & Threat Model

## 1. Core Security Policy: Zero Secrets in Code

JARVIS strictly enforces a zero-secrets policy across the repository, build scripts, logs, and committed artifacts:
* **Zero Hard-coded Credentials**: API keys, OAuth secrets, database URLs, and private encryption keys must **never** be hard-coded into source files or documentation.
* **OS Keychains Storage**: Cloud provider keys (Anthropic, OpenAI, ElevenLabs) are stored exclusively in the host operating system's secure credential vault (macOS Keychain, Windows Credential Manager, Linux Secret Service).
* **Automated Secret Scanning**: Pre-commit hooks automatically scan staged files for credential patterns prior to commit.

---

## 2. Sandbox Security & Threat Model

### 2.1 Threat Vectors & Mitigation Strategies

```
┌─────────────────────────────────┬──────────────────────────────────────────────────────────┐
│ Threat Vector                   │ Mitigation Architecture                                  │
├─────────────────────────────────┼──────────────────────────────────────────────────────────┤
│ Prompt Injection Attack         │ Input sanitization + Risk Engine isolation ($R \ge 4$)   │
│ Unintended File Destruction     │ Sandbox path isolation + Interactive step-up user auth   │
│ Credential Leak in Prompt Context│ Context filtering strip patterns before LLM dispatch     │
│ Malicious Subprocess Invocation │ Strict allowlists for executable binary names            │
│ Local Vector DB Tampering       │ Cryptographic hash validation of vector index files      │
└─────────────────────────────────┴──────────────────────────────────────────────────────────┘
```

---

## 3. Biometric Step-Up & Authorization Boundaries

1. **Level 5 Risk Operations**: Actions involving raw shell execution, file deletion, system configuration mutation, or secret retrieval require biometric verification (Touch ID, Face ID, or system password challenge).
2. **Session Timeout**: Elevated permissions expire automatically after **5 minutes** of inactivity.
3. **Audit Ledger**: All authorization events write structured JSON logs to `audit_log.jsonl`.
