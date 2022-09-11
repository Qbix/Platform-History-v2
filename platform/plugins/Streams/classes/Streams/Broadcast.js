"use strict";
/*jshint node:true */
/**
 * WebRTC class
 * @module Streams
 * @main Streams
 */
const Q = require('Q');
const fs = require('fs');
const { PassThrough } = require('stream');
const path = require('path');

var express = require('express');
var app = express();
app.set('view engine', 'ejs');


const Streams_Avatar = Q.require('Streams/Avatar');
const Users = Q.require('Users');

const child_process = require('child_process');
const appDir = path.dirname(require.main.filename) + '/../../';
const appName =  Q.Config.get(['Q','app']);

/**
 * Static methods for Broadcast
 * @class WebRTC
 * @static
 */
function Broadcast() {

}
Broadcast.rooms = [];

function eventSystem(){

    var events = {};

    var CustomEvent = function (eventName) {

        this.eventName = eventName;
        this.callbacks = [];

        this.registerCallback = function(callback) {
            this.callbacks.push(callback);
        }

        this.unregisterCallback = function(callback) {
            const index = this.callbacks.indexOf(callback);
            if (index > -1) {
                this.callbacks.splice(index, 1);
            }
        }

        this.fire = function(data) {
            const callbacks = this.callbacks.slice(0);
            callbacks.forEach((callback) => {
                callback(data);
            });
        }
    }

    var dispatch = function(eventName, data) {
        if(!doesHandlerExist(eventName)) {
            return;
        }

        const event = events[eventName];
        if (event) {
            event.fire(data);
        }
    }

    var on = function(eventName, callback) {
        let event = events[eventName];
        if (!event) {
            event = new CustomEvent(eventName);
            events[eventName] = event;
        }
        event.registerCallback(callback);
    }

    var off = function(eventName, callback) {
        const event = events[eventName];
        if (event && event.callbacks.indexOf(callback) > -1) {
            event.unregisterCallback(callback);
            if (event.callbacks.length === 0) {
                delete events[eventName];
            }
        }
    }

    var doesHandlerExist = function (eventName) {
        if(events[eventName] != null && events[eventName].callbacks.length != 0) return true;
        return false;
    }

    return {
        dispatch:dispatch,
        on:on,
        off:off,
    }
}

