"use strict";
/*jshint node:true */
/**
 * Streams model
 * @module Streams
 * @main Streams
 */
var Q = require('Q');
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

/**
 * Static methods for the Streams model
 * @class Streams
 * @extends Base.Streams
 * @static
 */
function Streams() { }
module.exports = Streams;

var Base_Streams = require('Base/Streams');
Q.mixin(Streams, Base_Streams);


/*
 * This is where you would place all the static methods for the models,
 * the ones that don't strongly pertain to a particular row or table.
 * Just assign them as methods of the Streams object.
 
 * * * */

if (!Q.plugins.Users) {
	throw new Q.Exception("Streams: Users plugin is required");
}

var util = require('util');
var Db = Q.require('Db');
var Users = Q.plugins.Users;
var socket = null;

Q.makeEventEmitter(Streams);

/**
 * Read levels
 * @property READ_LEVEL
 * @type Object
 */
/**
 * Can't see the stream
 * @property READ_LEVEL.none
 * @type integer
 * @default 0
 * @final
 */
/**
 * Can see icon and title
 * @property READ_LEVEL.see
 * @type integer
 * @default 10
 * @final
 */
/**
 * Can see teaser:Streams/.. attributes
 * @property READ_LEVEL.teaser
 * @type integer
 * @default 15
 * @final
 */
/**
 * Can see relations to other streams
 * @property READ_LEVEL.relations
 * @type integer
 * @default 20
 * @final
 */
/**
 * Can see the stream's content
 * @property READ_LEVEL.content
 * @type integer
 * @default 23
 * @final
 *//**
 * Can see most of the stream's fields
 * @property READ_LEVEL.fields
 * @type integer
 * @default 25
 * @final
 */
/**
 * Can see participants in the stream
 * @property READ_LEVEL.participants
 * @type integer
 * @default 30
 * @final
 */
/**
 * Can play stream in a player
 * @property READ_LEVEL.messages
 * @type integer
 * @default 35
 * @final
 */
/**
 * Can see other users' play receipts
 * @property READ_LEVEL.receipts
 * @type integer
 * @default 35
 * @final
 */
/**
 * Max read level
 * @property READ_LEVEL.max
 * @type integer
 * @default 40
 * @final
 */
Streams.READ_LEVEL = {
	'none':			0,		// can't see the stream
	'see':			10,		// can see icon and title
	'teaser':		15, 	// can see teaser:Streams/.. attributes
	'relations':	20,		// can see relations to other streams
	'content':		23,		// can see the stream's content
	'fields':		25,		// can see most of the stream's fields
	'participants':	30,		// can see participants in the stream
	'messages':		35,		// can play stream in a player
	'receipts':     40, 	// can see other users' play receipts
	'max':      	40  	// max read level
};
/**
 * Write levels
 * @property WRITE_LEVEL
 * @type Object
 */
/**
 * Cannot affect stream or participants list
 * @property WRITE_LEVEL.none
 * @type integer
 * @default 0
 * @final
 */
/**
 * Can become a participant, chat, and leave
 * @property WRITE_LEVEL.join
 * @type integer
 * @default 10
 * @final
 */
/**
 * Can vote for a relation message posted to the stream.
 * @property WRITE_LEVEL.vote
 * @type integer
 * @default 13
 * @final
 */
/**
 * Can post messages, but manager must approve
 * @property WRITE_LEVEL.suggest
 * @type integer
 * @default 15
 * @final
 */
/**
 * Can contribute to the stream (e.g. "join the stage")
 * @property WRITE_LEVEL.contribute
 * @type integer
 * @default 18
 * @final
 */
/**
 * Can send ephemeral payloads to the stream to be broadcast
 * @property WRITE_LEVEL.ephemeral
 * @type integer
 * @default 19
 * @final
 */
/**
 * Can post durable messages which appear immediately
 * @property WRITE_LEVEL.messages
 * @type integer
 * @default 20
 * @final
 */
/**
 * Can post messages relating other streams to this one
 * @property WRITE_LEVEL.relate
 * @type integer
 * @default 23
 * @final
 */
/**
 * Can update weights and relations directly, and unrelate
 * @property WRITE_LEVEL.relations
 * @type integer
 * @default 25
 * @final
 */
/**
 * Can post messages to edit stream content immediately
 * @property WRITE_LEVEL.edit
 * @type integer
 * @default 30
 * @final
 */
/**
 * Can post a message requesting to close the stream
 * @property WRITE_LEVEL.closePending
 * @type integer
 * @default 35
 * @final
 */
/**
 * Don't delete, just prevent any new changes to stream
 * however, joining and leaving is still ok
 * @property WRITE_LEVEL.close
 * @type integer
 * @default 40
 * @final
 */
/**
 * Max write level
 * @property WRITE_LEVEL.max
 * @type integer
 * @default 40
 * @final
 */
