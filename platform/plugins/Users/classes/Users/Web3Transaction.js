/**
 * Class representing web3_transaction rows.
 *
 * This description should be revised and expanded.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');
var Web3Transaction = Q.require('Base/Users/Web3Transaction');

/**
 * Class representing 'Web3Transaction' rows in the 'Users' database
 * @namespace Users
 * @class Web3Transaction
 * @extends Base.Users.Web3Transaction
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Users_Web3Transaction (fields) {

	// Run mixed-in constructors
	Users_Web3Transaction.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Users_Web3Transaction, Web3Transaction);

/*
 * Add any public methods here by assigning them to Users_Web3Transaction.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Users_Web3Transaction.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Users_Web3Transaction;