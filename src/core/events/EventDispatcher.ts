export type JarvisEventName =
  | 'task.received'
  | 'task.analyzing'
  | 'task.routing'
  | 'task.awaiting_approval'
  | 'task.executing'
  | 'task.completed'
  | 'task.failed'
  | 'task.cancelled'
  | 'state.changed'
  | 'memory.retrieved';

export interface JarvisEvent<TPayload = unknown> {
  id: string;
  name: JarvisEventName;
  timestamp: number;
  payload: TPayload;
  metadata?: Record<string, unknown>;
}

export type JarvisEventListener<TPayload = unknown> = (event: JarvisEvent<TPayload>) => void | Promise<void>;

export class EventDispatcher {
  private listeners: Map<JarvisEventName, Set<JarvisEventListener>> = new Map();
  private wildcardListeners: Set<JarvisEventListener> = new Set();
  private sequence = 0;

  on<TPayload = unknown>(eventName: JarvisEventName, listener: JarvisEventListener<TPayload>): () => void {
    const listenersForEvent = this.listeners.get(eventName) ?? new Set<JarvisEventListener>();
    listenersForEvent.add(listener as JarvisEventListener);
    this.listeners.set(eventName, listenersForEvent);

    return () => this.off(eventName, listener);
  }

  onAny(listener: JarvisEventListener): () => void {
    this.wildcardListeners.add(listener);
    return () => this.wildcardListeners.delete(listener);
  }

  off<TPayload = unknown>(eventName: JarvisEventName, listener: JarvisEventListener<TPayload>): void {
    this.listeners.get(eventName)?.delete(listener as JarvisEventListener);
  }

  async emit<TPayload = unknown>(
    name: JarvisEventName,
    payload: TPayload,
    metadata?: Record<string, unknown>
  ): Promise<JarvisEvent<TPayload>> {
    const event: JarvisEvent<TPayload> = {
      id: `evt_${Date.now()}_${++this.sequence}`,
      name,
      timestamp: Date.now(),
      payload,
      metadata
    };

    const listeners = [
      ...(this.listeners.get(name) ?? []),
      ...this.wildcardListeners
    ];

    for (const listener of listeners) {
      await listener(event);
    }

    return event;
  }

  listenerCount(eventName?: JarvisEventName): number {
    if (eventName) {
      return this.listeners.get(eventName)?.size ?? 0;
    }

    return Array.from(this.listeners.values()).reduce((count, set) => count + set.size, this.wildcardListeners.size);
  }

  clear(): void {
    this.listeners.clear();
    this.wildcardListeners.clear();
  }
}
