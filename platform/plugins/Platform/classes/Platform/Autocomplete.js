/**
 * Class representing autocomplete rows.
 *
 * This description should be revised and expanded.
 *
 * @module Platform
 */
var Q = require('Q');
var Db = Q.require('Db');
var Autocomplete = Q.require('Base/Platform/Autocomplete');

/**
 * Class representing 'Autocomplete' rows in the 'Platform' database
 * @namespace Platform
 * @class Autocomplete
 * @extends Base.Platform.Autocomplete
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Platform_Autocomplete (fields) {

	// Run mixed-in constructors
	Platform_Autocomplete.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Autocomplete.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Platform_Autocomplete, Autocomplete);

/*
 * Add any public methods here by assigning them to Platform_Autocomplete.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Platform_Autocomplete.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Platform_Autocomplete;