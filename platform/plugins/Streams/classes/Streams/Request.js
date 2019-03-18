/**
 * Class representing request rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Request' rows in the 'Streams' database
 * <br/>stored primarily on publisherId's Qbix server
 * @namespace Streams
 * @class Request
 * @extends Base.Streams.Request
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Request (fields) {

	// Run constructors of mixed in objects
	Streams_Request.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Request.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Streams_Request, Q.require('Base/Streams/Request'));

/*
 * Add any public methods here by assigning them to Streams_Request.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Streams_Request.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Streams_Request;