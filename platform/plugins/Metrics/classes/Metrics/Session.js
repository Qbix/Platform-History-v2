/**
 * Class representing session rows.
 *
 * @module Metrics
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Session' rows in the 'Metrics' database
 * @namespace Metrics
 * @class Session
 * @extends Base.Metrics.Session
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Metrics_Session (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Metrics_Session.constructors.apply(this, arguments);

}

Q.mixin(Metrics_Session, Q.require('Base/Metrics/Session'));

module.exports = Metrics_Session;