const https = require('https');
const fs = require('fs');
const mkdirp = require('mkdirp');
const express = require('express');
const app = express();
var socket = require('socket.io');

var options = {
	/*key: fs.readFileSync('/etc/letsencrypt/live/...'),
	cert: fs.readFileSync('/etc/letsencrypt/live/...'),
	ca: fs.readFileSync('/etc/letsencrypt/live/...')*/
};


var server = https.createServer(options, app).listen(8443);

var io = socket(server);

io.on('connection', function (socket) {
	var room;
	socket.on('joined', function (identity) {
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
	});

	socket.on('confirmOnlineStatus', function(message) {
		message.fromSid = socket.id;
		socket.to(message.targetSid).emit('confirmOnlineStatus', message);

	});

	socket.on('signalling', function(message) {
		message.fromSid = socket.id;
		message.isiOS = socket.isiOS;
		socket.to(message.targetSid).emit('signalling', message);
	});

	socket.on('disconnect', function() {
		socket.broadcast.to(room).emit('participantDisconnected', socket.id);
	});

});