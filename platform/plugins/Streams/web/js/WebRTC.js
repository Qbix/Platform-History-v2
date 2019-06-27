"use strict";



if(typeof cordova != 'undefined' && window.device.platform === 'iOS') {
	/*document.addEventListener('deviceready', function () {
		try {
			if (window.device.platform === 'iOS') {
				cordova.plugins.iosrtc.registerGlobals();
			}
		} catch(e) {
		}
		var script = document.createElement('script');

		script.type = 'text/javascript';
		script.src = 'https://webrtc.github.io/adapter/adapter-1.0.2.js';

		document.getElementsByTagName('head')[0].appendChild(script);
	});*/

	/*	RTCPeerConnection = cordova.plugins.iosrtc.RTCPeerConnection
		RTCIceCandidate = cordova.plugins.iosrtc.RTCIceCandidate;
		RTCSessionDescription = cordova.plugins.iosrtc.RTCSessionDescription;*/
	//window.RTCPeerConnection.prototype.addStream = cordova.plugins.iosrtc.RTCPeerConnection.addStream;
	RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
	RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
	RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
} else {
	RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
	RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
	RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
}

var promisifiedOldGUM = function(constraints, successCallback, errorCallback) {

	var getUserMedia = (navigator.getUserMedia ||
		navigator.webkitGetUserMedia ||
		navigator.mozGetUserMedia ||
		navigator.msGetUserMedia);

	if(!getUserMedia) {
		return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
	}

	return new Promise(function(successCallback, errorCallback) {
		getUserMedia.call(navigator, constraints, successCallback, errorCallback);
	});

}

if(navigator.mediaDevices === undefined) navigator.mediaDevices = {};
if(navigator.mediaDevices.getUserMedia === undefined) navigator.mediaDevices.getUserMedia = promisifiedOldGUM;

window.AudioContext = window.AudioContext || window.webkitAudioContext;

