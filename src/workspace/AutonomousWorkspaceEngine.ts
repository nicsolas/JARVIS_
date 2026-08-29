import { MultiAgentOrchestrator } from '../agents/orchestrator/MultiAgentOrchestrator.js';
import { AgentTaskSpec } from '../agents/interfaces/index.js';

export interface AutonomousProjectPlan {
  projectId: string;
  title: string;
  tasks: AgentTaskSpec[];
  status: 'planned' | 'executing' | 'completed' | 'failed';
}

export class AutonomousWorkspaceEngine {
  private orchestrator: MultiAgentOrchestrator;

  constructor(orchestrator: MultiAgentOrchestrator) {
    this.orchestrator = orchestrator;
  }

  async createAndExecuteProject(title: string, taskSpecs: Array<{ title: string; role: AgentTaskSpec['assignedRole']; deps?: string[] }>): Promise<AutonomousProjectPlan> {
    const tasks: AgentTaskSpec[] = taskSpecs.map((spec, index) => ({
      id: `task_${index + 1}`,
      title: spec.title,
      description: `Autonomous subtask: ${spec.title}`,
      assignedRole: spec.role,
      dependencies: spec.deps || [],
      status: 'pending'
    }));

    const plan: AutonomousProjectPlan = {
      projectId: `proj_${Date.now()}`,
      title,
      tasks,
      status: 'executing'
    };

    const executed = await this.orchestrator.executeParallelGraph(plan.tasks);
    plan.tasks = executed;
    plan.status = executed.every(t => t.status === 'completed') ? 'completed' : 'failed';
    return plan;
  }
}
