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
            var state = tool.state;
            this.init();
        },

        {
            editable: false,
            onCreate: new Q.Event(),
            onUpdate: new Q.Event(),
            onRefresh: new Q.Event()
        },

        {
            init: function() {
                var tool = this;

                var ua=navigator.userAgent;
                if(ua.indexOf('Android')!=-1||ua.indexOf('Windows Phone')!=-1||ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) {
                    Q.info.isMobile = true;
                } else Q.info.isMobile = false;

                var roomId = tool.state.roomId != null ? tool.state.roomId : null;

                console.log('MY PUBLISHER ID', Q.Users.loggedInUser, roomId);



                if(roomId == null) {

                    Q.req("Streams/webrtc", ["stream"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);

                        if (msg) {
                            return Q.alert(msg);
                        }
                        console.log('response', response);

                        roomId = (response.slots.stream.name).replace('Streams/webrtc/', '');
                        location.hash = roomId;

                        Q.Streams.get(Q.Users.communityId, 'Streams/webrtc/' + roomId, function (err, stream) {
                            tool.bindStreamsEvents(this);
                            tool.startTwilioRoom(roomId);
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

                        Q.Streams.get(Q.Users.communityId, 'Streams/webrtc/' + roomId, function (err, stream) {
                            tool.bindStreamsEvents(this);
                            tool.startTwilioRoom(roomId);
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
                if(Q.info.isMobile) {
                    roomsMedia.style.height = 'calc(100% - ' + dashboard.offsetHeight + 'px)';
                    roomsMedia.style.top = dashboard.offsetHeight + 'px';
                }
                tool.element.appendChild(roomsMedia);
                tool.roomsMedia = roomsMedia;
            },
            bindStreamsEvents: function(stream) {
                var tool = this;
                stream.onMessage('Streams/join').set(function (stream, message) {
                    console.log('%c STREAMS: ANOTHER USER JOINED', 'background:blue;color:white;', stream, message)
                    tool.screensRendering().renderScreens();
                });
                stream.onMessage('Streams/webrtc/signalling').set(function (stream, message) {
                    console.log('%c STREAMS: SIGNALLING MESSAGE RECEIVED', 'background:blue;color:white;', stream, message)
                    if (message.type === 'offer') {
                        WebRTCconference.offerReceived(message, function (localDescription) {
                            sendMessage({
                                name: localParticipant.identity,
                                targetSid: message.fromSid,
                                type: "answer",
                                sdp: localDescription
                            });
                        });
                    }
                    else if (message.type === 'answer') {
                        WebRTCconference.answerRecieved(message);
                    }
                    else if (message.type === 'candidate') {
                        WebRTCconference.iceConfigurationReceived(message)
                    }
                });
                stream.onMessage('Streams/webrtc/signalling').set(function (stream, message) {
                    console.log('%c STREAMS: SIGNALLING MESSAGE RECEIVED', 'background:blue;color:white;', stream, message)
                });
            },
            bindTwilioEvents: function(stream) {
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
                            tool.bindTwilioEvents();
                            tool.screensRendering().renderScreens();

                            var controlEl = Q.Tool.setUpElement('DIV', 'Streams/webrtc/control', {});
                            $(controlEl).appendTo(document.querySelector('body')).activate(function () {
                                tool.screensRendering().renderScreens();
                            });
                        });

                    }, {
                        method: 'get',
                        fields: {
                            roomName: roomId,
                        }
                    });
                });
            },
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

                var bindScreensEvents = function () {
                    var screens =  WebRTCconference.screens();
                    console.log('bindScreensEvents', tool.renderedScreens)

                    var i, participantScreen;
                    for(i = 0; participantScreen = tool.renderedScreens[i]; i++) {
                        console.log('bindScreensEvents', Q.info.isMobile)

                        if(Q.info.isMobile) {
                            console.log('Q.info.isMobile', Q.info.isMobile)
                            participantScreen.addEventListener('touchstart', function (e) {
                                console.log('touchstart', e.currentTarget);
                                _dragElement.initMoving(e.currentTarget, document.body, e)
                            });
                            participantScreen.addEventListener('touchend', function (e) {
                                _dragElement.stopMoving(document.body)
                            });
                        } else {
                            participantScreen.addEventListener('mousedown', function (e) {
                                console.log(e.target, e.currentTarget)
                                _dragElement.initMoving(e.currentTarget, document.body, e)
                            });
                            participantScreen.addEventListener('mouseup', function (e) {
                                _dragElement.stopMoving(document.body)
                            });


                            participantScreen.addEventListener('mousedown', function (e) {
                                _dragElement.initMoving(e.currentTarget, document.body, e)
                            });
                            participantScreen.addEventListener('mouseup', function (e) {
                                _dragElement.stopMoving(document.body)
                            });
                        }

                        resizeElement.setHandler(participantScreen);

                    }
                }

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
                    if(screen.isLocal && Q.info.isMobile) {
                        console.log('screen.isLocal && Q.info.isMobile', window.WebRTCcontrolBar);

                        if(window.WebRTCcontrolBar != null) chatParticipantName.appendChild(window.WebRTCcontrolBar);
                    }
                    chatParticipantEl.appendChild(chatParticipantName);

                    var videoEl = screen.videoCon.querySelector('video');
                    if(videoEl && !Q.info.isMobile) {

                        videoEl.addEventListener('loadedmetadata', function(e){
                            console.log('loadedmetadata', e.target.videoWidth);
                            //atParticipantEl.style.width = e.target.videoWidth + 'px;'
                            var elRect = chatParticipantEl.getBoundingClientRect();
                            var ratio =  e.target.videoWidth / e.target.videoHeight;
                            var ratio2 =  e.target.videoWidth / e.target.videoHeight;

                            var elementWidth,elementHeight;
                            if(ratio < 1) {
                                elementWidth = parseInt(elRect.height * ratio);
                                elementheight = parseInt(elRect.width / ratio);
                                chatParticipantEl.style.width = elementWidth + 'px'
                                chatParticipantEl.style.height = elementheight + 'px'
                                console.log('loadedmetadata0',  elementWidth, elRect.width);

                            }
                            else {
                                elementHeight = parseInt(elRect.width / ratio);
                                console.log('loadedmetadata0',  elementHeight, elRect.height);

                            }

                        });
                    }

                    tool.renderedScreens.push(chatParticipantEl);
                    return chatParticipantEl;
                }

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
                        var screenEl = createRoomScreen(participantScreen)
                        participantScreen.screenEl = screenEl;
                        prerenderedScreens.appendChild(screenEl);
                    }

                    tool.roomsMedia.appendChild(prerenderedScreens);
                }

                var renderMobileScreensGrid = function() {
                    var roomScreens =  WebRTCconference.screens();
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
                                rowDiv.appendChild(createRoomScreen(participantScreen));
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
                                rowDiv.appendChild(createRoomScreen(participantScreen));
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
                                    rowDiv.appendChild(createRoomScreen(participantScreen))
                                    prerenderedScreens.appendChild(rowDiv)
                                } else {
                                    if(x == 0) {
                                        rowDiv = document.createElement('DIV');
                                        rowDiv.className = 'webrtc_tool_half-width-row';
                                        prerenderedScreens.appendChild(rowDiv)
                                    }
                                    rowDiv.appendChild(createRoomScreen(participantScreen))

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
                                rowDiv.appendChild(createRoomScreen(participantScreen))

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

                                    rowDiv.appendChild(createRoomScreen(participantScreen))
                                    continue;
                                }

                                if(x == 0) {
                                    rowDiv = document.createElement('DIV');
                                    rowDiv.className = 'webrtc_tool_half-width-row';
                                }
                                rowDiv.appendChild(createRoomScreen(participantScreen))

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
                                rowDiv.appendChild(createRoomScreen(participantScreen));

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
                            rowDiv.appendChild(roomScreens[0].screenEl)
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

                                rowDiv.appendChild(createRoomScreen(participantScreen))


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

                var clearAllScreens = function () {
                    var screens =  WebRTCconference.screens();

                    var i, participantScreen;
                    for(i = 0; participantScreen = screens[i]; i++) {
                        var screenEl = participantScreen.screenEl;
                        if(screenEl.parentNode != null) screenEl.parentNode.removeChild(screenEl);
                    }
                }


                var _dragElement = function(){
                    var elementToMove;
                    var posX, posY, divTop, divLeft, eWi, eHe, cWi, cHe, diffX, diffY;
                    var move = function(xpos,ypos){
                        console.log('xpos,ypos', xpos,ypos)
                        elementToMove.style.left = xpos + 'px';
                        elementToMove.style.top = ypos + 'px';
                    }
                    var drag = function(evt){
                        if(Q.info.isMobile && (tool.isScreenResizing || evt.targetTouches.length != 1)) return;
                        evt = evt || window.event;
                        var posX = Q.info.isMobile ? evt.changedTouches[0].clientX : evt.clientX,
                            posY = Q.info.isMobile ? evt.changedTouches[0].clientY : evt.clientY,
                            aX = posX - diffX,
                            aY = posY - diffY;
                        if (aX < 0) aX = 0;
                        if (aY < 0) aY = 0;
                        if (aX + eWi > cWi) aX = cWi - eWi;
                        if (aY + eHe > cHe) aY = cHe -eHe;
                        move(aX,aY);
                    }
                    var initMoving = function(divid,container,evt){
                        if(Q.info.isMobile && (tool.isScreenResizing || evt.targetTouches.length != 1)) return;
                        elementToMove = divid;
                        var elRect = elementToMove.getBoundingClientRect();
                        console.log('elementToMove.offsetTop',elementToMove.offsetTop)
                        elementToMove.style.width = elRect.width + 'px';
                        elementToMove.style.height = elRect.height + 'px';
                        elementToMove.style.top = elRect.top + 'px';
                        elementToMove.style.left = elRect.left + 'px';
                        elementToMove.style.transform = '';
                        elementToMove.style.position = 'fixed';
                        evt = evt || window.event;
                        posX = Q.info.isMobile ? evt.touches[0].clientX : evt.clientX,
                            posY = Q.info.isMobile ? evt.touches[0].clientY : evt.clientY,
                            divTop = elementToMove.style.top,
                            divLeft = elementToMove.style.left,
                            eWi = parseInt(elementToMove.offsetWidth),
                            eHe = parseInt(elementToMove.offsetHeight),
                            cWi = parseInt(container.offsetWidth),
                            cHe = parseInt(container.offsetHeight);
                        container.style.cursor='move';
                        divTop = divTop.replace('px','');
                        divLeft = divLeft.replace('px','');
                        diffX = posX - divLeft, diffY = posY - divTop;
                        if(Q.info.isMobile)
                            document.addEventListener('touchmove', drag);
                        else document.addEventListener('mousemove', drag);
                    }
                    var stopMoving = function(container){
                        if(Q.info.isMobile)
                            document.removeEventListener('touchmove', drag)
                        else document.removeEventListener('mousemove', drag)

                        container.style.cursor='';
                    }
                    return {
                        initMoving: initMoving,
                        stopMoving: stopMoving
                    }
                }();

                var resizeElement = function (e) {
                    var docRect = document.body.getBoundingClientRect();
                    var docStyles = window.getComputedStyle(document.body);
                    var areaPaddingRight = +(docStyles.paddingRight ? docStyles.paddingRight : '0').replace('px', '');
                    var areaPaddingLeft = +(docStyles.paddingLeft ? docStyles.paddingLeft : '0').replace('px', '');

                    var _elementToResize;
                    var _handler;
                    var _handlerPosition = 'right';
                    var _elLeftBorder;
                    var _elRightBorder;
                    var _elLeftMargin;
                    var _elRightMargin;
                    var _latestWidthValue;
                    var _latestHeightValue;
                    var _latestScaleValue;

                    var _oldx = 0;
                    var _oldy = 0;

                    function initialise(e) {
                        e.propertyIsEnumerable();
                        e.stopPropagation();
                        _elementToResize = e.target.parentNode;
                        var elementRect = _elementToResize.getBoundingClientRect();
                        _elLeftBorder = elementRect.left;
                        _elRightBorder = elementRect.right;
                        _elLeftMargin = +(_elementToResize.style.margin || _elementToResize.style.marginLeft).replace('px', '');
                        _elRightMargin = +(_elementToResize.style.margin || _elementToResize.style.marginRight).replace('px', '');
                        _handler = e.target;
                        window.addEventListener('mousemove', _startResizing, true);
                        window.addEventListener('mouseup', _stopResizing, true);
                    }

                    function _startResizing(e) {
                        console.log('resizing : resizing')

                        if(e.pageX >= docRect.right-(docStyles.paddingRight ? docStyles.paddingRight : '0').replace('px', '')) return;

                        if(_latestWidthValue == null) _latestWidthValue = _elementToResize.offsetWidth;
                        if(_latestHeightValue == null) _latestHeightValue = _elementToResize.offsetHeight;
                        if(_oldx == null) _oldx = e.pageX;
                        if(_oldy == null) _oldy = e.pageY;

                        var elementRect = _elementToResize.getBoundingClientRect().height;


                        var elementWidth, elementHeight;

                        if(_handlerPosition == 'right') {
                            console.log('right resize')
                            if (e.pageX < _oldx) {
                                elementWidth = _latestWidthValue - (_oldx - e.pageX);
                            } else if (e.pageX > _oldx) {
                                elementWidth = _latestWidthValue + (e.pageX - _oldx);
                            }
                            if (e.pageY < _oldy) {
                                elementHeight = _latestHeightValue - (_oldy - e.pageY);
                            } else if (e.pageY > _oldy) {
                                elementHeight = _latestHeightValue + (e.pageY - _oldy);
                            }
                        } else {
                            console.log('left resize')

                            if (e.pageX < _oldx) {
                                elementWidth = _latestWidthValue + (_oldx - e.pageX);
                            } else if (e.pageX > _oldx) {
                                elementWidth = _latestWidthValue - (e.pageX - _oldx);
                            }

                            if (e.pageY < _oldy) {
                                elementHeight = _latestHeightValue + (_oldy - e.pageY);
                            } else if (e.pageY > _oldy) {
                                elementHeight = _latestHeightValue - (e.pageY - _oldy);
                            }

                        }


                        if(elementWidth >= 20 && _oldx != 0) {
                            console.log('right resize', elementWidth, elementHeight)

                            _elementToResize.style.width = elementWidth + 'px';
                            _elementToResize.style.height = elementHeight + 'px';

                            _latestWidthValue = elementWidth;
                            _latestHeightValue = elementHeight;
                        }


                        _oldx = e.pageX;
                        _oldy = e.pageY;
                    }

                    function _stopResizing(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.removeEventListener('mousemove', _startResizing, true);
                        window.removeEventListener('mouseup', _stopResizing, true);
                        _latestWidthValue = null;
                        _oldx = null;
                    }

                    function setHandler(element) {
                        if(Q.info.isMobile) {
                            resizeByPinchGesture(element);
                            return;
                        }
                        var resizeHandler = document.createElement('DIV');
                        resizeHandler.classList.add('webrtc_tool_resize-handler');
                        if(_handlerPosition == 'right') {
                            resizeHandler.style.right = '0';
                            resizeHandler.style.cursor = 'nw-resize';
                        } else resizeHandler.style.left = '0';
                        element.appendChild(resizeHandler);

                        bindMouseWheelEvent(element);
                        resizeHandler.addEventListener('mousedown', initialise)

                    }

                    function resizeByPinchGesture(element) {
                        _elementToResize = element;
                        element.addEventListener('touchstart', _startResizingByPinch);
                    }

                    function _startResizingByPinch(e) {
                        console.log('_startResizingByPinch')
                        _elementToResize = e.target.closest('.webrtc_tool_chat-participant');
                        ratio = _elementToResize.offsetWidth / _elementToResize.offsetHeight;
                        window.addEventListener('touchend', _stopResizingByPinch);
                        window.addEventListener('touchmove', resizeByPinch);
                    }

                    function _stopResizingByPinch() {
                        console.log('stopResizing')

                        tool.isScreenResizing = false;
                        touch1 = touch2 = prevPosOfTouch1 = prevPosOfTouch2 = _latestHeightValue = _latestWidthValue = ratio = _elementToResize = null;
                        window.removeEventListener('touchend', _stopResizingByPinch);
                        window.removeEventListener('touchmove', resizeByPinch);
                    }

                    var touch1, touch2, prevPosOfTouch1, prevPosOfTouch2, ratio;
                    function resizeByPinch(e) {
                        if(e.targetTouches.length != 2 || e.changedTouches.length != 2) return;
                        tool.isScreenResizing = true;
                        console.log('_elementToResize', _elementToResize)
                        console.log('resizeByPinch', e.changedTouches.length, e.targetTouches.length)

                        console.log('e.changedTouches', e.targetTouches)

                        var touches = Array.prototype.slice.call(e.changedTouches);
                        for(var i in touches) {
                            var touch = touches[i];
                            console.log('FOR touch', touch.clientX)

                            if (touch1 != null && touch.identifier == touch1.identifier || (touch1 == null && (touch2 == null || touch.identifier != touch2.identifier))) {
                                console.log('FOR touch 1', touch.clientX)

                                touch1 = {identifier: touch.identifier, clientX: touch.clientX, clientY: touch.clientY};
                            }
                            if (touch2 != null && touch.identifier == touch2.identifier || (touch2 == null && (touch1 == null || touch.identifier != touch1.identifier))) {
                                console.log('FOR touch 2', touch.clientX)

                                touch2 = {identifier: touch.identifier, clientX: touch.clientX, clientY: touch.clientY};
                            }
                        }

                        console.log('2changedTouches.x, changedTouches.x', touch1.clientX)
                        console.log('2changedTouches.x1, changedTouches.x1', touch2.clientX)
                        if(prevPosOfTouch1 == null) prevPosOfTouch1 = {x:touch1.clientX, y:touch1.clientY}
                        if(prevPosOfTouch2 == null) prevPosOfTouch2 = {x:touch2.clientX, y:touch2.clientY}

                        console.log('prevPosOfTouch', prevPosOfTouch1, prevPosOfTouch2)
                        console.log('touch1, touch2', touch1, touch2)

                        //if(touch1.clientX >= docRect.right-(docStyles.paddingRight ? docStyles.paddingRight : '0').replace('px', '')) return;
                        var elRect = _elementToResize.getBoundingClientRect();
                        if(_latestWidthValue == null) _latestWidthValue = elRect.width;
                        if(_latestHeightValue == null) _latestHeightValue = elRect.height;
                        //ratio = _latestWidthValue  / _latestHeightValue;

                        console.log('elementHeight, elementWidth', _latestHeightValue, _latestWidthValue)
                        console.log('prevPosOfTouch1.x, prevPosOfTouch1.x', prevPosOfTouch1.x, prevPosOfTouch1.x)
                        console.log('prevPosOfTouch2.x, prevPosOfTouch2.x', prevPosOfTouch2.x, prevPosOfTouch2.x)

                        console.log('touch1.clientX', touch1.clientX, touch1.clientY)
                        console.log('touch2.clientX', touch2.clientX, touch2.clientY)

                        var elementRect = _elementToResize.getBoundingClientRect().height;


                        var elementWidth, elementHeight;
                        var touch1diff, touch2diff;

                        touch1diff = Math.abs(prevPosOfTouch1.x - touch1.clientX);
                        touch2diff = Math.abs(prevPosOfTouch2.x - touch2.clientX);
                        console.log('touch1diff touch2diff', touch1diff,touch2diff)
                        console.log('touch1.clientX - touch2.clientX', touch1.clientX, touch2.clientX, '---', prevPosOfTouch1.x, prevPosOfTouch2.x)
                        console.log('touch1.clientX - touch2.clientX', touch1.clientX - touch2.clientX, prevPosOfTouch1.x - prevPosOfTouch2.x)
                        console.log('touch1.clientX - touch2.clientX', Math.abs(touch1.clientX - touch2.clientX), Math.abs(prevPosOfTouch1.x - prevPosOfTouch2.x))

                        if(Math.abs(touch1.clientX - touch2.clientX) > Math.abs(prevPosOfTouch1.x - prevPosOfTouch2.x)) {
                            console.log('ZOOM ++++')

                            elementHeight = _latestHeightValue + Math.abs(touch1.clientX - prevPosOfTouch1.x) + Math.abs(touch2.clientX - prevPosOfTouch2.x);
                            elementWidth = _latestWidthValue + Math.abs(touch1.clientX - prevPosOfTouch1.x) + Math.abs(touch2.clientX - prevPosOfTouch2.x);
                        } else {
                            console.log('ZOOM ----')

                            elementHeight = _latestHeightValue - Math.abs(touch1.clientX - prevPosOfTouch1.x + touch2.clientX - prevPosOfTouch2.x);
                            elementWidth = _latestWidthValue - Math.abs(touch1.clientX - prevPosOfTouch1.x + touch2.clientX - prevPosOfTouch2.x);
                        }

                        console.log('elementHeight, elementWidth', elementHeight, elementWidth)
                        if(ratio < 1) {
                            elementWidth = parseInt(elementHeight * ratio);

                        }
                        else {
                            elementHeight = parseInt(elementWidth / ratio);
                        }

                        console.log('elementHeight, elementWidth', elementHeight, elementWidth)



                            _elementToResize.style.width = elementWidth + 'px';
                            _elementToResize.style.height = elementHeight + 'px';

                            _latestWidthValue = elementWidth;
                            _latestHeightValue = elementHeight;



                        prevPosOfTouch1.x = touch1.clientX;
                        prevPosOfTouch1.y = touch1.clientY;
                        prevPosOfTouch2.x = touch2.clientX;
                        prevPosOfTouch2.y = touch2.clientY;
                    }

                    function onWheel(e) {
                        //e = e || window.event;
                        //var currentTarget = document.elementFromPoint(e.clientX, e.clientY);
                        if(_elementToResize == null) _elementToResize = e.target.closest('.webrtc_tool_chat-participant');
                        var elRect = _elementToResize.getBoundingClientRect();
                        //if(elRect.height >= window.innerHeight || elRect.width >= window.innerWidth) return;
                        console.log('_elementToResize', _elementToResize)
                        var delta = e.deltaY || e.detail || e.wheelDelta;
                        if(_latestScaleValue == null) _latestScaleValue = 1;
                        var scale = (delta > 0) ? _latestScaleValue + 0.1 : _latestScaleValue - 0.1
                        _elementToResize.style.transform = 'scale(' + scale + ')';
                       // _latestScaleValue = scale;
                        setTimeout(function () {
                            var elRect = _elementToResize.getBoundingClientRect();
                            if(elRect.height >= window.innerHeight || elRect.width >= window.innerWidth) {
                                _elementToResize.style.transform = 'scale(' + scale-0.1 + ')';
                            }
                            var elRect = _elementToResize.getBoundingClientRect();
                            _elementToResize.style.width = elRect.width + 'px';
                            _elementToResize.style.height = elRect.height + 'px';
                            _elementToResize.style.top = elRect.top + 'px';
                            _elementToResize.style.left = elRect.left + 'px';
                            _elementToResize.style.transform = '';
                        }, 100);
                        e.preventDefault ? e.preventDefault() : (e.returnValue = false);
                    }

                    function bindMouseWheelEvent(elem) {
                        if (elem.addEventListener) {
                            if ('onwheel' in document) {
                                // IE9+, FF17+, Ch31+
                                elem.addEventListener("wheel", onWheel);
                            } else if ('onmousewheel' in document) {
                                elem.addEventListener("mousewheel", onWheel);
                            } else {
                                elem.addEventListener("MozMousePixelScroll", onWheel);
                            }
                        } else { // IE8-
                            elem.attachEvent("onmousewheel", onWheel);
                        }
                    }

                    (function(e){
                        e.closest = e.closest || function(css){
                            var node = this;

                            while (node) {
                                if (node.matches(css)) return node;
                                else node = node.parentElement;
                            }
                            return null;
                        }
                    })(Element.prototype);

                    return {
                        init:initialise,
                        setHandler:setHandler,
                    }
                }();

                return control;

            },
            makeId: function () {
                var text = "";
                var possible = "0123456789";

                for (var i = 0; i < 11; i++)
                    text += possible.charAt(Math.floor(Math.random() * possible.length));

                return text.replace(/(.{3})/g,"$1-");
            },
            streamsAdapter: function () {
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
            }
        }

    );


})(window.jQuery, window);