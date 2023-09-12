Q.exports(function (Users, priv) {

    /**
	 * Methods for user contacts
     * @module Users
	 * @class Users.Contact
	 */
	/**
	 * Contacts batch getter.
	 * @method get
     * @static
	 * @param {String} userId The user's id
	 * @param {String} label The contact's label
	 * @param {String} contactUserId The contact user's id
	 * @param {Function} callback
	 *    if there were errors, first parameter is an array of errors
	 *  otherwise, first parameter is null and second parameter is a Users.Contact object
	 */
	return Q.getter(function Users_Contact_get(userId, label, contactUserId, callback) {
		var func = Users.batchFunction(Q.baseUrl({
			userIds: userId,
			label: label,
			contactUserId: contactUserId
		}), 'contact', ['userIds', 'labels', 'contactUserIds']);
		func.call(this, userId, label, contactUserId,
			function Users_Contact_get_response_handler(err, data) {
				var msg = Q.firstErrorMessage(err, data);
				if (!msg && !data.contact) {
					msg = "Users.Contact.get: no such contact";
				}
				if (msg) {
					Users.onError.handle.call(this, msg, err, data.contact);
					Users.get.onError.handle.call(this, msg, err, data.contact);
					return callback && callback.call(this, msg);
				}
				var contact = new Users.Contact(data.contact);
				callback.call(contact, err, contact);
			}
		);
	}, {
		cache: Q.Cache[Users.cacheWhere]("Users.Contact.get", 100),
		throttle: 'Users.Contact.get',
		prepare: function (subject, params, callback) {
			if (subject instanceof Contact) {
				return callback(subject, params);
			}
			if (params[0]) {
				return callback(subject, params);
			}
			var contact = params[1] = new Contact(subject);
			return callback(contact, params);
		}
	});
});