Streams.WRITE_LEVEL = {
	'none':			0,		// cannot affect stream or participants list
	'join':			10,		// can become a participant, chat, and leave
	'vote':         13,		// can vote for a relation message posted to the stream
	'contribute':   18,		// can contribute to the stream (e.g. "join the stage")
	'ephemeral':    19, 	// can send ephemeral payloads to the stream to be broadcast
	'post':			20,		// can post durable messages which take effect immediately
	'relate':       23,		// can relate other streams to this one
	'relations':    25,		// can update weights and relations directly
	'suggest':	    28,		// can suggest actions, but manage must approve
	'edit':			30,		// can edit stream content immediately
	'closePending':	35,		// can post a message requesting to close the stream
	'close':		40,		// don't delete, just prevent any new changes to stream
							// however, joining and leaving is still ok
	'max':      	40 		// max write level
};
/**
 * Admin levels
 * @property ADMIN_LEVEL
 * @type Object
 */
/**
 * Cannot do anything related to admin / users
 * @property ADMIN_LEVEL.none
 * @type integer
 * @default 0
 * @final
 */
/**
 * Can prove things about the stream's content or participants
 * @property ADMIN_LEVEL.tell
 * @type integer
 * @default 10
 * @final
 */
/**
 * Can share the stream's actual content with others
 * @property $ADMIN_LEVEL.share
 * @type integer
 * @default 15
 * @final
 */
/**
 * Able to create invitations for others, granting access
 * and permissions up to what they themselves have
 * @property ADMIN_LEVEL.invite
 * @type integer
 * @default 20
 * @final
 */
/**
 * Can approve posts, and give people any adminLevel < 'manage'
 * @property ADMIN_LEVEL.manage
 * @type integer
 * @default 30
 * @final
 */
/**
 * Can give people any adminLevel <= 'own'
 * @property ADMIN_LEVEL.own
 * @type integer
 * @default 40
 * @final
 */
/**
 * Max admin level
 * @property ADMIN_LEVEL.max
 * @type integer
 * @default 40
 * @final
 */
Streams.ADMIN_LEVEL = {
	'none':	 		0,		// cannot do anything related to admin / users
	'tell':	 		10,		// can prove things about the stream's content or participants
	'share': 		15,		// can share the stream's actual content with others
	'invite':		20,		// able to create invitations for others, granting access
	'manage':		30,		// can approve posts and give people any adminLevel < 30
	'own':			40,		// can give people any adminLevel <= 40
	'max':      	40  	// max admin level
};
/**
 * Access sources
 * @property ACCESS_SOURCES
 * @type object
 */
/**
 * Public access
 * @config ACCESS_SOURCES['public']
 * @type integer
 * @default 0
 * @final
 */
/**
 * From contact
 * @config ACCESS_SOURCES['contact']
 * @type integer
 * @default 1
 * @final
 */
/**
 * From participant
 * @config ACCESS_SOURCES['participant']
 * @type integer
 * @default 2
 * @final
 */
/**
 * Direct access
 * @config ACCESS_SOURCES['direct']
 * @type integer
 * @default 3
 * @final
 */
/**
 * Inherited public access
 * @config ACCESS_SOURCES['inherited_public']
 * @type integer
 * @default 4
 * @final
 */
/**
 * Inherited from contact
 * @config ACCESS_SOURCES['inherited_contact']
 * @type integer
 * @default 5
 * @final
 */
/**
 * Inherited from participant
 * @config ACCESS_SOURCES['inherited_participant']
 * @type integer
 * @default 6
 * @final
 */
/**
 * Inherited direct access
 * @config ACCESS_SOURCES['inherited_direct']
 * @type integer
 * @default 7
 * @final
 */
Streams.ACCESS_SOURCES = {
	'public':                0,
	'contact':               1,
	'participant':           2,
	'direct':                3,
	'inherited_public':      4,
	'inherited_contact':     5,
	'inherited_participant': 6,
	'inherited_direct':      7
};

Streams.defined = {};

/**
 * Call this function to set a constructor for a stream type
 * @static
 * @method define
 * @param {String} type The type of the message, e.g. "Streams/chat/message"
 * @param {String|Function} ctor Your message's constructor, or path to a javascript file which will define it
 * @param {Object} methods An optional hash of methods. You can also override methods of the
 *  Stream object, such as "url".
 */
Streams.define = function (type, ctor, methods) {
	if (typeof type === 'object') {
		for (var t in type) {
			Streams.define(t, type[t]);
		}
		return;
	};
	type = Q.normalize(type);
	if (typeof ctor !== 'function') {
		throw new Q.Error("Streams.Stream.define requires ctor to be a function");
	}
	function CustomStreamConstructor() {
		CustomStreamConstructor.constructors.apply(this, arguments);
		ctor.apply(this, arguments);
	}
	Q.mixin(CustomStreamConstructor, Streams.Stream);
	Q.extend(CustomStreamConstructor.prototype, methods);	
	return Streams.defined[type] = CustomStreamConstructor;
};

