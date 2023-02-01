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
        for (let key in defaultOptions) {
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

        for(let t in options.turnCredentials) {
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

    app.getLocalInfo = function () {
        return _localInfo;
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
        this.audioTracks = function (activeTracksOnly) {
            if(activeTracksOnly) {
                return this.tracks.filter(function (trackObj) {
                    return trackObj.kind == 'audio' && !(trackObj.mediaStreamTrack.muted == true || trackObj.mediaStreamTrack.enabled == false || trackObj.mediaStreamTrack.readyState == 'ended');
                });
            }

            return this.tracks.filter(function (trackObj) {
                return trackObj.kind == 'audio';
            });
        }
        this.muteAudio = function () {
            for(let i in this.tracks) {
                var track = this.tracks[i];
                if(track.kind != 'audio') continue;
                track.trackEl.muted = true;
            }
            this.audioIsMuted = true;
            app.event.dispatch('audioMuted', this);

        };
        this.unmuteAudio = function () {
            if(this.isAudioMuted == false) return;
            for(let i in this.tracks) {
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

            for(let t = this.tracks.length - 1; t >= 0; t--){

                if(this.tracks[t].mediaStreamTrack != null) {
                    this.tracks[t].mediaStreamTrack.stop();
                }
                if(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins && this.tracks[t].stream != null) {
                    this.tracks[t].stream.getTracks()[0].stop();
                }
            }

            if(this.RTCPeerConnection != null) this.RTCPeerConnection.close();

            if(options.useCordovaPlugins && typeof cordova != 'undefined' && _isiOS) iosrtcLocalPeerConnection.removeLocalNativeStreams();
            for(let p = roomParticipants.length - 1; p >= 0; p--){
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


                        for (let key in participant.soundMeter.visualizations) {
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
                            for (let key in participant.soundMeter.visualizations) {
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
                                for (let key in participant.soundMeter.visualizations) {
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
                //log('audiovis: audioVisualization: updatVisualizationWidth');
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
                for(let p = roomParticipants.length - 1; p >= 0; p--){
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
            log('attachTrack START:' + track.kind);
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
                }

                audioVisualization.createAudioAnalyser(track, participant)

            }

            track.participant = participant;

            var trackExist = participant.tracks.filter(function (t) {
                return t == track;
            })[0];
            if(trackExist == null) participant.tracks.push(track);
            if(participant.isLocal) {
                log('attachTrack: update current devices ');

                if(track.kind == 'video') app.localMediaControls.updateCurrentVideoInputDevice();
                if(track.kind == 'audio') app.localMediaControls.updateCurrentAudioInputDevice();
            }

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
            log('attachTrack: track attached: ', track);
            log('attachTrack: track attached: ' + track.mediaStreamTrack.id + ' stream:' + track.stream.id);
            log('attachTrack: REPORT START');

            /*if (participant.RTCPeerConnection) {
                participant.RTCPeerConnection.getStats(null).then((stats) => {
                    stats.forEach((report) => {
                        //console.log(`%c=====Report: ${report.type}=====`, 'background:red; color:white');
                        log(`=====Report: ${report.type}=====`);

                        Object.keys(report).forEach((statName) => {
                            if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
                                log(`${statName}: ${report[statName]}\n`);
                            }
                        });
                    });
                }).catch(function(e) {
                    log('attachTrack: REPORT ERROR');
                    console.error(e);
                });

            }*/
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
                    for (let i = 0; i < interleaved.length; i++) {
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
                    for (let i = 0; i < channelBuffer.length; i++) {
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

                    for (let index = 0; index < length;) {
                        result[index++] = leftChannel[inputIndex];
                        result[index++] = rightChannel[inputIndex];
                        inputIndex++;
                    }
                    return result;
                }

                function writeUTFBytes(view, offset, string) {
                    for (let i = 0; i < string.length; i++) {
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
            localRecorder:localRecorder
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
                    app.event.dispatch('screensharingStarted', {participant: localParticipant, track: trackToAttach});
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
                    app.event.dispatch('screensharingStarted', {participant: localParticipant, track: trackToAttach});
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
                    app.event.dispatch('screensharingStopped', {participant: localParticipant});
                }
            } if(!_isMobile) {
                var screenSharingTracks = localParticipant.tracks.filter(function (trackObj) {
                    return trackObj.kind == 'video' && trackObj.screensharing == true && trackObj.mediaStreamTrack.readyState != 'ended';
                });
                log('stopShareScreen screenSharingTracks', screenSharingTracks);

                app.localMediaControls.disableVideo(screenSharingTracks);
                if(screenSharingTracks.length != 0) {
                    socket.emit('Streams/webrtc/cameraDisabled');
                    app.event.dispatch('screensharingStopped', {participant: localParticipant});
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
                let track = localParticipant.tracks[t];
            if(track.screensharing && track.mediaStreamTrack && track.mediaStreamTrack.enabled == true && track.mediaStreamTrack.readyState != 'ended') return true;
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

            for (let i = 8; i < parts.length; i += 2) {
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

            for (let t in tracks){
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

            socket.on('Streams/webrtc/canITurnCameraAndMicOn', function (message){

                log('got canITurnCameraAndMicOn ANSWER', message);

                app.event.dispatch('canITurnCameraAndMicOn', message);
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

                if(!participant) return; 
                message.participant = participant;

                participant.localMediaControlsState.camera = true;

                app.event.dispatch('someonesCameraEnabled', message);

            });
            socket.on('Streams/webrtc/cameraDisabled', function (message){
                console.log('got cameraDisabled', message, localParticipant.sid);
                var participant = roomParticipants.filter(function (roomParticipant) {
                    return roomParticipant.sid == message.fromSid || roomParticipant.sid == '/webrtc#' + message.fromSid;
                })[0];

                if(!participant) return; 
                message.participant = participant;

                participant.localMediaControlsState.camera = false;

                app.event.dispatch('someonesCameraDisabled', message);

            });
            socket.on('Streams/webrtc/micEnabled', function (message){
                log('got micEnabled', message, localParticipant.sid);
                var participant = roomParticipants.filter(function (roomParticipant) {
                    return roomParticipant.sid == message.fromSid || roomParticipant.sid == '/webrtc#' + message.fromSid;
                })[0];

                if(!participant) return; 
                message.participant = participant;

                participant.localMediaControlsState.mic = true;

                app.event.dispatch('someonesMicEnabled', message);

            });
            socket.on('Streams/webrtc/micDisabled', function (message){
                log('got micDisabled', message, localParticipant.sid);
                var participant = roomParticipants.filter(function (roomParticipant) {
                    return roomParticipant.sid == message.fromSid || roomParticipant.sid == '/webrtc#' + message.fromSid;
                })[0];

                if(!participant) return; 
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
                        for (let t in localTracks) {
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
                            for (let t in localTracks) {
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
                        var screensharingTracks = localParticipant.tracks.filter(function(t){
                            return t.screensharing == true && t.mediaStreamTrack.enabled == true && t.mediaStreamTrack.readyState == 'live' ? true : false
                        })

                        
                        if(screensharingTracks.length != 0) {
                            app.signalingDispatcher.sendDataTrackMessage("screensharingStarted", {trackId:screensharingTracks[0].mediaStreamTrack.id});
                        }
                        console.log('sendInitialData', screensharingTracks.length)

                        dataChannel.removeEventListener('open', sendInitialData);
                        app.event.dispatch('dataChannelOpened', {dataChannel:dataChannel, participant:participant});
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
            for(let i = 0; i < sdpLines.length - 1; i++) {
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
                for(let r in tracksToRemove) {
                    var ttr = tracksToRemove[r];
                    for(let i = ttr.startLine; i <= ttr.endLine; i++){
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

                        for(let i = senderParticipant.iceCandidatesQueue.length - 1; i >= 0 ; i--){
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
                    for(let s = audioSenders.length - 1; s >= 0 ; s--){

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

                for (let s in streams) {
                    if(streams[s] == null) continue;
                    var localTracks = streams[s].getTracks();

                    for (let i in localTracks) {
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
                for (let s in streams) {
                    if(streams[s] == null) continue;
                    console.log('streams[s]', s, streams, streams[s])
                    var localTracks = streams[s].getTracks();

                    for (let i in localTracks) {
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

                if(options.startWith.video === true) {
                    app.localMediaControls.enableVideo();
                }
                if(options.startWith.audio === true) {
                    app.localMediaControls.enableAudio();
                }
                app.localMediaControls.loadDevicesList();
            }


            function log(text) {
                if(!options.debug.signaling) return;
                var args = Array.prototype.slice.call(arguments);
                appLog.apply(null, args);
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
                    }
                    if (device.kind == 'audioinput') {
                        audioInputDevices.push(device);
                    } else if (device.kind == 'audiooutput') {
                        if(currentAudioOutputDevice == null && (device.deviceId == 'default' || device.label == 'default')) {
                            currentAudioOutputDevice = device;
                        }
                        audioOutputDevices.push(device);
                    } else if (device.kind.indexOf('audio') != -1) {
                        audioInputDevices.push(device);
                    }
                }
                updateCurrentVideoInputDevice();
                updateCurrentAudioInputDevice();
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

        function updateCurrentVideoInputDevice() {
            log('updateCurrentVideoInputDevice START');
            for (let i in videoInputDevices) {
                let device = videoInputDevices[i];
                for (let x in localParticipant.tracks) {
                    var mediaStreamTrack = localParticipant.tracks[x].mediaStreamTrack;

                    log('updateCurrentVideoInputDevice: video: mediaStreamTrack', mediaStreamTrack);
                    log('updateCurrentVideoInputDevice: video: check if current', mediaStreamTrack.enabled == true, typeof mediaStreamTrack.getSettings != 'undefined', mediaStreamTrack.getSettings().deviceId == device.deviceId, mediaStreamTrack.getSettings().label == device.label);
                    log('updateCurrentVideoInputDevice: video: check if current', mediaStreamTrack.getSettings().deviceId, device.deviceId);
                    if (!(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins)) {
                        if (mediaStreamTrack.enabled == true && mediaStreamTrack.readyState != 'ended'
                            && ((typeof mediaStreamTrack.getSettings != 'undefined' && (mediaStreamTrack.getSettings().deviceId == device.deviceId || mediaStreamTrack.getSettings().label == device.label)) || mediaStreamTrack.label == device.label)) {
                                log('updateCurrentVideoInputDevice: video:currentCameraDevice', currentCameraDevice, device, currentCameraDevice == device);

                            if(currentCameraDevice != device) {
                                currentCameraDevice = device;
                                app.event.dispatch('currentVideoinputDeviceChanged');
                            }
                        }
                    }
                }
            }
        }

        function updateCurrentAudioInputDevice() {
            log('updateCurrentAudioInputDevice');
            for (let i in audioInputDevices) {
                let device = audioInputDevices[i];
                for (let x in localParticipant.tracks) {
                    var mediaStreamTrack = localParticipant.tracks[x].mediaStreamTrack;

                    log('updateCurrentAudioInputDevice: audio: mediaStreamTrack', mediaStreamTrack);
                    log('updateCurrentAudioInputDevice: audio: check if current', mediaStreamTrack.enabled == true, typeof mediaStreamTrack.getSettings != 'undefined', mediaStreamTrack.getSettings().deviceId == device.deviceId, mediaStreamTrack.getSettings().label == device.label);
                    log('updateCurrentAudioInputDevice: audio: check if current', mediaStreamTrack.getSettings().deviceId, device.deviceId);
                    if (!(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins)) {
                        if (mediaStreamTrack.enabled == true
                            && ((typeof mediaStreamTrack.getSettings != 'undefined' && (mediaStreamTrack.getSettings().deviceId == device.deviceId || mediaStreamTrack.getSettings().label == device.label)) || mediaStreamTrack.label == device.label)) {
                            if(currentAudioInputDevice != device) {
                                currentAudioInputDevice = device;
                                app.event.dispatch('currentAudioinputDeviceChanged');
                            }
                        }
                    }
                }
            }
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
            log('canITurnCameraOn');
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

        function canITurnCameraAndMicOn() {
            log('canITurnCameraAndMicOn');
            return new Promise((resolve, reject) => {

                if (!socket) {
                    reject('No socket connection.');
                } else {
                    socket.emit('Streams/webrtc/canITurnCameraAndMicOn', {
                        type: "request",
                    });
                    log('canITurnCameraAndMicOn sent')

                    var reseivedAnswer = function (e) {
                        log('canITurnCameraAndMicOn reseivedAnswer', e)

                        if(e.answerValue === true) {
                            resolve({answer: true, fromSid: e.fromSid, limit: e.limit});
                        } else {
                            resolve({answer: false, limit: e.limit});
                        }

                        app.event.off('canITurnCameraAndMicOn', reseivedAnswer);
                    }
                    app.event.on('canITurnCameraAndMicOn', reseivedAnswer);
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
            };

            if(deviceToSwitch == null) videoInputDevices[0];

            var constraints
            if(camera != null && camera.deviceId != null && camera.deviceId != '') {
                log('toggleCameras: 1');
                constraints = {deviceId: {exact: camera.deviceId}};
                if(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins) {
                    constraints = {deviceId: camera.deviceId}
                }
            } else if(camera != null && camera.groupId != null && camera.groupId != '') {
                log('toggleCameras: 2');
                constraints = {groupId: {exact: camera.groupId}};
                if(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins) {
                    constraints = {groupId: camera.groupId}
                }
            } else if(deviceToSwitch != null && deviceToSwitch.deviceId != null && deviceToSwitch.deviceId != '') {
                log('toggleCameras: 3');
                constraints = {groupId: {exact: deviceToSwitch.groupId}};
                if(typeof cordova != 'undefined' && _isiOS && options.useCordovaPlugins) {
                    constraints = {groupId: deviceToSwitch.groupId}
                }
            } else {
                log('toggleCameras: 4');
                constraints = true;
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
            app.event.dispatch('currentAudiooutputDeviceChanged');
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
                for (let x in participant.tracks) {
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

            for (let p in roomParticipants) {

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
                                            localParticipant.tracks[i].mediaStreamTrack.stop();
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
            for (let p in roomParticipants) {

                if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null && roomParticipants[p].RTCPeerConnection.connectionState != 'closed') {
                    if('ontrack' in roomParticipants[p].RTCPeerConnection) {

                        log('enableVideoTracks: local videoTracks num = ' + videoTracks.length);

                        for (let t in videoTracks) {
                            log('enableVideoTracks: addTrack: id = ' + (videoTracks[t].mediaStreamTrack.id), videoTracks[t].stream.id);
                            let videoSenderExist = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (sender) {
                                return sender.track != null && sender.track.kind == 'video' && sender.track.id == videoTracks[t].mediaStreamTrack.id;
                            })[0];
                            log('enableVideoTracks videoSenderExist ' + videoSenderExist != null);
                            if(!videoSenderExist) roomParticipants[p].RTCPeerConnection.addTrack(videoTracks[t].mediaStreamTrack, videoTracks[t].stream);
                            /*var params = sender.getParameters();

                            for (let i = 0; i < params.codecs.length; i++) {
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


            app.localMediaControls.updateCurrentVideoInputDevice();
            localParticipant.localMediaControlsState.camera = true;
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

                        for(let s = videoSenders.length - 1; s >= 0 ; s--){

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
                        for (let s in RTCLocalStreams) {
                            log('disableVideoTracks: remove stream from PC')

                            let skip = false;
                            let videoTracks = RTCLocalStreams[s].getVideoTracks();
                            for(let v in videoTracks) {
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

            localParticipant.localMediaControlsState.camera = false;
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
                                localParticipant.localMediaControlsState.mic = true;
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
                    for(let s = audioSenders.length - 1; s >= 0 ; s--){

                        for(let i = localParticipant.tracks.length - 1; i >= 0 ; i--){

                            if(localParticipant.tracks[i].mediaStreamTrack.id == audioSenders[s].track.id) {
                                log('enableAudioTracks: track already exists');
                                trackExists = true;
                            }
                        }
                    }

                    //if(trackExists) continue;

                    if(_isiOS && typeof cordova == 'undefined') {
                        for (let t in audioTracks) {
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
                        for (let t in audioTracks) {
                            log('enableAudioTracks: add track: enabled = ' + audioTracks[t].mediaStreamTrack.enabled);
                            log('enableAudioTracks: add track: muted = ' + audioTracks[t].mediaStreamTrack.muted);
                            roomParticipants[p].RTCPeerConnection.addTrack(audioTracks[t].mediaStreamTrack);
                        }
                    }

                } else {
                    log('enableAudioTracks: enable tracks of stream')

                    var RTCLocalStreams = roomParticipants[p].RTCPeerConnection.getLocalStreams();
                    for (let s in RTCLocalStreams) {
                        var audioTracks = RTCLocalStreams[s].getAudioTracks();
                        for(let v in audioTracks) {
                            audioTracks[v].enabled = true;
                        }

                    }
                }
            }
            micIsDisabled = false;
            app.localMediaControls.updateCurrentAudioInputDevice();
            localParticipant.localMediaControlsState.mic = true;
            socket.emit('Streams/webrtc/micEnabled');
            app.signalingDispatcher.sendDataTrackMessage('online', {micIsEnabled: true});
            app.event.dispatch('micEnabled');

        }

        /*removes track from each peer connections but keeps audio track active. We need to left mediatrack active
        to keep mic premissions active to avoid autoplay issues*/
        function disableAudioTracks() {
            log('disableAudioTracks')
            if(micIsDisabled) return;

            for (let p in roomParticipants) {

                if (roomParticipants[p].RTCPeerConnection && 'ontrack' in roomParticipants[p].RTCPeerConnection) {
                    if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null && roomParticipants[p].RTCPeerConnection.connectionState != 'closed') {
                        var audioSenders = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (sender) {
                            return sender.track && sender.track.kind == 'audio';
                        });

                        for(let s = audioSenders.length - 1; s >= 0 ; s--){
                            roomParticipants[p].RTCPeerConnection.removeTrack(audioSenders[s]);
                        }
                    }
                } else {

                    if(localParticipant.audioStream == null) return;

                    if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null && roomParticipants[p].RTCPeerConnection.connectionState != 'closed') {
                        var RTCLocalStreams = roomParticipants[p].RTCPeerConnection.getLocalStreams();
                        for (let s in RTCLocalStreams) {
                            var audioTracks = RTCLocalStreams[s].getAudioTracks();
                            for(let v in audioTracks) {
                                log('disableAudioTracks: disable track of stream');
                                audioTracks[v].enabled = false;
                            }

                        }

                    }

                }
            }

            micIsDisabled = true;
            currentAudioInputDevice = null;
            localParticipant.localMediaControlsState.mic = false;
            socket.emit('Streams/webrtc/micDisabled');
            app.event.dispatch('micDisabled');
            var info = {
                micIsEnabled: false
            }
            app.signalingDispatcher.sendDataTrackMessage('online', info);
        }

        function log(text) {
            if(!options.debug.controls) return;
            var args = Array.prototype.slice.call(arguments);
            appLog.apply(null, args);
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
            updateCurrentVideoInputDevice: updateCurrentVideoInputDevice,
            updateCurrentAudioInputDevice: updateCurrentAudioInputDevice,
            videoInputDevices: getVideoDevices,
            audioInputDevices: getAudioInputDevices,
            audioOutputDevices: getAudioOutputDevices,
            currentCameraDevice: getCurrentCameraDevice,
            frontCameraDevice: getFrontCameraDevice,
            currentAudioInputDevice: getCurrentAudioInputDevice,
            currentAudioOutputDevice: getCurrentAudioOutputDevice,
            getRoomLimitsInfo: getRoomLimitsInfo,
            canITurnCameraOn: canITurnCameraOn,
            canITurnMicOn: canITurnMicOn,
            canITurnCameraAndMicOn: canITurnCameraAndMicOn
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
            for(let i in mediaDevices) {
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
            for(let i in mediaDevices) {
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

                                    for (let i in iceQueue) {
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
                for (let t in localTracks) {
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
                    for (let i in iceQueue) {
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
                for (let t in RTCLocalStreams) {
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
            for (let i=0; i<scripts.length; ++i) {
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
                    query: {
                        limitsEnabled: options.limits && (options.limits.video || options.limits.audio)
                    },
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
        } else {
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
            log('app.switchTo 2 initOptions', initOptions)

            var newConferenceInstance = new WebRTCRoomClient(initOptions);
            app.event.dispatch('beforeSwitchRoom', {
                newWebrtcSignalingLibInstance: newConferenceInstance, 
                roomName: streamName
            });

            //newConferenceInstance.mediaManager.canvasComposer = app.mediaManager.canvasComposer;
            //newConferenceInstance.mediaManager.canvasComposer.videoComposer.refreshEventListeners(newConferenceInstance);
            //newConferenceInstance.mediaManager.canvasComposer.audioComposer.mix();
            //newConferenceInstance.mediaManager.fbLive = app.mediaManager.fbLive;
            //newConferenceInstance.mediaManager.fbLive.updateRoomInstance(newConferenceInstance);
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
        app.event.dispatch('beforeDisconnect', {
            roomIsSwitching: switchRoom
        });

        app.mediaManager.audioVisualization.stopAllVisualizations(switchRoom);

        for(let t in localParticipant.notForUsingTracks) {
            localParticipant.notForUsingTracks[t].stop();
        }

        for(let p = roomParticipants.length - 1; p >= 0; p--){

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

    function appLog(){
        var args = Array.prototype.slice.call(arguments);
        log.apply(null, args);
    }

    return app;
}