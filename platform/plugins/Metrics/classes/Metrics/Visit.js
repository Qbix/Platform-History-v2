/**
 * Class representing visit rows.
 *
 * @module Metrics
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Visit' rows in the 'Metrics' database
 * @namespace Metrics
 * @class Visit
 * @extends Base.Metrics.Visit
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Metrics_Visit (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Metrics_Visit.constructors.apply(this, arguments);

}

Q.mixin(Metrics_Visit, Q.require('Base/Metrics/Visit'));

module.exports = Metrics_Visit;