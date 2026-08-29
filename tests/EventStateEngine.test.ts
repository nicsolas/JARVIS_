import { describe, expect, it } from 'vitest';
import {
  ApprovalEngine,
  EventDispatcher,
  JarvisCore,
  Logger,
  MockAIProvider,
  MockApprovalProvider,
  ModelRouter,
  SafeOpenAppTool,
  StateEngine,
  TaskRisk,
  ToolRegistry,
  VectorMemoryStore
} from '../src/index.js';

describe('JARVIS Milestone 2: Core Event Dispatcher and State Engine', () => {
  it('emits typed lifecycle events and returns to IDLE after task completion', async () => {
    const dispatcher = new EventDispatcher();
    const stateEngine = new StateEngine('IDLE', dispatcher);
    const eventNames: string[] = [];

    dispatcher.onAny(event => {
      eventNames.push(event.name);
    });

    const toolRegistry = new ToolRegistry();
    toolRegistry.register(new SafeOpenAppTool());

    const core = new JarvisCore({
      modelRouter: new ModelRouter(),
      approvalEngine: new ApprovalEngine(TaskRisk.HIGH, new MockApprovalProvider(true)),
      toolRegistry,
      memoryStore: new VectorMemoryStore(),
      providers: [new MockAIProvider()],
      logger: new Logger('error'),
      eventDispatcher: dispatcher,
      stateEngine
    });

    const task = await core.processRequest('Open Spotify');

    expect(task.result?.success).toBe(true);
    expect(stateEngine.current).toBe('IDLE');
    expect(eventNames).toContain('task.received');
    expect(eventNames).toContain('task.analyzing');
    expect(eventNames).toContain('task.routing');
    expect(eventNames).toContain('task.executing');
    expect(eventNames).toContain('task.completed');
    expect(eventNames).toContain('state.changed');
  });

  it('supports unsubscribe and listener counting', async () => {
    const dispatcher = new EventDispatcher();
    let count = 0;
    const unsubscribe = dispatcher.on('task.received', () => {
      count += 1;
    });

    expect(dispatcher.listenerCount('task.received')).toBe(1);
    await dispatcher.emit('task.received', { taskId: 'a' });
    unsubscribe();
    await dispatcher.emit('task.received', { taskId: 'b' });

    expect(count).toBe(1);
    expect(dispatcher.listenerCount('task.received')).toBe(0);
  });
});
