/**
 * Class representing postcode rows.
 *
 * @module Places
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Postcode' rows in the 'Places' database
 * @namespace Places
 * @class Postcode
 * @extends Base.Places.Postcode
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Places_Postcode (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Places_Postcode.constructors.apply(this, arguments);

}

Q.mixin(Places_Postcode, Q.require('Base/Places/Postcode'));

module.exports = Places_Postcode;