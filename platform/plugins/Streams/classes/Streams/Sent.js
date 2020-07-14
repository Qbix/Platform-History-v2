/**
 * Class representing sent rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');
var Sent = Q.require('Base/Streams/Sent');

/**
 * Class representing 'Sent' rows in the 'Streams' database
 * <br>stored primarily on byUserId's shard
 * @namespace Streams
 * @class Sent
 * @extends Base.Streams.Sent
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Streams_Sent (fields) {

	// Run mixed-in constructors
	Streams_Sent.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Streams_Sent, Sent);

/*
 * Add any public methods here by assigning them to Streams_Sent.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_Sent.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Streams_Sent;