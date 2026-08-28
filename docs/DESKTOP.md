# DESKTOP.md — Desktop Application Architecture (Tauri vs. Electron)

## 1. Desktop Shell Technology Selection

### Framework Evaluation: Tauri vs. Electron

| Dimension | Electron | Tauri (Selected Preferred Choice) |
|---|---|---|
| **Binary Bundle Size** | $\sim 80\text{MB} - 120\text{MB}$ | **$\sim 10\text{MB} - 15\text{MB}$** |
| **Idle Memory Footprint** | $\sim 150\text{MB} - 300\text{MB}$ RAM | **$\sim 30\text{MB} - 50\text{MB}$ RAM** |
| **Backend System Language** | Node.js / JavaScript | **Rust** (high safety, zero-overhead OS bindings) |
| **OS WebView** | Bundled Chromium | Native OS WebView (WKWebView / WebView2) |
| **Security Architecture** | Complex IPC isolation required | Strict Rust IPC command allowlists by default |

### Decision Rationale
**Tauri** is chosen as the primary desktop application framework. Because JARVIS is a persistent, ambient personal assistant that runs continuously in the background, Tauri's tiny memory footprint ($\sim 35\text{MB}$ vs Electron's $\sim 250\text{MB}$) and native Rust security model make it vastly superior.

---

## 2. System Integration & Operating System Features

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       TAURI DESKTOP SYSTEM BOUNDARIES                   │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ React / TypeScript HUD Interface (Webview Window)                 │  │
│  └──────────────────────────────────┬────────────────────────────────┘  │
│                                     │ IPC Commands / Events             │
│                                     ▼                                   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Rust Core Backend Module                                          │  │
│  │ - Global Hotkey Registration (e.g. Cmd+Shift+Space)               │  │
│  │ - System Tray Icon & Quick Context Menu                           │  │
│  │ - Secure Keychain Manager (macOS Keychain / Windows Credential)   │  │
│  │ - Sandbox Process Launcher & File System Inspector                │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Desktop Capabilities

1. **Global Ambient HUD Hotkey**: Pressing `Cmd+Shift+Space` (or `Ctrl+Shift+Space`) instantly summons the floating, borderless cinematic JARVIS HUD over any active window.
2. **System Tray Persistence**: Minimize to system tray with quick status toggles (Mic Mute, Local AI Mode, Call Status).
3. **Local OS Tool Sandbox**: Direct Rust integration for executing system commands, inspecting local Git repos, and reading local configuration files.
