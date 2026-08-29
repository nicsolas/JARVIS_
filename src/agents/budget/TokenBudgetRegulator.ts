export interface TokenBudgetConfig {
  maxTokensPerTask: number;
  maxTokensPerAgent: number;
  costLimitUsd: number;
}

export class TokenBudgetRegulator {
  private config: TokenBudgetConfig;
  private agentUsage: Map<string, number> = new Map();
  private totalCostUsd = 0;

  constructor(config: Partial<TokenBudgetConfig> = {}) {
    this.config = {
      maxTokensPerTask: config.maxTokensPerTask || 100000,
      maxTokensPerAgent: config.maxTokensPerAgent || 500000,
      costLimitUsd: config.costLimitUsd || 50.0
    };
  }

  canConsume(agentId: string, estimatedTokens: number, estimatedCostUsd = 0): boolean {
    const currentUsage = this.agentUsage.get(agentId) || 0;
    if (currentUsage + estimatedTokens > this.config.maxTokensPerAgent) return false;
    if (this.totalCostUsd + estimatedCostUsd > this.config.costLimitUsd) return false;
    return true;
  }

  recordConsumption(agentId: string, tokensUsed: number, costUsd = 0): void {
    const currentUsage = this.agentUsage.get(agentId) || 0;
    this.agentUsage.set(agentId, currentUsage + tokensUsed);
    this.totalCostUsd += costUsd;
  }

  getAgentUsage(agentId: string): number {
    return this.agentUsage.get(agentId) || 0;
  }
}
