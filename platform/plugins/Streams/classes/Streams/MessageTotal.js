/**
 * Class representing message_total rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');
var MessageTotal = Q.require('Base/Streams/MessageTotal');

/**
 * Class representing 'MessageTotal' rows in the 'Streams' database
 * <br>Used to count the number of messages of a certain type
 * @namespace Streams
 * @class MessageTotal
 * @extends Base.Streams.MessageTotal
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Streams_MessageTotal (fields) {

	// Run mixed-in constructors
	Streams_MessageTotal.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Streams_MessageTotal, MessageTotal);

/*
 * Add any public methods here by assigning them to Streams_MessageTotal.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_MessageTotal.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Streams_MessageTotal;