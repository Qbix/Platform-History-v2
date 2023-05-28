<?php

function Q_serviceWorker_response_js()
{
    header("Content-Type: text/javascript");

	$cookies_json = Q::json_encode(Q_Response::$cookies);

    echo <<<JAVASCRIPT

/**
 * Qbix Platform ServiceWorker script.
 * This script is rendered by all plugins on the server by PHP.
 */

(function () {
    // This anonymous closure is not accessible from outside.
	// It contains code to read, store and attach cookie-like
	// Cookie-JS request headers, and Set-Cookie-JS response headers.

	var cookies = $cookies_json;

	self.addEventListener('fetch', function (event) {
		// if request is not for same origin, then just send it
		var url = new URL(event.request.url);
		if (url.origin !== self.location.origin) {
			return event.respondWith(fetch(event.request));
		}
		// otherwise, attach some headers
		console.log(event.request.url);
	});
})();

var Q = {};

/**
 * Functions related to IndexedDB, when it is available
 * @class Q.IndexedDB
 * @constructor
 * @param {String} uriString
 */
Q.IndexedDB = {
	/**
	 * Creates or uses an existing database and object store name.
	 * @static
	 * @method open
	 * @param {String} dbName The name of the database
	 * @param {String} storeName The name of the object store name inside the database
	 * @param {String} keyPath The key path inside the object store
	 * @param {Function} callback Receives (error, ObjectStore)
	 * @param {Number} [version=1] The version of the database to open
	 */
	open: function (dbName, storeName, keyPath, callback, version) {
		if (!root.indexedDB) {
			return false;
		}
		var open = indexedDB.open(dbName, version || 1);
		open.onupgradeneeded = function() {
			var db = open.result;
			var store = db.createObjectStore(storeName, {keyPath: keyPath});
		};
		open.onerror = function (event) {
			callback && callback(event);
		};
		open.onsuccess = function() {
			// Start a new transaction
			var db = open.result;
			var tx = db.transaction(storeName, "readwrite");
			var store = tx.objectStore(storeName);
			callback && callback(null, store);
			// Close the db when the transaction is done
			tx.oncomplete = function() {
				db.close();
			};
		}
	},
	put: function (store, value, onSuccess, onError) {
		if (!onError) {
			onError = function () {
				throw new Q.Error("Q.IndexedDB.put error:" + request.errorCode);
			}
		}
		var request = store.put(value);
		request.onsuccess = onSuccess;
		request.onError = onError;
	},
	get: function (store, key, onSuccess, onError) {
		if (!onError) {
			onError = function () {
				throw new Q.Error("Q.IndexedDB.get error:" + request.errorCode);
			}
		}
		var request = store.get(key);
		request.onsuccess = function (event) {
			Q.handle(onSuccess, Q.IndexedDB, [event.target.result, event]);
		};
		request.onError = onError;
	}
};

/************************************************
 * Below, Qbix Platform plugins have a chance to 
 * add their own code to this service worker by
 * adding hooks after the "Q/serviceWorker" event.
 ************************************************/

JAVASCRIPT;

	// Give a chance for other hooks to output some code.
	Q::event("Q/serviceWorker", array(), 'after');

	// TODO: output the other service worker code here from plugins
	// TODO: output the httponly cookies in the service worker, inside a closure
	// and use it to sign things.
	// TODO: also send the httponly cookies again on every request,
	// TODO: listen to Set-Cookie-JS headers and update cookies
	// Every time the script is reloaded, it will get the latest cookies.
	// And then Set-Cookie-JS will set the cookies there.
	// Notice that other sites won't be able to get this,
	// make sure that CORS headers do NOT include access-control-allow-origin

    return false;
}