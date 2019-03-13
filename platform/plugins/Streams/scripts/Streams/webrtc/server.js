/*var express = require('express');
var socket = require('socket.io');
var fs = require('fs');*/


// filename: app.js
const https = require('https');
const fs = require('fs');
const express = require('express');
const app = express();
var socket = require('socket.io');

var options = {
    key: fs.readFileSync('/etc/letsencrypt/live/www.demoproject.co.ua/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/www.demoproject.co.ua/cert.pem'),
    ca: fs.readFileSync('/etc/letsencrypt/live/www.demoproject.co.ua/chain.pem')
};


var server = https.createServer(options, app).listen(8443);


//app setup
//var app = express();
/*
var server = app.listen(4000, function () {
    console.log('listening to requests on port 4000')
})
*/


// Static files
//app.use(express.static('/'));



// socket setup
var io = socket(server);
server.listen(8080, function () {
    console.log('listening to requests on port 8080')
});

/*
io.on('connection', function (socket) {
    console.log('made sockets connection', socket.id);
    //io.sockets.socket(socket.id).emit('joined', socket.id);
    socket.on('message', function (data) {
        console.log('message received');
        //io.sockets.emit('message', data);
       // socket.broadcast.emit('message', data);

    });

    socket.on('typing', function (data) {
        //socket.broadcast.emit('typing', data);
    })
});*/

io.on('connection', function (socket) {
    console.log('made sockets connection', socket.id);

    socket.on('log', function (message) {
        //console.log('CONSOLE.LOG', message);
        //socket.broadcast.emit('message', message); // should be room only
        fs.appendFile('log.txt', '\n\n' + message, function (err) {
            if (err) throw err;
        });
    });

    socket.on('errorlog', function (message) {
        console.log('CONSOLE.ERROR', message);
        fs.appendFile('errorlog.txt', message, function (err) {
            if (err) throw err;
            console.log('Error logged!');
        });
    });


    var room;
    socket.on('joined', function (identity) {
        console.log('Got message: joined', identity, socket.id);

        room = identity.room;
        socket.join(identity.room);

        socket.broadcast.to(identity.room).emit('participantConnected', {username:identity.username, sid:socket.id});

        /*var socketsList = [];
        var roomsSockets = io.sockets.clients(identity.room);
        for(var s in roomsSockets) {
            if(roomsSockets[s].id == socket.id) continue;
            console.log('socket ID ' + roomsSockets[s].id)
            socketsList.push(roomsSockets[s].id);
        }

        socket.emit('roomParticipants', socketsList);*/

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