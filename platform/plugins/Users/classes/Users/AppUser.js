/**
 * Class representing app_user rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'AppUser' rows in the 'Users' database
 * @namespace Users
 * @class AppUser
 * @extends Base.Users.AppUser
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_AppUser (fields) {

	// Run constructors of mixed in objects
	Users_AppUser.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'AppUser.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Users_AppUser, Q.require('Base/Users/AppUser'));

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Users_AppUser.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

/**
 * Pushes a notification to the user on an external platform
 * @method pushNotification
 * @param {Object} notification
 * @param {String} notification.alert Can contain placeholders like {{userId1}}
 * @param {String} notification.href Will be prefixed by app's base url
 * @param {String} notification.ref For tracking notiication performance in analytics
 */
Users_AppUser.prototype.pushNotification = function (notification, callback) {
	this.handlePushNotification(notification, callback);
};

/**
 * This is the default implementation. Please override it in your adapter classes.
 * @method handlePushNotification
 */
Users_AppUser.prototype.handlePushNotification = function (notification, callback) {
	throw new Q.Error("Users.AppUser.prototype.handlePushNotification: not implemented");	
};

/**
 * Called by various Db methods to get a custom row object
 * @param {Object} fields Any fields to set in the row
 * @param {Boolean} retrieved whether the row is retrieved
 * @return {Users.AppUser}
 */
Users_AppUser.newRow = function (fields, retrieved) {
	if (!fields.platform) {
		throw new Q.Error("Users.AppUser.newRow: missing fields.platform");
	}
	var platform = fields.platform.toLowerCase().toCapitalized();
	var PlatformAppUser = Users_AppUser[platform];
	return new PlatformAppUser(fields, retrieved);
};

/*
 * Add any public methods here by assigning them to Users_AppUser.prototype
 */

module.exports = Users_AppUser;