const CACHE_NAME = 'habits-tracker-v1';
const NOTIFICATION_HOURS = [7, 12, 16, 18, 22];

const MESSAGES = [
  { title: "⚔️ Système de quête activé", body: "Tes missions t'attendent, Chasseur. Coche tes habitudes !" },
  { title: "🗡️ Rappel du Monarque", body: "Un vrai chasseur ne laisse pas ses habitudes en attente." },
  { title: "⚡ Alerte XP disponible", body: "Des points t'attendent ! Va cocher tes habitudes." },
  { title: "🔥 Maintiens ton streak !", body: "Ne brise pas ta série. Tes habitudes t'appellent." },
  { title: "🏆 Mission du jour", body: "Il est temps de progresser vers le Rang S !" },
];

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
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
    if (hour > currentHour || (hour === currentHour && currentMinute < 1)) {
      nextHour = hour;
      break;
    }
  }

  if (nextHour === null) {
    nextHour = NOTIFICATION_HOURS[0];
  }

  const next = new Date();
  next.setHours(nextHour, 0, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  const delay = next.getTime() - now.getTime();
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  setTimeout(() => {
    self.registration.showNotification(msg.title, {
      body: msg.body,
      icon: './icon.jpg',
      badge: './icon.jpg',
      vibrate: [200, 100, 200],
      tag: 'habit-reminder',
      renotify: true,
      actions: [
        { action: 'open', title: '✅ Ouvrir le tracker' },
        { action: 'dismiss', title: 'Plus tard' }
      ]
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
          if (client.url.includes('habits-tracker') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('./index.html');
        }
      })
    );
  }
});
