/**
 * Class representing state rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');
var State = Q.require('Base/Streams/State');

/**
 * Class representing 'State' rows in the 'Streams' database
 * @namespace Streams
 * @class State
 * @extends Base.Streams.State
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Streams_State (fields) {

	// Run mixed-in constructors
	Streams_State.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Streams_State, State);

/*
 * Add any public methods here by assigning them to Streams_State.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_State.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Streams_State;