
// Push Notification Handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const { title, body, icon, badge, data, actions } = payload;

    const options = {
      body,
      icon: icon || '/icons/android-chrome-192x192.png',
      badge: badge || '/icons/badge.png', // We should make sure this exists or fallback
      vibrate: [100, 50, 100],
      data: {
        ...data,
        timestamp: Date.now(),
      },
      actions: actions || [],
      tag: data?.eventId || 'default', // Group notifications by eventId if provided
      renotify: true,
      requireInteraction: true,
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there is already a window open with this URL
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle Service Worker Internal Messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
