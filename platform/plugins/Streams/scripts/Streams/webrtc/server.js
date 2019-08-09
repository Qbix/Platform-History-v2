const https = require('https');
const http = require('http');
const fs = require('graceful-fs');
const mkdirp = require('mkdirp');
const express = require('express');
const app = express();
var socket = require('socket.io');
var _debug;

function startServer(port, httpsCerts) {

	var server;
	if(typeof httpsCerts != "undefined") {
		server = https.createServer(httpsCerts, app).listen(port);
	} else {
		server = http.createServer(function(req, res){
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.write('WebRTC server is working');
			res.end();
		}).listen(port);
	}

	// socket setup
	var io = socket(server);

	io.on('connection', function (socket) {
		if(_debug) console.log('made sockets connection', socket.id);

		socket.on('log', function (message) {
			if(_debug) console.log('CONSOLE.LOG', message);
		});

		socket.on('errorlog', function (message) {
			console.log('CONSOLE.ERROR', message);
			var todaysDay = new Date().toISOString().replace(/T.*/, ' ');
			console.log('CONSOLE.ERROR DATE', todaysDay);
		});

		socket.on('errorlog_timeout', function (message) {
			if(_debug) console.log('CONSOLE.ERROR', message);
			if(_debug) console.log('CONSOLE.ERROR DATE', (new Date().toISOString()));
		});

		var room;
		socket.on('joined', function (identity) {
			if(_debug) console.log('Got message: joined', identity, socket.id);
			socket.username = identity.username;
			socket.info = identity.info;
			room = identity.room;
			socket.join(identity.room, function () {
				if(_debug) console.log(socket.id + 'now in rooms: ', socket.rooms);
			})


			socket.broadcast.to(identity.room).emit('participantConnected', {
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
				io.to(socket.id).emit('roomParticipants', participantsList);
			});

		});

		socket.on('confirmOnlineStatus', function(message) {
			if(_debug) console.log('confirmOnlineStatus', message);
			message.fromSid = socket.id;
			socket.to(message.targetSid).emit('confirmOnlineStatus', message);

		});

		socket.on('signalling', function(message) {
			if(_debug) console.log('SIGNALLING MESSAGE', message.type, message.name, message.targetSid, socket.id);
			message.fromSid = socket.id;
			if(message.type == 'offer') message.info = socket.info;
			socket.to(message.targetSid).emit('signalling', message);
		});

		socket.on('disconnect', function() {
			if(_debug) console.log('DISCONNECT', socket.id);
			socket.broadcast.to(room).emit('participantDisconnected', socket.id);
		});

	});
}

module.exports = function (Q) {
	var host = Q.Config.get(['Streams', 'webrtc', 'socketServerHost'], false);
	var port = Q.Config.get(['Streams', 'webrtc', 'socketServerPort'], false);
	var https = Q.Config.get(['Q', 'node', 'https'], false);
	_debug = Q.Config.get(['Streams', 'webrtc', 'debug'], false);

	if(port && host && host != '') {
		console.log('Start WebRTC signaling server on localhost')
		startServer(port);
		return;
	} else if(port && https){
		console.log('Start WebRTC signaling server using https')
		startServer(port, https);
		return;
	}

	console.warn('WebRTC signalling server has not started. Please update "webrtc section in your local app.json"');
}