/**
 * Start internal listener for Streams plugin. Accepts messages such as<br/>
 * "Streams/Stream/join",
 * "Streams/Stream/leave",
 * "Streams/Stream/create",
 * "Streams/Stream/remove",
 * "Streams/Message/post",
 * "Streams/Message/postMessages",
 * "Streams/Stream/invite"
 * @method listen
 * @static
 * @param {Object} options={} So far no options are implemented.
 * @return {Object} Object with any servers that have been started, "internal" or "socket"
 */
Streams.listen = function (options, servers) {

	if (Streams.listen.result) {
		return Streams.listen.result;
	}
	
	// Start internal server
	var server = Q.listen();	
	server.attached.express.post('/Q/node', Streams_request_handler);

	// Start external socket server
	var node = Q.Config.get(['Q', 'node']);
	if (!node) {
		return false;
	}
	var pubHost = Q.Config.get(['Streams', 'node', 'host'], Q.Config.get(['Q', 'node', 'host'], null));
	var pubPort = Q.Config.get(['Streams', 'node', 'port'], Q.Config.get(['Q', 'node', 'port'], null));

	if (pubHost === null) {
		throw new Q.Exception("Streams: Missing config field: Streams/node/host");
	}
	if (pubPort === null) {
		throw new Q.Exception("Streams: Missing config field: Streams/node/port");
	}

	// Handle messages being posted to streams
	Streams.Stream.on('post', function (stream, msg, clientId) {
		if (!stream) {
			return console.error("Streams.Stream.on POST: invalid stream!!!");
		}

		if (_messageHandlers[msg.fields.type]) {
			_messageHandlers[msg.fields.type].call(this, msg);
		}

		Streams.Stream.emit('post/'+msg.fields.type, stream, msg);
		stream.notifyParticipants('Streams/post', msg);
	});

	/**
	 * @property socketServer
	 * @type {SocketNamespace}
	 * @private
	 */
	socket = Users.Socket.listen({
		host: pubHost,
		port: pubPort,
		https: Q.Config.get(['Q', 'node', 'https'], false) || {},
	});

	socket.io.of('/Q').on('connection', function(client) {
		if (client.alreadyListeningStreams) {
			return;
		}
		client.alreadyListeningStreams = true;

		client.on('Streams/observe',
		function (publisherId, streamName, messageCount, fn) {
			if (typeof messageCount === 'number') {
				Streams.Message.SELECT().where({
					publisherId: publisherId,
					streamName: streamName,
					ordinal: new Db.Range(messageCount, false)
				}).execute(function (err, rows) {
					_continue(err ? [] : rows.map(row => row.fields));
				});
			}
			function _continue(messages) {
				var NotAuthorizedException = {
					type: 'Users.Exception.NotAuthorized',
					message: 'Not  Authorized'
				};
				var now = Date.now() / 1000;
				if (!Q.Utils.validateCapability(client.capability, 'Streams/observe')) {
					return (typeof fn == 'function') && fn(NotAuthorizedException);
				}
				if (typeof publisherId !== 'string'
				|| typeof streamName !== 'string') {
					return (typeof fn == 'function') && fn({
						type: 'Streams.Exception.BadArguments',
						message: 'Bad arguments'
					});
				}
				var observer = Q.getObject(
					[publisherId, streamName, client.id], Streams.observers
				);
				if (observer) {
					return (typeof fn == 'function') && fn(null, []);
				}
				var byUserId = client.capability.userId;
				Streams.fetchOne(byUserId || '', publisherId, streamName, function (err, stream) {
					if (err || !stream) {
						return (typeof fn == 'function') && fn(NotAuthorizedException);
					}
					stream.testReadLevel('messages', function (err, allowed) {
						if (err || !allowed) {
							return (typeof fn == 'function') && fn(NotAuthorizedException);
						}
						var clients = Q.getObject([publisherId, streamName], Streams.observers) || {};
						var max = Streams.Stream.getConfigField(
							stream.fields.type,
							'observersMax'
						);
						if (max && Object.keys(clients).length >= max - 1) {
							return (typeof fn == 'function') && fn({
								type: 'Streams.Exception.TooManyObservers',
								message: 'too many observers already'
							});
						}
						Q.setObject(
							[publisherId, streamName, client.id], client, Streams.observers
						);
						Q.setObject(
							[client.id, publisherId, streamName], true, Streams.observing
						);
						return (typeof fn == 'function') && fn(null, messages);
					});
				});
			}
		});
		client.on('Streams/neglect',
		function (publisherId, streamName, fn) {
			var o = Streams.observers;
			if (!Q.getObject([publisherId, streamName, client.id], o)) {
				return (typeof fn == 'function') && fn(null, false);
			}
			delete o[publisherId][streamName][client.id];
			delete Streams.observing[client.id][publisherId][streamName];
			return (typeof fn == 'function') && fn(null, true);
		});
		client.on('Streams/ephemeral',
		function (publisherId, streamName, payload, dontNotifyObservers, fn) {
			if (!payload.type) {
				return (typeof fn == 'function') && fn("Payload must have type set");
			}
			if (!Q.Utils.validateCapability(client.capability, 'Users/socket')) {
				return (typeof fn == 'function') && fn("Capability not valid", null);
			}
			var byUserId = client.capability.userId;
			Streams.fetchOne(byUserId, publisherId, streamName, function (err, stream) {
				if (err) {
					return (typeof fn == 'function') && fn(err, false);
				}
				var ephemeralTypes  = Streams.Stream.getConfigField(
					stream.fields.type,
					'ephemerals'
				);
				if (!ephemeralTypes[payload.type]) {
					var err2 = 'Ephemeral of type "' + payload.type
						+ '" is not supported by stream of type "' + stream.fields.type + '"';
					return (typeof fn == 'function') && fn(err2, false);
				}
				var ephemeral = new Streams.Ephemeral(payload, Date.now() / 1000);
				this.notifyParticipants(
					'Streams/ephemeral', ephemeral, dontNotifyObservers, fn
				);
			});
		});
		client.on('disconnect', function () {
			var observing = Streams.observing[client.id];
			if (!observing) {
				return;
			}
			for (var publisherId in observing) {
				var p = observing[publisherId];
				for (var streamName in p) {
					delete Streams.observers[publisherId][streamName][client.id];
				}
			}
			delete Streams.observing[client.id];
		});
	});
	return Streams.listen.result = {
		internal: server,
		socket: socket
	};
};

