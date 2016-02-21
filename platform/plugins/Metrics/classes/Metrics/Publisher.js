/**
 * Class representing publisher rows.
 *
 * @module Metrics
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Publisher' rows in the 'Metrics' database
 * @namespace Metrics
 * @class Publisher
 * @extends Base.Metrics.Publisher
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Metrics_Publisher (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Metrics_Publisher.constructors.apply(this, arguments);

}

Q.mixin(Metrics_Publisher, Q.require('Base/Metrics/Publisher'));

module.exports = Metrics_Publisher;