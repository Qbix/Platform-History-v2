/**
 * Class representing subscription_rule rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');
var SubscriptionRule = Q.require('Base/Streams/SubscriptionRule');

/**
 * Class representing 'SubscriptionRule' rows in the 'Streams' database
 * <br>rules applied on the user's side for notifications coming in
 * @namespace Streams
 * @class SubscriptionRule
 * @extends Base.Streams.SubscriptionRule
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Streams_SubscriptionRule (fields) {

	// Run mixed-in constructors
	Streams_SubscriptionRule.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin(Streams_SubscriptionRule, SubscriptionRule);

/*
 * Add any public methods here by assigning them to Streams_SubscriptionRule.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_SubscriptionRule.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Streams_SubscriptionRule;