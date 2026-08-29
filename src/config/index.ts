import { LogLevel } from '../logging/index.js';

export interface JarvisConfig {
  env: 'development' | 'production' | 'test';
  logLevel: LogLevel;
  memory: {
    activationThreshold: number;
    suppressionThreshold: number;
  };
  approvals: {
    defaultRequireApprovalRiskThreshold: number;
  };
  providers: {
    ollamaBaseUrl: string;
    anthropicApiKey?: string;
    openaiApiKey?: string;
  };
}

export function loadConfig(overrides?: Partial<JarvisConfig>): JarvisConfig {
  const env = (process.env.JARVIS_ENV as JarvisConfig['env']) || 'development';
  const logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

  const activationThreshold = parseFloat(process.env.MEMORY_ACTIVATION_THRESHOLD || '0.72');
  const suppressionThreshold = parseFloat(process.env.MEMORY_SUPPRESSION_THRESHOLD || '0.50');
  const defaultRequireApprovalRiskThreshold = parseInt(
    process.env.DEFAULT_REQUIRE_APPROVAL_RISK_THRESHOLD || '4',
    10
  );

  return {
    env,
    logLevel,
    memory: {
      activationThreshold,
      suppressionThreshold
    },
    approvals: {
      defaultRequireApprovalRiskThreshold
    },
    providers: {
      ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY
    },
    ...overrides
  };
}
