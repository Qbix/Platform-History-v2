/**
 * Class representing related_from_total rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');
var RelatedFromTotal = Q.require('Base/Streams/RelatedFromTotal');

/**
 * Class representing 'RelatedFromTotal' rows in the 'Streams' database
 * <br>Used to count the number of relations of a certain type
 * @namespace Streams
 * @class RelatedFromTotal
 * @extends Base.Streams.RelatedFromTotal
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Streams_RelatedFromTotal (fields) {

	// Run mixed-in constructors
	Streams_RelatedFromTotal.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Streams_RelatedFromTotal, RelatedFromTotal);

/*
 * Add any public methods here by assigning them to Streams_RelatedFromTotal.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_RelatedFromTotal.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Streams_RelatedFromTotal;