/**
 * Class representing Firefox device rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');
var Users = Q.require('Users');
var Users_Device = Users.Device;

/**
 * Device adapter class for Firefox browser
 * @namespace Users
 * @class Device.Firefox
 * @extends Users.Device
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Device_Firefox(fields) {
	// Run constructors of mixed in objects
	Users_Device.constructors.apply(this, arguments);
}
module.exports = Users_Device.Firefox = Users_Device_Firefox;

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
 * @param {string} [notification.icon] The icon
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
Users_Device_Firefox.prototype.handlePushNotification = function (notification, options, callback) {
	var appConfig = Q.Config.expect(['Users', 'apps', 'firefox', Q.app.name]);
	if (!notification.alert) {
		return Q.handle(callback, this, [new Error('Notification alert required')]);
	}
	if (!notification.alert.title || !notification.alert.body) {
		return Q.handle(callback, this, [new Error('Notification title and body are required')]);
	}
	var message = {
		title: notification.alert.title,
		body: notification.alert.body
	};
	Q.each(['collapseId', 'update'], function (i, item) {
		if (options[item] !== undefined) {
			message[item] = options[item];
		}
	});
	Q.each(['payload', 'collapseId', 'update', 'url', 'sound', 'color', 'icon', 'requireInteraction', 'renotify', 'silent', 'tag', 'vibrate', 'badge', 'dir', 'actions'], function (i, item) {
		if (notification[item] !== undefined) {
			message[item] = notification[item];
		}
	});
	var webpush = require('web-push');
	webpush.setVapidDetails(appConfig.url, appConfig.publicKey, appConfig.privateKey);
	webpush.sendNotification({
		endpoint: this.fields.deviceId,
		keys: {
			auth: this.fields.auth,
			p256dh: this.fields.p256dh
		}
	}, JSON.stringify(message)).then(function () {
		Q.handle(callback, this);
	}).catch(function (err) {
		Q.handle(callback, this, [err]);
	});
};

Q.mixin(Users_Device_Firefox, Users_Device, Q.require('Base/Users/Device'));

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