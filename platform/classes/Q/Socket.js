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
 * @param {Object} options.https If you use https, pass https options here (see Q.listen)
 * @return {Q.Socket}
 */
Socket.listen = function (options) {
	options = options || {};
	var server = Q.listen(options);
	if (!server.attached.socket) {
		var s = options.https ? 's' : '';
		console.log("Starting socket server on http"+s+"://"+server.host+":"+server.port);
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
