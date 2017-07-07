importScripts('https://www.gstatic.com/firebasejs/4.1.3/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/4.1.3/firebase-messaging.js');

var messaging;

/*
self.addEventListener('install', function(event) {
	console.log('Service Worker installing.');
	console.log("this is mess:", mess);
});

self.addEventListener('activate', function(event) {
	console.log('Service Worker activating.');
});
*/

self.addEventListener('message', function(event) {

	var data = JSON.parse(event.data);
	// try to get SW config and check if firebase is already initialized
	if (data.config && !firebase.apps.length) {
		firebase.initializeApp(data.config);
		messaging = firebase.messaging();
	}

});