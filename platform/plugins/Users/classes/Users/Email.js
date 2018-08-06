/**
 * Class representing email rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');
var Users = Q.require('Users');

/**
 * Class representing 'Email' rows in the 'Users' database
 * @namespace Users
 * @class Email
 * @extends Base.Users.Email
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Email (fields) {

	// Run constructors of mixed in objects
	Users_Email.constructors.apply(this, arguments);

	/*
	 * Add any other methods to the model class by assigning them to this.
	 
	 * * * */

	/* * * */
}

Q.mixin(Users_Email, Q.require('Base/Users/Email'));

/**
 * Send e-mail message
 * @method sendMessage
 * @static
 * @param {String} to Comma-separated list of emails
 * @param {String} subject The subject. May contain variable references to members
 *  of the $fields array.
 * @param {String} view The name of a view for the body. Fields are passed to it.
 * @param {Object} [fields={}] The fields referenced in the subject and/or view
 * @param {Object} [options={}]
 * @param {String} [options.html=false] Whether to send as HTML email.
 * @param {String} [options.name] A human-readable name in addition to the address to send to.
 * @param {Array} [options.from] An array of [emailAddress, humanReadableName].
 * @param {Boolean} [options.isSource] If true, the view parameter contains the exact source, not the path of the template
 * @param {function} callback Receives error, method used and response objects after complete
 */
var _transport = null;
Users_Email.sendMessage = function (to, subject, view, fields, options, callback) {
	var mailer = require('nodemailer');
	var handlebars = require('handlebars');
	var key = Q.Config.get(['Users', 'email', 'log', 'key'], 'email');

	if (typeof fields === 'function') {
		callback = fields;
		options = fields = {};
	} else if (typeof options === "function") {
		callback = options;
		options = {};
	}

	fields = fields || {};
	options = options || {};

	var from = options.from || Q.Config.get(['Users', 'email', 'from'], null);
	if (!from) {
		var app = Q.Config.expect(['Q', 'app']);
		var appUrl = Q.Config.get(["Q", "web", "appRootUrl"], null);
		if (!app || !appUrl) return false;
		from = [app+'@'+appUrl.parseUrl('host'), app];
	}
	if (typeof from === "string") from = [from, Q.Config.expect(['Q', 'app'])];

	var mailOptions = {
		from: from[1]+' <'+from[0]+'>',
		to: to,
		subject: subject ? Q.Handlebars.renderSource(subject, fields) : ''
	};
	mailOptions[options.html ? 'html' : 'text'] = options.isSource
		? Q.Handlebars.renderSource(view, fields)
		: Q.Handlebars.render(view, fields);

	var smtp = Q.Config.get(['Users', 'email', 'smtp'], {host: 'sendmail'});
	if (!_transport && smtp) {
		// Set up the default mail transport
		var host = smtp.host || 'sendmail';
		if (host === "sendmail") {
			var sendmailTransport = require("nodemailer-sendmail-transport");
			_transport = mailer.createTransport(sendmailTransport());
		} else {
			var smtpTransport = require("nodemailer-smtp-transport");
			host = {
				host: host
			};
			if (smtp.port) host.port = smtp.port;
			if (smtp.auth === "login") {
				if (smtp.ssl) {
					host.secureConnection = true;
				}
				host.auth = {
					user: smtp.username,
					pass: smtp.password
				};
			}
			_transport = mailer.createTransport(smtpTransport(host));
		}
	}
	
	var logContent = 'Sent email message to ' + to
		+ ":\n" + mailOptions.subject
		+ "\n" + (mailOptions.html || mailOptions.text);
	if (_transport) {
		_transport.sendMail(mailOptions, function (err, response) {
			callback(err, 'smtp', response);
		});
	} else {
		logContent = 'Would have ' + logContent;
		setTimeout(function () {
			callback(null, 'log');
		}, 0);
	}
	if (key) {
		Q.log(logContent, key);
	}
};

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Users_Email.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

/**
 * Send e-mail message
 * @method sendMessage
 * @param {string} subject
 *  The subject. May contain variable references to members
 *  of the $fields array.
 * @param {string} view
 *  The name of a view for the body. Fields are passed to it.
 * @param {array} fields={}
 *  Optional. The fields referenced in the subject and/or view
 * @param {array} $options={}
 *  Optional. Array of options. Can include:<br/>
 *  "html" => Defaults to false. Whether to send as HTML email.<br/>
 *  "from" => An array of emailAddress, human_readable_name<br/>
 * @param {function} callback Receives error and response objects after complete
 */
Users_Email.prototype.sendMessage = function(subject, view, fields, options, callback) {
	if (typeof fields === 'function') {
		callback = fields;
		options = fields = {};
	} else if (typeof options === "function") {
		callback = options;
		options = {};
	}
	Users.Email.sendMessage(this.address, subject, view, fields, options, callback);
};

module.exports = Users_Email;