const Q = require('Q');
module.exports = function(socket,io) {
    var _debug = Q.Config.get(['Streams', 'webrtc', 'debug'], false);
    var WebRTC =  Q.plugins.Streams.WebRTC;
    var nspName = '/webrtc';
    var webrtcNamespace = io.of(nspName);
    var roomPublisherId;
    var roomId;
    socket.on('Streams/webrtc/joined', function (identity) {
        if(_debug) console.log('Got message: joined ', identity, nspName + '#' + socket.client.id);
        socket.username = identity.username;
        socket.userPlatformId = identity.username.split('\t')[0];
        socket.startTime = identity.username.split('\t')[1];
        socket.info = identity.info;
        socket.roomId = roomId = identity.room;
        socket.roomPublisherId = roomPublisherId = identity.roomPublisher;

        if(_debug) console.log('rooms: ', socket.adapter.rooms);
        for (var key in socket.adapter.rooms) {
            if (socket.adapter.rooms.hasOwnProperty(key)) {
                if(key == identity.room) {
                    if(_debug) console.log('rooms: roomExists');
                    break;
                }
            }
        }

        io.of('/webrtc').in(roomId).clients(function (error, clients) {
            if(_debug) console.log(clients);
            var participantsList = [];
            for (var i in clients) {
                console.log('Streams/webrtc/roomParticipants', clients[i])
                if (nspName + '#' + socket.client.id != clients[i]) {
                    participantsList.push({sid: clients[i]});
                }
            }
            webrtcNamespace.to(nspName + '#' + socket.client.id).emit('Streams/webrtc/roomParticipants', participantsList);
        });

        socket.join(roomId, function () {
            if(_debug) console.log(nspName + '#' + socket.client.id + ' now in rooms: ', socket.rooms);
            io.of('/webrtc').in(roomId).clients(function (error, clients) {
                if(_debug) console.log('PARTICIPANTS IN THE ROOM', clients.length);
            });
        })

        if(_debug) console.log('Participant joined to room', roomId);

        //console.log('Streams/webrtc/participantConnected', socket)
        socket.broadcast.to(roomId).emit('Streams/webrtc/participantConnected', {
            username:identity.username,
            sid:socket.client.id,
            info:identity.info,
            fromSid:identity.sid
        });
    });

    socket.on('Streams/webrtc/confirmOnlineStatus', function(message) {
        if(_debug) console.log('confirmOnlineStatus', message);
        message.fromSid = socket.client.id;
        socket.to(nspName + '#' + message.targetSid).emit('Streams/webrtc/confirmOnlineStatus', message);

    });

    socket.on('Streams/webrtc/canISendOffer', function(message) {
        if(_debug) console.log('canISendOffer', message);
        message.fromSid = socket.client.id;
        socket.to(nspName + '#' + message.targetSid).emit('Streams/webrtc/canISendOffer', message);

    });

    socket.on('Streams/webrtc/signalling', function(message) {
        if(_debug) console.log('SIGNALLING MESSAGE', message.type, message.name, message.targetSid, nspName + '#' + socket.client.id);
        if(_debug) console.log('SIGNALLING message.targetSid', message.targetSid);
        message.fromSid = socket.client.id;
        if(message.type == 'offer') message.info = socket.info;

        if(message.targetSid == 'recording') {
            return;
        }
        socket.to(nspName + '#' + message.targetSid).emit('Streams/webrtc/signalling', message);
    });

    const getMethods = (obj) => {
        let properties = new Set()
        let currentObj = obj
        do {
            Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
        } while ((currentObj = Object.getPrototypeOf(currentObj)))
        return [...properties.keys()].filter(item => typeof obj[item] === 'function')
    }

    //console.log('Q.plugins.Streams', getMethods(Q.plugins.Streams));
    socket.on('disconnect', function() {
        if(!roomId) return;
        if(_debug) console.log('DISCONNECT', nspName + '#' + socket.client.id, socket.userPlatformId, 'Streams/webrtc/' + roomId);
        io.of('/webrtc').in(roomId).clients(function (error, clients) {
            if(_debug) console.log('PARTICIPANTS IN THE ROOM', clients.length);
            if(clients.length > 0) {
                return;
            }

            var streamName = 'Streams/webrtc/' + roomId;
            Q.plugins.Streams.fetchOne(socket.userPlatformId, roomPublisherId, streamName, function (err, stream) {
                if(err || !stream) {
                    return;
                }
                stream.setAttribute('endTime', +Date.now());
                stream.save();
                if ([false, "false"].includes(stream.getAttribute('resumeClosed'))) {
                    Q.plugins.Streams.close(socket.userPlatformId, roomPublisherId, streamName);
                }
            });
        });

        socket.broadcast.to(roomId).emit('Streams/webrtc/participantDisconnected', socket.client.id);
    });
};