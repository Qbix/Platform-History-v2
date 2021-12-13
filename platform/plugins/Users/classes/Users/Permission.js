/**
 * Class representing permission rows.
 *
 * This description should be revised and expanded.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');
var Permission = Q.require('Base/Users/Permission');

/**
 * Class representing 'Permission' rows in the 'Users' database
 * <br>Stores cached results from querying EVM-based blockchains
 * @namespace Users
 * @class Permission
 * @extends Base.Users.Permission
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Users_Permission (fields) {

	// Run mixed-in constructors
	Users_Permission.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Users_Permission, Permission);

/*
 * Add any public methods here by assigning them to Users_Permission.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Users_Permission.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Users_Permission;