/**
 * Stores socket.io clients observing streams
 * @property clients
 * @type {Object}
 */ 
Streams.observers = {};

/**
 * Stores streams that socket.io clients are observing
 * @property clients
 * @type {Object}
 */ 
Streams.observing = {};

function Streams_request_handler (req, res, next) {
	var parsed = req.body;
	if (!parsed || !parsed['Q/method']
	|| !req.internal || !req.validated) {
		return next();
	}
	var participant, msg, posted, streams, k;
	var userIds, invitingUserId, username, appUrl, label, addLabel, addMyLabel, alwaysSend;
	var readLevel, writeLevel, adminLevel, permissions, displayName, expireTime, logKey;
	var clientId = parsed["Q.clientId"];
	var stream = parsed.stream
		&& Streams.Stream.construct(JSON.parse(parsed.stream), true);
	var userId = parsed.userId;
	var participated = false;
	switch (parsed['Q/method']) {
		case 'Streams/Stream/join':
			participant = new Streams.Participant(JSON.parse(parsed.participant));
			participant.fillMagicFields();
			userId = participant.fields.userId;
			if (Q.Config.get(['Streams', 'logging'], false)) {
				Q.log('Streams.listen: Streams/Stream/join {'
					+ '"publisherId": "' + stream.fields.publisherId
					+ '", "name": "' + stream.fields.name
					+ '"}'
				);
			}
			// invalidate cache for this stream
//				Streams.getParticipants.forget(stream.fields.publisherId, stream.fields.name);
			// inform user's clients about change
			Users.Socket.emitToUser(userId, 'Streams/join', participant);
			Streams.Stream.emit('join', stream, userId, clientId);
			break;
		case 'Streams/Stream/visit':
			participant = JSON.parse(parsed.participant);
			userId = participant.userId;
			Streams.Stream.emit('visit', stream, userId, clientId);
			break;
		case 'Streams/Stream/leave':
			participant = new Streams.Participant(JSON.parse(parsed.participant));
			participant.fillMagicFields();
			userId = participant.fields.userId;
			if (Q.Config.get(['Streams', 'logging'], false)) {
				Q.log('Streams.listen: Streams/Stream/leave {'
					+ '"publisherId": "' + stream.fields.publisherId
					+ '", "name": "' + stream.fields.name
					+ '"}'
				);
			}
			// invalidate cache for this stream
//				Streams.getParticipants.forget(stream.fields.publisherId, stream.fields.name);
			// inform user's clients about change
			Users.Socket.emitToUser(userId, 'Streams/leave', participant);
			Streams.Stream.emit('leave', stream, userId, clientId);
			break;
		case 'Streams/Stream/remove':
			if (Q.Config.get(['Streams', 'logging'], false)) {
				Q.log('Streams.listen: Streams/Stream/remove {'
					+ '"publisherId": "' + stream.fields.publisherId
					+ '", "name": "' + stream.fields.name
					+ '"}'
				);
			}
			// invalidate cache
			stream.notifyParticipants('Streams/remove', null, {
				publisherId: stream.fields.publisherId, 
				name: stream.fields.name
			});
			Streams.Stream.emit('remove', stream, clientId);
			break;
		case 'Streams/Stream/create':
			if (Q.Config.get(['Streams', 'logging'], false)) {
				Q.log('Streams.listen: Streams/Stream/create {'
					+ '"publisherId": "' + stream.fields.publisherId
					+ '", "name": "' + stream.fields.name
					+ '"}'
				);
			}
			Streams.Stream.emit('create', stream, clientId);
			// no need to notify anyone
			break;
		case 'Streams/Message/post':
			msg = Streams.Message.construct(JSON.parse(parsed.message), true);
			msg.fillMagicFields();
			if (Q.Config.get(['Streams', 'logging'], false)) {
				Q.log('Streams.listen: Streams/Message/post {'
					+ '"publisherId": "' + stream.fields.publisherId
					+ '", "name": "' + stream.fields.name
					+ '", "msg.type": "' + msg.fields.type
					+ '"}'
				);
			}
			Streams.Stream.emit('post', stream, msg, clientId);
			break;
		case 'Streams/Message/postMessages':
			posted = JSON.parse(parsed.posted);
			streams = parsed.streams && JSON.parse(parsed.streams);
			if (!streams) break;
			for (k in posted) {
				msg = Streams.Message.construct(posted[k], true);
				msg.fillMagicFields();
				stream = Streams.Stream.construct(
					streams[msg.fields.publisherId][msg.fields.streamName], true
				);
				if (Q.Config.get(['Streams', 'logging'], false)) {
					Q.log('Streams.listen: Streams/Message/post {'
						+ '"publisherId": "' + stream.fields.publisherId
						+ '", "name": "' + stream.fields.name
						+ '", "msg.type": "' + msg.fields.type
						+ '"}'
					);
				}
				Streams.Stream.emit('post', stream, msg, clientId);
			}
			break;
		case 'Streams/Stream/invite':
			try {
				userIds = JSON.parse(parsed.userIds);
				invitingUserId = parsed.invitingUserId;
				username = parsed.username;
				appUrl = parsed.appUrl;
				readLevel = parsed.readLevel || null;
				writeLevel = parsed.writeLevel || null;
				adminLevel = parsed.adminLevel || null;
				permissions = parsed.permissions || null;
				displayName = parsed.displayName || '';
				label = parsed.label || '';
				addLabel = parsed.addLabel || [];
				addMyLabel = parsed.addMylabel || [];
				alwaysSend = parsed.alwaysSend || false;
				expireTime = parsed.expireTime ? new Date(parsed.expireTime*1000) : null;
			} catch (e) {
				return res.send({data: false});
			}
			res.send({data: true});
			if (logKey = Q.Config.get(['Streams', 'logging'], false)) {
				Q.log(
				    'Streams.listen: Streams/Stream/invite {'
					+ '"publisherId": "' + stream.fields.publisherId
					+ '", "name": "' + stream.fields.name
					+ '", "userIds": ' + parsed.userIds
					+ '}',
					logKey
				);
			}

			if (expireTime && expireTime <= new Date()) {
			    break;
			}
			
			persist();
			
			return;
		case "Streams/Notification/pause":
			Streams.Notification.paused = true;
			break;
		case "Streams/Notification/resume":
			Streams.Notification.paused = false;
			break;
		default:
			break;
	}
	return next();
	
	function persist () {
	
		Q.each(userIds, function (i, userId) {
			var token = null;
			var user = null;
			
		    // TODO: Change this to a getter, so that we can do throttling in case there are too many userIds
			
			(new Users.User({
				"userId": userId
			})).retrieve(_user);
			
			function _user(err, rows) {
				if (!rows || !rows.length) {
					// User wan't found in the dtabase
					return;
				}
				user = rows[0];

				(new Streams.Participant({
					"publisherId": stream.fields.publisherId,
					"streamName": stream.fields.name,
					"userId": userId,
					"state": "participating"
				})).retrieve(_participant);
			}
			
			function _participant(err, rows) {
				if (rows && rows.length) {
					participated = true;

					// if alwaysSend do further
					if (!alwaysSend) {
						// User is already a participant in the stream.
						return;
					}
				}
				var extra = {};
				if (label) {
					extra.label = label;
				}
				if (addLabel) {
					extra.addLabel = addLabel;
				}
				if (addMyLabel) {
					extra.addMyLabel = addMyLabel;
				}
				(new Streams.Invite({
					"userId": userId,
					"state": "pending",
					"publisherId": stream.fields.publisherId,
					"streamName": stream.fields.name,
					"invitingUserId": invitingUserId,
					"displayName": displayName,
					"appUrl": appUrl,
					"readLevel": readLevel,
					"writeLevel": writeLevel,
					"adminLevel": adminLevel,
					"permissions": permissions,
					"expireTime": expireTime,
					"extra": JSON.stringify(extra)
				})).save(_inviteSaved);
			}
			
			var invite;

			function _inviteSaved(err) {
				if (err) {
					Q.log("ERROR: Failed to save Streams.Invite for user '"+userId+"' during invite");
					Q.log(err);
					return;
				}
				token = this.fields.token;
				invite = this;
				// now ready to save Streams.Invited row
				(new Streams.Invited({
					"token": token,
					"userId": userId,
					"state": "pending",
					"expireTime": expireTime
				})).save(_invitedSaved);
			}

			function _invitedSaved(err) {
				if (err) {
					Q.log("ERROR: Failed to save Streams.Invited for user '"+userId+"' during invite");
					Q.log(err);
					return;
				}
				if (participated) {
					_participantSaved();
				} else {
					(new Streams.Participant({
						"publisherId": stream.fields.publisherId,
						"streamName": stream.fields.name,
						"streamType": stream.fields.type,
						"userId": userId,
						"state": "invited",
						"reason": ""
					})).save(true, _participantSaved);
				}

				// Write some files, if requested
				// SECURITY: Here we trust the input, which should only be sent internally
				if (parsed.template) {
					new Users.User({id: userId})
					.retrieve(function () {
						var fields = Q.extend({}, parsed, {
							stream: stream,
							user: this,
							invite: invite,
							link: invite.url(),
							app: Q.app.name,
							communityId: Users.communityId(),
							communityName: Users.communityName(),
							appRootUrl: Q.Config.expect(['Q', 'web', 'appRootUrl'])
						});
						var html = Q.Handlebars.render(parsed.template, fields);
						var path = Streams.invitationsPath(invitingUserId)
							+'/'+parsed.batchName;
						var filename = path + '/'
							+ Q.normalize(stream.fields.publisherId) + '-'
							+ Q.normalize(stream.fields.name) + '-'
							+ this.fields.id + '.html';
						fs.writeFile(filename, html, function (err) {
							if (err) {
								Q.log(err);
							}
						});
					});
				}
			}

			function _participantSaved(err) {
				if (err) {
					Q.log("ERROR: Failed to save Streams.Participant for user '"+userId+"' during invite");
					Q.log(err);
					return;
				}

				// Now post a message to Streams/invited stream
				Streams.fetchOne(invitingUserId, userId, 'Streams/invited', _stream);
			}

			function _stream(err, invited) {
				if (err) {
					Q.log("ERROR: Failed to get invited stream for user '"+userId+"' during invite");
					Q.log(err);
					return;
				}
				Streams.Stream.emit('invite', invited.getFields(), userId, stream);
				if (!invited.testWriteLevel('post')) {
					Q.log("ERROR: Not authorized to post to invited stream for user '"+userId+"' during invite");
					return;
				}
				var inviteUrl = Streams.inviteUrl(token);
				displayName = displayName || "Someone";
				var text = Q.Text.get('Streams/content', { 
					language: user.fields.preferredLanguage
				});
				var msg = {
					publisherId: invited.fields.publisherId,
					streamName: invited.fields.name,
					byUserId: invitingUserId,
					type: 'Streams/invite',
					sentTime: new Db.Expression("CURRENT_TIMESTAMP"),
					state: 'posted',
					content: text.invite.messageContent.interpolate({
						displayName: displayName,
						inviteUrl: inviteUrl
					}),
					instructions: JSON.stringify({
						token: token,
						displayName: displayName,
						label: label,
						appUrl: appUrl,
						userId: userId,
						inviteUrl: inviteUrl,
						type: stream.fields.type,
						title: stream.fields.title,
						content: stream.fields.content,
						template: parsed.template,
						templateDir: parsed.templateDir
					})
				};
				invited.post(msg, function (err) {
					if (err) {
						Q.log("ERROR: Failed to save message for user '"+userId+"' during invite");
						Q.log(err);
					}
				});
			}
		});

    }
}

