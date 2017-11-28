'use strict';

self.addEventListener('push', function (event) {
	console.log('[Service Worker] Push Received.');
	var data = JSON.parse(event.data.text());
	const title = data.title;
	var options = Object.assign({
		body: data.body,
		data: data
	}, data);
	if (options.requireInteraction === undefined) {
		options.requireInteraction = true;
	}
	send_message_to_all_clients(data);
	event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
	var data = event.notification.data;
	console.log('[Service Worker] Notification click Received.');
	event.notification.close();
	if (data.url) {
		event.waitUntil(clients.openWindow(data.url));
	}
	data.wasClicked = true;
	send_message_to_all_clients(event.notification.data);
});

function send_message_to_all_clients(msg) {
	self.clients.matchAll({includeUncontrolled: true, type: 'window'}).then(function(all) {
		all.forEach(function(client) {
			client.postMessage(msg);
		});
	});
}