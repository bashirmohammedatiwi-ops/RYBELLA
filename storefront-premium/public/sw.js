self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Rybella', message: event.data?.text() || '' };
  }

  const title = data.title || 'Rybella';
  const options = {
    body: data.message || data.body || '',
    icon: '/assets/rybella-logo.png',
    badge: '/assets/rybella-logo.png',
    dir: 'rtl',
    lang: 'ar',
    tag: data.notificationId ? `rybella-${data.notificationId}` : 'rybella-notification',
    renotify: true,
    data: {
      url: data.url || '/notifications',
      notificationId: data.notificationId || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/notifications';
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(absoluteUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(absoluteUrl);
      return undefined;
    })
  );
});
