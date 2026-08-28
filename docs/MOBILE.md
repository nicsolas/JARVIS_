# MOBILE.md — Mobile Application Architecture (React Native + Expo)

## 1. Overview & Mobile Strategy

The JARVIS mobile client provides a portable, dark-first UI for interacting with JARVIS via text, ambient voice, and in-app VoIP calls.

### Core Mobile Choices
* **Framework**: **React Native with Expo** (Development Build).
* **Rationale**: Cross-platform single codebase (iOS & Android), robust ecosystem for native voice audio streaming, fast iteration, and clean React component reusability.
* **State Management**: Zustand / React Query for efficient, lightweight state synchronization.

---

## 2. Mobile Architecture & Layering

```
┌────────────────────────────────────────────────────────────────────────┐
│                         MOBILE CLIENT ARCHITECTURE                      │
├────────────────────────────────────────────────────────────────────────┤
│  UI Layer: React Native (Minimal HUD, Core Visualizer, Controls)        │
├────────────────────────────────────────────────────────────────────────┤
│  State & Transport Layer: Zustand, WebSocket RPC Client, WebRTC Client │
├────────────────────────────────────────────────────────────────────────┤
│  Native Bridges (Expo Plugins):                                         │
│  - Expo-AV / LiveKit SDK (Audio capture & playout)                     │
│  - CallKit / ConnectionService (Native lock screen VoIP call UI)       │
│  - Expo-Notifications (Push alerts & interactive approval prompts)     │
│  - Expo-Local-Authentication (Biometric Touch ID / Face ID step-up)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Mobile Features & UX Directives

### 3.1 Mobile Core Visualizer
* Displays the responsive **JARVIS Core Visualizer** optimized for high-refresh-rate mobile screens (60–120Hz).
* Haptic feedback (via `expo-haptics`) when state transitions occur (e.g. `Idle` $\rightarrow$ `Listening`).

### 3.2 Mobile Risk & Approval Notifications
* When a high-risk task ($R \ge 4$) is triggered from desktop or automation, a push notification is dispatched to mobile.
* Interacting with the push alert opens the high-contrast Approval Modal, requiring Face ID / Touch ID validation before authorizing execution.

### 3.3 Background Voice & Audio Services
* Runs background audio sessions (`UIBackgroundModes: audio`) to support continuous background voice listening and VoIP call handling.
