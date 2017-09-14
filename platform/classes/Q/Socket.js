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
	this.io = io.listen(server, options || {});
}

/**
 * Start http server if needed and start listening to socket
 * @method listen
 * @param {Object} options Can be any options for the server.listen() in socket.io,
 *    as well as the following options:
 * @param {Object} options.host Set the hostname to listen on
 * @param {Object} options.port Set the port to listen on
 * @param {Object} options.https If you use https, pass https options here (see Q.listen)
 */
Socket.listen = function (options) {
	options = options || {};
	var baseUrl = Q.Config.get(['Q', 'web', 'appRootUrl'], options.baseUrl);
	if (options.path) {
		var url = Q.Config.get(['Q', 'node', 'url'], '') + '/socket.io';
		options.path = url.interpolate({
			baseUrl: ''
		});
	}
	var server = Q.listen(options);
	if (!server.attached.socket) {
		var s = !Q.isEmpty(options.https) ? 's' : '';
		console.log("Starting socket server on http"+s+"://"+server.host+":"+server.port);
		try {
			server.attached.socket = new Q.Socket(server, Q.take(options, [
				'path', 'serveClient', 'adapter', 'origins', 'parser'
			]));
		} catch (e) {
			console.log("Socket was not attached.", e);
		}
	}
	return server.attached.socket;
};

Q.makeEventEmitter(Socket, true);
module.exports = Socket;
