(function ($, window, undefined) {
    Streams = Q.Streams;
    /**
     * Streams/webrtc tool.
     * Users can chat with each other via WebRTC using Twilio or raw streams
     * @module Streams
     * @class Streams webrtc
     * @constructor
     * @param {Object} options
     *  Hash of possible options
     */
    Q.Tool.define("Streams/webrtc", function(options) {

            var tool = this;
            tool.state = Q.extend({}, tool.state, options);
            this.init();
        },

        {
            nodeServer: 'https://www.demoproject.co.ua:8443',
            editable: false,
            onCreate: new Q.Event(),
            onUpdate: new Q.Event(),
            onRefresh: new Q.Event()
        },

        {
            /**
             * Create  room or join existing one
             * @method init
             */
            init: function() {
                var tool = this;

                var roomId = tool.state.roomId != null ? tool.state.roomId : null;
                var roomPublisherId = tool.state.publisherId != null ? tool.state.publisherId : Q.Users.loggedInUser.id;
                if(roomId != null) tool.roomId = roomId;
                if(roomPublisherId != null) tool.roomPublisherId = roomPublisherId;
                //console.log('MY PUBLISHER ID', Q.Users.loggedInUser, roomId);


                //tool.initWithNodeServer();
                //return;
                console.log('INIT', roomId, roomPublisherId);

                if(roomId == null) {

                    Q.req("Streams/webrtc", ["stream"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);

                        if (msg) {
                            return Q.alert(msg);
                        }
                        console.log('response', response);

                        roomId = (response.slots.stream.name).replace('Streams/webrtc/', '');
                        //location.hash = roomId;

                        var connectUrl = tool.updateQueryStringParameter(location.href, 'Q.rid', roomId);
                        connectUrl = tool.updateQueryStringParameter(connectUrl, 'Q.pid', Q.Users.loggedInUser.id);
                        console.log('%c URL TO CONNECT', 'background:red;color:white', connectUrl)
                        Q.Streams.get(Q.Users.loggedInUser.id, 'Streams/webrtc/' + roomId, function (err, stream) {
                            tool.roomStream = stream;
                            tool.bindStreamsEvents(stream);
                            if(tool.state.mode == 'twilio') {
                                tool.startTwilioRoom(roomId);
                            } else tool.initWithNodeServer();

                        });

                    }, {
                        method: 'post'
                    });

                } else {
                    console.log('CONNECT streamname', 'Streams/webrtc/' + roomId)
                    Q.req("Streams/webrtc", ["join"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);

                        if(msg) {
                            return Q.alert(msg);
                        }

                        Q.Streams.get(roomPublisherId, 'Streams/webrtc/' + roomId, function (err, stream) {
                            console.log('Q.Streams.get');
                            tool.roomStream = stream;

                            tool.bindStreamsEvents(stream);
                            if(tool.state.mode == 'twilio') {
                                tool.startTwilioRoom(roomId);
                            } else tool.initWithNodeServer();


                        });
                    }, {
                        method: 'get',
                        fields: {
                            streamName: 'Streams/webrtc/' + roomId,
                            publisherId: roomPublisherId
                        }
                    });
                }


                var roomsMedia = document.createElement('DIV');
                roomsMedia.id = 'webrtc_tool-room-media';
                var dashboard = document.getElementById('dashboard_slot');
                if(Q.info.isMobile && !Q.info.isTablet) {
                    roomsMedia.style.height = 'calc(100% - ' + dashboard.offsetHeight + 'px)';
                    roomsMedia.style.top = dashboard.offsetHeight + 'px';
                }
                tool.element.appendChild(roomsMedia);
                tool.roomsMedia = roomsMedia;
            },

            updateQueryStringParameter: function updateQueryStringParameter(uri, key, value) {
                var re = new RegExp("([?|&])" + key + "=.*?(&|$)", "i");
                separator = uri.indexOf('?') !== -1 ? "&" : "?";
                if (uri.match(re)) {
                    return uri.replace(re, '$1' + key + "=" + value + '$2');
                }
                else {
                    return uri + separator + key + "=" + value;
                }
            },

            /**
             * Bind events that are needed for negotiating process to init WebRTC without using twilio
             * @method bindStreamsEvents
             * @param {Object} [stream] stream that represents room
             */
            bindStreamsEvents: function(stream) {
                var tool = this;

               /* WebRTCconference.event.on('candidate', function (candidateMessage) {
                    tool.sendMessage({
                        type: "candidate",
                        label: event.candidate.sdpMLineIndex,
                        id: event.candidate.sdpMid,
                        fromSid: Q.Users.loggedInUser.id,
                        targetSid: candidateMessage.targetSid,
                        candidate: candidateMessage
                    });
                })*/

                stream.onMessage('Streams/join').set(function (stream, message) {
                    console.log('%c STREAMS: ANOTHER USER JOINED', 'background:blue;color:white;', stream, message)
                    /*Q.Streams.get(message.byUserId, 'Streams/user/firstName', function () {
                        var firstName = this.content;
                        var newParticipant = {
                            sid:message.byUserId,
                            username:firstName,
                        }

                        WebRTCconference.eventBinding.socketParticipantConnected(newParticipant, function (localDescription) {
                            tool.sendMessage({
                                fromSid: Q.Users.loggedInUser.id,
                                targetSid: message.byUserId,
                                type: "offer",
                                sdp: localDescription
                            });
                        });

                        tool.screensRendering().renderScreens();
                    });*/
                });
                stream.onMessage('Streams/connected').set(function (stream, message) {
                    console.log('%c STREAMS: ANOTHER USER JOINED', 'background:blue;color:white;', stream, message)
                    /*Q.Streams.get(message.byUserId, 'Streams/user/firstName', function () {
                        var firstName = this.content;
                        var newParticipant = {
                            sid:message.byUserId,
                            username:firstName,
                        }

                        WebRTCconference.eventBinding.socketParticipantConnected(newParticipant, function (localDescription) {
                            tool.sendMessage({
                                fromSid: Q.Users.loggedInUser.id,
                                targetSid: message.byUserId,
                                type: "offer",
                                sdp: localDescription
                            });
                        });

                        tool.screensRendering().renderScreens();
                    });*/
                });


               /* stream.onMessage('Streams/webrtc/signalling').set(function (stream, message) {
                    if(message.instructions.targetUserId != Q.Users.loggedInUser.id) return;
                    console.log('%c STREAMS: SIGNALLING MESSAGE RECEIVED', 'background:blue;color:white;', stream, message)
                    if (message.content.type === 'offer') {
                        WebRTCconference.offerReceived(message, function (localDescription) {
                            tool.sendMessage({
                                fromSid: Q.Users.loggedInUser.id,
                                targetSid: message.byUserId,
                                type: "answer",
                                sdp: localDescription
                            });
                        });
                    }
                    else if (message.content.type === 'answer') {
                        WebRTCconference.answerRecieved(message);
                    }
                    else if (message.content.type === 'candidate') {
                        WebRTCconference.iceConfigurationReceived(message)
                    }
                });*/
            },
            sendMessage: function(message) {
                var tool = this;
                tool.roomStream.post({
                    publisherId: Q.Users.loggedInUser.id,
                    type: 'Streams/signalling',
                    content: message,
                }, function (data) {
                    console.log('adapter: offer sent', data)
                });
            },

            /**
             * Bind events that are triggered by twilio-video library
             * @method bindConferenceEvents
             */
            bindConferenceEvents: function() {
                var tool = this;
                WebRTCconference.event.on('participantConnected', function (participant) {
                    console.log('%c TWILIO: ANOTHER USER JOINED', 'background:blue;color:white;', participant)

                    tool.screensRendering().renderScreens();
                });
                WebRTCconference.event.on('participantDisconnected', function (participant) {
                    console.log('%c TWILIO: ANOTHER USER DISCONNECTED', 'background:blue;color:white;', participant)

                    tool.screensRendering().renderScreens();
                });
                WebRTCconference.event.on('trackAdded', function (participant) {
                    console.log('%c TWILIO: TRACK ADDED', 'background:blue;color:white;', participant)
                    tool.screensRendering().renderScreens();
                });
            },

            /**
             * Connect webrtc room using twilio.
             * @method startTwilioRoom
             */
            startTwilioRoom: function(roomId) {
                var tool = this;
                Q.addStylesheet('{{Streams}}/css/tools/webrtc.css');

                Q.addScript([
                    "https://requirejs.org/docs/release/2.2.0/minified/require.js",
                    "https://www.demoproject.co.ua/video-chat/src/js/app.js?t=" + (+new Date),
                ], function () {
                    console.log('WebRTCconference', WebRTCconference)

                    Q.req("Streams/webrtc", ["token"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);

                        if (msg) {
                            return Q.alert(msg);
                        }
                        console.log('response', response);

                        window.WebRTCconference = WebRTCconference({
                            mode:'twilio',
                            twilioAccessToken: response.slots.token,
                            useAsLibrary: true,
                        });
                        WebRTCconference.init(function () {
                            tool.bindConferenceEvents();
                            tool.screensRendering().renderScreens();
                            tool.updateParticipantData();
                            var controlEl = Q.Tool.setUpElement('DIV', 'Streams/webrtc/controls', {});
                            $(controlEl).appendTo(document.querySelector('body')).activate(function () {
                                tool.screensRendering().renderScreens();
                            });
                        });

                    }, {
                        method: 'get',
                        fields: {
                            streamName: tool.roomStream.fields.name,
                            publisherId: tool.roomPublisherId,
                        }
                    });
                });
            },
            updateParticipantData: function() {
                var tool = this;
                Q.req("Streams/webrtc", ["updateParticipantSid"], function (err, response) {
                    var msg = Q.firstErrorMessage(err, response && response.errors);

                    if (msg) {
                        return Q.alert(msg);
                    }
                    console.log('response', response);

                }, {
                    method: 'put',
                    fields: {
                        streamName: tool.roomStream.fields.name,
                        publisherId: tool.roomPublisherId,
                        twilioParticipantSid: WebRTCconference.localParticipant().sid,
                    }
                })
            },

            /**
             * Connect webrtc room using streams.
             * @method initWithStreams
             */
            initWithStreams: function() {
                var tool = this;
                Q.addStylesheet('{{Streams}}/css/tools/webrtc.css');

                Q.addScript([
                    "https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.7.3/socket.io.js",
                    "https://requirejs.org/docs/release/2.2.0/minified/require.js",
                    "https://www.demoproject.co.ua/video-chat/src/js/app.js?t=" + (+new Date),
                ], function () {
                    console.log('WebRTCconference', WebRTCconference)
                    window.WebRTCconference = WebRTCconference({
                        webrtcMode:'nodejs',
                        useAsLibrary: true,
                        sid:  Q.Users.loggedInUser.id,
                        username:  Q.Users.loggedInUser.displayName,
                    });
                    WebRTCconference.init(function () {
                        tool.startStreamsRoom();
                        tool.screensRendering().renderScreens();

                        var controlEl = Q.Tool.setUpElement('DIV', 'Streams/webrtc/controls', {});
                        $(controlEl).appendTo(document.querySelector('body')).activate(function () {
                            tool.screensRendering().renderScreens();
                        });
                    });
                });
            },

            /**
             * Init conference using own node.js server.
             * @method initWithStreams
             */
            initWithNodeServer: function() {
                var tool = this;
                Q.addStylesheet('{{Streams}}/css/tools/webrtc.css');

                Q.addScript([
                    "https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.7.3/socket.io.js",
                    "https://requirejs.org/docs/release/2.2.0/minified/require.js",
                    "https://www.demoproject.co.ua/video-chat/src/js/app.js?t=" + (+new Date),
                ], function () {
                    console.log('tool.roomStream2', tool.roomStream)
                    var roomId = (tool.roomStream.fields.name).replace('Streams/webrtc/', '');
                    window.WebRTCconference = WebRTCconference({
                        webrtcMode:'nodejs',
                        useAsLibrary: true,
                        nodeServer: tool.state.nodeServer,
                        roomName: roomId,
                        sid:  Q.Users.loggedInUser.id,
                        username:  Q.Users.loggedInUser.displayName,
                    });
                    WebRTCconference.init(function () {
                        tool.bindConferenceEvents();
                        tool.startNodeJsRoom();
                        tool.screensRendering().renderScreens();

                        var controlEl = Q.Tool.setUpElement('DIV', 'Streams/webrtc/controls', {});
                        $(controlEl).appendTo(document.querySelector('body')).activate(function () {
                            tool.screensRendering().renderScreens();
                        });
                    });
                });
            },
            startStreamsRoom: function() {
                var tool = this;

                var roomId = tool.state.roomId != null ? tool.state.roomId : null;

                console.log('MY PUBLISHER ID', Q.Users.loggedInUser, roomId);

                if(roomId == null) {

                    Q.req("Streams/webrtc", ["stream"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);

                        if (msg) {
                            return console.error(msg);
                        }
                        console.log('startStreamsRoom', response);

                        roomId = (response.slots.stream.name).replace('Streams/webrtc/', '');
                        //location.hash = roomId;

                        Q.Streams.get(Q.Users.communityId, 'Streams/webrtc/' + roomId, function (err, stream) {
                            tool.roomStream = this;
                            tool.bindStreamsEvents(stream);
                        });

                    }, {
                        method: 'post'
                    });

                } else {
                    console.log('CONNECT streamname', 'Streams/webrtc/' + roomId)
                    Q.req("Streams/webrtc", ["join"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);

                        if (msg) {
                            return console.error(msg);
                        }

                        Q.Streams.get(Q.Users.communityId, 'Streams/webrtc/' + roomId, function (err, stream) {
                            console.log('Q.Streams.ge', response);

                            tool.bindStreamsEvents(stream);
                        });
                    }, {
                        method: 'get',
                        fields: {
                            streamName: 'Streams/webrtc/' + roomId
                        }
                    });
                }


                var roomsMedia = document.createElement('DIV');
                roomsMedia.id = 'webrtc_tool-room-media';
                var dashboard = document.getElementById('dashboard_slot');
                if(Q.info.isMobile && !Q.info.isTablet) {
                    roomsMedia.style.height = 'calc(100% - ' + dashboard.offsetHeight + 'px)';
                    roomsMedia.style.top = dashboard.offsetHeight + 'px';
                }
                tool.element.appendChild(roomsMedia);
                tool.roomsMedia = roomsMedia;
            },
            startNodeJsRoom: function() {
                var tool = this;

                var roomId = tool.state.roomId != null ? tool.state.roomId : null;

                console.log('MY PUBLISHER ID', Q.Users.loggedInUser, roomId);

                if(roomId == null) {

                    Q.req("Streams/webrtc", ["stream"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);

                        if (msg) {
                            return console.error(msg);
                        }
                        console.log('startStreamsRoom', response);

                        roomId = (response.slots.stream.name).replace('Streams/webrtc/', '');

                        Q.Streams.get(tool.roomPublisherId, 'Streams/webrtc/' + roomId, function (err, stream) {
                            console.log('Q.Streams.get');

                            tool.bindStreamsEvents();
                            tool.roomStream = stream;
                        });

                    }, {
                        method: 'post'
                    });

                } else {
                    console.log('CONNECT streamname', 'Streams/webrtc/' + roomId)
                    Q.req("Streams/webrtc", ["join"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);

                        if (msg) {
                            return console.error(msg);
                        }

                        Q.Streams.get(tool.roomPublisherId, 'Streams/webrtc/' + roomId, function (err, stream) {
                            console.log('Q.Streams.ge', response);

                            tool.bindStreamsEvents(stream);
                        });
                    }, {
                        method: 'get',
                        fields: {
                            streamName: 'Streams/webrtc/' + roomId
                        }
                    });
                }


                var roomsMedia = document.createElement('DIV');
                roomsMedia.id = 'webrtc_tool-room-media';
                var dashboard = document.getElementById('dashboard_slot');
                if(Q.info.isMobile && !Q.info.isTablet) {
                    roomsMedia.style.height = 'calc(100% - ' + dashboard.offsetHeight + 'px)';
                    roomsMedia.style.top = dashboard.offsetHeight + 'px';
                }
                tool.element.appendChild(roomsMedia);
                tool.roomsMedia = roomsMedia;
            },

            /**
             * Render screens of all participants of the room
             * @method screensRendering
             */
            screensRendering: function () {
                var tool = this;
                console.log('tool', tool)
                var renderedScreens;
                var control = {};
                control.renderScreens = function() {
                    console.log('control.renderScreens', tool.renderedScreens)

                    tool.roomsMedia.innerHTML = '';
                    tool.renderedScreens = [];
                    if(Q.info.isMobile){
                        renderMobileScreensGrid();
                    } else renderDesktopScreensGrid();

                    bindScreensEvents();
                }

                /**
                 * Make screens resizible and movable
                 * @method bindScreensEvents
                 */
                var bindScreensEvents = function () {

                    var i, participantScreen;
                    for(i = 0; participantScreen = tool.renderedScreens[i]; i++) {

                        Q.activate(
                            Q.Tool.setUpElement(
                                participantScreen, // or pass an existing element
                                "Q/resize",
                                {}
                            )
                        );
                    }
                }

                var fitScreenToVideo = function (videoEl, screen) {
                    var screenEl =  videoEl.parentNode.parentNode;
                    var elRect = screenEl.getBoundingClientRect();

                    var ratio0 =  videoEl.videoWidth / videoEl.videoHeight;
                    console.log('loadedmetadata 00', screen.width, screen.height);
                    console.log('loadedmetadata', elRect.height, elRect.width, videoEl.videoHeight, videoEl.videoWidth);
                    var elementWidth, elementHeight;
                    if(ratio0 < 1) {
                        elementWidth = parseInt(290 * ratio0);
                        elementHeight = 290;
                        videoEl.style.width = '100%';
                        videoEl.parentNode.style.flexDirection = 'column';
                    } else {
                        elementHeight = parseInt(280 / ratio0);
                        elementWidth = 280;
                        videoEl.style.height = '100%';
                    }
                    console.log('loadedmetadata ' +  elementWidth + '-- ' + elementHeight);

                    screenEl.style.width = elementWidth + 'px';
                    screenEl.style.height = elementHeight + 'px';
                    console.log('loadedmetadata ', screenEl);
                    console.log('loadedmetadata ',screenEl.style.width, screenEl.style.height);

                }

                /**
                 * Create participamt's screen element that will be rendered one the page
                 * @method createRoomScreen
                 * @param {Object} [screen] screen object generated by webrtc WebRTCconference library
                 */
                var createRoomScreen = function(screen) {
                    console.log('createParticipantScreen', screen);
                    var chatParticipantEl = document.createElement('DIV');
                    chatParticipantEl.className = 'webrtc_tool_chat-participant';
                    chatParticipantEl.dataset.participantName = screen.sid;
                    var chatParticipantVideoCon = screen.videoCon;
                    chatParticipantVideoCon.className = 'webrtc_tool_chat-participant-video';
                    var chatParticipantName = document.createElement('DIV');
                    chatParticipantName.className = 'webrtc_tool_chat-participant-name';
                    var participantNameTextCon = document.createElement("DIV");
                    participantNameTextCon.className = "webrtc_tool_participant-name-text";
                    var participantNameText = document.createElement("DIV");
                    participantNameText.innerHTML = screen.participant.identity;

                    chatParticipantEl.appendChild(chatParticipantVideoCon);
                    participantNameTextCon.appendChild(participantNameText);
                    chatParticipantName.appendChild(participantNameTextCon);
                    /*if(screen.isLocal && Q.info.isMobile) {
                        console.log('screen.isLocal && Q.info.isMobile', window.WebRTCcontrolBar);

                        if(window.WebRTCcontrolBar != null) chatParticipantName.appendChild(window.WebRTCcontrolBar);
                    }*/
                    chatParticipantEl.appendChild(chatParticipantName);

                    tool.renderedScreens.push(chatParticipantEl);
                    return chatParticipantEl;
                }

                /**
                 * Render participants' screens on desktop's screen
                 * @method renderDesktopScreensGrid
                 */
                var renderDesktopScreensGrid = function() {
                    var screens =  WebRTCconference.screens();
                    console.log('roomScreens.length', screens.length);

                    var prerenderedScreens = document.createDocumentFragment();
                    console.log('renderScreens 1', screens.length);

                    var windowWidth = window.innerWidth;
                    var windowHeight = window.innerHeight;
                    var i, participantScreen;
                    for(i = 0; participantScreen = screens[i]; i++) {
                        // participantScreen.screenEl.style.left =  (i == 0) ? 0 : (screens[i - 1].screenEl.style.left.replace('px', '') + 100) + 'px';
                        if(participantScreen.screenEl == null) {
                            var screenEl = createRoomScreen(participantScreen)
                            participantScreen.screenEl = screenEl;
                        }

                        prerenderedScreens.appendChild(participantScreen.screenEl);
                    }

                    tool.roomsMedia.appendChild(prerenderedScreens);
                }

                /**
                 * Render participants' screens on mobile
                 * @method renderMobileScreensGrid
                 */
                var renderMobileScreensGrid = function() {
                    var roomScreens =  WebRTCconference.screens();
                    console.log('roomScreens', roomScreens);
                    console.log('roomScreens.length', roomScreens.length);

                    var prerenderedScreens = document.createDocumentFragment();
                    var num = roomScreens.length;
                    switch (num) {
                        case 1:

                            var rowDiv;
                            var x=0;
                            var i, participantScreen;
                            for(i = 0; participantScreen = roomScreens[i]; i++) {
                                rowDiv = document.createElement('DIV');
                                rowDiv.className = 'webrtc_tool_full-screen-stream';
                                participantScreen.screenEl = createRoomScreen(participantScreen);
                                rowDiv.appendChild(participantScreen.screenEl);
                                prerenderedScreens.appendChild(rowDiv);
                            }

                            toggleScreensGreedClass('webrtc_tool_full-screen-grid');
                            break;
                        case 2:

                            var rowDiv;
                            var x=0;
                            var i, participantScreen;
                            for(i = 0; participantScreen = roomScreens[i]; i++) {
                                rowDiv = document.createElement('DIV');
                                rowDiv.className = 'webrtc_tool_full-width-row';
                                participantScreen.screenEl = createRoomScreen(participantScreen);
                                rowDiv.appendChild(participantScreen.screenEl);
                                prerenderedScreens.appendChild(rowDiv);
                            }
                            toggleScreensGreedClass('webrtc_tool_two-rows-grid');

                            break;
                        case 3:

                            var rowDiv;
                            var x=0;
                            var i, participantScreen;
                            for(i = 0; participantScreen = roomScreens[i]; i++) {
                                if(i == 0) {
                                    rowDiv = document.createElement('DIV');
                                    rowDiv.className = 'webrtc_tool_full-width-row';
                                    participantScreen.screenEl = createRoomScreen(participantScreen);
                                    rowDiv.appendChild(participantScreen.screenEl);
                                    prerenderedScreens.appendChild(rowDiv)
                                } else {
                                    if(x == 0) {
                                        rowDiv = document.createElement('DIV');
                                        rowDiv.className = 'webrtc_tool_half-width-row';
                                        prerenderedScreens.appendChild(rowDiv)
                                    }
                                    participantScreen.screenEl = createRoomScreen(participantScreen);
                                    rowDiv.appendChild(participantScreen.screenEl);
                                    if(x == 0)
                                        x++;
                                    else
                                        x = 0;
                                }
                            }
                            toggleScreensGreedClass('webrtc_tool_two-rows-grid');

                            break;
                        case 4:
                            var rowDiv;
                            var perRow = 2;
                            var x = 0;
                            var i, participantScreen;
                            for(i = 0; participantScreen = roomScreens[i]; i++) {

                                if(x == 0) {
                                    rowDiv = document.createElement('DIV');
                                    rowDiv.className = 'webrtc_tool_half-width-row';

                                }
                                participantScreen.screenEl = createRoomScreen(participantScreen);
                                rowDiv.appendChild(participantScreen.screenEl);
                                if(x == perRow-1) {
                                    prerenderedScreens.appendChild(rowDiv);
                                    x = 0;
                                } else x++;


                            }
                            toggleScreensGreedClass('webrtc_tool_two-rows-grid');

                            break;
                        case 5:
                            var rowDiv;
                            var x=0;
                            var i, participantScreen;
                            for(i = 0; participantScreen = roomScreens[i]; i++) {

                                if(i == 2){
                                    rowDiv = document.createElement('DIV');
                                    rowDiv.className = 'webrtc_tool_full-width-row';
                                    prerenderedScreens.appendChild(rowDiv)

                                    participantScreen.screenEl = createRoomScreen(participantScreen);
                                    rowDiv.appendChild(participantScreen.screenEl);
                                    continue;
                                }

                                if(x == 0) {
                                    rowDiv = document.createElement('DIV');
                                    rowDiv.className = 'webrtc_tool_half-width-row';
                                }
                                participantScreen.screenEl = createRoomScreen(participantScreen);
                                rowDiv.appendChild(participantScreen.screenEl);

                                if(x == 1) {
                                    prerenderedScreens.appendChild(rowDiv);
                                    x = 0;
                                } else x++;

                            }
                            toggleScreensGreedClass('webrtc_tool_three-rows-grid');

                            break;
                        case 6:
                            var rowDiv;
                            var perRow = 2;
                            var x = 0;
                            var i, participantScreen;
                            for(i = 0; participantScreen = roomScreens[i]; i++) {

                                if(x == 0) {
                                    rowDiv = document.createElement('DIV');
                                    rowDiv.className = 'webrtc_tool_half-width-row';

                                }
                                participantScreen.screenEl = createRoomScreen(participantScreen);
                                rowDiv.appendChild(participantScreen.screenEl);

                                if(x == perRow-1) {
                                    prerenderedScreens.appendChild(rowDiv);
                                    x = 0;
                                } else x++;

                            }
                            toggleScreensGreedClass('webrtc_tool_three-rows-grid');

                            break;
                        default:
                            var rowDiv;
                            var x = 0;
                            var i = 0;

                            rowDiv = document.createElement('DIV');
                            rowDiv.className = 'webrtc_tool_main-screen-stream';
                            rowDiv.appendChild(createRoomScreen(participantScreen))
                            prerenderedScreens.appendChild(rowDiv);
                            var mainScreen = rowDiv;

                            var videoThumbsCon = document.createElement('div');
                            videoThumbsCon.className = 'webrtc_tool_video-thumbs-wrapper';
                            var videoThumbs = document.createElement('div');
                            videoThumbs.className = 'webrtc_tool_video-thumbs-inner';

                            var participantScreen;
                            for(i = 1; participantScreen = roomScreens[i]; i++) {


                                rowDiv = document.createElement('DIV');
                                rowDiv.className = 'webrtc_tool_flex-row-item';

                                participantScreen.screenEl = createRoomScreen(participantScreen);
                                rowDiv.appendChild(participantScreen.screenEl);

                                videoThumbs.appendChild(rowDiv);



                            }
                            videoThumbsCon.appendChild(videoThumbs);
                            prerenderedScreens.appendChild(videoThumbsCon);
                            //roomsMedia.className = 'webrtc_tool_webrtc_tool_full-screen-grid';
                            toggleScreensGreedClass('webrtc_tool_thumbs-screens-grid');

                    }

                    tool.roomsMedia.innerHTML = '';
                    tool.roomsMedia.appendChild(prerenderedScreens);
                }

                /**
                 * Change type of screens grid according to the number of participants
                 * @method toggleScreensGreedClass
                 * @param {Object} [classToSwitch] className that defines style of grid
                 */
                var toggleScreensGreedClass = function (classToSwitch) {
                    var gridClasses = [
                        'webrtc_tool_full-screen-grid',
                        'webrtc_tool_two-rows-grid',
                        'webrtc_tool_three-rows-grid',
                        'webrtc_tool_thumbs-screens-grid'
                    ];

                    for(var i in gridClasses){
                        if(tool.roomsMedia.classList.contains(gridClasses[i])) tool.roomsMedia.classList.remove(gridClasses[i])
                    }
                    tool.roomsMedia.classList.add(classToSwitch);
                }

                return control;
            },

            /*streamsAdapter: function () {
                //var tool = this;
                var adapter = {};
                adapter.participantConnected = function(stream, participant) {
                    WebRTCconference.eventBinding.socketParticipantConnected({sid:participant.sid, identity:participant.sid}, function (localDescription) {
                        stream.post({
                            publisherId: Q.Users.loggedInUser.id,
                            type: 'Streams/signalling',
                            content: {
                                name: WebRTCconference.localParticipant().identity,
                                targetSid: participant.sid,
                                type: "offer",
                                sdp: localDescription
                            },
                        }, function (data) {
                            console.log('adapter: offer sent', data)
                        });
                    })
                };
                adapter.offerReceived = function(stream, message) {
                    WebRTCconference.eventBinding.offerReceived(message, function (localDescription) {
                        stream.post({
                            publisherId: Q.Users.loggedInUser.id,
                            type: 'Streams/signalling',
                            content: {
                                name:  WebRTCconference.localParticipant().identity,
                                targetSid: message.fromSid,
                                type: "answer",
                                sdp: localDescription
                            },
                        }, function (data) {
                            console.log('adapter: offer sent', data)
                        });
                    })
                };
                adapter.answerReceived = function(message) {
                    WebRTCconference.eventBinding.answerReceived(message)
                }
                adapter.iceCandidateReceived = function(message) {
                    WebRTCconference.eventBinding.iceCandidateReceived(message)
                }

                return adapter;
            }*/
        }

    );


})(window.jQuery, window);