/**
 * Class representing Facebook AppUser rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');
var Users = Q.require('Users');
var Users_AppUser = Users.AppUser;

/**
 * AppUser adapter class for Facebook platform
 * @namespace Users
 * @class AppUser.Facebook
 * @extends Users.AppUser
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_AppUser_Facebook (fields) {
	// Run constructors of mixed in objects
	Users_AppUser.constructors.apply(this, arguments);
}
module.exports = Users_AppUser.Facebook = Users_AppUser_Facebook;

Users_AppUser_Facebook.client = function (appId) {
	var client = require('fbgraph');
	var info = Users.appInfo('facebook', appId);
	if (!info.appId || !info.secret) {
		return null;
	}
	client.setAppSecret(info.secret);
	return client;
};

/**
 * @method handlePushNotification
 * @param {Object} notification
 * @param {String} notification.alert Can contain placeholders like {{userId1}}
 * @param {String} notification.href Will be prefixed by app's base url
 * @param {String} notification.ref For tracking notification performance in analytics
 */
Users_AppUser_Facebook.prototype.handlePushNotification = function (notification, callback) {
	if (!this.fields.platform_uid) {
		return Q.handle(callback, this, [new Q.Error("Users.AppUser.prototype.pushNotification: empty platform_uid")]);
	}
	var info = Users.appInfo('facebook', appId);
	if (!info.appId || !info.secret) {
		Q.handle(callback, this, [new Q.Error("Users.AppUser.prototype.pushNotification: empty appId or secret")]);
	}
	var at = this.fields.access_token;
	var graph = 'https://graph.facebook.com';
	// todo: https://developers.facebook.com/docs/graph-api/securing-requests
	Q.Utils.post(graph+'/'+this.fields.fb_uid+'/notifications?access_token='+at, {
		template: notification.alert,
		href: notification.href,
		ref: notification.ref
	}, function () {
		Q.handle(callback, this);
	});
};

Q.mixin(Users_AppUser_Facebook, Users_AppUser, Q.require('Base/Users/AppUser'));

/*
 * Add any public methods here by assigning them to Users_AppUser.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Users_AppUser.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};