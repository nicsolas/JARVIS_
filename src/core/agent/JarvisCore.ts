import { Task, TaskStatus, TaskExecutionResult } from '../task/types.js';
import { ModelRouter } from '../routing/ModelRouter.js';
import { ApprovalEngine } from '../approvals/ApprovalEngine.js';
import { ToolRegistry } from '../../tools/registry/ToolRegistry.js';
import { IAIProvider } from '../../ai/interfaces/index.js';
import { IMemoryStore } from '../../memory/interfaces/index.js';
import { ILogger } from '../../logging/index.js';
import { ApprovalRequiredError, CancelledError } from '../../errors/index.js';
import { EventDispatcher } from '../events/EventDispatcher.js';
import { StateEngine } from '../state/StateEngine.js';

export interface JarvisCoreOptions {
  modelRouter: ModelRouter;
  approvalEngine: ApprovalEngine;
  toolRegistry: ToolRegistry;
  memoryStore: IMemoryStore;
  providers: IAIProvider[];
  logger: ILogger;
  eventDispatcher?: EventDispatcher;
  stateEngine?: StateEngine;
}

export class JarvisCore {
  private router: ModelRouter;
  private approvalEngine: ApprovalEngine;
  private toolRegistry: ToolRegistry;
  private memoryStore: IMemoryStore;
  private providers: IAIProvider[];
  private logger: ILogger;
  private eventDispatcher?: EventDispatcher;
  private stateEngine?: StateEngine;

  constructor(options: JarvisCoreOptions) {
    this.router = options.modelRouter;
    this.approvalEngine = options.approvalEngine;
    this.toolRegistry = options.toolRegistry;
    this.memoryStore = options.memoryStore;
    this.providers = options.providers;
    this.logger = options.logger;
    this.eventDispatcher = options.eventDispatcher;
    this.stateEngine = options.stateEngine;
  }

