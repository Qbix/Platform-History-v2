const Q = require('Q');
const performance = require('perf_hooks').performance;

module.exports = function (socket, io) {
    var _debug = Q.Config.get(['Streams', 'webrtc', 'debug'], {});
    var _debug = _debug.limits;
    var _globalWebRTCOptions = Q.Config.get(['Streams', 'webrtc'], {});
    var nspName = '/webrtc';
    var webrtcNamespace = io.of(nspName);
    var WebRTC = Q.plugins.Streams.WebRTC;
    var roomPublisherId;
    var limitMicrophone = null;

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
                if (this.participants[p] == participant) {
                    participantExists = true;
                    break;
                }
            }
            if (participantExists) return;

            this.participants.push(participant);
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
            log('roomManager: close room');
            var room = this;
            this.isActive = false;
            this.removeTimer = setTimeout(function () {
                room.remove();
            }, 1000 * 30)
        }
        this.remove = function () {
            log('roomManager: remove room');

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
            log('roomManager: make room active');
            if (value === true) {
                if (this.removeTimer != null) {
                    log('make room active: delete remove timer');

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
        this.liveStreaming = { connectionManager: null, room: null, canvasComposer: null };
        this.cameraRequestCountdown = { timer: null, userWhoRequested: null };
        this.micRequestCountdown = { timer: null, userWhoRequested: null };
        this.recording = { path: null, startTime: null, stopTime: null, parallelRecordings: [], parallelRecordingsFile: null };
        this.videoTracks = function (excludeAvatars) {
            if (excludeAvatars) {
                return this.tracks.filter(function (trackObj) {
                    return trackObj.kind == 'video';
                });
            }
            return this.tracks.filter(function (trackObj) {
                return trackObj.kind == 'video' || trackObj.kind == 'videoavatar';
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
        this.pendingVideoSlotRequest = function () {
            let thisParticipant = this;
            for (let q in socket.webrtcRoom.cameraRequestsQueue) {
                if (socket.webrtcRoom.cameraRequestsQueue[q].participant == thisParticipant) {
                    return socket.webrtcRoom.cameraRequestsQueue[q];
                }
            }
        };
        this.pendingAudioSlotRequest = function () {
            let thisParticipant = this;
            for (let q in socket.webrtcRoom.micRequestsQueue) {
                if (socket.webrtcRoom.micRequestsQueue[q].participant == thisParticipant) {
                    return socket.webrtcRoom.micRequestsQueue[q];
                }
            }
        };
        this.removeFromRoom = function () {
            if (this.room == null) return;
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
        log('roomManager: joined', socket.adapter.rooms);

        for (var key in socket.adapter.rooms) {
            if (socket.adapter.rooms.hasOwnProperty(key)) {
                if (key == identity.room) {
                    roomExists = true;
                    break;
                }
            }
        }

        if (!roomExists) {
            log('roomManager: Room not exists', WebRTC.rooms.length);

            for (let r in WebRTC.rooms) {
                if (identity.room == WebRTC.rooms[r].id) {
                    socket.webrtcRoom = WebRTC.rooms[r];
                    break;
                }
            }

        } else {
            log('roomManager: Room exists', WebRTC.rooms.length);

            for (let r in WebRTC.rooms) {
                if (identity.room == WebRTC.rooms[r].id) {
                    socket.webrtcRoom = WebRTC.rooms[r];
                    break;
                }
            }
        }

        if (!socket.webrtcRoom) {
            log('roomManager: Room not exists 2: create', identity.room);

            var currentRoom = new WebRTC.Room(identity.room);
            currentRoom.roomPublisherId = identity.roomPublisher;
            socket.webrtcRoom = currentRoom;
            WebRTC.rooms.push(currentRoom);

            let userPlatformId = identity.username.split('\t')[0];
            Q.plugins.Streams.fetchOne(userPlatformId, currentRoom.roomPublisherId, 'Streams/webrtc/' + identity.room, function (err, stream) {
                if (err || !stream) {
                    return;
                }
                currentRoom.roomStream = stream;
                log('roomManager: global options', _globalWebRTCOptions);

                if (_globalWebRTCOptions['limits'] != null) {
                    log('roomManager: globalsLimits', _globalWebRTCOptions['limits']);
                    currentRoom.limits = _globalWebRTCOptions['limits'];
                }

                let limitsConfig = stream.getAttribute('limits', null)
                if (limitsConfig != null) {
                    if (limitsConfig['video'] != null) {
                        currentRoom.limits.video = limitsConfig['video'];
                    }
                    if (limitsConfig['audio'] != null) {
                        currentRoom.limits.audio = limitsConfig['audio'];
                    }
                    if (limitsConfig['minimalTimeOfUsingSlot'] != null) {
                        currentRoom.limits.minimalTimeOfUsingSlot = limitsConfig['minimalTimeOfUsingSlot'];
                    }
                    if (limitsConfig['timeBeforeForceUserToDisconnect'] != null) {
                        currentRoom.limits.timeBeforeForceUserToDisconnect = limitsConfig['timeBeforeForceUserToDisconnect'];
                    }
                }
                log('roomManager: currentRoom.limits', currentRoom.limits);


            });
        }
        socket.webrtcRoom.active(true);

        for (let r in socket.webrtcRoom.participants) {
            if (socket.client.id == socket.webrtcRoom.participants[r].id) {
                socket.webrtcParticipant = socket.webrtcRoom.participants[r];
                break;
            }
        }

        if (socket.webrtcParticipant == null) {
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

        log('roomManager: PARTICIPANT JOINED', socket.webrtcParticipant.id);
        log('roomManager: ALL PARTICIPANTS', socket.webrtcRoom.participants.map(function (p) { return p.id }));
    });

    socket.on('Streams/webrtc/controlsLoaded', function () {

        //inform user who just connected about other users in queue who requested camera/mic slot and are waiting for their turn
        for (let r in socket.webrtcRoom.cameraRequestsQueue) {

            let queueItem = socket.webrtcRoom.cameraRequestsQueue[r];
            let timePassed = Date.now() - queueItem.timeAdded;
            let tileLeftToWait = queueItem.waitingTime - timePassed;

            log('joined: camera requests queue', queueItem.participant.id);

            let emitMsg = {
                fromSid: queueItem.participant.id,
                waitingTime: tileLeftToWait
            }

            socket.emit('Streams/webrtc/requestCamera', emitMsg);
        }

        for (let r in socket.webrtcRoom.micRequestsQueue) {

            let queueItem = socket.webrtcRoom.micRequestsQueue[r];
            let timePassed = Date.now() - queueItem.timeAdded;
            let tileLeftToWait = queueItem.waitingTime - timePassed;

            log('joined: mic requests queue', queueItem.participant.id);

            let emitMsg = {
                fromSid: queueItem.participant.id,
                waitingTime: tileLeftToWait
            }

            socket.emit('Streams/webrtc/requestMic', emitMsg);
        }
    });

    socket.on('Streams/webrtc/getLimitsInfo', function () {
        if (!socket.webrtcRoom) return;

        let participants = socket.webrtcRoom.getParticipants();
        let videos = 0;
        let audios = 0;
        for (let r in participants) {
            let participant = participants[r];
            videos = videos + (participant.videoTracks().length != 0 ? 1 : 0);
            audios = audios + (participant.audioTracks().length != 0 ? 1 : 0);
        }

        let emitMsg = {
            participantsNum: participants.length,
            activeVideos: videos,
            activeAudios: audios,
            minimalTimeOfUsingSlot: socket.webrtcRoom.limits.minimalTimeOfUsingSlot,
            timeBeforeForceUserToDisconnect: socket.webrtcRoom.limits.timeBeforeForceUserToDisconnect
        }
        log('getLimitsInfo: active videos - ' + videos + '; active audios - ' + audios);

        socket.emit('Streams/webrtc/getLimitsInfo', emitMsg);
    });

    socket.on('Streams/webrtc/canITurnCameraAndMicOn', function () {
        if (!socket.webrtcRoom) return;
        log('canITurnCameraAndMicOn', socket.webrtcRoom.getParticipants().length)


        let audioSlotIsAvailable = isAudioSlotAvailable();
        let videoSlotIsAvailable = isVideoSlotAvailable();
        if (audioSlotIsAvailable && socket.webrtcRoom.micRequestsQueue.length == 0 && videoSlotIsAvailable && socket.webrtcRoom.cameraRequestsQueue.length == 0) {
            //one audio/mic slots takes 1 audio and 1 video slots
            //if there is free mic/audio AND video slot in the room (if the number of audios is less than limit), just give it to the user

            let newAudioTrack = new WebRTC.Track('audio');
            socket.webrtcParticipant.tracks.push(newAudioTrack);

            let newVideoTrack = new WebRTC.Track('video');
            socket.webrtcParticipant.tracks.push(newVideoTrack);

            log('canITurnCameraAndMicOn got both audio and video(avatar) slot; no need to add requests to any of queue')
            socket.emit('Streams/webrtc/canITurnCameraAndMicOn', { type: 'answer', answerValue: true, limit: socket.webrtcRoom.limits.audio });
        } else if ((videoSlotIsAvailable && socket.webrtcRoom.cameraRequestsQueue.length == 0) && (!audioSlotIsAvailable || socket.webrtcRoom.micRequestsQueue.length != 0)) {
            log('canITurnCameraAndMicOn: got 1 camera slot (for showing avatar); add request to queue of mic requests');
            addMeToMicQueue({
                requestType: 'canITurnCameraAndMicOn'
            });

            let newVideoTrack = new WebRTC.Track('videoavatar');
            socket.webrtcParticipant.tracks.push(newVideoTrack);
        } else if ((audioSlotIsAvailable && socket.webrtcRoom.micRequestsQueue.length == 0) && (!videoSlotIsAvailable || socket.webrtcRoom.cameraRequestsQueue.length != 0)) {
            log('canITurnCameraAndMicOn: got 1 audio slot; add request for video slot to queue');
            addMeToCameraQueue({
                requestType: 'canITurnCameraAndMicOn',
                audio: true
            });
            let newAudioTrack = new WebRTC.Track('audio');
            socket.webrtcParticipant.tracks.push(newAudioTrack);
        } else {
            log('canITurnCameraAndMicOn: add to audio and camera queue of requests');
            //try to request audio+video(avatar) slots both from the same user if it's possible
            let cameraSlotRequested = addMeToMicQueue({
                requestType: 'canITurnCameraAndMicOn',
                withCamera: true
            });

            //if request for avatar slot wasn't made in addMeToMicQueue, request the slot from another user
            if (cameraSlotRequested == false) {
                log('canITurnCameraAndMicOn: made request for audio slot, but still need to make separate request for vide(avatar) slot');
                addMeToCameraQueue({
                    requestType: 'canITurnCameraAndMicOn',
                    audio: true
                });
            } else {
                log('canITurnCameraAndMicOn: made both audio+video(avatar) requests at the same user; no need to make separate reqeust for video slot');
            }
        }
    });

    socket.on('Streams/webrtc/canITurnCameraOn', function () {
        if (!socket.webrtcRoom) return;
        log('canITurnCameraOn', socket.webrtcRoom.getParticipants().length)


        if (socket.webrtcParticipant.videoTracks().length != 0) {
            //if user has mic on and avatar shown, change its kind from videoavatar to usual video
            log('canITurnCameraOn: user already has videoavatar track, so just replace its type to regular video');
            log('canITurnCameraOn: no need to make request for video slot');

            let vTracks = socket.webrtcParticipant.videoTracks();
            for (let t in vTracks) {
                if (vTracks[t].kind == 'videoavatar') {
                    vTracks[t].kind = 'video';
                    break;
                }
            }

            socket.emit('Streams/webrtc/canITurnCameraOn', { type: 'answer', answerValue: true, limit: socket.webrtcRoom.limits.video });


        } else if (isVideoSlotAvailable() && socket.webrtcRoom.cameraRequestsQueue.length == 0) {
            //if there is free camera/video slot in the room (if the number of videos is less than limit), just give it to the user
            log('canITurnCameraOn: video slot is available, so just give it to the user');

            let newTrack = new WebRTC.Track('video');
            socket.webrtcParticipant.tracks.push(newTrack);
            socket.emit('Streams/webrtc/canITurnCameraOn', { type: 'answer', answerValue: true, limit: socket.webrtcRoom.limits.video });
        } else {
            log('canITurnCameraOn: video slot is NOT available, add request to queue');

            addMeToCameraQueue({
                requestType: 'canITurnCameraOn'
            });
        }
    });

    function addMeToCameraQueue(options) {
        if (options == null) options = {};
        //if there is no free camera/video slot in the room, add user to queue of video slot requests
        log('addMeToCameraQueue: START, audio=' + options.audio)
        log('addMeToCameraQueue: requestType=' + options.requestType)

        //check if user is already in queue
        for (let q in socket.webrtcRoom.cameraRequestsQueue) {
            if (socket.webrtcRoom.cameraRequestsQueue[q].participant == socket.webrtcParticipant) {
                log('addMeToCameraQueue: user already in queue')
                return;
            }
        }

        //take a camera slot in the user who uses camera the most of all (if such user exists)
        let userWhoUsesCameraMostOfAll = getUserWhoUsesCameraMostOfAll();
        log('addMeToCameraQueue: userWhoUsesCameraMostOfAll', userWhoUsesCameraMostOfAll != null)
        let waitingTime = 0;
        let queueItem = null;
        if (userWhoUsesCameraMostOfAll) {
            var videoTracks = userWhoUsesCameraMostOfAll.videoTracks();
            var mostNewVideoTrack = videoTracks.reduce(function (prev, current) {
                return (prev.createdTime > current.createdTime) ? prev : current;
            });

            let timeUserUsesCamera = Date.now() - mostNewVideoTrack.createdTime;
            //minimalTimeOfUsingSlot - time that is guaranteed to be provided to the user after he got camera slot
            //if this time is up, give this user some more time before camera slot will be taken from him (timeBeforeForceUserToDisconnect)
            waitingTime = timeUserUsesCamera >= socket.webrtcRoom.limits.minimalTimeOfUsingSlot ? socket.webrtcRoom.limits.timeBeforeForceUserToDisconnect : (socket.webrtcRoom.limits.minimalTimeOfUsingSlot - timeUserUsesCamera);

            //if video slot was occupied by avatar, turn mic off to make video (avatar) slot available
            if (mostNewVideoTrack.kind == 'videoavatar') {
                log('addMeToCameraQueue: take away audio slot -> audio slot can be taken away only with videoavatar')

                queueItem = {
                    participant: socket.webrtcParticipant,
                    audio: options.audio === true ? true : false,
                    timeAdded: Date.now(),
                    waitingTime: waitingTime,
                    requestType: options.requestType,
                    userThatWillGiveSlot: userWhoUsesCameraMostOfAll,
                    actionsRequired:'forceTurnMicOff'
                }

                if(options.reqeustType == 'canITurnCameraOn') {
                    userWhoUsesCameraMostOfAll.cameraRequestCountdown.userWhoRequested = socket.webrtcParticipant;
                    userWhoUsesCameraMostOfAll.cameraRequestCountdown.queueItem = queueItem;
                } else if(options.reqeustType == 'canITurnMicOn') {
                    userWhoUsesCameraMostOfAll.micRequestCountdown.userWhoRequested = socket.webrtcParticipant;
                    userWhoUsesCameraMostOfAll.micRequestCountdown.queueItem = queueItem;
                } else {
                    userWhoUsesCameraMostOfAll.cameraRequestCountdown.userWhoRequested = socket.webrtcParticipant;
                    userWhoUsesCameraMostOfAll.cameraRequestCountdown.queueItem = queueItem;
                    userWhoUsesCameraMostOfAll.micRequestCountdown.userWhoRequested = socket.webrtcParticipant;
                    userWhoUsesCameraMostOfAll.micRequestCountdown.queueItem = queueItem;
                }
                
                userWhoUsesCameraMostOfAll.micRequestCountdown.timer = userWhoUsesCameraMostOfAll.cameraRequestCountdown.timer = setTimeout(function () {
                    log('addMeToCameraQueue: force disable mic+avatar to make avatar slot available')
                    socket.to(nspName + '#' + userWhoUsesCameraMostOfAll.id).emit('Streams/webrtc/forceTurnMicOff');
                }, waitingTime);

                log('addMeToCameraQueue: add request for videoavatar(+mic) slot with audio:' + (options.audio === true ? true : false))

                socket.webrtcRoom.cameraRequestsQueue.push(queueItem);
            } else if (mostNewVideoTrack.kind == 'video' && userWhoUsesCameraMostOfAll.audioTracks().length != 0) {
                log('addMeToCameraQueue: take away video slot and turn off audio as it cannot be active without video(avatar)')

                //if userWhoUsesCameraMostOfAll has audio track also, we should turn it off as audio track cannot be used without video or avatar tracks
                userWhoUsesCameraMostOfAll.micRequestCountdown.timer = setTimeout(function () {
                    log('addMeToCameraQueue: force disable mic+video as mic track cannot exist without video/avatar track')
                    socket.to(nspName + '#' + userWhoUsesCameraMostOfAll.id).emit('Streams/webrtc/forceTurnMicOff');
                }, waitingTime);

                userWhoUsesCameraMostOfAll.cameraRequestCountdown.userWhoRequested = socket.webrtcParticipant;
                userWhoUsesCameraMostOfAll.cameraRequestCountdown.timer = setTimeout(function () {
                    log('addMeToCameraQueue: force disable camera+mic to make available video slot')
                    socket.to(nspName + '#' + userWhoUsesCameraMostOfAll.id).emit('Streams/webrtc/forceTurnCameraOff');
                }, waitingTime);

                queueItem = {
                    participant: socket.webrtcParticipant,
                    audio: options.audio === true ? true : false,
                    timeAdded: Date.now(),
                    waitingTime: waitingTime,
                    requestType: options.requestType,
                    userThatWillGiveSlot: userWhoUsesCameraMostOfAll,
                    actionsRequired:'forceTurnMicOff:forceTurnCameraOff'

                };
                userWhoUsesCameraMostOfAll.cameraRequestCountdown.queueItem = queueItem;

                socket.webrtcRoom.cameraRequestsQueue.push(queueItem);

            } else {
                log('addMeToCameraQueue: request just video slot')
                userWhoUsesCameraMostOfAll.cameraRequestCountdown.userWhoRequested = socket.webrtcParticipant;
                userWhoUsesCameraMostOfAll.cameraRequestCountdown.timer = setTimeout(function () {
                    log('addMeToCameraQueue: timer: force to disable just camera as user has only camera enabled (without mic)')
                    socket.to(nspName + '#' + userWhoUsesCameraMostOfAll.id).emit('Streams/webrtc/forceTurnCameraOff');
                }, waitingTime);

                queueItem = {
                    participant: socket.webrtcParticipant,
                    audio: options.audio === true ? true : false,
                    timeAdded: Date.now(),
                    waitingTime: waitingTime,
                    requestType: options.requestType,
                    userThatWillGiveSlot: userWhoUsesCameraMostOfAll
                };
                userWhoUsesCameraMostOfAll.cameraRequestCountdown.queueItem = queueItem;

                socket.webrtcRoom.cameraRequestsQueue.push(queueItem);
            }


        } else {
            log('addMeToCameraQueue: add request for vide slot')

            //if there is no such user (user already has another user to whom slot will be provided),
            // just calculate waiting time and add the user who made request to the queue of camera slot requests

            //sum up all waiting time
            let queueUser = socket.webrtcRoom.cameraRequestsQueue[socket.webrtcRoom.cameraRequestsQueue.length - 1];
            let timePassed = Date.now() - queueUser.timeAdded;
            let tileLeftToWait = queueUser.waitingTime - timePassed;
            waitingTime = waitingTime + tileLeftToWait + socket.webrtcRoom.limits.minimalTimeOfUsingSlot;

            queueItem = {
                participant: socket.webrtcParticipant,
                audio: options.audio === true ? true : false,
                timeAdded: Date.now(),
                waitingTime: waitingTime,
                requestType: options.requestType
            };
            socket.webrtcRoom.cameraRequestsQueue.push(queueItem);
        }

        let emitMsg = {
            fromSid: socket.webrtcParticipant.id,
            waitingTime: waitingTime,
            audio: options.audio === true ? true : false,
            forceDisconnectUser: userWhoUsesCameraMostOfAll ? userWhoUsesCameraMostOfAll.sid : null
        }
        socket.broadcast.to(socket.webrtcRoom.id).emit('Streams/webrtc/requestCamera', emitMsg);
        socket.emit('Streams/webrtc/requestCamera', emitMsg);
        return queueItem;
    }

    function isVideoSlotAvailable() {
        let videoTracksNum = 0;
        let participants = socket.webrtcRoom.getParticipants();
        for (let r in participants) {
            let participant = participants[r];

            //if(socket.client.id == participant.id) continue;

            videoTracksNum = videoTracksNum + participant.videoTracks().length;

        }
        log('isVideoSlotAvailable', videoTracksNum >= socket.webrtcRoom.limits.video ? false : true)

        return videoTracksNum >= socket.webrtcRoom.limits.video ? false : true;
    }

    function getUsersCameraQueueItem(participant) {
        log('getUsersCameraQueueItem START', socket.webrtcParticipant.id, socket.webrtcParticipant.sid)
        log('getUsersCameraQueueItem', socket.webrtcRoom.cameraRequestsQueue)

        for (let i in socket.webrtcRoom.cameraRequestsQueue) {
            if (participant == socket.webrtcRoom.cameraRequestsQueue[i].participant) {
                return socket.webrtcRoom.cameraRequestsQueue[i];
            }
        }

        return null
    }

    socket.on('Streams/webrtc/canITurnMicOn', function () {
        if (!socket.webrtcRoom) return;
        log('canITurnMicOn START', socket.webrtcParticipant.id)

        //if user doesn't have camera enabled, avatar will be shown instead
        if (socket.webrtcParticipant.videoTracks(true).length == 0) {
            let audioSlotIsAvailable = isAudioSlotAvailable();
            let videoSlotIsAvailable = isVideoSlotAvailable();
            if (audioSlotIsAvailable && socket.webrtcRoom.micRequestsQueue.length == 0 && videoSlotIsAvailable && socket.webrtcRoom.cameraRequestsQueue.length == 0) {
                //one audio/mic slots takes 1 audio and 1 video slots
                //if there is free mic/audio AND video slot in the room (if the number of audios is less than limit), just give it to the user

                let newAudioTrack = new WebRTC.Track('audio');
                socket.webrtcParticipant.tracks.push(newAudioTrack);

                let newVideoTrack = new WebRTC.Track('videoavatar');
                socket.webrtcParticipant.tracks.push(newVideoTrack);

                log('canITurnMicOn got both audio and video(avatar) slot; no need to add requests to any of queue')
                socket.emit('Streams/webrtc/canITurnMicOn', { type: 'answer', answerValue: true, limit: socket.webrtcRoom.limits.audio });
            } else if ((videoSlotIsAvailable && socket.webrtcRoom.cameraRequestsQueue.length == 0) && (!audioSlotIsAvailable || socket.webrtcRoom.micRequestsQueue.length != 0)) {
                log('canITurnMicOn: got 1 camera slot (for showing avatar); add request to queue of mic requests');
                addMeToMicQueue({
                    requestType: 'canITurnMicOn',
                    withAvatar: true
                });

                let newVideoTrack = new WebRTC.Track('videoavatar');
                socket.webrtcParticipant.tracks.push(newVideoTrack);
            } else if ((audioSlotIsAvailable && socket.webrtcRoom.micRequestsQueue.length == 0) && (!videoSlotIsAvailable || socket.webrtcRoom.cameraRequestsQueue.length != 0)) {
                log('canITurnMicOn: got 1 audio slot; add request for video slot to queue (to show avatar)');
                addMeToCameraQueue({
                    requestType: 'canITurnMicOn',
                    audio: true,
                    forAvatar: true
                });
                let newAudioTrack = new WebRTC.Track('audio');
                socket.webrtcParticipant.tracks.push(newAudioTrack);
            } else {
                log('canITurnMicOn: add to audio and camera queue of requests');
                /*Not audio neither video(avatar) slot are available. So we need to make request for audio and video slot.
                Firstly, we make reqeust for camera slot with "audio"=true to know that this video slot will be taken in favor of audio slot (to show avatar).
                addMeToCameraQueue will check if there is the user who uses video(avatar) slot most of all. If such user not exits, it just adds request to the queue
                of requests for video slot to wait until somebody turns his camera off. If such user exists, it will check what type of video track he uses: it can be
                video or videoavatar. if it's videoavatar, we cannot take away videoavatar slot separately from audio slot as videoavatart track is used only in pair
                with audio track. So we need to make request that will force user to turn mic off - it will make available videoavatar slot which we need 
                and additionally it will make available audio slot which we also need. This request is created in addMeToCameraQueue function. In this case
                we dont need to call next addMeToMicQueue (addMeToMicQueue will exit as there is already request for mic+avatar slot created by addMeToCameraQueue).
                If it's video track only (without mic enabled), it will just force the user to turn camera off - this will make available video slot which we need.
                If it's video (camera) track + audio track, we also need to turn mic off as it cannot be enabled without video slot (avatar or camera)*/

                //try to request audio+video(avatar) slots both from the same user if it's possible
                let avatarSlotRequested = addMeToMicQueue({
                    requestType: 'canITurnMicOn',
                    withAvatar: true
                });

                //if request for avatar slot wasn't made in addMeToMicQueue, request the slot from another user
                if (avatarSlotRequested == false) {
                    log('canITurnMicOn: made request for audio slot, but still need to make separate request for vide(avatar) slot');
                    addMeToCameraQueue({
                        requestType: 'canITurnMicOn',
                        audio: true,
                        forAvatar: true
                    });
                } else {
                    log('canITurnMicOn: made both audio+video(avatar) requests at the same user; no need to make separate reqeust for video slot');
                }
            }
        } else {
            log('canITurnMicOn if2')
            let audioSlotIsAvailable = isAudioSlotAvailable();
            if (audioSlotIsAvailable && socket.webrtcRoom.micRequestsQueue.length == 0) {
                log('canITurnMicOn if2 if1')
                let newAudioTrack = new WebRTC.Track('audio');
                socket.webrtcParticipant.tracks.push(newAudioTrack);
                socket.emit('Streams/webrtc/canITurnMicOn', { type: 'answer', answerValue: true, limit: socket.webrtcRoom.limits.audio });
            } else {
                log('canITurnMicOn: if2 if2');
                addMeToMicQueue();
            }
        }


    });

    function addMeToMicQueue(options) {
        if (options == null) options = {};
        //if there is no free mic/audio slot in the room, add user to queue of audio slot requests
        log('addMeToMicQueue: START', options)

        //check if user is already in queue
        for (let q in socket.webrtcRoom.micRequestsQueue) {
            if (socket.webrtcRoom.micRequestsQueue[q].participant == socket.webrtcParticipant) {
                log('addMeToMicQueue: user already in queue')
                return;
            }
        }

        //take a mic slot from the user who uses mic the most of all (if such use exists)
        let userWhoUsesMicMostOfAll = getUserWhoUsesMicMostOfAll();
        let userWhoUsesCameraMostOfAll = getUserWhoUsesCameraMostOfAll();
        log('addMeToMicQueue: userWhoUsesMicMostOfAll', userWhoUsesMicMostOfAll != null)
        let avatarOrVideoSlotRequested = false;
        let waitingTime = 0;
        if (userWhoUsesMicMostOfAll) {
            var audioTracks = userWhoUsesMicMostOfAll.audioTracks();
            var avatarTracks = userWhoUsesMicMostOfAll.avatarTracks();
            var videoTracks = userWhoUsesMicMostOfAll.videoTracks(true);
            var mostNewAudioTrack = audioTracks.reduce(function (prev, current) {
                return (prev.createdTime > current.createdTime) ? prev : current;
            });

            let timeUserUsesMic = Date.now() - mostNewAudioTrack.createdTime;
            //minimalTimeOfUsingSlot - time that is guaranteed to be provided to the user after he got mic slot
            //if this time is up, give this user some more time before mic slot will be taken from him (timeBeforeForceUserToDisconnect)
            waitingTime = timeUserUsesMic >= socket.webrtcRoom.limits.minimalTimeOfUsingSlot ? socket.webrtcRoom.limits.timeBeforeForceUserToDisconnect : (socket.webrtcRoom.limits.minimalTimeOfUsingSlot - timeUserUsesMic);

            userWhoUsesMicMostOfAll.micRequestCountdown.userWhoRequested = socket.webrtcParticipant;

            //timer may be already set if the userWhoUsesMicMostOfAll was forced to turn mic off in favor of video slot
            if(userWhoUsesMicMostOfAll.micRequestCountdown.timer == null) {
                userWhoUsesMicMostOfAll.micRequestCountdown.timer = setTimeout(function () {
                    log('addMeToMicQueue: timer: force user to turn mic off 75637')
                    socket.to(nspName + '#' + userWhoUsesMicMostOfAll.id).emit('Streams/webrtc/forceTurnMicOff');
                }, waitingTime);
            }

            let audioReqeustQueueItem = {
                participant: socket.webrtcParticipant,
                timeAdded: Date.now(),
                requestType: options.requestType,
                waitingTime: waitingTime,
                userThatWillGiveSlot: userWhoUsesMicMostOfAll
            }
            userWhoUsesMicMostOfAll.micRequestCountdown.queueItem = audioReqeustQueueItem;

            socket.webrtcRoom.micRequestsQueue.push(audioReqeustQueueItem);


            log('addMeToMicQueue: check if there is possibility to request video(avatar) slot from the same user', avatarTracks.length, videoTracks.length);
            log('addMeToMicQueue: options.withCamera', options.withCamera, userWhoUsesMicMostOfAll == userWhoUsesCameraMostOfAll);
            if ((options.withCamera || options.withAvatar) && avatarTracks.length != 0) {
                log('addMeToMicQueue: create also request for avatar');

                userWhoUsesMicMostOfAll.cameraRequestCountdown.userWhoRequested = socket.webrtcParticipant;
                let videoRequestQueueItem = {
                    participant: socket.webrtcParticipant,
                    timeAdded: audioReqeustQueueItem.timeAdded,
                    waitingTime: waitingTime,
                    requestType: options.requestType,
                    userThatWillGiveSlot: userWhoUsesMicMostOfAll,
                    linkedToParallelAudioRequest: audioReqeustQueueItem
                }
                audioReqeustQueueItem.linkedToParallelVideoRequest = videoRequestQueueItem
                userWhoUsesMicMostOfAll.cameraRequestCountdown.queueItem = videoRequestQueueItem;

                socket.webrtcRoom.cameraRequestsQueue.push(videoRequestQueueItem);

                avatarOrVideoSlotRequested = true;
            } else if ((options.withCamera || options.withAvatar) && videoTracks.length != 0 && userWhoUsesMicMostOfAll == userWhoUsesCameraMostOfAll) {
                log('addMeToMicQueue: create also request for camera');
                
                userWhoUsesCameraMostOfAll.cameraRequestCountdown.userWhoRequested = socket.webrtcParticipant;
                userWhoUsesCameraMostOfAll.cameraRequestCountdown.timer = setTimeout(function () {
                    log('addMeToMicQueue: timer: force timer end 1')
                    socket.to(nspName + '#' + userWhoUsesCameraMostOfAll.id).emit('Streams/webrtc/forceTurnCameraOff');
                }, waitingTime);
                let videoRequestQueueItem = {
                    participant: socket.webrtcParticipant,
                    timeAdded: audioReqeustQueueItem.timeAdded,
                    waitingTime: waitingTime,
                    requestType: options.requestType,
                    userThatWillGiveSlot: userWhoUsesCameraMostOfAll,
                    linkedToParallelAudioRequest: audioReqeustQueueItem
                }
                audioReqeustQueueItem.linkedToParallelVideoRequest = videoRequestQueueItem
                userWhoUsesCameraMostOfAll.cameraRequestCountdown.queueItem = videoRequestQueueItem;
                socket.webrtcRoom.cameraRequestsQueue.push(videoRequestQueueItem);

                avatarOrVideoSlotRequested = true;
            }

        } else {
            //if there is no such user (user already has another user to whom slot will be provided),
            // just calculate waiting time and add the user who made request to the queue of mic slot requests
            log('addMeToMicQueue: if 2');

            //sum up all waiting time

            let latestRequestForMicSlot;

            let lastItemInMicSlotcQueue = socket.webrtcRoom.micRequestsQueue[socket.webrtcRoom.micRequestsQueue.length - 1];
            
            let lastItemInVideoSlotQueue;
            for (let i = socket.webrtcRoom.cameraRequestsQueue.length - 1; i >= 0; i--) {
                if (socket.webrtcRoom.cameraRequestsQueue[i].requestType == 'canITurnMicOn' || (socket.webrtcRoom.cameraRequestsQueue[i].actionsRequired && socket.webrtcRoom.cameraRequestsQueue[i].actionsRequired.includes('forceTurnMicOff'))) {
                    lastItemInVideoSlotQueue = socket.webrtcRoom.cameraRequestsQueue[i];
                    break;
                }
            }

            if(lastItemInMicSlotcQueue && lastItemInVideoSlotQueue) {
                if(lastItemInMicSlotcQueue.timeAdded >= lastItemInVideoSlotQueue.timeAdded) {
                    latestRequestForMicSlot = lastItemInMicSlotcQueue;
                } else {
                    latestRequestForMicSlot = lastItemInVideoSlotQueue;
                }
            } else if(lastItemInMicSlotcQueue) {
                latestRequestForMicSlot = lastItemInMicSlotcQueue;
            } else {
                latestRequestForMicSlot = lastItemInVideoSlotQueue;
            }

            if (latestRequestForMicSlot) {
                let timePassed = Date.now() - latestRequestForMicSlot.timeAdded;
                let tileLeftToWait = latestRequestForMicSlot.waitingTime - timePassed;
                waitingTime = waitingTime + tileLeftToWait + socket.webrtcRoom.limits.minimalTimeOfUsingSlot;
            }

            socket.webrtcRoom.micRequestsQueue.push({
                participant: socket.webrtcParticipant,
                timeAdded: Date.now(),
                requestType: options.requestType,
                waitingTime: waitingTime
            });
        }


        let emitMsg = {
            fromSid: socket.webrtcParticipant.id,
            waitingTime: waitingTime,
            togetherWithAvatarSlot: avatarOrVideoSlotRequested,
            forceDisconnectUser: userWhoUsesMicMostOfAll ? userWhoUsesMicMostOfAll.sid : null
        }
        socket.broadcast.to(socket.webrtcRoom.id).emit('Streams/webrtc/requestMic', emitMsg);
        socket.emit('Streams/webrtc/requestMic', emitMsg);

        return avatarOrVideoSlotRequested;
    }

    function isAudioSlotAvailable() {
        let audioTracksNum = 0;
        let participants = socket.webrtcRoom.getParticipants();
        for (let r in participants) {
            let participant = participants[r];

            if (socket.client.id == participant.id) {
                continue;
            }

            audioTracksNum = audioTracksNum + participant.audioTracks().length;

        }
        log('isAudioSlotAvailable', audioTracksNum >= socket.webrtcRoom.limits.audio ? false : true)

        return audioTracksNum >= socket.webrtcRoom.limits.audio ? false : true;
    }

    function getUsersMicQueueItem(participant) {
        for (let i in socket.webrtcRoom.micRequestsQueue) {
            if (participant == socket.webrtcRoom.micRequestsQueue[i].participant) {
                return socket.webrtcRoom.micRequestsQueue[i];
            }
        }

        return null
    }

    function getUserWhoUsesCameraMostOfAll() {
        var participants = socket.webrtcRoom.getParticipants();
        var tracks = [];
        for (let p in participants) {
            if (participants[p].videoTracks().length == 0 || participants[p].cameraRequestCountdown.userWhoRequested != null) continue;

            //ignore users who are having camera (avatar) slot but waiting for mic slot
            let skipUser = false;
            for (let q in socket.webrtcRoom.micRequestsQueue) {
                if (socket.webrtcRoom.micRequestsQueue[q].participant == participants[p]) {
                    skipUser = true;
                    break;
                }
            }

            if(skipUser) continue;
            let vTracks = participants[p].videoTracks();
            for (let t in vTracks) {
                tracks.push({ participant: participants[p], track: vTracks[t] });
            }
        }

        var userWhoUsesCameraMostOfAll;
        if (tracks.length != 0) {
            userWhoUsesCameraMostOfAll = tracks.reduce(function (prev, current) {
                return (prev.track.createdTime < current.track.createdTime) ? prev : current;
            }).participant;
        }

        return userWhoUsesCameraMostOfAll;
    }

    function getNextUserFromCameraRequestsQueue() {
        for (let q in socket.webrtcRoom.cameraRequestsQueue) {
            if (socket.webrtcRoom.cameraRequestsQueue[q].userThatWillGiveSlot == null) {
                return socket.webrtcRoom.cameraRequestsQueue[q];
            }
        }

        return null;
    }

    function getNextUserFromMicRequestsQueue() {
        for (let q in socket.webrtcRoom.micRequestsQueue) {
            if (socket.webrtcRoom.micRequestsQueue[q].userThatWillGiveSlot == null) {
                return socket.webrtcRoom.micRequestsQueue[q];
            }
        }

        return null;
    }

    function getUserWhoUsesMicMostOfAll() {
        var participants = socket.webrtcRoom.getParticipants();
        var tracks = [];
        for (let p in participants) {
            if (participants[p].audioTracks().length == 0 || participants[p].micRequestCountdown.userWhoRequested != null) continue;

            //ignore users who are waiting for camera slot while already having audio slot
            let skipUser = false;
            for (let q in socket.webrtcRoom.cameraRequestsQueue) {
                if (socket.webrtcRoom.cameraRequestsQueue[q].participant == participants[p]) {
                    skipUser = true;
                    break;
                }
            }
            if(skipUser) continue;
            let aTracks = participants[p].audioTracks();
            for (let t in aTracks) {
                tracks.push({ participant: participants[p], track: aTracks[t] });
            }
        }

        var userWhoUsesMicMostOfAll;
        if (tracks.length != 0) {
            userWhoUsesMicMostOfAll = tracks.reduce(function (prev, current) {
                return (prev.track.createdTime < current.track.createdTime) ? prev : current;
            }).participant;
        }

        return userWhoUsesMicMostOfAll;
    }

    //if someone disabled camera
    socket.on('Streams/webrtc/cameraDisabled', function () {
        if (!socket.webrtcRoom) return;
        log('cameraDisabled START', socket.webrtcParticipant.id)

        //inform all users that user turned his camera off
        socket.to(socket.webrtcRoom.id).emit('Streams/webrtc/cameraDisabled', {
            fromSid: socket.webrtcParticipant.id,
        });
        socket.emit('Streams/webrtc/cameraDisabled', {
            fromSid: socket.webrtcParticipant.id,
        });

        //if user turned camera off but still has mic on, change kind of current video track to videoavatar
        //so user will be visible as avatar+mic
        if (socket.webrtcParticipant.audioTracks().length != 0) {
            let vTracks = socket.webrtcParticipant.videoTracks();
            for (let t in vTracks) {
                if (vTracks[t].kind == 'video') {
                    vTracks[t].kind = 'videoavatar';
                    break;
                }
            }

            return;
        } else {
            //if user had only camera enabled, no need to show avatar as user has no mic
            //so just remove all video tracks for user who turned camera off and give this slot to next user
            for (let d = socket.webrtcParticipant.tracks.length - 1; d >= 0; d--) {
                if (socket.webrtcParticipant.tracks[d].kind != 'video') continue;
                socket.webrtcParticipant.tracks.splice(d, 1);
            }
        }

        giveVideoSlotToNextUser();

    });

    function giveVideoSlotToNextUser() {
        log('giveVideoSlotToNextUser START')

        //if the user who disabled camera is the one who used camera most of all (this user should be forced to disable camera),
        //give his camera slot to the next user in the queue who requested camera
        if (socket.webrtcParticipant.cameraRequestCountdown.queueItem) {
            log('giveVideoSlotToNextUser if1', socket.webrtcParticipant.id)

            let giveCameraTo = socket.webrtcParticipant.cameraRequestCountdown.userWhoRequested;

            let queueItem;
            for (let i = socket.webrtcRoom.cameraRequestsQueue.length - 1; i >= 0; i--) {
                if (giveCameraTo == socket.webrtcRoom.cameraRequestsQueue[i].participant) {
                    queueItem = socket.webrtcRoom.cameraRequestsQueue[i];
                    break;
                }
            }

            log('giveVideoSlotToNextUser if1: queueItem', queueItem != null)


            let romoveRequestFromQueue = function () {
                log('giveVideoSlotToNextUser if1: romoveRequestFromQueue')

                let timeDiff = 0;
                for (let i = socket.webrtcRoom.cameraRequestsQueue.length - 1; i >= 0; i--) {
                    if (giveCameraTo == socket.webrtcRoom.cameraRequestsQueue[i].participant) {
                        let queueItem = socket.webrtcRoom.cameraRequestsQueue.splice(i, 1)[0];

                        //determine if user will get mic slot earlier than was supposed to get
                        //and if user who turned mic off did it earlier than was supposed to do
                        let waitingTime = queueItem.waitingTime;
                        let timeAdded = queueItem.timeAdded;
                        let timePassed = (Date.now() - timeAdded);
                        log('giveVideoSlotToNextUser if1 timePassed/waitingTime', timePassed, waitingTime)

                        //determine how much earlier user will get his camera slot
                        if (timePassed < waitingTime) {
                            timeDiff = waitingTime - timePassed;
                        }
                        break;
                    }
                }

                return timeDiff;
            }

            let reserveThisAudioSlotForNextUserInQueue = function (nextItemInMicQueue, reserveOnlyVideoSlot) {
                log('giveVideoSlotToNextUser if1: reserveThisAudioSlotForNextUserInQueue', nextItemInMicQueue.participant.id)
                let userWhoJustGotAudioSlot = giveCameraTo;
                if(!reserveOnlyVideoSlot) {
                    userWhoJustGotAudioSlot.micRequestCountdown.userWhoRequested = nextItemInMicQueue.participant;
                    userWhoJustGotAudioSlot.micRequestCountdown.queueItem = nextItemInMicQueue;
                }
                userWhoJustGotAudioSlot.micRequestCountdown.timer = setTimeout(function () {
                    log('giveVideoSlotToNextUser: timer: force user to turn mic off')
                    socket.to(nspName + '#' + userWhoJustGotAudioSlot.id).emit('Streams/webrtc/forceTurnMicOff');
                }, socket.webrtcRoom.limits.minimalTimeOfUsingSlot);

                nextItemInMicQueue.userThatWillGiveSlot = userWhoJustGotAudioSlot;
            }

            let reserveThisVideoSlotForNextUserInQueue = function (nextItemInCameraQueue, withoutTimer) {
                log('giveVideoSlotToNextUser if1: reserveThisVideoSlotForNextUserInQueue', nextItemInCameraQueue.participant.id)
                let userWhoJustGotVideoSlot = giveCameraTo;
                userWhoJustGotVideoSlot.cameraRequestCountdown.userWhoRequested = nextItemInCameraQueue.participant;
                userWhoJustGotVideoSlot.cameraRequestCountdown.queueItem = nextItemInCameraQueue;

                if(!withoutTimer) {
                    userWhoJustGotVideoSlot.cameraRequestCountdown.timer = setTimeout(function () {
                        log('canITurnCameraOn: timer: force user to turn camera off')
                        socket.to(nspName + '#' + userWhoJustGotVideoSlot.id).emit('Streams/webrtc/forceTurnCameraOff');
                    }, socket.webrtcRoom.limits.minimalTimeOfUsingSlot);
                }

                nextItemInCameraQueue.userThatWillGiveSlot = userWhoJustGotVideoSlot;
            }


            //if this slot will be given in favor of audio track (for videoavatar track), 
            // allow to turn mic onfor user who requested microphone.
            log('giveVideoSlotToNextUser if1: requestType=' + queueItem.requestType)
            
            //remove user who will be given camera slot from queue
            let timeDiff = romoveRequestFromQueue();

            let nextAudioRequestInQueue = getNextUserFromMicRequestsQueue();
            //if there is next user in queue, limit provided time for user who was just provided with camera slot and, when the time will end, give his camera slot to the next user
            let nextVideoRequestInQueue = getNextUserFromCameraRequestsQueue();
            
            if (queueItem.requestType == 'canITurnMicOn') {
                log('giveVideoSlotToNextUser if1: give video slot to the user who requested the it for showing avatar')

                let newTrack = new WebRTC.Track('videoavatar');
                giveCameraTo.tracks.push(newTrack);

                log('giveVideoSlotToNextUser: if1 timeDiff', timeDiff)

                //if there is one more (next) user in queue, set limit provided time for current user who got slot via sending timeProvided option, it will show countdown timer on client side
                socket.to(nspName + '#' + giveCameraTo.id).emit('Streams/webrtc/canITurnMicOn', { type: 'answer', answerValue: true, timeProvided: (nextAudioRequestInQueue || nextVideoRequestInQueue) ? socket.webrtcRoom.limits.minimalTimeOfUsingSlot : null, limit: socket.webrtcRoom.limits.audio });
                
                if(nextAudioRequestInQueue || nextVideoRequestInQueue) reserveThisAudioSlotForNextUserInQueue(nextAudioRequestInQueue || nextVideoRequestInQueue, true);
                if(nextVideoRequestInQueue) reserveThisVideoSlotForNextUserInQueue(nextVideoRequestInQueue, true);

                //recalculate all timers for other users (for example, when user disabled his camera before he was forced to do it)
                recalculateAllCameraTimers(timeDiff);

            } else {
                log('giveVideoSlotToNextUser if1: give video slot to the user who requested it for camera')

                let newTrack = new WebRTC.Track('video');
                giveCameraTo.tracks.push(newTrack);

                log('giveVideoSlotToNextUser if1: timeDiff', timeDiff)

                //if there is next user in queue, limit provided time for user who was just provided with camera slot and, when the time will end, give his camera slot to the next user
                let nextVideoRequestInQueue = getNextUserFromCameraRequestsQueue();

                //if there is one more (next) user in queue, set limit provided time for current user who got slot via sending timeProvided option, it will show countdown timer on client side
                socket.to(nspName + '#' + giveCameraTo.id).emit('Streams/webrtc/' + queueItem.requestType, { type: 'answer', answerValue: true, timeProvided: nextVideoRequestInQueue ? socket.webrtcRoom.limits.minimalTimeOfUsingSlot : null, limit: socket.webrtcRoom.limits.video });
                
                if(nextVideoRequestInQueue) reserveThisVideoSlotForNextUserInQueue(nextVideoRequestInQueue);

                //recalculate all timers for other users (for example, when user disabled his camera before he was forced to do it)
                recalculateAllCameraTimers(timeDiff);
            }

            socket.emit('Streams/webrtc/cancelForceTurnCameraOffTimer');

            if (socket.webrtcParticipant.cameraRequestCountdown.time) clearTimeout(socket.webrtcParticipant.cameraRequestCountdown.timer);
            socket.webrtcParticipant.cameraRequestCountdown.timer = null;
            socket.webrtcParticipant.cameraRequestCountdown.userWhoRequested = null;
            socket.webrtcParticipant.cameraRequestCountdown.queueItem = null;

        } else {
            log('giveVideoSlotToNextUser if2')
            //if someone disabled before the time when the former user should be forced to turn his camera off, give his camera slot
            //to the next user in queue of camera requests
            let firstUserInQueue = socket.webrtcRoom.cameraRequestsQueue[socket.webrtcRoom.cameraRequestsQueue.length - 1];

            if (!firstUserInQueue) return;

            //add track to the rom to occupy video slot
            let newTrack = new WebRTC.Track('video');
            firstUserInQueue.participant.tracks.push(newTrack);

            let removeItemFromQueue = function () {
                let timeDiff;
                for (let i = socket.webrtcRoom.cameraRequestsQueue.length - 1; i >= 0; i--) {
                    if (firstUserInQueue == socket.webrtcRoom.cameraRequestsQueue[i]) {
                        socket.webrtcRoom.cameraRequestsQueue.splice(i, 1)[0];

                        //determine if user will get mic slot earlier than was supposed to get
                        let waitingTime = firstUserInQueue.waitingTime;
                        let timeAdded = firstUserInQueue.timeAdded;
                        let timePassed = (Date.now() - timeAdded);
                        log('giveVideoSlotToNextUser if2 timePassed/waitingTime', timePassed, waitingTime)

                        //determine how much earlier user wil get mic slot
                        if (timePassed < waitingTime) {
                            timeDiff = waitingTime - timePassed;
                        }
                        break;
                    }
                }
                return timeDiff;
            }

            let reserveThisVideoSlotForNextUserInQueue = function (nextItemInCameraQueue) {
                let userWhoJustGotVideoStream = firstUserInQueue;
                userWhoJustGotVideoStream.participant.cameraRequestCountdown.userWhoRequested = nextItemInCameraQueue.participant;
                userWhoJustGotVideoStream.participant.cameraRequestCountdown.queueItem = nextItemInCameraQueue;
                userWhoJustGotVideoStream.participant.cameraRequestCountdown.timer = setTimeout(function () {
                    log('canITurnCameraOn: force timer end 2')
                    socket.to(nspName + '#' + userWhoJustGotVideoStream.participant.id).emit('Streams/webrtc/forceTurnCameraOff');
                }, socket.webrtcRoom.limits.minimalTimeOfUsingSlot);

                nextItemInCameraQueue.userThatWillGiveSlot = userWhoJustGotVideoStream.participant;
            }

            let timeDiff = removeItemFromQueue();

            if (!firstUserInQueue.participant.pendingAudioSlotRequest()) {

                log('cameraDisabled if2: pendingAudioSlotRequest=false')

                //allow first user in queue to turn camera on
                socket.to(nspName + '#' + firstUserInQueue.participant.id).emit('Streams/webrtc/' + firstUserInQueue.requestType, { answerValue: true, limit: socket.webrtcRoom.limits.video });

                //if there is one more next user in queue, limit provided time for user who was just provided with camera slot and, when the time will end, give his camera slot to the next user
                var nextUserInQueue = getNextUserFromCameraRequestsQueue();
                if (nextUserInQueue) reserveThisVideoSlotForNextUserInQueue(nextUserInQueue);

                //recalculate all timers for other users (for example, when user disabled his camera before he was forced to do it)
                recalculateAllCameraTimers(timeDiff);
            }

            //if the firstUserInQueue has the user who was supposed to give his camera slot to him (userThatWillGiveSlot), change user for userThatWillGiveSlot or cancel all timers if no next user
            if (firstUserInQueue.userThatWillGiveSlot) {
                log('cameraDisabled if2.1')
                let nextUserInQueue = getNextUserFromCameraRequestsQueue();

                if (nextUserInQueue) {
                    log('cameraDisabled if2.1.1')
                    //if there are still users in queue of camera requests, take next user in queue and assign him to the timer of user who uses camera the most of all
                    firstUserInQueue.userThatWillGiveSlot.cameraRequestCountdown.userWhoRequested = nextUserInQueue.participant;
                    firstUserInQueue.userThatWillGiveSlot.cameraRequestCountdown.queueItem = nextUserInQueue;
                    nextUserInQueue.userThatWillGiveSlot = firstUserInQueue.userThatWillGiveSlot;
                } else {
                    log('cameraDisabled if2.1.2')

                    if (firstUserInQueue.userThatWillGiveSlot.cameraRequestCountdown.timer) clearTimeout(firstUserInQueue.userThatWillGiveSlot.cameraRequestCountdown.timer);
                    firstUserInQueue.userThatWillGiveSlot.cameraRequestCountdown.timer = null;
                    firstUserInQueue.userThatWillGiveSlot.cameraRequestCountdown.userWhoRequested = null;
                    firstUserInQueue.userThatWillGiveSlot.cameraRequestCountdown.queueItem = null;

                    socket.to(nspName + '#' + firstUserInQueue.userThatWillGiveSlot.id).emit('Streams/webrtc/cancelForceTurnCameraOffTimer');

                }
            }
        }
    }

    function recalculateAllCameraTimers(timeDiff) {
        for (let q in socket.webrtcRoom.cameraRequestsQueue) {
            let queueItem = socket.webrtcRoom.cameraRequestsQueue[q];
            let timeAdded = queueItem.timeAdded;
            let waitingTime = queueItem.waitingTime;
            let timePassed = Date.now() - timeAdded;

            let newWaitingTime = (waitingTime - timePassed) - timeDiff;
            let emitMsg = {
                fromSid: queueItem.participant.id,
                waitingTime: newWaitingTime
            }
            socket.broadcast.to(socket.webrtcRoom.id).emit('Streams/webrtc/requestCamera', emitMsg);
            socket.emit('Streams/webrtc/requestCamera', emitMsg);
        }
    }

    //if someone disabled mic
    socket.on('Streams/webrtc/micDisabled', function () {
        if (!socket.webrtcRoom) return;
        log('micDisabled START', socket.webrtcParticipant.id)

        //inform all users that user turned his mic off
        socket.to(socket.webrtcRoom.id).emit('Streams/webrtc/micDisabled', {
            fromSid: socket.webrtcParticipant.id,
        });
        socket.emit('Streams/webrtc/micDisabled', {
            fromSid: socket.webrtcParticipant.id,
        });

        //if the user who turned mic off had only audio+avatar, give his video(avatar) slot to the next user in queue
        let videoSlotBecameAvailable = false;
        if (socket.webrtcParticipant.avatarTracks().length != 0) {
            log('micDisabled: remove avatar tracks')

            //remove all avatar tracks for user who turned mic off
            for (let d = socket.webrtcParticipant.tracks.length - 1; d >= 0; d--) {
                if (socket.webrtcParticipant.tracks[d].kind != 'videoavatar') continue;
                socket.webrtcParticipant.tracks.splice(d, 1);
            }

            //giveVideoSlotToNextUser();
            videoSlotBecameAvailable = true;
        }

        //remove all audio tracks for user who turned mic off
        for (let d = socket.webrtcParticipant.tracks.length - 1; d >= 0; d--) {
            if (socket.webrtcParticipant.tracks[d].kind != 'audio') continue;
            socket.webrtcParticipant.tracks.splice(d, 1);
        }


        let userWhoRequestedAudioSlot = socket.webrtcParticipant.micRequestCountdown.userWhoRequested;
        let userWhoRequestedVideoSlot = socket.webrtcParticipant.cameraRequestCountdown.userWhoRequested;
        let requestType;
        if(socket.webrtcParticipant.micRequestCountdown.queueItem && socket.webrtcParticipant.micRequestCountdown.queueItem.requestType != null) {
            requestType = socket.webrtcParticipant.micRequestCountdown.queueItem.requestType;
        } else {
            requestType = socket.webrtcParticipant.cameraRequestCountdown.queueItem.requestType;
        }
        if (userWhoRequestedAudioSlot && userWhoRequestedVideoSlot && userWhoRequestedAudioSlot == userWhoRequestedVideoSlot && requestType != 'canITurnCameraOn') {
            giveVideoAndAudioSlotToRequestor(userWhoRequestedAudioSlot);
        } else {
            if (videoSlotBecameAvailable) giveVideoSlotToNextUser();
            giveAudioSlotToNextUser();
        }

    });

    function giveVideoAndAudioSlotToRequestor(userWhoRequestedAudioAndVideoSlots) {
        log('giveVideoAndAudioSlotToRequestor START', userWhoRequestedAudioAndVideoSlots.id)

        let removeRequestForMicSlot = function () {
            log('giveVideoAndAudioSlotToRequestor: removeRequestForMicSlot')
            let queueItem;
            //remove user who will be given mic slot from queue
            let timeDiff = 0;
            for (let i = socket.webrtcRoom.micRequestsQueue.length - 1; i >= 0; i--) {
                log('giveVideoAndAudioSlotToRequestor: removeRequestForMicSlot: for', userWhoRequestedAudioAndVideoSlots.id, socket.webrtcRoom.micRequestsQueue[i].participant.id)

                if (userWhoRequestedAudioAndVideoSlots == socket.webrtcRoom.micRequestsQueue[i].participant) {
                    queueItem = socket.webrtcRoom.micRequestsQueue.splice(i, 1)[0];

                    //determine if user will get mic slot earlier than was supposed to get
                    //and if user who turned mic off did it earlier than was supposed to do
                    let waitingTime = queueItem.waitingTime;
                    let timeAdded = queueItem.timeAdded;
                    let timePassed = (Date.now() - timeAdded);
                    log('giveVideoAndAudioSlotToRequestor: removeRequestForMicSlot: timePassed/waitingTime', timePassed, waitingTime)

                    if (timePassed < waitingTime) {
                        timeDiff = waitingTime - timePassed;
                    }
                    break;
                }
            }
            log('giveVideoAndAudioSlotToRequestor: removeRequestForMicSlot: userWhoRequestedAudioAndVideoSlots', userWhoRequestedAudioAndVideoSlots.id)
            log('giveVideoAndAudioSlotToRequestor: removeRequestForMicSlot: timeDiff', timeDiff)


            return {
                queueItem: queueItem,
                timeDiff: timeDiff
            }
        }

        let removeRequestForVideoSlot = function () {
            log('giveVideoAndAudioSlotToRequestor: removeRequestForVideoSlot: removeRequestForVideoSlot')
            let queueItem
            //remove user who will be given video(avatar) slot from queue
            let timeDiff = 0;
            for (let i = socket.webrtcRoom.cameraRequestsQueue.length - 1; i >= 0; i--) {
                if (userWhoRequestedAudioAndVideoSlots == socket.webrtcRoom.cameraRequestsQueue[i].participant) {
                    log('giveVideoAndAudioSlotToRequestor: removeRequestForVideoSlot: for', userWhoRequestedAudioAndVideoSlots.id, socket.webrtcRoom.micRequestsQueue[i].participant.id)

                    queueItem = socket.webrtcRoom.cameraRequestsQueue.splice(i, 1)[0];

                    //determine if user will get mic slot earlier than was supposed to get
                    //and if user who turned mic off did it earlier than was supposed to do
                    let waitingTime = queueItem.waitingTime;
                    let timeAdded = queueItem.timeAdded;
                    let timePassed = (Date.now() - timeAdded);
                    log('giveVideoAndAudioSlotToRequestor: removeRequestForVideoSlot: removeRequestForVideoSlot timePassed/waitingTime', timePassed, waitingTime)

                    if (timePassed < waitingTime) {
                        timeDiff = waitingTime - timePassed;
                    }
                    break;
                }
            }
            log('giveVideoAndAudioSlotToRequestor: removeRequestForVideoSlot: removeRequestForVideoSlot: timeDiff', timeDiff)

            return {
                queueItem: queueItem,
                timeDiff: timeDiff
            }
        }

        let reserveThisAudioSlotForNextUserInQueue = function(nextItemInMicQueue) {
            let userWhoJustGotAudioAndVideoSlots = userWhoRequestedAudioAndVideoSlots;
            userWhoJustGotAudioAndVideoSlots.micRequestCountdown.userWhoRequested = nextItemInMicQueue.participant;
            userWhoJustGotAudioAndVideoSlots.micRequestCountdown.queueItem = nextItemInMicQueue;
            userWhoJustGotAudioAndVideoSlots.micRequestCountdown.timer = setTimeout(function () {
                log('giveVideoAndAudioSlotToRequestor: force timer end 785')
                socket.to(nspName + '#' + userWhoJustGotAudioAndVideoSlots.id).emit('Streams/webrtc/forceTurnMicOff');
            }, socket.webrtcRoom.limits.minimalTimeOfUsingSlot);

            nextItemInMicQueue.userThatWillGiveSlot = userWhoJustGotAudioAndVideoSlots;
        }

        let reserveThisVideoSlotForNextUserInQueue = function(nextItemInCameraQueue, withoutTimer) {
            let userWhoJustGotAudioAndVideoSlots = userWhoRequestedAudioAndVideoSlots;
            userWhoJustGotAudioAndVideoSlots.cameraRequestCountdown.userWhoRequested = nextItemInCameraQueue.participant;
            userWhoJustGotAudioAndVideoSlots.cameraRequestCountdown.queueItem = nextItemInCameraQueue;

            //if user will be supposed to turn off mic to make available video(avatar) slot for nextuser
            //so no need to create second timer as it was already created in reserveThisAudioSlotForNextUserInQueue
            if (!withoutTimer) {
                userWhoJustGotAudioAndVideoSlots.cameraRequestCountdown.timer = setTimeout(function () {
                    log('giveVideoAndAudioSlotToRequestor: force timer end 3452')
                    socket.to(nspName + '#' + userWhoJustGotAudioAndVideoSlots.id).emit('Streams/webrtc/forceTurnCameraOff');
                }, socket.webrtcRoom.limits.minimalTimeOfUsingSlot);
            }
            nextItemInCameraQueue.userThatWillGiveSlot = userWhoJustGotAudioAndVideoSlots;
        }

        //if there is next user in queue, limit provided time for user who was just provided with mic slot and, when the time will end, give his mic slot to the next user

        let videoRequestQueueItem = removeRequestForVideoSlot();
        let audioRequestQueueItem = removeRequestForMicSlot();
        
        let nextItemInMicQueue = getNextUserFromMicRequestsQueue();
        let nextItemInCameraQueue = getNextUserFromCameraRequestsQueue();
        let requestType;
        if( videoRequestQueueItem.queueItem ) {
            requestType = videoRequestQueueItem.queueItem.requestType;
        } else if(audioRequestQueueItem.queueItem) {
            requestType = audioRequestQueueItem.queueItem.requestType;
        }
        log('giveVideoAndAudioSlotToRequestor: requestType=' + requestType);

        if (requestType == 'canITurnMicOn') {
            log('giveVideoAndAudioSlotToRequestor: requestType=canITurnMicOn');

            let newAvatarTrack = new WebRTC.Track('videoavatar');
            userWhoRequestedAudioAndVideoSlots.tracks.push(newAvatarTrack);
            let newTrack = new WebRTC.Track('audio');
            userWhoRequestedAudioAndVideoSlots.tracks.push(newTrack);

            //allow user to turn mic on
            socket.to(nspName + '#' + userWhoRequestedAudioAndVideoSlots.id).emit('Streams/webrtc/canITurnMicOn', {
                type: 'answer',
                answerValue: true,
                timeProvided: nextItemInMicQueue || nextItemInCameraQueue ? socket.webrtcRoom.limits.minimalTimeOfUsingSlot : null,
                limit: socket.webrtcRoom.limits.audio
            });
            if(nextItemInMicQueue != null || nextItemInCameraQueue != null) reserveThisAudioSlotForNextUserInQueue(nextItemInMicQueue)
            if(nextItemInCameraQueue != null) reserveThisVideoSlotForNextUserInQueue(nextItemInCameraQueue, true)
        } else if (requestType == 'canITurnCameraOn') {
            log('giveVideoAndAudioSlotToRequestor: requestType=canITurnCameraOn');

            let newAvatarTrack = new WebRTC.Track('video');
            userWhoRequestedAudioAndVideoSlots.tracks.push(newAvatarTrack);
            //allow user to turn mic on
            socket.to(nspName + '#' + userWhoRequestedAudioAndVideoSlots.id).emit('Streams/webrtc/canITurnCameraOn', {
                type: 'answer',
                answerValue: true,
                timeProvided: nextItemInCameraQueue ? socket.webrtcRoom.limits.minimalTimeOfUsingSlot : null,
                limit: socket.webrtcRoom.limits.audio
            });
            if(nextItemInCameraQueue != null) reserveThisVideoSlotForNextUserInQueue(nextItemInCameraQueue)

        } else if (requestType == 'canITurnCameraAndMicOn') {
            log('giveVideoAndAudioSlotToRequestor: requestType=canITurnCameraAndMicOn');

            let newAvatarTrack = new WebRTC.Track('video');
            userWhoRequestedAudioAndVideoSlots.tracks.push(newAvatarTrack);
            let newTrack = new WebRTC.Track('audio');
            userWhoRequestedAudioAndVideoSlots.tracks.push(newTrack);
            //allow user to turn mic on
            socket.to(nspName + '#' + userWhoRequestedAudioAndVideoSlots.id).emit('Streams/webrtc/canITurnCameraAndMicOn', {
                type: 'answer',
                answerValue: true,
                timeProvidedForAudio: nextItemInMicQueue ? socket.webrtcRoom.limits.minimalTimeOfUsingSlot : null,
                timeProvidedForVideo: nextItemInCameraQueue ? socket.webrtcRoom.limits.minimalTimeOfUsingSlot : null,
                limit: socket.webrtcRoom.limits.audio
            });
            if(nextItemInMicQueue != null) reserveThisAudioSlotForNextUserInQueue(nextItemInMicQueue)
            if(nextItemInCameraQueue != null) reserveThisVideoSlotForNextUserInQueue(nextItemInCameraQueue)
        }

        //recalculate all timers for other users (for example, when user disabled his mic before he was forced to do it)
        recalculateAllMicTimers(audioRequestQueueItem.timeDiff);
        recalculateAllCameraTimers(videoRequestQueueItem.timeDiff);

        socket.emit('Streams/webrtc/cancelForceTurnMicOffTimer');
        socket.emit('Streams/webrtc/cancelForceTurnCameraOffTimer');

        if (socket.webrtcParticipant.micRequestCountdown.timer) clearTimeout(socket.webrtcParticipant.micRequestCountdown.timer);
        socket.webrtcParticipant.micRequestCountdown.timer = null;
        socket.webrtcParticipant.micRequestCountdown.userWhoRequested = null;
        socket.webrtcParticipant.micRequestCountdown.queueItem = null;

        if (socket.webrtcParticipant.cameraRequestCountdown.timer) clearTimeout(socket.webrtcParticipant.cameraRequestCountdown.timer);
        socket.webrtcParticipant.cameraRequestCountdown.timer = null;
        socket.webrtcParticipant.cameraRequestCountdown.userWhoRequested = null;
        socket.webrtcParticipant.cameraRequestCountdown.queueItem = null;
    }

    function giveAudioSlotToNextUser() {
        log('giveAudioSlotToNextUser START')

        //if the user who disabled mic was the one who used mic most of all (this user should be forced to disable mic),
        //give his mic slot to the user who requested at that time
        if (socket.webrtcParticipant.micRequestCountdown.queueItem && socket.webrtcParticipant.micRequestCountdown.queueItem.requestType == 'canITurnMicOn') {
            log('giveAudioSlotToNextUser if1', socket.webrtcParticipant.id)

            let giveMicTo = socket.webrtcParticipant.micRequestCountdown.userWhoRequested;

            let queueItem;
            for (let i = socket.webrtcRoom.micRequestsQueue.length - 1; i >= 0; i--) {
                if (giveMicTo == socket.webrtcRoom.micRequestsQueue[i].participant) {
                    queueItem = socket.webrtcRoom.micRequestsQueue[i];
                    break;
                }
            }

            let allowUserToTurnMicOn = function () {
                log('giveAudioSlotToNextUser if1: allowUserToTurnMicOn')

                //remove user who will be given mic slot from queue
                let timeDiff = 0;
                for (let i = socket.webrtcRoom.micRequestsQueue.length - 1; i >= 0; i--) {
                    if (giveMicTo == socket.webrtcRoom.micRequestsQueue[i].participant) {
                        let queueItem = socket.webrtcRoom.micRequestsQueue.splice(i, 1)[0];

                        //determine if user will get mic slot earlier than was supposed to get
                        //and if user who turned mic off did it earlier than was supposed to do
                        let waitingTime = queueItem.waitingTime;
                        let timeAdded = queueItem.timeAdded;
                        let timePassed = (Date.now() - timeAdded);
                        log('giveAudioSlotToNextUser if1 timePassed/waitingTime', timePassed, waitingTime)

                        if (timePassed < waitingTime) {
                            timeDiff = waitingTime - timePassed;
                        }
                        break;
                    }
                }
                log('giveAudioSlotToNextUser if1 giveCameraTo', giveMicTo.id)
                log('giveAudioSlotToNextUser if1 timeDiff', timeDiff)

                //if there is next user in queue, limit provided time for user who was just provided with mic slot and, when the time will end, give his mic slot to the next user
                let nextUserInQueue = getNextUserFromMicRequestsQueue();

                //allow user to turn mic on
                socket.to(nspName + '#' + giveMicTo.id).emit('Streams/webrtc/canITurnMicOn', { type: 'answer', answerValue: true, timeProvided: nextUserInQueue ? socket.webrtcRoom.limits.minimalTimeOfUsingSlot : null, limit: socket.webrtcRoom.limits.audio });

                log('giveAudioSlotToNextUser if1 nextUserInQueue!=null', nextUserInQueue != null)
                if (nextUserInQueue) {
                    giveMicTo.micRequestCountdown.userWhoRequested = nextUserInQueue.participant;
                    giveMicTo.micRequestCountdown.queueItem = nextUserInQueue;
                    giveMicTo.micRequestCountdown.timer = setTimeout(function () {
                        log('canITurnMicOn: force timer end 33')
                        socket.to(nspName + '#' + giveMicTo.id).emit('Streams/webrtc/forceTurnMicOff');
                    }, socket.webrtcRoom.limits.minimalTimeOfUsingSlot);

                    nextUserInQueue.userThatWillGiveSlot = giveMicTo;
                }

                //recalculate all timers for other users (for example, when user disabled his mic before he was forced to do it)
                recalculateAllMicTimers(timeDiff);
            }

            let removeRequestForVideoAvatarSlot = function () {
                log('giveAudioSlotToNextUser if1: removeRequestForVideoAvatarSlot')

                //remove user who will be given video(avatar) slot from queue
                let timeDiff = 0;
                for (let i = socket.webrtcRoom.cameraRequestsQueue.length - 1; i >= 0; i--) {
                    if (giveMicTo == socket.webrtcRoom.cameraRequestsQueue[i].participant) {
                        let queueItem = socket.webrtcRoom.cameraRequestsQueue.splice(i, 1)[0];

                        //determine if user will get mic slot earlier than was supposed to get
                        //and if user who turned mic off did it earlier than was supposed to do
                        let waitingTime = queueItem.waitingTime;
                        let timeAdded = queueItem.timeAdded;
                        let timePassed = (Date.now() - timeAdded);
                        log('giveAudioSlotToNextUser if1: removeRequestForVideoAvatarSlot timePassed/waitingTime', timePassed, waitingTime)

                        if (timePassed < waitingTime) {
                            timeDiff = waitingTime - timePassed;
                        }
                        break;
                    }
                }
                log('giveAudioSlotToNextUser if1: removeRequestForVideoAvatarSlot: timeDiff', timeDiff)
            }

            log('giveAudioSlotToNextUser if1: queueItem', queueItem != null)


            if (queueItem.linkedToParallelVideoRequest) {
                let newAvatarTrack = new WebRTC.Track('videoavatar');
                giveMicTo.tracks.push(newAvatarTrack);
                removeRequestForVideoAvatarSlot();
                let newTrack = new WebRTC.Track('audio');
                giveMicTo.tracks.push(newTrack);
                allowUserToTurnMicOn();
            } else {
                log('giveAudioSlotToNextUser if1: user has some videotracks')

                let newTrack = new WebRTC.Track('audio');
                giveMicTo.tracks.push(newTrack);
                allowUserToTurnMicOn();
            }

            socket.emit('Streams/webrtc/cancelForceTurnMicOffTimer');

            if (socket.webrtcParticipant.micRequestCountdown.timer) clearTimeout(socket.webrtcParticipant.micRequestCountdown.timer);
            socket.webrtcParticipant.micRequestCountdown.timer = null;
            socket.webrtcParticipant.micRequestCountdown.userWhoRequested = null;
            socket.webrtcParticipant.micRequestCountdown.queueItem = null;

        } else {
            log('giveAudioSlotToNextUser if2')
            //if someone disabled before the time when the former user should be forced to turn his mic off, give his mic slot
            //to the next user in queue of mic requests
            let firstUserInQueue = socket.webrtcRoom.micRequestsQueue[socket.webrtcRoom.micRequestsQueue.length - 1];

            if (!firstUserInQueue) return;

            var removeItemFromQueue = function () {
                let timeDiff;
                for (let i = socket.webrtcRoom.micRequestsQueue.length - 1; i >= 0; i--) {
                    if (firstUserInQueue == socket.webrtcRoom.micRequestsQueue[i]) {
                        socket.webrtcRoom.micRequestsQueue.splice(i, 1)[0];

                        //determine if user will get mic slot earlier than was supposed to get
                        let waitingTime = firstUserInQueue.waitingTime;
                        let timeAdded = firstUserInQueue.timeAdded;
                        let timePassed = (Date.now() - timeAdded);
                        log('giveAudioSlotToNextUser if2 timePassed/waitingTime', timePassed, waitingTime)

                        //determine how much earlier user wil get mic slot
                        if (timePassed < waitingTime) {
                            timeDiff = waitingTime - timePassed;
                        }
                        break;
                    }
                }

                return timeDiff;
            }

            let reserveThisAudioSlotForNextUserInQueue = function (nextItemInMicQueue) {
                log('giveAudioSlotToNextUser if2: reserveThisAudioSlotForNextUserInQueue')
                let userWhoJustGotMicSlot = firstUserInQueue;
                userWhoJustGotMicSlot.participant.micRequestCountdown.userWhoRequested = nextItemInMicQueue.participant;
                userWhoJustGotMicSlot.participant.micRequestCountdown.queueItem = nextItemInMicQueue;
                userWhoJustGotMicSlot.participant.micRequestCountdown.timer = setTimeout(function () {
                    log('canITurnMicOn: force timer end 22')
                    socket.to(nspName + '#' + userWhoJustGotMicSlot.participant.id).emit('Streams/webrtc/forceTurnMicOff');
                }, socket.webrtcRoom.limits.minimalTimeOfUsingSlot);

                nextItemInMicQueue.userThatWillGiveSlot = userWhoJustGotMicSlot.participant;
            }

            //add track to the rom to occupy audio slot
            let newTrack = new WebRTC.Track('audio');
            firstUserInQueue.participant.tracks.push(newTrack);

            let timeDiff = removeItemFromQueue();

            if (!firstUserInQueue.participant.pendingVideoSlotRequest()) {
                //allow first user in queue to turn mic on
                socket.to(nspName + '#' + firstUserInQueue.participant.id).emit('Streams/webrtc/' + firstUserInQueue.requestType, { answerValue: true, limit: socket.webrtcRoom.limits.audio });

                //if there is one more next user in queue, limit provided time for user who was just provided with mic slot and, when the time will end, give his mic slot to the next user
                var nextUserInQueue = getNextUserFromMicRequestsQueue();
                if (nextUserInQueue) reserveThisAudioSlotForNextUserInQueue(nextUserInQueue);
                //recalculate all timers for other users (for example, when user disabled his mic before he was forced to do it)
                recalculateAllMicTimers(timeDiff);
            }

            //if the firstUserInQueue has the user who was supposed to give his mic slot to him (userThatWillGiveSlot), change user for userThatWillGiveSlot or cancel all timers if no next user
            if (firstUserInQueue.userThatWillGiveSlot) {
                log('giveAudioSlotToNextUser if2.1')
                let nextUserInQueue = getNextUserFromMicRequestsQueue();

                if (nextUserInQueue) {
                    log('giveAudioSlotToNextUser if2.1.1')
                    //if there are still users in queue of mic requests, take next user in queue and assign him to the timer of user who uses mic the most of all
                    firstUserInQueue.userThatWillGiveSlot.micRequestCountdown.userWhoRequested = nextUserInQueue.participant;
                    firstUserInQueue.userThatWillGiveSlot.micRequestCountdown.queueItem = nextUserInQueue;
                    nextUserInQueue.userThatWillGiveSlot = firstUserInQueue.userThatWillGiveSlot;
                } else {
                    log('giveAudioSlotToNextUser if2.1.2')

                    if (firstUserInQueue.userThatWillGiveSlot.micRequestCountdown.timer) clearTimeout(firstUserInQueue.userThatWillGiveSlot.micRequestCountdown.timer);
                    firstUserInQueue.userThatWillGiveSlot.micRequestCountdown.timer = null;
                    firstUserInQueue.userThatWillGiveSlot.micRequestCountdown.userWhoRequested = null;
                    firstUserInQueue.userThatWillGiveSlot.micRequestCountdown.queueItem = null;

                    socket.to(nspName + '#' + firstUserInQueue.userThatWillGiveSlot.id).emit('Streams/webrtc/cancelForceTurnMicOffTimer');

                }
            }
        }
    }

    function recalculateAllMicTimers(timeDiff) {
        for (let q in socket.webrtcRoom.micRequestsQueue) {
            let queueItem = socket.webrtcRoom.micRequestsQueue[q];
            let timeAdded = queueItem.timeAdded;
            let waitingTime = queueItem.waitingTime;
            let timePassed = Date.now() - timeAdded;

            let newWaitingTime = (waitingTime - timePassed) - timeDiff;
            let emitMsg = {
                fromSid: queueItem.participant.id,
                waitingTime: newWaitingTime
            }
            socket.to(socket.webrtcRoom.id).emit('Streams/webrtc/requestMic', emitMsg);
        }
    }

    //if someone enabled camera
    socket.on('Streams/webrtc/cameraEnabled', function () {
        if (!socket.webrtcRoom) return;
        log('cameraEnabled')

        socket.to(socket.webrtcRoom.id).emit('Streams/webrtc/cameraEnabled', {
            fromSid: socket.webrtcParticipant.id,
        });
        socket.emit('Streams/webrtc/cameraEnabled', {
            fromSid: socket.webrtcParticipant.id,
        });

    });

    //if someone enabled mic
    socket.on('Streams/webrtc/micEnabled', function () {
        if (!socket.webrtcRoom) return;
        log('micEnabled')

        socket.to(socket.webrtcRoom.id).emit('Streams/webrtc/micEnabled', {
            fromSid: socket.webrtcParticipant.id,
        });
        socket.emit('Streams/webrtc/micEnabled', {
            fromSid: socket.webrtcParticipant.id,
        });
    });

    socket.on('Streams/webrtc/cameraRequestCanceled', function () {
        if (!socket.webrtcRoom) return;
        log('cameraRequestCanceled')

        //remove user from queue of camera slot requests
        for (let i = socket.webrtcRoom.cameraRequestsQueue.length - 1; i >= 0; i--) {
            if (socket.webrtcParticipant == socket.webrtcRoom.cameraRequestsQueue[i].participant) {
                socket.webrtcRoom.cameraRequestsQueue.splice(i, 1);
            }
        }


        var participants = socket.webrtcRoom.getParticipants();
        for (let p in participants) {
            if (participants[p].cameraRequestCountdown.userWhoRequested != socket.webrtcParticipant) continue;
            log('cameraDisabled if2.1')

            let nextUserInQueue = socket.webrtcRoom.cameraRequestsQueue.length != 0 ? socket.webrtcRoom.cameraRequestsQueue[0] : null;
            if (nextUserInQueue) {
                log('cameraDisabled if2.1.1')
                participants[p].cameraRequestCountdown.userWhoRequested = nextUserInQueue.participant;
                participants[p].cameraRequestCountdown.queueItem = nextUserInQueue;
            } else {
                log('cameraDisabled if2.1.2')

                if (participants[p].cameraRequestCountdown.timer) clearTimeout(participants[p].cameraRequestCountdown.timer);
                participants[p].cameraRequestCountdown.timer = null;
                participants[p].cameraRequestCountdown.userWhoRequested = null;
                participants[p].cameraRequestCountdown.queueItem = null;

                socket.to(nspName + '#' + participants[p].id).emit('Streams/webrtc/cancelForceTurnCameraOffTimer');

            }

            break;

        }

        socket.broadcast.to(socket.webrtcRoom.id).emit('Streams/webrtc/cameraRequestCanceled', {
            fromSid: socket.webrtcParticipant.id,
        });
        socket.emit('Streams/webrtc/cameraRequestCanceled', {
            fromSid: socket.webrtcParticipant.id,
        });
    });

    socket.on('Streams/webrtc/participantDisconnected', function () {
        log('participantDisconnected')
        //socket.webrtcRoom.event.dispatch('participantDisconnected');
    });

    socket.on('Streams/webrtc/participantConnected', function (participant) {
        log('participantConnected', participant)
        //socket.webrtcRoom.event.dispatch('participantConnected');
    });

    socket.on('disconnect', function () {
        log('disconnect');
        if (!socket.webrtcRoom) return;
        if (socket.webrtcParticipant.id == socket.client.id) {
            log('disconnect socket.webrtcParticipant.id != socket.client.id', socket.webrtcParticipant.id, socket.client.id)
            socket.webrtcParticipant.online = false;
            socket.webrtcRoom.event.dispatch('participantDisconnected', socket.webrtcParticipant);
        }
        for (let i = socket.webrtcRoom.cameraRequestsQueue.length - 1; i >= 0; i--) {
            if (socket.webrtcParticipant == socket.webrtcRoom.cameraRequestsQueue[i].participant) {
                socket.webrtcRoom.cameraRequestsQueue.splice(i, 1);
            }
        }
        for (let i = socket.webrtcRoom.micRequestsQueue.length - 1; i >= 0; i--) {
            if (socket.webrtcParticipant == socket.webrtcRoom.micRequestsQueue[i].participant) {
                socket.webrtcRoom.micRequestsQueue.splice(i, 1);
            }
        }
        io.of('/webrtc').in(socket.webrtcRoom.id).clients(function (error, clients) {
            log('disconnect: before close room')
            if (clients.length == 0) socket.webrtcRoom.close();
        });
    });

    function log(text) {
        if(!_debug) return;
        var args = Array.prototype.slice.call(arguments);
        var params = [];

        if (performance) {
            var now = (performance.now() / 1000).toFixed(3);
            params.push(now + ": " + args.splice(0, 1));
            params = params.concat(args);
            console.log.apply(console, params);
        } else {
            params.push(text);
            params = params.concat(args);
            console.log.apply(console, params);
        }
    }
}