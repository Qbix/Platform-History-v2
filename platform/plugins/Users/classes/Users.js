"use strict";
/*jshint node:true */
/**
 * Users plugin
 * @module Users
 * @main Users
 */
var Q = require('Q');

/**
 * Static methods for the Users model
 * @class Users
 * @extends Base.Users
 * @static
 */
function Users() { }
module.exports = Users;

var Base_Users = require('Base/Users');
Q.mixin(Users, Base_Users);

/*
 * This is where you would place all the static methods for the models,
 * the ones that don't strongly pertain to a particular row or table.
 * Just assign them as methods of the Users object.
 
 * * * */

var db = Q.require('Db').connect('Users');
var querystring = require('querystring');
var util = require('util');

Q.makeEventEmitter(Users);

/**
 * Store user sessions
 * @property sessions
 * @type {object}
 */
Users.sessions = {};

/**
 * Store clients
 * @property clients
 * @type {object}
 */ 
Users.clients = {};

/**
 * Get the id of the main community from the config. Defaults to the app name.
 * @return {String} The id of the main community for the installed app.
 */
Users.communityId = function() {
	var communityId = Q.Config.get(['Users', 'community', 'id'], null);
	return communityId ? communityId : Q.Config.expect(['Q', 'app']);
};

/**
 * Get the name of the main community from the config. Defaults to the app name.
 * @return {String} The name of the main community for the installed app.
 */
Users.communityName = function() {
	var communityName = Q.Config.get(['Users', 'community', 'name'], null);
	return communityName ? communityName : Q.Config.expect(['Q', 'app']);
};

/**
 * Get the suffix of the main community from the config, such as "Incorporated" or "LLC"
 * @return {String|null} The suffix of the main community for the installed app.
 */
Users.communitySuffix = function() {
	return Q.Config.get(['Users', 'community', 'suffix'], null);
};

/**
 * Gets a user (from database if needed) associated with sessionId and passes it to callback.
 * @method userFromSession
 * @param sessionId {string}
 *	User's session Id
 * @param callback {function}
 *  Passes a Users.User object, or null if the the user wasn't found
 */
Users.userFromSession = function (sessionId, callback) {
	if (Users.sessions[sessionId]) {
		var user = Q.getObject([sessionId, 'Users', 'loggedInUser'], Users.sessions) || null;
		callback && callback(user);
	} else {
		Users.Session.SELECT('*').where({
			id: sessionId
		}).execute(function(err, results){
			if (!results || results.length === 0) {
				return callback(null, null);
			}
			if (results[0].fields.content === undefined) {
				Q.log(err, results);
				throw new Q.Error("Users.userFromSession session.fields.content is undefined");
			}
			var sess = JSON.parse(results[0].fields.content);
			
			if (!Q.isSet(sess, ['Users', 'loggedInUser'])) {
				callback(null);
			} else {
				Users.sessions[sessionId] = { Users: sess.Users };
				callback(sess.Users.loggedInUser, sess.Q && sess.Q.nonce);
			}
		});
	}
};

/**
 * Start internal listener for Users plugin and open socket<br/>
 * Accepts "Users/session" message
 * @method listen
 * @param {Object} [options={}]
 * @param {Object} [options.ios={}] Any options for node-apn Connection
 * @param {Object} [options.ios.connection={}] Additional options for node-apn Connection
 * @param {Object} [options.ios.feedback={}] Additional options for node-apn Feedback
 */
Users.listen = function (options) {

	var o = Q.extend({}, Users.listen.options, options);

	// Start internal server
	var server = Q.listen();
    server.attached.express.post('/Q/node', Users_request_handler);

	// Set up ios push notification agent
	var appName = Q.Config.expect(["Q", "app"]);
	if (Q.Config.get([appName, "cordova", "platforms"], []).indexOf("ios") >= 0) {
		_Users_listen_ios(o, server);
	}

	// TODO: implement android
};

