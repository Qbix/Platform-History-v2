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
     * Streams/webrtc/control tool.
     * Users can chat with each other via WebRTC using Twilio or raw streams
     * @module Streams
     * @class Streams webrtc
     * @constructor
     * @param {Object} options
     *  Hash of possible options
     */
    Q.Tool.define("Streams/webrtc/livestreaming/canvasComposer", function(options) {
            this.advancedLiveStreamingBox = null;

            if (!this.state.webrtcSignalingLib ) {
                throw "webrtcSignalingLib is required";
            }

            this.create();
        },

        {
            webrtcSignalingLib: null,
            webrtcUserInterface: null,
        },

        {
            create: function() {
                var tool = this;
                tool.canvasComposer = (function () {
                    var _webrtcSignalingLib = tool.state.webrtcSignalingLib;
                    var _webrtcUserInterface = tool.state.webrtcUserInterface;
                    var _options = tool.state.webrtcSignalingLib.getOptions();
                    var _composerIsActive = false;
                    var _canvas = null;
                    var _canvasMediStream = null;
                    var _mediaRecorder = null;
                    var _videoTrackIsMuted = false;
                    var _dataListeners = [];
                    var _eventDispatcher = new EventSystem();
                    var _localInfo = _webrtcSignalingLib.getLocalInfo();
        
                    var _scenes = [];
                    var _activeScene = null;
                    var _defaultScene = null;
                    var _globalAudioSources = [];
        
        
                    var Scene = function () {
                        this.title = null;
                        this.sources = []; //usual user's sources
                        this.additionalSources = []; //for tititles
                        this.overlaySources = []; //for watermarks
                        this.backgroundSources = []; //for backgrounds
                        this.audioSources = [];
                        this.videoAudioSources = [];
                        this.eventDispatcher = new EventSystem();
                    }
        
                    var defaultScene = new Scene();
                    defaultScene.title = 'Scene 1';
                    _defaultScene = _activeScene = defaultScene;
                    _scenes.push(defaultScene);
        
        
                    function createScene(name) {
                        console.log('canvasComposer: createScene');
                        var newScene = new Scene();
                        newScene.id = generateId();
                        newScene.title = name;
                        _scenes.push(newScene);
                    }
        
                    function removeScene(sceneInstance) {
                        console.log('canvasComposer: removeScene', sceneInstance);
                        for (let s in _scenes) {
                            if (_scenes[s] == sceneInstance) {
                                _scenes.splice(s, 1)
                                break;
                            }
                        }
                        console.log('canvasComposer: removeScene: scenes.sources', sceneInstance.sources.length);
        
                        for (let r in sceneInstance.sources) {
                            videoComposer.removeSource(sceneInstance.sources[r], sceneInstance, true);
                        }
                        console.log('canvasComposer: removeScene: scenes.sources 2', sceneInstance.sources.length);
        
                    }
        
                    function getScenes() {
                        return _scenes;
                    }
        
                    function moveSceneUp(scene) {
                        let index;
                        for(let i in _scenes) {
                            if(scene == _scenes[i]) {
                                index = parseInt(i);
                                break;
                            }
                        }
                        if(index != null) {
                            moveScene(index, index - 1);
                        }
                    }
        
                    function moveSceneDown(scene) {
                        let index;
                        for(let i in _scenes) {
                            if(scene == _scenes[i]) {
                                index = parseInt(i);
                                break;
                            }
                        }
                        if(index != null) {
                            moveScene(index, index + 1);
                        }
                    }
        
                    function moveScene(old_index, new_index) {
                        console.log('moveScene', old_index, new_index);
                        if (new_index < 0) {
                            new_index = 0;
                        }
                        if (new_index >= _scenes.length) {
                            new_index = _scenes.length - 1;
                        }
                        _scenes.splice(new_index, 0, _scenes.splice(old_index, 1)[0]);
                        _eventDispatcher.dispatch('sceneMoved');
        
                        return _scenes;
                    }
        
                    function selectScene(sceneInstance) {
                        console.log('selectScene', sceneInstance);
        
                        let sceneExists = false;
                        for(let s in _scenes) {
                            if(_scenes[s] == sceneInstance) sceneExists = true;
                        }
                        if(sceneExists) {
                            //pause all playing video/audio sources of previous scene
                            for (let i in _activeScene.sources) {
                                if(_activeScene.sources[i].sourceType != 'video') continue;
                                if(_activeScene.sources[i].videoInstance) {
                                    _activeScene.sources[i].videoInstance.pause();
                                    _activeScene.sources[i].videoInstance.currentTime = 0;
                                }
                            }
                            for (let i in _activeScene.audioSources) {
                                if(_activeScene.audioSources[i].sourceType == 'audio' && _activeScene.audioSources[i].audioInstance) {
                                    _activeScene.audioSources[i].audioInstance.pause();
                                    _activeScene.audioSources[i].audioInstance.currentTime = 0;
                                } else if (_activeScene.audioSources[i].sourceType == 'webrtc' && _activeScene.audioSources[i].mediaStreamTrack) {
                                    _activeScene.audioSources[i].mediaStreamTrack.enabled = false;
                                }
                                
                            }
        
                            /*for (let i in _activeScene.audioSources) {
                                audioComposer.muteSource(_activeScene.audioSources[i])
                            }*/
                            _activeScene = sceneInstance;
                             //play all playing video/audio sources of new scene
                            for (let i in _activeScene.sources) {
                                if(_activeScene.sources[i].sourceType != 'video') continue;
                                if(_activeScene.sources[i].videoInstance) {
                                    _activeScene.sources[i].videoInstance.play();
                                }
                            }
                            for (let i in _activeScene.audioSources) {
                                if(_activeScene.audioSources[i].sourceType == 'audio' && _activeScene.audioSources[i].audioInstance) {
                                    _activeScene.audioSources[i].audioInstance.play();
                                } else if (_activeScene.audioSources[i].sourceType == 'webrtc' && _activeScene.audioSources[i].mediaStreamTrack) {
                                    if(_activeScene.audioSources[i].active)  _activeScene.audioSources[i].mediaStreamTrack.enabled = true;
                                }
                            }
                            _eventDispatcher.dispatch('sceneSelected');
                            return true;
                        }
                        return false;
                    }
        
                    function getActiveScene() {
                        return _activeScene;
                    }
        
                    var videoComposer = (function () {
                        var _webrtcAudioGroup = null;
                        var _availableWebRTCSources = [];
                        var _size = {width:1280, height: 720};
                        var _inputCtx = null;
                        var _isActive = null;
        
                        function createCanvas() {
                            var videoCanvas = document.createElement("CANVAS");
                            videoCanvas.className = "Streams_webrtc_video-stream-canvas";
                            videoCanvas.style.position = 'absolute';
                            videoCanvas.style.top = '-999999999px';
                            //videoCanvas.style.top = '0';
                            videoCanvas.style.left = '0';
                            //videoCanvas.style.zIndex = '9999999999999999999';
                            videoCanvas.style.backgroundColor = '#000000';
                            videoCanvas.width = _size.width;
                            videoCanvas.height = _size.height;
        
                            _inputCtx = videoCanvas.getContext('2d');
        
                            _canvas = videoCanvas;
        
                        }
                        createCanvas();
        
                        function setCanvasSize(width, height){
                            _size.width = width;
                            _size.height = height;
                            _canvas.width = _size.width;
                            _canvas.height = _size.height;
                        }
        
                        function getCanvasSize() {
                            return _size;
                        }
        
                        function setWebrtcLayoutRect(width, height, x, y){
                            console.log('setWebrtcLayoutRect', width, height, x, y);
                            if(width === null || height === null || x === null || y === null) return;
                            if(width != null) _webrtcLayoutRect.width = parseFloat(width);
                            if(height != null) _webrtcLayoutRect.height = parseFloat(height);
                            if(x != null) _webrtcLayoutRect.x = parseFloat(x);
                            if(y != null) _webrtcLayoutRect.y = parseFloat(y);
                            if(_webrtcLayoutRect.updateTimeout != null) {
                                clearTimeout(_webrtcLayoutRect.updateTimeout);
                                _webrtcLayoutRect.updateTimeout = null;
                            }
                            _webrtcLayoutRect.updateTimeout = setTimeout(function () {
                                updateActiveWebRTCLayouts();
        
                            }, 100)
        
                        }
        
                        function getWebrtcLayoutRect(){
                            return _webrtcLayoutRect;
                        }
        
                        var Source = function () {
                            this._id = null;
                            this.active = true;
                            this._name = null;
                            this.rect = null;
                            this.parentGroup = null;
                            this._color = null;
                            this.on = function (event, callback) {
                                if(this.eventDispatcher != null) this.eventDispatcher.on(event, callback)
                            };
                            this.params = {};
                        }
        
                        Object.defineProperties(Source.prototype, {
                            'name': {
                                'set': function(val) {
                                    this._name = val;
                                    if(this.eventDispatcher != null) this.eventDispatcher.dispatch('nameChanged', val)
                                },
                                'get': function() {
                                    return this._name;
                                }
                            },
                            'color': {
                                'get': function () {
                                    if(this._color != null) return this._color;
                                    var letters = '0123456789ABCDEF';
                                    var color = '#';
                                    for (let i = 0; i < 6; i++) {
                                        color += letters[Math.floor(Math.random() * 16)];
                                    }
                                    this._color = color;
                                    return color;
                                }
                            },
                            'rect': {
                                'set': function(value) {
                                    this._rect = value;
                                    if(this.eventDispatcher != null) this.eventDispatcher.dispatch('rectChanged')
                                },
                                'get': function() {
                                    return this._rect;
                                }
                            },
                            'id': {
                                'set': function(value) {
                                    this._id = value;
                                },
                                'get': function() {
                                    if(this._id == null) {
                                        this._id = generateId();
                                    }
                                    return this._id;
                                }
                            }
                        });
        
                        var ImageSource = function () {
                            var imageInstance = this;
                            this.imageInstance = null;
                            this.link = null;
                            this.sourceType = 'image';
                            this.rect = {
                                _width:null,
                                _height:null,
                                _x:null,
                                _y:null,
                                set x(value) {
                                    this._x = value;
                                    if(imageInstance.eventDispatcher != null) imageInstance.eventDispatcher.dispatch('rectChanged')
                                },
                                set y(value) {
                                    this._y = value;
                                    if(imageInstance.eventDispatcher != null) imageInstance.eventDispatcher.dispatch('rectChanged')
                                },
                                set width(value) {
                                    this._width = value;
                                    if(imageInstance.eventDispatcher != null) imageInstance.eventDispatcher.dispatch('rectChanged')
                                },
                                set height(value) {
                                    this._height = value;
                                    if(imageInstance.eventDispatcher != null) imageInstance.eventDispatcher.dispatch('rectChanged')
                                },
                                get x() {return this._x;},
                                get y() {return this._y;}
                            };
                            this.updateRect = function (width, height, x, y) {
                                this.rect._width = width;
                                this.rect._height = height;
                                this.rect._x = x;
                                this.rect._y = y;
                            };
        
                            this.eventDispatcher = new EventSystem();
        
                            Object.defineProperties(this.rect, {
                                'x': {
                                    'set': function(value) {
                                        this._x = value;
                                        if(imageInstance.eventDispatcher != null) imageInstance.eventDispatcher.dispatch('rectChanged')
                                    }
                                },
                                'y': {
                                    'set': function(value) {
                                        this._y = value;
                                        if(imageInstance.eventDispatcher != null) imageInstance.eventDispatcher.dispatch('rectChanged')
                                    }
                                },
                                'width': {
                                    'set': function(value) {
                                        this._width = value;
                                        if(imageInstance.eventDispatcher != null) imageInstance.eventDispatcher.dispatch('rectChanged')
                                    }
                                },
                                'height': {
                                    'set': function(value) {
                                        this._height = value;
                                        if(imageInstance.eventDispatcher != null) imageInstance.eventDispatcher.dispatch('rectChanged')
                                    }
                                }
                            });
                        }
        
                        ImageSource.prototype = new Source();
        
                        var VideoSource = function () {
                            var videoInstance = this;
                            this.videoInstance = null;
                            this.link = null;
                            this.sourceType = 'video';
                            this.audioSourceNode = null;
                            this.rect = {
                                _width:null,
                                _height:null,
                                _x:null,
                                _y:null,
                                set x(value) {
                                    this._x = value;
                                    if(videoInstance.eventDispatcher != null) videoInstance.eventDispatcher.dispatch('rectChanged')
                                },
                                set y(value) {
                                    this._y = value;
                                    if(videoInstance.eventDispatcher != null) videoInstance.eventDispatcher.dispatch('rectChanged')
                                },
                                get x() {return this._x;},
                                get y() {return this._y;}
                            };
                            this.updateRect = function (width, height, x, y) {
                                this.rect._width = width;
                                this.rect._height = height;
                                this.rect._x = x;
                                this.rect._y = y;
                            };
        
                            this.setVolume = function (value) {
                                if (!this.gainNode) return;
                                this.gainNode.gain.value = value;
                                if (this.eventDispatcher != null) this.eventDispatcher.dispatch('volumeChanged', value);
                            };
        
                            this.eventDispatcher = new EventSystem();
        
                            Object.defineProperties(this.rect, {
                                'x': {
                                    'set': function(value) {
                                        this._x = value;
                                        if(videoInstance.eventDispatcher != null) videoInstance.eventDispatcher.dispatch('rectChanged')
                                    }
                                },
                                'y': {
                                    'set': function(value) {
                                        this._y = value;
                                        if(videoInstance.eventDispatcher != null) videoInstance.eventDispatcher.dispatch('rectChanged')
                                    }
                                },
                                'width': {
                                    'set': function(value) {
                                        this._width = value;
                                        if(videoInstance.eventDispatcher != null) videoInstance.eventDispatcher.dispatch('rectChanged')
                                    }
                                },
                                'height': {
                                    'set': function(value) {
                                        this._height = value;
                                        if(videoInstance.eventDispatcher != null) videoInstance.eventDispatcher.dispatch('rectChanged')
                                    }
                                }
                            });
                        }
                        VideoSource.prototype = new Source();
        
                        var VideoInputSource = function () {
                            var instance = this;
                            this.mediaStream = null;
                            this.videoInstance = null;
                            this.sourceType = 'videoInput';
                            this.audioSourceNode = null;
                            this.rect = {
                                _width: null,
                                _height: null,
                                _x: null,
                                _y: null,
                                set x(value) {
                                    this._x = value;
                                    if (instance.eventDispatcher != null) instance.eventDispatcher.dispatch('rectChanged');
                                },
                                set y(value) {
                                    this._y = value;
                                    if (instance.eventDispatcher != null) instance.eventDispatcher.dispatch('rectChanged');
                                },
                                set width(value) {
                                    this._width = value;
                                    if (instance.eventDispatcher != null) instance.eventDispatcher.dispatch('rectChanged');
                                },
                                set height(value) {
                                    this._height = value;
                                    if (instance.eventDispatcher != null) instance.eventDispatcher.dispatch('rectChanged');
                                },
                                get x() { return this._x; },
                                get y() { return this._y; }
                            };
                            // original size of video
                            this.originalSize = {};
                            this.frameRate = null;
                            this.isScreensharing = false;
                
                            this.update = function (e) {
                                console.log('VideoInputSource update', e);
                                
                                if (instance.mediaStream != null && e.stream && e.stream != instance.mediaStream) {
                                    let tracks = instance.mediaStream.getTracks();
                                    for (let t in tracks) {
                                        tracks[t].stop();
                                    }
                
                                    instance.mediaStream = e.stream;
                                }
                                if (e.originalSize != null) {
                                    instance.originalSize = e.originalSize;
                                }
                                if (e.frameRate != null) {
                                    instance.frameRate = e.frameRate;
                                }
                                instance.name = e.name;
                            }
                
                            this.eventDispatcher = new EventSystem();
                
                        }
                        VideoInputSource.prototype = new Source();
        
                        var RectObjectSource = function (rect) {
                            this.sourceType = 'webrtcrect';
                            this.widthFrom = rect.widthFrom;
                            this.widthTo = rect.widthTo;
                            this.heightFrom = rect.heightFrom;
                            this.heightTo = rect.heightTo;
                            this.frame = rect.frame;
                            this.frames= rect.frames;
                            this.xFrom = rect.xFrom;
                            this.xTo = rect.xTo;
                            this.yFrom = rect.yFrom;
                            this.yTo = rect.yTo;
                            this.fill = rect.fill;
                            this.baseSource = rect.baseSource;
                            this.eventDispatcher = new EventSystem();
        
                        }
                        RectObjectSource.prototype = new Source();
        
                        var StrokeRectObjectSource = function (rect) {
                            this.sourceType = 'strokerect';
                            this.widthFrom = rect.widthFrom;
                            this.widthTo = rect.widthTo;
                            this.heightFrom = rect.heightFrom;
                            this.heightTo = rect.heightTo;
                            this.frame = rect.frame;
                            this.frames= rect.frames;
                            this.xFrom = rect.xFrom;
                            this.xTo = rect.xTo;
                            this.yFrom = rect.yFrom;
                            this.yTo = rect.yTo;
                            this.strokeStyle = rect.strokeStyle;
                            this.lineWidth = rect.lineWidth;
                            this.baseSource = rect.baseSource;
                            this.eventDispatcher = new EventSystem();
        
                        }
                        StrokeRectObjectSource.prototype = new Source();
        
                        var TextObjectSource = function (text) {
                            this.sourceType = 'webrtctext';
                            this.text = text.text;
                            this.font = text.font;
                            this.fillStyle = text.fillStyle;
                            this.textHeight = text.textHeight;
                            this.latestSize = text.latestSize;
                            this.frame = text.frame;
                            this.frames= text.frames;
                            this.xFrom = text.xFrom;
                            this.xTo = text.xTo;
                            this.yFrom = text.yFrom;
                            this.yTo = text.yTo;
                            this.fill = text.fill;
                            this.baseSource = text.baseSource;
                            this.eventDispatcher = new EventSystem();
        
                        }
                        TextObjectSource.prototype = new Source();
        
                        var GroupSource = function () {
                            let groupInstance = this;
                            this.groupType = null;
                            this.sourceType = 'group';
                            this.layoutName = null;
                            this.size = {width:_size.width, height:_size.height};
                            this.rect = {
                                _width:1280, 
                                _height: 720, 
                                _x: 0, 
                                _y: 0, 
                                updateTimeout: null,
                                updateGroupLayout: function () {
                                    if(this.updateTimeout != null) {
                                        clearTimeout(this.updateTimeout);
                                        this.updateTimeout = null;
                                    }
                                    this.updateTimeout = setTimeout(function () {
                                        updateWebRTCLayout(groupInstance);
                                    }, 100)
                                },
                                set x(value) {
                                    this._x = value;
                                    if(groupInstance.eventDispatcher != null) groupInstance.eventDispatcher.dispatch('rectChanged');
                                    this.updateGroupLayout();
                                },
                                set y(value) {
                                    this._y = value;
                                    if(groupInstance.eventDispatcher != null) groupInstance.eventDispatcher.dispatch('rectChanged');
                                    this.updateGroupLayout();
                                },
                                set width(value) {
                                    this._width = value;
                                    if(groupInstance.eventDispatcher != null) groupInstance.eventDispatcher.dispatch('rectChanged');
                                    this.updateGroupLayout();
                                },
                                set height(value) {
                                    this._height = value;
                                    if(groupInstance.eventDispatcher != null) groupInstance.eventDispatcher.dispatch('rectChanged');
                                    this.updateGroupLayout();
                                },
                                get x() {return this._x;},
                                get y() {return this._y;},
                                get width() {return this._width;},
                                get height() {return this._height;}
                            };
                            this.params = {
                                showLabelWithNames: _options.liveStreaming.showLabelWithNames,
                                showLayoutBorders: _options.liveStreaming.showLayoutBorders,
                                tiledLayoutMargins: _options.liveStreaming.tiledLayoutMargins,
                                audioLayoutBgColor: _options.liveStreaming.audioLayoutBgColor,
                                defaultLayout: _options.liveStreaming.defaultLayout || 'tiledStreamingLayout',
                            };
                            this.getChildSources = function(type, active) {
                                console.log('getChildSources', type)
            
                                if(groupInstance.groupType == 'webrtc') {
                                    console.log('getChildSources _activeScene', _activeScene)
                                    console.log('getChildSources _activeScene.sources', _activeScene.sources)
                                    if(active == null) {
                                        return _activeScene.sources.filter(function (source) {
                                            return source.sourceType == type && source.parentGroup != null && source.parentGroup == groupInstance;
                                        });
                
                                    }
                                    return _activeScene.sources.filter(function (source) {
                                        return source.sourceType == type && source.parentGroup != null && source.parentGroup == groupInstance && source.active === true;
                                    });
                                }
                            }
                                
                            this.eventDispatcher = new EventSystem();
                        }
                        GroupSource.prototype = new Source();
                        var webrtcGroup = new GroupSource()
                        webrtcGroup.name = 'Video Chat';
                        webrtcGroup.groupType = 'webrtc';
                        defaultScene.sources.push(webrtcGroup);
        
                        var WebRTCStreamSource = function (participant) {
                            this.kind = null;
                            this.participant = participant;
                            this.name = participant.username ? participant.username.toUpperCase() : '';
                            this.avatar = participant.avatar ? participant.avatar.image : null;
                            this.track = null;
                            this.mediaStream = null;
                            this.audioSourceNode = null;
                            this.htmlVideoEl = null;
                            this.screenSharing = false;
                            this.sourceType = 'webrtc';
                            this.caption =  participant.greeting;
                            this.eventDispatcher = new EventSystem();
                            this.params = {
                                captionBgColor: '#26A553',
                                captionFontColor: '#FFFFFF',
                                displayVideo: 'cover'
                            };
                        }
                        WebRTCStreamSource.prototype = new Source();
        
                        _eventDispatcher.on('sourceRemoved', function (removedSource) {
                            console.log('sourceRemoved', removedSource)
                            function removeChildSources(parentSources) {
                                console.log('removeChildSources', parentSources)
        
                                var nextToRemove = [];
                                for(let c in parentSources) {
                                    let parentSource = parentSources[c];
                                    for (let s in _scenes) {
                                        let scene = _scenes[s];
                                        for (let i = scene.sources.length - 1; i >= 0; i--) {
                                            let source = scene.sources[i];
                                            if (source.baseSource == parentSource) {
                                                nextToRemove.push(source);
                                                removeSource(source, true);
                                            }
                                        }
                                    }
                                    var nextToRemove = [];
                                    for (let s in _scenes) {
                                        let scene = _scenes[s];
                                        let i = scene.additionalSources.length;
                                        while (i--) {
                                            console.log('removeChildSources while', parentSources)
                                            console.log('removeChildSources while baseSource', scene.additionalSources[i].baseSource)
        
                                            if (scene.additionalSources[i].baseSource == parentSource) {
                                                nextToRemove.push(scene.additionalSources[i]);
                                                removeAdditionalSource(scene.additionalSources[i], true);
                                            }
                                        }
                                    }
                                }
                                if(nextToRemove.length != 0) {
                                    removeChildSources(nextToRemove);
                                }
                            }
                            removeChildSources([removedSource])
                        });
                        /*_eventDispatcher.on('adittionalSourceRemoved', function (removedSource) {
                            for(let s in _scenes) {
                                let scene = _scenes[s];
                                for(let i = scene.additionalSources.length - 1; i >= 0; i--) {
                                    let source = scene.additionalSources[i];
                                    if(source.baseSource == removedSource) {
                                        removeSource(source);
                                    }
                                }
                            }
                        });*/
        
                        function getWebrtcGroupIndex(webrtcGroup) {
                            for (let j in _activeScene.sources) {
                                if (_activeScene.sources[j] == webrtcGroup) {
        
                                    var childItems = 0;
                                    for(let i in _activeScene.sources) {
                                        if(_activeScene.sources[i].parentGroup == webrtcGroup) {
                                            childItems++;
                                        }
                                    }
        
                                    return {index:parseInt(j), childItemsNum: childItems };
                                }
                            }
                            return {index:0, childItemsNum: 0 };
                        }
        
                        function getIndexOfLatestWebRTCSource() {
                            let indexOfLatestWebRTCSource = 0;
                            for (let j in _activeScene.sources) {
                                if (_activeScene.sources[j].sourceType == 'webrtc') {
                                    indexOfLatestWebRTCSource = parseInt(j);
                                }
                            }
                            return indexOfLatestWebRTCSource;
                        }
        
                        function addSource(newSource, successCallback, failureCallback) {
                            console.log('addSource', newSource instanceof RectObjectSource)
                            if( newSource instanceof RectObjectSource || newSource instanceof StrokeRectObjectSource || newSource instanceof TextObjectSource) {
                                addAdditionalSource(newSource);
                                return;
                            }
        
                            function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
                                var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
                                return { width: srcWidth*ratio, height: srcHeight*ratio };
                            }
        
                            if(newSource.sourceType == 'webrtcGroup') {
                                var webrtcGroup = new GroupSource()
                                webrtcGroup.name = newSource.title || 'Video Chat';
                                webrtcGroup.groupType = 'webrtc';
                                _activeScene.sources.splice(0, 0, webrtcGroup)
                                _activeScene.eventDispatcher.dispatch('sourceAdded', newSource);
                                
                                if(newSource.addAudioGroup) {
                                    audioComposer.addSource({
                                        sourceType: 'webrtcGroup',
                                        title:  newSource.title || "Participants' Audio",
                                        relatedWebrtcGroup: webrtcGroup
                                    });
                                }
                                
                                return webrtcGroup;
                            } else if(newSource.sourceType == 'webrtc') {
                                console.log('addSource webrtc')
                                let webrtcGroup = getWebrtcGroupIndex(newSource.parentGroup);
                                let insertAfterIndex = webrtcGroup.index + 1 + webrtcGroup.childItemsNum;
                               
                                log('addSource add at the end ' + insertAfterIndex, _activeScene.sources.length)
        
                                _activeScene.sources.splice(insertAfterIndex, 0, newSource)
        
        
                                _activeScene.eventDispatcher.dispatch('sourceAdded', newSource);
                                return;
        
                            } else if(newSource.sourceType == 'image') {
                                console.log('addSource image')
                                let indexOfLatestWebRTCSOurce = getIndexOfLatestWebRTCSource();
        
                                var imageSource = new ImageSource();
                                imageSource.imageInstance = newSource.imageInstance;
                                imageSource.name = newSource.title;
                                //_activeScene.sources.unshift(imageSource);
                                _activeScene.sources.splice((indexOfLatestWebRTCSOurce + 1), 0, imageSource)
        
                                _activeScene.eventDispatcher.dispatch('sourceAdded', imageSource);
        
                                return imageSource;
                            } else if(newSource.sourceType == 'videoInput') {
                                console.log('addSource videoInput')
                                let stream = newSource.mediaStreamInstance;
        
                                let indexOfLatestWebRTCSOurce = getIndexOfLatestWebRTCSource();
                                var video = document.createElement('VIDEO');
                                video.muted = false;
                                video.loop = _options.liveStreaming.loopVideo;
                                video.addEventListener('loadedmetadata', event => {
                                    console.log(video.videoWidth, video.videoHeight)
                                })
                                video.srcObject = stream;
                                var videoInputSource = new VideoInputSource();
                                videoInputSource.videoInstance = video;
                                videoInputSource.mediaStream = stream;
                                videoInputSource.name = newSource.title;
                                videoInputSource.id = generateId();
                                videoInputSource.sceneId = _activeScene.id;
                                videoInputSource.originalSize = newSource.originalSize;
                                videoInputSource.frameRate = newSource.frameRate;
                                videoInputSource.isScreensharing = newSource.screensharing;
                                _activeScene.sources.splice((indexOfLatestWebRTCSOurce + 1), 0, videoInputSource);
                                var playPromise = video.play();
                                if (playPromise !== undefined) {
                                    playPromise.then(function() {
                                        if(successCallback != null) successCallback();
                                    }).catch(function(error) {
                                        if(failureCallback != null) failureCallback(error);
                                    });
                                }
                                if (videoInputSource.mediaStream.getAudioTracks().length != 0) audioComposer.addSource(videoInputSource);
                                _activeScene.eventDispatcher.dispatch('sourceAdded', videoInputSource);
        
                                return videoInputSource;
                            } else if(newSource.sourceType == 'imageBackground') {
                                console.log('addSource image')
        
                                var imageSource = new ImageSource();
                                imageSource.imageInstance = newSource.imageInstance;
                                imageSource.name = newSource.title;
                                _activeScene.backgroundSources.splice(0, 0, imageSource)
        
                                _activeScene.eventDispatcher.dispatch('sourceAdded', imageSource);
        
                                return imageSource;
                            } else if(newSource.sourceType == 'imageOverlay') {
                                console.log('addSource image')
        
                                var imageSource = new ImageSource();
                                imageSource.imageInstance = newSource.imageInstance;
                                imageSource.name = newSource.title;
                                if(newSource.opacity) imageSource.opacity = newSource.opacity;
        
                                let imageWidth = imageSource.imageInstance.naturalWidth;
                                let imageHeight = imageSource.imageInstance.naturalHeight;
        
                                let fitSize = calculateAspectRatioFit(imageWidth, imageHeight, 100, 100);
                                if(newSource.position == 'right-bottom') {
                                    imageSource.rect._x = _size.width - (fitSize.width + 20);
                                    imageSource.rect._y = _size.height - (fitSize.height + 20);
                                } else  if(newSource.position == 'right-top') {
                                    imageSource.rect._x = _size.width - (fitSize.width + 20);
                                    imageSource.rect._y = 20;
                                } else  if(newSource.position == 'left-top') {
                                    imageSource.rect._x = 20;
                                    imageSource.rect._y = 20;
                                } else  if(newSource.position == 'left-bottom') {
                                    imageSource.rect._x = 20;
                                    imageSource.rect._y = _size.height - (fitSize.height + 20);
                                }
                                imageSource.rect._width = fitSize.width;
                                imageSource.rect._height = fitSize.height;
        
                                _activeScene.overlaySources.splice(0, 0, imageSource)
        
                                //_activeScene.eventDispatcher.dispatch('sourceAdded', imageSource);
        
                                return imageSource;
                            } else if(newSource.sourceType == 'video') {
                                console.log('addSource video')
                                let indexOfLatestWebRTCSOurce = getIndexOfLatestWebRTCSource();
                                var video = document.createElement('VIDEO');
                                video.muted = false;
                                video.loop = _options.liveStreaming.loopVideo;
                                video.addEventListener('loadedmetadata', event => {
                                    console.log(video.videoWidth, video.videoHeight)
                                })
                                video.src = newSource.url;
                                var videoSource = new VideoSource();
                                videoSource.videoInstance = video;
                                videoSource.name = newSource.title;
                                //_activeScene.sources.unshift(videoSource);
                                _activeScene.sources.splice((indexOfLatestWebRTCSOurce + 1), 0, videoSource);
                                var playPromise = video.play();
                                if (playPromise !== undefined) {
                                    playPromise.then(function() {
                                        if(successCallback != null) successCallback();
                                    }).catch(function(error) {
                                        if(failureCallback != null) failureCallback(error);
                                    });
                                }
                                audioComposer.addSource(videoSource);
                                _activeScene.eventDispatcher.dispatch('sourceAdded', videoSource);
        
                                return videoSource;
                            } else if(newSource.sourceType == 'videoBackground') {
                                console.log('addSource video')
        
                                var video = document.createElement('VIDEO');
                                video.muted = true;
                                video.style.display = 'none';
                                video.loop = _options.liveStreaming.loopVideo;
                                video.addEventListener('loadedmetadata', event => {
                                    console.log(video.videoWidth, video.videoHeight)
                                })
                                video.src = newSource.url;
                                var videoSource = new VideoSource();
                                videoSource.videoInstance = video;
                                videoSource.name = newSource.title;
                                //_activeScene.sources.unshift(videoSource);
                                _activeScene.backgroundSources.splice(0, 0, videoSource);
        
                                video.muted = true;
                                video.autoplay = true;
                                video.playsInline = true;
                                /*var playPromise = video.play();
                                if (playPromise !== undefined) {
                                    playPromise.then(function() {
                                        if(successCallback != null) successCallback();
                                    }).catch(function(error) {
                                        if(failureCallback != null) failureCallback(error);
                                    });
                                }*/
        
                                _activeScene.eventDispatcher.dispatch('sourceAdded', videoSource);
        
                                return videoSource;
                            } else {
                                _activeScene.sources.unshift(newSource);
                                //_activeScene.eventDispatcher.dispatch('sourceAdded', newSource);
        
                            }
                        }
        
                        function addAdditionalSource(newSource, backward) {
                            if(backward){
                                _activeScene.additionalSources.push(newSource);
                            } else {
                                _activeScene.additionalSources.unshift(newSource);
                            }
                            _activeScene.eventDispatcher.dispatch('sourceAdded', newSource);
                        }
        
                        function removeSource(source, doNotFireEvent) {
                            log('removeSource', source)
                            if( source instanceof RectObjectSource || source instanceof TextObjectSource) {
                                removeAdditionalSource(source, doNotFireEvent);
                                return;
                            }
                            for (let j in _activeScene.sources) {
                                if (_activeScene.sources[j] == source) {
                                    _activeScene.sources.splice(j, 1)
                                    break;
                                }
                            }
                            if(source.videoInstance != null) source.videoInstance.pause();
                            audioComposer.muteSourceLocally(source);
                            if(!doNotFireEvent) _activeScene.eventDispatcher.dispatch('sourceRemoved', source);
                        }
        
                        function removeAdditionalSource(source, doNotFireEvent) {
                            for (let j in _activeScene.additionalSources) {
                                if (_activeScene.additionalSources[j] == source) {
                                    _activeScene.additionalSources.splice(j, 1)
                                    break;
                                }
                            }
                            if(!doNotFireEvent) _activeScene.eventDispatcher.dispatch('sourceRemoved', source);
                        }
        
                        function moveSource(old_index, new_index) {
                            console.log('moveSource', old_index, new_index);
                            if (new_index < 0) {
                                new_index = 0;
                            }
                            if (new_index >= _activeScene.sources.length) {
                                new_index = _activeScene.sources.length - 1;
                            }
                            _activeScene.sources.splice(new_index, 0, _activeScene.sources.splice(old_index, 1)[0]);
                            _activeScene.eventDispatcher.dispatch('sourceMoved');
        
                            return _activeScene.sources;
                        }
        
                        function moveSourceBackward(source) {
                            console.log('moveSourceBackward');
                            if(source.sourceType == 'group') {
                                var childItems = 0;
                                for(let i in _activeScene.sources) {
                                    if(_activeScene.sources[i].parentGroup == source) {
                                        childItems++;
                                    }
                                }
                                console.log('moveSourceBackward childItems', childItems);
        
                                for(let i in _activeScene.sources) {
                                    if(_activeScene.sources[i] == source) {
                                        console.log('moveForward ==', i);
        
                                        _activeScene.sources.splice(i + 1, 0, ...(_activeScene.sources.splice(i, childItems + 1)) );
                                        _activeScene.eventDispatcher.dispatch('sourceMoved');
        
                                        break;
                                    }
                                }
                                console.log('moveSourceBackward  _activeScene.sources',  _activeScene.sources);
        
                                return;
                            }
                            for(let i in _activeScene.sources) {
                                if(_activeScene.sources[i] == source) {
                                    console.log('moveForward ==', i);
                                    console.log('moveSourceBackward for', _activeScene.sources[i], source);
                                    let indexToInsert = parseInt(i) + 1;
                                    let childItems = 0;
                                    if(_activeScene.sources[i].parentGroup != null && _activeScene.sources[i].parentGroup != _activeScene.sources[indexToInsert].parentGroup) {
                                        break;
                                    } else if(_activeScene.sources[i].parentGroup != null && _activeScene.sources[i].parentGroup == _activeScene.sources[indexToInsert].parentGroup) {
                                        moveSource(i, indexToInsert + childItems);
                                        break;
                                    } else if(_activeScene.sources[indexToInsert] && _activeScene.sources[indexToInsert].sourceType == 'group') {
                                        for(let i in _activeScene.sources) {
                                            let groupToSkip = _activeScene.sources[indexToInsert].parentGroup != null ? _activeScene.sources[indexToInsert].parentGroup :  _activeScene.sources[indexToInsert];
                                            if(_activeScene.sources[i].parentGroup == groupToSkip) {
                                                childItems++;
                                            }
                                        }
                                    }
                                    moveSource(i, indexToInsert + childItems);
                                    break;
                                }
                            }
                        }
        
                        function moveSourceForward(source) {
                            console.log('moveSourceForward', source);
                            if(source.sourceType == 'group') {
                                var childItems = 0;
                                for(let i in _activeScene.sources) {
                                    if(_activeScene.sources[i].parentGroup == source) {
                                        childItems++;
                                    }
                                }
                                console.log('moveSourceForward childItems', childItems);
        
                                for(let i in _activeScene.sources) {
                                    if(_activeScene.sources[i] == source) {
                                        console.log('moveForward ==', i);
        
                                        _activeScene.sources.splice(i - (childItems + 1), 0, ...(_activeScene.sources.splice(i, childItems + 1)) );
                                        _activeScene.eventDispatcher.dispatch('sourceMoved');
        
                                        break;
                                    }
                                }
                                console.log('moveSourceForward  _activeScene.sources',  _activeScene.sources);
        
                                return;
                            }
        
                            for(let i in _activeScene.sources) {
                                console.log('moveSourceForward i', i);
                                console.log('moveSourceForward for', _activeScene.sources[i], source);
        
                                if(_activeScene.sources[i] == source) {
                                    let indexToInsert = parseInt(i) - 1;
                                    let childItems = 0;
                                    console.log('moveSourceForward for parentGroup', _activeScene.sources[i].parentGroup);
        
                                    if(_activeScene.sources[i].parentGroup == null && _activeScene.sources[indexToInsert] && _activeScene.sources[indexToInsert].parentGroup != null) {
                                        for(let i in _activeScene.sources) {
                                            if(_activeScene.sources[i].parentGroup ==  _activeScene.sources[indexToInsert].parentGroup) {
                                                childItems++;
                                            }
                                        }
                                        console.log('moveSourceForward for 1');
        
                                    } else if(_activeScene.sources[i].parentGroup != null && _activeScene.sources[indexToInsert] && _activeScene.sources[i].parentGroup == _activeScene.sources[indexToInsert]) {
                                        return;
                                    }
                                    console.log('moveSourceForward for childItems', childItems);
        
                                    moveSource(i, indexToInsert - childItems);
                                    break;
                                }
                            }
                        }
        
                        function showSource(source, excludeFromLayout) {
                            console.log('showSource', source);
                            if(source.sourceType == 'group') {
                                for(let i in _activeScene.sources) {
                                    if(_activeScene.sources[i].parentGroup == source) {
                                        _activeScene.sources[i].active = true;
                                        if(_activeScene.sources[i].sourceType == 'webrtc') {
        
                                        }
                                    }
                                }
                            }
        
                            source.active = true;
        
                            if(source.sourceType == 'webrtc' || source.groupType == 'webrtc') {
                                updateActiveWebRTCLayouts();
                                audioComposer.updateActiveWebRTCAudios();
                            }
        
                            function showChildSources(parentSources) {
                                var nextToShow = [];
                                for(let c in parentSources) {
                                    let parentSource = parentSources[c];
                                    for (let s in _scenes) {
                                        let scene = _scenes[s];
                                        for (let i = scene.sources.length - 1; i >= 0; i--) {
                                            let source = scene.sources[i];
                                            if (source.baseSource == parentSource) {
                                                nextToShow.push(source);
                                                source.active = true;
                                            }
                                        }
                                    }
                                    for (let s in _scenes) {
                                        let scene = _scenes[s];
                                        let i = scene.additionalSources.length;
                                        while (i--) {
                                            console.log('removeChildSources while', parentSources)
                                            console.log('removeChildSources while baseSource', scene.additionalSources[i].baseSource)
        
                                            if (scene.additionalSources[i].baseSource == parentSource) {
                                                nextToShow.push(scene.additionalSources[i]);
                                                scene.additionalSources[i].active = true;
                                            }
                                        }
                                    }
                                }
                                if(nextToShow.length != 0) {
                                    showChildSources(nextToShow);
                                }
                            }
                            showChildSources([source])
                        }
        
                        function hideSource(source) {
                            console.log('hideSource', source);
                            if(source.sourceType == 'group') {
                                for(let i in _activeScene.sources) {
                                    if(_activeScene.sources[i].parentGroup == source) {
                                        _activeScene.sources[i].active = false;
                                    }
                                }
                            }
        
                            source.active = false;
        
                            if(source.sourceType == 'webrtc' || source.groupType == 'webrtc') {
                                updateActiveWebRTCLayouts();
                                audioComposer.updateActiveWebRTCAudios();
                            }
        
                            function hideChildSources(parentSources) {
                                console.log('removeChildSources', parentSources)
        
                                var nextToHide = [];
                                for(let c in parentSources) {
                                    let parentSource = parentSources[c];
                                    for (let s in _scenes) {
                                        let scene = _scenes[s];
                                        for (let i = scene.sources.length - 1; i >= 0; i--) {
                                            let source = scene.sources[i];
                                            if (source.baseSource == parentSource) {
                                                nextToHide.push(source);
                                                source.active = false;
                                            }
                                        }
                                    }
                                    //var nextToRemove = [];
                                    for (let s in _scenes) {
                                        let scene = _scenes[s];
                                        let i = scene.additionalSources.length;
                                        while (i--) {
                                            console.log('removeChildSources while', parentSources)
                                            console.log('removeChildSources while baseSource', scene.additionalSources[i].baseSource)
        
                                            if (scene.additionalSources[i].baseSource == parentSource) {
                                                nextToHide.push(scene.additionalSources[i]);
                                                scene.additionalSources[i].active = false;
                                            }
                                        }
                                    }
                                }
                                if(nextToHide.length != 0) {
                                    hideChildSources(nextToHide);
                                }
                            }
                            hideChildSources([source])
                        }
        
                        function updateActiveWebRTCLayouts() {
                            for(let i in _activeScene.sources) {
                                if(_activeScene.sources[i].sourceType == 'group' && _activeScene.sources[i].groupType == 'webrtc') {
                                    updateWebRTCLayout(_activeScene.sources[i]);
                                }
                            }
                        }
        
                        function updateWebRTCLayout(webrtcGroupSource, layoutName) {
                            log('updateWebRTCCanvasLayout start', layoutName, webrtcGroupSource.currentLayout)
        
                            var tracksToAdd = [];
                            var tracksToRemove = [];
                            
                            var currentWebRTCSources = webrtcGroupSource.getChildSources('webrtc');
                            var participants = _webrtcSignalingLib.roomParticipants(true);
                            log('updateWebRTCCanvasLayout participants',  participants)
                            log('updateWebRTCCanvasLayout currentWebRTCSources',  currentWebRTCSources)
        
                            var renderScreenSharingLayout = false;
                            for(let v in participants) {
                                log('updateWebRTCCanvasLayout participant', participants[v].online, participants[v])
        
                                //get those tracks of participant that are rendered currently on canvas
                                let renderedTracks = [];
                                for (let j in currentWebRTCSources) {
                                    if(currentWebRTCSources[j].participant == participants[v]) {
                                        renderedTracks.push(currentWebRTCSources[j])
                                    }
                                }
        
                                log('updateWebRTCCanvasLayout renderedTracks', renderedTracks)
        
                                //if participant is offline, remove those track from canvas
                                if(participants[v].online == false) {
                                    log('updateWebRTCCanvasLayout participants[v].online == false: REMOVE TRACK')
        
                                    tracksToRemove = tracksToRemove.concat(renderedTracks);
                                    continue;
                                }
        
        
                                let vTracks = participants[v].videoTracks(true);
                                let aTracks = participants[v].audioTracks();
                                
                                log('updateWebRTCCanvasLayout p tracks', vTracks, aTracks)
        
                                log('updateWebRTCCanvasLayout rendered currentWebRTCSources', currentWebRTCSources)
        
                                vTracks = vTracks.filter(function (o) {
                                    return o.parentScreen && o.parentScreen.isActive;
                                });
                                log('updateWebRTCCanvasLayout vTracks', vTracks)
        
                                let audioIsEnabled = participants[v].isLocal ? _webrtcSignalingLib.localMediaControls.micIsEnabled() : participants[v].audioIsMuted != true;
        
                                log('updateWebRTCCanvasLayout audioIsEnabled', audioIsEnabled)
        
                                if(vTracks.length != 0) {
                                    log('updateWebRTCCanvasLayout vTracks != 0')
        
                                    for (let s in vTracks) {
                                        log('updateWebRTCCanvasLayout track', vTracks[s])
        
                                        //get rendered tracks EXEPT current one vTracks[s]
                                        let currentlyRenderedAudioTracks = renderedTracks.filter(function (t) {
                                            return t.kind == 'audio' ? true : false;
                                        })
                                        let currentlyRenderedVideoTracks = renderedTracks.filter(function (t) {
                                            return t.kind == 'video' && t.track != vTracks[s] && t.screenSharing == false ? true : false;
                                        })
                                        let pendingVideoTracks = tracksToAdd.filter(function (t) {
                                            return t.kind == 'video' && t.screenSharing == false ? true : false;
                                        })
                                        let currentlyRenderedScreensharingTracks = renderedTracks.filter(function (t) {
                                            return t.kind == 'video' && t.track != vTracks[s] && t.screensharing == true ? true : false;
                                        })
        
                                        let trackCurrentlyRendered = false;
                                        for (let c in renderedTracks) {
                                            if(vTracks[s] == renderedTracks[c].track)  {
                                                trackCurrentlyRendered = renderedTracks[c];
                                                break;
                                            }
                                        }
        
                                        log('updateWebRTCCanvasLayout trackCurrentlyRendered', trackCurrentlyRendered)
        
                                        if(!trackCurrentlyRendered) {
                                            //track is not rendered on canvas yet, i. e. this is new track
        
                                            var addNewVideoCanvasStream = function () {
                                                let canvasStream = new WebRTCStreamSource(participants[v]);
                                                canvasStream.kind = 'video';
                                                canvasStream.track = vTracks[s];
                                                canvasStream.mediaStream = vTracks[s].stream;
                                                canvasStream.htmlVideoEl = vTracks[s].trackEl;
                                                canvasStream.parentGroup = webrtcGroupSource;
                                                if (vTracks[s].screensharing == true) {
                                                    log('updateWebRTCCanvasLayout addNewVideoCanvasStream: add screensharing track');
        
                                                    canvasStream.screenSharing = true;
                                                    canvasStream.name = canvasStream.name + ' (screen)';
                                                    log('updateWebRTCCanvasLayout currentlyRendered', currentlyRenderedAudioTracks.length, currentlyRenderedVideoTracks.length)
        
                                                    
                                                    if(currentlyRenderedAudioTracks.length == 0 && currentlyRenderedVideoTracks.length == 0 && pendingVideoTracks.length == 0) {
                                                        log('updateWebRTCCanvasLayout addNewVideoCanvasStream: add screensharing track: create audio track');
        
                                                        let audioCanvasStream = new WebRTCStreamSource(participants[v]);
                                                        audioCanvasStream.kind = 'audio';
                                                        audioCanvasStream.parentGroup = webrtcGroupSource;
                                                        tracksToAdd.push(audioCanvasStream);
                                                    }
                                                
                                                } else {
                                                    log('updateWebRTCCanvasLayout addNewVideoCanvasStream: add regular track');
                                                    canvasStream.screenSharing = false;
                                                    canvasStream.name = canvasStream.name.replace(' (screen)', '');
                                                }
                                                tracksToAdd.push(canvasStream)
                                            }
        
                                            log('updateWebRTCCanvasLayout !trackCurrentlyRendered')
                                            let audioOnly = layoutName == 'audioOnly' || (layoutName == null && webrtcGroupSource.currentLayout == 'audioOnly');
                                            let notScreensharingVideo = !audioOnly && (layoutName == 'audioScreenSharing' || (layoutName == null && webrtcGroupSource.currentLayout == 'audioScreenSharing')) && !vTracks[s].screensharing;
                                            if((audioOnly || notScreensharingVideo) && currentlyRenderedAudioTracks.length == 0 && currentlyRenderedVideoTracks.length == 0) {
                                                //if audioOnly layout is active currently, we should show all videos as avatar+audio visualization. So we should add new canvas stream of audio type
                                                log('updateWebRTCCanvasLayout !trackCurrentlyRendered if1')
        
                                                let canvasStream = new WebRTCStreamSource(participants[v]);
                                                canvasStream.kind = 'audio';
                                                canvasStream.parentGroup = webrtcGroupSource;
                                                canvasStream.track = vTracks[s];
                                                tracksToAdd.push(canvasStream);
                                            } /*else if(vTracks.length > 1) {
                                                log('updateWebRTCCanvasLayout !trackCurrentlyRendered if2 ADD VIDEO RECT')
                                                addNewVideoCanvasStream();
        
                                            } */ else {
                                                //if participant already has audio track (he uses only mic, for example) and turns his camera on (not screensharing), then we should replace audio track with video.
                                                //if screensharing track will be added, just add new video track to existing audio track (there should be screensharing the avatar of user who shares screen on canvas)
                                                log('updateWebRTCCanvasLayout !trackCurrentlyRendered else')
        
                                                let replacedAudioTrack = false;
                                                if(!vTracks[s].screensharing || (vTracks[s].screensharing && currentlyRenderedVideoTracks.length != 0 && currentlyRenderedAudioTracks.length != 0)) {
                                                    for(let  z = renderedTracks.length - 1; z >= 0 ; z--){
                                                        log('updateWebRTCCanvasLayout !trackCurrentlyRendered renderedTracks[z]', renderedTracks[z])
            
                                                        if(renderedTracks[z].kind == 'audio' && !vTracks[s].screensharing) {
                                                            log('updateWebRTCCanvasLayout else REPLACE VIDEO TRACK')
            
                                                            renderedTracks[z].kind = 'video';
                                                            renderedTracks[z].track = vTracks[s];
                                                            renderedTracks[z].mediaStream = vTracks[s].stream;
                                                            renderedTracks[z].htmlVideoEl = vTracks[s].trackEl;
                                                            renderedTracks[z].screenSharing = false;
                                                            renderedTracks[z].name = renderedTracks[z].name.replace(' (screen)', '');
                                                            
                                                            replacedAudioTrack = true;
                                                            break;
                                                        }
                                                    }
                                                }
                                               
                                                
        
                                                log('updateWebRTCCanvasLayout replacedAudioTrack', replacedAudioTrack)
                                                //if we didn't find audio stream to replace, just add new video stream
                                                if(!replacedAudioTrack) {
                                                    log('updateWebRTCCanvasLayout else ADD VIDEO TRACK')
        
                                                    addNewVideoCanvasStream();
                                                }
                                            }
                                        } else {
                                            //if this video track is rendered on canvas
                                            log('updateWebRTCCanvasLayout !trackCurrentlyRendered = false')
                                            let audioOnly = layoutName == 'audioOnly' || (layoutName == null && webrtcGroupSource.currentLayout == 'audioOnly');
                                            let audioScreenSharing =  layoutName == 'audioScreenSharing' || (layoutName == null && webrtcGroupSource.currentLayout == 'audioScreenSharing');
                                            //if previous layout was audio only or audio+screensharing, but current layout is some of regular, we should show those video tracks, which was shown as avatar+audiovisualization previously in audio only layout
                                            //OR if previous layout was audio only, bu currently it's audio+screensharing layout we should show only screensharing track and leave rest as avatar+audio visualization
                                            if((!audioOnly && !audioScreenSharing) || (!audioOnly && audioScreenSharing && trackCurrentlyRendered.screenSharing)) {
                                                log('updateWebRTCCanvasLayout !trackCurrentlyRendered = false if1')
        
                                                if(trackCurrentlyRendered.kind == 'audio') {
                                                    log('updateWebRTCCanvasLayout !trackCurrentlyRendered = false if1.1')
        
                                                    trackCurrentlyRendered.kind = 'video';
                                                }
                                            } else if(audioOnly && trackCurrentlyRendered.screenSharing && currentlyRenderedAudioTracks.length != 0) {
                                                //
                                                log('updateWebRTCCanvasLayout !trackCurrentlyRendered = false else1')
                                                for(let h in renderedTracks) {
                                                    if(renderedTracks[h] == trackCurrentlyRendered) {
                                                        tracksToRemove.push(renderedTracks.splice(h, 1)[0])
                                                        break;
                                                    }
                                                }
                                               
        
                                            } else {
                                                log('updateWebRTCCanvasLayout !trackCurrentlyRendered = false else')
        
                                                trackCurrentlyRendered.kind = 'audio';
                                            }
                                            continue;
                                        }
        
                                    }
        
                                } else if (aTracks.length != 0 && audioIsEnabled) {
                                    //if participant has no video tracks, but has audi tracks
                                    log('updateWebRTCCanvasLayout aTracks != 0')
        
                                    let audioCurrentlyRendered = false;
                                    for (let c in renderedTracks) {
                                        if(renderedTracks[c].kind == 'audio')  {
                                            audioCurrentlyRendered = true;
                                            break;
                                        }
                                    }
                                    if (!audioCurrentlyRendered) {
                                        //check if participant had rendered video tracks that became inactive
                                        let renderedVideoTracks = renderedTracks.filter(function (o) {
                                            return o.kind == 'video';
                                        })
        
                                        let currentlyRenderedAudioTracks = renderedTracks.filter(function (t) {
                                            return t.kind == 'audio' ? true : false;
                                        })
        
                                        //if so, remove them or make them avatar+visualization
                                        if (renderedVideoTracks.length != 0) {
                                            log('updateWebRTCCanvasLayout aTracks: if1', renderedVideoTracks.length)
        
                                            var newAudioTrack = renderedVideoTracks.splice(0, 1)[0];
                                            log('updateWebRTCCanvasLayout aTracks: if1 splice', renderedVideoTracks.length, tracksToRemove.length)
                                            log('updateWebRTCCanvasLayout aTracks: REMOVE TRACK')
        
                                            if (currentlyRenderedAudioTracks.length == 0) {
                                                newAudioTrack.kind = 'audio';
                                                newAudioTrack.track = null;
                                                newAudioTrack.mediaStream = null;
                                                newAudioTrack.htmlVideoEl = null;
                                                if (newAudioTrack.screenSharing == true) {
                                                    newAudioTrack.screenSharing = false;
                                                    newAudioTrack.name = newAudioTrack.name.replace(' (screen)', '');
                                                }
                                            }
        
                                            for (let b in renderedVideoTracks) {
                                                for (let x = renderedTracks.length - 1; x >= 0; x--) {
                                                    if (renderedTracks[x] == renderedVideoTracks[b]) {
                                                        tracksToRemove.push(renderedTracks.splice(x, 1)[0]);
                                                    }
                                                }
                                            }
        
                                        } else {
                                            log('updateWebRTCCanvasLayout aTracks: if2')
                                            log('updateWebRTCCanvasLayout aTracks: ADD AUDIO TRACK')
        
                                            let canvasStream = new WebRTCStreamSource(participants[v]);
                                            canvasStream.kind = 'audio';
                                            canvasStream.parentGroup = webrtcGroupSource;
                                            tracksToAdd.push(canvasStream);
                                        }
                                    }
        
                                    
                                }
        
                                var currentlyRenderedAudioTracks = renderedTracks.filter(function (t) {
                                    return t.kind == 'audio' ? true : false;
                                })
                                var currentlyRenderedVideoTracks = renderedTracks.filter(function (t) {
                                    return t.kind == 'video' && t.screenSharing == false ? true : false;
                                })
                                var currentlyRenderedScreensharingTracks = renderedTracks.filter(function (t) {
                                    return t.kind == 'video' && t.screenSharing == true ? true : false;
                                })
                                log('updateWebRTCCanvasLayout: BEFORE REMOVE INACTIVE', renderedTracks.length)
        
                                for (let x in renderedTracks) {
                                    log('updateWebRTCCanvasLayout: REMOVE INACTIVE', renderedTracks[x].kind)
        
                                    let trackIsLive = false;
        
                                    if(renderedTracks[x].kind == 'video') {
                                        for (let m in vTracks) {
                                            if(renderedTracks[x].track == vTracks[m] && vTracks[m].parentScreen && vTracks[m].parentScreen.isActive) {
                                                log('updateWebRTCCanvasLayout do not remove active', vTracks[m].parentScreen.isActive)
        
                                                trackIsLive = true;
                                            }
                                        }
                                    } else {
                                        if(audioIsEnabled) trackIsLive = true;
                                    }
        
        
                                    if(!trackIsLive) {
                                        let currentlyRenderedVideoTracks = renderedTracks.filter(function (t) {
                                            return t.kind == 'video' && t != renderedTracks[x] && t.screenSharing == false ? true : false;
                                        })
                                        log('updateWebRTCCanvasLayout: TRACK IS INACTIVE', currentlyRenderedAudioTracks.length, currentlyRenderedVideoTracks.length)
                                        if(renderedTracks[x].kind == 'video' && currentlyRenderedAudioTracks.length == 0 && currentlyRenderedVideoTracks.length == 0) {
                                            log('updateWebRTCCanvasLayout: REPLACE TRACK')
        
                                            renderedTracks[x].kind = 'audio';
                                            renderedTracks[x].track = null;
                                            renderedTracks[x].mediaStream = null;
                                            renderedTracks[x].htmlVideoEl = null;
                                            renderedTracks[x].screenSharing = false;
                                        } else {
                                            log('updateWebRTCCanvasLayout: REMOVE TRACK')
        
                                            tracksToRemove.push(renderedTracks[x]);
                                        }
                                    }
                                }
        
                            }
                            log('updateWebRTCCanvasLayout result', tracksToAdd, tracksToRemove)
                            log('updateWebRTCCanvasLayout room name', _options.roomName)
        
                            for(let r = currentWebRTCSources.length - 1; r >= 0 ; r--){
                                let onlineInCurrentRoom = false;
                                for(let p in participants) {
                                    if(currentWebRTCSources[r].participant == participants[p]) {
                                        onlineInCurrentRoom = true;
                                    }
                                }
                                if(currentWebRTCSources[r].participant.isLocal && !onlineInCurrentRoom) {
                                    log('updateWebRTCCanvasLayout prevRoom: loc prev room stream', currentWebRTCSources[r])
        
                                    for(let m = currentWebRTCSources.length - 1; m >= 0 ; m--){
                                        if(!currentWebRTCSources[m].participant.isLocal || currentWebRTCSources[m] == currentWebRTCSources[r]) continue;
                                        log('updateWebRTCCanvasLayout prevRoom: loc live stream', currentWebRTCSources[m])
        
                                        if(currentWebRTCSources[m].kind == 'audio') {
                                            currentWebRTCSources[r].participant = currentWebRTCSources[m].participant;
                                            currentWebRTCSources[r].kind = 'audio';
                                            currentWebRTCSources[r].track = null;
                                            currentWebRTCSources[r].mediaStream = null;
                                            currentWebRTCSources[r].htmlVideoEl = null;
                                            currentWebRTCSources[r].screenSharing = false;
                                        } else {
                                            currentWebRTCSources[r].participant = currentWebRTCSources[m].participant;
                                            currentWebRTCSources[r].kind = 'video';
                                            currentWebRTCSources[r].track = currentWebRTCSources[m].track;
                                            currentWebRTCSources[r].mediaStream = currentWebRTCSources[m].track.stream;
                                            currentWebRTCSources[r].htmlVideoEl = currentWebRTCSources[m].track.trackEl;
                                            if (currentWebRTCSources[r].track.screensharing == true) currentWebRTCSources[m].screenSharing = true;
        
                                        }
                                        log('updateWebRTCCanvasLayout prevRoom: REMOVE TRACK')
        
                                        tracksToRemove.push(currentWebRTCSources[m]);
                                        break;
                                    }
                                    break;
                                } else if(currentWebRTCSources[r].participant.isLocal && onlineInCurrentRoom) {
                                    log('updateWebRTCCanvasLayout prevRoom: loc current room', currentWebRTCSources[r])
        
                                    continue;
                                } else if(!currentWebRTCSources[r].participant.isLocal && !onlineInCurrentRoom) {
                                    log('updateWebRTCCanvasLayout prevRoom: REMOVE TRACK', currentWebRTCSources[r])
        
                                    tracksToRemove.push(currentWebRTCSources[r])
                                } else {
                                    log('updateWebRTCCanvasLayout prevRoom: else', currentWebRTCSources[r])
        
                                }
                            }
        
                            log('updateWebRTCCanvasLayout remove from prev room', tracksToRemove)
                            for(let n in tracksToRemove) {
                                log('updateWebRTCCanvasLayout tracksToRemove', tracksToRemove[n].participant.isLocal)
        
                            }
        
                            for(let d = _activeScene.sources.length - 1; d >= 0 ; d--){
                                log('updateWebRTCCanvasLayout remove')
        
                                function remove() {
                                    _inputCtx.clearRect(_activeScene.sources[d].rect.x, _activeScene.sources[d].rect.y, _activeScene.sources[d].rect.width, _activeScene.sources[d].rect.height);
                                    let removedSource = _activeScene.sources[d];
                                    _activeScene.sources[d] = null;
                                    _activeScene.sources.splice(d, 1);
                                    _activeScene.eventDispatcher.dispatch('sourceRemoved', removedSource);
                                }
        
                                for(let n in tracksToRemove) {
                                    log('updateWebRTCCanvasLayout remove tracksToRemove', _activeScene.sources[d], tracksToRemove[n])
        
                                    if(_activeScene.sources[d] == tracksToRemove[n]) {
                                        log('updateWebRTCCanvasLayout remove stream', _activeScene.sources[d])
        
                                        remove();
                                        break;
                                    }
                                }
                            }
        
        
                            //var currentActiveWebRTCSources = getSources('webrtc', true);
                            var currentActiveWebRTCSources = webrtcGroupSource.getChildSources('webrtc', true);
                            var layoutRects, streamsNum = (currentActiveWebRTCSources.concat(tracksToAdd).length);
                            if(layoutName != null && layoutName != 'audioOnly') {
                                console.log('updateWebRTCCanvasLayout layout', layoutName);
        
                                layoutRects = layoutGenerator(webrtcGroupSource, layoutName, streamsNum);
                                webrtcGroupSource.currentLayout = layoutName;
        
                            } else {
                                if(webrtcGroupSource.currentLayout != null) {
                                    console.log('updateWebRTCCanvasLayout layout currentLayout', webrtcGroupSource.currentLayout);
        
                                    layoutRects = layoutGenerator(webrtcGroupSource, webrtcGroupSource.currentLayout, streamsNum);
                                } else {
                                    if(renderScreenSharingLayout) {
                                        console.log('updateWebRTCCanvasLayout layout renderScreenSharingLayout');
        
                                        layoutRects = layoutGenerator(webrtcGroupSource, 'screenSharing', streamsNum);
                                        webrtcGroupSource.currentLayout = 'screenSharing';
                                    } else {
                                        console.log('updateWebRTCCanvasLayout layout tiledStreamingLayout');
        
                                        layoutRects = layoutGenerator(webrtcGroupSource, webrtcGroupSource.params.defaultLayout, streamsNum);
                                        console.log('updateWebRTCCanvasLayout layout tiledStreamingLayout after', layoutRects);
        
                                        webrtcGroupSource.currentLayout = webrtcGroupSource.params.defaultLayout;
                                    }
        
                                }
                            }
        
        
                            log('updateWebRTCCanvasLayout streamsNum', streamsNum)
        
                            var streamsToUpdate = currentActiveWebRTCSources.slice();
                            var c = 0;
        
                            var videoTracksOfUserWhoShares = [];
                            var screenSharingIsNew = false;
        
                            if(/*renderScreenSharingLayout*/webrtcGroupSource.currentLayout == 'screenSharing' || webrtcGroupSource.currentLayout == 'audioScreenSharing' || webrtcGroupSource.currentLayout == 'sideScreenSharing') {
                                log('updateWebRTCCanvasLayout: renderScreenSharingLayout: sdaraort streams')
        
                                var getUsersTracks = function(participant, screenSharingStream) {
        
                                    //add another screensharing of this participants to the beginning
        
                                    for(let k = 0; k < tracksToAdd.length; k++){
        
                                        if(tracksToAdd[k].participant != participant) continue;
                                        if(tracksToAdd[k].screenSharing && tracksToAdd[k] != screenSharingStream) {
                                            videoTracksOfUserWhoShares.unshift(tracksToAdd[k]);
                                            tracksToAdd.splice(k, 1);
                                        }
                                    }
        
                                    for(let k = 0; k < streamsToUpdate.length; k++){
                                        if(streamsToUpdate[k].participant != participant) continue;
                                        if(streamsToUpdate[k].screenSharing && streamsToUpdate[k] != screenSharingStream) {
                                            videoTracksOfUserWhoShares.unshift(streamsToUpdate[k])
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
        
                                for(let r = 0; r < tracksToAdd.length; r++){
                                    if(!tracksToAdd[r].screenSharing) continue;
        
                                    let screenSharingStream = tracksToAdd[r];
                                    tracksToAdd.splice(r, 1);
                                    videoTracksOfUserWhoShares.unshift(screenSharingStream)
        
                                    getUsersTracks(screenSharingStream.participant, screenSharingStream)
                                    log('updateWebRTCCanvasLayout: renderScreenSharingLayout: screenSharingIsNew = true')
        
                                    screenSharingIsNew = true;
                                    break;
                                }
        
                                if(!screenSharingIsNew) {
                                    log('updateWebRTCCanvasLayout: renderScreenSharingLayout: screenSharingIsNew = false')
        
                                    for(let r = 0; r < streamsToUpdate.length; r++){
                                        if(!streamsToUpdate[r].screenSharing) continue;
        
                                        let screenSharingStream = streamsToUpdate[r];
                                        streamsToUpdate.splice(r, 1);
                                        videoTracksOfUserWhoShares.unshift(screenSharingStream)
        
                                        getUsersTracks(screenSharingStream.participant, screenSharingStream)
        
                                        break;
                                    }
                                }
        
                                c = videoTracksOfUserWhoShares.length;
        
                            }
        
        
                            log('updateWebRTCCanvasLayout videoTracksOfUserWhoShares', videoTracksOfUserWhoShares)
                            log('updateWebRTCCanvasLayout layoutRects', layoutRects)
        
                            log('updateWebRTCCanvasLayout tracksToAdd', tracksToAdd)
        
                            log('updateWebRTCCanvasLayout streamsToUpdate', streamsToUpdate.length)
        
                            for(let a = 0; a < tracksToAdd.length; a++){
                                let rect = layoutRects[c];
        
                                log('updateWebRTCCanvasLayout add new tracks', rect)
                                log('updateWebRTCCanvasLayout add new tracks c', c)
        
                                var startRect = new DOMRect(0, 0, 0, 0);
                                tracksToAdd[a].rect = startRect;
        
                                requestAnimationFrame(function(timestamp){
                                    let starttime = timestamp || new Date().getTime()
                                    moveit(timestamp, tracksToAdd[a].rect, rect, {y:startRect.y, x:startRect.x, width:startRect.width,height:startRect.height}, 300, starttime, 'add', tracksToAdd[a]);
                                })
        
                                addSource(tracksToAdd[a]);
        
                                c++
                            }
        
                            for(let r = 0; r < streamsToUpdate.length; r++){
                                let rect = layoutRects[c];
                                log('updateWebRTCCanvasLayout streamsToUpdate loop', streamsToUpdate[r].screenSharing, rect)
                                log('updateWebRTCCanvasLayout streamsToUpdate c',c)
        
                                let rectToUpdate = new DOMRect(streamsToUpdate[r].rect.x, streamsToUpdate[r].rect.y, streamsToUpdate[r].rect.width, streamsToUpdate[r].rect.height);
                                streamsToUpdate[r].rect = rectToUpdate;
        
                                requestAnimationFrame(function(timestamp){
                                    let starttime = timestamp || new Date().getTime()
                                    moveit(timestamp, rectToUpdate, rect, {y:rectToUpdate.y, x:rectToUpdate.x, width:rectToUpdate.width,height:rectToUpdate.height}, 300, starttime, 'up', streamsToUpdate[r]);
                                })
        
                                c++;
                            }
        
                            if(videoTracksOfUserWhoShares.length != 0) {
                                for (let a = videoTracksOfUserWhoShares.length - 1; a >= 0; a--) {
                                    let rect = layoutRects[a];
        
                                    log('updateWebRTCCanvasLayout screensharing tracks', rect)
        
                                    let index = _activeScene.sources.indexOf(videoTracksOfUserWhoShares[a]);
        
        
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
                                            }, 300, starttime, 'add', videoTracksOfUserWhoShares[a]);
                                        })
        
                                        log('updateWebRTCCanvasLayout videoTracksOfUserWhoShares for screenSharingIsNew', videoTracksOfUserWhoShares[a])
        
                                        addSource(videoTracksOfUserWhoShares[a], true);
                                    } else {
                                        videoTracksOfUserWhoShares[a].rect = rect;
                                        let rectToUpdate = new DOMRect(videoTracksOfUserWhoShares[a].rect.x, videoTracksOfUserWhoShares[a].rect.y, videoTracksOfUserWhoShares[a].rect.width, videoTracksOfUserWhoShares[a].rect.height);
                                        videoTracksOfUserWhoShares[a].rect = rectToUpdate;
        
                                        requestAnimationFrame(function(timestamp){
                                            let starttime = timestamp || new Date().getTime()
                                            moveit(timestamp, rectToUpdate, rect, {y:rectToUpdate.y, x:rectToUpdate.x, width:rectToUpdate.width,height:rectToUpdate.height}, 300, starttime, 'up', videoTracksOfUserWhoShares[a]);
                                        })
        
                                        log('updateWebRTCCanvasLayout videoTracksOfUserWhoShares for !screenSharingIsNew index', index)
        
                                        if(a === 0) {
                                            let webrtcGroupIndex = getWebrtcGroupIndex(webrtcGroupSource);
                                            log('updateWebRTCCanvasLayout videoTracksOfUserWhoShares webrtcGroupIndex', webrtcGroupIndex.index)
        
                                            moveSource(index, webrtcGroupIndex.index + webrtcGroupIndex.childItemsNum);
                                        }
        
        
                                    }
        
        
                                }
                            }
        
                            log('updateWebRTCCanvasLayout result streams', _activeScene.sources)
        
        
        
                        }
        
                        function moveit(timestamp, rectToUpdate, distRect, startPositionRect, duration, starttime, a, streamData){
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
                                    moveit(timestamp, rectToUpdate, distRect, startPositionRect, duration, starttime, a, streamData)
                                })
                            } else {
                                rectToUpdate.y = distRect.y;
                                rectToUpdate.x = distRect.x;
                                rectToUpdate.width = distRect.width;
                                rectToUpdate.height = distRect.height;
                            }
                            if(streamData.eventDispatcher != null) streamData.eventDispatcher.dispatch('rectChanged')
                        }
        
                        function getEase(currentProgress, start, distance, steps) {
                            currentProgress /= steps/2;
                            if (currentProgress < 1) return distance/2 * Math.pow( 2, 10 * (currentProgress - 1) ) + start;
                            currentProgress--;
                            return distance/2 * ( -Math.pow( 2, -10 * currentProgress) + 2 ) + start;
                        };
        
                        function getX(params) {
                            let distance = params.xTo - params.xFrom;
                            let steps = params.frames;
                            let currentProgress = params.frame;
                            return getEase(currentProgress, params.xFrom, distance, steps, 3);
                        }
        
                        function getY(params) {
                            let distance = params.yTo - params.yFrom;
        
                            let steps = params.frames;
                            let currentProgress = params.frame;
                            return getEase(currentProgress, params.yFrom, distance, steps, 3);
                        }
        
                        function getWidth(params) {
                            let distance = params.widthTo - params.widthFrom;
                            //console.log('width', params.widthTo)
                            let steps = params.frames;
                            let currentProgress = params.frame;
                            return getEase(currentProgress, params.widthFrom, distance, steps, 3);
                        }
        
                        function getHeight(params) {
                            let distance = params.heightTo - params.heightFrom;
                            let steps = params.frames;
                            let currentProgress = params.frame;
                            return getEase(currentProgress, params.heightFrom, distance, steps, 3);
                        }
        
                        function drawVideosOnCanvas() {
                            if(_isActive === false) return;
                            _inputCtx.clearRect(0, 0, _size.width, _size.height);
        
                            for(let i = _activeScene.backgroundSources.length - 1; i >= 0; i--) {
                                if(_activeScene.backgroundSources[i].active == false) continue;
        
                                let streamData = _activeScene.backgroundSources[i];
        
                                if(streamData.sourceType == 'image') {
                                    drawImage(streamData);
                                } else if(streamData.sourceType == 'video') {
                                    drawVideo(streamData);
                                }
                            }
        
                            for(let i = _activeScene.sources.length - 1; i >= 0; i--) {
                                if(_activeScene.sources[i].active == false ||_activeScene.sources[i].sourceType == 'group') continue;
        
                                let streamData = _activeScene.sources[i];
        
                                if(streamData.sourceType == 'webrtc' && streamData.kind == 'video') {
                                    drawSingleVideoOnCanvas(streamData.htmlVideoEl, streamData, _size.width, _size.height, streamData.htmlVideoEl.videoWidth, streamData.htmlVideoEl.videoHeight);
                                    streamData.eventDispatcher.dispatch('userRendered')
        
                                } else if(streamData.sourceType == 'webrtc' && streamData.kind == 'audio') {
                                    drawSingleAudioOnCanvas(streamData);
                                    streamData.eventDispatcher.dispatch('userRendered')
        
                                } else if(streamData.sourceType == 'image') {
                                    drawImage(streamData);
                                } else if(streamData.sourceType == 'video' || streamData.sourceType == 'videoInput') {
                                    drawVideo(streamData);
                                } 
                            }
        
        
                            for(let i = _activeScene.additionalSources.length - 1; i >= 0; i--) {
                                if(_activeScene.additionalSources[i] == null || _activeScene.additionalSources[i].active == false ||_activeScene.additionalSources[i].sourceType == 'group') continue;
        
                                let streamData = _activeScene.additionalSources[i];
        
                                if(streamData.sourceType == 'webrtcrect') {
        
                                    _inputCtx.save();
                                    _inputCtx.beginPath();
                                    _inputCtx.rect(streamData.baseSource.rect.x, streamData.baseSource.rect.y, streamData.baseSource.rect.width, streamData.baseSource.rect.height);
                                    _inputCtx.clip();
        
                                    _inputCtx.fillStyle = streamData.fill;
                                    _inputCtx.fillRect( getX(streamData),  getY(streamData),getWidth(streamData), getHeight(streamData));
                                    if (streamData.frame < streamData.frames) {
                                        streamData.frame = streamData.frame + 1;
                                    } else if (streamData.frame == streamData.frames){
                                        streamData.eventDispatcher.dispatch('animationEnded');
                                        streamData.frame = streamData.frame + 1;
                                    }
        
                                    _inputCtx.restore();
        
        
                                } else if(streamData.sourceType == 'strokerect') {
        
                                    _inputCtx.save();
                                    _inputCtx.beginPath();
                                    _inputCtx.rect(streamData.baseSource.rect.x, streamData.baseSource.rect.y, streamData.baseSource.rect.width, streamData.baseSource.rect.height);
                                    _inputCtx.clip();
        
                                    _inputCtx.lineWidth = streamData.lineWidth;
                                    _inputCtx.strokeStyle = streamData.strokeStyle;
                                    _inputCtx.strokeRect( getX(streamData), getY(streamData), getWidth(streamData), getHeight(streamData));
                                    if (streamData.frame < streamData.frames) {
                                        streamData.frame = streamData.frame + 1;
                                    } else if (streamData.frame == streamData.frames){
                                        streamData.eventDispatcher.dispatch('animationEnded');
                                        streamData.frame = streamData.frame + 1;
                                    }
        
                                    _inputCtx.restore();
        
        
                                } else if(streamData.sourceType == 'webrtctext') {
                                    _inputCtx.save();
                                    _inputCtx.beginPath();
                                    _inputCtx.rect(streamData.baseSource.baseSource.rect.x, streamData.baseSource.baseSource.rect.y, streamData.baseSource.baseSource.rect.width, streamData.baseSource.baseSource.rect.height);
                                    _inputCtx.clip();
        
                                    _inputCtx.font = streamData.font;
                                    _inputCtx.shadowBlur = 5;
                                    _inputCtx.shadowOffsetX = 2;
                                    _inputCtx.shadowOffsetY = 3;
                                    _inputCtx.shadowColor = "black";
                                    _inputCtx.fillStyle = streamData.fillStyle;
                                    _inputCtx.fillText(streamData.text, getX(streamData),  getY(streamData));
        
                                    if (streamData.frame < streamData.frames) {
                                        streamData.frame = streamData.frame + 1;
                                    } else if (streamData.frame == streamData.frames){
                                        streamData.eventDispatcher.dispatch('animationEnded');
                                        streamData.frame = streamData.frame + 1;
                                    }
        
                                    _inputCtx.restore();
                                }
                            }
        
                            for(let i = _activeScene.overlaySources.length - 1; i >= 0; i--) {
                                if(_activeScene.overlaySources[i].active == false ||_activeScene.overlaySources[i].sourceType == 'group') continue;
        
                                let streamData = _activeScene.overlaySources[i];
        
                                if(streamData.sourceType == 'image') {
                                    drawImage(streamData);
                                } else if(streamData.sourceType == 'video') {
                                    drawVideo(streamData);
                                }
                            }
        
                            requestAnimationFrame(function() {
                                drawVideosOnCanvas();
                            });
                        }
        
                        function drawImage(imageSource) {
                            var imageInstanse = imageSource.imageInstance;
                            var width = imageInstanse.width;
                            var height = imageInstanse.height;
        
        
                            var scale = Math.max(_size.width / width, _size.height / height);
                            // get the top left position of the image
                            var x, y, outWidth, outHeight;
                            if(imageSource.rect._x != null) {
                                x = imageSource.rect._x;
                                y = imageSource.rect._y;
                                outWidth = imageSource.rect._width;
                                outHeight = imageSource.rect._height;
                            } else {
                                x = (_size.width / 2) - (width / 2) * scale;
                                y = (_size.height / 2) - (height / 2) * scale;
                                outWidth = width * scale;
                                outHeight = height * scale;
                                imageSource.rect.x = x;
                                imageSource.rect.y = y;
                                imageSource.rect.width = outWidth;
                                imageSource.rect.height = outHeight;
                            }
        
                            _inputCtx.save();
                            if(imageSource.opacity) {
                                _inputCtx.globalAlpha = imageSource.opacity;
                            }
                            _inputCtx.drawImage(imageInstanse,
                                x, y,
                                outWidth, outHeight);
                            _inputCtx.restore();
        
                        }
        
                        function drawVideo(videoSource) {
        
                            var videoOrImg = videoSource.videoInstance;
        
                            var width = videoOrImg.videoWidth;
                            var height = videoOrImg.videoHeight;
        
                            var scale = Math.max(_size.width / width, _size.height / height);
        
                            var x, y, outWidth, outHeight;
                            if(videoSource.rect._x != null) {
                                x = videoSource.rect._x;
                                y = videoSource.rect._y;
                                outWidth = videoSource.rect._width;
                                outHeight = videoSource.rect._height;
                            } else if (width != 0 && height != 0) {
                                x = (_size.width / 2) - (width / 2) * scale;
                                y = (_size.height / 2) - (height / 2) * scale;
                                outWidth = width * scale;
                                outHeight = height * scale;
                                videoSource.rect.x = x;
                                videoSource.rect.y = y;
                                videoSource.rect.width = outWidth;
                                videoSource.rect.height = outHeight;
                            } else {
                                return;
                            }
        
                            // get the top left position of the image
        
                            _inputCtx.drawImage(videoOrImg,
                                x, y,
                                outWidth, outHeight);
        
                        }
        
                        function drawSingleVideoOnCanvas(localVideo, data, canvasWidth, canvasHeight, videoWidth, videoHeight) {
                            if(data.participant.online == false) return;
                            //_inputCtx.translate(data.rect.x, data.rect.y);
        
        
                            var currentWidth = data.htmlVideoEl.videoWidth;
                            var currentHeight = data.htmlVideoEl.videoHeight;
        
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
        
                            //if(!data.screenSharing) {
                            if(data.params.displayVideo == 'cover') {
                                var widthToGet = data.rect.width, heightToGet = data.rect.height, ratio = data.rect.width / data.rect.height;
                                var x, y;
        
                                var scale = Math.max( data.rect.width / currentWidth, (data.rect.height / currentHeight));
        
                                widthToGet =  data.rect.width / scale;
                                heightToGet = currentHeight;
                                //console.log('draw', widthToGet / heightToGet, data.rect.width / data.rect.height)
        
                                if((widthToGet / heightToGet).toFixed(2) != (data.rect.width / data.rect.height).toFixed(2)) {
                                    //console.log('draw if1')
                                    widthToGet = currentWidth;
                                    heightToGet = data.rect.height / scale;
        
                                    x = 0;
                                    y = ((currentHeight / 2) - (heightToGet / 2));
                                } else {
                                    //console.log('draw if2')
                                    x = ((currentWidth / 2) - (widthToGet / 2));
                                    y = 0;
                                }
                                /* if size is smaller than rect widthToGet = data.rect.width / scale;
                                heightToGet = data.rect.height / scale;*/
        
        
                                _inputCtx.drawImage( localVideo,
                                    x, y,
                                    widthToGet, heightToGet,
                                    data.rect.x, data.rect.y,
                                    data.rect.width, data.rect.height);
                            } else {
                                _inputCtx.fillStyle = "#000000";
                                _inputCtx.fillRect(data.rect.x, data.rect.y, data.rect.width, data.rect.height);
        
                                var hRatio = data.rect.width / currentWidth;
                                var vRatio = data.rect.height / currentHeight;
                                var ratio  = Math.min ( hRatio, vRatio );
        
                                var outWidth = currentWidth*ratio;
                                var outHeight = currentHeight*ratio;
                                var freeWidthPx = ( data.rect.width - outWidth ) / 2;
                                var freeHeightPx = ( data.rect.height - outHeight ) / 2
                                var centerShift_x = data.rect.x + freeWidthPx;
                                var centerShift_y = data.rect.y + freeHeightPx;
        
                                _inputCtx.drawImage( localVideo,
                                    0, 0,
                                    currentWidth, currentHeight,
                                    centerShift_x, centerShift_y,
                                    currentWidth * ratio, currentHeight * ratio);
                            }
        
        
        
                            //(currentWidth/2) - (widthToGet / 2), (currentHeight/2) - (heightToGet / 2),
        
                            _inputCtx.strokeStyle = "black";
        
        
        
                            _inputCtx.beginPath();
                            _inputCtx.moveTo(data.rect.x + data.rect.width, data.rect.y);
                            _inputCtx.lineTo(data.rect.x + data.rect.width, data.rect.y);
                            _inputCtx.stroke();
        
                            //_inputCtx.strokeRect(data.rect.x, data.rect.y, data.rect.width, data.rect.height);
                        }
        
                        function drawSingleAudioOnCanvas(data) {
                            if(data.participant.online == false) return;
        
                            //_inputCtx.clearRect(data.rect.x, data.rect.y, data.rect.width, data.rect.height);
        
                            if(window.debug7) console.log('data.rect.x', data.rect.x)
                            _inputCtx.fillStyle = data.parentGroup.params.audioLayoutBgColor;
                            _inputCtx.fillRect(data.rect.x, data.rect.y, data.rect.width, data.rect.height);
        
                            //drawAudioVisualization(data);
        
                            var width, height;
                            if(data.participant.avatar != null) {
        
                                var avatar = data.participant.avatar.image;
                                width = avatar.width;
                                height = avatar.height;
        
                                var scale = Math.min( (data.rect.width / 2) / width,  (data.rect.height / 2) / height);
                                var scaledWidth = width * scale;
                                var scaledHeight = height * scale;
                                // get the top left position of the image
                                var x = data.rect.x + (( data.rect.width / 2) - (width / 2) * scale);
                                var y;
        
                                y = data.rect.y + ((data.rect.height / 2) - (height / 2) * scale);
        
                                var size = Math.min(scaledHeight, scaledWidth);
                                var radius =  size / 2;
        
                                drawSimpleCircleAudioVisualization(data, x, y, radius, scale, size);
        
        
                                _inputCtx.save();
        
        
                                _inputCtx.beginPath();
                                _inputCtx.arc(x + (size / 2), y + (size / 2), radius, 0, Math.PI * 2 , false); //draw the circle
                                _inputCtx.clip(); //call the clip method so the next render is clipped in last path
                                //_inputCtx.strokeStyle = "blue";
                                //_inputCtx.stroke();
                                _inputCtx.closePath();
        
                                _inputCtx.drawImage(avatar,
                                    x, y,
                                    width * scale, height * scale);
                                _inputCtx.restore();
                            }
                        }
        
                        function displayName(webrtcSource) {
                            log('videoComposer: displayName')
                            log('videoComposer: displayName: _activeScene.sources', _activeScene.sources.length)
                            log('videoComposer: displayName: source', webrtcSource)
        
                            if(webrtcSource == null || webrtcSource.displayNameTimeout != null) return;
        
                            var rectWidth = webrtcSource.rect.width;
                            var xPos = webrtcSource.rect.x + ((webrtcSource.rect.width - rectWidth) / 2);
                            var rectHeight = webrtcSource.rect.height / 100 * 20;
                            if(rectHeight > 100) rectHeight = 100;
                           
                            var nameLabel = new RectObjectSource({
                                baseSource: webrtcSource,
                                frame: 0,
                                frames: 100
                                //fill: webrtcSource.params.captionBgColor
                            });
                            nameLabel.name = 'Rectangle';
        
                            Object.defineProperties(nameLabel, {
                                'widthFrom': {
                                    'get': function() {
                                        return this.baseSource.rect.width;
                                    }
                                },
                                'widthTo': {
                                    'get': function() {
                                        return this.baseSource.rect.width;
                                    }
                                },
                                'heightFrom': {
                                    'get': function() {
                                        return this.baseSource.rect.height / 100 * 20;
                                    }
                                },
                                'heightTo': {
                                    'get': function() {
                                        return this.baseSource.rect.height / 100 * 20;
                                    }
                                },
                                'xFrom': {
                                    'get': function() {
                                        return this.baseSource.rect.x;
                                    }
                                },
                                'xTo': {
                                    'get': function() {
                                        return this.baseSource.rect.x;
                                    }
                                },
                                'yFrom': {
                                    'get': function() {
                                        return this.baseSource.rect.y + this.baseSource.rect.height;
                                    }
                                },
                                'yTo': {
                                    'get': function() {
                                        return webrtcSource.rect.y + webrtcSource.rect.height - this.heightTo;
                                    }
                                },
                                'fill': {
                                    'get': function() {
                                        return webrtcSource.params.captionBgColor;
                                    }
                                }
                            });
        
                            function getFontSizeinfo() {
        
                                _inputCtx.save();
                                let fontSize = (nameLabel.heightTo / 100 * 40);
                                _inputCtx.font =  fontSize + "px Arial, sans-serif";
            
                                var nameTextSize = _inputCtx.measureText(webrtcSource.name);
                                
                                var fitTextFont = function() {
                                    fontSize = fontSize - 1;
                                    _inputCtx.font =  fontSize + "px Arial, sans-serif";
                                    nameTextSize = _inputCtx.measureText(webrtcSource.name.toUpperCase());
            
                                    if(nameTextSize.width >= (nameLabel.baseSource.rect.width - 40)) {
                                        fitTextFont();
                                    }
                                }
                                
                                if(nameTextSize.width >= (nameLabel.baseSource.rect.width - 40)) {
                                    fitTextFont();
                                }
                                font = _inputCtx.font;
                                console.log('getFontSizeinfo', font)
                                _inputCtx.restore();
        
                                return {
                                    fontSize: fontSize,
                                    font: font,
                                    textSize: nameTextSize
                                }
                            }
                                    
                            var fontSizeInfo = getFontSizeinfo();
                            var fontSize = fontSizeInfo.fontSize;
                            var font = fontSizeInfo.font;
                            var nameTextSize = fontSizeInfo.textSize;
        
                            console.log('nameTextSize.font', font)
        
                            var nameText = new TextObjectSource({
                                baseSource: nameLabel,
                                frame: 0,
                                frames: 100,
                                textHeight: nameTextSize.fontBoundingBoxAscent + nameTextSize.fontBoundingBoxDescent,
                                fillStyle: webrtcSource.params.captionFontColor,
                                font: font,
                                latestSize: fontSize,
                                //text: textName.toUpperCase()
                            });
                            nameText.name = 'Text: ' + webrtcSource.name;
                   
                            webrtcSource.on('nameChanged', function (newName) {
                                var fontSizeInfo = getFontSizeinfo();
                                nameText.font = fontSizeInfo.font;
                                nameText.latestSize = fontSizeInfo.fontSize;
                                nameText.textHeight = fontSizeInfo.textSize.fontBoundingBoxAscent + fontSizeInfo.textSize.fontBoundingBoxDescent;
                            })
                            webrtcSource.eventDispatcher.on('rectChanged', function() {
                                console.log('RECT CHANGEEEEEEED')
                                var fontSizeInfo = getFontSizeinfo();
                                nameText.font = fontSizeInfo.font;
                                nameText.latestSize = fontSizeInfo.fontSize;
                                nameText.textHeight = fontSizeInfo.textSize.fontBoundingBoxAscent + fontSizeInfo.textSize.fontBoundingBoxDescent;
                            });
                            
                            console.log('font', nameText.font)
                            Object.defineProperties(nameText, {
                                'xFrom': {
                                    'get': function() {
                                        return this.baseSource.xFrom + 20;
                                    }
                                },
                                'xFrom': {
                                    'get': function() {
                                        return this.baseSource.xFrom + 20;
                                    }
                                },
                                'xTo': {
                                    'get': function() {
                                        return this.baseSource.xTo + 20;
                                    }
                                },
                                'yFrom': {
                                    'get': function() {
                                        return this.baseSource.yFrom + this.textHeight + (this.baseSource.heightFrom / 100 * 5);
                                    }
                                },
                                'yTo': {
                                    'get': function() {
                                        return this.baseSource.yTo + this.textHeight + (this.baseSource.heightTo / 100 * 5);
                                    }
                                },
                                /*'font': {
                                    'get': function() {
                                        let size = (this.baseSource.heightTo / 100 * 40);
                                        if(this.latestSize === size) {
                                            return size + 'px Arial';
                                        }
        
                                        //layout should be updated as some changes were applied
                                        this.latestSize = size;
                                        _inputCtx.font = size + "px Arial";
                                        console.log('updating.....')
                                        let nameTextSize = _inputCtx.measureText(webrtcSource.name);
                                        this.textHeight = nameTextSize.fontBoundingBoxAscent + nameTextSize.fontBoundingBoxDescent;
        
                                        return size + 'px Arial';
                                    }
                                },*/
                                'fillStyle': {
                                    'get': function() {
                                        return webrtcSource.params.captionFontColor;
                                    }
                                },
                                'text': {
                                    'get': function() {
                                        return webrtcSource.name;
                                    }
                                },
                            });
        
        
                            let captionFontSize = (rectHeight / 100 * 20);
                            _inputCtx.font = captionFontSize + "px Arial";
                            var captionTextSize = _inputCtx.measureText(webrtcSource.caption);
                            var captionTextWidth = captionTextSize.width;
                            var captionTextHeight =  captionTextSize.fontBoundingBoxAscent + captionTextSize.fontBoundingBoxDescent;
                            console.log('nameTextHeight', captionTextHeight)
                           
                            var captionText = new TextObjectSource({
                                baseSource: nameLabel,
                                frame: 0,
                                frames: 100,
                                textHeight: captionTextHeight,
                                //fillStyle: webrtcSource.params.captionFontColor,
                                latestSize: captionFontSize,
                                font: captionFontSize + 'px Arial'
                                //text: captionText
                            });
                            captionText.name = 'Text: ' + captionText;
        
                            Object.defineProperties(captionText, {
                                'xFrom': {
                                    'get': function() {
                                        return this.baseSource.xFrom + 20;
                                    }
                                },
                                'xTo': {
                                    'get': function() {
                                        return this.baseSource.xTo + 20;
                                    }
                                },
                                'yFrom': {
                                    'get': function() {
                                        return this.baseSource.yFrom + nameText.textHeight + this.textHeight + (this.baseSource.heightFrom / 100 * 10);
                                    }
                                },
                                'yTo': {
                                    'get': function() {
                                        return this.baseSource.yTo + nameText.textHeight + this.textHeight + (this.baseSource.heightTo / 100 * 10);
                                    }
                                },
                                'font': {
                                    'get': function() {
                                        let size = (this.baseSource.heightTo / 100 * 20);
                                        if(this.latestSize === size) {
                                            return size + 'px Arial';
                                        }
        
                                        //layout should be updated as some changes were applied
                                        this.latestSize = size;
                                        _inputCtx.font = size + "px Arial";
                                        console.log('updating.....')
                                        let nameTextSize = _inputCtx.measureText(webrtcSource.caption);
                                        this.textHeight = nameTextSize.fontBoundingBoxAscent + nameTextSize.fontBoundingBoxDescent;
        
                                        return size + 'px Arial';
                                    }
                                },
                                'fillStyle': {
                                    'get': function() {
                                        return webrtcSource.params.captionFontColor;
                                    }
                                },
                                'text': {
                                    'get': function() {
                                        return webrtcSource.caption;
                                    }
                                },
                            });
        
                            addAdditionalSource(nameLabel, true);
        
                            addAdditionalSource(nameText);
        
                            addAdditionalSource(captionText);
                        }
        
                        /*hides name label and all text sources that are related to it */
                        function hideName(webrtcSource) {
                            var dependentTextSources = [];
                            var nameBgSource;
                           
                            for(let i in _activeScene.additionalSources) {
                                if(_activeScene.additionalSources[i].sourceType != 'webrtcrect' || _activeScene.additionalSources[i].baseSource != webrtcSource) continue;
                                nameBgSource = _activeScene.additionalSources[i];
                                break;
                            }
                            for(let i in _activeScene.additionalSources) {
                                if(_activeScene.additionalSources[i].baseSource != nameBgSource || _activeScene.additionalSources[i].sourceType != 'webrtctext') continue;
                                dependentTextSources.push( _activeScene.additionalSources[i]);
                            }
        
                            var neYFrom = nameBgSource.yTo;
                            var neYTo = nameBgSource.yFrom + 100;
                            nameBgSource.yFrom = neYFrom;
                            var oldYTo = nameBgSource.yTo;
                            nameBgSource.yTo = neYTo;
        
                            Object.defineProperties(nameBgSource, {
                                'yFrom': {
                                    'get': function() {
                                        return oldYTo;
                                    }
                                },
                                'yTo': {
                                    'get': function() {
                                        return this.baseSource.rect.y + this.baseSource.rect.height;
                                    }
                                }
                            });
                            nameBgSource.frame = 0;
        
                            for(let r in dependentTextSources) {
                                let textSource = dependentTextSources[r];
                                textSource.yFrom = textSource.yTo;
                                textSource.yTo = textSource.yFrom + 100;
                                textSource.frame = 0;
                                textSource.on('animationEnded', function() {
                                    removeAdditionalSource(textSource);
        
                                });
                            }
        
                            nameBgSource.on('animationEnded', function() {
                                removeAdditionalSource(nameBgSource);
                            });
        
                        }
        
        
                        function displayBorder(participant) {
                            if(!participant.online) return;
        
                            var webrtcSource = _activeScene.sources.filter(function (source) {
                                log('videoComposer: displayName: filter', source)
        
                                return source.sourceType == 'webrtc' && source.participant == participant ? true : false;
                            })[0];
        
                            if(webrtcSource == null) return;
        
                            var rectWidth = webrtcSource.rect.width;
                            var xPos = webrtcSource.rect.x + ((webrtcSource.rect.width - rectWidth) / 2);
                            var rectHeight = webrtcSource.rect.height;
        
                            var whiteBorderWidth = 6;
                            var doubleBorderWidth = whiteBorderWidth * 2;
                            var dividedBorderWidth = whiteBorderWidth / 2;
        
                            var border = new StrokeRectObjectSource({
                                baseSource: webrtcSource,
                                frame: 0,
                                frames: 0,
                                lineWidth:whiteBorderWidth,
                                strokeStyle: '#FFFFFF'
                            });
                            border.name = 'whiteBorder';
        
                            Object.defineProperties(border, {
                                'widthFrom': {
                                    'get': function() {
                                        return this.baseSource.rect.width - whiteBorderWidth;
                                    }
                                },
                                'widthTo': {
                                    'get': function() {
                                        return this.baseSource.rect.width - whiteBorderWidth;
                                    }
                                },
                                'heightFrom': {
                                    'get': function() {
                                        return this.baseSource.rect.height - whiteBorderWidth;
                                    }
                                },
                                'heightTo': {
                                    'get': function() {
                                        return this.baseSource.rect.height - whiteBorderWidth;
                                    }
                                },
                                'xFrom': {
                                    'get': function() {
                                        return this.baseSource.rect.x + dividedBorderWidth;
                                    }
                                },
                                'xTo': {
                                    'get': function() {
                                        return this.baseSource.rect.x + dividedBorderWidth;
                                    }
                                },
                                'yFrom': {
                                    'get': function() {
                                        return this.baseSource.rect.y + dividedBorderWidth;
                                    }
                                },
                                'yTo': {
                                    'get': function() {
                                        return this.baseSource.rect.y + dividedBorderWidth;
                                    }
                                }
                            });
        
                            var colorBorderLineWidth = 10;
                            var doubleColorBorderWidth = colorBorderLineWidth * 2;
                            var halfColorBorderWidth = colorBorderLineWidth / 2;
        
                            var colorBorder = new StrokeRectObjectSource({
                                baseSource: webrtcSource,
                                frame: 0,
                                frames: 0,
                                lineWidth:colorBorderLineWidth
                                //strokeStyle: webrtcSource.params.captionBgColor
                            });
                            colorBorder.name = 'colorBorder';
        
                            Object.defineProperties(colorBorder, {
                                'widthFrom': {
                                    'get': function() {
                                        return this.baseSource.rect.width - doubleBorderWidth - colorBorderLineWidth;
                                    }
                                },
                                'widthTo': {
                                    'get': function() {
                                        return this.baseSource.rect.width - doubleBorderWidth - colorBorderLineWidth;
                                    }
                                },
                                'heightFrom': {
                                    'get': function() {
                                        return this.baseSource.rect.height - doubleBorderWidth - colorBorderLineWidth;
                                    }
                                },
                                'heightTo': {
                                    'get': function() {
                                        return this.baseSource.rect.height - doubleBorderWidth - colorBorderLineWidth;
                                    }
                                },
                                'xFrom': {
                                    'get': function() {
                                        return this.baseSource.rect.x + whiteBorderWidth + halfColorBorderWidth;
                                    }
                                },
                                'xTo': {
                                    'get': function() {
                                        return this.baseSource.rect.x + whiteBorderWidth + halfColorBorderWidth;
                                    }
                                },
                                'yFrom': {
                                    'get': function() {
                                        return this.baseSource.rect.y + whiteBorderWidth + halfColorBorderWidth;
                                    }
                                },
                                'yTo': {
                                    'get': function() {
                                        return this.baseSource.rect.y + whiteBorderWidth + halfColorBorderWidth;
                                    }
                                },
                                'strokeStyle': {
                                    'get': function() {
                                        return webrtcSource.params.captionBgColor;
                                    }
                                }
                            });
        
                            addAdditionalSource(border);
                            addAdditionalSource(colorBorder, true);
                        }
        
                        function hideBorder(participant) {
                            if(!participant.online) return;
                            var dependentTextSources = [];
                            var whiteBorder, colorBorder;
                            var webrtcSource = _activeScene.sources.filter(function (source) {
                                return source.sourceType == 'webrtc' && source.participant == participant ? true : false;
                            })[0];
                            for(let i in _activeScene.additionalSources) {
                                if(_activeScene.additionalSources[i].name != 'whiteBorder' || _activeScene.additionalSources[i].baseSource.participant != participant) continue;
                                whiteBorder = _activeScene.additionalSources[i];
                                break;
                            }
        
                            for(let i in _activeScene.additionalSources) {
                                if(_activeScene.additionalSources[i].name != 'colorBorder' || _activeScene.additionalSources[i].baseSource.participant != participant) continue;
                                colorBorder = _activeScene.additionalSources[i];
                                break;
                            }
        
                            removeAdditionalSource(whiteBorder);
                            removeAdditionalSource(colorBorder);
                        }
        
        
                        function drawSimpleCircleAudioVisualization(data, x, y, radius, scale, size) {
                            var analyser = data.participant.soundMeter.analyser;
                            if(analyser == null) return;
                            var bufferLength = analyser.frequencyBinCount;
                            var dataArray = new Uint8Array(bufferLength);
                            analyser.getByteFrequencyData(dataArray);
                            //just show bins with a value over the treshold
                            var threshold = 0;
                            // clear the current state
                            //_inputCtx.clearRect(data.rect.x, data.rect.y, data.rect.width, data.rect.height);
                            //the max count of bins for the visualization
                            var maxBinCount = dataArray.length;
        
                            _inputCtx.save();
                            _inputCtx.beginPath();
                            _inputCtx.rect(data.rect.x, data.rect.y, data.rect.width, data.rect.height);
                            _inputCtx.clip();
                            //_inputCtx.stroke();
        
                            var radius = radius + (radius / 100 * ((data.participant.soundMeter.average / 255) * 100));
                            //_inputCtx.fillStyle = "#505050";
                            _inputCtx.fillStyle = "rgba(255, 255, 255, 0.4)";
                            _inputCtx.beginPath();
        
                            _inputCtx.arc(data.rect.x + (data.rect.width / 2), data.rect.y + (data.rect.height / 2), radius, 0, 2 * Math.PI);
        
                            _inputCtx.fill();
                            //var radius =  size / 2  + (bass * 0.25);
        
                            _inputCtx.restore();
                        }
        
                        function drawCircleAudioVisualization(data, x, y, radius, scale, size) {
                            var analyser = data.participant.soundMeter.analyser;
                            if(analyser == null) return;
                            var bufferLength = analyser.frequencyBinCount;
                            var dataArray = new Uint8Array(bufferLength);
                            analyser.getByteFrequencyData(dataArray);
                            //just show bins with a value over the treshold
                            var threshold = 0;
                            // clear the current state
                            //_inputCtx.clearRect(data.rect.x, data.rect.y, data.rect.width, data.rect.height);
                            //the max count of bins for the visualization
                            var maxBinCount = dataArray.length;
        
                            _inputCtx.save();
                            _inputCtx.beginPath();
                            _inputCtx.rect(data.rect.x, data.rect.y, data.rect.width, data.rect.height);
                            _inputCtx.clip();
                            //_inputCtx.stroke();
        
                            _inputCtx.globalCompositeOperation='source-over';
        
                            //_inputCtx.scale(0.5, 0.5);
                            _inputCtx.translate(x + radius, y + radius);
                            _inputCtx.fillStyle = "#fff";
        
                            var bass = Math.floor(dataArray[1]); //1Hz Frequenz
                            var radius = (bass * 0.1 + radius);
                            //var radius =  size / 2  + (bass * 0.25);
        
                            //go over each bin
                            var x = x;
                            for ( let i = 0; i < maxBinCount; i++ ){
        
                                var value = dataArray[i];
                                var barHeight = value / 2;
                                if(Math.floor(barHeight) == 0) barHeight = 1;
                                /*var r = barHeight + (25 * (i/bufferLength));
                                var g = 250 * (i/bufferLength);
                                var b = 50;
        
                                _inputCtx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";*/
                                if (value >= threshold) {
                                    _inputCtx.fillRect(0, -radius, 2, -barHeight);
                                    _inputCtx.rotate(((180 / 128) * Math.PI / 180));
                                }
                            }
        
                            /*for ( let i = 0; i < maxBinCount; i++ ){
        
                                var value = dataArray[i];
                                if (value >= threshold) {
                                    _inputCtx.rotate(-(180 / 128) * Math.PI / 180);
                                    _inputCtx.fillRect(0, radius, 2, value / 2);
                                }
                            }
        
                            for ( let i = 0; i < maxBinCount; i++ ){
        
                                var value = dataArray[i];
                                if (value >= threshold) {
                                    _inputCtx.rotate((180 / 128) * Math.PI / 180);
                                    _inputCtx.fillRect(0, radius, 2, value / 2);
                                }
                            }*/
        
        
                            _inputCtx.restore();
                        }
        
                        function drawAudioVisualization(data) {
                            var analyser = data.participant.soundMeter.analyser;
                            if(analyser == null) return;
                            var bufferLength = analyser.frequencyBinCount;
                            var dataArray = new Uint8Array(bufferLength);
                            analyser.getByteFrequencyData(dataArray);
        
                            var WIDTH = data.rect.width;
                            var HEIGHT = data.rect.height / 2;
                            var barWidth = 2;
                            var barsNum = Math.floor(data.rect.width / barWidth);
                            var barHeight;
        
                            //var x = data.rect.x;
                            var y = data.rect.y + 36;
                            var x = ((data.rect.x + data.rect.width - data.rect.x) / 2) - barWidth + data.rect.x;
        
                            var lastRightX = x, lastLeftX = x, side = 'l';
                            for (let i = 0; i < bufferLength; i++) {
                                barHeight = dataArray[i] * 0.2;
        
                                //var r = barHeight + (25 * (i/bufferLength));
                                var r = '0';
                                //var g = 250 * (i/bufferLength);
                                var g = 250;
                                var b = 50;
        
                                _inputCtx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
                                _inputCtx.fillRect(x, y - (barHeight / 2), barWidth, barHeight);
        
                                if(side == 'l') {
                                    lastLeftX = x;
                                    side = 'r';
        
                                    x = lastRightX + barWidth + 1;
        
                                    if(x + barWidth >= data.rect.x + data.rect.width) break;
                                } else if(side == 'r') {
                                    lastRightX = x;
                                    side = 'l';
        
                                    x = lastLeftX - barWidth - 1;
                                    if(x - barWidth <= data.rect.x) break;
                                }
        
        
                            }
                        }
        
                        var circleLoader = (function drawChangingRoomLoader() {
        
                            var _circle = null;
                            const pi = Math.PI,
                                pi2 = pi*2,
                                opts = {
                                    bgc: "rgba(255, 255, 255, 0.5)",
                                    radius: 25,
                                    thickness: 5
                                };
        
                            let w = _size.width,
                                h = _size.height;
                            class Circle {
                                constructor(){
                                    this.reverse = false;
                                    this.theta = 0;
                                }
                                update(){
                                    this.theta+=.2;
        
                                    if(this.theta > pi2){
                                        this.theta = 0;
                                        this.reverse ? this.reverse = false : this.reverse = true;
                                    }
                                };
        
                                draw(){
                                    this.update();
        
                                    _inputCtx.beginPath();
        
                                    this.reverse ?
                                        _inputCtx.arc((w/2) - (opts.radius + 15), h/2 - 8, opts.radius, this.theta, pi2)
                                        : _inputCtx.arc((w/2) - (opts.radius + 15), h/2 - 8, opts.radius, 0, this.theta);
        
                                    _inputCtx.strokeStyle = "#1d1e22";
                                    _inputCtx.lineWidth = opts.thickness;
                                    _inputCtx.lineCap = "round";
                                    _inputCtx.stroke();
                                };
                            }
        
                            _circle = new Circle();
        
                            function draw() {
                                _inputCtx.fillStyle = opts.bgc;
                                _inputCtx.fillRect(0,0,w,h);
        
                                _circle.draw();
        
                                _inputCtx.font = "26px Arial";
                                _inputCtx.fillStyle = "black";
                                _inputCtx.fillText('Switching room...', _size.width / 2, _size.height / 2);
                            }
        
        
                            return {
                                draw:draw
                            }
                        }())
        
                        function compositeVideosAndDraw() {
                            log('compositeVideosAndDraw 0');
        
                            if (_isActive) return;
                            log('compositeVideosAndDraw');
                            if (!document.body.contains(_canvas)) document.body.appendChild(_canvas);
        
                            updateActiveWebRTCLayouts();
                            audioComposer.updateActiveWebRTCAudios();
                            _isActive = true;
                            drawVideosOnCanvas();
                            refreshEventListeners(_webrtcSignalingLib);
                        }
        
                        function refreshEventListeners(webrtcRoomSignalingInstance) {
                            _webrtcSignalingLib = webrtcRoomSignalingInstance;
                            var updateCanvas = function() {
                                if(_isActive == true) {
                                    audioComposer.updateActiveWebRTCAudios();
                                    updateActiveWebRTCLayouts();
                                }
                            }
                            webrtcRoomSignalingInstance.event.on('initNegotiationEnded', updateCanvas);
                            webrtcRoomSignalingInstance.event.on('videoTrackLoaded', updateCanvas);
                            webrtcRoomSignalingInstance.event.on('audioTrackLoaded', updateCanvas);
                            webrtcRoomSignalingInstance.event.on('participantDisconnected', updateCanvas);
                            webrtcRoomSignalingInstance.event.on('trackMuted', updateCanvas);
                            webrtcRoomSignalingInstance.event.on('trackUnmuted', updateCanvas);
                            webrtcRoomSignalingInstance.event.on('screenHidden', updateCanvas);
                            webrtcRoomSignalingInstance.event.on('screenShown', updateCanvas);
                            webrtcRoomSignalingInstance.event.on('audioMuted', updateCanvas);
                            webrtcRoomSignalingInstance.event.on('audioUnmuted', updateCanvas);
        
                            _eventDispatcher.on('drawingStop', function () {
                                webrtcRoomSignalingInstance.event.off('initNegotiationEnded', updateCanvas);
                                webrtcRoomSignalingInstance.event.off('videoTrackLoaded', updateCanvas);
                                webrtcRoomSignalingInstance.event.off('audioTrackLoaded', updateCanvas);
                                webrtcRoomSignalingInstance.event.off('participantDisconnected', updateCanvas);
                                webrtcRoomSignalingInstance.event.off('trackMuted', updateCanvas);
                                webrtcRoomSignalingInstance.event.off('trackUnmuted', updateCanvas);
                                webrtcRoomSignalingInstance.event.off('screenHidden', updateCanvas);
                                webrtcRoomSignalingInstance.event.off('screenShown', updateCanvas);
                                webrtcRoomSignalingInstance.event.off('audioMuted', updateCanvas);
                                webrtcRoomSignalingInstance.event.off('audioUnmuted', updateCanvas);
                            });
                        }
        
                        var _layoutTool = {
                            currentRects: [],
                            basicGridRects: [],
                            state: {
                                customGenerators: [],
                                currentGenerator: [],
                                currentMappedRects: []
                            }
                        };
                        _eventDispatcher.on('sceneSelected', function() {
                            _layoutTool.currentRects = [];
                            _layoutTool.basicGridRects = [];
                        });
                        function layoutGenerator(webrtcGroupSource, layoutName, numberOfRects) {
                            log('layoutGenerator', layoutName, webrtcGroupSource.rect)
        
                            var layouts = {
                                tiledStreamingLayout: function (container, count) {
                                    //var size = {parentWidth: _size.width, parentHeight: _size.height};
                                    var size = {parentWidth: webrtcGroupSource.rect.width, parentHeight: webrtcGroupSource.rect.height, x: webrtcGroupSource.rect.x, y: webrtcGroupSource.rect.y};
                                    return tiledStreamingLayout(size, count);
                                },
                                screenSharing: function (container, count) {
                                    var size = {parentWidth: webrtcGroupSource.rect.width, parentHeight: webrtcGroupSource.rect.height, x: webrtcGroupSource.rect.x, y: webrtcGroupSource.rect.y};
        
                                    return screenSharingLayout(count, size, true);
                                },
                                sideScreenSharing: function (container, count) {
                                    var size = {parentWidth: webrtcGroupSource.rect.width, parentHeight: webrtcGroupSource.rect.height, x: webrtcGroupSource.rect.x, y: webrtcGroupSource.rect.y};
        
                                    return sideScreenSharingLayout(count, size);
                                },
                                audioScreenSharing: function (container, count) {
                                    var size = {parentWidth: webrtcGroupSource.rect.width, parentHeight: webrtcGroupSource.rect.height, x: webrtcGroupSource.rect.x, y: webrtcGroupSource.rect.y};
        
                                    return audioScreenSharingLayout(count, size, true);
                                }
                            }
        
                            function tiledStreamingLayout(container, count) {
                                console.log('tiledStreamingLayout', count,  _layoutTool.currentRects.length)
                                var containerRect = container;
                                _layoutTool.state.currentGenerator = 'tiledStreamingLayout';
        
                                if(_layoutTool.currentRects.length == 0) {
                                    console.log('tiledStreamingLayout 0')
        
                                    _layoutTool.currentRects = build(container, count);
                                } else {
        
                                    if(count > _layoutTool.currentRects.length) {
                                        console.log('tiledStreamingLayout 1')
        
                                        _layoutTool.basicGridRects = build(container, count);
                                        //var availableRects = addAndUpdate(container, count);
                                        //_layoutTool.currentRects = _layoutTool.basicGridRects = _layoutTool.currentRects.concat(availableRects);
                                        let numOfEls = _layoutTool.basicGridRects.length - _layoutTool.currentRects.length;
                                        let last = _layoutTool.basicGridRects.slice(Math.max(_layoutTool.basicGridRects.length - numOfEls, 0))
        
                                        let updatedRects = updateRealToBasicGrid();
                                        _layoutTool.currentRects = updatedRects.concat(last);
        
                                    } else if(count < _layoutTool.currentRects.length) {
                                        console.log('tiledStreamingLayout 2')
        
                                        _layoutTool.basicGridRects = build(container, count);
                                        _layoutTool.currentRects = updateRealToBasicGrid();
                                        //_layoutTool.currentRects = removeAndUpdate();
                                    } else {
                                        console.log('tiledStreamingLayout 3')
        
                                        _layoutTool.basicGridRects = build(container, count);
                                        _layoutTool.currentRects = updateRealToBasicGrid();
                                    }
                                }
        
                                _layoutTool.state.currentMappedRects = _layoutTool.currentRects
                                return _layoutTool.currentRects;
        
                                function build() {
                                    console.log('build')
                                    var size = container;
        
        
                                    if(count == 1) {
                                        return simpleGrid(count, size, 1);
                                    } else if(count == 2) {
                                        return simpleGrid(count, size, 2);
                                    } else if(count == 3) {
                                        return simpleGrid(count, size, 3);
                                    } else if(count == 4) {
                                        return simpleGrid(count, size, 2);
                                    } else if(count == 5) {
                                        return simpleGrid(count, size, 3);
                                    } else if(count >= 6 && count < 13) {
                                        return simpleGrid(count, size, 3);
                                    } else {
                                        return simpleGrid(count, size, 4);
                                    }
                                }
        
                                function updateRealToBasicGrid() {
        
                                    var actualLayoutRects = [];
                                    for(let i in _activeScene.sources) {
                                        if(_activeScene.sources[i].sourceType != 'webrtc') continue;
                                        actualLayoutRects.push({
                                            key: actualLayoutRects.length,
                                            rect: _activeScene.sources[i].rect
                                        });
                                    }
                                    var actualLayoutRectsClone = [...actualLayoutRects];
                                    console.log('updateRealToBasicGrid actualLayoutRects', actualLayoutRects);
        
                                    // for(let r = _layoutTool.basicGridRects.length - 1; r >= 0 ; r--){ryb
                                    for(let r in _layoutTool.basicGridRects) {
                                        let rect = _layoutTool.basicGridRects[r];
        
                                        let closestIndex = closest(rect, actualLayoutRectsClone);
        
                                        console.log('updateRealToBasicGrid closestIndex', r, closestIndex);
                                        console.log('updateRealToBasicGrid closestIndex', rect.x, rect.y, rect.width, rect.height);
                                        if(actualLayoutRects[closestIndex]) {
                                            console.log('updateRealToBasicGrid closestIndex2', actualLayoutRects[closestIndex].x, actualLayoutRects[closestIndex].y, actualLayoutRects[closestIndex].width, actualLayoutRects[closestIndex].height);
                                        }
        
                                        if(closestIndex == null) continue;
        
                                        actualLayoutRects[closestIndex].x = rect.x;
                                        actualLayoutRects[closestIndex].y = rect.y;
                                        actualLayoutRects[closestIndex].width = rect.width;
                                        actualLayoutRects[closestIndex].height = rect.height;
                                        //rectsToSkip.push(closestIndex);
        
                                        for(let c in actualLayoutRectsClone) {
                                            if(actualLayoutRectsClone[c].key == closestIndex) {
                                                actualLayoutRectsClone.splice(c, 1);
                                            }
        
                                        }
                                    }
        
                                    return actualLayoutRects;
        
                                    function closest(rect, rects) {
                                        var distance = function (x1,y1,x2,y2) {
                                            return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
                                        }
        
                                        if(rects.length != 0) {
        
                                            let closestRect = rects.reduce(function (prev, current, index) {
                                                return (distance(current.left + (current.width / 2), current.top + (current.height / 2), rect.left + (rect.width / 2), rect.top + (rect.height / 2)) < distance(prev.left + (prev.width / 2), prev.top + (prev.height / 2), rect.left + (rect.width / 2), rect.top + (rect.height / 2))) ? current : prev;
                                            })
        
                                            return closestRect.key;
        
                                        } else {
                                            return null;
                                        }
                                    }
                                }
        
                                function getElementSizeKeepingRatio(initSize, baseSize) {
                                    console.log('getElementSizeKeepingRatio', baseSize.width, initSize.width, baseSize.height, initSize.height)
                                    var ratio = Math.min(baseSize.width / initSize.width, baseSize.height / initSize.height);
        
                                    return { width: Math.floor(initSize.width*ratio), height: Math.floor(initSize.height*ratio)};
                                }
        
                                function simpleGrid(count, size, perRow, rowsNum) {
                                    console.log('simpleGrid', size);
                                    var rects = [];
                                    var spaceBetween = parseInt(_options.liveStreaming.tiledLayoutMargins);
                                    console.log('simpleGrid spaceBetween', spaceBetween);
        
                                    var rectHeight;
                                    var rectWidth = (size.parentWidth / perRow) - (spaceBetween*(perRow - 1));
                                    if(rowsNum == null) {
                                        rectHeight = size.parentHeight / Math.ceil(count / perRow) - (spaceBetween*(perRow - 1));
                                    } else {
                                        rectHeight = size.parentHeight / rowsNum - (spaceBetween*(perRow - 1));
                                    }
                                    var newRectSize = getElementSizeKeepingRatio({
                                        width: 1280,
                                        height: 720
                                    }, {width: rectWidth, height: rectHeight})
        
                                    rectWidth = newRectSize.width;
                                    rectHeight = newRectSize.height;
                                    rowsNum = Math.floor(size.parentHeight / (rectHeight + spaceBetween));
                                    console.log('simpleGrid 1', size.parentHeight, rectHeight, rectHeight + spaceBetween);
        
                                    var isNextNewLast = false;
                                    var rowItemCounter = 1;
                                    var i;
                                    for (i = 1; i <= count; i++) {
                                        console.log('simpleGrid for', currentRow, rowsNum);
        
                                        var prevRect = rects[rects.length - 1] ? rects[rects.length - 1] : new DOMRect(size.x, size.y, 0, 0) ;
                                        var currentRow = isNextNewLast  ? rowsNum : Math.ceil(i/perRow);
                                        var isNextNewRow  = rowItemCounter == perRow;
                                        isNextNewLast = isNextNewLast == true ? true : isNextNewRow && currentRow + 1 == rowsNum;
        
                                        if(rowItemCounter == 1) {
                                            var y = (prevRect.y + prevRect.height) + spaceBetween;
                                            var x = size.x + spaceBetween;
                                        } else {
                                            var y = prevRect.y;
                                            var x = prevRect.x + prevRect.width + spaceBetween;
                                        }
        
                                        var rect = new DOMRect(x, y, rectWidth, rectHeight);
        
                                        rects.push(rect);
        
                                        if (rowItemCounter == perRow) {
                                            rowItemCounter = 1;
                                        } else rowItemCounter++;
                                    }
        
                                    console.log('simpleGrid rects', rects);
        
                                    //return rects;
                                    return centralizeRects(rects);
                                }
        
                                function getRectsRows(rects) {
                                    var rows = {};
                                    var i, count = rects.length;
                                    for(i = 0; i < count; i++) {
                                        var rect = rects[i];
        
                                        if(rows[rect.top] == null) rows[rect.top] = [];
        
                                        rows[rect.top].push({indx: i, top: rect.top, rect:rect, side:'none'});
        
                                    }
        
                                    var rowsArray = [];
                                    for (let property in rows) {
                                        if (rows.hasOwnProperty(property)) {
                                            rowsArray.push(rows[property]);
                                        }
                                    }
        
                                    return rowsArray;
                                }
        
                                function centralizeRects(rects) {
        
                                    var centerX = container.x + container.parentWidth / 2;
                                    var centerY = container.y + container.parentHeight / 2;
        
                                    var minY = Math.min.apply(Math, rects.map(function(r) { return r.y; }));
                                    var maxY = Math.max.apply(Math, rects.map(function(r) { return r.y + r.height;}));
        
                                    var sortedRows = getRectsRows(rects);
                                    console.log('centralizeRects sortedRows', sortedRows)
        
                                    var alignedRects = []
                                    for(let r in sortedRows) {
                                        let row = sortedRows[r].map(function(r) { return r.rect; });
                                        var rowMinX = Math.min.apply(Math, row.map(function(r) { return r.x; }));
                                        var rowMaxX = Math.max.apply(Math, row.map(function(r) { return r.x + r.width;}));
                                        var rowTotalWidth = rowMaxX - rowMinX;
                                        console.log('centralizeRects rowTotalWidth', rowMinX, rowMaxX, rowTotalWidth)
                                        console.log('centralizeRects centerX', centerX)
                                        var newXPosition = centerX - (rowTotalWidth / 2);
                                        console.log('centralizeRects newXPosition', newXPosition)
        
                                        var moveAllRectsOn = newXPosition - rowMinX;
        
                                        for(let s = 0; s < row.length; s++) {
                                            alignedRects.push(new DOMRect(row[s].left + moveAllRectsOn, row[s].top, row[s].width, row[s].height));
                                        }
                                    }
        
                                    var totalHeight = maxY - minY;
        
                                    var newTopPosition = centerY - (totalHeight / 2);
                                    var moveAllRectsOn = newTopPosition - minY;
                                    for(let s = 0; s < alignedRects.length; s++) {
                                        alignedRects[s] = new DOMRect(alignedRects[s].left, alignedRects[s].top + moveAllRectsOn, alignedRects[s].width, alignedRects[s].height);
                                    }
        
                                    return alignedRects;
                                }
                            }
        
                            function screenSharingLayout(count, size, maximized) {
                                console.log('screenSharingLayout START')
                                _layoutTool.state.currentGenerator = 'screenSharingLayout';
                                var rects = [];
        
                                if(maximized) {
                                    var mainScreenRect = new DOMRect(size.x, size.y, size.parentWidth, size.parentHeight);
                                    rects.push(mainScreenRect);
                                    count--;
                                }
        
                                var rectWidth, rectHeight;
                                if(_size.width > _size.height) {
                                    rectHeight = _size.height / 100 * 15.5;
                                    rectWidth = rectHeight / 9 * 16;
                                } else {
                                    rectWidth = _size.width / 100 * 16.5;
                                    rectHeight = rectWidth / 16 * 9;
                                }
                                var spaceBetween = 10;
                                var totalRects = (size.parentWidth * (size.parentHeight - 66)) / ((rectWidth + spaceBetween) * (rectHeight + spaceBetween));
                                var perCol = Math.floor((size.parentHeight - 66) / (rectHeight + spaceBetween));
                                var perRow =  Math.floor(size.parentWidth / (rectWidth + spaceBetween));
        
                                var side = 'right'
                                var isNextNewLast = false;
                                var createNewColOnRight = null;
                                var createNewColOnLeft = null;
                                var latestRightRect = null;
                                var latestLeftRect = null;
                                var colItemCounter = 1;
                                var leftSideCounter = 0;
                                var rightSideCounter = 0;
                                var i;
                                for (i = 1; i <= count; i++) {
                                    var firstRect = new DOMRect(size.parentWidth, size.parentHeight - 66, rectWidth, rectHeight)
                                    var prevRect = rects.length > 1 ? rects[rects.length - 2] : firstRect;
                                    var currentCol = isNextNewLast  ? perRow : Math.ceil(i/perCol);
                                    var isNextNewCol = colItemCounter  == perCol;
                                    isNextNewLast = isNextNewLast == true ? true : isNextNewCol && currentCol + 1 == perRow;
        
                                    var x, y, rect, prevRect;
                                    if(side == "right") {
                                        prevRect = latestRightRect;
                                        if (rightSideCounter > 0 && !createNewColOnRight) {
                                            y = prevRect.y - (rectHeight + spaceBetween);
                                            x = prevRect.x;
                                        } else if(createNewColOnRight) {
                                            y = size.y + ((size.parentHeight - 66) - (rectHeight + spaceBetween));
                                            x = prevRect.x - (rectWidth + spaceBetween);
                                            createNewColOnRight = false;
                                        } else {
                                            y = size.y + ((size.parentHeight - 66) - (rectHeight + spaceBetween));
                                            x = size.x + (size.parentWidth - (rectWidth + spaceBetween));
                                        }
                                        rightSideCounter++;
        
                                        rect = new DOMRect(x, y, rectWidth, rectHeight);
                                        latestRightRect = rect;
        
                                        side = 'left';
        
                                        if(rightSideCounter % perCol == 0) {
                                            createNewColOnRight = true;
                                        }
                                    } else {
                                        prevRect = latestLeftRect;
                                        if (leftSideCounter > 0 && !createNewColOnLeft) {
                                            y = prevRect.y - (rectHeight + spaceBetween);
                                            x = prevRect.x;
                                        } else if(createNewColOnLeft) {
                                            y = size.y + ((size.parentHeight - 66) - (rectHeight + spaceBetween));
                                            x = prevRect.x + prevRect.width + spaceBetween;
                                            createNewColOnLeft = false;
                                        } else {
                                            y = size.y + ((size.parentHeight - 66) - (rectHeight + spaceBetween));
                                            x = size.x + spaceBetween;
                                        }
                                        leftSideCounter++;
        
                                        rect = new DOMRect(x, y, rectWidth, rectHeight);
                                        latestLeftRect = rect;
        
                                        side = 'right';
        
                                        if(leftSideCounter % perCol == 0) {
                                            createNewColOnLeft = true;
                                        }
                                    }
        
                                    rects.push(rect);
        
                                    if(isNextNewCol) {
                                        colItemCounter = 1;
                                    } else colItemCounter++;
                                }
        
                                return rects;
                            }
        
                            function audioScreenSharingLayout(count, size, maximized) {
                                var initCount = count;
                                console.log('audioScreenSharingLayout START', count)
                                _layoutTool.state.currentGenerator = 'audioScreenSharingLayout';
                                var rects = [];
        
                                if(maximized) {
                                    var mainScreenRect = new DOMRect(size.x, size.y, size.parentWidth, size.parentHeight);
                                    rects.push(mainScreenRect);
                                    count--;
                                }
        
                                var rectWidth, rectHeight;
                                if(_size.width > _size.height) {
                                    rectHeight = _size.height / 100 * 15.5;
                                    rectWidth = rectHeight / 9 * 16;
                                } else {
                                    rectWidth = _size.width / 100 * 16.5;
                                    rectHeight = rectWidth / 16 * 9;
                                }
        
        
                                var spaceBetween = 10;
                                //var totalRects = (size.parentWidth * size.parentHeight) / ((rectWidth + spaceBetween) * (rectHeight + spaceBetween));
                                var perCol = Math.floor(size.parentHeight / (rectHeight + spaceBetween));
                                var perRow =  Math.floor(size.parentWidth / (rectWidth + spaceBetween));
                                var oneSidePerRow = Math.floor((size.parentWidth / 100 * 20) / (rectWidth + spaceBetween));
                                var totalRects = (oneSidePerRow * perCol) * 2;
        
                                if(totalRects < count) {
                                    var newPerCol, newPerRow, newOneSidePerRow, newTotalRects;
                                    var newRectWidth = rectWidth;
                                    var newRectHeight = rectHeight;
                                    var ratio = rectWidth / rectHeight;
                                    function decrementSize() {
                                        if(newRectWidth <= 0 || newRectHeight <= 0) return;
                                        newRectWidth = newRectWidth - 1;
                                        newRectHeight = newRectWidth / ratio;
                                        newPerCol = Math.floor(size.parentHeight / (newRectHeight + spaceBetween));
                                        newPerRow =  Math.floor(size.parentWidth / (newRectWidth + spaceBetween));
                                        newOneSidePerRow = Math.floor((size.parentWidth / 100 * 20) / (newRectWidth + spaceBetween));
        
                                        newTotalRects = (newOneSidePerRow * newPerCol) * 2;
        
                                        if(newTotalRects < count) {
                                            decrementSize();
                                        }
                                    }
        
                                    decrementSize()
                                    perCol = newPerCol;
                                    perRow = newPerRow;
                                    totalRects = newTotalRects;
                                    rectWidth = newRectWidth;
                                    rectHeight = newRectHeight;
                                }
        
        
                                var createNewRow = null;
                                var latestRect = null;
                                var rowItemCounter = 0;
                                var i;
                                for (i = 1; i <= count; i++) {
                                    var firstRect = new DOMRect(size.parentWidth, size.parentHeight, rectWidth, rectHeight)
                                    var prevRect = rects.length > 1 ? rects[rects.length - 2] : firstRect;
                                    var currentRow = Math.ceil(i/perRow);
        
                                    var x, y, rect, prevRect;
                                    prevRect = latestRect;
                                    if (rowItemCounter > 0 && !createNewRow) {
                                        y = prevRect.y;
                                        x = prevRect.x - (rectWidth + spaceBetween);
                                    } else if(createNewRow) {
                                        y = prevRect.y - (rectHeight + spaceBetween);
                                        x = size.x + (size.parentWidth - (rectWidth + spaceBetween));
                                        createNewRow = false;
                                    } else {
                                        y = size.y + (size.parentHeight - (rectHeight + spaceBetween));
                                        x = size.x + (size.parentWidth - (rectWidth + spaceBetween));
                                    }
                                    rowItemCounter++;
        
                                    rect = new DOMRect(x, y, rectWidth, rectHeight);
                                    latestRect = rect;
        
                                    if(rowItemCounter % perRow == 0) {
                                        createNewRow = true;
                                    }
        
                                    rects.push(rect);
                                }
        
                                return rects;
                            }
        
                            return layouts[layoutName](new DOMRect(0, 0, _size.width, _size.height), numberOfRects);
                        }
        
                        function sideScreenSharingLayout(count, size) { 
                            console.log('sideScreenSharingLayout START', count, _layoutTool.currentRects.length)      
                            var spaceBetween = 22;
                
                            if(_layoutTool.state.currentGenerator != 'sideScreenSharingLayout') {
                                _layoutTool.currentRects = [];
                            }
                            _layoutTool.state.currentGenerator = 'sideScreenSharingLayout';
                
                            if (_layoutTool.currentRects.length == 0) {
                                
                                console.log('sideScreenSharingLayout if0') 
                                _layoutTool.currentRects = build();
                            } else {
                 
                                console.log('sideScreenSharingLayout if1.0') 
                                if (count > _layoutTool.currentRects.length) {                   
                                    console.log('sideScreenSharingLayout if1.2')      
        
                                    _layoutTool.basicGridRects = build();
                                    let numOfEls = _layoutTool.basicGridRects.length - _layoutTool.currentRects.length;
                                    let last = _layoutTool.basicGridRects.slice(Math.max(_layoutTool.basicGridRects.length - numOfEls, 0))
                
                                    let updatedRects = updateRealToBasicGrid();
                                    _layoutTool.currentRects = updatedRects.concat(last);
                
                                } else if (count < _layoutTool.currentRects.length) {                  
                                    console.log('sideScreenSharingLayout if')  
                                    _layoutTool.basicGridRects = build();
                                    _layoutTool.currentRects = updateRealToBasicGrid();
                                } else {
                                    console.log('sideScreenSharingLayout 3')
        
                                    _layoutTool.basicGridRects = build();
                                    _layoutTool.currentRects = updateRealToBasicGrid();
                                }
                            }
                
                            return _layoutTool.currentRects;
                
                            function build() {
        
                                console.log('build')
                                let innerContainerWidth = size.parentWidth - spaceBetween * 2;
                                let innerContainerHeight = innerContainerWidth / 16 * 8;
                
                                let sideWidth = size.parentWidth / 100 * (count == 5 ? 45 : 40);
                                let sideSize = { parentWidth: sideWidth, parentHeight: innerContainerHeight + (spaceBetween * 2), x: size.x, y: size.y};
                                let rects = [];
                                if (count - 1 == 1) {
                                    rects = simpleGrid(count - 1, sideSize, 1, 1);
                                } else if (count - 1 == 2) {
                                    rects = simpleGrid(count - 1, sideSize, 1, 2, true);
                                } else if (count - 1 == 3) {
                                    rects = simpleGrid(count - 1, sideSize, 1, 3, true);
                                } else if (count - 1 == 4) {
                                    rects = simpleGrid(count - 1, sideSize, 2, 2);
                                } else if (count - 1 == 5) {
                                    rects = simpleGrid(count - 1, sideSize, 2, null, true);
                                } else if (count - 1 >= 6 && count - 1 <= 9) {
                                    rects = simpleGrid(count - 1, sideSize, 2, null, true);
                                } else if (count - 1 > 9 && count - 1 < 11) {
                                    rects = simpleGrid(count - 1, sideSize, 2, null, true);
                                } else {
                                    rects = simpleGrid(count - 1, sideSize, 3, null, true);
                                }
                
                                console.log('innerContainerHeight', innerContainerHeight, size.parentHeight - (spaceBetween * 2))
                
                                if (innerContainerHeight > size.parentHeight - (spaceBetween * 2)) innerContainerHeight = size.parentHeight - (spaceBetween * 2);
                
                                if (count == 1) {
                                    var mainScreen = new DOMRect(size.x + spaceBetween, size.y + spaceBetween, innerContainerWidth, innerContainerHeight);
                                    rects.unshift(mainScreen);
                                } else {
                                    var minX = Math.min.apply(Math, rects.map(function (rect) { return rect.x; }));
                                    var maxX = Math.max.apply(Math, rects.map(function (rect) { return rect.x + rect.width; }));
                                    console.log('maxX', rects, maxX)
                                    var mainScreen = new DOMRect(maxX + spaceBetween, size.y + spaceBetween, innerContainerWidth - (maxX - size.x), innerContainerHeight);
                                    rects.unshift(mainScreen);
                                }
                               
                                //return rects;
                                return centralizeRectsVertically(rects);
                            }
                
                            function updateRealToBasicGrid() {
                                console.log('updateRealToBasicGrid')
                                var actualLayoutRects = [];
                                for(let i in _activeScene.sources) {
                                    if(_activeScene.sources[i].sourceType != 'webrtc') continue;
                                    actualLayoutRects.push({
                                        key: actualLayoutRects.length,
                                        rect: _activeScene.sources[i].rect
                                    });
                                }
                                var actualLayoutRectsClone = [...actualLayoutRects];
                                console.log('updateRealToBasicGrid actualLayoutRects', actualLayoutRects);
        
                                // for(let r = _layoutTool.basicGridRects.length - 1; r >= 0 ; r--){ryb
                                for(let r in _layoutTool.basicGridRects) {
                                    let rect = _layoutTool.basicGridRects[r];
        
                                    let closestIndex = closest(rect, actualLayoutRectsClone);
        
                                    console.log('updateRealToBasicGrid closestIndex', r, closestIndex);
                                    console.log('updateRealToBasicGrid closestIndex', rect.x, rect.y, rect.width, rect.height);
                                    if(actualLayoutRects[closestIndex]) {
                                        console.log('updateRealToBasicGrid closestIndex2', actualLayoutRects[closestIndex].x, actualLayoutRects[closestIndex].y, actualLayoutRects[closestIndex].width, actualLayoutRects[closestIndex].height);
                                    }
        
                                    if(closestIndex == null) continue;
        
                                    actualLayoutRects[closestIndex].x = rect.x;
                                    actualLayoutRects[closestIndex].y = rect.y;
                                    actualLayoutRects[closestIndex].width = rect.width;
                                    actualLayoutRects[closestIndex].height = rect.height;
                                    //rectsToSkip.push(closestIndex);
        
                                    for(let c in actualLayoutRectsClone) {
                                        if(actualLayoutRectsClone[c].key == closestIndex) {
                                            actualLayoutRectsClone.splice(c, 1);
                                        }
        
                                    }
                                }
        
                                return actualLayoutRects;
        
                                function closest(rect, rects) {
                                    var distance = function (x1,y1,x2,y2) {
                                        return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
                                    }
        
                                    if(rects.length != 0) {
        
                                        let closestRect = rects.reduce(function (prev, current, index) {
                                            return (distance(current.left + (current.width / 2), current.top + (current.height / 2), rect.left + (rect.width / 2), rect.top + (rect.height / 2)) < distance(prev.left + (prev.width / 2), prev.top + (prev.height / 2), rect.left + (rect.width / 2), rect.top + (rect.height / 2))) ? current : prev;
                                        })
        
                                        return closestRect.key;
        
                                    } else {
                                        return null;
                                    }
                                }
                            }
                
                            function simpleGrid(count, size, perRow, rowsNum, asSquares) {
                                console.log('simpleGrid', perRow, rowsNum);
                                console.log('simpleGrid container size', size.parentWidth, size.parentHeight);
                                var rects = [];
                                var spaceBetween = 22;
                                var rectHeight;
                                var rectWidth = (size.parentWidth / perRow) - (spaceBetween * (perRow));
                
                                //console.log('simpleGrid (rectWidth * perRow', rectWidth, perRow, size.parentWidth, ((rectWidth * perRow) / size.parentWidth) * 100);
                                // if(((rectWidth * perRow) / size.parentWidth) * 100 > 24 ) rectWidth = size.parentWidth / 100 * 24;
                
                                if (rowsNum == null) {
                                    console.log('simpleGrid if1');
                
                                    let primaryRectHeight = size.parentHeight / Math.ceil(count / perRow)
                                    rowsNum = Math.floor(size.parentHeight / (primaryRectHeight));
                                    if (rowsNum == 0) rowsNum = 1;
                                    console.log('simpleGrid if1 primaryRectHeight', primaryRectHeight, rowsNum);
                                    rectHeight = (size.parentHeight - (spaceBetween * rowsNum) - spaceBetween) / rowsNum;
                                } else {
                                    console.log('simpleGrid if2');
                                    rectHeight = (size.parentHeight - (spaceBetween * rowsNum) - spaceBetween) / rowsNum;
                                }
                                console.log('simpleGrid rect size0', rectWidth, rectHeight);
                
                                console.log('simpleGrid (rectWidth * perRow', rectWidth, perRow, size.parentWidth, ((rectWidth * perRow) / size.parentWidth) * 100);
                                let rectSize = Math.min(rectWidth, rectHeight);
                                //if(((rectSize * perRow) / size.parentWidth) * 100 > 40 ) rectSize = (size.parentWidth / 100 * 40) / perRow;
                
                                if (asSquares) {
                                    var newRectSize = getElementSizeKeepingRatio({
                                        width: 500,
                                        height: 500
                                    }, { width: rectSize, height: rectSize })
                
                                    rectWidth = newRectSize.width;
                                    rectHeight = newRectSize.height;
                                }
                            
                                console.log('simpleGrid rect size1', rectWidth, rectHeight);
                
                                if (rowsNum == null) rowsNum = Math.floor(size.parentHeight / (rectHeight + spaceBetween));
                                console.log('simpleGrid 1', size.parentHeight, rectHeight, rectHeight + spaceBetween);
                
                                var isNextNewLast = false;
                                var rowItemCounter = 1;
                                var i;
                                for (i = 1; i <= count; i++) {
                                    console.log('simpleGrid for', currentRow, rowsNum);
                
                                    var prevRect = rects[rects.length - 1] ? rects[rects.length - 1] : new DOMRect(size.x, size.y, 0, 0);
                                    var currentRow = isNextNewLast ? rowsNum : Math.ceil(i / perRow);
                                    var isNextNewRow = rowItemCounter == perRow;
                                    isNextNewLast = isNextNewLast == true ? true : isNextNewRow && currentRow + 1 == rowsNum;
                
                                    if (rowItemCounter == 1) {
                                        var y = (prevRect.y + prevRect.height) + spaceBetween;
                                        var x = size.x + spaceBetween;
                                    } else {
                                        var y = prevRect.y;
                                        var x = prevRect.x + prevRect.width + spaceBetween;
                                    }
                
                                    var rect = new DOMRect(x, y, rectWidth, rectHeight);
                
                                    rects.push(rect);
                
                                    if (rowItemCounter == perRow) {
                                        rowItemCounter = 1;
                                    } else rowItemCounter++;
                                }
                
                
                                console.log('simpleGrid rects', rects);
                
                
                
                                //return centralizeRects(rects);
                                return rects;
                            }
                
                            function getRectsRows(rects) {
                                var rows = {};
                                var i, count = rects.length;
                                for (i = 0; i < count; i++) {
                                    var rect = rects[i];
                
                                    if (rows[rect.top] == null) rows[rect.top] = [];
                
                                    rows[rect.top].push({ indx: i, top: rect.top, rect: rect, side: 'none' });
                
                                }
                
                                var rowsArray = [];
                                for (var property in rows) {
                                    if (rows.hasOwnProperty(property)) {
                                        rowsArray.push(rows[property]);
                                    }
                                }
                
                                return rowsArray;
                            }
                
                            function centralizeRects(rects) {
                
                                var centerX = size.parentWidth / 2;
                                var centerY = size.parentHeight / 2;
                
                                var minY = Math.min.apply(Math, rects.map(function (r) { return r.y; }));
                                var maxY = Math.max.apply(Math, rects.map(function (r) { return r.y + r.height; }));
                
                                var sortedRows = getRectsRows(rects);
                                console.log('centralizeRects sortedRows', sortedRows)
                
                                var alignedRects = []
                                for (let r in sortedRows) {
                                    let row = sortedRows[r].map(function (r) { return r.rect; });
                                    var rowMinX = Math.min.apply(Math, row.map(function (r) { return r.x; }));
                                    var rowMaxX = Math.max.apply(Math, row.map(function (r) { return r.x + r.width; }));
                                    var rowTotalWidth = rowMaxX - rowMinX;
                                    console.log('centralizeRects rowTotalWidth', rowMinX, rowMaxX, rowTotalWidth)
                                    console.log('centralizeRects centerX', centerX)
                                    var newXPosition = centerX - (rowTotalWidth / 2);
                                    console.log('centralizeRects newXPosition', newXPosition)
                
                                    var moveAllRectsOn = newXPosition - rowMinX;
                
                                    for (let s = 0; s < row.length; s++) {
                                        alignedRects.push(new DOMRect(row[s].left + moveAllRectsOn, row[s].top, row[s].width, row[s].height));
                                    }
                                }
                
                                var totalHeight = maxY - minY;
                
                                var newTopPosition = centerY - (totalHeight / 2);
                                var moveAllRectsOn = newTopPosition - minY;
                                for (let s = 0; s < alignedRects.length; s++) {
                                    alignedRects[s] = new DOMRect(alignedRects[s].left, alignedRects[s].top + moveAllRectsOn, alignedRects[s].width, alignedRects[s].height);
                                }
                
                                return alignedRects;
                            }
                
                            function centralizeRectsVertically(rects) {
                
                                var centerY = size.parentHeight / 2;
                
                                var minY = Math.min.apply(Math, rects.map(function (r) { return r.y; }));
                                var maxY = Math.max.apply(Math, rects.map(function (r) { return r.y + r.height; }));
                
                                var sortedRows = getRectsRows(rects);
                                console.log('centralizeRects sortedRows', sortedRows)
                
                                var totalHeight = maxY - minY;
                
                                var newTopPosition = size.y + (centerY - (totalHeight / 2));
                                var moveAllRectsOn = newTopPosition - minY;
                                for (let s = 0; s < rects.length; s++) {
                                    rects[s] = new DOMRect(rects[s].left, rects[s].top + moveAllRectsOn, rects[s].width, rects[s].height);
                                }
                
                                return rects;
                            }
        
                            function getElementSizeKeepingRatio(initSize, baseSize) {
                                console.log('getElementSizeKeepingRatio', baseSize.width, initSize.width, baseSize.height, initSize.height)
                                var ratio = Math.min(baseSize.width / initSize.width, baseSize.height / initSize.height);
        
                                return { width: Math.floor(initSize.width*ratio), height: Math.floor(initSize.height*ratio)};
                            }
                        }
        
                        function stopAndRemove() {
                            log('videoComposer: stopAndRemove')
        
                            if(_canvas != null) {
                                if(_canvas.parentNode != null) _canvas.parentNode.removeChild(_canvas);
                            }
        
                            _isActive = false;
                            //if(_activeScene != null) _activeScene.sources = [];
        
                            _eventDispatcher.dispatch('drawingStop');
        
                        }
        
                        function isActive() {
                            return _isActive;
                        }
        
                        return {
                            updateActiveWebRTCLayouts: updateActiveWebRTCLayouts,
                            updateWebRTCLayout: updateWebRTCLayout,
                            compositeVideosAndDraw: compositeVideosAndDraw,
                            refreshEventListeners: refreshEventListeners,
                            stop: stopAndRemove,
                            isActive: isActive,
                            addSource: addSource,
                            removeSource: removeSource,
                            moveSourceForward: moveSourceForward,
                            moveSourceBackward: moveSourceBackward,
                            showSource: showSource,
                            hideSource: hideSource,
                            setWebrtcLayoutRect: setWebrtcLayoutRect,
                            getWebrtcLayoutRect: getWebrtcLayoutRect,
                            getCanvasSize: getCanvasSize,
                            displayName: displayName,
                            hideName: hideName,
                            displayBorder: displayBorder,
                            hideBorder: hideBorder
                        }
                    }());
        
                    var audioComposer = (function(){
                        var audioContext = null;
                        var _dest = null;
        
                        /*var Noise = (function () {
                            "use strict";
                            var supportsES6 = function() {
                                try {
                                    new Function("(a = 0) => a");
                                    return true;
                                }
                                catch (err) {
                                    return false;
                                }
                            }();
        
                            if (!supportsES6) {return;}
        
                            let fadeOutTimer;
        
                            // https://noisehack.com/generate-noise-web-audio-api/
                            function createNoise(track) {
        
                                const bufferSize = 2 * audioContext.sampleRate;
                                const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
                                const output = noiseBuffer.getChannelData(0);
        
                                for (let i = 0; i < bufferSize; i++) {
                                    output[i] = Math.random() * 2 - 1;
                                }
        
                                track.audioSource.buffer = noiseBuffer;
                            }
        
                            function stopNoise(track) {
                                if (track.audioSource) {
                                    clearTimeout(fadeOutTimer);
                                    track.audioSource.stop();
                                }
                            }
        
                            function fadeNoise(track) {
        
                                if (track.fadeOut) {
                                    track.fadeOut = (track.fadeOut >= 0) ? track.fadeOut : 0.5;
                                } else {
                                    track.fadeOut = 0.5;
                                }
        
                                if (track.canFade) {
        
                                    track.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + track.fadeOut);
        
                                    track.canFade = false;
        
                                    fadeOutTimer = setTimeout(() => {
                                        stopNoise(track);
                                    }, track.fadeOut * 1000);
        
                                } else {
                                    stopNoise(track);
                                }
        
                            }
        
                            function buildTrack(track) {
                                track.audioSource = audioContext.createBufferSource();
                                track.gainNode = audioContext.createGain();
                                track.audioSource.connect(track.gainNode);
                                //track.gainNode.connect(audioContext.destination);
                                track.canFade = true; // used to prevent fadeOut firing twice
                            }
        
                            function setGain(track) {
        
                                track.volume = (track.volume >= 0) ? track.volume : 0.5;
        
                                if (track.fadeIn) {
                                    track.fadeIn = (track.fadeIn >= 0) ? track.fadeIn : 0.5;
                                } else {
                                    track.fadeIn = 0.5;
                                }
        
                                track.gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        
                                track.gainNode.gain.linearRampToValueAtTime(track.volume / 4, audioContext.currentTime + track.fadeIn / 2);
        
                                track.gainNode.gain.linearRampToValueAtTime(track.volume, audioContext.currentTime + track.fadeIn);
        
                            }
        
                            function getNoiseTrack(track) {
        
                                stopNoise(track);
                                buildTrack(track);
                                createNoise(track);
                                setGain(track);
                                track.audioSource.loop = true;
                                let dst = track.gainNode.connect(audioContext.createMediaStreamDestination());
                                track.audioSource.start();
                                log('noise mediastreamtrack', dst.stream.getAudioTracks());
                                return dst.stream.getAudioTracks()[0];
                            }
        
                            function getGainNode(track) {
        
                                stopNoise(track);
                                buildTrack(track);
                                createNoise(track);
                                setGain(track);
                                track.audioSource.loop = true;
                                track.audioSource.start();
                                return track.gainNode;
                            }
        
                            // Expose functions:
                            return {
                                getNoiseTrack : getNoiseTrack,
                                getGainNode : getGainNode,
                                stop : stopNoise,
                                fade : fadeNoise
                            }
        
                        }());
        
                        window.Noise = Noise;*/
        
                        var AudioSource = function () {
                            this.active = true;
                            this._name = null;
                            this.parentGroup = null;
                            this.sourceType = 'audio';
                            this.scope = 'scene'; //global || scene
                            this.sourceNode = null;
                            this.setVolume = function (value) {
                                if (!this.gainNode) return;
                                this.gainNode.gain.value = value;
                                if (this.eventDispatcher != null) this.eventDispatcher.dispatch('volumeChanged', value);
                            };
                            this.on = function (event, callback) {
                                if (this.eventDispatcher != null) this.eventDispatcher.on(event, callback)
                            };
                            this.off = function (event, callback) {
                                if (this.eventDispatcher != null) this.eventDispatcher.off(event, callback)
                            };
                            this.eventDispatcher = new EventSystem();
                        }
        
                        var AudioGroupSource = function () {
                            var groupInstance = this;
                            this.groupType = null;
                            this.sourceType = 'group';
                            this.getChildSources = function(type, active) {
                                console.log('getChildSources', type)
            
                                if(groupInstance.groupType == 'webrtc') {
                                    if(active == null) {
                                        return _activeScene.audioSources.filter(function (source) {
                                            return source.sourceType == type && source.parentGroup != null && source.parentGroup == groupInstance;
                                        });
                
                                    }
                                    return _activeScene.audioSources.filter(function (source) {
                                        return source.sourceType == type && source.parentGroup != null && source.parentGroup == groupInstance && source.active === true;
                                    });
                                }
                            }
                        }
                        AudioGroupSource.prototype = new AudioSource();
                        var webrtcAudioGroup = new AudioGroupSource()
                        webrtcAudioGroup.name = 'Participants\' Audio';
                        webrtcAudioGroup.groupType = 'webrtc';
                        defaultScene.audioSources.push(webrtcAudioGroup);
                        var _webrtcAudioGroup = webrtcAudioGroup;
        
                        Object.defineProperties(AudioSource.prototype, {
                            'name': {
                                'set': function(val) {
                                    this._name = val;
                                    if(this.eventDispatcher != null) this.eventDispatcher.dispatch('nameChanged', val)
                                },
                                'get': function(val) {
                                    return this._name;
                                }
                            }
                        });
        
                        var WebRTCAudioSource = function (participant) {
                            this.kind = null;
                            this.participant = participant;
                            this.name = participant.username;
                            this.avatar = participant.avatar ? participant.avatar.image : null;
                            this.track = null;
                            this.mediaStream = null;
                            this.htmlVideoEl = null;
                            this.screenSharing = false;
                            this.sourceType = 'webrtc';
                            this.gainNode = null;
                            this.eventDispatcher = new EventSystem();
                        }
                        WebRTCAudioSource.prototype = new AudioSource();
        
                        var AudioInputSource = function () {
                            this.sourceType = 'audioInput';
                            this.gainNode = null;
                            this.analyserNode = null;
                            this.streams = [];
                            this.addStream = function (mediaStream) {
                                if (audioContext == null) audioComposer.mix();
                                console.log('AudioInputSource 1');
                                if(this.gainNode == null && this.analyserNode == null) {
                                    console.log('AudioInputSource 2');
                                    this.gainNode = audioContext.createGain();;
                                    this.analyserNode = audioContext.createAnalyser();
                                    this.analyserNode.fftSize = 512;
                                    this.gainNode.connect(this.analyserNode);
                                    this.analyserNode.connect(_dest);
                                }
                                
                                console.log('AudioInputSource 3', this.gainNode);
                                console.log('AudioInputSource 3.1', this.analyserNode);
        
                                const source = audioContext.createMediaStreamSource(mediaStream);
                                source.connect(this.gainNode);
        
                                var streamInfo = {
                                    mediaStream: mediaStream,
                                    sourceNode: source
                                }
                                this.streams.push(streamInfo);
                                if (this.eventDispatcher != null) this.eventDispatcher.dispatch('streamAdded', streamInfo);
                            };
                            this.connect = function () {
                                console.log('AudioInputSource connect');
        
                                this.analyserNode.connect(_dest);
                            };
                            this.disconnect = function () {
                                console.log('AudioInputSource disconnect');
        
                                this.analyserNode.disconnect(_dest);
                            };
                        }
                        AudioInputSource.prototype = new AudioSource();
                
                        /*Object.defineProperties(AudioInputSource.prototype, {
                            'mediaStream': {
                                'set': function (val) {
                                    
                                },
                                'get': function (val) {
                                    return this._mediaStream;
                                }
                            }
                        });*/
        
                        function addGlobalAudioSource(newSource) {
        
                            //if access to mic was granted
                            if (newSource.mediaStream && audioContext == null) {
                                audioComposer.mix();
                            }
                
                            var audioSource = new AudioInputSource();
                            if (newSource.mediaStream) audioSource.addStream(newSource.mediaStream);
                            audioSource.name = newSource.title;
                            audioSource.scope = 'global';
                            _globalAudioSources.splice(0, 0, audioSource);
                
                            /*if (newSource.mediaStream) {
                                const source = audioContext.createMediaStreamSource(audioSource.mediaStream);
                                var gainNode = audioContext.createGain();
                                source.connect(gainNode);
                                //gainNode.connect(_dest);
                                var analyserNode = audioContext.createAnalyser();
                                analyserNode.fftSize = 512;
                                gainNode.connect(analyserNode);
                                analyserNode.connect(_dest);
                
                                audioSource.sourceNode = source;
                                audioSource.gainNode = gainNode;
                                audioSource.analyserNode = analyserNode;
                            }*/
                
                            //_eventDispatcher.dispatch('sourceAdded', audioSource);
                            return audioSource;
                        }
        
                        function getWebrtcAudioGroupIndex(webrtcGroup) {
                            for (let j in _activeScene.audioSources) {
                                if (_activeScene.audioSources[j] == webrtcGroup) {
        
                                    var childItems = 0;
                                    for(let i in _activeScene.audioSources) {
                                        if(_activeScene.audioSources[i].parentGroup == webrtcGroup) {
                                            childItems++;
                                        }
                                    }
        
                                    return {index:parseInt(j), childItemsNum: childItems };
                                }
                            }
                        }
        
                        function getIndexOfLatestWebRTCSource() {
                            let indexOfLatestWebRTCSource = 0;
                            for (let j in _activeScene.audioSources) {
                                if (_activeScene.audioSources[j].sourceType == 'webrtc') {
                                    log('getIndexOfLatestWebRTCSource for', j)
        
                                    indexOfLatestWebRTCSource = parseInt(j);
                                }
                            }
                            return indexOfLatestWebRTCSource;
                        }
        
                        function addSource(newSource) {
                            log('addSource audio', newSource, _options.liveStreaming)
                            
                            if (audioContext == null) {
                                audioComposer.mix();
                            }
        
                            if(newSource.sourceType == 'webrtcGroup') {
                                var webrtcAudioGroup = new AudioGroupSource()
                                webrtcAudioGroup.name = newSource.title || "Participants' Audio";
                                webrtcAudioGroup.groupType = 'webrtc';
                                webrtcAudioGroup.relatedWebrtcGroup = newSource.relatedWebrtcGroup;
                                _activeScene.audioSources.push(webrtcAudioGroup);
                                updateWebRTCAudioSources(webrtcAudioGroup);
                                _activeScene.eventDispatcher.dispatch('sourceAdded', newSource);
                                return webrtcAudioGroup;
                            } else if(newSource.sourceType == 'webrtc') {
                                let webrtcGroup = getWebrtcAudioGroupIndex(newSource.parentGroup);
                                let insertAfterIndex = webrtcGroup.index + 1 + webrtcGroup.childItemsNum;
        
                                log('addSource audio add at the end ' + insertAfterIndex)
        
                                if(!newSource.participant.isLocal) {
                                    let newStream = audioContext.createMediaStreamSource(newSource.mediaStream);
                                    newStream.connect(_dest)
                                }
                                
                                _activeScene.audioSources.splice(insertAfterIndex, 0, newSource)
                                _activeScene.eventDispatcher.dispatch('sourceAdded', newSource);
                                return;
                            }  else if(newSource.sourceType == 'audioInput') {
                                let indexOfLatestWebRTCSOurce = getIndexOfLatestWebRTCSource();
        
                                var audioSource = new AudioInputSource();
                                if (newSource.mediaStreamInstance) audioSource.addStream(newSource.mediaStreamInstance);
                                audioSource.name = newSource.title;
                                audioSource.scope = 'scene';
        
                                log('addSource audio add at the end ' + indexOfLatestWebRTCSOurce)
                                
                                _activeScene.audioSources.splice(indexOfLatestWebRTCSOurce + 1, 0, audioSource)
                                _activeScene.eventDispatcher.dispatch('sourceAdded', audioSource);
                                return;
                            } else if(newSource.sourceType == 'audio') {
                                let indexOfLatestWebRTCSOurce = getIndexOfLatestWebRTCSource();
                                console.log('indexOfLatestWebRTCSOurce', indexOfLatestWebRTCSOurce)
                                var audio = document.createElement('audio');
                                audio.muted = false;
                                audio.loop = _options.liveStreaming.loopAudio;
                                audio.src = newSource.url;
                
                                document.body.appendChild(audio);
                
                                var audioSource = new AudioSource();
                                audioSource.audioInstance = audio;
                                audioSource.name = newSource.title;
                                audioSource.scope = 'scene';
                                _activeScene.audioSources.splice((indexOfLatestWebRTCSOurce + 1), 0, audioSource)
                                let sourceNode = audioContext.createMediaElementSource(audioSource.audioInstance);
                                var gainNode = audioContext.createGain();
                                sourceNode.connect(gainNode);
                                //source.connect(_dest)
                                var analyserNode = audioContext.createAnalyser();
                                analyserNode.fftSize = 512;
                                gainNode.connect(analyserNode);
                                analyserNode.connect(_dest);
                
                                if (_options.liveStreaming.localOutput) analyserNode.connect(audioContext.destination);
                                audioSource.sourceNode = sourceNode;
                                audioSource.gainNode = gainNode;
                                audioSource.analyserNode = analyserNode;
                                audioSource.audioInstance.play();
                
                                log('addSource sources', _activeScene.audioSources)
                                _activeScene.eventDispatcher.dispatch('sourceAdded', audioSource);
                                return audioSource;
                            } else if(newSource.sourceType == 'video') {
                                log('addSource audio type', newSource.sourceType)
        
                                const source = newSource.sourceType == 'video' ? audioContext.createMediaElementSource(newSource.videoInstance) : audioContext.createMediaStreamSource(newSource.mediaStream);
                                var gainNode = audioContext.createGain();
                                source.connect(gainNode);
                                var analyserNode = audioContext.createAnalyser();
                                analyserNode.fftSize = 512;
                                gainNode.connect(analyserNode);
                                analyserNode.connect(_dest);
                                if (_options.liveStreaming.localOutput && newSource.sourceType != 'videoInput') analyserNode.connect(audioContext.destination);
                                newSource.audioSourceNode = source;
                                newSource.gainNode = gainNode;
                                newSource.analyserNode = analyserNode;
                                _activeScene.videoAudioSources.splice(0, 0, newSource)
                
                                //_eventDispatcher.dispatch('sourceAdded', newSource);
                                return newSource;
                            }
        
                        }
        
                        function removeSource(source) {
                            for (let j in _activeScene.audioSources) {
                                if (_activeScene.audioSources[j] == source) {
                                    _activeScene.audioSources.splice(j, 1);
                                }
                            }
        
                            if(source.mediaStream != null) {
                                let tracks = source.mediaStream.getTracks();
                                for(let t in tracks) {
                                    tracks[t].stop();
                                }
                            }
                            if(source.audioInstance != null) source.audioInstance.pause();
                            muteSourceLocally(source);
                        }
        
                        function muteSource(source, localOutput) {
                            console.log('muteSource', source, localOutput);
                            //source.mediaStreamTrack.enabled = false;
                            if(source.sourceType == 'webrtc' && source.participant.isLocal) {
                               
                            } else if(source.sourceType == 'webrtc' && !source.participant.isLocal) {
                                if(source.mediaStreamTrack.enabled == true) {
                                    log('muteSource webrtc', source);
                                    source.mediaStreamTrack.enabled = false;
                                }
                            } else if(source.sourceType == 'audio' || source.sourceType == 'audioInput' || source.sourceType == 'video') {
                                console.log('muteSource: audio || video', source, localOutput);
        
                                source.analyserNode.disconnect(_dest);
                                if(localOutput) muteSourceLocally(source);
                            }
                        }
        
                        function muteSourceLocally(source) {
                            if(source.sourceType == 'webrtc') {
        
                            } else if (source.sourceType == 'audio' || source.sourceType == 'video') {
                                if (source.analyserNode) source.analyserNode.disconnect(audioContext.destination);
                            }
                        }
        
                        function unmuteSource(source, localOutput) {
                            //source.mediaStreamTrack.enabled = true;
                            if(source.sourceType == 'webrtc') {
                                if(source.mediaStreamTrack.enabled == false) {
                                    log('unmuteSource unmute webrtc', source);
                                    source.mediaStreamTrack.enabled = true;
                                }
                            } else if(source.sourceType == 'audio' || source.sourceType == 'audioInput' || source.sourceType == 'video') {
                                source.analyserNode.connect(_dest);
                                if(localOutput) unmuteSourceLocally(source);
                            }
                        }
        
                        function unmuteSourceLocally(source) {
                            if(source.sourceType == 'webrtc') {
                                updateWebRTCAudioSources();
                            } if (source.sourceType == 'audio') {
                                source.analyserNode.connect(audioContext.destination);
                            } else if (source.sourceType == 'video') {
                                source.analyserNode.connect(audioContext.destination);
                            }
                        }
        
                        function updateActiveWebRTCAudios() {
                            for(let i in _activeScene.audioSources) {
                                if(_activeScene.audioSources[i].sourceType == 'group' && _activeScene.audioSources[i].groupType == 'webrtc') {
                                    updateWebRTCAudioSources(_activeScene.audioSources[i]);
                                }
                            }
                        }
        
                        function updateWebRTCAudioSources(webrtcGroupSource) {
                            log('updateWebRTCAudioSources START', webrtcGroupSource)
                            //if(_dest == null) _dest = audioContext.createMediaStreamDestination();
        
                            if (audioContext == null) {
                                audioComposer.mix();
                            }
                            
                            var participants = _webrtcSignalingLib.roomParticipants(true);
                            var groupAudioSources = webrtcGroupSource.getChildSources('webrtc');
        
                            for(let v in participants) {
                                log('updateWebRTCAudioSources participant', participants[v].online, participants[v])
                                log('updateWebRTCAudioSources groupAudioSources', groupAudioSources)
        
                                let index = null;
                                for (let j in groupAudioSources) {
                                    if(groupAudioSources[j].participant == participants[v]) {
                                        index = j;
                                    }
                                }
        
                                var audioWebrtcGroup = getWebrtcAudioGroupIndex(webrtcGroupSource);
        
                                if(!audioWebrtcGroup) return;
                                let h = parseInt(audioWebrtcGroup.index) + 1, sourceStream = groupAudioSources[h];
                                while (sourceStream != null && sourceStream.sourceType == 'webrtc') {
                                    h++
                                    sourceStream = groupAudioSources[h];
                                }
                                log('updateWebRTCAudioSources index of audio group ' + (h), groupAudioSources.length)
        
        
        
                                let audioTracks = participants[v].audioTracks();
        
                                var isLive = false;
                                if( _canvasMediStream != null && index != null && groupAudioSources[index].mediaStreamTrack != null) {
                                    for(let t in _canvasMediStream.getAudioTracks()) {
                                        if(_canvasMediStream.getAudioTracks()[t] == groupAudioSources[index].mediaStreamTrack) {
                                            isLive = true;
                                        }
                                    }
                                }
        
                                log('updateWebRTCAudioSources isLive', isLive)
                                log('updateWebRTCAudioSources index', index)
        
                                var audioSource = null;
                                if(index == null && audioTracks.length != 0) {
                                    log('updateWebRTCAudioSources add audio')
        
                                    var newAudio = new WebRTCAudioSource(participants[v]);
                                    newAudio.parentGroup = _webrtcAudioGroup;
                                    newAudio.track = audioTracks[0];
                                    newAudio.mediaStream = audioTracks[0].stream.clone();
                                    newAudio.mediaStreamTrack = newAudio.mediaStream.getAudioTracks()[0];
                                    newAudio.parentGroup = webrtcGroupSource;
        
                                    audioSource = newAudio;
                                    addSource(newAudio);
                                } else if (index != null && isLive === false) {
                                    log('updateWebRTCAudioSources index != null && isLive === false');
                                    audioSource = groupAudioSources[index];
                                    if(_canvasMediStream != null) {
                                        log('updateWebRTCAudioSources add');
                                        //_canvasMediStream.addTrack(audioSource.mediaStreamTrack);
                                    }
                                } else {
                                    audioSource = groupAudioSources[index];
                                }
        
                                if(audioSource && audioSource.participant.online == false) {
                                    log('updateWebRTCAudioSources remove audio')
                                    groupAudioSources.splice(index, 1);
                                    continue;
                                }
        
                            }
                        }
        
                        function mix() {
                            console.log('audioComposer: mix');
                            if (audioContext == null) audioContext = new AudioContext();
                            if (_dest == null) _dest = audioContext.createMediaStreamDestination();
        
        
                            /* let silence = () => {
                                 let ctx = new AudioContext(), oscillator = ctx.createOscillator();
                                 let dst = oscillator.connect(ctx.createMediaStreamDestination());
                                 oscillator.start();
                                 return Object.assign(dst.stream.getAudioTracks()[0], {enabled: false});
                             }*/
        
                            /*var silentTrack = silence();
                            var silentStream = new MediaStream();
                            silentStream.addTrack(silentTrack);
                            let source = audioContext.createMediaStreamSource(silentStream);
                            source.connect(_dest);*/
                            //_canvasMediStream.addTrack(silentTrack);
        
                            var noise = {
                                volume: 0.05, // 0 - 1
                                fadeIn: 2.5, // time in seconds
                                fadeOut: 1.3, // time in seconds
                            }
        
                            //var noiseGainNode = Noise.getGainNode(noise);
                            //noiseGainNode.connect(_dest);
                            //window.noiseGainNode = noiseGainNode;
                            //_canvasMediStream.addTrack(noiseTrack);
                            //_canvasMediStream.addTrack(localParticipant.audioTracks()[0].mediaStreamTrack);
        
                            if(_canvasMediStream) _canvasMediStream.addTrack(_dest.stream.getTracks()[0]);
                            updateActiveWebRTCAudios();
        
                            if(_options.liveStreaming.sounds) {
                                _webrtcSignalingLib.event.on('participantConnected', function (e) {
                                    if (_canvasMediStream == null || _dest == null) return;
        
                                    var connectedAudio = new Audio(_options.sounds.participantConnected)
                                    var audioSource = audioContext.createMediaElementSource(connectedAudio);
                                    audioSource.connect(_dest);
                                    connectedaudioContext.play();
                                    //audioSource.disconnect(_dest);
                                })
        
                                _webrtcSignalingLib.event.on('participantDisconnected', function (e) {
                                    if (_canvasMediStream == null || _dest == null) return;
                                    var disconnectedAudio = new Audio(_options.sounds.participantDisconnected)
                                    var audioSource = audioContext
                                        .createMediaElementSource(disconnectedAudio);
                                    audioSource.connect(_dest);
                                    disconnectedAudio.play();
                                    //audioSource.disconnect(_dest);
                                })
                            }
                        }
        
                        function stop() {
                            for (let s in _activeScene.audioSources) {
                                if(_activeScene.audioSources[s].mediaStreamTrack) {
                                    _activeScene.audioSources[s].mediaStreamTrack.stop();
                                }
                            }
                            if(_dest != null) _dest.disconnect();
                            _dest = null;
                        }
        
                        return {
                            mix: mix,
                            stop: stop,
                            getDestination: function () {
                                return _dest;
                            },
                            getContext: function () {
                                return audioContext;
                            },
                            updateWebRTCAudioSources: updateWebRTCAudioSources,
                            updateActiveWebRTCAudios: updateActiveWebRTCAudios,
                            addGlobalAudioSource: addGlobalAudioSource,
                            addSource: addSource,
                            removeSource: removeSource,
                            muteSource: muteSource,
                            unmuteSource: unmuteSource,
                            muteSourceLocally: muteSourceLocally,
                            unmuteSourceLocally: unmuteSourceLocally
                        }
                    }());
        
                    function addDataListener(callbackFunction) {
                        _dataListeners.push(callbackFunction);
                    }
        
                    function removeDataListener(callbackFunction) {
                        var index = _dataListeners.indexOf(callbackFunction);
        
                        if (index > -1) {
                            _dataListeners.splice(index, 1);
                        }
                    }
        
                    function trigerDataListeners(blob) {
                        for(let i in _dataListeners) {
                            _dataListeners[i](blob);
                        }
                    }
        
                    function captureStream() {
                        log('captureStream');
        
                        videoComposer.compositeVideosAndDraw();
        
                        _canvasMediStream = _canvas.captureStream(30); // 30 FPS
        
                        var vTrack = _canvasMediStream.getVideoTracks()[0];
        
                        vTrack.addEventListener('mute', function(e){
                            _videoTrackIsMuted = true;
                            log('captureStream: TRACK MUTED');
                        });
                        vTrack.addEventListener('unmute', function(e){
                            _videoTrackIsMuted = false;
                            log('captureStream: TRACK UNMUTED');
                        });
                        audioComposer.mix();
        
                        _composerIsActive = true;
        
                        return _canvasMediStream;
                    }
        
                    function stopStreamCapture() {
                        log('stopStreamCapture');
        
                        videoComposer.stop();
        
                        if(_canvasMediStream != null) {
                            let tracks = _canvasMediStream.getTracks();
                            for(let t in tracks) {
                                tracks[t].stop()
                            }
                            _canvasMediStream = null;
                        }
        
                        audioComposer.stop();
                        
                        _composerIsActive = false;
        
                    }
        
                    function startRecorder(ondataavailable) {
                        if(ondataavailable != null){
                            addDataListener(ondataavailable);
                        }
                        if(_mediaRecorder != null){
                            return;
                        }
        
                        if(_canvasMediStream == null) {
                            captureStream();
                        }
        
                        var isChrome = _localInfo.browserName && _localInfo.browserName.toLowerCase() == 'chrome';
        
                        var codecs = 'video/webm;codecs=vp8';
                        log('captureStream isChrome',_localInfo, isChrome, !_isMobile);
        
                        //alert('mp4 ' + (MediaRecorder.isTypeSupported('video/mp4;codecs="vp8"')));
                        if (MediaRecorder.isTypeSupported('video/mp4')) {
                            codecs = 'video/mp4';
                        } else if(isChrome && !_isMobile) {
                            codecs = 'video/webm;codecs=h264';
                        } else if (_isMobile && _isAndroid) {
                            codecs = 'video/webm;codecs=vp8';
                        }
                        log('captureStream codecs', codecs);
        
                        if(_options.liveStreaming.useRecordRTCLibrary) {
                            log('captureStream if1');
        
        
                            _mediaRecorder = RecordRTC(_canvasMediStream, {
                                recorderType:MediaStreamRecorder,
                                mimeType: codecs,
                                timeSlice: 1000,
                                ondataavailable:trigerDataListeners
                            });
                            _mediaRecorder.startRecording();
                        } else {
                            log('captureStream if1 else');
        
        
                            _mediaRecorder = new MediaRecorder(_canvasMediStream, {
                                //mimeType: 'video/webm',
                                mimeType: codecs,
                                /*audioBitsPerSecond : 128000,*/
                                videoBitsPerSecond : 3 * 1024 * 1024
                            });
        
                            _mediaRecorder.onerror = function(e) {
                                console.error(e);
                            }
        
                            _mediaRecorder.addEventListener('dataavailable', function(e) {
                                //log('dataavailable', e.data.size);
                                trigerDataListeners(e.data);
                            });
        
                            _mediaRecorder.start(1000); // Start recording, and dump data every second
                        }
        
                        
                    }
        
                    function stopRecorder() {
                        log('stopRecorder')
        
                        if(_mediaRecorder == null) return;
                        if(_options.liveStreaming.useRecordRTCLibrary) {
                            log('stopRecorder: RecordRTC')
        
                            _mediaRecorder.stopRecording(function () {
                                /*document.querySelector('.Streams_webrtc_recording').addEventListener('click', function () {
        
                                    var fileName = 'test.webm';
                                    var file = new File([_mediaRecorder.getBlob()], fileName, {
                                        type: 'video/webm;codecs=h264'
                                    });
                                    invokeSaveAsDialog(file, fileName);
        
        
                                })*/
                            });
                        } else {
                            log('stopRecorder: native')
        
                            _mediaRecorder.stop();
                            /*document.querySelector('.Streams_webrtc_recording').addEventListener('click', function () {
        
        
                                var blobToSave = new Blob(fbLive.videoStream().allBlobs);
        
                                var fileName = 'test.webm';
                                var file = new File([blobToSave], fileName, {
                                    type: 'video/webm;codecs=h264'
                                });
                                saveToFile(file, fileName);
        
        
                            })*/
                        }
                        /*videoComposer.stop();
                        audioComposer.stop();*/
                        stopStreamCapture();
                        _mediaRecorder = null;
                    }
        
                    function saveToFile(file, fileName) {
                        log('saveToFile')
                        if (!file) {
                            throw 'Blob object is required.';
                        }
        
                        if (!file.type) {
                            try {
                                file.type = 'video/webm';
                            } catch (e) {}
                        }
        
                        var fileExtension = (file.type || 'video/webm').split('/')[1];
        
                        if (fileName && fileName.indexOf('.') !== -1) {
                            var splitted = fileName.split('.');
                            fileName = splitted[0];
                            fileExtension = splitted[1];
                        }
        
                        var fileFullName = (fileName || (Math.round(Math.random() * 9999999999) + 888888888)) + '.' + fileExtension;
        
                        if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
                            return navigator.msSaveOrOpenBlob(file, fileFullName);
                        } else if (typeof navigator.msSaveBlob !== 'undefined') {
                            return navigator.msSaveBlob(file, fileFullName);
                        }
        
                        var hyperlink = document.createElement('a');
                        hyperlink.href = URL.createObjectURL(file);
                        hyperlink.download = fileFullName;
        
                        hyperlink.style = 'display:none;opacity:0;color:transparent;';
                        (document.body || document.documentElement).appendChild(hyperlink);
        
                        if (typeof hyperlink.click === 'function') {
                            hyperlink.click();
                        } else {
                            hyperlink.target = '_blank';
                            hyperlink.dispatchEvent(new MouseEvent('click', {
                                view: window,
                                bubbles: true,
                                cancelable: true
                            }));
                        }
        
                        URL.revokeObjectURL(hyperlink.href);
                    }
        
                    function stopCanvasRendering() {
                        videoComposer.stop();
                    }
        
                    function stopAudioMixing() {
                        audioComposer.stop();
                    }
        
                    function generateId() {
                        return Date.now().toString(36) + Math.random().toString(36).replace(/\./g, "");
                    }

                    function EventSystem() {

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
    
                        var destroy = function () {
                            events = {};
                        }
    
                        return {
                            dispatch: dispatch,
                            on: on,
                            off: off,
                            destroy: destroy
                        }
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
                        videoComposer: videoComposer,
                        audioComposer: audioComposer,
                        captureStream: captureStream,
                        stopStreamCapture: stopStreamCapture,
                        getMediaStream: function() {
                            return _canvasMediStream;
                        },
                        addDataListener: addDataListener,
                        removeDataListener: removeDataListener,
                        mediaRecorder: function () {
                            return _mediaRecorder;
                        },
                        canvas: function () {
                            return _canvas;
                        },
                        endStreaming: function () {
                            stopRecorder();
                        },
                        startRecorder: startRecorder,
                        stopRecorder: stopRecorder,
                        isActive: function () {
                            return _composerIsActive;
                            //if(_mediaRecorder != null) return true;
                            //return false;
                        },
                        eventDispatcher: function () {
                            return _eventDispatcher
                        },
                        on: function (event, handler) {
                            _eventDispatcher.on(event, handler);
                        },
                        off: function () {
        
                        },
                        createScene: createScene,
                        getScenes: getScenes,
                        getActiveScene: getActiveScene,
                        videoTrackIsMuted: function () {
                            return _videoTrackIsMuted;
                        },
                        createScene: createScene,
                        removeScene: removeScene,
                        moveSceneUp: moveSceneUp,
                        moveSceneDown: moveSceneDown,
                        getScenes: getScenes,
                        selectScene: selectScene,
                        getActiveScene: getActiveScene
                    }
                }())
            },
            refresh: function() {
                var tool = this;
                tool.canvasComposer.videoComposer.refreshEventListeners(tool.state.webrtcSignalingLib);
            }
        }

    );

})(window.jQuery, window);