(function ($, window, undefined) {
    var ua = navigator.userAgent;
    var _isMobile = false;
    var _isiOS = false;
    var _isAndroid = false;
    var _isiOSCordova = false;
    var _isAndroidCordova = false;
    if (ua.indexOf('iPad') != -1 || ua.indexOf('iPhone') != -1 || ua.indexOf('iPod') != -1) _isiOS = true;
    if (ua.indexOf('Android') != -1) _isAndroid = true;
    if (ua.indexOf('Android') != -1 || ua.indexOf('iPhone') != -1) _isMobile = true;
    if (typeof cordova != 'undefined' && _isiOS) _isiOSCordova = true;
    if (typeof cordova != 'undefined' && _isAndroid) _isAndroidCordova = true;

    /**
     * Streams/webrtc/livestreaming/rtmpSender tool.
     * 
     * @module Streams
     * @class Streams webrtc
     * @constructor
     * @param {Object} options
     */
    Q.Tool.define("Streams/webrtc/livestreaming/rtmpSender", function(options) {
            if (!options.webrtcSignalingLib ) {
                throw "webrtcSignalingLib is required";
            }

            this.create();
        },

        {
            webrtcSignalingLib: null,
        },

        {
            create: function() {
                var tool = this;
                tool.rtmpSender = (function () {
                    var _webrtcSignalingLib = tool.state.webrtcSignalingLib;
                    var _webrtcUserInterface = tool.state.webrtcUserInterface;
                    var _canvasComposerTool = tool.state.canvasComposerTool;
                    var _canvasComposer = _canvasComposerTool.canvasComposer;
                    var _options = _webrtcSignalingLib.getOptions();
                    var _streamingSocket = {};
                    var _veryFirstBlobs = [];
                    var _blackBlobs = [];

                    var _localInfo = _webrtcSignalingLib.getLocalInfo();
        
                    var _videoStream = {blobs: [], allBlobs: [], size: 0, timer: null}
        
                    function connect(rtmpUrls, platform, callback) {
                        if(typeof io == 'undefined') return;
                        log('startStreaming connect');
        
                        var secure = _options.nodeServer.indexOf('https://') == 0;
                        _streamingSocket[platform] = {}
                        _streamingSocket[platform].socket = window.sSocket = io.connect(_options.nodeServer + '/webrtc', {
                            query: {
                                rtmp: JSON.stringify(rtmpUrls),
                                localInfo: JSON.stringify(_localInfo),
                                platform: platform
                            },
                            transports: ['websocket'],
                            'force new connection': true,
                            secure:secure,
                            reconnection: true,
                            reconnectionDelay: 1000,
                            reconnectionDelayMax: 5000,
                            reconnectionAttempts: 5
                        });
                        _streamingSocket[platform].socket.on('connect', function () {
                            if(callback != null) callback();
                        });
                        _streamingSocket[platform].socket.on('Streams/webrtc/liveStreamingStopped', function (e) {
                            _streamingSocket[platform].socket.disconnect();
                            _webrtcSignalingLib.event.dispatch('liveStreamingStopped', e);
                            _webrtcSignalingLib.signalingDispatcher.sendDataTrackMessage("liveStreamingEnded", e.platform);
                        });
                    }
        
                    function onDataAvailablehandler(blob) {
        
                        _videoStream.blobs.push(blob);
                        _videoStream.allBlobs.push(blob);
        
                        _videoStream.size += blob.size;
        
                        if(_options.liveStreaming.timeSlice != null) return;
        
                    }
        
                    function creteEmptyVideo(width, height) {
                        if(typeof width == 'undefined') width = 1280;
                        if(typeof height == 'undefined') height = 768;
        
                        let canvas = Object.assign(document.createElement("canvas"), {width, height});
                        canvas.getContext('2d').fillRect(0, 0, width, height);
                        let stream = canvas.captureStream();
        
                        //return Object.assign(stream.getVideoTracks()[0], {enabled: false});
                        var codecs = 'video/webm;codecs=vp8';
        
                        //alert('mp4 ' + (MediaRecorder.isTypeSupported('video/mp4;codecs="vp8"')));
                        if (MediaRecorder.isTypeSupported('video/mp4')) {
                            codecs = 'video/mp4';
                        } else if(isChrome && !_isMobile) {
                            codecs = 'video/webm;codecs=h264';
                        } else if (_isMobile && _isAndroid) {
                            codecs = 'video/webm;codecs=vp8';
                        }
        
                        var mediaRecorder = new MediaRecorder(stream, {
                            //mimeType: 'video/webm',
                            mimeType: codecs,
                            /*audioBitsPerSecond : 128000,*/
                            videoBitsPerSecond : 3 * 1024 * 1024
                        });
        
                        mediaRecorder.onerror = function(e) {
                            console.error(e);
                        }
        
                        mediaRecorder.addEventListener('dataavailable', function(e) {
                            if(_blackBlobs.length < 10){
                                _blackBlobs.push(e.data);
                            } else {
                                mediaRecorder.stop();
                                stream.getVideoTracks()[0].stop();
                            }
                        });
        
                        mediaRecorder.start(2000); // Start recordin
        
                    }
        
                    function startStreaming(rtmpUrls, service) {
                        log('startStreaming', rtmpUrls);
                        //creteEmptyVideo();
                        connect(rtmpUrls, service, function () {
                            log('startStreaming connected');
        
                            if(_veryFirstBlobs.length != 0 && _streamingSocket[service] != null) {
                                //let firstBlobsToProcess = _veryFirstBlobs.splice(0, (_veryFirstBlobs.length - 1));
                                /* let firstBlobsToProcess = new Blob(_veryFirstBlobs);
                                 _streamingSocket[service].socket.emit('Streams/webrtc/videoData', firstBlobsToProcess, function() {
                                     _streamingSocket[service].firstBlobSent = true;
                                 });*/
        
                                for(let i in _veryFirstBlobs) {
                                    _streamingSocket[service].socket.emit('Streams/webrtc/videoData', _veryFirstBlobs[i], function() {
                                    });
                                    if(i == _veryFirstBlobs.length - 1) {
                                        _streamingSocket[service].firstBlobSent = true;
                                    }
                                }
        
                            }
        
                            _canvasComposer.startRecorder(function (blob) {
                                //onDataAvailablehandler(blob);
                                //console.log('onDataAvailablehandler', blob.size, blob)
                                if(_streamingSocket[service] == null) return;
                                if(_veryFirstBlobs.length < 10) {
                                    _veryFirstBlobs.push(blob);
                                    _streamingSocket[service].firstBlobSent = true;
                                }
                                if(_streamingSocket[service].firstBlobSent) {
                                    //console.log('onDataAvailablehandler ', service, _streamingSocket[service].socket.id)
                                    //console.log('onDataAvailablehandler ', blob, blob.timestump)
        
                                    //if(!canvasComposer.videoTrackIsMuted()) {
                                        _streamingSocket[service].socket.emit('Streams/webrtc/videoData', blob);
                                    /*} else {
                                        console.log('onDataAvailablehandler vTrack is MUTED')
        
                                        var blobToSend = new Blob([_veryFirstBlobs[_veryFirstBlobs.length - 1], blob]);
                                        _streamingSocket[service].socket.emit('Streams/webrtc/videoData', blobToSend);
                                    }*/
                                }
                            });
        
                            /*var timer = function() {
                                if(_videoStream.blobs.length != 0) {
                                    let blobsToSend = _videoStream.blobs.splice(0, (_videoStream.blobs.length - 1));
                                    var mergedBlob = new Blob(blobsToSend);
                                    if(_streamingSocket[service]) _streamingSocket[service].socket.emit('Streams/webrtc/videoData', mergedBlob);
                                }
                                _videoStream.timer = setTimeout(timer, 5000);
                            }
        
                            _videoStream.timer = setTimeout(timer, 5000);*/
                            
                            _webrtcSignalingLib.event.dispatch('liveStreamingStarted', {participant:_webrtcSignalingLib.localParticipant(), platform:service});
                            _webrtcSignalingLib.signalingDispatcher.sendDataTrackMessage("liveStreamingStarted", service);
                        });
                    }
        
                    function log(text) {
                        if(!_options.debug.liveStreaming) return;
                        var args = Array.prototype.slice.call(arguments);
                        var params = [];

                        if (window.performance) {
                            var now = (window.performance.now() / 1000).toFixed(3);
                            params.push(now + ": " + args.splice(0, 1));
                            params = params.concat(args);
                            console.log.apply(console, params);
                        } else {
                            params = params.concat(args);
                            console.log.apply(console, params);
                        }
                        _webrtcUserInterface.appDebug.logInfo(params);
                    }
        
                    return {
                        goLive: function () {
                            log('goLiveDialog goLive');
                        },
                        endStreaming: function (service) {
                            log('endStreaming', service);
        
                            /*clearTimeout(_videoStream.timer);
                            let blobsToSend = _videoStream.blobs.splice(0, (_videoStream.blobs.length - 1));
                            var mergedBlob = new Blob(blobsToSend);
                            if(service && _streamingSocket[service] != null) _streamingSocket[service].socket.emit('Streams/webrtc/videoData', mergedBlob);*/
        
                            _canvasComposer.stopRecorder();
        
                            if(service != null && _streamingSocket[service] != null) {
                                _streamingSocket[service].socket.disconnect();
                                delete _streamingSocket[service];
        
                            } else {
                                for(let propName in _streamingSocket) {
                                    if(_streamingSocket[propName] != null && _streamingSocket[propName].socket.connected) {
                                        _streamingSocket[propName].socket.disconnect();
                                        _streamingSocket[propName] = null;
                                    }
                                }
                            }
                            _veryFirstBlobs = [];
        
                            _webrtcSignalingLib.event.dispatch('liveStreamingEnded', {participant:_webrtcSignalingLib.localParticipant(), platform:service});
                            _webrtcSignalingLib.signalingDispatcher.sendDataTrackMessage("liveStreamingEnded", service);
        
                        },
                        isStreaming: function (platform) {
                            if(!platform){
                                for(let propName in _streamingSocket) {
                                    log('livestreamingManager: isStreaming', propName, _streamingSocket[propName]);
                                    if(_streamingSocket[propName] != null && _streamingSocket[propName].socket.connected) {
                                        return true;
                                    }
                                }
                            } else if(platform != null && _streamingSocket[platform] != null && _streamingSocket[platform].connected) {
                                return true;
                            }
                            return false;
                        },
                        startStreaming: startStreaming,
                        videoStream:function () {
                            return _videoStream;
                        },
                        updateRoomInstance:function (newRoomInstance) {
                            return _webrtcSignalingLib = newRoomInstance;
                        }
                    }
                }())
            },
            refresh: function() {
                var tool = this;
                tool.rtmpSender.updateRoomInstance(tool.state.webrtcSignalingLib)

            }
        }

    );

})(window.jQuery, window);