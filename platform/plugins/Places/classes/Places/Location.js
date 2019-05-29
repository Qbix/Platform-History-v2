/**
 * Class representing location rows.
 *
 * This description should be revised and expanded.
 *
 * @module Places
 */
var Q = require('Q');
var Db = Q.require('Db');
var Location = Q.require('Base/Places/Location');

/**
 * Class representing 'Location' rows in the 'Places' database
 * @namespace Places
 * @class Location
 * @extends Base.Places.Location
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Places_Location (fields) {

	// Run mixed-in constructors
	Places_Location.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Places_Location, Location);

/*
 * Add any public methods here by assigning them to Places_Location.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Places_Location.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Places_Location;