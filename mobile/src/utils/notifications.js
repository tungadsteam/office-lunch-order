// mobile/src/utils/notifications.js
import * as Notifications from 'expo-notifications';
import api from '../services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
  
  token = (await Notifications.getExpoPushTokenAsync()).data;
  
  // POST the token to your backend
  try {
      // You'll need a different endpoint/logic for Expo tokens
    await api.post('/subscribe-expo', { token });
  } catch(e) {
      console.error("Failed to send Expo token to server", e);
  }

  return token;
}
