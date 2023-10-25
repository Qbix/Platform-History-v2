Q.exports(function (Users, priv) {

    /**
     * Users plugin's front end code
     *
     * @module Users
     * @class Users
     */
	/**
	 * Get a user's contacts
	 * @method getContacts
	 * @static
	 * @param {String} userId
	 * @param {Array|String} [labels]
	 * @param {String|Array} [contactUserIds]
	 * @param {Function} callback
	 */
	return Q.getter(function Users_getContacts(userId, labels, contactUserIds, callback) {
		if (typeof labels === 'function') {
			callback = labels;
			labels = contactUserIds = undefined;
		} else if (typeof contactUserIds === 'function') {
			callback = contactUserIds;
			contactUserIds = undefined;
		}
		Q.req('Users/contact', 'contacts', function (err, data) {
			var msg = Q.firstErrorMessage(err, data);
			if (msg) {
				Users.onError.handle.call(this, msg, err, data.contacts);
				Users.get.onError.handle.call(this, msg, err, data.contacts);
				return callback && callback.call(this, msg);
			}
			Q.each(data.slots.contacts, function (i) {
				data.slots.contacts[i] = new Users.Contact(data.slots.contacts[i]);
			});
			Q.handle(callback, data, [err, data.slots.contacts]);
		}, {
			fields: {
				userId: userId,
				labels: labels,
				contactUserIds: contactUserIds
			}
		});
	}, {
		cache: Q.Cache[Users.cacheWhere]("Users.getContacts", 100),
		throttle: 'Users.getContacts',
		prepare: function (subject, params, callback) {
			if (params[0]) {
				return callback(subject, params);
			}
			for (var i in params[1]) {
				params[1][i] = new Users.Contact(params[1][i]);
			}
			return callback(subject, params);
		}
	});
});