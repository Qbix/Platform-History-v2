/**
 * Class representing device rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');
var Users = Q.require('Users');

/**
 * Class representing 'Device' rows in the 'Users' database
 * @namespace Users
 * @class Device
 * @extends Base.Users.Device
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Device (fields) {

	// Run constructors of mixed in objects
	Users_Device.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Device.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

/**
 * @method pushNotification
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
 * @param {String} [notification.badge] The badge
 * @param {String} [notification.sound] The name of the sound file in the app bundle or Library/Sounds folder
 * @param {array} [notification.actions] Array of up to two arrays with keys 'action' and 'title'.
 * @param {String} [notification.category] Apple-only. The name of the category for actions registered on the client side.
 * @param {Object} [notification.payload] Put all your custom notification fields here
 * @param {Object} [options]
 * @param {String} [options.view] Optionally set a view to render for the alert body
 * @param {Boolean} [options.isSource] If true, uses Q.Handlebars.renderSource instead of render
 * @param {timestamp} [options.expiry] A UNIX timestamp for when the notification expires
 * @param {String} [options.priority="high"] Can be set to "normal" to make it lower priority
 * @param {String} [options.collapseId] A string under 64 bytes for collapsing notifications
 * @param {String} [options.id] You can provide your own uuid for the notification
 * @param {boolean} [options.silent=false] Deliver a silent notification, may throw an exception
 * @param {Function} [callback] This is called after the notification was sent. The first parameter might contain any errors. The "this" object is the Users.Device
 */
Users_Device.prototype.pushNotification = function (notification, options, callback) {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}
	var o = Q.extend({}, options);
	if (!Q.isInteger(o.priority)) {
		o.priority = (o.priority === 'high') ? 10 : 5;
	}
	if (o.priority) {
		notification.priority = o.priority;
	}
	if (o.expiry) {
		o.expiry = o.expiry;
	}
	if (o.collapseId) {
		notification.collapseId = o.collapseId;
	}
	if (o && o.view) {
		var body = o.isSource
			? Q.Handlebars.renderSource(o.view, o.fields)
			: Q.Handlebars.render(o.view, o.fields);
		Q.setObject(['alert', 'body'], body, notification);
	}
	var device = this;
	if (device.fields.platform === 'ios') {
		if (!Users.push.apn.provider) {
			console.warn("Users.Device.prototype.pushNotification: Users.apn.provider missing, call Users.listen() first");
			return;
		}
		var appId = o.appId || Q.Config.expect(['Q', 'app']);
		notification.topic = Q.Config.expect(['Users', 'apps', 'ios', appId, 'bundleId']);
		var apn = require('apn');
		var n = new apn.Notification(notification);
		Users.push.apn.provider.send(n, device.fields.deviceId)
		.then(function (responses) {
			var errors = null;
			responses.failed.forEach(function (result) {
				if (result.status == '401') {
					setTimeout(function () {
						device.remove();
					}, 0);
				}
				errors = errors || [];
				errors.push(result);
			});
			callback.call(device, errors, notification, n);
		});
	}
	// TODO: process gcm for android
	// can send to at most 1000 registration tokens per request in gcm
	
	// TODO: add support for web push in chrome and safari
};

Q.mixin(Users_Device, Q.require('Base/Users/Device'));

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

module.exports = Users_Device;