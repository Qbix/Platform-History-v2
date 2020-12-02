/**
 * Class representing Streams/Mentions.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Streams_Message = Q.require('Streams/Message');
var Streams_Avatar = Q.require('Streams/Avatar');

Q.on('init', function () {
	Streams_Message.addHandler('', 'Streams/chat/message', function (obj, callback) {
		var message = obj.message;
		var byUserId = message.fields.byUserId;
		var content = message.fields.content;
		var instructions = message.getInstruction('Streams/mentions') || [];
		var matches = content.matchTypes('qbixUserId');

		if (!instructions.length || !matches.length) {
			return Q.handle(callback, this, [obj]);
		}

		var pipe = Q.pipe(matches, function () {
			Q.handle(callback, this, [obj]);
		});

		Q.each(matches, function (i, string) {
			var userId = string.replace(/@/g, '');

			if (instructions.indexOf(userId) === -1) {
				return pipe.fill(string)();
			}

			Streams_Avatar.fetch(byUserId, userId, function (err, avatar) {
				if (err) {
					return pipe.fill(string)();
				}

				message.fields.content = message.fields.content.replace(string, avatar.displayName({short: true}));
				pipe.fill(string)();
			});
		});
	});
});

/**
 * Class Mentions
 * <br>stored primarily on publisherId's shard
 * @namespace Streams
 * @class Mentions
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function Streams_Mentions (fields) {

}

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_Mentions.prototype.setUp = function () {
	// put any code here
};

module.exports = Streams_Mentions;