/**
 * Class representing app_user rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'AppUser' rows in the 'Users' database
 * @namespace Users
 * @class AppUser
 * @extends Base.Users.AppUser
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_AppUser (fields) {

	// Run constructors of mixed in objects
	Users_AppUser.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'AppUser.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Users_AppUser, Q.require('Base/Users/AppUser'));

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Users_AppUser.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

/*
 * Add any public methods here by assigning them to Users_AppUser.prototype
 */

module.exports = Users_AppUser;