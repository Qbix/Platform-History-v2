/**
 * Class representing app_session rows.
 *
 * This description should be revised and expanded.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');
var AppSession = Q.require('Base/Users/AppSession');

/**
 * Class representing 'AppSession' rows in the 'Users' database
 * <br>Represents a session in our 3rd party app with a platform like ios
 * @namespace Users
 * @class AppSession
 * @extends Base.Users.AppSession
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Users_AppSession (fields) {

	// Run mixed-in constructors
	Users_AppSession.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Users_AppSession, AppSession);

/*
 * Add any public methods here by assigning them to Users_AppSession.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Users_AppSession.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Users_AppSession;