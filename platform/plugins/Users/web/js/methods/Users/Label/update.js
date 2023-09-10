Q.exports(function (Users, priv) {
    /**
	 * Methods for contact labels (roles, relationships)
     * @module Users
	 * @class Users.Label
	 */
	/**
	 * Update a label.
	 * @method update
     * @static
	 * @param {String} userId The user's id
	 * @param {String} label The contact label's label
     * @param {String} title
     * @param {String} icon
     * @param {String} description
	 * @param {Function} callback
	 *    if there were errors, first parameter is an array of errors
	 *  otherwise, first parameter is null and second parameter is a Users.Contact object
	 */
    return function Users_Label_update(userId, label, title, icon, description, callback) {
        return priv._Users_manage('Users/label', 'put', {
            userId,
            label,
            title,
            icon, 
            description,
        }, 'label', Label, Users.getLabels, callback);
    };
});