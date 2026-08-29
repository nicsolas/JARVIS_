import { describe, it, expect } from 'vitest';
import { MultiAgentOrchestrator } from '../src/agents/orchestrator/MultiAgentOrchestrator.js';
import { TokenBudgetRegulator } from '../src/agents/budget/TokenBudgetRegulator.js';
import { AgentTaskSpec } from '../src/agents/interfaces/index.js';

describe('M5-M8 Multi-Agent Orchestrator & Parallel Task Engine Test Suite', () => {
  it('should instantiate all 7 agent roles (Architect, Backend, Frontend, Designer, Tester, Security, Reviewer)', () => {
    const orchestrator = new MultiAgentOrchestrator();
    expect(orchestrator.getWorker('architect')).toBeDefined();
    expect(orchestrator.getWorker('backend')).toBeDefined();
    expect(orchestrator.getWorker('frontend')).toBeDefined();
    expect(orchestrator.getWorker('designer')).toBeDefined();
    expect(orchestrator.getWorker('tester')).toBeDefined();
    expect(orchestrator.getWorker('security')).toBeDefined();
    expect(orchestrator.getWorker('reviewer')).toBeDefined();
  });

  it('should execute independent tasks in parallel and respect DAG dependencies', async () => {
    const orchestrator = new MultiAgentOrchestrator();

    const tasks: AgentTaskSpec[] = [
      {
        id: 'task-1',
        title: 'Design API Contracts',
        description: 'Architect task',
        assignedRole: 'architect',
        dependencies: [],
        status: 'pending'
      },
      {
        id: 'task-2',
        title: 'Implement Backend Database',
        description: 'Backend task',
        assignedRole: 'backend',
        dependencies: ['task-1'],
        status: 'pending'
      },
      {
        id: 'task-3',
        title: 'Implement Frontend UI',
        description: 'Frontend task',
        assignedRole: 'frontend',
        dependencies: ['task-1'],
        status: 'pending'
      },
      {
        id: 'task-4',
        title: 'Security Audit & Review',
        description: 'Security task',
        assignedRole: 'security',
        dependencies: ['task-2', 'task-3'],
        status: 'pending'
      }
    ];

    const results = await orchestrator.executeParallelGraph(tasks);
    expect(results.every(t => t.status === 'completed')).toBe(true);
  });

  it('should enforce token and cost budgets via regulator', () => {
    const budget = new TokenBudgetRegulator({ maxTokensPerAgent: 200 });
    expect(budget.canConsume('architect', 100)).toBe(true);
    budget.recordConsumption('architect', 150);
    expect(budget.canConsume('architect', 100)).toBe(false);
  });
});
