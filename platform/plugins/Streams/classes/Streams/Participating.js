/**
 * Class representing participating rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');
var Participating = Q.require('Base/Streams/Participating');

/**
 * Class representing 'Participating' rows in the 'Streams' database
 * <br>stored primarily on the participating user's Q server
 * @namespace Streams
 * @class Participating
 * @extends Base.Streams.Participating
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Streams_Participating (fields) {

	// Run mixed-in constructors
	Streams_Participating.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Streams_Participating, Participating);

/*
 * Add any public methods here by assigning them to Streams_Participating.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_Participating.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Streams_Participating;