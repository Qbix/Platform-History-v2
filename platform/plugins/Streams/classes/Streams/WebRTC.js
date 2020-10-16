"use strict";
/*jshint node:true */
/**
 * WebRTC class
 * @module Streams
 * @main Streams
 */
const Q = require('Q');
const fs = require('fs');

const ffmpeg = require('fluent-ffmpeg')
const { StreamInput } = require('fluent-ffmpeg-multistream')

const { hsv } = require('color-space');
const { performance } = require('perf_hooks');

var express = require('express');
var app = express();
app.set('view engine', 'ejs');


const Streams_Avatar = Q.require('Streams/Avatar');
const Users = Q.require('Users');

const VIDEO_OUTPUT_SIZE = '320x240'
const VIDEO_OUTPUT_FILE = './recording.mp4'

const child_process = require('child_process');

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

    webrtcNamespace.on('connection', function(socket) {
        if(_debug) console.log('made sockets connection', socket.id);

        let rtmpUrl = socket.handshake.query.rtmp;
        if ( rtmpUrl != null ) {
            if(_debug) console.log('made sockets connection (LIVE STREAMING)', socket.id);
            var usersInfo = JSON.parse(socket.handshake.query.localInfo);
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
                    //'-r', '24',
                    '-re',
                    // FFmpeg will read input video from STDIN
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

                    // FLV is the container format used in conjunction with RTMP
                    '-f', 'flv',

                    //set output framerate to 24 fps
                    //'-r', '24',

                    // The output RTMP URL.
                    // For debugging, you could set this to a filename like 'test.flv', and play
                    // the resulting file with VLC.  Please also read the security considerations
                    // later on in this tutorial.
                    rtmpUrl
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
            }
            createFfmpegProcess();

            // When data comes in from the WebSocket, write it to FFmpeg's STDIN.
            socket.on('Streams/webrtc/videoData', function(data) {
                console.log('VIDEODATA');
                //socket.broadcast.emit('video', data);
                if(ffmpeg != null) {
                    ffmpeg.stdin.write(data);
                } else {
                    createFfmpegProcess();
                }
            });

            // If the client disconnects, stop FFmpeg.
            socket.on('disconnect', function() {
                if(ffmpeg != null) ffmpeg.kill('SIGINT');
            });

            return;
        }


        require('./WebRTC/signaling')(socket, io);

        console.log('rtmpUrl', rtmpUrl)
        require('./WebRTC/server2clientWebRTC')(socket, io, rtmpUrl);

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