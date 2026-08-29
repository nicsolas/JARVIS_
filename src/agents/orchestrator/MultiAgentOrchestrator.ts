import { AgentRole, AgentTaskSpec, IAgentWorker } from '../interfaces/index.js';
import { TokenBudgetRegulator } from '../budget/TokenBudgetRegulator.js';

export class BaseAgentWorker implements IAgentWorker {
  readonly role: AgentRole;
  readonly name: string;
  readonly capabilities: string[];

  constructor(role: AgentRole, name: string, capabilities: string[]) {
    this.role = role;
    this.name = name;
    this.capabilities = capabilities;
  }

  async executeTask(task: AgentTaskSpec): Promise<{ success: boolean; result: unknown; tokensUsed: number }> {
    const tokensUsed = 120;
    return {
      success: true,
      result: `[Agent ${this.name} (${this.role})] Completed task "${task.title}": Output prepared cleanly.`,
      tokensUsed
    };
  }
}

export class MultiAgentOrchestrator {
  private workers: Map<AgentRole, IAgentWorker> = new Map();
  private budgetRegulator: TokenBudgetRegulator;

  constructor(budgetRegulator = new TokenBudgetRegulator()) {
    this.budgetRegulator = budgetRegulator;
    this.initDefaultWorkers();
  }

  registerWorker(worker: IAgentWorker): void {
    this.workers.set(worker.role, worker);
  }

  getWorker(role: AgentRole): IAgentWorker | undefined {
    return this.workers.get(role);
  }

  private initDefaultWorkers(): void {
    const roles: AgentRole[] = ['architect', 'backend', 'frontend', 'designer', 'tester', 'security', 'reviewer'];
    for (const role of roles) {
      this.registerWorker(new BaseAgentWorker(role, `JARVIS-${role.toUpperCase()}-Agent`, [role, 'code-execution']));
    }
  }

  async executeParallelGraph(tasks: AgentTaskSpec[]): Promise<AgentTaskSpec[]> {
    const taskMap = new Map<string, AgentTaskSpec>(tasks.map(t => [t.id, t]));
    const completedTaskIds = new Set<string>();

    while (completedTaskIds.size < tasks.length) {
      const readyTasks = Array.from(taskMap.values()).filter(t => {
        if (t.status === 'completed' || t.status === 'running') return false;
        return t.dependencies.every(depId => completedTaskIds.has(depId));
      });

      if (readyTasks.length === 0 && completedTaskIds.size < tasks.length) {
        throw new Error('Cyclic dependency or unresolvable task graph detected in multi-agent execution.');
      }

      await Promise.all(
        readyTasks.map(async task => {
          task.status = 'running';
          const worker = this.workers.get(task.assignedRole) || this.workers.get('architect')!;

          if (!this.budgetRegulator.canConsume(worker.role, 150)) {
            task.status = 'failed';
            task.error = `Agent ${worker.role} exceeded token budget capacity.`;
            return;
          }

          try {
            const res = await worker.executeTask(task);
            if (res.success) {
              task.status = 'completed';
              task.output = res.result;
              this.budgetRegulator.recordConsumption(worker.role, res.tokensUsed);
              completedTaskIds.add(task.id);
            } else {
              task.status = 'failed';
              task.error = 'Task execution failed inside agent worker.';
            }
          } catch (err: unknown) {
            task.status = 'failed';
            task.error = err instanceof Error ? err.message : String(err);
          }
        })
      );
    }

    return Array.from(taskMap.values());
  }
}
