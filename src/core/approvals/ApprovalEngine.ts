import { TaskRisk, getRiskWeight } from '../task/types.js';

export type ApprovalLevel = 'AUTO_EXECUTE' | 'CONFIRMATION_REQUIRED' | 'STEP_UP_APPROVAL';

export interface ApprovalDecision {
  allowed: boolean;
  requiresApproval: boolean;
  approvalLevel: ApprovalLevel;
  reason: string;
}

export interface IApprovalProvider {
  /**
   * Challenge user for confirmation/biometrics if approval is required.
   */
  requestUserApproval(
    taskId: string,
    actionDescription: string,
    approvalLevel: ApprovalLevel
  ): Promise<boolean>;
}

export class MockApprovalProvider implements IApprovalProvider {
  private defaultResponse: boolean;

  constructor(defaultResponse = true) {
    this.defaultResponse = defaultResponse;
  }

  setDefaultResponse(response: boolean): void {
    this.defaultResponse = response;
  }

  async requestUserApproval(
    _taskId: string,
    _actionDescription: string,
    _approvalLevel: ApprovalLevel
  ): Promise<boolean> {
    return this.defaultResponse;
  }
}

export class ApprovalEngine {
  private riskThreshold: TaskRisk;
  private approvalProvider: IApprovalProvider;

  constructor(
    riskThreshold: TaskRisk = TaskRisk.HIGH,
    approvalProvider: IApprovalProvider = new MockApprovalProvider()
  ) {
    this.riskThreshold = riskThreshold;
    this.approvalProvider = approvalProvider;
  }

  evaluatePolicy(risk: TaskRisk, actionDescription: string): ApprovalDecision {
    const numericRisk = getRiskWeight(risk);
    const numericThreshold = getRiskWeight(this.riskThreshold);

    if (risk === TaskRisk.CRITICAL) {
      return {
        allowed: false,
        requiresApproval: true,
        approvalLevel: 'STEP_UP_APPROVAL',
        reason: `Action "${actionDescription}" classified as CRITICAL risk. Explicit step-up authorization required.`
      };
    }

    if (numericRisk >= numericThreshold) {
      return {
        allowed: false,
        requiresApproval: true,
        approvalLevel: 'CONFIRMATION_REQUIRED',
        reason: `Action "${actionDescription}" classified as HIGH risk (Risk level ${risk}). User confirmation required.`
      };
    }

    return {
      allowed: true,
      requiresApproval: false,
      approvalLevel: 'AUTO_EXECUTE',
      reason: `Action "${actionDescription}" classified as LOW/MODERATE risk. Auto-execution granted.`
    };
  }

  async processApproval(
    taskId: string,
    actionDescription: string,
    decision: ApprovalDecision
  ): Promise<boolean> {
    if (!decision.requiresApproval) {
      return true;
    }

    return await this.approvalProvider.requestUserApproval(
      taskId,
      actionDescription,
      decision.approvalLevel
    );
  }
}
