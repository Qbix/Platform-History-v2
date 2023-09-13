Q.exports(function (Users, priv) {

    /**
     * Users plugin's front end code
     *
     * @module Users
     * @class Users
     */

	/**
	 * Copies and signs a given payload using Users.signature (see that function).
	 * Inserts the signature, publilc key and field under the field whose name is
	 * stored in Users.signatures.sigField
	 * @param {Object} payload 
	 * @param {Function} callback Receives err, fields with the signed payload,
	 *  expanded with a field named after Users.signature.sigField, containing the keys
	 *  "signature", "publicKey" and "fieldNames".
	 * @param {Object} options
	 * @param {Object} [options.key] Set the key to use, to sign the payload with
	 * @param {Array} [options.fieldNames] The names of the fields from the payload to sign, otherwise signs all.
	 */
	return function Users_sign(payload, callback, options) {
		var fields = Q.copy(payload);
		Users.signature(fields, function (err, signature, key) {
			if (err) {
				return callback && callback(err);
			}
			if (options.key) {
				crypto.subtle.exportKey('spki', key.publicKey)
				.then(function (pk) {
					var key_hex = Array.prototype.slice.call(
						new Uint8Array(pk), 0
					).toHex();
					_proceed(key_hex);
				});
			} else if (Users.Session.publicKey) {
				_proceed(Users.Session.publicKey);
			} else {
				return callback("Users.sign: User.Session.publicKey missing");
			}
			function _proceed(publicKeyString) {
				fields[Users.signatures.sigField] = {
					signature: signature,
					publicKey: publicKeyString,
					fieldNames: options.fieldNames || null
				};
				return callback && callback(null, fields);
			}
		}, options);
	};

});