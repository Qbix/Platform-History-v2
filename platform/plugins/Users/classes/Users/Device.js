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
 * @param {String} [notification.badge] The badge
 * @param {String} [notification.sound] The name of the sound file in the app bundle or Library/Sounds folder
 * @param {String|Object} [notification.alert] Either the text of an alert to show,
 *  or an object with the following fields:
 * @param {String} [notification.alert.title]
 * @param {String} [notification.alert.body]
 * @param {String} [notification.alert.title-loc-key]
 * @param {String} [notification.alert.title-loc-args]
 * @param {String} [notification.alert.action-loc-key]
 * @param {String} [notification.alert.loc-key]
 * @param {String} [notification.alert.loc-args]
 * @param {String} [notification.alert.launch-image]
 * @param {String} [notification.encoding]
 * @param {Object} [notification.payload]
 * @param {String} [notification.expiry]
 * @param {String} [notification.priority]
 * @param {String} [notification.newsstandAvailable]
 * @param {String} [notification.contentAvailable]
 * @param {String} [notification.mutableContent]
 * @param {String} [notification.mdm]
 * @param {Boolean} [notification.truncateAtWordEnd]
 * @param {String} [notification.urlArgs]
 * @param {String} [notification.category]
 * @param {Object} [options]
 * @param {String} [options.view] Optionally set a view to render for the alert body
 * @param {Boolean} [options.isSource] If true, uses Q.Handlebars.renderSource instead of render
 */
Users_Device.prototype.pushNotification = function (notification, options) {
	if (options && options.view) {
		var body = options.isSource
			? Q.Handlebars.renderSource(options.view, options.fields)
			: Q.Handlebars.render(options.view, options.fields);
		Q.setObject(['alert', 'body'], body, notification);
	}
	if (this.fields.platform === 'ios') {
		if (!Users.apn.connection) {
			return;
		}
		var d = new apn.Device(this.fields.deviceId);
		var n = new apn.Notification(notification);
		Users.apn.connection.pushNotification(n, d);
	}
	// TODO: process android!!!
	// TODO: add batching support
	// can send to at most 1000 registration tokens at a time
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