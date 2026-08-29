export interface MobilePushNotification {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export class ReactNativeMobileEngine {
  async registerPushToken(): Promise<string> {
    return 'expo-push-token-mock-12345';
  }

  async sendPushNotification(notification: MobilePushNotification): Promise<boolean> {
    if (!notification.title) return false;
    return true;
  }
}
