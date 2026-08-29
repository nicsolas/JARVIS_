import { EventDispatcher } from '../events/EventDispatcher.js';

export type JarvisRuntimeState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'EXECUTING_TOOL'
  | 'AWAITING_APPROVAL'
  | 'ERROR'
  | 'OFFLINE';

export interface StateSnapshot {
  current: JarvisRuntimeState;
  previous?: JarvisRuntimeState;
  changedAt: number;
  reason?: string;
}

export class StateEngine {
  private snapshot: StateSnapshot;
  private dispatcher?: EventDispatcher;

  constructor(initialState: JarvisRuntimeState = 'IDLE', dispatcher?: EventDispatcher) {
    this.snapshot = {
      current: initialState,
      changedAt: Date.now()
    };
    this.dispatcher = dispatcher;
  }

  get current(): JarvisRuntimeState {
    return this.snapshot.current;
  }

  getSnapshot(): StateSnapshot {
    return { ...this.snapshot };
  }

  async transition(nextState: JarvisRuntimeState, reason?: string): Promise<StateSnapshot> {
    if (nextState === this.snapshot.current) {
      return this.getSnapshot();
    }

    const previous = this.snapshot.current;
    this.snapshot = {
      current: nextState,
      previous,
      changedAt: Date.now(),
      reason
    };

    await this.dispatcher?.emit('state.changed', this.getSnapshot());
    return this.getSnapshot();
  }

  async reset(reason = 'Reset to idle'): Promise<StateSnapshot> {
    return this.transition('IDLE', reason);
  }
}
