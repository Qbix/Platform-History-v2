/**
 * Class representing ios device rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');
var Users = Q.require('Users');
var Users_Device = Users.Device;

/**
 * Device adapter class for ios platform
 * @namespace Users
 * @class Device.Ios
 * @extends Users.Device
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Device_Ios (fields) {
	// Run constructors of mixed in objects
	Users.Device.constructors.apply(this, arguments);
}
module.exports = Users_Device.Ios = Users_Device_Ios;

/**
 * @method handlePushNotification
 * @param {Object} notification
 * @param {String|Object} [notification.alert] Either the text of an alert to show,
 *  or an object with the following fields:
 * @param {string|array} [notification.alert] Either the text of an alert to show,
 *  or an object with the following fields:
 * @param {String} [notification.alert.title] The title of the notification
 * @param {String} [notification.alert.body] The body of the notification
 * @param {String} [notification.alert.titleLocKey] Apple-only
 * @param {String} [notification.alert.titleLocArgs] Apple-only
 * @param {String} [notification.alert.actionLocKey] Apple-only
 * @param {String} [notification.alert.locKey] Apple-only
 * @param {String} [notification.alert.locArgs] Apple-only
 * @param {String} [notification.alert.launchImage] Apple-only
 * @param {String} [notification.url] The url of the notification
 * @param {String} [notification.badge] The badge
 * @param {String} [notification.sound] The name of the sound file in the app bundle or Library/Sounds folder
 * @param {string} [notification.icon] The icon
 * @param {array} [notification.actions] Array of up to two arrays with keys 'action' and 'title'.
 * @param {String} [notification.category] Apple-only. The name of the category for actions registered on the client side.
 * @param {Object} [notification.payload] Put all your custom notification fields here
 * @param {String} [notification.collapseId] A string under 64 bytes for collapsing notifications
 * @param {Object} [options]
 * @param {String} [options.view] Optionally set a view to render for the alert body
 * @param {Boolean} [options.isSource] If true, uses Q.Handlebars.renderSource instead of render
 * @param {timestamp} [options.expiry] A UNIX timestamp for when the notification expires
 * @param {String} [options.priority="high"] Can be set to "normal" to make it lower priority
 * @param {String} [options.id] You can provide your own uuid for the notification
 * @param {Object} [options.providerOptions={}] Override any apn.Provider constructor options
 * @param {boolean} [options.silent=false] Deliver a silent notification, may throw an exception
 * @param {Function} [callback] This is called after the notification was sent. The first parameter might contain any errors. The "this" object is the Users.Device
 */
Users_Device_Ios.prototype.handlePushNotification = function (notification, options, callback) {
	var device = this;
	var appId = this.fields.appId || Q.Config.expect(['Q', 'app']);
	notification.topic = Q.Config.expect(['Users', 'apps', 'ios', Q.Config.expect(['Q', 'app']), 'appId']);
	if (notification && notification.url) {
		notification.payload = notification.payload || {};
 		notification.payload.url = notification.url;
	}
	var apn = require('apn');
	if (notification.url && !notification.collapseId) {
		notification.collapseId = notification.url;
	}
	var n = new apn.Notification(notification);
	var provider = Users_Device_Ios.provider(appId, options && options.providerOptions);
	provider.send(n, device.fields.deviceId)
	.then(function (responses) {
		var errors = null;
		responses.failed.forEach(function (result) {
			if (result.status === '401') {
				setTimeout(function () {
					device.remove();
				}, 0);
			}
			errors = errors || [];
			errors.push(result);
		});
		Q.handle(callback, device, [errors, notification, n]);
	});
};

/**
 * Starts iOS APNs provider server, based on options
 * @method provider
 * @static
 * @param {String} appId
 * @param {Object} [providerOptions={}] Override any apn.Provider constructor options
 * @return {apn.Provider}
 */
Users_Device_Ios.provider = function (appId, providerOptions) {
	appId = appId || Q.app.name;
	var provider = Users_Device_Ios.provider.collection[appId];
	if (provider) {
		return provider;
	}
	if (Q.Config.get(["Users", "apps", "platforms"], []).indexOf("ios") === -1) {
		throw new Q.Exception(
			'Users.Device.Ios: Config Users/platforms/'+appId+' must include "ios"'
		);
	}
 	var fs = require('fs');
 	var apn = require('apn');
 	var path = require('path');
 	var o = Q.Config.expect(['Users', 'apps', 'ios', Q.app.name]);
 	var sandbox = o.sandbox || false;
 	var token = o.token;
 	var ssl = o.ssl;
 	if (token) {
 		token.key = path.join(Q.app.DIR, token.key);
 		if (!fs.existsSync(token.key)) {
 			console.log("WARNING: APN provider not enabled due to missing token.key at " + token.key + "\n");
 			return;
 		}
 	} else if (ssl) {
 		ssl.ca = Q.pluginInfo.Users.FILES_DIR + '/Users/certs/EntrustRootCA.pem';
 		var keys = ['cert', 'key', 'ca'];
 		for (var i=0, l=keys.length; i<l; ++i) {
 			var k = files[i];
 			if (!ssl[k] || !fs.existsSync(ssl[k])) {
 				console.log("WARNING: APN provider not enabled due to missing " + k + " at " + ssl[k] + "\n");
 				return;
 			}
 		}
 	} else {
 		console.log("WARNING: APN provider not enabled due to missing token and ssl config");
 		return;
 	}
 	if (o.production === undefined) {
 		o.production = !sandbox;
 	}
 	var passphrase = Q.Config.get(["Users", "apps", "ios", appId, "passphrase"], null);
 	if (passphrase) {
 		o.passphase = passphase;
 	}
 	return Users_Device_Ios.provider.collection[appId] = new apn.Provider(
		Q.extend({}, o, providerOptions)
	);
}

Users_Device_Ios.provider.collection = {};

Q.mixin(Users_Device_Ios, Users_Device, Q.require('Base/Users/Device'));

/*
 * Add any public methods here by assigning them to Users_Device.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Users_Device.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };