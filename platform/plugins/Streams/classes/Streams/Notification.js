/**
 * Class representing notification rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Notification' rows in the 'Streams' database
 * <br/>stored primarily on userId's shard
 * @namespace Streams
 * @class Notification
 * @extends Base.Streams.Notification
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Notification (fields) {

	// Run constructors of mixed in objects
	Streams_Notification.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Notification.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Streams_Notification, Q.require('Base/Streams/Notification'));

/*
 * Add any public methods here by assigning them to Streams_Notification.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Streams_Notification.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Streams_Notification;