/**
 * Class representing identify rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Identify' rows in the 'Users' database
 * <br/>Mapping table for finding users based on various info
 * @namespace Users
 * @class Identify
 * @extends Base.Users.Identify
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Identify (fields) {

	// Run constructors of mixed in objects
	Users_Identify.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Identify.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Users_Identify, Q.require('Base/Users/Identify'));

/*
 * Add any public methods here by assigning them to Users_Identify.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Users_Identify.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Users_Identify;