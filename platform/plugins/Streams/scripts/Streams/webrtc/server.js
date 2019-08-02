const https = require('https');
const http = require('http');
const fs = require('graceful-fs');
const mkdirp = require('mkdirp');
const express = require('express');
const app = express();
var socket = require('socket.io');

function startServer(port, httpsCerts) {

	/*var options = {
		key: fs.readFileSync('/etc/letsencrypt/live/www.demoproject.co.ua/privkey.pem'),
		cert: fs.readFileSync('/etc/letsencrypt/live/www.demoproject.co.ua/cert.pem'),
		ca: fs.readFileSync('/etc/letsencrypt/live/www.demoproject.co.ua/chain.pem')
	};*/

	var server;
	if(typeof httpsCerts != "undefined") {
		server = https.createServer(httpsCerts, app).listen(port);
	} else {
		server = http.createServer(function(){

		}, app).listen(port);
	}

	// socket setup
	var io = socket(server);

	io.on('connection', function (socket) {
		console.log('made sockets connection', socket.id);

		socket.on('log', function (message) {
			console.log('CONSOLE.LOG', message);
		});

		socket.on('errorlog', function (message) {
			console.log('CONSOLE.ERROR', message);
			var todaysDay = new Date().toISOString().replace(/T.*/, ' ');
			console.log('CONSOLE.ERROR DATE', todaysDay);
		});

		socket.on('errorlog_timeout', function (message) {
			console.log('CONSOLE.ERROR', message);
			console.log('CONSOLE.ERROR DATE', (new Date().toISOString()));
		});

		var room;
		socket.on('joined', function (identity) {
			console.log('Got message: joined', identity, socket.id);
			socket.username = identity.username;
			socket.isiOS = identity.isiOS;
			room = identity.room;
			socket.join(identity.room, function () {
				console.log(socket.id + 'now in rooms: ', socket.rooms)
			})


			socket.broadcast.to(identity.room).emit('participantConnected', {
				username:identity.username,
				sid:socket.id,
				isiOS:identity.isiOS != null ? identity.isiOS : false
			});


			io.of('/').in(identity.room).clients(function (error, clients) {
				console.log(clients);
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
			console.log('confirmOnlineStatus', message);
			message.fromSid = socket.id;
			socket.to(message.targetSid).emit('confirmOnlineStatus', message);

		});

		socket.on('signalling', function(message) {
			console.log('SIGNALLING MESSAGE', message.type, message.name, message.targetSid, socket.id);
			message.fromSid = socket.id;
			message.isiOS = socket.isiOS;
			socket.to(message.targetSid).emit('signalling', message);
		});

		socket.on('disconnect', function() {
			console.log('DISCONNECT', socket.id);
			socket.broadcast.to(room).emit('participantDisconnected', socket.id);
		});

	});
}

module.exports = function (port, httpsCerts) {
	startServer(port, httpsCerts);
}