Users.listen.options = {
	ios: {
		feedback: {
			batchFeedback: true,
			interval: 300
		}
	}
};

Users.apn = {
	connection: null
};

function _Users_listen_ios (options, server) {
	var apn = require('apn');
	var path = require('path');
	var appName = Q.app.name;
	var sandbox = Q.Config.get([appName, "cordova", "ios", "sandbox"], false);
	var s = sandbox ? "sandbox" : "production";
	var o = {
		ca: path.join(Q.pluginInfo.Users.FILES_DIR, 'Users', 'certs', 'EntrustRootCA.pem'),
		cert: path.join(Q.app.LOCAL_DIR, 'Users', 'certs', appName, s, 'cert.pem'),
		key: path.join(Q.app.LOCAL_DIR, 'Users', 'certs', appName, s, 'key.pem'),
		production: !sandbox
	};
	var passphrase = Q.Config.get([appName, "cordova", "ios", "passphrase"], null);
	if (passphrase) {
		o.passphase = passphase;
	}
	Users.apn.connection = new apn.Connection(Q.extend(
		{}, o, options && options.ios && options.ios.connection
	));
	Q.log("APN connection enabled (" + s +  ")");
	var feedback = Users.apn.feedback = new apn.Feedback(Q.extend(
		{}, o, options && options.ios && options.ios.feedback
	));
	Q.log("APN feedback enabled");
	feedback.on('feedback', function (devices) {
		var deviceIds = [];
		devices.forEach(function (item) {
			deviceIds.push(item.device.token.toString('hex'));
		});
		Users.Device.DELETE().where({
			platform: 'ios',
			deviceId: deviceIds
		}).execute();
	});
};

/**
 * Fetches a user from the database
 * @method listen
 * @param {object} options={}
 *  So far no options are implemented.
 */
Users.fetch = function (id, callback) {
	new Users.User({id: id}).retrieve(callback);
};

/**
 * Pushes notifications to all devices of the given user or users
 * @method pushNotifications
 * @static
 * @param {String|Array} userIds A user id, or an array of them, 
 *   in which case notifications would be an object of { userId: notification }
 * @param {Object} notifications If userIds is an array, this is a hash of {userId: notification} objects, otherwise it is just a single notification object. Please see Users.Device.prototype.pushNotification for the schema of this object.
 * @param {Function} [callback] A function to call after the push has been completed
 * @param {Function} [options] Any additional options to pass to device.pushNotification method
 * @param {Function} [filter] Receives the Users.Device object. Return false to skip the device.
 */
Users.pushNotifications = function (userIds, notifications, callback, options, filter) {
	var isArrayLike = Q.isArrayLike(userIds);
	Users.Device.SELECT('*').where({
		userId: userIds
	}).execute(function (err, devices) {
		if (err) {
			return callback(err);
		}
		Q.each(devices, function (i) {
			if (filter && filter(this) === false) {
				return;
			}
			this.pushNotification(
				isArrayLike ? notifications[this.fields.userId] : notifications,
				options
			);
		});
		callback(null, devices, notifications);
	});
};

function Users_request_handler(req, res, next) {
	var parsed = req.body;
    if (!parsed || !parsed['Q/method']) {
		return next();
	}
    switch (parsed['Q/method']) {
		case 'Users/session':
            var sid = parsed.sessionId;
            var content = parsed.content ? JSON.parse(parsed.content) : null;
			if (content !== null) {
				console.log((Users.sessions[sid] ? "Update" : "New") + " session from PHP: " + sid);
				Users.sessions[sid] = content;
			} else {
				delete Users.sessions[sid];
				console.log("Deleted session from PHP: " + sid);
			}
			break;
		case 'Users/sendMessage':
			/*
			 * Required: view, emailAddress or mobile number
			 * Optional: delay, subject, fields, options
			 */
			if (parsed.delay) {
				setTimeout(_send, parsed.delay);
			} else {
				_send();
			}
			break;
		default:
			break;
	}
	return next();
}

