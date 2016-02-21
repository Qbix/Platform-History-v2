/**
 * Class representing oAuth rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'OAuth' rows in the 'Users' database
 * <br/>For implementing three-legged oAuth 2.0
 * @namespace Users
 * @class OAuth
 * @extends Base.Users.OAuth
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_OAuth (fields) {

	// Run constructors of mixed in objects
	Users_OAuth.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'OAuth.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Users_OAuth, Q.require('Base/Users/OAuth'));

/*
 * Add any public methods here by assigning them to Users_OAuth.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Users_OAuth.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Users_OAuth;