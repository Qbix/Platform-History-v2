/**
 * Class representing user rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');
var Users = Q.require('Users');

/**
 * Class representing 'User' rows in the 'Users' database
 * @namespace Users
 * @class User
 * @extends Base.Users.User
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_User (fields) {

	// Run constructors of mixed in objects
	Users_User.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'User.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

/**
 * Get all the socket clients that a user has online
 * @method clientsOnline
 * @static
 * @param {String} userId The id of a user
 * @param {String} [sessionId] Optionally provide a session id, to filter clients by
 * @return {Object} Contains {clientId: client} pairs
 */
Users_User.clientsOnline = function(userId, sessionId) {
	var clients = Users.clients[userId] || {};
	if (!sessionId) {
	    return clients;
	}
	var result = {};
	for (var cid in clients) {
		if (clients[cid].sessionId === sessionId) {
			result[cid] = clients[cid];
		}
	}
	return result;
};

/**
 * Gets an array of all devices associated with userId and passes it to callback.
 * Data is filtered for platforms listed in config array {App}/cordova/platforms
 * @method devices
 * @static
 * @param {String} userId The id of a user
 * @param {Function} callback The first parameter contains {platformName: devicesArray}
 */
Users_User.devices = function (userId, callback) {
	var app = Q.app.name;
	var platforms = Q.Config.get([app, "cordova", "platforms"], []);
	Users.Device.SELECT('*').where({
		userId: userId,
		platform: platforms
	}).execute(function(err, res) {
		if (err) return;
		var devices = {};
		var sessions = [];
		var i, platform;
		for(i=0; i<res.length; i++) {
			platform = res[i].fields.platform;
			if (!devices[platform]) {
			    devices[platform] = [];
			}
			devices[platform].push(res[i].fields.deviceId);
		}
		callback.call(Users, devices);
	});
};

Q.mixin(Users_User, Q.require('Base/Users/User'));

/*
 * Add any public methods here by assigning them to Users_User.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Users_User.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Users_User;