// Connection from socket.io
Users.on('connected', function(client, wasOnline) {
	if (!wasOnline) {
		// post "connected" message to Streams/participating stream
		new Streams.Stream({
			publisherId: client.userId,
			name: 'Streams/participating'
		}).post(client.userId, {
			type: 'Streams/connected'
		}, function(err) {
			if (err) console.error(err);
		});
	}
});

Users.on('disconnected', function (userId) {
	// post "disconnected" message to Streams/participating stream
	new Streams.Stream({
		publisherId: userId,
		name: 'Streams/participating'
	}).post({
		byUserId: userId,
		type: 'Streams/disconnected'
	}, function(err) {
		if (err) console.error(err);
		Q.log('User disconnected: ' + userId);
	});	
});

/**
 * Retrieve stream participants
 * @method getParticipants
 * @static
 * @param {String} publisherId The publisher Id
 * @param {String} streamName The name of the stream
 * @param {Function} [callback=null] Callback receives a map of {userId: participant} pairs
 */
Streams.getParticipants = function(publisherId, streamName, callback) {
	var args = arguments;
	if (!callback) return;
	Streams.Participant.SELECT('*').where({
		publisherId: publisherId,
		streamName: streamName
	}).execute(function (err, rows) {
		if (err) {
			Q.log(err);
//			Streams.getParticipants.forget(publisherId, streamName);
			callback({});
		} else {
			var result = {};
			for (var i=0; i<rows.length; ++i) {
				result [ rows[i].fields.userId ] = rows[i];
			}
			callback(result);
		}
	});
};

