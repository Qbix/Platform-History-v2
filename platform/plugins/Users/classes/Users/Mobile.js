/**
 * Class representing mobile rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

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
	Q.Utils.sendSMS(this.number, view, fields, options, callback);
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