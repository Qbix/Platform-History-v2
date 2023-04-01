(function ($, window, undefined) {
    var _participantsToolIcons = {
        loudSpeaker: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="0 0 99.5 99.5" enable-background="new 0 0 99.5 99.5" xml:space="preserve">  <path fill="#4AAA4E" d="M49.749,99.5C22.317,99.5,0,77.18,0,49.749C0,22.317,22.317,0,49.749,0S99.5,22.317,99.5,49.749   C99.5,77.18,77.182,99.5,49.749,99.5z"/>  <g>   <g id="Layer_2">    <path fill="#FFFFFF" d="M36.463,39.359l10.089-7.573c0.049-0.028,0.095-0.062,0.146-0.084c0.141-0.059,0.184-0.047,0.333-0.051     c0.055,0.012,0.11,0.024,0.165,0.037c0.05,0.025,0.104,0.044,0.151,0.075c0.046,0.031,0.09,0.068,0.127,0.11     c0.077,0.084,0.131,0.186,0.159,0.295c0.013,0.055,0.013,0.112,0.021,0.168v35.382c-0.019,0.148-0.01,0.191-0.082,0.326     c-0.026,0.049-0.06,0.097-0.098,0.14c-0.076,0.084-0.172,0.146-0.279,0.187c-0.053,0.018-0.109,0.029-0.165,0.034     c-0.056,0.007-0.114,0.005-0.169-0.004c-0.15-0.021-0.18-0.058-0.31-0.131l-10.089-7.571h-8.544     c-0.06-0.009-0.121-0.009-0.179-0.023c-0.058-0.016-0.114-0.039-0.166-0.067c-0.105-0.06-0.192-0.147-0.252-0.251     c-0.03-0.053-0.053-0.109-0.069-0.167c-0.015-0.058-0.016-0.118-0.023-0.179V40.047c0.007-0.06,0.008-0.121,0.023-0.178     c0.016-0.058,0.039-0.114,0.069-0.166c0.03-0.052,0.067-0.1,0.109-0.143c0.086-0.086,0.192-0.147,0.309-0.179     c0.058-0.016,0.119-0.016,0.179-0.023L36.463,39.359L36.463,39.359z"/>   </g>   <g>    <path fill="#FFFFFF" d="M56.589,61.012c-0.25,0-0.502-0.095-0.695-0.283c-0.396-0.386-0.406-1.019-0.021-1.413     c9.074-9.354,0.39-18.188,0.017-18.559c-0.396-0.389-0.396-1.022-0.009-1.415c0.392-0.392,1.024-0.393,1.414-0.005     c0.106,0.105,10.449,10.615,0.016,21.372C57.111,60.91,56.851,61.012,56.589,61.012z"/>   </g>   <g>    <path fill="#FFFFFF" d="M62.776,66.321c-0.251,0-0.502-0.094-0.694-0.282c-0.396-0.385-0.406-1.019-0.021-1.414     c14.264-14.703,0.602-28.596,0.014-29.181c-0.393-0.389-0.395-1.022-0.006-1.414c0.391-0.392,1.023-0.393,1.414-0.005     c0.158,0.157,15.637,15.888,0.014,31.991C63.298,66.218,63.039,66.321,62.776,66.321z"/>   </g>   <g>    <path fill="#FFFFFF" d="M68.638,70.759c-0.251,0-0.502-0.094-0.696-0.28c-0.396-0.386-0.405-1.019-0.021-1.414     c18.602-19.175,0.781-37.297,0.014-38.06c-0.393-0.389-0.395-1.022-0.006-1.414c0.39-0.392,1.023-0.394,1.414-0.005     c0.201,0.2,19.975,20.294,0.014,40.871C69.16,70.66,68.898,70.759,68.638,70.759z"/>   </g>  </g>  </svg>',
        disabledSpeaker: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"   viewBox="0 0 99.5 99.5" enable-background="new 0 0 99.5 99.5" xml:space="preserve">  <path fill="#8C8C8C" d="M49.749,99.5C22.317,99.5,0,77.18,0,49.749C0,22.317,22.317,0,49.749,0S99.5,22.317,99.5,49.749   C99.5,77.18,77.182,99.5,49.749,99.5z"/>  <g>   <path fill="#FFFFFF" d="M47.654,32.336c-0.008-0.056-0.008-0.113-0.021-0.168c-0.028-0.109-0.082-0.211-0.159-0.295    c-0.037-0.042-0.081-0.079-0.127-0.11c-0.047-0.031-0.101-0.05-0.151-0.075c-0.055-0.013-0.11-0.025-0.165-0.037    c-0.149,0.004-0.192-0.008-0.333,0.051c-0.051,0.022-0.097,0.056-0.146,0.084l-10.089,7.573l-8.545-0.001    c-0.06,0.007-0.121,0.007-0.179,0.023c-0.117,0.032-0.223,0.093-0.309,0.179c-0.042,0.043-0.079,0.091-0.109,0.143    c-0.03,0.052-0.053,0.108-0.069,0.166c-0.015,0.057-0.016,0.118-0.023,0.178v19.964c0.007,0.061,0.008,0.121,0.023,0.179    c0.016,0.058,0.039,0.114,0.069,0.167c0.06,0.104,0.147,0.191,0.252,0.251c0.052,0.028,0.108,0.052,0.166,0.067    c0.058,0.015,0.119,0.015,0.179,0.023h7.885l11.851-11.852V32.336z"/>   <path fill="#FFFFFF" d="M46.551,68.27c0.13,0.073,0.16,0.11,0.31,0.131c0.055,0.009,0.113,0.011,0.169,0.004    c0.056-0.005,0.112-0.017,0.165-0.034c0.107-0.041,0.203-0.103,0.279-0.187c0.038-0.043,0.072-0.091,0.098-0.14    c0.072-0.135,0.063-0.178,0.082-0.326V57.356l-6.708,6.708L46.551,68.27z"/>   <path fill="#FFFFFF" d="M55.873,59.316c-0.385,0.395-0.375,1.027,0.021,1.413c0.193,0.188,0.445,0.283,0.695,0.283    c0.262,0,0.521-0.103,0.721-0.304c5.972-6.156,5.136-12.229,3.31-16.319l-1.479,1.48C60.492,49.367,60.773,54.264,55.873,59.316z"    />   <path fill="#FFFFFF" d="M55.88,39.342c-0.361,0.367-0.371,0.937-0.05,1.329l1.386-1.385C56.824,38.964,56.249,38.974,55.88,39.342z    "/>   <path fill="#FFFFFF" d="M62.068,34.03c-0.189,0.191-0.283,0.44-0.286,0.689l0.981-0.982C62.511,33.741,62.26,33.837,62.068,34.03z"    />   <path fill="#FFFFFF" d="M62.06,64.625c-0.385,0.396-0.375,1.029,0.021,1.414c0.192,0.188,0.443,0.282,0.694,0.282    c0.263,0,0.522-0.103,0.72-0.305c10.728-11.057,6.791-21.938,3.22-27.723l-1.401,1.401C68.548,45.015,71.756,54.63,62.06,64.625z"    />   <path fill="#FFFFFF" d="M67.921,69.065c-0.385,0.396-0.375,1.028,0.021,1.414c0.194,0.187,0.445,0.28,0.696,0.28    c0.26,0,0.521-0.1,0.719-0.303c15.146-15.612,7.416-30.945,2.718-37.522l-1.388,1.388C75.15,40.513,82.071,54.48,67.921,69.065z"/>   <path fill="#FFFFFF" d="M80.402,18.845c-0.385,0-0.771,0.147-1.066,0.441L18.422,80.201c-0.589,0.59-0.589,1.543,0,2.133    c0.294,0.293,0.68,0.441,1.066,0.441c0.386,0,0.772-0.148,1.066-0.441l60.913-60.915c0.59-0.588,0.59-1.544,0-2.132    C81.175,18.992,80.789,18.845,80.402,18.845z"/>  </g>  </svg>',
        screen: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"   viewBox="0 0 99.5 99.498" enable-background="new 0 0 99.5 99.498" xml:space="preserve">  <path fill="#4AAA4E" d="M49.749,99.498C22.317,99.498,0,77.181,0,49.749C0,22.318,22.317,0,49.749,0S99.5,22.317,99.5,49.749   C99.5,77.181,77.182,99.498,49.749,99.498z"/>  <g>   <path fill="#FFFFFF" d="M22.158,28.781c-1.204,0-2.172,0.969-2.172,2.173v35.339c0,1.204,0.969,2.173,2.172,2.173h20.857v6.674    h-2.366c-0.438,0-0.79,0.353-0.79,0.789c0,0.438,0.353,0.79,0.79,0.79h18.203c0.438,0,0.789-0.352,0.789-0.79    c0-0.438-0.353-0.789-0.789-0.789h-2.366v-6.674h20.855c1.203,0,2.173-0.969,2.173-2.173V30.954c0-1.204-0.97-2.173-2.173-2.173    H22.158z M22.751,31.47h53.997v34.081H22.751V31.47z"/>   <polygon fill="#F6F4EC" points="42.159,38.611 42.159,59.573 59.137,49.771  "/>  </g>  </svg>',
        disabledScreen: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"   viewBox="0 0 99.499 99.498" enable-background="new 0 0 99.499 99.498" xml:space="preserve">  <path fill="#8C8C8C" d="M49.749,99.498C22.317,99.498,0,77.18,0,49.749S22.317,0,49.749,0s49.75,22.317,49.75,49.749   S77.182,99.498,49.749,99.498z"/>  <g>   <path fill="#FFFFFF" d="M77,31v35H38.234l-1.984,2H43v7h-2.352c-0.438,0-0.79,0.563-0.79,1s0.353,1,0.79,1h18.203    c0.438,0,0.789-0.563,0.789-1s-0.352-1-0.789-1H56v-7h21.341C78.545,68,80,67.497,80,66.293V30.954C80,29.75,78.545,29,77.341,29    h-2.337l-2.02,2H77z"/>   <path fill="#FFFFFF" d="M23,66V31h42.244l2.146-2H22.158C20.954,29,20,29.75,20,30.954v35.339C20,67.497,20.954,68,22.158,68h6.091    l2.11-2H23z"/>   <polygon fill="#FFFFFF" points="42,54.557 51.621,44.936 42,38.611  "/>   <polygon fill="#FFFFFF" points="56.046,47.74 47.016,56.769 59.137,49.771  "/>   <path fill="#FFFFFF" d="M81.061,21.311c0.586-0.585,0.586-1.536,0-2.121C80.768,18.896,80.384,18.75,80,18.75    s-0.768,0.146-1.061,0.439L18.33,79.799c-0.586,0.586-0.586,1.535,0,2.121c0.293,0.293,0.677,0.439,1.061,0.439    s0.768-0.146,1.061-0.439L81.061,21.311z"/>  </g>  </svg>',
        disabledCamera: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="-0.165 -0.245 100 99.999" enable-background="new -0.165 -0.245 100 99.999"    xml:space="preserve">  <path fill="#8C8C8C" d="M49.834-0.245c-27.569,0-50,22.43-50,50c0,27.57,22.429,49.999,50,49.999c27.57,0,50-22.429,50-49.999   C99.835,22.186,77.404-0.245,49.834-0.245z M25.516,37.254h29.489L34.73,60.791h-9.214V37.254z M24.492,75.004l47.98-55.722   l3.046,2.623L27.538,77.627L24.492,75.004z M77.71,61.244l-15.599-9.006v8.553H44.016l18.096-21.006v6.309l15.599-9.006V61.244z"/>  </svg>',
        locDisabledMic: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="-0.165 -0.245 100 99.999" enable-background="new -0.165 -0.245 100 99.999"    xml:space="preserve">  <path fill="#8C8C8C" d="M49.834-0.245c-27.569,0-50,22.43-50,50c0,27.57,22.429,49.999,50,49.999c27.57,0,50-22.429,50-49.999   C99.835,22.186,77.404-0.245,49.834-0.245z M41.411,32.236c0.001-4.678,3.794-8.473,8.473-8.473c4.681,0,8.472,3.793,8.472,8.473   v0.502L41.421,52.4c-0.001-0.068-0.01-0.135-0.01-0.203V32.236z M35.376,42.216h3.379v10.177c0,0.934,0.127,1.836,0.345,2.703   l-2.616,3.037c-0.708-1.713-1.107-3.58-1.107-5.535V42.216z M64.392,52.598c0,7.357-5.51,13.551-12.818,14.408v5.436h6.783v3.381   H41.411v-3.381h6.783v-5.436c-2.8-0.328-5.331-1.443-7.394-3.105l2.317-2.688c1.875,1.441,4.217,2.309,6.767,2.309   c6.146,0,11.127-4.984,11.127-11.129V42.216h3.381V52.598z M44.954,59.078l13.403-15.56v8.677c0,4.68-3.793,8.475-8.473,8.475   C48.042,60.67,46.344,60.076,44.954,59.078z M27.421,77.139l-3.046-2.623l47.979-55.723l3.046,2.623L27.421,77.139z"/>  </svg>'
    }
    var _controlsToolIcons = []; 

    var ua = navigator.userAgent;
    var _isiOS = false;
    var _isAndroid = false;
    var _isiOSCordova = false;
    var _isAndroidCordova = false;
    if (ua.indexOf('iPad') != -1 || ua.indexOf('iPhone') != -1 || ua.indexOf('iPod') != -1) _isiOS = true;
    if (ua.indexOf('Android') != -1) _isAndroid = true;
    if (typeof cordova != 'undefined' && _isiOS) _isiOSCordova = true;
    if (typeof cordova != 'undefined' && _isAndroid) _isAndroidCordova = true;

    function log(){}
    if(Q.Streams.WebRTCdebugger) {
        log = Q.Streams.WebRTCdebugger.createLogMethod('participants.js')
    }

    /**
     * Streams/webrtc/control tool.
     * Users can chat with each other via WebRTC using Twilio or raw streams
     * @module Streams
     * @class Streams webrtc
     * @constructor
     * @param {Object} options
     *  Hash of possible options
     */
    Q.Tool.define("Streams/webrtc/participants", function (options) {
        var tool = this;
        _controlsToolIcons = tool.state.controlsTool.getIcons();

        tool.participantListEl = null;
        tool.participantsList = [];

        tool.webrtcUserInterface = options.webrtcUserInterface();
        tool.webrtcSignalingLib = tool.webrtcUserInterface.currentConferenceLibInstance();

        tool.createList();
        tool.declareEventsHandlers();

    },

        {
            onRefresh: new Q.Event(),
            controlsTool: null,
            webrtcUserInterface: null
        },

        {
            refresh: function () {
                var tool = this;
                tool.refreshList();
            },
            declareEventsHandlers: function() {
                var tool = this;
                var webrtcSignalingLib = tool.webrtcSignalingLib;

                webrtcSignalingLib.event.on('beforeSwitchRoom', function (e) {
                    tool.webrtcSignalingLib = e.newWebrtcSignalingLibInstance;
                    tool.declareEventsHandlers();
                });

                webrtcSignalingLib.event.on('participantConnected', function (participant) {
                    log('controls: participantConnected');

                    setRealName(participant, function (name) {
                        tool.addItem(participant);
                    });
                });
                webrtcSignalingLib.event.on('participantDisconnected', function (participant) {
                    tool.removeItem(participant);
                });
                webrtcSignalingLib.event.on('participantRemoved', function (participant) {
                    tool.removeItem(participant);
                });
                webrtcSignalingLib.event.on('screenAdded', function (e) {
                    tool.updateItem(e.participant);
                });
                webrtcSignalingLib.event.on('screenRemoved', function (e) {
                    tool.updateItem(e.participant);
                });
                webrtcSignalingLib.event.on('micEnabled', function () {;
                    tool.updateItem(webrtcSignalingLib.localParticipant());
                });
                webrtcSignalingLib.event.on('micDisabled', function () {
                    tool.updateItem(webrtcSignalingLib.localParticipant());
                });
                webrtcSignalingLib.event.on('audioMuted', function (participant) {;
                    tool.updateItem(participant);
                });
                webrtcSignalingLib.event.on('audioUnmuted', function (participant) {
                    tool.updateItem(participant);
                });
                webrtcSignalingLib.event.on('liveStreamingStarted', function (e) {
                    tool.showLiveIndicator(e.participant, e.platform.content);
                });
                webrtcSignalingLib.event.on('liveStreamingEnded', function (e) {
                    tool.hideLiveIndicator(e.participant, e.platform);
                });
                webrtcSignalingLib.event.on('someonesCameraEnabled', function (e) {
                    tool.hideMediaRequestIndicator(e, 'camera');
                });
                webrtcSignalingLib.event.on('someonesMicEnabled', function (e) {
                    tool.hideMediaRequestIndicator(e, 'mic');
                });

                function setRealName(participant, callback) {
                    var userId = participant.identity != null ? participant.identity.split('\t')[0] : null;
                    if (userId != null) {

                        var firstName;
                        var lastName;
                        var fullName = '';
                        Q.Streams.get(userId, 'Streams/user/firstName', function (err, stream) {

                            if (!stream || stream.fields == null) {
                                if (callback != null) callback({ firstName: 'n/a', lastName: 'n/a' });
                                return;
                            }

                            firstName = stream.fields.content;
                            if (firstName != null) {
                                fullName += firstName;
                            }

                            try {
                                Q.Streams.get(userId, 'Streams/user/lastName', function (err, stream) {

                                    if (!stream || !stream.fields) {
                                        if (callback != null) callback({ firstName: firstName, lastName: '' });
                                        return;
                                    }

                                    lastName = stream.fields.content;

                                    if (lastName != null) {
                                        fullName += ' ' + lastName;
                                    }

                                    participant.username = fullName;

                                    if (callback != null) callback({ firstName: firstName, lastName: lastName });
                                });

                            } catch (e) {
                                participant.username = fullName;
                                if (callback != null) callback({ firstName: firstName, lastName: lastName });
                            }

                        });
                    }
                }
            },
            /**
             * Create participants popup that appears while pointer hovers users button on desktop/in modal box on mobile
             * @method participantsPopup
             */
            createList: function () {
                var tool = this;

                var localParticipant = tool.webrtcSignalingLib.localParticipant();
                var roomParticipants = tool.webrtcSignalingLib.roomParticipants();

                tool.participantListEl = document.createElement('UL');
                tool.participantListEl.className = 'Streams_webrtc_participants-list';
                tool.addItem(localParticipant);
                roomParticipants = tool.webrtcSignalingLib.roomParticipants();
                for (var i in roomParticipants) {
                    if (roomParticipants[i].isLocal) continue;
                    tool.addItem(roomParticipants[i]);
                }

                tool.element.appendChild(tool.participantListEl);
            },
            refreshList: function () {
                var tool = this;
                if (tool.participantListEl) tool.participantListEl.innerHTML = '';
                tool.participantsList = [];

                tool.addItem(tool.webrtcSignalingLib.localParticipant());
                roomParticipants = tool.webrtcSignalingLib.roomParticipants();
                
                for (var i in roomParticipants) {
                    if (roomParticipants[i].isLocal) continue;
                    tool.addItem(roomParticipants[i]);
                }
            },
            /**
            * Add item to participants list and bind events that are happened on buttons click/tap
            * @method addItem
            */
            addItem: function (roomParticipant) {
                var tool = this;
                var localParticipant = tool.webrtcSignalingLib.localParticipant();
                function ListItem() {
                    this.listElement = null;
                    this.audioBtnEl = null;
                    this.cameraBtnEl = null;
                    this.videoBtnsEl = null;
                    this.liveStatusEl = null;
                    this.participant = null;
                    this.isVideoMuted = null;
                    this.screenSharingIsMuted = null;
                    this.manuallyToggled = false;
                    this.isActive = true;
                    this.toggleVideo = function () {
                        if (this.participant.isLocal) {
                            this.toggleLocalVideo();
                            return;
                        }
                        if (this.isVideoMuted == false || this.isVideoMuted == null)
                            this.muteVideo();
                        else this.unmuteVideo();
                    };
                    this.toggleLocalVideo = function () {
                        var i, listItem;
                        for (i = 0; listItem = tool.participantsList[i]; i++) {
                            if (listItem.participant.isLocal) {
                                if (tool.webrtcSignalingLib.localMediaControls.cameraIsEnabled()) {
                                    listItem.cameraBtnEl.innerHTML = _participantsToolIcons.disabledCamera;
                                    tool.webrtcSignalingLib.localMediaControls.disableVideo();
                                } else {
                                    listItem.cameraBtnEl.innerHTML = _controlsToolIcons.cameraTransparent;
                                    tool.webrtcSignalingLib.localMediaControls.enableVideo();
                                }
                                tool.state.controlsTool.updateControlBar();
                                break;
                            }
                        }
                    };
                    this.toggleLocalAudio = function () {
                        var i, listItem;
                        for (i = 0; listItem = tool.participantsList[i]; i++) {
                            if (listItem.participant.isLocal) {
                                var enabledAudioTracks = localParticipant.tracks.filter(function (t) {
                                    return t.kind == 'audio' && t.mediaStreamTrack != null && t.mediaStreamTrack.enabled;
                                }).length;

                                if (tool.webrtcSignalingLib.localMediaControls.micIsEnabled() && (enabledAudioTracks != 0 || localParticipant.audioStream != null)) {
                                    listItem.audioBtnEl.innerHTML = _participantsToolIcons.locDisabledMic;
                                    tool.webrtcSignalingLib.localMediaControls.disableAudio();
                                } else {
                                    listItem.audioBtnEl.innerHTML = _controlsToolIcons.microphoneTransparent;
                                    tool.webrtcSignalingLib.localMediaControls.enableAudio();
                                }
                                tool.state.controlsTool.updateControlBar();

                                break;
                            }
                        }
                    };
                    this.muteVideo = function () {
                        this.cameraBtnEl.innerHTML = _participantsToolIcons.disabledCamera;
                        this.cameraBtnEl.dataset.touchlabel = Q.getObject("webrtc.participantsPopup.turnOnCamera", tool.text);
                        this.isVideoMuted = true;
                        this.isActive = false;
                    };
                    this.unmuteVideo = function () {
                        this.cameraBtnEl.innerHTML = _controlsToolIcons.cameraTransparent;
                        this.cameraBtnEl.dataset.touchlabel = Q.getObject("webrtc.participantsPopup.turnOffCamera", tool.text);
                        this.isVideoMuted = false;
                        this.isActive = true;
                    };
                    this.muteScreenSharingVideo = function () {
                        this.screenSharingBtnEl.innerHTML = _participantsToolIcons.disabledScreen;
                        this.screenSharingBtnEl.dataset.touchlabel = Q.getObject("webrtc.participantsPopup.turnOnScreenSharing", tool.text);
                        this.screenSharingIsMuted = true;
                    };
                    this.unmuteScreenSharingVideo = function () {
                        this.screenSharingBtnEl.innerHTML = _participantsToolIcons.screen;
                        this.screenSharingBtnEl.dataset.touchlabel = Q.getObject("webrtc.participantsPopup.turnOffScreenSharing", tool.text);
                        this.screenSharingIsMuted = false;
                    };
                    this.toggleAudio = function (manually) {
                        if (this.participant.isLocal) {
                            this.toggleLocalAudio();
                            return;
                        }
                        if (!this.participant.audioIsMuted) {
                            this.muteAudio();
                        } else {
                            this.unmuteAudio();
                        }
                    };
                    this.muteAudio = function () {
                        this.participant.muteAudio();

                    };
                    this.unmuteAudio = function () {
                        this.participant.unmuteAudio();
                    };
                    this.toggleAudioIcon = function (audioIsActive) {
                        if (audioIsActive === true) {
                            this.audioBtnEl.innerHTML = _participantsToolIcons.loudSpeaker;
                            this.audioBtnEl.dataset.touchlabel = Q.getObject("webrtc.participantsPopup.turnOffAudio", tool.text);
                        } else if (audioIsActive === false) {
                            this.audioBtnEl.innerHTML = _participantsToolIcons.disabledSpeaker;
                            this.audioBtnEl.dataset.touchlabel = Q.getObject("webrtc.participantsPopup.turnOnAudio", tool.text);
                        }
                    };
                    this.remove = function () {
                        if (this.listElement.parentNode != null) this.listElement.parentNode.removeChild(this.listElement);
                        for (var i in tool.participantsList) {
                            if (tool.participantsList[i].participant.sid == this.participant.sid) {
                                tool.participantsList[i] = null;
                                break;
                            }
                        }

                        tool.participantsList = tool.participantsList.filter(function (listItem) {
                            return listItem != null;
                        })

                    };
                    this.toggleScreen = function (manually) {
                        var participant = this.participant;
                        var screens = participant.screens;

                        this.manuallyToggled = manually;
                        if (this.isActive == false) {
                            for (let s in screens) {
                                if (screens[s].screensharing || (screens[s].trackEl && !screens[s].trackEl.srcObject.active)) continue;
                                this.showPartcicipantScreens(screens[s], manually);
                            }

                            this.unmuteVideo();

                        } else {
                            for (let s in screens) {
                                if (screens[s].screensharing || (screens[s].trackEl && !screens[s].trackEl.srcObject.active)) continue;
                                this.removePartcicipantScreens(screens[s]);
                            }
                            this.muteVideo();
                        }

                        tool.webrtcUserInterface.screenRendering.updateLayout();

                    };
                    this.toggleScreenSharingScreen = function () {
                        var participant = this.participant;
                        var screens = participant.screens;

                        if (this.screenSharingIsMuted) {
                            for (let s in screens) {
                                let videoTracks = screens[s].videoTracks();
                                if (!screens[s].screensharing || (videoTracks[0].trackEl && !videoTracks[0].trackEl.srcObject.active)) continue;
                                this.showPartcicipantScreens(screens[s]);
                            }

                            this.unmuteScreenSharingVideo();

                        } else {
                            for (let s in screens) {
                                let videoTracks = screens[s].videoTracks();
                                if (!screens[s].screensharing || (videoTracks[0].trackEl && !videoTracks[0].trackEl.srcObject.active)) continue;
                                this.removePartcicipantScreens(screens[s]);
                            }
                            this.muteScreenSharingVideo();
                        }

                        tool.webrtcUserInterface.screenRendering.updateLayout();

                    };
                    this.removePartcicipantScreens = function (screen) {
                        var screens;
                        if (screen != null) {
                            screens = [screen]
                        } else {
                            screens = this.participant.screens;
                        }

                        for (var s in screens) {
                            let screen = screens[s];
                            screen.hide();
                        }
                    };
                    this.showPartcicipantScreens = function (screen, manually) {
                        var screens;
                        if (screen != null) {
                            screens = [screen]
                        } else {
                            screens = this.participant.screens;
                        }

                        for (var s in screens) {
                            let screen = screens[s];
                            screen.show();
                        }
                    };
                    this.showLiveIcon = function (platform) {
                        if (platform == 'facebook') {
                            let iconCon = document.createElement('DIV');
                            iconCon.className = 'Streams_webrtc_fblive_icon';
                            iconCon.innerHTML = _controlsToolIcons.facebookLive;
                            this.liveStatusEl.appendChild(iconCon)
                        } else {
                            let iconCon = document.createElement('DIV');
                            iconCon.className = 'Streams_webrtc_live_icon';
                            iconCon.innerHTML = _controlsToolIcons.liveStreaming;
                            this.liveStatusEl.appendChild(iconCon)
                        }

                        if (!this.liveStatusEl.classList.contains('isRecording')) this.liveStatusEl.classList.add('isRecording');
                    };
                    this.hideLiveIcon = function (platform) {
                        this.liveStatusEl.innerHTML = '';
                        if (this.liveStatusEl.classList.contains('isRecording')) this.liveStatusEl.classList.remove('isRecording');
                    };
                    this.showMediaRequestIcon = function (type, waitingTime) {
                        var participantListItem = this;
                        log('controls: showMediaRequestIcon');
                        if (type == 'camera') {
                            let cameraRequestCon = document.createElement('DIV');
                            cameraRequestCon.className = 'Streams_webrtc_camera_request_con';
                            let iconCon = document.createElement('DIV');
                            iconCon.className = 'Streams_webrtc_camera_request_icon';
                            iconCon.innerHTML = _controlsToolIcons.cameraRequest;
                            let requestTimer = document.createElement('DIV');
                            requestTimer.className = 'Streams_webrtc_camera_request_timer';
                            cameraRequestCon.appendChild(iconCon)
                            cameraRequestCon.appendChild(requestTimer)
                            this.mediaRequestStatusEl.appendChild(cameraRequestCon)

                            if (!this.mediaRequestStatusEl.classList.contains('Streams_webrtc_participants-requests-media')) this.mediaRequestStatusEl.classList.add('Streams_webrtc_participants-requests-media');

                            function cntDown() {
                                if (participantListItem.cameraRequestTimer) {
                                    clearInterval(participantListItem.cameraRequestTimer);
                                    participantListItem.cameraRequestTimer = null;
                                    requestTimer.style.display = '';
                                }

                                requestTimer.style.display = 'flex'
                                let sec = Math.round(waitingTime / 1000);
                                participantListItem.cameraRequestTimer = setInterval(() => {
                                    requestTimer.innerHTML = sec--;
                                    if (sec < 0) {
                                        requestTimer.style.display = '';
                                        clearInterval(participantListItem.cameraRequestTimer);
                                        participantListItem.cameraRequestTimer = null;
                                        participantListItem.hideMediaRequestIcon('camera')
                                    }
                                }, 1000);

                            }

                            cntDown();
                        } else {
                            let micRequestCon = document.createElement('DIV');
                            micRequestCon.className = 'Streams_webrtc_mic_request_con';
                            let iconCon = document.createElement('DIV');
                            iconCon.className = 'Streams_webrtc_mic_request_icon';
                            iconCon.innerHTML = _controlsToolIcons.microphoneRequest;
                            let requestTimer = document.createElement('DIV');
                            requestTimer.className = 'Streams_webrtc_mic_request_timer';
                            micRequestCon.appendChild(iconCon)
                            micRequestCon.appendChild(requestTimer)
                            this.mediaRequestStatusEl.appendChild(micRequestCon)

                            if (!this.mediaRequestStatusEl.classList.contains('Streams_webrtc_participants-requests-media')) this.mediaRequestStatusEl.classList.add('Streams_webrtc_participants-requests-media');

                            function cntDown() {
                                if (participantListItem.micRequestTimer) {
                                    clearInterval(participantListItem.micRequestTimer);
                                    participantListItem.micRequestTimer = null;
                                    requestTimer.style.display = '';
                                }

                                requestTimer.style.display = 'flex'
                                let sec = Math.round(waitingTime / 1000);
                                participantListItem.micRequestTimer = setInterval(() => {
                                    requestTimer.innerHTML = sec--;
                                    if (sec < 0) {
                                        requestTimer.style.display = '';
                                        clearInterval(participantListItem.micRequestTimer);
                                        participantListItem.micRequestTimer = null;
                                        participantListItem.hideMediaRequestIcon('mic')
                                    }
                                }, 1000);

                            }

                            cntDown();
                        }

                    };
                    this.hideMediaRequestIcon = function (type) {
                        log('controls: hideMediaRequestIcon', type);
                        let camIcon = this.mediaRequestStatusEl.querySelector('.Streams_webrtc_camera_request_con');
                        let micIcon = this.mediaRequestStatusEl.querySelector('.Streams_webrtc_mic_request_con');
                        if (type == 'camera') {
                            if (camIcon && camIcon.parentElement) camIcon.parentElement.removeChild(camIcon);
                            camIcon == null;
                        } else {
                            if (micIcon && micIcon.parentElement) micIcon.parentElement.removeChild(micIcon);
                            micIcon = null;
                        }

                        if (!camIcon && !micIcon && this.mediaRequestStatusEl.classList.contains('Streams_webrtc_participants-requests-media')) {
                            this.mediaRequestStatusEl.classList.remove('Streams_webrtc_participants-requests-media');
                        }
                    };
                }
                log('controls: addItem');
                var isLocal = roomParticipant.isLocal;
                var participantItem = document.createElement('LI');
                var tracksControlBtns = document.createElement('DIV');
                tracksControlBtns.className = 'Streams_webrtc_tracks-control';
                var muteVideo = document.createElement('DIV');
                muteVideo.className = 'Streams_webrtc_mute-video-btn' + (isLocal ? ' Streams_webrtc_isLocal' : '');
                var muteCameraBtn = document.createElement('DIV');
                muteCameraBtn.className = 'Streams_webrtc_mute-camera-btn';
                muteCameraBtn.dataset.touchlabel = Q.getObject("webrtc.participantsPopup.turnOffCamera", tool.text);
                muteCameraBtn.innerHTML = _controlsToolIcons.cameraTransparent;

                var muteScreenSharingBtn = document.createElement('DIV');
                muteScreenSharingBtn.className = 'Streams_webrtc_mute-screensharing-btn';
                muteScreenSharingBtn.dataset.touchlabel = Q.getObject("webrtc.participantsPopup.turnOffScreenSharing", tool.text);
                muteScreenSharingBtn.innerHTML = _participantsToolIcons.disabledScreen;

                var muteAudioBtn = document.createElement('DIV');
                muteAudioBtn.className = 'Streams_webrtc_mute-audio-btn' + (isLocal ? ' Streams_webrtc_isLocal' : '');
                muteAudioBtn.dataset.touchlabel = isLocal ? (tool.webrtcSignalingLib.localMediaControls.micIsEnabled() ? Q.getObject("webrtc.participantsPopup.turnOffAudio", tool.text) : Q.getObject("webrtc.participantsPopup.turnOnAudio", tool.text)) : Q.getObject("webrtc.participantsPopup.turnOffAudio", tool.text);
                muteAudioBtn.innerHTML = isLocal ? (tool.webrtcSignalingLib.localMediaControls.micIsEnabled() ? _controlsToolIcons.microphoneTransparent : _participantsToolIcons.locDisabledMic) : _participantsToolIcons.loudSpeaker;
                var participantIdentity = document.createElement('DIV');
                participantIdentity.className = 'Streams_webrtc_participants-identity';
                var participantIdentityIcon = document.createElement('DIV');
                var userId = roomParticipant.identity != null ? roomParticipant.identity.split('\t')[0] : Q.Users.loggedInUser.id;
                Q.activate(
                    Q.Tool.setUpElement(
                        participantIdentityIcon, // or pass an existing element
                        "Users/avatar",
                        {
                            userId: userId,
                            contents: false
                        }
                    )
                );
                //$(participantIdentityText).tool('Users/avatar', { userId: userId }).activate();
                //participantIdentityText.innerHTML = isLocal ? roomParticipant.identity + ' <span style="font-weight: normal;font-style: italic;">(me)</span>' : roomParticipant.identity;
                var liveStatus = document.createElement('DIV');
                liveStatus.className = 'Streams_webrtc_participants-live-status';
                if (roomParticipant.fbLiveStreamingActive) liveStatus.classList.add('isRecording');

                //container for icons when some user requests camera/mic
                var requestStatus = document.createElement('DIV');
                requestStatus.className = 'Streams_webrtc_participants-requests-status';

                //liveStatus.innerHTML = _controlsToolIcons.facebookLive;

                var participantIdentityText = document.createElement('DIV');
                //fullName.innerHTML = roomParticipant.userName;
                Q.activate(
                    Q.Tool.setUpElement(
                        participantIdentityText, // or pass an existing element
                        "Users/avatar",
                        {
                            userId: userId,
                            icon: false
                        }
                    )
                );

                var audioVisualization = document.createElement('DIV')
                audioVisualization.className = 'Streams_webrtc_popup-visualization';

                tool.webrtcSignalingLib.mediaManager.audioVisualization.build({
                    name: 'participantsPopup',
                    participant: roomParticipant,
                    element: audioVisualization,
                    updateSizeOnlyOnce: true
                });

                participantItem.appendChild(tracksControlBtns);
                muteVideo.appendChild(muteCameraBtn);
                muteVideo.appendChild(muteScreenSharingBtn);
                if (!tool.webrtcUserInterface.getOptions().audioOnlyMode) tracksControlBtns.appendChild(muteVideo);
                tracksControlBtns.appendChild(muteAudioBtn);
                participantItem.appendChild(tracksControlBtns);
                participantIdentity.appendChild(audioVisualization);
                participantIdentity.appendChild(participantIdentityIcon);
                participantIdentity.appendChild(liveStatus);
                participantIdentity.appendChild(requestStatus);
                participantIdentity.appendChild(participantIdentityText);
                participantItem.appendChild(participantIdentity);

                tool.participantListEl.appendChild(participantItem);

                var listItem = new ListItem();
                listItem.participant = roomParticipant;
                listItem.listElement = participantItem;
                listItem.videoBtnsEl = muteVideo;
                listItem.cameraBtnEl = muteCameraBtn;
                listItem.screenSharingBtnEl = muteScreenSharingBtn;
                listItem.audioBtnEl = muteAudioBtn;
                listItem.liveStatusEl = liveStatus;
                listItem.mediaRequestStatusEl = requestStatus;
                tool.participantsList.push(listItem);

                muteAudioBtn.addEventListener('click', function (e) {
                    listItem.toggleAudio(true);
                });
                muteCameraBtn.addEventListener('click', function (e) {
                    listItem.toggleScreen(true);
                });
                muteScreenSharingBtn.addEventListener('click', function (e) {
                    listItem.toggleScreenSharingScreen();
                });

            },
            /**
            * Remove item from participants list participants list
            * @method removeItem
            */
            removeItem: function (participant) {
                var tool = this;
                var item = tool.participantsList.filter(function (listItem) {
                    return listItem.participant.sid == participant.sid;
                })[0];
                if (item != null) item.remove();
            },
            updateItem: function update(participant) {
                var tool = this;
                for (let i in tool.participantsList) {
                    let item = tool.participantsList[i];
                    if (participant != item.participant) continue;

                    let activeCameraScreens = 0;
                    let activeScreenSharingScreens = 0;
                    for (let s in participant.screens) {
                        if (participant.screens[s].isActive) {
                            if (!participant.screens[s].screensharing) {
                                activeCameraScreens++;
                            } else {
                                activeScreenSharingScreens++;
                            }

                        }
                    }
                    if (activeCameraScreens == 0) {
                        item.muteVideo();
                    } else {
                        item.unmuteVideo();
                    }

                    if (activeCameraScreens == 0 && activeScreenSharingScreens != 0) {
                        if (!item.videoBtnsEl.classList.contains('Streams_webrtc_no-camera-video')) item.videoBtnsEl.classList.add('Streams_webrtc_no-camera-video')
                    } else {
                        if (item.videoBtnsEl.classList.contains('Streams_webrtc_no-camera-video')) item.videoBtnsEl.classList.remove('Streams_webrtc_no-camera-video')
                    }


                    if (participant.isLocal) {

                        if (!tool.webrtcSignalingLib.localMediaControls.micIsEnabled()) {
                            item.audioBtnEl.innerHTML = _participantsToolIcons.locDisabledMic;
                            item.audioBtnEl.dataset.touchlabel = Q.getObject("webrtc.participantsPopup.turnOnAudio", tool.text);
                        } else {
                            item.audioBtnEl.innerHTML = _controlsToolIcons.microphoneTransparent;
                            item.audioBtnEl.dataset.touchlabel = Q.getObject("webrtc.participantsPopup.turnOffAudio", tool.text);
                        }
                    } else {
                        if (!participant.audioIsMuted) {
                            item.toggleAudioIcon(true);
                        } else {
                            item.toggleAudioIcon(false);
                        }
                    }

                    if (activeScreenSharingScreens == 0) {
                        item.muteScreenSharingVideo();
                        if (item.videoBtnsEl.classList.contains('Streams_webrtc_screensharing-active')) item.videoBtnsEl.classList.remove('Streams_webrtc_screensharing-active')

                    } else {
                        item.unmuteScreenSharingVideo();
                        if (!item.videoBtnsEl.classList.contains('Streams_webrtc_screensharing-active')) item.videoBtnsEl.classList.add('Streams_webrtc_screensharing-active')
                    }
                    break;
                }

            },
            /**
            * Toggles video button (active/inactive) of local participant on participants list
            * @method toggleLocalVideo
            */
            toggleLocalVideo: function () {
                var tool = this;
                if (tool.participantsList == null) return;

                var i, listItem;
                for (i = 0; listItem = tool.participantsList[i]; i++) {
                    if (listItem.participant.isLocal) {
                        if (tool.webrtcSignalingLib.localMediaControls.cameraIsEnabled()) {
                            listItem.cameraBtnEl.innerHTML = _controlsToolIcons.cameraTransparent;
                            listItem.isVideoMuted = false;
                        } else {
                            listItem.cameraBtnEl.innerHTML = _participantsToolIcons.disabledCamera;
                            listItem.isVideoMuted = true;
                        }
                        break;
                    }
                }
            },
            /**
             * Toggles audio icon (active/inactive) of local participant on participants list
             * @method toggleLocalAudio
             */
            toggleLocalAudio: function () {
                var tool = this;
                if (tool.participantsList == null) return;

                var i, listItem;
                for (i = 0; listItem = tool.participantsList[i]; i++) {
                    if (listItem.participant.isLocal) {
                        if (tool.webrtcSignalingLib.localMediaControls.micIsEnabled()) {
                            listItem.audioBtnEl.innerHTML = _controlsToolIcons.microphoneTransparent;
                        } else {
                            listItem.audioBtnEl.innerHTML = _participantsToolIcons.locDisabledMic;
                        }
                        break;
                    }
                }
            },
            showScreen: function (screen, manually) {
                var tool = this;
                var i, listItem;
                for (i = 0; listItem = tool.participantsList[i]; i++) {
                    if (listItem.participant != screen.participant) continue;

                    listItem.showPartcicipantScreens(screen, manually);
                }
            },
            showLiveIndicator: function (participant, platform) {
                var tool = this;
                for (let i in tool.participantsList) {
                    let item = tool.participantsList[i];
                    if (participant != item.participant) continue;
                    item.showLiveIcon(platform);
                    break;
                }
            },
            hideLiveIndicator: function (participant, platform) {
                var tool = this;
                log('controls: hideLiveIndicator');

                for (let i in tool.participantsList) {
                    let item = tool.participantsList[i];
                    if (participant != item.participant) continue;

                    item.hideLiveIcon(platform);
                    break;
                }
            },
            showMediaRequestIndicator: function (e, type) {
                var tool = this;
                let participant = e.participant;
                log('controls: showMediaRequestIndicator', participant);
                for (let i in tool.participantsList) {
                    let item = tool.participantsList[i];
                    if (participant != item.participant) continue;
                    item.showMediaRequestIcon(type, e.waitingTime);
                    break;
                }
            },
            hideMediaRequestIndicator: function (e, type) {
                var tool = this;
                let participant = e.participant;
                log('controls: hideMediaRequestIndicator', participant);
                for (let i in tool.participantsList) {
                    let item = tool.participantsList[i];
                    if (participant != item.participant) continue;

                    item.hideMediaRequestIcon(type);
                    break;
                }
            },
            log: function log(text) {
                var tool = this;
                //if (!tool.state.debug.controls) return;
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

                if (tool.webrtcSignalingLib) tool.webrtcSignalingLib.event.dispatch('log', params);
            }
        }

    );

})(window.jQuery, window);