/**
 * Retrieve socket.io clients registered to observe the stream
 * by sending "Streams/join" events through the socket.
 * @method getObservers
 * @static
 * @param {String} publisherId The publisher Id
 * @param {String} streamName The name of the stream
 * @param {Function} [callback=null] Callback receives a map of {clientId: socketClient} pairs
 */
Streams.getObservers = function(publisherId, streamName, callback) {
	var observers = Q.getObject([publisherId, streamName], Streams.observers);
	callback && callback(observers || {});
};

/**
 * Retrieve stream with calculated access rights
 * @method fetch
 * @static
 * @param {String}  asUserId
 *	The user id to calculate access rights
 * @param {String} publisherId
 *	The publisher Id
 * @param {String|Array|Db.Range} streamName
 *	The name of the stream, or an array of names, or a Db.Range
 * @param callback=null {function}
 *	Callback receives (err, streams) as parameters
 * @param {String} [fields='*']
 *  Comma delimited list of fields to retrieve in the stream.
 *  Must include at least "publisherId" and "name".
 *  since make up the primary key of the stream table.
 *  You can skip this argument if you want.
 * @param {Object} [options={}]
 *  Provide additional query options like 'limit', 'offset', 'orderBy', 'where' etc.
 *  @see Db_Query_Mysql::options().
 */
