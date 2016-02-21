/**
 * Class representing domain rows.
 *
 * This description should be revised and expanded.
 *
 * @module Platform
 */
var Q = require('Q');
var Db = Q.require('Db');
var Domain = Q.require('Base/Platform/Domain');

/**
 * Class representing 'Domain' rows in the 'Platform' database
 * @namespace Platform
 * @class Domain
 * @extends Base.Platform.Domain
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Platform_Domain (fields) {

	// Run mixed-in constructors
	Platform_Domain.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Domain.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Platform_Domain, Domain);

/*
 * Add any public methods here by assigning them to Platform_Domain.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Platform_Domain.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Platform_Domain;