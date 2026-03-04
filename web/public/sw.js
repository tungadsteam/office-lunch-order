// web/public/sw.js
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192.png', // Assuming you have icons
    badge: '/badge.png',
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
