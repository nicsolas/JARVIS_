import { ITool, ToolExecutionContext } from '../interfaces/index.js';
import { ValidationError, ToolExecutionError } from '../../errors/index.js';

export class ToolRegistry {
  private tools: Map<string, ITool> = new Map();

  register(tool: ITool): void {
    if (this.tools.has(tool.id)) {
      throw new ValidationError(`Tool with ID "${tool.id}" is already registered.`);
    }
    this.tools.set(tool.id, tool);
  }

  get(toolId: string): ITool | undefined {
    return this.tools.get(toolId);
  }

  list(): ITool[] {
    return Array.from(this.tools.values());
  }

  has(toolId: string): boolean {
    return this.tools.has(toolId);
  }

  async executeTool(
    toolId: string,
    params: Record<string, unknown>,
    context: ToolExecutionContext = {}
  ): Promise<unknown> {
    const tool = this.get(toolId);
    if (!tool) {
      throw new ValidationError(`Tool "${toolId}" not found in registry.`);
    }

    if (!tool.validateInput(params)) {
      throw new ValidationError(`Invalid input parameters for tool "${toolId}".`);
    }

    try {
      return await tool.execute(params, context);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new ToolExecutionError(`Execution failed for tool "${toolId}": ${message}`, { originalError: err });
    }
  }
}
