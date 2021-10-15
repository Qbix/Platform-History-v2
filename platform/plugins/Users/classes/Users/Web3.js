/**
 * Class representing web3 rows.
 *
 * This description should be revised and expanded.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');
var Web3 = Q.require('Base/Users/Web3');

/**
 * Class representing 'Web3' rows in the 'Users' database
 * <br>Represents using external apps to authenticate
 * @namespace Users
 * @class Web3
 * @extends Base.Users.Web3
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Users_Web3 (fields) {

	// Run mixed-in constructors
	Users_Web3.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Users_Web3, Web3);

/*
 * Add any public methods here by assigning them to Users_Web3.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Users_Web3.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Users_Web3;