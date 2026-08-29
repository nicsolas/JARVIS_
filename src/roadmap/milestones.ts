export type MilestoneStatus = 'planned' | 'in_progress' | 'completed';

export type MilestoneId =
  | 'M1'
  | 'M2'
  | 'M3'
  | 'M4'
  | 'M5'
  | 'M6'
  | 'M7'
  | 'M8'
  | 'M9'
  | 'M10'
  | 'M11'
  | 'M12'
  | 'M13'
  | 'M14'
  | 'M15'
  | 'M16'
  | 'M17'
  | 'M18'
  | 'M19'
  | 'M20';

export interface MilestoneDefinition {
  readonly id: MilestoneId;
  readonly title: string;
  readonly objective: string;
  readonly dependencies: readonly MilestoneId[];
  readonly status: MilestoneStatus;
}

export interface MilestoneBuildStep extends MilestoneDefinition {
  readonly sequence: number;
  readonly blockedBy: readonly MilestoneId[];
  readonly dependents: readonly MilestoneId[];
  readonly isBuildable: boolean;
}

export interface MilestoneBuildPlan {
  readonly steps: readonly MilestoneBuildStep[];
  readonly nextBuildable: readonly MilestoneId[];
  readonly completed: readonly MilestoneId[];
  readonly blocked: readonly MilestoneId[];
}

export const JARVIS_MILESTONES: readonly MilestoneDefinition[] = [
  {
    id: 'M1',
    title: 'Core Runtime',
    objective: 'Task lifecycle, difficulty/risk classification, routing, approvals, tools, and provider abstraction.',
    dependencies: [],
    status: 'completed'
  },
  {
    id: 'M2',
    title: 'Vector Memory Engine',
    objective: 'Five-tier vector memory, retrieval, scoring, activation/suppression, and reasoning/surfacing separation.',
    dependencies: ['M1'],
    status: 'in_progress'
  },
  {
    id: 'M3',
    title: 'AI Provider System',
    objective: 'Multiple AI providers with fallback, streaming, cost/latency tracking, and quota management.',
    dependencies: ['M1'],
    status: 'planned'
  },
  {
    id: 'M4',
    title: 'Intelligent Model Router',
    objective: 'Provider/model decisions based on difficulty, risk, cost, latency, and availability.',
    dependencies: ['M3'],
    status: 'planned'
  },
  {
    id: 'M5',
    title: 'Multi-Agent Orchestrator',
    objective: 'Specialized agents coordinated by JARVIS: Architect, Backend, Frontend, Designer, Security, Reviewer, and Tester.',
    dependencies: ['M4'],
    status: 'planned'
  },
  {
    id: 'M6',
    title: 'Token & Budget Regulator',
    objective: 'Budgets per task/agent, quota tracking, rate limits, context limits, and usage controls.',
    dependencies: ['M5'],
    status: 'planned'
  },
  {
    id: 'M7',
    title: 'Agent Switcher & Recovery',
    objective: 'Automatic fallback when models hit quota, fail, time out, or produce invalid output.',
    dependencies: ['M5'],
    status: 'planned'
  },
  {
    id: 'M8',
    title: 'Parallel Task Engine',
    objective: 'Dependency graph and parallel agent execution when tasks are independent.',
    dependencies: ['M6', 'M7'],
    status: 'planned'
  },
  {
    id: 'M9',
    title: 'Advanced Tool System',
    objective: 'Real tools, sandboxing, permission boundaries, controlled filesystem access, OS integration, and tool discovery.',
    dependencies: ['M1'],
    status: 'planned'
  },
  {
    id: 'M10',
    title: 'Desktop Client',
    objective: 'Tauri app, tray, global hotkey, notifications, background service, and OS integration.',
    dependencies: ['M1', 'M9'],
    status: 'planned'
  },
  {
    id: 'M11',
    title: 'Mobile Client',
    objective: 'React Native/Expo iOS and Android app, push notifications, background capabilities, and native bridge.',
    dependencies: ['M1', 'M9'],
    status: 'planned'
  },
  {
    id: 'M12',
    title: 'Voice Pipeline',
    objective: 'VAD to STT to JARVIS to tools/AI to TTS pipeline with streaming and wake word.',
    dependencies: ['M1', 'M9'],
    status: 'planned'
  },
  {
    id: 'M13',
    title: 'Calling Engine',
    objective: 'In-app VoIP, WebRTC/LiveKit, incoming/outgoing calls, and approvals via call.',
    dependencies: ['M1', 'M9', 'M12'],
    status: 'planned'
  },
  {
    id: 'M14',
    title: 'JARVIS Interface',
    objective: 'Complete cinematic UI, central visual core, and listening/thinking/executing/speaking/error states.',
    dependencies: ['M1', 'M10', 'M11'],
    status: 'planned'
  },
  {
    id: 'M15',
    title: 'Long-Term Personal Intelligence',
    objective: 'Project awareness, preference learning, memory consolidation, and personal context.',
    dependencies: ['M2', 'M4'],
    status: 'planned'
  },
  {
    id: 'M16',
    title: 'Autonomous Agent Workspace',
    objective: 'End-to-end project management, task assignment, agent monitoring, and result collection.',
    dependencies: ['M5', 'M8', 'M15'],
    status: 'planned'
  },
  {
    id: 'M17',
    title: 'Jules/External Agent Integration',
    objective: 'Connect Jules and other coding agents as external workers.',
    dependencies: ['M5', 'M16'],
    status: 'planned'
  },
  {
    id: 'M18',
    title: 'Distributed Agent Pool',
    objective: 'Multiple agents, models, and machines available concurrently with dynamic scheduling/routing.',
    dependencies: ['M8', 'M17'],
    status: 'planned'
  },
  {
    id: 'M19',
    title: 'Security Hardening',
    objective: 'Threat model, credential vault, advanced sandboxing, audit, and biometric/step-up approval.',
    dependencies: ['M9', 'M13', 'M18'],
    status: 'planned'
  },
  {
    id: 'M20',
    title: 'JARVIS Autonomous Mode',
    objective: 'Plan, delegate, parallelize, verify, correct, and deliver while asking only necessary decisions.',
    dependencies: ['M16', 'M18', 'M19'],
    status: 'planned'
  }
] as const;

