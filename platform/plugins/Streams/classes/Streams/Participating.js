/**
 * Class representing participating rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Participating' rows in the 'Streams' database
 * stored primarily on the participating user's Qbix server
 * @namespace Streams
 * @class Participating
 * @extends Base.Streams.Participating
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Participating (fields) {

	// Run constructors of mixed in objects
	Streams_Participating.constructors.apply(this, arguments);

}

var Streams = Q.require('Streams');
var Base = Q.require('Base/Streams/Participating');
Q.mixin(Streams_Participating, Base);


/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_Participating.prototype.setUp = function () {
	// put any code here
};

module.exports = Streams_Participating;
