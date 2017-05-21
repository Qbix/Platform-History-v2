/**
 * Class representing quota rows.
 *
 * This description should be revised and expanded.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');
var Quota = Q.require('Base/Users/Quota');

/**
 * Class representing 'Quota' rows in the 'Users' database
 * <br/>Used for keeping track of quotas
 * @namespace Users
 * @class Quota
 * @extends Base.Users.Quota
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Quota (fields) {

	// Run mixed-in constructors
	Users_Quota.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Users_Quota, Quota);

/*
 * Add any public methods here by assigning them to Users_Quota.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Users_Quota.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Users_Quota;