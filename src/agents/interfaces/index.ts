export type AgentRole = 'architect' | 'backend' | 'frontend' | 'designer' | 'tester' | 'security' | 'reviewer';

export interface AgentTaskSpec {
  id: string;
  title: string;
  description: string;
  assignedRole: AgentRole;
  dependencies: string[];
  maxTokenBudget?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: unknown;
  error?: string;
}

export interface IAgentWorker {
  readonly role: AgentRole;
  readonly name: string;
  readonly capabilities: string[];
  executeTask(task: AgentTaskSpec, context?: Record<string, unknown>): Promise<{ success: boolean; result: unknown; tokensUsed: number }>;
}
