/**
 * Class representing task rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');
var Task = Q.require('Base/Streams/Task');

/**
 * Class representing 'Task' rows in the 'Streams' database
 * <br>stored primarily on publisherId's shard
 * @namespace Streams
 * @class Task
 * @extends Base.Streams.Task
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Streams_Task (fields) {

	// Run mixed-in constructors
	Streams_Task.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Streams_Task, Task);

/*
 * Add any public methods here by assigning them to Streams_Task.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_Task.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Streams_Task;