

const https = require('https');
const fs = require('fs');
const express = require('express');
const app = express();
var socket = require('socket.io');

//ssl certificates
/*var options = {
    key: ...,
    cert: ...,
    ca: ...
};*/


var server = https.createServer(options, app).listen(8443);


// socket setup
var io = socket(server);
server.listen(8080, function () {
    console.log('listening to requests on port 8080')
});

io.on('connection', function (socket) {

    var room;
    socket.on('joined', function (identity) {
        console.log('Got message: joined', identity, socket.id);

        room = identity.room;
        socket.join(identity.room);

        socket.broadcast.to(identity.room).emit('participantConnected', {username:identity.username, sid:socket.id});

    });

    socket.on('signalling', function(message) {
        console.log('SIGNALLING MESSAGE', message.type, message.targetSid, socket.id);
        message.fromSid = socket.id;
        socket.to(message.targetSid).emit('signalling', message);
    });

    socket.on('disconnect', function() {
        socket.broadcast.to(room).emit('participantDisconnected', socket.id);
    });

});