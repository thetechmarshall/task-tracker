// service-worker.js

self.addEventListener("install", (event) => {
	console.log("[Service Worker] Installed");
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	console.log("[Service Worker] Activated");
	return self.clients.claim();
});

self.addEventListener("push", (event) => {
	const data = event.data?.json() || {
		title: "Streak Buddy",
		body: "Complete your tasks!",
	};

	event.waitUntil(
		self.registration.showNotification(data.title, {
			body: data.body,
			icon: "./icons/icon-192.png",
			badge: "./icons/icon-72.png",
		})
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	event.waitUntil(
		clients
			.matchAll({ type: "window", includeUncontrolled: true })
			.then((clientList) => {
				for (const client of clientList) {
					if ("focus" in client) return client.focus();
				}
				if (clients.openWindow) return clients.openWindow("/");
			})
	);
});
