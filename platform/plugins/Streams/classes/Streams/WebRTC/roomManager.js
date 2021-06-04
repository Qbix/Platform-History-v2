const Q = require('Q');

module.exports = function(socket, io) {

    var _debug = Q.Config.get(['Streams', 'webrtc', 'debug'], false);
    var nspName = '/webrtc';
    var webrtcNamespace = io.of(nspName);
    var WebRTC =  Q.plugins.Streams.WebRTC;
    var roomPublisherId;

    socket.on('Streams/webrtc/joined', function (identity) {
        let roomExists = false;
        for (var key in socket.adapter.rooms) {
            if (socket.adapter.rooms.hasOwnProperty(key)) {
                if(key == identity.room) {
                    roomExists = true;
                    break;
                }
            }
        }

        if(!roomExists) {
            if(_debug) console.log('server2clientWebRTC: Room not exists');

            for(let r in WebRTC.rooms) {
                if(identity.room == WebRTC.rooms[r].id) {
                    socket.webrtcRoom = WebRTC.rooms[r];
                    break;
                }
            }

        } else {
            if(_debug) console.log('server2clientWebRTC: Room exists');

            for(let r in WebRTC.rooms) {
                if(identity.room == WebRTC.rooms[r].id)
                {
                    socket.webrtcRoom = WebRTC.rooms[r];
                    break;
                }
            }
        }

        if(!socket.webrtcRoom) {
            var currentRoom = new WebRTC.Room(identity.room);
            currentRoom.roomPublisherId = identity.roomPublisher;
            socket.webrtcRoom = currentRoom;
            WebRTC.rooms.push(currentRoom);
        }
        socket.webrtcRoom.active(true);

        for(let r in socket.webrtcRoom.participants) {
            if(socket.client.id == socket.webrtcRoom.participants[r].id)
            {
                socket.webrtcParticipant = socket.webrtcRoom.participants[r];
                break;
            }
        }

        if(socket.webrtcParticipant == null) {
            var currentParticipant = new WebRTC.Participant(socket.client.id)
            currentParticipant.sid = identity.sid;
            currentParticipant.username = identity.username;
            currentParticipant.connectedTime = identity.username.split('\t')[1];
            currentParticipant.userPlatformId = identity.username.split('\t')[0];
            socket.webrtcParticipant = currentParticipant;
            socket.webrtcRoom.addParticipant(currentParticipant);
        }

        socket.webrtcParticipant.online = true;

        socket.webrtcRoom.event.dispatch('participantConnected', socket.webrtcParticipant);

        if(_debug) console.log('server2clientWebRTC: PARTICIPANT JOINED', socket.webrtcParticipant);
        if(_debug) console.log('server2clientWebRTC: ALL PARTICIPANTS', socket.webrtcRoom.participants);
    });

    socket.on('Streams/webrtc/participantDisconnected', function() {
        if(_debug) console.log('participantDisconnected')
        //socket.webrtcRoom.event.dispatch('participantDisconnected');
    });

    socket.on('Streams/webrtc/participantConnected', function(participant) {
        if(_debug) console.log('participantConnected', participant)
        //socket.webrtcRoom.event.dispatch('participantConnected');
    });

    socket.on('disconnect', function() {
        if(_debug) console.log('disconnect');
        if(!socket.webrtcRoom) return;
        if(socket.webrtcParticipant.id == socket.client.id) {
            console.log('disconnect socket.webrtcParticipant.id != socket.client.id', socket.webrtcParticipant.id, socket.client.id)
            socket.webrtcParticipant.online = false;
            socket.webrtcRoom.event.dispatch('participantDisconnected', socket.webrtcParticipant);
        }
        io.of('/webrtc').in(socket.webrtcRoom.id).clients(function (error, clients) {
            if(clients.length == 0) socket.webrtcRoom.close();
        });
    });
}