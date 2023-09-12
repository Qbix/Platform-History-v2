Q.exports(function (Users, priv) {

    /**
	 * Methods for user contacts
     * @module Users
	 * @class Users.Contact
	 */
	/**
	 * Adds a contact.
	 * @method add
	 * @static
	 * @param {String} userId The user's id
	 * @param {String} label The contact's label
	 * @param {String} contactUserId The contact user's id
	 * @param {Function} callback
	 *  if there were errors, first parameter is an array of errors
	 *  otherwise, first parameter is null and second parameter is a Users.Contact object
	 */
	return function Users_Contact_add(userId, label, contactUserId, callback) {
		return priv._Users_manage('Users/contact', 'post', {
			userId: userId,
			label: label,
			contactUserId: contactUserId
		}, 'contact', Users.Contact, Users.getContacts, callback);
	};
});