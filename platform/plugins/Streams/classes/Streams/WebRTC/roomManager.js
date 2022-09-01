const Q = require('Q');

module.exports = function(socket, io) {
    var _debug = Q.Config.get(['Streams', 'webrtc', 'debug'], false);
    var _globalWebRTCOptions = Q.Config.get(['Streams', 'webrtc'], {});
    var nspName = '/webrtc';
    var webrtcNamespace = io.of(nspName);
    var WebRTC =  Q.plugins.Streams.WebRTC;
    var roomPublisherId;
    var limitMicrophone = null;

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

    WebRTC.Room = function (id) {
        this.id = id;
        this.isActive = true;
        this.roomPublisherId = id;
        this.limit = {
            audio: null,
            video: null,
            minimalTimeOfUsingSlot: null,
            timeBeforeForceUserToDisconnect: null
        };
        this.participants = [];
        this.cameraRequestsQueue = [];
        this.micRequestsQueue = [];
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
            console.log('roomManager: close room');
            var room = this;
            this.isActive = false;
            this.removeTimer = setTimeout(function () {
                room.remove();
            }, 1000*30)
        }
        this.remove = function () {
            console.log('roomManager: remove room');

            var room = this;
            for (var i = WebRTC.rooms.length - 1; i >= 0; i--) {
                if (WebRTC.rooms[i] == room) {
                    WebRTC.rooms.splice(i, 1);
                    break;
                }
            }
            room = null;
        }
        this.active = function (value) {
            console.log('roomManager: make room active');
            if(value === true) {
                if(this.removeTimer != null) {
                    console.log('make room active: delete remove timer');

                    clearTimeout(this.removeTimer);
                    this.removeTimer = null;
                }
            }
            this.isActive = value;
        }
        this.removeTimer = null;
        this.event = eventSystem();
    }

    WebRTC.Participant = function (id) {
        this.id = id;
        this.userPlatformId = null;
        this.online = false;
        this.name = 'Connecting...';
        this.room = null;
        this.RTCPeerConnection = null;
        this.tracks = [];
        this.liveStreaming = {connectionManager: null, room: null, canvasComposer: null};
        this.cameraRequestCountdown = {timer: null, userWhoRequested: null};
        this.micRequestCountdown = {timer: null, userWhoRequested: null};
        this.recording = {path: null, startTime: null, stopTime: null, parallelRecordings:[], parallelRecordingsFile:null};
        this.videoTracks = function () {
            return this.tracks.filter(function (trackObj) {
                return trackObj.kind == 'video' ||  trackObj.kind == 'videoavatar';
            });

        };
        this.avatarTracks = function () {
            return this.tracks.filter(function (trackObj) {
                return trackObj.kind == 'videoavatar';
            });
        };
        this.audioTracks = function () {
            return this.tracks.filter(function (trackObj) {
                return trackObj.kind == 'audio';
            });
        };
        this.removeFromRoom = function () {
            if(this.room == null) return;
            for (var i = this.room.participants.length - 1; i >= 0; i--) {
                if (this.room.participants[i] == this) {
                    this.room.participants.splice(i, 1);
                    break;
                }
            }
        }
    }

    WebRTC.Track = function (kind) {
        this.kind = kind;
        this.mediaStreamTrack = null;
        this.createdTime = Date.now();
    }

    socket.on('Streams/webrtc/joined', function (identity) {
        let roomExists = false;
        if(_debug) console.log('server2clientWebRTC: joined', socket.adapter.rooms);

        for (var key in socket.adapter.rooms) {
            if (socket.adapter.rooms.hasOwnProperty(key)) {
                if(key == identity.room) {
                    roomExists = true;
                    break;
                }
            }
        }

        if(!roomExists) {
            if(_debug) console.log('server2clientWebRTC: Room not exists', WebRTC.rooms.length);

            for(let r in WebRTC.rooms) {
                if(identity.room == WebRTC.rooms[r].id) {
                    socket.webrtcRoom = WebRTC.rooms[r];
                    break;
                }
            }

        } else {
            if(_debug) console.log('server2clientWebRTC: Room exists', WebRTC.rooms.length);

            for(let r in WebRTC.rooms) {
                if(identity.room == WebRTC.rooms[r].id)
                {
                    socket.webrtcRoom = WebRTC.rooms[r];
                    break;
                }
            }
        }

        if(!socket.webrtcRoom) {
            if(_debug) console.log('server2clientWebRTC: Room not exists 2: create', identity.room);

            var currentRoom = new WebRTC.Room(identity.room);
            currentRoom.roomPublisherId = identity.roomPublisher;
            socket.webrtcRoom = currentRoom;
            WebRTC.rooms.push(currentRoom);

            let userPlatformId = identity.username.split('\t')[0];
            Q.plugins.Streams.fetchOne(userPlatformId, currentRoom.roomPublisherId, 'Streams/webrtc/' + identity.room, function (err, stream) {
                if(err || !stream) {
                    return;
                }
                currentRoom.roomStream = stream;
                if(_debug) console.log('server2clientWebRTC: global options', _globalWebRTCOptions);

                if(_globalWebRTCOptions['limits'] != null) {
                    if(_debug) console.log('server2clientWebRTC: globalsLimits', _globalWebRTCOptions['limits']);
                    currentRoom.limits = _globalWebRTCOptions['limits'];
                }

                let limitsConfig = stream.getAttribute('limits', null)
                if(limitsConfig != null) {
                    if(limitsConfig['video'] != null) {
                        currentRoom.limits.video = limitsConfig['video'];
                    }
                    if(limitsConfig['audio'] != null) {
                        currentRoom.limits.audio = limitsConfig['audio'];
                    }
                    if(limitsConfig['minimalTimeOfUsingSlot'] != null) {
                        currentRoom.limits.minimalTimeOfUsingSlot = limitsConfig['minimalTimeOfUsingSlot'];
                    }
                    if(limitsConfig['timeBeforeForceUserToDisconnect'] != null) {
                        currentRoom.limits.timeBeforeForceUserToDisconnect = limitsConfig['timeBeforeForceUserToDisconnect'];
                    }
                }
                if(_debug) console.log('server2clientWebRTC: currentRoom.limits', currentRoom.limits);


            });
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
        }
        socket.webrtcRoom.addParticipant(socket.webrtcParticipant);

        socket.webrtcParticipant.online = true;

        socket.webrtcRoom.event.dispatch('participantConnected', socket.webrtcParticipant);

        if(_debug) console.log('server2clientWebRTC: PARTICIPANT JOINED', socket.webrtcParticipant.id);
        if(_debug) console.log('server2clientWebRTC: ALL PARTICIPANTS', socket.webrtcRoom.participants.map(function(p){return p.id}));
    });

    socket.on('Streams/webrtc/controlsLoaded', function () {

        //inform user who just connected about other users in queue who requested camera/mic slot and are waiting for their turn
        for(let r in socket.webrtcRoom.cameraRequestsQueue) {

            let queueItem = socket.webrtcRoom.cameraRequestsQueue[r];
            let timePassed = Date.now() - queueItem.timeAdded;
            let tileLeftToWait = queueItem.waitingTime - timePassed;

            if(_debug) console.log('joined: camera requests queue', queueItem.participant.id);

            let emitMsg = {
                fromSid:queueItem.participant.id,
                waitingTime:tileLeftToWait
            }

            socket.emit('Streams/webrtc/requestCamera', emitMsg);
        }

        for(let r in socket.webrtcRoom.micRequestsQueue) {

            let queueItem = socket.webrtcRoom.micRequestsQueue[r];
            let timePassed = Date.now() - queueItem.timeAdded;
            let tileLeftToWait = queueItem.waitingTime - timePassed;

            if(_debug) console.log('joined: mic requests queue', queueItem.participant.id);

            let emitMsg = {
                fromSid:queueItem.participant.id,
                waitingTime:tileLeftToWait
            }

            socket.emit('Streams/webrtc/requestMic', emitMsg);
        }
    });

    socket.on('Streams/webrtc/getLimitsInfo', function() {
        if(!socket.webrtcRoom) return;
        if(_debug) console.log('getLimitsInfo');

        let participants = socket.webrtcRoom.getParticipants();
        let videos = 0;
        let audios = 0;
        for(let r in participants) {
            let participant = participants[r];
            if(_debug) console.log('getLimitsInfo video', participant.videoTracks().length, participant.tracks.length)
            if(_debug) console.log('getLimitsInfo audio', participant.audioTracks().length, participant.tracks.length)

            videos = videos + (participant.videoTracks().length != 0 ? 1 : 0);
            audios = audios + (participant.audioTracks().length != 0 ? 1 : 0);
        }

        let emitMsg = {
            participantsNum:participants.length,
            activeVideos:videos,
            activeAudios:audios,
            minimalTimeOfUsingSlot:socket.webrtcRoom.limits.minimalTimeOfUsingSlot,
            timeBeforeForceUserToDisconnect:socket.webrtcRoom.limits.timeBeforeForceUserToDisconnect
        }
        socket.emit('Streams/webrtc/getLimitsInfo', emitMsg);
    });

    socket.on('Streams/webrtc/canITurnCameraOn', function() {
        if(!socket.webrtcRoom) return;
        if(_debug) console.log('canITurnCameraOn', socket.webrtcRoom.getParticipants().length)


        if(socket.webrtcParticipant.videoTracks().length != 0){
            //if user has mic on and avatar shown, change its kind from videoavatar to usual video
            if(_debug) console.log('canITurnCameraOn if1');

            let vTracks = socket.webrtcParticipant.videoTracks();
            for(let t in vTracks) {
                if(vTracks[t].kind == 'videoavatar') {
                    vTracks[t].kind = 'video';
                    break;
                }
            }

            socket.emit('Streams/webrtc/canITurnCameraOn', { type: 'answer', answerValue: true, limit: socket.webrtcRoom.limits.video });


        } else if(isVideoSlotAvailable() && socket.webrtcRoom.cameraRequestsQueue.length == 0) {
            //if there is free camera/video slot in the room (if the number of videos is less than limit), just give it to the user

            let newTrack = new WebRTC.Track('video');
            socket.webrtcParticipant.tracks.push(newTrack);
            if(_debug) console.log('canITurnCameraOn push track', socket.webrtcParticipant.tracks)
            socket.emit('Streams/webrtc/canITurnCameraOn', { type: 'answer', answerValue: true, limit: socket.webrtcRoom.limits.video });
        } else {
            if(_debug) console.log('canITurnCameraOn if2');

            addMeToCameraQueue();
        }
    });

    function addMeToCameraQueue(audio) {
        //if there is no free camera/video slot in the room, add user to queue of video slot requests
        if(_debug) console.log('canITurnCameraOn: addMeToCameraQueue: notify participants about request')

        //check if user is already in queue
        for(let q in  socket.webrtcRoom.cameraRequestsQueue) {
            if(socket.webrtcRoom.cameraRequestsQueue[q].participant == socket.webrtcParticipant){
                if(_debug) console.log('canITurnCameraOn: addMeToCameraQueue: user already in queue')
                return;
            }
        }

        //take a camera slot in the user who uses camera the most of all (if such user exists)
        let userWhoUsesCameraMostOfAll = getUserWhoUsesCameraMostOfAll();
        if(_debug) console.log('canITurnCameraOn: addMeToCameraQueue: userWhoUsesCameraMostOfAll', userWhoUsesCameraMostOfAll != null)
        let waitingTime = 0;
        if(userWhoUsesCameraMostOfAll) {
            var videoTracks = userWhoUsesCameraMostOfAll.videoTracks();
            var mostNewVideoTrack = videoTracks.reduce(function(prev, current) {
                return (prev.createdTime > current.createdTime) ? prev : current;
            });

            let timeUserUsesCamera = Date.now() - mostNewVideoTrack.createdTime;
            //minimalTimeOfUsingSlot - time that is guaranteed to be provided to the user after he got camera slot
            //if this time is up, give this user some more time before camera slot will be taken from him (timeBeforeForceUserToDisconnect)
            waitingTime = timeUserUsesCamera >= socket.webrtcRoom.limits.minimalTimeOfUsingSlot ? socket.webrtcRoom.limits.timeBeforeForceUserToDisconnect : (socket.webrtcRoom.limits.minimalTimeOfUsingSlot - timeUserUsesCamera);


            if(mostNewVideoTrack.kind == 'videoavatar') {
                userWhoUsesCameraMostOfAll.micRequestCountdown.userWhoRequested = socket.webrtcParticipant;
                userWhoUsesCameraMostOfAll.micRequestCountdown.timer = setTimeout(function () {
                    if(_debug) console.log('canITurnCameraOn: force timer end 1')
                    socket.to(nspName + '#' + userWhoUsesCameraMostOfAll.id).emit('Streams/webrtc/forceTurnMicOff');
                }, waitingTime);

                socket.webrtcRoom.micRequestCountdown.push({
                    participant: socket.webrtcParticipant,
                    video: true,
                    timeAdded: Date.now(),
                    waitingTime: waitingTime,
                    userThatWillGiveSlot: userWhoUsesCameraMostOfAll
                });
            } else {
                userWhoUsesCameraMostOfAll.cameraRequestCountdown.userWhoRequested = socket.webrtcParticipant;
                userWhoUsesCameraMostOfAll.cameraRequestCountdown.timer = setTimeout(function () {
                    if(_debug) console.log('canITurnCameraOn: force timer end 1')
                    socket.to(nspName + '#' + userWhoUsesCameraMostOfAll.id).emit('Streams/webrtc/forceTurnCameraOff');
                }, waitingTime);

                socket.webrtcRoom.cameraRequestsQueue.push({
                    participant: socket.webrtcParticipant,
                    audio: audio === true ? true : false,
                    timeAdded: Date.now(),
                    waitingTime: waitingTime,
                    userThatWillGiveSlot: userWhoUsesCameraMostOfAll
                });
            }


        } else {
            //if there is no such user (user already has another user to whom slot will be provided),
            // just calculate waiting time and add the user who made request to the queue of camera slot requests

            //sum up all waiting time
            let queueUser = socket.webrtcRoom.cameraRequestsQueue[socket.webrtcRoom.cameraRequestsQueue.length - 1];
            let timePassed = Date.now() - queueUser.timeAdded;
            let tileLeftToWait = queueUser.waitingTime - timePassed;
            waitingTime = waitingTime + tileLeftToWait + socket.webrtcRoom.limits.minimalTimeOfUsingSlot;

            socket.webrtcRoom.cameraRequestsQueue.push({
                participant: socket.webrtcParticipant,
                audio: audio === true ? true : false,
                timeAdded: Date.now(),
                waitingTime: waitingTime
            });
        }

        let emitMsg = {
            fromSid:socket.webrtcParticipant.id,
            waitingTime:waitingTime,
            audio: audio === true ? true : false,
            forceDisconnectUser: userWhoUsesCameraMostOfAll ? userWhoUsesCameraMostOfAll.sid : null
        }
        socket.broadcast.to(socket.webrtcRoom.id).emit('Streams/webrtc/requestCamera', emitMsg);
        socket.emit('Streams/webrtc/requestCamera', emitMsg);
    }

    function isVideoSlotAvailable() {
        let videoTracksNum = 0;
        let participants = socket.webrtcRoom.getParticipants();
        for(let r in participants) {
            let participant = participants[r];

            //if(socket.client.id == participant.id) continue;

            if(_debug) console.log('isVideoSlotAvailable', participant.videoTracks().length, participant.tracks.length)
            videoTracksNum = videoTracksNum + participant.videoTracks().length;

        }
        if(_debug) console.log('isVideoSlotAvailable videoTracksNum', videoTracksNum)

        return videoTracksNum >= socket.webrtcRoom.limits.video ? false : true;
    }

    function getUsersCameraQueueItem(participant) {
        if(_debug) console.log('getUsersCameraQueueItem START', socket.webrtcParticipant.id, socket.webrtcParticipant.sid)
        if(_debug) console.log('getUsersCameraQueueItem', socket.webrtcRoom.cameraRequestsQueue)

        for (let i in socket.webrtcRoom.cameraRequestsQueue) {
            if(participant == socket.webrtcRoom.cameraRequestsQueue[i].participant) {
                return socket.webrtcRoom.cameraRequestsQueue[i];
            }
        }

        return null
    }

    socket.on('Streams/webrtc/canITurnMicOn', function() {
        if(!socket.webrtcRoom) return;
        if(_debug) console.log('canITurnMicOn START', socket.webrtcParticipant.id)

        //if user doesn't have camera enabled, avatar will be shown instead
        if(socket.webrtcParticipant.videoTracks().length == 0) {
            let audioSlotIsAvailable = isAudioSlotAvailable();
            let videoSlotIsAvailable = isVideoSlotAvailable();
            if(audioSlotIsAvailable && socket.webrtcRoom.micRequestsQueue.length == 0 && videoSlotIsAvailable && socket.webrtcRoom.cameraRequestsQueue.length == 0) {
                //one audio/mic slots takes 1 audio and 1 video slots
                //if there is free mic/audio AND video slot in the room (if the number of audios is less than limit), just give it to the user

                let newAudioTrack = new WebRTC.Track('audio');
                socket.webrtcParticipant.tracks.push(newAudioTrack);

                let newVideoTrack = new WebRTC.Track('videoavatar');
                socket.webrtcParticipant.tracks.push(newVideoTrack);

                if(_debug) console.log('canITurnMicOn if1')
                socket.emit('Streams/webrtc/canITurnMicOn', { type: 'answer', answerValue: true, limit: socket.webrtcRoom.limits.audio });
            } else if( (videoSlotIsAvailable && socket.webrtcRoom.cameraRequestsQueue.length == 0) && (!audioSlotIsAvailable || socket.webrtcRoom.micRequestsQueue.length != 0)) {
                if(_debug) console.log('canITurnMicOn: if2');
                addMeToMicQueue();

                let newVideoTrack = new WebRTC.Track('videoavatar');
                socket.webrtcParticipant.tracks.push(newVideoTrack);
            } else if((audioSlotIsAvailable && socket.webrtcRoom.micRequestsQueue.length == 0) && (!videoSlotIsAvailable || socket.webrtcRoom.cameraRequestsQueue.length != 0)) {
                if(_debug) console.log('canITurnMicOn: if3');
                addMeToCameraQueue(true);
                let newAudioTrack = new WebRTC.Track('audio');
                socket.webrtcParticipant.tracks.push(newAudioTrack);
            } else {
                if(_debug) console.log('canITurnMicOn: if4');
                addMeToCameraQueue(true);
                addMeToMicQueue();
            }
        } else {
            if(_debug) console.log('canITurnMicOn if2')
            let audioSlotIsAvailable = isAudioSlotAvailable();
            if(audioSlotIsAvailable && socket.webrtcRoom.micRequestsQueue.length == 0) {
                if(_debug) console.log('canITurnMicOn if2 if1')
                let newAudioTrack = new WebRTC.Track('audio');
                socket.webrtcParticipant.tracks.push(newAudioTrack);
                socket.emit('Streams/webrtc/canITurnMicOn', { type: 'answer', answerValue: true, limit: socket.webrtcRoom.limits.audio });
            } else {
                if(_debug) console.log('canITurnMicOn: if2 if2');
                addMeToMicQueue();
            }
        }


    });

    function addMeToMicQueue() {
        //if there is no free mic/audio slot in the room, add user to queue of audio slot requests
        if(_debug) console.log('canITurnMicOn: notify participants about request')

        //check if user is already in queue
        for(let q in  socket.webrtcRoom.micRequestsQueue) {
            if(socket.webrtcRoom.micRequestsQueue[q].participant == socket.webrtcParticipant){
                if(_debug) console.log('canITurnMicOn user already in queue')
                return;
            }
        }

        //take a mic slot from the user who uses mic the most of all (if such use exists)
        let userWhoUsesMicMostOfAll = getUserWhoUsesMicMostOfAll();
        if(_debug) console.log('canITurnMicOn userWhoUsesMicMostOfAll', userWhoUsesMicMostOfAll != null)
        let waitingTime = 0;
        if(userWhoUsesMicMostOfAll) {
            var audioTracks = userWhoUsesMicMostOfAll.audioTracks();
            var mostNewAudioTrack = audioTracks.reduce(function(prev, current) {
                return (prev.createdTime > current.createdTime) ? prev : current;
            });

            let timeUserUsesMic = Date.now() - mostNewAudioTrack.createdTime;
            //minimalTimeOfUsingSlot - time that is guaranteed to be provided to the user after he got mic slot
            //if this time is up, give this user some more time before mic slot will be taken from him (timeBeforeForceUserToDisconnect)
            waitingTime = timeUserUsesMic >= socket.webrtcRoom.limits.minimalTimeOfUsingSlot ? socket.webrtcRoom.limits.timeBeforeForceUserToDisconnect : (socket.webrtcRoom.limits.minimalTimeOfUsingSlot - timeUserUsesMic);

            //check whether there is parallel request for camera slot. if it exists, user should get mic and camera at the same time
            let cameraQueueItem = getUsersCameraQueueItem(socket.webrtcParticipant);

            if(cameraQueueItem) {
                let timePassed = Date.now() - cameraQueueItem.timeAdded;
                let timeLeftToWaitForCamera = cameraQueueItem.waitingTime - timePassed;
                //if parallel request for camera slot exists and its waiting time is less than waiting time of current mic request,
                // update waiting time for camera request, so it equals waiting time of mic request
                if(waitingTime > timeLeftToWaitForCamera) {
                    let userThatWillGiveCameraSlot = cameraQueueItem.userThatWillGiveSlot;
                    if(userThatWillGiveCameraSlot) {
                        //if if there is userThatWillGiveCameraSlot, give him more time
                        clearTimeout(userThatWillGiveCameraSlot.cameraRequestCountdown.timer);
                        userThatWillGiveCameraSlot.cameraRequestCountdown.timer = setTimeout(function () {
                            if(_debug) console.log('canITurnMicOn: cam: force timer end 4')
                            socket.to(nspName + '#' + userThatWillGiveCameraSlot.id).emit('Streams/webrtc/forceTurnCameraOff');
                        }, waitingTime);
                    }

                    let emitMsg = {
                        fromSid:socket.webrtcParticipant.id,
                        waitingTime:waitingTime,
                        forceDisconnectUser: userThatWillGiveCameraSlot ? userThatWillGiveCameraSlot.sid : null
                    }
                    socket.broadcast.to(socket.webrtcRoom.id).emit('Streams/webrtc/requestCamera', emitMsg);
                    socket.emit('Streams/webrtc/requestCamera', emitMsg);
                } else if (waitingTime < timeLeftToWaitForCamera) {
                    waitingTime = timeLeftToWaitForCamera
                }
            }

            userWhoUsesMicMostOfAll.micRequestCountdown.userWhoRequested = socket.webrtcParticipant;
            userWhoUsesMicMostOfAll.micRequestCountdown.timer = setTimeout(function () {
                if(_debug) console.log('canITurnMicOn: force timer end 1')
                socket.to(nspName + '#' + userWhoUsesMicMostOfAll.id).emit('Streams/webrtc/forceTurnMicOff');
            }, waitingTime);

            socket.webrtcRoom.micRequestsQueue.push({
                participant: socket.webrtcParticipant,
                timeAdded: Date.now(),
                waitingTime: waitingTime,
                userThatWillGiveSlot: userWhoUsesMicMostOfAll
            });

        } else {
            //if there is no such user (user already has another user to whom slot will be provided),
            // just calculate waiting time and add the user who made request to the queue of mic slot requests

            //sum up all waiting time
            let queueUser = socket.webrtcRoom.micRequestsQueue[socket.webrtcRoom.micRequestsQueue.length - 1];
            let timePassed = Date.now() - queueUser.timeAdded;
            let tileLeftToWait = queueUser.waitingTime - timePassed;
            waitingTime = waitingTime + tileLeftToWait + socket.webrtcRoom.limits.minimalTimeOfUsingSlot;

            socket.webrtcRoom.micRequestsQueue.push({
                participant: socket.webrtcParticipant,
                timeAdded: Date.now(),
                waitingTime: waitingTime
            });
        }


        let emitMsg = {
            fromSid:socket.webrtcParticipant.id,
            waitingTime:waitingTime,
            forceDisconnectUser: userWhoUsesMicMostOfAll ? userWhoUsesMicMostOfAll.sid : null
        }
        socket.broadcast.to(socket.webrtcRoom.id).emit('Streams/webrtc/requestMic', emitMsg);
        socket.emit('Streams/webrtc/requestMic', emitMsg);
    }

    function isAudioSlotAvailable() {
        let audioTracksNum = 0;
        let participants = socket.webrtcRoom.getParticipants();
        for(let r in participants) {
            let participant = participants[r];

            if(socket.client.id == participant.id) {
                continue;
            }

            audioTracksNum = audioTracksNum + participant.audioTracks().length;

        }
        if(_debug) console.log('isAudioSlotAvailable audioTracksNum', audioTracksNum)

        return audioTracksNum >= socket.webrtcRoom.limits.audio ? false : true;
    }

    function getUsersMicQueueItem(participant) {
        for (let i in socket.webrtcRoom.micRequestsQueue) {
            if(participant == socket.webrtcRoom.micRequestsQueue[i].participant) {
                return socket.webrtcRoom.micRequestsQueue[i];
            }
        }

        return null
    }

    function getUserWhoUsesCameraMostOfAll() {
        var participants = socket.webrtcRoom.getParticipants();
        var tracks = [];
        for (let p in participants) {
            if(participants[p].videoTracks().length == 0 || participants[p].cameraRequestCountdown.timer != null) continue;

            //ignore users who are having camera (avatar) slot but waiting for mic slot
            for(let q in socket.webrtcRoom.micRequestsQueue) {
                if(socket.webrtcRoom.micRequestsQueue[q].participant == participants[p]) {
                    continue;
                }
            }

            let vTracks = participants[p].videoTracks();
            for(let t in vTracks) {
                tracks.push({ participant: participants[p], track: vTracks[t] });
            }
        }

        var userWhoUsesCameraMostOfAll;
        if(tracks.length != 0) {
            userWhoUsesCameraMostOfAll = tracks.reduce(function(prev, current) {
                return (prev.track.createdTime < current.track.createdTime) ? prev : current;
            }).participant;
        }

        return userWhoUsesCameraMostOfAll;
    }

    function getNextUserFromCameraRequestsQueue() {
        for(let q in socket.webrtcRoom.cameraRequestsQueue) {
            if(socket.webrtcRoom.cameraRequestsQueue[q].userThatWillGiveSlot == null && !socket.webrtcRoom.cameraRequestsQueue[q].delayed) {
                return socket.webrtcRoom.cameraRequestsQueue[q];
            }
        }

        return null;
    }

    function getNextUserFromMicRequestsQueue() {
        for(let q in socket.webrtcRoom.micRequestsQueue) {
            if(socket.webrtcRoom.micRequestsQueue[q].userThatWillGiveSlot == null && !socket.webrtcRoom.micRequestsQueue[q].delayed) {
                return socket.webrtcRoom.micRequestsQueue[q];
            }
        }

        return null;
    }

    function getUserWhoUsesMicMostOfAll() {
        var participants = socket.webrtcRoom.getParticipants();
        var tracks = [];
        for (let p in participants) {
            if(participants[p].audioTracks().length == 0 || participants[p].micRequestCountdown.timer != null) continue;

            //ignore users who are waiting for camera slot while already having audio slot
            for(let q in socket.webrtcRoom.cameraRequestsQueue) {
                if(socket.webrtcRoom.cameraRequestsQueue[q].participant == participants[p]) {
                    continue;
                }
            }

            let aTracks = participants[p].audioTracks();
            for(let t in aTracks) {
                tracks.push({ participant: participants[p], track: aTracks[t] });
            }
        }

        var userWhoUsesMicMostOfAll;
        if(tracks.length != 0) {
            userWhoUsesMicMostOfAll = tracks.reduce(function(prev, current) {
                return (prev.track.createdTime < current.track.createdTime) ? prev : current;
            }).participant;
        }

        return userWhoUsesMicMostOfAll;
    }

    //if someone disabled camera
    socket.on('Streams/webrtc/cameraDisabled', function() {
        if(!socket.webrtcRoom) return;
        if(_debug) console.log('cameraDisabled START', socket.webrtcParticipant.id)

        //inform all users that user turned his camera off
        socket.to(socket.webrtcRoom.id).emit('Streams/webrtc/cameraDisabled', {
            fromSid:socket.webrtcParticipant.id,
        });
        socket.emit('Streams/webrtc/cameraDisabled', {
            fromSid:socket.webrtcParticipant.id,
        });

        //if user turned camera off but still has mic on, change kind of current video track to videoavatar
        //so user will be visible as avatar+mic
        if(socket.webrtcParticipant.audioTracks().length != 0) {
            let vTracks = socket.webrtcParticipant.videoTracks();
            for(let t in vTracks) {
                if(vTracks[t].kind == 'video') {
                    vTracks[t].kind = 'videoavatar';
                    break;
                }
            }

            return;
        } else {
            //if user had only camera enabled, no need to show avatar as user has no mic
            //so just remove all video tracks for user who turned camera off and give this slot to next user
            for(let d = socket.webrtcParticipant.tracks.length - 1; d >= 0 ; d--){
                if(socket.webrtcParticipant.tracks[d].kind != 'video') continue;
                socket.webrtcParticipant.tracks.splice(d, 1);
            }
        }

        giveVideoSlotToNextUser();

    });

    function giveVideoSlotToNextUser() {
        //if the user who disabled camera is the one who used camera most of all (this user should be forced to disable camera),
        //give his camera slot to the next user in the queue who requested camera
        if(socket.webrtcParticipant.cameraRequestCountdown.userWhoRequested) {
            if(_debug) console.log('cameraDisabled if1', socket.webrtcParticipant.id)

            let giveCameraTo = socket.webrtcParticipant.cameraRequestCountdown.userWhoRequested;

            let queueItem;
            for(let i = socket.webrtcRoom.cameraRequestsQueue.length - 1; i >= 0 ; i--){
                if(giveCameraTo == socket.webrtcRoom.cameraRequestsQueue[i].participant) {
                    queueItem = socket.webrtcRoom.cameraRequestsQueue[i];
                    break;
                }
            }


            let romoveRequestFromQueue = function () {
                let timeDiff = 0;
                for(let i = socket.webrtcRoom.cameraRequestsQueue.length - 1; i >= 0 ; i--){
                    if(giveCameraTo == socket.webrtcRoom.cameraRequestsQueue[i].participant) {
                        let queueItem = socket.webrtcRoom.cameraRequestsQueue.splice(i, 1)[0];

                        //determine if user will get mic slot earlier than was supposed to get
                        //and if user who turned mic off did it earlier than was supposed to do
                        let tingTime = queueItem.waitingTime;
                        let timeAdded = queueItem.timeAdded;
                        let timePassed = (Date.now() - timeAdded);
                        if(_debug) console.log('cameraDisabled if1 timePassed/waitingTime', timePassed, waitingTime)

                        //determine how much earlier user will get his camera slot
                        if(timePassed < waitingTime) {
                            timeDiff = waitingTime - timePassed;
                        }
                        break;
                    }
                }
                return timeDiff;
            }

            let allowUserToTurnCameraOn = function() {

                //remove user who will be given camera slot from queue
                let timeDiff = romoveRequestFromQueue();

                if(_debug) console.log('cameraDisabled if1 giveCameraTo', giveCameraTo.id)
                if(_debug) console.log('cameraDisabled if1 timeDiff', timeDiff)

                //if there is next user in queue, limit provided time for user who was just provided with camera slot and, when the time will end, give his camera slot to the next user
                let nextUserInQueue = getNextUserFromCameraRequestsQueue();

                //if there is one more (next) user in queue, set limit provided time for current user who got slot via sending timeProvided option, it will show countdown timer on client side
                socket.to(nspName + '#' + giveCameraTo.id).emit('Streams/webrtc/canITurnCameraOn', { type: 'answer', answerValue: true, timeProvided: nextUserInQueue ? socket.webrtcRoom.limits.minimalTimeOfUsingSlot : null, limit: socket.webrtcRoom.limits.video });

                if(nextUserInQueue) {
                    if(_debug) console.log('cameraDisabled if1 nextUserInQueue', nextUserInQueue.participant.id)

                    giveCameraTo.cameraRequestCountdown.userWhoRequested = nextUserInQueue.participant;
                    giveCameraTo.cameraRequestCountdown.timer = setTimeout(function () {
                        if(_debug) console.log('canITurnCameraOn: force timer end 0')
                        socket.to(nspName + '#' + giveCameraTo.id).emit('Streams/webrtc/forceTurnCameraOff');
                    }, socket.webrtcRoom.limits.minimalTimeOfUsingSlot);

                    nextUserInQueue.userThatWillGiveSlot = giveCameraTo;
                }

                //recalculate all timers for other users (for example, when user disabled his camera before he was forced to do it)
                recalculateAllCameraTimers(timeDiff);
            }

            let allowToTurnMicOn = function() {
                //remove user who will be given video slot from queue
                let timeDiff = romoveRequestFromQueue();

                if(_debug) console.log('cameraDisabled: allowToTurnMicOn if1 giveCameraTo', giveCameraTo.id)
                if(_debug) console.log('cameraDisabled: allowToTurnMicOn if1 timeDiff', timeDiff)

                //if there is next user in queue, limit provided time for user who was just provided with camera slot and, when the time will end, give his camera slot to the next user
                let nextAudioRequestInQueue = getNextUserFromMicRequestsQueue();

                //if there is one more (next) user in queue, set limit provided time for current user who got slot via sending timeProvided option, it will show countdown timer on client side
                socket.to(nspName + '#' + giveCameraTo.id).emit('Streams/webrtc/canITurnMicOn', { type: 'answer', answerValue: true, timeProvided: nextAudioRequestInQueue ? socket.webrtcRoom.limits.minimalTimeOfUsingSlot : null, limit: socket.webrtcRoom.limits.audio });

                if(nextAudioRequestInQueue) {
                    if(_debug) console.log('cameraDisabled: allowToTurnMicOn if1 nextUserInQueue', nextAudioRequestInQueue.participant.id)

                    giveCameraTo.micRequestCountdown.userWhoRequested = nextAudioRequestInQueue.participant;
                    giveCameraTo.micRequestCountdown.timer = setTimeout(function () {
                        if(_debug) console.log('canITurnCameraOn: allowToTurnMicOn force timer end 0')
                        socket.to(nspName + '#' + giveCameraTo.id).emit('Streams/webrtc/forceTurnMicOff');
                    }, socket.webrtcRoom.limits.minimalTimeOfUsingSlot);

                    nextAudioRequestInQueue.userThatWillGiveSlot = giveCameraTo;
                }

                let nextVideoRequestInQueue = getNextUserFromCameraRequestsQueue();

                if(nextVideoRequestInQueue) {
                    if(_debug) console.log('cameraDisabled if1 nextVideoRequestInQueue', nextVideoRequestInQueue.participant.id)

                    giveCameraTo.cameraRequestCountdown.userWhoRequested = nextVideoRequestInQueue.participant;
                    giveCameraTo.cameraRequestCountdown.timer = setTimeout(function () {
                        if(_debug) console.log('canITurnCameraOn: force timer end 0')
                        socket.to(nspName + '#' + giveCameraTo.id).emit('Streams/webrtc/forceTurnCameraOff');
                    }, socket.webrtcRoom.limits.minimalTimeOfUsingSlot);

                    nextVideoRequestInQueue.userThatWillGiveSlot = giveCameraTo;
                }

                //recalculate all timers for other users (for example, when user disabled his camera before he was forced to do it)
                recalculateAllCameraTimers(timeDiff);
            }


            if(queueItem.audio === true) {
                if(socket.webrtcParticipant.audioTracks().length != 0) {
                    let newTrack = new WebRTC.Track('videoavatar');
                    giveCameraTo.tracks.push(newTrack);
                    allowToTurnMicOn();
                } else {
                    let newTrack = new WebRTC.Track('videoavatar');
                    giveCameraTo.tracks.push(newTrack);
                }

            } else {
                let newTrack = new WebRTC.Track('video');
                giveCameraTo.tracks.push(newTrack);


                allowUserToTurnCameraOn();
            }


            socket.emit('Streams/webrtc/cancelForceTurnCameraOffTimer');

            clearTimeout(socket.webrtcParticipant.cameraRequestCountdown.timer);
            socket.webrtcParticipant.cameraRequestCountdown.timer = null;
            socket.webrtcParticipant.cameraRequestCountdown.userWhoRequested = null;

        } else {
            if(_debug) console.log('cameraDisabled if2')
            //if someone disabled before the time when the former user should be forced to turn his camera off, give his camera slot
            //to the next user in queue of camera requests
            let firstUserInQueue ;
            for(let i = socket.webrtcRoom.cameraRequestsQueue.length - 1; i >= 0 ; i--){
                if(!socket.webrtcRoom.cameraRequestsQueue[i].delayed) {
                    firstUserInQueue = socket.webrtcRoom.cameraRequestsQueue.splice[i];
                    break;
                }
            }

            if(!firstUserInQueue) return;

            //add track to the rom to occupy video slot
            let newTrack = new WebRTC.Track('video');
            firstUserInQueue.participant.tracks.push(newTrack);

            let allowUserToTurnCameraOn = function() {
                let timeDiff;
                for(let i = socket.webrtcRoom.cameraRequestsQueue.length - 1; i >= 0 ; i--){
                    if(firstUserInQueue == socket.webrtcRoom.cameraRequestsQueue[i]) {
                        socket.webrtcRoom.cameraRequestsQueue.splice(i, 1)[0];

                        //determine if user will get mic slot earlier than was supposed to get
                        let waitingTime = firstUserInQueue.waitingTime;
                        let timeAdded = firstUserInQueue.timeAdded;
                        let timePassed = (Date.now() - timeAdded);
                        if(_debug) console.log('micDisabled if2 timePassed/waitingTime', timePassed, waitingTime)

                        //determine how much earlier user wil get mic slot
                        if(timePassed < waitingTime) {
                            timeDiff = waitingTime - timePassed;
                        }
                        break;
                    }
                }

                if(_debug) console.log('cameraDisabled if2.0')

                //allow first user in queue to turn camera on
                socket.to(nspName + '#' + firstUserInQueue.participant.id).emit('Streams/webrtc/canITurnCameraOn', { answerValue: true, limit: socket.webrtcRoom.limits.video });

                var nextUserInQueue = getNextUserFromCameraRequestsQueue();
                //if there is one more next user in queue, limit provided time for user who was just provided with camera slot and, when the time will end, give his camera slot to the next user
                if(nextUserInQueue) {
                    firstUserInQueue.participant.cameraRequestCountdown.userWhoRequested = nextUserInQueue.participant;
                    firstUserInQueue.participant.cameraRequestCountdown.timer = setTimeout(function () {
                        if(_debug) console.log('canITurnCameraOn: force timer end 2')
                        socket.to(nspName + '#' + firstUserInQueue.participant.id).emit('Streams/webrtc/forceTurnCameraOff');
                    }, socket.webrtcRoom.limits.minimalTimeOfUsingSlot);

                    nextUserInQueue.userThatWillGiveSlot = firstUserInQueue.participant;
                }

                //recalculate all timers for other users (for example, when user disabled his camera before he was forced to do it)
                recalculateAllCameraTimers(timeDiff);
            }


            allowUserToTurnCameraOn();


            //if the firstUserInQueue has the user who was supposed to give his camera slot to him (userThatWillGiveSlot), change user for userThatWillGiveSlot or cancel all timers if no next user
            if(firstUserInQueue.userThatWillGiveSlot) {
                if(_debug) console.log('cameraDisabled if2.1')
                let nextUserInQueue = getNextUserFromCameraRequestsQueue();

                if(nextUserInQueue) {
                    if(_debug) console.log('cameraDisabled if2.1.1')
                    //if there are still users in queue of camera requests, take next user in queue and assign him to the timer of user who uses camera the most of all
                    firstUserInQueue.userThatWillGiveSlot.cameraRequestCountdown.userWhoRequested = nextUserInQueue.participant;
                    nextUserInQueue.userThatWillGiveSlot = firstUserInQueue.userThatWillGiveSlot;
                } else {
                    if(_debug) console.log('cameraDisabled if2.1.2')

                    clearTimeout(firstUserInQueue.userThatWillGiveSlot.cameraRequestCountdown.timer);
                    firstUserInQueue.userThatWillGiveSlot.cameraRequestCountdown.timer = null;
                    firstUserInQueue.userThatWillGiveSlot.cameraRequestCountdown.userWhoRequested = null;

                    socket.to(nspName + '#' + firstUserInQueue.userThatWillGiveSlot.id).emit('Streams/webrtc/cancelForceTurnCameraOffTimer');

                }
            }
        }
    }

    function recalculateAllCameraTimers(timeDiff) {
        for(let q in socket.webrtcRoom.cameraRequestsQueue) {
            let queueItem = socket.webrtcRoom.cameraRequestsQueue[q];
            let timeAdded = queueItem.timeAdded;
            let waitingTime = queueItem.waitingTime;
            let timePassed = Date.now() - timeAdded;

            let newWaitingTime = (waitingTime - timePassed) - timeDiff;
            let emitMsg = {
                fromSid:queueItem.participant.id,
                waitingTime:newWaitingTime
            }
            socket.broadcast.to(socket.webrtcRoom.id).emit('Streams/webrtc/requestCamera', emitMsg);
            socket.emit('Streams/webrtc/requestCamera', emitMsg);
        }
    }

    //if someone disabled mic
    socket.on('Streams/webrtc/micDisabled', function() {
        if(!socket.webrtcRoom) return;
        if(_debug) console.log('micDisabled START', socket.webrtcParticipant.id)

        //inform all users that user turned his mic off
        socket.to(socket.webrtcRoom.id).emit('Streams/webrtc/micDisabled', {
            fromSid:socket.webrtcParticipant.id,
        });
        socket.emit('Streams/webrtc/micDisabled', {
            fromSid:socket.webrtcParticipant.id,
        });

        if(socket.webrtcParticipant.avatarTracks().length != 0) {
            if(_debug) console.log('micDisabled: remove avatar tracks')

            //remove all avatar tracks for user who turned mic off
            for(let d = socket.webrtcParticipant.tracks.length - 1; d >= 0 ; d--){
                if(socket.webrtcParticipant.tracks[d].kind != 'videoavatar') continue;
                socket.webrtcParticipant.tracks.splice(d, 1);
            }

            giveVideoSlotToNextUser();
        }

        //remove all audio tracks for user who turned mic off
        for(let d = socket.webrtcParticipant.tracks.length - 1; d >= 0 ; d--){
            if(socket.webrtcParticipant.tracks[d].kind != 'audio') continue;
            socket.webrtcParticipant.tracks.splice(d, 1);
        }

        giveAudioSlotToNextUser();

    });


    function giveAudioSlotToNextUser() {
        //if the user who disabled mic was the one who used mic most of all (this user should be forced to disable mic),
        //give his mic slot to the user who requested at that time
        if(socket.webrtcParticipant.micRequestCountdown.userWhoRequested) {
            if(_debug) console.log('micDisabled if1', socket.webrtcParticipant.id)

            let giveMicTo = socket.webrtcParticipant.micRequestCountdown.userWhoRequested;

            let queueItem;
            for(let i = socket.webrtcRoom.micRequestsQueue.length - 1; i >= 0 ; i--){
                if(giveMicTo == socket.webrtcRoom.micRequestsQueue[i].participant) {
                    queueItem = socket.webrtcRoom.micRequestsQueue[i];
                    break;
                }
            }

            let allowUserToTurnMicOn = function () {
                //remove user who will be given mic slot from queue
                let timeDiff = 0;
                for(let i = socket.webrtcRoom.micRequestsQueue.length - 1; i >= 0 ; i--){
                    if(giveMicTo == socket.webrtcRoom.micRequestsQueue[i].participant) {
                        let queueItem = socket.webrtcRoom.micRequestsQueue.splice(i, 1)[0];

                        //determine if user will get mic slot earlier than was supposed to get
                        //and if user who turned mic off did it earlier than was supposed to do
                        let waitingTime = queueItem.waitingTime;
                        let timeAdded = queueItem.timeAdded;
                        let timePassed = (Date.now() - timeAdded);
                        if(_debug) console.log('micDisabled if1 timePassed/waitingTime', timePassed, waitingTime)

                        if(timePassed < waitingTime) {
                            timeDiff = waitingTime - timePassed;
                        }
                        break;
                    }
                }
                if(_debug) console.log('micDisabled if1 giveCameraTo', giveMicTo.id)
                if(_debug) console.log('micDisabled if1 timeDiff', timeDiff)

                //if there is next user in queue, limit provided time for user who was just provided with mic slot and, when the time will end, give his mic slot to the next user
                let nextUserInQueue = getNextUserFromMicRequestsQueue();

                //allow user to turn mic on
                socket.to(nspName + '#' + giveMicTo.id).emit('Streams/webrtc/canITurnMicOn', { type: 'answer', answerValue: true, timeProvided: nextUserInQueue ? socket.webrtcRoom.limits.minimalTimeOfUsingSlot : null, limit: socket.webrtcRoom.limits.audio });

                if(_debug) console.log('micDisabled if1 nextUserInQueue!=null', nextUserInQueue!=null)
                if(nextUserInQueue) {
                    giveMicTo.micRequestCountdown.userWhoRequested = nextUserInQueue.participant;
                    giveMicTo.micRequestCountdown.timer = setTimeout(function () {
                        if(_debug) console.log('canITurnMicOn: force timer end 33')
                        socket.to(nspName + '#' + giveMicTo.id).emit('Streams/webrtc/forceTurnMicOff');
                    }, socket.webrtcRoom.limits.minimalTimeOfUsingSlot);

                    nextUserInQueue.userThatWillGiveSlot = giveMicTo;
                }

                //recalculate all timers for other users (for example, when user disabled his mic before he was forced to do it)
                recalculateAllMicTimers(timeDiff);
            }

            if(giveMicTo.videoTracks().length != 0){
                let newTrack = new WebRTC.Track('audio');
                giveMicTo.tracks.push(newTrack);
                allowUserToTurnMicOn();
            } else {
                let newTrack = new WebRTC.Track('audio');
                giveMicTo.tracks.push(newTrack);
            }

            socket.emit('Streams/webrtc/cancelForceTurnMicOffTimer');

            clearTimeout(socket.webrtcParticipant.micRequestCountdown.timer);
            socket.webrtcParticipant.micRequestCountdown.timer = null;
            socket.webrtcParticipant.micRequestCountdown.userWhoRequested = null;

        } else {
            if(_debug) console.log('micDisabled if2')
            //if someone disabled before the time when the former user should be forced to turn his mic off, give his mic slot
            //to the next user in queue of mic requests
            let firstUserInQueue;
            for(let i = socket.webrtcRoom.micRequestsQueue.length - 1; i >= 0 ; i--){
                if(!socket.webrtcRoom.micRequestsQueue[i].delayed) {
                    firstUserInQueue = socket.webrtcRoom.micRequestsQueue[i];
                    break;
                }
            }

            if(!firstUserInQueue) return;

            //add track to the rom to occupy audio slot
            let newTrack = new WebRTC.Track('audio');
            firstUserInQueue.participant.tracks.push(newTrack);

            var allowUserToTurnMicOn = function () {
                let timeDiff;
                for(let i = socket.webrtcRoom.micRequestsQueue.length - 1; i >= 0 ; i--){
                    if(firstUserInQueue == socket.webrtcRoom.micRequestsQueue[i]) {
                        socket.webrtcRoom.micRequestsQueue.splice(i, 1)[0];

                        //determine if user will get mic slot earlier than was supposed to get
                        let waitingTime = firstUserInQueue.waitingTime;
                        let timeAdded = firstUserInQueue.timeAdded;
                        let timePassed = (Date.now() - timeAdded);
                        if(_debug) console.log('micDisabled if2 timePassed/waitingTime', timePassed, waitingTime)

                        //determine how much earlier user wil get mic slot
                        if(timePassed < waitingTime) {
                            timeDiff = waitingTime - timePassed;
                        }
                        break;
                    }
                }

                if(_debug) console.log('micDisabled if2.0')

                //allow first user in queue to turn mic on
                socket.to(nspName + '#' + firstUserInQueue.participant.id).emit('Streams/webrtc/canITurnMicOn', { answerValue: true, limit: socket.webrtcRoom.limits.audio });
                //if there is one more next user in queue, limit provided time for user who was just provided with mic slot and, when the time will end, give his mic slot to the next user
                var nextUserInQueue = getNextUserFromMicRequestsQueue();

                if(nextUserInQueue) {
                    firstUserInQueue.participant.micRequestCountdown.userWhoRequested = nextUserInQueue.participant;
                    firstUserInQueue.participant.micRequestCountdown.timer = setTimeout(function () {
                        if(_debug) console.log('canITurnMicOn: force timer end 22')
                        socket.to(nspName + '#' + firstUserInQueue.participant.id).emit('Streams/webrtc/forceTurnMicOff');
                    }, socket.webrtcRoom.limits.minimalTimeOfUsingSlot);

                    nextUserInQueue.userThatWillGiveSlot = firstUserInQueue.participant;
                }

                //recalculate all timers for other users (for example, when user disabled his mic before he was forced to do it)
                recalculateAllMicTimers(timeDiff);
            }

            allowUserToTurnMicOn();

            //if the firstUserInQueue has the user who was supposed to give his mic slot to him (userThatWillGiveSlot), change user for userThatWillGiveSlot or cancel all timers if no next user
            if(firstUserInQueue.userThatWillGiveSlot) {
                if(_debug) console.log('micDisabled if2.1')
                let nextUserInQueue = getNextUserFromMicRequestsQueue();

                if(nextUserInQueue) {
                    if(_debug) console.log('micDisabled if2.1.1')
                    //if there are still users in queue of mic requests, take next user in queue and assign him to the timer of user who uses mic the most of all
                    firstUserInQueue.userThatWillGiveSlot.micRequestCountdown.userWhoRequested = nextUserInQueue.participant;
                    nextUserInQueue.userThatWillGiveSlot = firstUserInQueue.userThatWillGiveSlot;
                } else {
                    if(_debug) console.log('micDisabled if2.1.2')

                    clearTimeout(firstUserInQueue.userThatWillGiveSlot.micRequestCountdown.timer);
                    firstUserInQueue.userThatWillGiveSlot.micRequestCountdown.timer = null;
                    firstUserInQueue.userThatWillGiveSlot.micRequestCountdown.userWhoRequested = null;

                    socket.to(nspName + '#' + firstUserInQueue.userThatWillGiveSlot.id).emit('Streams/webrtc/cancelForceTurnMicOffTimer');

                }
            }
        }
    }

    function recalculateAllMicTimers(timeDiff) {
        for(let q in socket.webrtcRoom.micRequestsQueue) {
            let queueItem = socket.webrtcRoom.micRequestsQueue[q];
            let timeAdded = queueItem.timeAdded;
            let waitingTime = queueItem.waitingTime;
            let timePassed = Date.now() - timeAdded;

            let newWaitingTime = (waitingTime - timePassed) - timeDiff;
            let emitMsg = {
                fromSid:queueItem.participant.id,
                waitingTime:newWaitingTime
            }
            socket.to(socket.webrtcRoom.id).emit('Streams/webrtc/requestMic', emitMsg);
        }
    }

    //if someone enabled camera
    socket.on('Streams/webrtc/cameraEnabled', function() {
        if(!socket.webrtcRoom) return;
        if(_debug) console.log('cameraEnabled')

        socket.to(socket.webrtcRoom.id).emit('Streams/webrtc/cameraEnabled', {
            fromSid:socket.webrtcParticipant.id,
        });
        socket.emit('Streams/webrtc/cameraEnabled', {
            fromSid:socket.webrtcParticipant.id,
        });

    });

    //if someone enabled mic
    socket.on('Streams/webrtc/micEnabled', function() {
        if(!socket.webrtcRoom) return;
        if(_debug) console.log('micEnabled')

        socket.to(socket.webrtcRoom.id).emit('Streams/webrtc/micEnabled', {
            fromSid:socket.webrtcParticipant.id,
        });
        socket.emit('Streams/webrtc/micEnabled', {
            fromSid:socket.webrtcParticipant.id,
        });
    });

    socket.on('Streams/webrtc/cameraRequestCanceled', function() {
        if(!socket.webrtcRoom) return;
        if(_debug) console.log('cameraRequestCanceled')

        //remove user from queue of camera slot requests
        for(let i = socket.webrtcRoom.cameraRequestsQueue.length - 1; i >= 0 ; i--){
            if(socket.webrtcParticipant == socket.webrtcRoom.cameraRequestsQueue[i].participant) {
                socket.webrtcRoom.cameraRequestsQueue.splice(i, 1);
            }
        }


        var participants = socket.webrtcRoom.getParticipants();
        for (let p in participants) {
            if(participants[p].cameraRequestCountdown.userWhoRequested != socket.webrtcParticipant) continue;
            if(_debug) console.log('cameraDisabled if2.1')

            let nextUserInQueue = socket.webrtcRoom.cameraRequestsQueue.length != 0 ?  socket.webrtcRoom.cameraRequestsQueue[0] : null;
            if(nextUserInQueue) {
                if(_debug) console.log('cameraDisabled if2.1.1')
                participants[p].cameraRequestCountdown.userWhoRequested = nextUserInQueue.participant;
            } else {
                if(_debug) console.log('cameraDisabled if2.1.2')

                clearTimeout(participants[p].cameraRequestCountdown.timer);
                participants[p].cameraRequestCountdown.timer = null;
                participants[p].cameraRequestCountdown.userWhoRequested = null;

                socket.to(nspName + '#' + participants[p].id).emit('Streams/webrtc/cancelForceTurnCameraOffTimer');

            }

            break;

        }

        socket.broadcast.to(socket.webrtcRoom.id).emit('Streams/webrtc/cameraRequestCanceled', {
            fromSid:socket.webrtcParticipant.id,
        });
        socket.emit('Streams/webrtc/cameraRequestCanceled', {
            fromSid:socket.webrtcParticipant.id,
        });
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
        for(let i = socket.webrtcRoom.cameraRequestsQueue.length - 1; i >= 0 ; i--){
            if(socket.webrtcParticipant == socket.webrtcRoom.cameraRequestsQueue[i].participant) {
                socket.webrtcRoom.cameraRequestsQueue.splice(i, 1);
            }
        }
        for(let i = socket.webrtcRoom.micRequestsQueue.length - 1; i >= 0 ; i--){
            if(socket.webrtcParticipant == socket.webrtcRoom.micRequestsQueue[i].participant) {
                socket.webrtcRoom.micRequestsQueue.splice(i, 1);
            }
        }
        io.of('/webrtc').in(socket.webrtcRoom.id).clients(function (error, clients) {
            console.log('disconnect: before close room')
            if(clients.length == 0) socket.webrtcRoom.close();
        });
    });
}