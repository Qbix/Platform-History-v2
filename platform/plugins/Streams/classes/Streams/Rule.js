/**
 * Class representing rule rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');
var Streams = Q.require('Streams');
var Base_Streams_Rule = Q.require('Base/Streams/Rule');

/**
 * Class representing 'Rule' rows in the 'Streams' database
 * <br/>rules applied on the user's side for notifications coming in
 * @namespace Streams
 * @class Rule
 * @extends Base.Streams.Rule
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Rule (fields) {

	// Run constructors of mixed in objects
	Streams_Rule.constructors.apply(this, arguments);

}

Q.mixin(Streams_Rule, Base_Streams_Rule);

/**
 * Calculate ordinal for the rule
 * @method beforeSave
 * @param {mixed} value
 * @param {function} callback
 */
Streams_Rule.prototype.beforeSave = function (value, callback) {
	if (!this._retrieved) {
		var self = this;
		var q = Streams.Rule.SELECT("MAX(ordinal) max").where({
			ofUserId: this.fields.ofUserId,
			publisherId: this.fields.publisherId,
			streamName: this.fields.streamName
		});
		delete q.className;
		q.execute(function(err, rows) {
			if (err) return callback.call(self, err);
			value['ordinal'] = self.fields.ordinal = rows[0] && rows[0].fields && rows[0].fields.max !== null ? rows[0].fields.max + 1 : 0;
			callback.call(self, null, Base_Streams_Rule.prototype.beforeSave.call(self, value));
		});
	}
};

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_Rule.prototype.setUp = function () {
	// put any code here
};

module.exports = Streams_Rule;