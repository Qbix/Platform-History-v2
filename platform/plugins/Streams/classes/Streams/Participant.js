/**
 * Class representing participant rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Participant' rows in the 'Streams' database
 * <br/>stored primarily on publisherId's fm server
 * @namespace Streams
 * @class Participant
 * @extends Base.Streams.Participant
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Participant (fields) {

	// Run constructors of mixed in objects
	Streams_Participant.constructors.apply(this, arguments);
	
}

var Streams = Q.require('Streams');
var Base = Q.require('Base/Streams/Participant');
Q.mixin(Streams_Participant, Base);

function _subscribe(what, userId, publisherId, streamName, callback) {
	Streams.Participant.UPDATE().where({
		userId: userId,
		publisherId: publisherId,
		streamName: streamName
	}).set({
		subscribed: what ? 'yes' : 'no'
	}).execute(callback);
}

Streams_Participant.subscribe = function (userId, publisherId, streamName, callback) {
	_subscribe(true, userId, publisherId, streamName, callback);
};

Streams_Participant.unsubscribe = function (userId, publisherId, streamName, callback) {
	_subscribe(false, userId, publisherId, streamName, callback);
	/* * * */
}

Streams_Participant.prototype.subscribe = function(callback) {
	_subscribe(true, this.fields.userId, this.fields.publisherId, this.fields.streamName, callback);
};

Streams_Participant.prototype.unsubscribe = function(callback) {
	_subscribe(false, this.fields.userId, this.fields.publisherId, this.fields.streamName, callback);
};

/**
 * Get the names of the possible states
 * @method states
 * @static
 * @return {Array}
 */
Streams_Participant.states = function() {
	var column = Base.column_state();
	return JSON.parse(('[' + column[0][1] + ']').replaceAll({"'": '"'}));
};

var Pp = Streams_Participant.prototype;

/**
 * Get all extra attributes
 *
 * @method getAllExtras
 * @return {Object}
 */
Pp.getAllExtras = function _Participant_prototype_getAllExtras () {
	try {
		return JSON.parse(this.fields.extra);
	} catch (e) {
		return {};
	}
};

/**
 * Get the value of an extra
 *
 * @method getExtra
 * @param {String} extraName the name of the extra to get
 * @return {Mixed}
 */
Pp.getExtra = function _Participant_prototype_getExtra (extraName) {
	var extras = this.getAllExtras();
	return extras[extraName];
};

/**
 * Test whether participant has one or more roles in stream
 * 
 * @param {String|Array} roles You can pass a role name, or array of role names
 * @return {Boolean} whether the user has all the roles
 */
Pp.testRoles = function _Participant_prototype_testRoles (roles) {
	var extras = this.getAllExtras();
	if (typeof roles === 'string') {
		if (extras.role === roles) {
			return true;
		}
		roles = [roles];
	} else if (roles.length == 1 && extras.role === roles[0]) {
		return true;
	}
	for (var i=0, l=roles.length; i<l; ++i) {
		if (extras.roles.indexOf(roles[i]) < 0) {
			return false;
		}
	}
	return true;
};

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_Participant.prototype.setUp = function () {
	// put any code here
};

module.exports = Streams_Participant;
