import Constants from 'expo-constants';
import { Platform } from 'react-native';

let Device: any = null;
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch {
  // expo-notifications / expo-device native modules are unavailable in this environment
}

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function getPushTokenAsync() {
  if (!Notifications || !Device?.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId;

  if (!projectId) {
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('Expo push token:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

async function registerPushToken(username: string, deviceType?: string, company?: string) {
  const baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
  if (!baseUrl) {
    return false;
  }

  const token = await getPushTokenAsync();
  if (!token) {
    return false;
  }

  try {
    const response = await fetch(`${baseUrl}/notifications/register-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        deviceToken: token,
        deviceType: deviceType || Platform.OS,
        company,
      }),
    });

    const result = await response.json();
    console.log('Push token registration result:', result);
    return result.success;
  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
}

async function registerPushTokenAsync(username: string, deviceType?: string, company?: string) {
  return registerPushToken(username, deviceType, company);
}

async function getNotifications(user: string): Promise<any[]> {
  const baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
  if (!baseUrl) {
    console.warn('API URL not configured for notifications');
    return [];
  }

  const url = `${baseUrl}/notification/get-notifications?user=${encodeURIComponent(user)}`;
  // console.log('Fetching notifications from:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const text = await response.text();

    try {
      const result = JSON.parse(text);
      if (result.success) {
        return result.notifications || [];
      }
      return [];
    } catch (parseError) {
      console.error('Failed to parse notification response as JSON:', parseError);
      return [];
    }
  } catch (error) {
    // console.error('Error fetching notifications:', error);
    return [];
  }
}

async function acknowledgeNotification(user: string, rowId: number): Promise<boolean> {
  const baseUrl = Constants.expoConfig?.extra?.apiUrl || '';
  if (!baseUrl) {
    console.warn('API URL not configured for acknowledging notification');
    return false;
  }

  const url = `${baseUrl}/notification/acknowledge?user=${encodeURIComponent(user)}&rowId=${encodeURIComponent(rowId)}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const text = await response.text();

    try {
      const result = JSON.parse(text);
      return result.success && result.acknowledged;
    } catch (parseError) {
      console.error('Failed to parse acknowledge response as JSON:', parseError);
      return false;
    }
  } catch (error) {
    console.error('Error acknowledging notification:', error);
    return false;
  }
}

export const notificationService = {
  getPushTokenAsync,
  registerPushToken,
  registerPushTokenAsync,
  getNotifications,
  acknowledgeNotification,
};
