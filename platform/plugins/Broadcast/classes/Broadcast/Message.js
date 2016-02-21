/**
 * Class representing message rows.
 *
 * @module Broadcast
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Message' rows in the 'Broadcast' database
 * @namespace Broadcast
 * @class Message
 * @extends Base.Broadcast.Message
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Broadcast_Message (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Broadcast_Message.constructors.apply(this, arguments);

}

Q.mixin(Broadcast_Message, Q.require('Base/Broadcast/Message'));

module.exports = Broadcast_Message;