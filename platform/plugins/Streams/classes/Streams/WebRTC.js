"use strict";
/*jshint node:true */
/**
 * WebRTC class
 * @module Streams
 * @main Streams
 */
var Q = require('Q');
var fs = require('fs');
var Streams = Q.Streams;

/**
 * Static methods for WebRTC
 * @class WebRTC
 * @static
 */
function WebRTC() { }

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
 * @return {Users.Socket|null} The socket if connected, otherwise null
 */
WebRTC.listen = function () {
	var socket = (Q.plugins.Streams.listen() || {}).socket;

	if (!socket || !socket.io) {
		return null;
	}

	var _debug = Q.Config.get(['Streams', 'webrtc', 'debug'], false);
	var io = socket.io;
	io.on('connection', function(socket) {
		if(_debug) console.log('made sockets connection', socket.id);

		socket.on('Streams/webrtc/log', function (message) {
			if(_debug) console.log('CONSOLE.LOG', message);
		});

		socket.on('Streams/webrtc/errorlog', function (message) {
			console.log('CONSOLE.ERROR', message);
			var todaysDay = new Date().toISOString().replace(/T.*/, ' ');
			console.log('CONSOLE.ERROR DATE', todaysDay);
		});

		socket.on('Streams/webrtc/errorlog_timeout', function (message) {
			if(_debug) console.log('CONSOLE.ERROR', message);
			if(_debug) console.log('CONSOLE.ERROR DATE', (new Date().toISOString()));
		});

		var room;
		socket.on('Streams/webrtc/joined', function (identity) {
			if(_debug) console.log('Got message: joined', identity, socket.id);
			socket.username = identity.username;
			socket.info = identity.info;
			room = identity.room;
			socket.join(identity.room, function () {
				if(_debug) console.log(socket.id + 'now in rooms: ', socket.rooms);
			})


			socket.broadcast.to(identity.room).emit('Streams/webrtc/participantConnected', {
				username:identity.username,
				sid:socket.id,
				info:identity.info,
			});


			io.of('/').in(identity.room).clients(function (error, clients) {
				if(_debug) console.log(clients);
				var participantsList = [];
				for (var i in clients) {
					if (socket.id != clients[i]) {
						participantsList.push({sid: clients[i], username: io.sockets.connected[clients[i]].username});
					}
				}
				io.to(socket.id).emit('Streams/webrtc/roomParticipants', participantsList);
			});

		});

		socket.on('Streams/webrtc/confirmOnlineStatus', function(message) {
			if(_debug) console.log('confirmOnlineStatus', message);
			message.fromSid = socket.id;
			socket.to(message.targetSid).emit('Streams/webrtc/confirmOnlineStatus', message);

		});

		socket.on('Streams/webrtc/signalling', function(message) {
			if(_debug) console.log('SIGNALLING MESSAGE', message.type, message.name, message.targetSid, socket.id);
			message.fromSid = socket.id;
			if(message.type == 'offer') message.info = socket.info;
			socket.to(message.targetSid).emit('Streams/webrtc/signalling', message);
		});

		socket.on('disconnect', function() {
			if(_debug) console.log('DISCONNECT', socket.id);
			socket.broadcast.to(room).emit('Streams/webrtc/participantDisconnected', socket.id);
		});
	})

};

module.exports = WebRTC;