  /**
   * Main Core Pipeline Execution Routine
   */
  async processRequest(rawInput: string): Promise<Task> {
    const startTime = Date.now();
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Request Normalization
    const normalizedIntent = rawInput.trim();

    const task: Task = {
      id: taskId,
      rawInput,
      normalizedIntent,
      difficulty: undefined as never,
      risk: undefined as never,
      requiredCapabilities: [],
      requiresApproval: false,
      status: TaskStatus.RECEIVED,
      createdAt: startTime,
      updatedAt: startTime
    };

    this.logger.info('Task received', { taskId, rawInput });
    await this.eventDispatcher?.emit('task.received', { taskId, rawInput, normalizedIntent });

    try {
      // 2. Intent Analysis & Model Routing (evaluates Difficulty & Risk separately)
      task.status = TaskStatus.ANALYZING;
      await this.stateEngine?.transition('THINKING', `Analyzing task ${taskId}`);
      await this.eventDispatcher?.emit('task.analyzing', { taskId, normalizedIntent });
      const routeEvaluation = this.router.evaluateRoute(
        normalizedIntent,
        this.toolRegistry,
        this.providers
      );

      task.difficulty = routeEvaluation.difficulty;
      task.risk = routeEvaluation.risk;
      task.route = routeEvaluation.route;

      await this.eventDispatcher?.emit('task.routing', {
        taskId,
        difficulty: task.difficulty,
        risk: task.risk,
        route: task.route,
        matchedToolId: routeEvaluation.matchedToolId
      });

      this.logger.info('Routing evaluation complete', {
        taskId,
        difficulty: task.difficulty,
        risk: task.risk,
        routeType: task.route.type,
        matchedToolId: routeEvaluation.matchedToolId
      });

      // 3. Approval Check (Policy Engine evaluation)
      task.status = TaskStatus.ROUTING;
      const approvalDecision = this.approvalEngine.evaluatePolicy(
        task.risk,
        `Execute ${task.route.type} for "${normalizedIntent}"`
      );

      task.requiresApproval = approvalDecision.requiresApproval;
      task.approvalLevelRequired = approvalDecision.approvalLevel;

      if (approvalDecision.requiresApproval) {
        task.status = TaskStatus.WAITING_APPROVAL;
        await this.stateEngine?.transition('AWAITING_APPROVAL', `Task ${taskId} requires approval`);
        await this.eventDispatcher?.emit('task.awaiting_approval', {
          taskId,
          approvalLevel: approvalDecision.approvalLevel,
          reason: approvalDecision.reason
        });
        this.logger.warn('Task requires user approval', {
          taskId,
          approvalLevel: approvalDecision.approvalLevel,
          reason: approvalDecision.reason
        });

        const approved = await this.approvalEngine.processApproval(
          taskId,
          normalizedIntent,
          approvalDecision
        );

        if (!approved) {
          task.status = TaskStatus.CANCELLED;
          task.error = {
            code: 'CANCELLED_BY_USER',
            message: 'Execution denied by user during approval challenge.'
          };
          this.logger.warn('Task cancelled by user during approval challenge', { taskId });
          throw new CancelledError(task.error.message);
        }
      }

      // 4. Execution Stage
      task.status = TaskStatus.EXECUTING;
      await this.stateEngine?.transition('EXECUTING_TOOL', `Executing task ${taskId}`);
      await this.eventDispatcher?.emit('task.executing', { taskId, route: task.route });
      let executionOutput: unknown;
      const toolCallsExecuted: TaskExecutionResult['toolCallsExecuted'] = [];

      // Case A: Deterministic Execution Path (Bypasses LLM completely)
      if (routeEvaluation.route.type === 'DETERMINISTIC' && routeEvaluation.matchedToolId) {
        this.logger.info('Executing deterministic tool path', { taskId, toolId: routeEvaluation.matchedToolId });

        let toolParams: Record<string, unknown> = {};
        if (routeEvaluation.matchedToolId === 'sys.open_app') {
          const appName = normalizedIntent.replace(/^(open|launch)\s+/i, '').trim();
          toolParams = { appName };
        } else if (routeEvaluation.matchedToolId === 'media.control') {
          toolParams = { action: normalizedIntent.toLowerCase().includes('play') ? 'play' : 'pause' };
        }

        const result = await this.toolRegistry.executeTool(routeEvaluation.matchedToolId, toolParams);
        toolCallsExecuted.push({
          toolId: routeEvaluation.matchedToolId,
          params: toolParams,
          result
        });
        executionOutput = result;
      } else {
        // Case B: AI Model Provider Execution Path
        this.logger.info('Executing AI provider path', { taskId, providerId: task.route.providerId });

        // Search memory context for reasoning (without forcing surface)
        const memoryResults = await this.memoryStore.search({
          query: normalizedIntent,
          purpose: 'reasoning'
        });
        await this.eventDispatcher?.emit('memory.retrieved', {
          taskId,
          count: memoryResults.length,
          activeCount: memoryResults.filter(result => result.active).length,
          surfacedCount: memoryResults.filter(result => result.surfacable).length
        });

        const activeProvider = this.providers.find(p => p.id === task.route?.providerId) || this.providers[0];

        const memoryContextString = memoryResults.length > 0
          ? `[Internal Memory Context]: ${memoryResults.map(r => r.record.content).join('; ')}\n`
          : '';

        const completion = await activeProvider.complete({
          messages: [
            { role: 'system', content: `You are JARVIS. ${memoryContextString}` },
            { role: 'user', content: normalizedIntent }
          ],
          modelId: task.route.modelId
        });

        executionOutput = completion.content;
      }

      // 5. Completion Stage
      const executionDurationMs = Date.now() - startTime;
      task.status = TaskStatus.COMPLETED;
      task.updatedAt = Date.now();
      task.result = {
        success: true,
        output: executionOutput,
        toolCallsExecuted,
        executionDurationMs
      };

      await this.stateEngine?.reset(`Task ${taskId} completed`);
      await this.eventDispatcher?.emit('task.completed', { taskId, executionDurationMs, result: task.result });
      this.logger.info('Task completed successfully', { taskId, executionDurationMs });
      return task;

    } catch (err: unknown) {
      task.updatedAt = Date.now();
      if (task.status !== TaskStatus.CANCELLED) {
        task.status = TaskStatus.FAILED;
        const message = err instanceof Error ? err.message : String(err);
        task.error = {
          code: err instanceof ApprovalRequiredError ? 'APPROVAL_REQUIRED_ERROR' : 'EXECUTION_ERROR',
          message
        };
      }
      await this.stateEngine?.transition(task.status === TaskStatus.CANCELLED ? 'IDLE' : 'ERROR', task.error?.message ?? 'Task execution failed');
      await this.eventDispatcher?.emit(task.status === TaskStatus.CANCELLED ? 'task.cancelled' : 'task.failed', { taskId, error: task.error });
      this.logger.error('Task execution failed', { taskId, error: task.error });
      return task;
    }
  }
}
