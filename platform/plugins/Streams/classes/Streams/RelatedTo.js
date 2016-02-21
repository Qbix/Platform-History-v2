/**
 * Class representing related_to rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'RelatedTo' rows in the 'Streams' database
 * <br/>This table is owned by publisher of the aggregator stream
 * @namespace Streams
 * @class RelatedTo
 * @extends Base.Streams.RelatedTo
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_RelatedTo (fields) {

	// Run constructors of mixed in objects
	Streams_RelatedTo.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'RelatedTo.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Streams_RelatedTo, Q.require('Base/Streams/RelatedTo'));

/*
 * Add any public methods here by assigning them to Streams_RelatedTo.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Streams_RelatedTo.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Streams_RelatedTo;