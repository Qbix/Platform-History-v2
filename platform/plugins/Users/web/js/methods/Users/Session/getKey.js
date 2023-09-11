Q.exports(function (Users, priv) {

    /**
	 * Methods for user sessions
     * @module Users
	 * @class Users.Session
	 */
    /**
     * Get (or get again) the (non-extractable) cryptographic key from IndexedDB.
     * Saves this key also as Users.Session.key.loaded and then calls the callback.
     * @method getKey
     * @static
     * @param {Function} callback Receives (err, key)
     */
    return function Users_Session_getKey(callback) {
        Q.IndexedDB.open(Q.info.baseUrl, 'Q.Users.keys', 'id', function (err, store) {
            if (err) {
                return Q.handle(callback, null, [err]);
            }
            var request = store.get('Users.Session');
            request.onsuccess = function (event) {
                var key = Users.Session.key.loaded = event.target.result.key;
                Q.handle(callback, null, [null, key]);
            };
            request.onerror = function (event) {
                Q.handle(callback, null, [event]);
            };
        });
    };
});