"use strict";
/*jshint node:true */
/**
 * Streams model
 * @module Streams
 * @main Streams
 */
var Q = require('Q');
var fs = require('fs');

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
 * Can see the stream's content
 * @property READ_LEVEL.content
 * @type integer
 * @default 20
 * @final
 */
/**
 * Can see relations to other streams
 * @property READ_LEVEL.relations
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
 * @default 40
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
	'content':		20,		// can preview stream and its content
	'relations':	25,		// can see relations to other streams
	'participants':	30,		// can see participants in the stream
	'messages':		40,		// can play stream in a player
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
 * @property WRITE_LEVEL.postPending
 * @type integer
 * @default 15
 * @final
 */
/**
 * Can post messages which appear immediately
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
 * Can update properties of relations directly
 * @property WRITE_LEVEL.relations
 * @type integer
 * @default 25
 * @final
 */
/**
 * Can post messages requesting edits of stream
 * @property WRITE_LEVEL.suggest
 * @type integer
 * @default 28
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
	'postPending':	18,		// can post messages which require manager's approval
	'post':			20,		// can post messages which take effect immediately
	'relate':       23,		// can relate other streams to this one
	'relations':    25,		// can update properties of relations directly
	'suggest':      28,		// can suggest edits of stream
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
 * Direct access
 * @config ACCESS_SOURCES['direct']
 * @type integer
 * @default 2
 * @final
 */
/**
 * Inherited public access
 * @config ACCESS_SOURCES['inherited_public']
 * @type integer
 * @default 3
 * @final
 */
/**
 * Inherited from contact
 * @config ACCESS_SOURCES['inherited_contact']
 * @type integer
 * @default 4
 * @final
 */
/**
 * Inherited direct access
 * @config ACCESS_SOURCES['inherited_direct']
 * @type integer
 * @default 5
 * @final
 */
Streams.ACCESS_SOURCES = {
	'public':				0,
	'contact':				1,
	'direct':				2,
	'inherited_public':		3,
	'inherited_contact':	4,
	'inherited_direct':		5
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
	Streams.Stream.on('post', function (stream, byUserId, msg, clientId) {
		if (!stream) {
			return console.error("Streams.Stream.on POST: invalid stream!!!");
		}

		if (_messageHandlers[msg.fields.type]) {
			_messageHandlers[msg.fields.type].call(this, msg);
		}

		Streams.Stream.emit('post/'+msg.fields.type, stream, byUserId, msg);
		stream.notifyParticipants('Streams/post', byUserId, msg);
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

	socket.io.of('/Users').on('connection', function(client) {
		if (client.alreadyListeningStreams) {
			return;
		}
		client.alreadyListeningStreams = true;

		client.on('Streams/observe',
		function (clientId, capability, publisherId, streamName, fn) {
			var now = Date.now() / 1000;
			if (!Q.Utils.validateCapability(capability, 'Streams/observe')) {
				return fn && fn({
					type: 'Users.Exception.NotAuthorized',
					message: 'Not Authorized'
				});
			}
			if (typeof publisherId !== 'string'
			|| typeof streamName !== 'string') {
				return fn && fn({
					type: 'Streams.Exception.BadArguments',
					message: 'Bad arguments'
				});
			}
			var observer = Q.getObject(
				[publisherId, streamName, client.id], Streams.observers
			);
			if (observer) {
				return fn && fn(null, true);
			}
			Streams.fetchOne('', publisherId, streamName, function (err, stream) {
				if (err || !stream) {
					return fn && fn({
						type: 'Users.Exception.NotAuthorized',
						message: 'not authorized'
					});
				}
				stream.testReadLevel('messages', function (err, allowed) {
					if (err || !allowed) {
						return fn && fn({
							type: 'Users.Exception.NotAuthorized',
							message: 'not authorized'
						});
					}
					var clients = Q.getObject(
						[publisherId, streamName], Streams.observers, null, {}
					);
					var max = Streams.Stream.getConfigField(
						stream.fields.type,
						'observersMax'
					);
					if (max && Object.keys(clients).length >= max - 1) {
						return fn && fn({
							type: 'Streams.Exception.TooManyObservers',
							message: 'too many observers already'
						});
					}
					clients[client.id] = client;
					Q.setObject(
						[client.id, publisherId, streamName], true, Streams.observing
					);
					return fn && fn(null, true);
				});
			});
		});
		client.on('Streams/neglect',
		function (clientId, capability, publisherId, streamName, fn) {
			var o = Streams.observers;
			if (!Q.getObject([publisherId, streamName, client.id], o)) {
				return fn && fn(null, false);
			}
			delete o[publisherId][streamName][client.id];
			delete Streams.observing[client.id][publisherId][streamName];
			return fn && fn(null, true);
		});
		client.on('Streams/ephemeral',
		function (clientId, capability, payload, dontNotifyObservers, fn) {
			var now = Date.now() / 1000;
			if (!payload || !payload.publisherId || !payload.streamName || !payload.type) {
				return fn && fn("Payload must have publisherId and streamName and type set");
			}
			if (!Q.Utils.validateCapability(capability, 'Users/socket')) {
				return fn && fn("Capability not valid", null);
			}
			var byUserId = capability.userId;
			Streams.fetchOne(byUserId, payload.publisherId, payload.streamName, function (err) {
				if (err) {
					return fn && fn(err, false);
				}
				this.notifyParticipants(
					'Streams/ephemeral', byUserId, payload, dontNotifyObservers, fn
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

function _validateSessionId(sessionId, fn) {
	// Validate sessionId to make sure we generated it
	var result = Users.Session.decodeId(sessionId);
	if (result[0]) {
		return true;
	}
	fn && fn({
		type: 'Users.Exception.BadSessionId',
		message: 'bad session id'
	});
	return false;
}

function Streams_request_handler (req, res, next) {
	var parsed = req.body;
	if (!parsed || !parsed['Q/method']) {
		return next();
	}
	var participant, msg, posted, streams, k;
	var userIds, invitingUserId, username, appUrl, label, alwaysSend;
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
			Streams.Stream.emit('post', stream, msg.fields.byUserId, msg, clientId);
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
				Streams.Stream.emit('post', stream, msg.fields.byUserId, msg, clientId);
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
						content: stream.fields.content
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
 * @param {Number} [size=40] the size of the icon to render. Defaults to 40.
 * @return {String} the url
 */
Streams.iconUrl = function(icon, size) {
	if (!icon) {
		console.warn("Streams.iconUrl: icon is empty");
		return '';
	}
	if (!size || size === true) {
		size = '40';
	}
	size = (String(size).indexOf('.') >= 0) ? size : size+'.png';
	var src = Q.interpolateUrl(icon + '/' + size);
	return src.isUrl() || icon.substr(0, 2) == '{{'
		? src
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
 * Use this to check whether variable is a Q.Streams.Stream object
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

Streams.WebRTC = require('Streams/WebRTC');
Streams.Mentions = require('Streams/Mentions');

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
