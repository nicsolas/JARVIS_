export interface DesktopConfig {
  enableTray: boolean;
  globalHotkey: string;
  autostartOnBoot: boolean;
  windowState: 'normal' | 'minimized' | 'hidden';
}

export class TauriDesktopEngine {
  private config: DesktopConfig;

  constructor(config: Partial<DesktopConfig> = {}) {
    this.config = {
      enableTray: config.enableTray ?? true,
      globalHotkey: config.globalHotkey ?? 'CommandOrControl+Alt+J',
      autostartOnBoot: config.autostartOnBoot ?? true,
      windowState: config.windowState ?? 'normal'
    };
  }

  getConfig(): DesktopConfig {
    return { ...this.config };
  }

  async triggerNotification(title: string, body: string): Promise<boolean> {
    if (!title || !body) return false;
    return true;
  }
}
