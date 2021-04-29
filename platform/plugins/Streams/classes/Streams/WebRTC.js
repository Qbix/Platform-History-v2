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
 * Static methods for WebRTC
 * @class WebRTC
 * @static
 */
function WebRTC() {

}

WebRTC.rooms = [];

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
    this.participants = [];
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
        for (var i = WebRTC.rooms.length - 1; i >= 0; i--) {
            if (WebRTC.rooms[i] == room) {
                WebRTC.rooms.splice(i, 1);
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

WebRTC.Participant = function (id) {
    this.id = id;
    this.userPlatformId = null;
    this.online = false;
    this.name = 'Connecting...';
    this.room = null;
    this.RTCPeerConnection = null;
    this.tracks = [];
    this.liveStreaming = {connectionManager: null, room: null, canvasComposer: null};
    this.recording = {path: null, startTime: null, stopTime: null, parallelRecordings:[], parallelRecordingsFile:null};
    this.videoTracks = function (activeTracksOnly) {
        if(activeTracksOnly) {
            return this.tracks.filter(function (trackObj) {
                return trackObj.kind == 'video' && !(trackObj.mediaStreamTrack.muted == true || trackObj.mediaStreamTrack.enabled == false || trackObj.mediaStreamTrack.readyState == 'ended');
            });
        }

        return this.tracks.filter(function (trackObj) {
            return trackObj.kind == 'video';
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
WebRTC.listen = function () {
    var socket = (Q.plugins.Streams.listen() || {}).socket;

    if (!socket || !socket.io) {
        return null;
    }

    var _debug = Q.Config.get(['Streams', 'webrtc', 'debug'], false);
    var io = socket.io;
    var webrtcNamespace = io.of('/webrtc');

    var _streamingData = new PassThrough();

    webrtcNamespace.on('connection', function(socket) {
        if(_debug) console.log('made sockets connection', socket.id);

        var _localRecordDir = null;
        var _localMediaStream = null;
        var _chunksNum = 0;

        let rtmpUrl = socket.handshake.query.rtmp;
        if ( rtmpUrl != null ) {
            if(_debug) console.log('made sockets connection (LIVE STREAMING)', socket.id);
            var usersInfo = JSON.parse(socket.handshake.query.localInfo);
            var platform = socket.handshake.query.platform;
            var isAndroid = usersInfo.platform == 'android' ? true : false

            var ffmpeg;
            var encoder = (isAndroid || usersInfo.ua.toLowerCase().indexOf('firefox') != -1) ? 'libx264' : 'copy';
            function createFfmpegProcess() {
                // Launch FFmpeg to handle all appropriate transcoding, muxing, and RTMP.
                // If 'ffmpeg' isn't in your path, specify the full path to the ffmpeg binary.
                ffmpeg = child_process.spawn('ffmpeg', [
                    // Facebook requires an audio track, so we create a silent one here.
                    // Remove this line, as well as `-shortest`, if you send audio from the browser.
                    //'-f', 'lavfi', '-i', 'anullsrc',

                    //set input framerate to 24 fps
                    //'-r', '30',
                    //'-f', 'rawvideo',
                    //'-s', '1280x768',
                    '-re',
                    // FFmpeg will read input video from STDIN
                    //'-f', 's16be',
                    //'-ar', '48k',
                    //'-ac', '1',
                    '-i', '-',

                    // Because we're using a generated audio source which never ends,
                    // specify that we'll stop at end of other input.  Remove this line if you
                    // send audio from the browser.
                    //'-shortest',

                    // If we're encoding H.264 in-browser, we can set the video codec to 'copy'
                    // so that we don't waste any CPU and quality with unnecessary transcoding.
                    // If the browser doesn't support H.264, set the video codec to 'libx264'
                    // or similar to transcode it to H.264 here on the server.
                    '-vcodec', encoder,

                    // AAC audio is required for Facebook Live.  No browser currently supports
                    // encoding AAC, so we must transcode the audio to AAC here on the server.
                    '-acodec', 'aac',

                    //'-map', '0:0',
                    //'-map', '0:1',
                    // FLV is the container format used in conjunction with RTMP
                    '-f', 'flv',
                    //set output framerate to 24 fps
                    //'-r', '24',
                    //'-s', '1280x768',

                    // The output RTMP URL.
                    // For debugging, you could set this to a filename like 'test.flv', and play
                    // the resulting file with VLC.  Please also read the security considerations
                    // later on in this tutorial.
                    rtmpUrl
                ]);

                /*ffmpeg -re -i SampleM.flv -acodec libmp3lame -ar 44100 -b:a 128k \
  -pix_fmt yuv420p -profile:v baseline -s 426x240 -bufsize 6000k \
  -vb 400k -maxrate 1500k -deinterlace -vcodec libx264           \
  -preset veryfast -g 30 -r 30 -f flv                            \
  -flvflags no_duration_filesize                                 \
  "rtmp://live-api.facebook.com:80/rtmp/my_key"*/

                // If FFmpeg stops for any reason, close the WebSocket connection.
                ffmpeg.on('close', (code, signal) => {
                    console.log('FFmpeg child process closed, code ' + code + ', signal ' + signal);
                    if (code !== 0) {
                        socket.emit('Streams/webrtc/liveStreamingStopped', {platform: platform, rtmpUrl: rtmpUrl});
                    }
                    ffmpeg = null;
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
            }
            createFfmpegProcess();

            _streamingData.on('data', function (data) {
                if(ffmpeg != null) {
                    ffmpeg.stdin.write(data);
                } else {
                    createFfmpegProcess();
                }
            })
            // When data comes in from the WebSocket, write it to FFmpeg's STDIN.
            socket.on('Streams/webrtc/videoData', function(data) {
                console.log('VIDEODATA', data);
                _streamingData.push(data);
                //socket.broadcast.emit('video', data);
            });

            // If the client disconnects, stop FFmpeg.
            socket.on('disconnect', function() {
                if(ffmpeg != null) ffmpeg.kill('SIGINT');
            });

            return;
        }


        require('./WebRTC/signaling')(socket, io);

        //console.log('rtmpUrl', rtmpUrl)
        //require('./WebRTC/server2clientWebRTC')(socket, io, rtmpUrl);
        require('./WebRTC/roomManager')(socket, io);

        function processChunk(data, infoData, chunkNum, end, callback) {
            var parallelRecordings = infoData.parallelRecordings;
            var extension = infoData.extension;
            if(_debug) console.log('LOCAL MEDIA:', socket.id);
            if(_debug) console.log('LOCAL MEDIA: chunkNum', chunkNum, _chunksNum);

            if(parallelRecordings.length != 0) {
                for (let i in parallelRecordings) {
                    socket.webrtcParticipant.recording.parallelRecordings.push(parallelRecordings[i]);
                }
                //fs.writeFileSync(socket.webrtcParticipant.recording.parallelRecordingsFile, JSON.stringify(socket.webrtcParticipant.recording.parallelRecordings))
            }

            function writeToStream() {
                if(!end) {
                    _localMediaStream.write(data, function () {
                        if(_debug) console.log('LOCAL MEDIA: write to stream finished', _localMediaStream.bytesWritten);
                        _chunksNum = chunkNum;
                        socket.webrtcParticipant.recording.latestChunkTime = Date.now();

                        fs.writeFileSync(socket.webrtcParticipant.recording.recordingInfo, JSON.stringify(socket.webrtcParticipant.recording))

                        if(callback != null) {
                            callback({
                                status: "ok"
                            });
                        }
                    });
                } else {
                    _localMediaStream.end(data, function () {
                        if(_debug) console.log('LOCAL MEDIA: write to stream finished (END)', _localMediaStream.bytesWritten);
                        socket.webrtcParticipant.recording.stopTime = Date.now();
                        _chunksNum = chunkNum;

                        fs.writeFileSync(socket.webrtcParticipant.recording.recordingInfo, JSON.stringify(socket.webrtcParticipant.recording))

                        if(callback != null) {
                            callback({
                                status: "ok"
                            });
                        }


                    });
                }


                let chunkStream = fs.createWriteStream(socket.webrtcParticipant.recording.path, {
                    'flags': 'a',
                    'encoding': null,
                    'mode': '0666'
                });

                chunkStream.on('error', (e) => {
                    console.log('ERRRORRR', e)
                });
                chunkStream.on('error', () => {
                    console.log('CLOSED')
                });
                chunkStream.on('finish', () => {
                    console.log('FINISHED')
                });

                chunkStream.write(data, function () {

                });
            }
            if(_debug) console.log('LOCAL MEDIA end ', end);
            if(_debug) console.log('LOCAL MEDIA parallelRecordings', parallelRecordings);

            if(_localMediaStream != null) {
                if(_debug) console.log('LOCAL MEDIA: write to stream');

                writeToStream();
            } else {
                if(_debug) console.log('LOCAL MEDIA: create stream');

                var streamName = 'Streams/webrtc/' + socket.roomId;
                Q.plugins.Streams.fetchOne(socket.userPlatformId, socket.roomPublisherId, streamName, function (err, stream) {
                    if(err || !stream) {
                        return;
                    }
                    if(_debug) console.log('LOCAL MEDIA: got webrtc stream ' + stream.getAttribute('startTime'));

                    var localRecordDir = appDir + 'files/' +  appName + '/uploads/Streams/webrtc_rec/' + socket.roomId + '/' + stream.getAttribute('startTime') + '/' + socket.userPlatformId + '/' + socket.startTime;
                    if (!fs.existsSync(localRecordDir)){
                        var oldmask = process.umask(0);
                        fs.mkdirSync(localRecordDir, {recursive: true, mode: '0777'});
                        process.umask(oldmask);
                    }
                    let filePath = localRecordDir + '/audio.' + extension;
                    _localMediaStream = fs.createWriteStream(filePath);
                    _localMediaStream.on('error', (e) => {
                        console.log('ERRRORRR', e)
                    });
                    _localMediaStream.on('error', () => {
                        console.log('CLOSED')
                    });
                    _localMediaStream.on('finish', () => {
                        console.log('FINISHED')
                    });

                    socket.webrtcParticipant.recording.startTime = Date.now();
                    socket.webrtcParticipant.recording.path = filePath;
                    socket.webrtcParticipant.recording.localRecordDir = localRecordDir;
                    socket.webrtcParticipant.recording.recordingInfo = localRecordDir + '/../../' + socket.userPlatformId + '_' + socket.startTime + '.json';
                    writeToStream();
                });

            }




        }

        socket.on('Streams/webrtc/localMedia', processChunk);

        function processRecordings() {
            console.log('processRecordings');
            if(!socket.webrtcRoom) return;
            var recordings = (socket.webrtcRoom.participants.map(function (p) {
                p.recording.participant = p;
                return p.recording;
            })).filter(function(r) {
                return r.path != null ? true : false;
            })
            console.log('processRecordings: recordings', recordings)

            if(recordings.length == 0) return;

            var startRecording = recordings.reduce(function(prev, current) {
                return current.startTime < prev.startTime ? current : prev
            });
            console.log('processRecordings: startRecording', startRecording)

            recordings.sort(function(a, b){
                if(a.stopTime - a.startTime > b.stopTime - b.startTime){
                    return -1;
                }
                if(a.stopTime - a.startTime < b.stopTime - b.startTime){
                    return 1;
                }
                return 0
            })

            //map parallel recordings info to recording path
            function getRecordingInstance(rec) {
                for(let r in socket.webrtcRoom.participants) {
                    let participant = socket.webrtcRoom.participants[r];
                    if(participant.username == rec.participant.username && participant.sid == '/webrtc#' + rec.participant.sid) {
                        return participant.recording;
                    }
                }
            }

            for (let r in recordings) {
                let currentRecording = recordings[r];
                for(let p in currentRecording.parallelRecordings) {
                    let rec = currentRecording.parallelRecordings[p];
                    rec.recordingInstance = getRecordingInstance(rec);
                }
            }


            //add recordings as ffmpeg inputs

            var inputsNum = 1;
            var inputsLet = 'a';
            var offsetFromFirstRec = 0;
            var offsets = [];
            var processedRecsToSkip = [];
            var offsetsIndexes = [];
            var inputs = [];
            inputs.push('-i', startRecording.path)
            processedRecsToSkip.push(startRecording.participant.username)
            var currentRecording = startRecording;
            /*while(currentRecording != null) {
                console.log('processRecordings: currentRecording', currentRecording);

                if(currentRecording.parallelRecordings.length == 0) {
                    currentRecording = null;
                    continue;
                }

                for(let p in currentRecording.parallelRecordings) {
                    let paralelRec = currentRecording.parallelRecordings[p];
                    console.log('processRecordings: parallelRecordings rec', paralelRec);

                    if(processedRecsToSkip.indexOf(paralelRec.participant.username) != -1) {
                        continue;
                    }

                    inputs.push('-i', paralelRec.recordingInstance.path);
                    inputsLet =  String.fromCharCode(inputsLet.charCodeAt(0) + 1);
                    offsets.push('[' + inputsNum + ']adelay=' + (offsetFromFirstRec + parseFloat(paralelRec.time)) + '|' + (offsetFromFirstRec + parseFloat(paralelRec.time)) + '[' + inputsLet + ']');
                    offsetsIndexes.push('[' + inputsLet + ']');
                    inputsNum++;
                    processedRecsToSkip.push(paralelRec.participant.username);
                }

                var parallelRecThatEndsLast = currentRecording.parallelRecordings.reduce(function(prev, current) {
                    return current.recordingInstance.stopTime > prev.recordingInstance.stopTime ? current : prev
                });

                console.log('processRecordings: parallelRecThatEndsLast', parallelRecThatEndsLast);
                offsetFromFirstRec = parseFloat(offsetFromFirstRec) + parseFloat(parallelRecThatEndsLast.time);
                currentRecording = parallelRecThatEndsLast.stopTime > currentRecording.stopTime ? parallelRecThatEndsLast.recordingInstance : null;
                console.log('processRecordings: offsetFromFirstRec', offsetFromFirstRec);
            }*/

            console.log('processRecordings: startRecording', startRecording);
            console.log('inputs.length', inputs.length);
            console.log('recordings.length', recordings.length);

            var localRecordDir = appDir + 'files/' +  appName + '/uploads/Streams/webrtc_rec/' + socket.roomId + '/' + socket.roomStartTime;

            inputs.unshift('-y');

            var amix = '[0]';

            for(let i in offsetsIndexes) {
                amix += offsetsIndexes[i];
            }

            var delays = offsets.join(';');
            inputs.push('-filter_complex', delays + (delays != ''? ';' : '') + amix + 'amix=inputs=' + inputsNum);
            inputs.push(
                //'-acodec', 'libmp3lame',
                //'-f', 'mp3',
                localRecordDir + '/audio.wav');
            console.log('inputs', inputs);
            return;
            ffmpeg = child_process.spawn('ffmpeg', inputs);
            ffmpeg.on('close', (code, signal) => {
                console.log('FFmpeg child process closed, code ' + code + ', signal ' + signal);
                ffmpeg = null;
            });
            ffmpeg.stdin.on('error', (e) => {
                console.log('FFmpeg STDIN Error', e);
            });
            ffmpeg.stderr.on('data', (data) => {
                console.log('FFmpeg STDERR:', data.toString());
            });
        }

        socket.on('disconnect', function() {
            if(socket.webrtcParticipant.id == socket.client.id) {
                console.log('disconnect socket.webrtcParticipant.id != socket.client.id', socket.webrtcParticipant.id, socket.client.id)
                socket.webrtcParticipant.online = false;
                if(socket.webrtcParticipant.recording.stopTime == null) {
                    socket.webrtcParticipant.recording.stopTime = socket.webrtcParticipant.recording.latestChunkTime;
                }
                socket.webrtcRoom.event.dispatch('participantDisconnected', socket.webrtcParticipant);
            }
            io.of('/webrtc').in(socket.webrtcRoom.id).clients(function (error, clients) {
                if(clients.length == 0) {
                    processRecordings();
                    socket.webrtcRoom.close();
                }
            });
        });

        socket.on('Streams/webrtc/log', function (message) {
            if(_debug) console.log('CONSOLE.LOG', message);
        });

        socket.on('Streams/webrtc/errorlog', function (message) {
            console.log('CONSOLE.ERROR', message);
            var todaysDay = new Date().toISOString().replace(/T.*/, ' ');
            console.log('CONSOLE.ERROR DATE', todaysDay);
        });

        socket.on('Streams/webrtc/errorlog_timeout', function (message) {
            if(_debug) console.log('CONSOLE.ERROR', message);
            if(_debug) console.log('CONSOLE.ERROR DATE', (new Date().toISOString()));
        });

    })

};

module.exports = WebRTC;