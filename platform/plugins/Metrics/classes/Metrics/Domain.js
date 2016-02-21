/**
 * Class representing domain rows.
 *
 * @module Metrics
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Domain' rows in the 'Metrics' database
 * @namespace Metrics
 * @class Domain
 * @extends Base.Metrics.Domain
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Metrics_Domain (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Metrics_Domain.constructors.apply(this, arguments);

}

Q.mixin(Metrics_Domain, Q.require('Base/Metrics/Domain'));

module.exports = Metrics_Domain;