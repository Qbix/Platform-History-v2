'use strict';

self.addEventListener('push', function(event) {
	console.log('[Service Worker] Push Received.');
	var data = JSON.parse(event.data.text());
	const title = data.title;
	const options = {
		body: data.body,
		icon: data.icon,
		data: data
	};
	event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
	console.log('[Service Worker] Notification click Received.');
	event.notification.close();
	event.waitUntil(
		clients.openWindow(event.notification.data.click_action ? event.notification.data.click_action : '/')
	);
});