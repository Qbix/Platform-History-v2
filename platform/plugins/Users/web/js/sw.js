'use strict';

/* eslint-disable max-len */

const applicationServerPublicKey = 'BOguNVi0YQqwOCBoZj7ayDzSIROcNQ41p092ElgYoTRaxirDeAc5qhllVfJ7_o8IiIiYkyKvtyvacyPzR0pLPUU';

/* eslint-enable max-len */

function urlB64ToUint8Array(base64String) {
	const padding = '='.repeat((4 - base64String.length % 4) % 4);
	const base64 = (base64String + padding)
		.replace(/\-/g, '+')
		.replace(/_/g, '/');

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (var i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

self.addEventListener('push', function(event) {
	console.log('[Service Worker] Push Received.');
	var data = JSON.parse(event.data.text());
	const title = data.title;
	const options = {
		body: data.body,
		icon: data.icon
	};

	event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
	console.log('[Service Worker] Notification click Received.');

	event.notification.close();

	event.waitUntil(
		clients.openWindow('https://developers.google.com/web/')
	);
});

self.addEventListener('pushsubscriptionchange', function(event) {
	console.log('[Service Worker]: \'pushsubscriptionchange\' event fired.');
	const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
	event.waitUntil(
		self.registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: applicationServerKey
		})
			.then(function(newSubscription) {
				// TODO: Send to application server
				console.log('[Service Worker] New subscription: ', newSubscription);
			})
	);
});
