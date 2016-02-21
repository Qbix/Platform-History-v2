/**
 * Class representing invited rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Invited' rows in the 'Streams' database
 * <br/>stores tokens where user is invited on user id server
 * @namespace Streams
 * @class Invited
 * @extends Base.Streams.Invited
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Invited (fields) {

	// Run constructors of mixed in objects
	Streams_Invited.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Invited.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Streams_Invited, Q.require('Base/Streams/Invited'));

/*
 * Add any public methods here by assigning them to Streams_Invited.prototype
 */

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Streams_Invited.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Streams_Invited;