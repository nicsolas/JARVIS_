#!/usr/bin/env node
import {
  ApprovalEngine,
  EventDispatcher,
  JarvisCore,
  Logger,
  MockAIProvider,
  MockApprovalProvider,
  ModelRouter,
  SafeMediaControlTool,
  SafeOpenAppTool,
  SafeSystemStatsTool,
  StateEngine,
  TaskRisk,
  ToolRegistry,
  VectorMemoryStore
} from '../index.js';

async function main(): Promise<void> {
  const input = process.argv.slice(2).join(' ').trim();

  if (!input) {
    console.error('Usage: jarvis-core "<task>"');
    process.exitCode = 1;
    return;
  }

  const events = new EventDispatcher();
  const state = new StateEngine('IDLE', events);
  const logger = new Logger('info');
  const tools = new ToolRegistry();
  tools.register(new SafeOpenAppTool());
  tools.register(new SafeMediaControlTool());
  tools.register(new SafeSystemStatsTool());

  const core = new JarvisCore({
    modelRouter: new ModelRouter(),
    approvalEngine: new ApprovalEngine(TaskRisk.HIGH, new MockApprovalProvider(true)),
    toolRegistry: tools,
    memoryStore: new VectorMemoryStore(),
    providers: [new MockAIProvider()],
    logger,
    eventDispatcher: events,
    stateEngine: state
  });

  const task = await core.processRequest(input);
  console.log(JSON.stringify({
    id: task.id,
    status: task.status,
    difficulty: task.difficulty,
    risk: task.risk,
    route: task.route?.type,
    output: task.result?.output ?? task.error
  }, null, 2));
}

void main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