Streams.fetch = function (asUserId, publisherId, streamName, callback, fields, options) {
	if (!callback) return;
	if (!publisherId || !streamName) {
		return callback(new Error("Wrong arguments"));
	}
	if (typeof streamName.charAt === 'function'
	&& streamName.charAt(streamName.length-1) === '/') {
		streamName = new Db.Range(streamName, true, false, streamName.slice(0, -1)+'0');
	}
	if (Q.isPlainObject(fields)) {
		options = fields;
		fields = '*';
	}
	fields = fields || '*';
	Streams.Stream.SELECT(fields)
	.where({publisherId: publisherId, name: streamName})
	.options(options)
	.execute(function(err, res) {
		if (err) {
		    return callback(err);
		}
		if (!res.length) {
		    return callback(null, []);
		}
		var p = new Q.Pipe(res.map(function(a) { return a.fields.name; }),
		function(params, subjects) {
			for (var name in params) {
				if (params[name][0]) {
					callback(params[name][0]); // there was an error
					return;
				}
			}
			callback(null, subjects); // success
		});
		for (var i=0; i<res.length; i++) {
			res[i].calculateAccess(asUserId, p.fill(res[i].fields.name));
		}
	});
};

/**
 * Retrieve stream with calculated access rights
 * @method fetchOne
 * @static
 * @param {String} asUserId
 *	The user id to calculate access rights
 * @param {String} publisherId
 *	The publisher Id
 * @param {String} streamName
 *	The name of the stream
 * @param {Function} [callback=null]
 *	Callback receives the (err, stream) as parameters
 * @param {String} [fields='*']
 *  Comma delimited list of fields to retrieve in the stream.
 *  Must include at least "publisherId" and "name".
 *  since make up the primary key of the stream table.
 *  You can skip this argument if you want.
 * @param {Object} [options={}]
 *  Provide additional query options like 'limit', 'offset', 'orderBy', 'where' etc.
 *  @see Db_Query_Mysql::options().
 */
Streams.fetchOne = function (asUserId, publisherId, streamName, callback, fields, options) {
	if (!callback) return;
	if (!publisherId || !streamName
	|| typeof publisherId !== 'string'
	|| typeof streamName !== 'string') {
		return callback(new Error("Wrong arguments"));
	}
	if (Q.isPlainObject(fields)) {
		options = fields;
		fields = '*';
	}
	Streams.Stream.SELECT('*')
	.where({publisherId: publisherId, name: streamName})
	.options(options)
	.limit(1).execute(function(err, res) {
		if (err) {
		    return callback(err);
		}
		if (!res.length) {
		    return callback(null, null);
		}
		res[0].calculateAccess(asUserId, function () {
		    callback.call(res[0], null, res[0]);
		});
	});
};