export function getMilestone(id: MilestoneId): MilestoneDefinition {
  const milestone = JARVIS_MILESTONES.find(candidate => candidate.id === id);
  if (!milestone) {
    throw new Error(`Unknown JARVIS milestone: ${id}`);
  }
  return milestone;
}

export function getBlockedBy(id: MilestoneId): readonly MilestoneId[] {
  return getMilestone(id).dependencies;
}

export function getDependents(id: MilestoneId): readonly MilestoneId[] {
  return JARVIS_MILESTONES.filter(milestone => milestone.dependencies.includes(id)).map(milestone => milestone.id);
}

export function createMilestoneBuildPlan(
  milestones: readonly MilestoneDefinition[] = JARVIS_MILESTONES
): MilestoneBuildPlan {
  const milestoneIds = new Set<MilestoneId>(milestones.map(milestone => milestone.id));
  const completed = milestones.filter(milestone => milestone.status === 'completed').map(milestone => milestone.id);
  const completedSet = new Set<MilestoneId>(completed);

  validateMilestoneGraph(milestones, milestoneIds);

  const steps = milestones.map<MilestoneBuildStep>((milestone, index) => {
    const blockedBy = milestone.dependencies.filter(dependency => !completedSet.has(dependency));
    const isBuildable = milestone.status !== 'completed' && blockedBy.length === 0;

    return {
      ...milestone,
      sequence: index + 1,
      blockedBy,
      dependents: milestones.filter(candidate => candidate.dependencies.includes(milestone.id)).map(candidate => candidate.id),
      isBuildable
    };
  });

  return {
    steps,
    nextBuildable: steps.filter(step => step.isBuildable).map(step => step.id),
    completed,
    blocked: steps.filter(step => step.status !== 'completed' && step.blockedBy.length > 0).map(step => step.id)
  };
}

function validateMilestoneGraph(milestones: readonly MilestoneDefinition[], milestoneIds: ReadonlySet<MilestoneId>): void {
  for (const milestone of milestones) {
    for (const dependency of milestone.dependencies) {
      if (!milestoneIds.has(dependency)) {
        throw new Error(`Milestone ${milestone.id} depends on unknown milestone ${dependency}.`);
      }
    }
  }

  const visiting = new Set<MilestoneId>();
  const visited = new Set<MilestoneId>();

  const visit = (milestone: MilestoneDefinition): void => {
    if (visited.has(milestone.id)) return;
    if (visiting.has(milestone.id)) {
      throw new Error(`Milestone dependency graph contains a cycle at ${milestone.id}.`);
    }

    visiting.add(milestone.id);
    for (const dependency of milestone.dependencies) {
      visit(getMilestoneFromList(dependency, milestones));
    }
    visiting.delete(milestone.id);
    visited.add(milestone.id);
  };

  for (const milestone of milestones) {
    visit(milestone);
  }
}

function getMilestoneFromList(id: MilestoneId, milestones: readonly MilestoneDefinition[]): MilestoneDefinition {
  const milestone = milestones.find(candidate => candidate.id === id);
  if (!milestone) {
    throw new Error(`Unknown JARVIS milestone: ${id}`);
  }
  return milestone;
}
