import { TaskRisk } from '../../core/task/types.js';

export type ToolCategory = 'system' | 'file' | 'media' | 'web' | 'developer' | 'productivity';

export interface ToolParameterSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    description: string;
    enum?: string[];
    default?: unknown;
  }>;
  required?: string[];
}

export interface ToolExecutionContext {
  userId?: string;
  activeProjectId?: string;
  sandboxPath?: string;
  isInteractiveSession?: boolean;
}

export interface ITool<TInput = Record<string, unknown>, TOutput = unknown> {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: ToolCategory;
  readonly defaultRiskLevel: TaskRisk;
  readonly isDeterministicAvailable: boolean;
  readonly isLLMAvailable: boolean;
  readonly parameters: ToolParameterSchema;

  validateInput(input: TInput): boolean;
  execute(input: TInput, context: ToolExecutionContext): Promise<TOutput>;
}