/**
 * Closes a stream in the database, and marks it for removal unless it is required.
 * @method close
 * @static
 * @param {String} asUserId	The user id to calculate access rights
 * @param {String} publisherId The publisher Id
 * @param {String} streamName The name of the stream
 * @param {Function} [callback=null] Callback receives the (err, stream) as parameters
 */
Streams.close = function (asUserId, publisherId, streamName, callback) {
	var phpScriptPath = path.dirname(__dirname) + '/scripts/api.php';
	var args = {
		"appRoot": Q.app.DIR,
		"action": "close",
		"asUserId": asUserId,
		"publisherId": publisherId,
		"streamName": streamName
	};
	args.signature = Q.Utils.signature(args);
	var argsString = '';
	Object.entries(args).forEach(([key, value]) => { argsString += '--' + key + '=' + value + ' '; });
	child_process.exec("php " + phpScriptPath + " " + argsString, function(err, response, stderr) {
		if(err){
			console.log(err);
		}

		Q.handle(callback, null, [publisherId, streamName]);
	});
};

/**
 * Register a message handler
 * @method messageHandler
 * @static
 * @param {String} msgType
 *	Type of stream
 * @param {Function} callback
 *	The handler for stream messages
 */
Streams.messageHandler = function(msgType, callback) {
	if (callback === undefined) {
		return _messageHandlers[msgType];
	}
	if (typeof callback !== 'function') {
		throw new Q.Exception("Streams: callback passed to messageHandler is not a function");
	}
	_messageHandlers[msgType] = callback;
};

/**
 * Calculate the url of a stream's icon
 * @static
 * @method iconUrl
 * @param {String} icon the value of the stream's "icon" field
 * @param {String|Number|false} [basename=40] The last part after the slash, such as "50.png" or "50". Setting it to false skips appending "/basename"
 * @return {String} the url
 */
Streams.iconUrl = function(icon, basename) {
	if (!icon) {
		console.warn("Streams.iconUrl: icon is empty");
		return '';
	}
	if ((basename === true) // for backward compatibility
		|| (!basename && basename !== false)) {
		basename = '40';
	}
	basename = (String(basename).match(/\.\w+$/g)) ? basename : basename+'.png';
	icon = icon.match(/\.\w+$/g) ? icon : icon + (basename ? '/' + basename : '');
	var src = Q.interpolateUrl(icon);
	return src.isUrl() || icon.substr(0, 2) == '{{'
		? Q.url(src)
		: Q.url('{{Streams}}/img/icons/'+src);
};

Streams.inviteUrl = function _Streams_inviteUrl(token) {
	return Q.url(Q.Config.get(['Streams', 'invites', 'baseUrl'], "i"))
		+ "/" + token;
};

Streams.invitationsPath = function _Streams_invitationsPath(userId) {
	var subpath = Q.Config.get(
		'Streams', 'invites', 'subpath',
		'{{app}}/uploads/Streams/invitations'
	);
	return Q.app.FILES_DIR + '/' + subpath.interpolate({
		app: Q.Config.expect(['Q', 'app'])
	}) + '/' + Q.Utils.splitId(userId);
};
/**
 * Use this to check whether variable is a Q.plugins.Streams.Stream object
 * @static
 * @method isStream
 * @param {mixed} testing
 * @return {boolean}
 */
Streams.isStream = function (testing) {
	return Q.typeOf(testing) === "Q.Streams.Stream";
};

/**
 * Returns the type name to display from a stream type.
 * If none is set, try to figure out a displayable title from a stream's type
 * @method displayType
 * @param {String} type
 * @param {Function} callback The first parameter will be the displayType
 * @param {Object} [options] Options to use with Q.Text.get, and also
 * @param {string} [$options.plural=false] Whether to display plural, when available
 */
Streams.displayType = function _Streams_displayType(type, callback, options) {
	var parts = type.split('/');
	var module = parts.shift();
	var ret = parts.pop();
	var text = Q.Text.get(module+'/content', options);
	var field = 'displayType' + (options && options.plural) ? 'Plural' : '';
	var result = Q.getObject(['types', type, 'displayType']);
	if (options && options.plural) {
		result = Q.getObject(['types', type, 'displayTypePlural'], text) || result;
	}
	callback(result || ret);
};

Streams.Mentions = require('Streams/Mentions');
Streams.Ephemeral = require('Streams/Ephemeral');

/**
 * @property _messageHandlers
 * @type object
 * @private
 */
var _messageHandlers = {};
/**
 * @property _streams
 * @type object
 * @private
 */
var _streams = {};

/* * * */
