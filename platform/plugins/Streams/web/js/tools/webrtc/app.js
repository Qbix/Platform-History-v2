/**
 * Library for real time calls based on WebRTC
 * @module WebRTCRoomClient
 * @class WebRTCRoomClient
 * @param {Object} [options] config options
 * @param {String} [options.nodeServer] address of node websocket server that is used as signalling server while WebRTC negotiation
 * @param {String} [options.roomName] unique string that is used as room identifier
 * @param {Boolean} [options.audio] if true, library will request acces to microphone and adds to call
 * @param {Boolean} [options.video] if true, library will request acces to microphone and adds to call
 * @param {Boolean} [options.startWith.audio] if true, microphone icon by default is turned on
 * @param {Boolean} [options.startWith.video] if true, microphone icon by default is turned on
 * @param {Array} [streams] Precreated streams that will be added to call
 * @param {Number} [disconnectTime] time in ms after which inactive user will be disconnected
 * @param {Array} [turnCredentials] Array of objects that contains createndials for TURN server
 * @param {String} [turnCredentials[].credential] secret string/password
 * @param {String} [turnCredentials[].urls] address of TURN Server
 * @param {String} [turnCredentials[].username]
 * @param {String} [username] username of current user in chat
 * @param {Boolean} [debug] if true, logs will be showed in console
 * @param {Object} [liveStreaming] option for live sctreaming
 * @param {Boolean} [liveStreaming.startFbLiveViaGoLiveDialog=false] whether to start Facebook Live Video via "Go Live Dialog" (JS SDK); if false - live will be started via PHP SDK
 * @param {Boolean} [liveStreaming.useRecordRTCLibrary] whether to RecordRTC.js library while capturing compounded video from canvas
 * @param {Number} [liveStreaming.timeSlice] time in ms - video will be send in chunks once per <timeSlice>
 * @param {Number} [liveStreaming.chunkSize] size in bytes (if timeSlice not specified) - size of chunk to send on server
 * @return {Object} instance of WebRTC chat
 */
