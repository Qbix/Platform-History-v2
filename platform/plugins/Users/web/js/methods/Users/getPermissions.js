Q.exports(function (Users, priv) {

    /**
     * Users plugin's front end code
     *
     * @module Users
     * @class Users
     */
	/**
	 * Get a label's permissions
	 * @method getPermissions
	 * @static
	 * @param {String} userId
     * @param {String} label
	 * @param {Function} callback
	 */
	return Q.getter(function (userId, label, callback) {
		
		if (Q.isEmpty(userId) || Q.isEmpty(label)) {
			return Q.handle(callback, null, []);
		}
		Q.req('Users/permissions', 'result', function (err, data) {
			var msg = Q.firstErrorMessage(err, data);
			if (msg) {
				Users.onError.handle.call(this, msg, err, data.result);
				Users.get.onError.handle.call(this, msg, err, data.result);
				return callback && callback.call(this, msg);
			}
			
			Q.handle(callback, data, [err, data.slots.result]);
		}, {
			fields: {
				userId: userId,
                label: label
			}
		});
	}, {
		cache: false,//Q.Cache[Users.cacheWhere]("Users.getPermissions", 100),
		throttle: 'Users.getPermissions',
//		prepare: function (subject, params, callback) {
//			if (params[0]) {
//				return callback(subject, params);
//			}
//			for (var i in params[1]) {
//				params[1][i] = new Users.Label(params[1][i]);
//			}
//			return callback(subject, params);
//		}
	});
});