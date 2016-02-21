/**
 * Class representing sent rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Sent' rows in the 'Streams' database
 * <br/>stored primarily on byUserId's Qbix server
 * @namespace Streams
 * @class Sent
 * @extends Base.Streams.Sent
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Sent (fields) {

	// Run constructors of mixed in objects
	Streams_Sent.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Sent.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Streams_Sent, Q.require('Base/Streams/Sent'));

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