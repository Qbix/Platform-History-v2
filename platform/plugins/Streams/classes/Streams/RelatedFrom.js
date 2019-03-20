/**
 * Class representing related_from rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'RelatedFrom' rows in the 'Streams' database
 * <br/>This table is owned by publisher of the member stream
 * @namespace Streams
 * @class RelatedFrom
 * @extends Base.Streams.RelatedFrom
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_RelatedFrom (fields) {

	// Run constructors of mixed in objects
	Streams_RelatedFrom.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'RelatedFrom.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Streams_RelatedFrom, Q.require('Base/Streams/RelatedFrom'));

/*
 * Add any public methods here by assigning them to Streams_RelatedFrom.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Streams_RelatedFrom.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Streams_RelatedFrom;