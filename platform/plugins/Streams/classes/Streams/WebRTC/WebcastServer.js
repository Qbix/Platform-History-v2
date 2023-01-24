function WebcastServer(config) {
    const Q = require('Q');
    const Streams = Q.require('Streams');
    const https = require('https');
    const express = require('express');
    const app = express();
    const socket = require('socket.io');
    const socketVersion = require('socket.io/package').version;

    console.log('socket version', socketVersion)
    console.log('server port', config.port)

    var server = https.createServer(config.sslConfigs, app).listen(config.port);
    console.log('Server started on port', server.address())

    /**
     * Static methods for Broadcast
     * @class WebRTC
     * @static
     */
    function Broadcast() {}
    Broadcast.rooms = [];

    function eventSystem() {

        var events = {};

        var CustomEvent = function (eventName) {

            this.eventName = eventName;
            this.callbacks = [];

            this.registerCallback = function (callback) {
                this.callbacks.push(callback);
            }

            this.unregisterCallback = function (callback) {
                const index = this.callbacks.indexOf(callback);
                if (index > -1) {
                    this.callbacks.splice(index, 1);
                }
            }

            this.fire = function (data) {
                const callbacks = this.callbacks.slice(0);
                callbacks.forEach((callback) => {
                    callback(data);
                });
            }
        }

        var dispatch = function (eventName, data) {
            if (!doesHandlerExist(eventName)) {
                return;
            }

            const event = events[eventName];
            if (event) {
                event.fire(data);
            }
        }

        var on = function (eventName, callback) {
            let event = events[eventName];
            if (!event) {
                event = new CustomEvent(eventName);
                events[eventName] = event;
            }
            event.registerCallback(callback);
        }

        var off = function (eventName, callback) {
            const event = events[eventName];
            if (event && event.callbacks.indexOf(callback) > -1) {
                event.unregisterCallback(callback);
                if (event.callbacks.length === 0) {
                    delete events[eventName];
                }
            }
        }

        var doesHandlerExist = function (eventName) {
            if (events[eventName] != null && events[eventName].callbacks.length != 0) return true;
            return false;
        }

        return {
            dispatch: dispatch,
            on: on,
            off: off,
        }
    }

    Broadcast.Room = function (id) {
        this.id = id;
        this.isActive = true;
        this.roomPublisherId = id;
        this.publisherParticipant = null;
        this.participants = [];
        this.maxRootChildren = 2;
        this.parallelWebcast = null;
        this.maxChildren = 1;
        this.addParticipant = function (participant) {
            let participantExists;
            for (let p in this.participants) {
                if (this.participants[p] == participant) {
                    participantExists = true;
                    break;
                }
            }
            if (participantExists) return;

            this.participants.push(participant);
            if (participant.role == 'publisher') {
                this.publisherParticipant = participant;
                console.log('PUBLISHER CONNECTED');

            }

            participant.online = true;
            participant.room = this;
        }
        this.getParticipants = function (all) {
            if (all) {
                return this.participants;
            } else {
                return this.participants.filter(function (participant) {
                    return (participant.online !== false);
                });
            }
        }
        this.close = function () {
            console.log('close room');
            var room = this;
            this.isActive = false;
            this.removeTimer = setTimeout(function () {
                room.remove();
            }, 1000 * 30)
        }
        this.remove = function () {
            console.log('close room');

            var room = this;
            for (var i = Broadcast.rooms.length - 1; i >= 0; i--) {
                if (Broadcast.rooms[i] == room) {
                    Broadcast.rooms.splice(i, 1);
                    break;
                }
            }
            room = null;
        }
        this.active = function (value) {
            if (value === true) {
                if (this.removeTimer != null) {
                    clearTimeout(this.removeTimer);
                    this.removeTimer = null;
                }
            }
            this.isActive = value;
        }
        this.removeTimer = null;
        this.event = eventSystem();
    }
    Broadcast.getRoom = function (id) {
        for (let i in Broadcast.rooms) {
            if (Broadcast.rooms[i].id == id) {
                return Broadcast.rooms[i];
            }
            ;
        }
        return false;
    }
    Broadcast.Participant = function (id) {
        this.id = id;
        this.online = false;
        this.name = 'Connecting...';
        this.room = null;
        this.donors = [];
        this.receivers = [];
        this.removeFromRoom = function () {
            if (this.room == null) return;
            for (let i = this.room.participants.length - 1; i >= 0; i--) {
                if (this.room.participants[i] == this) {
                    this.room.participants.splice(i, 1);
                    break;
                }
            }

            for (let i = this.room.participants.length - 1; i >= 0; i--) {
                let participant = this.room.participants[i];
                console.log('removeFromRoom: role', participant.role);

                for (let r = participant.receivers.length - 1; r >= 0; r--) {
                    console.log('removeFromRoom: remove from recvrs', participant.receivers[r].id, this.id, participant.receivers[r] == this);

                    if (participant.receivers[r] == this) {
                        participant.receivers.splice(r, 1);
                        break;
                    }
                }

                for (let d = participant.donors.length - 1; d >= 0; d--) {
                    console.log('removeFromRoom: removeDonor .. ', participant.donors[d].id, this.id);

                    if (participant.donors[d] == this) {
                        console.log('removeFromRoom: removeDonor');
                        participant.donors.splice(d, 1);
                        break;
                    }
                }
            }
        }
    }


// socket setup
    var io = socket(server);

    var nspName = '/broadcast';
    var broadcastNamespace = io.of(nspName);

    broadcastNamespace.on('connection', function (socket) {
        console.log('broadcast: made sockets connection', socket.id);
        var roomId;
        var broadcastRoom;
        var localParticipant;

        socket.on('Streams/broadcast/joined', function (identity) {
            console.log('Got message: joined ', identity, socket.id);
            socket.role = identity.role;
            socket.info = identity.info;
            socket.livestreamStreamData = identity.livestreamStreamData;
            socket.roomId = roomId = identity.room;
            socket.roomStartTime = identity.roomStartTime;

            

            if (socket.broadcastParticipant == null) {
                var currentParticipant = localParticipant = new Broadcast.Participant(socket.id)
                currentParticipant.id = socket.id;
                currentParticipant.socketInstance = socket;
                currentParticipant.role = identity.role;
                currentParticipant.connectedTime = new Date().getTime();
                currentParticipant.info = identity.info;
                socket.broadcastParticipant = currentParticipant;
            }

            var existingRoom = Broadcast.getRoom(roomId);
            if (!existingRoom) {
                var currentRoom = broadcastRoom = new Broadcast.Room(identity.room);
                currentRoom.roomPublisherId = identity.roomPublisher;
                Broadcast.rooms.push(currentRoom);
                socket.broadcastRoom = currentRoom;
            } else {
                broadcastRoom = existingRoom;
            }

            var existinColors = broadcastRoom.participants.map(function (p) {
                return p.color;
            });

            var colors = ['blue', 'red', 'orange', 'purple', 'yellow', 'brown', 'green', 'skyblue', 'silver'];
            console.log('currentParticipant.color existinColors', existinColors.length)

            for(let c in existinColors) {
                let index = colors.indexOf(existinColors[c]);
                console.log('currentParticipant.color for index', index, existinColors[c])

                colors.splice(index, 1);
                console.log('currentParticipant.color for colors splcie', colors)

            }
            console.log('currentParticipant.color for colors result', colors, colors.length)

            if(colors.length == 0) {
                colors = ['blue', 'red', 'orange', 'purple', 'yellow', 'brown', 'green', 'skyblue', 'silver'];
            }

            currentParticipant.color = colors[Math.floor(Math.random() * (colors.length - 1))];

            console.log('currentParticipant.color res', currentParticipant.color)
            broadcastRoom.addParticipant(currentParticipant);

            for (var key in socket.adapter.rooms) {
                if (socket.adapter.rooms.hasOwnProperty(key)) {
                    if (key == identity.room) {
                        console.log('rooms: roomExists');
                        break;
                    }
                }
            }

            socket.join(roomId)

            console.log(socket.rooms)

            console.log('Participant joined to room', roomId);
            console.log('Participant joined', currentParticipant);

            broadcastNamespace.to(socket.id).emit('Streams/broadcast/joinedCallback', {
                color: currentParticipant.color
            });

            if (localParticipant.role == 'publisher') {
                console.log('PUBLISHER CONNECTING ...', localParticipant.id);
                if(socket.livestreamStreamData != null) {
                    console.log('Streams/livestream/start', socket.livestreamStreamData)
                    //post Streams/livestream/start message to livestream stream
                    Streams.Message.post({
                        type: 'Streams/livestream/start',
                        publisherId: socket.livestreamStreamData.publisherId,
                        streamName: socket.livestreamStreamData.streamName,
                        byUserId: socket.livestreamStreamData.publisherId,
                        instructions: JSON.stringify({ 
                            id: socket.livestreamStreamData.livestreamSessionId,
                            platform: 'Peer2Peer',
                            roomId: socket.roomId,
                         })
                    }, function (err) {
                        if (err) {
                            console.log('Something went wrong when posting to stream with next publisherId and streamName', socket.livestreamStream.publisherId, socket.livestreamStream.streamName)
                            return;
                        }
    
                        findReceiver(localParticipant);
                    });
                } else {
                    findReceiver(localParticipant);
                }
               

            } else if (localParticipant.role == 'receiver') {
                findDonor(localParticipant);
            }   
        });

        function findReceiver(donorParticipant) {
            console.log('PUBLISHER CONNECTING: findReceiver ', donorParticipant.id);
            for (let p in broadcastRoom.participants) {
                console.log('PUBLISHER CONNECTING: findReceiver ... donors ', broadcastRoom.participants[p].role, broadcastRoom.participants[p].donors.length);

                if (broadcastRoom.participants[p].role == 'receiver' && broadcastRoom.participants[p].donors.length == 0) {
                    console.log('PUBLISHER CONNECTING: receiver found ', broadcastRoom.participants[p].id);
                    donorParticipant.receivers.push(broadcastRoom.participants[p]);
                    broadcastRoom.participants[p].donors.push(donorParticipant);

                    broadcastNamespace.to(donorParticipant.id).emit('Streams/broadcast/participantConnected', {
                        sid: broadcastRoom.participants[p].id,
                        info: broadcastRoom.participants[p].info,
                        fromSid: broadcastRoom.participants[p].id
                    });

                    findReceiver(broadcastRoom.participants[p]);

                    if ((donorParticipant.role == 'receiver' && donorParticipant.receivers == broadcastRoom.maxChildren) ||
                        (donorParticipant.role == 'publisher' && donorParticipant.receivers == broadcastRoom.maxRootChildren)) {
                        break;
                    }
                }
            }
        }

        function findDonor(receiverParticipant) {
            console.log('findDonor', receiverParticipant.id);
            for (let p in broadcastRoom.participants) {
                var roomParticipant = broadcastRoom.participants[p];
                if (roomParticipant == receiverParticipant || amIParentOf(roomParticipant, receiverParticipant)) continue;
                console.log('findDonor: searching ...', roomParticipant.receivers.length, broadcastRoom.maxChildren, roomParticipant.role, roomParticipant.receivers[0] ? roomParticipant.receivers[0].id : null);

                if (((roomParticipant.role == 'receiver' && roomParticipant.donors.length != 0 && roomParticipant.receivers.length < broadcastRoom.maxChildren))
                    || (roomParticipant.role == 'publisher' && roomParticipant.receivers.length < broadcastRoom.maxRootChildren)) {
                    console.log('findDonor: donor found', roomParticipant.id);

                    //askPermissionToConnect(roomParticipant).then(answer => {
                    //console.log('askPermissionToConnect answer', answer);
                    //if(answer === true) {
                    broadcastNamespace.to(roomParticipant.id).emit('Streams/broadcast/participantConnected', {
                        username: receiverParticipant.username,
                        sid: receiverParticipant.id,
                        info: receiverParticipant.info,
                        fromSid: receiverParticipant.id
                    });
                    roomParticipant.receivers.push(receiverParticipant);
                    receiverParticipant.donors.push(roomParticipant);
                    //}
                    //})

                    break;
                }
            }
        }

        async function askPermissionToConnect(roomParticipant) {
            console.log('askPermissionToConnect', roomParticipant.id)

            return await new Promise(resolve => {
                function onPermissionReqResult(result) {
                    console.log('askPermissionToConnect result result.fromSid', result.fromSid, roomParticipant.id)

                    if (result.fromSid == (roomParticipant.id)) {
                        //let resp = JSON.parse(result)
                        console.log('askPermissionToConnect result', result.answer)
                        broadcastRoom.event.off('permissionReqResult', onPermissionReqResult)
                        resolve(result.answer);
                    }
                }

                broadcastRoom.event.on('permissionReqResult', onPermissionReqResult)
                console.log('askPermissionToConnect emit', roomParticipant.id)

                broadcastNamespace.to(roomParticipant.id).emit('Streams/broadcast/canIConnect', {});
            });
        }

        // check if participant to whom we are searching donor is parent of  potentional donor
        function amIParentOf(potentionalChild, potentionalParent) {
            var parent = false;

            function isParent(participant) {
                for (let d in participant.donors) {
                    if (participant.donors[d].id == potentionalParent.id) {
                        parent = true;
                    } else {
                        isParent(participant.donors[d])
                    }
                }
            }

            isParent(potentionalChild)

            console.log('amIParentOf', potentionalChild.id, potentionalParent.id, parent)
            return parent
        }

        function getDistanceToRoot() {
            var level = 0;

            function doesParentExist(participant) {

                if (participant.donors[0] != null) {
                    level++;
                    doesParentExist(participant.donors[0]);
                }
            }

            doesParentExist(localParticipant)
            return level;
        }

        socket.on('permissionReqResult', function (message) {
            broadcastRoom.event.dispatch('permissionReqResult', message)
        });

        socket.on('Streams/broadcast/confirmOnlineStatus', function (message) {
            console.log('confirmOnlineStatus', message);
            message.fromSid = socket.id;
            socket.to(message.targetSid).emit('Streams/broadcast/confirmOnlineStatus', message);

        });

        socket.on('Streams/broadcast/canISendOffer', function (message) {
            console.log('canISendOffer', message);
            message.fromSid = socket.id;
            socket.to(message.targetSid).emit('Streams/broadcast/canISendOffer', message);

        });

        socket.on('Streams/broadcast/signalling', function (message) {
            console.log('SIGNALLING MESSAGE', message.type, message.targetSid, socket.id);
            console.log('SIGNALLING message.targetSid', message.targetSid);
            message.fromSid = socket.id;
            if (message.type == 'offer') {
                if (message.resetConnection == true) {
                    message.color = localParticipant.color;
                    message.distanceToRoot = getDistanceToRoot();
                }
                message.info = socket.info;
            }

            socket.to(message.targetSid).emit('Streams/broadcast/signalling', message);
        });

        socket.on('parallelWebcastExists', function (parralelRoomId) {
            console.log('parallelWebcastExists', parralelRoomId);
            console.log('parallelWebcastExists broadcastRoom', broadcastRoom);

            broadcastRoom.parallelWebcast = parralelRoomId;
            console.log('parallelWebcastExists parallelWebcast', parralelRoomId);

        });

        socket.on('switchRoom', function (newRoomName) {
            console.log('switchRoom', newRoomName);

            if(broadcastRoom.parallelWebcast != null) broadcastRoom.parallelWebcast = null;
        });


        socket.on('disconnect', function () {
            console.log('WEBCAST DISCONNECT', socket.id);

            if (!roomId) return;
            console.log('DISCONNECT', socket.id, socket.userPlatformId, 'Streams/webrtc/' + roomId);
            /*io.of(nspName).in(roomId).clients(function (error, clients) {
                console.log('PARTICIPANTS IN THE ROOM', clients.length);
                if(clients.length > 0) {
                    return;
                }
            });*/

            localParticipant.removeFromRoom();
            if (localParticipant.role != 'publisher') {
                for (let r in localParticipant.receivers) {
                    findDonor(localParticipant.receivers[r])
                }
            } else if (localParticipant.role == 'publisher') {
                console.log('ROOMS BEFORE', socket.adapter.rooms);
                console.log('broadcastRoom.parallelWebcast', broadcastRoom.parallelWebcast);
                console.log('broadcastRoom.id', broadcastRoom.id);

                if(broadcastRoom.parallelWebcast != null) {
                    console.log('broadcastRoom.parallelWebcast', broadcastRoom.parallelWebcast);

                    let parallelRoom;

                    for(let r in Broadcast.rooms) {
                        console.log('broadcastRoom.parallelWebcast FOR', Broadcast.rooms[r].id, broadcastRoom.parallelWebcast);

                        if(Broadcast.rooms[r].id == broadcastRoom.parallelWebcast) {
                            parallelRoom = Broadcast.rooms[r];
                        }
                    }

                    if(parallelRoom) {
                        let parallelPublisher;
                        for(let p in parallelRoom.participants) {
                            if(parallelRoom.participants[p].role == 'publisher') {
                                parallelPublisher = parallelRoom.participants[p];
                            }
                        }

                        let watchers = broadcastRoom.participants;
                        for(let b in broadcastRoom.participants) {
                            parallelRoom.addParticipant(broadcastRoom.participants[b])
                            if(broadcastRoom.participants[b].socketInstance) {
                                broadcastRoom.participants[b].socketInstance.join(parallelRoom.id)
                            }
                        }

                        broadcastRoom = parallelRoom;

                        for(let b in watchers) {
                            findDonor(watchers[b]);
                        }
                    }                    
                }

                if(socket.livestreamStreamData != null) {
                    //post Streams/livestream/stop message to livestream stream
                    Streams.Message.post({
                        type: 'Streams/livestream/stop',
                        publisherId: socket.livestreamStreamData.publisherId,
                        streamName: socket.livestreamStreamData.streamName,
                        byUserId: socket.livestreamStreamData.publisherId,
                        instructions: JSON.stringify({ 
                            id: socket.livestreamStreamData.livestreamSessionId,
                            platform: 'p2p',
                            roomId: socket.roomId,
                         })
                    }, function (err) {
                        if (err) {
                            console.log('Something went wrong when posting to stream with next publisherId and streamName', socket.livestreamStream.publisherId, socket.livestreamStream.streamName)
                            return;
                        }
    
                    });
                }
                console.log('ROOMS AFTER', socket.adapter.rooms);
            }


            socket.broadcast.to(roomId).emit('Streams/broadcast/participantDisconnected', socket.id);
        });

    })

    return app;
}
module.exports = WebcastServer;