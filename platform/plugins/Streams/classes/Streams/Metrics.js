/**
 * Class representing metrics rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');
var Metrics = Q.require('Base/Streams/Metrics');

/**
 * Class representing 'Metrics' rows in the 'Streams' database
 * @namespace Streams
 * @class Metrics
 * @extends Base.Streams.Metrics
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Streams_Metrics (fields) {

	// Run mixed-in constructors
	Streams_Metrics.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Streams_Metrics, Metrics);

/*
 * Add any public methods here by assigning them to Streams_Metrics.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_Metrics.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Streams_Metrics;