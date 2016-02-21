/**
 * @module Q
 */

var Q = require('../Q');
var events = require('events');
var util = require('util');

/**
 * Attach socket to server
 * @class Socket
 * @namespace Q
 * @constructor
 * @param server {http.Server}
 * @param {object} [options={}]
 */
function Socket (server, options) {
	var io = require('socket.io');
	this.io = io.listen(server);
}

/**
 * Start http server if needed and start listening to socket
 * @method listen
 * @param {object} [options={}] Can include 'host', 'port' and 'ns' fields
 * @return {socket.io}
 */
Socket.listen = function (options) {
	options = options || {};
	var server = Q.listen({
		port: options.port,
		host: options.host
	});
	if (!server.attached.socket) {
		console.log("Starting socket server on http://"+server.host+":"+server.port);
		try {
			server.attached.socket = require('socket.io').listen(server);
		} catch (e) {
			console.log("Socket was not attached.", e);
		}
	}
	return server.attached.socket;
};

Q.makeEventEmitter(Socket, true);
module.exports = Socket;