var timeouts = {};

/**
 * Replacements for Q.Socket methods, use these instead.
 * They implement logic involving sockets, users, sessions, devices, and more.
 * @class Users.Socket
 */
Users.Socket = {
	/**
	 * Start http server if needed, and start listening to socket.
	 * Use this instead of Q.Users.socket
	 * This also attaches a few event handlers for Users events.
	 * @method listen
	 * @param {Object} options 
	 * @param {Object} options.host Set the hostname to listen on
	 * @param {Object} options.port Set the port to listen on
	 * @param {Object} options.https If you use https, pass https options here (see Q.listen)
	 * @return {socket.io}
	 */
	listen: function (options) {
		var socket = Q.Socket.listen(options);
		socket.io.of('/Users').on('connection', function(client) {
			Q.log("Socket.IO client connected " + client.id);
			if (client.alreadyListening) {
				return;
			}
			client.alreadyListening = true;
			client.on('Users/session', function (sessionId, clientId) {
				Users.userFromSession(sessionId, function (user) {
					if (!user) {
						// force disconnect
						client.disconnect();
						return;
					}
					var userId = user.id;
					if (!Users.clients[userId]) {
						Users.clients[userId] = {};
					}
					var wasOnline = !Q.isEmpty(Users.User.clientsOnline(userId));
					client.userId = userId;
					client.sessionId = sessionId;
					client.clientId = clientId;
					Users.clients[userId][client.id] = client;
					if (timeouts[userId]) {
						clearTimeout(timeouts[userId]);
					}
					delete timeouts[userId];
					/**
					 * User has connected.
					 * Reconnections before disconnect timeout don't count.
					 * @event connected
					 * @param {Socket} client
					 *	The connecting client. Contains userId, sessionId, clientId
					 * @param {Boolean} online
					 *	Whether any other clients were online for the user before this
					 */
					Users.emit('connected', client, wasOnline);
					if (wasOnline) {
						Q.log('New client connected: ' + userId + '('+clientId+')');
					} else {
						Q.log('User connected: ' + client.userId);
					}
				});
			});
			client.on('disconnect', function(){
				var userId = client.userId;
				var i;
				if (!userId || !Users.clients[userId]) {
					return;
				}
				var clients = Users.clients[userId];
				delete clients[this.id];
				Q.log('Client disconnected: ' + userId + "(" + this.id + ")");
				if (Q.isEmpty(clients)) {
					// All the clients have been disconnected.
					// Let's wait a bit and if none of them reconnect within the timeout period,
					// we'll post a message saying the user disconnected.
					timeouts[userId] = setTimeout(function () {
						if (Q.isEmpty(clients)) {
							/**
							 * User has disconnected, and timeout for reconnection has passed
							 * @event disconnected
							 * @param {String} userId id of the user that disconnected
							 */
							Users.emit('disconnected', userId);
						}
					}, Q.Config.get(["Users", "socket", "disconnectTimeout"], 1000));
				}
			});
		});
		return socket;
	},
	
	/**
	 * Emits an event to user's socket.io clients that are currently connected
	 * @method emitToUser
	 * @static
	 * @param {String} userId The id of the user
	 * @param {String} event The name of the event the socket client should emit
	 * @param {Object} data Any data to accompany this event name
	 * @param {Object} excludeSessionIds={}
	 *	Optional object containing {sessionId: true} for any session ids to skip
	 *  while emitting the event.
	 * @return {Boolean} Whether any socket clients were connected at all
	 */
	emitToUser: function(userId, event, data, excludeSessionIds) {
		var clients = Users.User.clientsOnline(userId);
		if (Q.isEmpty(clients)) {
			return false;
		}
		for (var cid in clients) {
			var client = clients[cid];
			if (excludeSessionIds && excludeSessionIds[client.sessionId]) {
				continue;
			}
			client.emit(event, data);
		}
		return true;
	}
};

/* * * */
