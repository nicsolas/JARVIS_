import { describe, it, expect, beforeEach } from 'vitest';
import { JARVIS_MILESTONES, createMilestoneBuildPlan, getBlockedBy, getDependents } from '../src/index.js';

import {
  JarvisCore,
  TaskDifficulty,
  TaskRisk,
  TaskStatus,
  ExecutionRouteType,
  ModelRouter,
  ApprovalEngine,
  MockApprovalProvider,
  ToolRegistry,
  MockAIProvider,
  MockMemoryStore,
  Logger,
  SafeOpenAppTool,
  SafeMediaControlTool,
  SafeSystemStatsTool,
  SafeMockDeleteTool
} from '../src/index.js';

describe('JARVIS Core Milestone 1 Test Suite', () => {
  let core: JarvisCore;
  let toolRegistry: ToolRegistry;
  let mockAIProvider: MockAIProvider;
  let mockMemoryStore: MockMemoryStore;
  let mockApprovalProvider: MockApprovalProvider;
  let approvalEngine: ApprovalEngine;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('warn');
    toolRegistry = new ToolRegistry();
    toolRegistry.register(new SafeOpenAppTool());
    toolRegistry.register(new SafeMediaControlTool());
    toolRegistry.register(new SafeSystemStatsTool());
    toolRegistry.register(new SafeMockDeleteTool());

    mockAIProvider = new MockAIProvider();
    mockMemoryStore = new MockMemoryStore(0.72, 0.50);

    mockApprovalProvider = new MockApprovalProvider(true);
    approvalEngine = new ApprovalEngine(TaskRisk.HIGH, mockApprovalProvider);

    const modelRouter = new ModelRouter();

    core = new JarvisCore({
      modelRouter,
      approvalEngine,
      toolRegistry,
      memoryStore: mockMemoryStore,
      providers: [mockAIProvider],
      logger
    });
  });

  describe('1. Difficulty & Risk Separation', () => {
    it('should classify trivial difficulty and low risk for deterministic app command', async () => {
      const task = await core.processRequest('Open Spotify');

      expect(task.difficulty).toBe(TaskDifficulty.TRIVIAL);
      expect(task.risk).toBe(TaskRisk.LOW);
      expect(task.route?.type).toBe(ExecutionRouteType.DETERMINISTIC);
      expect(task.status).toBe(TaskStatus.COMPLETED);
    });

    it('should classify high difficulty and low risk for reasoning task ("Explain why this Rust program crashes")', async () => {
      const task = await core.processRequest('Explain why this Rust program crashes');

      expect(task.difficulty).toBe(TaskDifficulty.HIGH);
      expect(task.risk).toBe(TaskRisk.LOW);
      expect(task.route?.type).toBe(ExecutionRouteType.REASONING_CLOUD_MODEL);
      expect(task.requiresApproval).toBe(false);
      expect(task.status).toBe(TaskStatus.COMPLETED);
    });

    it('should classify low difficulty and high/critical risk for destructive deletion request ("Delete root directory")', async () => {
      const task = await core.processRequest('Delete root directory');

      expect(task.difficulty).toBe(TaskDifficulty.SIMPLE);
      expect(task.risk).toBe(TaskRisk.CRITICAL);
      expect(task.requiresApproval).toBe(true);
    });

    it('should verify that changing risk does NOT automatically change difficulty', async () => {
      const lowRiskCodeTask = await core.processRequest('Explain why this program crashes');
      const highRiskCodeTask = await core.processRequest('Delete directory with compiler logs');

      expect(lowRiskCodeTask.difficulty).toBe(TaskDifficulty.HIGH);
      expect(lowRiskCodeTask.risk).toBe(TaskRisk.LOW);

      expect(highRiskCodeTask.difficulty).toBe(TaskDifficulty.SIMPLE);
      expect(highRiskCodeTask.risk).toBe(TaskRisk.HIGH);
    });
  });

  describe('2. Deterministic Bypass Engine', () => {
    it('should execute deterministic tool without calling AI Provider', async () => {
      const task = await core.processRequest('Open Spotify');

      expect(task.route?.type).toBe(ExecutionRouteType.DETERMINISTIC);
      expect(task.result?.success).toBe(true);
      expect(task.result?.toolCallsExecuted).toHaveLength(1);
      expect(task.result?.toolCallsExecuted?.[0].toolId).toBe('sys.open_app');
    });

    it('should execute media control deterministically', async () => {
      const task = await core.processRequest('Play music');

      expect(task.route?.type).toBe(ExecutionRouteType.DETERMINISTIC);
      expect(task.result?.toolCallsExecuted?.[0].toolId).toBe('media.control');
    });
  });

  describe('3. Risk and Approval Engine', () => {
    it('should request approval for high-risk actions and execute if approved', async () => {
      mockApprovalProvider.setDefaultResponse(true);

      const task = await core.processRequest('Delete directory /tmp/test');

      expect(task.risk).toBe(TaskRisk.HIGH);
      expect(task.requiresApproval).toBe(true);
      expect(task.status).toBe(TaskStatus.COMPLETED);
    });

    it('should block execution and mark status CANCELLED if user denies approval', async () => {
      mockApprovalProvider.setDefaultResponse(false);

      const task = await core.processRequest('Delete directory /tmp/test');

      expect(task.requiresApproval).toBe(true);
      expect(task.status).toBe(TaskStatus.CANCELLED);
      expect(task.error?.code).toBe('CANCELLED_BY_USER');
      expect(task.result).toBeUndefined();
    });
  });

  describe('4. AI Provider Abstraction', () => {
    it('should complete non-deterministic request using MockAIProvider without paid keys', async () => {
      const task = await core.processRequest('Summarize today\'s project notes');

      expect(task.status).toBe(TaskStatus.COMPLETED);
      expect(task.route?.providerId).toBe('mock-provider');
      expect(typeof task.result?.output).toBe('string');
      expect(task.result?.output).toContain('[Mock AI Response');
    });
  });

  describe('5. Tool Registry & Execution Boundaries', () => {
    it('should register, validate parameters, and execute safe tools', async () => {
      const result = await toolRegistry.executeTool('sys.get_stats', {});

      expect(result).toHaveProperty('cpuUsagePct');
      expect(result).toHaveProperty('memoryFreeMb');
    });

    it('should throw ValidationError for unregistered tool', async () => {
      await expect(toolRegistry.executeTool('non.existent.tool', {})).rejects.toThrow('not found');
    });

    it('should throw ValidationError for invalid tool input', async () => {
      await expect(toolRegistry.executeTool('sys.open_app', { appName: '' })).rejects.toThrow('Invalid input');
    });
  });

  describe('6. Memory Store Interface & Thresholds', () => {
    it('should store and retrieve memories with reasoning vs surfacing distinction', async () => {
      await mockMemoryStore.store({
        content: 'User prefers dark mode UI and TypeScript',
        tier: 'preference',
        importance: 0.9,
        tags: ['preference', 'ui']
      });

      const reasoningResults = await mockMemoryStore.search({
        query: 'TypeScript',
        purpose: 'reasoning'
      });

      expect(reasoningResults).toHaveLength(1);
      expect(reasoningResults[0].score).toBeGreaterThanOrEqual(0.72);

      const surfacingResults = await mockMemoryStore.search({
        query: 'unrelated topic query',
        purpose: 'user_surface'
      });

      expect(surfacingResults).toHaveLength(0);
    });
  });
});

describe('JARVIS Milestone Roadmap', () => {
  it('defines all 20 milestones in dependency order', () => {
    expect(JARVIS_MILESTONES).toHaveLength(20);
    expect(JARVIS_MILESTONES[0].id).toBe('M1');
    expect(JARVIS_MILESTONES[19].id).toBe('M20');
    expect(getBlockedBy('M8')).toEqual(['M6', 'M7']);
    expect(getBlockedBy('M20')).toEqual(['M16', 'M18', 'M19']);
  });

  it('exposes downstream dependents for orchestration planning', () => {
    expect(getDependents('M1')).toEqual(expect.arrayContaining(['M2', 'M3', 'M9', 'M10', 'M11', 'M12', 'M13', 'M14']));
    expect(getDependents('M16')).toEqual(expect.arrayContaining(['M17', 'M20']));
  });

  it('creates an executable milestone-by-milestone build plan', () => {
    const plan = createMilestoneBuildPlan();

    expect(plan.completed).toEqual(expect.arrayContaining(['M1', 'M2', 'M3', 'M4', 'M5', 'M20']));
    expect(plan.steps).toHaveLength(20);
  });
});
