/**
 * Library for real time calls based on WebRTC
 * @module WebRTCconferenceLib
 * @class WebRTCconferenceLib
 * @param {Object} [options] config options
 * @param {String} [options.mode = 'node'] node|twilio mode that will use library for realtime calls. If mode is 'twilio' it will use twilio-video.js library, so twilio account's credentials should be specified in app.json
 * @param {String} [options.nodeServer] address of node websocket server that is used as signalling server while WebRTC negotiation
 * @param {String} [options.roomName] unique string that is used as room identifier
 * @param {Boolean} [options.audio] if true, library will request acces to microphone and adds to call
 * @param {Boolean} [options.video] if true, library will request acces to microphone and adds to call
 * @param {Boolean} [options.startWith.audio] if true, microphone icon by default is turned on
 * @param {Boolean} [options.startWith.video] if true, microphone icon by default is turned on
 * @param {Array} [streams] Precreated streams that will be added to call
 * @param {String} [twilioAccessToken] is required for accessing to Twilio API in 'twilio' mode. Token is created on server
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
 * @param {Boolean} [liveStreaming.drawBackground] whether to draw background behid participants video on canvas
 * @param {Number} [liveStreaming.timeSlice] time in ms - video will be send in chunks once per <timeSlice>
 * @param {Number} [liveStreaming.chunkSize] size in bytes (if timeSlice not specified) - size of chunk to send on server
 * @param {Object} [TwilioInstance] if mode is 'twilio', it is instance of Twilio Video library
 * @return {Object} instance of WebRTC chat
 */
