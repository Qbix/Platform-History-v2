importScripts('https://www.gstatic.com/firebasejs/4.1.3/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/4.1.3/firebase-messaging.js')


self.addEventListener('install', function(event) {
	console.log('Service Worker installing.');
});

self.addEventListener('activate', function(event) {
	console.log('Service Worker activating.');
});