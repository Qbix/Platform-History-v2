Q.exports(function (Users, priv) {
    /**
	 * Methods for contact labels (roles, relationships)
     * @module Users
	 * @class Users.Label
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