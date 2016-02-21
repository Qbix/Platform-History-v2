/**
 * Class representing user rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'User' rows in the 'Users' database
 * @namespace Users
 * @class User
 * @extends Base.Users.User
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_User (fields) {

	// Run constructors of mixed in objects
	Users_User.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'User.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Users_User, Q.require('Base/Users/User'));

/*
 * Add any public methods here by assigning them to Users_User.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Users_User.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Users_User;