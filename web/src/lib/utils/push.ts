// web/src/lib/utils/push.ts

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

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
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported');
    return;
  }

  try {
    const swRegistration = await navigator.serviceWorker.register('/sw.js');
    let subscription = await swRegistration.pushManager.getSubscription();

    if (subscription === null) {
      subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      });
    }
    
    // Send subscription to the backend
    await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Include auth token if needed
        },
        body: JSON.stringify(subscription),
    });

  } catch (error) {
    console.error('Failed to subscribe the user: ', error);
  }
}
