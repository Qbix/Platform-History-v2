/**
 * @module Q
 */

var Q = require('../Q');
var events = require('events');
var util = require('util');
var urlModule = require("url");

var log = console.log.register('Q.Socket');

/**
 * Attach socket to server
 * @class Socket
 * @namespace Q
 * @constructor
 * @param {http.Server} server
 * @param {Object} [options={}] Options to pass to the socket.io Server listen() method
 */
function Socket (server, options) {
	var io = require('socket.io');
	var url = new urlModule.URL(
		(options && options.baseUrl)
		|| Q.Config.get(['Q', 'web', 'appRootUrl']
	));
	var o = options || {
		cors: {
			origin: url.origin,
			methods: ["GET", "POST"]
		}
	};
	if (io.listen) {
		this.io = io.listen(server, o);
	} else {
		this.io = new io.Server(server, o);
	}

	this.io.of('/Q').use(function (client, next) {
		var permissions = Q.Config.get(['Users', 'socket', 'permissions'], []);
		var found = false;
		var capability = Q.getObject('handshake.auth.capability', client);
		capability = capability && JSON.parse(capability);
		for (var permission of permissions) {
			if (capability && Q.Utils.validateCapability(capability, permission)) {
				found = true;
				client.capability = capability;
				break;
			}
		}
		if (!found) {
			return next(new Error("Q.Socket.connect: Not Authorized"));
		}
		/**
		 * Socket has connected.
		 * Reconnections before disconnect timeout don't count.
		 * @event connected
		 * @param {Socket} client
		 *	The connecting client. Contains userId, clientId
		 */
		Q.Socket.emit('connected', client);
		next();
	});

	// for backwards compatibility
	var BA = this.io.of('a').to('b').constructor;
	var util = require('util');
	if (!BA.prototype.allSockets) {
		BA.prototype.allSockets = util.promisify(BA.prototype.clients);
	}
	var NA = this.io.of('a').constructor;
	if (!NA.prototype.allSockets) {
		NA.prototype.allSockets = util.promisify(function (callback) {
			callback(null, this.connected);
		});
	}
}

var _listening = false;

/**
 * Start http server if needed and start listening to socket
 * @method listen
 * @param {Object} options Can be any options for the server.listen() in socket.io,
 *    as well as the following options:
 * @param {Object} [options.host] Set the hostname to listen on
 * @param {Object} [options.port] Set the port to listen on
 * @param {Object} [options.socket={}] Options for the socket server
 * @param {Object} [options.socket.path]
 * @param {Object} [options.origins] Array of allowed origins for requests, defaults to Q.app.url
 * @param {Object} [options.https] To avoid starting https server, pass false here. Otherwise you can pass options to https.createServer here, to override the ones in the "Q"/"node"/"https" config options, if any.
 */
Socket.listen = function (options) {
	options = options || {};
	options = Q.extend({}, Q.Config.get(['Q', 'node', 'socket']), options);
	var baseUrl = Q.Config.get(['Q', 'web', 'appRootUrl'], options.baseUrl);
	if (options.path) {
		options.path = options.path.interpolate({baseUrl: baseUrl});
	}
	var server = Q.listen(options);
	if (!server.attached.socket) {
		if (!_listening) {
			try {
				log("Version of socket.io: " + require('socket.io/package').version);
			} catch (e) { }
			_listening = true;
		}
		var s = !Q.isEmpty(options.https) ? 's' : '';
		log("Starting socket server on http"+s+"://"
			+server.host+":"+server.port + (server.internalString || '')
		);
		try {
			server.attached.socket = new Q.Socket(server, Q.take(options, [
				'path', 'serveClient', 'adapter', 'origins', 'parser'
			]));
		} catch (e) {
			log("Socket was not attached.", e);
		}
	}
	return server.attached.socket;
};

Q.makeEventEmitter(Socket);
module.exports = Socket;
