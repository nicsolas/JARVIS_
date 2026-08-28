# DESIGN.md — Visual Design System & UI/UX Principles

## 1. Aesthetic Direction

JARVIS's user interface is **cinematic, dark, minimal, technological, and restrained**. It rejects generic SaaS dashboard aesthetics — avoiding white background cards, cluttered widget grids, noisy sidebar navigation, and bright multi-color gradients.

The design evokes a high-performance personal computer HUD:
* **Dark-First Palette**: Deep blacks, dark charcoal surfaces, subtle translucent glassmorphism.
* **Minimal Visual Chrome**: Clean, unobtrusive controls that fade out when inactive.
* **Focus on the Core**: The central visual element is the **JARVIS Core Visualizer**, an animated HUD sphere/ring that reflects the active status of the system.
* **Typography**: Crisp, highly readable monospace and geometric sans-serif typefaces (`JetBrains Mono`, `Inter`).

---

## 2. Color Palette & Typography

### 2.1 Color Palette

```
┌───────────────────────────────┬────────────┬──────────────────────────────────┐
│ Role                          │ Hex Code   │ Usage                            │
├───────────────────────────────┼────────────┼──────────────────────────────────┤
│ Void Background               │ #050507    │ Base application background      │
│ Deep Surface                  │ #0D0E12    │ Container & panel background     │
│ Elevate Surface               │ #151720    │ Hover states, active overlays    │
│ Primary Text                  │ #F0F2F5    │ High contrast titles & readouts  │
│ Muted Text                    │ #8A909E    │ Labels, metadata, timestamps     │
│ Accent Cyan (Core/Active)     │ #00E5FF    │ Primary glowing core, listening  │
│ Accent Blue (Thinking/Reason) │ #3B82F6    │ Processing, reasoning state      │
│ Amber Alert (Pending Risk)    │ #F59E0B    │ Awaiting user confirmation       │
│ Emerald Success               │ #10B981    │ Tool execution complete          │
│ Crimson Danger                │ #EF4444    │ Errors, critical risk block      │
└───────────────────────────────┴────────────┴──────────────────────────────────┘
```

### 2.2 Typography
* **Primary Sans**: `Inter`, `-apple-system`, `BlinkMacSystemFont` (UI text, clean labels).
* **Technical Monospace**: `JetBrains Mono`, `Fira Code` (Code execution, system logs, memory scores, CLI tools).

---

## 3. Central Core Visualizer States

The central UI feature across Desktop and Mobile is the **JARVIS Core Visualizer**, an animated ring/waveform displaying exact visual feedback for each system state:

```
┌──────────────────┬─────────────────────────────────────────────────────────────┐
│ State            │ Visual Behavior                                             │
├──────────────────┼─────────────────────────────────────────────────────────────┤
│ `Idle`           │ Slow, gentle pulse in Accent Cyan (#00E5FF) at 20% opacity. │
│ `Listening`      │ Dynamic fluid audio wave expanding around core ring.        │
│ `Thinking`       │ Orbiting inner rings with subtle Blue (#3B82F6) glow.       │
│ `Speaking`       │ Audio-reactive frequency visualizer responding to TTS output│
│ `Executing Tool` │ Rotating gear/circuit tick pattern with Emerald pulse.      │
│ `Awaiting Auth`  │ Pulsing Amber (#F59E0B) perimeter with approval banner.    │
│ `Error`          │ Crisp Crimson (#EF4444) stroke flash with diagnostic info.  │
│ `Offline`        │ Static muted gray ring (#8A909E) with low opacity.          │
└──────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 4. UI Structure & Component Guidelines

### 4.1 Interface Hierarchy
1. **Header / Bar**: Minimalist system status indicator (Connection, Model in use, Active memory level, Mic state).
2. **Central Stage**: The JARVIS Core Visualizer and streaming message output area.
3. **Approval Overlay**: Floating HUD card appearing only when a high-risk action requires confirmation.
4. **Command Input**: Sleek bottom bar supporting combined text input, voice trigger, and shortcut actions.

### 4.2 Anti-Patterns (What to Avoid)
* **No Cards Overload**: Do not wrap every piece of text in elevated white/gray boxes.
* **No Bright SaaS Gradients**: Avoid pink-to-purple generic AI gradients.
* **No Cluttered Navigation**: Avoid heavy left sidebars with 15 menu options. Keep controls context-sensitive.
* **No Excessive Skeuomorphism or Decorative Noise**: Visual elements must serve an informational purpose.
