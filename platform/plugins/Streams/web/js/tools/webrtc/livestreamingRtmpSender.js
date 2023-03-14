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
            var tool = this;
            if (!options.webrtcUserInterface) {
                throw "webrtcUserInterface is required";
            }

            tool.webrtcUserInterface = options.webrtcUserInterface();
            tool.webrtcSignalingLib = tool.webrtcUserInterface.currentConferenceLibInstance();

            this.create();
        },

        {
            webrtcUserInterface: null,
        },

        {
            declareOrRefreshEventHandlers: function() {
                var tool = this;
                var webrtcSignalingLib = tool.webrtcSignalingLib;
                webrtcSignalingLib.event.on('beforeSwitchRoom', function (e) {
                    tool.updateWebrtcSignalingLibInstance(e.newWebrtcSignalingLibInstance);
                    tool.declareOrRefreshEventHandlers();
                });
            },
            updateWebrtcSignalingLibInstance: function (newWebrtcSignalingLib) {
                var tool = this;
                if(tool.webrtcSignalingLib != newWebrtcSignalingLib) {
                    tool.webrtcSignalingLib = newWebrtcSignalingLib;
                }
            },
            create: function() {
                var tool = this;
                tool.rtmpSender = (function () {
                    var _webrtcUserInterface = tool.webrtcUserInterface;
                    var _canvasComposerTool = tool.state.canvasComposerTool;
                    var _canvasComposer = _canvasComposerTool.canvasComposer;
                    var _streamingSocket = {};
                    var _veryFirstBlobs = [];
        
                    var _videoStream = {blobs: [], allBlobs: [], size: 0, timer: null}
        
                    function connect(rtmpUrls, platform, livestreamStream, callback) {
                        if(typeof io == 'undefined') return;
                        log('startStreaming connect');

                        var _options = tool.webrtcSignalingLib.getOptions();
                        var secure = _options.nodeServer.indexOf('https://') == 0;
                        _streamingSocket[platform] = {}
                        console.log('tool.webrtcSignalingLib.localParticipant().connectedTime', tool.webrtcSignalingLib.localParticipant())

                        var _localInfo = tool.webrtcSignalingLib.getLocalInfo();
                        _streamingSocket[platform].socket = window.sSocket = io.connect(_options.nodeServer + '/webrtc', {
                            query: {
                                rtmp: rtmpUrls.length != 0 ? JSON.stringify(rtmpUrls) : '',
                                recording: platform == 'rec' ? true : '',
                                livestreamStream: livestreamStream ? JSON.stringify({ publisherId: livestreamStream.fields.publisherId, streamName: livestreamStream.fields.name }) : null,
                                localInfo: JSON.stringify(_localInfo),
                                platform: platform,
                                roomId: _webrtcUserInterface.roomStream() ? _webrtcUserInterface.roomStream().fields.name.split('/')[2] : 'undefined',
                                roomStartTime: _webrtcUserInterface.roomStream() ? _webrtcUserInterface.roomStream().getAttribute('startTime') : 'undefined',
                                userId: tool.webrtcSignalingLib.localParticipant().identity.split('\t')[0],
                                userConnectedTime: tool.webrtcSignalingLib.localParticipant().connectedTime
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
                            tool.webrtcSignalingLib.event.dispatch('liveStreamingStopped', e);
                            tool.webrtcSignalingLib.signalingDispatcher.sendDataTrackMessage("liveStreamingEnded", e.platform);
                        });
                    }
        
                    function startStreaming(rtmpUrls, service, livestreamStream) {
                        log('startStreaming', rtmpUrls);
                        connect(rtmpUrls, service, livestreamStream, function () {
                            log('startStreaming connected');
        
                            if(_veryFirstBlobs.length != 0 && _streamingSocket[service] != null) {
                                for(let i in _veryFirstBlobs) {
                                    _streamingSocket[service].socket.emit('Streams/webrtc/videoData', _veryFirstBlobs[i], function() {
                                    });
                                    if(i == _veryFirstBlobs.length - 1) {
                                        _streamingSocket[service].firstBlobSent = true;
                                    }
                                }
                            }
        
                            _canvasComposer.startRecorder(function (blob) {
                                if(_streamingSocket[service] == null) return;
                                if(_veryFirstBlobs.length < 10) {
                                    _veryFirstBlobs.push(blob);
                                    _streamingSocket[service].firstBlobSent = true;
                                }
                                if(_streamingSocket[service].firstBlobSent) {        
                                    _streamingSocket[service].socket.emit('Streams/webrtc/videoData', blob);
                                }
        
                            });
                            
                            tool.webrtcSignalingLib.event.dispatch('liveStreamingStarted', {participant:tool.webrtcSignalingLib.localParticipant(), platform:service});
                            tool.webrtcSignalingLib.signalingDispatcher.sendDataTrackMessage("liveStreamingStarted", service);
                        });
                    }
        
                    function startRecordingOnServer() {
                        log('startRecordingOnServer');
                        connect([], 'rec', null, function () {
                            log('startRecordingOnServer connected');

                            _canvasComposer.startRecorder(function (blob) {
                                if(_streamingSocket['rec'] == null) return;
                                _streamingSocket['rec'].socket.emit('Streams/webrtc/videoData', blob);
                            });
                                    
                            tool.webrtcSignalingLib.event.dispatch('recordingOnSeverStarted', {participant:tool.webrtcSignalingLib.localParticipant()});
                            tool.webrtcSignalingLib.signalingDispatcher.sendDataTrackMessage("recordingOnSeverStarted");
                        });
                    }
        
                    function stopRecordingOnSever(stopCanvasDrawingAndMixing) {
                        log('stopRecordingOnSever');
    
                        let activeStreamingsOrrRecordings = 0;
                        for(let propName in _streamingSocket) {
                            if(propName == 'rec') continue;
                            if(_streamingSocket[propName] != null && _streamingSocket[propName].socket.connected) {
                                activeStreamingsOrrRecordings++;
                            }
                        }
                        
                        if(activeStreamingsOrrRecordings == 0) _canvasComposer.stopRecorder(stopCanvasDrawingAndMixing);
    
                        if(_streamingSocket['rec'] != null) {
                            _streamingSocket['rec'].socket.disconnect();
                            delete _streamingSocket['rec'];
    
                        }

                        tool.webrtcSignalingLib.event.dispatch('recordingOnSeverEnded', {participant:tool.webrtcSignalingLib.localParticipant()});
                        tool.webrtcSignalingLib.signalingDispatcher.sendDataTrackMessage("recordingOnSeverEnded");
    
                    }
        
                    function log(text) {
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
                        endStreaming: function (service, stopCanvasDrawingAndMixing) {
                            log('endStreaming', service);
        
                            _canvasComposer.stopRecorder(stopCanvasDrawingAndMixing);
        
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

                            _videoStream.blobs = [];
                            _videoStream.allBlobs = [];
                            
                            _videoStream.size = 0;
        
                            tool.webrtcSignalingLib.event.dispatch('liveStreamingEnded', {participant:tool.webrtcSignalingLib.localParticipant(), platform:service});
                            tool.webrtcSignalingLib.signalingDispatcher.sendDataTrackMessage("liveStreamingEnded", service);
        
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
                        startRecordingOnServer: startRecordingOnServer,
                        stopRecordingOnSever: stopRecordingOnSever,
                        videoStream:function () {
                            return _videoStream;
                        }
                    }
                }())
            },
            refresh: function() {
                var tool = this;
            }
        }

    );

})(window.jQuery, window);