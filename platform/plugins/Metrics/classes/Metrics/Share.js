/**
 * Class representing share rows.
 *
 * @module Metrics
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Share' rows in the 'Metrics' database
 * @namespace Metrics
 * @class Share
 * @extends Base.Metrics.Share
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Metrics_Share (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Metrics_Share.constructors.apply(this, arguments);

}

Q.mixin(Metrics_Share, Q.require('Base/Metrics/Share'));

module.exports = Metrics_Share;