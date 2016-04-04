/**
 * Class representing leader rows.
 *
 * @module Assets
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Leader' rows in the 'Assets' database
 * @namespace Assets
 * @class Leader
 * @extends Base.Assets.Leader
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Assets_Leader (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Assets_Leader.constructors.apply(this, arguments);

}

Q.mixin(Assets_Leader, Q.require('Base/Assets/Leader'));

module.exports = Assets_Leader;