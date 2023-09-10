Q.exports(function (Users, priv) {
    /**
	 * Methods for contact labels (roles, relationships)
     * @module Users
	 * @class Users.Label
	 */

	/**
	 * Adds a label.
	 * @method add
	 * @param {String} userId The user's id
	 * @param {String} title The contact label's title
     * @param {String} label The contact label. used when need to set custom
	 * @param {Function} callback
	 *    if there were errors, first parameter is an array of errors
	 *  otherwise, first parameter is null and second parameter is a Users.Contact object
	 */
	return function Users_Label_add(userId, title, label, callback) {
		return priv._Users_manage('Users/label', 'post', {
			userId: userId,
			title: title,
            label: label,
		}, 'label', Label, Users.getLabels, callback);
	};

});