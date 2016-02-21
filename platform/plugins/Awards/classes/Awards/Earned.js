/**
 * Class representing earned rows.
 *
 * @module Awards
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Earned' rows in the 'Awards' database
 * @namespace Awards
 * @class Earned
 * @extends Base.Awards.Earned
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Awards_Earned (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Awards_Earned.constructors.apply(this, arguments);

}

Q.mixin(Awards_Earned, Q.require('Base/Awards/Earned'));

module.exports = Awards_Earned;