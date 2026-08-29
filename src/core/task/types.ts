/**
 * Task Difficulty Classification Level (Independent dimension)
 * Measures required reasoning capability, context size, and intelligence needed.
 */
export enum TaskDifficulty {
  TRIVIAL = 'TRIVIAL',       // 1: Deterministic command, zero reasoning needed
  SIMPLE = 'SIMPLE',         // 2: Direct lookup, simple script, basic response
  MODERATE = 'MODERATE',     // 3: Contextual understanding, standard fast LLM
  HIGH = 'HIGH',             // 4: Multi-step reasoning, complex code analysis
  COMPLEX = 'COMPLEX'        // 5: Deep reasoning, architectural synthesis
}

export function getDifficultyWeight(difficulty: TaskDifficulty): number {
  switch (difficulty) {
    case TaskDifficulty.TRIVIAL: return 1;
    case TaskDifficulty.SIMPLE: return 2;
    case TaskDifficulty.MODERATE: return 3;
    case TaskDifficulty.HIGH: return 4;
    case TaskDifficulty.COMPLEX: return 5;
    default: return 1;
  }
}

/**
 * Task Risk Severity Classification Level (Independent dimension)
 * Measures potential impact, destructive capability, or system mutation.
 */
export enum TaskRisk {
  LOW = 'LOW',               // 1: Read-only query, public data
  MINOR = 'MINOR',           // 2: Local cache write, user preference update
  MODERATE = 'MODERATE',     // 3: Safe workspace file write, non-destructive
  HIGH = 'HIGH',             // 4: File deletion, directory manipulation, system state change
  CRITICAL = 'CRITICAL'      // 5: Production deployment, credential access, format disk
}

export function getRiskWeight(risk: TaskRisk): number {
  switch (risk) {
    case TaskRisk.LOW: return 1;
    case TaskRisk.MINOR: return 2;
    case TaskRisk.MODERATE: return 3;
    case TaskRisk.HIGH: return 4;
    case TaskRisk.CRITICAL: return 5;
    default: return 1;
  }
}

/**
 * Task Status Lifecycle States
 */
export enum TaskStatus {
  RECEIVED = 'RECEIVED',
  ANALYZING = 'ANALYZING',
  ROUTING = 'ROUTING',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  EXECUTING = 'EXECUTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

/**
 * Proposed Route Types
 */
export enum ExecutionRouteType {
  DETERMINISTIC = 'DETERMINISTIC',
  LOCAL_MODEL = 'LOCAL_MODEL',
  FAST_CLOUD_MODEL = 'FAST_CLOUD_MODEL',
  REASONING_CLOUD_MODEL = 'REASONING_CLOUD_MODEL'
}

/**
 * Required System Capabilities
 */
export type SystemCapability = 'deterministic_script' | 'text_generation' | 'code_analysis' | 'tool_execution' | 'memory_retrieval';

/**
 * Proposed Execution Route Details
 */
export interface ExecutionRoute {
  type: ExecutionRouteType;
  providerId: string;
  modelId: string;
  reason: string;
  estimatedCostTier: 'ZERO' | 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedLatencyTier: 'SUB_50MS' | 'SUB_250MS' | 'SUB_1S' | 'MULTI_SECOND';
}

/**
 * Execution Result Object
 */
export interface TaskExecutionResult {
  success: boolean;
  output: unknown;
  toolCallsExecuted?: Array<{
    toolId: string;
    params: Record<string, unknown>;
    result: unknown;
  }>;
  executionDurationMs: number;
  metadata?: Record<string, unknown>;
}

/**
 * Strongly-typed Task Representation
 */
export interface Task {
  id: string;
  rawInput: string;
  normalizedIntent: string;
  difficulty: TaskDifficulty;
  risk: TaskRisk;
  requiredCapabilities: SystemCapability[];
  route?: ExecutionRoute;
  requiresApproval: boolean;
  approvalLevelRequired?: 'AUTO_EXECUTE' | 'CONFIRMATION_REQUIRED' | 'STEP_UP_APPROVAL';
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  result?: TaskExecutionResult;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
