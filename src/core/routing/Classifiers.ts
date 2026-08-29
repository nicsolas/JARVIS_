import { TaskDifficulty, TaskRisk } from '../task/types.js';

export class DifficultyClassifier {
  /**
   * Evaluates task difficulty (intelligence / reasoning required) independently of risk.
   */
  classify(input: string, isDeterministicCommand: boolean): TaskDifficulty {
    if (isDeterministicCommand) {
      return TaskDifficulty.TRIVIAL; // 1
    }

    const lower = input.toLowerCase();

    // High / Complex difficulty patterns
    if (
      lower.includes('explain why') ||
      lower.includes('debug') ||
      lower.includes('refactor') ||
      lower.includes('architecture') ||
      lower.includes('compile error') ||
      lower.includes('crash') ||
      lower.includes('solve')
    ) {
      if (lower.includes('architecture') || lower.includes('refactor full')) {
        return TaskDifficulty.COMPLEX; // 5
      }
      return TaskDifficulty.HIGH; // 4
    }

    // Moderate difficulty patterns
    if (
      lower.includes('summarize') ||
      lower.includes('translate') ||
      lower.includes('compare') ||
      lower.includes('draft')
    ) {
      return TaskDifficulty.MODERATE; // 3
    }

    // Default simple query
    return TaskDifficulty.SIMPLE; // 2
  }
}

export class RiskClassifier {
  /**
   * Evaluates task risk (potential system impact / destruction) independently of difficulty.
   */
  classify(input: string, toolRiskOverride?: TaskRisk): TaskRisk {
    if (toolRiskOverride) {
      return toolRiskOverride;
    }

    const lower = input.toLowerCase();

    // Critical risk patterns
    if (
      lower.includes('deploy production') ||
      lower.includes('format disk') ||
      lower.includes('drop database') ||
      lower.includes('sudo rm -rf') ||
      lower.includes('delete root')
    ) {
      return TaskRisk.CRITICAL; // 5
    }

    // High risk patterns
    if (
      lower.includes('delete') ||
      lower.includes('remove directory') ||
      lower.includes('overwrite file') ||
      lower.includes('kill process') ||
      lower.includes('drop table')
    ) {
      return TaskRisk.HIGH; // 4
    }

    // Moderate risk patterns
    if (
      lower.includes('write file') ||
      lower.includes('update config') ||
      lower.includes('install package')
    ) {
      return TaskRisk.MODERATE; // 3
    }

    // Minor risk patterns
    if (lower.includes('set preference') || lower.includes('cache update')) {
      return TaskRisk.MINOR; // 2
    }

    // Default low risk
    return TaskRisk.LOW; // 1
  }
}
