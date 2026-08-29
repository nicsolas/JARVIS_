import { VectorMemoryEngine } from '../memory/engine/VectorMemoryEngine.js';

export interface UserPreference {
  key: string;
  value: unknown;
  confidence: number;
}

export class PersonalIntelligenceEngine {
  private memoryEngine: VectorMemoryEngine;
  private preferences: Map<string, UserPreference> = new Map();

  constructor(memoryEngine: VectorMemoryEngine) {
    this.memoryEngine = memoryEngine;
  }

  async learnPreference(key: string, value: unknown, confidence = 0.9): Promise<UserPreference> {
    const pref: UserPreference = { key, value, confidence };
    this.preferences.set(key, pref);
    await this.memoryEngine.store({
      content: `User preference learned: ${key} = ${JSON.stringify(value)}`,
      tier: 'preference',
      importance: confidence
    });
    return pref;
  }

  getPreference(key: string): UserPreference | undefined {
    return this.preferences.get(key);
  }
}
