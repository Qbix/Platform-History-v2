/**
 * Class representing hostname_session rows.
 *
 * @module Metrics
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'HostnameSession' rows in the 'Metrics' database
 * <br/>records whether a session has visited a domain
 * @namespace Metrics
 * @class HostnameSession
 * @extends Base.Metrics.HostnameSession
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Metrics_HostnameSession (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Metrics_HostnameSession.constructors.apply(this, arguments);

}

Q.mixin(Metrics_HostnameSession, Q.require('Base/Metrics/HostnameSession'));

module.exports = Metrics_HostnameSession;