/**
 * Class representing agreement rows.
 *
 * @module Broadcast
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Agreement' rows in the 'Broadcast' database
 * <br/>Represents an agreement to syndicate a stream's content on y
 * @namespace Broadcast
 * @class Agreement
 * @extends Base.Broadcast.Agreement
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Broadcast_Agreement (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Broadcast_Agreement.constructors.apply(this, arguments);

}

Q.mixin(Broadcast_Agreement, Q.require('Base/Broadcast/Agreement'));

module.exports = Broadcast_Agreement;