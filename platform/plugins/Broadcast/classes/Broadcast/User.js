/**
 * Class representing user rows.
 *
 * @module Broadcast
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'User' rows in the 'Broadcast' database
 * @namespace Broadcast
 * @class User
 * @extends Base.Broadcast.User
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Broadcast_User (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Broadcast_User.constructors.apply(this, arguments);

}

Q.mixin(Broadcast_User, Q.require('Base/Broadcast/User'));

module.exports = Broadcast_User;