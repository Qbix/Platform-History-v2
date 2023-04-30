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
const gfs = require('graceful-fs');

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
    var sslConfigs = Q.Config.get(['Q', 'node', 'https'], false) || {};
    var port = parseInt(Q.Config.get(['Q', 'node', 'port'], null)) + 5;
    var config = {
        sslConfigs: {
            key: sslConfigs.key,
            cert: sslConfigs.cert,
            ca: sslConfigs.ca
        },
        port: port

    };

    var WebcastServer = require('./WebRTC/WebcastServer')(config);

    var _debug = Q.Config.get(['Streams', 'webrtc', 'debug'], {});
    var io = socket.io;
    var webrtcNamespace = io.of('/webrtc');

    Q.plugins.Streams.WebRTC.rooms = [];

    webrtcNamespace.on('connection', function(socket) {
        if(_debug) console.log('made sockets connection', socket.id);
        var _streamingData = new PassThrough();
        var ffmpeg;
        var _localRecordDir = null;
        var _localMediaStream = null;
        var _chunksNum = 0;

        if ( socket.handshake.query.rtmp || socket.handshake.query.recording ) {
            if(_debug) console.log('made sockets connection (LIVE STREAMING)', socket.id);
            var usersInfo = JSON.parse(socket.handshake.query.localInfo);
            var rtmpUrlsData = socket.handshake.query.rtmp ? JSON.parse( socket.handshake.query.rtmp) : [];
            if(_debug) console.log('made sockets connection (LIVE STREAMING) DATA1', socket.handshake.query.rtmp );
            if(_debug) console.log('made sockets connection (LIVE STREAMING) DATA2', rtmpUrlsData);
            if(_debug) console.log('made sockets connection (LIVE STREAMING) DATA3', socket.handshake.query.recording);
            var livestreamStreamData = JSON.parse(socket.handshake.query.livestreamStream);
            var recordingStreamData = JSON.parse(socket.handshake.query.recordingStream);
            var platform = socket.handshake.query.platform;
            var isAndroid = usersInfo.platform == 'android' ? true : false

            if(socket.handshake.query.recording) {
                let userId = socket.handshake.query.userId;
                let userConnectedTime = socket.handshake.query.userConnectedTime;
                let roomStartTime = socket.handshake.query.roomStartTime;
                let roomId = socket.handshake.query.roomId;
                let recordingStartTime = +Date.now();

                var localRecordDir = appDir + 'files/' + appName + '/uploads/Streams/recordings/' + roomId + '/' + roomStartTime + '/' + userId + '/' + userConnectedTime;
                if (!fs.existsSync(localRecordDir)) {
                    var oldmask = process.umask(0);
                    mkdirp(localRecordDir);
                    process.umask(oldmask);
                }
                let absolutePath = localRecordDir + '/' + recordingStartTime + '.mp4';
                rtmpUrlsData.push({ rtmpUrl: absolutePath });

                let qbixPath = '{{baseUrl}}/Q/uploads/Streams/recordings/' + roomId + '/' + roomStartTime + '/' + userId + '/' + userConnectedTime + '/' + recordingStartTime + '.mp4';
                let qbixSubPath = '/Q/uploads/Streams/recordings/' + roomId + '/' + roomStartTime + '/' + userId + '/' + userConnectedTime + '/' + recordingStartTime + '.mp4';

                updateRecordingStream(absolutePath, qbixPath, qbixSubPath, recordingStartTime);
            }

            if(rtmpUrlsData.length == 0) return;

            let rtmpUrls = rtmpUrlsData.map(function (rtmpData) {
                return rtmpData.rtmpUrl;
            });

            if(livestreamStreamData && livestreamStreamData.publisherId != null && livestreamStreamData.streamName != null) {
                postStartMessageAndBeginLivestreaming();
            } else {
                initFFMpegProcess();
            }

            function mkdirp(dir) {
                if (fs.existsSync(dir)) { return true }
                const dirname = path.dirname(dir)
                mkdirp(dirname);
                fs.mkdirSync(dir);
            }

            function updateRecordingStream(absolutePath, qbixPath, qbixSubPath, recordingStartTime, recordingEndTime) {
                Q.plugins.Streams.fetchOne(recordingStreamData.publisherId, recordingStreamData.publisherId, recordingStreamData.streamName, function (err, stream) {
                    if (err || !stream) {
                        console.log('No livestream stream found with next publisherId and streamName', recordingStreamData.publisherId, recordingStreamData.streamName);
                        return;
                    }
                    if(qbixSubPath) {
                        stream.setAttribute('path', qbixPath);
                    }
                    if(qbixSubPath) {
                        stream.setAttribute('subpath', qbixSubPath);
                    }
                    if(absolutePath) {
                        stream.setAttribute('absolutePath', absolutePath);
                    }
                    if(recordingStartTime) {
                        stream.setAttribute('fromTime', recordingStartTime); 
                    }
                    if(recordingEndTime) {
                        stream.setAttribute('toTime', recordingEndTime); 
                    }
                    stream.save();
                });
            }

            function postStartMessageAndBeginLivestreaming () {
                
                Q.plugins.Streams.fetchOne(livestreamStreamData.publisherId, livestreamStreamData.publisherId, livestreamStreamData.streamName, function (err, stream) {
                    if (err || !stream) {
                        console.log('No livestream stream found with next publisherId and streamName', livestreamStreamData.publisherId, livestreamStreamData.streamName);
                        return;
                    }

                    for (let i in rtmpUrlsData) {
                        let rtmpUrlInfo = rtmpUrlsData[i];
                        rtmpUrlInfo.platform = determinePlatformUserStreamingTo(rtmpUrlInfo.linkToLive || rtmpUrlInfo.rtmpUrl);
                        delete rtmpUrlInfo.rtmpUrl;
                        
                        stream.post(livestreamStreamData.publisherId, {
                            type: 'Streams/livestream/start',
                            instructions: JSON.stringify(rtmpUrlInfo)
                        }, function (err) {
                            if (err) {
                                console.log('Something went wrong when posting to stream with next publisherId and streamName', livestreamStreamData.publisherId, livestreamStreamData.streamName)
                                return;
                            }
                            if (parseInt(i) == rtmpUrlsData.length - 1) {
                                initFFMpegProcess();
                            }
                        });
                    }
                });
            }

            function postStopMessageAndStopLivestreaming () {
                Q.plugins.Streams.fetchOne(livestreamStreamData.publisherId, livestreamStreamData.publisherId, livestreamStreamData.streamName, function (err, stream) {
                    if (err || !stream) {
                        console.log('No livestream stream found with next publisherId and streamName', livestreamStreamData.publisherId, livestreamStreamData.streamName);
                        return;
                    }

                    for (let i in rtmpUrlsData) {
                        let rtmpUrlInfo = rtmpUrlsData[i];
                        rtmpUrlInfo.platform = determinePlatformUserStreamingTo(rtmpUrlInfo.linkToLive || rtmpUrlInfo.rtmpUrl);
                        delete rtmpUrlInfo.rtmpUrl;
                        stream.post(livestreamStreamData.publisherId, {
                            type: 'Streams/livestream/stop',
                            instructions: JSON.stringify(rtmpUrlInfo)
                        }, function (err) {
                            if (err) {
                                console.log('Something went wrong when posting to stream with next publisherId and streamName', livestreamStreamData.publisherId, livestreamStreamData.streamName)
                                return;
                            }
                        });
                    }
                });
            }

            function determinePlatformUserStreamingTo(urlString) {
                if(!urlString || urlString.trim() == '') return;
                if (urlString.indexOf('youtube.com') != -1 || urlString.indexOf('youtu.be') != -1) {
                    return 'youtube';
                } else if (urlString.indexOf('twitch.tv') != -1) {
                    return 'twitch';
                }
            }
            
            function initFFMpegProcess() {
                if(_debug) console.log('usersInfo', usersInfo);
                var m264BrowserSupport = false
                for(let c in usersInfo.supportedVideoMimeTypes) {
                    let mimeType = usersInfo.supportedVideoMimeTypes[c];
                    if(mimeType.toLowerCase().indexOf('h264') != -1) {
                        m264BrowserSupport = true;
                        break;
                    }
                }
                var mp4IsSupported = usersInfo.supportedVideoMimeTypes.indexOf('video/mp4') != -1;
                var encoder = !m264BrowserSupport && !mp4IsSupported ? 'libx264' : 'copy';
                var format = mp4IsSupported ? 'mov,mp4,m4a,3gp,3g2,mj2' : 'webm'; //mov,mp4,m4a,3gp,3g2,mj2
                if(_debug) console.log('m264BrowserSupport ' +  m264BrowserSupport);
                if(_debug) console.log('mp4IsSupported ' +  mp4IsSupported, format, encoder);
                if(_debug) console.log('usersInfo.supportedVideoMimeTypes ', usersInfo.supportedVideoMimeTypes);
    
                /*if(rtmpUrls.length > 1) {
                    var outputEndpoints = '';
                    for(let u in rtmpUrls) {
                        if(u == rtmpUrls.length - 1) {
                            outputEndpoints += '[f=flv:flvflags=no_duration_filesize:onfail=ignore]' + rtmpUrls[u];
                        } else {
                            outputEndpoints += '[f=flv:flvflags=no_duration_filesize:onfail=ignore]' + rtmpUrls[u] + '|'
                        }
                    }
                }*/
    
    
                function createFfmpegProcess() {
                    if(!_streamingData) {
                        console.log('createFfmpegProcess create PassThrough')
                        _streamingData = new PassThrough();
                    }
                    var params = ['-re'];
                    //var params = ['-r', '24'];
                    if(format != 'webm') {
                        params.push('-f', format);
                    }
    
                    params.push('-i', '-');
    
                    if(encoder == 'copy') {
                        params = params.concat([
                            '-pix_fmt', 'yuv420p',
                            '-vcodec', 'copy',
                            '-flvflags', '+faststart+resend_headers+add_keyframe_index+ignidx',
                        ]);
                    } else {
                        params = params.concat([
                            '-pix_fmt', 'yuv420p',
                            '-vcodec', 'libx264',
                            '-preset', 'slow',
                            '-profile:v', 'high',
                            '-b:v', '2M',
                            '-bufsize', '512k',
                            '-crf', '18',
                            '-g', '30',
                            '-bf', '2',
                            '-movflags', '+faststart',
                            '-max_interleave_delta', '20000000',
                        ]);
                    }
                    params = params.concat([
                        '-codec:a', 'aac',
                        '-strict', '-2', '-ar', '44100',
                        '-af', 'aresample=async=1'
                    ]);
    
                    if(rtmpUrls.length > 1) {
                        var outputEndpoints = '';
                        for(let u in rtmpUrls) {
                            if(u == rtmpUrls.length - 1) {
                                outputEndpoints += '[f=flv:flvflags=no_duration_filesize:onfail=ignore]' + rtmpUrls[u];
                            } else {
                                outputEndpoints += '[f=flv:flvflags=no_duration_filesize:onfail=ignore]' + rtmpUrls[u] + '|'
                            }
                        }
                        params = params.concat([
                            '-map', '0',
                            '-f', 'tee', outputEndpoints
                        ]);
                    } else {
                        if(socket.handshake.query.recording) {
                            params = params.concat([
                                '-r', '24',
                                '-f', 'mp4', rtmpUrls[0]
                            ]);
                        } else {
                            params = params.concat([
                                '-flvflags', 'no_duration_filesize',
                                '-r', '24',
                                '-f', 'flv', rtmpUrls[0]
                            ]);
                        }
                        
                    }
    
                    console.log('ffmpeg params ', params)
                    ffmpeg = child_process.spawn('ffmpeg', params, {detached: true});
    
                    /*ffmpeg -re -i SampleM.flv -acodec libmp3lame -ar 44100 -b:a 128k \
      -pix_fmt yuv420p -profile:v baseline -s 426x240 -bufsize 6000k \
      -vb 400k -maxrate 1500k -deinterlace -vcodec libx264           \
      -preset veryfast -g 30 -r 30 -f flv                            \
      -flvflags no_duration_filesize                                 \
      "rtmp://live-api.facebook.com:80/rtmp/my_key"*/
    
                    // If FFmpeg stops for any reason, close the WebSocket connection.
                    ffmpeg.on('close', (code, signal) => {
                        console.log(socket.id + ' FFmpeg child process closed, code ' + code + ', signal ' + signal);
                        if (code !== 0) {
                            socket.emit('Streams/webrtc/liveStreamingStopped', {platform: platform, rtmpUrl: rtmpUrls});
                        }

                        if(livestreamStreamData && livestreamStreamData.publisherId != null && livestreamStreamData.streamName != null) {
                            postStopMessageAndStopLivestreaming();
                        }
                        if(recordingStreamData && recordingStreamData.publisherId != null && recordingStreamData.streamName != null) {
                            updateRecordingStream(null, null, null, null, +Date.now());
                        }
                        //console.log('End _streamingData');

                        if(_streamingData) _streamingData.end();
                        _streamingData = null;
                        //ffmpeg = null;
                    });
                    // Handle STDIN pipe errors by logging to the console.
                    // These errors most commonly occur when FFmpeg closes and there is still
                    // data to write.  If left unhandled, the server will crash.
                    ffmpeg.stdin.on('error', (e) => {
                        console.log(socket.id + ' FFmpeg STDIN Error', e);
                    });
    
                    // FFmpeg outputs all of its messages to STDERR.  Let's log them to the console.
                    ffmpeg.stderr.on('data', (data) => {
                        console.log(socket.id + ' FFmpeg STDERR:', data.toString());
                    });
    
                    // If the client disconnects, stop FFmpeg.
                    socket.on('disconnect', function() {
                        console.log(socket.id + ' FFmpeg USER DISCONNECTED', ffmpeg.killed);
    
                        ffmpeg.stdin.write('q');
                        ffmpeg.stdin.end();
                        ffmpeg.kill('SIGINT');
                        setTimeout(function() {
                            if(!ffmpeg.killed && livestreamStreamData && livestreamStreamData.publisherId != null && livestreamStreamData.streamName != null) {
                                postStopMessageAndStopLivestreaming();
                            }
                            ffmpeg = null;
                        }, 1000)
                    });
                }
                createFfmpegProcess();
    
                _streamingData.on('data', function (data) {
                    //console.log(socket.id + 'VIDEO DATA0', data);

                    if(ffmpeg != null) {

                        //console.log(socket.id + 'VIDEO DATA1');
    
                        ffmpeg.stdin.write(data);
                    } else {
                        createFfmpegProcess();
                    }
                })
                // When data comes in from the WebSocket, write it to FFmpeg's STDIN.
                socket.on('Streams/webrtc/videoData', function(data) {
                    //console.log(socket.id + ' VIDEODATA', data);
                    if(!_streamingData) {
                        //console.log('createFfmpegProcess create PassThrough')
                        _streamingData = new PassThrough();
                    }

                    _streamingData.push(data);
                    //if(callback) callback();
                    return;
                    for(let d in data) {
                        _streamingData.push(data[d]);
                    }
                    //socket.broadcast.emit('video', data);
                });
            }

            return;
        }


        require('./WebRTC/signaling')(socket, io);

        //console.log('rtmpUrl', rtmpUrl)
        //require('./WebRTC/server2clientWebRTC')(socket, io, rtmpUrl);
        if( socket.handshake.query.limitsEnabled) require('./WebRTC/roomManager')(socket, io);

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
            if(socket.webrtcParticipant && socket.webrtcParticipant.id == socket.client.id) {
                console.log('disconnect socket.webrtcParticipant.id != socket.client.id', socket.webrtcParticipant.id, socket.client.id)
                socket.webrtcParticipant.online = false;
                if(socket.webrtcParticipant.recording.stopTime == null) {
                    socket.webrtcParticipant.recording.stopTime = socket.webrtcParticipant.recording.latestChunkTime;
                }
                socket.webrtcRoom.event.dispatch('participantDisconnected', socket.webrtcParticipant);
            }
            if(socket.webrtcRoom != null) {
                io.of('/webrtc').in(socket.webrtcRoom.id).clients(function (error, clients) {
                    if (clients.length == 0) {
                        processRecordings();
                        //socket.webrtcRoom.close();
                    }
                });
            }
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