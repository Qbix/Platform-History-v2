/**
 * Class representing zipcode rows.
 *
 * @module Places
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Zipcode' rows in the 'Places' database
 * @namespace Places
 * @class Zipcode
 * @extends Base.Places.Zipcode
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Places_Zipcode (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Places_Zipcode.constructors.apply(this, arguments);

}

Q.mixin(Places_Zipcode, Q.require('Base/Places/Zipcode'));

module.exports = Places_Zipcode;