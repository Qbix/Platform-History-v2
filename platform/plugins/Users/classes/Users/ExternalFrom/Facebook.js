/**
 * Class representing Facebook ExternalFrom rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');
var Users = Q.require('Users');
var Users_ExternalFrom = Users.ExternalFrom;

/**
 * ExternalFrom adapter class for Facebook platform
 * @namespace Users
 * @class ExternalFrom.Facebook
 * @extends Users.ExternalFrom
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_ExternalFrom_Facebook (fields) {
	// Run constructors of mixed in objects
	Users_ExternalFrom.constructors.apply(this, arguments);
}
module.exports = Users_ExternalFrom.Facebook = Users_ExternalFrom_Facebook;

Users_ExternalFrom_Facebook.client = function (appId) {
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
Users_ExternalFrom_Facebook.prototype.handlePushNotification = function (notification, callback) {
	if (!this.fields.xid) {
		return Q.handle(callback, this, [new Q.Error("Users.ExternalFrom.prototype.pushNotification: empty xid")]);
	}
	var info = Users.appInfo('facebook', appId);
	if (!info.appId || !info.secret) {
		Q.handle(callback, this, [new Q.Error("Users.ExternalFrom.prototype.pushNotification: empty appId or secret")]);
	}
	var at = this.fields.accessToken;
	var graph = 'https://graph.facebook.com';
	// todo: https://developers.facebook.com/docs/graph-api/securing-requests
	Q.Utils.post(graph+'/'+this.fields.fb_xid+'/notifications?access_token='+at, {
		template: notification.alert,
		href: notification.href,
		ref: notification.ref
	}, function () {
		Q.handle(callback, this);
	});
};

Q.mixin(Users_ExternalFrom_Facebook, Users_ExternalFrom, Q.require('Base/Users/ExternalFrom'));

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