window.WebRTCconferenceLib = function app(options){
    var app = {};
    var defaultOptions = {
        mode: 'node',
        nodeServer: '',
        roomName: null,
        roomPublisher: null,
        audio: false,
        video: false,
        startWith: {},
        showScreenSharingInSeparateScreen: false,
        streams: null,
        sounds: null,
        twilioAccessToken: null,
        disconnectTime: 3000,
        turnCredentials: null,
        username: null,
        debug: null,
        onlyOneScreenSharingAllowed: null,
        liveStreaming: {},
        TwilioInstance: null
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

    var Twilio;
    var mainView;
    var joinFormView;
    var roomsMedia;

    var twilioRoom;

    var roomScreens = [];
    app.screens = function(all) {
        if(all) {
            return roomScreens;
        } else {
            return roomScreens.filter(function (screen) {
                return (screen.isActive == true);
            });
        }
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


    app.addParticipant = function(participant) {roomParticipants.unshift(participant);}

    var localParticipant;
    app.localParticipant = function() { return localParticipant; }
    app.state = 'disconnected';
    app.initNegotiationState = 'disconnected';

    //node.js vars
    var socket;
    app.socketConnection = function() { return localParticipant; }


    var _isMobile;
    var _isiOS;
    var _isAndroid;
    var _usesUnifiedPlan =  RTCRtpTransceiver.prototype.hasOwnProperty('currentDirection');

    var pc_config = {
        /*"iceTransportPolicy": "relay",*/
        "iceServers": [
            {
                "urls": "stun:stun.l.google.com:19302"
            },
            /* {
				 'url': 'turn:194.44.93.224:3478?transport=udp',
				 'credential': 'asdf',
				 'username': 'qbix'
			 }*/
        ],
        "sdpSemantics":"unified-plan"
    };

    var ua = navigator.userAgent;
    if(!_usesUnifiedPlan) {
        pc_config.sdpSemantics = 'plan-b';
    }

    var testPeerConnection = new RTCPeerConnection(pc_config);

    if(options.turnCredentials != null) {
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
    }

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
        browserVersion: parseInt(browser[1])
    }

    var icons = {
        camera: '<svg class="camera-icon" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="-0.165 -0.245 99.499 99.498" enable-background="new -0.165 -0.245 99.499 99.498"    xml:space="preserve">  <path fill="#FFFFFF" d="M49.584-0.245c-27.431,0-49.749,22.317-49.749,49.749c0,27.432,22.317,49.749,49.749,49.749   c27.432,0,49.75-22.317,49.75-49.749C99.334,22.073,77.016-0.245,49.584-0.245z M77.156,60.693l-15.521-8.961v8.51H25.223v-23.42   h36.412v8.795l15.521-8.961V60.693z"/>  </svg>',
        disabledCamera: '<svg  version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="-0.165 -0.245 99.499 99.498" enable-background="new -0.165 -0.245 99.499 99.498"    xml:space="preserve">  <path fill="#FFFFFF" d="M49.584-0.245c-27.431,0-49.749,22.317-49.749,49.749c0,27.432,22.317,49.749,49.749,49.749   c27.432,0,49.75-22.317,49.75-49.749C99.334,22.073,77.016-0.245,49.584-0.245z M49.584,95.203   c-25.198,0-45.698-20.501-45.698-45.699s20.5-45.699,45.698-45.699c25.199,0,45.699,20.5,45.699,45.699S74.783,95.203,49.584,95.203   z"/>  <polygon fill="#FFFFFF" points="61.635,39.34 43.63,60.242 61.635,60.242 61.635,51.732 77.156,60.693 77.156,36.656 61.635,45.617    "/>  <polygon fill="#FFFFFF" points="25.223,36.822 25.223,60.242 34.391,60.242 54.564,36.822 "/>  <rect x="47.585" y="11.385" transform="matrix(0.7578 0.6525 -0.6525 0.7578 43.3117 -20.7363)" fill="#C12337" width="4" height="73.163"/>  </svg>',
        microphone:'<svg class="microphone-icon" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"    y="0px" viewBox="-0.165 -0.245 99.499 99.498"    enable-background="new -0.165 -0.245 99.499 99.498" xml:space="preserve">  <path fill="#FFFFFF" d="M49.584-0.245c-27.431,0-49.749,22.317-49.749,49.749c0,27.432,22.317,49.749,49.749,49.749   c27.432,0,49.75-22.317,49.75-49.749C99.334,22.073,77.016-0.245,49.584-0.245z M41.061,32.316c0-4.655,3.775-8.43,8.431-8.43   c4.657,0,8.43,3.774,8.43,8.43v19.861c0,4.655-3.773,8.431-8.43,8.431c-4.656,0-8.431-3.775-8.431-8.431V32.316z M63.928,52.576   c0,7.32-5.482,13.482-12.754,14.336v5.408h6.748v3.363h-16.86V72.32h6.749v-5.408c-7.271-0.854-12.753-7.016-12.754-14.336v-10.33   h3.362v10.125c0,6.115,4.958,11.073,11.073,11.073c6.116,0,11.073-4.958,11.073-11.073V42.246h3.363V52.576z"/>  </svg>',
        disabledMicrophone:'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="0.049 -0.245 99.499 99.498" enable-background="new 0.049 -0.245 99.499 99.498"    xml:space="preserve">  <path fill="#FFFFFF" d="M49.797,99.253c-27.431,0-49.749-22.317-49.749-49.749c0-27.431,22.317-49.749,49.749-49.749   c27.432,0,49.75,22.317,49.75,49.749C99.548,76.936,77.229,99.253,49.797,99.253z M49.797,3.805   c-25.198,0-45.698,20.5-45.698,45.699s20.5,45.699,45.698,45.699c25.2,0,45.7-20.501,45.7-45.699S74.997,3.805,49.797,3.805z"/>  <path fill="#FFFFFF" d="M49.798,60.607c4.657,0,8.43-3.775,8.43-8.431v-8.634L44.893,59.024   C46.276,60.017,47.966,60.607,49.798,60.607z"/>  <path fill="#FFFFFF" d="M58.229,32.316c0-4.656-3.773-8.43-8.43-8.43c-4.656,0-8.43,3.775-8.431,8.43v19.861   c0,0.068,0.009,0.135,0.01,0.202l16.851-19.563V32.316z"/>  <path fill="#FFFFFF" d="M48.117,66.912v5.408h-6.749v3.363h16.86V72.32h-6.748v-5.408c7.271-0.854,12.754-7.016,12.754-14.336   v-10.33H60.87v10.125c0,6.115-4.957,11.073-11.072,11.073c-2.537,0-4.867-0.862-6.733-2.297l-2.305,2.675   C42.813,65.475,45.331,66.585,48.117,66.912z"/>  <path fill="#FFFFFF" d="M38.725,52.371V42.246h-3.362v10.33c0,1.945,0.397,3.803,1.102,5.507l2.603-3.022   C38.852,54.198,38.725,53.301,38.725,52.371z"/>  <rect x="47.798" y="11.385" transform="matrix(0.7578 0.6525 -0.6525 0.7578 43.3634 -20.8757)" fill="#C12337" width="4" height="73.163"/>  </svg>',
        endCall: '<svg version="1.1"    xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/"    x="0px" y="0px" viewBox="-0.291 -0.433 230 230" enable-background="new -0.291 -0.433 230 230"    xml:space="preserve">  <defs>  </defs>  <path fill="#C12236" d="M114.422,228.845C51.33,228.845,0,177.514,0,114.422C0,51.33,51.33,0,114.422,0   s114.423,51.33,114.423,114.422C228.845,177.514,177.515,228.845,114.422,228.845z M114.422,9.315   C56.466,9.315,9.315,56.466,9.315,114.422s47.151,105.107,105.107,105.107c57.957,0,105.107-47.151,105.107-105.107   S172.379,9.315,114.422,9.315z"/>  <path fill-rule="evenodd" clip-rule="evenodd" fill="#C12337" d="M48.375,111.046c-0.664,1.316-1.611,2.92-2.065,4.541   c-1.356,4.839-2.112,14.78,2.549,17.842c2.607,1.713,5.979,1.069,8.826,1.111c3.344,0.049,5.93,0.229,8.771,0.217   c4.818-0.021,13.588,1.619,16.644-2.956c3.33-4.986-0.959-9.42,2.013-14.331c2.396-3.958,9.311-5.427,13.066-6.184   c10.175-2.051,18.202-2.478,29.615-0.585c4.551,0.755,12.535,2.3,15.838,6.334c3.666,4.476-1.481,12.21,3.761,16.249   c2.694,2.077,6.099,1.577,9.13,1.575c3.183-0.003,5.826-0.139,8.682-0.122c5.307,0.032,13.455,2.128,16.858-2.832   c2.741-3.994,0.906-11.205,0.905-14.399c-0.158-1.169-0.457-2.3-0.898-3.393c-2.855-11.688-20.192-19.097-33.174-22.435   c-22.619-5.815-46.142-4.622-64.881-0.965c-1.395,0.218-2.752,0.578-4.071,1.079c-0.491-0.026-0.944,0.094-1.357,0.359   c-1.281,0.188-2.526,0.517-3.732,0.989c-8.698,3.484-17.809,5.413-24.858,15.118C49.383,108.49,48.274,110.399,48.375,111.046z"/> </svg>',
        dots: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve">  <circle fill="#FFFFFF" cx="50.804" cy="16.167" r="10"/>  <circle fill="#FFFFFF" cx="50.804" cy="51.166" r="10"/>  <circle fill="#FFFFFF" cx="50.804" cy="86.166" r="10"/>  </svg>',
        screen: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="0.074 0.053 99.499 99.498" enable-background="new 0.074 0.053 99.499 99.498"    xml:space="preserve">  <rect x="27.102" y="34.876" fill="#FFFFFF" width="45.375" height="24.868"/>  <path fill="#FFFFFF" d="M49.822,0.053c-27.432,0-49.749,22.317-49.749,49.749c0,27.432,22.317,49.749,49.749,49.749   c27.433,0,49.75-22.317,49.75-49.749C99.572,22.371,77.255,0.053,49.822,0.053z M76.494,63.377H53.436v5.196h5.43v3.75H40.782v-3.75   h5.43v-5.196h-23.06V31.281h53.343V63.377z"/>  </svg>',
        user: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="0.251 0.251 99.498 99.498" enable-background="new 0.251 0.251 99.498 99.498"    xml:space="preserve">  <path fill="#FFFFFF" d="M49.999,0.251C22.568,0.251,0.251,22.568,0.251,50c0,27.432,22.317,49.749,49.748,49.749   c27.433,0,49.75-22.317,49.75-49.749C99.749,22.568,77.432,0.251,49.999,0.251z M50.085,27.266c6.663,0,12.062,5.83,12.062,13.021   c0,7.19-5.4,13.02-12.062,13.02c-6.66,0-12.061-5.83-12.061-13.02C38.024,33.096,43.425,27.266,50.085,27.266z M25.789,70.721   c0.593-9.297,11.208-16.71,24.207-16.71c13.001,0,23.619,7.412,24.215,16.71H25.789z"/>  </svg>',
        backArrow: '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    width="35.317px" height="35.445px" viewBox="0 0 35.317 35.445" enable-background="new 0 0 35.317 35.445" xml:space="preserve">  <polyline fill="none" stroke="#000000" stroke-width="4" stroke-miterlimit="10" points="19.135,34.031 2.828,17.722 19.135,1.414    "/>  <line fill="none" stroke="#000000" stroke-width="4" stroke-miterlimit="10" x1="2.645" y1="17.722" x2="35.317" y2="17.722"/>  </svg>',
        enabledSpeaker: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="0 0 99.999 99.999" enable-background="new 0 0 99.999 99.999" xml:space="preserve">  <path fill="#FFFFFF" d="M50,0C22.431,0,0,22.43,0,50c0,27.571,22.429,50,50,50c27.569,0,50-22.429,50-50   C99.999,22.431,77.568,0,50,0z M45.261,67.689c0,0.148-0.188,0.191-0.261,0.326c-0.026,0.049-0.149,0.098-0.187,0.141   c-0.076,0.084-0.217,0.146-0.324,0.188c-0.053,0.018-0.131,0.029-0.188,0.033c-0.056,0.008-0.125,0.006-0.18-0.004   c-0.15-0.021-0.186-0.292-0.316-0.364l-10.094-7.804h-8.544c-0.06,0-0.121,0.224-0.179,0.21c-0.058-0.016-0.114,0.077-0.166,0.05   c-0.105-0.061-0.192-0.089-0.252-0.193c-0.03-0.053-0.162-0.079-0.178-0.137c-0.015-0.059-0.132-0.089-0.132-0.15V40.02   c0-0.06,0.117-0.121,0.132-0.178c0.016-0.058,0.094-0.114,0.123-0.166c0.03-0.052,0.095-0.1,0.137-0.143   c0.086-0.086,0.206-0.209,0.322-0.242c0.058-0.016,0.133-0.086,0.193-0.086h8.545l10.089-7.51c0.049-0.028,0.095-0.03,0.146-0.052   c0.141-0.059,0.184-0.031,0.333-0.035c0.055,0.012,0.11,0.032,0.165,0.045c0.05,0.025,0.104,0.048,0.151,0.079   c0.046,0.031,0.09,0.07,0.127,0.112c0.077,0.084,0.31,0.187,0.337,0.296c0.013,0.055,0.2,0.113,0.2,0.169V67.689z M53.839,60.984   c-0.25,0-0.502-0.095-0.695-0.283c-0.396-0.386-0.406-1.019-0.021-1.412c9.075-9.354,0.391-18.188,0.018-18.56   c-0.396-0.389-0.396-1.022-0.01-1.415c0.393-0.392,1.024-0.393,1.415-0.005c0.105,0.105,10.449,10.615,0.016,21.372   C54.361,60.883,54.102,60.984,53.839,60.984z M60.025,66.293c-0.25,0-0.502-0.094-0.693-0.281c-0.396-0.385-0.406-1.02-0.021-1.414   c14.265-14.703,0.603-28.596,0.015-29.181c-0.394-0.389-0.396-1.022-0.007-1.414c0.392-0.392,1.023-0.393,1.414-0.005   c0.158,0.157,15.638,15.888,0.015,31.991C60.548,66.189,60.289,66.293,60.025,66.293z M66.607,70.43   c-0.197,0.203-0.459,0.301-0.719,0.301c-0.252,0-0.502-0.094-0.697-0.279c-0.396-0.387-0.404-1.02-0.021-1.414   c18.603-19.174,0.781-37.296,0.015-38.06c-0.394-0.389-0.396-1.022-0.006-1.414c0.389-0.392,1.022-0.394,1.413-0.005   C66.794,29.759,86.568,49.853,66.607,70.43z"/>  </svg>  ',
        disabledSpeaker: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="0 0 99.999 99.999" enable-background="new 0 0 99.999 99.999" xml:space="preserve">  <path fill="#FFFFFF" d="M50,0C22.431,0,0,22.43,0,50c0,27.571,22.429,50,50,50c27.568,0,49.999-22.429,49.999-50   C99.999,22.431,77.568,0,50,0z M50,95.929C24.675,95.929,4.071,75.325,4.071,50C4.071,24.675,24.675,4.07,50,4.07   C75.324,4.07,95.927,24.674,95.927,50C95.927,75.326,75.324,95.929,50,95.929z"/>  <g>   <path fill="#FFFFFF" d="M43.8,68.242c0.13,0.072,0.16,0.109,0.31,0.131c0.055,0.01,0.113,0.012,0.169,0.004    c0.056-0.004,0.112-0.016,0.165-0.033c0.107-0.041,0.203-0.104,0.279-0.188c0.038-0.043,0.277-0.092,0.303-0.141    c0.072-0.135,0.287-0.178,0.287-0.326v-6.393l-4.271,4.722L43.8,68.242z"/>   <path fill="#FFFFFF" d="M45.314,32.309c0-0.056-0.213-0.113-0.227-0.168c-0.027-0.109-0.185-0.211-0.261-0.295    c-0.037-0.042-0.132-0.079-0.178-0.11c-0.047-0.031-0.126-0.05-0.177-0.075c-0.055-0.013-0.123-0.025-0.178-0.037    c-0.149,0.004-0.199-0.008-0.339,0.051c-0.051,0.022-0.1,0.291-0.149,0.319l-10.092,7.808h-8.545c-0.06,0-0.121-0.228-0.179-0.212    c-0.117,0.032-0.223-0.024-0.309,0.062c-0.042,0.043-0.079,0.032-0.109,0.084c-0.03,0.052-0.135,0.078-0.151,0.136    c-0.016,0.057-0.105,0.088-0.105,0.148v19.964c0,0.062,0.09,0.121,0.105,0.18c0.016,0.058,0.08,0.113,0.11,0.166    c0.06,0.104,0.167,0.191,0.273,0.252c0.052,0.027,0.118,0.116,0.176,0.132c0.058,0.014,0.129,0.088,0.189,0.088h8.544l1.704,1.059    l9.898-11.321V32.309z"/>   <path fill="#FFFFFF" d="M53.123,59.289c-0.385,0.394-0.375,1.026,0.021,1.412c0.193,0.188,0.445,0.283,0.695,0.283    c0.263,0,0.522-0.102,0.722-0.303c5.376-5.542,5.232-11.014,3.819-15.036l-1.497,1.738C57.72,50.709,57.34,54.942,53.123,59.289z"    />   <path fill="#FFFFFF" d="M54.545,39.31c-0.391-0.388-1.021-0.387-1.415,0.005c-0.387,0.393-0.387,1.026,0.01,1.415    c0.018,0.018,0.059,0.06,0.111,0.114l1.308-1.52C54.556,39.321,54.546,39.311,54.545,39.31z"/>   <path fill="#FFFFFF" d="M59.311,64.598c-0.385,0.395-0.375,1.029,0.021,1.414c0.191,0.188,0.443,0.281,0.693,0.281    c0.264,0,0.522-0.104,0.722-0.305c10.414-10.733,7.009-21.294,3.533-27.195l-1.324,1.538    C66.038,45.763,68.617,55.007,59.311,64.598z"/>   <path fill="#FFFFFF" d="M65.171,69.037c-0.384,0.395-0.375,1.027,0.021,1.414c0.195,0.186,0.445,0.279,0.697,0.279    c0.26,0,0.521-0.098,0.719-0.301c15.134-15.601,7.428-30.921,2.728-37.507l-1.299,1.509C72.5,40.69,79.215,54.562,65.171,69.037z"    />  </g>  <rect x="47.989" y="13.233" transform="matrix(0.7577 0.6526 -0.6526 0.7577 44.7397 -20.5144)" fill="#C12337" width="4.02" height="73.532"/>  </svg>',
        switchCameras: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"   viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve">  <g>   <path fill="#FFFFFF" d="M50.037,43.904c-3.939,0-7.151,3.212-7.151,7.168c0,3.947,3.212,7.167,7.151,7.167    c3.947,0,7.152-3.22,7.152-7.167C57.189,47.116,53.984,43.904,50.037,43.904z M50.037,56.49c-2.988,0-5.402-2.431-5.402-5.417    c0-2.997,2.414-5.418,5.402-5.418c2.98,0,5.402,2.422,5.402,5.418C55.439,54.069,53.017,56.49,50.037,56.49z"/>   <path fill="#FFFFFF" d="M63.047,43.286c-0.596,0-1.084,0.487-1.084,1.091c0,0.604,0.488,1.091,1.084,1.091    c0.597,0,1.083-0.487,1.083-1.091C64.13,43.773,63.644,43.286,63.047,43.286z"/>   <path fill="#FFFFFF" d="M50,0C22.431,0,0,22.43,0,50c0,27.571,22.429,50,50,50c27.569,0,50-22.429,50-50C100,22.431,77.569,0,50,0z     M25.111,51.626c0.934-0.933,2.432-0.933,3.366,0c0.934,0.936,0.926,2.446-0.007,3.382l-6.642,6.634    c-0.448,0.451-1.058,0.703-1.692,0.703c-0.633,0-1.242-0.252-1.689-0.703l-6.639-6.634c-0.933-0.936-0.933-2.446,0-3.382    c0.934-0.933,2.365-0.931,3.299,0l2.477,2.563V50c0-17.784,14.551-32.255,32.336-32.255c1.321,0,2.427,1.071,2.427,2.389    c0,1.32-1.017,2.39-2.337,2.39C34.86,22.524,22.583,34.85,22.583,50v4.189L25.111,51.626z M33.583,59.54V43.897    c0-1.44,1.517-3.086,2.956-3.086h5.341l2.703-2.58v-0.008c1-0.518,1.5-1.412,2.258-1.412h6.502c0.711,0,1.338,0.578,1.804,1.043    l0.015,0.158c0.007,0,0.022-0.172,0.022-0.172l3.128,2.971h5.224c1.433,0,3.048,1.646,3.048,3.086V59.54    c0,1.439-1.615,3.271-3.048,3.271H36.538C35.099,62.811,33.583,60.979,33.583,59.54z M86.506,49.071    c-0.614,0-1.063-0.235-1.529-0.698l-2.395-2.56V50c0,17.787-14.631,32.255-32.419,32.255c-1.32,0-2.47-1.067-2.47-2.39    c0-1.32,1.08-2.388,2.399-2.388c15.151,0,27.489-12.329,27.489-27.478v-4.187l-2.611,2.56c-0.934,0.931-2.473,0.931-3.403,0    c-0.938-0.934-0.951-2.447-0.014-3.381l6.63-6.636c0.935-0.935,2.442-0.935,3.375,0l6.635,6.636    c0.936,0.934,0.935,2.447-0.001,3.381C87.728,48.836,87.116,49.071,86.506,49.071z"/>  </g>  </svg>'
    }

    /**
     * Event system of app
     *
     * @method app.event
     * @return {Object}
     */
    app.event = (function(){

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

        var destroy = function () {
            events = {};
        }

        return {
            dispatch:dispatch,
            on:on,
            off:off,
            doesHandlerExist:doesHandlerExist,
            destroy:destroy
        }
    }())

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
            for(var i = roomScreens.length -1; i >= 0; i--){
                var currentScreen = this;
                var screen = roomScreens[i];
                if(currentScreen != screen.participant) continue;
                screen.isActive = false;
                if(screen.screenEl && screen.screenEl.parentNode != null) screen.screenEl.parentNode.removeChild(screen.screenEl);
                roomScreens.splice(i, 1);
            }

            for(var t = this.tracks.length - 1; t >= 0; t--){

                if(this.tracks[t].mediaStreamTrack != null) {
                    this.tracks[t].mediaStreamTrack.stop();
                }
                if(typeof cordova != 'undefined' && _isiOS && this.tracks[t].stream != null) {
                    this.tracks[t].stream.getTracks()[0].stop();
                }
            }
            if(typeof cordova != 'undefined' && _isiOS) iosrtcLocalPeerConnection.removeLocalNativeStreams();
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
         * Reference to twilio instance of Participant (is used only in 'twilio' mode)
         *
         * @property twilioInstance
         * @type {Object}
         */
        this.twilioInstance = null;
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
                console.log('setStage', signalingState)

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
    }

    var Track = function () {
        this.sid = null;
        this.kind = null;
        this.type = null;
        this.parentScreen = null;
        this.trackEl = null;
        this.mediaStreamTrack = null;
        this.twilioReference = null;
        this.screensharing = null;
        this.remove = function () {

            var index = this.parentScreen.tracks.map(function(e) { return e.mediaStreamTrack.id; }).indexOf(this.mediaStreamTrack.id);
            this.parentScreen.tracks[index] = null;
            this.parentScreen.tracks = this.parentScreen.tracks.filter(function (obj) {
                return obj != null;
            })
            //if(this.kind == 'video') this.parentScreen.videoTrack = null;

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


        function dialogIsOpened() {
            if(!document.body.classList.contains('modal-opened')) document.body.classList.add('modal-opened');
        }

        function dialogIsClosed() {
            if(document.body.classList.contains('modal-opened')) document.body.classList.remove('modal-opened');
        }

        function closeAllDialogues() {
            var elems=[].slice.call(document.getElementsByClassName('dialog-con')).concat([].slice.call(document.getElementsByClassName('dialog-bg')));
            for(var i=0;i<elems.length;i++) {
                elems[i].parentNode.removeChild(elems[i]);
            }
        }

        return {
            dialogIsOpened: dialogIsOpened,
            dialogIsClosed: dialogIsClosed,
            updateOrientation: updateOrientation,
            isMobile: isMobile,
            closeAllDialogues: closeAllDialogues
        }
    }())

    app.screensInterface = (function () {
        var viewMode;
        var activeScreen;
        var Screen = function () {
            this.sid = null;
            this.participant = null;
            this.screenEl = null;
            this.videoCon = null;
            this.nameEl = null;
            this.tracks = [];
            this.streams = [];
            this.isMain = null;
            this.isLocal = null;
            this.isActive = false;
            this.screensharing = null;
            this.getTracksContainer = function() {
                var chatParticipantVideoCon = document.createElement('DIV');
                chatParticipantVideoCon.className = 'chat-participant-video';
                var i, track;
                for (i = 0; track = this.tracks[i]; i++) {
                    if(track.trackEl.parentNode != null) {
                        return track.trackEl.parentNode;
                    }
                    chatParticipantVideoCon.appendChild(track.trackEl);
                }
                return chatParticipantVideoCon;
            }
            this.videoTracks = function () {
                return this.tracks.filter(function (trackObj) {
                    return trackObj.kind == 'video';
                });
            }
            this.audioTracks = function () {
                return this.tracks.filter(function (trackObj) {
                    return trackObj.kind == 'audio';
                });
            }
            this.hasAnyTracks = function () {
                var mediaElement = this.screenEl.querySelector('video, audio');
                if(mediaElement != null) return true;
                return false;
            };
            this.removeTrack = function (twilioTrack) {
                /*if(twilioTrack.kind == 'video' || twilioTrack.kind == 'audio') {
					var detachedElements = twilioTrack.detach();

					for (var i in detachedElements) {

						var detachedElement = detachedElements[i];
						if (detachedElement.parentNode != null) detachedElement.parentNode.removeChild(detachedElement);
					}
				}*/

                var index = this.tracks.map(function(e) { return e.sid; }).indexOf(twilioTrack.sid);
                this.tracks[index].remove();

            };
            this.hide = function() {
                log('screen.hide');
                let screen = this;
                if(screen.screenEl != null && screen.screenEl.parentElement != null) screen.screenEl.parentElement.removeChild(screen.screenEl);

                for(let m in roomScreens) {

                    if(screen == roomScreens[m]){
                        screen.isActive = false;
                        //roomScreens.splice(m, 1);
                        break;
                    }
                }

                app.event.dispatch('screenHidden', screen);

                let appendedToNextScreen = false;
                if(screen.soundEl != null && screen.participant.soundMeter.visualizations['participantScreen'] != null
                    && screen.participant.soundMeter.visualizations['participantScreen'].element == screen.soundEl) {
                    log('screen.hide move sound', screen.participant.screens.length);

                    for(let s in screen.participant.screens) {
                        let scr = screen.participant.screens[s];
                        log('screen.hide move sound change');
                        if(scr == screen || !scr.isActive) continue;
                        log('screen.hide move sound change 2');
                        screen.participant.soundMeter.visualizations['participantScreen'].element = scr.soundEl
                        scr.soundEl.appendChild(screen.participant.soundMeter.visualizations['participantScreen'].svg);
                        appendedToNextScreen = true;
                        break;
                    }
                }
                if(!appendedToNextScreen && screen.participant.soundMeter.visualizations['participantScreen'] != null) {
                    screen.participant.soundMeter.visualizations['participantScreen'].remove();
                }
            };
            this.show = function() {
                log('screen.show');
                let screen = this;
                var presentInScreensList = false;
                for(let m in roomScreens) {
                    if(screen == roomScreens[m]){
                        log('screen.show: screen exists in roomScreens');

                        presentInScreensList = true;
                        break;
                    }
                }
                screen.isActive = true;

                if(!presentInScreensList) roomScreens.push(screen);
                app.event.dispatch('screenShown', screen);

                if(screen.participant.soundMeter.visualizations['participantScreen'] == null) {
                    app.screensInterface.audioVisualization().build({
                        name: 'participantScreen',
                        participant: screen.participant,
                        element: screen.soundEl,
                        stopOnMute: true
                    });
                }

            };

        };

        /**
         * Attaches new tracks to Participant and to his screen. If there is no screen, it creates it. If screen already
         * has video track while adding new, it replaces old video track with new one.
         * @method attachTrack
         * @param {Object} [track] instance of Track (not MediaStreamTrack) that has mediaStreamTrack as its property
         * @param {Object} [participant.url] instance of Participant
         */
        function attachTrack(track, participant) {
            log('attachTrack', track);
            if(typeof cordova != 'undefined' && _isiOS && track.kind == 'video' && track.stream != null && track.stream.hasOwnProperty('_blobId')) {
                log('attachTrack: iosrtc track video');
                iosrtcLocalPeerConnection.addStream(track.stream);
                return;
            } else if(typeof cordova != 'undefined' && _isiOS && track.kind == 'audio' && track.stream != null && track.stream.hasOwnProperty('_blobId')) {
                log('attachTrack: iosrtc track audio');

                iosrtcLocalPeerConnection.addStream(track.stream);

                return;
            }

            var screenToAttach;

            log('attachTrack: track.screensharing', track.screensharing);

            if(track.kind == 'video' && track.screensharing) {
                log('attachTrack: screensharing', participant.screens);

                screenToAttach = participant.screens.filter(function (scrn) {
                    return scrn.screensharing == true && scrn.videoTrack == null;
                })[0];

                if(!screenToAttach) {
                    screenToAttach = createRoomScreen(participant);
                }
                track.parentScreen = screenToAttach;
                //if(screenToAttach.videoTrack.parentNode) screenToAttach.videoTrack.parentNode.removeChild(screenToAttach.videoTrack)
                var trackEl = createTrackElement(track, participant);
                track.trackEl = trackEl;
                track.trackEl.play();
                screenToAttach.videoCon.appendChild(trackEl);
                screenToAttach.videoTrack = trackEl;
                app.event.dispatch('videoTrackIsBeingAdded', screenToAttach);
            } else if(track.kind == 'video') {
                log('attachTrack: regular video');

                for(var s in participant.screens) {
                    let activeTracks = participant.screens[s].tracks.filter(function(t){
                        return t.mediaStreamTrack.enabled == true && t.mediaStreamTrack.readyState == 'live' ? true : false
                    })
                    if(!participant.screens[s].screensharing && activeTracks.length == 0) screenToAttach = participant.screens[s];
                }

                if(!screenToAttach) {
                    screenToAttach = createRoomScreen(participant);
                }

                track.parentScreen = screenToAttach;
                if(screenToAttach.videoTrack != null) {
                    if(screenToAttach.videoTrack.parentNode) screenToAttach.videoTrack.parentNode.removeChild(screenToAttach.videoTrack)
                }
                var trackEl = createTrackElement(track, participant);
                track.trackEl = trackEl;
                track.trackEl.play();
                screenToAttach.videoCon.appendChild(trackEl);
                screenToAttach.videoTrack = trackEl;
                app.event.dispatch('videoTrackIsBeingAdded', screenToAttach);

            } else if(track.kind == 'audio') {

                var trackEl = createTrackElement(track, participant);
                track.trackEl = trackEl;
                participant.audioEl = trackEl;

                if(!participant.isLocal) {
                    document.body.appendChild(trackEl);
                    if(participant.audioIsMuted) {
                        track.trackEl.muted = true;
                    }
                }

                createAudioAnalyser(track, participant)

            }
            if(screenToAttach != null) screenToAttach.screensharing = track.screensharing == true ? true : false;

            track.participant = participant;

            if(screenToAttach != null) screenToAttach.tracks.push(track);

            var trackExist = participant.tracks.filter(function (t) {
                return t == track;
            })[0];
            if(trackExist == null) participant.tracks.push(track);

            if(typeof cordova != 'undefined' && _isiOS && participant.isLocal) {
                log('attachTrack: iosrtc publish track ');

                if(track.kind =='video'){
                    if(localParticipant.videoTracks().length > 1) {
                        log('attachTrack: iosrtc publish track: replace track');

                        app.conferenceControl.replaceTrack(track.mediaStreamTrack);
                    } else {
                        log('attachTrack: iosrtc publish track: add track');
                        app.conferenceControl.enableVideo();
                    }
                } else {

                    if(localParticipant.audioTracks().length > 1) {
                        log('attachTrack: iosrtc publish track: replace track');

                        app.conferenceControl.replaceTrack(track.mediaStreamTrack);
                    } else {
                        log('attachTrack: iosrtc publish track: add track');
                        app.conferenceControl.enableAudio();
                    }
                }
            }

            app.event.dispatch('trackAdded', {screen:screenToAttach, track: track});

        }

        function createAudioAnalyser(track, participant) {
            if(typeof cordova != 'undefined' && _isiOS) return;

            log('audiovis: createAudioAnalyser', track)

            if(participant.soundMeter.source != null) {
                log('audiovis: createAudioAnalyser: source exists')

                /*participant.soundMeter.script.disconnect();
				participant.soundMeter.source.disconnect();*/
                participant.soundMeter.context.resume();

                participant.soundMeter.audioTrack = track.mediaStreamTrack;
                participant.soundMeter.source = participant.soundMeter.context.createMediaStreamSource(track.stream);
                participant.soundMeter.analyser = participant.soundMeter.context.createAnalyser();
                participant.soundMeter.analyser.fftSize = 1024;

                participant.soundMeter.source.connect(participant.soundMeter.script);
                participant.soundMeter.source.connect(participant.soundMeter.analyser);
                participant.soundMeter.script.connect(participant.soundMeter.context.destination);
                participant.soundMeter.analyser.connect(participant.soundMeter.script);
                return;
            }

            participant.soundMeter.audioTrack = track.mediaStreamTrack;
            participant.soundMeter.context = new window.AudioContext();
            if(participant.soundMeter.context.createScriptProcessor) {
                participant.soundMeter.script = participant.soundMeter.context.createScriptProcessor(2048, 2, 1);
            } else if(participant.soundMeter.context.createJavaScriptNode) {
                participant.soundMeter.script = participant.soundMeter.context.createJavaScriptNode(2048, 2, 1);
            } else {
            }

            participant.soundMeter.analyser = participant.soundMeter.context.createAnalyser();
            participant.soundMeter.analyser.fftSize = 1024;

            participant.soundMeter.source = participant.soundMeter.context.createMediaStreamSource(track.stream);
            participant.soundMeter.source.connect(participant.soundMeter.script);
            participant.soundMeter.source.connect(participant.soundMeter.analyser);
            //participant.soundMeter.source.connect(participant.soundMeter.context.destination); // connect the source to the destination

            participant.soundMeter.script.connect(participant.soundMeter.context.destination); // chrome needs the analyser to be connected too...

            participant.soundMeter.analyser.connect(participant.soundMeter.script);


            participant.soundMeter.instant = 0;
            participant.soundMeter.slow = 0;
            participant.soundMeter.clip = 0;
            participant.soundMeter.rms = 0;
            participant.soundMeter.slowRms = 0;
            participant.soundMeter.reset = function() {
                if(participant.isLocal && participant.soundMeter.isDisabled) return;
            }
            participant.soundMeter.start = function() {
                this.isDisabled = false;
            }
            participant.soundMeter.stop = function() {
                /*for (var key in participant.soundMeter.visualizations) {
					if (participant.soundMeter.visualizations.hasOwnProperty(key)) {
						var visualization = participant.soundMeter.visualizations[key];
						var barsLength = visualization.barsLength;
						var i;
						var el;
						var elems=[].slice.call(visualization.svg.childNodes);
						for(i = 0; el = elems[i]; i++){
							el.setAttributeNS(null, 'height', '0%');
							el.setAttributeNS(null, 'y', 0);
						}
					}
				}*/
            }

            function buildVisualization(participant) {
                log('audiovis: createAudioAnalyser: buildVisualization');
                participant.soundMeter.latestUpdate = performance.now();

                participant.soundMeter.script.onaudioprocess = function(e) {
                    participant.soundMeter.onaudioprocessEvent = e;
                    var input = e.inputBuffer.getChannelData(0);
                    //participant.soundMeter.input = input;
                    var i;
                    var sum = 0.0;
                    var clipcount = 0;
                    var inputLength = input.length;
                    for (i = 0; i < inputLength; ++i) {
                        sum += input[i] * input[i];

                        if (Math.abs(input[i]) > 0.99) {
                            //console.log('peak', Math.abs(input[i]))

                            clipcount += 1;
                        }

                    }
                    let rms1 = Math.sqrt(sum / inputLength);
                    participant.soundMeter.rms = rms1;
                    participant.soundMeter.slowRms = (0.5 * participant.soundMeter.slowRms + 0.5 * rms1);
                    //console.log(participant.soundMeter.slowRms)
                    /*let len = input.length;
					let total = i = 0
					let rms2;

					while ( i < len ) total += Math.abs( input[i++] );
					rms2 = Math.sqrt( total / len )
					participant.soundMeter.rms = rms2 * 100;

					if(rms2 * 100 > 100) {
						//alert('13');
					}*/
                    //console.log(rms1, rms2)


                    var audioIsDisabled = participant.soundMeter.source.mediaStream && (participant.soundMeter.source.mediaStream.active == false || participant.soundMeter.audioTrack.readyState == 'ended');
                    if(!audioIsDisabled) {
                        participant.soundMeter.instant = Math.sqrt(sum / input.length);
                        participant.soundMeter.slow = 0.95 * participant.soundMeter.slow + 0.05 * participant.soundMeter.instant;
                        participant.soundMeter.clip = clipcount / input.length;
                    } else {

                        participant.soundMeter.instant = 0;
                        participant.soundMeter.slow = 0;
                        participant.soundMeter.clip = 0;
                    }

                    var historyLength = participant.soundMeter.history.volumeValues.length;
                    if(historyLength > 256) participant.soundMeter.history.volumeValues.splice(0, historyLength - 256);
                    participant.soundMeter.history.volumeValues.push({
                        time: performance.now(),
                        value: participant.soundMeter.instant
                    });

                    /*if(performance.now() - participant.soundMeter.latestUpdate < 500) {
						return;
					};*/


                    var latest500ms = participant.soundMeter.history.volumeValues.filter(function (o) {
                        return performance.now() - o.time < 500;
                    });
                    var sum = latest500ms.reduce((a, b) => a + (b['value'] || 0), 0);
                    var average = (sum / 2);
                    if(!audioIsDisabled) {
                        participant.soundMeter.average500s = average;
                    } else participant.soundMeter.average500s = 0;



                    for (var key in participant.soundMeter.visualizations) {
                        if (participant.soundMeter.visualizations.hasOwnProperty(key)) {
                            var visualization = participant.soundMeter.visualizations[key];
                            var barsLength = visualization.barsLength;
                            var i;
                            for(i = 0; i < barsLength; i++){
                                var bar = visualization.soundBars[i];
                                if(i == barsLength - 1) {
                                    bar.volume = participant.soundMeter.instant;
                                    var height = !participant.soundMeter.isDisabled && (bar.volume > 0 && average > 0) ? (bar.volume / average * 100) : 0;
                                    if(height > 100)
                                        height = 100;
                                    else if(bar.volume < 0.005) height = 0.1;
                                    bar.y = visualization.height - (visualization.height / 100 * height);
                                    bar.height = height;
                                    bar.fill = '#'+Math.round(0xffffff * Math.random()).toString(16);

                                    if(participant.soundMeter.source.mediaStream != null && participant.soundMeter.source.mediaStream.active == false || participant.soundMeter.audioTrack.readyState == 'ended') {
                                        bar.volume = 0;
                                        bar.height = 0;
                                    }

                                    bar.rect.setAttributeNS(null, 'height', bar.height + '%');
                                    bar.rect.setAttributeNS(null, 'y', bar.y);

                                } else {
                                    var nextBar = visualization.soundBars[i + 1];
                                    bar.volume = nextBar.volume;
                                    bar.height = nextBar.height;
                                    bar.fill = nextBar.fill;
                                    bar.y = nextBar.y;
                                    bar.rect.setAttributeNS(null, 'height', bar.height + '%');
                                    bar.rect.setAttributeNS(null, 'y', bar.y);
                                }
                            }
                        }
                    }

                    if(participant.soundMeter.source.mediaStream != null && participant.soundMeter.source.mediaStream.active == false || participant.soundMeter.audioTrack.readyState == 'ended') {
                        var maxVolume;
                        for (var key in participant.soundMeter.visualizations) {
                            if (participant.soundMeter.visualizations.hasOwnProperty(key)) {
                                var visualization = participant.soundMeter.visualizations[key];
                                maxVolume = Math.max.apply(Math, visualization.soundBars.map(function(o) {
                                    return o.volume;
                                }));
                            }
                            break;
                        }

                        if(maxVolume <= 0) {
                            //participant.soundMeter.script.onaudioprocess = null;
                            log('createAudioAnalyser: resume')
                            participant.soundMeter.context.suspend();
                            participant.soundMeter.script.disconnect();
                            participant.soundMeter.source.disconnect();
                        }
                    }

                    participant.soundMeter.latestUpdate = performance.now();
                }

            }

            buildVisualization(participant);

        }

        function audioVisualization() {
            log('audiovis: audioVisualization');

            function updatVisualizationWidth(participant, visualization) {
                log('audiovis: audioVisualization: updatVisualizationWidth');
                try {
                    var err = (new Error);
                    console.log(err.stack);
                } catch (e) {

                }
                if((visualization == null || visualization.svg == null) || (visualization.updateSizeOnlyOnce && visualization.updated)) return;

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

            function buildVisualization(options) {
                log('audiovis: audioVisualization: buildVisualization');

                var name = options.name;
                var element = options.element;
                var participant = options.participant;

                participant.soundMeter.visualizations[name] = {};
                var visualisation = participant.soundMeter.visualizations[name];
                visualisation.element = element;
                visualisation.updateSizeOnlyOnce = options.updateSizeOnlyOnce != null ? options.updateSizeOnlyOnce : false;
                visualisation.stopOnMute = options.stopOnMute != null ? options.stopOnMute : false;
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


                visualisation.reset = function () {
                    setTimeout(function () {
                        updatVisualizationWidth(participant, visualisation)
                    }, 300);
                };
                visualisation.remove = function () {
                    delete options.participant.soundMeter.visualizations[name];
                    if(visualisation.svg.parentNode != null) visualisation.svg.parentNode.removeChild(visualisation.svg);
                };
            }

            return {
                build: buildVisualization
            }
        }

        function getScreenOfTrack(track) {
            for(var i in roomScreens){
                for(var x in roomScreens[i].tracks){
                    if(roomScreens[i].tracks[x].sid == track.sid) return roomScreens[i]
                }
            }
        }

        function detachTracks(tracks, participant) {
            log('detachTracks', tracks, participant);

            var screenOfTrack;
            tracks.forEach(function(track) {
                screenOfTrack = getScreenOfTrack(track);

                if(screenOfTrack !=null) screenOfTrack.removeTrack(track);


                if(track.mediaStreamTrack != null) {
                    track.mediaStreamTrack.enabled = false;
                    track.mediaStreamTrack.stop();
                }

                if(track.kind == 'audio') {
                    if(screenOfTrack != null) screenOfTrack.participant.soundMeter.stop();
                }
            });


            setTimeout(function () {
                if(activeScreen && screenOfTrack == activeScreen && activeScreen.videoTrack == null) {
                    for (var i in roomScreens) {
                        if (roomScreens[i].videoTrack != null) activeScreen = roomScreens[i];
                    }
                }
                removeEmptyScreens()
            }, 1000)

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
                        remoteStreamEl = participant.audioEl;
                    } else {
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
                    if(typeof cordova != "undefined" && _isiOS && participant.isLocal && (participant.audioStream != null || participant.videoStream != null)) {

                        stream = track.kind == 'audio' ? participant.audioStream : participant.videoStream
                    } else {
                        stream = new MediaStream();
                    }
                } catch(e){
                    console.error(e.name + ': ' + e.message)
                }


                stream.addTrack(track.mediaStreamTrack);

                var binaryData = [];
                binaryData.push(stream);

                try{
                    remoteStreamEl.srcObject = stream;
                } catch(e){
                    console.error(e.name + ': ' + e.message)
                }
                track.stream = stream;
            }

            if(!participant.isLocal && track.kind == 'video') {
                remoteStreamEl.muted = true;

            }

            remoteStreamEl.autoplay = true;
            remoteStreamEl.load();
            if(!track.isLocal && track.kind == 'audio') {
                remoteStreamEl.play();

                log('createTrackElement: play()', remoteStreamEl)
            }
            remoteStreamEl.playsInline = true;
            remoteStreamEl.setAttribute('webkit-playsinline', true);
            ///remoteStreamEl.muted = true;
            if(participant.isLocal) {
                remoteStreamEl.volume = 0;
                remoteStreamEl.muted = true;

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

                if(!participant.isLocal) remoteStreamEl.play();

                if(track.kind == 'audio') {
                    log('createTrackElement: dispatch audioTrackLoaded');

                    app.event.dispatch('audioTrackLoaded', {
                        screen: track.parentScreen,
                        trackEl: e.target,
                        track:track
                    });
                }

            }
            remoteStreamEl.onloadedmetadata = function () {
                log('createTrackElement: onloadedmetadata', remoteStreamEl)
            }
            if(track.kind == 'video') {
                log('createTrackElement: add video track events');
                log('createTrackElement: video size', remoteStreamEl.videoWidth, remoteStreamEl.videoHeight);

                remoteStreamEl.addEventListener('loadedmetadata', function (e) {
                    var videoConWidth = (track.parentScreen.videoCon.style.width).replace('px', '');
                    var videoConHeight= (track.parentScreen.videoCon.style.height).replace('px', '');
                    var currentRation = videoConWidth / videoConHeight;
                    var videoRatio = e.target.videoWidth / e.target.videoHeight;

                    //if(e.target.videoWidth)
                    log('createTrackElement: loadedmetadata: video ' + e.target.videoWidth + 'x' + e.target.videoHeight)
                    log('createTrackElement: loadedmetadata: con ' + videoConWidth + 'x' + videoConHeight)
                    log('createTrackElement: loadedmetadata: mediaStreamTrack.readyState ' + track.mediaStreamTrack.readyState)
                    log('createTrackElement: loadedmetadata: mediaStreamTrack.enabled ' + track.mediaStreamTrack.enabled)
                    log('createTrackElement: loadedmetadata: mediaStreamTrack.muted ' + track.mediaStreamTrack.muted)

                    if(track.mediaStreamTrack.readyState == 'ended' || (e.target.videoWidth == 0 && e.target.videoHeight == 0)) return;
                    log('createTrackElement: loadedmetadata: return check');

                    var shouldReset = (track.parentScreen != null && currentRation.toFixed(1) != videoRatio.toFixed(1)) || track.screensharing == true;

                    track.metadata = {width:e.target.videoWidth, height:e.target.videoHeight};
                    app.event.dispatch('videoTrackLoaded', {
                        screen: track.parentScreen,
                        trackEl: e.target,
                        reset:shouldReset
                    });
                    addScreenToCommonList(track.parentScreen);
                });

                track.mediaStreamTrack.addEventListener('mute', function(){
                    log('mediaStreamTrack mute', track);

                    //if(track.participant.videoTracks(true).length != 0) return;

                    track.parentScreen.removeTimer = setTimeout(function () {
                        if(track.mediaStreamTrack.muted == true || track.mediaStreamTrack.enabled == false || track.mediaStreamTrack.readyState == 'ended'){
                            removeScreenFromCommonList(track.parentScreen);
                            track.parentScreen.removeTimer = null;
                        }
                    }, 3000);

                });

                track.mediaStreamTrack.addEventListener('unmute', function(e){
                    log('mediaStreamTrack unmuted 1', track);
                    if(track.parentScreen.removeTimer != null) {
                        clearTimeout(track.parentScreen.removeTimer);
                        track.parentScreen.removeTimer = null;
                    } else if (track.parentScreen.removeTimer == null /*&& track.participant.videoTracks(true).length != 0*/) {
                        addScreenToCommonList(track.parentScreen);
                    }
                });

                track.mediaStreamTrack.addEventListener('ended', function(e){
                    log('mediaStreamTrack ended', track);
                    //if(track.participant.videoTracks(true).length == 0)
                    removeScreenFromCommonList(track.parentScreen);
                });
            }

            track.mediaStreamTrack.addEventListener('mute', function(e){
                log('mediaStreamTrack muted', track);
                app.event.dispatch('trackMuted', {
                    screen: track.parentScreen,
                    trackEl: e.target,
                    track:track
                });
            });

            track.mediaStreamTrack.addEventListener('unmute', function(e){
                log('mediaStreamTrack unmuted 0', track);
                app.event.dispatch('trackUnmuted', {
                    screen: track.parentScreen,
                    trackEl: e.target,
                    track:track
                });
            });

            track.mediaStreamTrack.addEventListener('ended', function(e){
                log('mediaStreamTrack ended', track);
                app.event.dispatch('trackMuted', {
                    screen: track.parentScreen,
                    trackEl: e.target,
                    track:track
                });
            });

            return remoteStreamEl;
        }

        function removeEmptyScreens() {
            log('removeEmptyScreens');

            for(var i in roomScreens[i]) {
                if(roomScreens[i].tracks.length == 0) roomScreens.splice(i, 1);
            }
        }

        function sendVideoDataToServer(data, mediaStreamId) {
            if(!socket || !socket.connected) return;

            //var data = JSON.stringify(data);
            socket.emit('Streams/webrtc/videoData', data, options.roomName, mediaStreamId);
        }

        function createVideoCanvas(screen, track) {
            //return;7
            log('createVideoCanvas');
            var videoCanvas = document.createElement("CANVAS");
            videoCanvas.className = "Streams_webrtc_video-stream-canvas";
            videoCanvas.style.position = 'absolute';
            videoCanvas.style.top = '0';
            videoCanvas.style.left = '0';
            videoCanvas.style.zIndex = '9999';
            var inputCtx = videoCanvas.getContext('2d');
            var outputCtx = videoCanvas.getContext('2d');

            var mediaStreamId = screen.videoTrack.srcObject.id;
            var localVideo = screen.videoTrack;
            var canvasWidth;
            var canvasHeight;
            var videoWidth;
            var videoHeight;

            function drawVideoToCanvas(localVideo, mediaStreamId, canvasWidth, canvasHeight, videoWidth, videoHeight) {



                inputCtx.drawImage( localVideo, 0, 0, canvasWidth, canvasHeight);

                // get pixel data from input canvas
                var pixelData = inputCtx.getImageData( 0, 0, videoWidth, videoHeight );
                //sendVideoDataToServer(pixelData, mediaStreamId);
                //if(socket && socket.connected) socket.emit('Streams/webrtc/videoData', txt + argumentsString + '\n');;
                /*var avg, i;

				// simple greyscale transformation
				for( i = 0; i < pixelData.data.length; i += 4 ) {
					avg = ( pixelData.data[ i ] + pixelData.data[ i + 1 ] + pixelData.data[ i + 2 ] ) / 3;
					pixelData.data[ i ] = avg;
					pixelData.data[ i + 1 ] = avg;
					pixelData.data[ i + 2 ] = avg;
				}*/

                outputCtx.putImageData( pixelData, 0, 0);

                requestAnimationFrame( function () {
                    drawVideoToCanvas(localVideo, mediaStreamId, canvasWidth, canvasHeight, videoWidth, videoHeight);
                } );
                //setTimeout(drawVideoToCanvas);
            }

            localVideo.addEventListener('loadedmetadata', function () {
                var waitingVideoTimer = setInterval(function () {
                    if(document.documentElement.contains(localVideo)) {
                        screen.videoCon.appendChild(videoCanvas);

                        var videoElRect = localVideo.getBoundingClientRect();
                        canvasWidth = videoElRect.width;
                        canvasHeight = videoElRect.height;
                        videoWidth = localVideo.videoWidth;
                        videoHeight = localVideo.videoHeight;
                        videoCanvas.width = canvasWidth;
                        videoCanvas.height = canvasHeight;
                        localVideo.style.width = canvasWidth + 'px';
                        localVideo.style.height = canvasHeight + 'px';
                        drawVideoToCanvas(localVideo, mediaStreamId, canvasWidth, canvasHeight, videoWidth, videoHeight);
                        clearInterval(waitingVideoTimer);
                        waitingVideoTimer = null;
                    }

                }, 3000);
            })
        }

        /**
         * Creates screen object (instance of Screen) and some HTML elements of screen that will be used as containers
         * for participant's name and audio visualization;
         * @method createRoomScreen
         * @param {Object} [participant] instance of Participant
         * @returns {Object}
         */
        function createRoomScreen(participant) {
            log('createRoomScreen', participant);
            var chatParticipantEl = document.createElement('DIV');
            chatParticipantEl.className = 'chat-participant';
            chatParticipantEl.dataset.participantName = participant.sid;
            var chatParticipantVideoCon = document.createElement('DIV');
            chatParticipantVideoCon.className = 'chat-participant-video';
            var  isLocal = participant == localParticipant;
            var  isMainOfLocal = isLocal && localParticipant.screens.length == 0;
            if(isLocal && !isMainOfLocal) {
                /*var closeScreen = document.createElement('BUTTON');
				closeScreen.className = 'close-additional-screen';
				closeScreen.addEventListener('click', function () {
					var track = chatParticipantVideoCon.querySelector('video');
					track.stop();
					track.parentNode.removeChild(track);
				})*/
            }
            var chatParticipantName = document.createElement('DIV');
            chatParticipantName.className = 'chat-participant-name';
            var chatParticipantVoice = document.createElement('DIV');
            chatParticipantVoice.className = 'chat-participant-voice';
            var participantNameTextCon = document.createElement("DIV");
            participantNameTextCon.className = "participant-name-text";
            var participantNameText = document.createElement("DIV");
            participantNameText.innerHTML = participant.identity;

            chatParticipantEl.appendChild(chatParticipantVideoCon);
            participantNameTextCon.appendChild(participantNameText);
            chatParticipantName.appendChild(participantNameTextCon);
            chatParticipantEl.appendChild(chatParticipantName);

            var newScreen = new Screen();
            newScreen.sid = participant.sid;
            newScreen.participant = participant;
            //newScreen.screenEl = chatParticipantEl;
            newScreen.videoCon = chatParticipantVideoCon;
            newScreen.nameEl = chatParticipantName;
            newScreen.soundEl = chatParticipantVoice;
            //newScreen.isMain = participant.videoTracks(true).length == 0;
            newScreen.isLocal = isLocal;

            participant.screens.push(newScreen);
            //roomScreens.push(newScreen);
            return newScreen;
        }

        function removeScreensByParticipant(participant) {
            log('removeScreensByParticipant');

            for(var i in roomScreens) {
                if(roomScreens[i].participant == participant || roomScreens[i].sid != participant.sid) continue;

                var screenEl = roomScreens[i].screenEl;
                app.screensInterface.removeScreenFromCommonList(roomScreens[i]);
                if(screenEl != null && screenEl.parentNode != null) screenEl.parentNode.removeChild(screenEl)
            }
        }

        var getLoudestScreen = function (mode, callback) {

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
                return (prev.soundMeter.slow > current.soundMeter.slow) ? prev : current;
            })

            var loudestScreen = loudestParticipant.screens.filter(function (screen) {
                return (screen.isActive == true && screen.participant.online == true);
            })[0];

            if(loudestScreen != null && callback != null && loudestParticipant.soundMeter.slow > 0.0004) callback(loudestScreen);

        }

        var canvasComposer = (function (roomInstance) {

            var _roomInstance = roomInstance;
            var _isChangingRoom = false;
            var _canvas = null;
            var _canvasMediStream = null;
            var _mediaRecorder = null;
            var _dataListeners = [];

            var videoComposer = (function () {
                var _streams = [];
                var _size = {width:1280, height: 720};
                var _inputCtx = null;
                var _outputCtx = null;
                var _isActive = null;

                var _background = new Image();
                _background.src = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80";

                var _backgroundVideo = document.createElement('VIDEO');
                _backgroundVideo.src = 'https://www.w3schools.com/html/mov_bbb.mp4';
                _backgroundVideo.muted = true;
                _backgroundVideo.loop = true;


                function createCanvas() {
                    var videoCanvas = document.createElement("CANVAS");
                    videoCanvas.className = "Streams_webrtc_video-stream-canvas";
                    videoCanvas.style.position = 'absolute';
                    videoCanvas.style.top = '-999999999px';
                    //videoCanvas.style.top = '0';
                    videoCanvas.style.left = '0';
                    videoCanvas.style.zIndex = '9999999999999999999';
                    videoCanvas.style.backgroundColor = 'transparent';
                    videoCanvas.width = _size.width;
                    videoCanvas.height = _size.height;

                    _inputCtx = videoCanvas.getContext('2d');
                    _outputCtx = videoCanvas.getContext('2d');

                    _canvas = videoCanvas;

                }
                createCanvas();

                function setCanvasSize(width, height){
                    _size.width = width;
                    _size.height = height;
                    _canvas.width = _size.width;
                    _canvas.height = _size.height;
                }

                var CanvasStream = function (participant) {
                    this.kind = null;
                    this.participant = participant;
                    this.name = participant.username;
                    this.avatar = participant.avatar ? participant.avatar.image : null;
                    this.track = null;
                    this.mediaStream = null;
                    this.htmlVideoEl = null;
                    this.screenSharing = false;
                    this.volumeHistory = [];
                    this.rect = null;
                }
                function updateCanvasLayout() {
                    log('updateCanvasLayout start')

                    var tracksToAdd = [];
                    var tracksToRemove = [];


                    var participants = _roomInstance.roomParticipants(true);
                    log('updateCanvasLayout participants',  participants)

                    var renderScreenSharingLayout = false;
                    for(var v in participants) {
                        log('updateCanvasLayout participant', participants[v].online, participants[v])

                        let renderedTracks = [];
                        for (let j in _streams) {

                            if(_streams[j].participant == participants[v]) {
                                log('updateCanvasLayout rendered for', _streams[j])

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
                        log('updateCanvasLayout p tracks', vTracks, aTracks)

                        log('updateCanvasLayout rendered _streams', _streams)

                        vTracks = vTracks.filter(function (o) {
                            return o.parentScreen.isActive;
                        });
                        log('updateCanvasLayout vTracks', vTracks)

                        let audioIsEnabled = participants[v].isLocal ? app.conferenceControl.micIsEnabled() : participants[v].audioIsMuted != true;

                        log('updateCanvasLayout audioIsEnabled', audioIsEnabled)


                        if(vTracks.length != 0) {
                            log('updateCanvasLayout vTracks != 0')

                            for (let s in vTracks) {
                                log('updateCanvasLayout track', vTracks[s])

                                let trackCurrentlyRendered = false;
                                for (let c in renderedTracks) {
                                    log('updateCanvasLayout trackCurrentlyRendered', vTracks[s], renderedTracks[c].track)

                                    if(vTracks[s] == renderedTracks[c].track)  {
                                        trackCurrentlyRendered = true;
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

                                        let canvasStream = new CanvasStream(participants[v]);
                                        canvasStream.kind = 'video';
                                        canvasStream.track = vTracks[s];
                                        canvasStream.mediaStream = vTracks[s].stream;
                                        canvasStream.htmlVideoEl = vTracks[s].trackEl;
                                        if (vTracks[s].screensharing == true) canvasStream.screenSharing = true;
                                        tracksToAdd.push(canvasStream)

                                    } else {
                                        log('updateCanvasLayout !trackCurrentlyRendered else')

                                        let z, replacedAudioTrack = false;
                                        for(z = renderedTracks.length - 1; z >= 0 ; z--){
                                            log('updateCanvasLayout !trackCurrentlyRendered renderedTracks[z]', renderedTracks[z])

                                            if(renderedTracks[z].kind == 'audio') {
                                                renderedTracks[z].kind = 'video';
                                                renderedTracks[z].track = vTracks[s];
                                                renderedTracks[z].mediaStream = vTracks[s].stream;
                                                renderedTracks[z].htmlVideoEl = vTracks[s].trackEl;
                                                if (vTracks[s].screensharing == true) renderedTracks[z].screenSharing = true;
                                                replacedAudioTrack = true;
                                                break;
                                            }
                                        }

                                        log('updateCanvasLayout replacedAudioTrack', replacedAudioTrack)

                                        if(!replacedAudioTrack) {
                                            let canvasStream = new CanvasStream(participants[v]);
                                            canvasStream.kind = 'video';
                                            canvasStream.track = vTracks[s];
                                            canvasStream.mediaStream = vTracks[s].stream;
                                            canvasStream.htmlVideoEl = vTracks[s].trackEl;
                                            if (vTracks[s].screensharing == true) canvasStream.screenSharing = true;
                                            tracksToAdd.push(canvasStream)
                                        }
                                    }
                                } else {
                                    continue;
                                }

                            }

                        } else if (aTracks.length != 0 && audioIsEnabled) {
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
                                newAudioTrack.mediaStream = null;
                                newAudioTrack.htmlVideoEl = null;
                                newAudioTrack.screenSharing = false;

                                tracksToRemove = tracksToRemove.concat(renderedVideoTracks);
                            } else {
                                log('updateCanvasLayout aTracks: if2')

                                let canvasStream = new CanvasStream(participants[v]);
                                canvasStream.kind = 'audio';
                                tracksToAdd.push(canvasStream);
                            }
                        }

                        for (let x in renderedTracks) {

                            let trackIsLive = false;

                            if(renderedTracks[x].kind == 'video') {
                                for (let m in vTracks) {
                                    if(renderedTracks[x].track == vTracks[m] && vTracks[m].parentScreen.isActive) {
                                        log('updateCanvasLayout remove not active', vTracks[m].parentScreen.isActive)

                                        trackIsLive = true;
                                    }
                                }
                            } else {
                                if(audioIsEnabled) trackIsLive = true;
                            }


                            if(!trackIsLive) tracksToRemove.push(renderedTracks[x]);
                        }

                    }
                    log('updateCanvasLayout result', tracksToAdd, tracksToRemove)
                    log('updateCanvasLayout room name', options.roomName)

                    for(let r = _streams.length - 1; r >= 0 ; r--){
                        let onlineInCurrentRoom = false;
                        for(let p in participants) {
                            if(_streams[r].participant == participants[p]) {
                                onlineInCurrentRoom = true;
                            }
                        }
                        if(_streams[r].participant.isLocal && !onlineInCurrentRoom) {
                            log('updateCanvasLayout prevRoom: loc prev room stream', _streams[r])

                            for(let m = _streams.length - 1; m >= 0 ; m--){
                                if(!_streams[m].participant.isLocal || _streams[m] == _streams[r]) continue;
                                log('updateCanvasLayout prevRoom: loc live stream', _streams[m])

                                if(_streams[m].kind == 'audio') {
                                    _streams[r].participant = _streams[m].participant;
                                    _streams[r].kind = 'audio';
                                    _streams[r].track = null;
                                    _streams[r].mediaStream = null;
                                    _streams[r].htmlVideoEl = null;
                                    _streams[r].screenSharing = false;
                                } else {
                                    _streams[r].participant = _streams[m].participant;
                                    _streams[r].kind = 'video';
                                    _streams[r].track = _streams[m].track;
                                    _streams[r].mediaStream = _streams[m].track.stream;
                                    _streams[r].htmlVideoEl = _streams[m].track.trackEl;
                                    if (_streams[r].track.screensharing == true) _streams[m].screenSharing = true;

                                }
                                tracksToRemove.push(_streams[m]);
                                break;
                            }
                            break;
                        } else if(_streams[r].participant.isLocal && onlineInCurrentRoom) {
                            log('updateCanvasLayout prevRoom: loc current room', _streams[r])

                            continue;
                        } else if(!_streams[r].participant.isLocal && !onlineInCurrentRoom) {
                            log('updateCanvasLayout prevRoom: remote prev room', _streams[r])

                            tracksToRemove.push(_streams[r])
                        } else {
                            log('updateCanvasLayout prevRoom: else', _streams[r])

                        }
                    }

                    log('updateCanvasLayout remove from prev room', tracksToRemove)
                    for(let n in tracksToRemove) {
                        log('updateCanvasLayout tracksToRemove', tracksToRemove[n].participant.isLocal)

                    }

                    for(let d = _streams.length - 1; d >= 0 ; d--){
                        log('updateCanvasLayout remove')

                        function remove() {
                            _inputCtx.clearRect(_streams[d].rect.x, _streams[d].rect.y, _streams[d].rect.width, _streams[d].rect.height);
                            _streams[d] = null;
                            _streams.splice(d, 1);
                        }

                        for(let n in tracksToRemove) {
                            log('updateCanvasLayout remove tracksToRemove', _streams[d], tracksToRemove[n])

                            if(_streams[d] == tracksToRemove[n]) {
                                log('updateCanvasLayout remove stream', _streams[d])

                                remove();
                                break;
                            }
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

                function drawVideosOnCanvas() {
                    _inputCtx.clearRect(0, 0, _size.width, _size.height);
                    if(options.liveStreaming.drawBackground && _background != null) drawBackground(_background);

                    for(let i = 0; i < _streams.length; i++) {
                        let streamData = _streams[i];

                        if(streamData.kind == 'video') {
                            //log('drawVideosOnCanvas 1')

                            drawSingleVideoOnCanvas(streamData.htmlVideoEl, streamData, _size.width, _size.height, streamData.htmlVideoEl.videoWidth, streamData.htmlVideoEl.videoHeight);
                        } else {
                            //log('drawVideosOnCanvas 1')

                            drawSingleAudioOnCanvas(streamData.htmlVideoEl, streamData, _size.width, _size.height);
                        }
                    }

                    /*if(_isChangingRoom !== false) {
                        circleLoader.draw();
                    }*/

                    requestAnimationFrame(function(){
                        drawVideosOnCanvas();
                    })
                }

                function drawBackground(videoOrImg) {
                    var width, height;
                    if(typeof videoOrImg.controls != 'undefined') {
                        videoOrImg.play();
                        videoOrImg.volume = 0;

                        width = videoOrImg.videoWidth;
                        height = videoOrImg.videoHeight;
                    } else {
                        width = videoOrImg.width;
                        height = videoOrImg.height;
                    }

                    var scale = Math.max(_size.width / width, _size.height / height);
                    // get the top left position of the image
                    var x = (_size.width / 2) - (width / 2) * scale;
                    var y = (_size.height / 2) - (height / 2) * scale;
                    _inputCtx.drawImage(videoOrImg,
                        x, y,
                        width * scale, height * scale);

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

                        var centerShift_x = ( data.rect.width - currentWidth*ratio ) / 2;
                        var centerShift_y = ( data.rect.height - currentHeight*ratio ) / 2;

                        _inputCtx.drawImage( localVideo,
                            data.rect.x, data.rect.y,
                            currentWidth, currentHeight,
                            centerShift_x, centerShift_y,
                            currentWidth * ratio, currentHeight * ratio);
                    }



                    //(currentWidth/2) - (widthToGet / 2), (currentHeight/2) - (heightToGet / 2),

                    if(options.liveStreaming.showLabelWithNames) {
                        _inputCtx.fillStyle = "#232323";
                        _inputCtx.fillRect(data.rect.x, data.rect.y, data.rect.width, 36);

                        _inputCtx.font = "16px Arial";
                        _inputCtx.fillStyle = "white";
                        _inputCtx.fillText(data.participant.username, data.rect.x + 10, data.rect.y + 36 + 16 - 18 - 8);
                    }
                    _inputCtx.strokeStyle = "black";
                    _inputCtx.beginPath();
                    _inputCtx.moveTo(data.rect.x + data.rect.width, data.rect.y);
                    _inputCtx.lineTo(data.rect.x + data.rect.width, options.liveStreaming.showLabelWithNames ? data.rect.y + 36 : data.rect.y);
                    _inputCtx.stroke();

                    //_inputCtx.strokeRect(data.rect.x, data.rect.y, data.rect.width, data.rect.height);
                }

                function drawSingleAudioOnCanvas(localVideo, data, canvasWidth, canvasHeight) {
                    if(data.participant.online == false) return;

                    _inputCtx.clearRect(data.rect.x, data.rect.y, data.rect.width, data.rect.height);

                    _inputCtx.fillStyle = "#000";
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
                        if(options.liveStreaming.showLabelWithNames) {
                            y = (data.rect.y + 36) + (((data.rect.height - 36) / 2) - (height / 2) * scale);
                        } else {
                            y = data.rect.y + ((data.rect.height / 2) - (height / 2) * scale);
                        }

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



                        _inputCtx.strokeStyle = "black";
                        _inputCtx.strokeRect(data.rect.x, data.rect.y, data.rect.width, data.rect.height);
                    }

                    if(options.liveStreaming.showLabelWithNames) {
                        //(currentWidth/2) - (widthToGet / 2), (currentHeight/2) - (heightToGet / 2),
                        _inputCtx.fillStyle = "#232323";
                        _inputCtx.fillRect(data.rect.x, data.rect.y, data.rect.width, 36);

                        _inputCtx.font = "16px Arial";
                        _inputCtx.fillStyle = "white";
                        _inputCtx.fillText(data.participant.username, data.rect.x + 10, data.rect.y + 36 + 16 - 18 - 8);
                    }

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

                    //var bass = Math.floor(dataArray[1]); //1Hz Frequenz
                    var rms = data.participant.soundMeter.slowRms * 100;
                    //console.log(rms, bass)
                    var radius = ((radius / 100 * rms) + radius);

                    _inputCtx.fillStyle = "#505050";
                    _inputCtx.beginPath();
                    if(options.liveStreaming.showLabelWithNames) {
                        _inputCtx.arc(data.rect.x + (data.rect.width / 2), (data.rect.y + 36) + ( (data.rect.height - 36) / 2), radius, 0, 2 * Math.PI);
                    } else {
                        _inputCtx.arc(data.rect.x + (data.rect.width / 2), data.rect.y + (data.rect.height / 2), radius, 0, 2 * Math.PI);
                    }
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

                    updateCanvasLayout();
                    drawVideosOnCanvas();
                    _isActive = true;
                    refreshEventListeners(_roomInstance);
                }

                function refreshEventListeners(roomInstance) {
                    _roomInstance = roomInstance;
                    var updateCanvas = function() {
                        if(_isActive == true) {
                            updateCanvasLayout();
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
                }

                function switchingRoom(value) {
                    log('switchingRoom', value);
                    if(value == false && Date.now() - _isChangingRoom < 3000) {
                        log('switchingRoom setTimeout');

                        setTimeout(function () {
                            log('switchingRoom setTimeout end');
                            _isChangingRoom = false;
                        }, 3000 - (Date.now() - _isChangingRoom))
                        return;
                    } else if(value == false) {
                        log('switchingRoom', value);
                        _isChangingRoom = false;
                        return;
                    }
                    log('switchingRoom', value);
                    _isChangingRoom = Date.now();
                }

                function layoutGenerator(layoutName, numberOfRects) {


                    var layouts = {
                        tiledHorizontalMobile: function (container, count) {
                            var size = {parentWidth: _size.width, parentHeight: _size.height};

                            switch (count) {
                                case 1:
                                    return simpleGrid(count, size, 1);
                                case 2:
                                    return simpleGrid(count, size, 2);
                                case 3:
                                    return simpleGrid(count, size, 3);
                                case 4:
                                    return simpleGrid(count, size, 2);
                                case 5:
                                    return simpleGridBasedOnRowsNum(count, 3, size)
                                case 6:
                                    return simpleGrid(count, size, 2);
                                default:
                                    return simpleGrid(count, size, 2);

                            }
                        },
                        screenSharing: function (container, count) {
                            var size = {parentWidth: _size.width, parentHeight: _size.height};

                            return screenSharingLayout(count, size, true);
                        }
                    }

                    function simpleGrid(count, size, perRow, rowsNum) {
                        var rects = [];
                        var rectHeight;
                        var rectWidth = size.parentWidth / perRow;
                        if(rowsNum == null) {
                            rectHeight = size.parentHeight / Math.ceil(count / perRow);
                            rowsNum = Math.floor(size.parentHeight / rectHeight);
                        } else {
                            rectHeight = size.parentHeight / rowsNum;
                        }


                        var isNextNewLast = false;
                        var rowItemCounter = 1;
                        var i;
                        for (i = 1; i <= count; i++) {
                            var prevRect = rects[rects.length - 1] ? rects[rects.length - 1] : new DOMRect(0, 0, 0, 0) ;
                            var currentRow = isNextNewLast  ? rowsNum : Math.ceil(i/perRow);
                            var isNextNewRow  = rowItemCounter == perRow;
                            isNextNewLast = isNextNewLast == true ? true : isNextNewRow && currentRow + 1 == rowsNum;

                            if(rowItemCounter == 1) {
                                var y = prevRect.height * (currentRow - 1);
                                var x = 0;
                            } else {
                                var y = prevRect.y;
                                var x = prevRect.x + prevRect.width;
                            }

                            var rect = new DOMRect(x, y, rectWidth, rectHeight);

                            if (isNextNewRow && isNextNewLast) {
                                perRow = count - i;
                                rectWidth = size.parentWidth / perRow;

                            }
                            rects.push(rect);

                            if (isNextNewRow) {
                                rowItemCounter = 1;
                            } else rowItemCounter++;
                        }

                        return rects;
                    }

                    function simpleGridBasedOnRowsNum(count, rowsNum, size) {
                        var rects = []
                        var perRow = Math.floor(count / rowsNum);

                        var rectWidth = size.parentWidth / perRow;
                        var rectHeight = size.parentHeight / rowsNum;
                        var isNextNewLast   = false;
                        var rowItemCounter = 1;
                        var i;
                        for (i = 1; i <= count; i++) {
                            var prevRect = rects[rects.length - 1] ? rects[rects.length - 1] : new DOMRect(0, 0, 0, 0) ;
                            var currentRow = isNextNewLast  ? rowsNum : Math.ceil(i/perRow);
                            var isNextNewRow  = rowItemCounter == perRow;
                            isNextNewLast = isNextNewLast == true ? true : isNextNewRow && currentRow + 1 == rowsNum;

                            if(rowItemCounter == 1) {
                                var y = prevRect.height * (currentRow - 1);
                                var x = 0;
                            } else {
                                var y = prevRect.y;
                                var x = prevRect.x + prevRect.width;
                            }
                            var rect = new DOMRect(x, y, rectWidth, rectHeight);

                            if(isNextNewRow && isNextNewLast) {
                                perRow = count - i;
                                rectWidth = size.parentWidth / perRow;
                            }


                            rects.push(rect);

                            if(isNextNewRow) {
                                rowItemCounter = 1;
                            } else rowItemCounter++
                        }

                        return rects;
                    }

                    function screenSharingLayout(count, size, maximized) {
                        var rects = [];

                        if(maximized) {
                            var mainScreenRect = new DOMRect(0, 0, size.parentWidth, size.parentHeight);
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
                                    y = (size.parentHeight - 66) - (rectHeight + spaceBetween);
                                    x = prevRect.x - (rectWidth + spaceBetween);
                                    createNewColOnRight = false;
                                } else {
                                    y = (size.parentHeight - 66) - (rectHeight + spaceBetween);
                                    x = size.parentWidth - (rectWidth + spaceBetween);
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
                                    y = (size.parentHeight - 66) - (rectHeight + spaceBetween);
                                    x = prevRect.x + prevRect.width + spaceBetween;
                                    createNewColOnLeft = false;
                                } else {
                                    y = (size.parentHeight - 66) - (rectHeight + spaceBetween);
                                    x = spaceBetween;
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

                    return layouts[layoutName]({width: _size.width, height: _size.height}, numberOfRects);
                }

                function stopAndRemove() {
                    log('videoComposer: stopAndRemove')

                    if(_canvas != null) {
                        if(_canvas.parentNode != null) _canvas.parentNode.removeChild(_canvas);
                    }

                    if(_canvasMediStream != null) {
                        /*var streamTracks = _canvasMediStream.getTracks();
						for(var t in streamTracks) {
							streamTracks[t].stop();
						}*/
                    }

                    _isActive = false;
                    _streams = [];
                }

                function isActive() {
                    return _isActive;
                }

                return {
                    updateCanvasLayout: updateCanvasLayout,
                    compositeVideosAndDraw: compositeVideosAndDraw,
                    refreshEventListeners: refreshEventListeners,
                    switchingRoom: switchingRoom,
                    stop: stopAndRemove,
                    isActive: isActive
                }
            }());

            var audioComposer = (function(){
                var audio = new AudioContext();
                var _dest;

                function mix() {
                    if(_dest == null) _dest = audio.createMediaStreamDestination();

                    let participants = _roomInstance.roomParticipants();
                    let tracksNum = 0;
                    participants.forEach(function(participant) {
                        let audiotracks = participant.audioTracks();
                        if(audiotracks.length != 0) {

                            if(audiotracks[0].stream != null && audiotracks[0].stream.getAudioTracks().length != 0) {
                                const source = audio.createMediaStreamSource(audiotracks[0].stream);
                                source.connect(_dest);
                                tracksNum++;
                            }
                        }
                    });

                    let silence = () => {
                        let ctx = new AudioContext(), oscillator = ctx.createOscillator();
                        let dst = oscillator.connect(ctx.createMediaStreamDestination());
                        oscillator.start();
                        return Object.assign(dst.stream.getAudioTracks()[0], {enabled: false});
                    }

                    if(tracksNum != 0){
                        _canvasMediStream.addTrack(_dest.stream.getTracks()[0]);
                    } else {
                        var silentTrack = silence();
                        var silentStream = new MediaStream();
                        silentStream.addTrack(silentTrack);
                        let source = audio.createMediaStreamSource(silentStream);
                        source.connect(_dest);
                        _canvasMediStream.addTrack(_dest.stream.getTracks()[0]);

                    }

                    _roomInstance.event.on('audioTrackLoaded', function(e) {
                        if(_canvasMediStream == null || _dest == null) return;
                        let source = audio.createMediaStreamSource(e.track.stream);
                        source.connect(_dest);
                    })

                    if(options.liveStreaming.sounds) {
                        _roomInstance.event.on('participantConnected', function (e) {
                            if (_canvasMediStream == null || _dest == null) return;
                            console.log('options.sounds.participantConnected', options.sounds.participantConnected)

                            var connectedAudio = new Audio(options.sounds.participantConnected)
                            var audioSource = audio.createMediaElementSource(connectedAudio);
                            audioSource.connect(_dest);
                            connectedAudio.play();
                            //audioSource.disconnect(_dest);
                        })

                        _roomInstance.event.on('participantDisconnected', function (e) {
                            if (_canvasMediStream == null || _dest == null) return;
                            console.log('options.sounds.participantDisconnected', options.sounds.participantDisconnected)
                            var disconnectedAudio = new Audio(options.sounds.participantDisconnected)
                            var audioSource = audio.createMediaElementSource(disconnectedAudio);
                            audioSource.connect(_dest);
                            disconnectedAudio.play();
                            //audioSource.disconnect(_dest);
                        })
                    }
                }

                function stop() {
                    if(_dest != null) _dest.disconnect();
                    _dest = null;
                }

                return {
                    mix: mix,
                    stop: stop
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

            function captureStream(ondataavailable) {
                log('captureStream');
                if(ondataavailable != null){
                    addDataListener(ondataavailable);
                }

                var isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

                var codecs;
                if(isChrome && !_isMobile) {
                    codecs = 'video/webm;codecs=h264';
                } else if (_isMobile && _isAndroid) {
                    codecs = 'video/webm;codecs=vp8';
                }

                if(options.liveStreaming.useRecordRTCLibrary) {
                    log('captureStream if1');

                    videoComposer.compositeVideosAndDraw();

                    _canvasMediStream = canvasComposer.canvas().captureStream(25);
                    audioComposer.mix();

                    _mediaRecorder = RecordRTC(_canvasMediStream, {
                        recorderType:MediaStreamRecorder,
                        mimeType: codecs,
                        timeSlice: 1000,
                        ondataavailable:trigerDataListeners
                    });
                    _mediaRecorder.startRecording();
                } else {
                    log('captureStream if1 else');

                    if(_mediaRecorder != null){
                        return;
                    }

                    videoComposer.compositeVideosAndDraw();

                    _canvasMediStream = _canvas.captureStream(30); // 30 FPS

                    audioComposer.mix();

                    _mediaRecorder = new MediaRecorder(_canvasMediStream, {
                        //mimeType: 'video/webm',
                        mimeType: codecs,
                        videoBitsPerSecond : 3 * 1024 * 1024
                    });

                    _mediaRecorder.onerror = function(e) {
                        console.error(e);
                    }

                    _mediaRecorder.addEventListener('dataavailable', function(e) {
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
                videoComposer.stop();
                audioComposer.stop();
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
                stopRecorder: stopRecorder,
                isActive: function () {
                    if(_mediaRecorder != null) return true;
                    return false;
                }
            }
        }(app))

        var fbLive = (function (roomInstance) {
            var _roomInstance = roomInstance;
            var _streamUsingWebRTC = false;
            var _streamingSocket;
            var _streamingParticipant;

            var _videoStream = {blobs: [], allBlobs: [], size: 0, timer: null}

            function connect(streamUrl, callback) {
                if(typeof io == 'undefined') return;
                log('startStreaming connect');

                var secure = options.nodeServer.indexOf('https://') == 0;
                _streamingSocket = io.connect(options.nodeServer + '/webrtc', {
                    query: {
                        rtmp: streamUrl,
                        localInfo: JSON.stringify(_localInfo)
                    },
                    transports: ['websocket'],
                    'force new connection': true,
                    secure:secure,
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    reconnectionAttempts: 5
                });
                _streamingSocket.on('connect', function () {
                    if(callback != null) callback();
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

                for (let i = 0; i < blobsLength; i++) {
                    if (_videoStream.blobs.length == 0) break;
                    sumSize = sumSize + _videoStream.blobs[i].size;

                    let chunkSize = options.liveStreaming.chunkSize != null ? options.liveStreaming.chunkSize : 1000000;
                    if (sumSize >= chunkSize && _videoStream.recordingStopped != true) {
                        let blobsToSend = _videoStream.blobs.slice(0, i + 1);
                        _videoStream.blobs.splice(0, i);
                        var mergedBlob = new Blob(blobsToSend);

                        /*var blobToSend;
						if (mergedBlob.size > 1000000) {
							blobToSend = mergedBlob.slice(0, 1000000);
							var blobToNotSend = mergedBlob.slice(1000000);
							_videoStream.blobs.unshift(blobToNotSend);
						} else {
							blobToSend = mergedBlob;
						}*/

                        //let lastChunk = _videoStream.recordingStopped === true ? true : false;
                        //_videoStream.allBlobs.push(mergedBlob);
                        log('ondataavailable SEND CHUNK', mergedBlob.size)
                        _streamingSocket.emit('Streams/webrtc/videoData', mergedBlob);
                        break;
                    }
                }

            }

            function startStreaming(fbStreamUrl) {
                log('startStreaming', fbStreamUrl);

                connect(fbStreamUrl, function () {
                    log('startStreaming connected');
                    if(!_streamUsingWebRTC) {
                        canvasComposer.captureStream(function (blob) {
                            onDataAvailablehandler(blob);
                        });

                        var timer = function() {
                            if(_videoStream.blobs.length != 0) {
                                let blobsToSend = _videoStream.blobs.splice(0, (_videoStream.blobs.length - 1));
                                var mergedBlob = new Blob(blobsToSend);
                                _streamingSocket.emit('Streams/webrtc/videoData', mergedBlob);
                            }
                            _videoStream.timer = setTimeout(timer, 6000);
                        }

                        _videoStream.timer = setTimeout(timer, 6000);

                        _roomInstance.event.dispatch('facebookLiveStreamingStarted', localParticipant);
                        _roomInstance.eventBinding.sendDataTrackMessage("facebookLiveStreamingStarted");
                    } else {
                        socket.emit('Streams/webrtc/recording', {url:fbStreamUrl});
                        var getStreamingParticipant = function (streamingParticipant) {
                            log('startLivestreaming getStreamingParticipant', streamingParticipant)
                            log('startLivestreaming getStreamingParticipant', streamingParticipant.connection ? streamingParticipant.connection.initiatorId : null, localParticipant.sid)
                            if(streamingParticipant.sid == 'recording' && streamingParticipant.connection && streamingParticipant.connection.initiatorId == localParticipant.sid) {
                                log('startLivestreaming getStreamingParticipant streamingParticipant')

                                _streamingParticipant = streamingParticipant;
                                _roomInstance.event.off('participantConnected', getStreamingParticipant);
                            }
                        }
                        _roomInstance.event.on('participantConnected', getStreamingParticipant);
                    }
                });
            }

            function switchRoom(roomInstance, roomParticipants) {
                log('fbLive switchRoom', roomInstance);
                if(_streamingParticipant == null) return;
                _roomInstance = roomInstance;
                //_streamingParticipant.connection.initiatorId = _roomInstance.localParticipant().sid;

                _roomInstance.addParticipant(_streamingParticipant);
                for(let s in _streamingParticipant.screens) {
                    _roomInstance.screensInterface.addScreenToCommonList(_streamingParticipant.screens[s]);
                }
                log('fbLive switchRoom roomParticipants', roomParticipants.length);
                log('fbLive switchRoom roomParticipants2', app.roomParticipants(true).length);
                log('fbLive switchRoom _streamingParticipant', _streamingParticipant);


                _roomInstance.event.dispatch('participantConnected', _streamingParticipant);
            }

            return {
                goLive: function () {
                    log('goLiveDialog goLive');
                },
                endStreaming: function () {
                    log('endStreaming');

                    clearTimeout(_videoStream.timer);
                    let blobsToSend = _videoStream.blobs.splice(0, (_videoStream.blobs.length - 1));
                    var mergedBlob = new Blob(blobsToSend);
                    _streamingSocket.emit('Streams/webrtc/videoData', mergedBlob);

                    canvasComposer.stopRecorder();

                    if(_streamingSocket != null) _streamingSocket.disconnect();
                    _streamingSocket = null;
                    _roomInstance.event.dispatch('facebookLiveStreamingEnded', localParticipant);
                    _roomInstance.eventBinding.sendDataTrackMessage("facebookLiveStreamingEnded");
                },
                isStreaming: function () {
                    if(_streamingSocket != null && _streamingSocket.connected) return true;
                    return false;
                },
                startStreaming: startStreaming,
                switchRoom: switchRoom,
                videoStream:function () {
                    return _videoStream;
                },
                streamingParticipant:function () {
                    return _streamingParticipant;
                }
            }
        }(app))

        var videoRecorder = (function () {
            var _videoStream = {blobs: [], allBlobs: [], size: 0}

            function onDataAvailablehandler(blob) {

                _videoStream.blobs.push(blob);
                _videoStream.allBlobs.push(blob);

                _videoStream.size += blob.size;
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

            function startRecording(callback) {
                log('startRecording');

                canvasComposer.captureStream(function (blob) {
                    onDataAvailablehandler(blob);
                });

                if(callback != null) callback();
                app.event.dispatch('videoRecordingStarted', localParticipant);
                //app.eventBinding.sendDataTrackMessage("facebookLiveStreamingStarted");
            }

            function stopRecording(callback) {
                log('stopRecording');

                canvasComposer.stopRecorder();
                if(callback != null) callback();
                app.event.dispatch('videoRecordingStopped', localParticipant);
                //app.eventBinding.sendDataTrackMessage("facebookLiveStreamingEnded");
            }

            return {
                startRecording: startRecording,
                stopRecording: stopRecording,
                isRecording: function () {
                    return false;
                }
            }
        }())
        var url = new URL(location.href);

        var mode = url.searchParams.get("mode");

        if(mode != null) {
            var youtubeLive = (function () {
                var _streamingSocket;
                var _fbUserId = null;

                var _fbApiInited;
                var _fbStreamUrl;

                var _videoStream = {blobs: [], allBlobs: [], size: 0, timer: null}

                function connect(streamUrl, callback) {
                    if(typeof io == 'undefined') return;

                    var secure = options.nodeServer.indexOf('https://') == 0;
                    _streamingSocket = io.connect(options.nodeServer + '/webrtc', {
                        query: {
                            rtmp: streamUrl,
                            localInfo: JSON.stringify(_localInfo)
                        },
                        transports: ['websocket'],
                        'force new connection': true,
                        secure:secure,
                        reconnection: true,
                        reconnectionDelay: 1000,
                        reconnectionDelayMax: 5000,
                        reconnectionAttempts: 5
                    });
                    _streamingSocket.on('connect', function () {
                        if(callback != null) callback();
                    });
                    window.streamingSocket = _streamingSocket;
                }

                function onDataAvailablehandler(blob) {

                    _videoStream.blobs.push(blob);

                    _videoStream.size += blob.size;

                    if(options.liveStreaming.timeSlice != null) return;

                    let blobsLength = _videoStream.blobs.length;
                    let sumSize = 0;

                    for (let i = 0; i < blobsLength; i++) {
                        if (_videoStream.blobs.length == 0) break;
                        sumSize = sumSize + _videoStream.blobs[i].size;

                        let chunkSize = options.liveStreaming.chunkSize != null ? options.liveStreaming.chunkSize : 1000000;
                        if (sumSize >= chunkSize && _videoStream.recordingStopped != true) {
                            let blobsToSend = _videoStream.blobs.slice(0, i + 1);
                            _videoStream.blobs.splice(0, i);
                            var mergedBlob = new Blob(blobsToSend);

                            /*var blobToSend;
							if (mergedBlob.size > 1000000) {
								blobToSend = mergedBlob.slice(0, 1000000);
								var blobToNotSend = mergedBlob.slice(1000000);
								_videoStream.blobs.unshift(blobToNotSend);
							} else {
								blobToSend = mergedBlob;
							}*/

                            //let lastChunk = _videoStream.recordingStopped === true ? true : false;
                            //_videoStream.allBlobs.push(mergedBlob);
                            log('ondataavailable SEND CHUNK', mergedBlob.size)
                            _streamingSocket.emit('Streams/webrtc/videoData', mergedBlob);
                            break;
                        }
                    }

                }

                return {
                    goLive: function () {
                        log('goLiveDialog goLive');
                    },
                    endStreaming: function () {
                        log('endStreaming');

                        clearTimeout(_videoStream.timer);
                        let blobsToSend = _videoStream.blobs.splice(0, (_videoStream.blobs.length - 1));
                        var mergedBlob = new Blob(blobsToSend);
                        _streamingSocket.emit('Streams/webrtc/videoData', mergedBlob);

                        canvasComposer.stopRecorder();

                        if(_streamingSocket != null) _streamingSocket.disconnect();
                        _streamingSocket = null;

                        //app.event.dispatch('facebookLiveStreamingEnded');
                    },
                    isStreaming: function () {
                        if(_streamingSocket != null && _streamingSocket.connected) return true;
                        return false;
                    },
                    startStreaming: function(fbStreamUrl) {
                        log('startStreaming', fbStreamUrl);

                        connect(fbStreamUrl, function () {
                            canvasComposer.captureStream(function (blob) {
                                onDataAvailablehandler(blob);
                                //_streamingSocket.emit('Streams/webrtc/videoData', blob);
                            });

                            var timer = function() {
                                if(_videoStream.blobs.length != 0) {
                                    let blobsToSend = _videoStream.blobs.splice(0, (_videoStream.blobs.length - 1));
                                    var mergedBlob = new Blob(blobsToSend);
                                    _streamingSocket.emit('Streams/webrtc/videoData', mergedBlob);
                                }
                                _videoStream.timer = setTimeout(timer, 6000);
                            }

                            _videoStream.timer = setTimeout(timer, 6000);

                            //app.event.dispatch('facebookLiveStreamingStarted');
                        });
                    }
                }
            }())
        }

        var youtubeLiveUploader = (function () {
            var DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v2/files/';
            var STATUS_POLLING_INTERVAL_MILLIS = 60 * 1000; // One minute.
            var _recorder;
            var _videoStream = {blobs: [], size:0};
            var _uploaderInterval;

            /**
             * Helper for implementing retries with backoff. Initial retry
             * delay is 1 second, increasing by 2x (+jitter) for subsequent retries
             *
             * @constructor
             */
            var RetryHandler = function() {
                this.interval = 1000; // Start at one second
                this.maxInterval = 60 * 1000; // Don't wait longer than a minute
            };

            /**
             * Invoke the function after waiting
             *
             * @param {function} fn Function to invoke
             */
            RetryHandler.prototype.retry = function(fn) {
                log('RetryHandler: retry');
                setTimeout(fn, this.interval);
                this.interval = this.nextInterval_();
            };

            /**
             * Reset the counter (e.g. after successful request.)
             */
            RetryHandler.prototype.reset = function() {
                log('RetryHandler: reset');
                this.interval = 1000;
            };

            /**
             * Calculate the next wait time.
             * @return {number} Next wait interval, in milliseconds
             *
             * @private
             */
            RetryHandler.prototype.nextInterval_ = function() {
                log('RetryHandler: nextInterval_');

                var interval = this.interval * 2 + this.getRandomInt_(0, 1000);
                return Math.min(interval, this.maxInterval);
            };

            /**
             * Get a random int in the range of min to max. Used to add jitter to wait times.
             *
             * @param {number} min Lower bounds
             * @param {number} max Upper bounds
             * @private
             */
            RetryHandler.prototype.getRandomInt_ = function(min, max) {
                return Math.floor(Math.random() * (max - min + 1) + min);
            };


            /**
             * Helper class for resumable uploads using XHR/CORS. Can upload any Blob-like item, whether
             * files or in-memory constructs.
             *
             * @example
             * var content = new Blob(["Hello world"], {"type": "text/plain"});
             * var uploader = new MediaUploader({
 *   file: content,
 *   token: accessToken,
 *   onComplete: function(data) { ... }
 *   onError: function(data) { ... }
 * });
             * uploader.upload();
             *
             * @constructor
             * @param {object} options Hash of options
             * @param {string} options.token Access token
             * @param {blob} options.file Blob-like item to upload
             * @param {string} [options.fileId] ID of file if replacing
             * @param {object} [options.params] Additional query parameters
             * @param {string} [options.contentType] Content-type, if overriding the type of the blob.
             * @param {object} [options.metadata] File metadata
             * @param {function} [options.onComplete] Callback for when upload is complete
             * @param {function} [options.onProgress] Callback for status for the in-progress upload
             * @param {function} [options.onError] Callback if upload fails
             */
            var MediaUploader = function(options) {
                var noop = function() {};
                this.file = options.file;
                this.contentType = options.contentType || this.file.type || 'application/octet-stream';
                this.metadata = options.metadata || {
                    'title': this.file.name,
                    'mimeType': this.contentType
                };
                this.token = options.token;
                this.onComplete = options.onComplete || noop;
                this.onProgress = options.onProgress || noop;
                this.onError = options.onError || noop;
                this.offset = options.offset || 0;
                this.chunkSize = options.chunkSize || 0;
                this.totalSize = 0;
                this.fileSize = 1000000*150;
                this.retryHandler = new RetryHandler();

                this.url = options.url;
                if (!this.url) {
                    var params = options.params || {};
                    params.uploadType = 'resumable';
                    this.url = this.buildUrl_(options.fileId, params, options.baseUrl);
                }
                this.httpMethod = options.fileId ? 'PUT' : 'POST';
            };

            /**
             * Initiate the upload.
             */
            MediaUploader.prototype.initUpload = function(callback) {
                log('MediaUploader: upload');

                var self = this;
                var xhr = new XMLHttpRequest();

                xhr.open(this.httpMethod, this.url, true);
                xhr.setRequestHeader('Authorization', 'Bearer ' + this.token);
                xhr.setRequestHeader('Content-Type', 'application/json');
                //xhr.setRequestHeader('Content-Length', 262144);
                //xhr.setRequestHeader('X-Upload-Content-Length', 1000000*150);
                xhr.setRequestHeader('X-Upload-Content-Type', this.contentType);

                xhr.onload = function(e) {
                    log('initUpload response', e.target)
                    if (e.target.status < 400) {
                        var location = e.target.getResponseHeader('Location');
                        this.url = location;
                        if(callback != null) callback(location);
                    } else {
                        this.onUploadError_(e);
                    }
                }.bind(this);
                xhr.onerror = this.onUploadError_.bind(this);
                xhr.send(JSON.stringify(this.metadata));
            };

            /**
             * Send the actual file content.
             *
             * @private
             */
            MediaUploader.prototype.sendChunk = function(blob, lastChunk) {
                log('MediaUploader: sendChunk');
                var MediaUploaderInstance = this;
                var xhr = new XMLHttpRequest();

                this.totalSize = this.totalSize + blob.size;

                var end;
                if (this.offset || this.chunkSize) {
                    end = this.offset + blob.size;
                }

                xhr.open('PUT', this.url, true);
                xhr.setRequestHeader('Content-Type', this.contentType);

                if(lastChunk) {
                    MediaUploaderInstance.fileSize = this.totalSize;
                    end = this.offset + blob.size;

                    xhr.setRequestHeader('Content-Range', 'bytes ' + this.offset + '-' + (end - 1) + '/' + end);

                } else {
                    xhr.setRequestHeader('Content-Range', 'bytes ' + this.offset + '-' + (end - 1) + '/*');
                }


                xhr.setRequestHeader('X-Upload-Content-Type', this.file.type);
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', this.onProgress);
                }
                xhr.onload = function(e){
                    if (e.target.status == 200 || e.target.status == 201) {
                        MediaUploaderInstance.onComplete(e.target.response);
                    } else if (e.target.status == 308) {
                        MediaUploaderInstance.extractRange_(e.target);
                    }
                };
                xhr.onerror = function(e){
                    if (e.target.status && e.target.status < 500) {
                        console.error('MediaUploader: sendChunk_: onContentUploadError_: if < 500', e.target.response);
                    } else {
                        console.error('MediaUploader: sendChunk_: onContentUploadError_: else', e.target.response);
                    }
                }
                xhr.send(blob);
            };

            /**
             * Query for the state of the file for resumption.
             *
             * @private
             */
            MediaUploader.prototype.resume_ = function() {
                log('MediaUploader: resume_');

                var xhr = new XMLHttpRequest();
                xhr.open('PUT', this.url, true);
                xhr.setRequestHeader('Content-Range', 'bytes */' + this.file.size);
                xhr.setRequestHeader('X-Upload-Content-Type', this.file.type);
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', this.onProgress);
                }
                xhr.onload = this.onContentUploadSuccess_.bind(this);
                xhr.onerror = this.onContentUploadError_.bind(this);
                xhr.send();
            };

            /**
             * Extract the last saved range if available in the request.
             *
             * @param {XMLHttpRequest} xhr Request object
             */
            MediaUploader.prototype.extractRange_ = function(xhr) {
                var range = xhr.getResponseHeader('Range');
                if (range) {
                    this.offset = parseInt(range.match(/\d+/g).pop(), 10) + 1;
                }
            };

            /**
             * Handle successful responses for uploads. Depending on the context,
             * may continue with uploading the next chunk of the file or, if complete,
             * invokes the caller's callback.
             *
             * @private
             * @param {object} e XHR event
             */
            MediaUploader.prototype.onContentUploadSuccess_ = function(e) {
                log('MediaUploader: onContentUploadSuccess_');

                if (e.target.status == 200 || e.target.status == 201) {
                    log('MediaUploader: onContentUploadSuccess: 200 || 201');
                    this.onComplete(e.target.response);
                } else if (e.target.status == 308) {
                    log('MediaUploader: onContentUploadSuccess: 308');
                    this.extractRange_(e.target);
                    this.retryHandler.reset();
                    this.sendFile_();
                }
            };

            /**
             * Handles errors for uploads. Either retries or aborts depending
             * on the error.
             *
             * @private
             * @param {object} e XHR event
             */
            MediaUploader.prototype.onContentUploadError_ = function(e) {
                log('MediaUploader: onContentUploadError_');

                if (e.target.status && e.target.status < 500) {
                    log('MediaUploader: onContentUploadError_: if < 500');

                    this.onError(e.target.response);
                } else {
                    log('MediaUploader: onContentUploadError_: else');

                    this.retryHandler.retry(this.resume_.bind(this));
                }
            };

            /**
             * Handles errors for the initial request.
             *
             * @private
             * @param {object} e XHR event
             */
            MediaUploader.prototype.onUploadError_ = function(e) {
                this.onError(e.target.response); // TODO - Retries for initial upload
            };

            /**
             * Construct a query string from a hash/object
             *
             * @private
             * @param {object} [params] Key/value pairs for query string
             * @return {string} query string
             */
            MediaUploader.prototype.buildQuery_ = function(params) {
                log('MediaUploader: buildQuery_');

                params = params || {};
                return Object.keys(params).map(function(key) {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
                }).join('&');
            };

            /**
             * Build the drive upload URL
             *
             * @private
             * @param {string} [id] File ID if replacing
             * @param {object} [params] Query parameters
             * @return {string} URL
             */
            MediaUploader.prototype.buildUrl_ = function(id, params, baseUrl) {
                log('MediaUploader: buildUrl_');

                var url = baseUrl || DRIVE_UPLOAD_URL;
                if (id) {
                    url += id;
                }
                var query = this.buildQuery_(params);
                if (query) {
                    url += '?' + query;
                }
                return url;
            };


            var UploadVideo = function() {

                this.title = 'test upload';
                this.description = 'test desc';
                this.tags = ['youtube-cors-upload'];
                this.categoryId = 28;
                this.videoId = '';
                this.uploadStartTime = 0;
            };

            UploadVideo.prototype.ready = function(accessToken) {
                this.accessToken = accessToken;
                this.gapi = gapi;
                this.authenticated = true;
                this.gapi.client.request({
                    path: '/youtube/v3/channels',
                    params: {
                        part: 'snippet',
                        mine: true
                    },
                    callback: function(response) {
                        if (response.error) {
                            console.error(response.error.message);
                        } else {
                            log('UploadVideo.ready title', response.items[0].snippet.title);
                            log('UploadVideo.ready thumbnails', response.items[0].snippet.thumbnails.default.url);


                        }
                    }.bind(this)
                });
            };

            UploadVideo.prototype.initUpload = function(file, callback) {
                var uploadVideoInstance = this;
                var metadata = {
                    snippet: {
                        title: this.title,
                        description: this.description,
                        tags: this.tags,
                        categoryId: this.categoryId
                    },
                    status: {
                        privacyStatus: 'public'
                    }
                };
                var uploader = new MediaUploader({
                    baseUrl: 'https://www.googleapis.com/upload/youtube/v3/videos',
                    file: file,
                    token: this.accessToken,
                    chunkSize:  5000,
                    metadata: metadata,
                    params: {
                        part: Object.keys(metadata).join(',')
                    },
                    onError: function(data) {
                        var message = data;
                        try {
                            var errorResponse = JSON.parse(data);
                            message = errorResponse.error.message;
                        } finally {
                            alert(message);
                        }
                    }.bind(this),
                    onProgress: function(data) {
                        var bytesUploaded = data.loaded;
                        var totalBytes = parseInt(data.total);
                        var percentageComplete = parseInt((bytesUploaded * 100) / totalBytes);

                        this.callback(percentageComplete);
                    }.bind(this),
                    onComplete: function(data) {
                        var uploadResponse = JSON.parse(data);
                        this.videoId = uploadResponse.id;
                        this.videoURL = 'https://www.youtube.com/watch?v=' + this.videoId;
                        this.callback('uploaded', this.videoURL);

                        setTimeout(uploadVideoInstance.pollForVideoStatus.bind(this), 2000);
                    }.bind(this)
                });
                // This won't correspond to the *exact* start of the upload, but it should be close enough.
                this.uploadStartTime = Date.now();
                uploader.initUpload(callback);
                this.uploader = uploader;
            };

            UploadVideo.prototype.pollForVideoStatus = function() {
                var instace = this;
                log('UploadVideo.pollForVideoStatus');
                this.gapi.client.request({
                    path: '/youtube/v3/videos',
                    params: {
                        part: 'status,player',
                        id: this.videoId
                    },
                    callback: function(response) {
                        if (response.error) {
                            setTimeout(instace.pollForVideoStatus.bind(this), 2000);
                        } else {
                            var uploadStatus = response.items[0].status.uploadStatus;
                            switch (uploadStatus) {
                                case 'uploaded':
                                    this.callback('uploaded', instace.videoURL);
                                    setTimeout(instace.pollForVideoStatus.bind(this), 2000);
                                    break;
                                case 'processed':
                                    instace.callback('processed', instace.videoURL);
                                    break;
                                default:
                                    instace.callback('failed', instace.videoURL);
                                    break;
                            }
                        }
                    }.bind(this)
                });
            };

            function getRandomString() {
                if (window.crypto && window.crypto.getRandomValues && navigator.userAgent.indexOf('Safari') === -1) {
                    var a = window.crypto.getRandomValues(new Uint32Array(3)),
                        token = '';
                    for (var i = 0, l = a.length; i < l; i++) {
                        token += a[i].toString(36);
                    }
                    return token;
                } else {
                    return (Math.random() * new Date().getTime()).toString(36).replace(/\./g, '');
                }
            }

            function getFileName(fileExtension) {
                var d = new Date();
                var year = d.getUTCFullYear();
                var month = d.getUTCMonth();
                var date = d.getUTCDate();
                return 'Conference-' + year + month + date + '-' + getRandomString() + '.' + fileExtension;
            }

            function uploadToYouTube(fileName, firstBlob, callback, initCallback) {
                var fileExtension = 'mp4';
                var mediaContainerFormat = 'h264'
                var mimeType = 'video/webm\;codecs=h264';


                var uploadVideo = new UploadVideo();
                uploadVideo.ready(gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token);

                var blob = new File([firstBlob], getFileName(fileExtension), {
                    type: mimeType
                });

                if(!uploadVideo) {
                    alert('YouTube API are not available.');
                    return;
                }

                uploadVideo.title = fileName;
                uploadVideo.description = fileName;
                uploadVideo.tags = ['recordrtc'];
                uploadVideo.categoryId = 28; // via: http://stackoverflow.com/a/35877512/552182
                uploadVideo.videoId = '';
                uploadVideo.uploadStartTime = 0;

                uploadVideo.callback = callback;
                uploadVideo.initUpload(blob, function () {
                    if(initCallback != null) initCallback(uploadVideo.uploader);
                });
            }

            function onDataAvailablehandler(blob) {
                log('onDataAvailablehandler');

                if(_videoStream.size == 0) {
                    var fileName = getFileName('mp4');

                    uploadToYouTube(fileName,blob, function (percentageComplete, fileURL) {
                            if (percentageComplete == 'uploaded') {
                                log('Uploaded. However YouTube is still processing.', fileURL);
                                return;
                            }
                            if (percentageComplete == 'processed') {
                                log('Uploaded & Processed. Click to open YouTube video.', fileURL);
                                return;
                            }
                            if (percentageComplete == 'failed') {
                                log('YouTube failed transcoding the video.', fileURL);
                                return;
                            }

                            log(percentageComplete + '% uploaded to YouTube.');
                        },
                        function (uploader) {
                            log('uploadToYouTube: uploading inited')
                            _uploaderInterval = setInterval(function () {
                                let blobsLength = _videoStream.blobs.length;
                                let sumSize = 0;

                                for(let i = 0; i < blobsLength; i++) {
                                    if(_videoStream.blobs.length == 0) break;
                                    sumSize = sumSize + _videoStream.blobs[i].size;
                                    if(sumSize >= 262144 && _videoStream.recordingStopped != true) {
                                        let blobsToSend = _videoStream.blobs.slice(0, i + 1);
                                        let blobToSend = new Blob(blobsToSend);
                                        _videoStream.blobs.splice(0, i);
                                        log('ondataavailable SEND', sumSize);

                                        let lastChunk = _videoStream.recordingStopped === true ? true : false;
                                        uploader.sendChunk(blobToSend, lastChunk);
                                        break;
                                    } else if(_videoStream.recordingStopped === true) {
                                        log('ondataavailable SEND LAST CHUNK', sumSize);
                                        let blobToSend = new Blob(_videoStream.blobs);
                                        _videoStream.blobs = [];

                                        uploader.sendChunk(blobToSend, true);
                                        if(_uploaderInterval != null) {
                                            clearInterval(_uploaderInterval);
                                            _uploaderInterval = null;
                                            canvasComposer.removeDataListener(onDataAvailablehandler);
                                        }
                                    } else {
                                        log('ondataavailable BUFFER', sumSize);
                                    }
                                }
                            }, 1000)
                        });
                }

                _videoStream.blobs.push(blob);


                var size = 0;
                _videoStream.blobs.forEach(function(b) {
                    size += b.size;
                });
                _videoStream.size = size;
            }

            function recordAndUpload() {
                _videoStream.size = 0
                _videoStream.blobs = [];
                _videoStream.recordingStopped = false;
                canvasComposer.captureStream(onDataAvailablehandler);
            }

            function stopRecording() {
                _videoStream.recordingStopped = true;
            }

            return {
                recordAndUpload: recordAndUpload,
                stopRecording: stopRecording
            }
        }())

        var vimeoLiveUploader = (function () {
            var CLIENT_ID = '';
            var CLIENT_SECRET = '';
            var ACCESS_TOKEN;
            var TEST_ACCESS_TOKEN = '';

            var _location;
            var _videoStream = {blobs:[], size:0};
            var  _offset = 0;

            function authenticate(callback) {

                var authRequestBody = {
                    "grant_type": "client_credentials",
                    "scope": "private, upload"
                }

                var xhr = new XMLHttpRequest();

                xhr.open('POST', 'https://api.vimeo.com/oauth/authorize/client', true);
                xhr.setRequestHeader('Authorization','basic ' + window.btoa(CLIENT_ID + ':' + CLIENT_SECRET));
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Accept', 'application/vnd.vimeo.*+json;version=3.4')

                xhr.onload = function(e) {
                    var response = JSON.parse(e.target.response);
                    if (e.target.status < 400) {
                        ACCESS_TOKEN = response.access_token;
                        if(callback != null) callback(ACCESS_TOKEN);
                    } else {
                        onUploadError(e);
                    }
                }.bind(this);
                xhr.onerror = onUploadError;
                xhr.send(JSON.stringify(authRequestBody));
            }

            function initUpload() {
                authenticate(createVideo);
            }

            function onDataAvailablehandler(blob) {
                _videoStream.blobs.push(blob);

                _videoStream.size += blob.size;

                let blobsLength = _videoStream.blobs.length;
                let sumSize = 0;

                for(let i = 0; i < blobsLength; i++) {
                    if(_videoStream.blobs.length == 0) break;
                    sumSize = sumSize + _videoStream.blobs[i].size;

                    if(_videoStream.size > 1000000*2 && _videoStream.recordingStopped != true){
                        let blobsToSend = _videoStream.blobs.slice(0, i + 1);
                        var mergedBlob = new Blob(blobsToSend);
                        var blobToSend = mergedBlob.slice(0, _videoStream.size - (1000000*2));

                        let lastChunk = _videoStream.recordingStopped === true ? true : false;
                        canvasComposer.removeDataListener(onDataAvailablehandler);
                        _videoStream.recordingStopped = true;
                        sendChunk(blobToSend, lastChunk);
                        break;
                    } else if(sumSize >= 1000000 && _videoStream.recordingStopped != true) {
                        let blobsToSend = _videoStream.blobs.slice(0, i + 1);
                        _videoStream.blobs.splice(0, i);
                        var mergedBlob = new Blob(blobsToSend);

                        var blobToSend;
                        if(mergedBlob.size > 1000000) {
                            blobToSend = mergedBlob.slice(0, 1000000);
                            var blobToNotSend = mergedBlob.slice(1000000);
                            _videoStream.blobs.unshift(blobToNotSend);
                        } else {
                            blobToSend = mergedBlob;
                        }

                        let lastChunk = _videoStream.recordingStopped === true ? true : false;
                        sendChunk(blobToSend, lastChunk);
                        break;
                    } else if(_videoStream.recordingStopped === true) {

                    }
                }

            }

            function createVideo() {
                var uploadRequestBody = {
                    "upload": {
                        "approach": "tus",
                        "size": 1000000*2
                    },
                    "name": "My Video",
                    "privacy": { "view": "nobody" }
                }

                var xhr = new XMLHttpRequest();
                xhr.open('POST', 'https://api.vimeo.com/me/videos', true);
                xhr.setRequestHeader('Authorization','bearer ' + TEST_ACCESS_TOKEN);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Accept', 'application/vnd.vimeo.*+json;version=3.4')

                xhr.onload = function(e) {
                    var response = JSON.parse(e.target.response);
                    log('VIMEO createVideo response', response);
                    if (e.target.status < 400) {
                        _location = response.upload.upload_link;
                        canvasComposer.captureStream(onDataAvailablehandler);
                    } else {
                        onUploadError(e);
                    }
                }.bind(this);
                xhr.onerror = onUploadError;
                xhr.send(JSON.stringify(uploadRequestBody));
            }

            function onUploadError(e) {
                console.error(e);
            }

            function sendChunk(blob) {
                var xhr = new XMLHttpRequest();
                xhr.open('PATCH', _location, true);
                xhr.setRequestHeader('Tus-Resumable','1.0.0');
                xhr.setRequestHeader('Upload-Offset', _offset);
                xhr.setRequestHeader('Content-Type', 'application/offset+octet-stream');
                xhr.setRequestHeader('Accept', 'application/vnd.vimeo.*+json;version=3.4')

                xhr.onload = function(e) {
                    log('VIMEO sendChunk response', e);
                    if (e.target.status < 400) {
                        _offset = e.target.getResponseHeader('upload-offset');
                    } else {
                        onUploadError(e);
                    }
                }.bind(this);
                xhr.onerror = onUploadError;
                xhr.send(blob);
            }

            function completeUploading() {
                _videoStream.recordingStopped = true;
                var xhr = new XMLHttpRequest();
                xhr.open('PATCH', _location, true);
                xhr.setRequestHeader('Tus-Resumable','1.0.0');
                xhr.setRequestHeader('Upload-Offset',  _videoStream.size);
                xhr.setRequestHeader('Content-Type', 'application/offset+octet-stream');
                xhr.setRequestHeader('Accept', 'application/vnd.vimeo.*+json;version=3.4')

                xhr.onload = function(e) {
                    log('VIMEO completeUploading response', e);
                    if (e.target.status < 400) {

                    } else {
                        onUploadError(e);
                    }
                }.bind(this);
                xhr.onerror = onUploadError;
                xhr.send();
            }

            function recordAndUpload() {

            }

            function stopRecording() {
                completeUploading();
            }

            function verifyUpload() {
                var xhr = new XMLHttpRequest();
                xhr.open('HEAD', _location, true);
                xhr.setRequestHeader('Tus-Resumable','1.0.0');
                xhr.setRequestHeader('Accept', 'application/vnd.vimeo.*+json;version=3.4')

                xhr.onload = function(e) {
                    log('VIMEO verifyUpload response', e.target.response);
                    if (e.target.status < 400) {

                    } else {
                        onUploadError(e);
                    }
                }.bind(this);
                xhr.onerror = onUploadError;
                xhr.send();			}

            return {
                recordAndUpload: recordAndUpload,
                stopRecording: stopRecording,
                initUpload: initUpload,
                verifyUpload: verifyUpload
            }
        }())

        function addScreenToCommonList(screen) {
            log('addScreenToCommonList');

            screen.show();
            app.event.dispatch('screenAdded', {
                screen: screen,
                participant: screen.participant
            });

        }

        function removeScreenFromCommonList(screen) {
            log('removeScreenFromCommonList')
            screen.hide();

            app.event.dispatch('screenRemoved', {
                screen: screen,
                participant: screen.participant
            });
        }

        return {
            attachTrack: attachTrack,
            detachTracks: detachTracks,
            supportsVideoType: supportsVideoType,
            createTrackElement: createTrackElement,
            createParticipantScreen: createRoomScreen,
            removeScreensByParticipant: removeScreensByParticipant,
            getLoudestScreen: getLoudestScreen,
            audioVisualization: audioVisualization,
            createAudioAnalyser: createAudioAnalyser,
            canvasComposer:canvasComposer,
            videoRecorder:videoRecorder,
            fbLive:fbLive,
            youtubeLiveUploader:youtubeLiveUploader,
            addScreenToCommonList:addScreenToCommonList,
            removeScreenFromCommonList:removeScreenFromCommonList
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
            log('startShareScreen', options.onlyOneScreenSharingAllowed);


            app.eventBinding.sendDataTrackMessage("screensharingStarting");

            var screenForScreensharing = app.screensInterface.createParticipantScreen(localParticipant);
            screenForScreensharing.screensharing = true;

            if(options.mode != 'twilio') {
                getUserScreen().then(function (stream) {
                    var videoTrack = stream.getVideoTracks()[0];

                    if(!options.showScreenSharingInSeparateScreen) app.conferenceControl.disableVideo();
                    /*for (var p in roomParticipants) {
						if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null) {
							var videoSender = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (sender) {
								return sender.track && sender.track.kind == 'video';
							})[0];


							/!*if(videoSender){
								videoSender.replaceTrack(stream.getVideoTracks()[0])
									.then(function() {

									})
									.catch(function (e) {
										console.error(e.name + ': ' + e.message);
									});
							} else {*!/
							/!*var trackToAttach = new Track();
							trackToAttach.mediaStreamTrack = videoTrack;
							trackToAttach.kind = videoTrack.kind;

							app.screensInterface.attachTrack(trackToAttach, localParticipant);
							app.conferenceControl.enableVideo();*!/
							//}

						}
					}*/
                    var trackToAttach = new Track();
                    trackToAttach.stream = stream;
                    trackToAttach.sid = videoTrack.id;
                    trackToAttach.mediaStreamTrack = videoTrack;
                    trackToAttach.kind = videoTrack.kind;
                    trackToAttach.isLocal = true;
                    trackToAttach.screensharing = true;

                    app.eventBinding.sendDataTrackMessage("trackIsBeingAdded", {kind: 'video', streamId:trackToAttach.stream.id, screensharing:true});

                    app.screensInterface.attachTrack(trackToAttach, localParticipant);

                    app.conferenceControl.enableVideo();
                    if(successCallback != null) successCallback();
                    app.eventBinding.sendDataTrackMessage("screensharingStarted");

                }).catch(function(error) {
                    console.error(error.name + ': ' + error.message);
                    app.eventBinding.sendDataTrackMessage("screensharingFailed");

                    if(failureCallback != null) failureCallback(error);
                });
            } else {

                getUserScreen().then(function (stream) {
                    app.conferenceControl.disableVideo();

                    var screenTrack = stream.getVideoTracks()[0];
                    localParticipant.twilioInstance.publishTrack(screenTrack).then(function (trackPublication) {
                        var trackToAttach = new Track();
                        trackToAttach.sid = trackPublication.trackSid;
                        trackToAttach.kind = trackPublication.track.kind;
                        trackToAttach.screensharing = true;
                        trackToAttach.isLocal = true;
                        trackToAttach.mediaStreamTrack = trackPublication.track.mediaStreamTrack;
                        trackToAttach.twilioReference = trackPublication.track;

                        app.screensInterface.attachTrack(trackToAttach, localParticipant);
                        app.conferenceControl.enableVideo();
                        if (successCallback != null) successCallback();
                        app.eventBinding.sendDataTrackMessage("screensharingStarted");

                    });
                }).catch(function(error) {
                    console.error(error.name + ': ' + error.message);
                    app.eventBinding.sendDataTrackMessage("screensharingFailed");
                    if(failureCallback != null) failureCallback(error);
                });
            }

        }

        function stopShareScreen() {
            log('stopShareScreen');
            if(options.mode != 'twilio') {
                var screenSharingTracks = localParticipant.tracks.filter(function (trackObj) {
                    return trackObj.kind == 'video' && trackObj.screensharing == true && trackObj.mediaStreamTrack.readyState != 'ended';
                });
                log('stopShareScreen screenSharingTracks', screenSharingTracks);

                app.conferenceControl.disableVideo(screenSharingTracks);
            } else {

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

        return {
            getUserScreen: getUserScreen,
            startShareScreen: startShareScreen,
            stopShareScreen: stopShareScreen
        }
    }())

    app.eventBinding = (function () {
        function twilioParticipantConnected(participant) {
            log('twilioParticipantConnected', participant)
            var newParticipant = new Participant();
            newParticipant.sid = participant.sid;
            newParticipant.identity = participant.identity;
            newParticipant.isLocal = false;
            newParticipant.twilioInstance = participant;
            newParticipant.latestOnlineTime = performance.now();

            participantConnected(newParticipant);
            return  newParticipant;
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
            //if(newParticipant.screens.length == 0) app.screensInterface.createParticipantScreen(newParticipant)
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
            trackToAttach.twilioReference = track;
            participant.dataTrack = track;

            participant.dataTrack.on('message', function (data) {
                processDataTrackMessage(data, participant);
            });
        }

        function trackSubscribed(track, trackPublication, participant) {
            log('trackSubscribed', track, participant);

            var existingParticipant = roomParticipants.filter(function (roomParticipant) {
                return roomParticipant.sid == participant.sid;
            })[0];

            existingParticipant.latestOnlineTime = performance.now();

            if (track.kind === 'audio' || track.kind === 'video') {
                log("trackAdded: existingParticipant", existingParticipant);
                var trackToAttach = new Track();
                trackToAttach.sid = track.sid;
                trackToAttach.kind = track.kind;
                trackToAttach.mediaStreamTrack = track.mediaStreamTrack;
                trackToAttach.twilioReference = track;
                trackToAttach.trackPublication = trackPublication;

                app.screensInterface.attachTrack(trackToAttach, existingParticipant);
            } else if(track.kind === 'data') {
                track.trackPublication = trackPublication;
                dataTrackRecieved(track, existingParticipant);
            }
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
                if(data.type == 'screensharingStarting') {
                    var screenForScreensharing = app.screensInterface.createParticipantScreen(participant);
                    screenForScreensharing.screensharing = true;
                }
                app.event.dispatch(data.type, {content:data.content != null ? data.content : null, participant: participant});
            } else if(data.type == 'trackIsBeingAdded') {
                log('processDataTrackMessage', data.type)
                var screenSharingTrackHandler = function(e) {
                    log('trackIsBeingAdded screenSharingTrackHandler', e.track, data)
                    if(e.participant != participant) return;
                    e.track.screensharing = true;
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

            } else if(data.type == 'facebookLiveStreamingStarted') {
                participant.fbLiveStreamingActive = true;
                app.event.dispatch('facebookLiveStreamingStarted', participant);
            } else if(data.type == 'facebookLiveStreamingEnded') {
                participant.fbLiveStreamingActive = false;
                app.event.dispatch('facebookLiveStreamingEnded', participant);
            } else if(data.type == 'online') {

                if(data.content.micIsEnabled != null) participant.remoteMicIsEnabled = data.content.micIsEnabled;
                if(data.content.cameraIsEnabled != null) participant.remoteCameraIsEnabled = data.content.cameraIsEnabled;

                if(participant.online == false)	{
                    participant.online = true;
                    if(performance.now() - participant.latestOnlineTime < 5000) {
                        participant.reconnectionsCounter = participant.reconnectionsCounter + 1;
                    }
                    participantConnected(participant);
                    if(options.mode == 'node' && participant.RTCPeerConnection == null) {
                        participant.RTCPeerConnection = socketParticipantConnected().initPeerConnection(participant);
                    }
                    participant.latestOnlineTime = performance.now();
                } else {
                    participant.latestOnlineTime = performance.now();
                }
            } else if(data.type == 'service') {

                if(data.content.audioNotWork == true && app.conferenceControl.micIsEnabled())	{
                    console.error("Message from participants: microphone doesn't work. Fixing..")
                    app.conferenceControl.disableAudio();
                    app.conferenceControl.enableAudio();
                }
            }
        }

        function checkOnlineStatus() {
            //return;
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
                    micIsEnabled: app.conferenceControl.micIsEnabled(),
                    cameraIsEnabled: app.conferenceControl.cameraIsEnabled()
                }
                sendDataTrackMessage('online', info);
            }, 1000);
        }

        function sendDataTrackMessage(type, content) {
            //log("sendDataTrackMessage:", type, content);

            var message = {type:type};
            if(content != null) message.content = content;
            if(options.mode == 'twilio') {
                if (localParticipant.dataTrack != null) localParticipant.dataTrack.send(JSON.stringify(message));
            } else {
                var i, participant;
                for (i = 0; participant = roomParticipants[i]; i++){
                    if(participant == localParticipant || (participant.dataTrack == null || participant.dataTrack.readyState != 'open')) continue;
                    if (participant.dataTrack != null) participant.dataTrack.send(JSON.stringify(message));
                }
            }
        }

        function trackUnsubscribed(track, trackPublication, twilioParticipant) {
            var existingParticipant = roomParticipants.filter(function (roomParticipant) {
                return roomParticipant.sid == twilioParticipant.sid;
            })[0];

            log("trackUnsubscribed:", track, existingParticipant);

            app.screensInterface.detachTracks([track], existingParticipant);
        }

        function trackUnpublished(track, participant) {
            log("trackUnpublished:", participant);
        }

        function participantDisconnected(participant) {
            log("participantDisconnected: ", participant);
            log("participantDisconnected: is online - " + participant.online);
            if(participant.online == false) return;

            app.screensInterface.removeScreensByParticipant(participant);
            //participant.remove();
            participant.online = false;
            if(participant.fbLiveStreamingActive) {
                app.event.dispatch('facebookLiveStreamingEnded', participant);
            }

            app.event.dispatch('participantDisconnected', participant);

        }

        function twilioParticipantDisconnected(twilioParticipant) {
            var existingParticipant = roomParticipants.filter(function (roomParticipant) {
                return roomParticipant.sid == twilioParticipant.sid;
            })[0];

            log("twilioParticipantDisconnected", existingParticipant);

            if (existingParticipant != null) participantDisconnected(existingParticipant);
        }

        function localParticipantDisconnected() {
            log("localParticipantDisconnected");

            var tracks = Array.from(localParticipant.twilioInstance.tracks.values());

            localParticipant.tracks.forEach(function(track) {
                localParticipant.twilioInstance.unpublishTrack(track.twilioReference);
                track.twilioReference.stop();
            });

            app.screensInterface.detachTracks(tracks);
            app.screensInterface.removeScreensByParticipant(localParticipant);

            roomParticipants.forEach(function (participant) {
                participant = participant.twilioInstance;
                var tracks = Array.from(participant.tracks.values());
                app.screensInterface.detachTracks(tracks);
            });

            roomScreens = [];
            roomParticipants = [];

            app.event.dispatch('localParticipantDisconnected');
        }

        function roomJoined(room, dataTrack) {
            app.state = 'connected';
            twilioRoom = room;

            var participantScreen = roomScreens.filter(function (obj) {
                return obj.sid == room.localParticipant.sid;
            })[0];

            if(participantScreen == null) {

                localParticipant = new Participant();
                localParticipant.sid = room.localParticipant.sid;
                localParticipant.identity = room.localParticipant.identity;
                localParticipant.tracks = [];
                localParticipant.isLocal = true;
                localParticipant.twilioInstance = room.localParticipant;

                roomParticipants.push(localParticipant);

                var tracks = Array.from(room.localParticipant.tracks.values());

                for(var i in tracks) {

                    if(tracks[i].track.kind == 'data') {

                        continue;
                    }

                    var trackToAttach = new Track();
                    trackToAttach.sid = tracks[i].trackSid;
                    trackToAttach.kind = tracks[i].track.kind;
                    trackToAttach.isLocal = true;
                    trackToAttach.mediaStreamTrack = tracks[i].track.mediaStreamTrack;
                    trackToAttach.twilioReference = tracks[i].track;

                    app.screensInterface.attachTrack(trackToAttach, localParticipant);
                }

                //var dataTrack = new Twilio.LocalDataTrack();
                /*localParticipant.twilioInstance.publishTrack(dataTrack).then(function (dataTrackPublication) {
					localParticipant.dataTrack = dataTrackPublication.track;
					sendOnlineStatus();
				});*/

                localParticipant.dataTrack = dataTrack;
                sendOnlineStatus();
            }

            // Attach the Tracks of the Room's Participants.
            room.participants.forEach(function(participant) {
                if(participant == localParticipant.twilioInstance) return;
                var remoteParticipant = twilioParticipantConnected(participant);
            });

            room.on('participantConnected', twilioParticipantConnected);

            room.on('trackSubscribed', trackSubscribed);

            room.on('trackUnsubscribed', trackUnsubscribed);

            room.on('trackUnpublished', trackUnpublished);

            room.on('participantDisconnected', twilioParticipantDisconnected);

            room.on('disconnected', localParticipantDisconnected);

            room.localParticipant.on('trackPublicationFailed', function(error, localTrack) {
                console.warn('Failed to publish LocalTrack "%s": %s', localTrack.name, error.message);
            });

            room.on('trackSubscriptionFailed', function(error, remoteTrackPublication, remoteParticipant) {
                console.warn('Failed to subscribe to RemoteTrack "%s" from RemoteParticipant "%s": %s"', remoteTrackPublication.trackName, remoteParticipant.identity, error.message);
            });

            checkOnlineStatus();

            function disconnect() {
                twilioRoom.disconnect();
            }
            window.addEventListener('beforeunload', disconnect);
            window.addEventListener('unload', disconnect);
            window.addEventListener('pagehide', disconnect);

        }

        function gotIceCandidate(event, existingParticipant){


            if (event.candidate) {
                if(event.candidate.candidate.indexOf("relay")<0){ // if no relay address is found, assuming it means no TURN server
                    //return;
                }

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

            app.screensInterface.attachTrack(trackToAttach, existingParticipant);
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

                app.screensInterface.attachTrack(trackToAttach, existingParticipant);
            }

        }

        function socketEventBinding() {
            socket.on('Streams/webrtc/participantConnected', function (participant){
                log('socket: participantConnected', participant);
                socketParticipantConnected().initPeerConnection(participant);
            });

            socket.on('Streams/webrtc/roomParticipants', function (socketParticipants) {
                log('roomParticipants', socketParticipants);

                app.event.dispatch('roomParticipants', socketParticipants);
                var negotiationEnded = 0;
                function onNegotiatingEnd() {
                    log('socketEventBinding initNegotiationEnded');
                    app.initNegotiationState = 'ended';
                    app.event.dispatch('initNegotiationEnded', roomParticipants);
                    app.event.off('signalingStageChange', onSignalingStageChange);
                }

                function onSignalingStageChange(e) {
                    log('signalingStageChange', e);
                    var existingParticipant = roomParticipants.filter(function (roomParticipant) {
                        return roomParticipant.sid == e.participant.sid;
                    })[0];

                    if(existingParticipant != null && existingParticipant.signalingState.stage == 'answerSent') {
                        negotiationEnded++;
                    }

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
                    answerRecieved(message);
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
                    videoCanvas.style.top = '0';
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
                    frameCanvas.style.top = '0';
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


                    newPeerConnection.createOffer({ 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true })
                        .then(function(offer) {
                            log('createOffer: offer created', hasPriority, participant.hasNewOffersInQueue, participant.currentOfferId, participant.RTCPeerConnection.signalingState, offer)
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

                function negotiate() {
                    log('negotiate START', participant.signalingState.stage, newPeerConnection.signalingState, participant.isNegotiating, participant.hasNewOffersInQueue,  participant.currentOfferId, participant.shouldSendReverseOffer);

                    if((participant.signalingRole == 'impolite' && participant.waitingForOffer) || (participant.signalingRole == 'polite' && participant.waitingForReverseOffer)) {
                        log('negotiate CANCELING NEGOTIATION: waitingForOffer');
                        return;
                    }

                    var startNegotiating = function () {
                        var incrementOffersQueue = function () {
                            if(participant.currentOfferId !== false && participant.hasNewOffersInQueue == false){
                                participant.hasNewOffersInQueue = participant.currentOfferId + 1;
                            } else {
                                participant.hasNewOffersInQueue = participant.hasNewOffersInQueue !== false ? participant.hasNewOffersInQueue + 1 : 0;
                            }
                        }

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
                    if(app.conferenceControl.micIsEnabled()){

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

                        for(var i = participant.iceCandidatesQueue.length - 1; i >= 0 ; i--){
                            if(participant.iceCandidatesQueue[i] != null) {
                                newPeerConnection.addIceCandidate(participant.iceCandidatesQueue[i].candidate);
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
                        if(app.screensInterface.fbLive.isStreaming()) {
                            //app.eventBinding.sendDataTrackMessage("facebookLiveStreamingStarted");
                            dataChannel.send(JSON.stringify({type:"facebookLiveStreamingStarted"}));
                        }

                        var screensharingTracks = localParticipant.tracks.filter(function(t){
                            return t.screensharing == true && t.mediaStreamTrack.enabled == true && t.mediaStreamTrack.readyState == 'live' ? true : false
                        })

                        if(screensharingTracks.length != 0) {
                            app.eventBinding.sendDataTrackMessage("screensharingStarted", {trackId:screensharingTracks[0].mediaStreamTrack.id});
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

                function negotiate() {
                    log('negotiate START', senderParticipant.signalingRole , newPeerConnection.signalingState, senderParticipant.isNegotiating, senderParticipant.hasNewOffersInQueue,  senderParticipant.currentOfferId, senderParticipant.shouldSendReverseOffer);

                    //anti glare experiment
                    if((senderParticipant.signalingRole == 'impolite' && senderParticipant.waitingForOffer) || (senderParticipant.signalingRole == 'polite' && senderParticipant.waitingForReverseOffer)) {
                        log('negotiate CANCELING NEGOTIATION: waitingForOffer');
                        return;
                    }

                    var startNegotiating = function () {
                        var incrementOffersQueue = function () {
                            if(senderParticipant.currentOfferId !== false && senderParticipant.hasNewOffersInQueue == false){
                                senderParticipant.hasNewOffersInQueue = senderParticipant.currentOfferId + 1;
                            } else {
                                senderParticipant.hasNewOffersInQueue = senderParticipant.hasNewOffersInQueue !== false ? senderParticipant.hasNewOffersInQueue + 1 : 0;
                            }
                        }

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

                };

                newPeerConnection.onicecandidate = function (e) {
                    gotIceCandidate(e, senderParticipant);
                };

                senderParticipant.negotiate = negotiate;

                newPeerConnection.onnegotiationneeded = function (e) {
                    log('offerReceived: onnegotiationneeded, isNegotiating = ' + senderParticipant.isNegotiating);
                    log('offerReceived: onnegotiationneeded, sdp ' + (newPeerConnection.localDescription ? newPeerConnection.localDescription.sdp : 'n/a'))
                    negotiate();
                };

                return newPeerConnection;

            }

            function publishLocalAudio(RTCPeerConnection){
                var localTracks = localParticipant.tracks;
                log('offerReceived: publishLocalAudio:  micIsEnabled = ' + (app.conferenceControl.micIsEnabled()));

                if(app.conferenceControl.micIsEnabled()){
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
                log('offerReceived: publishLocalVideo: cameraIsEnabled = ' + (app.conferenceControl.cameraIsEnabled()));

                //if(app.conferenceControl.cameraIsEnabled()){
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

            function publishLocalMedia(RTCPeerConnection) {
                log('publishLocalMedia');

                publishLocalVideo(RTCPeerConnection);
                publishLocalAudio(RTCPeerConnection);
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
                    log('offerReceived: igonore offer from polite participant');

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

        function answerRecieved(message) {
            log('answerRecieved');
            log('answerRecieved: sdp: \n' + message.sdp.sdp);
            var senderParticipant = roomParticipants.filter(function (localParticipant) {
                return localParticipant.sid == message.fromSid;
            })[0];
            senderParticipant.identity = message.name;
            log('answerRecieved from participant', senderParticipant.username, senderParticipant.identity, senderParticipant.sid);

            var description;
            if(typeof cordova != 'undefined' && _isiOS) {
                description = new RTCSessionDescription(message.sdp);
            } else {
                description = message.sdp;
            }

            var offersInQueueBeforeAnswerApplied = senderParticipant.hasNewOffersInQueue;
            var peerConnection = senderParticipant.RTCPeerConnection;

            peerConnection.setRemoteDescription(description).then(function () {
                log('answerRecieved setRemoteDescription ', peerConnection.signalingState, senderParticipant.hasNewOffersInQueue, senderParticipant.currentOfferId)
                if(offersInQueueBeforeAnswerApplied != senderParticipant.hasNewOffersInQueue) return;
                /*if((senderParticipant.hasNewOffersInQueue !== false && senderParticipant.currentOfferId !== false && senderParticipant.hasNewOffersInQueue > senderParticipant.currentOfferId)
                    || (senderParticipant.hasNewOffersInQueue !== false && senderParticipant.currentOfferId === false)
                    /!*|| senderParticipant.shouldSendReverseOffer*!/) {
                    log('answerRecieved STARTING NEW NEGOTIATION AGAIN ', senderParticipant.hasNewOffersInQueue, senderParticipant.currentOfferId)

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
            var senderParticipant = roomParticipants.filter(function (localParticipant) {
                return localParticipant.sid == message.fromSid;
            })[0];

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
            log('socketRoomJoined');
            app.state = 'connected';

            for (var s in streams) {
                var localTracks = streams[s].getTracks();

                for (var i in localTracks) {
                    var trackToAttach = new Track();
                    trackToAttach.sid = localTracks[i].id;
                    trackToAttach.kind = localTracks[i].kind
                    trackToAttach.isLocal = true;
                    trackToAttach.stream = streams[s];
                    trackToAttach.mediaStreamTrack = localTracks[i];

                    app.screensInterface.attachTrack(trackToAttach, localParticipant);
                }

                var videoTracks = streams[s].getVideoTracks();
                var audioTracks = streams[s].getAudioTracks();
                log('socketRoomJoined videoTracks ' + videoTracks.length);
                log('socketRoomJoined audioTracks ' + audioTracks.length);
                //if (videoTracks.length != 0 && audioTracks.length == 0) localParticipant.videoStream = streams[s];
                //if (audioTracks.length != 0 && videoTracks.length == 0) localParticipant.audioStream = streams[s];
            }



            app.eventBinding.socketEventBinding();
            sendOnlineStatus();
            checkOnlineStatus();
            log('joined', {username:localParticipant.identity, sid:socket.id, room:options.roomName})
            socket.emit('Streams/webrtc/joined', {username:localParticipant.identity, sid:socket.id, room:options.roomName, roomPublisher: options.roomPublisher, isiOS: _isiOS, info: _localInfo});
        }

        return {
            roomJoined: roomJoined,
            processDataTrackMessage: processDataTrackMessage,
            sendDataTrackMessage: sendDataTrackMessage,
            socketRoomJoined: socketRoomJoined,
            socketEventBinding: socketEventBinding,
            offerReceived: offerReceived,
            answerRecieved: answerRecieved,
            iceConfigurationReceived: iceConfigurationReceived,
            socketParticipantConnected: socketParticipantConnected,
            createOfferAndRenegotiate: createOfferAndRenegotiate
        }
    }())


    function sendMessage(message){
        log('sendMessage', message)
        socket.emit('Streams/webrtc/signalling', message);
    }

    app.conferenceControl = (function () {
        var cameraIsDisabled = options.startWith.video === true ? false : true;
        var micIsDisabled = options.startWith.audio === true ? false : true;
        log('micIsDisabled', micIsDisabled, options.startWith.audio);

        var screensharingIsDisabled = true;
        var speakerIsDisabled = false;
        var currentAudioOutputMode = 'speaker';

        var audioInputDevices = [];
        var videoInputDevices = [];
        var currentCameraDevice;
        var currentAudioDevice;
        var frontCameraDevice;

        function loadDevicesList(mediaDevicesList, reload) {
            log('loadDevicesList');

            if(mediaDevicesList != null && typeof reload == 'undefined') {
                videoInputDevices = [];
                audioInputDevices = [];
                var i, device;
                for (i = 0; device = mediaDevicesList[i]; i++) {
                    log('loadDevicesList: ' + device.kind);
                    if (device.kind.indexOf('video') != -1) {
                        videoInputDevices.push(device);
                        for (var x in localParticipant.tracks) {
                            var mediaStreamTrack = localParticipant.tracks[x].mediaStreamTrack;

                            if (!(typeof cordova != 'undefined' && _isiOS)) {
                                if (mediaStreamTrack.enabled == true && ((typeof mediaStreamTrack.getSettings != 'undefined' && (mediaStreamTrack.getSettings().deviceId == device.deviceId || mediaStreamTrack.getSettings().label == device.label)) || mediaStreamTrack.label == device.label)) {
                                    frontCameraDevice = currentCameraDevice = device;
                                }
                            }
                        }
                    }
                    if (device.kind.indexOf('audio') != -1) {
                        audioInputDevices.push(device);
                        for (var x in localParticipant.tracks) {
                            var mediaStreamTrack = localParticipant.tracks[x].mediaStreamTrack;

                            if (!(typeof cordova != 'undefined' && _isiOS)) {
                                if (mediaStreamTrack.enabled == true
                                    && ((typeof mediaStreamTrack.getSettings != 'undefined' && (mediaStreamTrack.getSettings().deviceId == device.deviceId || mediaStreamTrack.getSettings().label == device.label)) || mediaStreamTrack.label == device.label)) {
                                    currentAudioDevice = device;
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
            log('currentAudioDevice', currentAudioDevice);
            log('frontCameraDevice', frontCameraDevice);
        }

        function getVideoDevices() {
            return videoInputDevices;
        }

        function getAudioDevices() {
            return audioInputDevices;
        }

        function getCurrentCameraDevice() {
            return currentCameraDevice;
        }

        function getFrontCameraDevice() {
            return frontCameraDevice;
        }

        function getCurrentAudioDevice() {
            return currentAudioDevice;
        }

        function toggleCameras(camera, callback, failureCallback) {
            log('toggleCameras: camera = ' + camera)
            app.eventBinding.sendDataTrackMessage("beforeCamerasToggle");

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

            if(options.mode != 'twilio') {
                var constrains
                if(camera != null && camera.deviceId != null && camera.deviceId != '') {
                    constrains = {deviceId: {exact: camera.deviceId}};
                    if(typeof cordova != 'undefined' && _isiOS) {
                        constrains = {deviceId: camera.deviceId}
                    }
                } else if(camera != null && camera.groupId != null && camera.groupId != '') {
                    constrains = {groupId: {exact: camera.groupId}};
                    if(typeof cordova != 'undefined' && _isiOS) {
                        constrains = {groupId: camera.groupId}
                    }
                } else if(deviceToSwitch != null && deviceToSwitch.deviceId != null && deviceToSwitch.deviceId != '') {
                    constrains = {groupId: {exact: deviceToSwitch.groupId}};
                    if(typeof cordova != 'undefined' && _isiOS) {
                        constrains = {groupId: deviceToSwitch.groupId}
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

                    if(app.conferenceControl.cameraIsEnabled() && currentVideoTracks.length != 0) {
                        log('toggleCameras: replace track');
                        if(!(typeof cordova != 'undefined' && _isiOS)) app.conferenceControl.replaceTrack(videoTrack);
                        app.screensInterface.attachTrack(trackToAttach, localParticipant);
                    } else {
                        log('toggleCameras: add track');

                        app.screensInterface.attachTrack(trackToAttach, localParticipant);
                        app.conferenceControl.enableVideo();

                        app.event.dispatch('cameraToggled');
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

                var i;
                var tracksNum = localParticipant.tracks.length - 1;
                for (i = tracksNum; i >= 0; i--) {
                    if (localParticipant.tracks[i].kind == 'audio' || (options.showScreenSharingInSeparateScreen && localParticipant.tracks[i].screensharing)) continue;
                    localParticipant.tracks[i].mediaStreamTrack.stop();
                    localParticipant.tracks[i].mediaStreamTrack.dispatchEvent(new Event("ended"));

                }

                if(typeof cordova != 'undefined' && _isiOS) {
                    cordova.plugins.iosrtc.getUserMedia({
                        'audio': false,
                        'video': constrains
                    }, function (videoStream) {
                        log('toggleCameras: iosrtc: got stream')

                        toggleCamera(videoStream);
                    }, function (error) {
                        console.error(error.name + ': ' + error.message);
                        if(failureCallback != null) failureCallback(error);
                    });
                } else {
                    navigator.mediaDevices.getUserMedia({
                        'audio': false,
                        'video': constrains
                    }).then(function (videoStream) {
                        log('toggleCameras: got stream')

                        toggleCamera(videoStream);

                    })
                        .catch(function (error) {
                            console.error(error.name + ': ' + error.message);
                            if(failureCallback != null) failureCallback(error);
                        });
                }
                return;
            }

            var twilioTracks = []

            var i;
            var tracksNum = localParticipant.tracks.length - 1;
            for (i = tracksNum; i >= 0; i--) {
                if (localParticipant.tracks[i].kind == 'audio') continue;
                twilioTracks.push(localParticipant.tracks[i].twilioReference);
                localParticipant.tracks[i].mediaStreamTrack.stop();
                localParticipant.tracks[i].mediaStreamTrack.enabled = false;
                localParticipant.tracks[i].remove();
            }

            navigator.mediaDevices.getUserMedia ({
                'audio': false,
                'video': {
                    width: { min: 320, max: 1280 },
                    height: { min: 240, max: 720 },
                    deviceId: { exact: camera.deviceId != null ? camera.deviceId : deviceToSwitch.deviceId }
                }
            }).then(function (stream) {
                var localVideoTrack = stream.getVideoTracks()[0];
                log('toggleCameras: getUserMedia: got stream');
                var participant = localParticipant.twilioInstance;

                participant.unpublishTracks(twilioTracks);

                var trackPublication = participant.publishTrack(localVideoTrack).then(function (publication) {

                    var vTrack = publication.track;

                    var trackToAttach = new Track();
                    trackToAttach.sid = publication.trackSid;
                    trackToAttach.mediaStreamTrack = vTrack.mediaStreamTrack;
                    trackToAttach.kind = vTrack.kind;
                    trackToAttach.isLocal = true;
                    trackToAttach.twilioReference = vTrack;

                    app.screensInterface.attachTrack(trackToAttach, localParticipant);
                    app.conferenceControl.enableVideo();
                    if(cameraId != null) {
                        currentCameraDevice = videoInputDevices.filter(function (d) {
                            return d.deviceId == cameraId;
                        })[0];
                    } else currentCameraDevice = deviceToSwitch;
                    if(callback != null) callback();
                    app.eventBinding.sendDataTrackMessage("afterCamerasToggle");
                    //localVideoTrack.enable();
                    //app.views.closeAllDialogues();
                    setTimeout(function () {
                        publication.track.enable();
                    }, 500)

                });

            }).catch(function(err) {
                console.error('trackPublication ERROR' + err.name + ": " + err.message);
            });

        }

        function enableCamera(callback, failureCallback) {
            log('enableCamera');

            var gotCameraStream = function(videoStream) {
                var localVideoTrack = videoStream.getVideoTracks()[0];

                if(options.mode == 'twilio') {
                    var participant = localParticipant.twilioInstance;
                    var trackPublication = participant.publishTrack(localVideoTrack).then(function (publication) {

                        var vTrack = publication.track;
                        var trackToAttach = new Track();
                        trackToAttach.sid = publication.trackSid;
                        trackToAttach.mediaStreamTrack = vTrack.mediaStreamTrack;
                        trackToAttach.kind = vTrack.kind;
                        trackToAttach.isLocal = true;
                        trackToAttach.twilioReference = vTrack;
                        app.screensInterface.attachTrack(trackToAttach, localParticipant);
                        app.conferenceControl.enableVideo();

                        videoInputDevices = [];
                        audioInputDevices = [];
                        loadDevicesList();
                        if (callback != null) callback();
                    });
                } else {
                    app.conferenceControl.disableVideo();

                    var trackToAttach = new Track();
                    trackToAttach.mediaStreamTrack = localVideoTrack;
                    trackToAttach.kind = localVideoTrack.kind;
                    trackToAttach.isLocal = true;
                    trackToAttach.stream = videoStream;


                    app.screensInterface.attachTrack(trackToAttach, localParticipant);
                    app.conferenceControl.enableVideo();
                    videoInputDevices = [];
                    audioInputDevices = [];
                    loadDevicesList();

                    app.event.dispatch('cameraEnabled');

                    if (callback != null) callback();
                }
            };

            if(typeof cordova != 'undefined' && _isiOS) {
                cordova.plugins.iosrtc.getUserMedia({
                    'audio': false,
                    'video': {
                        width: { min: 320, max: 1280 },
                        height: { min: 240, max: 720 }
                    }
                }, function (videoStream) {
                    gotCameraStream(videoStream);
                }, function (e) {
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

        function enableMicrophone(callback, failureCallback) {
            log('enableMicrophone');

            function successCallback(audioStream) {
                log('enableMicrophone: got stream');

                var localAudioTrack = audioStream.getAudioTracks()[0];

                if(options.mode == 'twilio') {
                    var participant = localParticipant.twilioInstance;
                    var trackPublication = participant.publishTrack(localAudioTrack).then(function (publication) {

                        var aTrack = publication.track;
                        var trackToAttach = new Track();
                        trackToAttach.sid = publication.trackSid;
                        trackToAttach.mediaStreamTrack = aTrack.mediaStreamTrack;
                        trackToAttach.kind = aTrack.kind;
                        trackToAttach.isLocal = true;
                        trackToAttach.twilioReference = aTrack;
                        app.screensInterface.attachTrack(trackToAttach, localParticipant);

                        if (callback != null) callback(trackToAttach);
                    });
                } else {

                    localParticipant.audioStream = audioStream;
                    var trackToAttach = new Track();
                    trackToAttach.mediaStreamTrack = localAudioTrack;
                    trackToAttach.kind = localAudioTrack.kind;
                    trackToAttach.isLocal = true;
                    if(typeof cordova != "undefined" && _isiOS) {
                        trackToAttach.stream = audioStream;
                    }

                    app.screensInterface.attachTrack(trackToAttach, localParticipant);

                    if (callback != null) callback(audioStream);
                }
            }

            function error(err) {
                console.error(err.name + ": " + err.message);
                if (failureCallback != null) failureCallback(err);
            }

            if(typeof cordova != 'undefined' && _isiOS){

                cordova.plugins.iosrtc.getUserMedia({
                    'audio': true
                }, function (audioStream) {
                    successCallback(audioStream);
                }, function (err) {
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

        function requestAndroidMediaPermissions(constrains, callback, failureCallback) {
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

                if(constrains.audio && constrains.video) {
                    requestMicPermission(function () {
                        requestCameraPermission(function () {
                            if(callback != null) callback();
                        });
                    });
                } else if (constrains.audio) {
                    requestMicPermission(function () {
                        if(callback != null) callback();
                    });
                } else if (constrains.video) {
                    requestCameraPermission(function () {
                        if(callback != null) callback();
                    });
                }

            }
        }

        function addTrack(track, stream) {
            if(options.mode == 'twilio') {
                var participant = localParticipant.twilioInstance;
                participant.publishTrack(track).then(function (publication) {

                    var twilioTrack = publication.track;
                    var trackToAttach = new Track();
                    trackToAttach.sid = publication.trackSid;
                    trackToAttach.mediaStreamTrack = twilioTrack.mediaStreamTrack;
                    trackToAttach.kind = twilioTrack.kind;
                    trackToAttach.isLocal = true;
                    trackToAttach.twilioReference = twilioTrack;
                    if(typeof cordova != "undefined" && _isiOS) {
                        trackToAttach.stream = stream;
                    }
                    app.screensInterface.attachTrack(trackToAttach, localParticipant);
                    if(track.kind == 'video')
                        app.conferenceControl.enableVideo();
                    else {
                        app.conferenceControl.enableAudio();
                    }
                });
            } else {

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
                if(typeof cordova != "undefined" && _isiOS) {
                    trackToAttach.stream = stream;
                }
                app.screensInterface.attachTrack(trackToAttach, localParticipant);
                if(track.kind == 'video')
                    app.conferenceControl.enableVideo();
                else {
                    app.conferenceControl.enableAudio();
                }
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

        function toggleVideo() {
            if(localParticipant.videoTracks().length == 0) {
                return;
            }

            if(cameraIsDisabled){
                enableVideoTracks();
            } else {
                disableVideoTracks();
            }
        }

        function toggleAudio() {
            if(localParticipant.audioTracks().length == 0) {
                return;
            }

            if(micIsDisabled){
                enableAudioTracks();
            } else {
                disableAudioTracks();
            }
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
                log('audioOutputMode: setCurrentMode = ' + mode)

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

            if(options.mode != 'twilio') {


                for (var p in roomParticipants) {

                    if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null && roomParticipants[p].RTCPeerConnection.connectionState != 'closed') {
                        if('ontrack' in roomParticipants[p].RTCPeerConnection){
                            let sender = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (s) {
                                return s.track && s.track.kind == track.kind;
                            })[0];

                            log('replaceTrack: sender exist - ' + sender != null);
                            if(sender != null) {
                                var oldTrackid = sender.track.id;
                                sender.track.stop();

                                sender.replaceTrack(track)
                                    .then(function () {
                                        log('replaceTrack: track replaced');
                                        for (let i = localParticipant.tracks.length - 1; i >= 0; i--) {
                                            if (localParticipant.tracks[i].mediaStreamTrack.id == oldTrackid) {
                                                log('replaceTrack: deleted track removed');

                                                localParticipant.tracks.splice(i, 1);
                                            }
                                        }
                                        //if(callback != null) callback();
                                    })
                                    .catch(function (e) {
                                        console.error(e.name + ': ' + e.message);
                                    });

                            }

                        }
                    }
                }
            } else {

            }
            cameraIsDisabled = false;
            app.event.dispatch('cameraEnabled');
            app.eventBinding.sendDataTrackMessage('online', {cameraIsEnabled: true});

        }

        function enableVideoTracks() {
            log('enableVideoTracks');

            var screensharingTracksOnly = false;
            //TODO: make camera request if no video
            if(options.mode == 'twilio') {
                var twilioTracks = [];
                var existingTwilioTracks = localParticipant.twilioInstance.tracks;

                var trackExist = function (sid) {

                    for(var t in existingTwilioTracks) {

                        if(existingTwilioTracks[t].sid == sid){
                            return true;
                        }
                    }
                    return false;
                }

                var i;
                var tracksNum = localParticipant.tracks.length - 1;
                for (i = tracksNum; i >= 0; i--) {

                    if (localParticipant.tracks[i].kind == 'audio' || trackExist(localParticipant.tracks[i].sid)) continue;
                    twilioTracks.push(localParticipant.tracks[i].twilioReference);
                    localParticipant.tracks[i].enabled = true;
                }

                localParticipant.twilioInstance.publishTracks(twilioTracks);
            } else {
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
                                log('enableVideoTracks videoSenderExist', videoSenderExist);
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
            }
            cameraIsDisabled = localParticipant.tracks.filter(function (track) {
                return track.kind == 'video' && !track.screensharing
            }).length == 0;
            screensharingIsDisabled = localParticipant.tracks.filter(function (track) {
                return track.screensharing === true;
            }).length == 0;

            app.event.dispatch('cameraEnabled');
            app.eventBinding.sendDataTrackMessage('online', {cameraIsEnabled: true});

        }

        /**
         * Stops streaming video tracks/streams.
         *
         * @method tracksToDisable
         * @uses Track
         * @return {Array}
         */
        function disableVideoTracks(tracksToDisable) {
            log('disableVideoTracks', tracksToDisable);

            var screensharingTracksOnly = tracksToDisable && tracksToDisable.filter(function (track) {
                return track.screensharing === true;
            }).length == tracksToDisable.length;

            log('disableVideoTracks screensharingTracksOnly=' + screensharingTracksOnly);

            if(options.mode == 'twilio') {
                var twilioTracks = []

                var i;
                var tracksNum = localParticipant.tracks.length - 1;
                for (i = tracksNum; i >= 0; i--) {
                    if (localParticipant.tracks[i].kind == 'audio') continue;
                    twilioTracks.push(localParticipant.tracks[i].twilioReference);
                    localParticipant.tracks[i].mediaStreamTrack.stop();
                    localParticipant.tracks[i].mediaStreamTrack.enabled = false;
                    localParticipant.tracks[i].remove();
                }

                localParticipant.twilioInstance.unpublishTracks(twilioTracks);
            } else {

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
                if(_isiOS) {
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
                    app.eventBinding.sendDataTrackMessage('online', {cameraIsEnabled: false});
                    return;
                }

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

            }

            if(screensharingTracksOnly) {
                screensharingIsDisabled = true;
            } else {
                cameraIsDisabled = true;
            }
            app.eventBinding.sendDataTrackMessage('online', {cameraIsEnabled: false});
        }

        function enableAudioTracks(failureCallback) {
            log('enableAudioTracks 22');

            if(options.mode == 'twilio') {
                if(localParticipant.audioTracks().length == 0) {
                    log('enableAudioTracks: requestMicrophone')

                    app.conferenceControl.requestMicrophone(function (audioTrack) {
                        enableAudioTracks();
                        micIsDisabled = false;
                        app.eventBinding.sendDataTrackMessage('online', {micIsEnabled: true});
                        app.event.dispatch('micEnabled');
                    })
                } else {
                    var twilioTracks = []

                    var i;
                    var tracksNum = localParticipant.tracks.length;
                    for (i = tracksNum - 1; i >= 0; i--) {
                        if (localParticipant.tracks[i].kind == 'video') continue;
                        twilioTracks.push(localParticipant.tracks[i].twilioReference);
                        localParticipant.tracks[i].mediaStreamTrack.enabled = true;
                    }

                    localParticipant.twilioInstance.publishTracks(twilioTracks);

                    micIsDisabled = false;
                    app.eventBinding.sendDataTrackMessage('online', {micIsEnabled: true});
                    app.event.dispatch('micEnabled');
                }

            } else {
                var audioTracks = localParticipant.audioTracks();
                log('enableAudioTracks: tracks num = ' + audioTracks.length);


                if('ontrack' in testPeerConnection && audioTracks.length == 0) {
                    var requestMicrophoneCallback = function (audioStream) {
                        var audioTrack = audioStream.getAudioTracks()[0];
                        if (typeof cordova != 'undefined' && _isiOS) {
                            var enableAudioTrack = function (e) {
                                if (e.track.mediaStreamTrack.id == audioTrack.id) {
                                    enableAudioTracks();

                                    micIsDisabled = false;
                                    app.eventBinding.sendDataTrackMessage('online', {micIsEnabled: true});
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

                    app.conferenceControl.requestMicrophone(requestMicrophoneCallback, function (e) {
                        console.error(e.message);

                        if (failureCallback != null) failureCallback(e);
                    });

                    return;
                } else if(!('ontrack' in testPeerConnection) && 'onaddstream' in testPeerConnection && localParticipant.audioStream == null) {
                    app.conferenceControl.requestMicrophone(function (audioStream) {
                        for (let p in roomParticipants) {
                            if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null && roomParticipants[p].RTCPeerConnection.connectionState != 'closed') {
                                if('ontrack' in roomParticipants[p].RTCPeerConnection){
                                    if (audioStream != null) roomParticipants[p].RTCPeerConnection.addTrack(audioStream.getAudioTracks()[0], audioStream);
                                } else {
                                    if (audioStream != null) roomParticipants[p].RTCPeerConnection.addStream(audioStream);
                                }

                                //app.eventBinding.createOfferAndRenegotiate();
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
                app.eventBinding.sendDataTrackMessage('online', {micIsEnabled: true});
                app.event.dispatch('micEnabled');
            }
        }

        function disableAudioTracks() {
            log('disableAudioTracks')
            if(micIsDisabled) return;

            if(options.mode == 'twilio') {
                var twilioTracks = []

                var i;
                var tracksNum = localParticipant.tracks.length - 1;
                for (i = tracksNum; i != -1; i--) {

                    if (localParticipant.tracks[i].kind == 'video') continue;

                    twilioTracks.push(localParticipant.tracks[i].twilioReference);

                    if(!(_isiOS && typeof cordova == 'undefined')) {
                        localParticipant.tracks[i].mediaStreamTrack.stop();
                        localParticipant.tracks[i].mediaStreamTrack.enabled = false;

                        for(let t = localParticipant.tracks.length - 1; t != -1 ; t--){
                            if(localParticipant.tracks[t].mediaStreamTrack.id == localParticipant.tracks[i].mediaStreamTrack.id) {
                                localParticipant.tracks.splice(t, 1);
                            }
                        }
                    }
                }

                log('disableAudioTracks: unpublish ' + twilioTracks.length + ' tracks');
                localParticipant.twilioInstance.unpublishTracks(twilioTracks);
            } else {
                for (var p in roomParticipants) {

                    if (roomParticipants[p].RTCPeerConnection && 'ontrack' in roomParticipants[p].RTCPeerConnection) {
                        if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null && roomParticipants[p].RTCPeerConnection.connectionState != 'closed') {
                            var audioSenders = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (sender) {
                                return sender.track && sender.track.kind == 'audio';
                            });

                            for(var s = audioSenders.length - 1; s >= 0 ; s--){
                                if(!(_isiOS && typeof cordova == 'undefined')) {
                                    audioSenders[s].track.stop();
                                    for(let i = localParticipant.tracks.length - 1; i >= 0 ; i--){
                                        if(localParticipant.tracks[i].mediaStreamTrack.id == audioSenders[s].track.id) {
                                            localParticipant.tracks.splice(i, 1);
                                        }
                                    }
                                    roomParticipants[p].RTCPeerConnection.removeTrack(audioSenders[s]);
                                    log('disableAudioTracks: remove track from PC');

                                } else {
                                    log('disableAudioTracks: disable track');

                                    //audioSenders[s].track.enabled = false;
                                    roomParticipants[p].RTCPeerConnection.removeTrack(audioSenders[s]);
                                }



                            }
                        }
                        app.event.dispatch('micDisabled');

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

            }
            micIsDisabled = true;
            app.event.dispatch('micDisabled');
            var info = {
                micIsEnabled: false
            }
            app.eventBinding.sendDataTrackMessage('online', info);
        }

        return {
            enableVideo: enableVideoTracks,
            disableVideo: disableVideoTracks,
            replaceTrack: replaceTrack,
            enableAudio: enableAudioTracks,
            disableAudio: disableAudioTracks,
            toggleVideo: toggleVideo,
            toggleAudio: toggleAudio,
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
            audioInputDevices: getAudioDevices,
            currentCameraDevice: getCurrentCameraDevice,
            frontCameraDevice: getFrontCameraDevice,
            currentAudioDevice: getCurrentAudioDevice
        }
    }())

    var initOrConnectConversation = function (token, callback) {
        log('initOrConnectConversation');
        enableiOSDebug();
        var codecs;
        if(Q.info.isCordova)
            codecs = ['VP8', 'H264'];
        else codecs = ['H264', 'VP8'];

        function joinRoom(room, dataTrack, mediaDevicesList) {
            log('Successfully joined a Room');

            app.eventBinding.roomJoined(room, dataTrack);
            if(mediaDevicesList != null) app.conferenceControl.loadDevicesList(mediaDevicesList);

            app.event.dispatch('joined', localParticipant);
            if(callback != null) callback(app);
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            log("enumerateDevices() not supported.");

            var videoConstrains;
            if(options.video == false){
                videoConstrains = false;
            } else {
                videoConstrains = {
                    width: { min: 320, max: 1280 },
                    height: { min: 240, max: 720 }
                };
            }

            var connect = Twilio.connect;
            var dataTrack = new Twilio.LocalDataTrack();

            var twilioConnectWithNoTracks = function () {
                var tracks = [];
                tracks.push(dataTrack);
                connect(token, {
                    name:options.roomName,
                    audio:false,
                    video:false,
                    tracks:tracks,
                    preferredVideoCodecs: codecs,
                    debugLevel: 'debug'
                }).then(function(room) {
                    joinRoom(room, dataTrack);
                }, function(err) {
                    console.error(`Unable to connect to Room: ${err.message}`);
                });
            }
            if(!options.audio && !options.video){
                twilioConnectWithNoTracks();
                return;
            }

            navigator.getUserMedia ({
                'audio': options.audio,
                'video': videoConstrains
            }, function (stream) {
                var tracks = stream.getTracks();

                tracks.push(dataTrack);

                log('initOrConnectConversation: roomName/id = ' + options.roomName);

                connect(token, {
                    name:options.roomName,
                    tracks: tracks,
                    preferredVideoCodecs: codecs
                }).then(function(room) {
                    joinRoom(room, dataTrack);
                }, function(error) {
                    console.error(`Unable to connect to Room: ${error.message}`);
                });
            }, function (err) {
                console.error(err.name + ": " + err.message);
            });
            return;
        }

        navigator.mediaDevices.enumerateDevices().then(function (mediaDevicesList) {
                log('initOrConnectConversation: enumerateDevices');
                var mediaDevices = mediaDevicesList;

                var videoDevices = 0;
                var audioDevices = 0;
                for(var i in mediaDevices) {
                    if (mediaDevices[i].kind === 'videoinput' || mediaDevices[i].kind === 'video') {
                        videoDevices++;
                    } else if (mediaDevices[i].kind === 'audioinput' || mediaDevices[i].kind === 'audio') {
                        audioDevices++;
                    }
                }

                log('initOrConnectConversation: enumerateDevices: videoDevices: ' + videoDevices);
                log('initOrConnectConversation: enumerateDevices: audioDevices: ' + audioDevices);

                var videoConstrains;
                if(videoDevices == 0 && options.video == false){
                    videoConstrains = false;
                } else if(videoDevices != 0 && options.video) {
                    videoConstrains = {
                        width: { min: 320, max: 1280 },
                        height: { min: 240, max: 720 }
                    };
                }

                var dataTrack = new Twilio.LocalDataTrack();
                var connect = Twilio.connect;

                if(options.streams != null) {
                    log('initOrConnectConversation streams', (app.conferenceControl.micIsEnabled()), (app.conferenceControl.cameraIsEnabled()));

                    var tracks = [];
                    for(var t in options.streams) {
                        var mediaStreamTracks = options.streams[t].getTracks();
                        for(var s in mediaStreamTracks) {
                            if((mediaStreamTracks[s].kind == 'audio' && app.conferenceControl.micIsEnabled()) || (mediaStreamTracks[s].kind == 'video' && app.conferenceControl.cameraIsEnabled()))
                                tracks.push(mediaStreamTracks[s]);
                        }
                    }

                    tracks.push(dataTrack);
                    connect(token, {
                        name:options.roomName,
                        audio:false,
                        video:false,
                        tracks:tracks,
                        preferredVideoCodecs: codecs,
                        debugLevel: 'debug'
                    }).then(function(room) {
                        joinRoom(room, dataTrack, mediaDevicesList);
                    }, function(err) {
                        console.error(err.name + ": " + err.message);
                    });

                    return;
                }

                var twilioConnectWithNoTracks = function () {
                    log('initOrConnectConversation: connect with no tracks');
                    var tracks = [];
                    tracks.push(dataTrack);
                    connect(token, {
                        name:options.roomName,
                        audio:false,
                        video:false,
                        tracks:tracks,
                        preferredVideoCodecs: codecs,
                        debugLevel: 'debug'
                    }).then(function(room) {
                        joinRoom(room, dataTrack, mediaDevicesList);
                    }, function(err) {
                        console.error(err.name + ": " + err.message);

                    });
                }
                if((audioDevices == 0 && videoDevices == 0) || (!options.audio && !options.video)){
                    twilioConnectWithNoTracks();
                    return;
                }

                navigator.mediaDevices.getUserMedia ({
                    'audio': audioDevices != 0 && options.audio,
                    'video': videoConstrains
                }).then(function (stream) {
                    var tracks = stream.getTracks();
                    tracks.push(dataTrack);
                    var connect = Twilio.connect;
                    log('initOrConnectConversation: room name/id = ' + options.roomName);
                    navigator.mediaDevices.enumerateDevices().then(function (mediaDevicesList) {
                        connect(token, {
                            name:options.roomName,
                            tracks: tracks,
                            preferredVideoCodecs: codecs,
                            debugLevel: 'debug'
                        }).then(function(room) {
                            joinRoom(room, dataTrack, mediaDevicesList);
                        }).catch(function(err) {
                            console.error(err.name + ": " + err.message);
                        });
                    }).catch(function (e) {
                        console.error('ERROR: cannot get device info: ' + e.message);
                    });

                }).catch(function(err) {
                    console.error(err.name + ": " + err.message);
                    twilioConnectWithNoTracks();
                });


            },
            function(error){console.error("Failed to get access to local media. Error code was " + error.code);}
        );




    }


    var initOrConnectWithNodeJs = function (callback) {
        log('initOrConnectWithNodeJs');
        if(Q.info.isCordova && _isiOS) {
            initOrConnectWithNodeJsiOSCordova(callback);
            return;
        }

        function joinRoom(streams, mediaDevicesList) {
            log('initOrConnectWithNodeJs: joinRoom');
            app.eventBinding.socketRoomJoined((streams != null ? streams : []));
            if(mediaDevicesList != null) app.conferenceControl.loadDevicesList(mediaDevicesList);
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

            var videoConstrains;
            if(options.video == false){
                videoConstrains = false;
            } else {
                videoConstrains = {
                    width: { min: 320, max: 1280 },
                    height: { min: 240, max: 720 }
                };
            }

            if(options.streams != null) {
                log('initOrConnectWithNodeJs: streams passed as param');
                joinRoom(options.streams, mediaDevices);
                return;
            }

            if((audioDevices == 0 && videoDevices == 0) || (!options.audio && !options.video)){
                log('initOrConnectConversation: connect with no devices, no stream needed');
                //TODO: make screenEl if there are no devices available

                joinRoom(null, mediaDevices);
                return;
            }

            navigator.mediaDevices.getUserMedia ({
                'audio': audioDevices != 0 && options.audio,
                'video': videoConstrains
            }).then(function (stream) {
                navigator.mediaDevices.enumerateDevices().then(function (mediaDevicesList) {
                    joinRoom(stream, mediaDevicesList);
                }).catch(function (err) {
                    console.error(err.name + ": " + err.message);
                });

            }).catch(function(err) {
                console.error(err.name + ": " + err.message);
            });

        })
            .catch(function(err) {
                console.error(err.name + ": " + err.message);
            });


    }


    var initOrConnectWithNodeJsiOSCordova = function (callback) {
        log('initOrConnectWithNodeJsiOSCordova');

        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            log("enumerateDevices() not supported.");
        }

        function joinRoom(streams, mediaDevicesList) {
            app.eventBinding.socketRoomJoined((streams != null ? streams : []));
            if(mediaDevicesList != null) app.conferenceControl.loadDevicesList(mediaDevicesList);
            app.event.dispatch('joined', localParticipant);
            if(callback != null) callback(app);
        }

        cordova.plugins.iosrtc.enumerateDevices(function(mediaDevicesList){
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

            var videoConstrains;
            if(videoDevices == 0 || options.video == false){
                videoConstrains = false;
            } else if(videoDevices != 0 && options.video) {
                videoConstrains = {
                    width: { min: 320, max: 1280 },
                    height: { min: 240, max: 720 }
                };
            }

            if(audioDevices != 0 && options.audio) {
                cordova.plugins.iosrtc.getUserMedia(
                    {
                        audio: true,
                        video: false
                    },
                    function (audioStream) {
                        if(videoConstrains !== false) {
                            cordova.plugins.iosrtc.getUserMedia(
                                {
                                    audio: false,
                                    video: true
                                },
                                function (videoStream) {
                                    cordova.plugins.iosrtc.enumerateDevices(function (mediaDevicesList) {
                                        joinRoom([audioStream, videoStream], mediaDevicesList);
                                    }, function (error) {
                                        console.error(`Unable to connect to Room: ${error.message}`);
                                    });
                                },
                                function (error) {
                                    console.error('getUserMedia failed: ', error);
                                }
                            );
                        } else {
                            joinRoom([audioStream], mediaDevicesList);
                        }
                    },
                    function (error) {
                        console.error('getUserMedia failed: ', error);
                    }
                );
            } else if (videoConstrains !== false) {
                cordova.plugins.iosrtc.getUserMedia(
                    {
                        audio: false,
                        video: true
                    },
                    function (videoStream) {
                        cordova.plugins.iosrtc.enumerateDevices(function (mediaDevicesList) {
                            try {
                                joinRoom([videoStream], mediaDevicesList);
                            } catch (e) {
                                console.error(e.name + ': ' + e.message);
                            }
                        }, function (error) {
                            console.error(`Unable to connect to Room: ${error.message}`);
                        });
                    },
                    function (error) {
                        console.error('getUserMedia failed: ', error);
                    }
                );
            } else {
                cordova.plugins.iosrtc.enumerateDevices(function (mediaDevicesList) {
                    //try {
                    joinRoom((options.streams != null ? options.streams : []), mediaDevicesList);
                    //} catch (e) {
                    ////	console.error('error', e.message);
                    //}
                }, function (error) {
                    console.error(`Unable to connect to Room: ${error.message}`);
                });
            }

        }, function (e) {
            console.error(e.name + ': ' + e.message)

        });
    }

    var initWithTwilio = function(callback){
        log('initWithTwilio')

        var ua=navigator.userAgent;
        if(ua.indexOf('Android')!=-1||ua.indexOf('Windows Phone')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) {
            _isMobile=true;
            app.views.isMobile(true);
            app.views.updateOrientation();
        } else app.views.isMobile(false);

        if(ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) _isiOS = true;

        if(options.twilioAccessToken != null) {
            initOrConnectConversation(options.twilioAccessToken, callback);
            return;
        }


        /*window.addEventListener("orientationchange", function() {
			setTimeout(function () {
				if(_isMobile) app.views.updateOrientation();
			}, 1500);
		});

		window.addEventListener("resize", function() {
			setTimeout(function () {
				if(_isMobile) app.views.updateOrientation();
			}, 1500);
		});*/
    }

    if(typeof cordova != 'undefined' && (ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1)) {
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

                    if (event.candidate.candidate.indexOf("relay") < 0) {
                        //return;
                    }
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
                var stream = e.streams[0];
                var track = e.track;
                function addTrack() {
                    var trackToAttach = new Track();
                    trackToAttach.sid = track.sid;
                    trackToAttach.kind = track.kind;
                    trackToAttach.mediaStreamTrack = track;
                    trackToAttach.isLocal = true;
                    trackToAttach.stream = stream;
                    //localParticipant.videoStream = stream;

                    app.screensInterface.attachTrack(trackToAttach, localParticipant);


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

                if(_negotiating){
                    _offerQueue = function () {
                        localParticipant.iosrtcRTCPeerConnection.addStream(stream);
                    }
                } else localParticipant.iosrtcRTCPeerConnection.addStream(stream);

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

    var initWithNodeJs = function(callback){
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
                socket.emit('Streams/webrtc/joined', {username:localParticipant.identity, sid:localParticipant.sid, room:options.roomName, roomPublisher: options.roomPublisher, isiOS: _isiOS, info: _localInfo});
                localParticipant.sid = socket.id;
                return;
            }

            //enableiOSDebug();
            log('initWithNodeJs: socket: connected: ' + socket.connected + ',  app.state: ' +  app.state);
            if(localParticipant == null) {
                localParticipant = new Participant();
                localParticipant.sid = socket.id;
                localParticipant.identity = options.username;
                localParticipant.isLocal = true;
                localParticipant.online = true;
                roomParticipants.push(localParticipant);
            }

            if(typeof cordova != 'undefined' && _isiOS) {
                iosrtcLocalPeerConnection.create(function () {
                    nativeLocalWebRTCPeerConnection.create(function () {
                        iosrtcLocalPeerConnection.createOffer();
                    })
                });
            }

            if(socket.connected && app.state == 'connecting') initOrConnectWithNodeJs(callback);
        }

        var connect = function () {
            log('initWithNodeJs: connect', window.WebRTCSocket != null ? false : true);

            //let io = io('/webrtc');
            var secure = options.nodeServer.indexOf('https://') == 0;
            socket = io.connect(options.nodeServer + '/webrtc', {
                transports: ['websocket'],
               // path: options.roomName,
               'force new connection': window.WebRTCSocket != null ? false : true,
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

        log('initWithNodeJs: find socket.io');

        if(typeof options.nodeServer == 'object') {
            socket = options.nodeServer;
            onConnect();
            return;
        }

        if(findScript('socket.io.js') && typeof io != 'undefined') {
            connect();
        } else {
            log('initWithNodeJs: add socket.io');

            var url = 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.7.3/socket.io.js'
            var xhr = new XMLHttpRequest();

            xhr.open('GET', url, true);

            xhr.onload = function(e) {
                var script = e.target.response || e.target.responseText;
                if (e.target.readyState === 4) {
                    switch( e.target.status) {
                        case 200:
                            eval.apply( window, [script] );
                            connect();
                            break;
                        default:
                            console.error("ERROR: script not loaded: ", url);
                    }
                }
            }
            xhr.send();

            /*var script = document.createElement('script');
			script.onload = function () {
				requirejs(['https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.7.3/socket.io.js'], function (io) {
					window.io = io;
					connect();
				});
			};
			script.src = 'https://requirejs.org/docs/release/2.2.0/minified/require.js';

			document.head.appendChild(script);*/

        }


        /*window.addEventListener("orientationchange", function() {
			setTimeout(function () {
				if(_isMobile) app.views.updateOrientation();
			}, 1500);
		});

		window.addEventListener("resize", function() {
			setTimeout(function () {
				if(_isMobile) app.views.updateOrientation();
			}, 1500);
		});*/
    }

    app.init = function(callback){
        app.state = 'connecting';
        log('app.init')
        if(options.mode == 'twilio') {
            Twilio = window.Twilio = options.TwilioInstance;
            initWithTwilio(callback);
        } else {
            initWithNodeJs(callback);
        }
    }

    app.switchRoom = function(publisherId, streamName, callback){
        console.log('app.switchRoom')
        app.screensInterface.canvasComposer.videoComposer.switchingRoom(true);
        var currentStreams = localParticipant.tracks.map(function (track) {
            return track.stream.clone();
        })
        console.log('app.switchRoom: currentStreams', options.roomName, localParticipant.sid)
        var prevLocalParticipant = localParticipant.sid;
        var prevRoomId = options.roomName;

        var initOptions = options;
        initOptions.roomName = streamName;
        initOptions.roomPublisher = publisherId;
        initOptions.streams = currentStreams;
        let streamingParticipant = app.screensInterface.fbLive.streamingParticipant();
        initOptions.siwtchedFromRoom = {prevParticipantId: localParticipant.id, connection: app.screensInterface.fbLive.streamingParticipant().connection};
        initOptions.startWith = {
            audio:app.conferenceControl.micIsEnabled() ? true : false,
            video:app.conferenceControl.cameraIsEnabled() || app.conferenceControl.screensharingIsEnabled() ? true : false
        };

        var newConferenceInstance = window.WebRTCconferenceLib(initOptions);
        newConferenceInstance.screensInterface.canvasComposer = app.screensInterface.canvasComposer;
        newConferenceInstance.screensInterface.canvasComposer.videoComposer.refreshEventListeners(newConferenceInstance);
        //newConferenceInstance.screensInterface.canvasComposer.audioComposer.mix();
        newConferenceInstance.screensInterface.fbLive = app.screensInterface.fbLive;

        newConferenceInstance.init();

        newConferenceInstance.event.on('initNegotiationEnded', function (roomParticipants) {
            console.log('initNegotiationEnded switch', newConferenceInstance)
            let newParticipantSid = newConferenceInstance.localParticipant().sid;
            newConferenceInstance.screensInterface.canvasComposer.videoComposer.switchingRoom(false);
            newConferenceInstance.screensInterface.fbLive.switchRoom(newConferenceInstance, roomParticipants);
            //switchRoomForFbLive(newConferenceInstance);
            newConferenceInstance.roomSwitched({prevParticipantId:prevLocalParticipant, prevRoom:prevRoomId});
            app.disconnect(true);
        });

        if(callback != null) callback(newConferenceInstance);
        console.log('newConferenceInstance', newConferenceInstance)
      //  app = null;
    }

    app.roomSwitched = function(info) {
        console.log('roomSwitched', info)

        socket.emit('Streams/webrtc/roomSwitched', info);
    }

    app.disconnect = function (switchRoom) {

        if(app.checkOnlineStatusInterval != null) {
            clearInterval(app.checkOnlineStatusInterval);
            app.checkOnlineStatusInterval = null;
        }
        if(app.sendOnlineStatusInterval != null) {
            clearInterval(app.sendOnlineStatusInterval);
            app.sendOnlineStatusInterval = null;
        }

        if(!switchRoom && app.screensInterface.fbLive.isStreaming()) {
            app.screensInterface.fbLive.endStreaming();
        }

        for(var p = roomParticipants.length - 1; p >= 0; p--){
            
            if(roomParticipants[p] == app.screensInterface.fbLive.streamingParticipant()) continue;
            if(roomParticipants[p].soundMeter.script != null) roomParticipants[p].soundMeter.script.disconnect();
            if(roomParticipants[p].soundMeter.source != null) roomParticipants[p].soundMeter.source.disconnect();

            if(options.mode == 'node' && !roomParticipants[p].isLocal) {
                console.log('disconnect: close pc', roomParticipants[p].sid);
                if (roomParticipants[p].RTCPeerConnection != null) roomParticipants[p].RTCPeerConnection.close();
                if (roomParticipants[p].iosrtcRTCPeerConnection != null) roomParticipants[p].iosrtcRTCPeerConnection.close();
            }

            roomParticipants[p].remove();
        }

        app.event.destroy();

        if(socket != null) socket.disconnect();

        if(twilioRoom != null) twilioRoom.disconnect();

        app.event.dispatch('disconnected');
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