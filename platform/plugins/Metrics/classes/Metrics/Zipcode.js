/**
 * Class representing zipcode rows.
 *
 * This description should be revised and expanded.
 *
 * @module Metrics
 */
var Q = require('Q');
var Db = Q.require('Db');
var Zipcode = Q.require('Base/Metrics/Zipcode');

/**
 * Class representing 'Zipcode' rows in the 'Metrics' database
 * @namespace Metrics
 * @class Zipcode
 * @extends Base.Metrics.Zipcode
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Metrics_Zipcode (fields) {

	// Run mixed-in constructors
	Metrics_Zipcode.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Zipcode.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Metrics_Zipcode, Zipcode);

/*
 * Add any public methods here by assigning them to Metrics_Zipcode.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Metrics_Zipcode.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Metrics_Zipcode;