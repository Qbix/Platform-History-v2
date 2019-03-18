/**
 * Class representing contact rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Contact' rows in the 'Users' database
 * @namespace Users
 * @class Contact
 * @extends Base.Users.Contact
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Contact (fields) {

	// Run constructors of mixed in objects
	Users_Contact.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Contact.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Users_Contact, Q.require('Base/Users/Contact'));

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Users_Contact.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

/*
 * Add any public methods here by assigning them to Users_Contact.prototype
 */

module.exports = Users_Contact;