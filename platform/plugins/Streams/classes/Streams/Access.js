/**
 * Class representing access rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Access' rows in the 'Streams' database
 * <br/>stored primarily on publisherId's Q server
 * @namespace Streams
 * @class Access
 * @extends Base.Streams.Access
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Access (fields) {

	// Run constructors of mixed in objects
	Streams_Access.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Access.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Streams_Access, Q.require('Base/Streams/Access'));

/*
 * Add any public methods here by assigning them to Streams_Access.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Streams_Access.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Streams_Access;