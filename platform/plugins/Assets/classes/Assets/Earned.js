/**
 * Class representing earned rows.
 *
 * @module Assets
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Earned' rows in the 'Assets' database
 * @namespace Assets
 * @class Earned
 * @extends Base.Assets.Earned
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Assets_Earned (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Assets_Earned.constructors.apply(this, arguments);

}

Q.mixin(Assets_Earned, Q.require('Base/Assets/Earned'));

module.exports = Assets_Earned;