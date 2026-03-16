const CACHE_NAME = 'the-system-v3';
const ASSETS = ['./', './index.html', './manifest.json', './icon.jpg'];
const NOTIFICATION_HOURS = [7, 12, 16, 18, 22];

const MESSAGES = [
  { title: "⚔️ Système de quête activé", body: "Tes missions t'attendent, Chasseur. Coche tes habitudes !" },
  { title: "🗡️ Rappel du Monarque", body: "Un vrai chasseur ne laisse pas ses habitudes en attente." },
  { title: "⚡ Alerte XP disponible", body: "Des points t'attendent ! Va cocher tes habitudes." },
  { title: "🔥 Maintiens ton streak !", body: "Ne brise pas ta série. Tes habitudes t'appellent." },
  { title: "🏆 Mission du jour", body: "Il est temps de progresser vers le Rang S !" },
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).catch(() => caches.match('./index.html')))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATIONS') {
    scheduleNextNotification();
  }
});

function scheduleNextNotification() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  let nextHour = null;
  for (const hour of NOTIFICATION_HOURS) {
    if (hour > currentHour || (hour === currentHour && currentMinute < 1)) { nextHour = hour; break; }
  }
  if (nextHour === null) nextHour = NOTIFICATION_HOURS[0];
  const next = new Date();
  next.setHours(nextHour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const delay = next.getTime() - now.getTime();
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  setTimeout(() => {
    self.registration.showNotification(msg.title, {
      body: msg.body, icon: './icon.jpg', badge: './icon.jpg',
      vibrate: [200, 100, 200], tag: 'habit-reminder', renotify: true,
      actions: [{ action: 'open', title: '✅ Ouvrir' }, { action: 'dismiss', title: 'Plus tard' }]
    });
    scheduleNextNotification();
  }, delay);
}

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow('./index.html');
      })
    );
  }
});
