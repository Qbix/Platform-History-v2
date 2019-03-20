/**
 * Class representing total rows.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Total' rows in the 'Users' database
 * <br/>Represents a total of the votes
 * @namespace Users
 * @class Total
 * @extends Base.Users.Total
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Total (fields) {

	// Run constructors of mixed in objects
	Users_Total.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Total.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Users_Total, Q.require('Base/Users/Total'));

/*
 * Add any public methods here by assigning them to Users_Total.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Users_Total.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Users_Total;