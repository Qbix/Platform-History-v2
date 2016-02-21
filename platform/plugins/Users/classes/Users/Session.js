/**
 * Class representing session rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Session' rows in the 'Users' database
 * <br/>This table is used to replicate PHP sessions information for
 * @namespace Users
 * @class Session
 * @extends Base.Users.Session
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Session (fields) {

	// Run constructors of mixed in objects
	Users_Session.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Session.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Users_Session, Q.require('Base/Users/Session'));

/*
 * Add any public methods here by assigning them to Users_Session.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Users_Session.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Users_Session;