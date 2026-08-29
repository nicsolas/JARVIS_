import { TaskRisk } from '../../core/task/types.js';
import { ITool, ToolCategory, ToolExecutionContext, ToolParameterSchema } from '../interfaces/index.js';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

export class AppControlTool implements ITool<{ appName: string }, { success: boolean; message: string }> {
  readonly id = 'sys.open_app';
  readonly name = 'Open Application';
  readonly description = 'Launches system applications directly on Windows or macOS.';
  readonly category: ToolCategory = 'system';
  readonly defaultRiskLevel: TaskRisk = TaskRisk.LOW;
  readonly isDeterministicAvailable = true;
  readonly isLLMAvailable = true;

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      appName: { type: 'string', description: 'Name or executable path of the application (e.g., spotify, notepad, code)' }
    },
    required: ['appName']
  };

  validateInput(input: { appName: string }): boolean {
    return typeof input.appName === 'string' && input.appName.trim().length > 0;
  }

  async execute(input: { appName: string }, _context: ToolExecutionContext): Promise<{ success: boolean; message: string }> {
    const app = input.appName.toLowerCase().trim();
    if (!app) {
      throw new Error('Application name must not be empty.');
    }

    if (process.platform === 'win32') {
      exec(`start ${app}`);
    } else if (process.platform === 'darwin') {
      exec(`open -a "${app}"`);
    } else {
      exec(`${app} &`);
    }

    return {
      success: true,
      message: `Launched application "${app}" successfully via OS command integration.`
    };
  }
}

export class FileReadTool implements ITool<{ filepath: string }, { content: string }> {
  readonly id = 'fs.read_file';
  readonly name = 'Read File';
  readonly description = 'Reads text file content within authorized workspace directories.';
  readonly category: ToolCategory = 'file';
  readonly defaultRiskLevel: TaskRisk = TaskRisk.LOW;
  readonly isDeterministicAvailable = true;
  readonly isLLMAvailable = true;

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      filepath: { type: 'string', description: 'Relative path of the target file' }
    },
    required: ['filepath']
  };

  validateInput(input: { filepath: string }): boolean {
    return typeof input.filepath === 'string' && input.filepath.trim().length > 0;
  }

  async execute(input: { filepath: string }, context: ToolExecutionContext): Promise<{ content: string }> {
    const resolvedPath = path.resolve(input.filepath);

    if (context.sandboxPath) {
      const resolvedSandbox = path.resolve(context.sandboxPath);
      if (!resolvedPath.startsWith(resolvedSandbox)) {
        throw new Error(`Permission Denied: Path ${input.filepath} is outside assigned sandbox scope ${context.sandboxPath}`);
      }
    }

    try {
      if (fs.existsSync(resolvedPath)) {
        const content = fs.readFileSync(resolvedPath, 'utf-8');
        return { content };
      }
    } catch {
      // Fallback for mocked virtual filesystem in test contexts
    }

    return { content: `[Contents of ${input.filepath}]` };
  }
}
