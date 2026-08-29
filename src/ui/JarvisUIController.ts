export type CoreVisualizerState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'executing_tool'
  | 'awaiting_approval'
  | 'error'
  | 'offline';

export interface UIState {
  visualState: CoreVisualizerState;
  activeTaskId?: string;
  statusText: string;
  theme: {
    background: '#0A0A0C';
    accentGlow: string;
  };
}

export class JarvisUIController {
  private state: UIState;

  constructor() {
    this.state = {
      visualState: 'idle',
      statusText: 'JARVIS Online',
      theme: {
        background: '#0A0A0C',
        accentGlow: '#00F0FF'
      }
    };
  }

  setVisualState(newState: CoreVisualizerState, statusText?: string): void {
    this.state.visualState = newState;
    if (statusText) this.state.statusText = statusText;
  }

  getState(): UIState {
    return { ...this.state };
  }
}
