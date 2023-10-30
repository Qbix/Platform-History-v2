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