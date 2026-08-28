# APPROVALS.md — Risk Engine, Permissions & User Approvals

## 1. Overview & Permission Philosophy

JARVIS operates as an autonomous personal assistant, but **never compromises system security or data integrity**. The Approval Subsystem evaluates the **Risk ($R$)** score calculated during model routing and enforces the appropriate authorization protocol before any tool or system mutation executes.

---

## 2. Risk Levels & Authorization Matrix

```
┌────────────┬─────────────────────────────────┬──────────────────────────────────────────┐
│ Risk Level │ Severity Description            │ Required Authorization Action            │
├────────────┼─────────────────────────────────┼──────────────────────────────────────────┤
│ Level 1    │ Read-only, public data lookup   │ Auto-execute without user interruption    │
│ Level 2    │ Local preference/cache update   │ Auto-execute + subtle UI status telemetry│
│ Level 3    │ Low-impact local file write     │ In-app banner notification (non-blocking)│
│ Level 4    │ System mutation / file delete   │ Interactive Modal Confirmation required   │
│ Level 5    │ Destructive / Financial / Root │ Biometric / Explicit Step-up Auth required│
└────────────┴─────────────────────────────────┴──────────────────────────────────────────┘
```

---

## 3. Interactive Approval Workflows

### 3.1 Flowchart for Action Execution

```
                     Tool Call Requested
                              │
                              ▼
                    Risk Score Assessed (R)
                              │
             ┌────────────────┴────────────────┐
             │                                 │
           R < 4                             R >= 4
             │                                 │
             ▼                                 ▼
   [ AUTO-EXECUTE TOOL ]            [ BLOCK EXECUTION & CRATE APPROVAL REQUEST ]
             │                                 │
             ▼                                 ▼
   Record Audit Log                Dispatch Event to UI (Desktop/Mobile Client)
                                               │
                                      ┌────────┴────────┐
                                      │                 │
                                  [ APPROVED ]     [ REJECTED ]
                                      │                 │
                                      ▼                 ▼
                            Execute Tool &        Return Cancellation
                            Record Audit Log      Response to LLM Context
```

---

## 4. UI/UX Approval Presentation

When $R \ge 4$, JARVIS pauses execution and displays a high-contrast HUD approval challenge on the user's active client:

### Desktop / Mobile Approval HUD Card
```
┌────────────────────────────────────────────────────────────────────────┐
│ ⚠️ HIGH RISK SYSTEM ACTION REQUIRED                                    │
├────────────────────────────────────────────────────────────────────────┤
│ Tool:        `fs.remove_directory`                                     │
│ Target:      `/Users/owner/projects/legacy-app`                        │
│ Reason:      Task requested: "Clean up unused code repositories"       │
│ Risk Score:  5 / 5 (Destructive File Operation)                        │
├────────────────────────────────────────────────────────────────────────┤
│ [ CANCEL (ESC) ]                 [ AUTHORIZE VIA TOUCH ID / CONFIRM ]  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Security & Audit Logging Directives

### 5.1 Append-Only Local Security Log
Every approval request (approved or rejected) and tool execution is recorded in an immutable local ledger (`audit_log.jsonl`):

```json
{
  "timestamp": 1718000000000,
  "requestId": "req_8f9a2b",
  "toolName": "fs.remove_directory",
  "parameters": { "path": "/Users/owner/projects/legacy-app" },
  "riskScore": 5,
  "userDecision": "APPROVED",
  "authMethod": "BIOMETRIC_TOUCH_ID",
  "executionDurationMs": 42
}
```

### 5.2 Zero-Bypass Safeguards
* Core system endpoints (e.g. format disk, raw shell execution in root, sending raw credentials) can **never** be downgraded to auto-execute.
* If a client UI is disconnected while a high-risk approval is pending, the request automatically times out and cancels execution after **60 seconds**.
