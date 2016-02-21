/**
 * Class representing total rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Total' rows in the 'Streams' database
 * <br/>Used to count the number of messages of a certain type
 * @namespace Streams
 * @class Total
 * @extends Base.Streams.Total
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Total (fields) {

	// Run constructors of mixed in objects
	Streams_Total.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Total.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Streams_Total, Q.require('Base/Streams/Total'));

/*
 * Add any public methods here by assigning them to Streams_Total.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Streams_Total.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Streams_Total;