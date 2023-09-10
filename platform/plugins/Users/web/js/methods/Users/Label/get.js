Q.exports(function (Users, priv) {
    /**
	 * Methods for contact labels (roles, relationships)
     * @module Users
	 * @class Users.Label
	 */
	/**
	 * Labels batch getter.
	 * @method get
	 * @param {String} userId The user's id
	 * @param {String} label The label's internal name
	 * @param {Function} callback
	 *    if there were errors, first parameter is an array of errors
	 *  otherwise, first parameter is null and second parameter is a Users.Label object
	 */
	return function Users_Label_get(userId, label, callback) {
		var func = Users.batchFunction(Q.baseUrl({
			userIds: userId,
			label: label
		}), 'label', ['userIds', 'labels']);
		func.call(this, userId, label,
			function Users_Label_get_response_handler(err, data) {
				var msg = Q.firstErrorMessage(err, data);
				if (!msg && !data.label) {
					msg = "Users.Label.get: no such label";
				}
				if (msg) {
					Users.onError.handle.call(this, msg, err, data.label);
					Users.get.onError.handle.call(this, msg, err, data.label);
					return callback && callback.call(this, msg);
				}
				var label = new Users.Label(data.label);
				callback.call(label, err, label);
			});
	};

});