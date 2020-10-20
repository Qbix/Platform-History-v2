const Q = require('Q');
const child_process = require('child_process');
const ffmpegPath = '/usr/local/bin/ffmpeg';
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const { StreamInput } = require('fluent-ffmpeg-multistream')
const { createCanvas, createImageData } = require('canvas');
const Canvas = require('canvas');
const http = require('http');
const https = require('https');
const { join } = require('path');
const WebRtcConnectionManager = require('./webrtcconnectionmanager');
const layoutGenerator = require('./layoutGenerator');
const { PassThrough } = require('stream');
const { RTCAudioSink, RTCVideoSink, RTCVideoSource, i420ToRgba, rgbaToI420 } = require('wrtc').nonstandard;
const Streams_Avatar = Q.require('Streams/Avatar');
const Users = Q.require('Users');

const width = 640;
const height = 480;

module.exports = function(socket, io, rtmpUrl) {

    var _debug = Q.Config.get(['Streams', 'webrtc', 'debug'], false);
    var nspName = '/webrtc';
    var webrtcNamespace = io.of(nspName);
    var WebRTC =  Q.plugins.Streams.WebRTC;
    var roomPublisherId;
    var _streamingData = {
        url:rtmpUrl,
        video: new PassThrough(),
        audio: new PassThrough(),
        size: '640x480',
    }


    async function initPeerConnection(participant, connectionManager) {
        if(_debug) console.log('recording create connection 1', participant);

        try {
            let connection = await connectionManager.createConnection({beforeOffer: function (peerConnection) {
                    participant.RTCPeerConnection = peerConnection;
                    beforeOffer(peerConnection, participant)
                }});
            if(_debug) console.log('recording create connection 2', connection.id);

            webrtcNamespace.to(nspName + '#' + participant.id).emit('Streams/webrtc/recording', {initiatorId: socket.client.id, connection:connection});

        } catch (error) {
            console.error(error);
            console.log(error);
        }
    }

    function listenRoomEvents() {

        socket.webrtcParticipant.liveStreaming.room.event.on('participantDisconnected', function (participant) {
            if(socket.webrtcParticipant.liveStreaming.connectionManager != null) {
                console.log('participantDisconnected: set timeout 20s', participant.sid)

                /* socket.webrtcParticipant.closePCtimer = setTimeout(function () {
                     console.log('participantDisconnected: close peer connection 20s', participant.sid)
                     if(participant.RTCPeerConnection != null) participant.RTCPeerConnection.close();
                 }, 1000*20)*/
            } else {
                console.log('participantDisconnected: close peer connection', participant.sid)

                if(participant.RTCPeerConnection != null) participant.RTCPeerConnection.close();
            }

            socket.webrtcParticipant.liveStreaming.canvasComposer.updateCanvasLayout();
        });

        socket.webrtcParticipant.liveStreaming.room.event.on('participantConnected', function (participant) {
            console.log('event: participantConnected')
            initPeerConnection(participant, socket.webrtcParticipant.liveStreaming.connectionManager);
            socket.webrtcParticipant.liveStreaming.canvasComposer.updateCanvasLayout();
        });

        socket.webrtcParticipant.liveStreaming.room.event.on('trackAdded', function () {
            console.log('event: trackAdded')

            socket.webrtcParticipant.liveStreaming.canvasComposer.updateCanvasLayout();
        });
    }

    socket.on('Streams/webrtc/recording', function(message) {
        if(_debug) console.log('recording start', message, socket.client.id, socket.webrtcParticipant.id);
        if(socket.webrtcParticipant.liveStreaming.connectionManager != null) return;

        var connectionManager = WebRtcConnectionManager.create();

        for (var i in socket.webrtcRoom.participants) {
            if(!socket.webrtcRoom.participants[i].online) continue;
            initPeerConnection(socket.webrtcRoom.participants[i], connectionManager);
        }


       /* io.of('/webrtc').in(socket.webrtcRoom.id).clients(function (error, clients) {
            if(_debug) console.log(clients);
            for (var i in clients) {
                asyncCall(clients[i]);
            }
        });*/

        socket.webrtcParticipant.liveStreaming.connectionManager = connectionManager;
        socket.webrtcParticipant.liveStreaming.room = socket.webrtcRoom;
        socket.webrtcParticipant.liveStreaming.canvasComposer = canvasComposer(socket.webrtcRoom);

        listenRoomEvents();

        socket.webrtcParticipant.liveStreaming.canvasComposer.drawVideosOnCanvas();
        socket.webrtcParticipant.liveStreaming.canvasComposer.startStreaming(message.url);

    });

    socket.on('Streams/webrtc/roomSwitched', function(message) {
        if(_debug) console.log('roomSwitched', message);

        var fromRoomId = message.prevRoom;
        var toRoomId = socket.webrtcRoom.id;
        var fromSocketId = message.prevParticipantId;
        if(_debug) console.log('roomSwitched WebRTC.rooms', WebRTC.rooms.length);

        for(let r in WebRTC.rooms) {
            if(_debug) console.log('roomSwitched prev room id', fromRoomId, WebRTC.rooms[r].id);

            if(fromRoomId == WebRTC.rooms[r].id) {
                if(_debug) console.log('roomSwitched: prev room found', WebRTC.rooms[r].participants);

                for(let p in WebRTC.rooms[r].participants) {
                    if(_debug) console.log('roomSwitched: prev participant id', fromSocketId, WebRTC.rooms[r].participants[p].id);

                    if(fromSocketId == WebRTC.rooms[r].participants[p].id) {
                        if(_debug) console.log('roomSwitched: prev participant found', fromSocketId, WebRTC.rooms[r].participants[p].id);

                        socket.webrtcParticipant.liveStreaming = WebRTC.rooms[r].participants[p].liveStreaming;
                        socket.webrtcParticipant.online = false;
                        socket.webrtcParticipant = WebRTC.rooms[r].participants[p];
                        WebRTC.rooms[r].participants[p].id = socket.client.id;
                        WebRTC.rooms[r].participants[p].online = true;
                        socket.webrtcRoom.addParticipant(WebRTC.rooms[r].participants[p]);
                        break;
                    }
                }
                break;
            }
        }


        if(socket.webrtcParticipant.closePCtimer != null) {
            if(_debug) console.log('roomSwitched: clear closePCtimer');
            clearTimeout(socket.webrtcParticipant.closePCtimer);
            socket.webrtcParticipant.closePCtimer = null;
        }

        if(_debug) console.log('roomSwitched: liveStreaming exist = ', socket.webrtcParticipant.liveStreaming != null);
        if(socket.webrtcParticipant.liveStreaming.room == null) return;
        let prevRoomParticipants = socket.webrtcParticipant.liveStreaming.room.participants;
        for (let i in prevRoomParticipants) {
            if(_debug) console.log('roomSwitched: loop prev room participants #' + i, prevRoomParticipants[i].id);

            if(prevRoomParticipants[i].id != socket.client.id && prevRoomParticipants[i].RTCPeerConnection) {
                if(_debug) console.log('roomSwitched: switch room id', socket.client.id);

                if(_debug) console.log('roomSwitched: loop prev room participants: close PC ', prevRoomParticipants[i].id);

                if(prevRoomParticipants[i].RTCPeerConnection) prevRoomParticipants[i].RTCPeerConnection.close();
            } else if(prevRoomParticipants[i].id == socket.client.id) {
                if(_debug) console.log('roomSwitched: loop prev room participants: save initiator PC', prevRoomParticipants[i].id);

                //socket.webrtcParticipant.RTCPeerConnection = prevRoomParticipants[i].RTCPeerConnection;
            }

        }

        if(_debug) console.log('roomSwitched: liveStreaming: update room');
        socket.webrtcParticipant.liveStreaming.room = socket.webrtcRoom;
        listenRoomEvents();
        socket.webrtcParticipant.liveStreaming.canvasComposer.switchRoom(socket.webrtcRoom, fromSocketId);

        if(_debug) console.log('roomSwitched: init PC with rest participants');
        let participants = socket.webrtcRoom.participants;
        for (let i in participants) {
            if(_debug) console.log('roomSwitched: init PC with rest participants', participants[i].id);
            if(participants[i].id == socket.client.id) continue;
            if(_debug) console.log('roomSwitched: init PC with rest participants 2');
            initPeerConnection(participants[i], socket.webrtcParticipant.liveStreaming.connectionManager);
        }
        //socket.webrtcParticipant.liveStreaming.connectionManager = WebRtcConnectionManager.create();
    });

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
        log('participantDisconnected')
        //socket.webrtcRoom.event.dispatch('participantDisconnected');
    });

    socket.on('Streams/webrtc/participantConnected', function(participant) {
        log('participantConnected', participant)
        //socket.webrtcRoom.event.dispatch('participantConnected');
    });

    socket.on('Streams/webrtc/signalling', function(message) {
        if(_debug) console.log('server2clientWebRTC: SIGNALLING MESSAGE', message.type, message.name, message.targetSid, socket.client.id);
        message.fromSid = socket.client.id;
        if(message.type == 'offer') message.info = socket.info;

        if(message.targetSid == 'recording' && message.type != 'candidate') {
            let connectionManager = null;
            if (_debug) console.log('SIGNALLING MESSAGE:  socket.webrtcRoom', socket.webrtcRoom);

            for(let r in socket.webrtcRoom.participants) {
                let participant = socket.webrtcRoom.participants[r];
                if (_debug) console.log('SIGNALLING MESSAGE: connectionManager', participant.id, message.connection.initiatorId,  participant);

                if(participant.id == message.connection.initiatorId) {
                    if (_debug) console.log('SIGNALLING MESSAGE: connectionManager = ', participant.liveStreaming.connectionManager);

                    connectionManager = participant.liveStreaming.connectionManager;
                }
            }

            if (_debug) console.log('SIGNALLING MESSAGE: connectionManager exists ', connectionManager);


            let connectionInfo = message.connection;

            if(message.type == 'offer') {
                async function asyncCall(connectionManager, connectionInfo) {
                    if (_debug) console.log('SIGNALLING MESSAGE: OFFER TO CONNECTION', connectionInfo.connectionId);
                    if (_debug) console.log('SIGNALLING MESSAGE: OFFER TO RECORDING');

                    let connectionid = message.connection.connectionId;
                    const connection = connectionManager.getConnection(connectionid);
                    if (!connection) {
                        if (_debug) console.log('SIGNALLING MESSAGE: OFFER TO RECORDING: NO CONNECTION');
                        return;
                    }
                    try {
                        await connection.applyOffer(message).then(function (answer) {
                            answer.fromSid = 'recording';
                            if (_debug) console.log('SIGNALLING MESSAGE: OFFER TO RECORDING: APPLY OFFER');
                            if (_debug) console.log('SIGNALLING MESSAGE: OFFER TO RECORDING: APPLY OFFER: SEND TO', nspName + '#' + socket.client.id, message.fromSid);

                            socket.emit('Streams/webrtc/signalling', answer);
                        });

                        //res.send(connection.toJSON().remoteDescription);
                        //socket.to(nspName + '#' + socket.client.id).emit('Streams/webrtc/signalling', message);

                    } catch (error) {
                        if (_debug) console.log('SIGNALLING MESSAGE: OFFER TO RECORDING: ERROR', error);
                    }
                }

                asyncCall(connectionManager, connectionInfo);
            } else if (message.type == 'answer') {
                async function asyncCall(connectionManager, connectionInfo) {
                    if (_debug) console.log('SIGNALLING MESSAGE: ANSWER TO CONNECTION', connectionInfo);
                    if (_debug) console.log('SIGNALLING MESSAGE: ANSWER TO RECORDING');
                    let id = connectionInfo.connectionId;
                    const connection = connectionManager.getConnection(id);
                    if (!connection) {
                        if (_debug) console.log('SIGNALLING MESSAGE: ANSWER TO RECORDING: NO CONNECTION');
                        return;
                    }
                    try {
                        await connection.applyAnswer(message.sdp);
                        if (_debug) console.log('SIGNALLING MESSAGE: ANSWER TO RECORDING: APPLY ANSWER');

                    } catch (error) {
                        if (_debug) console.log('SIGNALLING MESSAGE: ANSWER TO RECORDING: ERROR', error);
                    }
                }

                asyncCall(connectionManager, connectionInfo);
            }
            return
        }
    });

    socket.on('disconnect', function() {
        console.log('disconnect');
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

    function setUserNameAndAvatar(participant, callback) {
        if(participant.userPlatformId == null) return null;

        var name = {};
        Streams_Avatar.fetch(participant.userPlatformId, participant.userPlatformId, function (err, avatar) {
            if (err) {
                console.error(err);
            }
            name.avatar = {};
            if(avatar.fields.icon != null) {
                var src = Users.iconUrl(avatar.fields.icon, 400);
                const request = https.get((src.indexOf('http') == -1) ? 'https://' + src : src, function(response) {
                    var data = [];
                    response.on('data', function(chunk) {
                        data.push(chunk);
                    }).on('end', function() {
                        var buffer = Buffer.concat(data);
                        var img = new Canvas.Image; // Create a new Image
                        img.src = buffer;
                        name.avatar.image = img;
                    });
                });
            }

            name.fullName = '';
            if(avatar.fields.firstName != null) {
                name.firstName = avatar.fields.firstName;
                name.fullName += avatar.fields.firstName;
            }

            if(avatar.fields.lastName != null) {
                name.lastName = avatar.fields.lastName;
                name.fullName += avatar.fields.lastName;
            }

            if(callback != null) callback(name);

        });
    }
    var CanvasStream = function (sid) {
        this.kind = null;
        this.participant = sid;
        this.name = null;
        this.avatar = null;
        this.track = null;
        this.videoSink = {videoSink: null, lastFrame:null};
        this.lastFrameCanvas = null;
        this.lastFrameContext = null;
        this.screenSharing = false;
        this.rect = null;
    }

    var DOMRect = function (x, y, width, height) {
        this.x = x !== null ? x : null;
        this.y = y !== null ? y : null;
        this.width = width !== null ? width : null;
        this.height = height !== null ? height : null;
    };

    var _streams = [];
    var canvasComposer = function (roomInstance) {
        var _roomInstance = roomInstance;
        var _canvasSize = {width: 1280, height: 768};
        var _commonCanvas = createCanvas(_canvasSize.width, _canvasSize.height);
        var _commonContext = _commonCanvas.getContext('2d', { pixelFormat: 'RGBA24' });


        /*function updateCanvasLayout() {
            console.log('canvas: updateCanvasLayout');
            var layoutRects = layoutGenerator('tiledHorizontalMobile', _streams.length);
            for(let i = 0; i < _streams.length; i++) {
                _streams[i].rect = layoutRects[i];
            }
        }*/

        function log(text) {
            if(_debug === false) return;
            var args = Array.prototype.slice.call(arguments);
            var params = [];

            //params.push(text);
            params = params.concat(args);
            console.log.apply(console, params);
        }

        function requestAnimationFrame(f){return setTimeout(f, 1000/60)}

        function moveit(timestamp, rectToUpdate, distRect, startPositionRect, duration, starttime, a){
            var timestamp = timestamp || new Date().getTime()
            var runtime = timestamp - starttime
            var progress = runtime / duration;
            progress = Math.min(progress, 1);

            rectToUpdate.y = startPositionRect.y + (distRect.y - startPositionRect.y) * progress;
            rectToUpdate.x = startPositionRect.x + (distRect.x - startPositionRect.x) * progress;
            rectToUpdate.width = startPositionRect.width + (distRect.width - startPositionRect.width) * progress;
            rectToUpdate.height = startPositionRect.height + (distRect.height - startPositionRect.height) * progress;
            if (runtime < duration){
                requestAnimationFrame(function(timestamp){
                    moveit(timestamp, rectToUpdate, distRect, startPositionRect, duration, starttime, a)
                })
            } else {
                rectToUpdate.y = distRect.y;
                rectToUpdate.x = distRect.x;
                rectToUpdate.width = distRect.width;
                rectToUpdate.height = distRect.height;
            }
        }

        function updateCanvasLayout() {
            log('updateCanvasLayout start')

            var tracksToAdd = [];
            var tracksToRemove = [];


            var participants = _roomInstance.getParticipants();
            log('updateCanvasLayout length', participants.length)

            var renderScreenSharingLayout = false;
            for(var v in participants) {
                log('updateCanvasLayout participant', v, participants[v].id, participants[v].tracks.length)

                let renderedTracks = [];
                for (let j in _streams) {
                    log('updateCanvasLayout renderedTracks for', _streams[j].participant.id, participants[v].id, _streams[j].participant == participants[v], _streams[j].participant.id == participants[v].id)

                    if(_streams[j].participant.id == participants[v].id) {
                        //log('updateCanvasLayout rendered for', _streams[j])

                        renderedTracks.push(_streams[j])
                    }
                }

                log('updateCanvasLayout renderedTracks', renderedTracks)


                if(participants[v].online == false) {
                    tracksToRemove = tracksToRemove.concat(renderedTracks);
                    continue;
                }


                let vTracks = participants[v].videoTracks(true);
                let aTracks = participants[v].audioTracks();
                log('updateCanvasLayout p tracks', vTracks.length, aTracks.length)

                /*vTracks = vTracks.filter(function (o) {
                    return o.parentScreen.isActive;
                });*/
                log('updateCanvasLayout vTracks', vTracks.length)

                /*let audioIsEnabled = participants[v].isLocal ? app.conferenceControl.micIsEnabled() : participants[v].audioIsMuted != true;

                log('updateCanvasLayout audioIsEnabled', audioIsEnabled)*/


                if(vTracks.length != 0) {
                    log('updateCanvasLayout vTracks != 0')

                    for (let s in vTracks) {
                        log('updateCanvasLayout v track', vTracks[s])

                        let trackCurrentlyRendered = false;
                        for (let c in renderedTracks) {
                            //log('updateCanvasLayout trackCurrentlyRendered', vTracks[s], renderedTracks[c].track)

                            if(vTracks[s] == renderedTracks[c].track)  {
                                trackCurrentlyRendered = true;
                                break;
                            }
                        }

                        /*if(vTracks[s].screensharing) {
                            renderScreenSharingLayout = true;

                            if(!_isActive && vTracks[s].trackEl.videoWidth !== 0 && vTracks[s].trackEl.videoHeight !== 0) {
                                setCanvasSize(vTracks[s].trackEl.videoWidth, vTracks[s].trackEl.videoHeight)
                            } else if (!_isActive) {
                                vTracks[s].trackEl.addEventListener('loadedmetadata', function (e) {
                                    setCanvasSize(e.target.videoWidth, e.target.videoHeight)
                                });
                            }
                        }*/
                        log('updateCanvasLayout trackCurrentlyRendered', trackCurrentlyRendered)

                        if(!trackCurrentlyRendered) {
                            log('updateCanvasLayout !trackCurrentlyRendered')

                            if(vTracks.length > 1) {
                                log('updateCanvasLayout !trackCurrentlyRendered if1')

                                /*let z;
                                for(z = renderedTracks.length - 1; z >= 0 ; z--){
                                    if(renderedTracks[z].kind == 'video') {
                                        let currentTracks = renderedTracks.splice(z, 1);
                                        tracksToRemove = tracksToRemove.concat(currentTracks);
                                        tracksToAdd = tracksToAdd.concat(currentTracks);
                                    }
                                }*/

                                let videoSink = new RTCVideoSink(vTracks[s].mediaStreamTrack);
                                let canvasStream = new CanvasStream(socket);
                                canvasStream.kind = 'video';
                                canvasStream.track = vTracks[s];
                                canvasStream.videoSink = {videoSink: vTracks[s].videoSink};
                                canvasStream.participant = participants[v];
                                if (vTracks[s].screensharing == true) canvasStream.screenSharing = true;

                                videoSink.addEventListener('frame', function ({ frame }) {
                                    canvasStream.videoSink.lastFrame = frame;
                                    _streamingData.size = frame.width + 'x' + frame.height;
                                });

                                tracksToAdd.push(canvasStream)

                            } else {
                                log('updateCanvasLayout !trackCurrentlyRendered else')

                                let z, replacedAudioTrack = false;
                                for(z = renderedTracks.length - 1; z >= 0 ; z--){
                                    //log('updateCanvasLayout !trackCurrentlyRendered renderedTracks[z]', renderedTracks[z])

                                    if(renderedTracks[z].kind == 'audio') {
                                        let videoSink = new RTCVideoSink(vTracks[s].mediaStreamTrack);
                                        renderedTracks[z].kind = 'video';
                                        renderedTracks[z].track = vTracks[s];
                                        renderedTracks[z].videoSink = {videoSink: vTracks[s].videoSink};
                                        if (vTracks[s].screensharing == true) renderedTracks[z].screenSharing = true;
                                        renderedTracks[z].videoSink.videoSink.addEventListener('frame', function ({ frame }) {
                                            renderedTracks[z].videoSink.lastFrame = frame;
                                            _streamingData.size = frame.width + 'x' + frame.height;
                                        });
                                        replacedAudioTrack = true;
                                        break;
                                    }
                                }

                                log('updateCanvasLayout replacedAudioTrack', replacedAudioTrack)

                                if(!replacedAudioTrack) {
                                    let videoSink = new RTCVideoSink(vTracks[s].mediaStreamTrack);
                                    let canvasStream = new CanvasStream(participants[v]);
                                    canvasStream.kind = 'video';
                                    canvasStream.track = vTracks[s];
                                    canvasStream.videoSink = {videoSink: vTracks[s].videoSink};
                                    if (vTracks[s].screensharing == true) canvasStream.screenSharing = true;
                                    canvasStream.videoSink.videoSink.addEventListener('frame', function ({ frame }) {
                                        canvasStream.videoSink.lastFrame = frame;
                                        _streamingData.size = frame.width + 'x' + frame.height;

                                    });
                                    tracksToAdd.push(canvasStream)
                                }
                            }
                        } else {
                            continue;
                        }

                    }

                } else if (aTracks.length != 0/* && audioIsEnabled*/) {
                    log('updateCanvasLayout aTracks != 0')

                    let audioCurrentlyRendered = false;
                    for (let c in renderedTracks) {
                        if(renderedTracks[c].kind == 'audio')  {
                            audioCurrentlyRendered = true;
                            break;
                        }
                    }
                    if(audioCurrentlyRendered) continue;

                    let renderedVideoTracks = renderedTracks.filter(function (o) {
                        return o.kind == 'video';
                    })

                    if(renderedVideoTracks.length != 0) {
                        log('updateCanvasLayout aTracks: if1', renderedVideoTracks.length)

                        var newAudioTrack = renderedVideoTracks.splice(0, 1)[0];
                        log('updateCanvasLayout aTracks: if1 splice', renderedVideoTracks.length, tracksToRemove.length)

                        newAudioTrack.kind = 'audio';
                        newAudioTrack.track = null;
                        newAudioTrack.videoSink = null;
                        newAudioTrack.screenSharing = false;

                        tracksToRemove = tracksToRemove.concat(renderedVideoTracks);
                    } else {
                        log('updateCanvasLayout aTracks: if2')

                        let canvasStream = new CanvasStream(participants[v]);
                        canvasStream.kind = 'audio';
                        canvasStream.participant = participants[v];
                        canvasStream.name = participants[v].name;
                        canvasStream.avatar = participants[v].avatar;
                        tracksToAdd.push(canvasStream);
                    }
                }

                for (let x in renderedTracks) {

                    let trackIsLive = false;

                    if(renderedTracks[x].kind == 'video') {
                        for (let m in vTracks) {
                            if(renderedTracks[x].track == vTracks[m] && (renderedTracks[x].track.mediaStreamTrack.readyState == 'live')) {
                                log('updateCanvasLayout remove not active=false', renderedTracks[x].track.mediaStreamTrack.readyState)

                                trackIsLive = true;
                            }
                        }
                    } else {
                        /*if(audioIsEnabled) */trackIsLive = true;
                    }


                    if(!trackIsLive) tracksToRemove.push(renderedTracks[x]);
                }

            }
            log('updateCanvasLayout tracksToAdd, tracksToRemove', tracksToAdd.length, tracksToRemove.length)

            for(let r = _streams.length - 1; r >= 0 ; r--){
                let onlineInCurrentRoom = false;
                for(let p in participants) {
                    if(_streams[r].participant.id == participants[p].id) {
                        onlineInCurrentRoom = true;
                    }
                }
                if(!onlineInCurrentRoom) {
                    log('updateCanvasLayout prevRoom: remote prev room', _streams[r])

                    tracksToRemove.push(_streams[r])
                } else {
                    log('updateCanvasLayout prevRoom: else', _streams[r])
                }
            }

            var r;
            for(r = _streams.length - 1; r >= 0 ; r--){
                for(let n in tracksToRemove) {
                    if(_streams[r] == tracksToRemove[n]) {
                        _commonContext.clearRect(_streams[r].rect.x, _streams[r].rect.y, _streams[r].rect.width, _streams[r].rect.height);
                        _streams[r] = null;
                        _streams.splice(r, 1);
                    }
                    break;
                }
            }


            var layoutRects, streamsNum = _streams.concat(tracksToAdd).length;
            if(renderScreenSharingLayout) {
                layoutRects = layoutGenerator('screenSharing', streamsNum);
            } else {
                layoutRects = layoutGenerator('tiledHorizontalMobile', streamsNum);

            }

            log('updateCanvasLayout streamsNum', streamsNum)

            var streamsToUpdate = _streams.slice();
            var c = 0;

            var videoTracksOfUserWhoShares = [];
            var screenSharingIsNew = false;

            if(renderScreenSharingLayout) {
                log('updateCanvasLayout: renderScreenSharingLayout: sort streams')

                var getUsersTracks = function(participant, screenSharingStream) {

                    //add another screensharing of this participants to the beginning

                    for(let k = 0; k < tracksToAdd.length; k++){

                        if(tracksToAdd[k].participant != participant) continue;
                        if(tracksToAdd[k].screenSharing && tracksToAdd[k] != screenSharingStream) {
                            videoTracksOfUserWhoShares.push(tracksToAdd[k]);
                            tracksToAdd.splice(k, 1);
                        }
                    }

                    for(let k = 0; k < streamsToUpdate.length; k++){
                        if(streamsToUpdate[k].participant != participant) continue;
                        if(streamsToUpdate[k].screenSharing && streamsToUpdate[k] != screenSharingStream) {
                            videoTracksOfUserWhoShares.push(streamsToUpdate[k])
                            streamsToUpdate.splice(k, 1);
                        }
                    }

                    for(let k = 0; k < tracksToAdd.length; k++){
                        if(tracksToAdd[k].participant != participant) continue;

                        if(!tracksToAdd[k].screenSharing) {
                            videoTracksOfUserWhoShares.push(tracksToAdd[k])
                            tracksToAdd.splice(k, 1);
                        }
                    }

                    for(let k = 0; k < streamsToUpdate.length; k++){

                        if(streamsToUpdate[k].participant != participant) continue;

                        if(!streamsToUpdate[k].screenSharing) {
                            videoTracksOfUserWhoShares.push(streamsToUpdate[k])
                            streamsToUpdate.splice(k, 1);
                        }
                    }

                }

                for(r = 0; r < tracksToAdd.length; r++){
                    if(!tracksToAdd[r].screenSharing) continue;

                    let screenSharingStream = tracksToAdd[r];
                    tracksToAdd.splice(r, 1);
                    videoTracksOfUserWhoShares.push(screenSharingStream)

                    getUsersTracks(screenSharingStream.participant, screenSharingStream)
                    screenSharingIsNew = true;
                    break;
                }

                if(!screenSharingIsNew) {
                    for(let r = 0; r < streamsToUpdate.length; r++){
                        if(!streamsToUpdate[r].screenSharing) continue;

                        let screenSharingStream = streamsToUpdate[r];
                        streamsToUpdate.splice(r, 1);
                        videoTracksOfUserWhoShares.push(screenSharingStream)

                        getUsersTracks(screenSharingStream.participant, screenSharingStream)

                        break;
                    }
                }

                c = videoTracksOfUserWhoShares.length;

            }


            log('updateCanvasLayout layoutRects', layoutRects)

            log('updateCanvasLayout tracksToAdd', tracksToAdd)

            log('updateCanvasLayout streamsToUpdate', streamsToUpdate.length)

            for(let a = 0; a < tracksToAdd.length; a++){
                let rect = layoutRects[c];

                log('updateCanvasLayout add new tracks', rect)
                log('updateCanvasLayout add new tracks c', c)

                var startRect = new DOMRect(0, 0, 0, 0);
                tracksToAdd[a].rect = startRect;

                requestAnimationFrame(function(timestamp){
                    let starttime = timestamp || new Date().getTime()
                    moveit(timestamp, tracksToAdd[a].rect, rect, {y:startRect.y, x:startRect.x, width:startRect.width,height:startRect.height}, 300, starttime, 'add');
                })

                _streams.unshift(tracksToAdd[a]);

                c++
            }

            for(let r = 0; r < streamsToUpdate.length; r++){
                let rect = layoutRects[c];
                log('updateCanvasLayout streamsToUpdate loop', streamsToUpdate[r].screenSharing, rect)
                log('updateCanvasLayout streamsToUpdate c',c)

                let rectToUpdate = new DOMRect(streamsToUpdate[r].rect.x, streamsToUpdate[r].rect.y, streamsToUpdate[r].rect.width, streamsToUpdate[r].rect.height);
                streamsToUpdate[r].rect = rectToUpdate;

                requestAnimationFrame(function(timestamp){
                    let starttime = timestamp || new Date().getTime()
                    moveit(timestamp, rectToUpdate, rect, {y:rectToUpdate.y, x:rectToUpdate.x, width:rectToUpdate.width,height:rectToUpdate.height}, 300, starttime, 'up');
                })

                c++;
            }

            if(videoTracksOfUserWhoShares.length != 0) {
                for (let a = videoTracksOfUserWhoShares.length - 1; a >= 0; a--) {
                    let rect = layoutRects[a];

                    log('updateCanvasLayout screensharing tracks', rect)

                    let index = _streams.indexOf(videoTracksOfUserWhoShares[a]);


                    if(index == -1) {
                        var startRect = new DOMRect(0, 0, 0, 0);
                        videoTracksOfUserWhoShares[a].rect = startRect;
                        requestAnimationFrame(function (timestamp) {
                            let starttime = timestamp || new Date().getTime()
                            moveit(timestamp, videoTracksOfUserWhoShares[a].rect, rect, {
                                y: startRect.y,
                                x: startRect.x,
                                width: startRect.width,
                                height: startRect.height
                            }, 300, starttime, 'add');
                        })

                        log('updateCanvasLayout videoTracksOfUserWhoShares for screenSharingIsNew', videoTracksOfUserWhoShares[a])

                        _streams.unshift(videoTracksOfUserWhoShares[a]);
                    } else {
                        videoTracksOfUserWhoShares[a].rect = rect;
                        let rectToUpdate = new DOMRect(videoTracksOfUserWhoShares[a].rect.x, videoTracksOfUserWhoShares[a].rect.y, videoTracksOfUserWhoShares[a].rect.width, videoTracksOfUserWhoShares[a].rect.height);
                        videoTracksOfUserWhoShares[a].rect = rectToUpdate;

                        requestAnimationFrame(function(timestamp){
                            let starttime = timestamp || new Date().getTime()
                            moveit(timestamp, rectToUpdate, rect, {y:rectToUpdate.y, x:rectToUpdate.x, width:rectToUpdate.width,height:rectToUpdate.height}, 300, starttime, 'up');
                        })

                        log('updateCanvasLayout videoTracksOfUserWhoShares for !screenSharingIsNew index', index)

                        if(a === 0) {
                            _streams.splice(0, 0, _streams.splice(index, 1)[0])
                        }


                    }


                }
            }

            log('updateCanvasLayout result streams', _streams)



        }

        function startStreaming(fbStreamUrl) {
            console.log('Start streaming url',fbStreamUrl)
            console.log('Start streaming size',_streamingData.size)
            _streamingData.url = fbStreamUrl;
            const source = new RTCVideoSource();
            const track = source.createTrack();
            //const transceiver = peerConnection.addTransceiver(track);
            //const sink = new RTCVideoSink(transceiver.receiver.track);


            //sink.addEventListener('frame', onFrame);

            // TODO(mroberts): Is pixelFormat really necessary?
            const canvas = createCanvas(width, height);
            const context = canvas.getContext('2d', { pixelFormat: 'RGBA24' });
            context.fillStyle = 'white';
            context.fillRect(0, 0, width, height);

            let hue = 0;

            const interval = setInterval(() => {
                const rgbaFrame = _commonContext.getImageData(0, 0, width, height);

                const i420Frame = {
                    width,
                    height,
                    data: new Uint8ClampedArray(1.5 * width * height)
                };

                rgbaToI420(rgbaFrame, i420Frame);
                //console.log('startStreaming', i420Frame.data)

                source.onFrame(i420Frame);
                //
                //var imageData = createImageData(i420Frame.data, width, height);
                //var u8Array = new Uint8Array(i420Frame.data, );
                //var u8Array = new Uint8Array(imageData);
                //_streamingData.video.push(Buffer.from(i420Frame.data));
            });

            // Launch FFmpeg to handle all appropriate transcoding, muxing, and RTMP.
            // If 'ffmpeg' isn't in your path, specify the full path to the ffmpeg binary.
            let ffmpeg = child_process.spawn('ffmpeg', [
                // Facebook requires an audio track, so we create a silent one here.
                // Remove this line, as well as `-shortest`, if you send audio from the browser.
                '-f', 'lavfi', '-i', 'anullsrc',

                //set input framerate to 24 fps
               // '-r', '24',
                //'-re',
                // FFmpeg will read input video from STDIN
                //'-i', '-',
                '-i', '-',
                '-f', 'rawvideo',
                '-pix_fmt', 'yuv420p',
                '-s', width + 'x' + height,
                '-r', '24',

                // Because we're using a generated audio source which never ends,
                // specify that we'll stop at end of other input.  Remove this line if you
                // send audio from the browser.
                //'-shortest',

                // If we're encoding H.264 in-browser, we can set the video codec to 'copy'
                // so that we don't waste any CPU and quality with unnecessary transcoding.
                // If the browser doesn't support H.264, set the video codec to 'libx264'
                // or similar to transcode it to H.264 here on the server.


                // AAC audio is required for Facebook Live.  No browser currently supports
                // encoding AAC, so we must transcode the audio to AAC here on the server.
                //'-acodec', 'aac',
               /* '-acodec', 'libmp3lame',
                '-ar', '44100',
                '-threads', '6',
                '-qscale', '3',
                '-b:a', '712000',
                '-bufsize', '512k',*/

                // The output RTMP URL.
                // For debugging, you could set this to a filename like 'test.flv', and play
                // the resulting file with VLC.  Please also read the security considerations
                // later on in this tutorial.
                '-f', 'mp4',
               '/home/denis/Videos/1111111.mp4'
            ]);

            // If FFmpeg stops for any reason, close the WebSocket connection.
            ffmpeg.on('close', (code, signal) => {
                console.log('FFmpeg child process closed, code ' + code + ', signal ' + signal);
                ffmpeg = null;
                //socket.disconnect();
            });

            // Handle STDIN pipe errors by logging to the console.

            // These errors most commonly occur when FFmpeg closes and there is still
            // data to write.  If left unhandled, the server will crash.
            ffmpeg.stdin.on('error', (e) => {
                console.log('FFmpeg STDIN Error', e);
            });

            // FFmpeg outputs all of its messages to STDERR.  Let's log them to the console.
            ffmpeg.stderr.on('data', (data) => {
                console.log('FFmpeg STDERR:', data.toString());
            });

            _streamingData.video.on('data', function (chunk) {
                ffmpeg.stdin.write(chunk);
            })

/*



            _streamingData.proc = ffmpeg()
                .addInput((new StreamInput(_streamingData.video)).url)
                .addInputOptions([
                    '-f', 'rawvideo',
                    '-pix_fmt', 'yuv420p',
                    '-s', _streamingData.size,
                    '-r', '30',
                ])
                //.addInput((new StreamInput(_streamingData.audio)).url)
                .addInputOptions([
                    '-f lavfi',
                    '-i anullsrc',
                ])
                .on('start', ()=>{
                    //console.log('Start recording >> ', stream.recordPath)
                })
                .on('end', ()=>{
                    stream.recordEnd = true;
                    //console.log('Stop recording >> ', stream.recordPath)
                })
                .size('320x240')
                .output('/home/denis/Videos/555.mp4');

            _streamingData.proc.run();
*/

        }

        function drawVideosOnCanvas() {
            console.log('canvas: drawVideosOnCanvas');

            const interval = setInterval(() => {

                _commonContext.clearRect(0, 0, _canvasSize.width, _canvasSize.height);
                //if(options.liveStreaming.drawBackground && _background != null) drawBackground(_background);

                for(let i = 0; i < _streams.length; i++) {
                    let streamData = _streams[i];

                    if(streamData.videoSink.lastFrame != null) {
                        //log('drawVideosOnCanvas 1')

                        drawSingleVideoOnCanvas(streamData);
                    } else {
                        //log('drawVideosOnCanvas 1')

                        drawSingleAudioOnCanvas(streamData);
                    }
                }
            });

            /*setInterval(function () {
                if(!_commonContext) return;
                let imgData = _commonContext.getImageData(0, 0, _canvasSize.width, _canvasSize.height);

                io.of('/webrtc').in(socket.webrtcRoom.id).clients(function (error, clients) {
                    //if(_debug) console.log(clients);
                    for (var i in clients) {
                        //console.log('Streams/webrtc/serverVideo', clients[i]);
                        webrtcNamespace.to(clients[i]).emit('Streams/webrtc/serverVideo',  {size: {width: imgData.width, height: imgData.height}, data: imgData.data.buffer});
                    }
                });

            }, 1000);*/

        }

        function drawSingleVideoOnCanvas(data) {
            if(data.participant.online == false) return;
            //console.log('canvas: drawSingleVideoOnCanvas', data)

            //_inputCtx.translate(data.rect.x, data.rect.y);

            if(data.videoSink.lastFrame == null) return;
            //console.log('canvas: drawSingleVideoOnCanvas 2')

            let lastFrame = data.videoSink.lastFrame;
            var currentWidth = lastFrame.width;
            var currentHeight = lastFrame.height;

            /*if(data.widthLog != null && data.heightLog != null) {
                if(data.widthLog !=currentWidth || data.heightLog != currentHeight) {
                    console.log('dimensions changed width: ' + data.widthLog + ' -> ' + currentWidth);
                    console.log('dimensions changed height: ' + data.heightLog + ' -> ' + currentHeight);
                }
            }*/

            data.widthLog = currentWidth;
            data.heightLog = currentHeight;
            data.widthLog = currentWidth;
            data.heightLog = currentHeight;

            if(!data.screenSharing) {
                //console.log('canvas: !screensharing', data)

                var widthToGet = data.rect.width, heightToGet = data.rect.height, ratio = data.rect.width / data.rect.height;
                var x, y;

                var scale = Math.max( data.rect.width / currentWidth, (data.rect.height / currentHeight));

                widthToGet =  data.rect.width / scale;
                heightToGet = currentHeight;

                if(widthToGet / heightToGet != data.rect.width / data.rect.height) {
                    widthToGet = currentWidth;
                    heightToGet = data.rect.height / scale;

                    x = 0;
                    y = ((currentHeight / 2) - (heightToGet / 2));
                } else {
                    x = ((currentWidth / 2) - (widthToGet / 2));
                    y = 0;
                }

                const lastFrameCanvas = createCanvas(lastFrame.width,  lastFrame.height);
                const lastFrameContext = lastFrameCanvas.getContext('2d', { pixelFormat: 'RGBA24' });
                const rgba = new Uint8ClampedArray(lastFrame.width *  lastFrame.height * 4);
                const rgbaFrame = createImageData(rgba, lastFrame.width, lastFrame.height);
                i420ToRgba(lastFrame, rgbaFrame);
                const lastRgbaFrame = rgbaFrame;

                lastFrameContext.putImageData(rgbaFrame, 0, 0);

                _commonContext.drawImage( lastFrameCanvas,
                    x, y,
                    widthToGet, heightToGet,
                    data.rect.x, data.rect.y,
                    data.rect.width, data.rect.height);
            } else {
                //console.log('canvas: screensharing')
                return;
                _commonContext.fillStyle = "#000000";
                _commonContext.fillRect(data.rect.x, data.rect.y, data.rect.width, data.rect.height);

                var hRatio = data.rect.width / currentWidth;
                var vRatio = data.rect.height / currentHeight;
                var ratio  = Math.min ( hRatio, vRatio );

                var centerShift_x = ( data.rect.width - currentWidth*ratio ) / 2;
                var centerShift_y = ( data.rect.height - currentHeight*ratio ) / 2;

                _commonContext.drawImage( localVideo,
                    data.rect.x, data.rect.y,
                    currentWidth, currentHeight,
                    centerShift_x, centerShift_y,
                    currentWidth * ratio, currentHeight * ratio);
            }



            //(currentWidth/2) - (widthToGet / 2), (currentHeight/2) - (heightToGet / 2),

            //if(options.liveStreaming.showLabelWithNames) {
            _commonContext.fillStyle = "#232323";
            _commonContext.fillRect(data.rect.x, data.rect.y, data.rect.width, 36);

            _commonContext.font = "16px Arial";
            _commonContext.fillStyle = "white";
            _commonContext.fillText(data.participant.name, data.rect.x + 10, data.rect.y + 36 + 16 - 18 - 8);
            //}
            _commonContext.strokeStyle = "black";
            _commonContext.beginPath();
            _commonContext.moveTo(data.rect.x + data.rect.width, data.rect.y);
            //_commonContext.lineTo(data.rect.x + data.rect.width, options.liveStreaming.showLabelWithNames ? data.rect.y + 36 : data.rect.y);
            _commonContext.lineTo(data.rect.x + data.rect.width, data.rect.y + 36);
            _commonContext.stroke();
        }

        function drawSingleAudioOnCanvas(data) {
            _commonContext.clearRect(data.rect.x, data.rect.y, data.rect.width, data.rect.height);

            _commonContext.fillStyle = "#000";
            _commonContext.fillRect(data.rect.x, data.rect.y, data.rect.width, data.rect.height);

            //drawAudioVisualization(data);

            var width, height;
            if(data.participant.avatar && data.participant.avatar.image != null) {
                var avatar = data.participant.avatar.image;
                // console.log('drawSingleAudioOnCanvas data', avatar.width)

                width = avatar.width;
                height = avatar.height;

                var scale = Math.min( (data.rect.width / 2) / width,  (data.rect.height / 2) / height);
                var scaledWidth = width * scale;
                var scaledHeight = height * scale;
                // get the top left position of the image
                var x = data.rect.x + (( data.rect.width / 2) - (width / 2) * scale);
                var y;
                //if(options.liveStreaming.showLabelWithNames) {
                y = (data.rect.y + 36) + (((data.rect.height - 36) / 2) - (height / 2) * scale);
                /*} else {
                    y = data.rect.y + ((data.rect.height / 2) - (height / 2) * scale);
                }*/

                var size = Math.min(scaledHeight, scaledWidth);
                var radius =  size / 2;

                //drawSimpleCircleAudioVisualization(data, x, y, radius, scale, size);


                _commonContext.save();
                _commonContext.beginPath();
                _commonContext.arc(x + (size / 2), y + (size / 2), radius, 0, Math.PI * 2 , false); //draw the circle
                _commonContext.clip(); //call the clip method so the next render is clipped in last path
                //_inputCtx.strokeStyle = "blue";
                //_inputCtx.stroke();
                _commonContext.closePath();

                _commonContext.drawImage(avatar,
                    x, y,
                    width * scale, height * scale);
                _commonContext.restore();



                _commonContext.strokeStyle = "black";
                _commonContext.strokeRect(data.rect.x, data.rect.y, data.rect.width, data.rect.height);
            }

            //if(options.liveStreaming.showLabelWithNames) {
            //(currentWidth/2) - (widthToGet / 2), (currentHeight/2) - (heightToGet / 2),
            _commonContext.fillStyle = "#232323";
            _commonContext.fillRect(data.rect.x, data.rect.y, data.rect.width, 36);

            _commonContext.font = "16px Arial";
            _commonContext.fillStyle = "white";
            _commonContext.fillText(data.participant.name, data.rect.x + 10, data.rect.y + 36 + 16 - 18 - 8);
            //}

        }

        function switchRoom(roomInstance, prevSocketId) {

            /*for(let r = _streams.length - 1; r >= 0 ; r--){
                if(_streams[r].participant.id == prevSocketId)  {
                    _streams[r].participant = socket.webrtcParticipant
                }
            }*/
            _roomInstance = roomInstance;
        }

        return {
            drawVideosOnCanvas: drawVideosOnCanvas,
            startStreaming: startStreaming,
            updateCanvasLayout: updateCanvasLayout,
            switchRoom: switchRoom,
            commonContext: function () {
                return _commonContext;
            },
            streams: function () {
                return _streams;
            },
            //compositeVideosAndDraw: compositeVideosAndDraw,
            //stop: stopAndRemove,
            //isActive: isActive
        }
    }




    function beforeOffer(peerConnection, participant) {
        console.log('beforeOffer start', peerConnection);

        /*setTimeout(function () {
            console.log('beforeOffer t', peerConnection.getReceivers());
            for(let r in peerConnection.getReceivers()) {
                console.log('track ', peerConnection.getReceivers()[r].track.readyState);
            }
        }, 4000)*/

        if(participant.name == null || participant.avatar == null) {
            setUserNameAndAvatar(participant, function (nameInfo) {
                participant.name = nameInfo.fullName;
                participant.avatar = nameInfo.avatar;

            });
        }

        //canvasComposer.add();

        //const audioTransceiver = peerConnection.addTransceiver('audio');
        //const videoTransceiver = peerConnection.addTransceiver('video');

        //const audioSink = new RTCAudioSink(audioTransceiver.receiver.track);
        //const videoSink = new RTCVideoSink(videoTransceiver.receiver.track);

        const source = new RTCVideoSource();
        const track = source.createTrack();
        const transceiver = peerConnection.addTransceiver(track);
        //const videoSink = new RTCVideoSink(transceiver.receiver.track);

        peerConnection.ontrack = function (e) {
            console.log('NEW TRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACK participant', participant);
            console.log('beforeOffer t', peerConnection.getReceivers());
            for(let r in peerConnection.getReceivers()) {
                console.log('track ', peerConnection.getReceivers()[r].track.readyState);
            }

            var newTrack = new WebRTC.Track(e.track.kind);
            newTrack.mediaStreamTrack = e.track;
            participant.tracks.push(newTrack);

            if(e.track.kind == 'video'){
                var videoSink = new RTCVideoSink(e.track);
                newTrack.videoSink = videoSink;
            } else {

            }
            console.log('trackAdded');

            socket.webrtcRoom.event.dispatch('trackAdded', newTrack);
        }

        let _canvasSize = {width: 1280, height: 768};
        const width = _canvasSize.width;
        const height = _canvasSize.height;

        //videoSink.addEventListener('frame', onFrame);

        const canvas = createCanvas(width, height);
        const context = canvas.getContext('2d', { pixelFormat: 'RGBA24' });
        context.fillStyle = 'white';
        context.fillRect(0, 0, width, height);

        const interval = setInterval(() => {
            const rgbaFrame = socket.webrtcParticipant.liveStreaming.canvasComposer.commonContext().getImageData(0, 0, width, height);
            const i420Frame = {
                width,
                height,
                data: new Uint8ClampedArray(1.5 * width * height)
            };
            rgbaToI420(rgbaFrame, i420Frame);
            source.onFrame(i420Frame);
        });

        console.log('Streams/webrtc/serverVideo start 0');

        const { close } = peerConnection;
        peerConnection.close = function() {
            if(interval) clearInterval(interval);
            console.log('beforeOffer CLOSE CONNECTION', participant);

           /* if(socket.webrtcParticipant.liveStreaming.canvasComposer != null) {
                let streams = socket.webrtcParticipant.liveStreaming.canvasComposer.streams();
                for (let s in streams) {
                    if (streams[s].videoSink != null && streams[s].videoSink.videoSink != null) streams[s].videoSink.videoSink.stop();
                }
            }*/
            return close.apply(this, arguments);
        }
    }


}