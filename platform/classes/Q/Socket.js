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
 * @param {Object} [options={}]
 */
function Socket (server, options) {
	var io = require('socket.io');
	this.io = io.listen(server);
}

/**
 * Start http server if needed and start listening to socket
 * @method listen
 * @param {Object} options 
 * @param {Object} options.host Set the hostname to listen on
 * @param {Object} options.port Set the port to listen on
 * @return {Q.Socket}
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
			server.attached.socket = new Q.Socket(server);
		} catch (e) {
			console.log("Socket was not attached.", e);
		}
	}
	return server.attached.socket;
};

Q.makeEventEmitter(Socket, true);
module.exports = Socket;
