/**
 * Class representing leader rows.
 *
 * @module Awards
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Leader' rows in the 'Awards' database
 * @namespace Awards
 * @class Leader
 * @extends Base.Awards.Leader
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Awards_Leader (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Awards_Leader.constructors.apply(this, arguments);

}

Q.mixin(Awards_Leader, Q.require('Base/Awards/Leader'));

module.exports = Awards_Leader;