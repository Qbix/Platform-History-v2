/**
 * Class representing session rows.
 *
 * This description should be revised and expanded.
 *
 * @module Platform
 */
var Q = require('Q');
var Db = Q.require('Db');
var Session = Q.require('Base/Platform/Session');

/**
 * Class representing 'Session' rows in the 'Platform' database
 * @namespace Platform
 * @class Session
 * @extends Base.Platform.Session
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Platform_Session (fields) {

	// Run mixed-in constructors
	Platform_Session.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Session.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Platform_Session, Session);

/*
 * Add any public methods here by assigning them to Platform_Session.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Platform_Session.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Platform_Session;