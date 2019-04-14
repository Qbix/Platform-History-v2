var PeerConnection = RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;


var WebRTCconferenceLib = function app(options){
    console.log('options', options);
    var app = {};
    var defaultOptions = {
        webrtcMode: 'twilio',
        nodeServer: 'https://www.demoproject.co.ua:8443',
        useAsLibrary: false,
    };
    options = typeof options !== 'undefined' ? Object.assign(defaultOptions, options) : defaultOptions;
    console.log('options', options);


    var webrtcMode = 'twilio';
    var Twilio;
    var mainView;
    var joinFormView;
    var participantsListView;
    var roomsMedia;

    var roomName;

    var roomScreens = [];
    app.screens = function() { return roomScreens.filter(function (screen) {
        return (screen.isActive == true);
    }); }

    var roomParticipants = [];
    app.roomParticipants = function() { return roomParticipants; }

    var localParticipant;
    app.localParticipant = function() { return localParticipant; }
    var screenTrack;

    //node.js vars
    var socket;

    var _isMobile;
    var _isiOS;
    var _debug = true;

    var pc_config = {"iceServers": [
            {
                "urls": "stun:stun.l.google.com:19302"
            },
            /* {
                 'url': 'turn:194.44.93.224:3478?transport=udp',
                 'credential': 'asdf',
                 'username': 'qbix'
             }*/
        ]};


    window.localScreens = function () {
        console.log('localParticipant.screens', localParticipant.screens, localParticipant.identity, localParticipant)
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
        switchCameras: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"   viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve">  <g>   <path fill="#FFFFFF" d="M50.037,43.904c-3.939,0-7.151,3.212-7.151,7.168c0,3.947,3.212,7.167,7.151,7.167    c3.947,0,7.152-3.22,7.152-7.167C57.189,47.116,53.984,43.904,50.037,43.904z M50.037,56.49c-2.988,0-5.402-2.431-5.402-5.417    c0-2.997,2.414-5.418,5.402-5.418c2.98,0,5.402,2.422,5.402,5.418C55.439,54.069,53.017,56.49,50.037,56.49z"/>   <path fill="#FFFFFF" d="M63.047,43.286c-0.596,0-1.084,0.487-1.084,1.091c0,0.604,0.488,1.091,1.084,1.091    c0.597,0,1.083-0.487,1.083-1.091C64.13,43.773,63.644,43.286,63.047,43.286z"/>   <path fill="#FFFFFF" d="M50,0C22.431,0,0,22.43,0,50c0,27.571,22.429,50,50,50c27.569,0,50-22.429,50-50C100,22.431,77.569,0,50,0z     M25.111,51.626c0.934-0.933,2.432-0.933,3.366,0c0.934,0.936,0.926,2.446-0.007,3.382l-6.642,6.634    c-0.448,0.451-1.058,0.703-1.692,0.703c-0.633,0-1.242-0.252-1.689-0.703l-6.639-6.634c-0.933-0.936-0.933-2.446,0-3.382    c0.934-0.933,2.365-0.931,3.299,0l2.477,2.563V50c0-17.784,14.551-32.255,32.336-32.255c1.321,0,2.427,1.071,2.427,2.389    c0,1.32-1.017,2.39-2.337,2.39C34.86,22.524,22.583,34.85,22.583,50v4.189L25.111,51.626z M33.583,59.54V43.897    c0-1.44,1.517-3.086,2.956-3.086h5.341l2.703-2.58v-0.008c1-0.518,1.5-1.412,2.258-1.412h6.502c0.711,0,1.338,0.578,1.804,1.043    l0.015,0.158c0.007,0,0.022-0.172,0.022-0.172l3.128,2.971h5.224c1.433,0,3.048,1.646,3.048,3.086V59.54    c0,1.439-1.615,3.271-3.048,3.271H36.538C35.099,62.811,33.583,60.979,33.583,59.54z M86.506,49.071    c-0.614,0-1.063-0.235-1.529-0.698l-2.395-2.56V50c0,17.787-14.631,32.255-32.419,32.255c-1.32,0-2.47-1.067-2.47-2.39    c0-1.32,1.08-2.388,2.399-2.388c15.151,0,27.489-12.329,27.489-27.478v-4.187l-2.611,2.56c-0.934,0.931-2.473,0.931-3.403,0    c-0.938-0.934-0.951-2.447-0.014-3.381l6.63-6.636c0.935-0.935,2.442-0.935,3.375,0l6.635,6.636    c0.936,0.934,0.935,2.447-0.001,3.381C87.728,48.836,87.116,49.071,86.506,49.071z"/>  </g>  </svg>',
    }

    var Participant = function () {
        this.sid = null;
        this.identity = null;
        this.tracks = [];
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
        this.removeVideoTracks = function () {
            for(var x in localParticipant.tracks) {
                if(localParticipant.tracks[x].kind == 'audio') continue;
                console.log('localParticipant.tracks', localParticipant.tracks)
                localParticipant.tracks[x].remove();
            }
        }
        this.screens = [];
        this.twilioInstance = null;
        this.RTCPeerConnection = null;
        this.stream = null;
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
            if(this.kind == 'video') this.parentScreen.videoTrack = null;

            console.log(' this.participant.tracks',  this.participant.tracks)
            var index = this.participant.tracks.map(function(e) { console.log('mediaStreamTrack.id', e.mediaStreamTrack); return e.mediaStreamTrack.id; }).indexOf(this.mediaStreamTrack.id);
            this.participant.tracks[index] = null;
            this.participant.tracks = this.participant.tracks.filter(function (obj) {
                return obj != null;
            })

            if(this.trackEl.parentNode != null) this.trackEl.parentNode.removeChild(this.trackEl);
        };
    }

    app.views = (function () {
        var _currentView;

        function createJoinFormView(onSubmitHandler) {
            joinFormView = document.createElement('DIV');
            joinFormView.id = 'join-form-view';
            var joinForm = document.createElement('FORM');
            joinForm.id = 'join-form';
            var joinFormTitle = document.createElement('H1');
            joinFormTitle.innerHTML = 'Enter your name';
            var nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.placeholder = 'Name';
            nameInput.required = true;
            var submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.innerHTML = 'Join room';

            joinForm.appendChild(joinFormTitle);
            joinForm.appendChild(nameInput);
            joinForm.appendChild(submitButton);
            joinFormView.appendChild(joinForm);
            document.body.appendChild(joinFormView);

            joinForm.addEventListener('submit', function (e) {
                e.preventDefault();
                var userName = nameInput.value;
                onSubmitHandler(userName);
            })

        }

        function createParticipantsListView() {
            participantsListView = document.createElement('DIV');
            participantsListView.className = 'app-view';
            participantsListView.id = 'participants-list-view';
            var participantsListHeader = document.createElement('DIV')
            participantsListHeader.className = 'view-header';
            var backArr = document.createElement('DIV');
            backArr.className = 'back-arrow';
            backArr.innerHTML = icons.backArrow;
            var viewTitle = document.createElement('DIV');
            viewTitle.className = 'view-title';
            var viewTitleSpan = document.createElement('SPAN');
            viewTitleSpan.innerHTML = 'Conference Participants';
            participantsListHeader.appendChild(backArr);
            viewTitle.appendChild(viewTitleSpan);
            participantsListHeader.appendChild(viewTitle);
            participantsListView.appendChild(participantsListHeader);
            document.body.appendChild(participantsListView);

            backArr.addEventListener('click', function () {
                switchTo(mainView);
            })
        }

        function createMainView() {
            mainView = document.createElement('DIV');
            mainView.id = 'main-webrtc-container';
            roomsMedia = document.createElement('DIV');
            roomsMedia.id = 'remote-media';

            mainView.appendChild(roomsMedia);
            document.body.appendChild(mainView);
        }

        function switchTo(viewEl, callbackBefore, callbackAfter) {
            if(_currentView && _currentView == viewEl) return;
            if(typeof viewEl == 'string') viewEl = document.getElementById(viewEl);
            var viewName = viewEl.id;
            if(callbackBefore != null) callbackBefore();

            viewEl.classList.add('active');

            if(_currentView) _currentView.classList.remove('active');
            _currentView = viewEl;

            if(callbackAfter != null) callbackAfter();
        }

        function isMobile(mobile) {
            if(mobile == false) {
                if(!document.documentElement.classList.contains('webrtc_tool_desktop-screen')) document.documentElement.classList.add('webrtc_tool_desktop-screen');
                return;
            }
            if(!document.documentElement.classList.contains('webrtc_tool_mobile-screen')) document.documentElement.classList.add('webrtc_tool_mobile-screen');
        }

        function updateOrientation() {
            console.log('window.innerHeight > window.innerWidth', window.innerHeight, window.innerWidth)
            if(window.innerWidth > window.innerHeight) {
                setLandscapeOrientation();
            } else setPortraitOrientation();

        }

        function setPortraitOrientation() {
            console.log('setPortraitOrientation')
            if(document.documentElement.classList.contains('webrtc_tool_landscape-screen')) document.documentElement.classList.remove('webrtc_tool_landscape-screen');
            if(!document.documentElement.classList.contains('webrtc_tool_portrait-screen')) document.documentElement.classList.add('webrtc_tool_portrait-screen');
        }

        function setLandscapeOrientation() {
            console.log('setLandscapeOrientation')
            if(document.documentElement.classList.contains('webrtc_tool_portrait-screen')) document.documentElement.classList.remove('webrtc_tool_portrait-screen');
            if(!document.documentElement.classList.contains('webrtc_tool_landscape-screen')) document.documentElement.classList.add('webrtc_tool_landscape-screen');
        }

        function setActiveView(viewEl) {
            _currentView = viewEl;
        }

        function getActiveView() {
            return _currentView;
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
            //app.views.dialogIsClosed();
        }

        return {
            createMainView: createMainView,
            createJoinFormView: createJoinFormView,
            createParticipantsListView: createParticipantsListView,
            switchTo: switchTo,
            setActiveView: setActiveView,
            getActiveView: getActiveView,
            dialogIsOpened: dialogIsOpened,
            dialogIsClosed: dialogIsClosed,
            updateOrientation: updateOrientation,
            isMobile: isMobile,
            closeAllDialogues: closeAllDialogues,
        }
    }())

    app.participantsList = (function () {
        var participantListEl;
        var listItems = [];
        var ListItem = function () {
            this.listElement = null;
            this.audioBtnEl = null;
            this.videoBtnEl = null;
            this.participant = null;
            this.isAudioMuted = null;
            this.isVideoMuted = null;
            this.toggleAudio = function () {
                if(this.participant == localParticipant) {
                    console.log('aaaaaaaaaaaaaaaa')
                    app.conferenceControl.toggleAudio();
                    return;
                }
                if(this.isAudioMuted == false || this.isAudioMuted == null)
                    this.muteAudio();
                else this.unmuteAudio();
            };
            this.toggleVideo = function () {
                if(this.participant == localParticipant) {
                    app.conferenceControl.toggleVideo();
                    return;
                }
                if(this.isVideoMuted == false || this.isVideoMuted == null)
                    this.muteVideo();
                else this.unmuteVideo();
            };
            this.muteVideo = function () {
                var participant = this.participant;

                for(var i in participant.tracks) {
                    var track = participant.tracks[i];
                    if(track.kind != 'video') continue;
                    track.trackEl.pause();
                    track.trackEl.srcObject = null;
                }
                this.videoBtnEl.innerHTML = listIcons.disabledScreen;
                this.isVideoMuted = true;
            };
            this.unmuteVideo = function () {
                var participant = this.participant;
                for(var i in participant.tracks) {
                    var track = participant.tracks[i];
                    if(track.kind != 'video') continue;
                    var stream = new MediaStream()
                    stream.addTrack(track.mediaStreamTrack)
                    track.trackEl.srcObject = stream;
                }
                this.videoBtnEl.innerHTML = listIcons.screen;
                this.isVideoMuted = false;
            };
            this.muteAudio = function () {
                var participant = this.participant;

                for(var i in participant.tracks) {
                    var track = participant.tracks[i];
                    if(track.kind == 'audio') track.trackEl.muted = true;
                }
                this.audioBtnEl.innerHTML = listIcons.disabledSpeaker;
                this.isAudioMuted = true;
            };
            this.unmuteAudio = function () {
                var participant = this.participant;
                for(var i in participant.tracks) {
                    var track = participant.tracks[i];
                    if(track.kind == 'audio') track.trackEl.muted = false;
                }
                this.audioBtnEl.innerHTML = listIcons.loudSpeaker;
                this.isAudioMuted = false;
            };
            this.remove = function () {
                if(this.listElement.parentNode != null) this.listElement.parentNode.removeChild(this.listElement);
                for(var i in listItems) {
                    if(listItems[i].participant.sid == this.participant.sid) {
                        listItems[i] = null;
                        break;
                    }
                }

                listItems = listItems.filter(function (listItem) {
                    return listItem != null;
                })

            };
        }

        var listIcons = {
            loudSpeaker: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="0 0 99.5 99.5" enable-background="new 0 0 99.5 99.5" xml:space="preserve">  <path fill="#C12337" d="M49.749,99.5C22.317,99.5,0,77.18,0,49.749C0,22.317,22.317,0,49.749,0S99.5,22.317,99.5,49.749   C99.5,77.18,77.182,99.5,49.749,99.5z"/>  <g>   <g id="Layer_2">    <path fill="#FFFFFF" d="M36.463,39.359l10.089-7.573c0.049-0.028,0.095-0.062,0.146-0.084c0.141-0.059,0.184-0.047,0.333-0.051     c0.055,0.012,0.11,0.024,0.165,0.037c0.05,0.025,0.104,0.044,0.151,0.075c0.046,0.031,0.09,0.068,0.127,0.11     c0.077,0.084,0.131,0.186,0.159,0.295c0.013,0.055,0.013,0.112,0.021,0.168v35.382c-0.019,0.148-0.01,0.191-0.082,0.326     c-0.026,0.049-0.06,0.097-0.098,0.14c-0.076,0.084-0.172,0.146-0.279,0.187c-0.053,0.018-0.109,0.029-0.165,0.034     c-0.056,0.007-0.114,0.005-0.169-0.004c-0.15-0.021-0.18-0.058-0.31-0.131l-10.089-7.571h-8.544     c-0.06-0.009-0.121-0.009-0.179-0.023c-0.058-0.016-0.114-0.039-0.166-0.067c-0.105-0.06-0.192-0.147-0.252-0.251     c-0.03-0.053-0.053-0.109-0.069-0.167c-0.015-0.058-0.016-0.118-0.023-0.179V40.047c0.007-0.06,0.008-0.121,0.023-0.178     c0.016-0.058,0.039-0.114,0.069-0.166c0.03-0.052,0.067-0.1,0.109-0.143c0.086-0.086,0.192-0.147,0.309-0.179     c0.058-0.016,0.119-0.016,0.179-0.023L36.463,39.359L36.463,39.359z"/>   </g>   <g>    <path fill="#FFFFFF" d="M56.589,61.012c-0.25,0-0.502-0.095-0.695-0.283c-0.396-0.386-0.406-1.019-0.021-1.413     c9.074-9.354,0.39-18.188,0.017-18.559c-0.396-0.389-0.396-1.022-0.009-1.415c0.392-0.392,1.024-0.393,1.414-0.005     c0.106,0.105,10.449,10.615,0.016,21.372C57.111,60.91,56.851,61.012,56.589,61.012z"/>   </g>   <g>    <path fill="#FFFFFF" d="M62.776,66.321c-0.251,0-0.502-0.094-0.694-0.282c-0.396-0.385-0.406-1.019-0.021-1.414     c14.264-14.703,0.602-28.596,0.014-29.181c-0.393-0.389-0.395-1.022-0.006-1.414c0.391-0.392,1.023-0.393,1.414-0.005     c0.158,0.157,15.637,15.888,0.014,31.991C63.298,66.218,63.039,66.321,62.776,66.321z"/>   </g>   <g>    <path fill="#FFFFFF" d="M68.638,70.759c-0.251,0-0.502-0.094-0.696-0.28c-0.396-0.386-0.405-1.019-0.021-1.414     c18.602-19.175,0.781-37.297,0.014-38.06c-0.393-0.389-0.395-1.022-0.006-1.414c0.39-0.392,1.023-0.394,1.414-0.005     c0.201,0.2,19.975,20.294,0.014,40.871C69.16,70.66,68.898,70.759,68.638,70.759z"/>   </g>  </g>  </svg>',
            disabledSpeaker: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"   viewBox="0 0 99.5 99.5" enable-background="new 0 0 99.5 99.5" xml:space="preserve">  <path fill="#8C8C8C" d="M49.749,99.5C22.317,99.5,0,77.18,0,49.749C0,22.317,22.317,0,49.749,0S99.5,22.317,99.5,49.749   C99.5,77.18,77.182,99.5,49.749,99.5z"/>  <g>   <path fill="#FFFFFF" d="M47.654,32.336c-0.008-0.056-0.008-0.113-0.021-0.168c-0.028-0.109-0.082-0.211-0.159-0.295    c-0.037-0.042-0.081-0.079-0.127-0.11c-0.047-0.031-0.101-0.05-0.151-0.075c-0.055-0.013-0.11-0.025-0.165-0.037    c-0.149,0.004-0.192-0.008-0.333,0.051c-0.051,0.022-0.097,0.056-0.146,0.084l-10.089,7.573l-8.545-0.001    c-0.06,0.007-0.121,0.007-0.179,0.023c-0.117,0.032-0.223,0.093-0.309,0.179c-0.042,0.043-0.079,0.091-0.109,0.143    c-0.03,0.052-0.053,0.108-0.069,0.166c-0.015,0.057-0.016,0.118-0.023,0.178v19.964c0.007,0.061,0.008,0.121,0.023,0.179    c0.016,0.058,0.039,0.114,0.069,0.167c0.06,0.104,0.147,0.191,0.252,0.251c0.052,0.028,0.108,0.052,0.166,0.067    c0.058,0.015,0.119,0.015,0.179,0.023h7.885l11.851-11.852V32.336z"/>   <path fill="#FFFFFF" d="M46.551,68.27c0.13,0.073,0.16,0.11,0.31,0.131c0.055,0.009,0.113,0.011,0.169,0.004    c0.056-0.005,0.112-0.017,0.165-0.034c0.107-0.041,0.203-0.103,0.279-0.187c0.038-0.043,0.072-0.091,0.098-0.14    c0.072-0.135,0.063-0.178,0.082-0.326V57.356l-6.708,6.708L46.551,68.27z"/>   <path fill="#FFFFFF" d="M55.873,59.316c-0.385,0.395-0.375,1.027,0.021,1.413c0.193,0.188,0.445,0.283,0.695,0.283    c0.262,0,0.521-0.103,0.721-0.304c5.972-6.156,5.136-12.229,3.31-16.319l-1.479,1.48C60.492,49.367,60.773,54.264,55.873,59.316z"    />   <path fill="#FFFFFF" d="M55.88,39.342c-0.361,0.367-0.371,0.937-0.05,1.329l1.386-1.385C56.824,38.964,56.249,38.974,55.88,39.342z    "/>   <path fill="#FFFFFF" d="M62.068,34.03c-0.189,0.191-0.283,0.44-0.286,0.689l0.981-0.982C62.511,33.741,62.26,33.837,62.068,34.03z"    />   <path fill="#FFFFFF" d="M62.06,64.625c-0.385,0.396-0.375,1.029,0.021,1.414c0.192,0.188,0.443,0.282,0.694,0.282    c0.263,0,0.522-0.103,0.72-0.305c10.728-11.057,6.791-21.938,3.22-27.723l-1.401,1.401C68.548,45.015,71.756,54.63,62.06,64.625z"    />   <path fill="#FFFFFF" d="M67.921,69.065c-0.385,0.396-0.375,1.028,0.021,1.414c0.194,0.187,0.445,0.28,0.696,0.28    c0.26,0,0.521-0.1,0.719-0.303c15.146-15.612,7.416-30.945,2.718-37.522l-1.388,1.388C75.15,40.513,82.071,54.48,67.921,69.065z"/>   <path fill="#FFFFFF" d="M80.402,18.845c-0.385,0-0.771,0.147-1.066,0.441L18.422,80.201c-0.589,0.59-0.589,1.543,0,2.133    c0.294,0.293,0.68,0.441,1.066,0.441c0.386,0,0.772-0.148,1.066-0.441l60.913-60.915c0.59-0.588,0.59-1.544,0-2.132    C81.175,18.992,80.789,18.845,80.402,18.845z"/>  </g>  </svg>',
            screen: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"   viewBox="0 0 99.5 99.498" enable-background="new 0 0 99.5 99.498" xml:space="preserve">  <path fill="#C12337" d="M49.749,99.498C22.317,99.498,0,77.181,0,49.749C0,22.318,22.317,0,49.749,0S99.5,22.317,99.5,49.749   C99.5,77.181,77.182,99.498,49.749,99.498z"/>  <g>   <path fill="#FFFFFF" d="M22.158,28.781c-1.204,0-2.172,0.969-2.172,2.173v35.339c0,1.204,0.969,2.173,2.172,2.173h20.857v6.674    h-2.366c-0.438,0-0.79,0.353-0.79,0.789c0,0.438,0.353,0.79,0.79,0.79h18.203c0.438,0,0.789-0.352,0.789-0.79    c0-0.438-0.353-0.789-0.789-0.789h-2.366v-6.674h20.855c1.203,0,2.173-0.969,2.173-2.173V30.954c0-1.204-0.97-2.173-2.173-2.173    H22.158z M22.751,31.47h53.997v34.081H22.751V31.47z"/>   <polygon fill="#F6F4EC" points="42.159,38.611 42.159,59.573 59.137,49.771  "/>  </g>  </svg>',
            disabledScreen: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"   viewBox="0 0 99.499 99.498" enable-background="new 0 0 99.499 99.498" xml:space="preserve">  <path fill="#8C8C8C" d="M49.749,99.498C22.317,99.498,0,77.18,0,49.749S22.317,0,49.749,0s49.75,22.317,49.75,49.749   S77.182,99.498,49.749,99.498z"/>  <g>   <path fill="#FFFFFF" d="M77,31v35H38.234l-1.984,2H43v7h-2.352c-0.438,0-0.79,0.563-0.79,1s0.353,1,0.79,1h18.203    c0.438,0,0.789-0.563,0.789-1s-0.352-1-0.789-1H56v-7h21.341C78.545,68,80,67.497,80,66.293V30.954C80,29.75,78.545,29,77.341,29    h-2.337l-2.02,2H77z"/>   <path fill="#FFFFFF" d="M23,66V31h42.244l2.146-2H22.158C20.954,29,20,29.75,20,30.954v35.339C20,67.497,20.954,68,22.158,68h6.091    l2.11-2H23z"/>   <polygon fill="#FFFFFF" points="42,54.557 51.621,44.936 42,38.611  "/>   <polygon fill="#FFFFFF" points="56.046,47.74 47.016,56.769 59.137,49.771  "/>   <path fill="#FFFFFF" d="M81.061,21.311c0.586-0.585,0.586-1.536,0-2.121C80.768,18.896,80.384,18.75,80,18.75    s-0.768,0.146-1.061,0.439L18.33,79.799c-0.586,0.586-0.586,1.535,0,2.121c0.293,0.293,0.677,0.439,1.061,0.439    s0.768-0.146,1.061-0.439L81.061,21.311z"/>  </g>  </svg>',
            locDisabledCamera: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="-0.165 -0.245 100 99.999" enable-background="new -0.165 -0.245 100 99.999"    xml:space="preserve">  <path fill="#8C8C8C" d="M49.834-0.245c-27.569,0-50,22.43-50,50c0,27.57,22.429,49.999,50,49.999c27.57,0,50-22.429,50-49.999   C99.835,22.186,77.404-0.245,49.834-0.245z M25.516,37.254h29.489L34.73,60.791h-9.214V37.254z M24.492,75.004l47.98-55.722   l3.046,2.623L27.538,77.627L24.492,75.004z M77.71,61.244l-15.599-9.006v8.553H44.016l18.096-21.006v6.309l15.599-9.006V61.244z"/>  </svg>',
            locDisabledMic: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="-0.165 -0.245 100 99.999" enable-background="new -0.165 -0.245 100 99.999"    xml:space="preserve">  <path fill="#8C8C8C" d="M49.834-0.245c-27.569,0-50,22.43-50,50c0,27.57,22.429,49.999,50,49.999c27.57,0,50-22.429,50-49.999   C99.835,22.186,77.404-0.245,49.834-0.245z M41.411,32.236c0.001-4.678,3.794-8.473,8.473-8.473c4.681,0,8.472,3.793,8.472,8.473   v0.502L41.421,52.4c-0.001-0.068-0.01-0.135-0.01-0.203V32.236z M35.376,42.216h3.379v10.177c0,0.934,0.127,1.836,0.345,2.703   l-2.616,3.037c-0.708-1.713-1.107-3.58-1.107-5.535V42.216z M64.392,52.598c0,7.357-5.51,13.551-12.818,14.408v5.436h6.783v3.381   H41.411v-3.381h6.783v-5.436c-2.8-0.328-5.331-1.443-7.394-3.105l2.317-2.688c1.875,1.441,4.217,2.309,6.767,2.309   c6.146,0,11.127-4.984,11.127-11.129V42.216h3.381V52.598z M44.954,59.078l13.403-15.56v8.677c0,4.68-3.793,8.475-8.473,8.475   C48.042,60.67,46.344,60.076,44.954,59.078z M27.421,77.139l-3.046-2.623l47.979-55.723l3.046,2.623L27.421,77.139z"/>  </svg>',
        }

        function addItem(roomParticipant) {
            console.log('roomParticipant.identity', roomParticipant.identity)
            try {
                var err = (new Error);
                console.log(err.stack);
            } catch (e) {

            }
            var isLocal = roomParticipant == localParticipant;
            var participantItem = document.createElement('LI');
            var tracksControlBtns = document.createElement('DIV');
            tracksControlBtns.className = 'tracks-control';
            var muteVideoBtn = document.createElement('DIV');
            muteVideoBtn.className = 'mute-video-btn' + (isLocal ? ' isLocal' : '');
            muteVideoBtn.innerHTML = listIcons.screen;

            var muteAudioBtn = document.createElement('DIV');
            muteAudioBtn.className = 'mute-audio-btn' + (isLocal ? ' isLocal' : '');
            muteAudioBtn.innerHTML = isLocal ? '' : listIcons.loudSpeaker;
            var participantIdentity = document.createElement('DIV');
            participantIdentity.className = 'participants-identity';
            var participantIdentityText = document.createElement('SPAN')
            participantIdentityText.innerHTML = isLocal ? roomParticipant.identity + ' <span style="font-weight: normal;font-style: italic;">(me)</span>' : roomParticipant.identity;

            participantItem.appendChild(tracksControlBtns);
            tracksControlBtns.appendChild(muteVideoBtn);
            tracksControlBtns.appendChild(muteAudioBtn);
            participantItem.appendChild(tracksControlBtns);
            participantIdentity.appendChild(participantIdentityText)
            participantItem.appendChild(participantIdentity)

            participantListEl.appendChild(participantItem);

            var listItem = new ListItem();
            listItem.participant = roomParticipant;
            listItem.listElement = participantItem;
            listItem.videoBtnEl = muteVideoBtn;
            listItem.audioBtnEl = muteAudioBtn;
            listItems.push(listItem);

            muteAudioBtn.addEventListener('click', function (e) {
                listItem.toggleAudio();
            });
            muteVideoBtn.addEventListener('click', function (e) {
                listItem.toggleVideo();
            });

        }

        function toggleLocalVideo() {
            var i, listItem;
            for (i = 0; listItem = listItems[i]; i++){
                if(listItem.participant == localParticipant) {
                    if(app.conferenceControl.cameraIsEnabled()){
                        listItem.videoBtnEl.innerHTML = icons.camera;
                        listItem.isVideoMuted = false;
                    } else {
                        listItem.videoBtnEl.innerHTML = listIcons.locDisabledCamera;
                        listItem.isVideoMuted = true;
                    }
                    break;
                }
            }
        }

        function toggleLocalAudio() {
            console.log('toggleLocalAudio')
            var i, listItem;
            for (i = 0; listItem = listItems[i]; i++){
                if(listItem.participant == localParticipant) {
                    console.log('app.conferenceControl.micIsEnabled()',app.conferenceControl.micIsEnabled())
                    if(app.conferenceControl.micIsEnabled()){
                        listItem.audioBtnEl.innerHTML = icons.microphone;
                        listItem.isAudioMuted = false;
                    } else {
                        listItem.audioBtnEl.innerHTML = listIcons.locDisabledMic;
                        listItem.isAudioMuted = true;
                    }
                    break;
                }
            }
        }

        function removeItem(participant) {
            var item = listItems.filter(function (listItem) {
                return listItem.participant.sid == participant.sid;
            })[0];
            item.remove();
        }

        function loadList() {
            // if(!_isMobile) return;
            participantListEl = document.createElement('UL');
            participantListEl.className = 'participants-list';
            addItem(localParticipant);
            for(var i in roomParticipants) {
                if(roomParticipants[i] == localParticipant) continue;
                addItem(roomParticipants[i]);
            }

            if(_isMobile && !options.useAsLibrary) participantsListView.appendChild(participantListEl);
        }

        function participantListDialog(params, callback) {
            console.log('selectCameraDialogue')
            //self.closeAllDialogues();

            var bg=document.createElement('DIV');
            bg.className = 'dialog-bg';

            var dialogCon=document.createElement('DIV');
            dialogCon.className = 'dialog-con';
            dialogCon.addEventListener('click', function (e){
                e.stopPropagation();
                //if(e.currentTarget == e.target) self.closeAllDialogues();
            });

            var dialogue=document.createElement('DIV');
            dialogue.className = 'dialog-box select-camera';

            var dialogTitle=document.createElement('H3');
            dialogTitle.innerHTML = params.title;
            dialogTitle.className = 'dialog-header';

            var dialogInner=document.createElement('DIV');
            dialogInner.className = 'dialog-inner';


            var close=document.createElement('div');
            close.className = 'close-dialog-sign';

            console.log('LOCAL PARTICIPANT', localParticipant)

            var participantsCon = document.createElement('DIV');
            participantsCon.className = 'dialog-participants-con'
            participantsCon.appendChild(participantListEl);

            var btnsGroup=document.createElement('DIV');
            btnsGroup.className = 'dialog-btns-group';
            var cancelBtn=document.createElement('BUTTON');
            cancelBtn.type='button';
            cancelBtn.className = 'button btn-gray';
            cancelBtn.innerHTML = 'Disconnect';

            close.addEventListener('click', function () {app.views.closeAllDialogues();});
            cancelBtn.addEventListener('click', function () {app.views.closeAllDialogues();window.room.disconnect();});

            dialogInner.appendChild(dialogTitle);
            dialogInner.appendChild(participantsCon);
            btnsGroup.appendChild(cancelBtn);
            dialogInner.appendChild(btnsGroup);

            dialogue.appendChild(close);
            dialogue.appendChild(dialogInner);
            dialogCon.appendChild(dialogue)
            document.body.appendChild(dialogCon);
            document.body.appendChild(bg);


            //app.views.dialogIsOpened();
        }

        function getParticipantsList() {
            if(participantListEl == null) loadList();
            return participantListEl;
        }

        return {
            loadList:loadList,
            add:addItem,
            remove:removeItem,
            getParticipantsList:getParticipantsList,
            openListInDialog:participantListDialog,
            toggleLocalAudio:toggleLocalAudio,
            toggleLocalVideo:toggleLocalVideo,
        }
    }())

    app.screensInterface = (function () {
        var viewMode;
        var activeScreen;
        var Screen = function () {
            this.sid = null;
            this.screenEl = null;
            this.videoCon = null;
            this.nameEl = null;
            this.tracks = [];
            this.isMain = null;
            this.isLocal = null;
            this.isActive = true;
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
                console.log('removeTrack', twilioTrack)

                var detachedElements = twilioTrack.detach();
                console.log('removeTrack detachedElements', detachedElements)

                for(var i in detachedElements) {

                    var detachedElement = detachedElements[i];
                    console.log('detachedElement', detachedElement)
                    if (detachedElement.parentNode != null) detachedElement.parentNode.removeChild(detachedElement);
                }


                var index = this.tracks.map(function(e) { return e.sid; }).indexOf(twilioTrack.sid);
                this.tracks[index].remove();

            }
        };

        function attachTrack(track, participant) {
            console.log('attachTrack participant', participant);

            try {
                var err = (new Error);
                console.log(err.stack);
            } catch (e) {

            }
            //console.log('attachTrack track', track, track.isStopped, track.isEnabled, track.isStarted);
            //console.log('attachTrack participant', participant.identity, participant, participant.tracks, participant.tracks.values(), participant.sid,  participant.state);

            var screenToAttach;
            var curRoomScreens = roomScreens.filter(function (obj) {
                return obj.sid == participant.sid;
            });
            console.log('attachTrack curRoomScreens', roomScreens);

            if(curRoomScreens.length == 0) {
                screenToAttach = createRoomScreen(participant);
            } else screenToAttach = curRoomScreens[0];
            track.parentScreen = screenToAttach;

            var trackEl = createTrackElement(track);
            console.log('trackEl',Object.keys(trackEl))
            if(screenToAttach.videoTrack && screenToAttach.videoTrack.parentNode) screenToAttach.videoTrack.parentNode.removeChild(screenToAttach.videoTrack);
            screenToAttach.videoCon.appendChild(trackEl);
            if(track.kind == 'video') screenToAttach.videoTrack = trackEl;
            screenToAttach.screensharing = track.screensharing == true ? true : false;

            track.participant = participant;
            track.trackEl = trackEl;

            screenToAttach.tracks.push(track);
            participant.tracks.push(track);

            if(participant == localParticipant) app.conferenceControl.updateControlBar();
            if(app.event.doesHandlerExist('trackAdded')) app.event.dispatch('trackAdded', screenToAttach);

        }

        function getScreenOfTrack(track) {
            console.log('getScreenOfTrack', track);
            for(var i in roomScreens){
                for(var x in roomScreens[i].tracks){
                    if(roomScreens[i].tracks[x].sid == track.sid) return roomScreens[i]
                }
            }
        }

        function detachTracks(tracks) {
            console.log('detachTracks', tracks);

            var screenOfTrack;
            tracks.forEach(function(track) {
                screenOfTrack = getScreenOfTrack(track);
                if(screenOfTrack !=null) screenOfTrack.removeTrack(track);

            });


            setTimeout(function () {
                if(activeScreen && screenOfTrack == activeScreen && activeScreen.videoTrack == null) {
                    for (var i in roomScreens) {
                        if (roomScreens[i].videoTrack != null) activeScreen = roomScreens[i];
                    }
                }
                generateScreensGrid()
                removeEmptyScreens()
            }, 1000)


            //removeEmptyScreens();
        }

        function createTrackElement(track) {
            //if(track.twilioReference != null) return track.twilioReference.attach();
            console.log('createTrackElement', track)
            var remoteStreamEl = document.createElement(track.kind);
            var stream = new MediaStream();
            stream.addTrack(track.mediaStreamTrack);
            console.log('createTrackElement stream', track.mediaStreamTrack.getSettings())

            remoteStreamEl.srcObject = stream;
            if(!track.isLocal || track.isLocal && track.kind == 'video') remoteStreamEl.autoplay = true;
            remoteStreamEl.playsInline = true;

            track.stream = stream;
            //remoteStream.srcObject = track.twilioReference != null ? track.twilioReference.mediaStreamTrack : track.MediaStreamTrack;
            console.log('track.width', remoteStreamEl.videoWidth, remoteStreamEl.videoHeight)
            if(track.kind == 'video') {
                remoteStreamEl.addEventListener('loadedmetadata', function (e) {
                    var videoConWidth = (track.parentScreen.videoCon.style.width).replace('px', '');
                    var videoConHeight= (track.parentScreen.videoCon.style.height).replace('px', '');
                    var currentRation = videoConWidth / videoConHeight;
                    var videoRatio = e.target.videoWidth / e.target.videoHeight;
                    if(track.screensharing == true) videoConWidth =  window.innerWidth/2;

                    console.log('videoConWidth ratio', currentRation, videoRatio, currentRation.toFixed(1) == videoRatio.toFixed(1))
                    console.log('track.parentScreen.videoTrack != oldTrack', e.target.videoWidth, track.parentScreen.videoCon.style.width, e.target.videoHeight, track.parentScreen.videoCon.style.height)
                    var shouldReset = (track.parentScreen != null && currentRation.toFixed(1) != videoRatio.toFixed(1)) || track.screensharing == true;

                    app.event.dispatch('videoTrackLoaded', {
                        screen: track.parentScreen,
                        trackEl: e.target,
	                    reset:shouldReset,
                        oldSize: {width:(videoConWidth != '' ? videoConWidth : null), height:(videoConHeight != '' ? videoConHeight : null)}
                    });
                });
            }

            return remoteStreamEl;
        }

        function removeEmptyScreens() {
            console.log('removeEmptyScreens');

            for(var i in roomScreens[i]) {
                //if(roomScreens[i].isMain) continue;
                if(roomScreens[i].tracks.length == 0) roomScreens.splice(i, 1);
            }
        }

        function detachParticipantTracks(participant) {
            var tracks = Array.from(participant.tracks.values());
            detachTracks(tracks);
        }

        function createRoomScreen(participant) {
            console.log('createParticipantScreen', participant);
            var chatParticipantEl = document.createElement('DIV');
            chatParticipantEl.className = 'chat-participant';
            chatParticipantEl.dataset.participantName = participant.sid;
            var chatParticipantVideoCon = document.createElement('DIV');
            chatParticipantVideoCon.className = 'chat-participant-video';
            var  isLocal = participant == localParticipant;
            var  isMainOfLocal = isLocal && localParticipant.screens.length == 0;
            if(isLocal && !isMainOfLocal) {
                var closeScreen = document.createElement('BUTTON');
                closeScreen.className = 'close-additional-screen';
                closeScreen.addEventListener('click', function () {
                    var track = chatParticipantVideoCon.querySelector('video');
                    track.stop();
                    track.parentNode.removeChild(track);
                })
            }
            var chatParticipantName = document.createElement('DIV');
            chatParticipantName.className = 'chat-participant-name';
            var participantNameTextCon = document.createElement("DIV");
            participantNameTextCon.className = "participant-name-text";
            var participantNameText = document.createElement("DIV");
            participantNameText.innerHTML = participant.identity;

            console.log('isLocal && _isMobile', isLocal && _isMobile, isLocal, _isMobile);

            chatParticipantEl.appendChild(chatParticipantVideoCon);
            participantNameTextCon.appendChild(participantNameText);
            chatParticipantName.appendChild(participantNameTextCon);
            if(isLocal && isMainOfLocal && _isMobile) {
                var conferenceControlBtns = app.conferenceControl.getControlBar();
                console.log('conferenceControlBtns', conferenceControlBtns)
                chatParticipantName.appendChild(conferenceControlBtns);
            }
            chatParticipantEl.appendChild(chatParticipantName);
            chatParticipantVideoCon.addEventListener('click', toggleGridMode);

            var newScreen = new Screen();
            newScreen.sid = participant.sid;
            newScreen.participant = participant;
            //newScreen.screenEl = chatParticipantEl;
            newScreen.videoCon = chatParticipantVideoCon;
            newScreen.nameEl = chatParticipantName;
            newScreen.isMain = participant.videoTracks.length < 2;
            newScreen.isLocal = isLocal;
            console.log('createParticipantScreen END')

            participant.screens.push(newScreen);
            if(participant.isLocal)
                roomScreens.push(newScreen);
            else roomScreens.unshift(newScreen);
            return newScreen;
        }

        function toggleGridMode(e) {
            if(options.useAsLibrary) return;
            console.log('makeFullScreen',  e.currentTarget);
            if(activeScreen && activeScreen.screenEl.contains(e.currentTarget)) {
                console.log('makeFullScreen all');
                viewMode = 'all';
                activeScreen = null;
                if(_isMobile) localParticipant.screens[localParticipant.screens.length-1].nameEl.appendChild(app.conferenceControl.getControlBar());
                generateScreensGrid();
                return;
            }


            activeScreen = roomScreens.filter(function (obj) {
                console.log('makeFullScreen activeScreen for', obj.screenEl);

                return obj.screenEl.contains(e.currentTarget);
            })[0];

            if(_isMobile) activeScreen.nameEl.appendChild(app.conferenceControl.getControlBar())

            console.log('makeFullScreen activeScreen', activeScreen);

            viewMode = 'mainAndThumbs';


            //fullScreenGrid()
            mainScreenAndThumbsGrid();
        }

        function removeScreensByParticipant(participant) {
            console.log('removeScreensByParticipant');

            for(var i in roomScreens) {
                if(roomScreens[i].sid != participant.sid) continue;
                var screenEl = roomScreens[i].screenEl;
                if(screenEl != null && screenEl.parentNode != null) screenEl.parentNode.removeChild(screenEl)
                roomScreens[i] = null;
            }

            roomScreens = roomScreens.filter(function (el) {
                return el != null;
            });
            console.log('removeScreensByParticipant END', roomScreens.length);

        }

        function portraitScreensGrid(num) {
            console.log('roomScreens.length', num, roomScreens.length);

            var prerenderedScreens = document.createDocumentFragment();
            num = num != null ? num : roomScreens.length;
            switch (num) {
                case 1:
                    console.log('portraitScreensGrid 1', roomScreens.length);

                    var rowDiv;
                    var x=0;
                    var i, participantScreen;
                    for(i = 0; participantScreen = roomScreens[i]; i++) {
                        rowDiv = document.createElement('DIV');
                        rowDiv.className = 'full-screen-stream';
                        rowDiv.appendChild(participantScreen.screenEl);
                        prerenderedScreens.appendChild(rowDiv);
                    }
                    roomsMedia.className = 'full-screen-grid';

                    break;
                case 2:
                    console.log('portraitScreensGrid 2', roomScreens.length);

                    var rowDiv;
                    var x=0;
                    var i, participantScreen;
                    for(i = 0; participantScreen = roomScreens[i]; i++) {
                        rowDiv = document.createElement('DIV');
                        rowDiv.className = 'full-width-row';
                        rowDiv.appendChild(participantScreen.screenEl);
                        prerenderedScreens.appendChild(rowDiv);
                    }
                    roomsMedia.className = 'two-rows-grid';

                    break;
                case 3:
                    console.log('portraitScreensGrid 3', roomScreens.length);

                    var rowDiv;
                    var x=0;
                    var i, participantScreen;
                    for(i = 0; participantScreen = roomScreens[i]; i++) {
                        if(i == 0) {
                            rowDiv = document.createElement('DIV');
                            rowDiv.className = 'full-width-row';
                            rowDiv.appendChild(participantScreen.screenEl)
                            prerenderedScreens.appendChild(rowDiv)
                        } else {
                            if(x == 0) {
                                rowDiv = document.createElement('DIV');
                                rowDiv.className = 'half-width-row';
                                prerenderedScreens.appendChild(rowDiv)
                            }
                            rowDiv.appendChild(participantScreen.screenEl)

                            if(x == 0)
                                x++;
                            else
                                x = 0;
                        }
                    }
                    roomsMedia.className = 'two-rows-grid';

                    break;
                case 4:
                    var rowDiv;
                    var perRow = 2;
                    var x = 0;
                    var i, participantScreen;
                    for(i = 0; participantScreen = roomScreens[i]; i++) {

                        if(x == 0) {
                            rowDiv = document.createElement('DIV');
                            rowDiv.className = 'half-width-row';

                        }
                        rowDiv.appendChild(participantScreen.screenEl)

                        if(x == perRow-1) {
                            prerenderedScreens.appendChild(rowDiv);
                            x = 0;
                        } else x++;


                    }
                    roomsMedia.className = 'two-rows-grid';

                    break;
                case 5:
                    var rowDiv;
                    var x=0;
                    var i, participantScreen;
                    for(i = 0; participantScreen = roomScreens[i]; i++) {

                        if(i == 2){
                            rowDiv = document.createElement('DIV');
                            rowDiv.className = 'full-width-row';
                            prerenderedScreens.appendChild(rowDiv)

                            rowDiv.appendChild(participantScreen.screenEl)
                            continue;
                        }

                        if(x == 0) {
                            rowDiv = document.createElement('DIV');
                            rowDiv.className = 'half-width-row';
                        }
                        rowDiv.appendChild(participantScreen.screenEl)

                        if(x == 1) {
                            prerenderedScreens.appendChild(rowDiv);
                            x = 0;
                        } else x++;

                    }
                    roomsMedia.className = 'three-rows-grid';

                    break;
                case 6:
                    var rowDiv;
                    var perRow = 2;
                    var x = 0;
                    var i, participantScreen;
                    for(i = 0; participantScreen = roomScreens[i]; i++) {

                        if(x == 0) {
                            rowDiv = document.createElement('DIV');
                            rowDiv.className = 'half-width-row';

                        }
                        rowDiv.appendChild(participantScreen.screenEl);

                        if(x == perRow-1) {
                            prerenderedScreens.appendChild(rowDiv);
                            x = 0;
                        } else x++;

                    }
                    roomsMedia.className = 'three-rows-grid';

                    break;
                default:
                    var rowDiv;
                    var x = 0;
                    var i = 0;

                    rowDiv = document.createElement('DIV');
                    rowDiv.className = 'main-screen-stream';
                    rowDiv.appendChild(roomScreens[0].screenEl)
                    prerenderedScreens.appendChild(rowDiv);
                    var mainScreen = rowDiv;

                    var videoThumbsCon = document.createElement('div');
                    videoThumbsCon.className = 'video-thumbs-wrapper';
                    var videoThumbs = document.createElement('div');
                    videoThumbs.className = 'video-thumbs-inner';

                    var participantScreen;
                    for(i = 1; participantScreen = roomScreens[i]; i++) {


                        rowDiv = document.createElement('DIV');
                        rowDiv.className = 'flex-row-item';

                        rowDiv.appendChild(participantScreen.screenEl)


                        videoThumbs.appendChild(rowDiv);



                    }
                    videoThumbsCon.appendChild(videoThumbs);
                    prerenderedScreens.appendChild(videoThumbsCon);
                    //roomsMedia.className = 'full-screen-grid';
                    roomsMedia.className = 'thumbs-screens-grid';

            }

            roomsMedia.innerHTML = '';
            roomsMedia.appendChild(prerenderedScreens);
        }

        function landscapeScreenGrid(num) {
            console.log('roomScreens.length', num, roomScreens.length);

            var prerenderedScreens = document.createDocumentFragment();
            num = num != null ? num : roomScreens.length;
            switch (num) {
                case 1:
                    console.log('portraitScreensGrid 1', roomScreens.length);

                    var rowDiv;
                    var x=0;
                    var i, participantScreen;
                    for(i = 0; participantScreen = roomScreens[i]; i++) {
                        rowDiv = document.createElement('DIV');
                        rowDiv.className = 'full-screen-stream';
                        rowDiv.appendChild(participantScreen.screenEl);
                        prerenderedScreens.appendChild(rowDiv);
                    }
                    roomsMedia.className = 'full-screen-grid';

                    break;
                case 2:
                    console.log('portraitScreensGrid 2', roomScreens.length);

                    var rowDiv;
                    var x=0;
                    var i, participantScreen;
                    for(i = 0; participantScreen = roomScreens[i]; i++) {
                        rowDiv = document.createElement('DIV');
                        rowDiv.className = 'full-height-col';
                        rowDiv.appendChild(participantScreen.screenEl);
                        prerenderedScreens.appendChild(rowDiv);
                    }
                    roomsMedia.className = 'two-cols-grid';

                    break;
                case 3:
                    console.log('portraitScreensGrid 3', roomScreens.length);

                    var rowDiv;
                    var x=0;
                    var i, participantScreen;
                    for(i = 0; participantScreen = roomScreens[i]; i++) {
                        if(i == 0) {
                            rowDiv = document.createElement('DIV');
                            rowDiv.className = 'full-height-col';
                            rowDiv.appendChild(participantScreen.screenEl)
                            prerenderedScreens.appendChild(rowDiv)
                        } else {
                            if(x == 0) {
                                rowDiv = document.createElement('DIV');
                                rowDiv.className = 'half-height-col';
                                prerenderedScreens.appendChild(rowDiv)
                            }
                            rowDiv.appendChild(participantScreen.screenEl)

                            if(x == 0)
                                x++;
                            else
                                x = 0;
                        }
                    }
                    roomsMedia.className = 'two-cols-grid';

                    break;
                case 4:
                    var rowDiv;
                    var perRow = 2;
                    var x = 0;
                    var i, participantScreen;
                    for(i = 0; participantScreen = roomScreens[i]; i++) {

                        if(x == 0) {
                            rowDiv = document.createElement('DIV');
                            rowDiv.className = 'half-height-col';

                        }
                        rowDiv.appendChild(participantScreen.screenEl)

                        if(x == perRow-1) {
                            prerenderedScreens.appendChild(rowDiv);
                            x = 0;
                        } else x++;


                    }
                    roomsMedia.className = 'two-cols-grid';

                    break;
                case 5:
                    var rowDiv;
                    var x=0;
                    var i, participantScreen;
                    for(i = 0; participantScreen = roomScreens[i]; i++) {

                        if(i == 2){
                            rowDiv = document.createElement('DIV');
                            rowDiv.className = 'full-height-col';
                            prerenderedScreens.appendChild(rowDiv)

                            rowDiv.appendChild(participantScreen.screenEl)
                            continue;
                        }

                        if(x == 0) {
                            rowDiv = document.createElement('DIV');
                            rowDiv.className = 'half-height-col';
                        }
                        rowDiv.appendChild(participantScreen.screenEl)

                        if(x == 1) {
                            prerenderedScreens.appendChild(rowDiv);
                            x = 0;
                        } else x++;

                    }
                    roomsMedia.className = 'three-cols-grid';

                    break;
                case 6:
                    var rowDiv;
                    var perRow = 2;
                    var x = 0;
                    var i, participantScreen;
                    for(i = 0; participantScreen = roomScreens[i]; i++) {

                        if(x == 0) {
                            rowDiv = document.createElement('DIV');
                            rowDiv.className = 'half-height-col';

                        }
                        rowDiv.appendChild(participantScreen.screenEl);

                        if(x == perRow-1) {
                            prerenderedScreens.appendChild(rowDiv);
                            x = 0;
                        } else x++;

                    }
                    roomsMedia.className = 'three-cols-grid';

                    break;
                default:
                    var rowDiv;
                    var x = 0;
                    var i = 0;

                    rowDiv = document.createElement('DIV');
                    rowDiv.className = 'main-screen-stream';
                    rowDiv.appendChild(roomScreens[0].screenEl)
                    prerenderedScreens.appendChild(rowDiv);
                    var mainScreen = rowDiv;

                    var videoThumbsCon = document.createElement('div');
                    videoThumbsCon.className = 'video-thumbs-wrapper';
                    var videoThumbs = document.createElement('div');
                    videoThumbs.className = 'video-thumbs-inner';

                    var participantScreen;
                    for(i = 1; participantScreen = roomScreens[i]; i++) {


                        rowDiv = document.createElement('DIV');
                        rowDiv.className = 'flex-row-item';

                        rowDiv.appendChild(participantScreen.screenEl)


                        videoThumbs.appendChild(rowDiv);



                    }
                    videoThumbsCon.appendChild(videoThumbs);
                    prerenderedScreens.insertBefore(videoThumbsCon, mainScreen);
                    //roomsMedia.className = 'full-screen-grid';
                    roomsMedia.className = 'thumbs-screens-grid';

            }

            roomsMedia.innerHTML = '';
            roomsMedia.appendChild(prerenderedScreens);
        }

        function desktopScreensGrid() {
            console.log('roomScreens.length', roomScreens.length);

            var prerenderedScreens = document.createDocumentFragment();
            console.log('desktopScreensGrid 1', roomScreens.length);

            var i, participantScreen;
            for(i = 0; participantScreen = roomScreens[i]; i++) {
                prerenderedScreens.appendChild(participantScreen.screenEl);
            }
            roomsMedia.className = 'desktop-screen-grid';

            roomsMedia.innerHTML = '';
            roomsMedia.appendChild(prerenderedScreens);
        }

        function fullScreenGrid() {
            var prerenderedScreens = document.createDocumentFragment();

            var rowDiv;
            var x = 0;
            var i = 0;

            rowDiv = document.createElement('DIV');
            rowDiv.className = 'full-screen-stream';
            rowDiv.appendChild(activeScreen.screenEl)
            prerenderedScreens.appendChild(rowDiv);

            var videoThumbsCon = document.createElement('div');
            videoThumbsCon.className = 'video-thumbs-wrapper';
            var videoThumbs = document.createElement('div');
            videoThumbs.className = 'video-thumbs-row';

            var participantScreen;
            for(i = 0; participantScreen = roomScreens[i]; i++) {
                if(participantScreen.screenEl == activeScreen.screenEl) continue;

                rowDiv = document.createElement('DIV');
                rowDiv.className = 'flex-row-item';

                rowDiv.appendChild(participantScreen.screenEl)


                videoThumbs.appendChild(rowDiv);

            }
            videoThumbsCon.appendChild(videoThumbs);
            prerenderedScreens.appendChild(videoThumbsCon);
            roomsMedia.className = 'full-screen-grid';
            roomsMedia.innerHTML = '';
            roomsMedia.appendChild(prerenderedScreens);
        }

        var processes = []
        var results = [];
        var stop;
        function createAnalyser(track, screen, last) {
            if(track.isLocal) return;
            //setTimeout(function(){
            console.log('setLoudestScreenAsMainScreen track', last)
            console.log('setLoudestScreenAsMainScreen track', track)
            let context = new AudioContext();
            let analyser = context.createScriptProcessor(1024, 1, 1);
            let source = context.createMediaStreamSource(track.stream);
            source.connect(analyser);
            source.connect(context.destination); // connect the source to the destination

            analyser.connect(context.destination); // chrome needs the analyser to be connected too...


            console.log('source', source)


            analyser.onaudioprocess = (function(e) {
                //////if(stop) return;
                console.log('analyser')
                // no need to get the output buffer anymore
                var int = e.inputBuffer.getChannelData(0);
                //var max = 0;
                /*for (var i = 0; i < int.length; i++) {
                    max = int[i] > max ? int[i] : max;
                }*/
                //console.log('createMediaElementSource', max);
                results.push({
                    screen:screen,
                    volume:int[0],
                });
                console.log('analyser int', int[0], track.sid)



                if(last) {
                    //stop = true;
                    var loudestScreen = results.reduce(function(prev, curr) {
                        return  curr.volume > prev.volume ? curr : prev;
                    });
                    console.log('loudestScreen',loudestScreen)
                    console.log('processes',processes)

                    activeScreen = loudestScreen.screen;

                    viewMode = 'mainAndThumbs';

                    mainScreenAndThumbsGrid();
                }

                setTimeout(function () {

                    source.disconnect();
                    analyser.disconnect();

                }, 100)

            }).bind(last);

            console.log('setLoudestScreenAsMainScreen end int', track)

            processes.push({analyser:analyser,source:source})
            //},0)
        }
        function setLoudestScreenAsMainScreen() {
            results = [];
            processes = [];
            var i, screenItem;
            for(i = 0; screenItem = roomScreens[i]; i++){
                var audioTracks = screenItem.audioTracks();
                var x, trackItem;
                for(x = 0; trackItem = audioTracks[x]; x++) {

                    console.log('latest', i, roomScreens.length-1, x, audioTracks.length-1)
                    createAnalyser(trackItem, screenItem, i == roomScreens.length-1 && x == audioTracks.length-1 )

                }
            }

            setTimeout(function () {
                //stop = true;


            }, 100)
        }

        function mainScreenAndThumbsGrid() {
            console.log('mainScreenAndThumbsGrid', activeScreen)
            var prerenderedScreens = document.createDocumentFragment();

            var rowDiv;
            var x = 0;
            var i = 0;

            rowDiv = document.createElement('DIV');
            rowDiv.className = 'main-screen-stream';
            rowDiv.appendChild(activeScreen.screenEl)
            prerenderedScreens.appendChild(rowDiv);
            var mainScreen = rowDiv;

            var videoThumbsCon = document.createElement('div');
            videoThumbsCon.className = 'video-thumbs-wrapper';
            var videoThumbs = document.createElement('div');
            videoThumbs.className = 'video-thumbs-inner';

            var participantScreen;
            for(i = 0; participantScreen = roomScreens[i]; i++) {
                if(participantScreen.screenEl == activeScreen.screenEl) continue;

                rowDiv = document.createElement('DIV');
                rowDiv.className = 'flex-row-item';

                rowDiv.appendChild(participantScreen.screenEl)


                videoThumbs.appendChild(rowDiv);



            }

            rowDiv = document.createElement('DIV');
            rowDiv.className = 'flex-row-item loudest-screen-btn-con';
            var loudestBtn = document.createElement('BUTTON');
            loudestBtn.className = 'loudest-screen-btn'
            loudestBtn.innerHTML = 'Loudest'
            rowDiv.appendChild(loudestBtn);
            loudestBtn.addEventListener('click', setLoudestScreenAsMainScreen);

            videoThumbs.insertBefore(rowDiv, videoThumbs.firstChild);

            videoThumbsCon.appendChild(videoThumbs);
            if(window.innerHeight > window.innerWidth) {
                prerenderedScreens.appendChild(videoThumbsCon);
            } else prerenderedScreens.insertBefore(videoThumbsCon, mainScreen);

            roomsMedia.className = 'thumbs-screens-grid';
            roomsMedia.innerHTML = '';
            roomsMedia.appendChild(prerenderedScreens);
        }

        function generateScreensGrid(num) {
            if(options.useAsLibrary) return;
            console.log('generateScreensGrid', roomScreens, roomParticipants)
            if(_isMobile) {
                if(viewMode == 'mainAndThumbs'){
                    mainScreenAndThumbsGrid();
                    return;
                }
                if(window.innerHeight > window.innerWidth) {
                    portraitScreensGrid(num);
                } else {
                    landscapeScreenGrid(num);
                }
                return;
            }

            if(viewMode == null || viewMode == 'all'){
                desktopScreensGrid();
            } else {
                //fullScreenGrid();
                mainScreenAndThumbsGrid();
            }

        }

        return {
            attachTrack: attachTrack,
            detachTracks: detachTracks,
            createTrackElement: createTrackElement,
            createParticipantScreen: createRoomScreen,
            removeScreensByParticipant: removeScreensByParticipant,
            generateScreensGrid: generateScreensGrid,
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
            getUserScreen().then(function (stream) {
                if(options.mode != 'twilio') {
                    var videoTrack = stream.getVideoTracks()[0];
                    console.log('getUserScreen videoTrack', videoTrack)
                    for (var p in roomParticipants) {
                        if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null) {
                            var videoSender = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (sender) {
                                return sender.track && sender.track.kind == 'video';
                            })[0];
                            console.log('roomParticipants[p].RTCPeerConnection.getSenders()', roomParticipants[p].RTCPeerConnection.getSenders());
                            console.log('roomParticipants[p].RTCPeerConnection.getSenders()2', videoSender);

                            videoSender.replaceTrack(stream.getVideoTracks()[0])
                                .then(function() {
                                    var videoSender = localParticipant.videoTracks().filter(function (sender) {
                                        return sender.track.kind == 'video';
                                    })[0];
                                    console.log("Flip! (notice change in dimensions & framerate!)")
                                })
                                .catch(function (e) {
                                    console.error(e);
                                });
                        }
                    }
                    var trackToAttach = new Track();
                    trackToAttach.sid = videoTrack.id;
                    trackToAttach.mediaStreamTrack = videoTrack;
                    trackToAttach.kind = videoTrack.kind;

                    app.screensInterface.attachTrack(trackToAttach, localParticipant);
                } else {

                    var participant = localParticipant.twilioInstance;

                    var twilioTracks = []

                    var i = localParticipant.tracks.length
                    while (i--) {
                        if (localParticipant.tracks[i].kind == 'audio') continue;
                        twilioTracks.push(localParticipant.tracks[i].twilioReference);
                        localParticipant.tracks[i].remove();
                    }
                    console.log("UNPUBLISH", twilioTracks);

                    participant.unpublishTracks(twilioTracks);

                    console.log('stream', stream)
                    screenTrack = stream.getVideoTracks()[0];
                    console.log('screenTrack', screenTrack);
                    localParticipant.twilioInstance.publishTrack(screenTrack).then(function (trackPublication) {
                        console.log('trackPublication', trackPublication)
                        var i = localParticipant.tracks.length
                        while (i--) {
                            if (localParticipant.tracks[i].kind == 'audio') continue;
                            //localParticipant.stream.removeTrack(localParticipant.tracks[i].mediaStreamTrack)
                            console.log('localParticipant.tracks[i].mediaStreamTrack)', localParticipant.tracks[i].mediaStreamTrack)
                            localParticipant.tracks[i].remove();
                        }

                        var trackToAttach = new Track();
                        trackToAttach.sid = trackPublication.track.sid;
                        trackToAttach.kind = trackPublication.track.kind;
                        trackToAttach.screensharing = true;
                        trackToAttach.mediaStreamTrack = trackPublication.track.mediaStreamTrack;
                        trackToAttach.twilioReference = trackPublication.track;

                        app.screensInterface.attachTrack(trackToAttach, localParticipant);
                        app.screensInterface.generateScreensGrid();
                        if (successCallback != null) successCallback()
                    });
                }
            }).catch(function(error) {
                if(failureCallback != null) failureCallback(error)
            });
        }

        function getUserScreen() {
            if (!canScreenShare()) {
                return;
            }

            if(navigator.getDisplayMedia || navigator.mediaDevices.getDisplayMedia) {
                console.log('getDisplayMedia');

                if(navigator.mediaDevices.getDisplayMedia) {
                    return navigator.mediaDevices.getDisplayMedia({video: true});
                }
                else if(navigator.getDisplayMedia) {
                    return navigator.getDisplayMedia({video: true})
                }
                return;
            }

            if (isChrome()) {
                console.log('extension');


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
            startShareScreen: startShareScreen
        }
    }())


    function bindTracksEvents(publication, participant) {
        console.log(`RemoteParticipant ${participant.identity} published a RemoteTrack: ${publication}`, 'background:yellow;');

        publication.on('subscribed', track => {
            console.log(`%cLocalParticipant subscribed to a RemoteTrack: ${track}`, 'background:red;');
        });

        publication.on('unsubscribed', track => {
            console.log(`%c LocalParticipant unsubscribed from a RemoteTrack: ${track}`, 'background:red;');
        });
    }

    function bindParticipantEvents(participant) {
        participant.tracks.forEach(publication => {
            bindTracksEvents(publication, participant);
        });

        participant.on('trackPublished', publication => {
            bindTracksEvents(publication, participant);
        });

        participant.on('trackUnpublished', publication => {
            console.log(`%c RemoteParticipant ${participant.identity} unpublished a RemoteTrack: ${publication}`, 'background:yellow;');
        });
    }

    app.eventBinding = (function () {
        function twilioParticipantConnected(participant) {
            console.log("Joining: '" + participant.identity + "'", participant);

            var newParticipant = new Participant();
            newParticipant.sid = participant.sid;
            newParticipant.identity = participant.identity;
            newParticipant.isLocal = false;
            newParticipant.twilioInstance = participant;

            participantConnected(newParticipant);
            log("Joining: '" + participant.identity + "'");
        }

        function participantConnected(newParticipant) {
            console.log('participantConnected', newParticipant, roomParticipants)
            roomParticipants.unshift(newParticipant);
            app.screensInterface.createParticipantScreen(newParticipant)
            app.participantsList.add(newParticipant);

            if(app.event.doesHandlerExist('participantConnected')) {
                app.event.dispatch('participantConnected', newParticipant);
                return;
            }
        }

        function trackSubscribed(track, participant) {
            console.log("trackAdded:", participant);

            var existingParticipant = roomParticipants.filter(function (roomParticipant) {
                return roomParticipant.sid == participant.sid;
            })[0];

            console.log('existingParticipant', existingParticipant)
            var trackToAttach = new Track();
            trackToAttach.sid = track.sid;
            trackToAttach.kind = track.kind;
            trackToAttach.mediaStreamTrack = track.mediaStreamTrack;
            trackToAttach.twilioReference = track;

            app.screensInterface.attachTrack(trackToAttach, existingParticipant);
            app.screensInterface.generateScreensGrid();
        }

        function trackUnsubscribed(track, participant) {
            console.log("trackUnsubscribed:", participant);

            app.screensInterface.detachTracks([track]);
            app.screensInterface.generateScreensGrid();
        }

        function trackUnpublished(track, participant) {
            console.log("trackUnpublished:", participant);

            //app.screensInterface.detachTracks([track]);
            //app.screensInterface.generateScreensGrid();
        }

        function participantDisconnected(participant) {
            console.log("participantDisconnected:", participant);

            log("Participant '" + participant.identity + "' left the room");

            app.screensInterface.removeScreensByParticipant(participant);
            app.participantsList.remove(participant);
            app.screensInterface.generateScreensGrid();

            if(app.event.doesHandlerExist('participantDisconnected')) {
                app.event.dispatch('participantDisconnected', participant);
                return;
            }
        }

        function twilioParticipantDisconnected(twilioParticipant) {
            console.log("participantDisconnected:", twilioParticipant);
            var existingParticipant = roomParticipants.filter(function (roomParticipant) {
                return roomParticipant.sid == twilioParticipant.sid;
            })[0];

            participantDisconnected(existingParticipant);
        }

        function localParticipantDisconnected() {
            console.log("localParticipantDisconnected");

            log('You left the room');

            var tracks = Array.from(room.localParticipant.tracks.values());

            tracks.forEach(function(track) {
                track.disable();
                room.localParticipant.unpublishTrack(track);
                track.stop();
            });

            app.screensInterface.detachTracks(tracks);
            app.screensInterface.removeScreensByParticipant(room.localParticipant);

            room.participants.forEach(function (participant) {
                var tracks = Array.from(participant.tracks.values());
                app.screensInterface.detachTracks(tracks);
            });

            if(!options.useAsLibrary) app.views.switchTo(joinFormView);
            app.conferenceControl.destroyControlBar();

            if(!options.useAsLibrary) roomsMedia.innerHTML = '';

            roomScreens = [];
            roomParticipants = [];

            app.event.dispatch('localParticipantDisconnected');
        }

        function roomJoined(room) {
            log("You joined the room: " + room.name);
            window.room = room;
            if(!options.useAsLibrary) {
                app.views.switchTo(mainView);
                if(!_isMobile ) {
                    app.conferenceControl.showControlBar();
                    app.conferenceControl.createSettingsPopup();
                }
            }

            if(location.hash.trim() == '') {
                if(!options.useAsLibrary) location.hash = '#' + room.name;
            }

            var participantScreen = roomScreens.filter(function (obj) {
                return obj.sid == room.localParticipant.sid;
            })[0];

            if(participantScreen == null || participantScreen.videoTrack == null || participantScreen.audioTrack == null) {
                console.log('room.localParticipant', room.localParticipant);
                //app.screensInterface.addParticipantScreen(room.localParticipant);
                localParticipant = new Participant();
                localParticipant.sid = room.localParticipant.sid,
                    localParticipant.identity = room.localParticipant.identity,
                    localParticipant.tracks = [],
                    localParticipant.isLocal = true,
                    localParticipant.twilioInstance = room.localParticipant
                console.log('room.localParticipant AFTER', localParticipant);
                console.log('roomJoined roomParticipants', roomParticipants);

                roomParticipants.push(localParticipant);

                var tracks = Array.from(room.localParticipant.tracks.values());

                for(var i in tracks) {
                    console.log('tracks aaaaaaa', tracks)
                    var trackToAttach = new Track();
                    trackToAttach.sid = tracks[i].sid;
                    trackToAttach.kind = tracks[i].kind;
                    trackToAttach.isLocal = true;
                    trackToAttach.mediaStreamTrack = tracks[i].mediaStreamTrack;
                    trackToAttach.twilioReference = tracks[i];

                    app.screensInterface.attachTrack(trackToAttach, localParticipant);
                }
            }

            // Attach the Tracks of the Room's Participants.
            room.participants.forEach(function(participant) {
                if(participant == localParticipant.twilioInstance) return;
                console.log("Already in Room: '" + participant.identity + "'");
                var remoteParticipant = new Participant();
                console.log('already in room remoteParticipant', remoteParticipant)
                remoteParticipant.sid = participant.sid;
                remoteParticipant.identity = participant.identity;
                remoteParticipant.twilioInstance = participant;
                remoteParticipant.screens = [];

                roomParticipants.unshift(remoteParticipant);

                //app.screensInterface.addParticipantScreen(participant);
                var tracks = Array.from(participant.tracks.values());
                for(var i in tracks) {
                    var trackToAttach = new Track();
                    trackToAttach.sid = tracks[i].sid;
                    trackToAttach.kind = tracks[i].kind;
                    trackToAttach.twilioReference = tracks[i];

                    app.screensInterface.attachTrack(trackToAttach, remoteParticipant);
                }
            });

            app.screensInterface.generateScreensGrid();

            //app.views.switchTo(participantsListView);
            app.participantsList.loadList();

            if(!_isMobile && !options.useAsLibrary) app.conferenceControl.createParticipantsList(app.participantsList.getParticipantsList());


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

            window.onbeforeunload = function()
            {
                window.room.disconnect();
            };

        }

        function gotIceCandidate(event){


            if (event.candidate) {
                console.log('gotIceCandidate ' + roomParticipants.length, event)
                var existingParticipant = roomParticipants.filter(function (roomParticipant) {
                    return roomParticipant.RTCPeerConnection == event.target;
                })[0];
                console.log('gotIceCandidate existingParticipant', existingParticipant)

                /*if(app.event.doesHandlerExist('candidate')) {
                    (app.event.dispatch('candidate', {
                        type: "candidate",
                        label: event.candidate.sdpMLineIndex,
                        id: event.candidate.sdpMid,
                        targetSid: existingParticipant.sid,
                        candidate: event.candidate.candidate
                    }));
                    return;
                }*/

                sendMessage({
                    type: "candidate",
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    targetSid: existingParticipant.sid,
                    candidate: event.candidate.candidate
                });
            }
        }

        function rawTrackSubscribed(event){
            console.log("%c rawTrackSubscribed:", 'background:orange;color:white;', event);

            var existingParticipant = roomParticipants.filter(function (roomParticipant) {
                return roomParticipant.RTCPeerConnection == event.target;
            })[0];
            console.log('existingParticipant', existingParticipant)

            var track = event.track;
            var trackToAttach = new Track();
            trackToAttach.sid = track.sid;
            trackToAttach.kind = track.kind;
            trackToAttach.mediaStreamTrack = track;

            app.screensInterface.attachTrack(trackToAttach, existingParticipant);
            app.screensInterface.generateScreensGrid();
        }

        function socketEventBinding() {
            socket.on('participantConnected', function (participant){
                socketParticipantConnected(participant, function (localDescription) {
                    sendMessage({
                        name: localParticipant.identity,
                        targetSid: participant.sid,
                        type: "offer",
                        sdp: localDescription
                    });
                });
            });

            socket.on('participantDisconnected', function (sid){
                console.log('participantDisconnected');
                var existingParticipant = roomParticipants.filter(function (roomParticipant) {
                    return roomParticipant.sid == sid;
                })[0];
                console.log('participantDisconnected', existingParticipant);

                if(existingParticipant != null) participantDisconnected(existingParticipant)
            });

            socket.on('signalling', function (message){
                console.log('signalling message', message)
                if (message.type === 'participantConnected') {
                    //socketParticipantConnected(sid, message);
                }
                if (message.type === 'offer') {
                    offerReceived(message, function (localDescription) {
                        sendMessage({
                            name: localParticipant.identity,
                            targetSid: message.fromSid,
                            type: "answer",
                            sdp: localDescription
                        });
                    });
                }
                else if (message.type === 'answer') {
                    answerRecieved(message);
                }
                else if (message.type === 'candidate') {
                    iceConfigurationReceived(message)
                }
            });

            window.onbeforeunload = function()
            {
                for(var p in roomParticipants) {
                    roomParticipants[p].RTCPeerConnection.close()
                }
                console.log('DISCONNECT')

                socket.emit('disconnect');
            };
        }

        function socketParticipantConnected(participant, callback) {
            console.log('socketParticipantConnected ' + participant.sid)
            var newParticipant = new Participant();
            newParticipant.sid = participant.sid;
            newParticipant.identity = participant.username;

            var newPeerConnection = new PeerConnection(pc_config);
            newParticipant.RTCPeerConnection = newPeerConnection;
            newPeerConnection.addStream(localParticipant.stream);
            newPeerConnection.onicecandidate = gotIceCandidate;
            newPeerConnection.ontrack = rawTrackSubscribed;

            newPeerConnection.createOffer({ 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true })
                .then(function(offer) {
                    console.log('newPeerConnection.setLocalDescription')

                    return newPeerConnection.setLocalDescription(offer);
                })
                .then(function () {
                    console.log('newPeerConnection.sendMessage')

                    callback(newPeerConnection.localDescription)
                })
                .catch(function(error) {
                    console.error(error)
                });

            participantConnected(newParticipant);
            log("Joining: " + newParticipant.identity);
            return newParticipant;
        }

        function offerReceived(message, callback) {
            console.log('offerReceived', message, roomParticipants);
            var senderParticipant = roomParticipants.filter(function (localParticipant) {
                return localParticipant.sid == message.fromSid;
            })[0];
            console.log('offerReceived senderParticipant', message, roomParticipants);

            if(senderParticipant == null && senderParticipant != localParticipant) {
                var newPeerConnection = new PeerConnection(pc_config);
                newPeerConnection.addStream(localParticipant.stream);
                newPeerConnection.onicecandidate = gotIceCandidate;
                newPeerConnection.ontrack = rawTrackSubscribed;

                senderParticipant = new Participant();
                senderParticipant.sid = message.fromSid;
                senderParticipant.identity = message.name;
                senderParticipant.RTCPeerConnection = newPeerConnection;
                participantConnected(senderParticipant);
            }

            senderParticipant.RTCPeerConnection.setRemoteDescription(message.sdp);

            senderParticipant.RTCPeerConnection.createAnswer({ 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true })
                .then(function(offer) {
                    return senderParticipant.RTCPeerConnection.setLocalDescription(offer);
                })
                .then(function () {
                    callback(senderParticipant.RTCPeerConnection.localDescription)
                })
                .catch(function(error) {
                    console.error(error)
                });
        }

        function answerRecieved(message) {
            console.log('answerRecieved', message);
            var senderParticipant = roomParticipants.filter(function (localParticipant) {
                return localParticipant.sid == message.fromSid;
            })[0];
            senderParticipant.identity = message.name;
            senderParticipant.RTCPeerConnection.setRemoteDescription(message.sdp);
        }

        function iceConfigurationReceived(message) {
            console.log('iceConfigurationReceived', message);
            var senderParticipant = roomParticipants.filter(function (localParticipant) {
                return localParticipant.sid == message.fromSid;
            })[0];
            var candidate = new IceCandidate({sdpMLineIndex: message.label, candidate: message.candidate});
            senderParticipant.RTCPeerConnection.addIceCandidate(candidate);
        }

        function socketRoomJoined(stream) {
            console.log('socketRoomJoined stream', stream)
            localParticipant.sid = stream.id;
            localParticipant.stream = stream;

            /* if(options.useAsLibrary) {
                 app.views.switchTo(mainView);
                 if(!_isMobile) app.conferenceControl.showControlBar();
             }*/

            //if(!_isMobile) app.conferenceControl.createSettingsPopup();

            log("You joined the room");



            var localTracks = stream.getTracks();

            for(var i in localTracks) {
                console.log('tracks aaaaaaa', localTracks)
                var trackToAttach = new Track();
                trackToAttach.sid = localTracks[i].id;
                trackToAttach.kind = localTracks[i].kind
                trackToAttach.isLocal = true;
                trackToAttach.mediaStreamTrack = localTracks[i];

                app.screensInterface.attachTrack(trackToAttach, localParticipant);
            }

            app.eventBinding.socketEventBinding();
            socket.emit('joined', {username:localParticipant.identity, sid:socket.id, room:options.roomName});
            if(!options.useAsLibrary) {
                app.screensInterface.generateScreensGrid();
            }

            app.participantsList.loadList();
            if(!_isMobile && !options.useAsLibrary) app.conferenceControl.createParticipantsList(app.participantsList.getParticipantsList());

        }

        function streamsRoomJoined(stream) {
            console.log('streamsRoomJoined stream', stream)
            //localParticipant.sid = stream.id;
            //localParticipant.stream = stream;

            //if(!_isMobile) app.conferenceControl.showControlBar();

            app.conferenceControl.loadDevicesList(function () {
                //if(!_isMobile) app.conferenceControl.createSettingsPopup();
            });

            log("You joined the room: " + roomName);



            var localTracks = stream.getTracks();

            for(var i in localTracks) {
                console.log('tracks aaaaaaa', localTracks)
                var trackToAttach = new Track();
                trackToAttach.sid = localTracks[i].id;
                trackToAttach.kind = localTracks[i].kind
                trackToAttach.isLocal = true;
                trackToAttach.mediaStreamTrack = localTracks[i];

                app.screensInterface.attachTrack(trackToAttach, localParticipant);
            }

            app.participantsList.loadList();
            //if(!_isMobile) app.conferenceControl.createParticipantsList(app.participantsList.getParticipantsList());

        }

        return {
            roomJoined: roomJoined,
            socketRoomJoined: socketRoomJoined,
            streamsRoomJoined: streamsRoomJoined,
            socketEventBinding: socketEventBinding,
            offerReceived: offerReceived,
            answerRecieved: answerRecieved,
            iceConfigurationReceived: iceConfigurationReceived,
            socketParticipantConnected: socketParticipantConnected,
        }
    }())


    function sendMessage(message){
        console.log('sendMessage', message)
        socket.emit('signalling', message);
    }
    app.conferenceControl = (function () {
        var controlBar;
        var dropdownMenu;
        var cameraBtn;
        var cameraSwitcherBtn;
        var speakerBtn;
        var microphoneBtn;
        var usersBtn;

        var cameraIsDisabled = false;
        var micIsDisabled = false;
        var speakerIsDisabled = false;

        var mediaDevices;
        var audioInputDevices = [];
        var videoInputDevices = [];
        var currentCameraDevice;
        var currentAudioDevice;
        var frontCameraDevice;

        var hoverTimeout = {setttingsPopup:null, participantsPopup:null};

        function loadDevicesList(mediaDevices) {
            var i, device;
            for(i = 0; device = mediaDevices[i]; i++){
                console.log('loadDevicesList', device);
                if (device.kind === 'videoinput') {
                    videoInputDevices.push(device);
                    for(var x in localParticipant.tracks) {
                        var mediaStreamTrack = localParticipant.tracks[x].mediaStreamTrack;
                        console.log('loadDevicesList2',localParticipant.tracks[x]);

                        if(mediaStreamTrack.enabled == true && (mediaStreamTrack.getSettings().deviceId == device.deviceId || mediaStreamTrack.getSettings().label == device.label)) {
	                        frontCameraDevice = currentCameraDevice = device;
                        }
                    }
                }
                if (device.kind === 'audioinput') {
                    audioInputDevices.push(device);
                    for(var x in localParticipant.tracks) {
                        var mediaStreamTrack = localParticipant.tracks[x].mediaStreamTrack;
                        if(mediaStreamTrack.enabled == true && (mediaStreamTrack.getSettings().deviceId == device.deviceId || mediaStreamTrack.getSettings().label == device.label)) {
                            currentAudioDevice = device;
                        }
                    }
                }
            }
            console.log('currentCameraDevice', currentCameraDevice)
            if(currentCameraDevice == null) cameraIsDisabled = true;
            if(currentAudioDevice == null) micIsDisabled = true;
            //updateControlBar();
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

        function createControlBar() {
            controlBar = document.createElement('DIV');
            controlBar.className = 'conference-control';
            var controlBarCon = document.createElement('DIV');
            controlBarCon.className = 'conference-control-inner';
            var cameraBtnCon = document.createElement('DIV');
            cameraBtnCon.className = 'camera-control';
            cameraBtn = document.createElement('DIV');
            cameraBtn.className = 'camera-control-btn';
            cameraBtn.innerHTML = icons.disabledCamera;
            cameraSwitcherBtn = document.createElement('DIV');
            cameraSwitcherBtn.className = 'camera-switcher';
            cameraSwitcherBtn.innerHTML = icons.switchCameras;
            speakerBtn = document.createElement('DIV');
            speakerBtn.className = 'speaker-control';
            speakerBtn.innerHTML = icons.enabledSpeaker;
            microphoneBtn = document.createElement('DIV');
            microphoneBtn.className = 'microphone-control';
            microphoneBtn.innerHTML = icons.microphone;
            usersBtn = document.createElement('DIV');
            usersBtn.className = 'manage-users-btn';
            var usersBtnIcon = document.createElement('DIV');
            usersBtnIcon.innerHTML = icons.user;

            if(!_isMobile) {
                var screenSharingBtn = document.createElement('DIV');
                screenSharingBtn.className = 'screen-sharing-btn';
                screenSharingBtn.innerHTML = icons.screen;
            }

            cameraBtnCon.appendChild(cameraBtn);
            controlBarCon.appendChild(cameraBtnCon);
            controlBarCon.appendChild(cameraSwitcherBtn);
            controlBarCon.appendChild(speakerBtn);
            controlBarCon.appendChild(microphoneBtn);
            usersBtn.appendChild(usersBtnIcon);
            controlBarCon.appendChild(usersBtn);
            if(!_isMobile) {
                controlBarCon.appendChild(screenSharingBtn);
            }
            controlBar.appendChild(controlBarCon);

            if(_isMobile) cameraBtn.addEventListener('mouseup', toggleVideo)
            cameraSwitcherBtn.addEventListener('mouseup', toggleCameras)
            speakerBtn.addEventListener('mouseup', toggleAudioOfAll)
            microphoneBtn.addEventListener('mouseup', toggleAudio)
            usersBtn.addEventListener('click', function () {
                if(_isMobile && !options.useAsLibrary)
                    app.views.switchTo(participantsListView);
                //else app.participantsList.openListInDialog({title:'Participants'});
            });
            cameraBtnCon.addEventListener('mouseenter', function (e) {
                if(hoverTimeout.setttingsPopup != null) {
                    clearTimeout(hoverTimeout.setttingsPopup);
                    hoverTimeout.setttingsPopup = null;
                }
                cameraBtnCon.classList.add('hover');
            });
            cameraBtnCon.addEventListener('mouseleave', function (e) {
                if(e.target == e.currentTarget || e.currentTarget.contains(e.eventTarget)) {
                    e.stopPropagation();
                    e.preventDefault();
                }
                hoverTimeout.setttingsPopup = setTimeout(function () {
                    cameraBtnCon.classList.remove('hover');
                }, 300)
            });

            if(!_isMobile) {
                screenSharingBtn.addEventListener('click', function (e) {
                    app.screenSharing.getUserScreen().then(function (stream) {
                        console.log('stream', stream)
                        screenTrack = stream.getVideoTracks()[0];
                        console.log('screenTrack', screenTrack)
                        localParticipant.twilioInstance.publishTrack(screenTrack).then(function(trackPublication) {
                            console.log('trackPublication', trackPublication)
                            var trackToAttach = new Track();
                            trackToAttach.sid = trackPublication.track.sid;
                            trackToAttach.kind = trackPublication.track.kind;
                            trackToAttach.mediaStreamTrack = trackPublication.mediaStreamTrack;
                            trackToAttach.twilioReference = trackPublication.track;

                            app.screensInterface.attachTrack(trackToAttach, localParticipant);
                            app.screensInterface.generateScreensGrid();
                        });

                    })
                })
            }

            return controlBar;
        }

        function updateControlBar() {
            if(controlBar == null) return;
            if(cameraIsDisabled || (mediaDevices != null && (localParticipant.videoTracks().length == 0 || videoInputDevices.length == 0))) {
                cameraBtn.innerHTML = icons.disabledCamera;
                cameraIsDisabled = true;
            } else if(!cameraIsDisabled && localParticipant.videoTracks().length != 0) {
                cameraBtn.innerHTML = icons.camera;
                cameraIsDisabled = false;
            }

            if(cameraIsDisabled || (mediaDevices != null && videoInputDevices.length < 2)) {
                cameraSwitcherBtn.classList.add('hidden')
            } else if(mediaDevices != null && videoInputDevices.length > 1) {
                cameraSwitcherBtn.classList.remove('hidden')
                cameraSwitcherBtn.innerHTML = icons.switchCameras;
            }

            if (cameraIsDisabled) {
                speakerBtn.classList.remove('hidden');
                speakerBtn.innerHTML = speakerIsDisabled ? icons.disabledSpeaker : icons.enabledSpeaker;
            } else {
                speakerBtn.classList.add('hidden');
            }

            if(micIsDisabled || (mediaDevices != null && (localParticipant.audioTracks().length == 0 || audioInputDevices.length == 0))) {
                console.log('updateControlBar 1' + audioInputDevices.length);
                microphoneBtn.innerHTML = icons.disabledMicrophone;
                micIsDisabled = true;
            } else if(!micIsDisabled && localParticipant.audioTracks().length != 0) {
                console.log('updateControlBar 2', micIsDisabled);

                microphoneBtn.innerHTML = icons.microphone;
                micIsDisabled = false;
            }
        }

        function createParticipantsList() {
            var participantsListEl = document.createElement('DIV');
            participantsListEl.className = 'popup-participants-list popup-box';
            participantsListEl.appendChild(app.participantsList.getParticipantsList())

            usersBtn.appendChild(participantsListEl);
            usersBtn.addEventListener('mouseenter', function (e) {
                if(hoverTimeout.participantsPopup != null) {
                    clearTimeout(hoverTimeout.participantsPopup);
                    hoverTimeout.participantsPopup = null;
                }
                usersBtn.classList.add('hover');
            });
            usersBtn.addEventListener('mouseleave', function (e) {
                console.log('usersBtn mouseleave', e.target)
                hoverTimeout.participantsPopup = setTimeout(function () {
                    usersBtn.classList.remove('hover');
                }, 300)
            });

            participantsListEl.addEventListener('mouseenter', function (e) {
                if(hoverTimeout.participantsPopup != null) {
                    clearTimeout(hoverTimeout.participantsPopup);
                    hoverTimeout.participantsPopup = null;
                }
            })
            participantsListEl.addEventListener('mouseleave', function (e) {
                setTimeout(function () {
                    usersBtn.classList.remove('hover');
                }, 300)

            });
        }

        var settingsPopup;
        function createSettingsPopup() {
            settingsPopup=document.createElement('DIV');
            settingsPopup.className = 'popup-settings popup-box';

            var chooseCameraList = document.createElement('DIV');
            chooseCameraList.className = 'choose-device'
            var title = document.createElement('H4');
            title.innerHTML = 'Select available camera';
            chooseCameraList.appendChild(title);
            var count = 1;
            mediaDevices.forEach(function(mediaDevice){
                if (mediaDevice.kind === 'videoinput') {
                    console.log('mediaDevice', mediaDevice)
                    var radioBtnItem = document.createElement('LABEL');
                    var radioBtn= document.createElement('INPUT');
                    radioBtn.name = 'cameras';
                    radioBtn.type = 'radio';
                    radioBtn.value = mediaDevice.deviceId;
                    for(var i in localParticipant.tracks) {
                        console.log('localParticipant.tracks[i]', localParticipant.tracks[i]);
                        if(localParticipant.tracks[i].mediaStreamTrack.enabled == true && localParticipant.tracks[i].mediaStreamTrack.getSettings().deviceId == mediaDevice.deviceId) {
                            radioBtn.disabled = true;
                            radioBtn.selected = true;
                            radioBtnItem.classList.add('disabled-radio');

                        }
                    }
                    var textLabel = document.createTextNode(mediaDevice.label || `Camera ${count  }`);
                    radioBtnItem.appendChild(radioBtn);
                    radioBtnItem.appendChild(textLabel);
                    chooseCameraList.appendChild(radioBtnItem);
                }
            });

            var btnsGroup=document.createElement('DIV');
            btnsGroup.className = 'dialog-btns-group'
            var confirmBtn=document.createElement('BUTTON');
            confirmBtn.type='submit';
            confirmBtn.className = 'button btn-blue';
            confirmBtn.innerHTML = 'Apply';
            if(videoInputDevices.length < 2) confirmBtn.disabled = true;

            confirmBtn.addEventListener('click', function (e) {
                callback(document.querySelector('input[name="cameras"]:checked').value);
            });

            settingsPopup.appendChild(chooseCameraList);
            btnsGroup.appendChild(confirmBtn);
            settingsPopup.appendChild(btnsGroup);

            cameraBtn.parentNode.appendChild(settingsPopup);
            //selectCameraDialogue({title:'asdfasdf'})
        }
        function showSettingsPopup() {
            if(settingsPopup == null) createSettingsPopup();
        }

        function selectCameraDialogue(params, callback) {
            console.log('selectCameraDialogue')
            //self.closeAllDialogues();

            var bg=document.createElement('DIV');
            bg.className = 'dialog-bg';

            var dialogCon=document.createElement('DIV');
            dialogCon.className = 'dialog-con';
            dialogCon.addEventListener('click', function (e){
                e.stopPropagation();
                //if(e.currentTarget == e.target) self.closeAllDialogues();
            });

            var dialogue=document.createElement('DIV');
            dialogue.className = 'dialog-box select-camera';

            var dialogTitle=document.createElement('H3');
            dialogTitle.innerHTML = params.title;
            dialogTitle.className = 'dialog-header';

            var dialogInner=document.createElement('DIV');
            dialogInner.className = 'dialog-inner';


            var close=document.createElement('div');
            close.className = 'close-dialog-sign';

            console.log('LOCAL PARTICIPANT', localParticipant)

            var chooseCameraList = document.createElement('DIV');
            chooseCameraList.className = 'choose-device'
            var title = document.createElement('H4');
            title.innerHTML = 'Select available camera';
            chooseCameraList.appendChild(title);
            var count = 1;
            mediaDevices.forEach(function(mediaDevice){
                if (mediaDevice.kind === 'videoinput') {
                    console.log('mediaDevice', mediaDevice)
                    var radioBtnItem = document.createElement('LABEL');
                    var radioBtn= document.createElement('INPUT');
                    radioBtn.name = 'cameras';
                    radioBtn.type = 'radio';
                    radioBtn.value = mediaDevice.deviceId;
                    for(var i in localParticipant.tracks) {
                        console.log('localParticipant.tracks[i]', localParticipant.tracks[i]);
                        if(localParticipant.tracks[i].mediaStreamTrack.enabled == true && localParticipant.tracks[i].mediaStreamTrack.getSettings().deviceId == mediaDevice.deviceId) {
                            radioBtn.disabled = true;
                            radioBtn.selected = true;
                            radioBtnItem.classList.add('disabled-radio');

                        }
                    }
                    var textLabel = document.createTextNode(mediaDevice.label || `Camera ${count  }`);
                    radioBtnItem.appendChild(radioBtn);
                    radioBtnItem.appendChild(textLabel);
                    chooseCameraList.appendChild(radioBtnItem);
                }
            });

            var btnsGroup=document.createElement('DIV');
            btnsGroup.className = 'dialog-btns-group'
            var confirmBtn=document.createElement('BUTTON');
            confirmBtn.type='submit';
            confirmBtn.className = 'button btn-blue';
            confirmBtn.innerHTML = 'Apply';

            var cancelBtn=document.createElement('BUTTON');
            cancelBtn.type='button';
            cancelBtn.className = 'button btn-gray';
            cancelBtn.innerHTML = 'Cancel';

            close.addEventListener('click', function () {app.views.closeAllDialogues();});
            cancelBtn.addEventListener('click', function () {app.views.closeAllDialogues();});

            confirmBtn.addEventListener('click', function (e) {
                callback(document.querySelector('input[name="cameras"]:checked').value);
            });

            dialogInner.appendChild(dialogTitle);
            dialogInner.appendChild(chooseCameraList);
            btnsGroup.appendChild(confirmBtn);
            btnsGroup.appendChild(cancelBtn);
            dialogInner.appendChild(btnsGroup);

            dialogue.appendChild(close);
            dialogue.appendChild(dialogInner);
            dialogCon.appendChild(dialogue)
            document.body.appendChild(dialogCon);
            document.body.appendChild(bg);


            //app.views.dialogIsOpened();
        }

        function showControlBar() {
            createControlBar();
            mainView.insertBefore(controlBar, mainView.firstChild);

        }

        function toggleCameras(cameraId, callback) {
            var i, device, deviceToSwitch;

            console.log('deviceToSwitch', deviceToSwitch)
            for(i = 0; device = videoInputDevices[i]; i++){

                if(device == currentCameraDevice) {
                    if(i != videoInputDevices.length-1){
                        deviceToSwitch = videoInputDevices[i+1];
                    } else deviceToSwitch = videoInputDevices[0];
                    break;
                }
            };
            console.log('deviceToSwitch', deviceToSwitch)

            if(options.mode != 'twilio') {
                navigator.getUserMedia({
                        'audio': true,
                        'video': {deviceId: {exact: cameraId != null ? cameraId : deviceToSwitch.deviceId}}
                    },
                    function (stream) {

                        var videoTrack = stream.getVideoTracks()[0];
                        for (var p in roomParticipants) {
                            if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null) {

                                var videoSender = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (sender) {
                                    return sender.track.kind == 'video';
                                })[0];
                                console.log('roomParticipants[p].RTCPeerConnection.getSenders()', roomParticipants[p].RTCPeerConnection.getSenders());
                                console.log('roomParticipants[p].RTCPeerConnection.getSenders()2', videoSender);

                                videoSender.replaceTrack(stream.getVideoTracks()[0])
                                    .then(function() {
                                        var videoSender = localParticipant.videoTracks().filter(function (sender) {
                                            return sender.track && sender.track.kind == 'video';
                                        })[0];
                                        if(callback != null) callback();
                                        console.log("Flip! (notice change in dimensions & framerate!)")
                                    })
                                    .catch(function (e) {
                                        console.error(e);
                                    });
                            }
                        }



                        var trackToAttach = new Track();
                        trackToAttach.sid = videoTrack.id;
                        trackToAttach.mediaStreamTrack = videoTrack;
                        trackToAttach.kind = videoTrack.kind;

                        app.screensInterface.attachTrack(trackToAttach, localParticipant);


                        //localParticipant.RTCPeerConnection.addTrack(videoTracks[v]);



                        app.screensInterface.generateScreensGrid();
                        app.conferenceControl.enableVideo();

                    },
                    function (error) {
                        console.log("Failed to get access to local media. Error code was " + error.code);
                    }
                );
                return;
            }

            Twilio.createLocalVideoTrack({
                deviceId: { exact: cameraId != null ? cameraId : deviceToSwitch.deviceId }
            }).then(function(localVideoTrack) {
                var participant = localParticipant.twilioInstance;


                var twilioTracks = []

                var i = localParticipant.tracks.length
                while (i--) {
                    if (localParticipant.tracks[i].kind == 'audio') continue;
                    twilioTracks.push(localParticipant.tracks[i].twilioReference);
                    localParticipant.tracks[i].remove();
                }
                console.log("UNPUBLISH", twilioTracks);

                participant.unpublishTracks(twilioTracks);

                participant.publishTrack(localVideoTrack);
                var trackToAttach = new Track();
                trackToAttach.sid = localVideoTrack.sid;
                trackToAttach.mediaStreamTrack = localVideoTrack.mediaStreamTrack;
                trackToAttach.kind = localVideoTrack.kind;
                trackToAttach.twilioReference = localVideoTrack;

                app.screensInterface.attachTrack(trackToAttach, localParticipant);
                app.screensInterface.generateScreensGrid();
                app.conferenceControl.enableVideo();
                app.views.closeAllDialogues();
                console.log('togglecameras', deviceToSwitch == frontCameraDevice)

                currentCameraDevice = deviceToSwitch;
                if(callback != null) callback();
            });
        }

        function switchSpeaker(state) {
            var i, participant;
            for(i = 0; participant = roomParticipants[i]; i++) {
                if(participant.isLocal) continue;
                for (var x in participant.tracks) {
                    var track = participant.tracks[x];
                    if (track.kind == 'audio') {
                        console.log('toggleAudioOfAll', state)
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
            speakerBtn.innerHTML = speakerIsDisabled ? icons.disabledSpeaker : icons.enabledSpeaker;
        }

        function toggleVideo() {
            if(localParticipant.videoTracks().length == 0) {
                log('No video input devices detected');
                return;
            }

            if(cameraIsDisabled){
                enableVideoTracks();
                cameraBtn.innerHTML = icons.camera;
            } else {
                disableVideoTracks();
                cameraBtn.innerHTML = icons.disabledCamera;
            }

            app.participantsList.toggleLocalVideo();

            updateControlBar();
        }

        function toggleAudio() {
            if(localParticipant.audioTracks().length == 0) {
                log('No audio input devices detected');
                return;
            }

            if(micIsDisabled){
                enableAudioTracks();
                microphoneBtn.innerHTML = icons.microphone;
            } else {
                disableAudioTracks();
                microphoneBtn.innerHTML = icons.disabledMicrophone;
            }
            app.participantsList.toggleLocalAudio();
        }

        function micIsEnabled() {
            return micIsDisabled ? false : true;
        }

        function cameraIsEnabled() {
            return cameraIsDisabled ? false : true;
        }

        function enableVideoTracks() {
            var tracks = localParticipant.tracks

            tracks.forEach(function(track) {
                if(track.kind == 'video') {
                    track.mediaStreamTrack.enabled = true;
                }
            });

            cameraIsDisabled = false;

        }

        function disableVideoTracks() {
            var tracks = localParticipant.tracks

            tracks.forEach(function(track) {
                if(track.kind == 'video') {
                    track.mediaStreamTrack.enabled = false;
                }
            });
            cameraIsDisabled = true;
        }

        function enableAudioTracks() {
            var tracks = localParticipant.tracks

            tracks.forEach(function(track) {
                if(track.kind == 'audio') {
                    track.mediaStreamTrack.enabled = true;
                }
            });

            micIsDisabled = false;
            console.log('enableAudioTracks', micIsDisabled)

        }

        function disableAudioTracks() {
            var tracks = localParticipant.tracks;

            tracks.forEach(function(track) {
                if(track.kind == 'audio') {
                    track.mediaStreamTrack.enabled = false;
                }
            });

            micIsDisabled = true;
            console.log('disableAudioTracks', micIsDisabled)
        }

        function destroyControlBar() {
            if(controlBar != null && controlBar.parentNode != null) controlBar.parentNode.removeChild(controlBar);
        }

        return {
            showControlBar: showControlBar,
            updateControlBar: updateControlBar,
            getControlBar: createControlBar,
            destroyControlBar: destroyControlBar,
            enableVideo: enableVideoTracks,
            disableVideo: disableVideoTracks,
            enableAudio: enableAudioTracks,
            disableAudio: disableAudioTracks,
            toggleVideo: toggleVideo,
            toggleAudio: toggleAudio,
            toggleCameras: toggleCameras,
            disableAudioOfAll: disableAudioOfAll,
            enableAudioOfAll: enableAudioOfAll,
            micIsEnabled: micIsEnabled,
            cameraIsEnabled: cameraIsEnabled,
            speakerIsEnabled: speakerIsEnabled,
            loadDevicesList: loadDevicesList,
            createParticipantsList: createParticipantsList,
            createSettingsPopup: createSettingsPopup,
            videoInputDevices: getVideoDevices,
            audioInputDevices: getAudioDevices,
            currentCameraDevice: getCurrentCameraDevice,
	        frontCameraDevice: getFrontCameraDevice,
            currentAudioDevice: getCurrentAudioDevice,
        }
    }())

    var initOrConnectConversation = function (token, callback) {
        if(_debug) console.log('initOrConnectConversation');
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            console.log("enumerateDevices() not supported.");

            var connect = Twilio.connect;
            connect(token, {
                sid:options.roomName,
                audio:true,
                //video:true,
                video:true,
                preferredVideoCodecs: ['H264', 'VP8'],
                //logLevel: 'debug'
            }).then(function(room) {
                console.log(`Successfully joined a Room: ${room}`, room);
                room.on('participantConnected', function(participant){
                    console.log(`A remote Participant connected: ${participant}`);
                });

                app.eventBinding.roomJoined(room);
                if(callback != null) callback();
            }, function(error) {
                console.error(`Unable to connect to Room: ${error.message}`);
            });
            return;
        }
        navigator.mediaDevices.enumerateDevices().then(function (mediaDevicesList) {
            if(_debug) console.log('initOrConnectConversation mediaDevicesList', mediaDevicesList);
            var mediaDevices = mediaDevicesList;

            var videoDevices = 0;
            var audioDevices = 0;
            for(var i in mediaDevices) {
                if (mediaDevices[i].kind === 'videoinput') {
                    videoDevices++;
                } else if (mediaDevices[i].kind === 'audioinput') {
                    audioDevices++;
                }
            }


            var connect = Twilio.connect;
            console.log('options.roomName', options.roomName);
            connect(token, {
                name:options.roomName,
                audio:audioDevices != 0,
                //video:true,
                video:videoDevices != 0,
                preferredVideoCodecs: ['H264', 'VP8'],
                //logLevel: 'debug'
            }).then(function(room) {
                console.log(`Successfully joined a Room: ${room}`, room);
                room.on('participantConnected', function(participant){
                    console.log(`A remote Participant connected: ${participant}`);
                });

                app.eventBinding.roomJoined(room);
                app.conferenceControl.loadDevicesList(mediaDevicesList);

                app.event.dispatch('joined');
                if(callback != null) callback();
            }, function(error) {
                console.error(`Unable to connect to Room: ${error.message}`);
            });
        })
            .catch(function(err) {
                console.error(err.name + ": " + err.message);
            });;


    }

    var initOrConnectWithNodeJs = function (callback) {
        if(_debug) console.log('initOrConnectConversation');
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            console.log("enumerateDevices() not supported.");
        }
        navigator.mediaDevices.enumerateDevices().then(function (mediaDevicesList) {
            if(_debug) console.log('initOrConnectConversation mediaDevicesList', mediaDevicesList);
            var mediaDevices = mediaDevicesList;

            var videoDevices = 0;
            var audioDevices = 0;
            for(var i in mediaDevices) {
                if (mediaDevices[i].kind === 'videoinput') {
                    videoDevices++;
                } else if (mediaDevices[i].kind === 'audioinput') {
                    audioDevices++;
                }
            }


            navigator.getUserMedia ({
                    'audio':true,
                    'video':videoDevices != 0
                },
                function (stream) {
                    app.eventBinding.socketRoomJoined(stream);
                    app.conferenceControl.loadDevicesList(mediaDevicesList);

                    if(callback != null) callback();
                    /*if(typeof Q === 'undefined')
                        app.eventBinding.socketRoomJoined(stream)
                    else app.eventBinding.streamsRoomJoined(stream)*/
                },
                function(error){console.log("Failed to get access to local media. Error code was " + error.code);}
            );
        })
            .catch(function(err) {
                console.log(err.name + ": " + err.message);
            });


    }


    var getAuthToken = function (userName, callback) {
        if(_debug) console.log('getAuthToken');
        roomName = location.hash.trim() != '' ? location.hash.replace('#', '') : makeid();

        $.ajax({
            type: 'GET',
            url: 'token.php',
            data: {
                name:userName,
                roomName:roomName
            },
            //dataType: "json",
            success: callback
        });
    }

    var createInfoSnippet = function(){
        var noticeContainer = document.createElement('div');
        noticeContainer.className = 'notice-container';

        document.body.appendChild(noticeContainer);
    }

    var initWithTwilio = function(callback){

        var ua=navigator.userAgent;
        if(ua.indexOf('Android')!=-1||ua.indexOf('Windows Phone')!=-1||ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) {
            _isMobile=true;
            if(ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) _isiOS = true;
            app.views.isMobile(true);
            app.views.updateOrientation();
        } else app.views.isMobile(false);

        console.log('options.twilioToken', options)
        if(options.twilioAccessToken != null) {
            initOrConnectConversation(options.twilioAccessToken, callback);
            createInfoSnippet();
            return;
        }

        app.views.createJoinFormView(function (userName) {
            getAuthToken(userName, function (authToken) {
                initOrConnectConversation(authToken)
            });
        });
        app.views.switchTo(joinFormView);
        app.views.createMainView();
        if(_isMobile) app.views.createParticipantsListView();

        createInfoSnippet();

        window.addEventListener("orientationchange", function() {
            setTimeout(function () {
                if(_isMobile) app.views.updateOrientation();
                if(window.room != null) app.screensInterface.generateScreensGrid();
            }, 1500);
        });

        window.addEventListener("resize", function() {
            setTimeout(function () {
                if(_isMobile) app.views.updateOrientation();
                if(window.room != null) app.screensInterface.generateScreensGrid();
            }, 1500);
        });

        /*socket = io.connect('https://www.demoproject.co.ua:8443', {transports: ['websocket']});
        socket.on('connect', function () {
            console.log('CONNECTED', socket);
        });*/
    }

    var initWithNodeJs = function(callback){
        var ua=navigator.userAgent;
        if(ua.indexOf('Android')!=-1||ua.indexOf('Windows Phone')!=-1||ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) {
            _isMobile=true;
            if(ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) _isiOS = true;
            app.views.isMobile(true);
            app.views.updateOrientation();
        } else app.views.isMobile(false);

        if(options.useAsLibrary) {
            socket = io.connect(options.nodeServer, {transports: ['websocket']});
            socket.on('connect', function () {
                console.log('CONNECTED', socket);
                if(localParticipant != null) return;
                localParticipant = new Participant();
                localParticipant.identity = options.username;
                roomParticipants.push(localParticipant);
                if(socket.connected) initOrConnectWithNodeJs(callback)
            });

            /*console.log('START', socket);
            localParticipant = new Participant();
            localParticipant.sid = options.sid;
            localParticipant.identity = options.username;
            roomParticipants.push(localParticipant);
            initOrConnectWithNodeJs(callback)*/


            createInfoSnippet();
            return;
        }

        roomName = location.hash.trim() != '' ? location.hash.replace('#', '') : makeid();
        location.hash = '#' + roomName;

        app.views.createJoinFormView(function (userName) {
            socket = io.connect('https://www.demoproject.co.ua:8443', {transports: ['websocket']});
            socket.on('connect', function () {
                console.log('CONNECTED', socket);
                localParticipant = new Participant();
                localParticipant.identity = userName;
                roomParticipants.push(localParticipant);
                if(socket.connected) initOrConnectWithNodeJs()
            });
        });

        app.views.switchTo(joinFormView);
        app.views.createMainView();
        if(_isMobile) app.views.createParticipantsListView();

        createInfoSnippet();

        window.addEventListener("orientationchange", function() {
            setTimeout(function () {
                if(_isMobile) app.views.updateOrientation();
                if(window.room != null) app.screensInterface.generateScreensGrid();
            }, 1500);
        });

        window.addEventListener("resize", function() {
            setTimeout(function () {
                if(_isMobile) app.views.updateOrientation();
                if(window.room != null) app.screensInterface.generateScreensGrid();
            }, 1500);
        });
    }

    var start = function(user){
        var ua=navigator.userAgent;
        if(ua.indexOf('Android')!=-1||ua.indexOf('Windows Phone')!=-1||ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) {
            _isMobile=true;
            if(ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) _isiOS = true;
            app.views.isMobile(true);
            app.views.updateOrientation();
        } else app.views.isMobile(false);


        console.log('START', socket);
        localParticipant = new Participant();
        localParticipant.sid = user.sid;
        localParticipant.identity = user.username;
        roomParticipants.push(localParticipant);
        initOrConnectWithNodeJs()


        createInfoSnippet();

    }

    app.init = function(callback){
        if(options.webrtcMode == 'twilio') {
            require(['//media.twiliocdn.com/sdk/js/video/releases/1.15.2/twilio-video.min.js'], function (TwilioInstance) {
                Twilio = window.Twilio = TwilioInstance;
                initWithTwilio(callback);
            });
        } else {
            initWithNodeJs(callback);
        }
    }
    app.disconnect = function () {
        if(window.room != null) window.room.disconnect();
    }

    function log(message) {
        var noticeDiv = document.querySelector('.notice-container');
        noticeDiv.innerHTML = message;
        noticeDiv.classList.add('shown');
        setTimeout(function () {
            noticeDiv.classList.remove('shown');
        }, 4000)
    }

    function makeid() {
        var text = "";
        var possible = "0123456789";

        for (var i = 0; i < 11; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    //if(typeof Q == 'undefined') app.init();

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
            console.log('event dispatcher', eventName)
            if(!doesHandlerExist(eventName)) {
                return;
            }
            console.log('event dispatcher')

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
            doesHandlerExist:doesHandlerExist,
        }
    }())


    /*for debugging purpose*/
    var ua=navigator.userAgent;
    if(ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) _isiOS = true;

    if(_isiOS) {
        var originallog = console.log;
        console.log = function (txt) {

            if(!socket || socket && !socket.connected) return;

            try {
                originallog.apply(console, arguments);
                socket.emit('log', [arguments[0], arguments[1], ua])
            } catch (e) {

            }
            return;
            var consLogItem = document.createElement('DIV');
            if(arguments[0][0] == '%') consLogItem.style = arguments[1];
            consLogItem.classList.add('console-log-item');
            consLogItem.style.borderBottom = '1px solid #ccc';
            try {
                var err = (new Error);
                var caller_line = err.stack.split("\n")[4];
                var index = caller_line.indexOf("at ");
                var clean = caller_line.slice(index + 2, caller_line.length);
            } catch (e) {

            }

        }

        window.onerror = function(msg, url, line, col, error) {
            if(!socket || socket && !socket.connected) return;
            var extra = !col ? '' : '\ncolumn: ' + col;
            extra += !error ? '' : '\nerror: ' + error;

            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth() + 1; //January is 0!

            var yyyy = today.getFullYear();
            if (dd < 10) {
                dd = '0' + dd;
            }
            if (mm < 10) {
                mm = '0' + mm;
            }
            var today = dd + '/' + mm + '/' + yyyy + ' ' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();

            var errMessage = "\n\n" + today + " Error: " + msg + "\nurl: " + url + "\nline: " + line + extra + "\n" + ua;

            socket.emit('errorlog', errMessage);
        };
    }

    return app;
}

if(typeof Q == 'undefined') {
    window.WebRTCconference = WebRTCconference();
    WebRTCconference.init();
}
/*
WebRTCconference.event.on('load', function (data) {
    alert(data);
})*/
