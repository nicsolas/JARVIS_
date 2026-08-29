import { TaskDifficulty, TaskRisk, ExecutionRoute, ExecutionRouteType } from '../task/types.js';
import { DifficultyClassifier, RiskClassifier } from './Classifiers.js';
import { ToolRegistry } from '../../tools/registry/ToolRegistry.js';
import { IAIProvider } from '../../ai/interfaces/index.js';

export class ModelRouter {
  private difficultyClassifier: DifficultyClassifier;
  private riskClassifier: RiskClassifier;

  constructor(
    difficultyClassifier = new DifficultyClassifier(),
    riskClassifier = new RiskClassifier()
  ) {
    this.difficultyClassifier = difficultyClassifier;
    this.riskClassifier = riskClassifier;
  }

  /**
   * Evaluates task difficulty & risk, checks deterministic bypass, and determines execution route.
   */
  evaluateRoute(
    taskInput: string,
    toolRegistry: ToolRegistry,
    availableProviders: IAIProvider[]
  ): {
    difficulty: TaskDifficulty;
    risk: TaskRisk;
    route: ExecutionRoute;
    matchedToolId?: string;
  } {
    // 1. Check if input matches a deterministic tool shortcut
    const matchedTool = toolRegistry.list().find(t => t.isDeterministicAvailable && this.matchesToolPattern(taskInput, t.id));

    const isDeterministic = !!matchedTool;
    const difficulty = this.difficultyClassifier.classify(taskInput, isDeterministic);
    const risk = this.riskClassifier.classify(taskInput, matchedTool?.defaultRiskLevel);

    if (matchedTool) {
      return {
        difficulty,
        risk,
        matchedToolId: matchedTool.id,
        route: {
          type: ExecutionRouteType.DETERMINISTIC,
          providerId: 'native_system',
          modelId: matchedTool.id,
          reason: `Matched deterministic system tool "${matchedTool.name}". Bypassing AI provider.`,
          estimatedCostTier: 'ZERO',
          estimatedLatencyTier: 'SUB_50MS'
        }
      };
    }

    // 2. Select AI Provider & Model based on Difficulty
    const defaultProvider = availableProviders[0] || { id: 'mock-provider', capabilities: [] };

    if (difficulty === TaskDifficulty.HIGH || difficulty === TaskDifficulty.COMPLEX) {
      return {
        difficulty,
        risk,
        route: {
          type: ExecutionRouteType.REASONING_CLOUD_MODEL,
          providerId: defaultProvider.id,
          modelId: 'mock-reasoning-model',
          reason: `High difficulty task (${difficulty}). Routed to high-capability reasoning model.`,
          estimatedCostTier: 'HIGH',
          estimatedLatencyTier: 'SUB_1S'
        }
      };
    }

    return {
      difficulty,
      risk,
      route: {
        type: ExecutionRouteType.FAST_CLOUD_MODEL,
        providerId: defaultProvider.id,
        modelId: 'mock-fast-model',
        reason: `Standard difficulty task (${difficulty}). Routed to lightweight fast model.`,
        estimatedCostTier: 'LOW',
        estimatedLatencyTier: 'SUB_250MS'
      }
    };
  }

  private matchesToolPattern(input: string, toolId: string): boolean {
    const lower = input.toLowerCase();
    if (toolId === 'sys.open_app' && (lower.startsWith('open ') || lower.startsWith('launch '))) {
      return true;
    }
    if (toolId === 'media.control' && (lower.includes('play') || lower.includes('pause') || lower.includes('skip'))) {
      return true;
    }
    if (toolId === 'sys.get_stats' && (lower.includes('cpu usage') || lower.includes('ram usage') || lower.includes('system stats'))) {
      return true;
    }
    return false;
  }
}
