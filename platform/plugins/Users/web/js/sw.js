importScripts('https://www.gstatic.com/firebasejs/4.1.3/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/4.1.3/firebase-messaging.js');

var baseName = "qbix_db",
	storeName = "qbix_store";

function connectDB(f){
	var request = indexedDB.open(baseName, 1);
	request.onerror = function (err) {
		console.warn(err);
	};
	request.onsuccess = function(){
		f(request.result);
	};
	request.onupgradeneeded = function(e){
		e.currentTarget.result.createObjectStore(storeName, { keyPath: "id" });
		connectDB(f);
	}
}

// save config
function saveConfig(conf, callback) {
	connectDB(function(db){
		var request = db.transaction([storeName], "readwrite").objectStore(storeName).put({id: 'config', config: conf});
		request.onerror = function (err) {
			console.warn(err);
		};
		request.onsuccess = function(){
			callback();
			return request.result;
		}
	});
}

// get config
function getConfig() {
	return new Promise(function(resolve, reject){
		connectDB(function(db){
			var request = db.transaction([storeName], "readonly").objectStore(storeName).get('config');
			request.onerror = function (err) {
				console.warn(err);
				reject(err);
			};
			request.onsuccess = function(){
				console.log("Get config");
				resolve(request.result ? request.result : -1);
			}
		});
	});

}

function initializeFirebase(config) {
	if (firebase.apps.length) {
		return firebase.messaging();
	}
	firebase.initializeApp(config);
	messaging = firebase.messaging();
	return messaging;
}

self.addEventListener('push', function(event) {
	var getConf = getConfig().then(function(val) {
		var config = val.config;
		if (config) {
			var payload = JSON.parse(event.data.text());
			return self.registration.showNotification(payload.notification.title, {
				title: payload.notification.title,
				body: payload.notification.body
			})
		}
		return false;
	});
	event.waitUntil(getConf);
});

self.addEventListener('message', function(event) {
	var data = JSON.parse(event.data);
	if (data.config) {
		initializeFirebase(data.config);
		saveConfig(data.config, function() {
			console.log('Saved config');
		});
	}
});