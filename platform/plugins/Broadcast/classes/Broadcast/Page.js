/**
 * Class representing page rows.
 *
 * @module Broadcast
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Page' rows in the 'Broadcast' database
 * <br/>for facebook pages
 * @namespace Broadcast
 * @class Page
 * @extends Base.Broadcast.Page
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Broadcast_Page (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Broadcast_Page.constructors.apply(this, arguments);

}

Q.mixin(Broadcast_Page, Q.require('Base/Broadcast/Page'));

module.exports = Broadcast_Page;