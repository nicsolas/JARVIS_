import { ITool, ToolParameterSchema, ToolExecutionContext } from '../interfaces/index.js';
import { TaskRisk } from '../../core/task/types.js';

export class SafeOpenAppTool implements ITool<{ appName: string }, { success: boolean; message: string }> {
  readonly id = 'sys.open_app';
  readonly name = 'Open Application';
  readonly description = 'Safely launches a local system application by name (Mock implementation).';
  readonly category = 'system' as const;
  readonly defaultRiskLevel = TaskRisk.LOW;
  readonly isDeterministicAvailable = true;
  readonly isLLMAvailable = true;

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      appName: {
        type: 'string',
        description: 'Name of the application to launch (e.g. Spotify, Terminal, Calculator)'
      }
    },
    required: ['appName']
  };

  validateInput(input: { appName: string }): boolean {
    return typeof input === 'object' && input !== null && typeof input.appName === 'string' && input.appName.trim().length > 0;
  }

  async execute(input: { appName: string }, _context: ToolExecutionContext): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `[Safe Mock Tool]: Application "${input.appName}" launched successfully.`
    };
  }
}

export class SafeMediaControlTool implements ITool<{ action: string }, { success: boolean; state: string }> {
  readonly id = 'media.control';
  readonly name = 'Media Playback Control';
  readonly description = 'Controls local audio/video media playback (play, pause, skip).';
  readonly category = 'media' as const;
  readonly defaultRiskLevel = TaskRisk.LOW;
  readonly isDeterministicAvailable = true;
  readonly isLLMAvailable = true;

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Playback action to perform',
        enum: ['play', 'pause', 'next', 'previous', 'mute']
      }
    },
    required: ['action']
  };

  validateInput(input: { action: string }): boolean {
    return typeof input === 'object' && input !== null && ['play', 'pause', 'next', 'previous', 'mute'].includes(input.action);
  }

  async execute(input: { action: string }, _context: ToolExecutionContext): Promise<{ success: boolean; state: string }> {
    return {
      success: true,
      state: `[Safe Mock Tool]: Media state set to "${input.action}".`
    };
  }
}

export class SafeSystemStatsTool implements ITool<Record<string, never>, { cpuUsagePct: number; memoryFreeMb: number }> {
  readonly id = 'sys.get_stats';
  readonly name = 'Get System Statistics';
  readonly description = 'Retrieves non-sensitive CPU, memory, and performance metrics.';
  readonly category = 'system' as const;
  readonly defaultRiskLevel = TaskRisk.LOW;
  readonly isDeterministicAvailable = true;
  readonly isLLMAvailable = true;

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {}
  };

  validateInput(_input: Record<string, never>): boolean {
    return true;
  }

  async execute(_input: Record<string, never>, _context: ToolExecutionContext): Promise<{ cpuUsagePct: number; memoryFreeMb: number }> {
    return {
      cpuUsagePct: 12.4,
      memoryFreeMb: 8192
    };
  }
}

export class SafeMockDeleteTool implements ITool<{ targetPath: string }, { deleted: boolean; path: string }> {
  readonly id = 'fs.mock_delete';
  readonly name = 'Mock Delete Directory';
  readonly description = 'Safe mock demonstration of a high-risk directory deletion operation for testing approval workflows.';
  readonly category = 'file' as const;
  readonly defaultRiskLevel = TaskRisk.HIGH;
  readonly isDeterministicAvailable = false;
  readonly isLLMAvailable = true;

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      targetPath: {
        type: 'string',
        description: 'Path of the folder to mock delete'
      }
    },
    required: ['targetPath']
  };

  validateInput(input: { targetPath: string }): boolean {
    return typeof input === 'object' && input !== null && typeof input.targetPath === 'string' && input.targetPath.length > 0;
  }

  async execute(input: { targetPath: string }, _context: ToolExecutionContext): Promise<{ deleted: boolean; path: string }> {
    return {
      deleted: true,
      path: `[Mock High-Risk Action Completed]: Target path "${input.targetPath}" was removed.`
    };
  }
}
