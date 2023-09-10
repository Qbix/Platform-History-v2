Q.exports(function (Users, priv) {
    /**
	 * Methods for contact labels (roles, relationships)
     * @module Users
	 * @class Users.Label
	 */

	/**
	 * Remove a label.
	 * @method remove
	 * @param {String} userId The user's id
	 * @param {String} label The contact label's label
	 * @param {Function} callback
	 *    if there were errors, first parameter is an array of errors
	 *  otherwise, first parameter is null and second parameter is a Users.Contact object
	 */
	return function Users_Label_remove(userId, label, callback) {
		return priv._Users_manage('Users/label', 'delete', {
			userId: userId,
			label: label
		}, null, Label, Users.getLabels, callback);
	};

});