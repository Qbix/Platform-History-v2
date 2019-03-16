/**
 * Class representing badge rows.
 *
 * @module Assets
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Badge' rows in the 'Assets' database
 * @namespace Assets
 * @class Badge
 * @extends Base.Assets.Badge
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Assets_Badge (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Assets_Badge.constructors.apply(this, arguments);

}

Q.mixin(Assets_Badge, Q.require('Base/Assets/Badge'));

module.exports = Assets_Badge;