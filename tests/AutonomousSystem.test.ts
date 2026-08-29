import { describe, it, expect } from 'vitest';
import { VectorMemoryEngine } from '../src/memory/engine/VectorMemoryEngine.js';
import { PersonalIntelligenceEngine } from '../src/intelligence/PersonalIntelligenceEngine.js';
import { MultiAgentOrchestrator } from '../src/agents/orchestrator/MultiAgentOrchestrator.js';
import { AutonomousWorkspaceEngine } from '../src/workspace/AutonomousWorkspaceEngine.js';
import { DistributedAgentPool } from '../src/distributed/DistributedAgentPool.js';
import { SecurityHardeningEngine } from '../src/security/SecurityHardeningEngine.js';

describe('M15-M20 Autonomous Mode & Intelligence Suite', () => {
  it('should learn user preferences and consolidate into long term memory', async () => {
    const memory = new VectorMemoryEngine();
    const intelligence = new PersonalIntelligenceEngine(memory);
    await intelligence.learnPreference('editor', 'vscode');

    expect(intelligence.getPreference('editor')?.value).toBe('vscode');
  });

  it('should create autonomous workspace projects with multi-agent execution', async () => {
    const orchestrator = new MultiAgentOrchestrator();
    const workspace = new AutonomousWorkspaceEngine(orchestrator);

    const project = await workspace.createAndExecuteProject('Build Private Personal AI', [
      { title: 'Core Design', role: 'architect' },
      { title: 'Backend Engine', role: 'backend', deps: ['task_1'] }
    ]);

    expect(project.status).toBe('completed');
  });

  it('should manage external agent pool (Jules) and secure credential vault', async () => {
    const pool = new DistributedAgentPool();
    pool.registerNode({
      id: 'jules-worker-1',
      name: 'Jules External Coding Agent',
      type: 'jules-agent',
      endpoint: 'http://localhost:8080',
      isAvailable: true
    });

    const res = await pool.dispatchExternalJob('jules-worker-1', { action: 'code_review' });
    expect(res.success).toBe(true);

    const security = new SecurityHardeningEngine();
    security.storeSecret('API_KEY', 'secret_value');
    expect(security.getSecret('API_KEY')).toBe('secret_value');
  });
});
