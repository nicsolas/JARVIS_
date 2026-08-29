import { JarvisCore } from '../core/agent/JarvisCore.js';
import { AutonomousWorkspaceEngine } from '../workspace/AutonomousWorkspaceEngine.js';
import { Task } from '../core/task/types.js';

export class JarvisAutonomousMode {
  private core: JarvisCore;
  private workspace: AutonomousWorkspaceEngine;

  constructor(core: JarvisCore, workspace: AutonomousWorkspaceEngine) {
    this.core = core;
    this.workspace = workspace;
  }

  async runAutonomousGoal(goal: string): Promise<{ task: Task; workspaceReport?: unknown }> {
    const task = await this.core.processRequest(goal);

    if (goal.toLowerCase().includes('build project') || goal.toLowerCase().includes('refactor workspace')) {
      const plan = await this.workspace.createAndExecuteProject(goal, [
        { title: 'Architecture Planning', role: 'architect' },
        { title: 'Backend Implementation', role: 'backend', deps: ['task_1'] },
        { title: 'Testing & Delivery', role: 'tester', deps: ['task_2'] }
      ]);
      return { task, workspaceReport: plan };
    }

    return { task };
  }
}
