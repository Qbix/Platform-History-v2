/**
 * Class representing link rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Link' rows in the 'Users' database
 * @namespace Users
 * @class Link
 * @extends Base.Users.Link
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Link (fields) {

	// Run constructors of mixed in objects
	Users_Link.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Link.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Users_Link, Q.require('Base/Users/Link'));

/*
 * Add any public methods here by assigning them to Users_Link.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Users_Link.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Users_Link;