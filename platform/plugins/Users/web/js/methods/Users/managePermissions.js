Q.exports(function (Users, priv) {

    /**
     * Users plugin's front end code
     *
     * @module Users
     * @class Users
     */
	/**
	 * Set a label's permissions
	 * @method managePermissions
	 * @static
	 * @param {String} userId
     * @param {String} label
	 * @param {Function} callback
	 */
	return function (userId, label, toGrant, toRevoke, callback) {
		
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
                label: label,
                toRevoke: toRevoke,
                toGrant: toGrant
			},
            method: 'put'
		});
	};
});