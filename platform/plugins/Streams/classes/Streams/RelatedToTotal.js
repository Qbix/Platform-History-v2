/**
 * Class representing related_to_total rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');
var RelatedToTotal = Q.require('Base/Streams/RelatedToTotal');

/**
 * Class representing 'RelatedToTotal' rows in the 'Streams' database
 * <br>Used to count the number of relations of a certain type
 * @namespace Streams
 * @class RelatedToTotal
 * @extends Base.Streams.RelatedToTotal
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Streams_RelatedToTotal (fields) {

	// Run mixed-in constructors
	Streams_RelatedToTotal.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Streams_RelatedToTotal, RelatedToTotal);

/*
 * Add any public methods here by assigning them to Streams_RelatedToTotal.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_RelatedToTotal.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Streams_RelatedToTotal;