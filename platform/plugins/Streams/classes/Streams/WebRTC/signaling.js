const Q = require('Q');
module.exports = function(socket,io) {
    var _debug = Q.Config.get(['Streams', 'webrtc', 'debug'], false);
    var WebRTC =  Q.plugins.Streams.WebRTC;
    var nspName = '/webrtc';
    var webrtcNamespace = io.of(nspName);
    var roomPublisherId;
    var roomId;
    socket.on('Streams/webrtc/joined', function (identity, cb) {
        if(_debug) console.log('Got message: joined ', identity, nspName + '#' + socket.client.id);
        socket.username = identity.username;
        socket.userPlatformId = identity.username.split('\t')[0];
        socket.startTime = identity.username.split('\t')[1];
        socket.info = identity.info;
        socket.roomId = roomId = identity.room;
        socket.roomStartTime = identity.roomStartTime;
        socket.roomPublisherId = roomPublisherId = identity.roomPublisher;

        function onParticipantValidation() {
            if(_debug) console.log('rooms: ', socket.adapter.rooms);
            for (var key in socket.adapter.rooms) {
                if (socket.adapter.rooms.hasOwnProperty(key)) {
                    if(key == identity.room) {
                        if(_debug) console.log('rooms: roomExists');
                        break;
                    }
                }
            }

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
                if(cb != null) cb(JSON.stringify(participantsList));

            });
        }

        var streamName = 'Streams/webrtc/' + roomId;
        Q.plugins.Streams.fetchOne(socket.userPlatformId, roomPublisherId, streamName, function (err, stream) {
            if(err || !stream) {
                return;
            }

            let onlyParticipantsAllowed = stream.getAttribute('onlyParticipantsAllowed');
            onlyParticipantsAllowed = onlyParticipantsAllowed == true || onlyParticipantsAllowed == 'true';
            if(_debug) console.log('CONNECT: onlyParticipantsAllowed', onlyParticipantsAllowed);
            if(!onlyParticipantsAllowed) {
                onParticipantValidation();
            } else {
                Q.plugins.Streams.getParticipants(roomPublisherId, streamName, function (participants) {
                    if(participants && participants[socket.userPlatformId] != null) {
                        onParticipantValidation();
                    } else {
                        if(_debug) console.log('CONNECT: participants only participants allowed');

                    }
                });
            }


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

    socket.on('Streams/webrtc/putInWaitingRoom', function(message) {
        if(_debug) console.log('putInWaitingRoom', message);
        if(message.userId == null || socket.userPlatformId == null) {
            return;
        }
        var userId = message.userId;
        var streamName = 'Streams/webrtc/' + roomId;
        Q.plugins.Streams.fetchOne(socket.userPlatformId, roomPublisherId, streamName, function (err, stream) {
            if(_debug) console.log('PUT IN WAITING ROOM: fetchOne');

            if(err || !stream) {
                return;
            }

            if(!stream.testAdminLevel('manage')) {
                console.log('No permissions to do action');
                return;
            }

            stream.leave({ userId: message.userId }, function () {
                if (_debug) console.log('PUT IN WAITING ROOM: LEAVE STREAM');

                var users = io.of('/webrtc').connected;

                for (let i in users) {
                    if (users[i].userPlatformId == userId) {
                        console.log('PUT IN WAITING ROOM: disconnect');
                        socket.to(nspName + '#' + users[i].client.id).emit('Streams/webrtc/leave');
                        socket.broadcast.to(roomId).emit('Streams/webrtc/participantDisconnected', socket.client.id);
                        socket.emit('Streams/webrtc/participantDisconnected', socket.client.id);
                        users[i].disconnect();
                    }
                }
            });


        });
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

            var streamName = 'Streams/webrtc/' + roomId;
            if(clients.length > 0) {
                if(_debug) console.log('DISCONNECT: clients.length > 0');

                Q.plugins.Streams.fetchOne(socket.userPlatformId, roomPublisherId, streamName, function (err, stream) {
                    if(_debug) console.log('DISCONNECT: fetchOne');

                    if(err || !stream) {
                        return;
                    }

                    stream.leave({userId:socket.userPlatformId}, function () {
                        if(_debug) console.log('DISCONNECT: LEAVE STREAM');
                    });

                });
                return;
            }

            Q.plugins.Streams.fetchOne(socket.userPlatformId, roomPublisherId, streamName, function (err, stream) {
                if(err || !stream) {
                    return;
                }

                stream.setAttribute('endTime', +Date.now());
                stream.save();

                stream.leave({userId:socket.userPlatformId}, function () {
                    if(_debug) console.log('DISCONNECT: LEAVE STREAM');
                });
                if ((stream.getAttribute('resumeClosed') == null || [false, "false"].includes(stream.getAttribute('resumeClosed'))) && (stream.getAttribute('closeManually') == null || [false, "false"].includes(stream.getAttribute('closeManually')))) {
                    if(_debug) console.log('DISCONNECT: Q.plugins.Streams.fetchOne: CLOSE');

                    Q.plugins.Streams.close(socket.userPlatformId, roomPublisherId, streamName);
                }
            });
        });

        socket.broadcast.to(roomId).emit('Streams/webrtc/participantDisconnected', socket.client.id);
    });
};