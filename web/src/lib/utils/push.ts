// web/src/lib/utils/push.ts

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPushNotifications() {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('VAPID public key not configured');
    return;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported');
    return;
  }

  // Check if notification permission is already denied
  if (Notification.permission === 'denied') {
    console.warn('Push notifications are blocked by user');
    return;
  }

  try {
    const swRegistration = await navigator.serviceWorker.register('/sw.js');
    // Wait for SW to be ready
    await navigator.serviceWorker.ready;

    let subscription = await swRegistration.pushManager.getSubscription();

    if (!subscription) {
      // Request permission and subscribe
      subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Send subscription to backend API with auth token
    const token = localStorage.getItem('auth_token');
    if (!token) return; // Not logged in yet

    await fetch(`${API_BASE_URL}/api/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(subscription),
    });

    console.log('✅ Push subscription registered');
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
  }
}