Broadcast.Room = function (id) {
    this.id = id;
    this.isActive = true;
    this.roomPublisherId = id;
    this.publisherParticipant = null;
    this.participants = [];
    this.maxChildren = 2;
    this.addParticipant = function (participant) {
        let participantExists;
        for (let p in this.participants) {
            if(this.participants[p] == participant) {
                participantExists = true;
                break;
            }
        }
        if(participantExists) return;

        this.participants.push(participant);
        if(participant.role == 'publisher') {
            this.publisherParticipant = participant;
            console.log('PUBLISHER CONNECTED');

        }
        participant.online = true;
        participant.room = this;
    }
    this.getParticipants = function (all) {
        if(all) {
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
        }, 1000*30)
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
        if(value === true) {
            if(this.removeTimer != null) {
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
    for(let i in Broadcast.rooms) {
        if(Broadcast.rooms[i].id == id){
            return Broadcast.rooms[i];
        };
    }
    return false;
}

Broadcast.Participant = function (id) {
    this.id = id;
    this.userPlatformId = null;
    this.online = false;
    this.name = 'Connecting...';
    this.room = null;
    this.donors = [];
    this.receivers = [];
    this.removeFromRoom = function () {
        if(this.room == null) return;
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

/**
 * Start internal listener for Streams plugin. Accepts messages such as<br/>
 * "Streams/Stream/join",
 * "Streams/Stream/leave",
 * "Streams/Stream/create",
 * "Streams/Stream/remove",
 * "Streams/Message/post",
 * "Streams/Message/postMessages",
 * "Streams/Stream/invite"
 * @method listen
 * @static
 * @param {Object} options={} So far no options are implemented.
 * @return {Users.Socket|null} The socket if connected, otherwise null
 */
Broadcast.listen = function () {
    var socket = (Q.plugins.Streams.listen() || {}).socket;

    if (!socket || !socket.io) {
        return null;
    }

    var _debug = Q.Config.get(['Streams', 'webrtc', 'debug'], {});

    var io = socket.io;
    var nspName = '/broadcast';
    var broadcastNamespace = io.of(nspName);
    var _publisherId = null;

    broadcastNamespace.on('connection', function(socket) {
        if(_debug) console.log('broadcast: made sockets connection', socket.id);
        var roomPublisherId;
        var roomId;
        var broadcastRoom;
        var localParticipant;

        socket.on('Streams/broadcast/joined', function (identity) {
            if(_debug) console.log('Got message: joined ', identity, nspName + '#' + socket.client.id);
            socket.username = identity.username;
            socket.role = identity.role;
            socket.userPlatformId = identity.username.split('\t')[0];
            socket.startTime = identity.username.split('\t')[1];
            socket.info = identity.info;
            socket.roomId = roomId = identity.room;
            socket.roomStartTime = identity.roomStartTime;

            if(socket.broadcastParticipant == null) {
                var currentParticipant = localParticipant = new Broadcast.Participant(socket.client.id)
                currentParticipant.id = socket.client.id;
                currentParticipant.role = identity.role;
                currentParticipant.username = identity.username;
                //currentParticipant.connectedTime = identity.username.split('\t')[1];
                currentParticipant.connectedTime = new Date().getTime();
                currentParticipant.userPlatformId = identity.username.split('\t')[0];
                currentParticipant.info = identity.info;
                socket.broadcastParticipant = currentParticipant;
            }

            var existingRoom = Broadcast.getRoom(roomId);
            if(!existingRoom) {
                var currentRoom = broadcastRoom = new Broadcast.Room(identity.room);
                currentRoom.roomPublisherId = identity.roomPublisher;
                Broadcast.rooms.push(currentRoom);
                socket.broadcastRoom = currentRoom;
            } else {
                broadcastRoom = existingRoom;
            }

            broadcastRoom.addParticipant(currentParticipant);

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
                io.of(nspName).in(roomId).clients(function (error, clients) {
                    if(_debug) console.log('PARTICIPANTS IN THE ROOM', clients.length);
                });
            })

            if(_debug) console.log('Participant joined to room', roomId);
            if(_debug) console.log('Participant joined', currentParticipant);


            if(localParticipant.role == 'publisher') {
                if(_debug) console.log('PUBLISHER CONNECTING ...', localParticipant.id);

                findReceiver(localParticipant);

            } else if(localParticipant.role == 'receiver') {
                findDonor(localParticipant);
            }

        });

        function findReceiver(donorParticipant) {
            if(_debug) console.log('PUBLISHER CONNECTING: findReceiver ', donorParticipant.id);
            for(let p in broadcastRoom.participants) {
                if(_debug) console.log('PUBLISHER CONNECTING: findReceiver ... donors ', broadcastRoom.participants[p].role, broadcastRoom.participants[p].donors.length);

                if(broadcastRoom.participants[p].role == 'receiver' && broadcastRoom.participants[p].donors.length == 0) {
                    if(_debug) console.log('PUBLISHER CONNECTING: receiver found ', broadcastRoom.participants[p].id);
                    donorParticipant.receivers.push(broadcastRoom.participants[p]);
                    broadcastRoom.participants[p].donors.push(donorParticipant);

                    broadcastNamespace.to(nspName + '#' + donorParticipant.id).emit('Streams/broadcast/participantConnected', {
                        username:broadcastRoom.participants[p].username,
                        sid:broadcastRoom.participants[p].id,
                        info:broadcastRoom.participants[p].info,
                        fromSid:broadcastRoom.participants[p].id
                    });

                    findReceiver(broadcastRoom.participants[p]);

                    if(donorParticipant.receivers == broadcastRoom.maxChildren) {
                        break;
                    }
                }
            }
        }
        function findDonor(receiverParticipant) {
            console.log('findDonor', receiverParticipant.id);
            for(let p in broadcastRoom.participants) {
                var roomParticipant = broadcastRoom.participants[p];
                if(roomParticipant == receiverParticipant || amIParentOf(roomParticipant, receiverParticipant)) continue;
                console.log('findDonor: searching ...', roomParticipant.receivers.length, broadcastRoom.maxChildren, roomParticipant.role, roomParticipant.receivers[0] ? roomParticipant.receivers[0].id : null);

                if(((roomParticipant.role == 'receiver' && roomParticipant.donors.length != 0) || roomParticipant.role == 'publisher')
                    && roomParticipant.receivers.length < broadcastRoom.maxChildren) {
                    console.log('findDonor: donor found', roomParticipant.id);

                    askPermissionToConnect(roomParticipant).then(function (answer) {
                        console.log('askPermissionToConnect answer', answer);
                        /*broadcastNamespace.to(nspName + '#' + roomParticipant.id).emit('Streams/broadcast/participantConnected', {
                            username:receiverParticipant.username,
                            sid:receiverParticipant.id,
                            info:receiverParticipant.info,
                            fromSid:receiverParticipant.id
                        });
                        roomParticipant.receivers.push(receiverParticipant);
                        receiverParticipant.donors.push(roomParticipant);*/
                    })


                    break;
                }
            }
        }

        async function askPermissionToConnect(roomParticipant) {
            await new Promise(resolve => {
                broadcastNamespace.to(nspName + '#' + roomParticipant.id).emit('Streams/broadcast/canIConnect', {}, (answer) => {
                    resolve(answer);
                });
            });
        }

        // check if participant to whom we are searching donor is parent of  potentional donor
        function amIParentOf(potentionalChild, potentionalParent) {
            var parent = false;
            function isParent(participant) {
                for(let d in participant.donors) {
                    if(participant.donors[d].id == potentionalParent.id){
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
        
        socket.on('Streams/broadcast/confirmOnlineStatus', function(message) {
            if(_debug) console.log('confirmOnlineStatus', message);
            message.fromSid = socket.client.id;
            socket.to(nspName + '#' + message.targetSid).emit('Streams/broadcast/confirmOnlineStatus', message);

        });

        socket.on('Streams/broadcast/canISendOffer', function(message) {
            if(_debug) console.log('canISendOffer', message);
            message.fromSid = socket.client.id;
            socket.to(nspName + '#' + message.targetSid).emit('Streams/broadcast/canISendOffer', message);

        });

        socket.on('Streams/broadcast/signalling', function(message) {
            if(_debug) console.log('SIGNALLING MESSAGE', message.type, message.name, message.targetSid, nspName + '#' + socket.client.id);
            if(_debug) console.log('SIGNALLING message.targetSid', message.targetSid);
            message.fromSid = socket.client.id;
            if(message.type == 'offer') message.info = socket.info;

            socket.to(nspName + '#' + message.targetSid).emit('Streams/broadcast/signalling', message);
        });


        socket.on('disconnect', function() {
            if(!roomId) return;
            if(_debug) console.log('DISCONNECT', nspName + '#' + socket.client.id, socket.userPlatformId, 'Streams/webrtc/' + roomId);
            io.of(nspName).in(roomId).clients(function (error, clients) {
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
                    if ([false, "false"].includes(stream.getAttribute('resumeClosed')) && (stream.getAttribute('closeManually') == null || [false, "false"].includes(stream.getAttribute('closeManually')))) {
                        Q.plugins.Streams.close(socket.userPlatformId, roomPublisherId, streamName);
                    }
                });
            });

            localParticipant.removeFromRoom();
            if(localParticipant.role != 'publisher') {
                for (let r in localParticipant.receivers) {
                    findDonor(localParticipant.receivers[r])
                }
            }

            socket.broadcast.to(roomId).emit('Streams/broadcast/participantDisconnected', socket.client.id);
        });

    })

};

module.exports = Broadcast;