const CACHE_NAME = "optima-v1.1";

const ASSETS_TO_CACHE = [
	"/", 
	"index.html",
	"app.js",
	"manifest.json",
	"icons/icon-192.png",
	"icons/icon-512.png",
	"icons/icon-72.png",
	"https://cdn.tailwindcss.com", 
];

// --- INSTALL Event ---
// This runs when the service worker is first installed.
// It opens the cache and adds all the essential files to it.
self.addEventListener("install", (event) => {
	console.log("[Service Worker] Install");
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			console.log("[Service Worker] Caching all assets");
			return cache.addAll(ASSETS_TO_CACHE);
		})
	);
	self.skipWaiting(); // Forces the waiting service worker to become the active one.
});

// --- ACTIVATE Event ---
// This runs after the install event. It's used to clean up old caches.
self.addEventListener("activate", (event) => {
	console.log("[Service Worker] Activate");
	event.waitUntil(
		caches.keys().then((keyList) => {
			return Promise.all(
				keyList.map((key) => {
					if (key !== CACHE_NAME) {
						console.log("[Service Worker] Removing old cache:", key);
						return caches.delete(key);
					}
				})
			);
		})
	);
	return self.clients.claim(); // Makes the service worker take control of the page immediately.
});

// --- FETCH Event ---
// This runs every time the app makes a network request (e.g., for a file or an image).
// It checks the cache first, and if the file is there, serves it from the cache.
// If not, it fetches it from the network. This is what makes the app work offline.
self.addEventListener("fetch", (event) => {
	event.respondWith(
		caches.match(event.request).then((response) => {
			return response || fetch(event.request);
		})
	);
});

// --- PUSH NOTIFICATION Events ---

self.addEventListener("push", (event) => {
	const data = event.data?.json() || {
		title: "Optima",
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
