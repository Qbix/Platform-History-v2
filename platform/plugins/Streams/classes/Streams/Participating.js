/**
 * Class representing participating rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Participating' rows in the 'Streams' database
 * <br/>stored primarily on the participating user's fm server
 * @namespace Streams
 * @class Participating
 * @extends Base.Streams.Participating
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Participating (fields) {

	// Run constructors of mixed in objects
	Streams_Participating.constructors.apply(this, arguments);

}

var Streams = Q.require('Streams');
var _freshEvents = {};

function _freshHandler (event) {
	return function (stream, uid) {
		var s = _freshEvents[event];
		if (!uid || s.validate && !s.validate(stream, uid)) return;
		var params = { publisherId: stream.publisherId, streamName: stream.name };
		if (s.action) {
			if (s.user) params.userId = uid; // increase only for one user
			else if (s.user === false) params["userId !="] = uid; // increase for all but current
			// is user param is undefined increase for all users
		} else {
			if (s.user) params.userId = uid;
		}
		Streams_Participating.UPDATE().where(params).set({fresh: s.action ? 1 : 0}).execute(function (err) {
			if (err) {
				Q.log("ERROR: Could not update 'fresh' on event '"+event+"'");
				Q.log(err);
			}
		});
	};
}

/**
 * Check if event should refresh device status and update badge
 * This method can be overriden in application script to enable badges
 * @method freshEvent
 * @param online {boolean}
 * @param event {string}
 * @param type {string|undefined} should be set to message type for 'post' event
 * @return {boolean}
 */
Streams_Participating.freshEvent = function (online, event, stream, uid) {
	var e = (event === 'post') ? event+'/'+stream.type : event;
	return e in _freshEvents && (!_freshEvents[e].validate || _freshEvents[e].validate(stream, uid));
};

/**
 * Register event which should influence fresh field
 * @method registerFreshEvent
 * @param event {string}
 * @param set {?boolean} Wheather set fresh = 1 or 0
 * @param user {?boolean|null|undeafined} If set is true -
 *	if true increase only for this user, if false - for all but this user, if undefined or null - for all users.
 * @param validate {?function} Optional function to with arguments [stream, userId] (or [message, userId] for 'post')
 *	to validate if fresh should be changed. Returns boolean
 */
Streams_Participating.registerFreshEvent = function (event, set, user, validate) {
	if (!(event in _freshEvents)) {
		var listener = _freshHandler(event);
		_freshEvents[event] = {listener: listener};
		Streams.Stream.on(event, listener);
	}
	var s = _freshEvents[event];
	s.action = !!set;
	s.user = user;
	if (typeof validate === "function") s.validate = validate;
};

/**
 * Unregister fresh event
 * @method unregisterFreshEvent
 * @param event {string}
 */
Streams_Participating.unregisterFreshEvent = function (event) {
	if (_freshEvents[event]) {
		Streams.Stream.removeListener(event, _freshEvents[event].listener);
		delete _freshEvents[event];
		return true;
	}
};

Q.mixin(Streams_Participating, Q.require('Base/Streams/Participating'));


/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_Participating.prototype.setUp = function () {
	// put any code here
};

module.exports = Streams_Participating;
