/**
 * Class representing syndicated rows.
 *
 * @module Broadcast
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Syndicated' rows in the 'Broadcast' database
 * <br/>Used to indicate that a stream message has already been synd
 * @namespace Broadcast
 * @class Syndicated
 * @extends Base.Broadcast.Syndicated
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Broadcast_Syndicated (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Broadcast_Syndicated.constructors.apply(this, arguments);

}

Q.mixin(Broadcast_Syndicated, Q.require('Base/Broadcast/Syndicated'));

module.exports = Broadcast_Syndicated;