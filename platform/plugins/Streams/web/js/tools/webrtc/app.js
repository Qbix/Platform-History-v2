WebRTCconferenceLib = function app(options){
	var app = {};
	var defaultOptions = {
		mode: 'node',
		useIosrtcPlugin: false,
		nodeServer: '',
		roomName: null,
		useAsLibrary: false,
		audio: true,
		video: true,
		streams: null,
		twilioAccessToken: null,
		disconnectTime: 3000,
		turnCredentials: null,
		username: null
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
	var participantsListView;
	var roomsMedia;

	var roomName;
	var twilioRoom;

	var roomScreens = [];
	app.screens = function(all) {
		if(all) {
			return roomScreens;
		} else {
			return roomScreens.filter(function (screen) {
				return (screen.isActive == true && screen.participant.online == true);
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

	var localParticipant;
	app.localParticipant = function() { return localParticipant; }
	var screenTrack;

	//node.js vars
	var socket;

	var _isMobile;
	var _isiOS;
	var _debug = true;

	var pc_config = {
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
	if(ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) {
		pc_config.sdpSemantics = 'plan-b';
	}

	var testPeerConnection = new RTCPeerConnection(pc_config);

	if(options.turnCredentials != null) {
		var testPeerConnection, changeToUrls;
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
				oturn['urls'] = turn['url'];
				delete turn['url'];
			}
		}

		console.log('pc_config', pc_config);
	}


	window.localScreens = function () {
		if(_debug) console.log('localParticipant.screens', localParticipant.screens, localParticipant.identity, localParticipant)
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
		this.streams = [];
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
				if(_debug) console.log('localParticipant.tracks', localParticipant.tracks)
				localParticipant.tracks[x].remove();
			}
		}
		this.remove = function () {
			for(var i = roomScreens.length -1; i >= 0; i--){
				var currentScreen = this;
				var screen = roomScreens[i];
				if(currentScreen != screen.participant) continue;
				if(screen.screenEl && screen.screenEl.parentNode != null) screen.screenEl.parentNode.removeChild(screen.screenEl);
				roomScreens.splice(i, 1);
			}

			for(var t = this.tracks.length - 1; t >= 0; t--){
				if(this.tracks[t].mediaStreamTrack != null) this.tracks[t].mediaStreamTrack.stop()
			}

			for(var p = roomParticipants.length - 1; p >= 0; p--){
				if(roomParticipants[p].sid == this.sid) {
					roomParticipants.splice(p, 1);
					break;
				}
			}
		}
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

			},
		}
		this.screens = [];
		this.twilioInstance = null;
		this.RTCPeerConnection = null;
		this.iceCandidatesQueue = [];
		this.candidates = [];
		this.offersQueue = [];
		this.isNegotiating = false;
		//this.audioStream = null;
		//this.videoStream = null;
		this.audioIsMuted = false;
		this.remoteMicIsEnabled = false;
		this.isLocal = false;
		this.latestOnlineTime = null;
		this.online = true;
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

	var Stream = function () {
		this.sid = null;
		this.type = null;
		this.parentScreen = null;
		this.streamEl = null;
		this.mediaStream = null;
		this.screensharing = null;
		this.remove = function () {

			var index = this.parentScreen.streams.map(function(e) { return e.mediaStream.id; }).indexOf(this.mediaStream.id);
			this.parentScreen.streams[index] = null;
			this.parentScreen.streams = this.parentScreen.streams.filter(function (obj) {
				return obj != null;
			})
			//if(this.kind == 'video') this.parentScreen.videoTrack = null;

			var index = this.participant.streams.map(function(e) { return e.mediaStreamTrack.id; }).indexOf(this.mediaStreamTrack.id);
			this.participant.streams[index] = null;
			this.participant.streams = this.participant.streams.filter(function (obj) {
				return obj != null;
			})

			//if(this.trackEl.parentNode != null) this.trackEl.parentNode.removeChild(this.trackEl);
		};
	}

	/*This function was a part of standalone app; currently is not used */
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
				if(!document.documentElement.classList.contains('Streams_webrtc_desktop-screen')) document.documentElement.classList.add('Streams_webrtc_desktop-screen');
				return;
			}
			if(!document.documentElement.classList.contains('Streams_webrtc_mobile-screen')) document.documentElement.classList.add('Streams_webrtc_mobile-screen');
		}

		function updateOrientation() {
			if(_debug) console.log('window.innerHeight > window.innerWidth', window.innerHeight, window.innerWidth)
			if(window.innerWidth > window.innerHeight) {
				setLandscapeOrientation();
			} else setPortraitOrientation();

		}

		function setPortraitOrientation() {
			if(_debug) console.log('setPortraitOrientation')
			if(document.documentElement.classList.contains('Streams_webrtc_landscape-screen')) document.documentElement.classList.remove('Streams_webrtc_landscape-screen');
			if(!document.documentElement.classList.contains('Streams_webrtc_portrait-screen')) document.documentElement.classList.add('Streams_webrtc_portrait-screen');
		}

		function setLandscapeOrientation() {
			if(_debug) console.log('setLandscapeOrientation')
			if(document.documentElement.classList.contains('Streams_webrtc_portrait-screen')) document.documentElement.classList.remove('Streams_webrtc_portrait-screen');
			if(!document.documentElement.classList.contains('Streams_webrtc_landscape-screen')) document.documentElement.classList.add('Streams_webrtc_landscape-screen');
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
			var i, listItem;
			for (i = 0; listItem = listItems[i]; i++){
				if(listItem.participant == localParticipant) {
					if(_debug) console.log('app.conferenceControl.micIsEnabled()',app.conferenceControl.micIsEnabled())
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
			if(_debug) console.log('selectCameraDialogue')
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

			if(_debug) console.log('LOCAL PARTICIPANT', localParticipant)

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
			cancelBtn.addEventListener('click', function () {app.views.closeAllDialogues();twilioRoom.disconnect();});

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
				if(_debug) console.log('removeTrack', twilioTrack)

				/*if(twilioTrack.kind == 'video' || twilioTrack.kind == 'audio') {
					var detachedElements = twilioTrack.detach();

					for (var i in detachedElements) {

						var detachedElement = detachedElements[i];
						if (detachedElement.parentNode != null) detachedElement.parentNode.removeChild(detachedElement);
					}
				}*/

				var index = this.tracks.map(function(e) { return e.sid; }).indexOf(twilioTrack.sid);
				this.tracks[index].remove();

			}
		};

		function attachTrack(track, participant) {
			if(_debug) console.log('attachTrack track', track);
			if(_debug) console.log('attachTrack track kind', track.kind);
			if(typeof cordova != 'undefined' && _isiOS && track.kind == 'video' && track.stream != null && track.stream.hasOwnProperty('_blobId')) {
				if(_debug) console.log('attachTrack iosrtc track video');
				iosrtcLocalPeerConnection.addStream(track.stream);
				return;
			} else if(typeof cordova != 'undefined' && _isiOS && track.kind == 'audio' && track.stream != null && track.stream.hasOwnProperty('_blobId')) {
				if(_debug) console.log('attachTrack iosrtc track audio');

				iosrtcLocalPeerConnection.addStream(track.stream);

				return;
			}


			var screenToAttach;
			var curRoomScreens = roomScreens.filter(function (obj) {
				return obj.sid == participant.sid;
			});
			if(_debug) console.log('attachTrack curRoomScreens', roomScreens);

			if(curRoomScreens.length == 0) {
				screenToAttach = createRoomScreen(participant);
			} else screenToAttach = curRoomScreens[0];
			track.parentScreen = screenToAttach;

			if(track.kind == 'video' && screenToAttach.videoTrack) {
				if(screenToAttach.videoTrack.parentNode) screenToAttach.videoTrack.parentNode.removeChild(screenToAttach.videoTrack)
				var trackEl = createTrackElement(track, participant);
				track.trackEl = trackEl;
				track.trackEl.play();
				//track.twilioReference.unmute();
				screenToAttach.videoCon.appendChild(trackEl);
				screenToAttach.videoTrack = trackEl;
				screenToAttach.isActive = true;
				//createVideoCanvas(screenToAttach, track);
				app.event.dispatch('videoTrackIsBeingAdded', screenToAttach);
			} else if(track.kind == 'video' && screenToAttach.videoTrack == null){
				var trackEl = createTrackElement(track, participant);
				track.trackEl = trackEl;
				screenToAttach.videoCon.appendChild(trackEl);
				screenToAttach.videoTrack = trackEl;
				screenToAttach.isActive = true;
				//createVideoCanvas(screenToAttach, track);
				app.event.dispatch('videoTrackIsBeingAdded', screenToAttach);
			} else if(track.kind == 'audio') {

				var trackEl = createTrackElement(track, participant);
				track.trackEl = trackEl;
				if(!participant.isLocal) {
					document.body.appendChild(trackEl);
					if(participant.audioIsMuted) {
						track.trackEl.muted = true;
					}
				}
				craetAudioeAnalyser(track, participant)

			}
			if(_debug) console.log('attachTrack AFTER createTrackElement ' + (JSON.stringify(localParticipant.videoStream)));

			screenToAttach.screensharing = track.screensharing == true ? true : false;

			track.participant = participant;

			screenToAttach.tracks.push(track);

			var trackExist = participant.tracks.filter(function (t) {
				return t == track;
			})[0];
			if(trackExist == null) participant.tracks.push(track);

			if(typeof cordova != 'undefined' && _isiOS && participant.isLocal) {
				if(_debug) console.log('attachTrack iosrtc PUBLISH TRACK ' + (participant.videoStream != null));

				if(track.kind =='video'){
					if(localParticipant.videoTracks().length > 1) {
						if(_debug) console.log('attachTrack iosrtc PUBLISH V TRACK REPLACE');

						app.conferenceControl.replaceTrack(track.mediaStreamTrack);
					} else {
						if(_debug) console.log('attachTrack iosrtc PUBLISH V TRACK ADD');
						app.conferenceControl.enableVideo();
					}
				} else {

					//setTimeout(function(){
					if(localParticipant.audioTracks().length > 1) {
						if(_debug) console.log('attachTrack iosrtc PUBLISH A TRACK REPLACE');

						app.conferenceControl.replaceTrack(track.mediaStreamTrack);
					} else {
						if(_debug) console.log('attachTrack iosrtc PUBLISH A TRACK ADD');
						app.conferenceControl.enableAudio();
					}
					//}, 4000)

				}
			}

			if(participant == localParticipant) app.conferenceControl.updateControlBar();
			app.event.dispatch('trackAdded', {screen:screenToAttach, track: track});

		}

		function attachStream(stream, participant) {
			if(_debug) console.log('attachStream track', stream);
			if(_debug) console.log('attachStream participant', stream);

			var screenToAttach;
			var curRoomScreens = roomScreens.filter(function (obj) {
				return obj.sid == participant.sid;
			});
			if(_debug) console.log('attachStream curRoomScreens', roomScreens);

			if(curRoomScreens.length == 0) {
				screenToAttach = createRoomScreen(participant);
			} else screenToAttach = curRoomScreens[0];
			stream.parentScreen = screenToAttach;

			if(screenToAttach.videoTrack) {
				if(screenToAttach.videoTrack.parentNode) screenToAttach.videoTrack.parentNode.removeChild(screenToAttach.videoTrack)
				var streamEl = document.createElement('VIDEO');
				stream.streamEl = streamEl;
				streamEl.src = window.URL.createObjectURL(stream.mediaStream);
				streamEl.volume = 0;
				streamEl.play();
				//track.twilioReference.unmute();
				screenToAttach.videoCon.appendChild(streamEl);
				screenToAttach.videoTrack = streamEl;
				screenToAttach.isActive = true;
				//createVideoCanvas(screenToAttach);
				app.event.dispatch('videoTrackIsBeingAdded', screenToAttach);
			} else if(screenToAttach.videoTrack == null){
				var streamEl = document.createElement('VIDEO');
				stream.streamEl = streamEl;
				streamEl.src = window.URL.createObjectURL(stream.mediaStream);
				streamEl.volume = 0;
				streamEl.play();
				screenToAttach.videoCon.appendChild(streamEl);
				screenToAttach.videoTrack = streamEl;
				screenToAttach.isActive = true;
				//createVideoCanvas(screenToAttach);
				app.event.dispatch('videoTrackIsBeingAdded', screenToAttach);
			} /*else if(track.kind == 'audio') {
				var trackEl = createTrackElement(track, participant);
				track.trackEl = trackEl;
				craetAudioeAnalyser(track, participant)
				if(participant.audioIsMuted) {
					track.trackEl.muted = true;
				}
			}*/

			screenToAttach.screensharing = stream.screensharing == true ? true : false;

			stream.participant = participant;

			screenToAttach.streams.push(stream);

			var streamExist = participant.streams.filter(function (s) {
				return s == stream;
			})[0];
			if(streamExist == null) participant.streams.push(stream);

			app.event.dispatch('trackAdded', {screen:screenToAttach, stream: stream});

		}

		function craetAudioeAnalyser(track, participant) {
			if(typeof cordova != 'undefined' && _isiOS) return;

			if(_debug) console.log('craetAudioeAnalyser', track)

			if(participant.soundMeter.source != null) {
				/*participant.soundMeter.script.disconnect();
				participant.soundMeter.source.disconnect();*/
				participant.soundMeter.context.resume();

				participant.soundMeter.audioTrack = track.mediaStreamTrack;
				participant.soundMeter.source = participant.soundMeter.context.createMediaStreamSource(track.stream);

				participant.soundMeter.source.connect(participant.soundMeter.script);
				participant.soundMeter.script.connect(participant.soundMeter.context.destination);
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

			participant.soundMeter.source = participant.soundMeter.context.createMediaStreamSource(track.stream);
			participant.soundMeter.source.connect(participant.soundMeter.script);
			//source.connect(context.destination); // connect the source to the destination

			participant.soundMeter.script.connect(participant.soundMeter.context.destination); // chrome needs the analyser to be connected too...


			participant.soundMeter.instant = 0;
			participant.soundMeter.slow = 0;
			participant.soundMeter.clip = 0;
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
							console.log('soundmeter stop')
							el.setAttributeNS(null, 'height', '0%');
							el.setAttributeNS(null, 'y', 0);
						}
					}
				}*/
			}

			function buildVisualization(participant) {
				participant.soundMeter.latestUpdate = performance.now();

				participant.soundMeter.script.onaudioprocess = function(e) {

					var input = e.inputBuffer.getChannelData(0);
					var i;
					var sum = 0.0;
					var clipcount = 0;
					for (i = 0; i < input.length; ++i) {
						sum += input[i] * input[i];
						if (Math.abs(input[i]) > 0.99) {
							clipcount += 1;
						}

					}

					var audioIsDisabled = participant.soundMeter.source.mediaStream && (participant.soundMeter.source.mediaStream.active == false || participant.soundMeter.audioTrack.readyState == 'ended');
					if(!audioIsDisabled) {
						//console.log('onaudioprocess ENABLED')
						participant.soundMeter.instant = Math.sqrt(sum / input.length);
						participant.soundMeter.slow = 0.95 * participant.soundMeter.slow + 0.05 * participant.soundMeter.instant;
						participant.soundMeter.clip = clipcount / input.length;
					} else {
						//console.log('onaudioprocess DISABLED')

						participant.soundMeter.instant = 0;
						participant.soundMeter.slow = 0;
						participant.soundMeter.clip = 0;
					}

					var historyLength = participant.soundMeter.history.volumeValues.length;
					if(historyLength > 100) participant.soundMeter.history.volumeValues.splice(0, historyLength - 100);
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
						participant.soundMeter.changedVolume = participant.soundMeter.instant / average * 100;
					} else participant.soundMeter.changedVolume = 0;



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

			function updatVisualizationWidth(participant, visualization) {

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
			}

			return {
				build: buildVisualization,
			}
		}

		function getScreenOfTrack(track) {
			if(_debug) console.log('getScreenOfTrack', track);
			for(var i in roomScreens){
				for(var x in roomScreens[i].tracks){
					if(roomScreens[i].tracks[x].sid == track.sid) return roomScreens[i]
				}
			}
		}

		function detachTracks(tracks, participant) {
			if(_debug) console.log('detachTracks', tracks, participant);

			var screenOfTrack;
			tracks.forEach(function(track) {
				screenOfTrack = getScreenOfTrack(track);
				if(_debug) console.log('detachTracks screenOfTrack', track);

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
			if(video) console.log('supportsVideoType kind=' + video.nodeName);

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
					console.log('supportsVideoType: ' + key + ' - ' + supportabbleFormats[key]);
				}
			}
			return supportabbleFormats;
		}

		function createTrackElement(track, participant) {
			//if(participant.isLocal) return;
			//if(track.twilioReference != null) return track.twilioReference.attach();
			if(_debug) console.log('createTrackElement', track.kind, track.id);
			if(_debug) console.log('createTrackElement participant is local = ' + participant.isLocal);

			var remoteStreamEl, stream;
			if(track.stream != null) {
				try {
					if (_debug) console.log('createTrackElement 1 stream exist')

					remoteStreamEl = document.createElement(track.kind);
					remoteStreamEl.srcObject = stream = track.stream;
				} catch(e) {
					console.error(e.name + ': ' + e.message)
					console.log('EEEEEEEEEEERRRRRRRRROOOOOOOOOOOOORRRRRRR - ' + e.name + ': ' + e.message)
				}

			} else {
				if(_debug) console.log('createTrackElement 2 stream  does not exist')

				remoteStreamEl = document.createElement(track.kind);

				try{
					if(typeof cordova != "undefined" && _isiOS && participant.isLocal && (participant.audioStream != null || participant.videoStream != null)) {
						if(_debug) console.log('createTrackElement 2 stream  does not exist')

						stream = track.kind == 'audio' ? participant.audioStream : participant.videoStream
					} else {
						stream = new MediaStream();
					}
				} catch(e){
					if(_debug) console.log('ERRRRRRRRROOOOOOOR createTrackElement 2.3', e.message);

				}
				if(_debug) console.log('createTrackElement 4', stream)

				stream.addTrack(track.mediaStreamTrack);

				var binaryData = [];
				binaryData.push(stream);

				//if(_debug) console.log('createTrackElement stream', track.mediaStreamTrack.getSettings())
				try{
					remoteStreamEl.srcObject = stream;
					/*remoteStreamEl.src = window.URL.createObjectURL(new Blob(binaryData))
					remoteStreamEl.play();*/
				} catch(e){
					if(_debug) console.error('ERRRRRRRRROOOOOOOR createTrackElement 2.3', e.message)
					if(_debug) console.log('ERRRRRRRRROOOOOOOR createTrackElement 2.3', e.message)

				}
				track.stream = stream;
			}

			//Android cordova doesn't play video with autoplay = true
			//if(!track.isLocal || track.isLocal && track.kind == 'video') remoteStreamEl.autoplay = true;
			remoteStreamEl.autoplay = true;
			remoteStreamEl.load();
			if(!track.isLocal && track.kind == 'audio') {

				remoteStreamEl.play();
			}
			remoteStreamEl.playsInline = true;
			remoteStreamEl.setAttribute('webkit-playsinline', true);

			if(participant.isLocal) {
				if(_debug) console.log('createTrackElement videoStream = stream')

				remoteStreamEl.volume = 0;
				remoteStreamEl.muted = true;

				if(track.kind == 'video') localParticipant.videoStream = stream;
				if (track.kind == 'audio') localParticipant.audioStream = stream;
			}



			/*if(typeof cordova != 'undefined' && _isiOS) {
				remoteStreamEl.style.width = '100%';
				remoteStreamEl.style.height = '100%';
				remoteStreamEl.style.objectFit = 'cover';
				remoteStreamEl.style.zIndex = '0';
				if(StatusBar.isVisible) remoteStreamEl.style.marginTop = '20px';
			}*/

			/*if(track.kind == 'video')
				participant.videoStream = stream;
			else if(track.kind == 'audio') participant.audioStream = stream;*/

			var supportableFormats = supportsVideoType(remoteStreamEl);
			console.log('supportsVideoType', supportableFormats)
			//remoteStream.srcObject = track.twilioReference != null ? track.twilioReference.mediaStreamTrack : track.MediaStreamTrack;

			if(track.kind == 'video') {
				remoteStreamEl.addEventListener('loadedmetadata', function (e) {
					var videoConWidth = (track.parentScreen.videoCon.style.width).replace('px', '');
					var videoConHeight= (track.parentScreen.videoCon.style.height).replace('px', '');
					var currentRation = videoConWidth / videoConHeight;
					var videoRatio = e.target.videoWidth / e.target.videoHeight;

					if(_debug) console.log('loadedmetadata ' + videoConWidth + ' - ' + videoConHeight)
					var shouldReset = (track.parentScreen != null && currentRation.toFixed(1) != videoRatio.toFixed(1)) || track.screensharing == true;

					app.event.dispatch('videoTrackLoaded', {
						screen: track.parentScreen,
						trackEl: e.target,
						reset:shouldReset,
					});

					/*if(typeof cordova != 'undefined' && _isiOS) {
						setTimeout(function () {
							app.event.dispatch('videoTrackLoaded', {
								screen: track.parentScreen,
								trackEl: e.target,
								reset:shouldReset,
							});
						}, 2000)
					}*/
				});

			}

			return remoteStreamEl;
		}

		function removeEmptyScreens() {
			if(_debug) console.log('removeEmptyScreens');

			for(var i in roomScreens[i]) {
				//if(roomScreens[i].isMain) continue;
				if(roomScreens[i].tracks.length == 0) roomScreens.splice(i, 1);
			}
		}

		function sendVideoDataToServer(data, mediaStreamId) {
			if(!socket || !socket.connected) return;

			//var data = JSON.stringify(data);
			console.log('videoData',data);
			socket.emit('videoData', data, options.roomName, mediaStreamId);
		}

		function createVideoCanvas(screen, track) {
			//return;
			console.log('createVideoCanvas');
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
				//console.log('createVideoCanvas', localVideo);



				inputCtx.drawImage( localVideo, 0, 0, canvasWidth, canvasHeight);

				// get pixel data from input canvas
				var pixelData = inputCtx.getImageData( 0, 0, videoWidth, videoHeight );
				//sendVideoDataToServer(pixelData, mediaStreamId);
				//if(socket && socket.connected) socket.emit('videoData', txt + argumentsString + '\n');;
				//console.log('pixelData', pixelData)
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
					console.log('createVideoCanvas setInterval');
					if(document.documentElement.contains(localVideo)) {
						//setTimeout(function () {
						console.log('createVideoCanvas video is in DOM', screen);

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
						//}, 0);
						clearInterval(waitingVideoTimer);
						waitingVideoTimer = null;
					}

				}, 3000);
			})
		}

		function createRoomScreen(participant) {
			if(_debug) console.log('createParticipantScreen', participant);
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
			var chatParticipantVoice = document.createElement('DIV');
			chatParticipantVoice.className = 'chat-participant-voice';
			var participantNameTextCon = document.createElement("DIV");
			participantNameTextCon.className = "participant-name-text";
			var participantNameText = document.createElement("DIV");
			participantNameText.innerHTML = participant.identity;

			if(_debug) console.log('isLocal && _isMobile', isLocal && _isMobile, isLocal, _isMobile);

			chatParticipantEl.appendChild(chatParticipantVideoCon);
			participantNameTextCon.appendChild(participantNameText);
			chatParticipantName.appendChild(participantNameTextCon);
			if(isLocal && isMainOfLocal && _isMobile) {
				var conferenceControlBtns = app.conferenceControl.getControlBar();
				if(_debug) console.log('conferenceControlBtns', conferenceControlBtns)
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
			newScreen.soundEl = chatParticipantVoice;
			newScreen.isMain = participant.videoTracks.length < 2;
			newScreen.isLocal = isLocal;
			if(_debug) console.log('createParticipantScreen END')

			participant.screens.push(newScreen);
			if(participant.isLocal)
				roomScreens.push(newScreen);
			else roomScreens.unshift(newScreen);
			app.event.dispatch('screenAdded', participant);
			return newScreen;
		}

		function toggleGridMode(e) {
			if(options.useAsLibrary) return;
			if(_debug) console.log('makeFullScreen',  e.currentTarget);
			if(activeScreen && activeScreen.screenEl.contains(e.currentTarget)) {
				if(_debug) console.log('makeFullScreen all');
				viewMode = 'all';
				activeScreen = null;
				if(_isMobile) localParticipant.screens[localParticipant.screens.length-1].nameEl.appendChild(app.conferenceControl.getControlBar());
				return;
			}


			activeScreen = roomScreens.filter(function (obj) {
				if(_debug) console.log('makeFullScreen activeScreen for', obj.screenEl);

				return obj.screenEl.contains(e.currentTarget);
			})[0];

			if(_isMobile) activeScreen.nameEl.appendChild(app.conferenceControl.getControlBar())

			if(_debug) console.log('makeFullScreen activeScreen', activeScreen);

			viewMode = 'mainAndThumbs';


			//fullScreenGrid()
			mainScreenAndThumbsGrid();
		}

		function removeScreensByParticipant(participant) {
			if(_debug) console.log('removeScreensByParticipant');

			for(var i in roomScreens) {
				if(roomScreens[i].sid != participant.sid) continue;
				if(_debug) console.log('removeScreensByParticipant DEACTIVATE', roomScreens[i]);

				roomScreens[i].isActive = false;
				var screenEl = roomScreens[i].screenEl;
				if(screenEl != null && screenEl.parentNode != null) screenEl.parentNode.removeChild(screenEl)
				//roomScreens[i] = null;
			}

			/*roomScreens = roomScreens.filter(function (el) {
				return el != null;
			});*/
			if(_debug) console.log('removeScreensByParticipant END', roomScreens.length);

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

		return {
			attachTrack: attachTrack,
			attachStream: attachStream,
			detachTracks: detachTracks,
			supportsVideoType: supportsVideoType,
			createTrackElement: createTrackElement,
			createParticipantScreen: createRoomScreen,
			removeScreensByParticipant: removeScreensByParticipant,
			getLoudestScreen: getLoudestScreen,
			audioVisualization: audioVisualization,
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
			app.eventBinding.sendDataTrackMessage("screensharingStarting");

			if(options.mode != 'twilio') {
				getUserScreen().then(function (stream) {
					var videoTrack = stream.getVideoTracks()[0];
					app.conferenceControl.disableVideo();
					/*for (var p in roomParticipants) {
						if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null) {
							var videoSender = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (sender) {
								return sender.track && sender.track.kind == 'video';
							})[0];


							console.log('videoSender', videoSender)
							/!*if(videoSender){
								videoSender.replaceTrack(stream.getVideoTracks()[0])
									.then(function() {

									})
									.catch(function (e) {
										console.error(e);
										console.log(e);
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
					trackToAttach.sid = videoTrack.id;
					trackToAttach.mediaStreamTrack = videoTrack;
					trackToAttach.kind = videoTrack.kind;
					trackToAttach.isLocal = true;
					trackToAttach.screensharing = true;

					app.screensInterface.attachTrack(trackToAttach, localParticipant);
					console.log('StartShareScreen cameraIsEnabled()1' + (app.conferenceControl.cameraIsEnabled()));


					app.conferenceControl.enableVideo();
					console.log('StartShareScreen cameraIsEnabled()2' + (app.conferenceControl.cameraIsEnabled()));

					app.eventBinding.sendDataTrackMessage("screensharingStarted");
					console.log('StartShareScreen cameraIsEnabled()3' + (app.conferenceControl.cameraIsEnabled()));
				}).catch(function(error) {
					console.error(error.name + ': ' + error.message);
					app.eventBinding.sendDataTrackMessage("screensharingFailed");
					if(failureCallback != null) failureCallback(error);
				});
			} else {
				var twilioTracks = []

				var i;
				var tracksNum = localParticipant.tracks.length - 1;
				for (i = tracksNum; i >= 0; i--) {
					if (localParticipant.tracks[i].kind == 'audio') continue;
					twilioTracks.push(localParticipant.tracks[i].twilioReference);
					localParticipant.tracks[i].mediaStreamTrack.stop();
					localParticipant.tracks[i].mediaStreamTrack.enabled = false;
				}
				getUserScreen().then(function (stream) {

					localParticipant.twilioInstance.unpublishTracks(twilioTracks);

					var screenTrack = stream.getVideoTracks()[0];
					localParticipant.twilioInstance.publishTrack(screenTrack).then(function (trackPublication) {
						var i = localParticipant.tracks.length
						while (i--) {
							if (localParticipant.tracks[i].kind == 'audio') continue;
							//localParticipant.stream.removeTrack(localParticipant.tracks[i].mediaStreamTrack)
							localParticipant.tracks[i].remove();
						}

						var trackToAttach = new Track();
						trackToAttach.sid = trackPublication.track.sid;
						trackToAttach.kind = trackPublication.track.kind;
						trackToAttach.screensharing = true;
						trackToAttach.isLocal = true;
						trackToAttach.mediaStreamTrack = trackPublication.track.mediaStreamTrack;
						trackToAttach.twilioReference = trackPublication.track;

						app.screensInterface.attachTrack(trackToAttach, localParticipant);

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
			startShareScreen: startShareScreen
		}
	}())


	function bindTracksEvents(publication, participant) {
		publication.on('subscribed', track => {
			if(_debug) console.log(`%cLocalParticipant subscribed to a RemoteTrack: ${track}`, 'background:red;');
		});

		publication.on('unsubscribed', track => {
			if(_debug) console.log(`%c LocalParticipant unsubscribed from a RemoteTrack: ${track}`, 'background:red;');
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
			if(_debug) console.log(`%c RemoteParticipant ${participant.identity} unpublished a RemoteTrack: ${publication}`, 'background:yellow;');
		});
	}

	app.eventBinding = (function () {
		function twilioParticipantConnected(participant) {
			if(_debug) console.log('twilioParticipantConnected', participant.sid)
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
			//TODO: fix socket room app.js?ts=1560911241600:2487 Uncaught DOMException: Failed to execute 'addTrack' on 'RTCPeerConnection': A sender already exists for the track.
			var participantExist = roomParticipants.filter(function (p) {
				return p.sid == newParticipant.sid;
			})[0];
			console.log('participantConnected', participantExist)
			if(participantExist == null){
				console.log('participantConnected participantExist')

				roomParticipants.unshift(newParticipant);
			}
			if(newParticipant.screens.length == 0) app.screensInterface.createParticipantScreen(newParticipant)
			//app.participantsList.add(newParticipant);

			app.event.dispatch('participantConnected', newParticipant);
		}

		function dataTrackRecieved(track, participant) {
			if(_debug) console.log('dataTrackRecieved', track, participant);
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
			if(_debug) console.log("trackAdded:",track, trackPublication, participant.sid);

			var existingParticipant = roomParticipants.filter(function (roomParticipant) {
				if(_debug) console.log("trackAdded:  roomParticipant.sid", participant.sid, roomParticipant.sid);

				return roomParticipant.sid == participant.sid;
			})[0];

			existingParticipant.latestOnlineTime = performance.now();

			if(_debug) console.log("trackAdded:",existingParticipant);
			if (track.kind === 'audio' || track.kind === 'video') {

				if (_debug) console.log('existingParticipant', existingParticipant)
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

		function processDataTrackMessage(data, participant) {
			//if(_debug) console.log('processDataTrackMessage', data)

			data = JSON.parse(data);
			if(data.type == 'screensharingStarting' || data.type == 'screensharingStarted' || data.type == 'screensharingFailed' || data.type == 'afterCamerasToggle') {
				app.event.dispatch(data.type, {content:data.content != null ? data.content : null, participant: participant});
			} else if(data.type == 'online') {
				//if(_debug) console.log('processDataTrackMessage online', data)

				if(data.content.micIsEnabled != null) participant.remoteMicIsEnabled = data.content.micIsEnabled;
				if(data.content.cameraIsEnabled != null) participant.remoteCameraIsEnabled = data.content.cameraIsEnabled;

				if(participant.online == false)	{
					participant.online = true;
					participantConnected(participant);
					if(options.mode == 'nodejs' && participant.RTCPeerConnection == null) {
						participant.RTCPeerConnection = socketParticipantConnected().initPeerConnection(participant);
					}
					participant.latestOnlineTime = performance.now();
				} else {
					participant.latestOnlineTime = performance.now();
				}
			} else if(data.type == 'service') {
				if(_debug) console.log('processDataTrackMessage service mic' + (app.conferenceControl.micIsEnabled()))

				if(data.content.audioNotWork == true && app.conferenceControl.micIsEnabled())	{
					//app.conferenceControl.disableAudio();
					//app.conferenceControl.enableAudio();
				}
			}
		}

		function checkOnlineStatus() {
			app.checkOnlineStatusInterval = setInterval(function () {
				var i, participant;
				for (i = 0; participant = roomParticipants[i]; i++){


					var audioTracks = participant.tracks.filter(function (t) {
						if(participant.online == false) return;
						//if(_debug) console.log('enabledAudioTracks 0', t.mediaStreamTrack.enabled, t.mediaStreamTrack.readyState);
						return t.kind == 'audio';
					});
					var enabledAudioTracks = audioTracks.filter(function (t) {
						//if(!participant.isLocal) console.log('checkOnlineStatus enabledAudioTracks = ' + (t.mediaStreamTrack != null) + '--' + (t.mediaStreamTrack.enabled) + '--' + (t.mediaStreamTrack.readyState));

						if(participant.online == false) return;
						return t.mediaStreamTrack != null && t.mediaStreamTrack.enabled && t.mediaStreamTrack.readyState == 'live';
					});

					var renabledAudioTracks = audioTracks.filter(function (t) {
						if(participant.online == false) return;
						return t.mediaStreamTrack != null && t.mediaStreamTrack.enabled && t.mediaStreamTrack.readyState == 'live';
					});
					//if(!participant.isLocal) console.log('checkOnlineStatus info ' + audioTracks.length + '--' + enabledAudioTracks.length + '--' + renabledAudioTracks.length);


					if(!participant.isLocal && participant.online && performance.now() - participant.latestOnlineTime < 3000) {

						if(audioTracks.length != 0 && enabledAudioTracks.length == 0 && participant.remoteMicIsEnabled) {
							console.log('checkOnlineStatus MIC DOESN\'T WORK');
							sendDataTrackMessage('service', {audioNotWork: true});
							if(socket != null) socket.emit('errorlog', "checkOnlineStatus MIC DOESN'T WORK'");
						}
					}

					var enabledVideoTracks = participant.tracks.filter(function (t) {
						return t.kind == 'video' && t.mediaStreamTrack != null && t.mediaStreamTrack.enabled && t.mediaStreamTrack.readyState == 'live';
					});
					//if(_debug && !participant.isLocal && participant.online) console.log('checkOnlineStatus : participantDisconnected', enabledVideoTracks.length, performance.now() - participant.latestOnlineTime)

					var disconnectTime = options.disconnectTime != null ? options.disconnectTime : 3000;

					if(!participant.isLocal && participant.online && participant.online != 'checking' && participant.latestOnlineTime != null && performance.now() - participant.latestOnlineTime >= disconnectTime) {
						if(_debug) console.log('checkOnlineStatus : remove', performance.now() - participant.latestOnlineTime, !participant.videoIsChanging)
						let latestOnlineTime = participant.latestOnlineTime;
						let participantSid = participant.sid;
						if(socket) {
							socket.emit('confirmOnlineStatus', {
								'type': 'request',
								'targetSid': participant.sid
							});

							participant.online = 'checking';
							setTimeout(function () {
								console.log(participantSid)
								var participantToCheck = roomParticipants.filter(function (roomParticipant) {
									return roomParticipant.sid == participantSid;
								})[0];
								if (participantToCheck.latestOnlineTime != latestOnlineTime) return;
								participantDisconnected(participantToCheck);
							}, 1000);
						} else {
							console.log(participantSid)
							var participantToCheck = roomParticipants.filter(function (roomParticipant) {
								return roomParticipant.sid == participantSid;
							})[0];
							if (participantToCheck.latestOnlineTime != latestOnlineTime) return;
							participantDisconnected(participantToCheck);
						}
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
			if(_debug) console.log("trackUnsubscribed:", track, trackPublication, twilioParticipant);
			var existingParticipant = roomParticipants.filter(function (roomParticipant) {
				return roomParticipant.sid == twilioParticipant.sid;
			})[0];
			app.screensInterface.detachTracks([track], existingParticipant);
		}

		function trackUnpublished(track, participant) {
			if(_debug) console.log("trackUnpublished:", participant);

			//app.screensInterface.detachTracks([track]);
		}

		function participantDisconnected(participant) {
			if(_debug) console.log("participantDisconnected:", participant, participant.online);
			if(participant.online == false) return;

			app.screensInterface.removeScreensByParticipant(participant);
			//participant.remove();
			participant.online = false;
			//app.participantsList.remove(participant);

			app.event.dispatch('participantDisconnected', participant);

		}

		function twilioParticipantDisconnected(twilioParticipant) {
			if(_debug) console.log("twilioParticipantDisconnected:", twilioParticipant);
			var existingParticipant = roomParticipants.filter(function (roomParticipant) {
				return roomParticipant.sid == twilioParticipant.sid;
			})[0];

			if (existingParticipant != null) participantDisconnected(existingParticipant);
		}

		function localParticipantDisconnected() {
			if(_debug) console.log("localParticipantDisconnected");

			var tracks = Array.from(localParticipant.twilioInstance.tracks.values());

			localParticipant.tracks.forEach(function(track) {
				console.log('track',track)
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

			if(!options.useAsLibrary) app.views.switchTo(joinFormView);
			app.conferenceControl.destroyControlBar();

			if(!options.useAsLibrary) roomsMedia.innerHTML = '';

			roomScreens = [];
			roomParticipants = [];

			app.event.dispatch('localParticipantDisconnected');
		}

		function roomJoined(room, dataTrack) {
			app.state = 'connected';
			twilioRoom = room;
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

			if(participantScreen == null) {
				if(_debug) console.log('room.localParticipant', room.localParticipant, participantScreen);

				localParticipant = new Participant();
				localParticipant.sid = room.localParticipant.sid;
				localParticipant.identity = room.localParticipant.identity;
				localParticipant.tracks = [];
				localParticipant.isLocal = true;
				localParticipant.twilioInstance = room.localParticipant;

				roomParticipants.push(localParticipant);

				var tracks = Array.from(room.localParticipant.tracks.values());

				for(var i in tracks) {
					if(_debug) console.log('localTracks', tracks[i]);

					if(tracks[i].track.kind == 'data') {

						continue;
					}
					var trackToAttach = new Track();
					trackToAttach.sid = tracks[i].track.sid;
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
				if(_debug) console.log("Already in Room: '" + participant.identity + "'");
				var remoteParticipant = twilioParticipantConnected(participant);

				//app.screensInterface.addParticipantScreen(participant);
				/*var tracks = Array.from(participant.tracks.values());
				setTimeout(function () {
					participant.tracks.forEach(publication => {
						if(publication.kind == 'data' && publication.isSubscribed) {
							dataTrackRecieved(publication.track, remoteParticipant);

						} else if (publication.isSubscribed) {
							if (_debug) console.log('BEFORE attachTrack', publication.track)

							var track = publication.track;
							var trackToAttach = new Track();
							trackToAttach.sid = track.sid;
							trackToAttach.kind = track.kind;
							trackToAttach.twilioReference = track;
							if (_debug) console.log('BEFORE attachTrack', trackToAttach)

							app.screensInterface.attachTrack(trackToAttach, remoteParticipant);
						}
					})
				}, 1000)*/

			});

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

			checkOnlineStatus();

			function disconnect() {
				twilioRoom.disconnect();
			}
			window.addEventListener('beforeunload', disconnect);
			window.addEventListener('unload', disconnect);
			window.addEventListener('pagehide', disconnect);

		}

		function gotIceCandidate(event, existingParticipant, purpose){


			if (event.candidate) {
				if(event.candidate.candidate.indexOf("relay")<0){ // if no relay address is found, assuming it means no TURN server
					//return;
				}

				if(_debug) console.log('gotIceCandidate existingParticipant', existingParticipant)
				if(_debug) console.log('gotIceCandidate .candidate = ' + event.candidate.candidate)

				/*if(app.event.doesHandlerExist('candidate')) { enableCamera(callback) {
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
					sdpMid: event.candidate.sdpMid,
					candidate: event.candidate.candidate,
					id: event.candidate.sdpMid,
					targetSid: existingParticipant.sid
				});
			}

			if (event.candidate && event.candidate.candidate.indexOf('srflx') !== -1) {
				var cand = parseCandidate(event.candidate.candidate);
				if (!existingParticipant.candidates[cand.relatedPort]) existingParticipant.candidates[cand.relatedPort] = [];
				existingParticipant.candidates[cand.relatedPort].push(cand.port);
			} else if (!event.candidate) {
				if (Object.keys(existingParticipant.candidates).length === 1) {
					var ports = existingParticipant.candidates[Object.keys(existingParticipant.candidates)[0]];
					console.log(ports.length === 1 ? 'NAT TYPE: cool nat' : 'NAT TYPE: symmetric nat');
				}
			}
		}

		function parseCandidate(line) {
			var parts;
			// Parse both variants.
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

		function rawTrackSubscribed(event, existingParticipant){
			if(_debug) console.log("%c rawTrackSubscribed:", 'background:orange;color:white;', event);

			if(_debug) console.log('existingParticipant', existingParticipant)

			var track = event.track;
			var trackToAttach = new Track();
			trackToAttach.sid = track.sid;
			trackToAttach.kind = track.kind;
			trackToAttach.mediaStreamTrack = track;
			if(event.streams.length != 0) trackToAttach.stream = event.streams[0];

			app.screensInterface.attachTrack(trackToAttach, existingParticipant);
		}

		function rawStreamSubscribed(event, existingParticipant){
			if(_debug) console.log("%c rawStreamSubscribed===================================:", 'background:orange;color:white;', event);

			if(_debug) console.log('existingParticipant', existingParticipant)
			var stream = event.stream;
			console.log('stream got ' + stream.getTracks().length);
			var tracks = stream.getTracks();
			/*if(tracks.length > 1) {
				console.error('Stream contains more than one track');
				return;
			}*/
			/*var tracks = stream.getAudioTracks();
			console.log('stream got2');
			var videoEl = document.createElement('video');
			console.log('stream got2.1');
			videoEl.srcObject = stream;
			console.log('stream got2.2');
			videoEl.style.width = '100%';
			videoEl.volume = 0;
			console.log('stream got 2.5')
			var videoElCon = document.createElement('DIV');
			videoElCon.style.position = 'fixed';
			videoElCon.style.width = '100px';
			videoElCon.style.height = '100px';
			videoElCon.style.top = '0';
			videoElCon.style.left = '0';
			videoElCon.style.background = 'green';
			videoElCon.style.zIndex = '999999999999';
			console.log('stream got 3')
			videoElCon.appendChild(videoEl);
			document.body.appendChild(videoElCon);
			videoEl.play();*/

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
			socket.on('participantConnected', function (participant){
				console.log('participantConnected', participant);

				socketParticipantConnected().initPeerConnection(participant);

				//iosrtcSocketParticipantConnected().initPeerConnection(participant);

			});

			socket.on('roomParticipants', function (participantsList){
				console.log('roomParticipants', participantsList);
				/*for(var p in participantsList) {
					var participantData = participantsList[p];
					if(participantData.iosrtc == true || (typeof cordova != 'undefined' && _isiOS)) {
						/!*socketParticipantConnected(participantData, function (localDescription) {
							sendMessage({
								name: localParticipant.identity,
								targetSid: participantData.sid,
								type: "offer",
								sdp: localDescription
							});
						});*!/
						iosrtcSocketParticipantConnected().initPeerConnection(participantData);
					}
				}*/

			});

			socket.on('participantDisconnected', function (sid){
				if(_debug) console.log('participantDisconnected');
				var existingParticipant = roomParticipants.filter(function (roomParticipant) {
					return roomParticipant.sid == sid;
				})[0];
				if(_debug) console.log('participantDisconnected', existingParticipant);

				if(existingParticipant != null) {
					if(existingParticipant.RTCPeerConnection != null) existingParticipant.RTCPeerConnection.close();
					participantDisconnected(existingParticipant);
				}
			});


			socket.on('signalling', function (message){
				if(_debug) console.log('signalling message', message)
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

			socket.on('confirmOnlineStatus', function (message){

				if(message.type == 'request') {
					if(_debug) console.log('GOT confirmOnlineStatus REQUEST', message)

					socket.emit('confirmOnlineStatus', {
						'type': 'answer',
						'targetSid': message.fromSid
					});
				} else if (message.type == 'answer') {
					if(_debug) console.log('GOT confirmOnlineStatus ANSWER', message)

					var existingParticipant = roomParticipants.filter(function (roomParticipant) {
						return roomParticipant.sid == message.fromSid;
					})[0];

					existingParticipant.online = true;
					existingParticipant.latestOnlineTime = performance.now();
				}
			});
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
			for (let p in roomParticipants) {
				let peerConnection = roomParticipants[p].RTCPeerConnection;

				if (!roomParticipants[p].isLocal && peerConnection != null) {
					peerConnection.createOffer({ 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true })
						.then(function(offer) {
							if(_debug) console.log('newPeerConnection.setLocalDescription', offer)
							//if(_debug) console.log('newPeerConnection RTCPeerConnection ' + (JSON.stringify(roomParticipants[p].RTCPeerConnection)))
							//offer.sdp = setH264AsPreffered(offer.sdp);
							let localDescription;
							if(typeof cordova != 'undefined' && _isiOS) {
								localDescription = new RTCSessionDescription(offer);
							} else {
								localDescription = offer;
							}
							return peerConnection.setLocalDescription(localDescription).then(function () {
								//if(_debug) console.log('newPeerConnection.sendMessage' + (JSON.stringify(peerConnection.localDescription.sdp)))
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
							console.error(error);
							console.log('2430 EEEEEEERRRRRRRRROOOOOOOOOOOOOOOOOOOOOOOOOOOOORRRRRRRR: ' + error);
						});
				}
			}

		}

		function socketParticipantConnected() {


			function createPeerConnection(participant) {
				if(_debug) console.log('socketParticipantConnected ', participant)

				var config = pc_config;
				if(participant.isiOS) config.sdpSemantics = "plan-b";
				if(_debug) console.log('socketParticipantConnected ', config);
				var newPeerConnection = new RTCPeerConnection(config);

				var localTracks = localParticipant.tracks;
				if(_debug) console.log('socketParticipantConnected ', localTracks)


				if (_debug) console.log('socketParticipantConnected cameraIsEnabled = ' + app.conferenceControl.micIsEnabled())
				if(app.conferenceControl.cameraIsEnabled()){


					if('ontrack' in newPeerConnection){
						for (var t in localTracks) {
							if (_debug) console.log('socketParticipantConnected cameraIsEnabled ' + localTracks[t].kind)

							if (localTracks[t].kind == 'video') newPeerConnection.addTrack(localTracks[t].mediaStreamTrack);
						}

					} else {
						if(_debug) console.log('socketParticipantConnected videoStream' + (localParticipant.videoStream != null))
						if(localParticipant.videoStream != null) newPeerConnection.addStream(localParticipant.videoStream);
					}
				}

				if (_debug) console.log('socketParticipantConnected micIsEnabled = ' + app.conferenceControl.micIsEnabled())
				if(app.conferenceControl.micIsEnabled()){

					if('ontrack' in newPeerConnection){
						for (var t in localTracks) {
							if (_debug) console.log('socketParticipantConnected cameraIsEnabled ' + localTracks[t].kind)

							if(localTracks[t].kind == 'audio') newPeerConnection.addTrack(localTracks[t].mediaStreamTrack);
						}

					} else {
						if(_debug) console.log('socketParticipantConnected audioStream' + (localParticipant.videoStream != null))

						if(localParticipant.audioStream != null) newPeerConnection.addStream(localParticipant.audioStream);
					}
				}

				newPeerConnection.onsignalingstatechange = function (e) {
					if(_debug) console.log('socketParticipantConnected onsignalingstatechange = ' + newPeerConnection.signalingState )

					if(newPeerConnection.signalingState == 'stable') {
						participant.isNegotiating = false;

						for(var i = participant.iceCandidatesQueue.length - 1; i >= 0 ; i--){
							if(participant.iceCandidatesQueue[i] != null) {
								newPeerConnection.addIceCandidate(participant.iceCandidatesQueue[i].candidate);
								participant.iceCandidatesQueue[i] = null;

								participant.iceCandidatesQueue.splice(i, 1);
							}
						}
					}
				};

				newPeerConnection.oniceconnectionstatechange = function (e) {
					if(_debug) console.log('socketParticipantConnected oniceconnectionstatechange', newPeerConnection.iceConnectionState, newPeerConnection.signalingState)

					//if(oldHandler != null) oldHandler();
					if(newPeerConnection.iceConnectionState == 'connected' || newPeerConnection.iceConnectionState == 'completed') {
						participant.isNegotiating = false;
					}

				};

				newPeerConnection.onicecandidate = function (e) {
					gotIceCandidate(e, participant);
				};
				function createOffer(){
					//if(_debug) console.log('createOffer', newPeerConnection.connectionState, newPeerConnection.iceConnectionState, newPeerConnection.iceGatheringState, newPeerConnection.signalingState)

					//if (newPeerConnection._negotiating == true) return;
					if(_debug) console.log('createOffer')
					participant.isNegotiating = true;
					//newPeerConnection._negotiating = true;
					newPeerConnection.createOffer({ 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true })
						.then(function(offer) {
							if(_debug) console.log('newPeerConnection.setLocalDescription', offer)
							//offer.sdp = setH264AsPreffered(offer.sdp);
							var localDescription;
							if(typeof cordova != 'undefined' && _isiOS) {
								localDescription = new RTCSessionDescription(offer);
							} else {
								localDescription = offer;
							}

							if(_isiOS){
								console.log('offerReceived localDescription oldSdp: ' + localDescription.sdp);
								//localDescription.sdp = removeInactiveTracksFromSDP(localDescription.sdp);
								console.log('offerReceived localDescription newSdp: ' + localDescription.sdp);
							}

							return newPeerConnection.setLocalDescription(localDescription).then(function () {
								if(_debug) console.log('createOffer setLocalDescription ', newPeerConnection.localDescription)
								if(_debug) console.log('createOffer newPeerConnection.sendMessage ' + newPeerConnection.localDescription.sdp)
								//var sdp = setH264AsPreffered(newPeerConnection.localDescription.sdp)
								//callback(newPeerConnection.localDescription.sdp);
								sendMessage({
									name: localParticipant.identity,
									targetSid: participant.sid,
									type: "offer",
									sdp: newPeerConnection.localDescription.sdp
								});
								//newPeerConnection._negotiating = false;
							});
						})
						.catch(function(error) {
							console.error(error);
							console.log('2450 EEEEEEERRRRRRRRROOOOOOOOOOOOOOOOOOOOOOOOOOOOORRRRRRRR: ' + error);
						});
				}

				if('ontrack' in newPeerConnection) {
					newPeerConnection.ontrack = function (e) {
						rawTrackSubscribed(e, participant);
					};
				} else {
					console.log('socketParticipantConnected onaddstream')
					newPeerConnection.onaddstream = function (e) {
						rawStreamSubscribed(e, participant);
					};
				}

				var dataChannel = newPeerConnection.createDataChannel('dataTrack', {reliable: true})
				setChannelEvents(dataChannel, participant);
				participant.dataTrack = dataChannel;

				createOffer();
				newPeerConnection.onnegotiationneeded = function (e) {
					if(_debug) console.log('ONNEGOTIATIONNEEDED====================================================== ')
					if(_debug) console.log('ONNEGOTIATIONNEEDED pc isNegotiating = ' + participant.isNegotiating)

					if(_debug) console.log('onnegotiationneeded 0 ' + (newPeerConnection.connectionState) + '--' + (newPeerConnection.signalingState) + '--' + (newPeerConnection.iceConnectionState) + '--' + (newPeerConnection.iceGatheringState));
					if(participant.isNegotiating) {
						return;
					}
					if(newPeerConnection.connectionState == 'new' && newPeerConnection.iceConnectionState == 'new' && newPeerConnection.iceGatheringState == 'new') return;
					if(_debug) console.log('onnegotiationneeded 1')

					createOffer();
				};

				//participantConnected(participant);
				return newPeerConnection;
			}

			function init(participantData) {
				console.log('%c sendingPeerConnection participantData', 'background:red;color:white');

				var newParticipant = new Participant();
				newParticipant.iosrtc = true;
				newParticipant.sid = participantData.sid;
				newParticipant.identity = participantData.username;
				if(participantData.isiOS) newParticipant.isiOS = true;
				participantConnected(newParticipant);
				newParticipant.RTCPeerConnection = createPeerConnection(newParticipant);

			}

			return {
				initPeerConnection: init
			}
		}

		function setChannelEvents(dataChannel, participant) {
			dataChannel.onerror = function (err) {
				console.error(err);
				console.log(err);
			};
			dataChannel.onclose = function () {
				console.log('dataChannel close');
			};
			dataChannel.onmessage = function (e) {
				processDataTrackMessage(e.data, participant);
			};
			dataChannel.onopen = function (e) {};
		}

		function iosrtcSocketParticipantConnected() {

			function createPeerForSendingMedia(participant) {
				if(_debug) console.log('iosrtcSocketParticipantConnected sendingPeerConnection', participant)

				var sendingPeerConnection;
				if(typeof cordova != 'undefined' && _isiOS) {
					sendingPeerConnection = new cordova.plugins.iosrtc.RTCPeerConnection(pc_config);
				} else sendingPeerConnection = new RTCPeerConnection(pc_config);

				sendingPeerConnection.onicecandidate = function (e) {
					gotIceCandidate(e, participant, 'forReceivingMedia');
				};

				sendingPeerConnection.onsignalingstatechange = function (e) {
					if(sendingPeerConnection.signalingState == 'stable') {
						for (var i = 0; i < participant.iceCandidatesQueue.length; i++) {
							if(participant.iceCandidatesQueue[i] != null && sendingPeerConnection == participant.iceCandidatesQueue[i].peerConnection) {
								sendingPeerConnection.addIceCandidate(participant.iceCandidatesQueue[i].candidate);
								participant.iceCandidatesQueue[i] = null;
							}
						}
					}
					console.log('%c sendingPeerConnection onsignalingstatechange', 'background:red;color:white', sendingPeerConnection.signalingState, sendingPeerConnection.connectionState, sendingPeerConnection.iceConnectionState)
				};


				if('ontrack' in sendingPeerConnection) {
					sendingPeerConnection.ontrack = function (e) {
						console.log('%c sendingPeerConnection ontrack', 'background:red;color:white')
						rawTrackSubscribed(e, participant);
					};
				} else {
					sendingPeerConnection.onaddstream = function (e) {
						console.log('%c sendingPeerConnection onaddstream', 'background:red;color:white')
						rawStreamSubscribed(e, participant);
					};
				}

				sendingPeerConnection.onnegotiationneeded = function (e) {
					console.log('%c sendingPeerConnection onnegotiationneeded', 'background:red;color:white');
					if(sendingPeerConnection.connectionState == 'new' && sendingPeerConnection.iceConnectionState == 'new' && sendingPeerConnection.iceGatheringState == 'new') return;

					createOffer();
				};

				var localTracks = localParticipant.tracks;
				console.log('%c sendingPeerConnection before adding tracks', 'background:red;color:white');

				if(app.conferenceControl.cameraIsEnabled()){
					console.log('%c sendingPeerConnection cameraIsEnabled', 'background:red;color:white');

					if (typeof cordova != 'undefined' && _isiOS) {
						console.log('%c sendingPeerConnection cameraIsEnabled cordova videoStream' + (localParticipant.videoStream != null), 'background:red;color:white');

						if (localParticipant.videoStream != null) {
							console.log('%c sendingPeerConnection addStream video', 'background:red;color:white');

							//setTimeout(function () {
							sendingPeerConnection.addStream(localParticipant.videoStream);

							//}, 4000)
						}
						if (localParticipant.audioStream != null) {
							console.log('%c sendingPeerConnection addStream audio', 'background:red;color:white');

							sendingPeerConnection.addStream(localParticipant.audioStream);
						}
					} else {
						console.log('%c sendingPeerConnection add local tracks', 'background:red;color:white');
						//if(_debug) console.log('ANSWER onnegotiationneeded', sendingPeerConnection.connectionState, sendingPeerConnection.iceConnectionState, sendingPeerConnection.iceGatheringState, sendingPeerConnection.signalingState)

						for (let t in localTracks) {
							//if (localTracks[t].kind == 'video') sendingPeerConnection.addStream(localTracks[t].stream);
							if (localTracks[t].kind == 'video') sendingPeerConnection.addTrack(localTracks[t].mediaStreamTrack, localTracks[t].stream);
						}

					}
				}
				if(app.conferenceControl.micIsEnabled()){
					for (var t in localTracks) {
						if(localTracks[t].kind == 'audio') sendingPeerConnection.addTrack(localTracks[t].mediaStreamTrack);
					}
				}

				var dataChannel = sendingPeerConnection.createDataChannel('dataTrack', {reliable: true})
				setChannelEvents(dataChannel, participant);
				participant.dataTrack = dataChannel;

				function createOffer(){
					//if(_debug) console.log('createOffer', sendingPeerConnection.connectionState, sendingPeerConnection.iceConnectionState, sendingPeerConnection.iceGatheringState, sendingPeerConnection.signalingState)

					//if (sendingPeerConnection._negotiating == true) return;
					if(_debug) console.log('createOffer')

					console.log('%c sendingPeerConnection before createOffer', 'background:red;color:white');
					//sendingPeerConnection._negotiating = true;
					sendingPeerConnection.createOffer({ 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true })
						.then(function(offer) {
							console.log('%c sendingPeerConnection createOffer', 'background:red;color:white', offer);
							//offer.sdp = setH264AsPreffered(offer.sdp);
							var localDescription;
							if(typeof cordova != 'undefined' && _isiOS) {
								//localDescription = new RTCSessionDescription(offer);
								localDescription = new cordova.plugins.iosrtc.RTCSessionDescription(offer);
							} else {
								localDescription = offer;
							}
							return sendingPeerConnection.setLocalDescription(localDescription).then(function () {
								if(_debug) console.log('createOffer sendingPeerConnection offer sendMessage ' + sendingPeerConnection.localDescription.sdp, 'background:red;color:white')
								//var sdp = setH264AsPreffered(sendingPeerConnection.localDescription.sdp)
								sendMessage({
									name: localParticipant.identity,
									targetSid: participant.sid,
									type: "offer",
									sdp: sendingPeerConnection.localDescription.sdp,
									iosrtc: true,
									purpose: "forReceivingMedia"
								});
								//sendingPeerConnection._negotiating = false;
							});
						})
						.catch(function(error) {
							console.error(error);
							console.log('2450 EEEEEEERRRRRRRRROOOOOOOOOOOOOOOOOOOOOOOOOOOOORRRRRRRR: ' + error);
						});
				}

				createOffer();

				return sendingPeerConnection;

			}

			function createPeerForReceivingMedia(participant) {
				if(_debug) console.log('socketParticipantConnected ', participant)

				var newPeerConnection = new RTCPeerConnection(pc_config);

				var localTracks = localParticipant.tracks;
				if(_debug) console.log('socketParticipantConnected ', localTracks)


				newPeerConnection.onicecandidate = function (e) {
					gotIceCandidate(e, participant, 'forSendingMedia');
				};
				/*newPeerConnection.onconnectionstatechange = function (e) {
					console.log('createPeerForReceivingMedia onconnectionstatechange', newPeerConnection.connectionState, newPeerConnection.iceConnectionState, newPeerConnection.iceGatheringState, newPeerConnection.signalingState)
				};
				newPeerConnection.onicegatheringstatechange = function (e) {
					console.log('createPeerForReceivingMedia onicegatheringstatechange', newPeerConnection.iceGatheringState, newPeerConnection.connectionState, newPeerConnection.iceConnectionState, newPeerConnection.signalingState)
				};
				newPeerConnection.onsignalingstatechange = function (e) {
					if(newPeerConnection.signalingState == 'stable') {
						for (var i = 0; i < participant.iceCandidatesQueue.length; i++) {
							if(participant.iceCandidatesQueue[i] != null && newPeerConnection == participant.iceCandidatesQueue[i].peerConnection) {
								newPeerConnection.addIceCandidate(participant.iceCandidatesQueue[i].candidate);
								participant.iceCandidatesQueue[i] = null;
							}
						}
					}
					console.log('createPeerForReceivingMedia onsignalingstatechange', newPeerConnection.signalingState, newPeerConnection.connectionState, newPeerConnection.iceConnectionState)
				};*/
				function createOffer(){
					//if(_debug) console.log('createOffer', newPeerConnection.connectionState, newPeerConnection.iceConnectionState, newPeerConnection.iceGatheringState, newPeerConnection.signalingState)

					//if (newPeerConnection._negotiating == true) return;
					if(_debug) console.log('createOffer')

					//newPeerConnection._negotiating = true;
					newPeerConnection.createOffer()
						.then(function(offer) {
							if(_debug) console.log('newPeerConnection.setLocalDescription', offer)
							//offer.sdp = setH264AsPreffered(offer.sdp);
							var localDescription;
							if(typeof cordova != 'undefined' && _isiOS) {
								localDescription = new RTCSessionDescription(offer);
							} else {
								localDescription = offer;
							}
							return newPeerConnection.setLocalDescription(localDescription).then(function () {
								if(_debug) console.log('createOffer newPeerConnection.sendMessage ' + newPeerConnection.localDescription.sdp)
								//var sdp = setH264AsPreffered(newPeerConnection.localDescription.sdp)
								sendMessage({
									name: localParticipant.identity,
									targetSid: participant.sid,
									type: "offer",
									sdp: newPeerConnection.localDescription.sdp,
									iosrtc: true,
									purpose: "forSendingMedia"
								});								//newPeerConnection._negotiating = false;
							});
						})
						.catch(function(error) {
							console.error(error);
							console.log('2450 EEEEEEERRRRRRRRROOOOOOOOOOOOOOOOOOOOOOOOOOOOORRRRRRRR: ' + error);
						});
				}

				if('ontrack' in newPeerConnection) {
					newPeerConnection.ontrack = function (e) {
						rawTrackSubscribed(e, participant);
					};
				} else {
					console.log('socketParticipantConnected onaddstream')
					newPeerConnection.onaddstream = function (e) {
						rawStreamSubscribed(e, participant);
					};
				}

				//var dataChannel = newPeerConnection.createDataChannel('dataTrack', {reliable: true})
				//setChannelEvents(dataChannel, participant);
				//participant.dataTrack = dataChannel;

				createOffer();
				newPeerConnection.onnegotiationneeded = function (e) {
					if(_debug) console.log('onnegotiationneeded 0')
					if(newPeerConnection.connectionState == 'new' && newPeerConnection.iceConnectionState == 'new' && newPeerConnection.iceGatheringState == 'new') return;
					if(_debug) console.log('onnegotiationneeded 1')

					createOffer();
				};

				return newPeerConnection;
			}

			function init(participantData) {
				console.log('%c sendingPeerConnection participantData', 'background:red;color:white');

				var newParticipant = new Participant();
				newParticipant.iosrtc = true;
				newParticipant.sid = participantData.sid;
				newParticipant.identity = participantData.username;
				participantConnected(newParticipant);
				newParticipant.RTCPeerConnection = createPeerForSendingMedia(newParticipant);
				//newParticipant.receivingRTCPeerConnection = createPeerForReceivingMedia(newParticipant);

			}

			return {
				initPeerConnection: init
			}
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
			console.log('removeInactiveTracksFromSDP tracks ' + JSON.stringify(tracks));
			console.log('removeInactiveTracksFromSDP activeTrackId ' + activeTrackId);
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

			return ;
		}

		function offerReceived() {

			function createPeerConnection(senderParticipant) {
				var config = pc_config;
				if(senderParticipant.isiOS) config.sdpSemantics = "plan-b";
				var newPeerConnection = new RTCPeerConnection(config);

				if('ontrack' in newPeerConnection) {
					console.log('offerReceived ontrack')

					newPeerConnection.ontrack = function (e) {
						rawTrackSubscribed(e, senderParticipant);
					};
				} else {
					console.log('offerReceived onaddstream')
					newPeerConnection.onaddstream = function (e) {
						rawStreamSubscribed(e, senderParticipant);
					};
				}

				newPeerConnection.ondatachannel = function (evt) {
					senderParticipant.dataTrack = evt.channel;
					setChannelEvents(evt.channel, senderParticipant);
				};

				/*newPeerConnection.onconnectionstatechange = function (e) {
					console.log('offerReceived onconnectionstatechange ' + newPeerConnection.connectionState);
				}*/

				newPeerConnection.onsignalingstatechange = function (e) {
					if(_debug) console.log('offerReceived onsignalingstatechange', newPeerConnection.connectionState, newPeerConnection.signalingState)

					if(newPeerConnection.signalingState == 'stable') {
						senderParticipant.isNegotiating = false;
						for(var i = senderParticipant.iceCandidatesQueue.length - 1; i >= 0 ; i--){
							if(senderParticipant.iceCandidatesQueue[i] != null) {
								newPeerConnection.addIceCandidate(senderParticipant.iceCandidatesQueue[i].candidate);
								senderParticipant.iceCandidatesQueue[i] = null;

								senderParticipant.iceCandidatesQueue.splice(i, 1);
							}
						}
					}
				};

				newPeerConnection.onconnectionstatechange = function (e) {
					if(_debug) console.log('offerReceived onconnectionstatechange', newPeerConnection.connectionState, newPeerConnection.signalingState)

					if(newPeerConnection.connectionState == 'connected') {
						senderParticipant.isNegotiating = false;
					}

				};

				newPeerConnection.onicecandidate = function (e) {
					gotIceCandidate(e, senderParticipant);
				};

				var createOffer = function(peerConnection) {
					if(_debug) console.log('onnegotiationneeded 1 ' + (peerConnection == senderParticipant.RTCPeerConnection))

					if(_debug) console.log('onnegotiationneeded states', peerConnection.connectionState, peerConnection.iceConnectionState, peerConnection.iceGatheringState, peerConnection.signalingState)


					senderParticipant.isNegotiating = true;
					senderParticipant.RTCPeerConnection.createOffer({ 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true })
						.then(function(offer) {
							if(_debug) console.log('onnegotiationneeded 2')
							//if(_debug) console.log(JSON.stringify(offer))
							//offer.sdp = setH264AsPreffered(offer.sdp);
							var localDescription;
							if(typeof cordova != 'undefined' && _isiOS) {
								localDescription = offer;
							} else {
								localDescription = offer;
							}

							if(_isiOS){
								console.log('onnegotiationneeded createOffer oldSdp: ' + localDescription.sdp);
								//localDescription.sdp = removeInactiveTracksFromSDP(localDescription.sdp);
								console.log('onnegotiationneeded createOffer newSdp: ' + localDescription.sdp);
							}


							return peerConnection.setLocalDescription(localDescription).then(function () {
								if(_debug) console.log('offer localDescription')
								if(_debug) console.log(senderParticipant.RTCPeerConnection.localDescription.sdp)

								sendMessage({
									name: localParticipant.identity,
									targetSid: senderParticipant.sid,
									type: "offer",
									sdp: senderParticipant.RTCPeerConnection.localDescription.sdp,
								});

							});
						})

						.catch(function(error) {
							console.error(error);
							console.log('2578 EEEEEEERRRRRRRRROOOOOOOOOOOOOOOOOOOOOOOOOOOOORRRRRRRR: ' + error);
						});

				}


				//setTimeout(function(){

				var dataChannel = newPeerConnection.createDataChannel('dataTrack', {reliable: true})
				setChannelEvents(dataChannel, senderParticipant);
				senderParticipant.dataTrack = dataChannel;
				//}, 4000)

				newPeerConnection.onnegotiationneeded = function (e) {
					if(_debug) console.log('ONNEGOTIATIONNEEDED======================================================', senderParticipant.isNegotiating)
					if(_debug) console.log('ONNEGOTIATIONNEEDED connectionState', newPeerConnection.connectionState, newPeerConnection.signalingState)


					if(senderParticipant.isNegotiating) {
						return;
					}
					if(newPeerConnection.connectionState == 'new' && newPeerConnection.iceConnectionState == 'new' && newPeerConnection.iceGatheringState == 'new') return;

					createOffer(newPeerConnection);
				};

				return newPeerConnection;

			}

			function publishLocalAudio(RTCPeerConnection){
				var localTracks = localParticipant.tracks;
				if (_debug) console.log('publishLocalMedia micIsEnabled = ' + app.conferenceControl.micIsEnabled());

				if(app.conferenceControl.micIsEnabled()){
					if (_debug) console.log('publishLocalMedia mic');

					var audioSenders = RTCPeerConnection.getSenders().filter(function (sender) {
						return sender.track && sender.track.kind == 'audio';
					});

					var cancel = false;
					for(var s = audioSenders.length - 1; s >= 0 ; s--){

						for(let i = localParticipant.tracks.length - 1; i >= 0 ; i--){

							if(localParticipant.tracks[i].mediaStreamTrack.id == audioSenders[s].track.id) {
								console.log('enableAudioTracks CANCEL ADDING ' + localParticipant.tracks.length);
								cancel = true;
							}
						}
					}
					if(cancel) return;

					if ('ontrack' in RTCPeerConnection) {
						for (let t in localTracks) {
							if (_debug) console.log('offerReceived localTracks add audioTrack');

							if(localTracks[t].kind == 'audio') RTCPeerConnection.addTrack(localTracks[t].mediaStreamTrack);
						}
					} else {
						if (localParticipant.audioStream != null) {
							if (_debug) console.log('offerReceived localTracks add audioStream');
							RTCPeerConnection.addStream(localParticipant.audioStream);
						}
					}

				}
			}

			function publishLocalVideo(RTCPeerConnection) {
				var localTracks = localParticipant.tracks;
				if (_debug) console.log('publishLocalMedia cameraIsEnabled = ' + app.conferenceControl.cameraIsEnabled());

				if(app.conferenceControl.cameraIsEnabled()){
					console.log('offerReceived newPeerConnection camera ' + (localParticipant.videoStream != null));
					if ('ontrack' in RTCPeerConnection) {
						console.log('offerReceived camera 2');
						//if(_debug) console.log('ANSWER onnegotiationneeded', newPeerConnection.connectionState, newPeerConnection.iceConnectionState, newPeerConnection.iceGatheringState, newPeerConnection.signalingState)

						for (let t in localTracks) {
							console.log('offerReceived camera 3');
							//if (localTracks[t].kind == 'video') newPeerConnection.addStream(localTracks[t].stream);
							if (localTracks[t].kind == 'video') RTCPeerConnection.addTrack(localTracks[t].mediaStreamTrack);
						}

					} else {
						if (localParticipant.videoStream != null) {
							if (_debug) console.log('offerReceived localTracks add videoStream');
							RTCPeerConnection.addStream(localParticipant.videoStream);
						}
					}
				}
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
				if (_debug) console.log('publishLocalMedia');

				try {
					var err = (new Error);
					console.log(err.stack);
				} catch (e) {

				}
				publishLocalVideo(RTCPeerConnection);
				publishLocalAudio(RTCPeerConnection);
			}

			function process(message) {
				if(_debug) console.log('offerReceived purpose: ' + message.purpose);
				if(_debug) console.log('offerReceived', message, roomParticipants);
				if(_debug) console.log(JSON.stringify(message));
				var senderParticipant = roomParticipants.filter(function (existingParticipant) {
					return existingParticipant.sid == message.fromSid && existingParticipant.RTCPeerConnection;
				})[0];

				var isVideoInOffer = message.sdp.indexOf('m=video') != -1 || message.sdp.indexOf('mid:video') != -1;
				var isAudioInOffer = message.sdp.indexOf('m=audio') != -1 || message.sdp.indexOf('mid:audio') != -1;

				var firstTimeOffer = false;
				if(_debug) console.log('offerReceived firstTimeOffer: ' + (senderParticipant == null));
				if(_debug) console.log('offerReceived isVideoInOffer: ' + isVideoInOffer);
				if(_debug) console.log('offerReceived isAudioInOffer: ' + isAudioInOffer);

				if(senderParticipant == null && senderParticipant != localParticipant) {
					firstTimeOffer = true;
					if(_debug) console.log('offerReceived initPeerConnection');
					senderParticipant = new Participant();
					senderParticipant.sid = message.fromSid;
					senderParticipant.identity = message.name;
					if(message.isiOS != null) senderParticipant.isiOS = true;
					participantConnected(senderParticipant);
				}



				if(senderParticipant.RTCPeerConnection == null || senderParticipant.RTCPeerConnection.connectionState =='closed') {
					senderParticipant.RTCPeerConnection = createPeerConnection(senderParticipant);

					if(_debug) console.log('offerReceived createPeerConnection ' + senderParticipant.RTCPeerConnection.signalingState);
					if(isVideoInOffer) publishLocalVideo(senderParticipant.RTCPeerConnection);
					if(isAudioInOffer) publishLocalAudio(senderParticipant.RTCPeerConnection);

					if(!isVideoInOffer || !isAudioInOffer) {
						if(_debug) console.log('offerReceived publishLocalMedia 2');

						var oldHandler = senderParticipant.RTCPeerConnection.oniceconnectionstatechange;
						senderParticipant.RTCPeerConnection.oniceconnectionstatechange = function (e) {
							if(_debug) console.log('offerReceived oniceconnectionstatechange', senderParticipant.RTCPeerConnection.iceConnectionState, senderParticipant.RTCPeerConnection.signalingState)

							//if(oldHandler != null) oldHandler();
							if(senderParticipant.RTCPeerConnection.iceConnectionState == 'connected') {
								senderParticipant.isNegotiating = false;
								if(!isVideoInOffer) publishLocalVideo(senderParticipant.RTCPeerConnection);
								if(!isAudioInOffer) publishLocalAudio(senderParticipant.RTCPeerConnection);

								senderParticipant.RTCPeerConnection.oniceconnectionstatechange = oldHandler != null ? oldHandler : null;
							}

						};
					}

				}

				var description;
				if(typeof cordova != 'undefined' && _isiOS) {
					description = new RTCSessionDescription({type: message.type, sdp:message.sdp});
				} else {
					description =  {type: message.type, sdp:message.sdp};
				}


				console.log('offerReceived.RTCPeerConnection');
				senderParticipant.isNegotiating = true;
				senderParticipant.RTCPeerConnection.setRemoteDescription(description).then(function () {
					console.log('offerReceived setRemoteDescription ');

					senderParticipant.RTCPeerConnection.createAnswer()
						.then(function(answer) {
							console.log('offerReceived createAnswer answer', answer);

							//if(_debug) console.log('ANSWER0 createAnswer', senderParticipant.RTCPeerConnection.connectionState, senderParticipant.RTCPeerConnection.iceConnectionState, senderParticipant.RTCPeerConnection.iceGatheringState, senderParticipant.RTCPeerConnection.signalingState)
							//offer.sdp = setH264AsPreffered(offer.sdp);
							//answer.type = 'offer';

							//answer.sdp = answer.sdp.replace(/UDP\/TLS\/RTP\/SAVP/g, "RTP\/SAVPF");

							if(_isiOS){
								console.log('offerReceived createAnswer oldSdp: ' + answer.sdp);
								//answer.sdp = removeInactiveTracksFromSDP(answer.sdp);
								console.log('offerReceived createAnswer newSdp: ' + answer.sdp);
							}

							return senderParticipant.RTCPeerConnection.setLocalDescription(answer).then(function () {
								//if(_debug) console.log('ANSWER1 createAnswer', senderParticipant.RTCPeerConnection.connectionState, senderParticipant.RTCPeerConnection.iceConnectionState, senderParticipant.RTCPeerConnection.iceGatheringState, senderParticipant.RTCPeerConnection.signalingState)

								sendMessage({
									name: localParticipant.identity,
									targetSid: message.fromSid,
									type: "answer",
									sdp: senderParticipant.RTCPeerConnection.localDescription,
								});

								setTimeout(function(){
									//publishLocalMedia(senderParticipant.RTCPeerConnection);

								}, 3000);
								//callback(peerConnection.localDescription, senderParticipant);
							});
						})

						.catch(function(error) {
							console.error(error);
							console.log('3090EEEEEEERRRRRRRRROOOOOOOOOOOOOOOOOOOOOOOOOOOOORRRRRRRR: ' + error);
						});
				});
			}

			return {
				processOffer: process
			}
		}


		function iosrtcOfferReceived() {

			function createPeerForSendingMedia(senderParticipant) {
				console.log('%c iosrtcOfferReceived sendingPeerConnection', 'background:red;color:white');

				var sendingPeerConnection;
				if(typeof cordova != 'undefined' && _isiOS) {
					sendingPeerConnection = new RTCPeerConnection(pc_config);
				} else sendingPeerConnection = new RTCPeerConnection(pc_config);

				sendingPeerConnection.onconnectionstatechange = function (e) {
					console.log('%c iosrtcOfferReceived sendingPeerConnection onconnectionstatechange', 'background:red;color:white');
					if (sendingPeerConnection) console.log('onconnectionstatechange ' + sendingPeerConnection.connectionState);
				}

				sendingPeerConnection.onicecandidate = function (e) {
					//console.log('%c iosrtcOfferReceived sendingPeerConnection onicecandidate', 'background:red;color:white');
					gotIceCandidate(e, senderParticipant, 'forReceivingMedia');
				};

				/*sendingPeerConnection.onsignalingstatechange = function (e) {
					if(sendingPeerConnection.signalingState == 'stable') {
						for (var i = 0; i < senderParticipant.iceCandidatesQueue.length; i++) {
							if(senderParticipant.iceCandidatesQueue[i] != null && sendingPeerConnection == senderParticipant.iceCandidatesQueue[i].peerConnection) {
								sendingPeerConnection.addIceCandidate(senderParticipant.iceCandidatesQueue[i].candidate);
								senderParticipant.iceCandidatesQueue[i] = null;
							}
						}
					}
					console.log('createPeerForReceivingMedia onsignalingstatechange', sendingPeerConnection.signalingState, sendingPeerConnection.connectionState, sendingPeerConnection.iceConnectionState)
				};*/

				var onNegotiationNeeded = function(peerConnection) {
					if(_debug) console.log('onnegotiationneeded 1 ' + (peerConnection == senderParticipant.RTCPeerConnection))

					//if(_debug) console.log('ANSWER onnegotiationneeded', e.target, e.target.connectionState, e.target.iceConnectionState, e.target.iceGatheringState, e.target.signalingState)


					if(peerConnection.connectionState == 'new' && peerConnection.iceConnectionState == 'new' && peerConnection.iceGatheringState == 'new') return;
					console.log('%c iosrtcOfferReceived sendingPeerConnection onnegotiationneeded before create offer', 'background:red;color:white');

					senderParticipant.RTCPeerConnection.createOffer({ 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true })
						.then(function(offer) {
							console.log('%c iosrtcOfferReceived sendingPeerConnection onnegotiationneeded create offer', 'background:red;color:white');
							//if(_debug) console.log(JSON.stringify(offer))
							//offer.sdp = setH264AsPreffered(offer.sdp);
							var localDescription;
							if(typeof cordova != 'undefined' && _isiOS) {
								localDescription = new cordova.plugins.iosrtc.RTCSessionDescription(offer);
							} else {
								localDescription = offer;
							}

							return peerConnection.setLocalDescription(localDescription).then(function () {
								console.log('%c iosrtcOfferReceived sendingPeerConnection onnegotiationneeded send offer', 'background:red;color:white');

								if(_debug) console.log('offer localDescription')
								if(_debug) console.log(senderParticipant.RTCPeerConnection.localDescription.sdp)

								sendMessage({
									name: localParticipant.identity,
									targetSid: senderParticipant.sid,
									type: "offer",
									sdp: senderParticipant.RTCPeerConnection.localDescription.sdp,
									purpose: "forReceivingMedia"
								});

							});
						})

						.catch(function(error) {
							console.error(error);
							console.log('2578 EEEEEEERRRRRRRRROOOOOOOOOOOOOOOOOOOOOOOOOOOOORRRRRRRR: ' + error);
						});

				}
				//setTimeout(function(){
				var localTracks = localParticipant.tracks;

				if(app.conferenceControl.cameraIsEnabled()){
					console.log('iosrtcOfferReceived sendingPeerConnection camera');
					if (typeof cordova != 'undefined' && _isiOS) {
						if (localParticipant.videoStream != null) {
							if (_debug) console.log('offerReceived localTracks add videoStream');

							//setTimeout(function () {
							sendingPeerConnection.addStream(localParticipant.videoStream);

							//}, 4000)
						}
						if (localParticipant.audioStream != null) {
							if (_debug) console.log('offerReceived localTracks add audioStream');

							sendingPeerConnection.addStream(localParticipant.audioStream);
						}
					} else {
						console.log('iosrtcOfferReceived sendingPeerConnection camera 2');
						//if(_debug) console.log('ANSWER onnegotiationneeded', newPeerConnection.connectionState, newPeerConnection.iceConnectionState, newPeerConnection.iceGatheringState, newPeerConnection.signalingState)

						for (let t in localTracks) {
							console.log('iosrtcOfferReceived sendingPeerConnection camera 3');
							//if (localTracks[t].kind == 'video') newPeerConnection.addStream(localTracks[t].stream);
							if (localTracks[t].kind == 'video') sendingPeerConnection.addTrack(localTracks[t].mediaStreamTrack);
						}

					}
				}
				if(app.conferenceControl.micIsEnabled()){
					for (var t in localTracks) {
						if(localTracks[t].kind == 'audio') sendingPeerConnection.addTrack(localTracks[t].mediaStreamTrack);
					}
				}
				//}, 4000)

				sendingPeerConnection.onnegotiationneeded = function (e) {
					console.log('%c iosrtcOfferReceived sendingPeerConnection onnegotiationneeded', 'background:red;color:white');

					onNegotiationNeeded(sendingPeerConnection);
				};





				return sendingPeerConnection;

			}

			function createPeerForReceivingMedia(senderParticipant) {
				var receivingPeerConnection = new RTCPeerConnection(pc_config);

				receivingPeerConnection.onconnectionstatechange = function (e) {
					console.log('%c iosrtcOfferReceived receivingPeerConnection onconnectionstatechange', 'background:green;color:white');
					if (_debug) console.log('receivingPeerConnection onconnectionstatechange ' + receivingPeerConnection.connectionState);

				}

				console.log('check event ' + ('ontrack' in receivingPeerConnection))
				console.log('check event 2' + ('onaddstream' in receivingPeerConnection))
				//if(_isiOS && typeof Q.Cordova != 'undefined') {
				if('ontrack' in receivingPeerConnection) {
					receivingPeerConnection.ontrack = function (e) {
						console.log('%c iosrtcOfferReceived receivingPeerConnection ontrack', 'background:green;color:white');
						rawTrackSubscribed(e, senderParticipant);
					};
				} else {
					console.log('createPeerForReceivingMedia onaddstream');
					receivingPeerConnection.onaddstream = function (e) {
						rawStreamSubscribed(e, senderParticipant);
					};
				}

				receivingPeerConnection.onicecandidate = function (e) {
					//console.log('%c iosrtcOfferReceived receivingPeerConnection onicecandidate', 'background:green;color:white');

					gotIceCandidate(e, senderParticipant, 'forSendingMedia');
				};

				receivingPeerConnection.onsignalingstatechange = function (e) {
					console.log('%c iosrtcOfferReceived receivingPeerConnection onsignalingstatechange', 'background:green;color:white');

					if(receivingPeerConnection.signalingState == 'stable') {
						for (var i = 0; i < senderParticipant.iceCandidatesQueue.length; i++) {
							if(senderParticipant.iceCandidatesQueue[i] != null && receivingPeerConnection == senderParticipant.iceCandidatesQueue[i].peerConnection) {
								receivingPeerConnection.addIceCandidate(senderParticipant.iceCandidatesQueue[i].candidate);
								senderParticipant.iceCandidatesQueue[i] = null;
							}
						}
					}
					console.log('createPeerForReceivingMedia onsignalingstatechange', receivingPeerConnection.signalingState, receivingPeerConnection.connectionState, receivingPeerConnection.iceConnectionState)
				};

				var onNegotiationNeeded = function(peerConnection) {
					if(_debug) console.log('onnegotiationneeded 1 ' + (peerConnection == senderParticipant.RTCPeerConnection))

					//if(_debug) console.log('ANSWER onnegotiationneeded', e.target, e.target.connectionState, e.target.iceConnectionState, e.target.iceGatheringState, e.target.signalingState)


					if(peerConnection.connectionState == 'new' && peerConnection.iceConnectionState == 'new' && peerConnection.iceGatheringState == 'new') return;
					console.log('%c iosrtcOfferReceived receivingPeerConnection before createOffer', 'background:green;color:white');

					senderParticipant.RTCPeerConnection.createOffer({ 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true })
						.then(function(offer) {
							console.log('%c iosrtcOfferReceived receivingPeerConnection createOffer', 'background:green;color:white');

							if(_debug) console.log('onnegotiationneeded 2')
							//if(_debug) console.log(JSON.stringify(offer))
							//offer.sdp = setH264AsPreffered(offer.sdp);
							var localDescription;
							if(typeof cordova != 'undefined' && _isiOS) {
								localDescription = new RTCSessionDescription(offer);
							} else {
								localDescription = offer;
							}

							return peerConnection.setLocalDescription(localDescription).then(function () {
								console.log('%c iosrtcOfferReceived receivingPeerConnection createOffer send', 'background:green;color:white');

								if(_debug) console.log('offer localDescription')
								if(_debug) console.log(senderParticipant.RTCPeerConnection.localDescription.sdp)

								sendMessage({
									name: localParticipant.identity,
									targetSid: senderParticipant.sid,
									type: "offer",
									sdp: senderParticipant.RTCPeerConnection.localDescription.sdp,
									purpose: "forSendingMedia"
								});

							});
						})

						.catch(function(error) {
							console.error(error);
							console.log('2578 EEEEEEERRRRRRRRROOOOOOOOOOOOOOOOOOOOOOOOOOOOORRRRRRRR: ' + error);
						});

				}

				receivingPeerConnection.onnegotiationneeded = function (e) {
					console.log('%c iosrtcOfferReceived receivingPeerConnection onnegotiationneeded', 'background:green;color:white');

					onNegotiationNeeded(receivingPeerConnection);
				};

				receivingPeerConnection.ondatachannel = function (evt) {
					console.log('%c iosrtcOfferReceived receivingPeerConnection ondatachannel', 'background:green;color:white');

					senderParticipant.dataTrack = evt.channel;
					setChannelEvents(evt.channel, senderParticipant);
				};

				return receivingPeerConnection;
			}

			function initPeerConnection(message) {
				var senderParticipant = new Participant();
				senderParticipant.sid = message.fromSid;
				senderParticipant.identity = message.name;
				participantConnected(senderParticipant);
				//senderParticipant.RTCPeerConnection = createPeerForSendingMedia(senderParticipant);
				senderParticipant.receivingRTCPeerConnection = createPeerForReceivingMedia(senderParticipant);
				return senderParticipant;
			}

			function process(message) {
				console.log('%c iosrtcOfferReceived process', 'background:blue;color:white');

				if(_debug) console.log('%c receivingPeerConnection purpose: ' + message.purpose, 'background:green;color:white');
				if(_debug) console.log('%c receivingPeerConnection', 'background:green;color:white', message, roomParticipants);
				if(_debug) console.log(JSON.stringify(message));
				var senderParticipant = roomParticipants.filter(function (localParticipant) {
					return localParticipant.sid == message.fromSid;
				})[0];

				var firstTimeOffer = senderParticipant == null;
				if(senderParticipant == null && senderParticipant != localParticipant) {
					console.log('%c iosrtcOfferReceived create new participant', 'background:blue;color:white');
					var senderParticipant = new Participant();
					senderParticipant.sid = message.fromSid;
					senderParticipant.identity = message.name;
					participantConnected(senderParticipant);
				}

				var peerConnection;
				if(message.purpose == 'forSendingMedia') {
					console.log('%c iosrtcOfferReceived forSendingMedia', 'background:red;color:white');
					peerConnection = senderParticipant.RTCPeerConnection;
				} else {
					console.log('%c iosrtcOfferReceived forReceivingMedia', 'background:green;color:white');
					peerConnection = senderParticipant.receivingRTCPeerConnection;
				}

				if(peerConnection == null) {
					console.log('%c iosrtcOfferReceived create peerConnection', 'background:blue;color:white');
					if(message.purpose == 'forSendingMedia') {
						console.log('offerReceived.RTCPeerConnection forSendingMedia')
						senderParticipant.RTCPeerConnection = peerConnection = createPeerForSendingMedia(senderParticipant);
					} else senderParticipant.receivingRTCPeerConnection = peerConnection = createPeerForReceivingMedia(senderParticipant);
				}
				//if(_debug) console.log('offerReceived RTCPeerConnection', senderParticipant.RTCPeerConnection.connectionState, senderParticipant.RTCPeerConnection.iceConnectionState, senderParticipant.RTCPeerConnection.iceGatheringState, senderParticipant.RTCPeerConnection.signalingState)
				var description;
				//if(message.purpose == 'forSendingMedia') {
				if(message.purpose == 'forSendingMedia' && typeof cordova != 'undefined' && _isiOS) {
					description = new cordova.plugins.iosrtc.RTCSessionDescription({type: message.type, sdp:message.sdp});
				} else if (message.purpose == 'forReceivingMedia' && typeof cordova != 'undefined' && _isiOS){
					description = new RTCSessionDescription({type: message.type, sdp:message.sdp});
				} else {
					description = {type: message.type, sdp:message.sdp};
				}



				console.log('iosrtcOfferReceived.RTCPeerConnection ' + message.purpose)

				peerConnection.setRemoteDescription(description).then(function () {
					console.log('iosrtcOfferReceived setRemoteDescription ' + message.purpose);

					peerConnection.createAnswer()
						.then(function(answer) {
							console.log('iosrtcOfferReceived createAnswer ' + message.purpose);
							console.log('iosrtcOfferReceived createAnswer answer', answer);

							//if(_debug) console.log('ANSWER0 createAnswer', senderParticipant.RTCPeerConnection.connectionState, senderParticipant.RTCPeerConnection.iceConnectionState, senderParticipant.RTCPeerConnection.iceGatheringState, senderParticipant.RTCPeerConnection.signalingState)
							//offer.sdp = setH264AsPreffered(offer.sdp);
							//answer.type = 'offer';
							var localDescription;
							if(message.purpose == 'forSendingMedia' && typeof cordova != 'undefined' && _isiOS) {
								localDescription = new cordova.plugins.iosrtc.RTCSessionDescription(answer);
							} else if(message.purpose == 'forReceivingMedia' && typeof cordova != 'undefined' && _isiOS){
								localDescription = new RTCSessionDescription(answer);
							} else {
								localDescription = answer;
							}

							return peerConnection.setLocalDescription(localDescription).then(function () {
								//if(_debug) console.log('ANSWER1 createAnswer', senderParticipant.RTCPeerConnection.connectionState, senderParticipant.RTCPeerConnection.iceConnectionState, senderParticipant.RTCPeerConnection.iceGatheringState, senderParticipant.RTCPeerConnection.signalingState)
								console.log('iosrtcOfferReceived setLocalDescription ' + message.purpose)

								sendMessage({
									name: localParticipant.identity,
									targetSid: message.fromSid,
									type: "answer",
									sdp: peerConnection.localDescription,
									iosrtc: true,
									purpose: message.purpose == 'forSendingMedia' ? 'forReceivingMedia' : 'forSendingMedia'
								});

								//callback(peerConnection.localDescription, senderParticipant);
							});
						})

						.catch(function(error) {
							console.error(error);
							console.log('3090EEEEEEERRRRRRRRROOOOOOOOOOOOOOOOOOOOOOOOOOOOORRRRRRRR: ' + error);
						});
				});
			}

			return {
				processOffer: process
			}
		}

		function answerRecieved(message) {
			if(_debug) console.log('%c answerRecieved', 'background:blue;color:white;', message.sdp.sdp);
			if(_debug) console.log('answerRecieved purpose: ' + message.purpose);
			var senderParticipant = roomParticipants.filter(function (localParticipant) {
				return localParticipant.sid == message.fromSid;
			})[0];
			senderParticipant.identity = message.name;
			console.log('answerRecieved senderParticipant', senderParticipant.RTCPeerConnection.signalingState, senderParticipant.RTCPeerConnection.connectionState, senderParticipant.RTCPeerConnection.iceConnectionState)

			var description;
			if(typeof cordova != 'undefined' && _isiOS) {
				description = new RTCSessionDescription(message.sdp);
			} else {
				description = message.sdp;
			}

			var peerConnection = senderParticipant.RTCPeerConnection;

			peerConnection.setRemoteDescription(description).then(function () {
				senderParticipant.isNegotiating = false;
				if(typeof senderParticipant.offersQueue[0] != 'undefined') {
					senderParticipant.offersQueue[0]();
					senderParticipant.offersQueue.tracks.splice(0, 1);
				}
				console.log('answerRecieved senderParticipant2', senderParticipant.RTCPeerConnection.signalingState, senderParticipant.RTCPeerConnection.connectionState, senderParticipant.RTCPeerConnection.iceConnectionState)
			});
		}

		function iceConfigurationReceived(message) {
			if(_debug) console.log('iceConfigurationReceived: ' + JSON.stringify(message));
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
			console.log('iceConfigurationReceived pc state', peerConnection.connectionState, peerConnection.iceConnectionState, peerConnection.iceGatheringState, peerConnection.signalingState)
			console.log('iceConfigurationReceived pc isNegotiating = ' + senderParticipant.isNegotiating)
			/*peerConnection.addIceCandidate(candidate)
				.catch(function(e) {
					console.log('EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRROOOOOOOOOOOOOOOOOOOOOOOOOOORRRRRRRRRRRRRRR', JSON.stringify(message));
					console.error(e);
				});
			return;*/

			//if(peerConnection.signalingState == 'stable') {
			peerConnection.addIceCandidate(candidate)
				.catch(function(e) {
					console.log('EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRROOOOOOOOOOOOOOOOOOOOOOOOOOORRRRRRRRRRRRRRR', JSON.stringify(message));
					console.error(e);
				});
			/*} else {
				senderParticipant.iceCandidatesQueue.push({
					peerConnection: peerConnection,
					candidate: candidate
				});
			}*/

			/**/
		}

		function socketRoomJoined(streams) {
			console.log('streams', streams);
			app.state = 'connected';
			//localParticipant.sid = stream.id;
			/*var streamTracks = stream.getTracks();
			localParticipant.audioStream = new MediaStream();
			localParticipant.videoStream = new MediaStream();
			for(var t in streamTracks) {
				if(streamTracks[t].kind == 'video')
					localParticipant.videoStream.addTrack(streamTracks[t].mediaStreamTrack);
				else localParticipant.audioStream.addTrack(streamTracks[t].mediaStreamTrack);

			}*/

			/* if(options.useAsLibrary) {
				 app.views.switchTo(mainView);
				 if(!_isMobile) app.conferenceControl.showControlBar();
			 }*/

			//if(!_isMobile) app.conferenceControl.createSettingsPopup();



			for (var s in streams) {
				//if(typeof cordova != 'undefined' && _isiOS) localParticipant.iosrtcRTCPeerConnection.addStream(streams[s]);
				var localTracks = streams[s].getTracks();

				for (var i in localTracks) {
					if (_debug) console.log('socketRoomJoined tracks ' + i + ' ' + localTracks[i].kind)
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
				console.log('socketRoomJoined videoTracks ' + videoTracks.length);
				console.log('socketRoomJoined audioTracks ' + audioTracks.length);
				//if (videoTracks.length != 0 && audioTracks.length == 0) localParticipant.videoStream = streams[s];
				//if (audioTracks.length != 0 && videoTracks.length == 0) localParticipant.audioStream = streams[s];
			}



			app.eventBinding.socketEventBinding();
			sendOnlineStatus();
			checkOnlineStatus();
			console.log('joined', {username:localParticipant.identity, sid:socket.id, room:options.roomName})
			socket.emit('joined', {username:localParticipant.identity, sid:socket.id, room:options.roomName, isiOS: _isiOS});

			app.participantsList.loadList();
			if(!_isMobile && !options.useAsLibrary) app.conferenceControl.createParticipantsList(app.participantsList.getParticipantsList());

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
			createOfferAndRenegotiate: createOfferAndRenegotiate,
		}
	}())


	function sendMessage(message){
		if(_debug) console.log('sendMessage', message)
		/*try {
			var err = (new Error);
			console.log(err.stack);
		} catch (e) {

		}*/
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
		var currentAudioOutputMode = 'speaker';

		var mediaDevices;
		var audioInputDevices = [];
		var videoInputDevices = [];
		var currentCameraDevice;
		var currentAudioDevice;
		var frontCameraDevice;

		var hoverTimeout = {setttingsPopup:null, participantsPopup:null};

		function loadDevicesList(mediaDevicesList, reload) {
			if(mediaDevicesList != null && typeof reload == 'undefined') {
				videoInputDevices = [];
				audioInputDevices = [];
				var i, device;
				for (i = 0; device = mediaDevicesList[i]; i++) {
					if (_debug) console.log('loadDevicesList', device.label);
					if (device.kind.indexOf('video') != -1) {
						videoInputDevices.push(device);
						for (var x in localParticipant.tracks) {
							var mediaStreamTrack = localParticipant.tracks[x].mediaStreamTrack;
							if (_debug) console.log('loadDevicesList device obj', JSON.stringify(Object.keys(device)));
							if (_debug) console.log('loadDevicesList device id', device.deviceId);
							if (_debug) console.log('loadDevicesList device label', device.label);
							if (_debug) console.log('loadDevicesList track label', mediaStreamTrack.id);

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
			if(_debug) console.log('currentCameraDevice', currentCameraDevice);
			if(_debug) console.log('currentAudioDevice', currentAudioDevice);
			if(_debug) console.log('frontCameraDevice', frontCameraDevice);
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
						if(_debug) console.log('stream', stream)
						screenTrack = stream.getVideoTracks()[0];
						if(_debug) console.log('screenTrack', screenTrack)
						localParticipant.twilioInstance.publishTrack(screenTrack).then(function(trackPublication) {
							if(_debug) console.log('trackPublication', trackPublication)
							var trackToAttach = new Track();
							trackToAttach.sid = trackPublication.track.sid;
							trackToAttach.kind = trackPublication.track.kind;
							trackToAttach.mediaStreamTrack = trackPublication.mediaStreamTrack;
							trackToAttach.twilioReference = trackPublication.track;

							app.screensInterface.attachTrack(trackToAttach, localParticipant);
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
				if(_debug) console.log('updateControlBar 1' + audioInputDevices.length);
				microphoneBtn.innerHTML = icons.disabledMicrophone;
				micIsDisabled = true;
			} else if(!micIsDisabled && localParticipant.audioTracks().length != 0) {
				if(_debug) console.log('updateControlBar 2', micIsDisabled);

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
				if(_debug) console.log('usersBtn mouseleave', e.target)
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
				if (mediaDevice.kind === 'videoinput' || mediaDevice.kind === 'video') {
					if(_debug) console.log('mediaDevice', mediaDevice)
					var radioBtnItem = document.createElement('LABEL');
					var radioBtn= document.createElement('INPUT');
					radioBtn.name = 'cameras';
					radioBtn.type = 'radio';
					radioBtn.value = mediaDevice.deviceId;
					for(var i in localParticipant.tracks) {
						if(_debug) console.log('localParticipant.tracks[i]', localParticipant.tracks[i]);
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
			if(_debug) console.log('selectCameraDialogue')
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

			if(_debug) console.log('LOCAL PARTICIPANT', localParticipant)

			var chooseCameraList = document.createElement('DIV');
			chooseCameraList.className = 'choose-device'
			var title = document.createElement('H4');
			title.innerHTML = 'Select available camera';
			chooseCameraList.appendChild(title);
			var count = 1;
			mediaDevices.forEach(function(mediaDevice){
				if (mediaDevice.kind === 'videoinput' || mediaDevice.kind === 'video') {
					if(_debug) console.log('mediaDevice', mediaDevice)
					var radioBtnItem = document.createElement('LABEL');
					var radioBtn= document.createElement('INPUT');
					radioBtn.name = 'cameras';
					radioBtn.type = 'radio';
					radioBtn.value = mediaDevice.deviceId;
					for(var i in localParticipant.tracks) {
						if(_debug) console.log('localParticipant.tracks[i]', localParticipant.tracks[i]);
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

		function toggleCameras(cameraId, callback, failureCallback) {
			app.eventBinding.sendDataTrackMessage("beforeCamerasToggle");

			var i, device, deviceToSwitch;

			if(_debug) console.log('deviceToSwitch - ' + cameraId)
			for(i = 0; device = videoInputDevices[i]; i++){

				if(device == currentCameraDevice) {
					if(i != videoInputDevices.length-1){
						deviceToSwitch = videoInputDevices[i+1];
					} else deviceToSwitch = videoInputDevices[0];
					break;
				}
			};
			if(_debug) console.log('deviceToSwitch', deviceToSwitch)

			if(options.mode != 'twilio') {
				var cameraId = cameraId != null ? cameraId : deviceToSwitch.deviceId;
				var constrains = {deviceId: {exact: cameraId}};
				if(typeof cordova != 'undefined' && _isiOS) {
					constrains = {deviceId: cameraId}
				}
				//TODO: make offers queue as this code makes offer twice - after disableVideo and after enableVideo
				if(_debug) console.log('toggleCameras cameraId = ' + cameraId)
				var toggleCamera = function(videoStream) {
					var videoTrack = videoStream.getVideoTracks()[0];
					var trackToAttach = new Track();
					trackToAttach.sid = videoTrack.id;
					trackToAttach.mediaStreamTrack = videoTrack;
					trackToAttach.kind = videoTrack.kind;
					trackToAttach.isLocal = true;
					trackToAttach.stream = videoStream;


					/*for (let i = localParticipant.tracks.length - 1; i >= 0; i--) {
						if (localParticipant.tracks[i].kind == 'video') {
							localParticipant.tracks.splice(i, 1);
						}
					}*/

					var currentVideoTracks = localParticipant.videoTracks();
					/*if(typeof cordova != 'undefined' && _isiOS) {
						app.screensInterface.attachTrack(trackToAttach, localParticipant);

					}else*/
					if(currentVideoTracks.length != 0) {
						if(_debug) console.log("toggleCameras: if2 ");

						if(!(typeof cordova != 'undefined' && _isiOS)) app.conferenceControl.replaceTrack(videoTrack);
						app.screensInterface.attachTrack(trackToAttach, localParticipant);
					} else {
						if(_debug) console.log("toggleCameras: if3");

						if(_debug) console.log("toggleCameras: got stream tracks " + (videoStream.getTracks().length));
						if(_debug) console.log("toggleCameras: got stream videotracks " + (videoStream.getVideoTracks().length));
						//app.conferenceControl.addTrack(videoTrack);
						//app.conferenceControl.disableVideo();
						//app.conferenceControl.addTrack(videoTrack);
						app.screensInterface.attachTrack(trackToAttach, localParticipant);
						app.conferenceControl.enableVideo();


						/*for (var p in roomParticipants) {
							if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null) {

								var videoSender = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (sender) {
									return sender.track.kind == 'video';
								})[0];
								if(_debug) console.log('roomParticipants[p].RTCPeerConnection.getSenders()', roomParticipants[p].RTCPeerConnection.getSenders());
								if(_debug) console.log('roomParticipants[p].RTCPeerConnection.getSenders()2', videoSender);

								videoSender.replaceTrack(stream.getVideoTracks()[0])
									.then(function() {
										var videoSender = localParticipant.videoTracks().filter(function (sender) {
											return sender.track && sender.track.kind == 'video';
										})[0];
										if(callback != null) callback();

										app.eventBinding.sendDataTrackMessage("afterCamerasToggle");
									})
									.catch(function (e) {
										console.error(e);
										console.log(e);
										app.eventBinding.sendDataTrackMessage("afterCamerasToggle");
									});
							}
						}*/

						console.log('toggleCameras2', localParticipant.videoStream )

						//setTimeout(function(){

						//}, 3000)

						app.event.dispatch('cameraToggled');
					}


				}

				var i;
				var tracksNum = localParticipant.tracks.length - 1;
				for (i = tracksNum; i >= 0; i--) {
					if (localParticipant.tracks[i].kind == 'audio') continue;
					localParticipant.tracks[i].mediaStreamTrack.stop();
				}

				if(typeof cordova != 'undefined' && _isiOS) {
					cordova.plugins.iosrtc.getUserMedia({
						'audio': false,
						'video': constrains
					}, function (videoStream) {
						if (_debug) console.log("FGOT STREAM ");

						toggleCamera(videoStream);
					}, function (error) {
						console.error("Failed to get access to local media. Error code was " + error.message);
						if (_debug) console.log("Failed to get access to local media. Error code was " + error.message);
						if(failureCallback != null) failureCallback(error);
					});
				} else {
					navigator.mediaDevices.getUserMedia({
						'audio': false,
						'video': constrains
					}).then(function (videoStream) {

						toggleCamera(videoStream);

					})
						.catch(function (error) {
							console.error("Failed to get access to local media. Error code was " + error.message);
							if (_debug) console.log("Failed to get access to local media. Error code was " + error.message);
							if(failureCallback != null) failureCallback(error);
						});
				}
				return;
			}

			console.log('toggleCameras device id ')
			console.log( cameraId != null ? cameraId : deviceToSwitch.deviceId )
			try {
				var err = (new Error);
				console.log( JSON.stringify(err) )
			} catch (e) {}


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
					deviceId: { exact: cameraId != null ? cameraId : deviceToSwitch.deviceId }
				},
			}).then(function (stream) {
				var localVideoTrack = stream.getVideoTracks()[0];
				console.log('ENABLE VIDEO: GOT STREAM');
				var videoSetting = localVideoTrack.getSettings();
				console.log(JSON.stringify(videoSetting));
				console.log('toggleCameras')
				console.log(stream.getVideoTracks().length)
				var participant = localParticipant.twilioInstance;

				if(_debug) console.log("UNPUBLISH", twilioTracks);

				participant.unpublishTracks(twilioTracks);

				var trackPublication = participant.publishTrack(localVideoTrack).then(function (publication) {
					if(_debug) console.log('togglecameras')

					var vTrack = publication.track;
					var trackToAttach = new Track();
					trackToAttach.sid = vTrack.sid;
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
						console.log('ENABLE VIDEO 0.2' + publication.track.isEnabled);
						publication.track.enable();
					}, 500)
					if(_debug) console.log('togglecameras', deviceToSwitch == frontCameraDevice)

				});

			}).catch(function(err) {
				console.error('trackPublication ERROR' + err.name + ": " + err.message);
				console.log('trackPublication ERROR' + err.name + ": " + err.message);
			});

		}

		function enableCamera(callback, failureCallback) {

			var gotCameraStream = function(videoStream) {
				var localVideoTrack = videoStream.getVideoTracks()[0];
				if(_debug) console.log('ENABLE VIDEO: GOT STREAM' + videoStream.getTracks().length + ', ' + videoStream.getVideoTracks().length);

				if(options.mode == 'twilio') {
					var participant = localParticipant.twilioInstance;
					var trackPublication = participant.publishTrack(localVideoTrack).then(function (publication) {

						var vTrack = publication.track;
						console.log('vTrack', vTrack)
						var trackToAttach = new Track();
						trackToAttach.sid = vTrack.sid;
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
					/*if(typeof Q.Cordova != 'undefined' && _isiOS) {
						for (var p in roomParticipants) {
							if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null) {
								roomParticipants[p].RTCPeerConnection.addStream(videoStream);
							}
						}
					} else {*/

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
					//}
					app.event.dispatch('cameraEnabled');

					if (callback != null) callback();
				}
			};

			if(typeof cordova != 'undefined' && _isiOS) {
				cordova.plugins.iosrtc.getUserMedia({
					'audio': false,
					'video': {
						width: { min: 320, max: 1280 },
						height: { min: 240, max: 720 },
					}
				}, function (videoStream) {
					if (_debug) console.log("GOT STREAM ");
					gotCameraStream(videoStream);
				}, function (e) {
					if (failureCallback != null) failureCallback(e);
					console.error(e.name + ": " + e.message);
					console.log(e.name + ": " + e.message);
				});
			} else {
				navigator.mediaDevices.getUserMedia({
					'audio': false,
					'video': true
				}).then(function (videoStream) {
					gotCameraStream(videoStream);
				})
					.catch(function (e) {
						if (failureCallback != null) failureCallback(e);
						console.error(e.name + ": " + e.message);
						console.log(e.name + ": " + e.message);
					});
			}
		}

		function enableMicrophone(callback, failureCallback) {
			function successCallback(audioStream) {
				var localAudioTrack = audioStream.getAudioTracks()[0];
				if(_debug) console.log('ENABLE MIC: GOT STREAM' + audioStream.getTracks().length + ', ' + audioStream.getAudioTracks().length);

				if(options.mode == 'twilio') {
					var participant = localParticipant.twilioInstance;
					var trackPublication = participant.publishTrack(localAudioTrack).then(function (publication) {

						var aTrack = publication.track;
						console.log('vTrack', aTrack)
						var trackToAttach = new Track();
						trackToAttach.sid = aTrack.sid;
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
				console.log(err.name + ": " + err.message);
				if (failureCallback != null) failureCallback(err);
			}

			if(typeof cordova != 'undefined' && _isiOS){

				cordova.plugins.iosrtc.getUserMedia({
					'audio': true,
				}, function (audioStream) {
					successCallback(audioStream);
				}, function (err) {
					error(err);
				});
			} else {
				navigator.mediaDevices.getUserMedia({
					'audio': true,
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
									console.log(arguments)
									if(callback != null) callback();
								}
							}, function(){console.log("error");console.log(arguments)})
						} else {
							console.log(arguments)
							if(callback != null) callback();
						}
					}, function(){console.log("error");console.log(arguments)})
				}

				var requestCameraPermission = function (callback) {
					cordova.plugins.permissions.checkPermission("android.permission.CAMERA", function(result){
						if(!result.hasPermission) {
							cordova.plugins.permissions.requestPermission("android.permission.CAMERA", function(result){
								if(!result.hasPermission) {
									if(failureCallback != null) failureCallback();
								} else {
									console.log(arguments)
									if(callback != null) callback();
								}
							}, function(){console.log("error");console.log(arguments)})
						} else {
							console.log(arguments)
							//Permission granted
							if(callback != null) callback();
						}
					}, function(){console.log("error");console.log(arguments)})
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
			console.log('conferenceControl addTrack');
			if(options.mode == 'twilio') {
				var participant = localParticipant.twilioInstance;
				participant.publishTrack(track).then(function (publication) {

					var twilioTrack = publication.track;
					var trackToAttach = new Track();
					trackToAttach.sid = twilioTrack.sid;
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
						if(_debug) console.log('toggleAudioOfAll', state)
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

		function audioOutputMode() {
			function getCurrentMode() {
				return currentAudioOutputMode;
			}

			function setCurrentMode(mode) {
				console.log('cordova.plugins' + (JSON.stringify(Object.keys(cordova.plugins))))
				console.log('cordova.plugins AudioToggle' + (mode))

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
			console.log('replaceTrack');

			if(options.mode != 'twilio') {
				console.log('replaceTrack 2 '  + roomParticipants);
				console.log('replaceTrack 2 tracks num ' + localParticipant.tracks.length);


				for (var p in roomParticipants) {

					if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null && roomParticipants[p].RTCPeerConnection.connectionState != 'closed') {
						if('ontrack' in roomParticipants[p].RTCPeerConnection){
							console.log('replaceTrack 2 senders num ' + (roomParticipants[p].RTCPeerConnection.getSenders().length));

							let sender = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (s) {
								return s.track && s.track.kind == track.kind;
							})[0];

							console.log('replaceTrack 2 sender=' + (sender != null));
							if(sender != null) {
								var oldTrackid = sender.track.id;
								sender.track.stop();
								console.log('replaceTrack sender params ' + (JSON.stringify(sender.getParameters())))

								sender.replaceTrack(track)
									.then(function () {
										console.log('replaceTrack replaceTrack SUCCESS');
										for (let i = localParticipant.tracks.length - 1; i >= 0; i--) {
											console.log('replaceTrack REMOVE TRACK ' + localParticipant.tracks[i].mediaStreamTrack.id + '==' + oldTrackid);

											if (localParticipant.tracks[i].mediaStreamTrack.id == oldTrackid) {
												console.log('replaceTrack REMOVE TRACK 1');

												localParticipant.tracks.splice(i, 1);
											}
										}
										//if(callback != null) callback();
									})
									.catch(function (e) {
										console.error(e.name + ': ' + e.message);
										console.log(e.name + ': ' + e.message);
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
			console.log('enableVideoTracks');
			try {
				var err = (new Error);
				console.log(err.stack);
			} catch (e) {

			}
			//TODO: make camera request if no video
			if(options.mode == 'twilio') {
				var twilioTracks = []

				var i;
				var tracksNum = localParticipant.tracks.length - 1;
				for (i = tracksNum; i == 0; i--) {
					if (localParticipant.tracks[i].kind == 'audio') continue;
					twilioTracks.push(localParticipant.tracks[i].twilioReference);
					localParticipant.tracks[i].enabled = true;
				}

				localParticipant.twilioInstance.publishTracks(twilioTracks);
			} else {
				console.log('enableVideoTracks 2 '  + roomParticipants);

				for (var p in roomParticipants) {
					console.log('enableVideoTracks 2.1');
					console.log('enableVideoTracks 2.1.1 ' + (roomParticipants[p].isLocal) + '--' + (roomParticipants[p].RTCPeerConnection != null));

					if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null && roomParticipants[p].RTCPeerConnection.connectionState != 'closed') {
						console.log('localParticipant.videoStream ')

						if('ontrack' in roomParticipants[p].RTCPeerConnection) {
							console.log('enableVideoTracks nodejs');

							var videoTracks = localParticipant.videoTracks();

							console.log('enableVideoTracks videoTracks num', videoTracks.length);


							for (var t in videoTracks) {
								console.log('enableVideoTracks nodejs addTrack' + (videoTracks[t].mediaStreamTrack.id));
								let pc = roomParticipants[p].RTCPeerConnection;
								console.log('enableVideoTracks pc state', pc.connectionState, pc.iceConnectionState, pc.iceGatheringState, pc.signalingState)

								let sender = roomParticipants[p].RTCPeerConnection.addTrack(videoTracks[t].mediaStreamTrack);
								/*var params = sender.getParameters();
								console.log('enableVideoTracks params1 ' + JSON.stringify(params));

								for (var i = 0; i < params.codecs.length; i++) {
									if (params.codecs[i].mimeType == "video/rtx") {
										console.log('enableVideoTracks фф', params)

										var codecToApply = params.codecs[i];
										params.codecs.splice(i, 1);
										params.codecs.unshift(codecToApply);
										break;
									}
								}
								console.log('enableVideoTracks params2', params)

								sender.setParameters(params).catch(function(e){
									console.error(e);
								});*/
							}

						} else {
							roomParticipants[p].RTCPeerConnection.addStream(localParticipant.videoStream);
						}
					}
				}
			}
			cameraIsDisabled = false;
			app.event.dispatch('cameraEnabled');
			app.eventBinding.sendDataTrackMessage('online', {cameraIsEnabled: true});

		}

		function disableVideoTracks() {
			console.log('disableVideoTracks cameraIsDisabled', cameraIsDisabled);

			//if(cameraIsDisabled) return;

			if(options.mode == 'twilio') {
				var twilioTracks = []

				var i;
				var tracksNum = localParticipant.tracks.length - 1;
				console.log('localParticipant.tracks.length', localParticipant.tracks.length)
				for (i = tracksNum; i >= 0; i--) {
					console.log('tracksNum', i);
					if (localParticipant.tracks[i].kind == 'audio') continue;
					//console.log('localParticipant.tracks[i]', localParticipant.tracks[i].twilioReference, localParticipant.tracks[i].mediaStreamTrack.muted, localParticipant.tracks[i].mediaStreamTrack.readyState)
					twilioTracks.push(localParticipant.tracks[i].twilioReference);
					localParticipant.tracks[i].mediaStreamTrack.stop();
					localParticipant.tracks[i].mediaStreamTrack.enabled = false;
				}

				localParticipant.twilioInstance.unpublishTracks(twilioTracks);
				console.log('disableVideoTracks END');
			} else {

				for(let i = localParticipant.tracks.length - 1; i >= 0 ; i--){
					localParticipant.tracks[i].mediaStreamTrack.stop();
				}

				if(_isiOS) {
					cameraIsDisabled = true;
					app.eventBinding.sendDataTrackMessage('online', {cameraIsEnabled: false});
					return;
				}

				for (let p in roomParticipants) {

					if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null && roomParticipants[p].RTCPeerConnection.connectionState != 'closed') {
						console.log('disableVideoTracks participants loop');

						if('ontrack' in roomParticipants[p].RTCPeerConnection){

							console.log('disableVideoTracks BEFORE REMOVE TRACK ' + (localParticipant.tracks.length));

							let videoSenders = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (sender) {
								return sender.track != null && sender.track.kind == 'video';
							});

							for(var s = videoSenders.length - 1; s >= 0 ; s--){
								console.log('disableVideoTracks videoSender TRACK', videoSenders[s].track);

								for(let i = localParticipant.tracks.length - 1; i >= 0; i--){
									console.log('disableVideoTracks REMOVE TRACK if1', videoSenders[s].track);

									if(localParticipant.tracks[i].mediaStreamTrack.id == videoSenders[s].track.id) {
										console.log('disableVideoTracks REMOVE TRACK LOOP');

										localParticipant.tracks.splice(i, 1);
									}
								}
								roomParticipants[p].RTCPeerConnection.removeTrack(videoSenders[s]);

							}
							console.log('disableVideoTracks AFTER REMOVE TRACK ' + (localParticipant.tracks.length));


						} else {
							console.log('disableVideoTracks participants loop stream');

							//if(localParticipant.videoStream == null) return;
							var RTCLocalStreams = roomParticipants[p].RTCPeerConnection.getLocalStreams();
							for (var s in RTCLocalStreams) {
								console.log('disableVideoTracks videostream = stream' + (RTCLocalStreams[s] == localParticipant.videoStream))

								roomParticipants[p].RTCPeerConnection.removeStream(RTCLocalStreams[s]);

								console.log('disableVideoTracks tracks' + JSON.stringify(RTCLocalStreams[s].getVideoTracks()))
								//RTCLocalStreams[property].removeVideoTrack(videoTracks[t].mediaStreamTrack);


								var videoTracks = RTCLocalStreams[s].getVideoTracks();
								for(var v in videoTracks) {
									videoTracks[v].stop();
									for(let i = localParticipant.tracks.length - 1; i >= 0 ; i--){
										console.log('disableVideoTracks s REMOVE TRACK if2');

										if(localParticipant.tracks[i].mediaStreamTrack.id == videoTracks[v].id) {
											console.log('disableVideoTracks REMOVE TRACK LOOP');

											localParticipant.tracks.splice(i, 1);
										}
									}
									//RTCLocalStreams[s].removeTrack(videoTracks[v]);
								}

							}

						}

					}
					localParticipant.videoStream = null;
				}

			}
			cameraIsDisabled = true;
			app.eventBinding.sendDataTrackMessage('online', {cameraIsEnabled: false});
		}

		function enableAudioTracks(failureCallback) {
			console.log('enableAudioTracks');
			try {
				var err = (new Error);
				console.log(err.stack);
			} catch (e) {

			}

			if(options.mode == 'twilio') {
				console.log('localParticipant.audioTracks().length ' + localParticipant.audioTracks().length)
				if(localParticipant.audioTracks().length == 0) {
					console.log('enableAudioTracks requestMicrophone')

					app.conferenceControl.requestMicrophone(function (audioTrack) {
						console.log('enableAudioTracks requestMicrophone enableAudioTracks')

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
				console.log('ENABLING AUDIO ' + localParticipant.tracks.length);


				if('ontrack' in testPeerConnection && audioTracks.length == 0) {
					console.log('ENABLING AUDIO if1');

					var requestMicrophoneCallback = function (audioStream) {
						var audioTrack = audioStream.getAudioTracks()[0];
						if (typeof cordova != 'undefined' && _isiOS) {
							var enableAudioTrack = function (e) {
								if (e.track.mediaStreamTrack.id == audioTrack.id) {
									enableAudioTracks();
									if (_debug) console.log('enableAudioTracks CALLBACK END=' + micIsDisabled);

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

						console.log('ENABLING AUDIO else', audioTracks);

						if(_debug) console.log('enableAudioTracks', audioTracks, roomParticipants[p].RTCPeerConnection)
						if(_debug) console.log('enableAudioTracks length' + audioTracks.length);
						if(_debug) console.log('enableAudioTracks RTCPeerConnection connectionState = ' + roomParticipants[p].RTCPeerConnection.connectionState);
						if(_debug) console.log('enableAudioTracks RTCPeerConnection iceConnectionState = ' + roomParticipants[p].RTCPeerConnection.iceConnectionState);
						if(_debug) console.log('enableAudioTracks RTCPeerConnection iceGatheringState = ' + roomParticipants[p].RTCPeerConnection.iceGatheringState);

						var audioSenders = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (sender) {
							return sender.track && sender.track.kind == 'audio';
						});

						console.log('DISABLING AUDIO', audioSenders)

						var cancel = false;
						for(var s = audioSenders.length - 1; s >= 0 ; s--){

							for(let i = localParticipant.tracks.length - 1; i >= 0 ; i--){

								if(localParticipant.tracks[i].mediaStreamTrack.id == audioSenders[s].track.id) {
									console.log('enableAudioTracks CANCEL ADDING ' + localParticipant.tracks.length);
									cancel = true;
								}
							}
						}

						if(cancel) continue;
						console.log('ENABLING AUDIO' + JSON.stringify(audioSenders));
						//audioSender.track.stop();
						//audioSender.track.enabled = false;

						for (var t in audioTracks) {
							if(_debug) console.log('enableAudioTracks audioTracks[t] m', audioTracks[t].mediaStreamTrack.enabled, audioTracks[t].mediaStreamTrack.muted)
							if(_debug) console.log('enableAudioTracks RTCPeerConnection.addTrack' + (typeof roomParticipants[p].RTCPeerConnection.addTrack));
							if(_debug) console.log('enableAudioTracks RTCPeerConnection.addStream' + (typeof roomParticipants[p].RTCPeerConnection.addStream));

							//audioTracks[t].mediaStreamTrack.stop();
							//roomParticipants[p].RTCPeerConnection.addTrack(audioTracks[t].mediaStreamTrack, audioTracks[t].stream);
							roomParticipants[p].RTCPeerConnection.addTrack(audioTracks[t].mediaStreamTrack);
							//roomParticipants[p].RTCPeerConnection.addStream(audioTracks[t].stream);
							//app.eventBinding.triggerRenegotiation();
						}

					} else {
						//roomParticipants[p].RTCPeerConnection.addStream(localParticipant.audioStream);
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
				if(_debug) console.log('enableAudioTracks BEFORE END=' + micIsDisabled);

			}


			/*var i, screen;
			for(i = 0; screen = localParticipant.screens[i]; i++) {
				localParticipant.soundMeter.start();
			}*/
			if(_debug) console.log('enableAudioTracks END=' + micIsDisabled);

		}

		function disableAudioTracks() {
			if(_debug) console.log('disableAudioTracks')
			if(micIsDisabled) return;

			if(options.mode == 'twilio') {
				var twilioTracks = []

				var i;
				var tracksNum = localParticipant.tracks.length - 1;
				for (i = tracksNum; i >= 0; i--) {
					if (localParticipant.tracks[i].kind == 'video') continue;
					if(_debug) console.log('disableAudioTracks track', localParticipant.tracks[i])

					twilioTracks.push(localParticipant.tracks[i].twilioReference);
					localParticipant.tracks[i].mediaStreamTrack.stop();
					localParticipant.tracks[i].mediaStreamTrack.enabled = false;

					for(let t = localParticipant.tracks.length - 1; t >= 0 ; t--){

						if(localParticipant.tracks[t].mediaStreamTrack.id == localParticipant.tracks[i].mediaStreamTrack.id) {
							console.log('disableAudioTracks REMOVE TRACK LOOP ' + localParticipant.tracks.length);

							localParticipant.tracks.splice(t, 1);
							console.log('disableAudioTracks REMOVE TRACK LOOP ' + localParticipant.tracks.length);


						}
					}
				}

				localParticipant.twilioInstance.unpublishTracks(twilioTracks);
			} else {
				for (var p in roomParticipants) {

					if (roomParticipants[p].RTCPeerConnection && 'ontrack' in roomParticipants[p].RTCPeerConnection) {
						if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null && roomParticipants[p].RTCPeerConnection.connectionState != 'closed') {
							var audioSenders = roomParticipants[p].RTCPeerConnection.getSenders().filter(function (sender) {
								return sender.track && sender.track.kind == 'audio';
							});

							console.log('DISABLING AUDIO', audioSenders)
							//audioSender.track.stop();
							//audioSender.track.enabled = false;

							for(var s = audioSenders.length - 1; s >= 0 ; s--){
								console.log('disableAudioTracks sender TRACK', audioSenders[s].track);

								audioSenders[s].track.stop();
								for(let i = localParticipant.tracks.length - 1; i >= 0 ; i--){
									console.log('disableAudioTracks REMOVE TRACK', audioSenders[s].track);

									if(localParticipant.tracks[i].mediaStreamTrack.id == audioSenders[s].track.id) {
										console.log('disableAudioTracks REMOVE TRACK LOOP ' + localParticipant.tracks.length);

										localParticipant.tracks.splice(i, 1);
										console.log('disableAudioTracks REMOVE TRACK LOOP ' + localParticipant.tracks.length);


									}
								}
								roomParticipants[p].RTCPeerConnection.removeTrack(audioSenders[s]);

							}
						}

					} else {

						if(localParticipant.audioStream == null) return;
						console.log('disableAudioTracks cordova');

						//localParticipant.audioStream.stop();
						if (!roomParticipants[p].isLocal && roomParticipants[p].RTCPeerConnection != null && roomParticipants[p].RTCPeerConnection.connectionState != 'closed') {
							//roomParticipants[p].RTCPeerConnection.removeStream(localParticipant.audioStream);

							var RTCLocalStreams = roomParticipants[p].RTCPeerConnection.getLocalStreams();
							for (var s in RTCLocalStreams) {

								//RTCLocalStreams[property].removeVideoTrack(videoTracks[t].mediaStreamTrack);
								var audioTracks = RTCLocalStreams[s].getAudioTracks();
								for(var v in audioTracks) {
									//RTCLocalStreams[s].removeTrack(audioTracks[v]);
									audioTracks[v].enabled = false;
								}

							}

						}

					}
				}

			}
			micIsDisabled = true;
			var info = {
				micIsEnabled: false
			}
			app.eventBinding.sendDataTrackMessage('online', info);
			/*var i, screen;
			for(i = 0; screen = localParticipant.screens[i]; i++) {
				localParticipant.soundMeter.stop();
			}*/
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

		var codecs;
		if(Q.info.isCordova)
			codecs = ['VP8', 'H264'];
		else codecs = ['H264', 'VP8'];

		function joinRoom(room, dataTrack, mediaDevicesList) {
			if(_debug) console.log(`Successfully joined a Room: ${room}`, room);

			app.eventBinding.roomJoined(room, dataTrack);
			if(mediaDevicesList != null) app.conferenceControl.loadDevicesList(mediaDevicesList);

			app.event.dispatch('joined');
			if(callback != null) callback();
		}

		if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
			if(_debug) console.log("enumerateDevices() not supported.");

			var videoConstrains;
			if(options.video == false){
				videoConstrains = false;
			} else {
				videoConstrains = {
					width: { min: 320, max: 1280 },
					height: { min: 240, max: 720 },
				};
			}

			var connect = Twilio.connect;
			var dataTrack = new Twilio.LocalDataTrack();

			var twilioConnectWithNoTracks = function () {
				if(_debug) console.log('options.roomName', options.roomName);
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
					console.log(err.name + ": " + err.message);

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

				if(_debug) console.log('options.roomName', options.roomName);

				connect(token, {
					name:options.roomName,
					tracks: tracks,
					preferredVideoCodecs: codecs,
				}).then(function(room) {
					joinRoom(room, dataTrack);
				}, function(error) {
					console.error(`Unable to connect to Room: ${error.message}`);
				});
			}, function (err) {
				console.error(err.name + ": " + err.message);
				console.log(err.name + ": " + err.message);
			});
			return;
		}

		navigator.mediaDevices.enumerateDevices().then(function (mediaDevicesList) {
				if(_debug) console.log('initOrConnectConversation mediaDevicesList: ' + mediaDevicesList.length);
				var mediaDevices = mediaDevicesList;

				var videoDevices = 0;
				var audioDevices = 0;
				for(var i in mediaDevices) {
					if (mediaDevices[i].kind === 'videoinput' || mediaDevices[i].kind === 'video') {
						if(_debug) console.log('initOrConnectConversation mediaDevices[i]', mediaDevices[i].deviceId);
						videoDevices++;
					} else if (mediaDevices[i].kind === 'audioinput' || mediaDevices[i].kind === 'audio') {
						audioDevices++;
					}
				}


				var videoConstrains;
				if(videoDevices == 0 && options.video == false){
					videoConstrains = false;
				} else if(videoDevices != 0 && options.video) {
					videoConstrains = {
						width: { min: 320, max: 1280 },
						height: { min: 240, max: 720 },
					};
				}

				var dataTrack = new Twilio.LocalDataTrack();
				var connect = Twilio.connect;

				if(options.streams != null) {

					if(_debug) console.log('options.streams', options.streams);
					var tracks = [];
					for(var t in options.streams) {
						if(_debug) console.log('initOrConnectConversation tracks', options.streams[t].getTracks());
						var mediaStreamTracks = options.streams[t].getTracks();
						for(var s in mediaStreamTracks) {
							tracks.push(mediaStreamTracks[s]);
						}
					}
					if(_debug) console.log('initOrConnectConversation tracks', tracks);

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
						console.error(`Unable to connect to Room: ${err.message}`);
						console.log(err.name + ": " + err.message);

					});

					return;
				}

				var twilioConnectWithNoTracks = function () {
					if(_debug) console.log('options.roomName', options.roomName);
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
						console.error(`Unable to connect to Room: ${err.message}`);
						console.log(err.name + ": " + err.message);

					});
				}
				if((audioDevices == 0 && videoDevices == 0) || (!options.audio && !options.video)){
					twilioConnectWithNoTracks();
					return;
				}

				navigator.mediaDevices.getUserMedia ({
					'audio': audioDevices != 0 && options.audio,
					'video': videoConstrains,
				}).then(function (stream) {
					var tracks = stream.getTracks();
					tracks.push(dataTrack);
					var connect = Twilio.connect;
					if(_debug) console.log('options.roomName2', options.roomName);
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
					}).catch(function () {
						console.error('ERROR: cannot get device info')
					});

				}).catch(function(err) {
					console.error(err.name + ": " + err.message);
					twilioConnectWithNoTracks();
				});


			},
			function(error){console.log("Failed to get access to local media. Error code was " + error.code);}
		);




	}


	var initOrConnectWithNodeJs = function (callback) {
		if(_debug) console.log('initOrConnectWithNodeJs');
		if(Q.info.isCordova && _isiOS) {
			initOrConnectWithNodeJsiOSCordova(callback);
			return;
		}

		function joinRoom(streams, mediaDevicesList) {
			app.eventBinding.socketRoomJoined((streams != null ? streams : []));
			console.log('initOrConnectWithNodeJs joinRoom mediaDevicesList ' + mediaDevicesList.length)
			if(mediaDevicesList != null) app.conferenceControl.loadDevicesList(mediaDevicesList);
			app.event.dispatch('joined');
			if(callback != null) callback();
		}

		if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
			if(_debug) console.log("enumerateDevices() not supported.");

			navigator.mediaDevices.getUserMedia ({
				'audio': options.audio,
				'video': options.video,
			}).then(function (stream) {
				joinRoom(stream);
			}).catch(function(err) {
				console.error(err.name + ": " + err.message);
			});

			return;
		}



		navigator.mediaDevices.enumerateDevices().then(function (mediaDevicesList) {
			if(_debug) console.log('initOrConnectConversation mediaDevicesList', mediaDevicesList);
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

			var videoConstrains;
			if(options.video == false){
				videoConstrains = false;
			} else {
				videoConstrains = {
					width: { min: 320, max: 1280 },
					height: { min: 240, max: 720 },
				};
			}

			if(options.streams != null) {
				if(_debug) console.log('initOrConnectConversation stream');
				joinRoom(options.streams, mediaDevices);
				return;
			}

			if((audioDevices == 0 && videoDevices == 0) || (!options.audio && !options.video)){
				if(_debug) console.log('initOrConnectConversation no stream needed');
				//TODO: make screenEl if there are no devices available

				joinRoom(null, mediaDevices);
				return;
			}

			if(_debug) console.log('initOrConnectWithNodeJs media' + (audioDevices != 0 && options.audio));


			navigator.mediaDevices.getUserMedia ({
				'audio': audioDevices != 0 && options.audio,
				'video': videoConstrains,
			}).then(function (stream) {
				navigator.mediaDevices.enumerateDevices().then(function (mediaDevicesList) {
					joinRoom(stream, mediaDevicesList);
				}).catch(function (err) {
					console.error(err.name + ": " + err.message);
					console.log(err.name + ": " + err.message);
				});

			}).catch(function(err) {
				console.error(err.name + ": " + err.message);
			});

		})
		/*.catch(function(err) {
			if(_debug) console.log(err.name + ": " + err.message);
			console.error(err.name + ": " + err.message);
		});*/


	}


	var initOrConnectWithNodeJsiOSCordova = function (callback) {
		if(_debug) console.log('initOrConnectWithNodeJsiOSCordova');

		if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
			if(_debug) console.log("enumerateDevices() not supported.");
		}

		cordova.plugins.iosrtc.enumerateDevices(function(mediaDevicesList){
			if(_debug) console.log('initOrConnectConversation mediaDevicesList: ' + mediaDevicesList.length);
			var mediaDevices = mediaDevicesList;

			var videoDevices = 0;
			var audioDevices = 0;
			for(var i in mediaDevices) {
				if (mediaDevices[i].kind.indexOf('video') != -1) {
					if(_debug) console.log('initOrConnectConversation mediaDevices[i]', mediaDevices[i].deviceId);
					videoDevices++;
				} else if (mediaDevices[i].kind.indexOf('audio') != -1) {
					if(_debug) console.log('initOrConnectConversation mediaDevices[i]', mediaDevices[i].deviceId);
					audioDevices++;
				}
			}

			var videoConstrains;
			if(videoDevices == 0 || options.video == false){
				videoConstrains = false;
			} else if(videoDevices != 0 && options.video) {
				videoConstrains = {
					width: { min: 320, max: 1280 },
					height: { min: 240, max: 720 },
				};
			}

			/*if((audioDevices == 0 && videoDevices == 0) || (!options.audio && !options.video)){
				if(_debug) console.log('initOrConnectConversation no stream needed');
				//TODO: make screenEl if there are no devices available
				joinRoom(null, mediaDevices);
				return;
			}*/

			console.log('videoConstrains ' + videoConstrains)
			console.log('audioDevices ' + (audioDevices != 0 && options.audio))
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
										if (_debug) console.log('initOrConnectWithNodeJsiOSCordova stream', videoStream);

										app.eventBinding.socketRoomJoined([audioStream, videoStream]);
										app.conferenceControl.loadDevicesList(mediaDevicesList);
										app.event.dispatch('joined');
										if (callback != null) callback();

									}, function (error) {
										console.error(`Unable to connect to Room: ${error.message}`);
									});
								},
								function (error) {
									console.error('getUserMedia failed: ', error);
								}
							);
						} else {
							app.eventBinding.socketRoomJoined([audioStream]);
							app.conferenceControl.loadDevicesList(mediaDevicesList);
							app.event.dispatch('joined');
							if (callback != null) callback();
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
							if (_debug) console.log('initOrConnectWithNodeJsiOSCordova stream', videoStream);

							try {
								app.eventBinding.socketRoomJoined([videoStream]);
								app.conferenceControl.loadDevicesList(mediaDevicesList);

								app.event.dispatch('joined');
								if (callback != null) callback();
							} catch (e) {
								console.log('error', e.message);
								console.error('error', e.message);
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
				console.log('initOrConnectWithNodeJsiOSCordova else');
				cordova.plugins.iosrtc.enumerateDevices(function (mediaDevicesList) {

					try {
						app.eventBinding.socketRoomJoined(options.streams != null ? options.streams : []);
						app.conferenceControl.loadDevicesList(mediaDevicesList);

						app.event.dispatch('joined');
						if (callback != null) callback();
					} catch (e) {
						console.log('error', e.message);
						console.error('error', e.message);
					}
				}, function (error) {
					console.error(`Unable to connect to Room: ${error.message}`);
				});
			}

		}, function (e) {
			console.error('ERRORRRRRRRRROOOOOOOOOOOOOOORRRRRR: ' + e.message)

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

	var initWithTwilio = function(callback){
		if(_debug) console.log('initWithTwilio')

		var ua=navigator.userAgent;
		if(ua.indexOf('Android')!=-1||ua.indexOf('Windows Phone')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) {
			_isMobile=true;
			app.views.isMobile(true);
			app.views.updateOrientation();
		} else app.views.isMobile(false);

		if(ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) _isiOS = true;

		if(_debug) console.log('options.twilioToken', options)
		if(options.twilioAccessToken != null) {
			initOrConnectConversation(options.twilioAccessToken, callback);
			return;
		}

		app.views.createJoinFormView(function (userName) {
			getAuthToken(userName, function (authToken) {
				initOrConnectConversation(authToken);
			});
		});
		app.views.switchTo(joinFormView);
		app.views.createMainView();
		if(_isMobile) app.views.createParticipantsListView();

		window.addEventListener("orientationchange", function() {
			setTimeout(function () {
				if(_isMobile) app.views.updateOrientation();
			}, 1500);
		});

		window.addEventListener("resize", function() {
			setTimeout(function () {
				if(_isMobile) app.views.updateOrientation();
			}, 1500);
		});


	}

	if(typeof cordova != 'undefined' && (ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1)) {
		var nativeLocalWebRTCPeerConnection = (function () {
			var iceQueue = [];

			function setOffer(message) {
				//if (_debug) console.log('nativeLocalWebRTCPeerConnection createOffer + ' + message.sdp)

				var description = new RTCSessionDescription({type: message.type, sdp: message.sdp});

				return localParticipant.RTCPeerConnection.setRemoteDescription(description).then(function () {
					return localParticipant.RTCPeerConnection.createAnswer()
						.then(function (answer) {
							if (_debug) console.log('nativeLocalWebRTCPeerConnection ANSWER CREATED');

							var localDescription = new RTCSessionDescription(answer);

							return localParticipant.RTCPeerConnection.setLocalDescription(localDescription).then(function () {
								if (_debug) console.log('nativeLocalWebRTCPeerConnection ANSWER CREATED 2');

								var message = {
									type: "answer",
									sdp: localDescription
								};
								return iosrtcLocalPeerConnection.setAnswer(message).then(function () {
									if (_debug) console.log('nativeLocalWebRTCPeerConnection ANSWER CREATED 3');

									for (var i in iceQueue) {
										if(iceQueue[i] != null) iosrtcLocalPeerConnection.addIceCandidate(iceQueue[i]);
										iceQueue[i] = null;
									}
								});

							});
						})

						.catch(function (error) {
							console.error(error);
							console.log('EEEEEEERRRRRRRRROOOOOOOOOOOOOOOOOOOOOOOOOOOOORRRRRRRR: ' + error);
						});
				});
			}

			function setAnswer(message) {
				//if (_debug) console.log('nativeLocalWebRTCPeerConnection setAnswer', message.sdp.sdp);

				var description = new RTCSessionDescription(message.sdp);

				localParticipant.iosrtcRTCPeerConnection.setRemoteDescription(description);
				localParticipant.state = 'connected';
			}

			function createOffer() {
				if (_debug) console.log('createOffer')
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
						console.error(error);
						console.log('4550 EEEEEEERRRRRRRRROOOOOOOOOOOOOOOOOOOOOOOOOOOOORRRRRRRR: ' + error);
					});
			}

			function addIceCandidate(message) {
				if (_debug) console.log('nativeLocalWebRTCPeerConnection addIceCandidate: ' + message.candidate);
				var candidate = new RTCIceCandidate({
					candidate: message.candidate,
					sdpMLineIndex: message.label,
					sdpMid: message.sdpMid
				});
				localParticipant.RTCPeerConnection.addIceCandidate(candidate)
					.catch(function (e) {
						console.error(e);
						console.log(e);
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
						id: event.candidate.sdpMid,
					};

					//iceQueue.push(message);
					iosrtcLocalPeerConnection.addIceCandidate(message);

				}
			}

			function streamReceived(e) {
				if (_debug) console.log("%c rawStreamSubscribed===================================:", typeof event.stream);

				var stream = event.stream;
				console.log('stream got ' + stream.getTracks().length);

				console.log('stream got2');
				var videoEl = document.createElement('video');
				console.log('stream got2.1');
				videoEl.srcObject = e.stream;
				console.log('stream got2.2');
				videoEl.style.width = '100%';
				videoEl.volume = 0;
				videoEl.playsInline = true;
				videoEl.setAttribute('webkit-playsinline', true);
				console.log('stream got 2.5')
				var videoElCon = document.createElement('DIV');
				videoElCon.style.position = 'fixed';
				videoElCon.style.width = '200px';
				videoElCon.style.height = '200px';
				videoElCon.style.top = '0';
				videoElCon.style.left = '300px';
				videoElCon.style.background = 'green';
				videoElCon.style.zIndex = '999999999999';
				console.log('stream got 3')
				videoElCon.appendChild(videoEl);
				document.body.appendChild(videoElCon);
				videoEl.play();
				return;
				if (_debug) console.log("%c rawStreamSubscribed===================================:", 'background:orange;color:white;', event);

				var stream = event.stream;
				console.log('stream got ' + stream.getTracks().length);
				var tracks = stream.getTracks();
				/*if(tracks.length > 1) {
					console.error('Stream contains more than one track');
					return;
				}*/
				/*var tracks = stream.getAudioTracks();
				console.log('stream got2');
				var videoEl = document.createElement('video');
				console.log('stream got2.1');
				videoEl.srcObject = stream;
				console.log('stream got2.2');
				videoEl.style.width = '100%';
				videoEl.volume = 0;
				console.log('stream got 2.5')
				var videoElCon = document.createElement('DIV');
				videoElCon.style.position = 'fixed';
				videoElCon.style.width = '100px';
				videoElCon.style.height = '100px';
				videoElCon.style.top = '0';
				videoElCon.style.left = '0';
				videoElCon.style.background = 'green';
				videoElCon.style.zIndex = '999999999999';
				console.log('stream got 3')
				videoElCon.appendChild(videoEl);
				document.body.appendChild(videoElCon);
				videoEl.play();*/

				for (var t in tracks) {
					var track = tracks[t];
					var trackToAttach = new Track();
					trackToAttach.sid = track.sid;
					trackToAttach.kind = track.kind;
					trackToAttach.mediaStreamTrack = track;
					trackToAttach.stream = stream;

					app.screensInterface.attachTrack(trackToAttach, localParticipant);
				}


			}

			function trackReceived(e) {
				//setTimeout(function() {
				if (_debug) console.log("trackReceived===================================:" + JSON.stringify(e.streams));
				var stream = e.streams[0];
				if (_debug) console.log("trackReceived : stream.id " + stream.id);
				if (_debug) console.log("trackReceived : track.id " + stream.getTracks()[0].id);
				var track = e.track;
				if (_debug) console.log("trackReceived : addTrack : track.kind " + track.kind);
				if (_debug) console.log("trackReceived : addTrack : track.muted " + track.muted);
				if (_debug) console.log("trackReceived : addTrack : track.enabled " + track.enabled);
				if (_debug) console.log("trackReceived : addTrack : track.readyState " + track.readyState);
				if (_debug) console.log("trackReceived : addTrack : track.isolated " + track.isolated);
				if (_debug) console.log("trackReceived : addTrack : track.label " + track.label);
				function addTrack() {
					var tracks = stream.getTracks();


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
					if (_debug) console.log("trackReceived : add immadiately");
					if (_debug) console.log("trackReceived : participants " + roomParticipants.length);
					addTrack();
				} else {
					app.event.on('joined', function () {
						if (_debug) console.log("trackReceived : joined event");
						addTrack();
					});
				}

				//}, 4000)


				/*var stream = e.streams[0];

				console.log('stream got ' + stream.getTracks().length);

				console.log('stream got2');
				var videoEl = document.createElement('video');
				console.log('stream got2.1');
				videoEl.srcObject = stream;
				console.log('stream got2.2');
				videoEl.style.width = '100%';
				videoEl.volume = 0;
				videoEl.autoplay = true;
				videoEl.playsInline = true;
				videoEl.playsinline = true;
				videoEl.muted = true;
				videoEl.setAttribute('webkit-playsinline', true);
				console.log('stream got 2.5')
				var videoElCon = document.createElement('DIV');
				videoElCon.style.position = 'fixed';
				videoElCon.style.width = '50%';
				videoElCon.style.height = '500px';
				videoElCon.style.top = '0';
				videoElCon.style.left = '50%';
				videoElCon.style.background = 'green';
				videoElCon.style.zIndex = '999999999999';
				console.log('stream got 3')
				videoElCon.appendChild(videoEl);
				document.body.appendChild(videoElCon);
				videoEl.play();*/
				//videoEl.requestFullscreen();

			}

			function createNativeLocalPeerConnection(callback) {
				var newPeerConnection = new window.RTCPeerConnection(pc_config);

				if (localParticipant.videoStream != null) newPeerConnection.addStream(localParticipant.videoStream);

				localParticipant.RTCPeerConnection = newPeerConnection;

				newPeerConnection.onaddstream = function (e) {
					//streamReceived(e);
				};
				newPeerConnection.ontrack = function (e) {
					if (_debug) console.log('nativeLocalPeerConnection ontrack')

					trackReceived(e);
				};

				newPeerConnection.onicecandidate = function (e) {
					gotIceCandidate(e);
				};

				newPeerConnection.onnegotiationneeded = function (e) {
					if (_debug) console.log('native onnegotiationneeded 1')

					if (newPeerConnection.connectionState == 'new' && newPeerConnection.iceConnectionState == 'new' && newPeerConnection.iceGatheringState == 'new') return;

					createOffer();

				};

				if (callback != null) callback();

			}

			function removeRemoteStreams() {
				var localTracks = localParticipant.tracks;
				for (var t in localTracks) {
					if(localTracks[t].stream != null) {
						localTracks[t].medaStreamTrack.stop();
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

			function setAnswer(message) {
				if (_debug) console.log('iosrtcLocalPeerConnection setAnswer ');

				var description = new iosrtcRTCSessionDescription(message.sdp);

				return localParticipant.iosrtcRTCPeerConnection.setRemoteDescription(description).then(function () {
					for (var i in iceQueue) {
						if(iceQueue[i] != null) nativeLocalWebRTCPeerConnection.addIceCandidate(iceQueue[i]);
						iceQueue[i] = null;
					}
				});

			}

			function addIceCandidate(message) {
				if (_debug) console.log('iosrtcLocalPeerConnection addIceCandidate: ' + message.candidate);

				var candidate = new iosrtcRTCIceCandidate({
					candidate: message.candidate,
					sdpMLineIndex: message.label,
					sdpMid: message.sdpMid
				});
				localParticipant.iosrtcRTCPeerConnection.addIceCandidate(candidate)
					.catch(function (e) {
						console.error(e);
						console.log(e);
					});
			}

			function gotIceCandidate(event) {

				if (event.candidate) {

					if (event.candidate.candidate.indexOf("relay") < 0) { // if no relay address is found, assuming it means no TURN server
						//return;
					}
					var message = {
						type: "candidate",
						label: event.candidate.sdpMLineIndex,
						sdpMid: event.candidate.sdpMid,
						candidate: event.candidate.candidate,
						id: event.candidate.sdpMid,
					};

					//iceQueue.push(message);

					nativeLocalWebRTCPeerConnection.addIceCandidate(message);

				}
			}

			function createOffer() {
				if (_debug) console.log('iosrtcLocalPeerConnection createOffer ' + _negotiating)

				if(_negotiating == true) return;
				_negotiating = true
				if (_debug) console.log('iosrtcLocalPeerConnection createOffer')
				var iosRTCPeerConnection = localParticipant.iosrtcRTCPeerConnection;
				iosRTCPeerConnection.createOffer({'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true})
					.then(function (offer) {
						if (_debug) console.log('iosrtcLocalPeerConnection createOffer OFFER CREATED');

						var localDescription = new iosrtcRTCSessionDescription(offer);
						return iosRTCPeerConnection.setLocalDescription(localDescription).then(function () {
							if (_debug) console.log('iosrtcLocalPeerConnection createOffer OFFER CREATED SENDING...');

							//callback(iosRTCPeerConnection.localDescription.sdp);
							var message = {
								type: "offer",
								sdp: iosRTCPeerConnection.localDescription.sdp
							}

							return nativeLocalWebRTCPeerConnection.setOffer(message).then(function () {
								if (_debug) console.log('iosrtcLocalPeerConnection ANSWER GOT')
								_negotiating = false;

								if(_offerQueue != null) {
									if (_debug) console.log('iosrtcLocalPeerConnection NEW OFFER IN QUEUE')

									var newOffer = _offerQueue;
									_offerQueue = null;
									newOffer();
								}
							});

						});
					})
					.catch(function (error) {
						console.error(error);
						console.log('4550 EEEEEEERRRRRRRRROOOOOOOOOOOOOOOOOOOOOOOOOOOOORRRRRRRR: ' + error);
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
							console.error(error);
							console.log('EEEEEEERRRRRRRRROOOOOOOOOOOOOOOOOOOOOOOOOOOOORRRRRRRR: ' + error);
						});
				});
			}

			function gotStream(stream) {
				//return;
				var videoEl = document.createElement('video');
				try {
					videoEl.srcObject = stream;
				} catch (e) {
					console.log('1AAAAAAAAAAAAAA EEEEEEEEEERRRRRRRRRRRRRRRRROOOOOOOOOOORRRRRR: ' + e.message)
				}
				videoEl.style.width = '100%';
				videoEl.style.height = '100%';
				videoEl.style.objectFit = 'cover';
				videoEl.volume = 0;
				var videoElCon = document.createElement('DIV');
				videoElCon.style.position = 'fixed';
				videoElCon.style.width = '50%';
				videoElCon.style.height = '500px';
				videoElCon.style.top = '0';
				videoElCon.style.left = '0';
				videoElCon.style.background = 'green';
				videoElCon.style.zIndex = '999999999999';
				videoElCon.appendChild(videoEl);
				document.body.appendChild(videoElCon);
				videoEl.play();
				cordova.plugins.iosrtc.refreshVideos();
			}

			function addStream(stream) {

				if (localParticipant.iosrtcRTCPeerConnection == null) return;
				console.log('createIosrtcLocalPeerConnection START')
				console.log('createIosrtcLocalPeerConnection stream id' + (stream.id))
				console.log('createIosrtcLocalPeerConnection track id' + (stream.getTracks()[0].id))

				console.log(localParticipant.iosrtcRTCPeerConnection.signalingState + ' ---- ' + localParticipant.iosrtcRTCPeerConnection.iceConnectionState + '------' + localParticipant.iosrtcRTCPeerConnection.iceGatheringState )
				//localParticipant.videoStream.stop();
				/*localParticipant.videoStream.stop();
				localParticipant.iosrtcRTCPeerConnection.removeStream(localParticipant.videoStream);
				localParticipant.videoStream = null;*/
				var newStreamKind;
				var videoTracks = stream.getVideoTracks()
				var audioTracks = stream.getAudioTracks()
				if (videoTracks.length != 0 && audioTracks.length == 0)
					newStreamKind = 'video';
				else if (audioTracks.length != 0 && videoTracks.length == 0) newStreamKind = 'audio';

				var RTCLocalStreams = localParticipant.iosrtcRTCPeerConnection.getLocalStreams()
				for (var t in RTCLocalStreams) {
					let videoTracks = RTCLocalStreams[t].getVideoTracks();
					let audioTracks = RTCLocalStreams[t].getAudioTracks();
					var currentStreamkind;
					if (videoTracks.length != 0 && audioTracks.length == 0)
						currentStreamkind = 'video';
					else if (audioTracks.length != 0 && videoTracks.length == 0)
						currentStreamkind = 'audio';

					if(currentStreamkind != newStreamKind) continue;
					RTCLocalStreams[t].stop();
					localParticipant.iosrtcRTCPeerConnection.removeStream(RTCLocalStreams[t]);
				}
				try {
					//var RTCLocalStreams = localParticipant.iosrtcRTCPeerConnection.getLocalStreams();
					//localParticipant.iosrtcRTCPeerConnection.removeStream(localParticipant.videoStream);

				} catch(e){
					console.error(e.message)
					console.log('EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEee' + e.message)
				}
				//nativeLocalWebRTCPeerConnection.removeRemoteStreams();
				//setTimeout(function () {
				var check = function(){
					console.log('createIosrtcLocalPeerConnection getLocalStreams() ' + (localParticipant.iosrtcRTCPeerConnection.getLocalStreams().length))
				}
				setTimeout(check, 1000)
				setTimeout(check, 2000)
				setTimeout(check, 3000)
				setTimeout(check, 4000)
				setTimeout(check, 6000)
				setTimeout(check, 7000)
				setTimeout(check, 8000)
				setTimeout(check, 9000)

				//setTimeout(function () {
				console.log('createIosrtcLocalPeerConnection getLocalStreams()' + (localParticipant.iosrtcRTCPeerConnection.getLocalStreams().length))

				if(_negotiating){
					_offerQueue = function () {
						localParticipant.iosrtcRTCPeerConnection.addStream(stream);
					}
				} else localParticipant.iosrtcRTCPeerConnection.addStream(stream);

				//}, 7000)

			}

			function createIosrtcLocalPeerConnection(callback) {
				console.log('createIosrtcLocalPeerConnection')

				var iosRTCPeerConnection = new iosrtcRTCPeerConnection(pc_config);
				localParticipant.iosrtcRTCPeerConnection = iosRTCPeerConnection;

				//if(options.streams) iosRTCPeerConnection.addStream(options.streams);

				iosRTCPeerConnection.onicecandidate = function (e) {
					gotIceCandidate(e);
				};

				iosRTCPeerConnection.onnegotiationneeded = function (e) {
					if (_debug) console.log('iosrtc onnegotiationneeded 0')
					if (iosRTCPeerConnection.connectionState == 'new' && iosRTCPeerConnection.iceConnectionState == 'new' && iosRTCPeerConnection.iceGatheringState == 'new') return;
					if (_debug) console.log('iosrtc onnegotiationneeded 1')

					createOffer();
				};

				if (callback != null) callback();



				/*setTimeout(function() {
					cordova.plugins.iosrtc.getUserMedia(
						{
							audio: false,
							video: true
						},
						function (videoStream) {
							iosRTCPeerConnection.addStream(videoStream);
						},
						function (error) {
							console.error('EEEEEEEEEEERRRRRRROOOOOOOOOOORRRRRRRRR createLocalPeerConnection failed: ', error);
							console.log('EEEEEEEEEEERRRRRRROOOOOOOOOOORRRRRRRRR createLocalPeerConnection failed: ', error);
						}
					);
				}, 3000)*/

			}

			//RTCPeerConnection = cordova.plugins.iosrtc.RTCPeerConnection
			//RTCIceCandidate = cordova.plugins.iosrtc.RTCIceCandidate;
			//RTCSessionDescription = cordova.plugins.iosrtc.RTCSessionDescription;*/
			//window.RTCPeerConnection.prototype.addStream = cordova.plugins.iosrtc.RTCPeerConnection.addStream;

			return {
				create: createIosrtcLocalPeerConnection,
				createOffer: createOffer,
				setAnswer: setAnswer,
				setOffer: setOffer,
				addIceCandidate: addIceCandidate,
				addStream: addStream
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
					socket.emit('log', txt + argumentsString + '\n');
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
				socket.emit('errorlog', errorMessage);
				console.stderror.apply(console, arguments);
			} catch (e) {
				console.log(e.name + ' ' + e.message)
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

			socket.emit('errorlog', errMessage);
		}

	}

	var initWithNodeJs = function(callback){
		var ua=navigator.userAgent;
		if(ua.indexOf('Android')!=-1||ua.indexOf('Windows Phone')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) {
			_isMobile=true;
			app.views.isMobile(true);
			app.views.updateOrientation();
		} else app.views.isMobile(false);

		if(ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) _isiOS = true;

		if(options.useAsLibrary) {
			require(['https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.7.3/socket.io.js'], function (io) {


				socket = io.connect(options.nodeServer, {transports: ['websocket']});
				socket.on('connect', function () {
					if(_isiOS) enableiOSDebug();
					if(_debug) console.log('CONNECTED', socket);
					if(localParticipant != null) return;
					localParticipant = new Participant();
					localParticipant.identity = options.username;
					localParticipant.isLocal = true;
					roomParticipants.push(localParticipant);

					if(typeof cordova != 'undefined' && _isiOS) {
						iosrtcLocalPeerConnection.create(function () {
							nativeLocalWebRTCPeerConnection.create(function () {
								iosrtcLocalPeerConnection.createOffer();
							})
						});
					}

					if(socket.connected) initOrConnectWithNodeJs(callback);
				});

				/*console.log('START', socket);
				localParticipant = new Participant();
				localParticipant.sid = options.sid;
				localParticipant.identity = options.username;
				roomParticipants.push(localParticipant);
				initOrConnectWithNodeJs(callback)*/


			});
			return;
		}

		roomName = location.hash.trim() != '' ? location.hash.replace('#', '') : makeid();
		location.hash = '#' + roomName;

		app.views.createJoinFormView(function (userName) {
			socket = io.connect(options.nodeServer, {transports: ['websocket']});
			socket.on('connect', function () {
				if(_debug) console.log('CONNECTED', socket);
				localParticipant = new Participant();
				localParticipant.sid = socket.sid;
				localParticipant.identity = userName;
				roomParticipants.push(localParticipant);
				if(socket.connected) initOrConnectWithNodeJs()
			});
		});

		app.views.switchTo(joinFormView);
		app.views.createMainView();
		if(_isMobile) app.views.createParticipantsListView();

		window.addEventListener("orientationchange", function() {
			setTimeout(function () {
				if(_isMobile) app.views.updateOrientation();
			}, 1500);
		});

		window.addEventListener("resize", function() {
			setTimeout(function () {
				if(_isMobile) app.views.updateOrientation();
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


		if(_debug) console.log('START', socket);
		localParticipant = new Participant();
		localParticipant.sid = user.sid;
		localParticipant.identity = user.username;
		roomParticipants.push(localParticipant);
		initOrConnectWithNodeJs();
	}

	app.init = function(callback){
		console.log('options', options)
		if(options.mode == 'twilio') {
			require(['/Q/plugins/Streams/js/tools/webrtc/twilio-video.min.js?ts=' + (+new Date)], function (TwilioInstance) {
				Twilio = window.Twilio = TwilioInstance;
				initWithTwilio(callback);
			});
		} else {
			initWithNodeJs(callback);
		}
	}
	app.disconnect = function () {
		if(app.checkOnlineStatusInterval != null) {
			clearInterval(app.checkOnlineStatusInterval);
			app.checkOnlineStatusInterval = null;
		}
		if(app.sendOnlineStatusInterval != null) {
			clearInterval(app.sendOnlineStatusInterval);
			app.sendOnlineStatusInterval = null;
		}

		for(var p = roomParticipants.length - 1; p >= 0; p--){
			if(roomParticipants[p].soundMeter.script != null) roomParticipants[p].soundMeter.script.disconnect();
			if(roomParticipants[p].soundMeter.source != null) roomParticipants[p].soundMeter.source.disconnect();

			if(options.mode == 'node' && !roomParticipants[p].isLocal) {
				if (roomParticipants[p].RTCPeerConnection != null) roomParticipants[p].RTCPeerConnection.close();
				if (roomParticipants[p].iosrtcRTCPeerConnection != null) roomParticipants[p].iosrtcRTCPeerConnection.close();
			}

			roomParticipants[p].remove();
		}

		if(socket != null) socket.disconnect();

		if(twilioRoom != null) twilioRoom.disconnect();
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
			if(_debug) console.log('event dispatcher', eventName)
			if(!doesHandlerExist(eventName)) {
				return;
			}
			if(_debug) console.log('event dispatcher')

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

	/*var ua=navigator.userAgent;
	if(ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) _isiOS = true;
	var originallog = console.log;
	console.log = function (txt) {

		if(!socket || socket && !socket.connected) return;

		try {
			originallog.apply(console, arguments);
			//socket.emit('log', [arguments[0], arguments[1], ua])
		} catch (e) {

		}
	}*/

	/*for debugging purpose*/


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
