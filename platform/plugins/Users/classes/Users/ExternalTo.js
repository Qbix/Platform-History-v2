/**
 * Class representing external_to rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'ExternalTo' rows in the 'Users' database
 * <br/>stores external ids for users
 * @namespace Users
 * @class ExternalTo
 * @extends Base.Users.ExternalTo
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_ExternalTo (fields) {

	// Run constructors of mixed in objects
	Users_ExternalTo.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'ExternalTo.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Users_ExternalTo, Q.require('Base/Users/ExternalTo'));

/*
 * Add any public methods here by assigning them to Users_ExternalTo.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Users_ExternalTo.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Users_ExternalTo;