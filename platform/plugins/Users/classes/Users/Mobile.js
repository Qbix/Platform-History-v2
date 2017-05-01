/**
 * Class representing mobile rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');
var Users = Q.require('Users');

/**
 * Class representing 'Mobile' rows in the 'Users' database
 * @namespace Users
 * @class Mobile
 * @extends Base.Users.Mobile
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Mobile (fields) {

	// Run constructors of mixed in objects
	Users_Mobile.constructors.apply(this, arguments);

	/*
	 * Add any other methods to the model class by assigning them to this.
	 
	 * * * */

	/* * * */
}

Q.mixin(Users_Mobile, Q.require('Base/Users/Mobile'));

/**
 * Send sms message. Use 'Users/twilio' config. Requires valid twilio SID and TOKEN as well as twilio
 * phone number either in the config or within options
 * @method sendMessage
 * @static
 * @param {String} to phone number
 * @param {String} view The name of a view for the body. Fields are passed to it.
 * @param {Array} [fields={}] The fields referenced in the subject and/or view
 * @param {Object} [options]
 * @param {String} [options.from] A phone number acceptable by twilio.
 * @param {Boolean} [options.isSource] If true, uses Q.Handlebars.renderSource instead of render
 * @param {Function} callback Receives error, method used and and response objects after complete
 */
var twilioClient = null;
Users_Mobile.sendMessage = function (to, view, fields, options, callback) {
	// some mobile number normalization
	var number, platform, address = [];
	var key = Q.Config.get(['Users', 'mobile', 'log', 'key'], 'mobile');
	if (to.slice(0, 2) === "00") {
		// convert 00 to + in international numbers
		number = '+'+to.slice(2);
	} else if (to.charAt(0) !== '+') {
		// if number starts with 1, treat it as US phone number,
		// otherwise just assume it's a full international numbers
		number = (to.charAt(0) === '1' ? '+' : '+1') + to;
	} else {
		number = to;
	}
	var config = Q.Config.get(['Users', 'mobile', 'twilio']);
	if (!twilioClient && config) {
		var twilio = require('twilio');
		// try twilio config
		var sid, token;
		if (config.sid && config.token) {
			// twilio config is given. Let's create transport to use it
			twilioClient = new twilio.RestClient(config.sid, config.token);
		}
	}
	
	var content = options.isSource
		? Q.Handlebars.renderSource(view, fields)
		: Q.Handlebars.render(view, fields);
	
	if (twilioClient
	&& (from = options.from || Q.Config.get(['Users', 'mobile', 'from'], null))) {
		twilioClient.sendSms(from, number, content, {}, function (res) {
			if (key) {
				Q.log('sent mobile message (via twilio) to '+number+":\n"+content, key);
			}
			callback(null, 'twilio', res);
		}, function (err) {
			callback(err, 'twilio');
		});
		// we are done! Skip smtp method
		return;
	}
	// no twilio - see if we can send via smtp
	if (!Q.Config.get(['Users', 'email', 'smtp'], {host: 'sendmail'})) {
		if (key) {
			Q.log('would have sent message to '+number+":\n"+content, key);
		}
		callback(null, 'log');
		return;
	}
	
	// send via smtp gateways, good for development purposes
	var gateways = Q.Config.get(['Users', 'mobile', 'gateways'], {
		'at&t': 'txt.att.net',
		'sprint': 'messaging.sprintpcs.com',
		'verizon': 'vtext.com',
		't-mobile': 'tmomail.net'
	});

	for (platform in gateways) {
		if (number.substr(0, 2) !== '+1') {
			continue;
		}
		address.push(number.substr(2)+'@'+gateways[platform]);
	}
	options.html = false;
	Users.Email.sendMessage(address.join(','), null, view, fields, options, function(err, res) {
		if (key) {
			Q.log("\nSent mobile message (via smtp gateway) to : "+number+":\n"+content, key);
			if (err) {
				Q.log("ERROR: " + err.message, key);
			}
		}
		callback(err, 'smtp', res);
	});
};

/**
 * @method sendMessage
 * @param {string} view
 *  The name of a view for the message. Fields are passed to this array.
 * @param {array} fields={}
 *  Optional. The fields referenced in the subject and/or view
 * @param {array} options={}
 *  Optional. Array of options. Doesn't include anything yet.
 * @param {function} callback Receives error and response objects after complete
 */
Users_Mobile.prototype.sendMessage = function (view, fields, options, callback) {
	if (typeof fields === 'function') {
		callback = fields;
		options = fields = {};
	} else if (typeof options === "function") {
		callback = options;
		options = {};
	}
	Users.Mobile.sendMessage(this.number, view, fields, options, callback);
};

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Users_Mobile.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Users_Mobile;