/**
 * Class representing external_from rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'ExternalFrom' rows in the 'Users' database
 * <br/>stores external ids for users
 * @namespace Users
 * @class ExternalFrom
 * @extends Base.Users.ExternalFrom
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_ExternalFrom (fields) {

	// Run constructors of mixed in objects
	Users_ExternalFrom.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'ExternalFrom.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Users_ExternalFrom, Q.require('Base/Users/ExternalFrom'));

/*
 * Add any public methods here by assigning them to Users_ExternalFrom.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Users_ExternalFrom.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Users_ExternalFrom;