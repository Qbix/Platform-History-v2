/**
 * Class representing session rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');
var Users = require('Users');

/**
 * Class representing 'Session' rows in the 'Users' database
 * <br/>This table is used to replicate PHP sessions information for
 * @namespace Users
 * @class Session
 * @extends Base.Users.Session
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Session (fields) {

	// Run constructors of mixed in objects
	Users_Session.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Session.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

/**
 * Pushes notifications to the device corresponding the session ids.
 * @method pushNotifications
 * @static
 * @param {String|Array} userIds A user id, or an array of them, 
 *   in which case sessionIds would be an object of { userId: sessionId }
 *   in which case notifications would be an object of { userId: notification }
 * @param {String|Object} sessionIds A session id, or an object of them
 * @param {Object} notifications Please see Users.Device.pushNotification for the spec
 * @param {Function} [callback] A function to call after the push has been completed
 */
Users_Session.pushNotifications = function (userIds, sessionIds, notifications, callback) {
	var isArrayLike = Q.isArrayLike(userIds);
	Users.Device.SELECT('*').where({
		userId: userIds
	}).execute(function (err, devices) {
		if (err) {
			return callback(err);
		}
		var d = [];
		Q.each(devices, function (i) {
			var u = this.fields.userId;
			var n = isArrayLike ? notifications[u] : notifications;
			var s = isArrayLike ? sessionIds[u] : sessionIds;
			if (this.fields.sessionId === s) {
				this.pushNotification(n);
				d.push(this);
			}
		});
		callback(null, d, n);
	});
};

Q.mixin(Users_Session, Q.require('Base/Users/Session'));

/*
 * Add any public methods here by assigning them to Users_Session.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Users_Session.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Users_Session;