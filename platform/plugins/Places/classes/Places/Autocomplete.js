/**
 * Class representing autocomplete rows.
 *
 * This description should be revised and expanded.
 *
 * @module Places
 */
var Q = require('Q');
var Db = Q.require('Db');
var Autocomplete = Q.require('Base/Places/Autocomplete');

/**
 * Class representing 'Autocomplete' rows in the 'Places' database
 * @namespace Places
 * @class Autocomplete
 * @extends Base.Places.Autocomplete
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Places_Autocomplete (fields) {

	// Run mixed-in constructors
	Places_Autocomplete.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Autocomplete.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Places_Autocomplete, Autocomplete);

/*
 * Add any public methods here by assigning them to Places_Autocomplete.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Places_Autocomplete.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Places_Autocomplete;