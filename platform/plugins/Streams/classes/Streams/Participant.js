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

function _subscribe(what, userId, publisherId, streamName, callback) {
	Streams.Participant.UPDATE().where({
		userId: userId,
		publisherId: publisherId,
		streamName: streamName
	}).set({
		subscribed: what ? 'yes' : 'no'
	}).execute(callback);
}

Q.mixin(Streams_Participant, Q.require('Base/Streams/Participant'));


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
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_Participant.prototype.setUp = function () {
	// put any code here
};

module.exports = Streams_Participant;
