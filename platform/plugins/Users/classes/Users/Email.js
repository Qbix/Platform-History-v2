/**
 * Class representing email rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

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
	Q.Utils.sendEmail(this.address, subject, view, fields, options, callback);
};

module.exports = Users_Email;