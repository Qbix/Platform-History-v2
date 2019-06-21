const https = require('https');
const fs = require('fs');
const express = require('express');
const app = express();
var socket = require('socket.io');

/*
var options = {
	key: fs.readFileSync(''),
	cert: fs.readFileSync(''),
	ca: fs.readFileSync('')
};
*/


var server = https.createServer(options, app).listen(8443);

var io = socket(server);

io.on('connection', function (socket) {
	console.log('made sockets connection', socket.id);


	var room;
	socket.on('joined', function (identity) {
		console.log('Got message: joined', identity, socket.id);

		room = identity.room;
		socket.join(identity.room, function () {
			console.log(socket.id + 'now in rooms: ', socket.rooms)
		})


		socket.broadcast.to(identity.room).emit('participantConnected', {username:identity.username, sid:socket.id});

	});

	socket.on('signalling', function(message) {
		console.log('SIGNALLING MESSAGE', message.type, message.name, message.targetSid, socket.id);
		message.fromSid = socket.id;
		socket.to(message.targetSid).emit('signalling', message);
	});

	socket.on('disconnect', function() {
		socket.broadcast.to(room).emit('participantDisconnected', socket.id);
	});

});