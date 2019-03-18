/**
 * Class representing external_from rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'ExternalFrom' rows in the 'Users' database
 * <br/>stores external ids for users
 * @namespace Users
 * @class ExternalFrom
 * @extends Base.Users.ExternalFrom
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_ExternalFrom (fields) {

	// Run constructors of mixed in objects
	Users_ExternalFrom.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'ExternalFrom.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Users_ExternalFrom, Q.require('Base/Users/ExternalFrom'));

/*
 * Add any public methods here by assigning them to Users_ExternalFrom.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Users_ExternalFrom.prototype.setUp = function () {
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
Users_ExternalFrom.prototype.pushNotification = function (notification, callback) {
	this.handlePushNotification(notification, callback);
};

/**
 * This is the default implementation. Please override it in your adapter classes.
 * @method handlePushNotification
 */
Users_ExternalFrom.prototype.handlePushNotification = function (notification, callback) {
	throw new Q.Error("Users.ExternalFrom.prototype.handlePushNotification: not implemented");	
};
 
/**
 * Called by various Db methods to get a custom row object
 * @param {Object} fields Any fields to set in the row
 * @param {Boolean} retrieved whether the row is retrieved
 * @return {Users.ExternalFrom}
 */
Users_ExternalFrom.newRow = function (fields, retrieved) {
	if (!fields.platform) {
		throw new Q.Error("Users.ExternalFrom.newRow: missing fields.platform");
	}
	var platform = fields.platform.toLowerCase().toCapitalized();
	var PlatformExternalFrom = Users_ExternalFrom[platform];
	return new PlatformExternalFrom(fields, retrieved);
};

module.exports = Users_ExternalFrom;