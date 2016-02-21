/**
 * Class representing publisher rows.
 *
 * @module Broadcast
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Publisher' rows in the 'Broadcast' database
 * @namespace Broadcast
 * @class Publisher
 * @extends Base.Broadcast.Publisher
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Broadcast_Publisher (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Broadcast_Publisher.constructors.apply(this, arguments);

}

Q.mixin(Broadcast_Publisher, Q.require('Base/Broadcast/Publisher'));

module.exports = Broadcast_Publisher;