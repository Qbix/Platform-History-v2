'use strict';

self.addEventListener('activate', function (event) {
	event.waitUntil(clients.claim());
});

self.addEventListener('push', function (event) {
	let data = JSON.parse(event.data.text());
	console.log('[Service Worker] Push received');
	if (data.update) {
		// force service worker to update via push
		self.registration.update().then(() => console.log('[Service Worker] Updated'));
		return;
	}

	let options = Object.assign({
		body: data.body,
		data: data
	}, data);

	data.requireInteraction = !!data.requireInteraction;

	if (data.collapseId) {
		options.tag = data.collapseId;
	}

	sendMessageToAllClients({
		Q: {
			notification: {
				received: data
			}
		}
	});

	event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function (event) {
	let data = event.notification.data;
	console.log('[Service Worker] Notification click Received.');
	event.notification.close();
	if (data.url) {
		event.waitUntil(clients.openWindow(data.url));
	}
	var payload = Object.assign({}, event.notification.data, {
		action: event.action
	});
	sendMessageToAllClients({
		Q: {
			notification: {
				clicked: payload
			}
		}
	});
});

function sendMessageToAllClients(msg) {
	self.clients.matchAll({includeUncontrolled: true, type: 'window'})
	.then(function(all) {
		all.forEach(function(client) {
			client.postMessage(msg);
		});
	});
}