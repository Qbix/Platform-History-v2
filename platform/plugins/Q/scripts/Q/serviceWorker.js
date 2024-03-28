/**
 * Functions related to IndexedDB, when it is available
 * @class Q.IndexedDB
 * @constructor
 * @param {String} uriString
 */
Q.IndexedDB = {
	open: function (dbName, storeName, params, callback) {
		var keyPath = (typeof params === 'string' ? params : params.keyPath);
		var version = undefined;
		var open = indexedDB.open(dbName, version);
		var _triedAddingObjectStore = false;
		open.onupgradeneeded = function() {
			var db = this.result;
			if (!db.objectStoreNames.contains(storeName)
			&& !_triedAddingObjectStore) {
				_triedAddingObjectStore = true;
				var store = db.createObjectStore(storeName, {keyPath: keyPath});
				var idxs = params.indexes;
				if (idxs) {
					for (var i=0, l=idxs.length; i<l; ++i) {
						store.createIndex(idxs[i][0], idxs[i][1], idxs[i][2]);
					}
				}
			}
		};
		open.onerror = function (error) {
			callback && callback.call(Q.IndexedDB, error);
		};
		open.onsuccess = function() {
			var db = this.result;
			version = db.version;
			if (!db.objectStoreNames.contains(storeName)) {
				// need to upgrade version and add this store
				++version;
				db.close();
				var o = indexedDB.open(dbName, version);
				Q.take(open, ['onupgradeneeded', 'onerror', 'onsuccess'], o);
				return;
			}
			// Start a new transaction
			var tx = db.transaction(storeName, "readwrite");
			var store = tx.objectStore(storeName);
			callback && callback.call(Q.IndexedDB, null, store);
			// Close the db when the transaction is done
			tx.oncomplete = function() {
				db.close();
			};
		};
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