window.WebRTCRoomClient = function app(options){
    var app = {};
    var defaultOptions = {
        nodeServer: '',
        roomName: null,
        roomStartTime: null,
        roomPublisher: null,
        audio: false,
        video: false,
        startWith: {},
        limits: {},
        showScreenSharingInSeparateScreen: false,
        streams: null,
        sounds: null,
        disconnectTime: 3000,
        turnCredentials: null,
        username: null,
        debug: null,
        onlyOneScreenSharingAllowed: null,
        liveStreaming: {},
        useCordovaPlugins: false,
        socket: null
    };

    if(typeof options === 'object') {
        var mergedOptions = {};
        for (var key in defaultOptions) {
            if (defaultOptions.hasOwnProperty(key)) {
                mergedOptions[key] = options.hasOwnProperty(key) && typeof options[key] !== 'undefined' ? options[key] : defaultOptions[key];
            }
        }
        options = mergedOptions;
    }

    console.log('options 0', options);

    app.getOptions = function () {
        return options;
    }

    var roomParticipants = [];
    app.roomParticipants = function(all) {
        if(all) {
            return roomParticipants;
        } else {
            return roomParticipants.filter(function (participant) {
                return (participant.online !== false);
            });
        }
    }


    if(typeof cordova != 'undefined') AudioToggle.setAudioMode(AudioToggle.EARPIECE);
    app.addParticipant = function(participant) {roomParticipants.unshift(participant);}

    var localParticipant;
    app.localParticipant = function() { return localParticipant; }
    app.state = 'disconnected';
    app.initNegotiationState = 'disconnected';

    //node.js vars
    var socket;
    app.socketConnection = function() { return socket; }


    var _isMobile;
    var _isiOS;
    var _isAndroid;
    var _usesUnifiedPlan =  RTCRtpTransceiver.prototype.hasOwnProperty('currentDirection');

    var turn = false;
    var pc_config = {
        //"iceTransportPolicy": "relay",
        "iceServers": [
            {
                "urls": "stun:stun.l.google.com:19302"
            }/*,
             {
				 'url': 'turn:194.44.93.224:3478',
				 'credential': 'qbixpass',
				 'username': 'qbix'
			 }*/
        ],
        "sdpSemantics":"unified-plan"
    };

    var ua = navigator.userAgent;
    if(!_usesUnifiedPlan) {
        pc_config.sdpSemantics = 'plan-b';
    }


    if(options.turnCredentials != null || turn) {
        var changeToUrls;
        try{
            testPeerConnection = new RTCPeerConnection(pc_config);
        } catch (e) {
            changeToUrls = true;
        }
        if(testPeerConnection != null) testPeerConnection.close();

        for(var t in options.turnCredentials) {
            var turn = options.turnCredentials[t];
            pc_config['iceServers'].push(turn)

            if(changeToUrls) {
                turn['urls'] = turn['url'];
                delete turn['url'];
            }
        }
        console.log('pc_config', pc_config)
    } else {
        var testPeerConnection = new RTCPeerConnection(pc_config);
    }

    console.log('pc_config', pc_config);
    if(ua.indexOf('Android')!=-1||ua.indexOf('Windows Phone')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPad')!=-1||ua.indexOf('iPod')!=-1) {
        _isMobile = true;
        if(ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) {
            _isiOS = true;
        } else if (/android/i.test(ua)) {
            _isAndroid = true;
        }
    }

    var browser = determineBrowser(navigator.userAgent)
    var _localInfo = {
        isMobile: _isMobile,
        platform: _isiOS ? 'ios' : (_isAndroid ? 'android' : null),
        usesUnifiedPlan: _usesUnifiedPlan,
        isCordova: typeof cordova != 'undefined',
        ua: navigator.userAgent,
        browserName: browser[0],
        browserVersion: parseInt(browser[1]),
        supportedVideoMimeTypes: []
    }

    if(typeof MediaRecorder != 'undefined') {
        if (MediaRecorder.isTypeSupported('video/mp4')) {
            _localInfo.supportedVideoMimeTypes.push('video/mp4');
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
            _localInfo.supportedVideoMimeTypes.push('video/webm;codecs=h264');
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            _localInfo.supportedVideoMimeTypes.push('video/webm;codecs=vp9');
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
            _localInfo.supportedVideoMimeTypes.push('video/webm;codecs=vp9');
        }
    }



    app.event = new EventSystem();

    /**
     * Contains information about participant
     * @class Participant
     * @constructor
     */
    var Participant = function () {
        /**
         * Participant's sid = socket.id
         *
         * @property sid
         * @type {String}
         */
        this.sid = null;
        /**
         * Is composed of Q.Users.loggedInUser and timestamp and is used by clients for outputing participant's name
         *
         * @property identity
         * @type {String}
         */
        this.identity = null;
        /**
         * Array of tracks that participant has
         *
         * @property tracks
         * @uses Track
         * @type {Array}
         */
        this.tracks = [];
        /**
         * Only for local user. Array contains audio track from mic for maintaining mic access to avoid autoplay issues.
         *
         * @property notForUsingTracks
         * @type {Array}
         */
        this.notForUsingTracks = [];
        /**
         * Array of streams that participant has TODO:remove it as it is not used anymore
         *
         * @property streams
         * @type {Array}
         */
        this.streams = [];
        /**
         * Returns list of participant's video tracks
         *
         * @method videoTracks
         * @uses Track
         * @param {Object} [activeTracksOnly] return only active video tracks
         * @return {Array}
         */
        this.videoTracks = function (activeTracksOnly) {
            if(activeTracksOnly) {
                return this.tracks.filter(function (trackObj) {
                    return trackObj.kind == 'video' && !(trackObj.mediaStreamTrack.muted == true || trackObj.mediaStreamTrack.enabled == false || trackObj.mediaStreamTrack.readyState == 'ended');
                });
            }

            return this.tracks.filter(function (trackObj) {
                return trackObj.kind == 'video';
            });

        }
        /**
         * Returns list of participant's audio tracks
         *
         * @method audioTracks
         * @uses Track
         * @return {Array}
         */
        this.audioTracks = function () {
            return this.tracks.filter(function (trackObj) {
                return trackObj.kind == 'audio';
            });
        }
        this.muteAudio = function () {
            for(var i in this.tracks) {
                var track = this.tracks[i];
                if(track.kind != 'audio') continue;
                track.trackEl.muted = true;
            }
            this.audioIsMuted = true;
            app.event.dispatch('audioMuted', this);

        };
        this.unmuteAudio = function () {
            if(this.isAudioMuted == false) return;
            for(var i in this.tracks) {
                var track = this.tracks[i];
                if(track.kind != 'audio') continue;
                track.trackEl.muted = false;
            }
            this.audioIsMuted = false;
            app.event.dispatch('audioUnmuted', this);

        };
        /**
         * Removes track from participants tracks list and stops sending it to all participants
         *
         * @method remove
         */
        this.remove = function () {

            app.event.dispatch('participantRemoved', this);

            for(var t = this.tracks.length - 1; t >= 0; t--){

                if(this.tracks[t].mediaStreamTrack != null) {
                    this.tracks[t].mediaStreamTrack.stop();
                }
                if(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins && this.tracks[t].stream != null) {
                    this.tracks[t].stream.getTracks()[0].stop();
                }
            }

            if(this.RTCPeerConnection != null) this.RTCPeerConnection.close();

            if(options.useCordovaPlugins && typeof cordova != 'undefined' && _isiOS) iosrtcLocalPeerConnection.removeLocalNativeStreams();
            for(var p = roomParticipants.length - 1; p >= 0; p--){
                if(roomParticipants[p].sid == this.sid) {
                    roomParticipants.splice(p, 1);
                    break;
                }
            }
        }
        /**
         * Audio analyzer of user's audio tracks. Is used for audio visualizations and "loudest screen" mode feature
         *
         * @property soundMeter
         * @type {Object}
         */
        this.soundMeter = {
            svg: null,
            context: null,
            script: null,
            instant: 0.0,
            slow: 0.0,
            clip: 0.0,
            soundBars: [],
            barsLength: 0,
            history: {averageVolume: 0, volumeValues:[]},
            isDisabled: false,
            visualizations: {},
            reset: function() {

            },
            stop: function() {

            }
        }
        /**
         * Array of participant's screens. Usually participant has only one screen with webcam video. Potentially there
         * could be several screens (e.g. webcam + screen sharing) in the future
         *
         * @property screens
         * @uses Screen
         * @type {Array}
         */
        this.screens = [];
        /**
         *  Instance of RTCPeerConnection interface that represents a WebRTC connection between the local participant
         *  and a remote peer
         *
         * @property RTCPeerConnection
         * @type {RTCPeerConnection}
         */
        this.RTCPeerConnection = null;
        /**
         *  Queue of ice remote candidates that is used when ice candidate is received but connection is still not
         *  established completely (signalling state is not stable). Gathered remote candidates are added to RTCPeerConnection on
         *  onsignallingstatechange event (currently iceCandidatesQueue is not used)
         *
         * @property iceCandidatesQueue
         * @type {Array}
         */
        this.iceCandidatesQueue = [];
        /**
         *  Array of local ice candidates. Is used for testing purpose TODO: remove
         *
         * @property candidates
         * @type {Array}
         */
        this.candidates = [];
        /**
         * Stores participant's offer(s) that will be send to remote participant when current negotiation process
         * will be completed. Is used to prevent glaring when two peers send offers at the same time. Feature
         * is not finished.
         *
         * @property offersQueue
         * @type {Array}
         */
        this.offersQueue = [];
        /**
         * Stores current negotiation state. Is "true" when offer received or new participant connected and is set
         * to "false" when connection is established (answer received or signallingState = stable)
         *
         * @property isNegotiating
         * @type {Boolean}
         */
        this.isNegotiating = false;
        /**
         * Non false value means that one more renegotiation is needed when current one will be finished
         *
         * @property hasNewOffersInQueue
         * @type {Integer|Boolean}
         */
        this.hasNewOffersInQueue = false;
        /**
         * Non false value means id of the offer that is in progress. When current offer is finished, currentOfferId will
         * be compared to hasNewOffersInQueue and if it differs, new negotiation well be needed.
         *
         * @property currentOfferId
         * @type {Integer|Boolean}
         */
        this.currentOfferId = false;
        /**
         * Writable property that corrsponds to .RTCPeerConnection.signallingState but can have additional values:
         * have-local-pranswer
         *
         * @property signallingState
         * @type {Object}
         */
        this.signalingState = (function(participant){
            let signalingState = {};
            signalingState.state = null;
            signalingState.stage = null;
            signalingState.setStage = function (stage) {
                signalingState.stage = stage;
                app.event.dispatch('signalingStageChange', {participant:participant, signalingState: signalingState});
                log('setStage', signalingState)

            }

            return signalingState;
        }(this));
        //this.audioStream = null;
        //this.videoStream = null;
        /**
         * There are two possible roles. Polite - participant asks another side for offer order or deos rollback/discards
         * own offer if he receives offer from another side at the same time; impolite - ignores an incoming offer when
         * this would collide with its own.
         *
         * @property signalingRole
         * @type {String}
         */
        this.signalingRole = null;
        /**
         * Property is used only for remote participants and shows whether local participant muted audio of another
         * participant
         *
         * @property audioIsMuted
         * @type {Boolean}
         */
        this.audioIsMuted = false;
        /**
         * Property shows whether remote participant's microphone is enabled. Is used in heartbeat feature: if local
         * participant doesn't hear remote peer and remoteMicIsEnabled=false, he sends service message to that peer,
         * who reenabled microphone if it really doesn't work.
         *
         * @property remoteMicIsEnabled
         * @type {Boolean}
         */
        this.remoteMicIsEnabled = false;
        /**
         * Property shows whether remote participant currently streams video chat to Facebook
         *
         * @property fbLiveStreamingActive
         * @type {Boolean}
         */
        this.fbLiveStreamingActive = false;
        /**
         * Represents whether participant is local
         *
         * @property isLocal
         * @type {Boolean}
         */
        this.isLocal = false;
        /**
         * Time when participant joined the room
         *
         * @property connectedTime
         * @type {Boolean}
         */
        this.connectedTime = null;
        /**
         * Keeps latest received heartbeet from remote user. If it's more than 3+1s, participant's state will be set
         * to offline by hearbeat feature.
         *
         * @property latestOnlineTime
         * @type {Boolean}
         */
        this.latestOnlineTime = null;
        /**
         * Keeps latest received heartbeet from remote user. If it's more than 3+1s, participant's state will be set
         * to offline by hearbeat feature.
         *
         * @property latestOnlineTime
         * @type {Boolean}
         */
        this.reconnectionsCounter = null;
        /**
         * Represents current participant's online state
         *
         * @property online
         * @type {Boolean}
         */
        this.online = true;
        /**
         * Stores information about participant's device/computer. Is used, for example, to detect if device of remote
         * participant supports unified plan;
         *
         * @property localInfo
         * @type {Object}
         */
        this.localInfo = {};
        /**
         * Stores information about whether user has turned on/off mic or camera. Usually is used to by limits.
         *
         * @property localInfo
         * @type {Object}
         */
        this.localMediaControlsState = {
            camera: false,
            mic: false
        };
    }

    var Track = function () {
        this.sid = null;
        this.kind = null;
        this.type = null;
        this.parentScreen = null;
        this.trackEl = null;
        this.mediaStreamTrack = null;
        this.screensharing = null;
        this.remove = function () {

            if(this.parentScreen != null) {
                var index = this.parentScreen.tracks.map(function(e) { return e.mediaStreamTrack.id; }).indexOf(this.mediaStreamTrack.id);
                this.parentScreen.tracks[index] = null;
                this.parentScreen.tracks = this.parentScreen.tracks.filter(function (obj) {
                    return obj != null;
                })
                //if(this.kind == 'video') this.parentScreen.videoTrack = null;
            }

            var index = this.participant.tracks.map(function(e) { return e.mediaStreamTrack.id; }).indexOf(this.mediaStreamTrack.id);
            this.participant.tracks[index] = null;
            this.participant.tracks = this.participant.tracks.filter(function (obj) {
                return obj != null;
            })

            //if(this.trackEl.parentNode != null) this.trackEl.parentNode.removeChild(this.trackEl);
        };
    }

    /*This function was a part of standalone app; currently is not used */
    app.views = (function () {

        function isMobile(mobile) {
            if(mobile == false) {
                if(!document.documentElement.classList.contains('Streams_webrtc_desktop-screen')) document.documentElement.classList.add('Streams_webrtc_desktop-screen');
                return;
            }
            if(!document.documentElement.classList.contains('Streams_webrtc_mobile-screen')) document.documentElement.classList.add('Streams_webrtc_mobile-screen');
        }

        function updateOrientation() {
            if(window.innerWidth > window.innerHeight) {
                setLandscapeOrientation();
            } else setPortraitOrientation();

        }

        function setPortraitOrientation() {
            if(document.documentElement.classList.contains('Streams_webrtc_landscape-screen')) document.documentElement.classList.remove('Streams_webrtc_landscape-screen');
            if(!document.documentElement.classList.contains('Streams_webrtc_portrait-screen')) document.documentElement.classList.add('Streams_webrtc_portrait-screen');
        }

        function setLandscapeOrientation() {
            if(document.documentElement.classList.contains('Streams_webrtc_portrait-screen')) document.documentElement.classList.remove('Streams_webrtc_portrait-screen');
            if(!document.documentElement.classList.contains('Streams_webrtc_landscape-screen')) document.documentElement.classList.add('Streams_webrtc_landscape-screen');
        }

        return {
            updateOrientation: updateOrientation,
            isMobile: isMobile,
        }
    }())

    app.mediaManager = (function () {

        /**
         * Renders SVG audio visualization (history bars or circular)
         */
        var audioVisualization = (function () {
            log('audiovis: audioVisualization');
            var commonVisualization = null;

            /**
             * 1) Creates audio analyser from users audio track for further audio data gathering. 2) Starts rendering
             * visualizations based on this audio data
             * @method createAudioAnalyser
             * @param {Object} [track] instance of Track (not MediaStreamTrack) that has mediaStreamTrack as its property
             * @param {Object} [participant] instance of Participant
             */
            function createAudioAnalyser(track, participant) {
                if(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins) return;

                log('audiovis: createAudioAnalyser', track)

                if(participant.soundMeter.source != null) {
                    log('audiovis: createAudioAnalyser: source exists')

                    participant.soundMeter.context.resume();

                    participant.soundMeter.audioTrack = track.mediaStreamTrack;
                    participant.soundMeter.source = participant.soundMeter.context.createMediaStreamSource(track.stream);
                    participant.soundMeter.analyser = participant.soundMeter.context.createAnalyser();
                    participant.soundMeter.analyser.fftSize = 1024;

                    participant.soundMeter.source.connect(participant.soundMeter.analyser);
                    return;
                }

                participant.soundMeter.audioTrack = track.mediaStreamTrack;
                participant.soundMeter.context = new window.AudioContext();


                participant.soundMeter.analyser = participant.soundMeter.context.createAnalyser();
                participant.soundMeter.analyser.fftSize = 1024;

                participant.soundMeter.source = participant.soundMeter.context.createMediaStreamSource(track.stream);
                participant.soundMeter.source.connect(participant.soundMeter.analyser);

                function startRender(participant) {
                    log('audiovis: createAudioAnalyser: startRender');

                    function getAverage(freqData) {
                        var average = 0;
                        for(let i = 0; i < freqData.length; i++) {
                            average += freqData[i]
                        }
                        average = average / freqData.length;
                        return average;
                    }

                    function render(participant) {
                        participant.soundMeter.visualizationAnimation = requestAnimationFrame(function () {
                            render(participant)
                        });

                        var freqData = new Uint8Array(participant.soundMeter.analyser.frequencyBinCount);
                        participant.soundMeter.analyser.getByteFrequencyData(freqData);
                        var average = participant.soundMeter.average = getAverage(freqData);


                        for (var key in participant.soundMeter.visualizations) {
                            if (participant.soundMeter.visualizations.hasOwnProperty(key)) {
                                var visualization = participant.soundMeter.visualizations[key];

                                if(visualization.type == 'circles') {
                                    var circlesLength = visualization.circlesLength;
                                    var i;
                                    for(i = 0; i < circlesLength; i++){
                                        var circle = visualization.soundCircles[i];
                                        if(i == circlesLength - 1) {
                                            circle.volume = average;
                                            //circle.cy = visualization.radius - (visualization.radius / 100 * radius);
                                            var radius = (average / 255) * 100;
                                            circle.radius = 50 + radius;
                                            circle.opacity = 1 -  (0.025 * radius);
                                            circle.fill = '#'+Math.round(0xffffff * Math.random()).toString(16);

                                            if(participant.soundMeter.source.mediaStream != null && participant.soundMeter.source.mediaStream.active == false || participant.soundMeter.audioTrack.readyState == 'ended') {
                                                circle.volume = 0;
                                                circle.radius = 0;
                                            }

                                            circle.circle.setAttributeNS(null, 'r', circle.radius + '%');
                                            circle.circle.setAttributeNS(null, 'opacity', circle.opacity);
                                            //circle.rect.setAttributeNS(null, 'cy', circle.y);
                                            //bar.rect.setAttributeNS(null, 'fill', bar.fill);

                                        } else {
                                            var nextCircle = visualization.soundCircles[i + 1];
                                            circle.volume = nextCircle.volume;
                                            circle.radius = nextCircle.radius;
                                            circle.fill = '#'+Math.round(0xffffff * Math.random()).toString(16);
                                            circle.cx = nextCircle.cx;
                                            circle.cy = nextCircle.cy;
                                            circle.circle.setAttributeNS(null, 'r', circle.radius + '%');
                                            circle.circle.setAttributeNS(null, 'opacity', 1 - (0.025 * (circle.radius - 50)));

                                            //bar.rect.setAttributeNS(null, 'fill', bar.fill);
                                        }
                                    }

                                    continue;
                                }

                                var barsLength = visualization.barsLength;
                                var i;
                                for(i = 0; i < barsLength; i++){
                                    var bar = visualization.soundBars[i];
                                    if(i == barsLength - 1) {
                                        bar.volume = average;
                                        var height = !participant.soundMeter.isDisabled && (average > 0) ? ((average / 255) * 100) : 0;
                                        if(height > 100)
                                            height = 100;
                                        else if(average < 0.005) height = 0.1;
                                        bar.y = visualization.height - (visualization.height / 100 * height);
                                        bar.height = height;
                                        bar.fill = '#'+Math.round(0xffffff * Math.random()).toString(16);

                                        if(participant.soundMeter.source.mediaStream != null && participant.soundMeter.source.mediaStream.active == false || participant.soundMeter.audioTrack.readyState == 'ended') {
                                            bar.volume = 0;
                                            bar.height = 0;
                                        }

                                        bar.rect.setAttributeNS(null, 'height', bar.height + '%');
                                        bar.rect.setAttributeNS(null, 'y', bar.y);
                                        //bar.rect.setAttributeNS(null, 'fill', bar.fill);

                                    } else {
                                        var nextBar = visualization.soundBars[i + 1];
                                        bar.height = nextBar.height;
                                        bar.fill = '#'+Math.round(0xffffff * Math.random()).toString(16);
                                        bar.y = nextBar.y;
                                        bar.rect.setAttributeNS(null, 'height', bar.height + '%');
                                        bar.rect.setAttributeNS(null, 'y', bar.y);
                                        //bar.rect.setAttributeNS(null, 'fill', bar.fill);
                                    }
                                }
                            }
                        }

                        if(participant.soundMeter.source.mediaStream != null && participant.soundMeter.source.mediaStream.active == false || participant.soundMeter.audioTrack.readyState == 'ended') {
                            var maxVolume;
                            for (var key in participant.soundMeter.visualizations) {
                                if (participant.soundMeter.visualizations.hasOwnProperty(key)) {
                                    var visualization = participant.soundMeter.visualizations[key];
                                    if(visualization.type == 'border-color') continue;
                                    if(visualization.soundBars != null) {
                                        maxVolume = Math.max.apply(Math, visualization.soundBars.map(function (o) {
                                            return o.volume;
                                        }));
                                    } else if(visualization.soundCircles != null) {
                                        maxVolume = Math.max.apply(Math, visualization.soundCircles.map(function (o) {
                                            return o.volume;
                                        }));
                                    }
                                }
                                break;
                            }

                            if(maxVolume <= 0) {
                                for (var key in participant.soundMeter.visualizations) {
                                    if (participant.soundMeter.visualizations.hasOwnProperty(key)) {
                                        var visualization = participant.soundMeter.visualizations[key];

                                        if(visualization.type == 'border-color') continue;
                                        if(visualization.soundBars != null) {
                                            visualization.soundBars.forEach(function (o) {
                                                o.rect.setAttributeNS(null, 'height', '0%');
                                            });
                                        } else if(visualization.soundCircles != null) {
                                            visualization.soundCircles.forEach(function (o) {
                                                o.circle.setAttributeNS(null, 'r', '0%');
                                            });
                                        }
                                    }
                                }
                                participant.soundMeter.context.suspend();
                                participant.soundMeter.source.disconnect();
                            }
                        }
                    }

                    render(participant);
                }

                startRender(participant);

            }

            /**
             * If this is history bars visualization, this method updates its width dynamically by adding/removing new bars when
             * parent container's size is changed.
             * @method updatVisualizationWidth
             * @param {Object} [participant] instance of Participant
             * @param {Object} [visualization] object that contains info about visualization (e.g. SVG elements)
             */
            function updatVisualizationWidth(participant, visualization) {
                log('audiovis: audioVisualization: updatVisualizationWidth');
                if((visualization == null || visualization.svg == null) || visualization.type == 'circles' || (visualization.updateSizeOnlyOnce && visualization.updated)) return;

                var element = visualization.element;

                var screenWidth, elHeight;
                if(element != null){
                    var rect = element.getBoundingClientRect();

                    screenWidth = rect.width;
                    elHeight = rect.height;
                }
                var svgWidth = screenWidth != null && screenWidth != 0 ? screenWidth : 250;
                var svgHeight = elHeight != null && elHeight != 0 ? elHeight / 100 * 80 : 40;

                visualization.width = svgWidth;
                visualization.height = svgHeight;
                visualization.updated = true;
                visualization.svg.setAttribute('width', svgWidth);
                visualization.svg.setAttribute('height', svgHeight);

                var bucketSVGWidth = 4;
                var bucketSVGHeight = 0;
                var spaceBetweenRects = 1;
                var totalBarsNum =  Math.floor(svgWidth / (bucketSVGWidth + spaceBetweenRects));
                var currentBarsNum = visualization.soundBars.length;
                if(totalBarsNum > currentBarsNum) {
                    var barsToCreate = totalBarsNum - currentBarsNum;
                    var xmlns = 'http://www.w3.org/2000/svg';
                    var i;
                    for (i = 0; i < currentBarsNum; i++) {
                        var bar = visualization.soundBars[i];

                        //bar.height = 0;
                        bar.x = (bucketSVGWidth * i + (spaceBetweenRects * (i + 1)));
                        bar.y = svgHeight - (svgHeight / 100 * bar.height);
                        bar.rect.setAttributeNS(null, 'x', bar.x);
                        bar.rect.setAttributeNS(null, 'y', bar.y);
                        //bar.rect.setAttributeNS(null, 'height', bar.height);
                    }

                    var rectsToAdd = [];
                    var i;
                    for (i = 0; i < barsToCreate; i++) {
                        var rect = document.createElementNS(xmlns, 'rect');
                        var x = (bucketSVGWidth * (i + currentBarsNum) + (spaceBetweenRects * ((i + currentBarsNum) + 1)))
                        var y = 0;
                        var fillColor = '#95ffff';
                        rect.setAttributeNS(null, 'x', x);
                        rect.setAttributeNS(null, 'y', 0);
                        rect.setAttributeNS(null, 'width', bucketSVGWidth + 'px');
                        rect.setAttributeNS(null, 'height', bucketSVGHeight + 'px');
                        rect.setAttributeNS(null, 'fill', fillColor);
                        rect.style.strokeWidth = '1';
                        rect.style.stroke = '#1479b5';

                        var barObject = {
                            volume: 0,
                            rect: rect,
                            x: x,
                            y: y,
                            width: bucketSVGWidth,
                            height: 0,
                            fill: fillColor
                        }

                        rectsToAdd.push(barObject);
                    }
                    visualization.soundBars = visualization.soundBars.concat(rectsToAdd)
                    var i;
                    for (i = 0; i < barsToCreate; i++) {
                        visualization.svg.insertBefore(rectsToAdd[i].rect, visualization.svg.firstChild);
                    }
                    visualization.barsLength = visualization.soundBars.length;

                } else if(totalBarsNum < currentBarsNum) {
                    var barsToRemove = currentBarsNum - totalBarsNum;
                    visualization.barsLength = totalBarsNum;
                    var i;
                    for(i = totalBarsNum; i < currentBarsNum; i++) {
                        var bar = visualization.soundBars[i];
                        bar.rect.parentNode.removeChild(bar.rect);
                    }
                    visualization.soundBars.splice(totalBarsNum, barsToRemove);
                }
            }

            /**
             * Builds SVG element for history bars visualization
             * @method buildBarsVisualization
             * @param {Object} [visualization] object that contains info about visualization
             */
            function buildBarsVisualization(visualisation) {
                if(visualisation.svg && visualisation.svg.parentNode) {
                    visualisation.svg.parentNode.removeChild(visualisation.svg);
                }
                visualisation.soundBars = [];
                visualisation.element.innerHTML = '';

                var elWidth, elHeight;
                if(visualisation.element != null){
                    var rect = visualisation.element.getBoundingClientRect();
                    elWidth = rect.width;
                    elHeight = rect.height;
                }
                var svgWidth = 0;
                var svgHeight = 0;
                visualisation.width = svgWidth;
                visualisation.height = svgHeight;
                var xmlns = 'http://www.w3.org/2000/svg';
                var svg = document.createElementNS(xmlns, 'svg');
                svg.setAttribute('width', svgWidth);
                svg.setAttribute('height', svgHeight);
                visualisation.svg = svg;
                var clippath = document.createElementNS(xmlns, 'clipPath');
                clippath.setAttributeNS(null, 'id', 'waveform-mask');

                visualisation.element.appendChild(visualisation.svg);

                var bucketSVGWidth = 4;
                var bucketSVGHeight = 0;
                var spaceBetweenRects = 1;
                var totalBarsNum =  Math.floor(svgWidth / (bucketSVGWidth + spaceBetweenRects));
                var i;
                for(i = 0; i < totalBarsNum; i++) {
                    var rect = document.createElementNS(xmlns, 'rect');
                    var x = (bucketSVGWidth * i + (spaceBetweenRects * (i + 1)))
                    var y = 0;
                    var fillColor = '#95ffff';
                    rect.setAttributeNS(null, 'x', x);
                    rect.setAttributeNS(null, 'y', 0);
                    rect.setAttributeNS(null, 'width', bucketSVGWidth + 'px');
                    rect.setAttributeNS(null, 'height', bucketSVGHeight + 'px');
                    rect.setAttributeNS(null, 'fill', fillColor);
                    rect.style.strokeWidth = '1';
                    rect.style.stroke = '#1479b5';

                    var barObject = {
                        volume: 0,
                        rect: rect,
                        x: x,
                        y: y,
                        width: bucketSVGWidth,
                        height: bucketSVGHeight,
                        fill: fillColor
                    }

                    visualisation.soundBars.push(barObject);
                    svg.appendChild(rect);
                }
                visualisation.barsLength = visualisation.soundBars.length;
            }

            /**
             * Builds SVG element for circular visualization
             * @method buildCircularVisualization
             * @param {Object} [visualization] object that contains info about visualization
             */
            function buildCircularVisualization(visualisation) {
                if(visualisation.svg && visualisation.svg.parentNode) {
                    visualisation.svg.parentNode.removeChild(visualisation.svg);
                }
                visualisation.soundCircles = [];
                //visualisation.element.innerHTML = '';

                /*ar elWidth, elHeight;
                if(visualisation.element != null){
                    var rect = visualisation.element.getBoundingClientRect();
                    elWidth = rect.width;
                    elHeight = rect.height;
                }
                var svgWidth = 0;
                var svgHeight = 0;*/
                visualisation.width = '150%';
                visualisation.height = '150%';
                var xmlns = 'http://www.w3.org/2000/svg';
                var svg = document.createElementNS(xmlns, 'svg');
                svg.setAttribute('width', '100%');
                svg.setAttribute('height', '100%');
                visualisation.svg = svg;
                var clippath = document.createElementNS(xmlns, 'clipPath');
                clippath.setAttributeNS(null, 'id', 'waveform-mask');

                visualisation.element.appendChild(visualisation.svg);

                var totalCirclesNum =  10;
                var i;
                for(i = 0; i < totalCirclesNum; i++) {
                    var circle = document.createElementNS(xmlns, 'circle');

                    var cx = '50%'
                    var cy = '50%';
                    var fillColor = '#40fe00';
                    circle.setAttributeNS(null, 'fill', 'none');
                    circle.setAttributeNS(null, 'stroke', '#2bb7ca');
                    circle.setAttributeNS(null, 'stroke-width', '1');
                    //circle.setAttributeNS(null, 'stroke-miterlimit', '10');
                    circle.setAttributeNS(null, 'cx', cx);
                    circle.setAttributeNS(null, 'cy', cy);
                    circle.setAttributeNS(null, 'r', '50%');

                    var circleObject = {
                        volume: 0,
                        circle: circle,
                        cx: cx,
                        cy: cy,
                        radius: 50,
                        fill: fillColor
                    }

                    visualisation.soundCircles.push(circleObject);
                    svg.appendChild(circle);
                }
                visualisation.circlesLength = visualisation.soundCircles.length;
            }

            /**
             * Builds visualization of specific type (history bars or circular) and with specific key (name)
             * @method buildVisualization
             * @param {Object} [options] object that contains info about visualization
             * @param {String} [options.name] Visualization's name (key)
             * @param {HTMLElement} [options.element] DOM element where visualization will be rendered
             * @param {Object} [options.participant] instance of Participant object
             * @param {String} [options.type] type of visualization (history bars or circular)
             * @param {String} [options.updateSizeOnlyOnce] by default visualization's width is updated on layout changes
             *  this option ignores layout changes so current visualization's width will be always static.
             */
            function buildVisualization(options) {
                log('audiovis: audioVisualization: buildVisualization', options);

                var name = options.name;
                var element = options.element;
                var participant = options.participant;

                participant.soundMeter.visualizations[name] = {};
                var visualisation = participant.soundMeter.visualizations[name];
                visualisation.element = element;
                visualisation.type = options.type;
                visualisation.updateSizeOnlyOnce = options.updateSizeOnlyOnce != null ? options.updateSizeOnlyOnce : false;

                visualisation.reset = function () {
                    setTimeout(function () {
                        updatVisualizationWidth(participant, visualisation)
                    }, 1000);
                };
                visualisation.remove = function () {
                    delete options.participant.soundMeter.visualizations[name];
                    if(visualisation.svg && visualisation.svg.parentNode != null) visualisation.svg.parentNode.removeChild(visualisation.svg);
                };

                if(visualisation.type == 'circles') {
                    buildCircularVisualization(visualisation);
                    return;
                }

                buildBarsVisualization(visualisation);

            }

            /**
             * Builds common SVG visualization based on audio data of all participants
             * @method buildCommonVisualization
             * @param {Object} [options] object that contains info about visualization
             * @param {HTMLElement} [options.element] DOM element where visualization will be rendered
             * @param {String} [options.type] type of visualization (history bars or circular)
             */
            function buildCommonVisualization(options) {
                log('audiovis: buildCommonVisualization: buildVisualization try', commonVisualization);

                if(commonVisualization != null) return;
                log('audiovis: buildCommonVisualization: buildVisualization', commonVisualization, options);

                var element = options.element;

                commonVisualization = {};
                commonVisualization.element = element;
                commonVisualization.type = options.type;

                if(commonVisualization.svg && commonVisualization.svg.parentNode) {
                    commonVisualization.svg.parentNode.removeChild(commonVisualization.svg);
                }
                commonVisualization.soundBars = [];

                var elWidth, elHeight;
                if(commonVisualization.element != null){
                    var rect = commonVisualization.element.getBoundingClientRect();
                    elWidth = rect.width;
                    elHeight = rect.height;
                }
                var svgWidth = elWidth;
                var svgHeight = elHeight;
                commonVisualization.width = svgWidth;
                commonVisualization.height = svgHeight;
                var xmlns = 'http://www.w3.org/2000/svg';
                var svg = document.createElementNS(xmlns, 'svg');
                svg.style.position = 'absolute';
                svg.style.top = '0';
                svg.setAttribute('width', svgWidth);
                svg.setAttribute('height', svgHeight);
                commonVisualization.svg = svg;
                commonVisualization.element.appendChild(commonVisualization.svg);
                var clippath = document.createElementNS(xmlns, 'clipPath');
                clippath.setAttributeNS(null, 'id', 'waveform-mask');

                var bucketSVGWidth = 4;
                var bucketSVGHeight = 0;
                var spaceBetweenRects = 1;
                var totalBarsNum =  Math.floor(svgWidth / (bucketSVGWidth + spaceBetweenRects));

                var i;
                for(i = 0; i < totalBarsNum; i++) {
                    var rect = document.createElementNS(xmlns, 'rect');
                    var x = (bucketSVGWidth * i + (spaceBetweenRects * (i + 1)))
                    var y = 0;
                    var fillColor = '#95ffff';
                    rect.setAttributeNS(null, 'x', x);
                    rect.setAttributeNS(null, 'y', 0);
                    rect.setAttributeNS(null, 'width', bucketSVGWidth + 'px');
                    rect.setAttributeNS(null, 'height', bucketSVGHeight + 'px');
                    rect.setAttributeNS(null, 'fill', fillColor);
                    rect.style.strokeWidth = '1';
                    rect.style.stroke = '#1479b5';

                    var barObject = {
                        volume: 0,
                        rect: rect,
                        x: x,
                        y: y,
                        width: bucketSVGWidth,
                        height: bucketSVGHeight,
                        fill: fillColor
                    }

                    commonVisualization.soundBars.push(barObject);
                    svg.appendChild(rect);
                }
                commonVisualization.barsLength = commonVisualization.soundBars.length;
                commonVisualization.audioContextArr = [];

                renderCommonVisualization();
            }

            /**
             * Renders common visualization based on avarage audio data of all participants
             * @method renderCommonVisualization
             */
            function renderCommonVisualization() {
                if(!localParticipant.online) return;
                var sum = 0;
                function getAverage(freqData) {
                    var average = 0;
                    for(let i = 0; i < freqData.length; i++) {
                        average += freqData[i]
                    }
                    average = average / freqData.length;
                    return average;
                }

                for(let p in roomParticipants) {
                    let participant = roomParticipants[p];
                    if(participant.online == false || participant.soundMeter == null || participant.soundMeter.analyser == null) continue;
                    let bufferLength =  participant.soundMeter.analyser.frequencyBinCount;
                    let freqData = new Uint8Array(bufferLength);

                    participant.soundMeter.analyser.getByteFrequencyData(freqData); // populate with data
                    sum += (getAverage(freqData) / 255 * 100);

                }

                //var average = sum / roomParticipants.length;


                var barsLength = commonVisualization.barsLength;
                var i;
                for(i = 0; i < barsLength; i++){
                    var bar = commonVisualization.soundBars[i];
                    if(i == barsLength - 1) {
                        let average = (sum / roomParticipants.length);
                        var height = average;
                        if (height > 100) {
                            height = 100;
                        } else if(average < 0.005) height = 0.1;
                        bar.height = height ;
                        bar.y = commonVisualization.height - (commonVisualization.height / 100 * bar.height);
                        bar.fill = '#'+Math.round(0xffffff * Math.random()).toString(16);

                        bar.rect.setAttributeNS(null, 'height', bar.height + '%');
                        bar.rect.setAttributeNS(null, 'y', bar.y);
                        //bar.rect.setAttributeNS(null, 'fill', bar.fill);

                    } else {
                        var nextBar = commonVisualization.soundBars[i + 1];
                        bar.volume = nextBar.volume;
                        bar.height = nextBar.height;
                        bar.fill = '#'+Math.round(0xffffff * Math.random()).toString(16);
                        bar.y = nextBar.y;
                        bar.rect.setAttributeNS(null, 'height', bar.height + '%');
                        bar.rect.setAttributeNS(null, 'y', bar.y);
                        //bar.rect.setAttributeNS(null, 'fill', bar.fill);
                    }
                }

                commonVisualization.animationFrame = requestAnimationFrame(renderCommonVisualization);
            }

            /**
             * Stops animating common visualization and removes it from DOM
             * @method removeCommonVisualization
             */
            function removeCommonVisualization() {
                if(commonVisualization && commonVisualization.animationFrame) {
                    cancelAnimationFrame(commonVisualization.animationFrame);
                }
                if(commonVisualization && commonVisualization.svg && commonVisualization.svg.parentNode != null) {
                    commonVisualization.svg.parentNode.removeChild(commonVisualization.svg);
                }
                commonVisualization = null;
            }

            /**
             * Updates common visualization's width when its parent container size changed
             * @method updateCommonVisualizationWidth
             */
            function updateCommonVisualizationWidth() {
                updatVisualizationWidth(null, commonVisualization);
            }

            /**
             * Stops animating all visualizations
             * @method stopAllVisualizations
             */
            function stopAllVisualizations(isRoomSwitch) {
                removeCommonVisualization();
                for(var p = roomParticipants.length - 1; p >= 0; p--){
                    if(roomParticipants[p] == localParticipant) {
                        if(!isRoomSwitch && roomParticipants[p].soundMeter.source != null) roomParticipants[p].soundMeter.source.disconnect();

                        if(!isRoomSwitch && roomParticipants[p].soundMeter.visualizationAnimation) {
                            cancelAnimationFrame(roomParticipants[p].soundMeter.visualizationAnimation);
                        }
                    } else {
                        if(roomParticipants[p].soundMeter.source != null) roomParticipants[p].soundMeter.source.disconnect();

                        if(roomParticipants[p].soundMeter.visualizationAnimation) {
                            cancelAnimationFrame(roomParticipants[p].soundMeter.visualizationAnimation);
                        }
                    }

                }
            }

            return {
                createAudioAnalyser: createAudioAnalyser,
                build: buildVisualization,
                buildCommonVisualization: buildCommonVisualization,
                removeCommonVisualization: removeCommonVisualization,
                updateCommonVisualizationWidth: updateCommonVisualizationWidth,
                stopAllVisualizations: stopAllVisualizations
            }
        }())

        /**
         * Attaches new tracks to Participant and to his screen. If there is no screen, it creates it. If screen already
         * has video track while adding new, it replaces old video track with new one.
         * @method attachTrack
         * @param {Object} [track] instance of Track (not MediaStreamTrack) that has mediaStreamTrack as its property
         * @param {Object} [participant.url] instance of Participant
         */
        function attachTrack(track, participant) {
            log('attachTrack ' + track.kind);
            try {
                var err = (new Error);
                console.log(err.stack);
            } catch (e) {

            }
            if(options.useCordovaPlugins && typeof cordova != 'undefined' && _isiOS && track.kind == 'video' && track.stream != null && track.stream.hasOwnProperty('_blobId')) {
                log('attachTrack: iosrtc track video');
                iosrtcLocalPeerConnection.addStream(track.stream);
                return;
            } else if(options.useCordovaPlugins && typeof cordova != 'undefined' && _isiOS && track.kind == 'audio' && track.stream != null && track.stream.hasOwnProperty('_blobId')) {
                log('attachTrack: iosrtc track audio');

                iosrtcLocalPeerConnection.addStream(track.stream);


                return;
            }

            log('attachTrack: track.screensharing', track.screensharing);
            app.event.dispatch('beforeTrackAdded', {participant:participant, track: track});

            if(track.kind == 'video') {
                log('attachTrack: video');
                var trackEl = createTrackElement(track, participant);
                track.trackEl = trackEl;
                track.trackEl.play().then((e) => {
                    console.log('attachTrack: video play func success')
                }).catch((e) => {
                    console.error(e)
                    console.log('attachTrack: video play func error')
                });
                app.event.dispatch('videoTrackIsBeingAdded', {track: track, participant: participant});
            } else if(track.kind == 'audio') {

                var trackEl = createTrackElement(track, participant);
                track.trackEl = trackEl;
                participant.audioEl = trackEl;

                if(!participant.isLocal) {
                    document.body.appendChild(trackEl);
                    if(participant.audioIsMuted) {
                        //track.trackEl.muted = true;
                    }
                }

                audioVisualization.createAudioAnalyser(track, participant)

            }

            track.participant = participant;

            var trackExist = participant.tracks.filter(function (t) {
                return t == track;
            })[0];
            if(trackExist == null) participant.tracks.push(track);

            if(options.useCordovaPlugins && typeof cordova != 'undefined' && _isiOS && participant.isLocal) {
                log('attachTrack: iosrtc publish track ');

                if(track.kind =='video'){
                    if(localParticipant.videoTracks().length > 1) {
                        log('attachTrack: iosrtc publish track: replace track');

                        app.localMediaControls.replaceTrack(track.mediaStreamTrack);
                    } else {
                        log('attachTrack: iosrtc publish track: add track');
                        app.localMediaControls.enableVideo();
                    }
                } else {

                    if(localParticipant.audioTracks().length > 1) {
                        log('attachTrack: iosrtc publish track: replace track');

                        app.localMediaControls.replaceTrack(track.mediaStreamTrack);
                    } else {
                        log('attachTrack: iosrtc publish track: add track');
                        app.localMediaControls.enableAudio();
                    }
                }
            }

            app.event.dispatch('trackAdded', {participant:participant, track: track});

        }

        function supportsVideoType(video, type) {

            var formats = {
                ogg: 'video/ogg; codecs="theora"',
                h264: 'video/mp4; codecs="avc1.42E01E"',
                h264_2: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
                webm: 'video/webm; codecs="vp8, vorbis"',
                vp9: 'video/webm; codecs="vp9"',
                hls: 'application/x-mpegURL; codecs="avc1.42E01E"'
            };

            if(!video) {
                video = document.createElement('video');
            }

            if(type) return video.canPlayType(formats[type] || type);

            var supportabbleFormats = {};
            for (let key in formats) {
                if (formats.hasOwnProperty(key)) {
                    supportabbleFormats[key] = video.canPlayType(formats[key]);
                }
            }
            return supportabbleFormats;
        }

        /**
         * Creates HTMLMediaElement for audio/video track. Sets handlers on mute, unmute, ended events of video track -
         * this is needed for showing/hiding participant's screen when his video is can be played or muted.
         * loadedmetadata helps us to know video size to fit screen size to it when rendering layout
         * @method createTrackElement
         * @param {Object} [track] instance of Track (not MediaStreamTrack) that has mediaStreamTrack as its property
         * @param {Object} [participant.url] instance of Participant
         * @returns {HTMLMediaElement}
         */
        function createTrackElement(track, participant) {
            log('createTrackElement: ' + track.kind);
            log('createTrackElement: local' + participant.isLocal);
            var remoteStreamEl, stream;
            if(track.stream != null) {
                try {
                    log('createTrackElement: stream exists');

                    if(track.kind == 'audio' && participant.audioEl != null) {
                        log('createTrackElement: stream exists: el exists');

                        remoteStreamEl = participant.audioEl;
                    } else {
                        log('createTrackElement: stream exists: create el');

                        remoteStreamEl = document.createElement(track.kind);
                    }

                    remoteStreamEl.srcObject = stream = track.stream;
                } catch(e) {
                    console.error(e.name + ': ' + e.message)
                }

            } else {
                log('createTrackElement: stream does not exist');

                if(track.kind == 'audio' && participant.audioEl != null) {
                    remoteStreamEl = participant.audioEl;
                } else {
                    remoteStreamEl = document.createElement(track.kind);
                }

                try{
                    if(options.useCordovaPlugins && typeof cordova != "undefined" && _isiOS && participant.isLocal && (participant.audioStream != null || participant.videoStream != null)) {

                        stream = track.kind == 'audio' ? participant.audioStream : participant.videoStream
                    } else {
                        stream = new MediaStream();
                    }
                } catch(e){
                    console.error(e.name + ': ' + e.message)
                }


                stream.addTrack(track.mediaStreamTrack);

                try{
                    remoteStreamEl.srcObject = stream;
                } catch(e){
                    console.error(e.name + ': ' + e.message)
                }
                track.stream = stream;
            }

            if(!participant.isLocal && track.kind == 'video') {
                remoteStreamEl.muted = true;
                remoteStreamEl.autoplay = true;
                remoteStreamEl.playsInline = true;
                remoteStreamEl.setAttribute('webkit-playsinline', true);

                remoteStreamEl.setAttributeNode(document.createAttribute('webkit-playsinline'));
                remoteStreamEl.setAttributeNode(document.createAttribute('autoplay'));
                remoteStreamEl.setAttributeNode(document.createAttribute('playsInline'));
                remoteStreamEl.setAttributeNode(document.createAttribute('muted'));
                //remoteStreamEl.load();
            }

            if(!participant.isLocal && track.kind == 'audio') {
                remoteStreamEl.autoplay = true;
                remoteStreamEl.load();
                remoteStreamEl.playsInline = true;
                remoteStreamEl.setAttribute('webkit-playsinline', true);

                var speaker = app.localMediaControls.currentAudioOutputDevice();
                if(speaker != null && typeof remoteStreamEl.sinkId !== 'undefined') {
                    remoteStreamEl.setSinkId(speaker.deviceId)
                        .then(() => {
                            console.log(`createTrackElement: Success, audio output device attached: ${speaker.deviceId}`);
                        })
                        .catch(error => {
                            let errorMessage = error;
                            if (error.name === 'SecurityError') {
                                errorMessage = `createTrackElement: You need to use HTTPS for selecting audio output device: ${error}`;
                            }
                            console.error(errorMessage);
                        });
                }
            }

            if(participant.isLocal) {
                remoteStreamEl.setAttribute('webkit-playsinline', true);
                remoteStreamEl.volume = 0;
                remoteStreamEl.muted = true;
                remoteStreamEl.autoplay = true;
                remoteStreamEl.playsInline = true;
                if(track.kind == 'video') localParticipant.videoStream = stream;
                if (track.kind == 'audio') localParticipant.audioStream = stream;
            }

            var supportableFormats = supportsVideoType(remoteStreamEl);
            log('createTrackElement: supportsVideoType', supportableFormats)
            remoteStreamEl.onload = function () {
                log('createTrackElement: onload', remoteStreamEl)
            }
            remoteStreamEl.oncanplay = function (e) {
                log('createTrackElement: oncanplay ' + track.kind, remoteStreamEl);

                //if(!participant.isLocal) remoteStreamEl.play();

                if(track.kind == 'audio') {
                    log('createTrackElement: dispatch audioTrackLoaded');

                    app.event.dispatch('audioTrackLoaded', {
                        screen: track.parentScreen,
                        trackEl: e.target,
                        track:track
                    });
                }

            }
            remoteStreamEl.addEventListener('play', function (e) {
                let time = performance.timeOrigin + performance.now();
                app.event.dispatch('audioTrackPlay', {
                    time: time,
                    participant: participant,
                    trackEl: e.target,
                    track:track
                });
            })
            remoteStreamEl.onloadedmetadata = function () {
                log('createTrackElement: onloadedmetadata', remoteStreamEl)
            }
            if(track.kind == 'video') {
                log('createTrackElement: add video track events');
                log('createTrackElement: video size', remoteStreamEl.videoWidth, remoteStreamEl.videoHeight);

                remoteStreamEl.addEventListener('loadedmetadata', function (e) {
                    if(track.mediaStreamTrack.readyState == 'ended' || (e.target.videoWidth == 0 && e.target.videoHeight == 0)) return;
                    log('createTrackElement: loadedmetadata: return check');

                    app.event.dispatch('videoTrackLoaded', {
                        screen: track.parentScreen,
                        track: track,
                        trackEl: e.target
                    });
                });
            }

            track.mediaStreamTrack.addEventListener('mute', function(e){
                log('mediaStreamTrack muted', track);
                try {
                    var err = (new Error);
                    console.log(err.stack);
                } catch (e) {

                }

                log('mediaStreamTrack muted 2', track.mediaStreamTrack.enabled, track.mediaStreamTrack.readyState, track.mediaStreamTrack.muted);
                if(participant.RTCPeerConnection){
                    var receivers = participant.RTCPeerConnection.getReceivers();
                    log('mediaStreamTrack receivers', receivers);

                }
                app.event.dispatch('trackMuted', {
                    screen: track.parentScreen,
                    trackEl: e.target,
                    track:track,
                    participant:participant
                });
            });

            track.mediaStreamTrack.addEventListener('unmute', function(e){
                log('mediaStreamTrack unmuted 0', track);
                try {
                    var err = (new Error);
                    console.log(err.stack);
                } catch (e) {

                }
                app.event.dispatch('trackUnmuted', {
                    screen: track.parentScreen,
                    trackEl: e.target,
                    track:track,
                    participant:participant
                });
            });

            track.mediaStreamTrack.addEventListener('ended', function(e){
                log('mediaStreamTrack ended', track);
                app.event.dispatch('trackMuted', {
                    screen: track.parentScreen,
                    trackEl: e.target,
                    track:track,
                    participant:participant
                });
            });

            return remoteStreamEl;
        }

        function getLoudestScreen(mode, callback) {

            var participantsToAnalyze = roomParticipants;

            if(mode == 'allButMe') {
                participantsToAnalyze = participantsToAnalyze.filter(function (p) {
                    return !p.isLocal;
                });
            }
            participantsToAnalyze = participantsToAnalyze.filter(function (s) {
                return s.soundMeter != null;
            })

            if(participantsToAnalyze.length == 0) return;

            var loudestParticipant = participantsToAnalyze.reduce(function(prev, current) {
                return (prev.soundMeter.average > current.soundMeter.average) ? prev : current;
            })

            var loudestScreen = loudestParticipant.screens.filter(function (screen) {
                return (screen.isActive == true && screen.participant.online == true);
            })[0];

            if(loudestScreen != null && callback != null && loudestParticipant.soundMeter.average > 0.0004) callback(loudestScreen);

        }

        var canvasComposer = (function (roomInstance) {

            var _roomInstance = roomInstance;
            var _canvas = null;
            var _offscreenVideoCanvas = null;
            var _canvasMediStream = null;
            var _mediaRecorder = null;
            var _videoTrackIsMuted = false;
            var _dataListeners = [];
            var _eventDispatcher = new EventSystem();

            var _scenes = [];
            var _activeScene = null;
            var _defaultScene = null;


            var Scene = function () {
                this.title = null;
                this.sources = []; //usual user's sources
                this.additionalSources = []; //for tititles
                this.overlaySources = []; //for watermarks
                this.backgroundSources = []; //for backgrounds
                this.audioSources = [];
            }

            var defaultScene = new Scene();
            defaultScene.title = 'default';
            _defaultScene = _activeScene = defaultScene;
            _scenes.push(defaultScene);


            function createScene(name) {
                console.log('canvasComposer: createScene');
                var newScene = new Scene();
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
                let sceneExists = false;
                for(let s in _scenes) {
                    if(_scenes[s] == sceneInstance) sceneExists = true;
                }
                if(sceneExists) {
                    _activeScene = sceneInstance;
                    return true;
                }
                return false;
            }

            function getActiveScene() {
                return _activeScene;
            }

            var videoComposer = (function () {
                var _webrtcGroup = null;
                var _webrtcAudioGroup = null;
                var _availableWebRTCSources = [];
                var _size = {width:1280, height: 720};
                var _webrtcLayoutRect = {width:1280, height: 720, x: 0, y: 0, updateTimeout: null};
                var _inputCtx = null;
                var _isActive = null;
                var _currentLayout = null;

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
                        updateWebRTCCanvasLayout();

                    }, 100)

                }

                function getWebrtcLayoutRect(){
                    return _webrtcLayoutRect;
                }

                var Source = function () {
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
                        'get': function(val) {
                            return this._name;
                        }
                    },
                    'color': {
                        'get': function () {
                            if(this._color != null) return this._color;
                            var letters = '0123456789ABCDEF';
                            var color = '#';
                            for (var i = 0; i < 6; i++) {
                                color += letters[Math.floor(Math.random() * 16)];
                            }
                            this._color = color;
                            return color;
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
                    this.groupType = null;
                    this.sourceType = 'group';
                    this.size = {width:_size.width, height:_size.height};
                }
                GroupSource.prototype = new Source();
                var webrtcGroup = new GroupSource()
                webrtcGroup.name = 'Video Chat';
                webrtcGroup.groupType = 'webrtc';
                defaultScene.sources.push(webrtcGroup);
                _webrtcGroup = webrtcGroup;

                var WebRTCStreamSource = function (participant) {
                    this.kind = null;
                    this.participant = participant;
                    this.name = participant.username;
                    this.avatar = participant.avatar ? participant.avatar.image : null;
                    this.track = null;
                    this.mediaStream = null;
                    this.audioSourceNode = null;
                    this.htmlVideoEl = null;
                    this.screenSharing = false;
                    this.sourceType = 'webrtc';
                    this.caption = 'participant';
                    this.eventDispatcher = new EventSystem();
                    this.params = {
                        captionBgColor: '#26A553',
                        captionFontColor: '#FFFFFF'
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

                function addSource(newSource, successCallback, failureCallback) {
                    console.log('addSource', newSource instanceof RectObjectSource)
                    if( newSource instanceof RectObjectSource || newSource instanceof StrokeRectObjectSource || newSource instanceof TextObjectSource) {
                        addAdditionalSource(newSource);
                        return;
                    }

                    function getWebrtcGroupIndex() {
                        for (let j in _activeScene.sources) {
                            if (_activeScene.sources[j].sourceType == 'group' && _activeScene.sources[j].groupType == 'webrtc') {

                                var childItems = 0;
                                for(var i in _activeScene.sources) {
                                    if(_activeScene.sources[i].parentGroup == _activeScene.sources[j]) {
                                        childItems++;
                                    }
                                }

                                return {index:j, childItemsNum: childItems };
                            }
                        }
                        return {index:0, childItemsNum: 0 };
                    }

                    function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
                        var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
                        return { width: srcWidth*ratio, height: srcHeight*ratio };
                    }

                    if(newSource.sourceType == 'webrtc') {
                        console.log('addSource webrtc')
                        let webrtcGroup = getWebrtcGroupIndex();


                        let h = webrtcGroup.index + 1, sourceStream = _activeScene.sources[h];
                        while (sourceStream != null && sourceStream.sourceType == 'webrtc') {
                            h++
                            sourceStream = _activeScene.sources[h];
                        }
                        log('addSource add at the end ' + (h), _activeScene.sources.length)

                        _activeScene.sources.splice((h), 0, newSource)


                        log('updateWebRTCCanvasLayout rendered arr', _activeScene.sources)
                        _eventDispatcher.dispatch('sourceAdded', newSource);
                        return;

                    } else if(newSource.sourceType == 'image') {
                        console.log('addSource image')
                        let webrtcGroup = getWebrtcGroupIndex();

                        var imageSource = new ImageSource();
                        imageSource.imageInstance = newSource.imageInstance;
                        imageSource.name = newSource.title;
                        //_activeScene.sources.unshift(imageSource);
                        _activeScene.sources.splice((webrtcGroup.index + webrtcGroup.childItemsNum + 1), 0, imageSource)

                        log('updateWebRTCCanvasLayout rendered arr', _activeScene.sources)
                        _eventDispatcher.dispatch('sourceAdded', imageSource);

                        return imageSource;
                    } else if(newSource.sourceType == 'imageBackground') {
                        console.log('addSource image')

                        var imageSource = new ImageSource();
                        imageSource.imageInstance = newSource.imageInstance;
                        imageSource.name = newSource.title;
                        _activeScene.backgroundSources.splice(0, 0, imageSource)

                        log('updateWebRTCCanvasLayout rendered arr', _activeScene.sources)
                        _eventDispatcher.dispatch('sourceAdded', imageSource);

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

                        //_eventDispatcher.dispatch('sourceAdded', imageSource);

                        return imageSource;
                    } else if(newSource.sourceType == 'video') {
                        console.log('addSource video')
                        let webrtcGroup = getWebrtcGroupIndex();

                        var video = document.createElement('VIDEO');
                        video.muted = true;
                        video.loop = options.liveStreaming.loopVideo;
                        video.addEventListener('loadedmetadata', event => {
                            console.log(video.videoWidth, video.videoHeight)
                        })
                        video.src = newSource.url;
                        var videoSource = new VideoSource();
                        videoSource.videoInstance = video;
                        videoSource.name = newSource.title;
                        //_activeScene.sources.unshift(videoSource);
                        _activeScene.sources.splice((webrtcGroup.index + webrtcGroup.childItemsNum + 1), 0, videoSource);
                        var playPromise = video.play();
                        if (playPromise !== undefined) {
                            playPromise.then(function() {
                                if(successCallback != null) successCallback();
                            }).catch(function(error) {
                                if(failureCallback != null) failureCallback(error);
                            });
                        }
                        audioComposer.addSource(videoSource);
                        log('updateWebRTCCanvasLayout rendered arr', _activeScene.sources)
                        _eventDispatcher.dispatch('sourceAdded', videoSource);

                        return videoSource;
                    } else if(newSource.sourceType == 'videoBackground') {
                        console.log('addSource video')

                        var video = document.createElement('VIDEO');
                        video.muted = true;
                        video.style.display = 'none';
                        video.loop = options.liveStreaming.loopVideo;
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


                        log('updateWebRTCCanvasLayout rendered arr', _activeScene.sources)
                        _eventDispatcher.dispatch('sourceAdded', videoSource);

                        return videoSource;
                    } else {
                        _activeScene.sources.unshift(newSource);
                        //_eventDispatcher.dispatch('sourceAdded', newSource);

                    }
                }

                function addAdditionalSource(newSource, backward) {
                    if(backward){
                        _activeScene.additionalSources.push(newSource);
                    } else {
                        _activeScene.additionalSources.unshift(newSource);
                    }
                    _eventDispatcher.dispatch('sourceAdded', newSource);
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
                    if(!doNotFireEvent) _eventDispatcher.dispatch('sourceRemoved', source);
                }

                function removeAdditionalSource(source, doNotFireEvent) {
                    for (let j in _activeScene.additionalSources) {
                        if (_activeScene.additionalSources[j] == source) {
                            _activeScene.additionalSources.splice(j, 1)
                            break;
                        }
                    }
                    if(!doNotFireEvent) _eventDispatcher.dispatch('sourceRemoved', source);
                }

                function getSources(type, active) {
                    console.log('getSources', type)

                    if(type == null) return _activeScene.sources;
                    console.log('getSources _activeScene', _activeScene)
                    console.log('getSources _activeScene.sources', _activeScene.sources)
                    if(active == null) {
                        return _activeScene.sources.filter(function (source) {
                            return source.sourceType == type && source.parentGroup != null && source.parentGroup.groupType == 'webrtc';
                        });

                    }
                    return _activeScene.sources.filter(function (source) {
                        return source.sourceType == type && source.parentGroup != null && source.parentGroup.groupType == 'webrtc' && source.active === true;
                    });
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
                    _eventDispatcher.dispatch('sourceMoved');

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
                                _eventDispatcher.dispatch('sourceMoved');

                                break;
                            }
                        }
                        console.log('moveSourceBackward  _activeScene.sources',  _activeScene.sources);

                        return;
                    }
                    for(var i in _activeScene.sources) {
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
                                _eventDispatcher.dispatch('sourceMoved');

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
                        for(var i in _activeScene.sources) {
                            if(_activeScene.sources[i].parentGroup == source) {
                                _activeScene.sources[i].active = true;
                                if(_activeScene.sources[i].sourceType == 'webrtc') {

                                }
                            }
                        }
                    }

                    source.active = true;

                    if(source.sourceType == 'webrtc' || source.groupType == 'webrtc') {
                        updateWebRTCCanvasLayout();
                        audioComposer.updateWebRTCAudioSources();
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
                        for(var i in _activeScene.sources) {
                            if(_activeScene.sources[i].parentGroup == source) {
                                _activeScene.sources[i].active = false;
                            }
                        }
                    }

                    source.active = false;

                    if(source.sourceType == 'webrtc' || source.groupType == 'webrtc') {
                        updateWebRTCCanvasLayout();
                        audioComposer.updateWebRTCAudioSources();
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

                function updateWebRTCCanvasLayout(layoutName) {
                    log('updateWebRTCCanvasLayout start', layoutName, _currentLayout)

                    var tracksToAdd = [];
                    var tracksToRemove = [];

                    var currentWebRTCSources = getSources('webrtc');
                    var participants = _roomInstance.roomParticipants(true);
                    log('updateWebRTCCanvasLayout participants',  participants)
                    log('updateWebRTCCanvasLayout currentWebRTCSources',  currentWebRTCSources)

                    var renderScreenSharingLayout = false;
                    for(var v in participants) {
                        log('updateWebRTCCanvasLayout participant', participants[v].online, participants[v])

                        let renderedTracks = [];
                        for (let j in currentWebRTCSources) {
                            log('updateWebRTCCanvasLayout rendered for', currentWebRTCSources[j], currentWebRTCSources[j].participant == participants[v])
                            log('updateWebRTCCanvasLayout rendered for2', currentWebRTCSources[j].participant.sid, participants[v].sid)

                            if(currentWebRTCSources[j].participant == participants[v]) {
                                log('updateWebRTCCanvasLayout rendered for', currentWebRTCSources[j])

                                renderedTracks.push(currentWebRTCSources[j])
                            }
                        }

                        log('updateWebRTCCanvasLayout renderedTracks', renderedTracks)


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

                        let audioIsEnabled = participants[v].isLocal ? app.localMediaControls.micIsEnabled() : participants[v].audioIsMuted != true;

                        log('updateWebRTCCanvasLayout audioIsEnabled', audioIsEnabled)

                        if(options.liveStreaming.audioOnlyLayout) {

                        }

                        if(vTracks.length != 0) {
                            log('updateWebRTCCanvasLayout vTracks != 0')

                            for (let s in vTracks) {
                                log('updateWebRTCCanvasLayout track', vTracks[s])

                                let trackCurrentlyRendered = false;
                                for (let c in renderedTracks) {
                                    log('updateWebRTCCanvasLayout trackCurrentlyRendered', vTracks[s], renderedTracks[c].track)

                                    if(vTracks[s] == renderedTracks[c].track)  {
                                        trackCurrentlyRendered = renderedTracks[c];
                                        break;
                                    }
                                }

                                if(vTracks[s].screensharing) {
                                    renderScreenSharingLayout = true;

                                    if(!_isActive && vTracks[s].trackEl.videoWidth !== 0 && vTracks[s].trackEl.videoHeight !== 0) {
                                        setCanvasSize(vTracks[s].trackEl.videoWidth, vTracks[s].trackEl.videoHeight)
                                    } else if (!_isActive) {
                                        vTracks[s].trackEl.addEventListener('loadedmetadata', function (e) {
                                            setCanvasSize(e.target.videoWidth, e.target.videoHeight)
                                        });
                                    }
                                }

                                log('updateWebRTCCanvasLayout trackCurrentlyRendered', trackCurrentlyRendered)

                                if(!trackCurrentlyRendered) {
                                    log('updateWebRTCCanvasLayout !trackCurrentlyRendered')
                                    let audioOnly = layoutName == 'audioOnly' || (layoutName == null && _currentLayout == 'audioOnly');
                                    let notScreensharingVideo = !audioOnly && (layoutName == 'audioScreenSharing' || (layoutName == null && _currentLayout == 'audioScreenSharing')) && !vTracks[s].screensharing;
                                    if(audioOnly || notScreensharingVideo) {
                                        log('updateWebRTCCanvasLayout !trackCurrentlyRendered if1')

                                        let canvasStream = new WebRTCStreamSource(participants[v]);
                                        canvasStream.kind = 'audio';
                                        canvasStream.parentGroup = _webrtcGroup;
                                        canvasStream.track = vTracks[s];
                                        tracksToAdd.push(canvasStream);
                                    } else if(vTracks.length > 1) {
                                        log('updateWebRTCCanvasLayout !trackCurrentlyRendered if2 ADD VIDEO RECT')

                                        /*let z;
                                        for(z = renderedTracks.length - 1; z >= 0 ; z--){
                                            if(renderedTracks[z].kind == 'video') {
                                                let currentTracks = renderedTracks.splice(z, 1);
                                                tracksToRemove = tracksToRemove.concat(currentTracks);
                                                tracksToAdd = tracksToAdd.concat(currentTracks);
                                            }
                                        }*/

                                        let canvasStream = new WebRTCStreamSource(participants[v]);
                                        canvasStream.kind = 'video';
                                        canvasStream.track = vTracks[s];
                                        canvasStream.mediaStream = vTracks[s].stream;
                                        canvasStream.htmlVideoEl = vTracks[s].trackEl;
                                        canvasStream.parentGroup = _webrtcGroup;
                                        if (vTracks[s].screensharing == true) {
                                            canvasStream.screenSharing = true;
                                            canvasStream.name = canvasStream.name + ' (screen)';
                                        } else {
                                            canvasStream.screenSharing = false;
                                            canvasStream.name = canvasStream.name.replace(' (screen)', '');
                                        }
                                        tracksToAdd.push(canvasStream)

                                    } else {
                                        log('updateWebRTCCanvasLayout !trackCurrentlyRendered else')

                                        let z, replacedAudioTrack = false;
                                        for(z = renderedTracks.length - 1; z >= 0 ; z--){
                                            log('updateWebRTCCanvasLayout !trackCurrentlyRendered renderedTracks[z]', renderedTracks[z])

                                            if(renderedTracks[z].kind == 'audio') {
                                                log('updateWebRTCCanvasLayout else REPLACE VIDEO TRACK')

                                                renderedTracks[z].kind = 'video';
                                                renderedTracks[z].track = vTracks[s];
                                                renderedTracks[z].mediaStream = vTracks[s].stream;
                                                renderedTracks[z].htmlVideoEl = vTracks[s].trackEl;
                                                if (vTracks[s].screensharing == true) {
                                                    renderedTracks[z].screenSharing = true;
                                                    renderedTracks[z].name = renderedTracks[z].name + ' (screen)';
                                                } else {
                                                    renderedTracks[z].screenSharing = false;
                                                    renderedTracks[z].name = renderedTracks[z].name.replace(' (screen)', '');
                                                }
                                                replacedAudioTrack = true;
                                                break;
                                            }
                                        }

                                        log('updateWebRTCCanvasLayout replacedAudioTrack', replacedAudioTrack)

                                        if(!replacedAudioTrack) {
                                            log('updateWebRTCCanvasLayout else ADD VIDEO TRACK')

                                            let canvasStream = new WebRTCStreamSource(participants[v]);
                                            canvasStream.kind = 'video';
                                            canvasStream.track = vTracks[s];
                                            canvasStream.mediaStream = vTracks[s].stream;
                                            canvasStream.htmlVideoEl = vTracks[s].trackEl;
                                            canvasStream.parentGroup = _webrtcGroup;
                                            if (vTracks[s].screensharing == true) {
                                                canvasStream.screenSharing = true;
                                                canvasStream.name = canvasStream.name + ' (screen)';
                                            } else {
                                                canvasStream.screenSharing = false;
                                                canvasStream.name = canvasStream.name.replace(' (screen)', '');
                                            }
                                            tracksToAdd.push(canvasStream)
                                        }
                                    }
                                } else {
                                    log('updateWebRTCCanvasLayout !trackCurrentlyRendered = false')

                                    let audioOnly = layoutName == 'audioOnly' || (layoutName == null && _currentLayout == 'audioOnly');
                                    let audioScreenSharing =  layoutName == 'audioScreenSharing' || (layoutName == null && _currentLayout == 'audioScreenSharing');
                                    if((!audioOnly && !audioScreenSharing) || (!audioOnly && audioScreenSharing && trackCurrentlyRendered.screenSharing)) {
                                        log('updateWebRTCCanvasLayout !trackCurrentlyRendered = false if1')

                                        if(trackCurrentlyRendered.kind == 'audio') {
                                            log('updateWebRTCCanvasLayout !trackCurrentlyRendered = false if1.1')

                                            trackCurrentlyRendered.kind = 'video';
                                        }
                                    } else {
                                        log('updateWebRTCCanvasLayout !trackCurrentlyRendered = false else')

                                        trackCurrentlyRendered.kind = 'audio';
                                    }
                                    continue;
                                }

                            }

                        } else if (aTracks.length != 0 && audioIsEnabled) {
                            log('updateWebRTCCanvasLayout aTracks != 0')

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
                                log('updateWebRTCCanvasLayout aTracks: if1', renderedVideoTracks.length)

                                var newAudioTrack = renderedVideoTracks.splice(0, 1)[0];
                                log('updateWebRTCCanvasLayout aTracks: if1 splice', renderedVideoTracks.length, tracksToRemove.length)
                                log('updateWebRTCCanvasLayout aTracks: REMOVE TRACK')

                                newAudioTrack.kind = 'audio';
                                newAudioTrack.track = null;
                                newAudioTrack.mediaStream = null;
                                newAudioTrack.htmlVideoEl = null;
                                if (newAudioTrack.screenSharing == true) {
                                    newAudioTrack.screenSharing = false;
                                    newAudioTrack.name = newAudioTrack.name.replace(' (screen)', '');
                                }

                                tracksToRemove = tracksToRemove.concat(renderedVideoTracks);
                            } else {
                                log('updateWebRTCCanvasLayout aTracks: if2')
                                log('updateWebRTCCanvasLayout aTracks: ADD AUDIO TRACK')

                                let canvasStream = new WebRTCStreamSource(participants[v]);
                                canvasStream.kind = 'audio';
                                canvasStream.parentGroup = _webrtcGroup;
                                tracksToAdd.push(canvasStream);
                            }
                        }

                        for (let x in renderedTracks) {

                            let trackIsLive = false;

                            if(renderedTracks[x].kind == 'video') {
                                for (let m in vTracks) {
                                    if(renderedTracks[x].track == vTracks[m] && vTracks[m].parentScreen && vTracks[m].parentScreen.isActive) {
                                        log('updateWebRTCCanvasLayout remove not active', vTracks[m].parentScreen.isActive)

                                        trackIsLive = true;
                                    }
                                }
                            } else {
                                if(audioIsEnabled) trackIsLive = true;
                            }


                            if(!trackIsLive) {
                                log('updateWebRTCCanvasLayout aTracks: REMOVE AUDIO TRACK')

                                tracksToRemove.push(renderedTracks[x]);
                            }
                        }

                    }
                    log('updateWebRTCCanvasLayout result', tracksToAdd, tracksToRemove)
                    log('updateWebRTCCanvasLayout room name', options.roomName)

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
                            _eventDispatcher.dispatch('sourceRemoved', removedSource);
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


                    var currentActiveWebRTCSources = getSources('webrtc', true);
                    var layoutRects, streamsNum = (currentActiveWebRTCSources.concat(tracksToAdd).length);
                    if(layoutName != null && layoutName != 'audioOnly') {
                        console.log('updateWebRTCCanvasLayout layout', layoutName);

                        layoutRects = layoutGenerator(layoutName, streamsNum);
                        _currentLayout = layoutName;

                    } else {
                        if(_currentLayout != null) {
                            console.log('updateWebRTCCanvasLayout layout _currentLayout', _currentLayout);

                            layoutRects = layoutGenerator(_currentLayout, streamsNum);
                        } else {
                            if(renderScreenSharingLayout) {
                                console.log('updateWebRTCCanvasLayout layout renderScreenSharingLayout');

                                layoutRects = layoutGenerator('screenSharing', streamsNum);
                                _currentLayout = 'screenSharing';
                            } else {
                                console.log('updateWebRTCCanvasLayout layout tiledStreamingLayout');

                                layoutRects = layoutGenerator('tiledStreamingLayout', streamsNum);
                                console.log('updateWebRTCCanvasLayout layout tiledStreamingLayout after', layoutRects);

                                _currentLayout = 'tiledStreamingLayout';
                            }

                        }
                    }


                    log('updateWebRTCCanvasLayout streamsNum', streamsNum)

                    var streamsToUpdate = currentActiveWebRTCSources.slice();
                    var c = 0;

                    var videoTracksOfUserWhoShares = [];
                    var screenSharingIsNew = false;

                    if(renderScreenSharingLayout) {
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
                            moveit(timestamp, tracksToAdd[a].rect, rect, {y:startRect.y, x:startRect.x, width:startRect.width,height:startRect.height}, 300, starttime, 'add');
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
                            moveit(timestamp, rectToUpdate, rect, {y:rectToUpdate.y, x:rectToUpdate.x, width:rectToUpdate.width,height:rectToUpdate.height}, 300, starttime, 'up');
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
                                    }, 300, starttime, 'add');
                                })

                                log('updateWebRTCCanvasLayout videoTracksOfUserWhoShares for screenSharingIsNew', videoTracksOfUserWhoShares[a])

                                addSource(videoTracksOfUserWhoShares[a], true);
                            } else {
                                videoTracksOfUserWhoShares[a].rect = rect;
                                let rectToUpdate = new DOMRect(videoTracksOfUserWhoShares[a].rect.x, videoTracksOfUserWhoShares[a].rect.y, videoTracksOfUserWhoShares[a].rect.width, videoTracksOfUserWhoShares[a].rect.height);
                                videoTracksOfUserWhoShares[a].rect = rectToUpdate;

                                requestAnimationFrame(function(timestamp){
                                    let starttime = timestamp || new Date().getTime()
                                    moveit(timestamp, rectToUpdate, rect, {y:rectToUpdate.y, x:rectToUpdate.x, width:rectToUpdate.width,height:rectToUpdate.height}, 300, starttime, 'up');
                                })

                                log('updateWebRTCCanvasLayout videoTracksOfUserWhoShares for !screenSharingIsNew index', index)

                                if(a === 0) {
                                    for (let j in _activeScene.sources) {
                                        if (_activeScene.sources[j].sourceType == 'group' && _activeScene.sources[j].groupType == 'webrtc') {
                                            log('updateWebRTCCanvasLayout videoTracksOfUserWhoShares add after index ' + j, j)
                                            let h = parseInt(j) + 1, sourceStream = _activeScene.sources[h];
                                            while (sourceStream != null && sourceStream.sourceType == 'webrtc') {
                                                h++
                                                sourceStream = _activeScene.sources[h];
                                            }
                                            log('addSource add add after webrtc ' + h)
                                            log('addSource add at the end ' + (parseInt(h) + 1), _activeScene.sources.length)

                                            moveSource(index,  parseInt(h) + 1)
                                            break;
                                        }
                                    }
                                }


                            }


                        }
                    }

                    log('updateWebRTCCanvasLayout result streams', _activeScene.sources)



                }

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
                        } else if(streamData.sourceType == 'video') {
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

                    requestAnimationFrame(function(){
                        drawVideosOnCanvas();
                    })
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

                    if(!data.screenSharing) {
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
                    _inputCtx.fillStyle = options.liveStreaming.audioLayoutBgColor;
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

                function displayName(participant) {
                    if(!participant.online) return;
                    log('videoComposer: displayName')
                    var webrtcSource = _activeScene.sources.filter(function (source) {
                        log('videoComposer: displayName: filter', source)

                        return source.sourceType == 'webrtc' && source.participant == participant ? true : false;
                    })[0];
                    log('videoComposer: displayName: _activeScene.sources', _activeScene.sources.length)
                    log('videoComposer: displayName: source', webrtcSource)

                    if(webrtcSource == null || webrtcSource.displayNameTimeout != null) return;

                    //var text = webrtcSource.participant.username;
                    //_inputCtx.font = "30px Arial";
                    //var textWidth = _inputCtx.measureText(text).width;
                    //var percentWidth = (webrtcSource.rect.width / 100 * 70);
                    //var rectWidth = percentWidth > (textWidth + 50) ? percentWidth : (textWidth + 50 > webrtcSource.rect.width ? textWidth + 50 : webrtcSource.rect.width);
                    var rectWidth = webrtcSource.rect.width;
                    var xPos = webrtcSource.rect.x + ((webrtcSource.rect.width - rectWidth) / 2);
                    var rectHeight = webrtcSource.rect.height / 100 * 20;
                    if(rectHeight > 100) rectHeight = 100;
                    var yTo;
                    yTo = function () {
                        return webrtcSource.rect.y + webrtcSource.rect.height - rectHeight;
                    }
                    height = function () {
                        return webrtcSource.rect.height / 100 * 20;
                    }
                    var nameLabel = new RectObjectSource({
                        baseSource: webrtcSource,
                        frame: 0,
                        frames: 100,
                        //widthFrom: rectWidth,
                        //widthTo: rectWidth,
                        //heightFrom: rectHeight,
                        //heightTo: rectHeight,
                        //xFrom: xPos,
                        //xTo: xPos,
                        //yFrom: webrtcSource.rect.y + webrtcSource.rect.height,
                        //yTo: yTo(),
                        fill: webrtcSource.params.captionBgColor
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
                        }
                    });

                    let fontSize = (rectHeight / 100 * 40);
                    var textName = webrtcSource.participant.username;
                    _inputCtx.font = fontSize + "px Arial";
                    var nameTextSize = _inputCtx.measureText(textName);
                    var nameTextHeight = nameTextSize.fontBoundingBoxAscent + nameTextSize.fontBoundingBoxDescent;

                    var nameText = new TextObjectSource({
                        baseSource: nameLabel,
                        frame: 0,
                        frames: 100,
                        textHeight: nameTextHeight,
                        //xFrom: nameLabel.xFrom + 20,
                        //xTo: nameLabel.xTo + 20,
                        //yFrom: nameLabel.yFrom + (nameLabel.heightFrom / 100 * 1),
                        //yTo: nameLabel.yTo + (nameLabel.heightTo / 100 * 1),
                        fillStyle: webrtcSource.params.captionFontColor,
                        //font: fontSize + 'px Arial',
                        latestSize: fontSize,
                        text: textName.toUpperCase()
                    });
                    nameText.name = 'Text: ' + textName;

                    console.log('nameTextHeight', nameTextHeight)
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
                        'font': {
                            'get': function() {
                                let size = (this.baseSource.heightTo / 100 * 40);
                                if(this.latestSize === size) {
                                    return size + 'px Arial';
                                }

                                //layout should be updated as some changes were applied
                                this.latestSize = size;
                                _inputCtx.font = size + "px Arial";
                                console.log('updating.....')
                                let nameTextSize = _inputCtx.measureText(textName);
                                this.textHeight = nameTextSize.fontBoundingBoxAscent + nameTextSize.fontBoundingBoxDescent;

                                return size + 'px Arial';
                            }
                        }
                    });


                    let captionFontSize = (rectHeight / 100 * 20);
                    var captionText = webrtcSource.caption;
                    _inputCtx.font = captionFontSize + "px Arial";
                    var captionTextSize = _inputCtx.measureText(captionText);
                    var captionTextWidth = captionTextSize.width;
                    var captionTextHeight =  captionTextSize.fontBoundingBoxAscent + captionTextSize.fontBoundingBoxDescent;
                    console.log('nameTextHeight', captionTextHeight)

                    var captionText = new TextObjectSource({
                        baseSource: nameLabel,
                        frame: 0,
                        frames: 100,
                        textHeight: captionTextHeight,
                        //xFrom: nameLabel.xFrom + 20,
                        //xTo: nameLabel.xTo + 20,
                        //yFrom: nameLabel.yFrom + (nameLabel.heightFrom / 2) + 8,
                        //yTo: nameLabel.yTo + (nameLabel.heightTo / 2) + 8,
                        fillStyle: webrtcSource.params.captionFontColor,
                        latestSize: captionFontSize,
                        font: captionFontSize + 'px Arial',
                        text: captionText
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
                                let nameTextSize = _inputCtx.measureText(textName);
                                this.textHeight = nameTextSize.fontBoundingBoxAscent + nameTextSize.fontBoundingBoxDescent;

                                return size + 'px Arial';
                            }
                        }
                    });

                    addAdditionalSource(nameLabel, true);

                    addAdditionalSource(nameText);

                    addAdditionalSource(captionText);
                }

                /*hides name label and all text sources that are related to it */
                function hideName(participant) {
                    if(!participant.online) return;
                    var dependentTextSources = [];
                    var webrtcSource, nameBgSource;
                    webrtcSource = _activeScene.sources.filter(function (source) {
                        return source.sourceType == 'webrtc' && source.participant == participant ? true : false;
                    })[0];
                    for(let i in _activeScene.additionalSources) {
                        if(_activeScene.additionalSources[i].sourceType != 'webrtcrect' || _activeScene.additionalSources[i].baseSource.participant != participant) continue;
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

                    //var text = webrtcSource.participant.username;
                    //_inputCtx.font = "30px Arial";
                    //var textWidth = _inputCtx.measureText(text).width;
                    //var percentWidth = (webrtcSource.rect.width / 100 * 70);
                    //var rectWidth = percentWidth > (textWidth + 50) ? percentWidth : (textWidth + 50 > webrtcSource.rect.width ? textWidth + 50 : webrtcSource.rect.width);
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
                        //widthFrom: rectWidth,
                        //widthTo: rectWidth,
                        //heightFrom: rectHeight,
                        //heightTo: rectHeight,
                        //xFrom: xPos,
                        //xTo: xPos,
                        //yFrom: webrtcSource.rect.y + webrtcSource.rect.height,
                        //yTo: yTo(),
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
                        //widthFrom: rectWidth,
                        //widthTo: rectWidth,
                        //heightFrom: rectHeight,
                        //heightTo: rectHeight,
                        //xFrom: xPos,
                        //xTo: xPos,
                        //yFrom: webrtcSource.rect.y + webrtcSource.rect.height,
                        //yTo: yTo(),
                        lineWidth:colorBorderLineWidth,
                        strokeStyle: webrtcSource.params.captionBgColor
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
                    for ( var i = 0; i < maxBinCount; i++ ){

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

                    /*for ( var i = 0; i < maxBinCount; i++ ){

						var value = dataArray[i];
						if (value >= threshold) {
							_inputCtx.rotate(-(180 / 128) * Math.PI / 180);
							_inputCtx.fillRect(0, radius, 2, value / 2);
						}
					}

					for ( var i = 0; i < maxBinCount; i++ ){

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
                    for (var i = 0; i < bufferLength; i++) {
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

                    updateWebRTCCanvasLayout();
                    audioComposer.updateWebRTCAudioSources();
                    _isActive = true;
                    drawVideosOnCanvas();
                    refreshEventListeners(_roomInstance);
                }

                function refreshEventListeners(roomInstance) {
                    _roomInstance = roomInstance;
                    var updateCanvas = function() {
                        if(_isActive == true) {
                            audioComposer.updateWebRTCAudioSources();
                            updateWebRTCCanvasLayout();
                        }
                    }
                    roomInstance.event.on('videoTrackLoaded', updateCanvas);
                    roomInstance.event.on('audioTrackLoaded', updateCanvas);
                    roomInstance.event.on('participantDisconnected', updateCanvas);
                    roomInstance.event.on('trackMuted', updateCanvas);
                    roomInstance.event.on('trackUnmuted', updateCanvas);
                    roomInstance.event.on('screenHidden', updateCanvas);
                    roomInstance.event.on('screenShown', updateCanvas);
                    roomInstance.event.on('audioMuted', updateCanvas);
                    roomInstance.event.on('audioUnmuted', updateCanvas);

                    _eventDispatcher.on('drawingStop', function () {
                        roomInstance.event.off('videoTrackLoaded', updateCanvas);
                        roomInstance.event.off('audioTrackLoaded', updateCanvas);
                        roomInstance.event.off('participantDisconnected', updateCanvas);
                        roomInstance.event.off('trackMuted', updateCanvas);
                        roomInstance.event.off('trackUnmuted', updateCanvas);
                        roomInstance.event.off('screenHidden', updateCanvas);
                        roomInstance.event.off('screenShown', updateCanvas);
                        roomInstance.event.off('audioMuted', updateCanvas);
                        roomInstance.event.off('audioUnmuted', updateCanvas);
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
                function layoutGenerator(layoutName, numberOfRects) {
                    log('layoutGenerator', layoutName, _webrtcLayoutRect)

                    var layouts = {
                        tiledStreamingLayout: function (container, count) {
                            //var size = {parentWidth: _size.width, parentHeight: _size.height};
                            var size = {parentWidth: _webrtcLayoutRect.width, parentHeight: _webrtcLayoutRect.height, x: _webrtcLayoutRect.x, y: _webrtcLayoutRect.y};
                            return tiledStreamingLayout(size, count);
                        },
                        screenSharing: function (container, count) {
                            var size = {parentWidth: _webrtcLayoutRect.width, parentHeight: _webrtcLayoutRect.height, x: _webrtcLayoutRect.x, y: _webrtcLayoutRect.y};

                            return screenSharingLayout(count, size, true);
                        },
                        audioScreenSharing: function (container, count) {
                            var size = {parentWidth: _webrtcLayoutRect.width, parentHeight: _webrtcLayoutRect.height, x: _webrtcLayoutRect.x, y: _webrtcLayoutRect.y};

                            return audioScreenSharingLayout(count, size, true);
                        }
                    }

                    function tiledStreamingLayout(container, count) {
                        console.log('tiledStreamingLayout', container, count)
                        var containerRect = container;

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
                            var spaceBetween = parseInt(options.liveStreaming.tiledLayoutMargins);
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
                            for (var property in rows) {
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
                        console.log('screenSharingLayout START', count)
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
                    updateWebRTCCanvasLayout: updateWebRTCCanvasLayout,
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
                var audioContext =  new(window.AudioContext || window.webkitAudioContext);
                var _dest = null;
                //_dest.channelCountMode = 'max';
                window._dest = _dest;

                var Noise = (function () {
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

                window.Noise = Noise;

                var AudioSource = function () {
                    this.active = true;
                    this._name = null;
                    this.parentGroup = null;
                    this.sourceType = 'audio';
                    this.on = function (event, callback) {
                        if(this.eventDispatcher != null) this.eventDispatcher.on(event, callback)
                    };
                }

                var AudioGroupSource = function () {
                    this.groupType = null;
                    this.sourceType = 'group';
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
                    this.eventDispatcher = new EventSystem();
                }
                WebRTCAudioSource.prototype = new AudioSource();

                function getWebrtcGroupIndex() {
                    for (let j in _activeScene.audioSources) {
                        if (_activeScene.audioSources[j].sourceType == 'group' && _activeScene.audioSources[j].groupType == 'webrtc') {

                            var childItems = 0;
                            for(var i in _activeScene.audioSources) {
                                if(_activeScene.audioSources[i].parentGroup == _activeScene.audioSources[j]) {
                                    childItems++;
                                }
                            }

                            return {index:j, childItemsNum: childItems };
                        }
                    }
                }

                function addSource(newSource) {
                    log('addSource audio', newSource, options.liveStreaming)
                    if(newSource.sourceType == 'webrtc') {
                        let webrtcGroup = getWebrtcGroupIndex();


                        let h = webrtcGroup.index + 1, sourceStream = _activeScene.audioSources[h];
                        while (sourceStream != null && sourceStream.sourceType == 'webrtc') {
                            h++
                            sourceStream = _activeScene.audioSources[h];
                        }
                        log('addSource audio add at the end ' + (h), _activeScene.audioSources.length)

                        let newStream = audioContext.createMediaStreamSource(newSource.mediaStream);
                        newStream.connect(_dest)
                        _activeScene.audioSources.splice((h), 0, newSource)
                        _eventDispatcher.dispatch('sourceAdded', newSource);
                        return;
                    } else if(newSource.sourceType == 'audio') {
                        let webrtcGroup = getWebrtcGroupIndex();

                        var audio = document.createElement('audio');
                        audio.muted = false;
                        audio.loop = options.liveStreaming.loopAudio;
                        audio.src = newSource.url;

                        document.body.appendChild(audio);

                        var audioSource = new AudioSource();
                        audioSource.audioInstance = audio;
                        audioSource.name = newSource.title;
                        _activeScene.audioSources.splice((webrtcGroup.index + webrtcGroup.childItemsNum + 1), 0, audioSource)
                        const source = audioContext.createMediaElementSource(audioSource.audioInstance);
                        source.connect(_dest)
                        if(options.liveStreaming.localOutput) source.connect(audioContext.destination);
                        audioSource.sourceNode = source;
                        audioSource.audioInstance.play();

                        log('addSource sources', _activeScene.audioSources)
                        _eventDispatcher.dispatch('sourceAdded', audioSource);
                        return audioSource;
                    } else if(newSource.sourceType == 'video') {

                        const source = audioContext.createMediaElementSource(newSource.videoInstance);
                        source.connect(_dest)
                        if(options.liveStreaming.localOutput) source.connect(audioContext.destination);
                        newSource.audioSourceNode = source;

                        //log('addSource sources', _activeScene.audioSources)
                        //_eventDispatcher.dispatch('sourceAdded', newSource);
                        return newSource;
                    }

                }

                function removeSource(source) {
                    for (let j in _activeScene.audioSources) {
                        if (_activeScene.audioSources[j] == source) {
                            _activeScene.audioSources.splice(j, 1)
                        }
                    }
                    if(source.audioInstance != null) source.audioInstance.pause();
                    muteSourceLocally(source);
                }

                function muteSource(source, localOutput) {
                    //source.mediaStreamTrack.enabled = false;
                    if(source.sourceType == 'webrtc') {
                        if(source.mediaStreamTrack.enabled == true) {
                            log('muteSource webrtc', source);
                            source.mediaStreamTrack.enabled = false;
                        }
                    } else if(source.sourceType == 'audio') {
                        source.sourceNode.disconnect(_dest);
                        if(localOutput) muteSourceLocally(source);
                    }
                }

                function muteSourceLocally(source) {
                    if(source.sourceType == 'webrtc') {

                    } else if(source.sourceType == 'audio') {
                        source.sourceNode.disconnect(audioContext.destination);
                    } else if(source.sourceType == 'video') {
                        source.audioSourceNode.disconnect(audioContext.destination);
                    }
                }

                function unmuteSource(source, localOutput) {
                    //source.mediaStreamTrack.enabled = true;
                    if(source.sourceType == 'webrtc') {
                        if(source.mediaStreamTrack.enabled == false) {
                            log('unmuteSource unmute webrtc', source);
                            source.mediaStreamTrack.enabled = true;
                        }
                    } else if(source.sourceType == 'audio') {
                        source.sourceNode.connect(_dest);
                        if(localOutput) unmuteSourceLocally(source);
                    }
                }

                function unmuteSourceLocally(source) {
                    if(source.sourceType == 'webrtc') {
                        updateWebRTCAudioSources();
                    } else if(source.sourceType == 'audio') {
                        source.sourceNode.connect(audioContext.destination);
                    } else if(source.sourceType == 'video') {
                        source.audioSourceNode.connect(audioContext.destination);
                    }
                }

                function updateWebRTCAudioSources() {
                    log('updateWebRTCAudioSources START')
                    if(_dest == null) _dest = audioContext.createMediaStreamDestination();

                    var participants = _roomInstance.roomParticipants(true);

                    for(var v in participants) {
                        log('updateWebRTCAudioSources participant', participants[v].online, participants[v])
                        log('updateWebRTCAudioSources _activeScene.audioSources', _activeScene.audioSources)

                        let index = null;
                        for (let j in _activeScene.audioSources) {
                            if(_activeScene.audioSources[j].participant == participants[v]) {
                                index = j;
                            }
                        }

                        var audioWebrtcGroup = getWebrtcGroupIndex();

                        if(!audioWebrtcGroup) return;
                        let h = parseInt(audioWebrtcGroup.index) + 1, sourceStream = _activeScene.audioSources[h];
                        while (sourceStream != null && sourceStream.sourceType == 'webrtc') {
                            h++
                            sourceStream = _activeScene.audioSources[h];
                        }
                        log('updateWebRTCAudioSources index of audio group ' + (h), _activeScene.audioSources.length)



                        let audioTracks = participants[v].audioTracks();

                        var isLive = false;
                        if( _canvasMediStream != null && index != null && _activeScene.audioSources[index].mediaStreamTrack != null) {
                            for(let t in _canvasMediStream.getAudioTracks()) {
                                if(_canvasMediStream.getAudioTracks()[t] == _activeScene.audioSources[index].mediaStreamTrack) {
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
                            newAudio.mediaStreamTrack =  newAudio.mediaStream.getAudioTracks()[0];

                            audioSource = newAudio;
                            addSource(newAudio);
                        } else if (index != null && isLive === false) {
                            log('updateWebRTCAudioSources index != null && isLive === false');
                            audioSource = _activeScene.audioSources[index];
                            if(_canvasMediStream != null) {
                                log('updateWebRTCAudioSources add');
                                //_canvasMediStream.addTrack(audioSource.mediaStreamTrack);
                            }
                        } else {
                            audioSource = _activeScene.audioSources[index];
                        }

                        if(audioSource && audioSource.participant.online == false) {
                            log('updateWebRTCAudioSources remove audio')
                            _activeScene.audioSources.splice(index, 1);
                            continue;
                        }
                        //log('updateWebRTCAudioSources status', audioSource.mediaStreamTrack.enabled, audioSource.active);

                    }
                }

                function mix() {
                    console.log('audioComposer: mix');

                    window._canvasMediStream = _canvasMediStream;
                    window._localParticipant = localParticipant;
                    if(_dest == null) _dest = audioContext.createMediaStreamDestination();


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

                    window._canvasMediStream = _canvasMediStream;
                    window._localParticipant = localParticipant;
                    _canvasMediStream.addTrack(_dest.stream.getTracks()[0]);
                    updateWebRTCAudioSources();


                    if(options.liveStreaming.sounds) {
                        _roomInstance.event.on('participantConnected', function (e) {
                            if (_canvasMediStream == null || _dest == null) return;

                            var connectedAudio = new Audio(options.sounds.participantConnected)
                            var audioSource = audioContext.createMediaElementSource(connectedAudio);
                            audioSource.connect(_dest);
                            connectedaudioContext.play();
                            //audioSource.disconnect(_dest);
                        })

                        _roomInstance.event.on('participantDisconnected', function (e) {
                            if (_canvasMediStream == null || _dest == null) return;
                            var disconnectedAudio = new Audio(options.sounds.participantDisconnected)
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

                var isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

                var codecs = 'video/webm;codecs=vp8';

                //alert('mp4 ' + (MediaRecorder.isTypeSupported('video/mp4;codecs="vp8"')));
                if (MediaRecorder.isTypeSupported('video/mp4')) {
                    codecs = 'video/mp4';
                } else if(isChrome && !_isMobile) {
                    codecs = 'video/webm;codecs=h264';
                } else if (_isMobile && _isAndroid) {
                    codecs = 'video/webm;codecs=vp8';
                }

                if(options.liveStreaming.useRecordRTCLibrary) {
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
                        console.log('dataavailable',e);
                        trigerDataListeners(e.data);
                    });

                    _mediaRecorder.start(1000); // Start recording, and dump data every second
                }
            }

            function stopRecorder() {
                log('stopRecorder')

                if(_mediaRecorder == null) return;
                if(options.liveStreaming.useRecordRTCLibrary) {
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
                    if(_mediaRecorder != null) return true;
                    return false;
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
        }(app))

        var fbLive = (function (roomInstance) {
            var _roomInstance = roomInstance;
            var _streamingSocket = {};
            var _veryFirstBlobs = [];
            var _blackBlobs = [];

            var _videoStream = {blobs: [], allBlobs: [], size: 0, timer: null}

            function connect(rtmpUrls, platform, callback) {
                if(typeof io == 'undefined') return;
                log('startStreaming connect');

                var secure = options.nodeServer.indexOf('https://') == 0;
                _streamingSocket[platform] = {}
                _streamingSocket[platform].socket = window.sSocket = io.connect(options.nodeServer + '/webrtc', {
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
                    _roomInstance.event.dispatch('liveStreamingStopped', e);
                    _roomInstance.signalingDispatcher.sendDataTrackMessage("liveStreamingEnded", e.platform);
                });
            }

            function onDataAvailablehandler(blob) {
                //log('fbLive onDataAvailablehandler');

                _videoStream.blobs.push(blob);
                _videoStream.allBlobs.push(blob);

                _videoStream.size += blob.size;

                if(options.liveStreaming.timeSlice != null) return;

                let blobsLength = _videoStream.blobs.length;
                let sumSize = 0;

                /*for (let i = 0; i < blobsLength; i++) {
                    if (_videoStream.blobs.length == 0) break;
                    sumSize = sumSize + _videoStream.blobs[i].size;

                    let chunkSize = options.liveStreaming.chunkSize != null ? options.liveStreaming.chunkSize : 1000000;
                    if (sumSize >= chunkSize && _videoStream.recordingStopped != true) {
                        let blobsToSend = _videoStream.blobs.slice(0, i + 1);
                        _videoStream.blobs.splice(0, i);
                        var mergedBlob = new Blob(blobsToSend);

                        /!*var blobToSend;
						if (mergedBlob.size > 1000000) {
							blobToSend = mergedBlob.slice(0, 1000000);
							var blobToNotSend = mergedBlob.slice(1000000);
							_videoStream.blobs.unshift(blobToNotSend);
						} else {
							blobToSend = mergedBlob;
						}*!/

                        //let lastChunk = _videoStream.recordingStopped === true ? true : false;
                        //_videoStream.allBlobs.push(mergedBlob);
                        log('ondataavailable SEND CHUNK', mergedBlob.size)
                        _streamingSocket.emit('Streams/webrtc/videoData', mergedBlob);
                        break;
                    }
                }*/

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

                    canvasComposer.startRecorder(function (blob) {
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

                            if(!canvasComposer.videoTrackIsMuted()) {
                                _streamingSocket[service].socket.emit('Streams/webrtc/videoData', blob);
                            } else {
                                console.log('onDataAvailablehandler vTrack is MUTED')

                                var blobToSend = new Blob([_veryFirstBlobs[_veryFirstBlobs.length - 1], blob]);
                                _streamingSocket[service].socket.emit('Streams/webrtc/videoData', blobToSend);
                            }
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

                    _roomInstance.event.dispatch('liveStreamingStarted', {participant:localParticipant, platform:service});
                    _roomInstance.signalingDispatcher.sendDataTrackMessage("liveStreamingStarted", service);
                });
            }

            function switchRoom(roomInstance, roomParticipants) {

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

                    canvasComposer.stopRecorder();

                    if(service != null && _streamingSocket[service] != null) {
                        _streamingSocket[service].socket.disconnect();
                        _streamingSocket[service] = null;

                    } else {
                        for(let propName in _streamingSocket) {
                            if(_streamingSocket[propName] != null && _streamingSocket[propName].socket.connected) {
                                _streamingSocket[propName].socket.disconnect();
                                _streamingSocket[propName] = null;
                            }
                        }
                    }
                    _veryFirstBlobs = [];

                    _roomInstance.event.dispatch('liveStreamingEnded', {participant:localParticipant, platform:service});
                    _roomInstance.signalingDispatcher.sendDataTrackMessage("liveStreamingEnded", service);

                },
                isStreaming: function (platform) {
                    if(!platform){
                        for(let propName in _streamingSocket) {
                            log('fbLive: isStreaming', propName, _streamingSocket[propName]);
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
                switchRoom: switchRoom,
                videoStream:function () {
                    return _videoStream;
                },
                updateRoomInstance:function (newRoomInstance) {
                    return _roomInstance = newRoomInstance;
                }
            }
        }(app))

        var localRecorder = (function () {

            var _recordingLib = 'MediaRecorder'; //MediaRecorder || RecordRTC
            var _extension = null;
            var _recorder = null;
            var _recorderStartTime = null;
            var _recorderStartTimecode = null;
            var _recorderPrevTime = null;
            var _recorderPrevTimecode = null;
            var _totalLength = 0;

            var _recordingInfoSent = [];
            var _parallelRecordings = [];
            var _saveToDbTimer = null;
            var _sendToServerTimer = null;
            var _sendingInProgress = false;
            var _lastChunkCreatedTime = null;
            var _lastChunkSendTime = null;
            var _chunkNum = 0;
            var _recordingInProgress = false;

            function saveAudioChunks(blobsToSend) {
                log('saveAudioChunks')
                if(blobsToSend.size == 0) return;
                _lastChunkCreatedTime = Date.now();

                // var mergedBlob = new Blob(blobsToSend);
                log('SAVE LOCAL AUDIO _parallelRecordings', _parallelRecordings[0])
                let parallelRecordingsTimecode = _parallelRecordings.splice(0, _parallelRecordings.length);
                mediaDB('localAudio').save({blob:blobsToSend, roomId: options.roomName, parallelRecordings:parallelRecordingsTimecode, timestamp: Date.now()}, function () {
                    log('SAVE LOCAL AUDIO: END')

                });
            }

            function sendAudioChunks() {
                _lastChunkSendTime = Date.now();
                log('sendAudioChunks', _recordingInProgress);
                mediaDB('localAudio').getStorage(function (results) {
                    log('sendAudioChunks: get audio: results', results)

                    results.sort(function(a, b){
                        var x = a.timestamp;
                        var y = b.timestamp;
                        if (x < y) {return -1;}
                        if (x > y) {return 1;}
                        return 0;
                    });

                    if(results.length == 0 && _recordingInProgress) {
                        log('sendAudioChunks: setTimeout', results)

                        _sendToServerTimer = setTimeout(sendAudioChunks, 1000);

                        return;
                    }


                    function sendToServer(index) {
                        var startUploadTime = Date.now();
                        log('sendAudioChunks: get audio: sendToServer', results)

                        if(results[index] != null && results[index].blob != null) {
                            let audioBlob = new Blob([results[index].blob]);
                            _chunkNum = _chunkNum + 1;
                            let parallelRecordings = results[index].parallelRecordings.length != 0 ? results[index].parallelRecordings : [];
                            log('sendAudioChunks: get audio: sendToServer: upload start', index, results.length, _recordingInProgress)

                            let lastChunk = _recordingInProgress === false && index == (results.length - 1);
                            socket.emit('Streams/webrtc/localMedia', audioBlob, {parallelRecordings: parallelRecordings, extension: _extension}, _chunkNum, lastChunk, function () {
                                log('sendAudioChunks: get audio: sendToServer: upload end', Date.now() - startUploadTime)

                                mediaDB('localAudio').remove(results[index].objectId, null, null, function () {
                                    log('sendAudioChunks: get audio: sendToServer: removeFromDB')

                                    if(index == results.length - 1) {
                                        if(_lastChunkCreatedTime > _lastChunkSendTime){
                                            log('sendAudioChunks: get audio: sendToServer: removeFromDB: right after')

                                            sendAudioChunks();
                                        } else if (_recordingInProgress) {
                                            log('sendAudioChunks: get audio: sendToServer: removeFromDB: timer 1000')

                                            _sendToServerTimer = setTimeout(sendAudioChunks, 1000);
                                        }

                                        return;
                                    }

                                    log('sendAudioChunks: get audio: sendToServer: removeFromDB: continue')

                                    sendToServer(index + 1);
                                });

                            });

                        }

                    }

                    sendToServer(0);

                }, null, 'roomId', options.roomName);
            }

            function mediaDataChunk(event) {
                log('startRecording: dataavailable ', event.timecode);

                let blobData = event instanceof Blob ? event : event.data;
                if(_recorderPrevTimecode != null) log('startRecording: dataavailable diff timecode', event.timecode - _recorderPrevTimecode);
                if(_recorderPrevTime != null) log('startRecording: dataavailable diff time', (performance.timeOrigin + performance.now()) - _recorderPrevTime);


                if(_recorderStartTimecode == null) {

                    _recorderStartTimecode = event.timecode - ((performance.timeOrigin + performance.now()) - _recorderPrevTime);
                    _totalLength = _totalLength + (event.timecode - _recorderStartTimecode)
                    log('_recorderStartTimecode', _recorderStartTimecode, event.timecode, _recorderStartTimecode)
                } else {
                    _totalLength = _totalLength + (event.timecode - _recorderPrevTimecode)
                }

                _recorderPrevTime = performance.timeOrigin + performance.now();
                _recorderPrevTimecode = event.timecode;
                log('_totalLength', _totalLength)

                saveAudioChunks(blobData);
            }

            function startRecording(callback) {
                log('startRecording');
                var audioTracks = localParticipant.audioTracks();
                var videoTracks = localParticipant.videoTracks();
                log('startRecording: audio tracks: ', audioTracks);
                log('startRecording: videoTracks tracks: ', videoTracks);
                //var streamToRectord = new MediaStream(localParticipant.tracks.map(function(o){return o.mediaStreamTrack}));
                var streamToRectord = new MediaStream();


                for(let a in audioTracks) {
                    streamToRectord.addTrack(audioTracks[a].mediaStreamTrack);
                }
                for(let a in videoTracks) {
                    streamToRectord.addTrack(videoTracks[a].mediaStreamTrack);

                }


                if(_recordingLib == 'RecordRTC') {
                    _recordingInProgress = true;
                    _recorder = RecordRTC(streamToRectord, {
                        recorderType:StereoAudioRecorder,
                        type: 'audio',
                        mimeType: 'video/wav',
                        timeSlice: 5000,
                        ondataavailable:mediaDataChunk
                    });
                    _recorder.startRecording();
                    log('startRecording: start event');
                    _recorderStartTime = _recorderPrevTime = performance.timeOrigin + performance.now();
                    _recordingInfoSent = roomParticipants.map(function (p) {
                        return {sid: p.sid, recording: false};
                    });
                    app.signalingDispatcher.sendDataTrackMessage("localRecordingStarted", {
                        type:'notification'
                    });

                } else {

                    let options = {
                        mimeType: 'audio/wav'
                        /*audioBitsPerSecond : 128000,
                        videoBitsPerSecond : 2500000*/
                    }

                    if (MediaRecorder.isTypeSupported('video/webm;codecs=opus,vp9')) {
                        log('startRecording: isTypeSupported video/webm;codecs="opus,vp9"');
                        options.mimeType = 'video/webm; codecs="opus,vp9"';
                        _extension = 'webm';
                    } else if (MediaRecorder.isTypeSupported('video/webm;codecs="opus,vp8"')) {
                        log('startRecording: isTypeSupported video/webm;codecs="opus,vp8"');
                        options.mimeType = 'video/webm; codecs=vp8';
                        _extension = 'webm';
                    } else if (MediaRecorder.isTypeSupported('video/webm;codecs="opus,h264"')) {
                        log('startRecording: isTypeSupported video/webm;codecs="opus,h264"');
                        options.mimeType = 'video/webm;codecs="h264"';
                        _extension = 'webm';
                    }

                    _recorder = new MediaRecorder(streamToRectord,  options);
                    _recordingInProgress = true;

                    _recorder.addEventListener("start", event => {
                        log('startRecording: start event');
                        _recorderStartTime = _recorderPrevTime = performance.timeOrigin + performance.now();
                        _recordingInfoSent = roomParticipants.map(function (p) {
                            return {sid: p.sid, recording: false};
                        });
                        app.signalingDispatcher.sendDataTrackMessage("localRecordingStarted", {
                            type:'notification'
                        });
                    });

                    _recorder.addEventListener("dataavailable", mediaDataChunk);

                    log('startRecording: start');
                    _recorder.start(5000);
                }

                //_saveToDbTimer = setTimeout(saveAudioChunks, 6000);
                sendAudioChunks();
                //_sendToServerTimer = setTimeout(sendAudioChunks, 6000);

                if(callback != null) callback();
                //app.event.dispatch('videoRecordingStarted', localParticipant);
                //app.signalingDispatcher.sendDataTrackMessage("liveStreamingStarted");
            }

            function somebodyStartedRecording(e) {
                log('somebodyStartedRecording', _recordingInfoSent);
                if(e.participant.signalingRole == 'polite') {
                    let shouldIgnore = false;
                    for (let i in _recordingInfoSent) {
                        if (_recordingInfoSent[i].sid == e.participant.sid) {
                            if (_recordingInfoSent[i].recording === true || _recordingInfoSent[i].recording === null) {
                                shouldIgnore = true
                            } else if (_recordingInfoSent[i].recording === false) {
                                shouldIgnore = false
                            }
                        }
                    }

                    if(shouldIgnore) {
                        return;
                    }
                }


                let currentSliceOffset = (performance.timeOrigin + performance.now()) - _recorderPrevTime;
                log('somebodyStartedRecording currentSliceOffset', currentSliceOffset);
                _parallelRecordings.push({time:_totalLength + currentSliceOffset, participant: {sid: e.participant.sid, username: e.participant.identity}});
            }

            app.event.on('localRecordingStarted', function (e) {
                log('remoteRecordingStarted', _recordingInfoSent, e.data);

                if(e.data.type == 'notification') {
                    log('remoteRecordingStarted notification');

                    if(!localRecorder.isActive()) {
                        app.signalingDispatcher.sendDataTrackMessage("localRecordingStarted", {
                            type:'answer',
                            recording: false
                        });

                        return false;
                    } else {
                        app.signalingDispatcher.sendDataTrackMessage("localRecordingStarted", {
                            type:'answer',
                            recording: true
                        });
                    }
                    somebodyStartedRecording(e);
                } else if(e.data.type == 'answer') {
                    log('remoteRecordingStarted answer');

                    for (let i in _recordingInfoSent) {
                        if (_recordingInfoSent[i].sid == e.participant.sid) {
                            _recordingInfoSent[i].recording = e.data.recording
                        }
                    }
                }

            });

            function stopRecording(callback) {
                log('stopRecording');
                if(_recordingLib == 'RecordRTC') {
                    _recorder.stopRecording();
                    _recordingInProgress = false;
                } else {
                    _recorder.addEventListener("stop", () => {
                        /*const audioBlob = new Blob(_mediaChunks.blobs);
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        audio.play();*/

                        /*mediaDB('localAudio').getStorage(function (results) {
                            log('stopRecording: get audio: results', results)
                            var buffer = results.map(function (o) {
                                return o.blob;
                            })
                            if(buffer.length == 0) return;
                            const audioBlob = new Blob(buffer);
                            log('stopRecording: get audio: buffer', buffer)

                            const audioUrl = URL.createObjectURL(audioBlob);
                            const audio = new Audio(audioUrl);
                            audio.play();
                            socket.emit('Streams/webrtc/localMedia', audioBlob);


                        }, null, 'roomId', options.roomName);*/
                    });

                    /*if(_saveToDbTimer != null) {
                        clearTimeout(_saveToDbTimer);
                        _saveToDbTimer = null;
                    }

                    if(_sendToServerTimer != null) {
                        clearTimeout(_sendToServerTimer);
                        _sendToServerTimer = null;
                    }*/

                    _recordingInProgress = false;
                    log('stopRecording: requestData');
                    _recorder.requestData()
                    _recorder.stop();
                }

                if(callback != null) callback();
                //app.event.dispatch('videoRecordingStopped', localParticipant);
                //app.signalingDispatcher.sendDataTrackMessage("liveStreamingEnded");
            }

            var audioRecorder = (function () {
                var _sampleRate = 44100;
                var _recordingLength = 0;
                var _rightChannel = [];
                var _leftChannel = [];
                var _timer = null;
                var _timerIterval = 5000;
                var _source = null;
                var _processor = null;
                var _context = null;

                function saveBuffer() {
                    log('saveBuffer')
                    let leftChannel = _leftChannel.splice(0, _leftChannel.length)
                    let rightChannel = _rightChannel.splice(0, _rightChannel.length)
                    let recordingLength = _recordingLength;
                    log('saveBuffer leftChannel', leftChannel.length)
                    log('saveBuffer rightChannel', rightChannel.length)

                    if(leftChannel.length == 0 && rightChannel.length == 0) return;

                    var leftBuffer = flattenArray(leftChannel, recordingLength);
                    var rightBuffer = flattenArray(rightChannel, recordingLength);
                    // we interleave both channels together
                    // [left[0],right[0],left[1],right[1],...]
                    var interleaved = interleave(leftBuffer, rightBuffer);

                    // we create our wav file
                    var buffer = new ArrayBuffer(44 + interleaved.length * 2);
                    var view = new DataView(buffer);

                    // RIFF chunk descriptor
                    writeUTFBytes(view, 0, 'RIFF');
                    view.setUint32(4, 44 + interleaved.length * 2, true);
                    writeUTFBytes(view, 8, 'WAVE');
                    // FMT sub-chunk
                    writeUTFBytes(view, 12, 'fmt ');
                    view.setUint32(16, 16, true); // chunkSize
                    view.setUint16(20, 1, true); // wFormatTag
                    view.setUint16(22, 2, true); // wChannels: stereo (2 channels)
                    view.setUint32(24, _sampleRate, true); // dwSamplesPerSec
                    view.setUint32(28, _sampleRate * 4, true); // dwAvgBytesPerSec
                    view.setUint16(32, 4, true); // wBlockAlign
                    view.setUint16(34, 16, true); // wBitsPerSample
                    // data sub-chunk
                    writeUTFBytes(view, 36, 'data');
                    view.setUint32(40, interleaved.length * 2, true);

                    // write the PCM samples
                    var index = 44;
                    var volume = 1;
                    for (var i = 0; i < interleaved.length; i++) {
                        view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
                        index += 2;
                    }

                    // our final blob
                    let blob = new Blob([view], { type: 'audio/wav' });
                    saveAudioChunks(blob);

                    _timer = setTimeout(saveBuffer, _timerIterval)
                }

                function flattenArray(channelBuffer, recordingLength) {
                    var result = new Float32Array(recordingLength);
                    var offset = 0;
                    for (var i = 0; i < channelBuffer.length; i++) {
                        var buffer = channelBuffer[i];
                        result.set(buffer, offset);
                        offset += buffer.length;
                    }
                    return result;
                }

                function interleave(leftChannel, rightChannel) {
                    var length = leftChannel.length + rightChannel.length;
                    var result = new Float32Array(length);

                    var inputIndex = 0;

                    for (var index = 0; index < length;) {
                        result[index++] = leftChannel[inputIndex];
                        result[index++] = rightChannel[inputIndex];
                        inputIndex++;
                    }
                    return result;
                }

                function writeUTFBytes(view, offset, string) {
                    for (var i = 0; i < string.length; i++) {
                        view.setUint8(offset + i, string.charCodeAt(i));
                    }
                }

                function startRecording() {
                    log('startRecording');
                    var streamToRectord = new MediaStream();
                    var audioTracks = localParticipant.audioTracks();
                    log('startRecording: audio tracks: ', audioTracks);

                    for(let a in audioTracks) {
                        streamToRectord.addTrack(audioTracks[a].mediaStreamTrack);

                    }

                    var bufferSize = 2048;
                    var numberOfInputChannels = 2;
                    var numberOfOutputChannels = 2;
                    _context = new AudioContext();
                    _source = _context.createMediaStreamSource(streamToRectord);
                    _processor = _context.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);

                    _source.connect(_processor);
                    _processor.connect(_context.destination);

                    _processor.onaudioprocess = function(e) {
                        _leftChannel.push(new Float32Array(e.inputBuffer.getChannelData(0)));
                        _rightChannel.push(new Float32Array(e.inputBuffer.getChannelData(1)));
                        _recordingLength += bufferSize;
                    };

                    _recordingInProgress = true;
                    _timer = setTimeout(saveBuffer, _timerIterval)

                    sendAudioChunks();

                }

                function stopRecording() {
                    log('stopRecording');

                    _recordingInProgress = false;
                    log('stopRecording: requestData');
                    _processor.disconnect(_context.destination);
                    _source.disconnect(_processor)
                }

                return {
                    start:startRecording,
                    stop:stopRecording
                }
            }())

            var mediaDB = (function (objectsStoreName) {
                // IndexedDB
                var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
                var dbVersion = 1;
                var baseName = "mediaDB";
                var objectStores = ['localAudio'];
                var storeName = objectsStoreName;
                var shouldInit = true;

                function _logerr(err){
                    log('%c mediaDB: error', 'background:red;color:white', err);
                }

                function _openDb(f) {
                    log('%c mediaDB: _openDb', 'background:red;color:white');
                    var request = indexedDB.open(baseName, dbVersion);
                    request.onerror = _logerr;

                    request.onupgradeneeded = function (e) {
                        var db = e.currentTarget.result;
                        log('%c mediaDB: request.onupgradeneeded oldVersion=' + e.oldVersion, 'background:blue;color:white');

                        if(!db.objectStoreNames.contains('localAudio')) {
                            var localAudioStore = db.createObjectStore("localAudio", {
                                keyPath: "objectId",
                                autoIncrement: true
                            });
                            localAudioStore.createIndex("roomId", "roomId", { unique: false });

                        }
                        shouldInit = false;
                        //_openDb(f);

                    }
                    request.onsuccess = function () {
                        log('%c mediaDB: request.onsuccess', 'background:blue;color:white');

                        f(request.result);
                    }
                }

                function isOpened() {
                    return isDbCreated;
                }

                function get(file, f){
                    log('%c mediaDB: get', 'background:red;color:white');

                    _openDb(function(db){
                        var request = db.transaction([storeName], "readonly").objectStore(storeName).get(file);
                        request.onerror = _logerr;
                        request.onsuccess = function(){
                            f(request.result ? request.result : -1);
                        }
                    });
                }

                function getStorage(f, limit, index, indexValue){
                    _openDb(function(db){
                        var rows = [];
                        var i = 0;
                        var store = db.transaction([storeName], "readonly").objectStore(storeName);
                        var keyRange = indexValue != null ? IDBKeyRange.only(indexValue) : null;
                        log('index', index, indexValue)
                        if(index != null) store = store.index(index);

                        if(store.mozGetAll && !limit)
                            store.mozGetAll().onsuccess = function(e){
                                f(e.target.result);
                            };
                        else
                            store.openCursor(keyRange).onsuccess = function(e) {
                                var cursor = e.target.result;
                                if((cursor && !limit) || (cursor && limit && i < limit)){
                                    rows.push(cursor.value);
                                    cursor.continue();
                                }
                                else {
                                    f(rows);
                                }
                                i++;
                            };
                    });
                }

                function countImages(f){
                    _openDb(function(db){
                        var request = db.transaction([storeName], "readonly").objectStore(storeName).count();
                        request.onerror = _logerr;
                        request.onsuccess = function(){
                            f(request.result ? request.result : -1);
                        }
                    });
                }

                function save(object, f){
                    console.log('save', object);
                    if(object.blob instanceof Blob) {
                        object.blob.arrayBuffer().then(function (buffer) {
                            object.blob = buffer;
                            mediaDB(storeName).save(object, f);
                        });
                        return;
                    }

                    _openDb(function(db){

                        var request = db.transaction([storeName], "readwrite").objectStore(storeName).put(object);
                        request.onerror = _logerr;
                        request.onsuccess = function(){

                            f(request.result);
                        }
                    });
                }

                function deleteObj(objId, index, indexValue, f){
                    _openDb(function(db){
                        var request = db.transaction([storeName], "readwrite").objectStore(storeName);

                        var key = indexValue != null ? IDBKeyRange.only(indexValue) : objId;
                        request.delete(key);

                        request.onerror = _logerr;
                        request.transaction.oncomplete = function(e) {
                            if(f != null) f()
                        };

                    });
                }

                return {
                    save: save,
                    getStorage: getStorage,
                    get: get,
                    remove: deleteObj,
                    count: countImages
                }

            })

            function isActive() {
                if(_recorder != null && _recorder.state == 'recording') {
                    return true;
                }
                return false;
            }

            return {
                startRecording: startRecording,
                stopRecording: stopRecording,
                isActive: isActive
            }
        }())

        return {
            attachTrack: attachTrack,
            getLoudestScreen: getLoudestScreen,
            audioVisualization: audioVisualization,
            canvasComposer:canvasComposer,
            localRecorder:localRecorder,
            fbLive:fbLive
        }
    }())

    app.screenSharing = (function () {
        function isFirefox() {
            var mediaSourceSupport = !!navigator.mediaDevices.getSupportedConstraints()
                .mediaSource;
            var matchData = navigator.userAgent.match(/Firefox\/(\d+)/);
            var firefoxVersion = 0;
            if (matchData && matchData[1]) {
                firefoxVersion = parseInt(matchData[1], 10);
            }
            return mediaSourceSupport && firefoxVersion >= 52;
        }

        function isChrome() {
            return 'chrome' in window;
        }

        function canScreenShare() {
            return isChrome || isFirefox;
        }

        function startShareScreen(successCallback, failureCallback) {
            app.signalingDispatcher.sendDataTrackMessage("screensharingStarting");

            if(_isMobile && typeof cordova != 'undefined') {
                cordova.plugins.sharescreen.startScreenShare(function(e){
                    log('startShareScreen MOBILE : GOT STREAM');
                    if(e.track.kind == 'audio') {
                        return;
                    }

                    var stream = e.streams[0]
                    var videoTrack = e.track;

                    /*setInterval(function () {
                         log('screen sharing track : mediaStreamTrack.readyState ' + videoTrack.readyState)
                         log('screen sharing track : loadedmetadata: mediaStreamTrack.enabled ' + videoTrack.enabled)
                         log('screen sharing track : loadedmetadata: mediaStreamTrack.muted ' + videoTrack.muted)
                     }, 3000)*/
                    if(!options.showScreenSharingInSeparateScreen) app.localMediaControls.disableVideo();

                    var trackToAttach = new Track();
                    trackToAttach.stream = stream;
                    trackToAttach.sid = videoTrack.id;
                    trackToAttach.mediaStreamTrack = videoTrack;
                    trackToAttach.kind = videoTrack.kind;
                    trackToAttach.isLocal = true;
                    trackToAttach.screensharing = true;

                    app.signalingDispatcher.sendDataTrackMessage("trackIsBeingAdded", {kind: 'video', streamId:trackToAttach.stream.id, screensharing:true});

                    app.mediaManager.attachTrack(trackToAttach, localParticipant);

                    //app.localMediaControls.enableVideo();
                    if(successCallback != null) successCallback();
                    app.signalingDispatcher.sendDataTrackMessage("screensharingStarted");

                }, function(error){
                    alert(error.message)
                    console.error(error.name + ': ' + error.message);
                    app.signalingDispatcher.sendDataTrackMessage("screensharingFailed");

                    if(failureCallback != null) failureCallback(error);
                });
            } else if(!_isMobile) {

                getUserScreen().then(function (stream) {
                    var videoTrack = stream.getVideoTracks()[0];

                    if(!options.showScreenSharingInSeparateScreen) app.localMediaControls.disableVideo();

                    var trackToAttach = new Track();
                    trackToAttach.stream = stream;
                    trackToAttach.sid = videoTrack.id;
                    trackToAttach.mediaStreamTrack = videoTrack;
                    trackToAttach.kind = videoTrack.kind;
                    trackToAttach.isLocal = true;
                    trackToAttach.screensharing = true;

                    app.signalingDispatcher.sendDataTrackMessage("trackIsBeingAdded", {kind: 'video', streamId:trackToAttach.stream.id, screensharing:true});

                    app.mediaManager.attachTrack(trackToAttach, localParticipant);

                    app.localMediaControls.enableVideo();
                    if(successCallback != null) successCallback();
                    app.signalingDispatcher.sendDataTrackMessage("screensharingStarted");

                }).catch(function(error) {
                    console.error(error.name + ': ' + error.message);
                    app.signalingDispatcher.sendDataTrackMessage("screensharingFailed");

                    if(failureCallback != null) failureCallback(error);
                });
            }

        }

        function stopShareScreen() {
            log('stopShareScreen');
            if(_isMobile && typeof cordova != 'undefined') {
                try {
                    cordova.plugins.sharescreen.stopScreenShare();
                } catch (e) {
                    alert(e.message)
                }

                var screenSharingTracks = localParticipant.tracks.filter(function (trackObj) {
                    return trackObj.kind == 'video' && trackObj.screensharing == true && trackObj.mediaStreamTrack.readyState != 'ended';
                });
                log('stopShareScreen screenSharingTracks', screenSharingTracks);

                app.localMediaControls.disableVideo(screenSharingTracks);
                if(screenSharingTracks.length != 0) {
                    socket.emit('Streams/webrtc/cameraDisabled');
                    app.event.dispatch('screensharingStopped');
                }
            } if(!_isMobile) {
                var screenSharingTracks = localParticipant.tracks.filter(function (trackObj) {
                    return trackObj.kind == 'video' && trackObj.screensharing == true && trackObj.mediaStreamTrack.readyState != 'ended';
                });
                log('stopShareScreen screenSharingTracks', screenSharingTracks);

                app.localMediaControls.disableVideo(screenSharingTracks);
                if(screenSharingTracks.length != 0) {
                    socket.emit('Streams/webrtc/cameraDisabled');
                    app.event.dispatch('screensharingStopped');
                }
            }


        }

        function getUserScreen() {
            if (!canScreenShare()) {
                return;
            }

            if(navigator.getDisplayMedia || navigator.mediaDevices.getDisplayMedia) {

                if(navigator.mediaDevices.getDisplayMedia) {
                    return navigator.mediaDevices.getDisplayMedia({video: true});
                }
                else if(navigator.getDisplayMedia) {
                    return navigator.getDisplayMedia({video: true})
                }
                return;
            }

            if (isChrome()) {

                var extensionId = 'bhmmjgipfdikhleemaeopoheadpjnklm';
                return new Promise(function(resolve, reject) {
                    const request = {
                        sources: ['screen']
                    };
                    chrome.runtime.sendMessage(function(extensionId, request, response){
                        if (response && response.type === 'success') {
                            resolve({ streamId: response.streamId });
                        } else {
                            reject(new Error('Could not get stream'));
                        }
                    });
                }).then(function(response) {
                    return navigator.mediaDevices.getUserMedia({
                        video: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: response.streamId
                            }
                        }
                    });
                });
            } else if (isFirefox()) {
                return navigator.mediaDevices.getUserMedia({
                    video: {
                        mediaSource: 'screen'
                    }
                });
            }
        }

        function isActive() {
            for(let t in localParticipant.tracks){
                if(localParticipant.tracks[t].screensharing) return true;
            }
            return false;
        }

        return {
            getUserScreen: getUserScreen,
            startShareScreen: startShareScreen,
            stopShareScreen: stopShareScreen,
            isActive: isActive
        }
    }())

    app.signalingDispatcher = (function () {
        function sendMessage(message){
            log('sendMessage', message)
            socket.emit('Streams/webrtc/signalling', message);
        }

        function participantConnected(newParticipant) {
            var participantExist = roomParticipants.filter(function (p) {
                return p.sid == newParticipant.sid;
            })[0];
            log('participantConnected: ' + newParticipant.sid)
            if(participantExist == null){
                log('participantConnected doesn\'t participantExist')
                roomParticipants.unshift(newParticipant);
            }
            newParticipant.connectedTime = performance.now();
            newParticipant.latestOnlineTime = performance.now();
            newParticipant.online = true;
            app.event.dispatch('participantConnected', newParticipant);
        }

        function dataTrackRecieved(track, participant) {
            log('dataTrackRecieved', track, participant);
            var trackToAttach = new Track();
            trackToAttach.sid = track.sid;
            trackToAttach.kind = track.kind;
            trackToAttach.isLocal = participant.isLocal;
            participant.dataTrack = track;

            participant.dataTrack.on('message', function (data) {
                processDataTrackMessage(data, participant);
            });
        }

        /**
         * Processes messege received via data channel. Is used for notifying users about: current actions (e.g starting
         * screen sharing), online status (for heartbeat feature); users local info (whether mic/camera is enabled).
         * @method initWithStreams
         * @param {Object} [data] Message in JSON
         * @param {String} [data.type] Message type
         * @param {Object} [data.content] Message data
         * @param {Object} [participant] Participant who sent the message
         */
        function processDataTrackMessage(data, participant) {
            data = JSON.parse(data);
            if(data.type == 'screensharingStarting' || /*data.type == 'screensharingStarted' ||*/ data.type == 'screensharingFailed' || data.type == 'afterCamerasToggle') {
                log('processDataTrackMessage', data.type)
                app.event.dispatch(data.type, {content:data.content != null ? data.content : null, participant: participant});
            } else if(data.type == 'trackIsBeingAdded') {
                log('processDataTrackMessage', data.type)
                var screenSharingTrackHandler = function(e) {
                    log('trackIsBeingAdded screenSharingTrackHandler', e.track, data)
                    if(e.participant != participant) return;
                    e.track.screensharing = true;

                    if(options.onlyOneScreenSharingAllowed == true) {
                        app.screenSharing.stopShareScreen();
                    }

                    app.event.dispatch('screensharingStarted', {content:data.content != null ? data.content : null, participant: participant});

                    app.event.off('trackSubscribed', screenSharingTrackHandler);
                }

                var screenSharingFailingHandler = function(e) {
                    log('trackIsBeingAdded screenSharingFailingHandler')
                    if(e.participant != participant) return;
                    app.event.off('trackSubscribed', screenSharingTrackHandler);
                    app.event.off('screensharingFailed', screenSharingFailingHandler);

                }

                if(data.content.screensharing) {
                    app.event.on('trackSubscribed', screenSharingTrackHandler);
                    app.event.on('screensharingFailed', screenSharingFailingHandler);
                }

            } else if(data.type == 'liveStreamingStarted') {
                participant.fbLiveStreamingActive = true;
                app.event.dispatch('liveStreamingStarted', {participant:participant, platform:data});
            } else if(data.type == 'liveStreamingEnded') {
                participant.fbLiveStreamingActive = false;
                app.event.dispatch('liveStreamingEnded', {participant:participant, platform:data});
            } else if(data.type == 'localRecordingStarted') {
                app.event.dispatch('localRecordingStarted', {participant:participant, data:data.content});
            } else if(data.type == 'webcastStarted') {
                app.event.dispatch('webcastStarted', {participant:participant, data:data.content});
            } else if(data.type == 'webcastEnded') {
                app.event.dispatch('webcastEnded', {participant:participant, data:data.content});
            } else if(data.type == 'parallelWebcastExists') {
                app.event.dispatch('parallelWebcastExists', {participant:participant, data:data.content});
            } else if(data.type == 'online') {
                //log('processDataTrackMessage online')

                if(data.content.micIsEnabled != null) participant.remoteMicIsEnabled = data.content.micIsEnabled;
                if(data.content.cameraIsEnabled != null) participant.remoteCameraIsEnabled = data.content.cameraIsEnabled;
                if(participant.online == false)	{
                    participant.online = true;
                    if(performance.now() - participant.latestOnlineTime < 5000) {
                        participant.reconnectionsCounter = participant.reconnectionsCounter + 1;
                    }
                    participantConnected(participant);
                    if(participant.RTCPeerConnection == null) {
                        participant.RTCPeerConnection = socketParticipantConnected().initPeerConnection(participant);
                    }
                    participant.latestOnlineTime = performance.now();
                } else {
                    participant.latestOnlineTime = performance.now();
                }
            } else if(data.type == 'service') {

                if(data.content.audioNotWork == true && app.localMediaControls.micIsEnabled())	{
                    console.error("Message from participants: microphone doesn't work. Fixing..")
                    app.localMediaControls.disableAudio();
                    app.localMediaControls.enableAudio();
                }
            }
        }

        function checkOnlineStatus() {
            return;
            app.checkOnlineStatusInterval = setInterval(function () {
                var i, participant;
                for (i = 0; participant = roomParticipants[i]; i++){
                    if(participant.isLocal || participant.sid == 'recording') continue;

                    var audioTracks = participant.tracks.filter(function (t) {
                        if(participant.online == false) return;
                        return t.kind == 'audio';
                    });
                    var enabledAudioTracks = audioTracks.filter(function (t) {
                        if(participant.online == false) return;
                        return t.mediaStreamTrack != null && t.mediaStreamTrack.enabled && t.mediaStreamTrack.readyState == 'live';
                    });

                    if(participant.online && performance.now() - participant.latestOnlineTime < 3000) {

                        if(audioTracks.length != 0 && enabledAudioTracks.length == 0 && participant.remoteMicIsEnabled) {
                            log('checkOnlineStatus: MIC DOESN\'T WORK');
                            sendDataTrackMessage('service', {audioNotWork: true});
                            if(socket != null) socket.emit('Streams/webrtc/errorlog', "checkOnlineStatus MIC DOESN'T WORK'");
                        }
                    }

                    var disconnectTime = (options.disconnectTime != null ? options.disconnectTime : 3000);
                    if(participant.reconnectionsCounter != 0) disconnectTime = disconnectTime + (2000 * participant.reconnectionsCounter);

                    if(participant.online && participant.online != 'checking' && participant.latestOnlineTime != null && performance.now() - participant.latestOnlineTime >= disconnectTime) {

                        //log('checkOnlineStatus : prepare to remove due inactivity' + performance.now() - participant.latestOnlineTime);

                        let latestOnlineTime = participant.latestOnlineTime;
                        let participantSid = participant.sid;
                        let _disconnectParticipant = function () {
                            log('checkOnlineStatus : remove due inactivity', participant);
                            var participantToCheck = roomParticipants.filter(function (roomParticipant) {
                                return roomParticipant.sid === participantSid;
                            })[0];
                            if (participantToCheck != null && participantToCheck.latestOnlineTime !== latestOnlineTime) {
                                return;
                            }
                            participantDisconnected(participantToCheck);
                        };
                        if(socket) {
                            log('checkOnlineStatus : confirm whether user is inactive');

                            socket.emit('Streams/webrtc/confirmOnlineStatus', {
                                'type': 'request',
                                'targetSid': participant.sid
                            });

                            participant.online = 'checking';
                            setTimeout(function () {
                                _disconnectParticipant();
                            }, 1000);
                        } else {
                            log('checkOnlineStatus : remove due inactivity', participant);

                            _disconnectParticipant();
                        }
                    } else if (performance.now() - participant.connectedTime >= 1000*60 && participant.reconnectionsCounter != 0){
                        participant.reconnectionsCounter = 0;
                    }
                }
            }, 1000);
        }

        function sendOnlineStatus() {
            app.sendOnlineStatusInterval = setInterval(function () {
                var info = {
                    micIsEnabled: app.localMediaControls.micIsEnabled(),
                    cameraIsEnabled: app.localMediaControls.cameraIsEnabled()
                }
                sendDataTrackMessage('online', info);
            }, 1000);
        }

        function sendDataTrackMessage(type, content) {
            //log("sendDataTrackMessage:", type, content);

            var message = {type:type};
            if(content != null) message.content = content;

            var i, participant;
            for (i = 0; participant = roomParticipants[i]; i++){
                if(participant == localParticipant || (participant.dataTrack == null || participant.dataTrack.readyState != 'open')) continue;
                if (participant.dataTrack != null) participant.dataTrack.send(JSON.stringify(message));
            }

        }

        function participantDisconnected(participant) {
            log("participantDisconnected: ", participant);
            log("participantDisconnected: participant.soundMeter.visualizationAnimation", participant.soundMeter.visualizationAnimation);
            log("participantDisconnected: is online - " + participant.online);
            if(participant.online == false) return;

            //participant.remove();
            if(participant.soundMeter.visualizationAnimation) {
                cancelAnimationFrame(participant.soundMeter.visualizationAnimation);
            }
            if(participant.soundMeter.source != null) participant.soundMeter.source.disconnect();


            participant.online = false;
            if(participant.fbLiveStreamingActive) {
                app.event.dispatch('liveStreamingEnded', participant);
            }

            app.event.dispatch('participantDisconnected', participant);

        }

        function gotIceCandidate(event, existingParticipant){

            log('gotIceCandidate:  event.candidate',  event.candidate)

            if (event.candidate) {
                /*if(event.candidate.candidate.indexOf("relay")<0){ /for testing only (TURN server)
                    return;
                }*/

                log('gotIceCandidate: existingParticipant', existingParticipant)
                log('gotIceCandidate: candidate: ' + event.candidate.candidate)

                sendMessage({
                    type: "candidate",
                    label: event.candidate.sdpMLineIndex,
                    sdpMid: event.candidate.sdpMid,
                    candidate: event.candidate.candidate,
                    id: event.candidate.sdpMid,
                    targetSid: existingParticipant.sid,
                    connection: existingParticipant.connection
                });
            }

            if (event.candidate && event.candidate.candidate.indexOf('srflx') !== -1) {
                var cand = parseCandidate(event.candidate.candidate);
                if (!existingParticipant.candidates[cand.relatedPort]) existingParticipant.candidates[cand.relatedPort] = [];
                existingParticipant.candidates[cand.relatedPort].push(cand.port);
            } else if (!event.candidate) {
                if (Object.keys(existingParticipant.candidates).length === 1) {
                    var ports = existingParticipant.candidates[Object.keys(existingParticipant.candidates)[0]];
                    log('gotIceCandidate: ' + (ports.length === 1 ? 'NAT TYPE: cool nat' : 'NAT TYPE: symmetric nat'));
                }
            }
        }

        function parseCandidate(line) {
            var parts;
            if (line.indexOf('a=candidate:') === 0) {
                parts = line.substring(12).split(' ');
            } else {
                parts = line.substring(10).split(' ');
            }

            var candidate = {
                foundation: parts[0],
                component: parts[1],
                protocol: parts[2].toLowerCase(),
                priority: parseInt(parts[3], 10),
                ip: parts[4],
                port: parseInt(parts[5], 10),
                // skip parts[6] == 'typ'
                type: parts[7]
            };

            for (var i = 8; i < parts.length; i += 2) {
                switch (parts[i]) {
                    case 'raddr':
                        candidate.relatedAddress = parts[i + 1];
                        break;
                    case 'rport':
                        candidate.relatedPort = parseInt(parts[i + 1], 10);
                        break;
                    case 'tcptype':
                        candidate.tcpType = parts[i + 1];
                        break;
                    default: // Unknown extensions are silently ignored.
                        break;
                }
            }
            return candidate;
        };

        function getPCStats() {

            var participants = app.roomParticipants();
            for(let i in participants) {
                let participant = participants[i];
                if(participant.RTCPeerConnection == null) continue;

                participant.RTCPeerConnection.getStats(null).then(stats => {
                    var statsOutput = [];
                    stats.forEach(report => {
                        let reportItem = {};
                        reportItem.reportType = report.type;
                        reportItem.id = report.id;
                        reportItem.timestump = report.timestamp;


                        // Now the statistics for this report; we intentially drop the ones we
                        // sorted to the top above

                        Object.keys(report).forEach(statName => {
                            if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
                                reportItem[statName]= report[statName];
                            }
                        });
                        statsOutput.push(reportItem);

                    });
                    console.log(statsOutput);
                })

            }
        }

        function rawTrackSubscribed(event, existingParticipant){
            log('rawTrackSubscribed ' + event.track.kind, event.track, existingParticipant);

            var track = event.track;
            var trackToAttach = new Track();
            trackToAttach.sid = track.id;
            trackToAttach.kind = track.kind;
            trackToAttach.mediaStreamTrack = track;
            if(event.streams.length != 0) trackToAttach.stream = event.streams[0];

            app.event.dispatch('trackSubscribed', {track:trackToAttach, participant:existingParticipant});

            app.mediaManager.attachTrack(trackToAttach, existingParticipant);
        }

        function rawStreamSubscribed(event, existingParticipant){
            log('rawStreamSubscribed', event, existingParticipant);

            var stream = event.stream;
            var tracks = stream.getTracks();
            log('rawStreamSubscribed: tracks num: ' + tracks);

            for (var t in tracks){
                var track = tracks[t];
                var trackToAttach = new Track();
                trackToAttach.sid = track.sid;
                trackToAttach.kind = track.kind;
                trackToAttach.mediaStreamTrack = track;
                trackToAttach.stream = stream;

                app.mediaManager.attachTrack(trackToAttach, existingParticipant);
            }

        }

        function socketEventManager() {
            socket.on('Streams/webrtc/participantConnected', function (participant){
                log('socket: participantConnected', participant);
                socketParticipantConnected().initPeerConnection(participant);
            });

            socket.on('Streams/webrtc/roomParticipants', function (socketParticipants) {
                console.log('roomParticipants', socketParticipants);

                app.event.dispatch('roomParticipants', socketParticipants);
                var negotiationEnded = 0;
                function onNegotiatingEnd() {
                    log('socketEventManager initNegotiationEnded');
                    app.initNegotiationState = 'ended';
                    app.event.dispatch('initNegotiationEnded', roomParticipants);
                    app.event.off('signalingStageChange', onSignalingStageChange);
                }

                function onSignalingStageChange(e) {
                    log('onNegotiatingEnd: signalingStageChange', e);
                    var existingParticipant = roomParticipants.filter(function (roomParticipant) {
                        return roomParticipant.sid == e.participant.sid;
                    })[0];

                    if(existingParticipant != null && existingParticipant.signalingState.stage == 'answerSent') {
                        negotiationEnded++;
                    }
                    log('onNegotiatingEnd: signalingStageChange negotiationEnded', negotiationEnded, socketParticipants.length);

                    if(negotiationEnded == socketParticipants.length) {
                        onNegotiatingEnd();
                    }

                }

                if(socketParticipants.length != 0) {
                    app.event.on('signalingStageChange', onSignalingStageChange);
                } else {
                    onNegotiatingEnd();
                }
            });

            socket.on('Streams/webrtc/participantDisconnected', function (sid){
                var existingParticipant = roomParticipants.filter(function (roomParticipant) {
                    return roomParticipant.sid == sid;
                })[0];

                log('participantDisconnected', existingParticipant);

                if(existingParticipant != null) {
                    if(existingParticipant.RTCPeerConnection != null) existingParticipant.RTCPeerConnection.close();
                    participantDisconnected(existingParticipant);
                }
            });


            socket.on('Streams/webrtc/signalling', function (message){
                log('signalling message: ' + message.type)
                if (message.type === 'offer') {

                    offerReceived().processOffer(message);
                }
                else if (message.type === 'answer') {
                    answerReceived(message);
                }
                else if (message.type === 'candidate') {
                    iceConfigurationReceived(message);
                }
            });

            socket.on('Streams/webrtc/confirmOnlineStatus', function (message){

                if(message.type == 'request') {
                    log('confirmOnlineStatus REQUEST')

                    socket.emit('Streams/webrtc/confirmOnlineStatus', {
                        'type': 'answer',
                        'targetSid': message.fromSid
                    });
                } else if (message.type == 'answer') {
                    log('GOT confirmOnlineStatus ANSWER')

                    var existingParticipant = roomParticipants.filter(function (roomParticipant) {
                        return roomParticipant.sid == message.fromSid;
                    })[0];

                    existingParticipant.latestOnlineTime = performance.now();
                }
            });

            socket.on('Streams/webrtc/canISendOffer', function (message){

                if(message.type == 'request') {
                    log('got canISendOffer REQUEST');

                    var participant = roomParticipants.filter(function (roomParticipant) {
                        return roomParticipant.sid == message.fromSid;
                    })[0];

                    /*if (participant.isNegotiating === false) {
                        log('got canISendOffer REQUEST: send reverse offer');

                        participant.shouldSendReverseOffer = true;
                        participant.negotiate();
                        participant.shouldSendReverseOffer = false;
                    } else if (participant.isNegotiating === true) {
                        log('got canISendOffer REQUEST: add offer to queue');

                        participant.shouldSendReverseOffer = true;
                    }*/

                    if (participant.isNegotiating === false) {
                        log('got canISendOffer REQUEST: yes, waiting for offer');

                        socket.emit('Streams/webrtc/canISendOffer', {
                            'type': 'answer',
                            'targetSid': message.fromSid,
                            'answerValue': true
                        });
                        participant.waitingForOffer = true;
                    } else if (participant.isNegotiating === true) {
                        log('got canISendOffer REQUEST: add offer to queue');
                        socket.emit('Streams/webrtc/canISendOffer', {
                            'type': 'answer',
                            'targetSid': message.fromSid,
                            'answerValue': false
                        });
                        participant.shouldSendReverseOffer = true;
                    }

                } else if (message.type == 'answer') {
                    log('got canISendOffer ANSWER',message);

                    app.event.dispatch('canISendOffer', message);
                }
            });

            socket.on('Streams/webrtc/canITurnCameraOn', function (message){

                log('got canITurnCameraOn ANSWER', message);

                app.event.dispatch('canITurnCameraOn', message);
            });

            socket.on('Streams/webrtc/canITurnMicOn', function (message){

                log('got canITurnMicOn ANSWER', message);

                app.event.dispatch('canITurnMicOn', message);
            });

            socket.on('Streams/webrtc/getLimitsInfo', function (message){

                log('got getLimitsInfo ANSWER', message);

                app.event.dispatch('getLimitsInfo', message);

            });

            socket.on('Streams/webrtc/requestCamera', function (message){
                log('got requestCamera request', message, localParticipant.sid);
                var participant = roomParticipants.filter(function (roomParticipant) {
                    return roomParticipant.sid == message.fromSid || roomParticipant.sid == '/webrtc#' + message.fromSid;;
                })[0];

                message.participant = participant;

                app.event.dispatch('cameraRequested', message);

            });

            socket.on('Streams/webrtc/requestMic', function (message){
                log('got requestMic request', message, localParticipant.sid);
                var participant = roomParticipants.filter(function (roomParticipant) {
                    return roomParticipant.sid == message.fromSid || roomParticipant.sid == '/webrtc#' + message.fromSid;;
                })[0];

                message.participant = participant;

                app.event.dispatch('micRequested', message);

            });
            socket.on('Streams/webrtc/forceTurnCameraOff', function (message){
                log('got forceTurnCameraOff request');
                app.event.dispatch('forceTurnCameraOff', message);

            });
            socket.on('Streams/webrtc/forceTurnMicOff', function (message){
                log('got forceTurnMicOff request');
                app.event.dispatch('forceTurnMicOff', message);

            });
            socket.on('Streams/webrtc/cancelForceTurnCameraOffTimer', function (message){
                log('got cancelForceTurnCameraOffTimer request');
                app.event.dispatch('cancelForceTurnCameraOffTimer', message);

            });
            socket.on('Streams/webrtc/cancelForceTurnMicOffTimer', function (message){
                log('got cancelForceTurnMicOffTimer request');
                app.event.dispatch('cancelForceTurnMicOffTimer', message);

            });
            socket.on('Streams/webrtc/cameraEnabled', function (message){
                log('got cameraEnabled', message, localParticipant.sid);
                var participant = roomParticipants.filter(function (roomParticipant) {
                    return roomParticipant.sid == message.fromSid || roomParticipant.sid == '/webrtc#' + message.fromSid;
                })[0];

                message.participant = participant;

                participant.localMediaControlsState.camera = true;

                app.event.dispatch('someonesCameraEnabled', message);

            });
            socket.on('Streams/webrtc/cameraDisabled', function (message){
                log('got cameraDisabled', message, localParticipant.sid);
                var participant = roomParticipants.filter(function (roomParticipant) {
                    return roomParticipant.sid == message.fromSid || roomParticipant.sid == '/webrtc#' + message.fromSid;
                })[0];

                message.participant = participant;

                participant.localMediaControlsState.camera = false;

                app.event.dispatch('someonesCameraDisabled', message);

            });
            socket.on('Streams/webrtc/micEnabled', function (message){
                log('got micEnabled', message, localParticipant.sid);
                var participant = roomParticipants.filter(function (roomParticipant) {
                    return roomParticipant.sid == message.fromSid || roomParticipant.sid == '/webrtc#' + message.fromSid;
                })[0];

                message.participant = participant;

                participant.localMediaControlsState.mic = true;

                app.event.dispatch('someonesMicEnabled', message);

            });
            socket.on('Streams/webrtc/micDisabled', function (message){
                log('got micDisabled', message, localParticipant.sid);
                var participant = roomParticipants.filter(function (roomParticipant) {
                    return roomParticipant.sid == message.fromSid || roomParticipant.sid == '/webrtc#' + message.fromSid;
                })[0];

                message.participant = participant;

                participant.localMediaControlsState.mic = false;

                app.event.dispatch('someonesMicDisabled', message);

            });
            socket.on('Streams/webrtc/recording', function (message){
                console.log('Streams/webrtc/recording', message);
                var offer = {
                    type:'offer',
                    sdp: message.connection.localDescription.sdp,
                    info: {usesUnifiedPlan: true},
                    name: 'recording',
                    fromSid: 'recording',
                    connection: {initiatorId: message.initiatorId, connectionId: message.connection.id},
                }
                offerReceived().processOffer(offer);
            });
            var _img;
            var _canvas;
            var _outputCtx;
            socket.on('Streams/webrtc/serverVideo', function (message){
                return;
                console.log('Streams/webrtc/recording', message);

                function createCanvas() {
                    var videoCanvas = document.createElement("CANVAS");
                    videoCanvas.className = "Streams_webrtc_video-stream-canvas";
                    videoCanvas.style.position = 'absolute';
                    videoCanvas.style.top = '-999999999px';
                    //videoCanvas.style.top = '0';
                    videoCanvas.style.left = '0';
                    videoCanvas.style.zIndex = '9999999999999999999';
                    videoCanvas.style.backgroundColor = 'transparent';
                    videoCanvas.width = 2000;
                    videoCanvas.height = 600;

                    _outputCtx = videoCanvas.getContext('2d');

                    _canvas = videoCanvas;
                    document.body.appendChild(_canvas);

                }
                function createFrameCanvas(data, width, height) {
                    var frameCanvas = document.createElement("CANVAS");
                    frameCanvas.className = "Streams_webrtc_video-stream-canvas";
                    frameCanvas.style.position = 'absolute';
                    frameCanvas.style.top = '-999999999px';
                    //frameCanvas.style.top = '0';
                    frameCanvas.style.left = '0';
                    frameCanvas.style.zIndex = '9999999999999999999';
                    frameCanvas.width = width;
                    frameCanvas.height = height;
                    var offCtx = frameCanvas.getContext('2d');
                    var frameImageData = new ImageData(new Uint8ClampedArray(data), width, height);
                    offCtx.putImageData(frameImageData, 0, 0);
                    return frameCanvas;
                }

                function createImg() {
                    _img = document.createElement("IMG");
                    document.body.appendChild(_img);
                }

                if(_canvas == null) createCanvas();
                //_canvas.width = message.size.width;
                //_canvas.height = message.size.height;

                let frameCanvas = createFrameCanvas(message.data, message.size.width, message.size.height);
                _outputCtx.drawImage(frameCanvas, 0, 0);
                //var iData = new ImageData(new Uint8ClampedArray(message.data), message.size.width, message.size.height);
                //_outputCtx.putImageData(iData, 0, 0);
                /*if(_img == null) {
                    createImg();

                    var arrayBuffer = message.data;
                    var bytes = new Uint8Array(arrayBuffer);
                    var blob = new Blob([bytes.buffer]);

                    var image = _img;

                    var reader = new FileReader();
                    reader.onload = function (e) {
                        image.src = e.target.result;
                    };
                    reader.readAsDataURL(blob);
                }*/
                //var imageUrl = urlCreator.createObjectURL( blob );

                //_img.src = imageUrl;
            });
            window.WebRTCSocket = socket;
        }

        function setH264AsPreffered(description) {
            description = description.replace(/VP8/g, "H264");
            return description;
        }

        function removeVP8(desc) {
            var rep = (s, match, s2) => s.replace(new RegExp(match, "g"), s2);

            var sdp = desc.sdp;
            var id;
            var sdp = sdp.replace(/a=rtpmap:([0-9]{0,3}) VP8\/90000\r\n/g,
                (match, n) => (id = n, ""));
            if (parseInt(id) < 1) throw new Error("No VP8 id found");

            sdp = rep(sdp, "m=video ([0-9]+) RTP\\/SAVPF ([0-9 ]*) "+ id,
                "m=video $1 RTP\/SAVPF $2");
            sdp = rep(sdp, "m=video ([0-9]+) RTP\\/SAVPF "+ id +"([0-9 ]*)",
                "m=video $1 RTP\/SAVPF$2");
            sdp = rep(sdp, "m=video ([0-9]+) UDP\\/TLS\\/RTP\\/SAVPF ([0-9 ]*) "+ id,
                "m=video $1 UDP\/TLS\/RTP\/SAVPF $2");
            sdp = rep(sdp, "m=video ([0-9]+) UDP\\/TLS\\/RTP\\/SAVPF "+ id +"([0-9 ]*)",
                "m=video $1 UDP\/TLS\/RTP\/SAVPF$2");
            sdp = rep(sdp, "a=rtcp-fb:"+ id +" nack\r\n", "");
            sdp = rep(sdp, "a=rtcp-fb:"+ id +" nack pli\r\n", "");
            sdp = rep(sdp, "a=rtcp-fb:"+ id +" ccm fir\r\n","");
            sdp = rep(sdp,
                "a=fmtp:"+ id +" PROFILE=0;LEVEL=0;packetization-mode=0;level-asymmetry-allowed=0;max-fs=12288;max-fr=60;parameter-add=1;usedtx=0;stereo=0;useinbandfec=0;cbr=0\r\n",
                "");
            desc.sdp = sdp;

            return desc;
        }

        function createOfferAndRenegotiate() {
            log('createOfferAndRenegotiate');
            for (let p in roomParticipants) {
                let peerConnection = roomParticipants[p].RTCPeerConnection;

                if (!roomParticipants[p].isLocal && peerConnection != null) {
                    peerConnection.createOffer({ 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true })
                        .then(function(offer) {
                            //offer.sdp = setH264AsPreffered(offer.sdp);
                            let localDescription;
                            if(typeof cordova != 'undefined' && _isiOS) {
                                localDescription = new RTCSessionDescription(offer);
                            } else {
                                localDescription = offer;
                            }
                            return peerConnection.setLocalDescription(localDescription).then(function () {
                                //var sdp = setH264AsPreffered(newPeerConnection.localDescription.sdp)
                                sendMessage({
                                    name: localParticipant.identity,
                                    targetSid: roomParticipants[p].sid,
                                    type: "offer",
                                    sdp: peerConnection.localDescription.sdp
                                });
                                //newPeerConnection._negotiating = false;
                            });
                        })
                        .catch(function(error) {
                            console.error(error.name + ': ' + error.message);
                        });
                }
            }

        }

        function socketParticipantConnected() {

            function createPeerConnection(participant, resetConnection) {
                log('createPeerConnection', participant, resetConnection)
                var config = pc_config;
                if(!participant.localInfo.usesUnifiedPlan) config.sdpSemantics = "plan-b";
                log('createPeerConnection: usesUnifiedPlan = '+ participant.localInfo.usesUnifiedPlan);

                var newPeerConnection = new RTCPeerConnection(config);

                function createOffer(hasPriority, resetConnection){
                    log('createOffer', resetConnection, participant.username, participant.identity, participant.sid)

                    participant.isNegotiating = true;
                    participant.currentOfferId = hasPriority;

                    if(!resetConnection) {
                        participant.signalingState.setStage('offerCreating');
                    } else {
                        participant.signalingState.setStage('initialOfferCreating');
                        publishMedia();
                    }

                    let micEnabled = app.localMediaControls.micIsEnabled();
                    let cameraEnabled = app.localMediaControls.cameraIsEnabled();
                    log('createOffer: micEnabled: ' + micEnabled + ', cameraEnabled: ' + cameraEnabled);

                    newPeerConnection.createOffer({ 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true })
                        .then(function(offer) {
                            log('createOffer: offer created', hasPriority, participant.hasNewOffersInQueue, participant.currentOfferId, participant.RTCPeerConnection.signalingState, offer)

                            if(participant.signalingState.stage == 'offerReceived' && participant.signalingRole == 'impolite')  {
                                log('createOffer: offer created: cancel local offer due incoming offer');
                                return;
                            }
                            participant.signalingState.setStage('offerCreated');

                            //In the case when renegotiationneeded was triggered right after initial offer was created
                            //this cancels initial offer before signalingState will be changed to have-local-offer
                            /*if(participant.hasNewOffersInQueue !== false && hasPriority == null) {
								console.log('createOffer: offer created: offer was canceled by new one');
								return;
							}*/

                            //In case, when multiple renegotiationneeded events was triggered one after another,
                            //this will cancel all offers but last. It's highly unlikely that this scenario will ever happen.
                            if(participant.hasNewOffersInQueue !== false && hasPriority != null && participant.hasNewOffersInQueue > hasPriority && !resetConnection) {
                                log('createOffer: offer created: RENEGOTIATING WAS CANCELED as priority: ' + hasPriority + '/' + participant.hasNewOffersInQueue);
                                return;
                            }



                            var localDescription;
                            if(typeof cordova != 'undefined' && _isiOS) {
                                localDescription = new RTCSessionDescription(offer);
                            } else {
                                localDescription = offer;
                            }

                            //for testing only
                            //localDescription.sdp = removeNotRelayCandidates(offer.sdp);

                            /*if(_isiOS){
								localDescription.sdp = removeInactiveTracksFromSDP(localDescription.sdp);
								log('createOffer: removeInactiveTracksFromSDP', localDescription.sdp)
							}*/
                            log('createOffer: sdp', localDescription.sdp)


                            return newPeerConnection.setLocalDescription(localDescription).then(function () {
                                log('createOffer: offer created: sending', participant.hasNewOffersInQueue, participant.currentOfferId, participant.RTCPeerConnection.signalingState);
                                participant.signalingState.setStage('offerSent');
                                sendMessage({
                                    name: localParticipant.identity,
                                    targetSid: participant.sid,
                                    type: "offer",
                                    resetConnection: resetConnection == true ? true : false,
                                    sdp: newPeerConnection.localDescription.sdp,
                                    connection: participant.connection != null ? participant.connection : null
                                });
                            });
                        })
                        .catch(function(error) {
                            console.error(error.name + ': ' + error.message);
                        });
                }

                function incrementOffersQueue() {
                    if(participant.currentOfferId !== false && participant.hasNewOffersInQueue == false){
                        participant.hasNewOffersInQueue = participant.currentOfferId + 1;
                    } else {
                        participant.hasNewOffersInQueue = participant.hasNewOffersInQueue !== false ? participant.hasNewOffersInQueue + 1 : 0;
                    }
                }
                participant.incrementOffersQueue = incrementOffersQueue;

                function negotiate() {
                    log('negotiate START', participant.signalingState.stage, newPeerConnection.signalingState, participant.isNegotiating, participant.hasNewOffersInQueue,  participant.currentOfferId, participant.shouldSendReverseOffer);

                    if((participant.signalingRole == 'impolite' && participant.waitingForOffer) || (participant.signalingRole == 'polite' && participant.waitingForReverseOffer)) {
                        log('negotiate CANCELING NEGOTIATION: waitingForOffer');
                        return;
                    }

                    var startNegotiating = function () {
                        log('negotiate CHEK', participant.isNegotiating && participant.signalingState.stage != 'offerCreating' && participant.signalingState.stage != 'initialOfferCreating');
                        log('negotiate CHEK2', participant.isNegotiating, participant.signalingState.stage != 'offerCreating', participant.signalingState.stage != 'initialOfferCreating');

                        if(participant.isNegotiating && (participant.signalingState.stage != 'offerCreating' || participant.signalingState.stage == 'initialOfferCreating')) {
                            log('negotiate CANCELING NEGOTIATION');

                            incrementOffersQueue();
                            return;
                        }

                        incrementOffersQueue();


                        log('negotiate CONTINUE', participant.hasNewOffersInQueue)
                        //if(newPeerConnection.connectionState == 'new' && newPeerConnection.iceConnectionState == 'new' && newPeerConnection.iceGatheringState == 'new') return;

                        createOffer(participant.hasNewOffersInQueue);
                        if(participant.shouldSendReverseOffer) participant.shouldSendReverseOffer = false;
                    }

                    //startNegotiating();

                    if(participant.signalingRole == 'impolite' && !participant.isNegotiating && participant.sid != 'recording') {

                        if((_localInfo.browserName == 'Chrome' && _localInfo.browserVersion >= 80) || _localInfo.browserName == 'Firefox' || participant.sid == 'recording') {
                            log('negotiate: browser supports rollback');
                            startNegotiating();
                        } else {
                            log('negotiate: ask permission for offer');
                            canISendOffer(participant).then(function (order) {
                                if (order === true) {
                                    startNegotiating();
                                } else {
                                    participant.hasNewOffersInQueue = false;
                                    participant.waitingForReverseOffer = true;
                                }

                            });
                        }
                        return;
                    } else {
                        startNegotiating();
                    }

                }
                participant.negotiate = negotiate;

                function publishMedia() {
                    log('createPeerConnection: publishMedia')

                    var localTracks = localParticipant.tracks;

                    //we can eliminate checking whether .cameraIsEnabled() as all video tracks are stopped when user switches camera or screensharing off.
                    if('ontrack' in newPeerConnection){
                        for (var t in localTracks) {
                            log('createPeerConnection: add track ' + localTracks[t].kind)

                            if (localTracks[t].kind == 'video') newPeerConnection.addTrack(localTracks[t].mediaStreamTrack, localTracks[t].stream);
                        }

                    } else {
                        log('createPeerConnection: add videoStream - ' + (localParticipant.videoStream != null))
                        if(localParticipant.videoStream != null) newPeerConnection.addStream(localParticipant.videoStream);
                    }

                    //we must check whether .micIsEnabled() we don't .do mediaStreamTrack.stop() for iOS as stop() cancels access to mic, and both stop() and enabled = false affect audio visualization.
                    //So we need to check if micIsEnabled() to avoid cases when we add audio tracks while user's mic is turned off.
                    if(app.localMediaControls.micIsEnabled()){

                        if('ontrack' in newPeerConnection){
                            for (var t in localTracks) {
                                log('createPeerConnection: add track ' + localTracks[t].kind)

                                if(localTracks[t].kind == 'audio') newPeerConnection.addTrack(localTracks[t].mediaStreamTrack, localTracks[t].stream);
                            }

                        } else {
                            log('createPeerConnection: add videoStream - ' + (localParticipant.videoStream != null))

                            if(localParticipant.audioStream != null) newPeerConnection.addStream(localParticipant.audioStream);
                        }
                    }
                }

                newPeerConnection.addEventListener("icecandidateerror", (event) => {
                    log('socketParticipantConnected: icecandidateerror');
                    console.error(event);
                });


                newPeerConnection.onsignalingstatechange = function (e) {
                    log('socketParticipantConnected: onsignalingstatechange = ' + newPeerConnection.signalingState, participant.signalingState.state, participant.hasNewOffersInQueue, participant.currentOfferId)


                    if(newPeerConnection.signalingState == 'stable') {

                        if(participant.signalingState.state == 'have-remote-offer' || participant.signalingState.state == 'have-local-offer') {
                            /*
							(participant.hasNewOffersInQueue !== false && participant.currentOfferId === false)
								if I have incoming offer when onnegotiationneeded event triggered
							(participant.hasNewOffersInQueue !== false && participant.currentOfferId !== false && participant.hasNewOffersInQueue > participant.currentOfferId)
								if I created offer but negotiating still was in progress when onnegotiationneeded event triggered
							*/
                            if((participant.hasNewOffersInQueue !== false && participant.currentOfferId !== false && participant.hasNewOffersInQueue > participant.currentOfferId)
                                || (participant.hasNewOffersInQueue !== false && participant.currentOfferId === false)
                            /*|| participant.shouldSendReverseOffer*/) {
                                log('socketParticipantConnected: STARTING NEW NEGOTIATION AGAIN ', participant.hasNewOffersInQueue, participant.currentOfferId)

                                participant.isNegotiating = false;
                                participant.currentOfferId = false;
                                participant.signalingState.setStage(null);

                                participant.negotiate();
                            } else {
                                participant.hasNewOffersInQueue = false;
                                participant.isNegotiating = false;
                                participant.currentOfferId = false;
                                participant.signalingState.setStage(null);
                            }
                        }

                        log('addCandidatesFromQueue: canTrickleIceCandidates = ' + newPeerConnection.canTrickleIceCandidates)

                        for(let i = participant.iceCandidatesQueue.length - 1; i >= 0 ; i--){
                            let cand = participant.iceCandidatesQueue[i].candidate
                            log('socketParticipantConnected: onsignalingstatechange: add candidates from queue ' + i)
                            if(participant.iceCandidatesQueue[i] != null) {
                                log('socketParticipantConnected: onsignalingstatechange: add candidate' + participant.iceCandidatesQueue[i].candidate.candidate)

                                newPeerConnection.addIceCandidate(participant.iceCandidatesQueue[i].candidate).catch(function(error) {
                                    console.error(error.name + ': ' + error.message, cand.candidate);
                                });
                                participant.iceCandidatesQueue[i] = null;

                                participant.iceCandidatesQueue.splice(i, 1);
                            }
                        }
                    }

                    participant.signalingState.state = newPeerConnection.signalingState;
                };

                newPeerConnection.oniceconnectionstatechange = function (e) {
                    log('socketParticipantConnected: oniceconnectionstatechange = ' + newPeerConnection.iceConnectionState)

                    if(newPeerConnection.iceConnectionState == 'connected' || newPeerConnection.iceConnectionState == 'completed') {
                        //participant.isNegotiating = false;
                    }


                };
                newPeerConnection.onconnectionstatechange = function (e) {
                    log('socketParticipantConnected: onconnectionstatechange = ' + newPeerConnection.connectionState)
                    if(newPeerConnection.iceConnectionState == 'closed') {
                        participantDisconnected(participant);
                    }
                };

                newPeerConnection.onicecandidate = function (e) {
                    gotIceCandidate(e, participant);
                };

                newPeerConnection.ondatachannel = function (evt) {
                    log('socketParticipantConnected: ondatachannel', participant);
                    participant.dataTrack = evt.channel;
                    setChannelEvents(evt.channel, participant);
                };

                if('ontrack' in newPeerConnection) {
                    newPeerConnection.ontrack = function (e) {
                        rawTrackSubscribed(e, participant);
                    };
                } else {
                    newPeerConnection.onaddstream = function (e) {
                        rawStreamSubscribed(e, participant);
                    };
                }

                newPeerConnection.onnegotiationneeded = function (e) {
                    log('socketParticipantConnected: onnegotiationneeded, negotiating = ' + participant.isNegotiating);
                    log('socketParticipantConnected: onnegotiationneeded, sdp ' + (newPeerConnection.localDescription ? newPeerConnection.localDescription.sdp : 'n/a'));

                    negotiate();
                };

                function createDataChannel() {
                    if(participant.dataTrack != null) participant.dataTrack.close();
                    var dataChannel = newPeerConnection.createDataChannel('mainDataChannel' + Date.now(), {reliable: false})
                    setChannelEvents(dataChannel, participant);
                    participant.dataTrack = dataChannel;
                    var sendInitialData = function(){
                        if(app.mediaManager.fbLive.isStreaming()) {
                            //app.signalingDispatcher.sendDataTrackMessage("liveStreamingStarted");
                            dataChannel.send(JSON.stringify({type:"liveStreamingStarted"}));
                        }

                        var screensharingTracks = localParticipant.tracks.filter(function(t){
                            return t.screensharing == true && t.mediaStreamTrack.enabled == true && t.mediaStreamTrack.readyState == 'live' ? true : false
                        })

                        if(screensharingTracks.length != 0) {
                            app.signalingDispatcher.sendDataTrackMessage("screensharingStarted", {trackId:screensharingTracks[0].mediaStreamTrack.id});
                        }

                        dataChannel.removeEventListener('open', sendInitialData);
                    }
                    dataChannel.addEventListener('open', sendInitialData);

                    if(participant.dataTracks == null) {
                        participant.dataTracks = [];
                    }
                    participant.dataTracks.push(dataChannel);
                }
                createDataChannel();

                participant.createDataChannel = createDataChannel;

                createOffer(9999, true);

                return newPeerConnection;
            }

            function init(participantData) {
                var senderParticipant = roomParticipants.filter(function (existingParticipant) {
                    return existingParticipant.sid == participantData.fromSid && existingParticipant.RTCPeerConnection;
                })[0];
                log('socketParticipantConnected', participantData);

                if((senderParticipant == null && senderParticipant != localParticipant) || (senderParticipant != null && senderParticipant.online == false)) {
                    log('socketParticipantConnected: newParticipant', senderParticipant == null);
                    var newParticipant = new Participant();
                    newParticipant.iosrtc = true;
                    newParticipant.sid = participantData.sid || participantData.fromSid;
                    newParticipant.identity = participantData.username;
                    newParticipant.localInfo = participantData.info;
                    participantConnected(newParticipant);

                    var localRollbackSupport = (_localInfo.browserName == 'Chrome' && _localInfo.browserVersion >= 80) || _localInfo.browserName == 'Firefox';
                    var remoteRollbackSupport = (participantData.info.browserName == 'Chrome' && participantData.info.browserVersion >= 80) || participantData.info.browserName == 'Firefox';

                    if((localRollbackSupport && remoteRollbackSupport) || (!localRollbackSupport && remoteRollbackSupport) || (!localRollbackSupport && !remoteRollbackSupport)) {
                        newParticipant.signalingRole = 'polite';
                        //newParticipant.signalingRole = 'impolite';
                        log('socketParticipantConnected: signalingRole: polite');

                    } else {
                        newParticipant.signalingRole = 'impolite';
                        //newParticipant.signalingRole = 'polite';
                        log('socketParticipantConnected: signalingRole: impolite');

                    }

                    newParticipant.RTCPeerConnection = createPeerConnection(newParticipant, true);
                }
            }

            function initFromThatSide(participant) {
                log('initFromThatSide');

                socket.emit('Streams/webrtc/sendInitialOffer', {
                    targetSid: participant.sid,
                    type: "request",
                });
            }

            return {
                initPeerConnection: init
            }
        }

        function setChannelEvents(dataChannel, participant) {
            log('setChannelEvents', dataChannel.id);
            dataChannel.onerror = function (err) {
                console.error(err);
            };
            dataChannel.onclose = function () {
                log('dataChannel closed', dataChannel.id, participant.online, participant);
            };
            dataChannel.onmessage = function (e) {
                processDataTrackMessage(e.data, participant);
            };
            dataChannel.onopen = function (e) {
                log('dataChannel opened', participant.online, participant);

            };
        }

        function removeInactiveTracksFromSDP(sdp) {
            var activeTrack = localParticipant.tracks.filter(function(t) {
                return t.kind == 'video' && t.mediaStreamTrack.enabled == true && t.mediaStreamTrack.readyState == 'live';
            })[0];

            //if(activeTrack == null) return;

            if(activeTrack != null) var activeTrackId = activeTrack.mediaStreamTrack.id;

            function getTrackFromSDP(startLine) {
                var trackDesc = [];
                trackDesc.push(sdpLines[startLine]);
                var line;
                var endLine;
                for(line = startLine+1; line < sdpLines.length - 1; line++) {
                    if(sdpLines[line].indexOf(' label:') == -1 ) {
                        trackDesc.push(sdpLines[line]);
                    } else {
                        trackDesc.push(sdpLines[line]);
                        endLine = line;
                        break;
                    }
                }
                return {
                    startLine: startLine,
                    endLine: endLine,
                    trackDesc: trackDesc
                }
            }

            var sdpLines = (sdp).split("\n");

            var tracksKind;
            var startLineOfVideoSection;
            var tracks = [];
            for(var i = 0; i < sdpLines.length - 1; i++) {
                let line = sdpLines[i];
                if(line.indexOf('m=audio') != -1) tracksKind = 'audio';
                if(line.indexOf('m=video') != -1) {
                    tracksKind = 'video';
                    startLineOfVideoSection = i;
                }

                if(line.indexOf('ssrc-group:FID') != -1 || line.indexOf('cname:') != -1) {
                    var trackDesc = getTrackFromSDP(i);

                    trackDesc.kind = tracksKind;
                    tracks.push(trackDesc);
                    i = trackDesc.endLine;
                }
            }

            var tracksToRemove
            if(activeTrackId) {
                tracksToRemove = tracks.filter(function (t) {
                    if(t.kind == 'audio') return false;
                    for (i in t.trackDesc) {
                        if (t.trackDesc[i].indexOf(activeTrackId) != -1) return false;
                    }
                    return true;
                })
            } else {
                tracksToRemove = tracks.filter(function (t) {
                    if(t.kind == 'video')
                        return true;
                    else return false;
                });
            }

            if(tracksToRemove.length == 0) return sdp;

            if(tracks.length == tracksToRemove.length) {
                sdpLines.splice(startLineOfVideoSection, tracksToRemove[tracksToRemove.length - 1].endLine)
            } else {
                for(var r in tracksToRemove) {
                    var ttr = tracksToRemove[r];
                    for(var i = ttr.startLine; i <= ttr.endLine; i++){
                        sdpLines[i] = null;
                    }
                }

                sdpLines = sdpLines.filter(function(l) {
                    return l != null;
                }).join('\n')
            }

            return sdp;
        }

        //for testing only
        function removeNotRelayCandidates(sdp) {
            //console.log('removeNotRelayCandidates sdp', sdp);
            var sdpLines = (sdp).split("\n");
            //console.log('removeNotRelayCandidates sdpLines', sdpLines);
            for (let i = sdpLines.length - 1; i >= 0; i--) {
                let line = sdpLines[i];
                if(line.startsWith('a=candidate') && line.indexOf('relay') == -1) {
                    sdpLines.splice(i, 1);
                }
            }
            //console.log('removeNotRelayCandidates sdpLines2', sdpLines);

            sdp = sdpLines.filter(function(l) {
                return l != null;
            }).join('\n')

            return sdp;
        }

        function offerReceived() {

            function createPeerConnection(senderParticipant) {
                var config = pc_config;
                if(!senderParticipant.localInfo.usesUnifiedPlan) config.sdpSemantics = "plan-b";
                log('config.sdpSemantics', config.sdpSemantics)

                var newPeerConnection = new RTCPeerConnection(config);

                function createOffer(hasPriority){
                    //if (newPeerConnection._negotiating == true) return;
                    log('createOffer', senderParticipant.username, senderParticipant.identity, senderParticipant.sid)
                    senderParticipant.isNegotiating = true;
                    senderParticipant.currentOfferId = hasPriority;
                    senderParticipant.signalingState.setStage('offerCreating');

                    newPeerConnection.createOffer({ 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true })
                        .then(function(offer) {
                            log('createOffer: offer created', senderParticipant.hasNewOffersInQueue, senderParticipant.currentOfferId, senderParticipant.RTCPeerConnection.signalingState, offer)
                            senderParticipant.signalingState.setStage('offerCreated');

                            //In case, when multiple renegotiationneeded events was triggered one after another,
                            //this will cancel all offers but last. It's highly unlikely that this scenario will ever happen.
                            if(senderParticipant.hasNewOffersInQueue !== false && hasPriority != null && senderParticipant.hasNewOffersInQueue > hasPriority) {
                                log('createOffer: offer created: RENEGOTIATING WAS CANCELED as priority: ' + hasPriority + '/' + senderParticipant.hasNewOffersInQueue);
                                return;
                            }

                            var localDescription;
                            if(typeof cordova != 'undefined' && _isiOS) {
                                localDescription = new RTCSessionDescription(offer);
                            } else {
                                localDescription = offer;
                            }

                            /*if(_isiOS){
								localDescription.sdp = removeInactiveTracksFromSDP(localDescription.sdp);
								log('createOffer: removeInactiveTracksFromSDP', localDescription.sdp)
							}*/
                            log('createOffer: sdp', localDescription.sdp)


                            return newPeerConnection.setLocalDescription(localDescription).then(function () {
                                log('createOffer: offer created: sending', senderParticipant.hasNewOffersInQueue, senderParticipant.currentOfferId, senderParticipant.RTCPeerConnection.signalingState);
                                senderParticipant.signalingState.setStage('offerSent');

                                sendMessage({
                                    name: localParticipant.identity,
                                    targetSid: senderParticipant.sid,
                                    type: "offer",
                                    sdp: senderParticipant.RTCPeerConnection.localDescription.sdp,
                                    connection: senderParticipant.connection != null ? senderParticipant.connection : null
                                });
                            });
                        })
                        .catch(function(error) {
                            console.error(error.name + ': ' + error.message);
                        });
                }

                function incrementOffersQueue() {
                    if(senderParticipant.currentOfferId !== false && senderParticipant.hasNewOffersInQueue == false){
                        senderParticipant.hasNewOffersInQueue = senderParticipant.currentOfferId + 1;
                    } else {
                        senderParticipant.hasNewOffersInQueue = senderParticipant.hasNewOffersInQueue !== false ? senderParticipant.hasNewOffersInQueue + 1 : 0;
                    }
                }
                senderParticipant.incrementOffersQueue = incrementOffersQueue;

                function negotiate() {
                    log('negotiate START', senderParticipant.signalingRole , newPeerConnection.signalingState, senderParticipant.isNegotiating, senderParticipant.hasNewOffersInQueue,  senderParticipant.currentOfferId, senderParticipant.shouldSendReverseOffer);

                    //anti glare experiment
                    if((senderParticipant.signalingRole == 'impolite' && senderParticipant.waitingForOffer) || (senderParticipant.signalingRole == 'polite' && senderParticipant.waitingForReverseOffer)) {
                        log('negotiate CANCELING NEGOTIATION: waitingForOffer');
                        return;
                    }

                    var startNegotiating = function () {
                        if(senderParticipant.isNegotiating && senderParticipant.signalingState.stage != 'offerCreating') {
                            log('negotiate CANCELING NEGOTIATION');

                            incrementOffersQueue();
                            return;
                        }

                        incrementOffersQueue();


                        log('negotiate CONTINUE', senderParticipant.hasNewOffersInQueue)
                        //if(newPeerConnection.connectionState == 'new' && newPeerConnection.iceConnectionState == 'new' && newPeerConnection.iceGatheringState == 'new') return;

                        createOffer(senderParticipant.hasNewOffersInQueue);
                        if(senderParticipant.shouldSendReverseOffer) senderParticipant.shouldSendReverseOffer = false;
                    }

                    //startNegotiating();

                    if(senderParticipant.signalingRole == 'impolite' && !senderParticipant.isNegotiating && senderParticipant.sid != 'recording') {

                        if((_localInfo.browserName == 'Chrome' && _localInfo.browserVersion >= 80) || _localInfo.browserName == 'Firefox') {
                            log('negotiate: browser supports rollback');
                            startNegotiating();
                        } else {
                            log('negotiate: ask permission for offer');
                            canISendOffer(senderParticipant).then(function (order) {
                                if (order === true) {
                                    startNegotiating();
                                } else {
                                    senderParticipant.hasNewOffersInQueue = false;
                                    senderParticipant.waitingForReverseOffer = true;
                                }

                            });
                        }
                        return;
                    } else {
                        startNegotiating();
                    }
                }

                if('ontrack' in newPeerConnection) {
                    newPeerConnection.ontrack = function (e) {
                        rawTrackSubscribed(e, senderParticipant);
                    };
                } else {
                    newPeerConnection.onaddstream = function (e) {
                        rawStreamSubscribed(e, senderParticipant);
                    };
                }

                newPeerConnection.ondatachannel = function (evt) {
                    log('offerReceived: ondatachannel', senderParticipant);
                    senderParticipant.dataTrack = evt.channel;
                    setChannelEvents(evt.channel, senderParticipant);
                };

                newPeerConnection.onsignalingstatechange = function (e) {
                    log('offerReceived: onsignalingstatechange: ' + newPeerConnection.signalingState, e);

                    if(newPeerConnection.signalingState == 'stable') {
                        if(senderParticipant.signalingState.state == 'have-remote-offer' || senderParticipant.signalingState.state == 'have-local-offer') {
                            if((senderParticipant.hasNewOffersInQueue !== false && senderParticipant.currentOfferId !== false && senderParticipant.hasNewOffersInQueue > senderParticipant.currentOfferId)
                                || (senderParticipant.hasNewOffersInQueue !== false && senderParticipant.currentOfferId === false)
                            /*|| senderParticipant.shouldSendReverseOffer*/) {
                                log('offerReceived: answer sent: STARTING NEW NEGOTIATION AGAIN ', senderParticipant.hasNewOffersInQueue, senderParticipant.currentOfferId)

                                senderParticipant.isNegotiating = false;
                                senderParticipant.currentOfferId = false;
                                senderParticipant.signalingState.setStage(null);
                                senderParticipant.negotiate();
                            } else {
                                senderParticipant.hasNewOffersInQueue = false;
                                senderParticipant.isNegotiating = false;
                                senderParticipant.currentOfferId = false;
                                senderParticipant.signalingState.setStage(null);
                            }
                        }

                        for(var i = senderParticipant.iceCandidatesQueue.length - 1; i >= 0 ; i--){
                            if(senderParticipant.iceCandidatesQueue[i] != null) {
                                newPeerConnection.addIceCandidate(senderParticipant.iceCandidatesQueue[i].candidate);
                                senderParticipant.iceCandidatesQueue[i] = null;


                                senderParticipant.iceCandidatesQueue.splice(i, 1);
                            }
                        }
                    }

                    senderParticipant.signalingState.state = newPeerConnection.signalingState;

                };

                newPeerConnection.onconnectionstatechange = function (e) {
                    log('offerReceived: onconnectionstatechange: ' + newPeerConnection.connectionState);

                    if(newPeerConnection.connectionState == 'connected') {
                        //senderParticipant.isNegotiating = false;
                    }
                    if(newPeerConnection.iceConnectionState == 'closed') {
                        participantDisconnected(senderParticipant);
                    }

                };

                newPeerConnection.onicecandidate = function (e) {
                    gotIceCandidate(e, senderParticipant);
                };

                senderParticipant.negotiate = negotiate;

                newPeerConnection.onnegotiationneeded = function (e) {
                    log('offerReceived: onnegotiationneeded, isNegotiating = ' + senderParticipant.isNegotiating);
                    log('offerReceived: onnegotiationneeded, current sdp ' + (newPeerConnection.localDescription ? newPeerConnection.localDescription.sdp : 'n/a'))
                    negotiate();
                };

                return newPeerConnection;

            }

            function publishLocalAudio(RTCPeerConnection){
                var localTracks = localParticipant.tracks;
                log('offerReceived: publishLocalAudio:  micIsEnabled = ' + (app.localMediaControls.micIsEnabled()));

                if(app.localMediaControls.micIsEnabled()){
                    var audioSenders = RTCPeerConnection.getSenders().filter(function (sender) {
                        return sender.track && sender.track.kind == 'audio';
                    });

                    var cancel = false;
                    for(var s = audioSenders.length - 1; s >= 0 ; s--){

                        for(let i = localParticipant.tracks.length - 1; i >= 0 ; i--){
                            if(localParticipant.tracks[i].mediaStreamTrack.id == audioSenders[s].track.id) {
                                cancel = true;
                            }
                        }
                    }
                    if(cancel) return;

                    if ('ontrack' in RTCPeerConnection) {
                        for (let t in localTracks) {
                            log('offerReceived: publishLocalAudio: add audioTrack');
                            if(localTracks[t].kind == 'audio') RTCPeerConnection.addTrack(localTracks[t].mediaStreamTrack, localTracks[t].stream);
                        }
                    } else {
                        if (localParticipant.audioStream != null) {
                            log('offerReceived: publishLocalAudio: add audioStream');
                            RTCPeerConnection.addStream(localParticipant.audioStream);
                        }
                    }

                }
            }

            function publishLocalVideo(RTCPeerConnection) {
                var localTracks = localParticipant.tracks;
                log('offerReceived: publishLocalVideo: cameraIsEnabled = ' + (app.localMediaControls.cameraIsEnabled()));
                try {
                    var err = (new Error);
                    console.log(err.stack);
                } catch (e) {

                }

                //if(app.localMediaControls.cameraIsEnabled()){
                if ('ontrack' in RTCPeerConnection) {
                    for (let t in localTracks) {
                        log('offerReceived: publishLocalAudio: add videoTrack');
                        if (localTracks[t].kind == 'video') RTCPeerConnection.addTrack(localTracks[t].mediaStreamTrack, localTracks[t].stream);
                    }

                } else {
                    if (localParticipant.videoStream != null) {
                        log('offerReceived: publishLocalAudio: add videoStream');
                        RTCPeerConnection.addStream(localParticipant.videoStream);
                    }
                }
                //}
            }

            function creteEmptyVideoTrack(width, height) {
                if(typeof width == 'undefined') width = 640;
                if(typeof height == 'undefined') height = 480;

                let canvas = Object.assign(document.createElement("canvas"), {width, height});
                canvas.getContext('2d').fillRect(0, 0, width, height);
                let stream = canvas.captureStream();
                return Object.assign(stream.getVideoTracks()[0], {enabled: false});


            }
            function creteEmptyAudioTrack(width, height) {
                if(typeof width == 'undefined') width = 640;
                if(typeof height == 'undefined') height = 480;

                let canvas = Object.assign(document.createElement("canvas"), {width, height});
                canvas.getContext('2d').fillRect(0, 0, width, height);
                let stream = canvas.captureStream();
                return Object.assign(stream.getVideoTracks()[0], {enabled: false});

            }

            function process(message) {
                log('offerReceived fromSid', message.fromSid);
                log('offerReceived resetConnection', message.resetConnection);
                log('offerReceived ' + message.sdp);

                var senderParticipant = roomParticipants.filter(function (existingParticipant) {
                    return existingParticipant.sid == message.fromSid && existingParticipant.RTCPeerConnection;
                })[0];
                if(senderParticipant) log('offerReceived senderParticipant', senderParticipant.isNegotiating,  message.resetConnection);

                /*if(senderParticipant == null && (_localInfo.browserName == 'Chrome' || _localInfo.browserName == 'Safari') && message.info.browserName == 'Firefox') {
                    log('offerReceived reset as socketParticipantConnected');

                    socketParticipantConnected().initPeerConnection(message);
                    return;
                }*/

                log('offerReceived: signalingRole: senderParticipant.signalingRole = ' + (senderParticipant != null ? senderParticipant.signalingRole : 'null'));

                //TODO: add chrome > 80 and firefox exceptions
                if(senderParticipant && senderParticipant.isNegotiating && senderParticipant.signalingRole == 'polite' && !message.resetConnection) {
                    log('offerReceived: ignore offer from polite participant');

                    if(senderParticipant.signalingState.stage == 'offerSent' || senderParticipant.signalingState.stage == 'answerReceived') {
                        log('offerReceived: ignore, but create new offer on stable signaling state');

                        senderParticipant.incrementOffersQueue();
                    }
                    return;
                } else if (senderParticipant && senderParticipant.signalingRole == 'impolite' && senderParticipant.isNegotiating && !message.resetConnection){
                    log('offerReceived: rollback to stable state');

                    if((_localInfo.browserName == 'Chrome' && _localInfo.browserVersion >= 80) || _localInfo.browserName == 'Firefox') {
                        senderParticipant.RTCPeerConnection.setLocalDescription({type: "rollback"});
                    }
                }

                if(senderParticipant == null && senderParticipant != localParticipant) {
                    log('offerReceived participantConnected', senderParticipant);
                    senderParticipant = new Participant();
                    senderParticipant.sid = message.fromSid;
                    senderParticipant.identity = message.name;
                    senderParticipant.localInfo = message.info;
                    senderParticipant.connection = message.connection != null ? message.connection : null;
                    participantConnected(senderParticipant);
                } else if(senderParticipant != null && senderParticipant.online == false && message.resetConnection == true) {
                    log('offerReceived participantConnected: reset connection', senderParticipant);
                    if(senderParticipant.RTCPeerConnection != null) senderParticipant.RTCPeerConnection.close();
                    senderParticipant.remove();
                    senderParticipant = new Participant();
                    senderParticipant.sid = message.fromSid;
                    senderParticipant.identity = message.name;
                    senderParticipant.localInfo = message.info;
                    senderParticipant.connection = message.connection != null ? message.connection : null;
                    participantConnected(senderParticipant);
                }

                senderParticipant.isNegotiating = true;
                senderParticipant.waitingForReverseOffer = false;
                senderParticipant.waitingForOffer = false;
                senderParticipant.signalingState.setStage('offerReceived');
                //senderParticipant.currentOfferId = senderParticipant.hasNewOffersInQueue !== false ? senderParticipant.hasNewOffersInQueue + 1 : 0;

                var description;
                if(typeof cordova != 'undefined' && _isiOS) {
                    description = new RTCSessionDescription({type: message.type, sdp:message.sdp});
                } else {
                    description =  {type: message.type, sdp:message.sdp};
                }


                var pcNotEstablished = senderParticipant.RTCPeerConnection == null;
                if(pcNotEstablished || senderParticipant.RTCPeerConnection.connectionState =='closed' ||  message.resetConnection == true) {
                    log('offerReceived: createPeerConnection');
                    var localRollbackSupport = (_localInfo.browserName == 'Chrome' && _localInfo.browserVersion >= 80) || _localInfo.browserName == 'Firefox';
                    var remoteRollbackSupport = (message.info.browserName == 'Chrome' && message.info.browserVersion >= 80) || message.info.browserName == 'Firefox';

                    if((localRollbackSupport && remoteRollbackSupport) || (localRollbackSupport && !remoteRollbackSupport) || (!localRollbackSupport && !remoteRollbackSupport)) {

                        senderParticipant.signalingRole = 'impolite';
                        //senderParticipant.signalingRole = 'polite';

                    } else {
                        senderParticipant.signalingRole = 'polite';
                        //senderParticipant.signalingRole = 'impolite';
                    }

                    senderParticipant.connection = message.connection != null ? message.connection : null;
                    senderParticipant.RTCPeerConnection = createPeerConnection(senderParticipant);
                }

                senderParticipant.RTCPeerConnection.setRemoteDescription(description).then(function () {
                    senderParticipant.signalingState.setStage('offerApplied');
                    if(pcNotEstablished || senderParticipant.RTCPeerConnection.connectionState =='closed' ||  message.resetConnection == true) {
                        publishLocalVideo(senderParticipant.RTCPeerConnection);
                        publishLocalAudio(senderParticipant.RTCPeerConnection);
                    }
                    senderParticipant.RTCPeerConnection.createAnswer()
                        .then(function(answer) {
                            log('offerReceived: answer created ' + answer.sdp);
                            senderParticipant.signalingState.setStage('answerCreated');

                            //for testing only
                            //answer.sdp = removeNotRelayCandidates(answer.sdp);

                            if(_isiOS){
                                //answer.sdp = removeInactiveTracksFromSDP(answer.sdp);
                            }

                            return senderParticipant.RTCPeerConnection.setLocalDescription(answer).then(function () {
                                log('offerReceived: answer created: sending', answer);
                                senderParticipant.signalingState.setStage('answerSent');

                                sendMessage({
                                    name: localParticipant.identity,
                                    targetSid: message.fromSid,
                                    type: "answer",
                                    sdp: senderParticipant.RTCPeerConnection.localDescription,
                                    connection: message.connection != null ? message.connection : null
                                });
                            });
                        })
                        .catch(function(error) {
                            console.error(error.name + ': ' + error.message);
                        });
                });
            }

            return {
                processOffer: process
            }
        }

        function answerReceived(message) {
            log('answerReceived');
            log('answerReceived: sdp: \n' + message.sdp.sdp);
            var senderParticipant = roomParticipants.filter(function (localParticipant) {
                return localParticipant.sid == message.fromSid;
            })[0];
            senderParticipant.identity = message.name;
            senderParticipant.signalingState.setStage('answerReceived');

            log('answerReceived from participant', senderParticipant.username, senderParticipant.identity, senderParticipant.sid);

            var description;
            if(typeof cordova != 'undefined' && _isiOS) {
                description = new RTCSessionDescription(message.sdp);
            } else {
                description = message.sdp;
            }

            var offersInQueueBeforeAnswerApplied = senderParticipant.hasNewOffersInQueue;
            var peerConnection = senderParticipant.RTCPeerConnection;

            peerConnection.setRemoteDescription(description).then(function () {
                log('answerReceived setRemoteDescription ', peerConnection.signalingState, senderParticipant.hasNewOffersInQueue, senderParticipant.currentOfferId)
                if(offersInQueueBeforeAnswerApplied != senderParticipant.hasNewOffersInQueue) return;
                /*if((senderParticipant.hasNewOffersInQueue !== false && senderParticipant.currentOfferId !== false && senderParticipant.hasNewOffersInQueue > senderParticipant.currentOfferId)
                    || (senderParticipant.hasNewOffersInQueue !== false && senderParticipant.currentOfferId === false)
                    /!*|| senderParticipant.shouldSendReverseOffer*!/) {
                    log('answerReceived STARTING NEW NEGOTIATION AGAIN ', senderParticipant.hasNewOffersInQueue, senderParticipant.currentOfferId)

                    senderParticipant.isNegotiating = false;
                    senderParticipant.currentOfferId = false;
                    senderParticipant.signalingState.setStage(null);
                    senderParticipant.negotiate();
                } else {
                    senderParticipant.hasNewOffersInQueue = false;
                    senderParticipant.isNegotiating = false;
                    senderParticipant.currentOfferId = false;
                    senderParticipant.signalingState.setStage(null);
                }*/
            });
        }

        function canISendOffer(participant) {
            log('canISendOffer');
            /*socket.emit('Streams/webrtc/reverseOfferRequest', {
                targetSid: participant.sid,
                type: "request",
            }, function(response) {
                if (response.error) {
                    console.error(response.error);
                } else {
                    log('reverse offer request sent');
                    participant.waitingForReverseOffer = true;
                }
            });*/
            return new Promise((resolve, reject) => {

                if (!socket) {
                    reject('No socket connection.');
                } else {
                    socket.emit('Streams/webrtc/canISendOffer', {
                        targetSid: participant.sid,
                        type: "request",
                    });
                    log('canISendOffer sent')

                    var reseivedAnswer = function (e) {
                        log('canISendOffer reseivedAnswer', e)
                        var fromParticipant = roomParticipants.filter(function (roomParticipant) {
                            return roomParticipant.sid == e.fromSid;
                        })[0];

                        if(fromParticipant == null || participant != fromParticipant) return;

                        if(e.answerValue === true) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }

                        app.event.off('canISendOffer', reseivedAnswer);
                    }
                    app.event.on('canISendOffer', reseivedAnswer);
                }

            });

        }

        function iceConfigurationReceived(message) {
            log('iceConfigurationReceived: ' + JSON.stringify(message));
            log('iceConfigurationReceived: roomParticipants', roomParticipants);
            var senderParticipant = roomParticipants.filter(function (localParticipant) {
                return localParticipant.sid == message.fromSid;
            })[0];

            if(senderParticipant == null) return;

            //var candidate = new IceCandidate({sdpMLineIndex:message.label, candidate:message.candidate});
            var peerConnection, candidate;

            peerConnection = senderParticipant.RTCPeerConnection;
            candidate = new RTCIceCandidate({
                candidate: message.candidate,
                sdpMLineIndex: message.label,
                sdpMid: message.sdpMid
            });
            //if(message.purpose == 'forReceivingMedia' && typeof cordova != 'undefined') return;
            log('iceConfigurationReceived: signalingState = ' + peerConnection.signalingState)
            log('iceConfigurationReceived: isNegotiating = ' + senderParticipant.isNegotiating)
            log('iceConfigurationReceived: canTrickleIceCandidates = ' + peerConnection.canTrickleIceCandidates)


            if(peerConnection.remoteDescription != null && peerConnection.signalingState == 'stable') {
                peerConnection.addIceCandidate(candidate)
                    .catch(function(e) {
                        console.error(e.name + ': ' + e.message);
                    });
            } else {
            log('iceConfigurationReceived: add to queue')

            senderParticipant.iceCandidatesQueue.push({
                peerConnection: peerConnection,
                candidate: candidate
            });
            }


        }

        function socketRoomJoined(streams) {
            log('socketRoomJoined', streams);
            app.state = 'connected';

            app.signalingDispatcher.socketEventManager();
            sendOnlineStatus();
            checkOnlineStatus();
            log('joined', {username:localParticipant.identity, sid:socket.id, room:options.roomName})
            socket.emit('Streams/webrtc/joined', {
                username:localParticipant.identity,
                sid:socket.id,
                room:options.roomName,
                roomStartTime: options.roomStartTime,
                roomPublisher: options.roomPublisher,
                isiOS: _isiOS,
                info: _localInfo}, function (data) {
                console.log('Streams/webrtc/joined CB', data)
            });

            if(options.limits && (options.limits.video || options.limits.audio)) {

                var videoTracks = [];
                var audioTracks = [];

                for (var s in streams) {
                    if(streams[s] == null) continue;
                    var localTracks = streams[s].getTracks();

                    for (var i in localTracks) {
                        if(!options.startWith[localTracks[i].kind]) {
                            log('socketRoomJoined skip track of kind ' + localTracks[i].kind);
                            localParticipant.notForUsingTracks.push(localTracks[i]);
                            continue;
                        }
                        var trackToAttach = new Track();
                        trackToAttach.sid = localTracks[i].id;
                        trackToAttach.kind = localTracks[i].kind
                        trackToAttach.isLocal = true;
                        trackToAttach.stream = streams[s];
                        trackToAttach.screensharing = localTracks[i].contentHint == 'detail' ? true : false;
                        trackToAttach.mediaStreamTrack = localTracks[i];

                        if(localTracks[i].kind == 'audio') {
                            audioTracks.push(trackToAttach);
                        } else {
                            videoTracks.push(trackToAttach);
                        }

                        //app.mediaManager.attachTrack(trackToAttach, localParticipant);

                    }
                }
                log('socketRoomJoined  audioTracks ' + audioTracks.length);
                log('socketRoomJoined  videoTracks ' + videoTracks.length);

                if(audioTracks.length != 0) {
                    app.localMediaControls.canITurnMicOn().then(function(result) {
                        if(result.answer != true) return;
                        log('socketRoomJoined  canITurnMicOn');

                        for(let a in audioTracks) {
                            app.mediaManager.attachTrack(audioTracks[a], localParticipant);
                        }
                        app.localMediaControls.enableAudio();

                        app.localMediaControls.loadDevicesList();
                    });
                }

                if(videoTracks.length != 0) {
                    app.localMediaControls.canITurnCameraOn().then(function(result) {
                        if(result.answer != true) return;

                        for(let v in videoTracks) {
                            app.mediaManager.attachTrack(videoTracks[v], localParticipant);
                        }
                        app.localMediaControls.enableVideo();

                        app.localMediaControls.loadDevicesList();
                    });
                }

            } else {
                for (var s in streams) {
                    if(streams[s] == null) continue;
                    var localTracks = streams[s].getTracks();

                    for (var i in localTracks) {
                        if(!options.startWith[localTracks[i].kind]) {
                            log('socketRoomJoined skip track of kind ' + localTracks[i].kind);
                            localParticipant.notForUsingTracks.push(localTracks[i]);
                            continue;
                        }
                        var trackToAttach = new Track();
                        trackToAttach.sid = localTracks[i].id;
                        trackToAttach.kind = localTracks[i].kind
                        trackToAttach.isLocal = true;
                        trackToAttach.stream = streams[s];
                        trackToAttach.screensharing = localTracks[i].contentHint == 'detail' ? true : false;
                        trackToAttach.mediaStreamTrack = localTracks[i];

                        app.mediaManager.attachTrack(trackToAttach, localParticipant);

                    }

                    var videoTracks = streams[s].getVideoTracks();
                    var audioTracks = streams[s].getAudioTracks();
                    log('socketRoomJoined videoTracks ' + videoTracks.length);
                    log('socketRoomJoined audioTracks ' + audioTracks.length);
                    //if (videoTracks.length != 0 && audioTracks.length == 0) localParticipant.videoStream = streams[s];
                    //if (audioTracks.length != 0 && videoTracks.length == 0) localParticipant.audioStream = streams[s];
                }

                app.localMediaControls.enableVideo();
                app.localMediaControls.enableAudio();
                app.localMediaControls.loadDevicesList();
            }
        }

        return {
            processDataTrackMessage: processDataTrackMessage,
            sendDataTrackMessage: sendDataTrackMessage,
            socketRoomJoined: socketRoomJoined,
            socketEventManager: socketEventManager,
            offerReceived: offerReceived,
            answerReceived: answerReceived,
            iceConfigurationReceived: iceConfigurationReceived,
            socketParticipantConnected: socketParticipantConnected,
            createOfferAndRenegotiate: createOfferAndRenegotiate
        }
    }())

    app.localMediaControls = (function () {
        var cameraIsDisabled = options.startWith.video === true ? false : true;
        var micIsDisabled = options.startWith.audio === true ? false : true;
        log('micIsDisabled', micIsDisabled, options.startWith.audio);
        log('cameraIsDisabled', cameraIsDisabled, options.startWith.video);

        var screensharingIsDisabled = true;
        var speakerIsDisabled = false;
        var currentAudioOutputMode = 'speaker';

        var audioInputDevices = [];
        var audioOutputDevices = [];
        var videoInputDevices = [];
        var currentCameraDevice;
        var currentAudioInputDevice;
        var currentAudioOutputDevice;
        var frontCameraDevice;

        function loadDevicesList(mediaDevicesList, reload) {
            log('loadDevicesList');
            videoInputDevices = [];
            audioInputDevices = [];
            audioOutputDevices = [];
            if(mediaDevicesList != null && typeof reload == 'undefined') {

                var i, device;
                for (i = 0; device = mediaDevicesList[i]; i++) {
                    log('loadDevicesList: ' + device.kind);
                    log('loadDevicesList: ', device);
                    if (device.kind.indexOf('video') != -1) {
                        videoInputDevices.push(device);
                        for (var x in localParticipant.tracks) {
                            var mediaStreamTrack = localParticipant.tracks[x].mediaStreamTrack;

                            if (!(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins)) {
                                if (mediaStreamTrack.enabled == true && ((typeof mediaStreamTrack.getSettings != 'undefined' && (mediaStreamTrack.getSettings().deviceId == device.deviceId || mediaStreamTrack.getSettings().label == device.label)) || mediaStreamTrack.label == device.label)) {
                                    frontCameraDevice = currentCameraDevice = device;
                                }
                            }
                        }
                    }
                    if (device.kind == 'audioinput') {
                        audioInputDevices.push(device);
                        log('loadDevicesList: tracks', localParticipant.tracks.length);

                        for (var x in localParticipant.tracks) {
                            var mediaStreamTrack = localParticipant.tracks[x].mediaStreamTrack;

                            log('loadDevicesList: audio: mediaStreamTrack', mediaStreamTrack);
                            if (!(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins)) {
                                if (mediaStreamTrack.enabled == true
                                    && ((typeof mediaStreamTrack.getSettings != 'undefined' && (mediaStreamTrack.getSettings().deviceId == device.deviceId || mediaStreamTrack.getSettings().label == device.label)) || mediaStreamTrack.label == device.label)) {
                                    currentAudioInputDevice = device;
                                }
                            }
                        }
                    } else if (device.kind == 'audiooutput') {
                        if(currentAudioOutputDevice == null && (device.deviceId == 'default' || device.label == 'default')) {
                            currentAudioOutputDevice = device;
                        }
                        audioOutputDevices.push(device);
                    } else if (device.kind.indexOf('audio') != -1) {
                        audioInputDevices.push(device);
                        for (var x in localParticipant.tracks) {
                            var mediaStreamTrack = localParticipant.tracks[x].mediaStreamTrack;

                            if (!(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins)) {
                                if (mediaStreamTrack.enabled == true
                                    && ((typeof mediaStreamTrack.getSettings != 'undefined' && (mediaStreamTrack.getSettings().deviceId == device.deviceId || mediaStreamTrack.getSettings().label == device.label)) || mediaStreamTrack.label == device.label)) {
                                    currentAudioInputDevice = device;
                                }
                            }
                        }
                    }
                }
                app.event.dispatch('deviceListUpdated');

            } else if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                navigator.mediaDevices.enumerateDevices().then(function (mediaDevicesList) {
                    loadDevicesList(mediaDevicesList);
                }).catch(function () {
                    console.error('ERROR: cannot get device info');
                });
            }
            log('currentCameraDevice', currentCameraDevice);
            log('currentAudioInputDevice', currentAudioInputDevice);
            log('frontCameraDevice', frontCameraDevice);
        }

        function getVideoDevices() {
            return videoInputDevices;
        }

        function getAudioInputDevices() {
            return audioInputDevices;
        }

        function getAudioOutputDevices() {
            return audioOutputDevices;
        }

        function getCurrentCameraDevice() {
            return currentCameraDevice;
        }

        function getFrontCameraDevice() {
            return frontCameraDevice;
        }

        function getCurrentAudioInputDevice() {
            return currentAudioInputDevice;
        }

        function getCurrentAudioOutputDevice() {
            return currentAudioOutputDevice;
        }

        function canITurnCameraOn() {
            return new Promise((resolve, reject) => {

                if (!socket) {
                    reject('No socket connection.');
                } else {
                    socket.emit('Streams/webrtc/canITurnCameraOn', {
                        type: "request",
                    });
                    log('canITurnCameraOn sent')

                    var reseivedAnswer = function (e) {
                        log('canITurnCameraOn reseivedAnswer', e)

                        if(e.answerValue === true) {
                            resolve({answer: true, fromSid: e.fromSid, limit: e.limit});
                        } else {
                            resolve({answer: false, limit: e.limit});
                        }

                        app.event.off('canITurnCameraOn', reseivedAnswer);
                    }
                    app.event.on('canITurnCameraOn', reseivedAnswer);
                }

            });
        }

        function canITurnMicOn() {
            return new Promise((resolve, reject) => {

                if (!socket) {
                    reject('No socket connection.');
                } else {
                    socket.emit('Streams/webrtc/canITurnMicOn', {
                        type: "request",
                    });
                    log('canITurnMicOn sent')

                    var reseivedAnswer = function (e) {
                        log('canITurnMicOn reseivedAnswer', e)

                        if(e.answerValue === true) {
                            resolve({answer: true, fromSid: e.fromSid, limit: e.limit});
                        } else {
                            resolve({answer: false, limit: e.limit});
                        }

                        app.event.off('canITurnMicOn', reseivedAnswer);
                    }
                    app.event.on('canITurnMicOn', reseivedAnswer);
                }

            });
        }

        function getRoomLimitsInfo() {
            return new Promise((resolve, reject) => {

                if (!socket) {
                    reject('No socket connection.');
                } else {
                    socket.emit('Streams/webrtc/getLimitsInfo', {
                        type: "request",
                    });
                    log('getRoomLimitsInfo sent')

                    /**
                     * Receives information from server about current room's active videos and audios
                     * @method reseivedAnswer
                     * @param {Object} [e.participantsNum] Participants number
                     * @param {String} [e.activeVideos] Number of active video slots
                     * @param {String} [e.activeAudios] Number of active audio slots
                     * @param {String} [e.minimalTimeOfUsingSlot] Minimal time of using video/audio (camera/mic) slot
                     * @param {String} [e.timeBeforeForceUserToDisconnect] Time user has before he will be forced to free up media slot
                     */
                    var reseivedAnswer = function (e) {
                        log('getRoomLimitsInfo reseivedAnswer', e)
                        resolve(e);
                        app.event.off('getLimitsInfo', reseivedAnswer);
                    }
                    app.event.on('getLimitsInfo', reseivedAnswer);
                }

            });
        }

        function toggleCameras(camera, callback, failureCallback) {
            log('toggleCameras: camera = ' + camera)
            app.signalingDispatcher.sendDataTrackMessage("beforeCamerasToggle");

            var i, device, deviceToSwitch;

            for(i = 0; device = videoInputDevices[i]; i++){

                if(device == currentCameraDevice) {
                    if(i != videoInputDevices.length-1){
                        deviceToSwitch = videoInputDevices[i+1];
                    } else deviceToSwitch = videoInputDevices[0];
                    break;
                }

                if(deviceToSwitch == null) videoInputDevices[0];
            };


            var constraints
            if(camera != null && camera.deviceId != null && camera.deviceId != '') {
                constraints = {deviceId: {exact: camera.deviceId}};
                if(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins) {
                    constraints = {deviceId: camera.deviceId}
                }
            } else if(camera != null && camera.groupId != null && camera.groupId != '') {
                constraints = {groupId: {exact: camera.groupId}};
                if(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins) {
                    constraints = {groupId: camera.groupId}
                }
            } else if(deviceToSwitch != null && deviceToSwitch.deviceId != null && deviceToSwitch.deviceId != '') {
                constraints = {groupId: {exact: deviceToSwitch.groupId}};
                if(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins) {
                    constraints = {groupId: deviceToSwitch.groupId}
                }
            }

            //TODO: make offers queue as this code makes offer twice - after disableVideo and after enableVideo
            var toggleCamera = function(videoStream) {
                var videoTrack = videoStream.getVideoTracks()[0];
                var trackToAttach = new Track();
                trackToAttach.sid = videoTrack.id;
                trackToAttach.mediaStreamTrack = videoTrack;
                trackToAttach.kind = videoTrack.kind;
                trackToAttach.isLocal = true;
                trackToAttach.stream = videoStream;

                var currentVideoTracks;
                if(options.showScreenSharingInSeparateScreen) {
                    currentVideoTracks = localParticipant.tracks.filter(function (t) {
                        return t.kind == 'video' && t.mediaStreamTrack != null && t.mediaStreamTrack.enabled && !t.screensharing;
                    });
                } else {
                    currentVideoTracks = localParticipant.tracks.filter(function (t) {
                        return t.kind == 'video' && t.mediaStreamTrack != null && t.mediaStreamTrack.enabled;
                    });
                }
                log('toggleCameras: currentVideoTracks ' + currentVideoTracks.length);
                log('toggleCameras: cameraIsEnabled ' + app.localMediaControls.cameraIsEnabled());

                if(app.localMediaControls.cameraIsEnabled() && currentVideoTracks.length != 0) {
                    log('toggleCameras: replace track');
                    if(!(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins)) app.localMediaControls.replaceTrack(videoTrack);
                    app.mediaManager.attachTrack(trackToAttach, localParticipant);

                    if(callback) callback();
                } else {
                    log('toggleCameras: add track');

                    app.mediaManager.attachTrack(trackToAttach, localParticipant);
                    app.localMediaControls.enableVideo();
                    app.event.dispatch('cameraToggled');
                    if(callback) callback();
                }

                if(camera != null && camera.deviceId != null && camera.deviceId != '') {
                    currentCameraDevice = videoInputDevices.filter(function (d) {
                        return d.deviceId == camera.deviceId;
                    })[0];
                } else if(camera != null && camera.groupId != null && camera.groupId != '') {
                    currentCameraDevice = videoInputDevices.filter(function (d) {
                        return d.groupId == camera.groupId;
                    })[0];
                } else currentCameraDevice = deviceToSwitch;
            }

            function requestCameraStream(localCallback) {
                var i;
                var tracksNum = localParticipant.tracks.length - 1;
                for (i = tracksNum; i >= 0; i--) {
                    if (localParticipant.tracks[i].kind == 'audio' || (options.showScreenSharingInSeparateScreen && localParticipant.tracks[i].screensharing)) continue;
                    if(localParticipant.tracks[i].mediaStreamTrack.readyState == 'ended' || localParticipant.tracks[i].mediaStreamTrack.enabled == false) continue;
                    localParticipant.tracks[i].mediaStreamTrack.stop();
                    localParticipant.tracks[i].mediaStreamTrack.dispatchEvent(new Event("ended"));

                }

                if(options.useCordovaPlugins && typeof cordova != 'undefined' && _isiOS) {
                    cordova.plugins.iosrtc.getUserMedia({
                        'audio': false,
                        'video': constraints
                    }).then(function (videoStream) {
                        log('toggleCameras: iosrtc: got stream', videoStream)

                        toggleCamera(videoStream);
                        if(localCallback) localCallback();
                    }).catch(function (error) {
                        console.error(error.name + ': ' + error.message);
                        if(failureCallback != null) failureCallback(error);
                    });
                } else {
                    navigator.mediaDevices.getUserMedia({
                        'audio': false,
                        'video': constraints
                    }).then(function (videoStream) {
                        log('toggleCameras: got stream')

                        toggleCamera(videoStream);
                        if(localCallback) localCallback();

                    })
                        .catch(function (error) {
                            console.error(error.name + ': ' + error.message);
                            if(failureCallback != null) failureCallback(error);
                        });
                }
            }

            /*if(options.limits && options.limits.video != null) {
                canITurnCameraOn().then(function(result) {
                    console.log('canITurnCameraOn', result);
                    if(result.answer == true) {
                        requestCameraStream(function() {

                        });
                    } else {
                        if(failureCallback != null) failureCallback({
                            name: 'NotAllowedDueLimit',
                            limit: result.limit
                        });
                    }
                });
            } else {*/
                requestCameraStream();
            //}

        }

        function canITurnMicOn() {
            return new Promise((resolve, reject) => {

                if (!socket) {
                    reject('No socket connection.');
                } else {
                    socket.emit('Streams/webrtc/canITurnMicOn', {
                        type: "request",
                    });
                    log('canITurnMicOn sent')

                    var receivedAnswer = function (e) {
                        log('canITurnMicOn reseivedAnswer', e)

                        if(e.answerValue === true) {
                            resolve({answer: true, fromSid: e.fromSid, limit: e.limit});
                        } else {
                            resolve({answer: false, limit: e.limit});
                        }

                        app.event.off('canITurnMicOn', receivedAnswer);
                    }
                    app.event.on('canITurnMicOn', receivedAnswer);
                }

            });
        }

        function toggleAudioInputs(audioDevice, callback, failureCallback) {
            log('toggleAudioInputs: audioDevice = ' + audioDevice)
            app.signalingDispatcher.sendDataTrackMessage("beforeAudioInputToggle");

            var i, device, deviceToSwitch;

            for(i = 0; device = audioInputDevices[i]; i++){

                if(device == currentAudioInputDevice) {
                    if(i != audioInputDevices.length-1){
                        deviceToSwitch = audioInputDevices[i+1];
                    } else deviceToSwitch = audioInputDevices[0];
                    break;
                }

                if(deviceToSwitch == null) audioInputDevices[0];
            };

            var constraints
            if(audioDevice != null && audioDevice.deviceId != null && audioDevice.deviceId != '') {
                constraints = {deviceId: {exact: audioDevice.deviceId}};
                if(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins) {
                    constraints = {deviceId: audioDevice.deviceId}
                }
            } else if(audioDevice != null && audioDevice.groupId != null && audioDevice.groupId != '') {
                constraints = {groupId: {exact: audioDevice.groupId}};
                if(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins) {
                    constraints = {groupId: audioDevice.groupId}
                }
            } else if(deviceToSwitch != null && deviceToSwitch.deviceId != null && deviceToSwitch.deviceId != '') {
                constraints = {groupId: {exact: deviceToSwitch.groupId}};
                if(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins) {
                    constraints = {groupId: deviceToSwitch.groupId}
                }
            }

            var toggleAudioInputs = function(audioStream) {
                var audioTrack = audioStream.getAudioTracks()[0];

                //stop and remove all prev audio tracks before adding new
                for(let i = localParticipant.tracks.length - 1; i >= 0 ; i--){
                    if(localParticipant.tracks[i].kind == 'video') continue;
                    if(localParticipant.tracks[i].mediaStreamTrack.readyState == 'ended' || localParticipant.tracks[i].mediaStreamTrack.enabled == false) continue;

                    log('toggleAudioInputs: stop prev tracks', localParticipant.tracks[i].mediaStreamTrack)
                    localParticipant.tracks[i].mediaStreamTrack.stop();
                    localParticipant.tracks[i].mediaStreamTrack.dispatchEvent(new Event("ended"));

                    localParticipant.tracks.splice(i, 1);
                }

                var trackToAttach = new Track();
                trackToAttach.sid = audioTrack.id;
                trackToAttach.mediaStreamTrack = audioTrack;
                trackToAttach.kind = audioTrack.kind;
                trackToAttach.isLocal = true;
                trackToAttach.stream = audioStream;

                var currentAudioTracks;
                currentAudioTracks = localParticipant.tracks.filter(function (t) {
                    return t.kind == 'audio' && t.mediaStreamTrack != null && t.mediaStreamTrack.enabled;
                });

                log('toggleAudioInputs: currentAudioTracks ' + currentAudioTracks.length);
                log('toggleAudioInputs: micIsEnabled ' + app.localMediaControls.micIsEnabled());


                if(app.localMediaControls.micIsEnabled() && currentAudioTracks.length != 0) {
                    log('toggleAudioInputs: replace track');
                    if(!(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins)) app.localMediaControls.replaceTrack(audioTrack);
                    app.mediaManager.attachTrack(trackToAttach, localParticipant);
                    if(callback) callback();
                } else {
                    log('toggleAudioInputs: add track');

                    app.mediaManager.attachTrack(trackToAttach, localParticipant);
                    app.localMediaControls.enableAudio();

                    app.event.dispatch('audioInputToggled');
                    if(callback) callback();
                }

                if(audioDevice != null && audioDevice.deviceId != null && audioDevice.deviceId != '') {
                    currentAudioInputDevice = audioInputDevices.filter(function (d) {
                        return d.deviceId == audioDevice.deviceId;
                    })[0];
                } else if(audioDevice != null && audioDevice.groupId != null && audioDevice.groupId != '') {
                    currentAudioInputDevice = audioInputDevices.filter(function (d) {
                        return d.groupId == audioDevice.groupId;
                    })[0];
                } else currentAudioInputDevice = deviceToSwitch;
            }

            log('toggleAudioInputs: before request', localParticipant.tracks.length)

            var requestMicStream = function () {
                if(options.useCordovaPlugins && typeof cordova != 'undefined' && _isiOS) {
                    cordova.plugins.iosrtc.getUserMedia({
                        'audio': constraints,
                        'video': false
                    }).then(function (audioStream) {
                        log('toggleAudioInputs: iosrtc: got stream', audioStream)

                        toggleAudioInputs(audioStream);
                    }).catch(function (error) {
                        console.error(error.name + ': ' + error.message);
                        if(failureCallback != null) failureCallback(error);
                    });
                } else {
                    navigator.mediaDevices.getUserMedia({
                        'audio': constraints,
                        'video': false
                    }).then(function (audioStream) {
                        log('toggleAudioInputs: got stream', audioStream)

                        toggleAudioInputs(audioStream);

                    }).catch(function (error) {
                        console.error(error.name + ': ' + error.message);
                        if(failureCallback != null) failureCallback(error);
                    });
                }
            }

            /*if(options.limits && options.limits.audio != null) {
                canITurnMicOn().then(function(result) {
                    console.log('canITurnMicOn', result);
                    if(result.answer == true) {
                        requestMicStream();
                    } else {
                        if(failureCallback != null) failureCallback({
                            name: 'NotAllowedDueLimit',
                            limit: result.limit
                        });
                    }
                });
            } else {*/
                requestMicStream();
            //}
        }

        function toggleAudioOutputs(outputDevice) {

            for(let p in roomParticipants) {
                let audioTracks = roomParticipants[p].audioTracks();
                for(let t in audioTracks) {
                    if(audioTracks[t].trackEl == null) continue;
                    if (typeof audioTracks[t].trackEl.sinkId == 'undefined') {
                        console.warn('Browser does not support output device selection.');
                        break;
                    }
                    audioTracks[t].trackEl.setSinkId(outputDevice.deviceId)
                        .then(() => {
                            console.log(`Success, audio output device attached: ${outputDevice.deviceId}`);
                        })
                        .catch(error => {
                            let errorMessage = error;
                            if (error.name === 'SecurityError') {
                                errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
                            }
                            console.error(errorMessage);
                        });
                }
            }
            currentAudioOutputDevice = outputDevice;
        }

        function enableCamera(callback, failureCallback) {
            log('enableCamera');

            var gotCameraStream = function(videoStream) {
                var localVideoTrack = videoStream.getVideoTracks()[0];

                //app.localMediaControls.disableVideo();

                var trackToAttach = new Track();
                trackToAttach.mediaStreamTrack = localVideoTrack;
                trackToAttach.kind = localVideoTrack.kind;
                trackToAttach.isLocal = true;
                trackToAttach.stream = videoStream;


                app.mediaManager.attachTrack(trackToAttach, localParticipant);
                app.localMediaControls.enableVideo();
                videoInputDevices = [];
                audioInputDevices = [];
                loadDevicesList();

                app.event.dispatch('cameraEnabled');

                if (callback != null) callback();

            };

            var requestCameraStream = function () {
                if(options.useCordovaPlugins && typeof cordova != 'undefined' && _isiOS) {
                    cordova.plugins.iosrtc.getUserMedia({
                        'audio': false,
                        'video': {
                            width: { min: 320, max: 1280 },
                            height: { min: 240, max: 720 }
                        }
                    }).then(function (videoStream) {
                        gotCameraStream(videoStream);
                    }).catch(function (e) {
                        if (failureCallback != null) failureCallback(e);
                        console.error(e.name + ": " + e.message);
                    });
                } else {
                    navigator.mediaDevices.getUserMedia({
                        'audio': false,
                        'video': {
                            width: { min: 320, max: 1280 },
                            height: { min: 240, max: 720 },
                            frameRate: 30
                        }
                    }).then(function (videoStream) {
                        gotCameraStream(videoStream);
                    })
                        .catch(function (e) {
                            if (failureCallback != null) failureCallback(e);
                            console.error(e.name + ": " + e.message);
                        });
                }
            }

            /*if(options.limits && options.limits.video != null) {
                canITurnCameraOn().then(function(result) {
                    if(result.answer == true) {
                        requestCameraStream();
                    } else {
                        if(failureCallback != null) failureCallback({
                            name: 'NotAllowedDueLimit',
                            limit: result.limit
                        });
                    }
                });
            } else {*/
                requestCameraStream();
            //}
        }

        function enableMicrophone(callback, failureCallback) {
            log('enableMicrophone');

            function successCallback(audioStream) {
                log('enableMicrophone: got stream');

                var localAudioTrack = audioStream.getAudioTracks()[0];

                localParticipant.audioStream = audioStream;
                var trackToAttach = new Track();
                trackToAttach.mediaStreamTrack = localAudioTrack;
                trackToAttach.kind = localAudioTrack.kind;
                trackToAttach.isLocal = true;
                if(typeof cordova != "undefined" && _isiOS && options.useCordovaPlugins) {
                    trackToAttach.stream = audioStream;
                }

                app.mediaManager.attachTrack(trackToAttach, localParticipant);

                if (callback != null) callback(audioStream);

            }

            function error(err) {
                console.error(err.name + ": " + err.message);
                if (failureCallback != null) failureCallback(err);
            }

            if(options.useCordovaPlugins && typeof cordova != 'undefined' && _isiOS){

                cordova.plugins.iosrtc.getUserMedia({
                    'audio': true
                }).then(function (audioStream) {
                    successCallback(audioStream);
                }).catch(function (err) {
                    error(err);
                });
            } else {
                navigator.mediaDevices.getUserMedia({
                    'audio': true
                }).then(function (audioStream) {
                    successCallback(audioStream);
                }).catch(function (err) {
                    error(err);
                });
            }
        }

        function requestAndroidMediaPermissions(constraints, callback, failureCallback) {
            if(typeof cordova != 'undefined' && ua.indexOf('Android') != -1) {
                var requestMicPermission = function (callback) {
                    cordova.plugins.permissions.checkPermission("android.permission.RECORD_AUDIO", function(result){
                        if(!result.hasPermission) {
                            cordova.plugins.permissions.requestPermission("android.permission.RECORD_AUDIO", function(result){
                                if(!result.hasPermission) {
                                    if(failureCallback != null) failureCallback();
                                } else {
                                    if(callback != null) callback();
                                }
                            }, function(){console.error("Permission not granted");})
                        } else {
                            if(callback != null) callback();
                        }
                    }, function(){console.error("Permission not granted");})
                }

                var requestCameraPermission = function (callback) {
                    cordova.plugins.permissions.checkPermission("android.permission.CAMERA", function(result){
                        if(!result.hasPermission) {
                            cordova.plugins.permissions.requestPermission("android.permission.CAMERA", function(result){
                                if(!result.hasPermission) {
                                    if(failureCallback != null) failureCallback();
                                } else {
                                    if(callback != null) callback();
                                }
                            }, function(){console.error("Permission not granted");})
                        } else {
                            if(callback != null) callback();
                        }
                    }, function(){console.error("Permission not granted");})
                }

                if(constraints.audio && constraints.video) {
                    requestMicPermission(function () {
                        requestCameraPermission(function () {
                            if(callback != null) callback();
                        });
                    });
                } else if (constraints.audio) {
                    requestMicPermission(function () {
                        if(callback != null) callback();
                    });
                } else if (constraints.video) {
                    requestCameraPermission(function () {
                        if(callback != null) callback();
                    });
                }

            }
        }

        function addTrack(track, stream) {

            /*if(typeof cordova != "undefined" && _isiOS) {
                var RTCLocalStreams = localParticipant.iosrtcRTCPeerConnection.getLocalStreams();

                var streamExist = RTCLocalStreams.filter(function (s) {
                    return s == stream;
                })[0];

                if(streamExist != null) iosrtcLocalPeerConnection.addStream(stream);
                return;
            }*/

            var trackToAttach = new Track();
            trackToAttach.mediaStreamTrack = track;
            trackToAttach.kind = track.kind;
            trackToAttach.isLocal = true;
            if(typeof cordova != "undefined" && _isiOS && options.useCordovaPlugins) {
                trackToAttach.stream = stream;
            }
            app.mediaManager.attachTrack(trackToAttach, localParticipant);
            if(track.kind == 'video')
                app.localMediaControls.enableVideo();
            else {
                app.localMediaControls.enableAudio();
            }
        }

        function switchSpeaker(state) {
            var i, participant;
            for(i = 0; participant = roomParticipants[i]; i++) {
                if(participant.isLocal) continue;
                for (var x in participant.tracks) {
                    var track = participant.tracks[x];
                    if (track.kind == 'audio') {
                        track.mediaStreamTrack.enabled = state;
                    }
                }
            }

        }

        function disableAudioOfAll() {
            switchSpeaker(false);
            speakerIsDisabled = true;
        }

        function enableAudioOfAll() {
            switchSpeaker(true);
            speakerIsDisabled = false;
        }

        function speakerIsEnabled() {
            return speakerIsDisabled ? false : true;
        }

        function toggleAudioOfAll() {
            var muted = speakerIsDisabled == true ? true : false;
            switchSpeaker(muted)
            speakerIsDisabled = !muted;
        }

        function micIsEnabled() {
            return micIsDisabled ? false : true;
        }

        function cameraIsEnabled() {
            return cameraIsDisabled ? false : true;
        }

        function screensharingIsEnabled() {
            return screensharingIsDisabled ? false : true;
        }

        function audioOutputMode() {
            function getCurrentMode() {
                return currentAudioOutputMode;
            }

            function setCurrentMode(mode) {
                log('audioOutputMode: setCurrentMode = ' + mode, currentAudioOutputMode)
                if(typeof cordova != 'undefined')log('audioOutputMode: setCurrentMode plugins', cordova.plugins)
                if(typeof cordova != 'undefined')log('audioOutputMode: setCurrentMode plugins AudioToggle', AudioToggle)

                if(mode == 'speaker') {
                    AudioToggle.setAudioMode(AudioToggle.SPEAKER);
                } else if (mode == 'earpiece') {
                    AudioToggle.setAudioMode(AudioToggle.EARPIECE);
                }

                currentAudioOutputMode = mode;
            }

            return {
                getCurrent: getCurrentMode,
                set: setCurrentMode
            }
        }

        function replaceTrack(track) {
            log('replaceTrack');

            for (var p in roomParticipants) {

                if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null && roomParticipants[p].RTCPeerConnection.connectionState != 'closed') {
                    if('ontrack' in roomParticipants[p].RTCPeerConnection){
                        let sender = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (s) {
                            return s.track && s.track.kind == track.kind;
                        })[0];

                        log('replaceTrack: sender exist - ' + sender != null);
                        if(sender != null) {
                            var oldTrackid = sender.track.id;

                            sender.replaceTrack(track)
                                .then(function () {
                                    log('replaceTrack: track replaced');
                                    for (let i = localParticipant.tracks.length - 1; i >= 0; i--) {
                                        if (localParticipant.tracks[i].mediaStreamTrack.id == oldTrackid) {
                                            log('replaceTrack: track replaced: stop and remove replaced track');
                                            ocalParticipant.tracks[i].mediaStreamTrack.stop();
                                            localParticipant.tracks.splice(i, 1);
                                        }
                                    }
                                })
                                .catch(function (e) {
                                    console.error(e.name + ': ' + e.message);
                                });

                        }

                    }
                }
            }

            cameraIsDisabled = false;
            app.event.dispatch('cameraEnabled');
            app.signalingDispatcher.sendDataTrackMessage('online', {cameraIsEnabled: true});

        }

        function enableVideoTracks() {
            log('enableVideoTracks');

            var screensharingTracksOnly = false;
            //TODO: make camera request if no video

            var videoTracks = localParticipant.videoTracks();
            for (var p in roomParticipants) {

                if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null && roomParticipants[p].RTCPeerConnection.connectionState != 'closed') {
                    if('ontrack' in roomParticipants[p].RTCPeerConnection) {

                        log('enableVideoTracks: local videoTracks num = ' + videoTracks.length);

                        for (var t in videoTracks) {
                            log('enableVideoTracks: addTrack: id = ' + (videoTracks[t].mediaStreamTrack.id), videoTracks[t].stream.id);
                            let videoSenderExist = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (sender) {
                                return sender.track != null && sender.track.kind == 'video' && sender.track.id == videoTracks[t].mediaStreamTrack.id;
                            })[0];
                            log('enableVideoTracks videoSenderExist ' + videoSenderExist != null);
                            if(!videoSenderExist) roomParticipants[p].RTCPeerConnection.addTrack(videoTracks[t].mediaStreamTrack, videoTracks[t].stream);
                            /*var params = sender.getParameters();

                            for (var i = 0; i < params.codecs.length; i++) {
                                if (params.codecs[i].mimeType == "video/rtx") {

                                    var codecToApply = params.codecs[i];
                                    params.codecs.splice(i, 1);
                                    params.codecs.unshift(codecToApply);
                                    break;
                                }
                            }

                            sender.setParameters(params).catch(function(e){
                                console.error(e.name + ': ' + e.message);
                            });*/
                        }

                    } else {
                        //localParticipant.videoStream are assigned in createTrackElement function
                        roomParticipants[p].RTCPeerConnection.addStream(localParticipant.videoStream);
                    }
                }
            }

            cameraIsDisabled = localParticipant.tracks.filter(function (track) {
                return track.kind == 'video' && !track.screensharing
            }).length == 0;
            screensharingIsDisabled = localParticipant.tracks.filter(function (track) {
                return track.screensharing === true;
            }).length == 0;

            socket.emit('Streams/webrtc/cameraEnabled');
            app.event.dispatch('cameraEnabled');
            app.signalingDispatcher.sendDataTrackMessage('online', {cameraIsEnabled: true});
        }

        /**
         * Stops streaming video tracks/streams.
         *
         * @method tracksToDisable
         * @uses Track
         * @return {Array}
         */
        function disableVideoTracks(tracksToDisable) {
            log('disableVideoTracks START', tracksToDisable);

            var screensharingTracksOnly = tracksToDisable && tracksToDisable.filter(function (track) {
                return track.screensharing === true;
            }).length == tracksToDisable.length;

            log('disableVideoTracks screensharingTracksOnly=' + screensharingTracksOnly);

            if(tracksToDisable == null) {
                log('disableVideoTracks: all');

                for (let i = localParticipant.tracks.length - 1; i >= 0; i--) {
                    if(localParticipant.tracks[i].kind != 'video' || (options.showScreenSharingInSeparateScreen && localParticipant.tracks[i].screensharing == true)) continue;
                    localParticipant.tracks[i].mediaStreamTrack.stop();
                    localParticipant.tracks[i].mediaStreamTrack.dispatchEvent(new Event("ended"));
                }
            } else  {
                log('disableVideoTracks: tracksToDisable', tracksToDisable);

                for (let i = 0; i < tracksToDisable.length; i++) {
                    tracksToDisable[i].mediaStreamTrack.stop();
                    tracksToDisable[i].mediaStreamTrack.dispatchEvent(new Event("ended"));
                }
            }

            //Report 11.07.19
            /*if(_isiOS) {
                if(screensharingTracksOnly) {
                    screensharingIsDisabled = true;
                } else {
                    cameraIsDisabled = true;
                }

                if(tracksToDisable == null) {
                    for (let i = localParticipant.tracks.length - 1; i >= 0; i--) {
                        if(localParticipant.tracks[i].kind != 'video' || (options.showScreenSharingInSeparateScreen && localParticipant.tracks[i].screensharing == true)) continue;
                        localParticipant.tracks.splice(i, 1);
                    }
                } else  {
                    for (let i = 0; i < tracksToDisable.length; i++) {
                        for (let i = localParticipant.tracks.length - 1; i >= 0; i--) {
                            if(tracksToDisable[i] != localParticipant.tracks[i]) continue;
                            localParticipant.tracks.splice(i, 1);
                            break;
                        }
                    }
                }
                app.signalingDispatcher.sendDataTrackMessage('online', {cameraIsEnabled: false});
                return;
            }*/

            for (let p in roomParticipants) {

                if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null && roomParticipants[p].RTCPeerConnection.connectionState != 'closed') {
                    if('ontrack' in roomParticipants[p].RTCPeerConnection){

                        let videoSenders;
                        if(tracksToDisable == null) {
                            videoSenders = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (sender) {
                                return sender.track != null && sender.track.kind == 'video';
                            });
                        } else {
                            videoSenders = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (sender) {
                                return sender.track != null && sender.track.kind == 'video' && tracksToDisable.map(function(e) { return e.mediaStreamTrack; }).indexOf(sender.track) != -1;
                            });
                        }
                        log('disableVideoTracks: videoSenders', videoSenders);

                        for(var s = videoSenders.length - 1; s >= 0 ; s--){

                            let skip = false;
                            for(let i = localParticipant.tracks.length - 1; i >= 0; i--){
                                if(localParticipant.tracks[i].mediaStreamTrack.id == videoSenders[s].track.id) {
                                    if(tracksToDisable == null && options.showScreenSharingInSeparateScreen && localParticipant.tracks[i].screensharing == true) {
                                        skip = true;
                                        break;
                                    }
                                    localParticipant.tracks.splice(i, 1);
                                    break;
                                }
                            }
                            log('disableVideoTracks: remove track from PC, skip', skip);
                            if(!skip) roomParticipants[p].RTCPeerConnection.removeTrack(videoSenders[s]);

                        }


                    } else {
                        var RTCLocalStreams = roomParticipants[p].RTCPeerConnection.getLocalStreams();
                        if(tracksToDisable != null) {
                            RTCLocalStreams = RTCLocalStreams.filter(function (streamObj) {
                                let videoTracks = streamObj.getVideoTracks();
                                for (let t in videoTracks) {
                                    if(tracksToDisable.map(function(e) { return e.mediaStreamTrack; }).indexOf(videoTracks[t]) != -1) return true;
                                }
                                return false;
                            });
                        }
                        for (var s in RTCLocalStreams) {
                            log('disableVideoTracks: remove stream from PC')

                            let skip = false;
                            let videoTracks = RTCLocalStreams[s].getVideoTracks();
                            for(var v in videoTracks) {
                                for(let i = localParticipant.tracks.length - 1; i >= 0 ; i--){
                                    if(localParticipant.tracks[i].mediaStreamTrack.id == videoTracks[v].id) {
                                        log('disableVideoTracks: remove track from list');
                                        if(tracksToDisable == null && options.showScreenSharingInSeparateScreen && localParticipant.tracks[i].screensharing == true) {
                                            skip = true;
                                            break;
                                        }
                                        localParticipant.tracks.splice(i, 1);
                                        break;
                                    }
                                }
                                if(!skip) videoTracks[v].stop();
                            }

                            if(!skip) roomParticipants[p].RTCPeerConnection.removeStream(RTCLocalStreams[s]);

                        }

                    }

                }
                localParticipant.videoStream = null;
            }

            if(screensharingTracksOnly) {
                screensharingIsDisabled = true;
            } else {
                cameraIsDisabled = true;
            }
            currentCameraDevice = null;
            app.signalingDispatcher.sendDataTrackMessage('online', {cameraIsEnabled: false});

            socket.emit('Streams/webrtc/cameraDisabled');
            app.event.dispatch('cameraDisabled');

        }

        /*Adds existing audio tracks to each peer connection. If track doesn't exist, new track will be requested. */
        function enableAudioTracks(failureCallback) {
            log('enableAudioTracks 22');

            var audioTracks = localParticipant.audioTracks();
            log('enableAudioTracks: tracks num = ' + audioTracks.length);

            if('ontrack' in testPeerConnection && audioTracks.length == 0) {
                var requestMicrophoneCallback = function (audioStream) {
                    var audioTrack = audioStream.getAudioTracks()[0];
                    if (typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins) {
                        var enableAudioTrack = function (e) {
                            if (e.track.mediaStreamTrack.id == audioTrack.id) {
                                enableAudioTracks();

                                micIsDisabled = false;
                                app.signalingDispatcher.sendDataTrackMessage('online', {micIsEnabled: true});
                                app.event.dispatch('micEnabled');
                            }
                            app.event.off('trackAdded', enableAudioTrack);
                        }
                        app.event.dispatch('micIsBeingEnabled');
                        app.event.on('trackAdded', enableAudioTrack);

                    } else {
                        enableAudioTracks();
                    }
                }

                app.localMediaControls.requestMicrophone(requestMicrophoneCallback, function (e) {
                    console.error(e.message);

                    if (failureCallback != null) failureCallback(e);
                });

                return;
            } else if(!('ontrack' in testPeerConnection) && 'onaddstream' in testPeerConnection && localParticipant.audioStream == null) {
                app.localMediaControls.requestMicrophone(function (audioStream) {
                    for (let p in roomParticipants) {
                        if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null && roomParticipants[p].RTCPeerConnection.connectionState != 'closed') {
                            if('ontrack' in roomParticipants[p].RTCPeerConnection){
                                if (audioStream != null) roomParticipants[p].RTCPeerConnection.addTrack(audioStream.getAudioTracks()[0], audioStream);
                            } else {
                                if (audioStream != null) roomParticipants[p].RTCPeerConnection.addStream(audioStream);
                            }
                        }
                    }
                }, function () {
                    alert('Unable access microphone');
                });
                return;

            }

            for (let p in roomParticipants) {
                if(!roomParticipants[p].RTCPeerConnection || roomParticipants[p].isLocal || roomParticipants[p].RTCPeerConnection.connectionState == 'closed') continue;
                if('ontrack' in roomParticipants[p].RTCPeerConnection){

                    log('enableAudioTracks audioTracks num = ' + audioTracks.length);

                    var audioSenders = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (sender) {
                        return sender.track && sender.track.kind == 'audio';
                    });

                    var trackExists = false;
                    for(var s = audioSenders.length - 1; s >= 0 ; s--){

                        for(let i = localParticipant.tracks.length - 1; i >= 0 ; i--){

                            if(localParticipant.tracks[i].mediaStreamTrack.id == audioSenders[s].track.id) {
                                log('enableAudioTracks: track already exists');
                                trackExists = true;
                            }
                        }
                    }

                    //if(trackExists) continue;

                    if(_isiOS && typeof cordova == 'undefined') {
                        for (var t in audioTracks) {
                            log('enableAudioTracks: add track: enabled = ' + audioTracks[t].mediaStreamTrack.enabled);
                            log('enableAudioTracks: add track: muted = ' + audioTracks[t].mediaStreamTrack.muted);
                            if(trackExists) {
                                log('enableAudioTracks: enable existing track');
                                audioTracks[t].mediaStreamTrack.enabled = true;
                            } else {
                                log('enableAudioTracks: add new track to PC');
                                audioTracks[t].mediaStreamTrack.enabled = true;
                                roomParticipants[p].RTCPeerConnection.addTrack(audioTracks[t].mediaStreamTrack);
                            }
                        }
                    } else {
                        for (var t in audioTracks) {
                            log('enableAudioTracks: add track: enabled = ' + audioTracks[t].mediaStreamTrack.enabled);
                            log('enableAudioTracks: add track: muted = ' + audioTracks[t].mediaStreamTrack.muted);
                            roomParticipants[p].RTCPeerConnection.addTrack(audioTracks[t].mediaStreamTrack);
                        }
                    }

                } else {
                    log('enableAudioTracks: enable tracks of stream')

                    var RTCLocalStreams = roomParticipants[p].RTCPeerConnection.getLocalStreams();
                    for (var s in RTCLocalStreams) {
                        var audioTracks = RTCLocalStreams[s].getAudioTracks();
                        for(var v in audioTracks) {
                            audioTracks[v].enabled = true;
                        }

                    }
                }
            }
            micIsDisabled = false;
            socket.emit('Streams/webrtc/micEnabled');
            app.signalingDispatcher.sendDataTrackMessage('online', {micIsEnabled: true});
            app.event.dispatch('micEnabled');

        }

        /*removes track from each peer connections but keeps audio track active. We need to left mediatrack active
        to keep mic premissions active to avoid autoplay issues*/
        function disableAudioTracks() {
            log('disableAudioTracks')
            if(micIsDisabled) return;

            for (var p in roomParticipants) {

                if (roomParticipants[p].RTCPeerConnection && 'ontrack' in roomParticipants[p].RTCPeerConnection) {
                    if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null && roomParticipants[p].RTCPeerConnection.connectionState != 'closed') {
                        var audioSenders = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (sender) {
                            return sender.track && sender.track.kind == 'audio';
                        });

                        for(var s = audioSenders.length - 1; s >= 0 ; s--){
                            roomParticipants[p].RTCPeerConnection.removeTrack(audioSenders[s]);
                        }
                    }
                } else {

                    if(localParticipant.audioStream == null) return;

                    if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null && roomParticipants[p].RTCPeerConnection.connectionState != 'closed') {
                        var RTCLocalStreams = roomParticipants[p].RTCPeerConnection.getLocalStreams();
                        for (var s in RTCLocalStreams) {
                            var audioTracks = RTCLocalStreams[s].getAudioTracks();
                            for(var v in audioTracks) {
                                log('disableAudioTracks: disable track of stream');
                                audioTracks[v].enabled = false;
                            }

                        }

                    }

                }
            }

            micIsDisabled = true;
            currentAudioInputDevice = null;
            socket.emit('Streams/webrtc/micDisabled');
            app.event.dispatch('micDisabled');
            var info = {
                micIsEnabled: false
            }
            app.signalingDispatcher.sendDataTrackMessage('online', info);
        }

        return {
            enableVideo: enableVideoTracks,
            disableVideo: disableVideoTracks,
            replaceTrack: replaceTrack,
            enableAudio: enableAudioTracks,
            disableAudio: disableAudioTracks,
            toggleAudioInputs: toggleAudioInputs,
            toggleAudioOutputs: toggleAudioOutputs,
            toggleCameras: toggleCameras,
            requestCamera: enableCamera,
            requestMicrophone: enableMicrophone,
            requestAndroidMediaPermissions: requestAndroidMediaPermissions,
            disableAudioOfAll: disableAudioOfAll,
            enableAudioOfAll: enableAudioOfAll,
            audioOutputMode: audioOutputMode,
            addTrack: addTrack,
            micIsEnabled: micIsEnabled,
            cameraIsEnabled: cameraIsEnabled,
            screensharingIsEnabled: screensharingIsEnabled,
            speakerIsEnabled: speakerIsEnabled,
            loadDevicesList: loadDevicesList,
            videoInputDevices: getVideoDevices,
            audioInputDevices: getAudioInputDevices,
            audioOutputDevices: getAudioOutputDevices,
            currentCameraDevice: getCurrentCameraDevice,
            frontCameraDevice: getFrontCameraDevice,
            currentAudioInputDevice: getCurrentAudioInputDevice,
            currentAudioOutputDevice: getCurrentAudioOutputDevice,
            getRoomLimitsInfo: getRoomLimitsInfo,
            canITurnCameraOn: canITurnCameraOn,
            canITurnMicOn: canITurnMicOn
        }
    }())

    var initOrConnectWithNodeJs = function (callback) {
        log('initOrConnectWithNodeJs');
        if(options.useCordovaPlugins && Q.info.isCordova && _isiOS) {
            initOrConnectWithNodeJsiOSCordova(callback);
            return;
        }

        function joinRoom(streams, mediaDevicesList) {
            log('initOrConnectWithNodeJs: joinRoom');
            app.signalingDispatcher.socketRoomJoined((streams != null ? streams : []));
            if(mediaDevicesList != null) app.localMediaControls.loadDevicesList(mediaDevicesList);
            app.event.dispatch('joined', localParticipant);
            if(callback != null) callback(app);
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            log('enumerateDevices() not supported.');

            navigator.mediaDevices.getUserMedia ({
                'audio': options.audio,
                'video': options.video
            }).then(function (stream) {
                joinRoom(stream);
            }).catch(function(err) {
                console.error(err.name + ": " + err.message);
            });

            return;
        }



        navigator.mediaDevices.enumerateDevices().then(function (mediaDevicesList) {
            log('initOrConnectWithNodeJs: enumerateDevices');
            var mediaDevices = mediaDevicesList;

            var videoDevices = 0;
            var audioDevices = 0;
            for(var i in mediaDevices) {
                log('initOrConnectWithNodeJs: enumerateDevices: device: ', mediaDevices[i]);
                if (mediaDevices[i].kind === 'videoinput' || mediaDevices[i].kind === 'video') {
                    videoDevices++;
                } else if (mediaDevices[i].kind === 'audioinput' || mediaDevices[i].kind === 'audio') {
                    audioDevices++;
                }
            }

            log('initOrConnectWithNodeJs: enumerateDevices: videoDevices: ' + videoDevices);
            log('initOrConnectWithNodeJs: enumerateDevices: audioDevices: ' + audioDevices);

            var videoconstraints;
            if(options.video == false){
                videoconstraints = false;
            } else {
                videoconstraints = {
                    width: { min: 320, max: 1280 },
                    height: { min: 240, max: 720 }
                };
            }

            if(options.streams != null && options.streams.length != 0) {
                log('initOrConnectWithNodeJs: streams passed as param');
                joinRoom(options.streams, mediaDevices);
                return;
            }

            if((audioDevices == 0 && videoDevices == 0) || (!options.audio && !options.video)){
                log('initOrConnectWithNodeJs: connect with no devices, no stream needed');

                joinRoom(null, mediaDevices);
                return;
            }

            navigator.mediaDevices.getUserMedia ({
                'audio': audioDevices != 0 && options.audio,
                'video': videoconstraints
            }).then(function (stream) {
                navigator.mediaDevices.enumerateDevices().then(function (mediaDevicesList) {
                    joinRoom(stream, mediaDevicesList);
                }).catch(function (err) {
                    console.error(err.name + ": " + err.message);
                });

            })

        })
    }

    var initOrConnectWithNodeJsiOSCordova = function (callback) {
        log('initOrConnectWithNodeJsiOSCordova');

        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            log("enumerateDevices() not supported.");
        }

        function joinRoom(streams, mediaDevicesList) {
            app.signalingDispatcher.socketRoomJoined((streams != null ? streams : []));
            if(mediaDevicesList != null) app.localMediaControls.loadDevicesList(mediaDevicesList);
            app.event.dispatch('joined', localParticipant);
            if(callback != null) callback(app);
        }

        cordova.plugins.iosrtc.enumerateDevices().then(function(mediaDevicesList){
            var mediaDevices = mediaDevicesList;

            var videoDevices = 0;
            var audioDevices = 0;
            for(var i in mediaDevices) {
                if (mediaDevices[i].kind.indexOf('video') != -1) {
                    videoDevices++;
                } else if (mediaDevices[i].kind.indexOf('audio') != -1) {
                    audioDevices++;
                }
            }

            var videoconstraints;
            if(videoDevices == 0 || options.video == false){
                videoconstraints = false;
            } else if(videoDevices != 0 && options.video) {
                videoconstraints = {
                    width: { min: 320, max: 1280 },
                    height: { min: 240, max: 720 }
                };
            }

            if(audioDevices != 0 && options.audio) {
                cordova.plugins.iosrtc.getUserMedia({
                    audio: true,
                    video: false
                }).then(function (audioStream) {
                    if(videoconstraints !== false) {
                        cordova.plugins.iosrtc.getUserMedia({
                            audio: false,
                            video: true
                        }).then(function (videoStream) {
                            cordova.plugins.iosrtc.enumerateDevices().then(function (mediaDevicesList) {
                                joinRoom([audioStream, videoStream], mediaDevicesList);
                            }).catch(function (error) {
                                console.error(`Unable to connect to Room: ${error.message}`);
                            });
                        }).catch(function (error) {
                            console.error('getUserMedia failed: ', error);
                        });
                    } else {
                        joinRoom([audioStream], mediaDevicesList);
                    }
                }).catch(function (error) {
                        console.error('getUserMedia failed: ', error);
                    }
                );
            } else if (videoconstraints !== false) {
                cordova.plugins.iosrtc.getUserMedia({
                    audio: false,
                    video: true
                }).then(function (videoStream) {
                    cordova.plugins.iosrtc.enumerateDevices().then(function (mediaDevicesList) {
                        try {
                            joinRoom([videoStream], mediaDevicesList);
                        } catch (e) {
                            console.error(e.name + ': ' + e.message);
                        }
                    }).catch(function (error) {
                        console.error(`Unable to connect to Room: ${error.message}`);
                    });
                }).catch(
                    function (error) {
                        console.error('getUserMedia failed: ', error);
                    });
            } else {
                cordova.plugins.iosrtc.enumerateDevices().then(function (mediaDevicesList) {
                    //try {
                    joinRoom((options.streams != null ? options.streams : []), mediaDevicesList);
                    //} catch (e) {
                    ////	console.error('error', e.message);
                    //}
                }).catch(function (error) {
                    console.error(`Unable to connect to Room: ${error.message}`);
                });
            }

        }).catch(function(err) {
            console.error(err.name + ": " + err.message);
        });
    }

    if(options.useCordovaPlugins && typeof cordova != 'undefined' && (ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1)) {
        var nativeLocalWebRTCPeerConnection = (function () {
            var iceQueue = [];

            function setOffer(message) {

                var description = new RTCSessionDescription({type: message.type, sdp: message.sdp});

                return localParticipant.RTCPeerConnection.setRemoteDescription(description).then(function () {
                    return localParticipant.RTCPeerConnection.createAnswer()
                        .then(function (answer) {

                            var localDescription = new RTCSessionDescription(answer);

                            return localParticipant.RTCPeerConnection.setLocalDescription(localDescription).then(function () {


                                var message = {
                                    type: "answer",
                                    sdp: localDescription
                                };
                                return iosrtcLocalPeerConnection.setAnswer(message).then(function () {

                                    for (var i in iceQueue) {
                                        if(iceQueue[i] != null) iosrtcLocalPeerConnection.addIceCandidate(iceQueue[i]);
                                        iceQueue[i] = null;
                                    }
                                });

                            });
                        })

                        .catch(function (error) {
                            console.error(error.name + ': ' + error.message);
                        });
                });
            }

            function setAnswer(message) {

                var description = new RTCSessionDescription(message.sdp);

                localParticipant.iosrtcRTCPeerConnection.setRemoteDescription(description);
                localParticipant.state = 'connected';
            }

            function createOffer() {
                var RTCPeerConnection = localParticipant.RTCPeerConnection;
                RTCPeerConnection.createOffer({'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true})
                    .then(function (offer) {
                        var localDescription = new RTCSessionDescription(offer);
                        return RTCPeerConnection.setLocalDescription(localDescription).then(function () {
                            //callback(iosRTCPeerConnection.localDescription.sdp);
                            var message = {
                                type: "offer",
                                sdp: RTCPeerConnection.localDescription.sdp
                            }

                            iosrtcLocalPeerConnection.setOffer(message);

                        });
                    })
                    .catch(function (error) {
                        console.error(error.name + ': ' + error.message);
                    });
            }

            function addIceCandidate(message) {
                var candidate = new RTCIceCandidate({
                    candidate: message.candidate,
                    sdpMLineIndex: message.label,
                    sdpMid: message.sdpMid
                });
                localParticipant.RTCPeerConnection.addIceCandidate(candidate)
                    .catch(function (e) {
                        console.error(e.name +  ': ' + e.message);
                    });
            }

            function gotIceCandidate(event) {

                if (event.candidate) {

                    /*if (event.candidate.candidate.indexOf("relay") < 0) {
                        return;
                    }*/
                    var message = {
                        type: "candidate",
                        label: event.candidate.sdpMLineIndex,
                        sdpMid: event.candidate.sdpMid,
                        candidate: event.candidate.candidate,
                        id: event.candidate.sdpMid
                    };

                    //iceQueue.push(message);
                    iosrtcLocalPeerConnection.addIceCandidate(message);

                }
            }

            function trackReceived(e) {
                log('iosrtcRTCPeerConnection : trackReceived')
                var stream = e.streams[0];
                var track = e.track;
                log('iosrtcRTCPeerConnection : trackReceived : track ' + track.kind)

                function addTrack() {
                    var trackToAttach = new Track();
                    trackToAttach.sid = track.sid;
                    trackToAttach.kind = track.kind;
                    trackToAttach.mediaStreamTrack = track;
                    trackToAttach.isLocal = true;
                    trackToAttach.stream = stream;
                    //localParticipant.videoStream = stream;

                    app.mediaManager.attachTrack(trackToAttach, localParticipant);


                }


                if(app.state == 'connected') {
                    addTrack();
                } else {
                    app.event.on('joined', function () {
                        addTrack();
                    });
                }
            }

            function createNativeLocalPeerConnection(callback) {
                var newPeerConnection = new window.RTCPeerConnection(pc_config);

                if (localParticipant.videoStream != null) newPeerConnection.addStream(localParticipant.videoStream);

                localParticipant.RTCPeerConnection = newPeerConnection;

                newPeerConnection.onaddstream = function (e) {
                    //streamReceived(e);
                };
                newPeerConnection.ontrack = function (e) {
                    trackReceived(e);
                };

                newPeerConnection.onicecandidate = function (e) {
                    gotIceCandidate(e);
                };

                newPeerConnection.onnegotiationneeded = function (e) {
                    if (newPeerConnection.connectionState == 'new' && newPeerConnection.iceConnectionState == 'new' && newPeerConnection.iceGatheringState == 'new') return;

                    createOffer();

                };

                if (callback != null) callback();

            }

            function removeRemoteStreams() {
                var localTracks = localParticipant.tracks;
                for (var t in localTracks) {
                    if(localTracks[t].stream != null) {
                        localTracks[t].mediaStreamTrack.stop();
                        localParticipant.RTCPeerConnection.removeStream(localTracks[t].stream);
                    }
                }
            }

            return {
                create: createNativeLocalPeerConnection,
                setOffer: setOffer,
                setAnswer: setAnswer,
                addIceCandidate: addIceCandidate,
                removeRemoteStreams: removeRemoteStreams
            }
        }())

        var iosrtcLocalPeerConnection = (function () {
            var iosrtcRTCPeerConnection = cordova.plugins.iosrtc.RTCPeerConnection;
            var iosrtcRTCIceCandidate = cordova.plugins.iosrtc.RTCIceCandidate;
            var iosrtcRTCSessionDescription = cordova.plugins.iosrtc.RTCSessionDescription;

            var iceQueue = [];
            var _negotiating = false;
            var _offerQueue = null;
            var _nativeStreams = [];

            function setAnswer(message) {

                var description = new iosrtcRTCSessionDescription(message.sdp);

                return localParticipant.iosrtcRTCPeerConnection.setRemoteDescription(description).then(function () {
                    for (var i in iceQueue) {
                        if(iceQueue[i] != null) nativeLocalWebRTCPeerConnection.addIceCandidate(iceQueue[i]);
                        iceQueue[i] = null;
                    }
                });

            }

            function addIceCandidate(message) {
                var candidate = new iosrtcRTCIceCandidate({
                    candidate: message.candidate,
                    sdpMLineIndex: message.label,
                    sdpMid: message.sdpMid
                });
                localParticipant.iosrtcRTCPeerConnection.addIceCandidate(candidate)
                    .catch(function (e) {
                        console.error(e.name + ': ' + e.message);
                    });
            }

            function gotIceCandidate(event) {

                if (event.candidate) {

                    var message = {
                        type: "candidate",
                        label: event.candidate.sdpMLineIndex,
                        sdpMid: event.candidate.sdpMid,
                        candidate: event.candidate.candidate,
                        id: event.candidate.sdpMid
                    };

                    //iceQueue.push(message);

                    nativeLocalWebRTCPeerConnection.addIceCandidate(message);

                }
            }

            function createOffer() {
                if(_negotiating == true) return;
                _negotiating = true
                var iosRTCPeerConnection = localParticipant.iosrtcRTCPeerConnection;
                iosRTCPeerConnection.createOffer({'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true})
                    .then(function (offer) {

                        var localDescription = new iosrtcRTCSessionDescription(offer);
                        return iosRTCPeerConnection.setLocalDescription(localDescription).then(function () {
                            var message = {
                                type: "offer",
                                sdp: iosRTCPeerConnection.localDescription.sdp
                            }

                            return nativeLocalWebRTCPeerConnection.setOffer(message).then(function () {
                                _negotiating = false;

                                if(_offerQueue != null) {

                                    var newOffer = _offerQueue;
                                    _offerQueue = null;
                                    newOffer();
                                }
                            });

                        });
                    })
                    .catch(function (error) {
                        console.error(error.name + ': ' + error.message);
                    });
            }

            function setOffer(message) {
                var description = new iosrtcRTCSessionDescription({type: message.type, sdp: message.sdp});

                localParticipant.RTCPeerConnection.setRemoteDescription(description).then(function () {
                    localParticipant.RTCPeerConnection.createAnswer()
                        .then(function (answer) {
                            var localDescription = new RTCSessionDescription(answer);

                            return localParticipant.iosrtcRTCPeerConnection.setLocalDescription(localDescription).then(function () {
                                var message = {
                                    type: "answer",
                                    sdp: localDescription
                                };
                                nativeLocalWebRTCPeerConnection.setAnswer(message);
                            });
                        })

                        .catch(function (error) {
                            console.error(error.name + ': ' + error.message);
                        });
                });
            }

            function addStream(stream) {
                if (localParticipant.iosrtcRTCPeerConnection == null) return;

                var newStreamKind;
                var videoTracks = stream.getVideoTracks()
                var audioTracks = stream.getAudioTracks()
                if (videoTracks.length != 0 && audioTracks.length == 0)
                    newStreamKind = 'video';
                else if (audioTracks.length != 0 && videoTracks.length == 0) newStreamKind = 'audio';

                removeLocalNativeStreams(newStreamKind);

                let track = newStreamKind == 'video' ? videoTracks[0] : audioTracks[0];

                /*if(track.kind =='video' && 'ontrack' in localParticipant.iosrtcRTCPeerConnection) {
                    log('iosrtcRTCPeerConnection : add track')
                    if(_negotiating){
                        _offerQueue = function () {
                            localParticipant.iosrtcRTCPeerConnection.addTrack(track);
                        }
                    } else localParticipant.iosrtcRTCPeerConnection.addTrack(track);
                } else {*/
                log('iosrtcRTCPeerConnection : add stream')
                if(_negotiating){
                    _offerQueue = function () {
                        localParticipant.iosrtcRTCPeerConnection.addStream(stream);
                    }
                } else localParticipant.iosrtcRTCPeerConnection.addStream(stream);
                //}


                _nativeStreams.push(stream);
            }

            function removeLocalNativeStreams(kind) {
                var RTCLocalStreams = localParticipant.iosrtcRTCPeerConnection.getLocalStreams();
                for (var t in RTCLocalStreams) {
                    if(kind != null) {
                        let videoTracks = RTCLocalStreams[t].getVideoTracks();
                        let audioTracks = RTCLocalStreams[t].getAudioTracks();
                        var currentStreamkind;
                        if (videoTracks.length != 0 && audioTracks.length == 0)
                            currentStreamkind = 'video';
                        else if (audioTracks.length != 0 && videoTracks.length == 0)
                            currentStreamkind = 'audio';

                        if (currentStreamkind != kind) continue;
                    }

                    RTCLocalStreams[t].stop();
                    localParticipant.iosrtcRTCPeerConnection.removeStream(RTCLocalStreams[t]);
                }
            }

            function createIosrtcLocalPeerConnection(callback) {

                var iosRTCPeerConnection = new iosrtcRTCPeerConnection(pc_config);
                localParticipant.iosrtcRTCPeerConnection = iosRTCPeerConnection;

                iosRTCPeerConnection.onicecandidate = function (e) {
                    gotIceCandidate(e);
                };

                iosRTCPeerConnection.onnegotiationneeded = function (e) {
                    if (iosRTCPeerConnection.connectionState == 'new' && iosRTCPeerConnection.iceConnectionState == 'new' && iosRTCPeerConnection.iceGatheringState == 'new') return;
                    createOffer();
                };

                if (callback != null) callback();
            }

            return {
                create: createIosrtcLocalPeerConnection,
                createOffer: createOffer,
                setAnswer: setAnswer,
                setOffer: setOffer,
                addIceCandidate: addIceCandidate,
                addStream: addStream,
                removeLocalNativeStreams: removeLocalNativeStreams
            }
        }())
    }

    function enableiOSDebug() {
        var ua=navigator.userAgent;
        if(ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) {
            console.stdlog = console.log.bind(console);

            console.log = function (txt) {

                if(!socket || socket && !socket.connected) return;

                try {
                    //originallog.apply(console, arguments);
                    var i, argument;
                    var argumentsString = '';
                    for (i = 1; argument = arguments[i]; i++){
                        if (typeof argument == 'object') {
                            argumentsString = argumentsString + ', OBJECT';
                        } else {
                            argumentsString = argumentsString + ', ' + argument;
                        }
                    }

                    socket.emit('Streams/webrtc/log', txt + argumentsString + '\n');
                    console.stdlog.apply(console, arguments);
                    latestConsoleLog = txt + argumentsString + '\n';
                } catch (e) {

                }
            }
        }
        console.stderror = console.error.bind(console);

        console.error = function (txt) {

            if(!socket || socket && !socket.connected) return;

            try {
                var err = (new Error);
            } catch (e) {

            }

            try {
                var i, argument;
                var argumentsString = '';
                for (i = 1; argument = arguments[i]; i++){
                    if (typeof argument == 'object') {
                        argumentsString = argumentsString + ', OBJECT';
                    } else {
                        argumentsString = argumentsString + ', ' + argument;
                    }
                }

                var today = new Date();
                var dd = today.getDate();
                var mm = today.getMonth() + 1;

                var yyyy = today.getFullYear();
                if (dd < 10) {
                    dd = '0' + dd;
                }
                if (mm < 10) {
                    mm = '0' + mm;
                }
                var today = dd + '/' + mm + '/' + yyyy + ' ' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();

                var errorMessage = "\n\n" + today + " Error: " + txt + ', ' +  argumentsString + "\nurl: " + location.origin + "\nline: ";

                if(typeof err != 'undefined' && typeof err.lineNumber != 'undefined') {
                    errorMessage = errorMessage + err.lineNumber + "\n " + ua+ "\n";
                } else if(typeof err != 'undefined' && typeof err.stack != 'undefined')
                    errorMessage = errorMessage + err.stack + "\n " + ua+ "\n";
                else errorMessage = errorMessage + "\n " + ua + "\n";
                socket.emit('Streams/webrtc/errorlog', errorMessage);
                console.stderror.apply(console, arguments);
            } catch (e) {
                console.error(e.name + ' ' + e.message)
            }
        }

        window.onerror = function(msg, url, line, col, error) {
            if(socket == null) return;
            var extra = !col ? '' : '\ncolumn: ' + col;
            extra += !error ? '' : '\nerror: ' + error;

            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth() + 1;

            var yyyy = today.getFullYear();
            if (dd < 10) {
                dd = '0' + dd;
            }
            if (mm < 10) {
                mm = '0' + mm;
            }
            var today = dd + '/' + mm + '/' + yyyy + ' ' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();

            var errMessage = "\n\n" + today + " Error: " + msg + "\nurl: " + url + "\nline: " + line + extra + "\nline: " + ua;

            socket.emit('Streams/webrtc/errorlog', errMessage);
        }

    }

    app.init = function(callback, oldLocalParticipant){
        app.state = 'connecting';
        log('app.init')
        log('initWithNodeJs');

        var findScript = function (src) {
            var scripts = document.getElementsByTagName('script');
            for (var i=0; i<scripts.length; ++i) {
                var srcTag = scripts[i].getAttribute('src');
                if (srcTag && srcTag.indexOf(src) != -1) {
                    return true;
                }
            }
            return null;
        };

        var ua=navigator.userAgent;
        if(ua.indexOf('Android')!=-1||ua.indexOf('Windows Phone')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) {
            _isMobile=true;
            app.views.isMobile(true);
            app.views.updateOrientation();
        } else app.views.isMobile(false);

        var onConnect = function () {
            log('initWithNodeJs: connected', socket);

            app.event.dispatch('connected');

            if(app.state == 'reconnecting') {
                app.state = 'connected';
                log('initWithNodeJs: socket: RECONNECTED')
                socket.emit('Streams/webrtc/joined', {username:localParticipant.identity, sid:localParticipant.sid, room:options.roomName, roomStartTime: options.roomStartTime, roomPublisher: options.roomPublisher, isiOS: _isiOS, info: _localInfo});
                localParticipant.sid = socket.id;
                return;
            }

            //enableiOSDebug();
            log('initWithNodeJs: socket: connected: ' + socket.connected + ',  app.state: ' +  app.state);
            log('initWithNodeJs: socket: localParticipant', localParticipant);
            if(localParticipant == null && oldLocalParticipant == null) {
                localParticipant = new Participant();
                localParticipant.sid = socket.id;
                localParticipant.identity = options.username;
                localParticipant.isLocal = true;
                localParticipant.online = true;
                roomParticipants.push(localParticipant);
            } else if(oldLocalParticipant != null) {
                log('initWithNodeJs: switchRoom');

                oldLocalParticipant.sid = socket.id;
                localParticipant = oldLocalParticipant;
                roomParticipants.push(localParticipant);
            }

            if(options.useCordovaPlugins && typeof cordova != 'undefined' && _isiOS) {
                iosrtcLocalPeerConnection.create(function () {
                    nativeLocalWebRTCPeerConnection.create(function () {
                        iosrtcLocalPeerConnection.createOffer();
                    })
                });
            }

            if(socket.connected && app.state == 'connecting') initOrConnectWithNodeJs(callback);
        }

        var connect = function (io, old) {
            log('initWithNodeJs: connect', options.nodeServer);

            //let io = io('/webrtc');
            var secure = options.nodeServer.indexOf('https://') == 0;
            if(old) {
                log('initWithNodeJs: connect old');

                socket = io.connect('/webrtc', options.nodeServer, function (io) {
                    log('initWithNodeJs: connect socket', io);

                    socket = io.socket;
                    socket.on('connect', onConnect);
                    onConnect();
                    socket.on('connect_error', function(e) {
                        log('initWithNodeJs: connect_error');
                        app.event.dispatch('connectError');
                        console.log('Connection failed');
                        console.error(e);
                    });

                    socket.on('reconnect_failed', function(e) {
                        log('initWithNodeJs: reconnect_failed');
                        console.log(e)
                        app.event.dispatch('reconnectError');
                    });
                    socket.on('reconnect_attempt', function(e) {
                        log('initWithNodeJs: reconnect_attempt');
                        console.log('reconnect_attempt', e)
                        app.state = 'reconnecting';
                        app.event.dispatch('reconnectAttempt', e);
                    });
                }, function () {
                    log('initWithNodeJs: connect old callback 2');

                });

            } else {
                log('initWithNodeJs: connect new');

                socket = io.connect(options.nodeServer + '/webrtc', {
                    transports: ['websocket'],
                    // path: options.roomName,
                    'force new connection': true,
                    /* channel:'webrtc',
                     publish_key:'webrtc_test',
                     subscribe:'webrtc_test',*/
                    secure:secure,
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    reconnectionAttempts: 5
                });
                socket.on('connect', onConnect);

                socket.on('connect_error', function(e) {
                    log('initWithNodeJs: connect_error');
                    app.event.dispatch('connectError');
                    console.log('Connection failed');
                    console.error(e);
                });

                socket.on('reconnect_failed', function(e) {
                    log('initWithNodeJs: reconnect_failed');
                    console.log(e)
                    app.event.dispatch('reconnectError');
                });
                socket.on('reconnect_attempt', function(e) {
                    log('initWithNodeJs: reconnect_attempt');
                    console.log('reconnect_attempt', e)
                    app.state = 'reconnecting';
                    app.event.dispatch('reconnectAttempt', e);
                });
            }

        }

        log('initWithNodeJs: find socket.io');

        if(typeof options.socket != null) {
            log('initWithNodeJs: use options.socket');
            connect(options.socket, true);
        } else if(findScript('socket.io.js') && typeof io != 'undefined') {
            log('initWithNodeJs: use existing');
            connect(io);
        } else if(2>1) {
            log('initWithNodeJs: add socket.io');

            var url = 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.5.1/socket.io.js'
            /*var xhr = new XMLHttpRequest();

            xhr.open('GET', url, true);

            xhr.onload = function(e) {
                var script = e.target.response || e.target.responseText;
                if (e.target.readyState === 4) {
                    switch( e.target.status) {
                        case 200:
                            eval.apply( window, [script] );
                            connect(io);
                            break;
                        default:
                            console.error("ERROR: script not loaded: ", url);
                    }
                }
            }
            xhr.send();*/

            var script = document.createElement('script');
			script.onload = function () {
				requirejs([url], function (io) {
					window.io = io;
					connect(io);
				});
			};
			script.src = 'https://requirejs.org/docs/release/2.2.0/minified/require.js';

			document.head.appendChild(script);

        }


        if(typeof screen != 'undefined' && screen.orientation != null) {
            screen.orientation.addEventListener("change", function() {
                if(_isMobile) app.views.updateOrientation();
            });
        }

        window.addEventListener("resize", function() {
            setTimeout(function () {
                if(_isMobile) app.views.updateOrientation();
            }, 1000);
        });
    }

    app.switchFrom = function(localParticipant, callback){
        app.state = 'connecting';
        log('app.switchFrom')
        log('app.switchFrom localParticipant', localParticipant.audioTracks())
        app.init(callback, localParticipant);
    }

    app.switchTo = function(publisherId, streamName){
        log('app.switchTo')
        return new Promise(function (resolve, reject) {
            var currentStreams = localParticipant.tracks.map(function (track) {
                return track.stream.clone();
            })
            var prevLocalParticipant = localParticipant.sid;
            var prevRoomId = options.roomName;

            var initOptions = options;
            initOptions.roomName = streamName;
            initOptions.roomPublisher = publisherId;
            initOptions.streams = [];
            initOptions.startWith = {
                audio: app.localMediaControls.micIsEnabled(),
                video: app.localMediaControls.cameraIsEnabled()
            };
            log('app.switchTo 2')

            var newConferenceInstance = new WebRTCRoomClient(initOptions);
            newConferenceInstance.mediaManager.canvasComposer = app.mediaManager.canvasComposer;
            newConferenceInstance.mediaManager.canvasComposer.videoComposer.refreshEventListeners(newConferenceInstance);
            //newConferenceInstance.mediaManager.canvasComposer.audioComposer.mix();
            newConferenceInstance.mediaManager.fbLive = app.mediaManager.fbLive;
            newConferenceInstance.mediaManager.fbLive.updateRoomInstance(newConferenceInstance);
            newConferenceInstance.mediaManager.audioVisualization = app.mediaManager.audioVisualization;
            newConferenceInstance.mediaManager.localRecorder = app.mediaManager.localRecorder;
            //newConferenceInstance.mediaManager = app.mediaManager;
            //newConferenceInstance.mediaManager.canvasComposer.videoComposer.refreshEventListeners(newConferenceInstance);

            //newConferenceInstance.init();
            log('app.switchTo 3')

            newConferenceInstance.switchFrom(localParticipant);
            log('app.switchTo 4')

            newConferenceInstance.event.on('initNegotiationEnded', function (roomParticipants) {
                log('app.switchTo: initNegotiationEnded')

                let newParticipantSid = newConferenceInstance.localParticipant().sid;
                newConferenceInstance.mediaManager.fbLive.switchRoom(newConferenceInstance, roomParticipants);
                newConferenceInstance.roomSwitched({prevParticipantId:prevLocalParticipant, prevRoom:prevRoomId});
                app.disconnect(true);
            });

            app.event.dispatch('switchRoom', {roomName: streamName});

            resolve(newConferenceInstance);
        });
    }

    app.roomSwitched = function(info) {
        socket.emit('Streams/webrtc/roomSwitched', info);
    }

    app.disconnect = function (switchRoom) {
        console.log('app.disconnect', switchRoom)
        if(app.checkOnlineStatusInterval != null) {
            clearInterval(app.checkOnlineStatusInterval);
            app.checkOnlineStatusInterval = null;
        }
        if(app.sendOnlineStatusInterval != null) {
            clearInterval(app.sendOnlineStatusInterval);
            app.sendOnlineStatusInterval = null;
        }

        if(!switchRoom && app.mediaManager.fbLive.isStreaming()) {
            console.log('app.disconnect: end fb live')
            app.mediaManager.fbLive.endStreaming();
        }
        console.log('app.disconnect: getMediaStream', app.mediaManager.canvasComposer.getMediaStream());
        if(!switchRoom) app.mediaManager.canvasComposer.stopStreamCapture();

        app.mediaManager.audioVisualization.stopAllVisualizations(switchRoom);

        for(let t in localParticipant.notForUsingTracks) {
            localParticipant.notForUsingTracks[t].stop();
        }

        for(var p = roomParticipants.length - 1; p >= 0; p--){

            if(!roomParticipants[p].isLocal) {
                if (roomParticipants[p].RTCPeerConnection != null) roomParticipants[p].RTCPeerConnection.close();
                if (roomParticipants[p].iosrtcRTCPeerConnection != null) roomParticipants[p].iosrtcRTCPeerConnection.close();
            }

            if((!roomParticipants[p].isLocal && switchRoom) || !switchRoom) {
                roomParticipants[p].online = false;
                roomParticipants[p].remove();
            }
        }


        if(socket != null) socket.disconnect();
        app.event.dispatch('disconnected');
        app.event.destroy();
        app.state = 'disconnected';
    }


    /**
     * Event system of app
     *
     * @method app.event
     * @return {Object}
     */
    function EventSystem(){

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

        var destroy = function () {
            events = {};
        }

        return {
            dispatch:dispatch,
            on:on,
            off:off,
            destroy:destroy
        }
    }

    function determineBrowser(ua) {
        var ua= navigator.userAgent, tem,
            M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if(/trident/i.test(M[1])){
            tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
            return 'IE '+(tem[1] || '');
        }
        if(M[1]=== 'Chrome'){
            tem= ua.match(/\b(OPR|Edge?)\/(\d+)/);
            if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera').replace('Edg ', 'Edge ');
        }
        M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
        if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
        return M;
    }

    function log(text) {
        if(options.debug === false) return;
        var args = Array.prototype.slice.call(arguments);
        var params = [];

        if (window.performance) {
            var now = (window.performance.now() / 1000).toFixed(3);
            params.push(now + ": " + args.splice(0, 1));
            params = params.concat(args);
            console.log.apply(console, params);
        } else {
            params.push(text);
            params = params.concat(args);
            console.log.apply(console, params);
        }

        app.event.dispatch('log', params);

    }

    return app;
}