(function (Q, $) {


	var Streams = Q.Streams;
	var _debug = false;
	var _debugTimer = {};
	var errorLog = '';
	var latestConsoleLog = '';

	/**
	 * Runs  adapter for Streams/webrtc tools
	 * @class Streams.WebRTC
	 * @constructor
	 * @param {Object} fields
	 */
	Streams.WebRTC = function Streams_WebRTC() {
		var WebRTCconference;
		var _options = {
			mediaDevicesDialog: true,
			startWith: {
				audio: true,
				video: false
			}
		};
		var _controls = null;
		var _controlsTool = null;
		var _roomsMedia = null;
		var _layoutTool = null;
		var _roomStream = null;
		var _renderedScreens = [];

		var updateQueryStringParameter = function(uri, key, value) {
			var re = new RegExp("([?|&])" + key + "=.*?(&|$)", "i");
			var separator = uri.indexOf('?') !== -1 ? "&" : "?";
			if (uri.match(re)) {
				return uri.replace(re, '$1' + key + "=" + value + '$2');
			}
			else {
				return uri + separator + key + "=" + value;
			}
		}

		var showPageLoader = function () {
			if(document.querySelector('.Streams_webrtc_page-loader-con') == null) {
				var loader = document.createElement('DIV');
				loader.className = 'Streams_webrtc_page-loader-con';
				loader.innerHTML = `<div class="Streams_webrtc_loader">
										<div class="Streams_webrtc_loader_square"></div>
										<div class="Streams_webrtc_loader_square"></div>
										<div class="Streams_webrtc_loader_square Streams_webrtc_loader_last"></div>
										<div class="Streams_webrtc_loader_square Streams_webrtc_loader_clear"></div>
										<div class="Streams_webrtc_loader_square"></div>
										<div class="Streams_webrtc_loader_square Streams_webrtc_loader_last"></div>
										<div class="Streams_webrtc_loader_square Streams_webrtc_loader_clear"></div>
										<div class="Streams_webrtc_loader_square"></div>
										<div class="Streams_webrtc_loader_square Streams_webrtc_loader_last"></div>
									</div>`;
				document.body.appendChild(loader);
			}
		}

		var hidePageLoader = function () {
			var loader = document.querySelector('.Streams_webrtc_page-loader-con');
			if(loader != null && loader.parentNode != null) {
				loader.parentNode.removeChild(loader);
			}
		}

		var createInfoSnippet = function(){
			var noticeContainer = document.createElement('div');
			noticeContainer.className = 'notice-container';

			document.body.appendChild(noticeContainer);
		}

		var log = function(message) {
			var noticeDiv = document.querySelector('.notice-container');
			noticeDiv.innerHTML = message;
			noticeDiv.classList.add('shown');
			setTimeout(function () {
				noticeDiv.classList.remove('shown');
			}, 4000)
		}

		/**
		 * Bind events that are needed for negotiating process to init WebRTC without using twilio
		 * @method bindStreamsEvents
		 * @param {Object} [stream] stream that represents room
		 */
		var bindStreamsEvents = function(stream) {
			var tool = this;

			stream.onMessage('Streams/join').set(function (stream, message) {
				if(_debug) console.log('%c STREAMS: ANOTHER USER JOINED', 'background:blue;color:white;', stream, message)
			});
			stream.onMessage('Streams/connected').set(function (stream, message) {
				if(_debug) console.log('%c STREAMS: ANOTHER USER JOINED', 'background:blue;color:white;', stream, message)
			});
		}

		/**
		 * Bind events that are triggered by twilio-video library
		 * @method bindConferenceEvents
		 */
		var bindConferenceEvents = function() {
			var tool = this;

			WebRTCconference.event.on('joined', function () {
				Q.Dialogs.pop();
			});

			WebRTCconference.event.on('participantConnected', function (participant) {
				if(_debug) console.log('%c TWILIO: ANOTHER USER JOINED', 'background:blue;color:white;', participant)

				var userId = participant.identity != null ? participant.identity.split('\t')[0] : null;

				if(userId != null){
					Q.Streams.get(userId, 'Streams/user/firstName', function () {
						var firstName = this.fields.content;
						log("Joining: " + firstName);
					});
				}

				screensRendering.updateLayout();
			});
			WebRTCconference.event.on('participantDisconnected', function (participant) {
				if(_debug) console.log('%c TWILIO: ANOTHER USER DISCONNECTED', 'background:blue;color:white;', participant)
				var userId = participant.identity != null ? participant.identity.split('\t')[0] : null;


				if(userId != null){
					Q.Streams.get(userId, 'Streams/user/firstName', function () {
						var firstName = this.fields.content;
						log(firstName + " left the room");
					});
				}
				screensRendering.updateLayout();
			});
			WebRTCconference.event.on('localParticipantDisconnected', function (participant) {
				if(_debug) console.log('%c TWILIO: ANOTHER USER DISCONNECTED', 'background:blue;color:white;', participant)

				log('You left the room');

				screensRendering.updateLayout();
			});
			WebRTCconference.event.on('screenAdded', function (participant) {
				console.log('%c TWILIO: SCREEN ADDED', 'background:blue;color:white;', participant)
				//screensRendering.updateLayout();
			});
			WebRTCconference.event.on('trackAdded', function (e) {
				console.log('%c TWILIO: TRACK ADDED', 'background:blue;color:white;', e)
				if(e.track.kind == 'video') e.screen.isActive = true;
				screensRendering.updateLayout();
			});

			WebRTCconference.event.on('videoTrackIsBeingAdded', function (screen) {
				if(_debug) console.log('%c TWILIO: TRACK videoTrackIsBeingAdded', 'background:blue;color:white;')
				screensRendering.updateLayout();
				screensRendering.showLoader('videoTrackIsBeingAdded', screen.participant);
			});

			WebRTCconference.event.on('videoTrackLoaded', function (e) {
				if(_debug) console.log('%c TWILIO: TRACK videoTrackLoaded', 'background:blue;color:white;')
				screensRendering.updateLayout();

				screensRendering.hideLoader('videoTrackLoaded', e.screen.participant);
				screensRendering.fitScreenToVideo(e.trackEl, e.screen, e.reset, e.oldSize);
				if(e.trackEl) {
					e.trackEl.play();
				}
			});

			WebRTCconference.event.on('screensharingStarting', function (data) {
				if(_debug) console.log('%c TWILIO: TRACK screensharingStarting', 'background:blue;color:white;')

				screensRendering.showLoader('screensharingStarting', data.participant);
			});

			WebRTCconference.event.on('afterCamerasToggle', function (e) {
				screensRendering.hideLoader('afterCamerasToggle', e.participant);
			});
			WebRTCconference.event.on('beforeCamerasToggle', function (e) {
				screensRendering.showLoader('beforeCamerasToggle', e.participant);
			});
			WebRTCconference.event.on('screensharingStarted', function (data) {
				//screensRendering.hideLoader('screensharingStarting', data.participant);
			});
			WebRTCconference.event.on('screensharingFailed', function (e) {
				console.log('screensharingFailed')
				screensRendering.hideLoader('screensharingFailed', e.participant);
			});
		}

		var showPermissionsDialogue = function () {
			//if(typeof cordova != "undefined" && window.device.platform === 'iOS') return;

			var micIcon = '<svg class="microphone-icon" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"    y="0px" viewBox="-0.165 -0.245 99.499 99.498"    enable-background="new -0.165 -0.245 99.499 99.498" xml:space="preserve">  <path fill="#FFFFFF" d="M49.584-0.245c-27.431,0-49.749,22.317-49.749,49.749c0,27.432,22.317,49.749,49.749,49.749   c27.432,0,49.75-22.317,49.75-49.749C99.334,22.073,77.016-0.245,49.584-0.245z M41.061,32.316c0-4.655,3.775-8.43,8.431-8.43   c4.657,0,8.43,3.774,8.43,8.43v19.861c0,4.655-3.773,8.431-8.43,8.431c-4.656,0-8.431-3.775-8.431-8.431V32.316z M63.928,52.576   c0,7.32-5.482,13.482-12.754,14.336v5.408h6.748v3.363h-16.86V72.32h6.749v-5.408c-7.271-0.854-12.753-7.016-12.754-14.336v-10.33   h3.362v10.125c0,6.115,4.958,11.073,11.073,11.073c6.116,0,11.073-4.958,11.073-11.073V42.246h3.363V52.576z"/>  </svg>';
			var cameraIcon = '<svg class="camera-icon" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="-0.165 -0.245 99.499 99.498" enable-background="new -0.165 -0.245 99.499 99.498"    xml:space="preserve">  <path fill="#FFFFFF" class="cameraPath" d="M49.584-0.245c-27.431,0-49.749,22.317-49.749,49.749c0,27.432,22.317,49.749,49.749,49.749   c27.432,0,49.75-22.317,49.75-49.749C99.334,22.073,77.016-0.245,49.584-0.245z M77.156,60.693l-15.521-8.961v8.51H25.223v-23.42   h36.412v8.795l15.521-8.961V60.693z"/>  </svg>';


			var addStreamToRoom = function(stream) {
				if(_options.stream != null) return;

				if(WebRTCconference != null){

					var publishTracks = function () {
						var tracks = stream.getTracks();
						for(var t in tracks) {
							WebRTCconference.conferenceControl.addTrack(tracks[t], stream);
						}

						navigator.mediaDevices.enumerateDevices().then(function (mediaDevices) {
							WebRTCconference.conferenceControl.loadDevicesList(mediaDevices);
						}).catch(function (e) {
							console.error('ERROR: cannot get device info: ' + e.message);
						});
					}

					if(WebRTCconference.state == 'connected' && _options.stream == null) {
						publishTracks();
					} else {
						WebRTCconference.event.on('joined', function () {
							if (_options.stream == null) {
								publishTracks();
							}
						});
					}

				} else if (_options.stream == null) {
					_options.stream = stream;
				}
				Q.Dialogs.pop();
			}

			navigator.mediaDevices.enumerateDevices().then(function (mediaDevices) {
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

				if(_options.mediaDevicesDialog) {
					Q.Text.get("Streams/content", function (err, result) {
						var mediaDevicesDialog = document.createElement('DIV');
						mediaDevicesDialog.className = 'Streams_webrtc_devices_dialog_inner';
						var turnOnBtn = document.createElement('BUTTON');
						turnOnBtn.type = 'button';
						turnOnBtn.className = 'Q_button Streams_webrtc_enable-microphone-btn';
						var btnText = document.createElement('SPAN');
						turnOnBtn.appendChild(btnText)
						var titleText;
						if (_options.startWith.audio) {
							turnOnBtn.innerHTML = micIcon + turnOnBtn.innerHTML;
							titleText = 'microphoneTitle';
						}
						if (_options.startWith.video) {
							turnOnBtn.innerHTML = turnOnBtn.innerHTML + cameraIcon;
							titleText = 'cameraTitle';
						}
						if (_options.startWith.audio && _options.startWith.video) {
							titleText = 'cameraAndMicrophoneTitle';
						}
						var text = Q.getObject("webrtc.allow." + titleText, result);
						turnOnBtn.querySelector('SPAN').innerHTML = text;


						mediaDevicesDialog.appendChild(turnOnBtn);
						mediaDevicesDialog.addEventListener('mouseup', function (e) {
							navigator.mediaDevices.getUserMedia({video: _options.startWith.video && videoDevices != 0, audio:_options.startWith.audio && audioDevices != 0})
								.then(function (stream) {
									addStreamToRoom(stream);
								}).catch(function (err) {
								console.error(err.name + ": " + err.message);
							});
						});

						Q.Dialogs.push({
							title: text,
							className: 'Streams_webrtc_devices_dialog Q_working',
							content: mediaDevicesDialog,
							apply: true,
						});

					})
				}
				console.log('_options.startWith',_options.startWith)
				navigator.mediaDevices.getUserMedia({video: _options.startWith.video && videoDevices != 0, audio:_options.startWith.audio && audioDevices != 0})
					.then(function (stream) {
						addStreamToRoom(stream);
					}).catch(function(err) {
					console.error(err.name + ": " + err.message);
				});
			}).catch(function (e) {
				console.error('ERROR: cannot get device info: ' + e.message);
			});
		}

		var publishMediaTracks = function () {
			navigator.mediaDevices.enumerateDevices().then(function (mediaDevices) {
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
				navigator.mediaDevices.getUserMedia({video: _options.startWith.video && videoDevices != 0, audio:_options.startWith.audio && audioDevices != 0})
					.then(function (stream) {
						if(_options.stream != null) return;
						//Q.Dialogs.pop();
						if(WebRTCconference != null){
							_options.stream = stream;
							var publishTracks = function() {
								var tracks = stream.getTracks();
								for(var t in tracks) {
									WebRTCconference.conferenceControl.addTrack(tracks[t], stream);
								}

								navigator.mediaDevices.enumerateDevices().then(function (mediaDevices) {
									WebRTCconference.conferenceControl.loadDevicesList(mediaDevices);
								}).catch(function (e) {
									console.error('ERROR: cannot get device info: ' + e.message);
								});
							}

							if(WebRTCconference.state == 'connected') {
								publishTracks();
								Q.Dialogs.pop();
							} else {
								WebRTCconference.event.on('joined', function () {
									publishTracks();
									Q.Dialogs.pop();
								});
							}
						} else if (_options.stream == null) {
							_options.stream = stream;

						}
					}).catch(function(err) {
					console.error(err.name + ": " + err.message);
				});
			}).catch(function (e) {
				console.error('ERROR: cannot get device info: ' + e.message);
			});
		}

		/**
		 * Connect webrtc room using twilio.
		 * @method startTwilioRoom
		 */
		var startTwilioRoom = function(roomId, accessToken) {

			Q.addScript([
				/*"https://cdn.trackjs.com/agent/v3/latest/t.js",*/
				"https://requirejs.org/docs/release/2.2.0/minified/require.js",
				"{{Streams}}/js/tools/webrtc/app.js?ts=" + (+Date.now())
			], function () {
				var ua=navigator.userAgent;
				//if (typeof cordova != 'undefined' && window.device.platform === 'iOS') {
				/*window.TrackJS && TrackJS.install({
					token: "8ad86f4c024d4cb3860839694aa5670e"
					// for more configuration options, see https://docs.trackjs.com
				});*/
				//}


				var twilioRoomName = _roomStream.getAttribute('twilioRoomName');

				console.log('twilioRoomName', twilioRoomName)
				console.log('startTwilioRoom _options.startWith',_options.startWith)
				WebRTCconference = window.WebRTCconferenceLib({
					mode:'twilio',
					roomName:twilioRoomName,
					twilioAccessToken: accessToken,
					useAsLibrary: true,
					video: false,
					audio: false,
					stream: _options.stream != null ? _options.stream : null
				});
				window.WebConf = WebRTCconference;

				bindConferenceEvents();
				WebRTCconference.init(function () {
					screensRendering.updateLayout();
					updateParticipantData();
					hidePageLoader();
					_debugTimer.loadEnd = performance.now();
					log("You joined the room");

					Q.activate(
						document.body.appendChild(
							Q.Tool.setUpElement(
								"div", // or pass an existing element
								"Streams/webrtc/controls",
								{webRTClibraryInstance: WebRTCconference, webrtcClass: module}
							)
						),
						{},
						function () {
							_controls = this.element;
							_controlsTool = this;
							screensRendering.updateLayout();
						}
					);
				});

			});
		}
		var updateParticipantData = function() {
			Q.req("Streams/webrtc", ["updateParticipantSid"], function (err, response) {
				var msg = Q.firstErrorMessage(err, response && response.errors);

				if (msg) {
					return Q.alert(msg);
				}

			}, {
				method: 'put',
				fields: {
					streamName: _roomStream.fields.name,
					publisherId: _options.roomPublisherId,
					twilioParticipantSid: WebRTCconference.localParticipant().sid,
				}
			})
		}

		/**
		 * Init conference using own node.js server.
		 * @method initWithStreams
		 */
		var initWithNodeServer = function(turnCredentials) {
			if(_debug) console.log('initWithNodeServer');

			Q.addScript([
				"https://requirejs.org/docs/release/2.2.0/minified/require.js",
				"https://cdn.trackjs.com/agent/v3/latest/t.js",
				"{{Streams}}/js/tools/webrtc/app.js?ts=" + (+Date.now())
			], function () {
				//if (typeof cordova != 'undefined' && window.device.platform === 'iOS') {
				/*window.TrackJS && TrackJS.install({
					token: "8ad86f4c024d4cb3860839694aa5670e"
					// for more configuration options, see https://docs.trackjs.com
				});*/
				//}


				var roomId = (_roomStream.fields.name).replace('Streams/webrtc/', '');
				WebRTCconference = window.WebRTCconferenceLib({
					mode:'nodejs',
					useAsLibrary: true,
					nodeServer: _options.nodeServer,
					roomName: roomId,
					sid:  Q.Users.loggedInUser.id,
					username:  Q.Users.loggedInUser.id + '\t' + Date.now(),
					video: false,
					audio: false,
					stream: _options.stream != null ? _options.stream : null,
					turnCredentials: turnCredentials
				});

				bindConferenceEvents();
				WebRTCconference.init(function () {
					hidePageLoader();
					_debugTimer.loadEnd = performance.now();
					screensRendering.updateLayout();

					Q.activate(
						document.body.appendChild(
							Q.Tool.setUpElement(
								"div", // or pass an existing element
								"Streams/webrtc/controls",
								{webRTClibraryInstance: WebRTCconference, webrtcClass: module}
							)
						),
						{},
						function () {
							_controls = this.element;
							_controlsTool = this;
							screensRendering.updateLayout();
						}
					);

				});
				window.WebConf = WebRTCconference;


			});
		}

		/**
		 * Render screens of all participants of the room
		 * @method screensRendering
		 */
		var screensRendering = (function () {
			var activeScreen;
			var viewMode;
			if(Q.info.isMobile){
				viewMode = 'maximizedMobile';
			} else viewMode = 'maximized';


			/**
			 * Updates current layout; usually is called by WebRTC events handlers
			 * @method updateLayout
			 */
			function updateLayout() {
				if(WebRTCconference == null) return;


				var roomScreens = WebRTCconference.screens(true);
				var i, participantScreen;
				for(i = 0; participantScreen = roomScreens[i]; i++) {
					createRoomScreen(participantScreen);
				}

				function doPlayTracks() {
					var i, screen;
					for (i = 0; screen = roomScreens[i]; i++) {
						if(screen.videoTrack != null && screen.isActive) {
							var promise = screen.videoTrack.play();
							if (promise !== undefined) {
								promise.catch(error => {
									// Auto-play was prevented
									// Show a UI element to let the user manually start playback
								}).then(() => {
									// Auto-play started
								});
							}
						}
					}
				}


				if(Q.info.isMobile){

					if(viewMode == 'tiledMobile'){
						renderTiledScreenGridMobile();
					} else if(viewMode == 'maximizedMobile') {
						if(activeScreen == null && roomScreens.length == 2) {
							var i, screen;
							for(i = 0; screen = roomScreens[i]; i++) {
								if(!screen.isLocal) {
									activeScreen = screen;
								}
							}
						}

						if(activeScreen != null && !_roomsMedia.contains(activeScreen.screenEl)) {
							activeScreen = roomScreens[0];
						}

						renderMaximizedScreensGridMobile();
					}

					doPlayTracks()
				} else {
					//renderMinimizedScreensGrid()
					if(viewMode == null || viewMode == 'regular'){
						renderDesktopScreensGrid();
					} else if(viewMode == 'minimized'){
						renderMinimizedScreensGrid();
					} else if(viewMode == 'maximized'){
						renderMaximizedScreensGrid();
					} else if(viewMode == 'tiled'){
						renderTiledScreenGridDesktop();
					}

					doPlayTracks();

				}

				bindScreensEvents();
			}

			/**
			 * Create participant's screen element that will be rendered one the page
			 * @method createRoomScreen
			 * @param {Object} [screen] screen object generated by webrtc WebRTCconference library
			 */
			function createRoomScreen(screen) {
				if(screen.screenEl != null) {
					if(screen.isLocal) updateLocalScreenClasses(screen);
					return screen.screenEl;
				}
				var chatParticipantEl = document.createElement('DIV');
				chatParticipantEl.className = 'Streams_webrtc_chat-participant';
				chatParticipantEl.dataset.participantName = screen.sid;
				var chatParticipantVideoCon = screen.videoCon;
				//var chatParticipantVideoCon = document.createElement("DIV");
				//chatParticipantVideoCon.className = 'Streams_webrtc_chat-participant-video Q_tool Q_resize_tool';
				chatParticipantVideoCon.className = 'Streams_webrtc_chat-participant-video';
				var chatParticipantName = document.createElement('DIV');
				chatParticipantName.className = 'Streams_webrtc_chat-participant-name';
				var participantVoice = screen.soundEl;
				participantVoice.className = "Streams_webrtc_participant-voice";
				var participantNameTextCon = document.createElement("DIV");
				participantNameTextCon.className = "Streams_webrtc_participant-name-text";
				var participantNameText = document.createElement("DIV");
				var userId = screen.participant.identity != null ? screen.participant.identity.split('\t')[0] : Q.Users.loggedInUser.id;

				Q.activate(
					Q.Tool.setUpElement(
						participantNameText, // or pass an existing element
						"Users/avatar",
						{
							userId: userId,
							icon: false
						}
					),
					{},
					function () {
						setTimeout(function () {
							screensRendering.updateLayout();
						}, 1000);

					}
				);

				WebRTCconference.screensInterface.audioVisualization().build({
					name:'participantScreen',
					participant: screen.participant,
					element:participantVoice,
					stopOnMute:true,
				});


				participantNameTextCon.appendChild(participantNameText);
				chatParticipantName.appendChild(participantNameTextCon);
				chatParticipantName.appendChild(participantVoice);
				chatParticipantEl.appendChild(chatParticipantName);

				if(!Q.info.isMobile) {

					var screensBtns= document.createElement("DIV");
					screensBtns.className = "Streams_webrtc_participant-screen-btns";
					var maximizeBtn = document.createElement("BUTTON");
					maximizeBtn.className = 'Streams_webrtc_maximize-btn'
					maximizeBtn.innerHTML = '<img src="' + Q.url('{{Q}}/img/grow.png') + '">';
					var minimizeBtn = document.createElement("BUTTON");
					minimizeBtn.className = 'Streams_webrtc_minimize-btn';
					minimizeBtn.style.display = 'none';
					minimizeBtn.innerHTML = '<img src="' + Q.url('{{Q}}/img/shrink.png') + '">';
					screensBtns.appendChild(maximizeBtn)
					screensBtns.appendChild(minimizeBtn)
					chatParticipantName.appendChild(screensBtns);

					maximizeBtn.addEventListener('click', function (e) {
						e.preventDefault();
						e.stopPropagation();
					});

					minimizeBtn.addEventListener('click', function (e) {
						e.preventDefault();
						e.stopPropagation();
					});

					$(minimizeBtn).plugin('Q/clickable', {
						className: 'Streams_webrtc_minimize-btn',
						press: {size: 1.2},
						release: {size: 1.2}
					}).on(Q.Pointer.fastclick, function () {
						renderMinimizedScreensGrid();
					});

					$(maximizeBtn).plugin('Q/clickable', {
						className: 'Streams_webrtc_maximize-btn',
						press: {size: 1.2},
						release: {size: 1.2}
					}).on(Q.Pointer.fastclick, function () {
						renderMaximizedScreensGrid(screen);

					});
				}


				chatParticipantEl.appendChild(chatParticipantVideoCon);


				if(Q.info.isTouchscreen) {
					chatParticipantEl.addEventListener('touchstart', moveScreenFront);
				} else chatParticipantEl.addEventListener('mousedown', moveScreenFront);

				chatParticipantVideoCon.addEventListener('click', function (e) {
					e.preventDefault();
				});
				if(Q.info.isTouchscreen) {
					window.addEventListener('touchend', function (e) {
						var target = e.target;
						if (target == chatParticipantEl || chatParticipantEl.contains(target)) {
							toggleViewModeByScreenClick(e);
						}
					}, false);
				} else chatParticipantEl.addEventListener('click', toggleViewModeByScreenClick);

				screen.screenEl = chatParticipantEl;
				screen.nameEl = chatParticipantName;
				//screen.soundEl = participantVoice;

				if(screen.isLocal) updateLocalScreenClasses(screen);

				_renderedScreens.push(chatParticipantEl);
				return chatParticipantEl;
			}

			/**
			 * Make screens resizible and movable
			 * @method bindScreensEvents
			 */
			function bindScreensEvents() {

				var screens = WebRTCconference.screens();
				var i, participantScreen;
				for(i = 0; participantScreen = screens[i]; i++) {

					var resizeTool = Q.Tool.from(participantScreen.screenEl, "Q/resize");
					if(resizeTool == null) {
						Q.activate(
							Q.Tool.setUpElement(
								participantScreen.screenEl, // or pass an existing element
								"Q/resize",
								{
									movable: true,
									active: true,
									keepRatioBasedOnElement: participantScreen.videoTrack
								}
							),
							{},
							function () {
								var tool = this;
								tool.state.onResized.add(function () {
									var movedScreen = WebRTCconference.screens().filter(function (s) {
										return s.screenEl == tool.element || s.screenEl.contains(tool.element);
									});

									if(movedScreen[0] != null) movedScreen[0].excludeFromRendering = true;
								}, tool);
								/*tool.state.onMovingStart.add(function () {
									if(typeof cordova != "undefined" && window.device.platform === 'iOS') {
										var movedScreen = WebRTCconference.screens().filter(function (s) {
											return s.screenEl == tool.element || s.screenEl.contains(tool.element);
										});
										if(movedScreen.videoTrack != null) {
											smovedScreen.videoTrack.style.visibility = 'hidden';
											cordova.plugins.iosrtc.refreshVideos();
										}
									}

								}, tool);
								tool.state.onMovingStop.add(function () {
									if(typeof cordova != "undefined" && window.device.platform === 'iOS') {
										var movedScreen = WebRTCconference.screens().filter(function (s) {
											return s.screenEl == tool.element || s.screenEl.contains(tool.element);
										});
										if(movedScreen.videoTrack != null) {
											movedScreen.videoTrack.style.visibility = '';
											cordova.plugins.iosrtc.refreshVideos();
										}
									}

								}, tool);*/
								/*if(viewMode != 'regular')
									tool.deactivate()
								else tool.state.active = true;*/
							}
						);
					}

				}
			}

			function getElementSizeKeepingRatio(initSize, baseSize) {

				//var ratio = initSize.width / initSize.height;
				var ratio = Math.min(baseSize.width / initSize.width, baseSize.height / initSize.height);
				/*var elementWidth, elementHeight;
				if (ratio < 1) {
					console.log('getElementSizeKeepingRatio VERTICLE');
					elementWidth = parseInt(baseSize.height * ratio);
					elementHeight = baseSize.height;

				} else {
					console.log('getElementSizeKeepingRatio HORIZONTAL');
					elementHeight = parseInt( baseSize.width / ratio);
					elementWidth = baseSize.width;

				}*/


				/*if(baseSize.height != null && elementHeight > baseSize.height) {
					console.log('getElementSizeKeepingRatio OVERSIZE');

					elementWidth = Math.round(baseSize.height * ratio);
					elementHeight = ( elementWidth / ratio);

				}*/

				//return {width:elementWidth, height:elementHeight, ratio: ratio};

				return { width: Math.floor(initSize.width*ratio), height: Math.floor(initSize.height*ratio)};
			}

			function fitScreenToVideo(videoEl, screen, reset, oldSize) {
				if(videoEl.videoHeight != null && videoEl.videoWidth != null && videoEl.videoHeight != 0 && videoEl.videoWidth != 0 && videoEl.parentNode != null) {

					var videoCon = screen.videoCon;
					if (videoEl.videoHeight > videoEl.videoWidth) {
						if ((viewMode == 'maximized' || viewMode == 'maximizedMobile' || viewMode == 'regular') && !videoEl.parentNode.classList.contains('isVertical')) videoEl.parentNode.classList.add('isVertical');
						videoEl.className = 'isVertical';
					} else if (videoEl.videoWidth) {
						if ((viewMode == 'maximized' || viewMode == 'maximizedMobile' || viewMode == 'regular') && !videoEl.parentNode.classList.contains('isHorizontal')) videoEl.parentNode.classList.add('isHorizontal');
						videoEl.className = 'isHorizontal';
					}

				}

				var resizeTool = Q.Tool.from(screen.screenEl, "Q/resize");
				if(resizeTool != null) {
					resizeTool.state.keepRatioBasedOnElement = videoEl;
				}


				if((screen.screenEl.style.width != '' || screen.screenEl.style.height != '') && !reset) return;
				if(videoEl.videoHeight == null || videoEl.videoWidth == null) return;

				var videoCon = screen.videoCon;
				var elRect = screen.screenEl.getBoundingClientRect();
				var nameElRect = screen.nameEl.getBoundingClientRect();

				var videoElWidth;
				var videoElHeight;
				var ratio0 = videoEl.videoWidth / videoEl.videoHeight;
				var elementWidth, elementHeight;
				if (ratio0 < 1) {
					/* if(viewMode == 'maximized')  {
						 videoCon.style.width = '';
						 videoCon.style.height = '';
						 videoEl.style.width = '';
						 videoEl.style.height = '';
						 return;
					 }*/

					/* elementWidth = parseInt(290 * ratio0);
					 elementHeight = 290;
					 videoEl.style.width = '100%';
					 videoEl.parentNode.style.flexDirection = 'column';*/
					videoEl.style.display = '';


					screensRendering.updateLayout();

				} else {
					/*if(viewMode == 'maximized')  {
						videoCon.style.width = '';
						videoCon.style.height = '';
						videoEl.style.height = '';
						videoEl.style.width = '';
						return;
					}*/

					/* var mainScreenCon = document.querySelector('Streams_webrtc_maximized-main-screen');
					 var defaultWidth = 200
					 var videoElWidth = oldSize != null && oldSize.width != null ? oldSize.width : defaultWidth;
					 elementHeight = parseInt(videoElWidth / ratio0);
					 elementWidth = videoElWidth;*/

					// videoEl.style.width = '100%';
					videoEl.style.display = '';
					screensRendering.updateLayout();
				}
				//videoCon.style.width = elementWidth + 'px';
				//videoCon.style.height = elementHeight + 'px';

			}

			function updateLocalScreenClasses(screen) {

				if(screen.screensharing == true) {
					if(!screen.screenEl.classList.contains('screensharing')) screen.screenEl.classList.add('screensharing');
					if(screen.videoCon.classList.contains('flipped')) screen.videoCon.classList.remove('flipped');
				}


				var frontCameraDevice = WebRTCconference.conferenceControl.frontCameraDevice();
				var currentCameraDevice = WebRTCconference.conferenceControl.currentCameraDevice();
				if(!screen.screensharing && currentCameraDevice == frontCameraDevice) {
					if(screen.videoCon != null && !screen.videoCon.classList.contains('flipped')) screen.videoCon.classList.add('flipped');
					if(screen.screenEl.classList.contains('screensharing')) screen.screenEl.classList.remove('screensharing');
				} else if(screen.videoCon) {
					if(screen.videoCon.classList.contains('flipped')) screen.videoCon.classList.remove('flipped');
				}
			}

			function updateScreensButtons() {
				if(Q.info.isMobile) return;
				var screens = WebRTCconference.screens();

				if(viewMode == 'regular') {
					var i, screen;
					for (i = 0; screen = screens[i]; i++) {
						var maximizeBtn = screen.nameEl.querySelector('.Streams_webrtc_maximize-btn');
						var minimizeBtn = screen.nameEl.querySelector('.Streams_webrtc_minimize-btn');
						maximizeBtn.style.display = '';
						minimizeBtn.style.display = 'none';
					}

				} else if(viewMode == 'maximized') {
					var i, screen;
					for (i = 0; screen = screens[i]; i++) {

						var maximizeBtn = screen.nameEl.querySelector('.Streams_webrtc_maximize-btn');
						var minimizeBtn = screen.nameEl.querySelector('.Streams_webrtc_minimize-btn');
						if(screen == activeScreen) {
							maximizeBtn.style.display = 'none';
							minimizeBtn.style.display = '';
						} else {
							maximizeBtn.style.display = '';
							minimizeBtn.style.display = 'none';
						}
					}

				} else if(viewMode == 'minimized' || viewMode == 'tiled') {
					var i, screen;
					for (i = 0; screen = screens[i]; i++) {
						var maximizeBtn = screen.nameEl.querySelector('.Streams_webrtc_maximize-btn');
						var minimizeBtn = screen.nameEl.querySelector('.Streams_webrtc_minimize-btn');
						maximizeBtn.style.display = '';
						minimizeBtn.style.display = 'none';
					}
				}

			}

			function resetAudioVisualization() {
				var participants = WebRTCconference.roomParticipants();
				for (var i in participants) {
					if(participants[i].soundMeter.visualizations.participantScreen != null) participants[i].soundMeter.visualizations.participantScreen.reset();
				}
			}

			function moveScreenFront(e) {
				console.log('moveScreenFront');

				var screenEl = this;
				var screens = WebRTCconference.screens();
				var currentHighestZIndex = Math.max.apply(Math, screens.map(function(o) { return o.screenEl != null && o.screenEl.style.zIndex != '' ? o.screenEl.style.zIndex : 1000; }))
				screenEl.style.zIndex = currentHighestZIndex+1;

				if(typeof cordova != "undefined" && window.device.platform === 'iOS') {
					var video = screenEl.querySelector('video');
					console.log('moveScreenFront video ' + (video != null));
					if(video != null) video.style.zIndex = currentHighestZIndex+1;
					cordova.plugins.iosrtc.refreshVideos();
				}

			}

			function moveScreenBack(screenEl) {
				var screens = WebRTCconference.screens();

				var currentLowestZIndex = Math.min.apply(Math, screens.map(function(o) {
					return o.screenEl != null && o.screenEl.style.zIndex != '' ? o.screenEl.style.zIndex : 1000;
				}).filter(function (el) {return el != null;}))

				screenEl.style.zIndex = currentLowestZIndex-1;

				if(typeof cordova != "undefined" && window.device.platform === 'iOS') {
					var video = screenEl.querySelector('video');
					if(video != null) video.style.zIndex = currentLowestZIndex-1;
					cordova.plugins.iosrtc.refreshVideos();
				}
			}

			function showLoader(loaderName, participant) {
				console.log('showLoader')
				var screen = participant.screens[0];
				if(screen != null) screen.videoIsChanging = true;
				participant.videoIsChanging = true;
				console.log('showLoader screen', screen)

				if(loaderName == 'videoTrackIsBeingAdded' || loaderName == 'beforeCamerasToggle') {
					var loader = screen.screenEl.querySelector('.spinner-load');
					if(loader != null) return;
					var loaderCon = document.createElement('DIV');
					loaderCon.className = 'spinner-load';
					loaderCon.innerHTML = '<div class="sk-circle">\n' +
						'  <div class="sk-circle1 sk-child"></div>\n' +
						'  <div class="sk-circle2 sk-child"></div>\n' +
						'  <div class="sk-circle3 sk-child"></div>\n' +
						'  <div class="sk-circle4 sk-child"></div>\n' +
						'  <div class="sk-circle5 sk-child"></div>\n' +
						'  <div class="sk-circle6 sk-child"></div>\n' +
						'  <div class="sk-circle7 sk-child"></div>\n' +
						'  <div class="sk-circle8 sk-child"></div>\n' +
						'  <div class="sk-circle9 sk-child"></div>\n' +
						'  <div class="sk-circle10 sk-child"></div>\n' +
						'  <div class="sk-circle11 sk-child"></div>\n' +
						'  <div class="sk-circle12 sk-child"></div>\n' +
						'</div>';

					screen.screenEl.appendChild(loaderCon);
				} else if(loaderName == 'screensharingStarting') {
					var loader = screen.screenEl.querySelector('.spinner-load');
					if(loader != null) return;
					var loaderCon = document.createElement('DIV');
					loaderCon.className = 'spinner-load';
					var loaderIcon = document.createElement('DIV');
					loaderIcon.className = 'Streams_webrtc_screen-sharing';
					loaderIcon.innerHTML = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="130.35 175.058 235.692 150.425"    enable-background="new 130.35 175.058 235.692 150.425" xml:space="preserve">  <path shape-rendering="auto" image-rendering="auto" color-rendering="auto" fill="#FFFFFF" d="M153.86,175.058   c-6.743,0-12.271,5.542-12.271,12.285v110.45c0,6.743,5.528,12.271,12.271,12.271h188.672c6.742,0,12.271-5.527,12.271-12.271   V187.343c0-6.743-5.527-12.285-12.271-12.285L153.86,175.058L153.86,175.058z M153.86,182.085h188.672   c2.971,0,5.243,2.285,5.243,5.257v110.45c0,2.972-2.272,5.243-5.243,5.243H153.86c-2.971,0-5.243-2.271-5.243-5.243V187.343   C148.617,184.371,150.889,182.085,153.86,182.085L153.86,182.085z"/>  <path fill="#FFFFFF" d="M130.35,312.092c0,7.418,5.123,13.391,11.483,13.391H354.56c6.36,0,11.482-5.973,11.482-13.391H130.35z    M265.75,316.858h-35.101c-0.542,0-0.978-0.437-0.978-0.978s0.436-0.979,0.978-0.979h35.101c0.542,0,0.978,0.436,0.978,0.979   C266.728,316.422,266.292,316.858,265.75,316.858z"/>  <path fill="#FFFFFF" d="M193.391,291.705c-0.146,0-0.294-0.021-0.44-0.063c-0.729-0.214-1.198-0.92-1.113-1.675   c7.413-65.442,58.168-70.528,73.548-70.528c1.435,0,2.632,0.042,3.541,0.09v-20.55c0-0.63,0.379-1.199,0.961-1.442   c0.58-0.242,1.252-0.113,1.701,0.332l32.512,32.179c0.296,0.293,0.463,0.694,0.463,1.111s-0.167,0.817-0.465,1.111l-32.512,32.114   c-0.448,0.443-1.119,0.575-1.7,0.33c-0.581-0.242-0.96-0.812-0.96-1.441v-20.548c-1.78-0.149-3.449-0.185-4.634-0.185   c-13.734,0-48,4.706-69.501,48.296C194.523,291.378,193.973,291.705,193.391,291.705z"/>  </svg>';
					loaderCon.appendChild(loaderIcon);
					screen.screenEl.appendChild(loaderCon);
					screen.screensharing = true;
					_controlsTool.participantsPopup().showScreen(screen);

					if(Q.info.isMobile){
						renderMaximizedScreensGridMobile(screen);
					} else {
						renderMaximizedScreensGrid(screen);
					}
				}
			}

			function hideLoader(loaderName, participant) {
				console.log('hideLoader', participant)
				var screen = participant.screens[0];
				screen.videoIsChanging = false;
				participant.videoIsChanging = false;
				if(loaderName == 'screensharingFailed' || loaderName == 'videoTrackLoaded' || loaderName == 'afterCamerasToggle') {
					var loader = screen.screenEl.querySelector('.spinner-load');
					if(loader != null && loader.parentNode != null) loader.parentNode.removeChild(loader);
				}

				if(loaderName == 'screensharingFailed'){
					screen.screensharng = false;
				}
				if(typeof cordova != 'undefined' && window.device.platform === 'iOS') cordova.plugins.iosrtc.refreshVideos();
			}

			function toggleViewModeByScreenClick(e) {
				if(_debug) console.log('toggleViewModeByScreenClick')
				e.stopImmediatePropagation();
				e.preventDefault();
				var roomScreens = WebRTCconference.screens();

				var tappedScreen = roomScreens.filter(function (obj) {
					return obj.screenEl.contains(e.target) || obj.screenEl == e.target;
				})[0];

				if(tappedScreen == null) return;
				var resizeTool = Q.Tool.from(tappedScreen.screenEl, "Q/resize");
				var videoResizeTool = Q.Tool.from(tappedScreen.videoCon, "Q/resize");
				if(resizeTool != null) {
					if(resizeTool.state.appliedRecently) return;
				}
				if(videoResizeTool != null) {
					if(videoResizeTool.state.appliedRecently) return;
				}

				function enableAllScreenToRender() {
					roomScreens.map(function (obj) {
						obj.excludeFromRendering = false;
						return obj;
					});
				}

				if(_controlsTool != null) _controlsTool.participantsPopup().disableLoudesScreenMode();

				if(activeScreen && !activeScreen.screenEl.contains(e.target)) {

					enableAllScreenToRender();

					tappedScreen.screenEl.style.zIndex = '';

					if(Q.info.isMobile){
						renderMaximizedScreensGridMobile(tappedScreen);
					} else renderMaximizedScreensGrid(tappedScreen);

					return;
				} else if (activeScreen && activeScreen.excludeFromRendering && (activeScreen.screenEl.contains(e.target) || activeScreen.screenEl == e.target)) {

					enableAllScreenToRender();

					if(Q.info.isMobile){
						renderMaximizedScreensGridMobile(tappedScreen);
					} else renderMaximizedScreensGrid(tappedScreen);

					return;
				}

				enableAllScreenToRender();
				toggleViewMode(tappedScreen);
				bindScreensEvents();
				//fullScreenGrid()
				//if(Q.info.isMobile)
				//  renderMaximizedScreensGridMobile()
				//else mainScreenAndThumbsGrid();
			}

			function toggleViewMode(tappedScreen) {
				var modes;
				if(Q.info.isMobile)
					modes = ['tiledMobile', 'maximizedMobile'];
				else modes = ['regular', 'maximized', 'tiled'];

				var i, mode, modeToSwitch;

				for(i = 0; mode = modes[i]; i++){
					if(mode == viewMode || viewMode == null) {
						if(i != modes.length-1){
							modeToSwitch = modes[i+1];
						} else modeToSwitch = modes[0];
						break;
					}
				};



				if(_debug) console.log('toggleViewMode', modeToSwitch)
				if(modeToSwitch == null || modeToSwitch == 'regular') {
					renderDesktopScreensGrid();
				} else if(modeToSwitch == 'minimized') {
					renderMinimizedScreensGrid();
				} else if(modeToSwitch == 'maximized') {
					renderMaximizedScreensGrid(tappedScreen);
				} else if(modeToSwitch == 'tiledMobile') {
					renderTiledScreenGridMobile();
				} else if(modeToSwitch == 'maximizedMobile') {
					renderMaximizedScreensGridMobile(tappedScreen);
				} else if(modeToSwitch == 'tiled') {
					var roomScreens = WebRTCconference.screens();
					if(roomScreens.length == 1) {
						modeToSwitch = 'regular';
						renderDesktopScreensGrid();
					} else renderTiledScreenGridDesktop();

				}

				viewMode = modeToSwitch;
			}

			/**
			 * Changes class of screens and its container depending on passed layout when layout is being changed
			 * @method toggleScreensClass
			 * @param {String} [layout] layout name
			 */
			function toggleScreensClass(layout) {
				if(_debug) console.log('toggleScreensClass', layout);
				var gridClasses = [
					'Streams_webrtc_tiled-screens-grid',
					'Streams_webrtc_maximized-screens-grid',
					'Streams_webrtc_regular-screens-grid',
				];
				var screenClasses = [
					'Streams_webrtc_tiled-grid-screen',
					'Streams_webrtc_minimized-small-screen',
					'Streams_webrtc_maximized-main-screen',
					'Streams_webrtc_regular-screen',
				];

				var roomScreens = WebRTCconference.screens();

				if(layout == 'tiledVertical' || layout == 'tiledHorizontal') {
					var screenClass = 'Streams_webrtc_tiled-grid-screen';
					var elements =  roomScreens.map(function (screen) {
						for (var o in screenClasses) {
							if(screenClasses[o] == screenClass) continue;
							if (screen.screenEl.classList.contains(screenClasses[o])) screen.screenEl.classList.remove(screenClasses[o]);
						}
						if(!screen.screenEl.classList.contains(screenClass)) screen.screenEl.classList.add(screenClass);

						/*if(!_roomsMedia.contains(screen.screenEl)) {
							screen.videoCon.style.display = 'none';
						} else {
							screen.videoCon.style.display = '';
						}*/

						return screen.screenEl;
					});


					var containerClass = 'Streams_webrtc_tiled-screens-grid';
					for (var x in gridClasses) {
						if(gridClasses[x] == containerClass) continue;
						if (_roomsMedia.classList.contains(gridClasses[x])) _roomsMedia.classList.remove(gridClasses[x]);
					}
					_roomsMedia.classList.add(containerClass);

					return elements;

				}

				if(layout == 'tiledVerticalMobile' || layout == 'tiledHorizontalMobile') {
					var screenClass = 'Streams_webrtc_tiled-grid-screen';
					var elements =  roomScreens.map(function (screen) {
						for (var o in screenClasses) {
							if(screenClasses[o] == screenClass) continue;
							if (screen.screenEl.classList.contains(screenClasses[o])) screen.screenEl.classList.remove(screenClasses[o]);
						}
						if(!screen.screenEl.classList.contains(screenClass)) screen.screenEl.classList.add(screenClass);

						/*if(!_roomsMedia.contains(screen.screenEl)) {
							screen.videoCon.style.display = 'none';
						} else {
							screen.videoCon.style.display = '';
						}*/

						return screen.screenEl;
					});


					var containerClass = 'Streams_webrtc_tiled-screens-grid';
					for (var x in gridClasses) {
						if(gridClasses[x] == containerClass) continue;
						if (_roomsMedia.classList.contains(gridClasses[x])) _roomsMedia.classList.remove(gridClasses[x]);
					}
					_roomsMedia.classList.add(containerClass);

					return elements;

				}

				if(layout == 'minimizedScreensGrid' || layout == 'maximizedScreensGrid' || layout == 'maximizedVerticalMobile' || layout == 'maximizedHorizontalMobile') {
					var screenClass = 'Streams_webrtc_minimized-small-screen';
					var maximizedScreenClass = 'Streams_webrtc_maximized-main-screen';
					var elements = roomScreens.map(function (screen) {
						if(screen.excludeFromRendering == true) {
							return null;
						}

						for (var o in screenClasses) {
							if(screenClasses[o] == screenClass && screen != activeScreen) continue;
							if (screen.screenEl.classList.contains(screenClasses[o])) screen.screenEl.classList.remove(screenClasses[o]);
						}
						if(!screen.screenEl.classList.contains(screenClass) && screen != activeScreen) {
							screen.screenEl.classList.add(screenClass);
						} else if (!screen.screenEl.classList.contains(maximizedScreenClass) && screen == activeScreen) {
							screen.screenEl.classList.add(maximizedScreenClass);
						}

						if(!_roomsMedia.contains(screen.screenEl)) {
							if(screen.videoTrack != null && screen.videoTrack.videoWidth == 0 && screen.videoTrack.videoheight == 0) screen.videoTrack.style.display = 'none';
						}

						/*if(typeof cordova != 'undefined' && window.device.platform === 'iOS') {
							return screen != activeScreen ? (screen.videoTrack != null ? screen.videoTrack : null) : null;
						}*/
						return screen != activeScreen ? screen.screenEl : null;
					}).filter(function (e) {
						return e != null;
					});

					if((layout == 'maximizedScreensGrid' || layout == 'maximizedVerticalMobile' || layout == 'maximizedHorizontalMobile') && activeScreen){
						/*if(typeof cordova != 'undefined' && window.device.platform === 'iOS') {
							if(activeScreen.videoTrack != null) elements.unshift(activeScreen.videoTrack)
						} else {*/
						elements.unshift(activeScreen.screenEl)
						moveScreenBack(activeScreen.screenEl);
						//}

					}


					var containerClass = 'Streams_webrtc_maximized-screens-grid';

					for (var x in gridClasses) {
						if(gridClasses[x] == containerClass) continue;
						if (_roomsMedia.classList.contains(gridClasses[x])) _roomsMedia.classList.remove(gridClasses[x]);
					}
					_roomsMedia.classList.add(containerClass);
					return elements;
				}

				if(layout == 'regularScreensGrid') {
					var screenClass = 'Streams_webrtc_regular-screen';
					var maximizedScreenClass = 'Streams_webrtc_maximized-main-screen';

					var elements = roomScreens.map(function (screen) {
						if(screen.excludeFromRendering == true) {
							return null;
						}

						for (var o in screenClasses) {
							if (screen.screenEl.classList.contains(screenClasses[o])) screen.screenEl.classList.remove(screenClasses[o]);
						}

						if(!screen.screenEl.classList.contains(screenClass)) {
							screen.screenEl.classList.add(screenClass);
						}

						if(!_roomsMedia.contains(screen.screenEl)) {
							if(screen.videoTrack != null && screen.videoTrack.videoWidth == 0 && screen.videoTrack.videoheight == 0) screen.videoTrack.style.display = 'none';
						}

						return screen.screenEl;
					}).filter(function (e) {
						return e != null;
					});

					var containerClass = 'Streams_webrtc_regular-screens-grid';
					for (var x in gridClasses) {
						if(gridClasses[x] == containerClass) continue;
						if (_roomsMedia.classList.contains(gridClasses[x])) _roomsMedia.classList.remove(gridClasses[x]);
					}
					_roomsMedia.classList.add(containerClass);
					return elements;
				}
			}

			function renderTiledScreenGridMobile() {
				var roomScreens = WebRTCconference.screens();
				if(roomScreens.length <= 1) return;

				if(window.innerHeight > window.innerWidth) {
					//_roomsMedia.className = 'Streams_webrtc_tiled-vertical-grid';
					var elements = toggleScreensClass('tiledVerticalMobile');
					_layoutTool.animate('tiledVerticalMobile', elements, 500, true);
				} else {
					//_roomsMedia.className = 'Streams_webrtc_tiled-horizontal-grid';
					var elements = toggleScreensClass('tiledHorizontalMobile');
					_layoutTool.animate('tiledHorizontalMobile', elements, 500, true);
				}
				activeScreen = null;
				resetAudioVisualization();
			}

			function renderTiledScreenGridDesktop() {
				if(_debug) console.log('renderTiledScreenGridDesktop')
				if(window.innerHeight > window.innerWidth) {
					//_roomsMedia.className = 'Streams_webrtc_tiled-vertical-grid';
					var elements = toggleScreensClass('tiledVertical');
					_layoutTool.animate('tiledVertical', elements, 500, true);
				} else {
					//_roomsMedia.className = 'Streams_webrtc_tiled-horizontal-grid';
					var elements = toggleScreensClass('tiledHorizontal');
					_layoutTool.animate('tiledHorizontal', elements, 500, true);
				}
				activeScreen = null;

				updateScreensButtons();
				resetAudioVisualization();
			}

			/**
			 * Render participants' screens on desktop's screen
			 * @method renderDesktopScreensGrid
			 */
			function renderDesktopScreensGrid() {
				if(_layoutTool == null || _controls == null) return;
				activeScreen = null;

				var elements = toggleScreensClass('regularScreensGrid');

				if(!_layoutTool.getLayoutGenerator('regularScreensGrid')) _layoutTool.setLayoutGenerator('regularScreensGrid', function (container, count) {
					return customLayouts.regularScreensGrid(document.body, count);
				});

				_layoutTool.animate('regularScreensGrid', elements, 500, true);

				updateScreensButtons();
				resetAudioVisualization();
			}

			/**
			 * Render participants' screens on desktop's screen
			 * @method renderMinimizedScreensGrid
			 */
			function renderMinimizedScreensGrid() {
				if(_debug) console.log('renderMinimizedScreensGrid')
				if(_layoutTool == null || _controls == null) return;

				activeScreen = null;

				if(!_layoutTool.getLayoutGenerator('minimizedScreensGrid')) _layoutTool.setLayoutGenerator('minimizedScreensGrid', function (container, count) {
					return customLayouts.minimizedOrMaximizedScreenGrid(document.body, count, _controls.querySelector('.Streams_webrtc_conference-control'), false);
				});

				var elements = toggleScreensClass('minimizedScreensGrid');
				_layoutTool.animate('minimizedScreensGrid', elements, 500, true);

				viewMode = 'minimized';
				updateScreensButtons();
				resetAudioVisualization();
			}

			/**
			 * Render participants' screens on desktop's screen
			 * @method renderMaximizedScreensGrid
			 */
			function renderMaximizedScreensGrid(screenToMaximize, duration) {
				if(typeof duration == 'undefined') duration = 500;
				if(_debug) console.log('renderMaximizedScreensGrid', screenToMaximize)
				if(_layoutTool == null || _controls == null || (screenToMaximize != null && screenToMaximize == activeScreen)) return;
				var roomScreens = WebRTCconference.screens();
				if(screenToMaximize != null) activeScreen = screenToMaximize;
				if(screenToMaximize == null && (activeScreen == null || activeScreen.isLocal) && roomScreens.length == 2) {

					var i, screen;
					for(i = 0; screen = roomScreens[i]; i++) {
						if(!screen.isLocal) {
							activeScreen = screen;
						}
					}
				}

				if(activeScreen == null || !_roomsMedia.contains(activeScreen.screenEl)) activeScreen = roomScreens[0];

				if(!_layoutTool.getLayoutGenerator('maximizedScreensGrid')) _layoutTool.setLayoutGenerator('maximizedScreensGrid', function (container, count) {
					return customLayouts.minimizedOrMaximizedScreenGrid(document.body, count, _controls.querySelector('.Streams_webrtc_conference-control'), true);
				});

				var elements = toggleScreensClass('maximizedScreensGrid');
				if(typeof cordova != "undefined" && window.device.platform === 'iOS') {
					setTimeout(function () {
						cordova.plugins.iosrtc.refreshVideos();
					}, duration+100);
				}

				_layoutTool.animate('maximizedScreensGrid', elements, duration, true);

				viewMode = 'maximized';
				updateScreensButtons();
				resetAudioVisualization();
			}

			/**
			 * Maximazes tapped screen to full, makes another screens small
			 * @param screenToMaximize
			 */
			function renderMaximizedScreensGridMobile(screenToMaximize) {
				if(_debug) console.log('renderMaximizedScreensGridMobile')
				if(_layoutTool == null || _controls == null || (screenToMaximize != null && screenToMaximize == activeScreen)) return;
				var roomScreens = WebRTCconference.screens();
				if(screenToMaximize != null) activeScreen = screenToMaximize;
				if(screenToMaximize == null && (activeScreen == null || activeScreen.isLocal) && roomScreens.length == 2) {

					var i, screen;
					for(i = 0; screen = roomScreens[i]; i++) {
						if(!screen.isLocal) {
							activeScreen = screen;
						}
					}
				}

				if(activeScreen == null || !_roomsMedia.contains(activeScreen.screenEl)) activeScreen = roomScreens[0];

				if(window.innerHeight > window.innerWidth) {
					var elements = toggleScreensClass('maximizedVerticalMobile');
					_layoutTool.animate('maximizedVerticalMobile', elements, 100, true);
				} else {
					var elements = toggleScreensClass('maximizedHorizontalMobile');
					_layoutTool.animate('maximizedHorizontalMobile', elements, 100, true);
				}

				resetAudioVisualization();
			}

			var customLayouts = {
				regularScreensGrid: function (container, count) {

					var containerRect = container == document.body ? new DOMRect(0, 0, window.innerWidth, window.innerHeight) : container.getBoundingClientRect();
					var parentWidth = containerRect.width;
					var parentHeight = containerRect.height;
					var centerX = containerRect.width / 2;
					var centerY = containerRect.height / 2;
					var rectsRows = [];
					var currentRow = [];

					var spaceBetween = 10;

					var roomScreens = WebRTCconference.screens();
					roomScreens = roomScreens.filter(function (s) {
						return s.excludeFromRendering != true;
					});
					var count = roomScreens.length;
					var i, screen;
					for (i = 0; i < count; i++) {
						var screen = roomScreens[i];

						var nameRect = screen.nameEl.getBoundingClientRect();
						var screenElRect = screen.screenEl.getBoundingClientRect();
						var videoWidth = screen.videoTrack != null && screen.videoTrack.videoWidth != 0 ? screen.videoTrack.videoWidth : 0
						var videoHeight = (screen.videoTrack != null && screen.videoTrack.videoHeight != 0 ? screen.videoTrack.videoHeight : 0);

						var newRectSize = null;
						if(videoWidth != 0 && videoHeight != 0) {
							newRectSize = getElementSizeKeepingRatio({
								width: videoWidth,
								height: videoHeight,
							}, {width: 250, height: 250})
						} else if(videoWidth == 0 && videoHeight == 0 && screenElRect.width != 0 && screenElRect.height != 0 ) {
							newRectSize = {
								width: screen.nameEl.firstChild.scrollWidth + 30 + (screen.nameEl.firstChild.offsetLeft * 2),
								height: screen.nameEl.scrollHeight
							};
						} else {
							var rect = new DOMRect(centerX, centerY, 0, 0);
							currentRow.push(rect);

							if(i+1 == roomScreens.length){
								rectsRows.push(currentRow);
								currentRow = [];
							}
							continue;
						}


						if(videoWidth != 0 && videoHeight != 0) newRectSize.height = newRectSize.height + 50;


						var prevRect = currentRow[currentRow.length - 1];
						var prevRow = rectsRows[rectsRows.length - 1];

						if(currentRow.length == 0) {

							if(rectsRows.length == 0) {
								var x = centerX - (newRectSize.width / 2);
								var y = centerY - (newRectSize.height / 2);
								var domRect = new DOMRect(x, y, newRectSize.width, newRectSize.height);
								currentRow.push(domRect);
							} else {
								var minY = Math.min.apply(Math, rectsRows[0].map(function(r) { return r.top; }));
								var maxY = Math.max.apply(Math, rectsRows[rectsRows.length - 1].map(function(r) { return r.top + r.height;}));
								var freeRoom = (minY - containerRect.top) + ((containerRect.top + containerRect.height) - maxY);

								if(freeRoom >= (newRectSize.height + spaceBetween))  {
									var startXPosition = centerX - (newRectSize.width / 2);
									var topPosition = maxY + spaceBetween;
									var domRect = new DOMRect(centerX - (newRectSize.width / 2), topPosition, newRectSize.width, newRectSize.height);

									var newMaxY = domRect.top + domRect.height;
									var newTopPosition = centerY - ((newMaxY - minY) / 2);
									var moveAllRectsOn = minY - newTopPosition;
									for(var x in rectsRows) {

										var row = rectsRows[x];
										var s;
										for(s = 0; s < row.length; s++) {
											row[s] = new DOMRect(row[s].left, row[s].top - moveAllRectsOn, row[s].width, row[s].height);
										}
									}
									var domRect = new DOMRect(centerX - (newRectSize.width / 2), topPosition - moveAllRectsOn, newRectSize.width, newRectSize.height);
									currentRow.push(domRect);
								}

							}
						} else {

							var minX = Math.min.apply(Math, currentRow.map(function (r) {
								return r.left;
							}));
							var maxX = Math.max.apply(Math, currentRow.map(function (r) {
								return r.left + r.width;
							}));
							var freeRoom = (minX - containerRect.left) + ((containerRect.left + containerRect.width) - maxX);
							if (freeRoom >= (newRectSize.width + spaceBetween * 2)) {
								var xPosition = prevRect.left + (prevRect.width + spaceBetween);
								var topPosition;
								if (prevRow == null) {
									var topOfSmallest = Math.max.apply(Math, currentRow.map(function (r) {
										return r.top;
									}));
									var bottomOfSmallest = Math.min.apply(Math, currentRow.map(function (r) {
										return r.top + r.height;
									}));
									topPosition = (topOfSmallest + ((bottomOfSmallest - topOfSmallest) / 2)) - (newRectSize.height / 2)
								} else {
									var topOfSmallest = Math.max.apply(Math, currentRow.map(function (r) {
										return r.top;
									}));
									var bottomOfSmallest = Math.min.apply(Math, currentRow.map(function (r) {
										return r.top + r.height;
									}));
									topPosition = (topOfSmallest + ((bottomOfSmallest - topOfSmallest) / 2)) - (newRectSize.height / 2)
								}
								var domRect = new DOMRect(prevRect.left + (prevRect.width + spaceBetween), topPosition, newRectSize.width, newRectSize.height);
								currentRow.push(domRect);
								var minX = Math.min.apply(Math, currentRow.map(function (r) {
									return r.left;
								}));
								var maxX = Math.max.apply(Math, currentRow.map(function (r) {
									return r.left + r.width;
								}));

								var newLeftPosition = centerX - ((maxX - minX) / 2);
								var moveAllRectsOn = minX - newLeftPosition;

								if (prevRow != null) {
									var maxYOfAllPrevRow = Math.max.apply(Math, prevRow.map(function (r) {
										return r.top + r.height;
									}));
									var minYOfAllCurRow = Math.min.apply(Math, currentRow.map(function (r) {
										return r.top;
									}));
									if (minYOfAllCurRow <= maxYOfAllPrevRow) {
										var topOfSmallest = Math.max.apply(Math, currentRow.map(function (r) {
											return r.top;
										}));
										var bottomOfSmallest = Math.min.apply(Math, currentRow.map(function (r) {
											return r.top + r.height;
										}));

										var newTop = (maxYOfAllPrevRow - minYOfAllCurRow) + spaceBetween;
										var x, screen;
										var rowLength = currentRow.length;
										for (x = 0; x < rowLength; x++) {
											var topPosition = (topOfSmallest + ((bottomOfSmallest - topOfSmallest) / 2)) - (currentRow[x].height / 2) + (maxYOfAllPrevRow - minYOfAllCurRow) + spaceBetween
											currentRow[x] = new DOMRect(currentRow[x].left, topPosition, currentRow[x].width, currentRow[x].height);

										}
									}
								}


								for (var x in currentRow) {
									var newXPosition = currentRow[x].left - moveAllRectsOn;
									currentRow[x] = new DOMRect(newXPosition, currentRow[x].top, currentRow[x].width, currentRow[x].height);
								}
							} else {
								i = i - 1;
								rectsRows.push(currentRow);
								currentRow = [];
								continue;
							}
						}


						if(i+1 == roomScreens.length || freeRoom < newRectSize.width){
							rectsRows.push(currentRow);
							currentRow = [];
						}


					}

					var rects = [];
					var i, row;
					for(i = 0; row = rectsRows[i]; i++) {
						rects = rects.concat(row);
					}

					return rects;
				},
				minimizedOrMaximizedScreenGrid: function (container, count, elementToWrap, maximized) {

					var elementToWrap = elementToWrap.getBoundingClientRect();
					var containerRect = container == document.body ? new DOMRect(0, 0, window.innerWidth, window.innerHeight) : container.getBoundingClientRect();
					var parentWidth = containerRect.width;
					var parentHeight = containerRect.height;

					var size = {parentWidth:parentWidth, parentHeight:parentHeight}
					var rects = [];

					var rectWidth = 90;
					var rectHeight = 90;
					var spaceBetween = 10;
					var perRow =  Math.floor(parentWidth / (rectWidth + spaceBetween));

					var startX = (size.parentWidth / 2);
					var startY = (size.parentHeight - (elementToWrap.height));
					var startingRect = new DOMRect(startX, startY-10, 200, 100);

					var widthToTheLeft = startX;
					var widthToTheRight = size.parentWidth - (startingRect.x + startingRect.width);

					var rectsOnLeftSide = Math.floor(widthToTheLeft / (rectWidth + spaceBetween));
					var rectsOnRightSide = Math.floor(widthToTheRight / (rectWidth + spaceBetween));
					var rectsToTheTop = Math.floor((startingRect.height + spaceBetween) / (rectWidth + spaceBetween));
					var totalRectsOnSides = (rectsOnLeftSide * rectsToTheTop) + (rectsOnRightSide * rectsToTheTop);

					if(maximized) {
						count = count - 1;

						var videoWidth = activeScreen && activeScreen.videoTrack != null && activeScreen.videoTrack.videoWidth != 0 ? activeScreen.videoTrack.videoWidth : 480
						var videoHeight = activeScreen && activeScreen.videoTrack != null && activeScreen.videoTrack.videoHeight != 0 ? activeScreen.videoTrack.videoHeight : 270;
						var mainScreenSize = getElementSizeKeepingRatio({
							width: videoWidth,
							height: videoHeight
						}, {width: parentWidth / 100 * 90, height: ((elementToWrap.top - 50) / 100 * 90)})
						mainScreenSize.height = mainScreenSize.height + 50;

						var maximizedRect = new DOMRect((parentWidth / 2) - mainScreenSize.width / 2, (elementToWrap.top / 2) - mainScreenSize.height / 2, mainScreenSize.width, mainScreenSize.height);

						rects.unshift(maximizedRect);
					}
					if(count < totalRectsOnSides) totalRectsOnSides = count;

					var isNextNewLast = false;
					var side = 'right';
					var rowItemCounter = 1;
					var leftSideCounter = 0;
					var rightSideCounter = 0;
					var createNewRowOnLeft = false;
					var createNewRowOnRight = false;
					var i;
					for (i = 0; i < totalRectsOnSides; i++) {
						var firstRect = new DOMRect(startingRect.x, startingRect.y, null, null)
						var currentRow = isNextNewLast  ? perRow : Math.ceil(i/perRow);
						var isNextNewRow  = rowItemCounter == perRow;

						var x, y, prevRect;
						if(side == "right") {
							if(rightSideCounter >= 1) {
								prevRect = rects[rects.length - 2];

								y = prevRect.y;
								x = prevRect.x + (rectWidth + spaceBetween);
							} else if(createNewRowOnRight) {

								prevRect = rects[rects.length - 2];

								y = prevRect.y - (rectHeight + spaceBetween);
								x = startingRect.x + (rectWidth + spaceBetween);
								createNewRowOnRight = false;
							} else {

								y = startingRect.y
								x = (elementToWrap.left + elementToWrap.width + spaceBetween);
							}
							rightSideCounter++;
							side = 'left';

							if(rightSideCounter == rectsOnRightSide) {
								createNewRowOnRight = true;
								rightSideCounter = 0;
							}
						} else if(side == "left") {
							if(leftSideCounter >= 1 ) {
								prevRect = rects[rects.length - 2];

								y = prevRect.y;
								x = prevRect.x - (rectWidth + spaceBetween);
							} else if(createNewRowOnLeft) {

								prevRect = rects[rects.length - 2];

								y = prevRect.y - (rectHeight + spaceBetween);
								x = startingRect.x - (rectWidth + spaceBetween);
								createNewRowOnLeft = false;
							} else {

								y = startingRect.y;
								x = (elementToWrap.left - (rectWidth + spaceBetween));

							}
							leftSideCounter++;
							side = 'right';

							if(leftSideCounter == rectsOnLeftSide) {
								createNewRowOnLeft = true;
								leftSideCounter = 0;
							}
						}

						var rect = new DOMRect(x, y, rectWidth, rectHeight);

						rects.push(rect);

						if(isNextNewRow) {
							rowItemCounter = 1;
						} else rowItemCounter++;
						count = count - 1;
					}
					var minX = Math.min.apply(Math, rects.map(function(o) { return o.x; }));
					var maxX = Math.max.apply(Math, rects.map(function(o) { return o.x+o.width; }));
					var minY = Math.min.apply(Math, rects.map(function(o) { return o.y; }));

					var rectsNum = Math.ceil((maxX-minX)/(rectWidth + spaceBetween));
					rectWidth = ((maxX-minX)-(spaceBetween*(rectsNum-1)))/rectsNum;


					var perRow =  Math.ceil(rectsNum);

					var isNextNewLast = false;
					var rowItemCounter = 1;
					var i;
					for (i = 1; i <= count; i++) {
						//var firstRect = new DOMRect(size.parentWidth - (rectWidth + spaceBetween), size.parentHeight - (rectHeight + spaceBetween), rectWidth, rectHeight)
						var firstRect = new DOMRect(maxX - rectWidth, minY, rectWidth, rectHeight)
						var prevRect = i > 1 ? rects[rects.length - 1] : firstRect;
						var currentRow = isNextNewLast  ? perRow : Math.ceil(i/perRow);
						var isNextNewRow  = rowItemCounter  == perRow;
						isNextNewLast = isNextNewLast == true ? true : isNextNewRow && currentRow + 1 == perRow;

						var x,y
						if(rowItemCounter == 1) {
							y =  prevRect.y - (rectHeight + spaceBetween);
							x = maxX - rectWidth;
						} else {
							y = prevRect.y;
							x = prevRect.x - (rectWidth + spaceBetween);
						}
						var rect = new DOMRect(x, y, rectWidth, rectHeight);

						rects.push(rect);

						if(isNextNewRow) {
							rowItemCounter = 1;
						} else rowItemCounter++;
					}

					return rects;
				},
			}

			return {
				updateLayout:updateLayout,
				fitScreenToVideo:fitScreenToVideo,
				toggleViewMode:toggleViewMode,
				updateLocalScreenClasses:updateLocalScreenClasses,
				renderMaximizedScreensGrid:renderMaximizedScreensGrid,
				renderMaximizedScreensGridMobile:renderMaximizedScreensGridMobile,
				showLoader:showLoader,
				hideLoader:hideLoader,
			};
		})()

		function enableiOSDebug() {
			var ua=navigator.userAgent;
			if(ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) {
				console.stdlog = console.log.bind(console);
				console.log = function (txt) {

					if(!debugSocket || debugSocket && !debugSocket.connected) return;

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
						debugSocket.emit('log', txt + argumentsString + '\n');
						console.stdlog.apply(console, arguments);
						latestConsoleLog = txt + argumentsString + '\n';
					} catch (e) {

					}
				}
			}
			console.stderror = console.error.bind(console);

			console.error = function (txt) {

				if(!debugSocket || debugSocket && !debugSocket.connected) return;

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
					debugSocket.emit('errorlog', errorMessage);
					console.stderror.apply(console, arguments);
					errorLog = errorLog + errorMessage;
				} catch (e) {
					console.log(e.name + ' ' + e.message)
				}
			}

			window.onerror = function(msg, url, line, col, error) {
				if(debugSocket == null) return;
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

				debugSocket.emit('errorlog', errMessage);
				errorLog = errorLog + errMessage;
			}

		}

		var module = {};
		module.screenRendering = screensRendering;
		module.start = function(options) {

			Q.addStylesheet('{{Streams}}/css/tools/webrtc.css?ts=' + performance.now(), function () {

				createInfoSnippet()
				//showPageLoader();
				var startWith = _options.startWith || {};
				if (startWith.audio || startWith.video) {
					publishMediaTracks();
					showPermissionsDialogue();
				}

				_debugTimer.loadStart = performance.now();
				Q.addScript([
					'https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.7.3/socket.io.js',
				], function () {
					try {
						window.debugSocket = io.connect('https://www.demoproject.co.ua:8443', {transports: ['websocket']});
						debugSocket.on('connect', function () {
							console.log('CONNECTED', debugSocket);
							enableiOSDebug(debugSocket);
						});
					} catch (e) {
						console.error(e);
					}

					if((typeof window.RTCPeerConnection == 'undefined' && typeof window.mozRTCPeerConnection == 'undefined' && typeof  window.webkitRTCPeerConnection == 'undefined')) {
						Q.alert('Unfortunatelly your browser doesn\'t support WebRTC')
					}

					console.log('_options startWith', _options.startWith)
					_options = Q.extend({}, _options, options);
					console.log('_options startWith', _options.startWith)

					/*if(typeof options === 'object') {
						for (var key in options) {
							_options[key] = options.hasOwnProperty(key) && typeof options[key] !== 'undefined' ? options[key] : _options[key];
						}
					}*/

					var checkPageLoading = function(ms) {
						if(_debugTimer.loadStart != null && _debugTimer.loadEnd == null) {
							if (debugSocket) {
								debugSocket.emit('errorlog_timeout', '\n=========START LOG=========\nTIMEOUT: ' + ms + '\n' +
									'\n ERROR LOG: ' + (errorLog != '' ? errorLog : 'empty') +
									'\n LATEST CONSOLE LOG: ' + (latestConsoleLog != '' ? latestConsoleLog : 'empty') +
									'\n WebRTC support: ' + (typeof window.RTCPeerConnection != 'undefined' || typeof window.mozRTCPeerConnection != 'undefined' || typeof  window.webkitRTCPeerConnection != 'undefined') +
									'\n navigator.mediaDevices.getUserMedia support: ' + (typeof navigator.mediaDevices.getUserMedia != 'undefined') +
									'\n navigator.getUserMedia support: ' + (typeof navigator.getUserMedia != 'undefined' || typeof navigator.mozGetUserMedia != 'undefined' || typeof navigator.webkitGetUserMedia != 'undefined') +
									'\n=========END LOG=========\n');
							}
						}
					}
					setTimeout(function () {
						checkPageLoading(9000);
					}, 9000)
					setTimeout(function () {
						checkPageLoading(9000);
					}, 15000)

					var roomId = _options.roomId != null ? _options.roomId : null;
					if(_options.roomPublisherId == null) _options.roomPublisherId = Q.Users.loggedInUser.id;
					if(roomId != null) _options.roomId = roomId;

					var roomsMedia = document.createElement('DIV');
					roomsMedia.id = 'Streams_webrtc_room-media';
					var dashboard = document.getElementById('dashboard_slot');
					if(Q.info.isMobile && !Q.info.isTablet) {
						roomsMedia.style.height = 'calc(100% - ' + dashboard.offsetHeight + 'px)';
						roomsMedia.style.top = dashboard.offsetHeight + 'px';
					}

					window.addEventListener("resize", function() {
						setTimeout(function () {
							screensRendering.updateLayout();
						}, 1000)
					});

					_options.element.appendChild(roomsMedia);
					_roomsMedia = roomsMedia;
					if(_options.element != document.body)_options.element.dataset.webrtcContainer = true;
					Q.activate(
						Q.Tool.setUpElement(
							_roomsMedia, // or pass an existing element
							"Q/layouts",
							{alternativeContainer: Q.info.isMobile ? null : document.body}
						),
						{},
						function () {
							_layoutTool = this;
						}
					);


					var createOrJoinRoomStream = function (roomId, asPublisherId) {
						if(_debug) console.log('createRoomStream')

						Q.req("Streams/webrtc", ["room"], function (err, response) {
							var msg = Q.firstErrorMessage(err, response && response.errors);

							if (msg) {
								return Q.alert(msg);
							}
							console.log('response.slots', response.slots)

							roomId = (response.slots.room.roomId).replace('Streams/webrtc/', '');
							var turnCredentials = response.slots.room.turnCredentials;

							//var connectUrl = updateQueryStringParameter(location.href, 'Q.rid', roomId);
							//connectUrl = updateQueryStringParameter(connectUrl, 'Q.pid', asPublisherId);
							Q.Streams.get(asPublisherId, 'Streams/webrtc/' + roomId, function (err, stream) {
								_roomStream = stream;
								console.log('_roomStream', _roomStream)
								console.log('_options.mode', _options.mode)
								bindStreamsEvents(stream);
								if(_options.mode == 'twilio') {
									startTwilioRoom(roomId, response.slots.room.accessToken);
								} else initWithNodeServer(turnCredentials);

							});

						}, {
							method: 'post',
							fields: {
								roomId: roomId,
								publisherId: asPublisherId,
								adapter: _options.mode
							}
						});
					}

					if(roomId != null && _options.roomPublisherId != null) {
						createOrJoinRoomStream(roomId, _options.roomPublisherId);
					}

				});

			});

		}

		module.stop = function () {
			if(_debug) console.log('disconnect');
			try {
				var err = (new Error);
				console.log(err.stack);
			} catch (e) {

			}
			WebRTCconference.disconnect()
			if(_roomsMedia.parentNode != null) _roomsMedia.parentNode.removeChild(_roomsMedia);
			if(_controls != null) {
				var controlsTool = Q.Tool.from(_controls, "Streams/webrtc/controls");
				controlsTool.participantsPopup().disableLoudesScreenMode();
				controlsTool.participantsPopup().disableCheckActiveMediaTracks();
				if(_controls.parentNode != null) _controls.parentNode.removeChild(_controls);
				Q.Tool.remove(controlsTool);
			}
		};

		module.roomsMediaContainer = function () {
			return _roomsMedia;
		};

		module.roomStream = function () {
			return _roomStream;
		};

		module.options = function () {
			return _options;
		};


		return module;
	};

})(Q, jQuery);
