"use strict";


var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
var RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;


if(typeof DOMRect == 'undefined') {
    window.DOMRect = function(x, y, width, height){
        this.x = x;
        this.y = y;
        this.top = y;
        this.left = x;
        this.height = height;
        this.width = width;
    }
}

var promisifiedOldGUM = function(constraints, successCallback, errorCallback) {

    var getUserMedia = (navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia);

    //if(Q.info.isCordova && Q.info.platform === 'ios') getUserMedia = cordova.plugins.iosrtc.getUserMedia;

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
    var _debug = null;
    var _debugTimer = {};

    Streams.WebRTC = function Streams_WebRTC(options) {
        if(!new.target) {
            return new Streams_WebRTC(options);
        }

        var module = {};

        /**
         * WebRTC options that also can be set it local/app.json
         * @param {Object} [_options] config options
         * @param {Object} [_options.startWith] Start conference with requesting camera and/or mic permissions. This option also is used as accessory variable.
         * @param {Boolean} [_options.startWith.audio] Start conference with requesting the permission to use microphone.
         * @param {Boolean} [_options.startWith.video] Start conference with requesting the permission to use camera.
         * @param {Boolean} [_options.showPreparingDialog] Show preparing dialog before user joins the conference. User can turn camera/mic/screensharing on/off in this dialog. If false, dialog will not be shown
         * @param {Boolean} [_options.useCordovaPlugins] Use iosrtc plugin's API to get permissions to camera/mic. Option is used for iOS < v.14
         * @param {Boolean} [_options.showScreenSharingInSeparateScreen] Show screen sharing video in separate screen. If false, screensharing video will be shown instead of camera.
         * @param {Boolean} [_options.minimizeOnPageSwitching] Switch layout to "minimized" when page was switched
         * @param {Boolean} [_options.leaveOtherActiveRooms] Leave active WebRTC rooms when connecting to current one
         * @param {Boolean} [_options.onlyOneScreenSharingAllowed] Allow only one screensharing within room
         * @param {Boolean} [_options.disconnectBtnInParticipants] Show "hang up" button in "participants popup"
         * @param {String} [_options.controlsPosition] Show controls on top|right|bottom|left. If not set, controls will be on bottom by default.
         * @param {Object} [_options.sounds] Play sounds when participant connects/disconnects or switches room
         * @param {String} [_options.sounds.participantConnected]
         * @param {String} [_options.sounds.participantDisconnected]
         * @param {String} [_options.sounds.roomSwitch]
         * @param {Object} [_options.liveStreaming] Live streaming settings
         * @param {Boolean} [_options.liveStreaming.startFbLiveViaGoLiveDialog] Start live streaming using facebook sdk
         * @param {Boolean} [_options.liveStreaming.sounds] Include _options.sounds into live stream.
         * @param {String} [_options.liveStreaming.audioLayoutBgColor] Background color of audio layout's participant screens
         * @param {Number} [_options.liveStreaming.tiledLayoutMargins] Margins between tiles (user's screens) in tiled layout
         * @param {Boolean} [_options.liveStreaming.loopAudio] Loop imported audio file
         * @param {Boolean} [_options.liveStreaming.loopVideo] Loop imported video file
         * @param {Boolean} [_options.liveStreaming.localOutput] Output sound of imported video/audio locally
         * @param {Object} [_options.webcastSettings]
         * @param {Boolean} [_options.webcastSettings.disconnectOnRoomSwitch] Disconnect users from root witch leaved/switched current room
         * @param {Q.Event} [_options.onWebRTCRoomCreated] Event that is fired when room is created
         * @param {Q.Event} [_options.onWebRTCRoomEnded] Event that is fired when room is ended
         * @param {Q.Event} [_options.onWebrtcControlsCreated] Event that is fired when room controls are creted
         * @param {Array} [_options.hosts] List of ids of room's hosts
         * @param {String} [_options.defaultDesktopViewMode] Default view mode (layout) for rendering participants' screens on desktop (regular | audio | maximized | minimized | tiled | manual | fullScreen | screenSharing)
         * @param {String} [_options.defaultMobileViewMode] Default view mode (layout) for rendering participants' screens on mobile (tiledMobile | sideBySideMobile | maximizedMobile | minimizedMobile | audio | squaresGrid)
         * @param {Object} [_options.relate] Relate roomStream to another stream when roomStream is created. Use already related (to already existing stream) stream as main roomStream
         * @param {String} [_options.relate.publisherId] publisherId of a stream to which roomStream will be related.
         * @param {String} [_options.relate.streamName] streamName of a stream to which roomStream will be related.
         * @param {Boolean} [_options.useRelatedTo] if true, instead of create new stream use last related webrtc stream (_options.relate should be filled)
         */
        var _options = {
            startWith: {
                audio: true,
                video: false
            },
            limits: {},
            streams: [],
            audioOnlyMode: false,
            showPreparingDialog: false,
            useCordovaPlugins: false,
            showScreenSharingInSeparateScreen: true,
            minimizeOnPageSwitching: true,
            leaveOtherActiveRooms: true,
            onlyOneScreenSharingAllowed: true,
            disconnectBtnInParticipants: false,
            controlsPosition: 'auto',
            margins:null,
            sounds: {
                participantConnected:Q.url('{{Streams}}/audio/user_disconnected.mp3'),
                participantDisconnected:Q.url('{{Streams}}/audio/user_connected.mp3'),
                roomSwitch:Q.url('{{Streams}}/audio/switch_room.mp3')
            },
            liveStreaming: {
                startFbLiveViaGoLiveDialog: false,
                /*timeSlice: 6000,*/
                sounds:true,
                audioLayoutBgColor: '#000',
                tiledLayoutMargins: 20,
                loopAudio: true,
                loopVideo: true,
                localOutput: true
                /*chunkSize: 10000*/
            },
            webcastSettings: {
                disconnectOnRoomSwitch: false
            },
            onWebRTCRoomCreated: new Q.Event(),
            onWebRTCRoomEnded: new Q.Event(),
            onWebrtcControlsCreated: new Q.Event(),
            beforeSwitch: null,
            hosts:[],
            defaultDesktopViewMode:null,
            defaultMobileViewMode:null,
            writeLevel:23,
            relate: {},
            useRelatedTo: false
        };

        overrideDefaultOptions(options);

        var webrtcSignalingLib;
        var _waitingRoomStream;

        var _roomStartTime = null;
        var _controls = null;
        var _controlsTool = null;
        var _roomsMedia = null;
        var _layoutTool = null;
        var _roomStream = null;
        var _renderedScreens = [];
        var _resizeObserver = null;
        var _isMobile = null;
        var _isAndroid = null;
        var _isiOS = null;
        var _isiOSWebView = null;
        var _events = new EventSystem();
        var text = Q.text.Streams;

        var ua = navigator.userAgent;

        if(ua.indexOf('Android')!=-1||ua.indexOf('Windows Phone')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPad')!=-1||ua.indexOf('iPod')!=-1) {
            _isMobile = true;
            if(ua.indexOf('iPad')!=-1||ua.indexOf('iPhone')!=-1||ua.indexOf('iPod')!=-1) {
                _isiOS = true;
            } else if (/android/i.test(ua)) {
                _isAndroid = true;
            }
        }

        var isSafari = /safari/.test( ua.toLowerCase());
        if( _isiOS ) {
            if ( isSafari ) {
                //browser
            } else if ( !isSafari && !Q.info.isCordova ) {
                _isiOSWebView = true;
            };
        } else {
            //not iOS
        };

        var browser = determineBrowser(navigator.userAgent)
        var _localInfo = {
            isMobile: _isMobile,
            platform: _isiOS ? 'ios' : (_isAndroid ? 'android' : null),
            isCordova: typeof cordova != 'undefined',
            isiOSWebView: _isiOSWebView,
            ua: navigator.userAgent,
            browserName: browser[0],
            browserVersion: browser[1]
        }

        if(_isiOS && _localInfo.browserName == 'Safari' && _localInfo.browserVersion < 14.4){
            _options.useCordovaPlugins = true;
            if(!navigator) navigator = {};
        }

        var appDebug = (function () {
            var _infoLog = [];

            console.log('_localInfo',_localInfo)

            _infoLog.push({type: 'info', log:_localInfo});

            var stderror = console.error.bind(console);

            console.error = function (txt) {

                try {
                    try {
                        var err = (new Error);
                    } catch (e) {

                    }

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
                    var ua = navigator.userAgent;
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

                    stderror.apply(console, arguments);
                    logError(errorMessage);

                } catch (e) {
                    stderror.apply(e.name + ' ' + e.message);
                    logError(e.name + ' ' + e.message);
                }
            }

            window.onerror = function(msg, url, line, col, error) {
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

                logError(errMessage);
            }

            var url = new URL(location.href);
            var debug = url.searchParams.get("debug");

            var debugWidget = (function () {
                var _debugWidget;
                var _debugSideBar;
                var _debugOutput;
                var _debugWidgetLouncher;

                function createDebugOutput() {
                    _debugWidget = document.createElement('DIV');
                    _debugWidget.className = 'Streams_webrtc_debug_container';
                    _debugSideBar = document.createElement('DIV');
                    _debugSideBar.className = 'Streams_webrtc_debug_sidebar';
                    _debugOutput = document.createElement('DIV');
                    _debugOutput.className = 'Streams_webrtc_debug_output';
                    var closeDebugWidget= document.createElement('DIV');
                    closeDebugWidget.className = 'Streams_webrtc_debug_close';
                    closeDebugWidget.addEventListener('click', closeDebug)
                    _debugWidget.appendChild(_debugSideBar);
                    _debugWidget.appendChild(_debugOutput);
                    _debugWidget.appendChild(closeDebugWidget);
                    document.body.appendChild(_debugWidget);

                    _debugWidgetLouncher = document.createElement('DIV');
                    _debugWidgetLouncher.className = "Streams_webrtc_debug_louncher active";
                    _debugWidgetLouncher.innerHTML = "Open Debugger";
                    _debugWidgetLouncher.addEventListener('click', openDebugWidget)
                    document.body.appendChild(_debugWidgetLouncher);
                }

                function closeDebug() {
                    if( _debugWidget.classList.contains('active')) _debugWidget.classList.remove('active');
                    if( !_debugWidgetLouncher.classList.contains('active')) _debugWidgetLouncher.classList.add('active');
                }

                function openDebugWidget() {
                    if(!_debugWidget.classList.contains('active')) _debugWidget.classList.add('active');
                    if(_debugWidgetLouncher.classList.contains('active')) _debugWidgetLouncher.classList.remove('active');
                    updateRoomsList();
                }

                function updateRoomsList() {
                    loadRoomsList(function (roomList) {
                        _debugSideBar.innerHTML = '';
                        var roomListEl = document.createElement('UL');
                        roomListEl.className = 'Streams_webrtc_debug_room_list';
                        var i, room;
                        for(i = 0; room = roomList[i]; i++) {
                            var roomItem = document.createElement('LI');
                            roomItem.innerHTML = room.roomName + ', ' + room.date;
                            roomItem.dataset.startTimeDate = room.startTimeDate;
                            roomItem.dataset.roomName = room.roomName;
                            roomItem.addEventListener('click', updateParticipantsList)
                            if(room.startTimeTs == _roomStream.getAttribute('startTime') && room.roomName == _options.roomId) {
                                roomItem.classList.add('Streams_webrtc_debug_active_room');
                            }
                            roomListEl.appendChild(roomItem);
                        }
                        _debugSideBar.appendChild(roomListEl);
                    });
                }

                function timestampToDate(unix_timestamp) {
// Create a new JavaScript Date object based on the timestamp
// multiplied by 1000 so that the argument is in milliseconds, not seconds.
                    var date = new Date(unix_timestamp * 1000);
// Hours part from the timestamp
                    var hours = date.getHours();
// Minutes part from the timestamp
                    var minutes = "0" + date.getMinutes();
// Seconds part from the timestamp
                    var seconds = "0" + date.getSeconds();

// Will display time in 10:30:23 format
                    var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

                    return formattedTime;
                }

                function updateParticipantsList(e) {
                    var roomItem = e.target;
                    var roomName = roomItem.dataset.roomName;
                    var startTimeDate = roomItem.dataset.startTimeDate;
                    var existingList = roomItem.querySelector('UL')
                    var participantsListEl = existingList != null ? existingList : document.createElement('UL');
                    var localParticipant = webrtcSignalingLib.localParticipant();

                    participantsListEl.className = 'Streams_webrtc_debug_participant_list';
                    loadParticipantList(roomName, startTimeDate, function (participantsList) {
                        participantsListEl.innerHTML = '';

                        var i, participant;
                        for(i = 0; participant = participantsList[i]; i++) {
                            var participantItem = document.createElement('LI');
                            participantItem.innerHTML = participant.username + ' (' + participant.connectedDateTime + ')';
                            if(participant.userId + '\t' + participant.connectedTime == localParticipant.identity) {
                                participantItem.innerHTML += ' (me)';
                            }
                            participantItem.dataset.roomName = roomName;
                            participantItem.dataset.callStartedDate = startTimeDate;
                            participantItem.dataset.userId = participant.userId;
                            participantItem.dataset.connectedTime = participant.connectedTime;
                            participantItem.addEventListener('click', updateOutputLog)
                            if(checkIfUserOnline(participant.userId, participant.connectedTime)){
                                participantItem.classList.add('Streams_webrtc_debug_active_participant');
                            }

                            participantsListEl.appendChild(participantItem);
                        }
                        if(!roomItem.contains(participantsListEl)) roomItem.appendChild(participantsListEl);
                    });
                }

                function checkIfUserOnline(userId, connectionTime) {
                    var participants = webrtcSignalingLib.roomParticipants();
                    for (var i in participants) {
                        if(participants[i].identity == userId + '\t' + connectionTime) return true;
                    }
                    return false;
                }

                function updateOutputLog(e) {
                    e.stopPropagation();
                    var participantItem = e.target;
                    var roomName = participantItem.dataset.roomName;
                    var callStartedDate = participantItem.dataset.callStartedDate;
                    var userId = participantItem.dataset.userId;
                    var connectedTime = participantItem.dataset.connectedTime;

                    getLogByUser(roomName, callStartedDate, userId, connectedTime, function (logs) {
                        printLog(logs);
                    });
                }

                function printLog(logs) {
                    function flattenObject(source, depth) {
                        if(depth == null) depth = 0;
                        var target = {};
                        var keys = Object.keys(source);
                        if(keys.length == 0) {
                            keys = [];
                            for(var p in source) {
                                keys.push(p);
                                if(p == 10) break;
                            }
                        }
                        keys.forEach(k => {
                            if (source[k] !== null && (typeof source[k] === 'object' || typeof source[k] === 'function' || Array.isArray(source[k]))) {
                                let constName = source[k].constructor.name;
                                if(constName == 'HTMLDivElement') {
                                    target[k] = source[k].outerHTML;
                                } else if(constName == 'Text') {
                                    target[k] = source[k].innerText;
                                } else if(constName == 'DOMRect') {
                                    target[k] = flattenObject(source[k]);
                                } else {
                                    target[k] = (depth <= 2) ? flattenObject(source[k], depth + 1) : source[k].constructor.name;
                                }
                            } else {
                                target[k] = source[k];
                            }

                        });
                        return target;
                    }

                    _debugOutput.innerHTML = '';
                    var i, log;
                    for(i = 0; log = logs[i]; i++) {
                        var logItem = document.createElement('DIV');
                        logItem.className = 'Streams_webrtc_debug_log_item';
                        if(log.type == 'error') {
                            logItem.classList.add('Streams_webrtc_debug_log_error');
                        }
                        var logItemType = document.createElement('DIV');
                        logItemType.className = 'Streams_webrtc_debug_log_type';
                        logItemType.innerHTML = log.type;
                        var logContent = document.createElement('DIV');
                        logContent.className = 'Streams_webrtc_debug_log_contet';

                        if(log.log.constructor === Array) {
                            var logResultArr = [];
                            let logArray = log.log;
                            for (var k in logArray) {
                                if (logArray[k] !== null && (typeof logArray[k] === 'object' || typeof logArray[k] === 'function' || Array.isArray(logArray[k]))) {
                                    logResultArr.push(JSON.stringify(logArray[k]));
                                } else {
                                    logResultArr.push(logArray[k]);
                                }
                            }

                            logContent.innerText = logResultArr.join(', ');
                        } else {
                            logContent.innerHTML = JSON.stringify(log.log);

                        }

                        logItem.appendChild(logItemType);
                        logItem.appendChild(logContent);
                        _debugOutput.appendChild(logItem);
                    }

                }

                function loadRoomsList(callback) {
                    Q.req("Streams/webrtc", ["logRoomList"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);

                        if (msg) {
                            return Q.alert(msg);
                        }

                        callback(response.slots.logRoomList);
                    }, {
                        method: 'get',
                        fields: {}
                    });
                }

                function loadParticipantList(roomId, startTimeDate, callback) {
                    Q.req("Streams/webrtc", ["logParticipantList"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);

                        if (msg) {
                            return Q.alert(msg);
                        }

                        callback(response.slots.logParticipantList);
                    }, {
                        method: 'get',
                        fields: {
                            roomId: roomId,
                            startTimeDate: startTimeDate
                        }
                    });
                }

                function getLogByUser(roomId, callStartedDate, userId, startTime, callback) {
                    var userIdAndStartTime;
                    if(typeof userId == 'undefined' && typeof startTime == 'undefined') {
                        userIdAndStartTime = Q.Users.loggedInUser.id + '\t' + _roomStartTime;
                    } else {
                        userIdAndStartTime = userId + '\t' + startTime;
                    }

                    if(typeof roomId == 'undefined') {
                        roomId = _options.roomId;
                    }

                    if(_options.roomId == null && _options.roomPublisherId == null && _options.relate && _options.relate.publisherId == null && _options.relate.streamName == null) return;
                    Q.req("Streams/webrtc", ["log"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);

                        if (msg) {
                            return Q.alert(msg);
                        }

                        callback(JSON.parse(response.slots.log));
                    }, {
                        method: 'get',
                        fields: {
                            roomId: roomId,
                            publisherId: _options.roomPublisherId,
                            startTime: callStartedDate,
                            participant: userIdAndStartTime
                        }
                    });
                }

                return {
                    createDebugOutput:createDebugOutput,
                    openDebugWidget:openDebugWidget,
                    loadParticipantList:loadParticipantList
                }
            }())

            if(debug) {
                debugWidget.createDebugOutput();
            }

            function flattenArray(mArr) {
                return [].concat.apply([], mArr);
            }

            function flattenObject(source) {
                var target = {};
                var keys = Object.keys(source);
                if(keys.length == 0) {
                    keys = [];
                    for(var p in source) {
                        keys.push(p);
                        if(p == 10) break;
                    }
                }
                keys.forEach(k => {
                    if (source[k] !== null && (typeof source[k] === 'object' || typeof source[k] === 'function' || Array.isArray(source[k]))) {
                        let constName = source[k].constructor.name;
                        if(constName == 'HTMLDivElement') {
                            target[k] = 'HTMLDivElement';
                        } else if(constName == 'Text') {
                            target[k] = source[k].innerText;
                        } else if(constName == 'DOMRect') {
                            target[k] = flattenObject(source[k]);
                        } else {
                            target[k] = source[k].constructor.name;
                        }
                    } else {
                        target[k] = source[k];
                    }

                });
                return target;
            }


            function logInfo(args, fileName) {
                try {
                    var i, argument;
                    var consoleArr = [];

                    for (i = 0; argument = args[i]; i++){

                        if (typeof argument == 'string') {
                            consoleArr.push(argument);
                        } else if (typeof argument == 'object') {
                            consoleArr.push( flattenObject(argument));
                        } else if (typeof argument == 'array') {
                            consoleArr.push(flattenArray(argument));
                        } else {
                            consoleArr.push(argument);
                        }
                    }

                    var logObj = {
                        'type': fileName,
                        'log':consoleArr
                    };
                    _infoLog.push(logObj);

                } catch (e) {
                    var logObj = {
                        'type': fileName,
                        'log':args
                    };
                    _infoLog.push(logObj);
                }
            }

            function logError(errMessage) {
                var logObj = {
                    'type': "error",
                    'log':errMessage
                };
                _infoLog.push(logObj);
            }

            function getInfoLog() {
                return _infoLog;
            }

            function sendReportToServer() {
                if(_infoLog.length == 0 || _options.roomId == null || _options.roomPublisherId == null || !Q.Users.loggedInUser) return;
                Q.req("Streams/webrtc", ["updateLog"], function (err, response) {
                    var msg = Q.firstErrorMessage(err, response && response.errors);

                    if (msg) {
                        return Q.alert(msg);
                    }

                }, {
                    method: 'put',
                    fields: {
                        log: JSON.stringify(_infoLog.splice(0, _infoLog.length)),
                        roomId: _options.roomId,
                        publisherId: _options.roomPublisherId,
                        participant: Q.Users.loggedInUser.id + '\t' + _roomStartTime
                    }
                });
            }

            function createLogMethod(fileName) {
                return function () {
                    if(_debug === false) return;
                    var args = arguments
                    setTimeout(function () {
                        args = Array.prototype.slice.call(args);
                        var params = [];
            
                        if (window.performance) {
                            var now = (window.performance.now() / 1000).toFixed(3);
                            params.push(now + ": " + fileName + ': ' + args.splice(0, 1));
                            params = params.concat(args);
                            console.log.apply(console, params);
                        } else {
                            params = params.concat(args);
                            console.log.apply(console, params);
                        }
                        logInfo(params, fileName);
                    }, 0);
                }
            }

            return {
                logInfo: logInfo,
                logError: logError,
                getInfoLog: getInfoLog,
                sendReportToServer: sendReportToServer,
                createLogMethod: createLogMethod,
                debugWidget: function() {return debugWidget;},
                isiOSwebView: function() {return _isiOSWebView;}
            }
        }());

        Q.Streams.WebRTCdebugger = appDebug;

        log = appDebug.createLogMethod('WebRTC.js')

        /**
         * Show snipped with particular message
         * @method notice
         * @param {String} [message] Notice to show
         */
        var notice = (function() {

            var _notices = [];

            var Notice = function () {
                this.element = null;
                this.dissappearingTimer = null;
                this.top = null;
                this.update = function (message) {
                    this.element.innerHTML = message;
                    if(this.dissappearingTimer == null) return;

                    clearTimeout(this.dissappearingTimer);
                    this.dissappearingTimer = setTimeout(function() {
                        this.remove();
                    }.bind(this), 4000);
                };
                this.remove = function () {
                    log('notice: remove ', this.element.offsetTop)

                    this.element.classList.remove('shown');
                    setTimeout(function () {
                        if(this.element.parentNode != null) this.element.parentNode.removeChild(this.element);
                        for(let n in _notices) {
                            if(this == _notices[n]){
                                _notices.splice(n, 1);
                                break;
                            }
                        }
                        updateNoticesPostion();
                    }.bind(this), 200);
                };
            }

            function getMostBottomNotice() {
                var maxTop;
                var existingNotes = document.querySelectorAll('.notice-container.shown');
                if(existingNotes.length != 0) {
                    existingNotes = Array.prototype.slice.call(existingNotes);

                    maxTop = Math.max.apply(Math, existingNotes.map(function(o) {
                        return o.offsetTop + o.offsetHeight;
                    }));
                }

                return maxTop;
            }

            function updateNoticesPostion() {
                var existingNotes = document.querySelectorAll('.notice-container.shown');
                existingNotes = Array.prototype.slice.call(existingNotes);
                for(let n in _notices.slice().sort(function(a, b) {
                    return parseFloat(a.top) - parseFloat(b.top);
                })) {
                    log('updateNoticesPostion')

                    if(n == 0) {
                        log('updateNoticesPostion 1', _notices[n].offsetTop)
                        _notices[n].element.style.top = '';
                        _notices[n].top = 20;
                        log('updateNoticesPostion 1.1', _notices[n].offsetTop)

                    } else {
                        log('updateNoticesPostion 2', _notices[n].element.style.top)
                        if(_notices[n - 1] != null && _notices[n - 1].top != null) {
                            let top = (_notices[n - 1].top + _notices[n - 1].element.offsetHeight + 20);
                            _notices[n].element.style.top = top + 'px';
                            _notices[n].top = top;
                        }
                        log('updateNoticesPostion 2.1', _notices[n].element.style.top)

                    }
                }

            }

            function show(message, newEl, withoutTimer, position) {
                var noticeDiv;
                /*if(newEl == null) {
					noticeDiv = document.querySelector('.notice-container-default');
					noticeDiv.innerHTML = message;
					var maxTop = getMostBottomNotice();
					if(maxTop != null) {
						noticeDiv.style.top = (maxTop + 20) + 'px';
					} else {
						noticeDiv.style.top = '';
					}
					noticeDiv.classList.add('shown');
					setTimeout(function () {
						noticeDiv.classList.remove('shown');
					}, 4000);
				} else {*/
                var maxTop = getMostBottomNotice();
                noticeDiv = document.createElement('DIV');
                noticeDiv.innerHTML = message;
                if(maxTop != null) noticeDiv.style.top = (maxTop + 20) + 'px';
                noticeDiv.classList.add('shown', 'notice-container');
                if(position != null) {
                    if(position == 'left') noticeDiv.classList.add('Streams_webrtc_notice_position_left');
                    if(position == 'right') noticeDiv.classList.add('Streams_webrtc_notice_position_right');
                } else {
                    noticeDiv.classList.add('Streams_webrtc_notice_position_right');
                }

                var newNotice = new Notice();
                if(withoutTimer == null) {

                    var dissappearingTimer = setTimeout(function () {
                        newNotice.remove();
                    }, 4000);

                    newNotice.dissappearingTimer = dissappearingTimer;
                }

                newNotice.element = noticeDiv;

                _notices.push(newNotice);
                document.body.appendChild(noticeDiv);
                return newNotice;
                //}
            }

            var noticeContainer = document.createElement('div');
            noticeContainer.className = 'notice-container notice-container-default';
            document.body.appendChild(noticeContainer);

            return {
                show:show,
            }
        }());

        /**
         * Render screens of all participants in the room
         * @method screensRendering
         */
        var screensRendering = (function () {
            var activeScreen;
            var activeScreenRect;
            var activeScreensType;
            var viewMode;
            var prevViewMode;
            var loudestMode;
            var loudestModeInterval;
            var roomScreens = [];
            var layoutEvents = new EventSystem();

            layoutEvents.on('layoutRendered', function (e) {

                if(e.viewMode == 'audio') {
                    /*.mediaManager.audioVisualization.buildCommonVisualization({
                        name: 'common',
                        type: 'bars',
                        element: _roomsMedia
                    });*/

                    if(_controlsTool) _controlsTool.updateViewModeBtns();
                    lockScreenResizingAndDragging();
                } else if(e.viewMode == 'minimized') {
                    updateScreensButtons();
                    resetAudioVisualization();
                    disableLoudesScreenMode();
                    if(_controlsTool != null) {
                        _controlsTool.updateViewModeBtns();
                    }
                    unlockScreenResizingAndDragging();
                    webrtcSignalingLib.mediaManager.audioVisualization.removeCommonVisualization();
                } else if(e.viewMode == 'screenSharing' || e.viewMode == 'fullScreen') {
                    if(_controlsTool) _controlsTool.updateViewModeBtns();
                    updateScreensButtons()
                    resetAudioVisualization();
                    lockScreenResizingAndDragging();
                    webrtcSignalingLib.mediaManager.audioVisualization.removeCommonVisualization();
                } else if(e.viewMode == 'squaresGrid') {
                    if(_controlsTool) _controlsTool.updateViewModeBtns();
                    updateScreensButtons()
                    resetAudioVisualization();
                    lockScreenResizingAndDragging();
                    webrtcSignalingLib.mediaManager.audioVisualization.removeCommonVisualization();
                } else {
                    if(_controlsTool) _controlsTool.updateViewModeBtns();
                    updateScreensButtons();
                    resetAudioVisualization();
                    unlockScreenResizingAndDragging();
                    webrtcSignalingLib.mediaManager.audioVisualization.removeCommonVisualization();
                }
            })

            var Screen = function () {
                this.sid = null;
                this.participant = null;
                this.screenEl = null;
                this.videoCon = null;
                this.nameEl = null;
                this.videoScreen = {
                    screenEl: null,
                    nameEl: null,
                    videoCon: null
                };
                this.audioScreen = {
                    screenEl: null,
                    nameEl: null,
                    avatarCon: null,
                    avatarImgCon: null
                };
                this.tracks = [];
                this.streams = [];
                this.isMain = null;
                this.isLocal = null;
                this.isActive = false;
                this.screensharing = null;
                this.activeScreenType = null;
                this.videoTracks = function () {
                    return this.tracks.filter(function (trackObj) {
                        return trackObj.kind == 'video';
                    });
                }
                this.hasLiveTracks = function (kind, shouldBeUnmuted, shouldBeEnabled) {
                    var shouldBeLive = true; 
                    var hasLiveTracks = false;
                    for(let t in this.tracks) {
                        let track = this.tracks[t];
                        if(kind && kind != this.tracks[t].kind) continue;
                        let live = shouldBeLive ? track.mediaStreamTrack.readyState != 'ended' : true;
                        let streamIsActive = track.stream ? track.stream.active == true : false;
                        let unmuted = shouldBeUnmuted ? track.mediaStreamTrack.muted == false : true;
                        let enabled = shouldBeEnabled ? track.mediaStreamTrack.enabled == true : true;
                        if(live && streamIsActive/* && unmuted && enabled*/) {
                            hasLiveTracks = true;
                            break;
                        }
                    }

                    return hasLiveTracks;
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
                this.switchToAudioScreen = function () {
                    log('switchToAudioScreen : switchToAudioScreen0', this.activeScreenType)
                    if(this.activeScreenType == 'audio') return;
                    log('switchToAudioScreen : switchToAudioScreen1', this.activeScreenType)


                    this.show();
                    this.activeScreenType = 'audio';
                    this.removeAudioVisualization('video');
                    //this.showAudioVisualization('audio');
                    //this.screenEl.innerHTML = '';
                    if(this.videoScreen.screenEl && this.videoScreen.screenEl.parentNode != null) {
                        this.videoScreen.screenEl.parentNode.removeChild(this.videoScreen.screenEl);
                    }
                    log('switchToAudioScreen : hasLiveTracks',  this.hasLiveTracks('video'));

                    this.fillAudioScreenWithAvatarOrVideo();
                    this.screenEl.appendChild(this.audioScreen.screenEl);
                };
                this.switchToVideoScreen = function () {
                    if(this.activeScreenType == 'video') return;
                    this.activeScreenType = 'video';
                    var videoTracks =  this.tracks.filter(function(t){
                        return t.kind == 'video' && t.mediaStreamTrack.enabled == true && t.mediaStreamTrack.readyState == 'live' ? true : false
                    })
                    log('switchToVideoScreen : videoTracks', videoTracks)
                    /*if(videoTracks.length == 0) {
                        this.hide();
                    } else {*/
                        for(let t in videoTracks) {
                            videoTracks[t].play();
                        }
                    //}
                    this.removeAudioVisualization('audio');
                    //this.showAudioVisualization('video');

                    //this.screenEl.innerHTML = '';
                    if(this.audioScreen.screenEl && this.audioScreen.screenEl.parentNode != null) {
                        this.audioScreen.screenEl.parentNode.removeChild(this.audioScreen.screenEl);
                    }

                    if(this.videoTrackEl) this.videoScreen.videoCon.appendChild(this.videoTrackEl);

                    this.fillVideoScreenWithAvatarOrVideo();
                    this.screenEl.appendChild(this.videoScreen.screenEl);
                };
                this.fillAudioScreenWithAvatarOrVideo = function () {
                    if(this.videoTrackEl && this.hasLiveTracks('video', true)) {
                        this.audioScreen.avatarImgCon.innerHTML = '';
                        this.audioScreen.avatarImgCon.appendChild(this.videoTrackEl);
                    } else if (this.audioScreen.avatarImg != null){
                        this.audioScreen.avatarImgCon.innerHTML = '';
                        this.audioScreen.avatarImgCon.appendChild(this.audioScreen.avatarImg);
                    }
                }
                this.fillVideoScreenWithAvatarOrVideo = function () {
                    log('fillVideoScreenWithAvatarOrVideo');
                    if(this.videoTrackEl && this.hasLiveTracks('video', true)) {
                        log('fillVideoScreenWithAvatarOrVideo if1');

                        this.videoScreen.videoCon.innerHTML = '';
                        this.videoScreen.videoCon.appendChild(this.videoTrackEl);
                    } else if (this.audioScreen.avatarImg != null){
                        log('fillVideoScreenWithAvatarOrVideo if2');
                        this.videoScreen.videoCon.innerHTML = '';
                        let avatarContainer = document.createElement('DIV');
                        avatarContainer.className = 'Streams_webrtc_chat-participant-inavatar';
                        let dummy = document.createElement('DIV');
                        dummy.className = 'Streams_webrtc_chat-participant-avatar-dummy';
                        //avatarContainer.appendChild(dummy);
                        avatarContainer.appendChild(this.audioScreen.avatarImg);
                        this.videoScreen.videoCon.appendChild(avatarContainer);
                    }
                }
                this.remove = function() {
                    let screen = this;
                    if(this.participant) {
                        for(let s in this.participant.screens) {
                            if(screen == this.participant.screens[s]){
                                this.participant.screens.splice(s, 1);
                                break;
                            }
                        }
                    }
                    this.hide();
                }
                this.hide = function() {
                    log('screen.hide');
                    let screen = this;
                    if(screen.videoIsChanging) {
                        return;
                    }
                    if(screen.screenEl != null && screen.screenEl.parentElement != null) {
                        log('screen.hide removeChild', screen.screenEl);

                        screen.screenEl.parentElement.removeChild(screen.screenEl);
                    }

                    for(let m in roomScreens) {
                        if(screen == roomScreens[m]){
                            screen.isActive = false;
                            roomScreens.splice(m, 1);
                            break;
                        }
                    }

                    if(screen.activeScreenType == 'video') {
                        let appendedToNextScreen = false;
                        if (screen.activeScreenType == 'video' && screen.videoScreen.soundEl != null && screen.participant.soundMeter.visualizations['participantScreen'] != null
                            && screen.participant.soundMeter.visualizations['participantScreenVideo'].element == screen.videoScreen.soundEl) {
                            log('screen.hide move sound', screen.participant.screens.length);

                            for (let s in screen.participant.screens) {
                                let scr = screen.participant.screens[s];
                                log('screen.hide move sound change');
                                if (scr == screen || !scr.isActive) continue;
                                log('screen.hide move sound change 2');
                                screen.participant.soundMeter.visualizations['participantScreen'].element = scr.videoScreen.soundEl
                                scr.videoScreen.soundEl.appendChild(screen.participant.soundMeter.visualizations['participantScreen'].svg);
                                appendedToNextScreen = true;
                                break;
                            }
                        }
                        if (!appendedToNextScreen) {
                            this.removeAudioVisualization('video');
                        }
                    } else {
                        this.removeAudioVisualization('audio');
                    }
                };
                this.show = function() {
                    let screen = this;
                    log('screen.show: screen before check', screen);

                    var presentInScreensList = false;
                    for(let m in roomScreens) {
                        log('screen.show: screen check', m, screen == roomScreens[m]);
                        log('screen.show: screen check 2', roomScreens[m]);

                        if(screen == roomScreens[m]){
                            log('screen.show: screen exists in roomScreens');

                            presentInScreensList = true;
                            break;
                        }
                    }
                    screen.isActive = true;

                    if(!presentInScreensList) roomScreens.push(screen);
                    log('screen.show: after ', roomScreens.length);

                    webrtcSignalingLib.event.dispatch('screenShown', screen);

                    if(screen.activeScreenType == 'video') {
                        //this.showAudioVisualization('video');
                    } else {
                        //this.showAudioVisualization('audio');
                    }

                }
                this.showAudioVisualization = function () {
                    var screen = this;
                    if(screen.activeScreenType == 'audio') {
                        if(screen.audioScreen.avatarCon != null && screen.participant.soundMeter.visualizations['participantScreenAudio'] == null) {

                            webrtcSignalingLib.mediaManager.audioVisualization.build({
                                name: 'participantScreenAudio',
                                type: 'circles',
                                participant: screen.participant,
                                element: screen.audioScreen.avatarCon
                            });
                        }
                    } else if (screen.activeScreenType == 'video') {
                        if(screen.videoScreen.soundEl != null && screen.participant.soundMeter.visualizations['participantScreenVideo'] == null) {
                            webrtcSignalingLib.mediaManager.audioVisualization.build({
                                name: 'participantScreenVideo',
                                participant: screen.participant,
                                element: screen.videoScreen.soundEl
                            });
                        }
                    }
                };
                this.removeAudioVisualization = function () {
                    var screen = this;

                    if(screen.activeScreenType == 'audio' && screen.participant.soundMeter.visualizations['participantScreenAudio'] != null) {
                        screen.participant.soundMeter.visualizations['participantScreenAudio'].remove();
                    } else if (screen.activeScreenType == 'video' && screen.participant.soundMeter.visualizations['participantScreenVideo'] != null) {
                        screen.participant.soundMeter.visualizations['participantScreenVideo'].remove();
                    }
                };

            };

            if(Q.info.isMobile){
                if(_options.audioOnlyMode) {
                    viewMode = prevViewMode = 'audio';
                } else {
                    viewMode = prevViewMode = _options.defaultMobileViewMode || 'maximizedMobile';
                }
            } else {
                if(_options.audioOnlyMode) {
                    viewMode = prevViewMode = 'audio';
                } else {
                    viewMode = prevViewMode = _options.defaultDesktopViewMode || 'regular';
                }
            }
            if(_options.minimizeOnPageSwitching) {
                Q.Page.onActivate('').set(function(){
                    if(viewMode == 'minimized' || viewMode == 'minimizedMobile') return;
                    if(Q.info.isMobile){
                        renderMinimizedScreensGridMobile();
                    } else renderMinimizedScreensGrid();
                }, 'Streams.WebRTC');
            }

            function setViewMode(mode) {
                viewMode = mode;
                updateLayout();
            }

            /**
             * Updates current layout; usually is called by handlers binded on events triggered by WebRTC lib (app.js)
             * @method updateLayout
             */
            function updateLayout() {
                if(webrtcSignalingLib == null) return;
                log('updateLayout, current mode is ', viewMode);

                log('updateLayout, roomScreens', roomScreens.length);

                var roomParticipants = webrtcSignalingLib.roomParticipants();
                var i, participantScreen;
                for(i = 0; participantScreen = roomScreens[i]; i++) {
                    if(participantScreen.isLocal) updateLocalScreenClasses(participantScreen);

                }

                function doPlayTracks() {
                    var i, screen;
                    for (i = 0; screen = roomScreens[i]; i++) {
                        if(screen.videoTrack && screen.isActive) {
                            screen.videoTrack.play();
                        }
                    }
                }

                if(Q.info.isMobile){
                    if(viewMode == 'tiledMobile'){
                        renderTiledScreenGridMobile();
                    } else if(viewMode == 'sideBySideMobile'){
                        if(roomScreens.length != 2) {
                            renderTiledScreenGridMobile();
                        } else {
                            renderSideBySideGridMobile();
                        }
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
                    } else if(viewMode == 'minimizedMobile') {
                        renderMinimizedScreensGridMobile();
                    } else if(viewMode == 'audio') {
                        renderAudioScreensGrid();
                    } else if(viewMode == 'squaresGrid') {
                        renderSquaresGridMobile();
                    }

                    doPlayTracks();
                } else {
                    //renderMinimizedScreensGrid()
                    if(viewMode == null || viewMode == 'regular'){
                        renderDesktopScreensGrid();
                    } else if(viewMode == 'audio'){
                        renderAudioScreensGrid();
                    } else if(viewMode == 'maximized'){
                        renderMaximizedScreensGrid();
                    } else if(viewMode == 'minimized'){
                        renderMinimizedScreensGrid();
                    } else if(viewMode == 'tiled'){
                        renderTiledScreenGridDesktop();
                    } else if(viewMode == 'manual'){
                        renderManualScreensGrid();
                    } else if(viewMode == 'fullScreen' || viewMode == 'screenSharing'){
                        renderFullScreenLayout();
                    }
                    /*if(activeScreen && activeScreen.isLocal && roomParticipants.length == 1) {
						renderMinimizedScreensGrid();
						viewMode == 'maximized';
					}*/

                    doPlayTracks();

                }

                bindScreensEvents();
            }

            /**
             * Returns active (maximized) screen
             * @returns {Object}
             */
            function getActiveSreen() {
                return activeScreen;
            }

            /**
             * Returns active screens view mode
             * @returns {String}
             */
            function getActiveViewMode() {
                return viewMode;
            }

            /**
             * Create participant's screen element that contains participant's video and is rendered one the page
             * @method createRoomScreen
             * @param {Object} [screen] screen object generated by webrtcSignalingLib (WebRTC library)
             * @return {HTMLElement}
             */
            function createRoomScreen(participant) {
                log('createRoomScreen', participant, participant.isLocal);
                try {
                    var err = (new Error);
                    log(err.stack);
                } catch (e) {

                }
                //check whether it was room switching
                /*if(participant.isLocal) {
                    for(let s in roomScreens) {
                        log('onParticipantConnected for', participant.isLocal, roomScreens[s].participant.sid == participant.sid)

                        if(roomScreens[s].participant.isLocal && roomScreens[s].participant.sid != participant.sid) {
                            log('onParticipantConnected for break', roomScreens[s].participant.sid, participant.sid)

                            roomScreens[s].participant = participant;
                            return;
                        }
                    }
                }*/
                var screen = new Screen();
                screen.sid = participant.sid;
                screen.participant = participant;
                screen.isLocal = participant.isLocal;
                participant.screens.push(screen);

                var chatParticipantEl = screen.screenEl = document.createElement('DIV');
                chatParticipantEl.className = 'Streams_webrtc_chat-participant';
                chatParticipantEl.dataset.participantName = screen.sid;
                if(screen.screensharing) chatParticipantEl.classList.add('Streams_webrtc_chat-active-screen-sharing');

                var videoScreen = createVideoScreen(screen);
                var audioScreen = createAudioScreen(screen);

                /*if(viewMode != 'audio') {
                    screen.switchToVideoScreen();
                } else {
                    screen.switchToAudioScreen();
                }*/
                //chatParticipantEl.appendChild(videoScreen.videoCon);
                //chatParticipantEl.appendChild(audioScreen.nameEl);
                //chatParticipantEl.appendChild(audioScreen.avatarCon);


                if(Q.info.isTouchscreen) {
                    chatParticipantEl.addEventListener('touchstart', moveScreenFront);
                } else chatParticipantEl.addEventListener('mousedown', moveScreenFront);

                if(Q.info.isTouchscreen) {
                    chatParticipantEl.addEventListener('touchend', function (e) {
                        var resizeTool = Q.Tool.from(chatParticipantEl, "Q/resize");
                        if(resizeTool.isScreenResizing) return;
                        toggleViewModeByScreenClick(e);
                    }, false);
                } else chatParticipantEl.addEventListener('click', toggleViewModeByScreenClick);


                if(screen.isLocal) updateLocalScreenClasses(screen);

                _renderedScreens.push(chatParticipantEl);
                return screen;
            }

            /**
             * Create participant's screen element that contains participant's video and is rendered one the page
             * @method createRoomScreen
             * @param {Object} [screen] screen object generated by webrtcSignalingLib (WebRTC library)
             * @return {HTMLElement}
             */
            function createVideoScreen(screen) {
                log('createVideoScreen', screen);

                var videoScreenEl = screen.videoScreen.screenEl = document.createElement('DIV');
                videoScreenEl.className = 'Streams_webrtc_chat-participant-video-screen';
                videoScreenEl.dataset.participantName = screen.sid;
                if(screen.screensharing) videoScreenEl.classList.add('Streams_webrtc_chat-active-screen-sharing');
                var chatParticipantVideoCon = screen.videoScreen.videoCon = document.createElement('DIV');
                chatParticipantVideoCon.className = 'Streams_webrtc_chat-participant-video';
                var chatParticipantName = screen.videoScreen.nameEl = document.createElement('DIV');
                chatParticipantName.className = 'Streams_webrtc_chat-participant-name';
                var participantVoice = screen.videoScreen.soundEl = document.createElement('DIV');
                participantVoice.className = "Streams_webrtc_participant-voice";
                var participantNameTextCon = screen.videoScreen.nameTextEl = document.createElement("DIV");
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

                const ro = new ResizeObserver(entries => {
                    for(let entry of entries){
                        const width = entry.contentRect.width;
                        const height = entry.contentRect.height;

                        if(width/height < 1) {
                            if(entry.target.classList.contains('Streams_webrtc_chat-video-horizontal')) entry.target.classList.remove('Streams_webrtc_chat-video-horizontal')
                            if(!entry.target.classList.contains('Streams_webrtc_chat-video-vertical')) entry.target.classList.add('Streams_webrtc_chat-video-vertical')
                        } else {
                            if(entry.target.classList.contains('Streams_webrtc_chat-video-vertical')) entry.target.classList.remove('Streams_webrtc_chat-video-vertical')
                            if(!entry.target.classList.contains('Streams_webrtc_chat-video-horizontal')) entry.target.classList.add('Streams_webrtc_chat-video-horizontal')
                        }
                    }
                })

                ro.observe(screen.videoScreen.videoCon)

                if(screen.participant.soundMeter.visualizations['participantScreenVideo'] == null) {
                    webrtcSignalingLib.mediaManager.audioVisualization.build({
                        name: 'participantScreenVideo',
                        participant: screen.participant,
                        element: participantVoice
                    });
                }

                participantNameTextCon.appendChild(participantNameText);
                chatParticipantName.appendChild(participantNameTextCon);
                chatParticipantName.appendChild(participantVoice);
                videoScreenEl.appendChild(chatParticipantName);

                var screensBtns= document.createElement("DIV");
                screensBtns.className = "Streams_webrtc_participant-screen-btns";
                var fullScreenBtn = document.createElement("BUTTON");
                fullScreenBtn.className = 'Streams_webrtc_fullscreen-btn'
                var maximizeBtn = document.createElement("BUTTON");
                maximizeBtn.className = 'Streams_webrtc_maximize-btn'
                maximizeBtn.innerHTML = '<img src="' + Q.url('{{Q}}/img/grow.png') + '">';
                var minimizeBtn = document.createElement("BUTTON");
                minimizeBtn.className = 'Streams_webrtc_minimize-btn';
                minimizeBtn.style.display = 'none';
                minimizeBtn.innerHTML = '<img src="' + Q.url('{{Q}}/img/shrink.png') + '">';
                if(screen.screensharing) screensBtns.appendChild(fullScreenBtn)
                screensBtns.appendChild(maximizeBtn)
                screensBtns.appendChild(minimizeBtn)
                chatParticipantName.appendChild(screensBtns);

                if(screen.screensharing) {
                    fullScreenBtn.addEventListener('click', function (e) {
                        renderFullScreenLayout(screen, 300);
                        e.preventDefault();
                        e.stopPropagation();
                    });
                }

                maximizeBtn.addEventListener('click', function (e) {
                    renderMaximizedScreensGrid(screen);
                    e.preventDefault();
                    e.stopPropagation();
                });

                minimizeBtn.addEventListener('click', function (e) {
                    renderMinimizedScreensGrid();
                    e.preventDefault();
                    e.stopPropagation();
                });

                videoScreenEl.appendChild(chatParticipantVideoCon);

                chatParticipantVideoCon.addEventListener('click', function (e) {
                    e.preventDefault();
                });

                return screen.videoScreen;
            }

            /**
             * Create participant's screen element that contains participant's video and is rendered one the page
             * @method createRoomScreen
             * @param {Object} [screen] screen object generated by webrtcSignalingLib (WebRTC library)
             * @return {HTMLElement}
             */
            function createAudioScreen(screen) {
                log('createAudioScreen', screen);
                var audioScreenEl = screen.audioScreen.screenEl = document.createElement('DIV');
                audioScreenEl.className = 'Streams_webrtc_chat-participant-audio-screen';
                audioScreenEl.dataset.participantName = screen.sid;
                if(screen.screensharing) audioScreenEl.classList.add('Streams_webrtc_chat-active-screen-sharing');
                var chatParticipantAvatarCon = screen.audioScreen.avatarCon = document.createElement('DIV');
                chatParticipantAvatarCon.className = 'Streams_webrtc_chat-participant-avatar-con';
                var dummyElForEqualGeught = document.createElement('DIV');
                dummyElForEqualGeught.className = 'Streams_webrtc_chat-participant-avatar-dummy';
                var chatParticipantAvatarInner = screen.audioScreen.avatarImgCon = document.createElement('DIV');
                chatParticipantAvatarInner.className = 'Streams_webrtc_chat-participant-avatar';
                var chatParticipantName = screen.audioScreen.nameEl = document.createElement('DIV');
                chatParticipantName.className = 'Streams_webrtc_chat-participant-name';
                var participantNameTextCon = document.createElement("DIV");
                participantNameTextCon.className = "Streams_webrtc_participant-name-text";
                var participantNameText = document.createElement("DIV");
                var userId = screen.participant.identity != null ? screen.participant.identity.split('\t')[0] : Q.Users.loggedInUser.id;

                if(screen.participant.soundMeter.visualizations['participantScreenAudio'] == null) {
                    webrtcSignalingLib.mediaManager.audioVisualization.build({
                        name: 'participantScreenAudio',
                        participant: screen.participant,
                        type: 'circles',
                        element: screen.audioScreen.avatarCon
                    });
                }

                var userId = screen.participant.identity != null ? screen.participant.identity.split('\t')[0] : null;
                Q.Streams.Avatar.get(userId, function (err, avatar) {
                    if (!avatar) {
                        return;
                    }
                    log('createAudioScreen: setAvatar', screen);

                    participantNameText.innerHTML = avatar.firstName;
                    var src = Q.url(avatar.iconUrl(400));
                    if(src != null) {
                        var avatarImg = new Image();
                        avatarImg.src = src;
                        avatarImg.setAttribute('draggable', false);

                        chatParticipantAvatarInner.appendChild(avatarImg);
                        screen.audioScreen.avatarImg = avatarImg;

                        if(screen.activeScreenType == 'audio') {
                            screen.fillAudioScreenWithAvatarOrVideo();
                        } else {
                            screen.fillVideoScreenWithAvatarOrVideo();
                        }
                    }
                });

                /*Q.activate(
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


                    }
                );*/


                /*if(screen.participant.soundMeter.visualizations['participantScreen'] == null) {
                    webrtcSignalingLib.mediaManager.audioVisualization.build({
                        name: 'participantScreen',
                        participant: screen.participant,
                        element: participantVoice
                    });
                }*/

                participantNameTextCon.appendChild(participantNameText);
                chatParticipantName.appendChild(participantNameTextCon);
                chatParticipantAvatarCon.appendChild(dummyElForEqualGeught);
                chatParticipantAvatarCon.appendChild(chatParticipantAvatarInner);
                audioScreenEl.appendChild(chatParticipantAvatarCon);
                audioScreenEl.appendChild(chatParticipantName);

                chatParticipantAvatarCon.addEventListener('click', function (e) {
                    e.preventDefault();
                });

                layoutEvents.dispatch('audioScreenCreated', {audioScreen:screen.audioScreen, participant:screen.participant});

                return screen.audioScreen;
            }


            /**
             * Appends HTML media element of the track to existing screen
             * @method newTrackAdded
             * @param {Object} [track] new track
             * @return {HTMLElement}
             */
            function newTrackAdded(track, participant) {
                log('newTrackAdded', participant.screens.length, participant.isLocal);
                if(participant.screens.length >= 1) log('newTrackAdded', participant.screens[0].tracks.length);
                var trackParentScreen;
                if(track.kind == 'video') {
                    if(track.parentScreen != null) {
                        trackParentScreen = track.parentScreen;
                    }  else if(participant.screens.length == 1 && participant.screens[0].tracks.length == 0){
                        log('newTrackAdded if2');

                        trackParentScreen = participant.screens[0];
                    } else {
                        log('newTrackAdded else');
                        trackParentScreen = createRoomScreen(participant);
                    }

                    trackParentScreen.videoTrack = track;
                    trackParentScreen.videoTrackEl = track.trackEl;
                    trackParentScreen.videoScreen.videoCon.appendChild(track.trackEl);

                    if(trackParentScreen.activeScreenType == 'audio') {
                        trackParentScreen.fillAudioScreenWithAvatarOrVideo();
                    } else {
                        trackParentScreen.fillVideoScreenWithAvatarOrVideo();
                    }
                }


            }


            function onParticipantConnected(participant) {
                log('onParticipantConnected', participant,participant.isLocal)

                if(participant.screens.length == 0) {
                    var newScreen = createRoomScreen(participant);
                    if(!(_options.limits && (_options.limits.audio || _options.limits.video))) {
                        addScreenToCommonList(newScreen);
                    }
                }
            }

            function onParticipantDisconnected(participant) {
                screensRendering.removeScreensByParticipant(participant);
                //addScreenToCommonList(newScreen);
            }

            function videoTrackIsAdding(track, participant) {
                if(track.parentScreen != null) return;

                var screenToAttach;
                if(track.kind == 'video' && track.screensharing) {
                    log('videoTrackIsAdding: screensharing', participant.screens);

                    if(!participant.isLocal) {
                        screenToAttach = participant.screens.filter(function (scrn) {
                            return scrn.screensharing == true && !scrn.hasLiveTracks('video');
                        })[0];

                        //if remote user connects to room after screensharingStarting event (and skips this event, which prepares screen for screensharing)
                        if(!screenToAttach) {
                            screenToAttach = participant.screens.filter(function (scrn) {
                                return !scrn.hasLiveTracks('video');
                            })[0];
                        }
                    } else {
                        screenToAttach = participant.screens.filter(function (scrn) {
                            return !scrn.hasLiveTracks('video');
                        })[0];
                    }

                    if(!screenToAttach) {
                        screenToAttach = createRoomScreen(participant);
                    }
                    track.parentScreen = screenToAttach;
                    screenToAttach.videoTrack = track;
                    screenToAttach.videoTrackEl = track.trackEl;
                } else if(track.kind == 'video') {
                    log('videoTrackIsAdding: regular video', participant.isLocal);

                    for(var s in participant.screens) {
                        log('videoTrackIsAdding for', participant.screens[s].hasLiveTracks('video'))
                        if(!participant.screens[s].screensharing && !participant.screens[s].hasLiveTracks('video')) {
                            screenToAttach = participant.screens[s];
                            break;
                        }
                    }
                    log('videoTrackIsAdding: screenToAttach', screenToAttach);


                    if(!screenToAttach) {
                        screenToAttach = createRoomScreen(participant);
                    }

                    track.parentScreen = screenToAttach;
                    if(screenToAttach.videoTrackEl != null) {
                        if(screenToAttach.videoTrackEl.parentNode) screenToAttach.videoTrackEl.parentNode.removeChild(screenToAttach.videoTrackEl)
                    }
                    screenToAttach.videoTrack = track;
                    screenToAttach.videoTrackEl = track.trackEl;

                }

                if(screenToAttach != null) screenToAttach.screensharing = track.screensharing == true ? true : false;

                track.participant = participant;

                if(screenToAttach != null) screenToAttach.tracks.push(track);

                showLoader('videoTrackIsBeingAdded', {screen: screenToAttach, participant: participant});
            }

            /**
             * Make screens resizible and movable
             * @method bindScreensEvents
             */
            function bindScreensEvents() {

                var i, participantScreen;
                for(i = 0; participantScreen = roomScreens[i]; i++) {

                    var resizeTool = Q.Tool.from(participantScreen.screenEl, "Q/resize");
                    if(resizeTool == null) {
                        Q.activate(
                            Q.Tool.setUpElement(
                                participantScreen.screenEl, // or pass an existing element
                                "Q/resize",
                                {
                                    movable: true,
                                    active: true,
                                    showShadow: false,
                                    moveWithinArea: 'window',
                                    keepRatioBasedOnElement: participantScreen.videoTrackEl != null ? participantScreen.videoTrackEl : null ,
                                    onMoved: function () {
                                        if(!Q.info.isMobile) screensRendering.renderManualScreensGrid();
                                    },
                                    onResized: function () {
                                        if(!Q.info.isMobile) screensRendering.renderManualScreensGrid();
                                    }
                                }
                            ),
                            {}
                        );
                    }

                }
            }

            /**
             * Returns new size with keeping ratio (helper function for rendering layouts)
             * @method getElementSizeKeepingRatio
             * @param {Objet} [initSize] Initial size
             * @param {Integer} [initSize.width] Initial width
             * @param {Integer} [initSize.height] Initial height
             * @param {Object} [baseSize] Size to which initial size should be changed with keeping ratio.
             * @param {Integer} [baseSize.width] Max width
             * @param {Integer} [baseSize.height] Max height
             * @return {Object}
             */
            function getElementSizeKeepingRatio(initSize, baseSize) {
                var ratio = Math.min(baseSize.width / initSize.width, baseSize.height / initSize.height);

                return { width: Math.floor(initSize.width*ratio), height: Math.floor(initSize.height*ratio)};
            }

            /**
             * Updates layout and screen element class when video's loadedmetadata event is triggered
             * @method getElementSizeKeepingRatio
             * @param {HTMLElement} [videoEl] HTML video element
             * @param {Object} [screen] Parent screen of video element
             * @param {Boolean} [reset] Whether to reset current screen's size in case if it was resized manually.
             */
            function fitScreenToVideo(videoEl, screen) {
                log('fitScreenToVideo');
                if(videoEl.videoHeight != null && videoEl.videoWidth != null && videoEl.videoHeight != 0 && videoEl.videoWidth != 0 && videoEl.parentNode != null) {

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
                    //resizeTool.state.keepRatioBasedOnElement = videoEl;
                }
            }

            /**
             * Flip local video from front camera / remove flipping of screensharing video
             * @method updateLocalScreenClasses
             * @param {Object} [screen] Local screen to update.
             */
            function updateLocalScreenClasses(screen) {
                if(screen.screensharing == true) {
                    screen.screenEl.classList.add('Streams_webrtc_chat-active-screen-sharing');
                    screen.screenEl.classList.add('Streams_webrtc_chat-local-screen-sharing');
                    screen.videoScreen.videoCon.classList.remove('Streams_webrtc_chat-flipped-video');
                }

                var frontCameraDevice = webrtcSignalingLib.localMediaControls.frontCameraDevice();
                var currentCameraDevice = webrtcSignalingLib.localMediaControls.currentCameraDevice();
                if(!screen.screensharing && (Q.info.isMobile && ((screen.videoTrack && screen.videoTrack.frontCamera) || currentCameraDevice == frontCameraDevice)) || (!Q.info.isMobile && !screen.screensharing)) {
                    if(screen.videoScreen.videoCon != null) {
                        screen.videoScreen.videoCon.classList.add('Streams_webrtc_chat-flipped-video');
                    }
                    screen.screenEl.classList.remove('Streams_webrtc_chat-active-screen-sharing');
                } else if(screen.videoScreen.videoCon) {
                    screen.videoScreen.videoCon.classList.remove('Streams_webrtc_chat-flipped-video');
                }
            }

            function lockScreenResizingAndDragging() {
                log('lockScreenResizingAndDragging');
                for(var s in roomScreens) {
                    var resizeTool = Q.Tool.from(roomScreens[s].screenEl, "Q/resize");
                    if(resizeTool) resizeTool.state.active = false;
                }
            }

            function unlockScreenResizingAndDragging() {
                log('unlockScreenResizingAndDragging');
                for(var s in roomScreens) {
                    var resizeTool = Q.Tool.from(roomScreens[s].screenEl, "Q/resize");
                    if(resizeTool) resizeTool.state.active = true;
                }
            }

            /**
             * Updates icons of Maximize/Minimize buttons (top right of participant's screen) when view mode is changed
             * @method updateScreensButtons
             */
            function updateScreensButtons() {

                if(viewMode == 'regular') {
                    var i, screen;
                    for (i = 0; screen = roomScreens[i]; i++) {
                        var maximizeBtn = screen.videoScreen.nameEl.querySelector('.Streams_webrtc_maximize-btn');
                        var minimizeBtn = screen.videoScreen.nameEl.querySelector('.Streams_webrtc_minimize-btn');
                        if(!Q.info.isMobile)  maximizeBtn.style.display = '';
                        minimizeBtn.style.display = 'none';
                    }

                } else if(viewMode == 'maximized' || viewMode == 'maximizedMobile') {
                    var i, screen;
                    for (i = 0; screen = roomScreens[i]; i++) {

                        var maximizeBtn = screen.videoScreen.nameEl.querySelector('.Streams_webrtc_maximize-btn');
                        var minimizeBtn = screen.videoScreen.nameEl.querySelector('.Streams_webrtc_minimize-btn');
                        if(screen == activeScreen) {
                            maximizeBtn.style.display = 'none';
                            minimizeBtn.style.display = '';
                        } else {
                            if(!Q.info.isMobile){
                                maximizeBtn.style.display = '';
                            } else {
                                maximizeBtn.style.display = 'none';

                            }
                            minimizeBtn.style.display = 'none';
                        }
                    }

                } else if(viewMode == 'minimized' || viewMode == 'tiled' || viewMode == 'minimizedMobile' || viewMode == 'squaresGrid') {
                    var i, screen;
                    for (i = 0; screen = roomScreens[i]; i++) {
                        var maximizeBtn = screen.videoScreen.nameEl.querySelector('.Streams_webrtc_maximize-btn');
                        var minimizeBtn = screen.videoScreen.nameEl.querySelector('.Streams_webrtc_minimize-btn');
                        maximizeBtn.style.display = 'none';
                        minimizeBtn.style.display = 'none';
                    }
                } else if(viewMode == 'screenSharing') {
                    var i, screen;
                    for (i = 0; screen = roomScreens[i]; i++) {
                        var maximizeBtn = screen.videoScreen.nameEl.querySelector('.Streams_webrtc_maximize-btn');
                        var minimizeBtn = screen.videoScreen.nameEl.querySelector('.Streams_webrtc_minimize-btn');
                        if(!Q.info.isMobile) maximizeBtn.style.display = 'none';
                        minimizeBtn.style.display = 'none';
                    }
                }

            }

            /**
             * Update width (number of bars) of audio visualization that is showing on participant's screen.
             * Usually method is triggered when view mode is switched and size of participant's screen changed.
             * @method resetAudioVisualization
             */
            function resetAudioVisualization() {
                var participants = webrtcSignalingLib.roomParticipants();
                for (var i in participants) {
                    if(participants[i].soundMeter.visualizations.participantScreenVideo != null) participants[i].soundMeter.visualizations.participantScreenVideo.reset();
                }
            }

            /**
             * Move screen front while dragging it.
             * @method moveScreenFront
             */
            function moveScreenFront(e) {
                if(e != null && viewMode == 'screenSharing') return;
                var screenEl = this;
                var currentHighestZIndex = Math.max.apply(Math, roomScreens.map(function(o) { return o.screenEl != null && o.screenEl.style.zIndex != '' ? o.screenEl.style.zIndex : 1000; }))
                screenEl.style.zIndex = currentHighestZIndex+1;

                if(Q.info.isCordova && Q.info.platform === 'ios' && _options.useCordovaPlugins) {
                    var video = screenEl.querySelector('video');

                    if(video != null) {
                        video.style.zIndex = currentHighestZIndex+1;
                    }
                }

            }

            /**
             * On mobile, moves maximized screen back when new minimized screen added and while animation.
             * @method moveScreenBack
             * @param {Object} [screenEl] HTML element of the screen.
             */
            function moveScreenBack(e) {
                var screenEl = this;
                var currentLowestZIndex = Math.min.apply(Math, roomScreens.map(function(o) {
                    return o.screenEl != null && o.screenEl.style.zIndex != '' ? o.screenEl.style.zIndex : 1000;
                }).filter(function (el) {return el != null;}))

                screenEl.style.zIndex = currentLowestZIndex-1;
            }

            /**
             * Shows loader on participant's screen when new video is being added or changed.
             * @method showLoader
             * @param {String} [loaderName] Name of loader that depends on what action happened (camera toggling etc).
             * @param {Object} [participant] Participant on whose screen loader should be displayed.
             */
            function showLoader(loaderName, usefulData) {
                log('showLoader', loaderName, usefulData)

                var participant = usefulData.participant;
                var screen;
                if(usefulData.screen != null) {
                    screen = usefulData.screen;
                } else {
                    screen = participant.screens.filter(function (scrn) {
                        return (scrn.screensharing == true && !scrn.hasLiveTracks('video'));
                    })[0];
                    log('showLoader screen 1', screen)

                    if(screen == null) {
                        screen = participant.screens.filter(function (scrn) {
                            return !scrn.screensharing;
                        })[0];
                    }
                }

                log('showLoader', screen,  participant.screens.length)
                if(screen == null) return;
                if(screen.screenEl == null) {
                    log('showLoader createRoomScreen')

                    screensRendering.createRoomScreen(screen);
                }


                if(loaderName == 'videoTrackIsBeingAdded' || loaderName == 'beforeCamerasToggle') {
                    if(screen != null) screen.videoIsChanging = true;
                    participant.videoIsChanging = true;
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
                } else if(loaderName == 'videoMuted') {
                    if(participant.isLocal) return;
                    var loaderCon = document.createElement('DIV');
                    loaderCon.className = 'connect-spinner-con';
                    var loader = document.createElement('DIV');
                    loader.className = 'connect-spinner spinner-bounce-middle';
                    loaderCon.appendChild(loader);
                    if(screen.videoScreen.videoCon != null) screen.videoScreen.videoCon.appendChild(loaderCon);
                } else if(loaderName == 'screensharingStarting') {
                    if(screen != null) screen.videoIsChanging = true;
                    participant.videoIsChanging = true;
                    var loader = screen.screenEl.querySelector('.spinner-load');
                    if(loader != null) return;
                    var loaderCon = document.createElement('DIV');
                    loaderCon.className = 'spinner-load';
                    var loaderIcon = document.createElement('DIV');
                    loaderIcon.className = 'Streams_webrtc_screen-sharing';
                    loaderIcon.innerHTML = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="130.35 175.058 235.692 150.425"    enable-background="new 130.35 175.058 235.692 150.425" xml:space="preserve">  <path shape-rendering="auto" image-rendering="auto" color-rendering="auto" fill="#FFFFFF" d="M153.86,175.058   c-6.743,0-12.271,5.542-12.271,12.285v110.45c0,6.743,5.528,12.271,12.271,12.271h188.672c6.742,0,12.271-5.527,12.271-12.271   V187.343c0-6.743-5.527-12.285-12.271-12.285L153.86,175.058L153.86,175.058z M153.86,182.085h188.672   c2.971,0,5.243,2.285,5.243,5.257v110.45c0,2.972-2.272,5.243-5.243,5.243H153.86c-2.971,0-5.243-2.271-5.243-5.243V187.343   C148.617,184.371,150.889,182.085,153.86,182.085L153.86,182.085z"/>  <path fill="#FFFFFF" d="M130.35,312.092c0,7.418,5.123,13.391,11.483,13.391H354.56c6.36,0,11.482-5.973,11.482-13.391H130.35z    M265.75,316.858h-35.101c-0.542,0-0.978-0.437-0.978-0.978s0.436-0.979,0.978-0.979h35.101c0.542,0,0.978,0.436,0.978,0.979   C266.728,316.422,266.292,316.858,265.75,316.858z"/>  <path fill="#FFFFFF" d="M193.391,291.705c-0.146,0-0.294-0.021-0.44-0.063c-0.729-0.214-1.198-0.92-1.113-1.675   c7.413-65.442,58.168-70.528,73.548-70.528c1.435,0,2.632,0.042,3.541,0.09v-20.55c0-0.63,0.379-1.199,0.961-1.442   c0.58-0.242,1.252-0.113,1.701,0.332l32.512,32.179c0.296,0.293,0.463,0.694,0.463,1.111s-0.167,0.817-0.465,1.111l-32.512,32.114   c-0.448,0.443-1.119,0.575-1.7,0.33c-0.581-0.242-0.96-0.812-0.96-1.441v-20.548c-1.78-0.149-3.449-0.185-4.634-0.185   c-13.734,0-48,4.706-69.501,48.296C194.523,291.378,193.973,291.705,193.391,291.705z"/>  </svg>';
                    loaderCon.appendChild(loaderIcon);
                    screen.screenEl.appendChild(loaderCon);
                    //screen.screensharing = true;

                    Q.Pointer.activateTouchlabels(document.body);

                    if(_controlsTool && _controlsTool.participantsListTool) _controlsTool.participantsListTool.showScreen(screen);

                    if(Q.info.isMobile){
                        renderMaximizedScreensGridMobile(screen);
                    } else {
                        log('showLoader', screen)

                        renderFullScreenLayout(screen);
                        //renderMaximizedScreensGrid(screen);
                    }
                    screensRendering.updateLayout();

                }
            }

            /**
             * Hide loader that has shown previously.
             * @method hideLoader
             * @param {String} [loaderName] Name of loader that depends on what action happened (camera toggling etc).
             * @param {Object} [participant] Participant on whose screen loader should be displayed.
             */
            function hideLoader(loaderName, usefulData) {
                log('hideLoader', loaderName, usefulData)

                var participant = usefulData.participant;
                var screens = [];
                if(usefulData.screen != null) {
                    screens.push(usefulData.screen);
                } else {
                    screens = participant.screens;
                }
                log('hideLoader screens', screens)

                if(screens.length == 0) return;

                var i, screen;
                for(i = 0; screen = screens[i]; i++) {
                    if(screen.screenEl == null) continue;
                    log('hideLoader for', screen)

                    screen.videoIsChanging = false;
                    participant.videoIsChanging = false;
                    if(loaderName == 'screensharingFailed' || loaderName == 'videoTrackLoaded' || loaderName == 'afterCamerasToggle') {
                        var loader = screen.screenEl.querySelector('.spinner-load');
                        if(loader != null && loader.parentNode != null) loader.parentNode.removeChild(loader);
                    } else if(loaderName == 'videoUnmuted') {
                        if(participant.isLocal) return;
                        var loader = screen.screenEl.querySelector('.connect-spinner-con');
                        if(loader != null && loader.parentNode != null) loader.parentNode.removeChild(loader);
                    }

                    log('hideLoader for check', loaderName == 'screensharingFailed', screen.screensharing, !screen.hasLiveTracks('video'))

                    if(loaderName == 'screensharingFailed' && screen.screensharing && !screen.hasLiveTracks('video')){
                        log('cancel screensharing screen', screen)
                        screen.screensharing = false;
                        if(participant.screens.length > 1) {
                            screen.hide();
                        }
                        screensRendering.updateLayout();
                    }
                }

            }

            var viewModeToSwitchBack;
            /**
             * Toggle view mode (Maximized, minimized etc) on screen click.
             * @method toggleViewModeByScreenClick
             * @param {Object} [e] Click/tap event.
             */
            function toggleViewModeByScreenClick(e) {
                log('toggleViewModeByScreenClick')
                log('toggleViewModeByScreenClick: current viewMode', viewMode)

                if(viewMode == 'audio' || viewMode == 'squaresGrid') return;

                e.stopImmediatePropagation();
                e.preventDefault();

                if(viewMode == 'tiled' || viewMode == 'regular' || viewMode == 'tiledMobile' || viewMode == 'sideBySideMobile' || viewMode == 'maximizedMobile') {
                    viewModeToSwitchBack = viewMode;
                }

                var tappedScreen = roomScreens.filter(function (obj) {
                    return obj.screenEl.contains(e.target) || obj.screenEl == e.target;
                })[0];

                log('tappedScreen', tappedScreen);
                if(tappedScreen == null) return;
                var resizeTool = Q.Tool.from(tappedScreen.screenEl, "Q/resize");
                //var videoResizeTool = Q.Tool.from(tappedScreen.videoScreen.videoCon, "Q/resize");
                if(resizeTool != null) {
                    if(resizeTool.state.appliedRecently) return;
                }
                /*if(videoResizeTool != null) {
                    if(videoResizeTool.state.appliedRecently) return;
                }*/

                disableLoudesScreenMode();

                if(activeScreen && !activeScreen.screenEl.contains(e.target) && (viewMode == 'maximized' || viewMode == 'maximizedMobile')) {
                    log('toggleViewModeByScreenClick 1')

                    tappedScreen.screenEl.style.zIndex = '';

                    if(Q.info.isMobile){
                        renderMaximizedScreensGridMobile(tappedScreen);
                    } else renderMaximizedScreensGrid(tappedScreen);

                    return;
                } else if(activeScreen && !activeScreen.screenEl.contains(e.target) && (viewMode == 'fullScreen' || viewMode == 'screenSharing')) {
                    log('toggleViewModeByScreenClick 2')

                    tappedScreen.screenEl.style.zIndex = '';

                    /* if(Q.info.isMobile){
                        renderMaximizedScreensGridMobile(tappedScreen);
                    } else renderMaximizedScreensGrid(tappedScreen);*/
                    renderFullScreenLayout(tappedScreen);
                    return;
                } else if(activeScreen && (activeScreen.screenEl.contains(e.target) || activeScreen.screenEl == e.target)) {
                    log('toggleViewModeByScreenClick 3')


                    tappedScreen.screenEl.style.zIndex = '';

                    if(Q.info.isMobile){
                        renderMinimizedScreensGridMobile(tappedScreen);
                    } else renderMinimizedScreensGrid(tappedScreen);

                    return;
                } else if (activeScreen == null && (viewMode == 'tiledMobile') && viewModeToSwitchBack != null) {
                    log('toggleViewModeByScreenClick 4.0')

                    tappedScreen.screenEl.style.zIndex = '';

                    renderSideBySideGridMobile();

                    return;
                } else if (activeScreen == null && (viewMode == 'tiled' || viewMode == 'sideBySideMobile') && viewModeToSwitchBack != null) {
                    log('toggleViewModeByScreenClick 4')

                    tappedScreen.screenEl.style.zIndex = '';

                    if(Q.info.isMobile){
                        renderMaximizedScreensGridMobile(tappedScreen);
                    } else renderMaximizedScreensGrid(tappedScreen);

                    return;
                } else if (activeScreen == null && (viewMode == 'minimized' || viewMode == 'minimizedMobile') && viewModeToSwitchBack != null) {
                    log('toggleViewModeByScreenClick 5')

                    tappedScreen.screenEl.style.zIndex = '';
                    if(viewModeToSwitchBack == 'tiled' || viewModeToSwitchBack == 'tiledMobile' || viewModeToSwitchBack == 'maximizedMobile' || viewModeToSwitchBack == 'regular') {
                        if(viewModeToSwitchBack == 'maximizedMobile') viewModeToSwitchBack = 'tiledMobile';
                        toggleViewMode(viewModeToSwitchBack, tappedScreen);
                    }

                    return;
                }

                toggleViewMode(null, tappedScreen);
                bindScreensEvents();
            }

            /**
             * Toggle participants' screens view mode.
             * @method toggleViewMode
             * @param {Object} [tappedScreen] Screen that has tapped/clicked in order to maximize it
             */
            function toggleViewMode(modeToSwitch, tappedScreen) {
                log('toggleViewMode', modeToSwitch);
                var modes;
                if(Q.info.isMobile)
                    modes = ['tiledMobile', 'maximizedMobile'];
                else modes = ['regular', 'maximized', 'tiled'];

                if(typeof modeToSwitch == 'undefined' || modeToSwitch == null) {
                    var i, mode;

                    for (i = 0; mode = modes[i]; i++) {
                        if (mode == viewMode || viewMode == null) {
                            if (i != modes.length - 1) {
                                modeToSwitch = modes[i + 1];
                            } else modeToSwitch = modes[0];
                            break;
                        }
                    }
                    ;
                }

                if(modeToSwitch == null || modeToSwitch == 'regular') {
                    renderDesktopScreensGrid();
                } else if(modeToSwitch == 'minimized') {
                    renderMinimizedScreensGrid();
                } else if(modeToSwitch == 'maximized') {
                    renderMaximizedScreensGrid(tappedScreen);
                } else if(modeToSwitch == 'tiledMobile') {
                    if(roomScreens.length == 1) {
                        renderMaximizedScreensGridMobile(tappedScreen);
                    } else renderTiledScreenGridMobile();
                } else if(modeToSwitch == 'maximizedMobile') {
                    renderMaximizedScreensGridMobile(tappedScreen);
                } else if(modeToSwitch == 'minimizedMobile') {
                    renderMinimizedScreensGridMobile();
                } else if(modeToSwitch == 'tiled') {
                    if(roomScreens.length == 1) {
                        modeToSwitch = 'regular';
                        renderDesktopScreensGrid();
                    } else renderTiledScreenGridDesktop();

                }
            }

            function switchScreenType(modeToSwitchTo) {
                log('switchScreenType', modeToSwitchTo, roomScreens.length)
                //if(modeToSwitchTo == activeScreensType) return;
                var participants = webrtcSignalingLib.roomParticipants();
                if(modeToSwitchTo == 'video') {
                    for(let p in participants) {
                        let pScreens = participants[p].screens;
                        for (let s = pScreens.length - 1; s >= 0; s--) {
                            log('switchScreenType fortchScreenType for', s)

                            pScreens[s].switchToVideoScreen();
                        }
                    }
                } else if(modeToSwitchTo == 'audio') {
                    for(let p in participants) {
                        let pScreens = participants[p].screens;
                        for(let s = pScreens.length - 1; s >= 0 ; s--){
                            log('switchScreenType fortchScreenType for', s)

                            pScreens[s].switchToAudioScreen();
                        }
                    }

                }

                //activeScreensType = modeToSwitchTo;
            }

            /**
             * Prepares screens for layout changing. Changes class of screens and its container depending on passed
             * layout when layout is being changed.
             * @method toggleScreensClass
             * @param {String} [layout] layout name
             * @return {Array} Sreens (HTML elements) to render
             */
            function toggleScreensClass(layout) {
                var gridClasses = [
                    'Streams_webrtc_tiled-screens-grid',
                    'Streams_webrtc_squares-screens-grid',
                    'Streams_webrtc_side-by-side-screens-grid',
                    'Streams_webrtc_maximized-screens-grid',
                    'Streams_webrtc_fullscreen-grid',
                    'Streams_webrtc_regular-screens-grid',
                    'Streams_webrtc_audio-screens-grid',
                ];
                var screenClasses = [
                    'Streams_webrtc_squares-grid-screen',
                    'Streams_webrtc_tiled-grid-screen',
                    'Streams_webrtc_minimized-small-screen',
                    'Streams_webrtc_maximized-main-screen',
                    'Streams_webrtc_regular-screen',
                    'Streams_webrtc_audio-screen',
                ];

                if(layout == 'tiledVertical' || layout == 'tiledHorizontal') {
                    var screenClass = 'Streams_webrtc_tiled-grid-screen';
                    var elements = [];
                    for(var s in roomScreens) {
                        let screen = roomScreens[s];
                        if(screen.activeScreenType == 'audio') continue;
                        for (var o in screenClasses) {
                            if(screenClasses[o] == screenClass) continue;
                            if (screen.screenEl.classList.contains(screenClasses[o])) screen.screenEl.classList.remove(screenClasses[o]);
                        }
                        if(!screen.screenEl.classList.contains(screenClass)) screen.screenEl.classList.add(screenClass);

                        /*if(!_roomsMedia.contains(screen.screenEl)) {
							screen.videoScreen.videoCon.style.display = 'none';
						} else {
							screen.videoScreen.videoCon.style.display = '';
						}*/

                        elements.push(screen.screenEl);
                    };


                    var containerClass = 'Streams_webrtc_tiled-screens-grid';
                    for (var x in gridClasses) {
                        if(gridClasses[x] == containerClass) continue;
                        if (_roomsMedia.classList.contains(gridClasses[x])) _roomsMedia.classList.remove(gridClasses[x]);
                    }
                    _roomsMedia.classList.add(containerClass);

                    return elements;

                }

                if(layout == 'tiledVerticalMobile' || layout == 'tiledHorizontalMobile' || layout == 'sideBySideMobile') {
                    var screenClass = 'Streams_webrtc_tiled-grid-screen';
                    var elements = [];
                    for(var s in roomScreens) {
                        let screen = roomScreens[s];
                        if(screen.activeScreenType == 'audio') continue;
                        for (var o in screenClasses) {
                            if(screenClasses[o] == screenClass) continue;
                            if (screen.screenEl.classList.contains(screenClasses[o])) screen.screenEl.classList.remove(screenClasses[o]);
                        }
                        if(!screen.screenEl.classList.contains(screenClass)) screen.screenEl.classList.add(screenClass);

                        /*if(!_roomsMedia.contains(screen.screenEl)) {
							screen.videoScreen.videoCon.style.display = 'none';
						} else {
							screen.videoScreen.videoCon.style.display = '';
						}*/

                        elements.push(screen.screenEl);
                    }


                    var containerClass = layout == 'sideBySideMobile' ? 'Streams_webrtc_side-by-side-screens-grid' : 'Streams_webrtc_tiled-screens-grid';
                    for (var x in gridClasses) {
                        if(gridClasses[x] == containerClass) continue;
                        if (_roomsMedia.classList.contains(gridClasses[x])) _roomsMedia.classList.remove(gridClasses[x]);
                    }
                    _roomsMedia.classList.add(containerClass);

                    return elements;

                }

                if(layout == 'squaresGrid') {
                    var screenClass = 'Streams_webrtc_squares-grid-screen';
                    var elements = [];
                    for(var s in roomScreens) {
                        let screen = roomScreens[s];
                        if(screen.activeScreenType == 'audio') continue;
                        for (var o in screenClasses) {
                            if(screenClasses[o] == screenClass) continue;
                            if (screen.screenEl.classList.contains(screenClasses[o])) screen.screenEl.classList.remove(screenClasses[o]);
                        }
                        if(!screen.screenEl.classList.contains(screenClass)) screen.screenEl.classList.add(screenClass);

                        /*if(!_roomsMedia.contains(screen.screenEl)) {
							screen.videoScreen.videoCon.style.display = 'none';
						} else {
							screen.videoScreen.videoCon.style.display = '';
						}*/

                        elements.push(screen.screenEl);
                    }


                    var containerClass = 'Streams_webrtc_squares-screens-grid';
                    for (var x in gridClasses) {
                        if(gridClasses[x] == containerClass) continue;
                        if (_roomsMedia.classList.contains(gridClasses[x])) _roomsMedia.classList.remove(gridClasses[x]);
                    }
                    _roomsMedia.classList.add(containerClass);

                    return elements;

                }

                if(layout == 'minimizedScreensGrid' || layout == 'maximizedScreensGrid'
                    || layout == 'maximizedVerticalMobile' || layout == 'maximizedHorizontalMobile'
                    || layout == 'minimizedVerticalMobile' || layout == 'minimizedHorizontalMobile') {


                    var containerClass = 'Streams_webrtc_maximized-screens-grid';
                    var screenClass = 'Streams_webrtc_minimized-small-screen';
                    var maximizedScreenClass = 'Streams_webrtc_maximized-main-screen';
                    var isMinimizedLayout = layout == 'minimizedScreensGrid' || layout == 'minimizedVerticalMobile' || layout == 'minimizedHorizontalMobile';

                    var elements = []
                    log('toggleScreensClass roomScreens', isMinimizedLayout, layout);

                    for(var s in roomScreens) {
                        let screen = roomScreens[s];
                        if(screen.activeScreenType == 'audio') continue;
                        for (var o in screenClasses) {
                            if(screenClasses[o] == screenClass && screen != activeScreen) continue;
                            if (screen.screenEl.classList.contains(screenClasses[o])) screen.screenEl.classList.remove(screenClasses[o]);
                        }

                        if(!screen.screenEl.classList.contains(screenClass) && screen != activeScreen) {
                            screen.screenEl.classList.add(screenClass);
                        } else if (!screen.screenEl.classList.contains(maximizedScreenClass) && screen == activeScreen && !isMinimizedLayout) {
                            screen.screenEl.classList.add(maximizedScreenClass);
                        }

                        /*if(!_roomsMedia.contains(screen.screenEl)) {
							if(screen.videoTrackEl != null && screen.videoTrackEl.videoWidth == 0 && screen.videoTrackEl.videoHeight == 0) screen.videoTrackEl.style.display = 'none';
						}*/

                        if(!Q.info.isMobile) {
                            elements.push(screen.screenEl);
                        } else {
                            if(screen == activeScreen) {
                                elements.unshift(screen.screenEl);
                            } else {
                                elements.push(screen.screenEl);
                            }
                            if(screen == activeScreen) moveScreenBack.call(screen.screenEl);
                        }

                    }

                    log('toggleScreensClass elements', elements);
                    for (var x in gridClasses) {
                        if(gridClasses[x] == containerClass) continue;
                        if (_roomsMedia.classList.contains(gridClasses[x])) _roomsMedia.classList.remove(gridClasses[x]);
                    }
                    _roomsMedia.classList.add(containerClass);
                    return elements;
                }

                if(layout == 'screenSharing') {
                    log('toggleScreensClass screenSharing');

                    var containerClass = 'Streams_webrtc_fullscreen-grid';
                    var screenClass = 'Streams_webrtc_minimized-small-screen';
                    var maximizedScreenClass = 'Streams_webrtc_maximized-main-screen';


                    var elements = []
                    log('toggleScreensClass roomScreens', roomScreens);

                    var localScreensIncludedToRender = false;
                    for(var s in roomScreens) {
                        let screen = roomScreens[s];
                        if(screen.activeScreenType == 'audio') continue;

                        for (var o in screenClasses) {
                            if(screenClasses[o] == screenClass && screen != activeScreen) continue;
                            if (screen.screenEl.classList.contains(screenClasses[o])) screen.screenEl.classList.remove(screenClasses[o]);
                        }
                        if(!screen.screenEl.classList.contains(screenClass) && screen != activeScreen) {
                            screen.screenEl.classList.add(screenClass);
                        } else if (!screen.screenEl.classList.contains(maximizedScreenClass) && screen == activeScreen) {
                            screen.screenEl.classList.add(maximizedScreenClass);
                        }

                        if(screen.participant == activeScreen.participant && localScreensIncludedToRender == false) {
                            var screensharingScreens = [];
                            var cameraScreens = [];
                            for(let c in screen.participant.screens) {
                                let pScreen = screen.participant.screens[c];
                                log('toggleScreensClass pScreen.isActive', pScreen.isActive);
                                if(!pScreen.isActive) continue;
                                if(pScreen.screensharing == true) {
                                    log('toggleScreensClass screensharing=true');

                                    screensharingScreens.push(pScreen.screenEl);
                                    moveScreenBack.call(pScreen.screenEl);
                                } else {
                                    log('toggleScreensClass screensharing=false');

                                    cameraScreens.push(pScreen.screenEl);
                                    moveScreenFront.call(pScreen.screenEl);
                                }
                            }
                            log('toggleScreensClass s', screensharingScreens, cameraScreens);

                            //if(!screen.participant.isLocal) {
                            log('toggleScreensClass s', screensharingScreens, cameraScreens);
                            let scrns = cameraScreens.concat(screensharingScreens);
                            log('toggleScreensClass scrns', scrns);

                            scrns.map(function(el){
                                log('toggleScreensClass map', el);

                                elements.unshift(el);
                            })
                            /*} else {

                                screensharingScreens.concat(cameraScreens).map(function(el){
                                    log('toggleScreensClass map', el);

                                    elements.unshift(el);
                                })
                            }*/

                            localScreensIncludedToRender = true;

                        } else if (screen.participant != activeScreen.participant) {
                            log('toggleScreensClass if2');

                            elements.push(screen.screenEl);
                        }

                    }

                    log('toggleScreensClass elements', elements);
                    for (var x in gridClasses) {
                        if(gridClasses[x] == containerClass) continue;
                        if (_roomsMedia.classList.contains(gridClasses[x])) _roomsMedia.classList.remove(gridClasses[x]);
                    }
                    _roomsMedia.classList.add(containerClass);
                    return elements;
                }

                if(layout == 'fullScreen') {
                    log('toggleScreensClass fullScreen');

                    var containerClass = 'Streams_webrtc_fullscreen-grid';
                    var screenClass = 'Streams_webrtc_minimized-small-screen';
                    var maximizedScreenClass = 'Streams_webrtc_maximized-main-screen';


                    var elements = [];
                    for(var s in roomScreens) {
                        let screen = roomScreens[s];
                        if(screen.activeScreenType == 'audio') continue;

                        for (var o in screenClasses) {
                            if(screenClasses[o] == screenClass && screen != activeScreen) continue;
                            if (screen.screenEl.classList.contains(screenClasses[o])) screen.screenEl.classList.remove(screenClasses[o]);
                        }
                        if(!screen.screenEl.classList.contains(screenClass) && screen != activeScreen) {
                            screen.screenEl.classList.add(screenClass);
                            if(screen.screenEl.classList.contains(maximizedScreenClass)) screen.screenEl.classList.remove(maximizedScreenClass)
                        } else if (!screen.screenEl.classList.contains(maximizedScreenClass) && screen == activeScreen) {
                            screen.screenEl.classList.add(maximizedScreenClass);
                        }

                        if(screen == activeScreen) {
                            elements.unshift(screen.screenEl);
                            moveScreenBack.call(screen.screenEl);
                        } else {
                            elements.push(screen.screenEl);
                        }
                    }

                    log('toggleScreensClass elements', elements);
                    for (var x in gridClasses) {
                        if(gridClasses[x] == containerClass) continue;
                        if (_roomsMedia.classList.contains(gridClasses[x])) _roomsMedia.classList.remove(gridClasses[x]);
                    }
                    _roomsMedia.classList.add(containerClass);
                    return elements;
                }

                if(layout == 'regularScreensGrid' || layout == 'manualScreensGrid') {
                    var screenClass = 'Streams_webrtc_regular-screen';


                    var elements = [];
                    for(var s in roomScreens) {
                        let screen = roomScreens[s];
                        if(screen.activeScreenType == 'audio') continue;

                        for (var o in screenClasses) {
                            if (screen.screenEl.classList.contains(screenClasses[o])) screen.screenEl.classList.remove(screenClasses[o]);
                        }

                        if(!screen.screenEl.classList.contains(screenClass)) {
                            screen.screenEl.classList.add(screenClass);
                        }

                        /*if(!_roomsMedia.contains(screen.screenEl)) {
                            if(screen.videoTrackEl != null && screen.videoTrackEl.videoWidth == 0 && screen.videoTrackEl.videoHeight == 0) screen.videoTrackEl.style.display = 'none';
                        }*/

                        elements.push(screen.screenEl);
                    }

                    var containerClass = 'Streams_webrtc_regular-screens-grid';
                    for (var x in gridClasses) {
                        if(gridClasses[x] == containerClass) continue;
                        if (_roomsMedia.classList.contains(gridClasses[x])) _roomsMedia.classList.remove(gridClasses[x]);
                    }
                    _roomsMedia.classList.add(containerClass);
                    return elements;
                }

                if(layout == 'audioScreensGrid') {
                    var screenClass = 'Streams_webrtc_audio-screen';

                    var elements = [];
                    for(var s in roomScreens) {
                        let screen = roomScreens[s];

                        for (var o in screenClasses) {
                            if (screen.screenEl.classList.contains(screenClasses[o])) screen.screenEl.classList.remove(screenClasses[o]);
                        }

                        if(!screen.screenEl.classList.contains(screenClass)) {
                            screen.screenEl.classList.add(screenClass);
                        }

                        var userId = screen.participant.identity != null ? screen.participant.identity.split('\t')[0] : null;

                        if(_options.hosts && _options.hosts.indexOf(userId) != -1) {
                            elements.unshift(screen.screenEl);
                        } else {
                            elements.push(screen.screenEl);
                        }
                    }

                    var containerClass = 'Streams_webrtc_audio-screens-grid';
                    for (var x in gridClasses) {
                        if(gridClasses[x] == containerClass) continue;
                        if (_roomsMedia.classList.contains(gridClasses[x])) _roomsMedia.classList.remove(gridClasses[x]);
                    }
                    _roomsMedia.classList.add(containerClass);
                    return elements;
                }
            }

            /**
             * Render tiled view mode on mobile.
             * @method renderTiledScreenGridMobile
             */
            function renderTiledScreenGridMobile() {
                log('renderTiledScreenGridMobile', roomScreens.length);

                switchScreenType('video');


                log('renderTiledScreenGridMobile 2', roomScreens.length);

                /*if(roomScreens.length <= 1) {
                    renderMaximizedScreensGridMobile();
                    updateScreensButtons();
                    if(_controlsTool) _controlsTool.updateViewModeBtns();
                    return;
                }*/


                if(window.innerHeight > window.innerWidth) {
                    //_roomsMedia.className = 'Streams_webrtc_tiled-vertical-grid';
                    var elements = toggleScreensClass('tiledVerticalMobile');
                    prevViewMode = viewMode;
                    _layoutTool.animate('tiledVerticalMobile', elements, 500, true);
                } else {
                    //_roomsMedia.className = 'Streams_webrtc_tiled-horizontal-grid';
                    var elements = toggleScreensClass('tiledHorizontalMobile');
                    prevViewMode = viewMode;
                    _layoutTool.animate('tiledHorizontalMobile', elements, 500, true);
                }

                viewMode = 'tiledMobile';
                activeScreen = null;
                layoutEvents.dispatch('layoutRendered', {prevViewMode:prevViewMode, viewMode});
            }

            /**
             * Render videos side by side (only when 2 videos)
             * @method renderSideBySideGridMobile
             */
            function renderSideBySideGridMobile() {
                log('renderSideBySideGridMobile');
                switchScreenType('video');

                //if(roomScreens.length <= 1) return;


                if(window.innerHeight > window.innerWidth) {
                    //_roomsMedia.className = 'Streams_webrtc_tiled-vertical-grid';
                    var elements = toggleScreensClass('sideBySideMobile');
                    prevViewMode = viewMode;
                    _layoutTool.animate('sideBySideMobile', elements, 500, true);
                } else {
                    //_roomsMedia.className = 'Streams_webrtc_tiled-horizontal-grid';
                    var elements = toggleScreensClass('tiledHorizontalMobile');
                    prevViewMode = viewMode;
                    _layoutTool.animate('tiledHorizontalMobile', elements, 500, true);
                }

                viewMode = 'sideBySideMobile';
                activeScreen = null;
                layoutEvents.dispatch('layoutRendered', {prevViewMode:prevViewMode, viewMode});
            }

            /**
             * Render tiled view mode on desktop/tablet.
             * @method renderTiledScreenGridMobile
             */
            function renderTiledScreenGridDesktop() {
                log('renderTiledScreenGridDesktop')

                switchScreenType('video');

                if(window.innerHeight > window.innerWidth) {
                    //_roomsMedia.className = 'Streams_webrtc_tiled-vertical-grid';
                    var elements = toggleScreensClass('tiledVertical');
                    prevViewMode = viewMode;
                    _layoutTool.animate('tiledVertical', elements, 500, true);
                } else {
                    //_roomsMedia.className = 'Streams_webrtc_tiled-horizontal-grid';
                    var elements = toggleScreensClass('tiledHorizontal');
                    prevViewMode = viewMode;
                    _layoutTool.animate('tiledHorizontal', elements, 500, true);
                }
                viewMode = 'tiled';
                activeScreen = null;

                layoutEvents.dispatch('layoutRendered', {prevViewMode:prevViewMode, viewMode});
            }

            /**
             * Render normal view mode on desktop/tablet (screens are about same size side by side at the middle of the screen).
             * @method renderDesktopScreensGrid
             */
            function renderDesktopScreensGrid() {
                log('renderDesktopScreensGrid', prevViewMode);
                if(_layoutTool == null || _controls == null) return;
                activeScreen = null;

                _layoutTool.maximizedScreen = null;

                switchScreenType('video');

                var elements = toggleScreensClass('regularScreensGrid');
                if(!_layoutTool.getLayoutGenerator('regularScreensGrid')) {
                    _layoutTool.setLayoutGenerator('regularScreensGrid', function (container, count) {
                        return customLayouts.regularScreensGrid(_options.element, roomScreens);
                    });
                }

                prevViewMode = viewMode;
                _layoutTool.animate('regularScreensGrid', elements, 500, true);
                viewMode = 'regular';

                layoutEvents.dispatch('layoutRendered', {prevViewMode:prevViewMode, viewMode});
            }

            /**
             * Render normal view mode on desktop/tablet (screens are about same size side by side at the middle of the screen).
             * @method renderDesktopScreensGrid
             */
            function renderAudioScreensGrid() {
                log('renderAudioScreensGrid', prevViewMode);
                if(_layoutTool == null || _controls == null) return;
                activeScreen = null;

                _layoutTool.maximizedScreen = null;

                switchScreenType('audio');

                var elements = toggleScreensClass('audioScreensGrid');
                if(!_layoutTool.getLayoutGenerator('audioScreensGrid')) {
                    _layoutTool.setLayoutGenerator('audioScreensGrid', function (container, count) {
                        return customLayouts.audioScreensGrid(_roomsMedia, roomScreens);
                    });
                }

                prevViewMode = viewMode;

                _layoutTool.animate('audioScreensGrid', elements, 500, true);

                viewMode = 'audio';

                layoutEvents.dispatch('layoutRendered', {prevViewMode:prevViewMode, viewMode});
            }

            /**
             * Render layout where screens aren't sorted and every new screen appear in the middle of page
             * @method renderManualScreensGrid
             */
            function renderManualScreensGrid() {
                if(_layoutTool == null || _controls == null) return;
                activeScreen = null;
                _layoutTool.maximizedScreen = null;

                switchScreenType('video');

                var elements = toggleScreensClass('manualScreensGrid');
                if(!_layoutTool.getLayoutGenerator('manualScreensGrid')) {
                    _layoutTool.setLayoutGenerator('manualScreensGrid', function (container, count) {
                        return customLayouts.manualScreensGrid(document.body, roomScreens);
                    });
                }

                prevViewMode = viewMode;
                _layoutTool.animate('manualScreensGrid', elements, 500, true);
                viewMode = 'manual';

                layoutEvents.dispatch('layoutRendered', {prevViewMode:prevViewMode, viewMode});
            }

            /**
             * Render participant's screen in minimized view mode on desktop.
             * @method renderMinimizedScreensGrid
             */
            function renderMinimizedScreensGrid() {
                log('renderMinimizedScreensGrid')
                if(_layoutTool == null || _controls == null) return;

                activeScreen = null;

                if(!_layoutTool.getLayoutGenerator('minimizedScreensGrid')) {
                    _layoutTool.setLayoutGenerator('minimizedScreensGrid', function (container, count) {
                        return customLayouts.minimizedOrMaximizedScreenGrid(_roomsMedia, count, _controls.querySelector('.Streams_webrtc_conference-control'), false);
                    });
                }

                switchScreenType('video');

                var elements = toggleScreensClass('minimizedScreensGrid');

                prevViewMode = viewMode;
                _layoutTool.animate('minimizedScreensGrid', elements, 500, true);
                viewMode = 'minimized';

                layoutEvents.dispatch('layoutRendered', {prevViewMode:prevViewMode, viewMode});
            }

            /**
             * Render maximized view mode on desktop (one screen is maximized, rest - minimized).
             * @method renderMaximizedScreensGrid
             */
            function renderMaximizedScreensGrid(screenToMaximize, duration) {
                if(typeof duration == 'undefined') duration = 500;
                //log('renderMaximizedScreensGrid', screenToMaximize)
                //log('renderMaximizedScreensGrid activeScreen', activeScreen)
                //TODO: check if "(screenToMaximize != null && screenToMaximize == activeScreen)" impacts updating layout
                if(_layoutTool == null || _controls == null || (screenToMaximize != null && screenToMaximize == activeScreen && !(viewMode == 'screenSharing' || viewMode == 'fullScreen'))) return;

                switchScreenType('video');

                if(screenToMaximize != null && screenToMaximize.isActive) activeScreen = screenToMaximize;
                if(screenToMaximize == null && (activeScreen == null || activeScreen.isLocal) /*&& roomScreens.length == 2*/) {
                    //log('renderMaximizedScreensGrid if1')

                    var screensToTakeInc = roomScreens.filter(function (s) {
                        return (!s.isLocal ? true : false);
                    });
                    if(screensToTakeInc.length != 0) {
                        //log('renderMaximizedScreensGrid if1.1')

                        activeScreen = screensToTakeInc.reduce(function (prev, current) {
                            return (prev.participant.connectedTime > current.participant.connectedTime) ? prev : current;
                        });

                    }
                }

                if(activeScreen == null || !_roomsMedia.contains(activeScreen.screenEl)) activeScreen = roomScreens[0];
                //log('renderMaximizedScreensGrid activeScreen', activeScreen)

                if(!_layoutTool.getLayoutGenerator('maximizedScreensGrid')) _layoutTool.setLayoutGenerator('maximizedScreensGrid', function (container, count) {
                    return customLayouts.minimizedOrMaximizedScreenGrid(_roomsMedia, count, _controls.querySelector('.Streams_webrtc_conference-control'), true);
                });

                var elements = toggleScreensClass('maximizedScreensGrid');
                prevViewMode = viewMode;
                _layoutTool.animate('maximizedScreensGrid', elements, duration, true);
                viewMode = 'maximized';

                layoutEvents.dispatch('layoutRendered', {prevViewMode:prevViewMode, viewMode});
            }

            /**
             * Maximize screensharing screen.
             * @method renderFullScreenLayout
             * @param {Object} [screenToMaximize] Screen that contains screensharing video.
             */
            function renderFullScreenLayout(screenToMaximize) {
                log('renderFullScreenLayout', screenToMaximize, activeScreen)
                if(_layoutTool == null || _controls == null/* || (screenToMaximize != null && screenToMaximize == activeScreen)*/) return;
                switchScreenType('video');

                _layoutTool.maximizedScreen = null;
                if(screenToMaximize != null) activeScreen = screenToMaximize;
                if((screenToMaximize != null && !screenToMaximize.isActive) || (screenToMaximize == null && (activeScreen == null || !activeScreen.isActive))) {

                    var screenToActivate;
                    for(let i in roomScreens) {
                        let screen = roomScreens[i];
                        if(!screen.isLocal && screen.isActive) {
                            screenToActivate = screen;
                        }
                    }
                    if(screenToActivate == null) {
                        for(let i in roomScreens) {
                            let screen = roomScreens[i];

                            if(!screen.isLocal) {
                                screenToActivate = screen;
                            }
                        }
                    }

                    activeScreen = screenToActivate;
                }
                log('renderFullScreenLayout activeScreen 0', activeScreen);



                var elements = toggleScreensClass(activeScreen && activeScreen.screensharing ? 'screenSharing' : 'fullScreen');
                log('renderFullScreenLayout length', elements.length)
                prevViewMode = viewMode;
                _layoutTool.animate('fullScreen', elements, 100, true);
                viewMode = activeScreen && activeScreen.screensharing ? 'screenSharing' : 'fullScreen';

                log('renderFullScreenLayout activeScreen 2', activeScreen);

                layoutEvents.dispatch('layoutRendered', {prevViewMode:prevViewMode, viewMode});
            }

            /**
             * Maximaze tapped screen to full, make another screens minimized.
             * @method renderMaximizedScreensGridMobile
             * @param {Object} [screenToMaximize] Screen that has tapped in order to maximize.
             */
            function renderMaximizedScreensGridMobile(screenToMaximize) {
                log('renderMaximizedScreensGridMobile')
                if(_layoutTool == null || _controls == null || (screenToMaximize != null && screenToMaximize == activeScreen)) return;
                switchScreenType('video');

                if(screenToMaximize != null && screenToMaximize.isActive) activeScreen = screenToMaximize;
                if(screenToMaximize == null && (activeScreen == null /*|| activeScreen.isLocal*/)/* && roomScreens.length == 2*/) {

                    var i, screen;
                    for(i = 0; screen = roomScreens[i]; i++) {
                        if(!screen.isLocal) {
                            activeScreen = screen;
                        }
                    }
                }

                if(activeScreen == null || !_roomsMedia.contains(activeScreen.screenEl)) activeScreen = roomScreens[0];
                log('renderMaximizedScreensGridMobile: animate')

                if(window.innerHeight > window.innerWidth) {
                    var elements = toggleScreensClass('maximizedVerticalMobile');
                    prevViewMode = viewMode;
                    _layoutTool.animate('maximizedVerticalMobile', elements, 100, true);
                } else {
                    log('renderMaximizedScreensGridMobile maximizedHorizontalMobile');
                    var elements = toggleScreensClass('maximizedHorizontalMobile');
                    prevViewMode = viewMode;
                    _layoutTool.animate('maximizedHorizontalMobile', elements, 100, true);
                }

                viewMode = 'maximizedMobile';

                layoutEvents.dispatch('layoutRendered', {prevViewMode:prevViewMode, viewMode});
            }

            /**
             * Minimize all screens.
             * @method renderMinimizedScreensGridMobile
             */
            function renderMinimizedScreensGridMobile() {
                log('renderMinimizedScreensGridMobile')
                if(_layoutTool == null || _controls == null) return;
                activeScreen = null;

                switchScreenType('video');

                if(window.innerHeight > window.innerWidth) {
                    var elements = toggleScreensClass('minimizedVerticalMobile');
                    prevViewMode = viewMode;
                    _layoutTool.animate('minimizedVerticalMobile', elements, 100, true);
                } else {
                    var elements = toggleScreensClass('minimizedHorizontalMobile');
                    prevViewMode = viewMode;
                    _layoutTool.animate('minimizedHorizontalMobile', elements, 100, true);
                }

                viewMode = 'minimizedMobile';
                layoutEvents.dispatch('layoutRendered', {prevViewMode:prevViewMode, viewMode});
            }

            /**
             * Renders screens in scrollable container.
             * @method renderSquaresGridMobile
             */
            function renderSquaresGridMobile() {
                log('renderSquaresGridMobile')
                if(_layoutTool == null || _controls == null) return;
                activeScreen = null;

                switchScreenType('video');
                if(!_layoutTool.getLayoutGenerator('squaresGrid')) _layoutTool.setLayoutGenerator('squaresGrid', function (container, count) {
                    return customLayouts.squaresGrid(new DOMRect(0, 0, 375, 812), count, _controls.querySelector('.Streams_webrtc_conference-control'), true);
                });
                var elements = toggleScreensClass('squaresGrid');
                log('renderSquaresGridMobile: elements', elements)

                prevViewMode = viewMode;
                _layoutTool.animate('squaresGrid', elements, 100, true);

                viewMode = 'squaresGrid';
                layoutEvents.dispatch('layoutRendered', {prevViewMode:prevViewMode, viewMode});
            }


            function maximizeLoudestScreen(mode) {
                webrtcSignalingLib.mediaManager.getLoudestScreen(mode, function (loudestScreen) {
                    if (Q.info.isMobile)
                        renderMaximizedScreensGridMobile(loudestScreen, 0);
                    else renderMaximizedScreensGrid(loudestScreen, 0);
                });
            }
            function toggleLoudestScreenMode(mode) {
                loudestMode = mode;
                if (mode != 'disabled') maximizeLoudestScreen(mode);
                if (loudestModeInterval != null) {
                    clearInterval(loudestModeInterval);
                    loudestModeInterval = null;
                }

                if (mode == 'disabled') {
                    return;
                }

                loudestModeInterval = setInterval(function () {
                    maximizeLoudestScreen(mode);
                }, 1000);

            }
            function disableLoudesScreenMode() {
                if (loudestModeInterval != null) {
                    clearInterval(loudestModeInterval);
                    loudestModeInterval = null;
                }
            }

            /**
             * Custom layouts for Q.layout tool (layouts are taking into accout ratio of participants' video).
             */
            var customLayouts = {

                /**
                 * Prepare data for animated changing view mode to normal. Takes into account ratio of video.
                 * @method regularScreensGrid
                 * @param {Object} [container] HTML parent element participants' screens.
                 * @return {Array} List of DOMRects that will be passed to Q.layout.
                 */ 
                regularScreensGrid: function (container) {
                    var containerRect = container == document.body ? new DOMRect(0, 0, window.innerWidth, window.innerHeight) : container.getBoundingClientRect();
                    var parentWidth = containerRect.width;
                    var parentHeight = containerRect.height;
                    var defaultRectWidth = containerRect.width < 555 ? containerRect.width : 555;
                    var defaultRectHeight = containerRect.height < 416 ? containerRect.height : 416;
                    var maxLongestSide =  Math.min(defaultRectWidth, defaultRectHeight);
                    var defaultDOMRect = getElementSizeKeepingRatio({
                        width: defaultRectWidth,
                        height: defaultRectHeight
                    }, {width: maxLongestSide, height: maxLongestSide})
                    var centerX = containerRect.width / 2;
                    var centerY = containerRect.height / 2;
                    var rectsRows = [];
                    var currentRow = [];
                    var spaceBetween = 10;
                    var prevRect = null;
                    var count = roomScreens.length;

                    var minX, maxX, maxX, minY, maxY;
                    var nextAction = null;

                    var i;
                    for (i = 0; i < count; i++) {
                        var screen = roomScreens[i];
                        var screenElRect = screen.screenEl.getBoundingClientRect();
                        var videoWidth = screen.videoTrackEl != null && screen.videoTrackEl.videoWidth != 0 ? screen.videoTrackEl.videoWidth : 0
                        var videoHeight = (screen.videoTrackEl != null && screen.videoTrackEl.videoHeight != 0 ? screen.videoTrackEl.videoHeight : 0);

                        //if video element has width and height, rect's proportions will be based on the size of video
                        var newRectSize = null;
                        if(videoWidth != 0 && videoHeight != 0) {
                            newRectSize = getElementSizeKeepingRatio({
                                width: videoWidth,
                                height: videoHeight
                            }, {width: maxLongestSide, height: maxLongestSide})
                        } else {
                            //if video's size still = 0x0, rect's proportions will be 4:3
                            newRectSize = defaultDOMRect;
                        }

                        if(videoWidth != 0 && videoHeight != 0) newRectSize.height = newRectSize.height + 50;

                        var prevRow = rectsRows[rectsRows.length - 1];

                        //new row started - no rects in current row yet
                        if(currentRow.length == 0) {
                            //if it's very first rect. render it strictly in the center
                            if(rectsRows.length == 0) {
                                var x = centerX - (newRectSize.width / 2);
                                var y = centerY - (newRectSize.height / 2);
                                var domRect = new DOMRect(x, y, newRectSize.width, newRectSize.height);
                                currentRow.push(domRect);
                                prevRect = domRect;
                            } else {
                                let minY = Math.min.apply(Math, rectsRows[0].map(function(r) { return r.top; }));
                                let maxY = Math.max.apply(Math, rectsRows[rectsRows.length - 1].map(function(r) { return r.top + r.height;}));
                                let freeYRoom = (minY - containerRect.top) + ((containerRect.top + containerRect.height) - maxY);

                                if(freeYRoom >= (newRectSize.height + spaceBetween * 2)) {
                                    //if there is enough room for one more row, make new row AND align ALL rects vertically inside its parent
                                    var topPosition = maxY + spaceBetween;
                                    var newMaxY = topPosition + newRectSize.height;
                                    var newTopPosition = centerY - ((newMaxY - minY) / 2);
                                    if(newTopPosition <= spaceBetween) {
                                        newTopPosition = spaceBetween;
                                    }
                                    var moveAllRectsOn = minY - newTopPosition;

                                    for(var x in rectsRows) {

                                        var row = rectsRows[x];
                                        var s;
                                        for(s = 0; s < row.length; s++) {
                                            row[s].y = row[s].top - moveAllRectsOn;
                                        }
                                    }
                                    var domRect = new DOMRect(centerX - (newRectSize.width / 2), topPosition - moveAllRectsOn, newRectSize.width, newRectSize.height);
                                    prevRect = domRect;
                                    currentRow.push(domRect);
                                }
                            }
                        } else {
                            let minX = Math.min.apply(Math, currentRow.map(function (r) {
                                return r.left;
                            }));
                            let maxX = Math.max.apply(Math, currentRow.map(function (r) {
                                return r.left + r.width;
                            }));

                            let freeXRoom = (minX - containerRect.left) + ((containerRect.left + containerRect.width) - maxX);

                            //if threre is enough space in current row (horizontally), continue adding new rect to current row
                            if (freeXRoom >= (newRectSize.width + spaceBetween * 2)) {
                                var topOfSmallest = Math.max.apply(Math, currentRow.map(function (r) {return r.top;}));
                                var bottomOfSmallest = Math.min.apply(Math, currentRow.map(function (r) {return r.top + r.height;}));
                                var topPosition = (topOfSmallest + ((bottomOfSmallest - topOfSmallest) / 2)) - (newRectSize.height / 2)

                                //insert new rect centralized vertically relatively to current row
                                var domRect = new DOMRect(prevRect.left + (prevRect.width + spaceBetween), topPosition, newRectSize.width, newRectSize.height);
                                prevRect = domRect;
                                currentRow.push(domRect);

                                let minX = Math.min.apply(Math, currentRow.map(function (r) {return r.left;}));
                                let maxX = Math.max.apply(Math, currentRow.map(function (r) {return r.left + r.width;}));

                                var newLeftPosition = centerX - ((maxX - minX) / 2);
                                var moveAllRectsOn = minX - newLeftPosition;

                                //if current row intersects with previous top row, move current row lower
                                if (prevRow != null) {
                                    var maxYOfAllPrevRow = Math.max.apply(Math, prevRow.map(function (r) {
                                        return r.top + r.height;
                                    }));
                                    var minYOfAllCurRow = Math.min.apply(Math, currentRow.map(function (r) {
                                        return r.top;
                                    }));
                                    if (minYOfAllCurRow <= maxYOfAllPrevRow) {
                                        var topOfSmallest = Math.max.apply(Math, currentRow.map(function (r) {return r.top;}));
                                        var bottomOfSmallest = Math.min.apply(Math, currentRow.map(function (r) {return r.top + r.height;}));

                                        var x;
                                        var rowLength = currentRow.length;
                                        for (x = 0; x < rowLength; x++) {
                                            var topPosition = (topOfSmallest + ((bottomOfSmallest - topOfSmallest) / 2)) - (currentRow[x].height / 2) + (maxYOfAllPrevRow - minYOfAllCurRow) + spaceBetween
                                            currentRow[x].y = topPosition;

                                        }
                                    }
                                }

                                //centralize all rects in current row horizontally
                                for (var x in currentRow) {
                                    var newXPosition = currentRow[x].x - moveAllRectsOn;
                                    currentRow[x].x = newXPosition;
                                }
                            }
                        }


                        let allRects = []
                        let allRows = [...rectsRows, ...[currentRow]];
                        for(let x in allRows) {
                            for(let r in allRows[x]) {
                                allRects.push(allRows[x][r]);
                            }
                        }

                        minX = Math.min.apply(Math, currentRow.map(function (r) {return r.left;}));
                        maxX = Math.max.apply(Math, currentRow.map(function (r) {return r.left + r.width;}));
                        let freeXRoom = (minX - containerRect.left) + ((containerRect.left + containerRect.width) - maxX);
                        minY = Math.min.apply(Math, allRects.map(function(r) { return r.top; }));
                        maxY = Math.max.apply(Math, allRects.map(function(r) { return r.top + r.height;}));
                        let freeYRoom = (minY - containerRect.top) + ((containerRect.top + containerRect.height) - maxY);

                        if(i+1 != roomScreens.length && freeXRoom < (newRectSize.width + spaceBetween * 2) && freeYRoom < (newRectSize.height + spaceBetween * 2)){
                            // if there is no free room horizontally and vertically in parent container, move to next step - adding rects making parent container scrollable
                            nextAction = 'makeScrollable';
                            rectsRows.push(currentRow);
                            currentRow = [];
                            break;
                        } else if(i+1 == roomScreens.length || freeXRoom <= (newRectSize.width + spaceBetween * 2)){
                            // if there is no free room horizontally anymore AND there is free room vertically, insert new row
                            rectsRows.push(currentRow);
                            currentRow = [];
                        }
                    }

                    var rects = [];
                    var k, row;
                    for(k= 0; row = rectsRows[k]; k++) {
                        rects = rects.concat(row);
                    }
                    var minX = Math.min.apply(Math, rects.map(function(r) { return r.left; }));
                    var maxX = Math.max.apply(Math, rects.map(function(r) { return r.left + r.width;}));
                    var minY = Math.min.apply(Math, rects.map(function(r) { return r.top; }));
                    var maxY = Math.max.apply(Math, rects.map(function(r) { return r.top + r.height;}));

                    //if parent container doesn't have space for new rectangles, it will continue adding new rects to this container making it scrollable
                    if(nextAction == 'makeScrollable') {
                        //if aspect ratio is more than 2.5, put new rects to the right of container - it will create horizontal scrollbar
                        if(containerRect.width / containerRect.height >= 2.5) {

                            //align all rects by left side
                            if(minX > spaceBetween) {
                                let moveAllRectsOn = minX - spaceBetween;
                                for (let x in rectsRows) {
                                    let row = rectsRows[x];
                                    for (let s in row) {
                                        row[s].x = row[s].x - moveAllRectsOn;
                                    }
                                }
                            }

                            let currentCol = [];
                            for (i = i+1; i < count; i++) {
                                var screen = roomScreens[i];

                                var videoWidth = screen.videoTrackEl != null && screen.videoTrackEl.videoWidth != 0 ? screen.videoTrackEl.videoWidth : 0
                                var videoHeight = (screen.videoTrackEl != null && screen.videoTrackEl.videoHeight != 0 ? screen.videoTrackEl.videoHeight : 0);

                                //if video element has width and height, rect's proportions will be based on the size of video
                                var newRectSize = null;
                                if(videoWidth != 0 && videoHeight != 0) {
                                    newRectSize = getElementSizeKeepingRatio({
                                        width: videoWidth,
                                        height: videoHeight
                                    }, {width: maxLongestSide, height: maxLongestSide})
                                } else {
                                    //if video's size still = 0x0, rect's proportions will be 4:3
                                    newRectSize = defaultDOMRect;
                                }

                                if(videoWidth != 0 && videoHeight != 0) newRectSize.height = newRectSize.height + 50;

                                //new row started - no rects in current col yet
                                if(currentCol.length == 0) {
                                    //create first rectangle in col and align it vertically
                                    let minY = Math.min.apply(Math, rectsRows[0].map(function(r) { return r.top; }));
                                    let maxY = Math.max.apply(Math, rectsRows[rectsRows.length - 1].map(function(r) { return r.top + r.height;}));
                                    let freeYRoom = (minY - containerRect.top) + ((containerRect.top + containerRect.height) - maxY);

                                    let minX = Math.min.apply(Math, rectsRows[0].map(function (r) {return r.left;}));
                                    let maxX = Math.max.apply(Math, rectsRows[rectsRows.length - 1].map(function (r) {return r.left + r.width;}));
                                    let freeXRoom = (minX - containerRect.left) + ((containerRect.left + containerRect.width) - maxX);

                                    var domRect = new DOMRect(maxX + spaceBetween, centerY - (newRectSize.height / 2), newRectSize.width, newRectSize.height);
                                    currentCol.push(domRect);
                                    prevRect = domRect;


                                } else {
                                    let minY = Math.min.apply(Math, currentCol.map(function (r) {
                                        return r.top;
                                    }));
                                    let maxY = Math.max.apply(Math, currentCol.map(function (r) {
                                        return r.top + r.height;
                                    }));

                                    let freeYRoom = (minY - containerRect.top) + ((containerRect.top + containerRect.height) - maxY);

                                    //if threre is enough space in current col, continue adding new rect to current row
                                    if (freeYRoom >= (newRectSize.height + spaceBetween * 2)) {

                                        let topOfSmallest = Math.max.apply(Math, currentCol.map(function (r) {
                                            return r.top;
                                        }));
                                        let bottomOfSmallest = Math.min.apply(Math, currentCol.map(function (r) {
                                            return r.top + r.height;
                                        }));
                                        let topPosition = (topOfSmallest + ((bottomOfSmallest - topOfSmallest) / 2)) - (newRectSize.height / 2)

                                        let domRect = new DOMRect(prevRect.left, prevRect.top + (prevRect.height + spaceBetween), newRectSize.width, newRectSize.height);
                                        prevRect = domRect;
                                        currentCol.push(domRect);

                                        let minY = Math.min.apply(Math, currentCol.map(function (r) {
                                            return r.top;
                                        }));
                                        let maxY = Math.max.apply(Math, currentCol.map(function (r) {
                                            return r.top + r.height;
                                        }));


                                        let newTopPosition = centerY - ((maxY - minY) / 2);
                                        let moveAllRectsOn = minY - newTopPosition;

                                        //centralize all rects in current col
                                        for (let x in currentCol) {
                                            let newYPosition = currentCol[x].top - moveAllRectsOn;
                                            currentCol[x].y = newYPosition;
                                        }
                                    } else {
                                        //if there is no enogh space in current col, create new col and continue
                                        i = i - 1;
                                        rectsRows.push(currentCol);
                                        currentCol = [];
                                        continue;
                                    }
                                }

                                if(i+1 == roomScreens.length){
                                    rectsRows.push(currentCol);
                                    currentCol = [];
                                }

                            }
                        } else {
                            //if aspect ratio is less than 2.5, add new rects on the bottom - it will create vertical scrollbar

                            //align all rects to the top of parent container
                            if(minY > spaceBetween) {
                                let moveAllRectsOn = minY - spaceBetween;
                                for (let x in rectsRows) {
                                    let row = rectsRows[x];
                                    for (let s in row) {
                                        row[s].y = row[s].y - moveAllRectsOn;
                                    }
                                }
                            }

                            let currentRow = [];
                            for (i = i+1; i < count; i++) {
                                var screen = roomScreens[i];

                                let prevRow = rectsRows[rectsRows.length - 1];
                                var screenElRect = screen.screenEl.getBoundingClientRect();
                                var videoWidth = screen.videoTrackEl != null && screen.videoTrackEl.videoWidth != 0 ? screen.videoTrackEl.videoWidth : 0
                                var videoHeight = (screen.videoTrackEl != null && screen.videoTrackEl.videoHeight != 0 ? screen.videoTrackEl.videoHeight : 0);

                                //if video element has width and height, rect's proportions will be based on the size of video
                                var newRectSize = null;
                                if(videoWidth != 0 && videoHeight != 0) {

                                    newRectSize = getElementSizeKeepingRatio({
                                        width: videoWidth,
                                        height: videoHeight
                                    }, {width: maxLongestSide, height: maxLongestSide})
                                } else {
                                    //if video's size still = 0x0, rect's proportions will be 4:3
                                    newRectSize = defaultDOMRect;
                                }


                                if(videoWidth != 0 && videoHeight != 0) newRectSize.height = newRectSize.height + 50;

                                //new row started - no rects in current row yet
                                if(currentRow.length == 0) {
                                    //create first rectangle in current row and centralize it

                                    let minY = Math.min.apply(Math, rectsRows[0].map(function(r) { return r.top; }));
                                    let maxY = Math.max.apply(Math, rectsRows[rectsRows.length - 1].map(function(r) { return r.top + r.height;}));
                                    let freeYRoom = (minY - containerRect.top) + ((containerRect.top + containerRect.height) - maxY);

                                    let minX = Math.min.apply(Math, rectsRows[0].map(function (r) {return r.left;}));
                                    let maxX = Math.max.apply(Math, rectsRows[rectsRows.length - 1].map(function (r) {return r.left + r.width;}));
                                    let freeXRoom = (minX - containerRect.left) + ((containerRect.left + containerRect.width) - maxX);

                                    var domRect = new DOMRect(centerX - (newRectSize.width / 2), maxY + spaceBetween, newRectSize.width, newRectSize.height);
                                    currentRow.push(domRect);
                                    prevRect = domRect;
                                } else {
                                    let minX = Math.min.apply(Math, currentRow.map(function (r) {
                                        return r.left;
                                    }));
                                    let maxX = Math.max.apply(Math, currentRow.map(function (r) {
                                        return r.left + r.width;
                                    }));

                                    let freeXRoom = (minX - containerRect.left) + ((containerRect.left + containerRect.width) - maxX);

                                    //if threre is enough space in current row (horizontally), continue adding new rect to current row
                                    if (freeXRoom >= (newRectSize.height + spaceBetween * 2)) {

                                        let topOfSmallest = Math.max.apply(Math, currentRow.map(function (r) {
                                            return r.top;
                                        }));
                                        let bottomOfSmallest = Math.min.apply(Math, currentRow.map(function (r) {
                                            return r.top + r.height;
                                        }));
                                        let topPosition = (topOfSmallest + ((bottomOfSmallest - topOfSmallest) / 2)) - (newRectSize.height / 2)

                                        //insert new rect centralizad vertically relatively to current row
                                        let domRect = new DOMRect(prevRect.left + (prevRect.width + spaceBetween), topPosition , newRectSize.width, newRectSize.height);
                                        prevRect = domRect;
                                        currentRow.push(domRect);

                                        let minX = Math.min.apply(Math, currentRow.map(function (r) {
                                            return r.left;
                                        }));
                                        let maxX = Math.max.apply(Math, currentRow.map(function (r) {
                                            return r.left + r.width;
                                        }));

                                        //if current row intersects with previous top row, move current row lower
                                        if (prevRow != null) {
                                            let maxYOfAllPrevRow = Math.max.apply(Math, prevRow.map(function (r) {
                                                return r.top + r.height;
                                            }));
                                            let minYOfAllCurRow = Math.min.apply(Math, currentRow.map(function (r) {
                                                return r.top;
                                            }));
                                            if (minYOfAllCurRow <= maxYOfAllPrevRow) {
                                                let topOfSmallest = Math.max.apply(Math, currentRow.map(function (r) {return r.top;}));
                                                let bottomOfSmallest = Math.min.apply(Math, currentRow.map(function (r) {return r.top + r.height;}));

                                                let x;
                                                let rowLength = currentRow.length;
                                                for (x = 0; x < rowLength; x++) {
                                                    let topPosition = (topOfSmallest + ((bottomOfSmallest - topOfSmallest) / 2)) - (currentRow[x].height / 2) + (maxYOfAllPrevRow - minYOfAllCurRow) + spaceBetween
                                                    currentRow[x].y = topPosition;

                                                }
                                            }
                                        }

                                        let newLeftPosition = centerX - ((maxX - minX) / 2);
                                        let moveAllRectsOn = minX - newLeftPosition;

                                        //centralize all rects in current row horizontally
                                        for (let x in currentRow) {
                                            currentRow[x].x = currentRow[x].left - moveAllRectsOn;
                                        }
                                    } else {
                                        //if there is no enough space in current row, create new row below
                                        i = i - 1;
                                        rectsRows.push(currentRow);
                                        currentRow = [];
                                        continue;
                                    }
                                }

                                if(i+1 == roomScreens.length){
                                    rectsRows.push(currentRow);
                                    currentRow = [];
                                }
                            }
                        }
                    }

                    var rects = [];
                    var i, row;
                    for(i = 0; row = rectsRows[i]; i++) {
                        rects = rects.concat(row);
                    }

                    return rects;
                },

                /**
                 * Prepare data for animated changing view mode to audio layout
                 * @method audioScreensGrid
                 * @param {Object} [container] HTML parent element participants' screens.
                 * @return {Array} List of DOMRects that will be passed to Q.layout.
                 */
                audioScreensGrid: function (container, roomScreens) {
                    var parentRect = container == document.body ? new DOMRect(0, 0, window.innerWidth, window.innerHeight) : container.getBoundingClientRect();
                    var count = roomScreens.length;
                    if(count == 0 || parentRect == 0 || parentRect.height == 0) return false;
                    var rects = [];

                    //var mainRadius = Math.min(size.parentWidth, size.parentHeight);

                    var centerX = parentRect.width / 2;
                    var centerY = parentRect.height / 2;
                    var spaceBetween = 15;

                    var ratio = parentRect.width / parentRect.height;
                    var isRatherNotMobile = parentRect.width < 360 || parentRect.height < 360;

                    if(ratio > 4.2 || (isRatherNotMobile && ratio > 3.8)) {
                        var rectHeight = (parentRect.height / 100  * 80) + 19;
                        if(rectHeight > parentRect.height) rectHeight = parentRect.height - 5;
                        var rectWidth = rectHeight - 19;
                        var spaceBetween = 15;
                        var startFrom  = (parentRect.width / 2) - ((rectWidth * count) + (spaceBetween * count)) / 2;
                        var prevRect = new DOMRect(startFrom, 0, 0, 0);
                        for ( var i=0; i<=count; i++ ) {
                            let x = prevRect.x + prevRect.width + spaceBetween;
                            let y = (parentRect.height / 2) - (rectHeight / 2);
                            let newRect = new DOMRect(x, y, rectWidth, rectHeight);
                            rects.push(newRect);
                            prevRect = newRect;
                        }

                        return rects;
                    } else  if(isRatherNotMobile && ratio < 0.40) {
                        var rectWidth = parentRect.width / 100  * 70;
                        var rectHeight = rectWidth + 19; //19 - height of "name" element
                        var spaceBetween = 10;
                        var startFrom  = (parentRect.height / 2) - ((rectHeight * count) + (spaceBetween * count)) / 2;

                        var prevRect = new DOMRect(0, startFrom, 0, 0);
                        for ( var i=0; i<=count; i++ ) {
                            let x = (parentRect.width / 2) - (rectWidth / 2);
                            let y = prevRect.y + prevRect.height + spaceBetween;
                            let newRect = new DOMRect(x, y, rectWidth, rectHeight);
                            rects.push(newRect);
                            prevRect = newRect;
                        }

                        return rects;
                    } else if(count === 1) {
                        var basicSize = Math.min(parentRect.width, parentRect.height)
                        var maxSize = basicSize / 100  * 70;
                        var rectWidth = maxSize > 150 ? 150 : maxSize;
                        var rectHeight = rectWidth + 19;
                        let x = (parentRect.width / 2) - (rectWidth / 2);
                        let y = (parentRect.height / 2) - (rectHeight / 2);
                        let newRect = new DOMRect(x, y, rectWidth, rectHeight);
                        rects.push(newRect);
                        return rects;
                    }

                    function stepSize() {
                        //return Math.PI/48 + Math.PI/36;
                        return  Math.PI/count;
                    }

                    function calculateSide( n , r)
                    {
                        var theta, theta_in_radians;

                        theta = 360 / n;
                        theta_in_radians = theta * Math.PI / 180;

                        return 2 * r * Math.sin(theta_in_radians / 2);
                    }

                    function radCircle(lRad, rRad) {

                        var mainRadius = _layoutTool.mainCircleRadius;
                        var x = centerX + mainRadius * Math.sin(lRad);
                        var y = centerY - mainRadius * Math.cos(lRad);
                        var r = rRad * Math.PI/3 * mainRadius * 0.95;
                        var sideLength  = calculateSide(count, mainRadius);
                        //var sideLength = 2*(mainRadius*Math.cos(radians))


                        if (count > 1 && r > (sideLength / 2)) r = sideLength / 2;
                        if (r > mainRadius) r = mainRadius;
                        r = r - spaceBetween

                        var layoutRect = new DOMRect(x - r, y - r, r*2, r*2);
                        rects.push(layoutRect);
                        return layoutRect;
                    }

                    var firstStep = 0, rad = 0, step = 0;
                    firstStep = step = stepSize();

                    if(count == 2 && Q.info.isMobile) {

                    } else {
                        var totalSteps = ((step*(count-1))*2)/2;
                        rad = -totalSteps;
                    }


                    var minSide = Math.min(parentRect.width, parentRect.height);

                    /*if(!Q.info.isMobile && count <= 2) {
                        if(!_layoutTool.mainCircleRadius || _layoutTool.mainCircleRadius > 120) _layoutTool.mainCircleRadius = 120;
                    } else if(Q.info.isMobile && count > 2 && count <= 4) {
                        if(!_layoutTool.mainCircleRadius || _layoutTool.mainCircleRadius > 150) _layoutTool.mainCircleRadius = 150;
                    }*/

                    if(_layoutTool.mainCircleRadius == null || _layoutTool.mainCircleRadius > minSide / 2) {
                        _layoutTool.mainCircleRadius = minSide / 4;
                    }



                    for ( var i=0; i<=count; i++ ) {
                        var newRect = radCircle(rad, step);

                        var twentyPercent = ((newRect.width / 2) / 100 * 20);

                        if(spaceBetween > twentyPercent) {

                            if( _layoutTool.mainCircleRadius + twentyPercent * count < (minSide / 2) - (newRect.width / 2) ) {
                                _layoutTool.mainCircleRadius += twentyPercent * count;
                                return this.audioScreensGrid(container, roomScreens)
                            }
                        } else if ((_layoutTool.mainCircleRadius + (newRect.width / 2)) * 2 >= minSide) {
                            var diff = (_layoutTool.mainCircleRadius + (newRect.width / 2)) * 2 - minSide
                            _layoutTool.mainCircleRadius = _layoutTool.mainCircleRadius - (diff / 2);

                            return this.audioScreensGrid(container, roomScreens);
                        }

                        rad += step;

                        var radLeft = Math.PI*2 - rad;

                        if ( radLeft < firstStep ) {
                            //break;
                        } else {
                            step = stepSize();

                            /*let nextRadleft = Math.PI*2 - step
                            if ( nextRadleft < firstStep ) {
                                //break;
                            }*/
                        }

                        rad += step;
                    }

                    return rects;
                },

                /**
                 * Prepare data for animated changing view mode to manual. It will add
                 * @method manualScreensGrid
                 * @param {Object} [container] HTML parent element participants' screens.
                 * @return {Array} List of DOMRects that will be passed to Q.layout.
                 */
                manualScreensGrid: function (container, roomScreens) {

                    var containerRect = container == document.body ? new DOMRect(0, 0, window.innerWidth, window.innerHeight) : container.getBoundingClientRect();
                    var layoutRects = [];
                    var parentWidth = containerRect.width;
                    var parentHeight = containerRect.height;
                    var centerX = containerRect.width / 2;
                    var centerY = containerRect.height / 2;

                    var count = roomScreens.length;
                    var i;
                    for (i = 0; i < count; i++) {
                        let screen = roomScreens[i];

                        let mappedRects = _layoutTool.state.currentMappedRects;
                        let screenExists = false;
                        for (let r in mappedRects) {
                            if(screen.screenEl == mappedRects[r].el) {
                                layoutRects.push(screen.screenEl.getBoundingClientRect());
                                screenExists = true;
                                break;
                            }
                        }

                        var videoWidth = screen.videoTrackEl != null && screen.videoTrackEl.videoWidth != 0 ? screen.videoTrackEl.videoWidth : 0
                        var videoHeight = (screen.videoTrackEl != null && screen.videoTrackEl.videoHeight != 0 ? screen.videoTrackEl.videoHeight : 0);


                        if(!screenExists) {
                            var newRectSize = null;

                            newRectSize = getElementSizeKeepingRatio({
                                width: videoWidth,
                                height: videoHeight
                            }, {width: 250, height: 250})

                            var rect = new DOMRect(centerX - (newRectSize.width / 2), centerY - (newRectSize.height / 2), newRectSize.width, newRectSize.height);
                            if (videoWidth != 0 && videoHeight != 0) rect.height = newRectSize.height + 50;
                            moveScreenFront.call(screen.screenEl);
                            layoutRects.push(rect);

                        }
                    }

                    return layoutRects;
                },

                /**
                 * Prepare data (rectangles) for animated changing view mode to maximized/minimized.
                 * @method minimizedOrMaximizedScreenGrid
                 * @param {Object} [container] HTML parent element participants' screens.
                 * @param {Integer} [count] number of screens to render.
                 * @param {Object} [elementToWrap] HTML element that will be wrapped by minimized screens.
                 * @param {Boolean} [maximized] Render maximized view mode.
                 * @return {Array} List of DOMRects that will be passed to Q.layout.
                 */
                minimizedOrMaximizedScreenGrid: function minimizedOrMaximizedScreenGrid(container, count, elementToWrap, maximized) {
                    log('minimizedOrMaximizedScreenGrid', container, count, _layoutTool.currentRects.length)
                    var wrapElement = elementToWrap;
                    var elementToWrap = elementToWrap.getBoundingClientRect();

                    if(roomScreens.length == 0) return;
                    var rebuild;

                    var prevElPos = _layoutTool.elementToWrapPosition;

                    if((prevElPos != null && (elementToWrap.top != prevElPos.top || elementToWrap.left != prevElPos.left))
                        || (_layoutTool.state.currentGenerator != 'maximizedScreensGrid' && _layoutTool.state.currentGenerator != 'minimizedScreensGrid')) {
                        _layoutTool.currentRects = [];
                        _layoutTool.state.currentMappedRects = [];
                        rebuild = true;
                    }
                    _layoutTool.elementToWrapPosition = elementToWrap;

                    var rectWidth = 90;
                    var rectHeight = 90;
                    var spaceBetween = 10;
                    var defaultSide = 'top-full';

                    var containerRect = container.getBoundingClientRect();
                    var parentWidth = containerRect.width;
                    var parentHeight = containerRect.height;

                    if(!maximized) {
                        _layoutTool.state.currentGenerator = 'minimizedScreensGrid';
                    } else {
                        _layoutTool.state.currentGenerator = 'maximizedScreensGrid';
                    }

                    if(_layoutTool.basicGridRects.length < count || rebuild) {
                        _layoutTool.basicGridRects = build(container, count, elementToWrap, maximized);
                    }

                    if(_layoutTool.currentRects.length == 0 || rebuild) {
                        _layoutTool.currentRects = build(container, count, elementToWrap, maximized);
                    } else {

                        if(count > _layoutTool.currentRects.length) {
                            var availableRects = addAndUpdate(container, count, elementToWrap, maximized);
                            _layoutTool.currentRects = _layoutTool.currentRects.concat(availableRects);

                        } else if(count < _layoutTool.currentRects.length) {
                            _layoutTool.currentRects = removeAndUpdate(container, count, elementToWrap, maximized);
                        }
                    }

                    if(maximized || (activeScreen != null && maximized != false)) {
                        _layoutTool.currentRects = maximizeScreen();
                    } else if(!maximized) {
                        _layoutTool.currentRects = minimizeScreen();
                    }


                    log('minimizedOrMaximizedScreenGrid: _layoutTool.currentRects', _layoutTool.currentRects)

                    return  _layoutTool.currentRects;

                    function getControlsAlign() {

                        //let intersect = (elementToWrap.top < containerRect.bottom && (elementToWrap.left < containerRect.right || elementToWrap.right > containerRect.left)) ||
                        //    (elementToWrap.bottom > containerRect.top && (elementToWrap.left < containerRect.right || elementToWrap.right > containerRect.left));

                        let intersectsEnough;
                        if(intersects(containerRect, elementToWrap)) {
                            if((elementToWrap.top < containerRect.bottom && elementToWrap.bottom >= containerRect.bottom && containerRect.bottom - elementToWrap.top >= spaceBetween) ||
                                (elementToWrap.top > containerRect.top && elementToWrap.bottom < containerRect.bottom) ||
                                (elementToWrap.bottom > containerRect.top && elementToWrap.top <= containerRect.top && elementToWrap.bottom - containerRect.top >= spaceBetween)) {
                                intersectsEnough = true;
                            }
                        }

                        if(!document.body.contains(wrapElement) || !intersectsEnough) return defaultSide;
                        //var containerRect = container == document.body ? new DOMRect(0, 0, window.innerWidth, window.innerHeight) : container.getBoundingClientRect();
                        var parentHeight = containerRect.height;

                        if(wrapElement.classList.contains('Q_resize_snapped_left') && (elementToWrap.top - containerRect.top) < parentHeight / 2) {
                            return 'topleft';
                        } else if(wrapElement.classList.contains('Q_resize_snapped_left') && (elementToWrap.top - containerRect.top) >= parentHeight / 2) {
                            return 'bottomleft';
                        } else if(wrapElement.classList.contains('Q_resize_snapped_right') && (elementToWrap.top - containerRect.top) < parentHeight / 2) {
                            return 'topright';
                        } else if(wrapElement.classList.contains('Q_resize_snapped_right') && (elementToWrap.top - containerRect.top) >= parentHeight / 2) {
                            return 'bottomright';
                        } else if(wrapElement.classList.contains('Q_resize_snapped_top')) {
                            return 'top';
                        } else if(wrapElement.classList.contains('Q_resize_snapped_bottom')) {
                            return 'bottom';
                        } else {
                            return 'bottom';
                        }
                    }

                    function intersects(r1, r2) {
                        return !(r2.left > r1.right ||
                            r2.right < r1.left ||
                            r2.top > r1.bottom ||
                            r2.bottom < r1.top);
                    }

                    function maximizeScreen(){
                        log('minimizedOrMaximizedScreenGrid: maximizeScreen', JSON.stringify(_layoutTool.currentRects))

                        var indexToMaximize;

                        for(let s in roomScreens) {
                            if(activeScreen == roomScreens[s]) {
                                indexToMaximize = s;
                                break;
                            }
                        }
                        log('minimizedOrMaximizedScreenGrid: maximizeScreen: indexToMaximize', indexToMaximize)


                        var currentMaximizedIndex;
                        if(_layoutTool.maximizedScreen != null) {
                            for(let s in roomScreens) {
                                if(_layoutTool.maximizedScreen == roomScreens[s]) {
                                    currentMaximizedIndex = s;
                                    break;
                                }
                            }
                        }

                        log('minimizedOrMaximizedScreenGrid: maximizeScreen: currentMaximizedIndex', currentMaximizedIndex)


                        var align = getControlsAlign();

                        if(activeScreenRect != null) {
                            log('minimizedOrMaximizedScreenGrid: maximizeScreen: if1', JSON.stringify(activeScreenRect));

                            var rectsToTakeInc = _layoutTool.currentRects.filter(function(r, i){
                                return (r.x == activeScreenRect.x && r.y == activeScreenRect.y
                                && r.width == activeScreenRect.width && r.height == activeScreenRect.height ? false : true)
                            });
                            var minY = Math.min.apply(Math, rectsToTakeInc.map(function(o) { return o.y; }));
                            var maxY = Math.max.apply(Math, rectsToTakeInc.map(function(o) { return o.y + o.height; }));
                        } else {
                            log('minimizedOrMaximizedScreenGrid: maximizeScreen: if2');
                            var minY = Math.min.apply(Math, _layoutTool.currentRects.map(function(o) { return o.y; }));
                            var maxY = Math.max.apply(Math, _layoutTool.currentRects.map(function(o) { return o.y + o.height; }));
                        }


                        var y, baseHeight;
                        if(align == 'bottom' || align == 'bottomleft' || align == 'bottomright' || align == 'bottom-full') {
                            baseHeight = (minY - spaceBetween) - 50;
                        } else if (align == 'top' || align == 'topleft' || align == 'topright' || align == 'top-full') {
                            baseHeight = parentHeight - (maxY + spaceBetween) - 50;
                        }
                        var videoWidth = typeof activeScreen != 'undefined' && activeScreen.videoTrackEl != null && activeScreen.videoTrackEl.videoWidth != 0 ? activeScreen.videoTrackEl.videoWidth : 480;
                        var videoHeight = typeof activeScreen != 'undefined' && activeScreen.videoTrackEl != null && activeScreen.videoTrackEl.videoHeight != 0 ? activeScreen.videoTrackEl.videoHeight : 270;

                        var mainScreenSize = getElementSizeKeepingRatio({
                            width: videoWidth,
                            height: videoHeight
                        }, {width: parentWidth / 100 * 90, height: Math.min(baseHeight - 50, ((parentHeight - (align == 'top' || align == 'bottom' ? elementToWrap.height : spaceBetween)) / 100 * 90) - 50)})
                        mainScreenSize.height = mainScreenSize.height + 50;
                        log('minimizedOrMaximizedScreenGrid: maximizeScreen: mainScreenSize', mainScreenSize);

                        if(align == 'bottom' || align == 'bottomleft' || align == 'bottomright' || align == 'bottom-full') {
                            if(align == 'bottom') minY = count > 1 ? minY : parentHeight - elementToWrap.height;
                            y = (minY / 2) - mainScreenSize.height / 2;
                        } else if (align == 'top' || align == 'topleft' || align == 'topright' || align == 'top-full') {
                            y = ((parentHeight - maxY) / 2) - (mainScreenSize.height / 2) + maxY;
                        }

                        var maximizedRect = new DOMRect((parentWidth / 2) - mainScreenSize.width / 2, y, mainScreenSize.width, mainScreenSize.height);

                        if(indexToMaximize) {
                            log('minimizedOrMaximizedScreenGrid: maximizeScreen: if3');

                            var minimizedRect = _layoutTool.currentRects[indexToMaximize];

                            minimizedRect = new DOMRect(minimizedRect.x, minimizedRect.y, minimizedRect.width, minimizedRect.height);
                            _layoutTool.currentRects[indexToMaximize].x = maximizedRect.x;
                            _layoutTool.currentRects[indexToMaximize].y = maximizedRect.y;
                            _layoutTool.currentRects[indexToMaximize].width = maximizedRect.width;
                            _layoutTool.currentRects[indexToMaximize].height = maximizedRect.height;

                            activeScreenRect = _layoutTool.currentRects[indexToMaximize];
                        }

                        log('minimizedOrMaximizedScreenGrid: maximizeScreen: before if4', JSON.stringify(_layoutTool.currentRects));
                        log('minimizedOrMaximizedScreenGrid: maximizeScreen: before if4 minimizedRect', minimizedRect);
                        log('minimizedOrMaximizedScreenGrid: maximizeScreen: before if4 id', !currentMaximizedIndex, indexToMaximize != null, currentMaximizedIndex == indexToMaximize);

                        /*if(!currentMaximizedIndex && indexToMaximize || currentMaximizedIndex == indexToMaximize) {
                            log('minimizedOrMaximizedScreenGrid: maximizeScreen: if4');

                            if(_layoutTool.currentRects.length == 3 && roomScreens[1] == activeScreen) {
                                log('minimizedOrMaximizedScreenGrid: maximizeScreen: if4.1');

                                _layoutTool.currentRects[2].x = minimizedRect.x;
                                _layoutTool.currentRects[2].y = minimizedRect.y;
                                _layoutTool.currentRects[2].width = minimizedRect.width;
                                _layoutTool.currentRects[2].height = minimizedRect.height;
                            }
                        }*/

                        log('minimizedOrMaximizedScreenGrid: maximizeScreen: before if5', currentMaximizedIndex, currentMaximizedIndex != indexToMaximize);

                        if(currentMaximizedIndex && currentMaximizedIndex != indexToMaximize) {
                            log('minimizedOrMaximizedScreenGrid: maximizeScreen: if5');

                            _layoutTool.currentRects[currentMaximizedIndex].x = minimizedRect.x;
                            _layoutTool.currentRects[currentMaximizedIndex].y = minimizedRect.y;
                            _layoutTool.currentRects[currentMaximizedIndex].width = minimizedRect.width;
                            _layoutTool.currentRects[currentMaximizedIndex].height = minimizedRect.height;
                        } else {
                            log('minimizedOrMaximizedScreenGrid: maximizeScreen: if6');

                            _layoutTool.currentRects = fillFreeSpaceWithClosestRects(minimizedRect, _layoutTool.currentRects, (activeScreenRect ? [activeScreenRect] : null))
                        }

                        _layoutTool.maximizedScreen = activeScreen;

                        return _layoutTool.currentRects;
                    }

                    function minimizeScreen(){
                        log('minimizedOrMaximizedScreenGrid: minimizeScreen')

                        var currentMaximizedIndex;
                        if(_layoutTool.maximizedScreen != null) {
                            for (var s in roomScreens) {
                                if (_layoutTool.maximizedScreen == roomScreens[s]) {
                                    currentMaximizedIndex = parseInt(s, 10);
                                    break;
                                }
                            }
                        }

                        var count = _layoutTool.currentRects.length + 1
                        var rect = addAndUpdate(container, count, elementToWrap, maximized);
                        _layoutTool.currentRects[currentMaximizedIndex] = new DOMRect(rect[0].x, rect[0].y, rect[0].width, rect[0].height);
                        activeScreenRect = activeScreen = _layoutTool.maximizedScreen = null

                        return _layoutTool.currentRects;
                    }

                    function getRectsGridParams(wrapElPosition) {
                        log('minimizedOrMaximizedScreenGrid: getRectsGridParams')
                        var rectsPerRow =  Math.floor(parentWidth / (rectWidth + spaceBetween));

                        var rectsOnLeftSide, rectsOnRightSide, numOfRowsAlongWrapEl
                        if(wrapElPosition == 'bottom' || wrapElPosition == 'top') {
                            rectsOnLeftSide = Math.floor((elementToWrap.left - containerRect.left) / (rectWidth + spaceBetween));
                            rectsOnRightSide = Math.floor((containerRect.right - elementToWrap.right) / (rectWidth + spaceBetween));
                            //numOfRowsAlongWrapEl = Math.floor((elementToWrap.top + spaceBetween) / (rectWidth + spaceBetween));
                            if(rectsOnLeftSide < 0) rectsOnLeftSide = 0;
                            if(rectsOnRightSide < 0) rectsOnRightSide = 0;

                            if (wrapElPosition == 'bottom') {
                                let num = (containerRect.top + containerRect.height - elementToWrap.top) / (rectHeight + spaceBetween);
                                numOfRowsAlongWrapEl = num > 0 && num < 0.5 ? 1 : Math.ceil(num);
                            } else if (wrapElPosition == 'top') {
                                let num = (elementToWrap.bottom - containerRect.top) / (rectHeight + spaceBetween);
                                numOfRowsAlongWrapEl = num > 0 && num < 0.5 ? 1 : Math.ceil(num);
                            }
                        } else if(wrapElPosition == 'bottomleft' || wrapElPosition == 'bottomright') {
                            //rectsOnLeftSide = rectsOnRightSide =  Math.floor(rectsPerRow / 2);
                            //numOfRowsAlongWrapEl = Math.floor(parentHeight / (rectHeight + spaceBetween));
                            rectsOnLeftSide = rectsOnRightSide = numOfRowsAlongWrapEl = 0;
                        } else if(wrapElPosition == 'topleft' || wrapElPosition == 'topright') {
                            //rectsOnLeftSide = rectsOnRightSide = Math.floor(rectsPerRow / 2);
                            //numOfRowsAlongWrapEl = Math.floor(parentHeight / (rectHeight + spaceBetween));
                            rectsOnLeftSide = rectsOnRightSide = numOfRowsAlongWrapEl = 0;
                        } else {
                            rectsOnLeftSide = rectsOnRightSide = numOfRowsAlongWrapEl = 0;
                        }


                        return {
                            rectsOnLeftSide: rectsOnLeftSide,
                            rectsOnRightSide: rectsOnRightSide,
                            numOfRowsAlongWrapEl: numOfRowsAlongWrapEl,
                            rectsPerRow: rectsPerRow
                        }
                    }

                    function build(container, count, elementToWrap, maximized) {
                        log('minimizedOrMaximizedScreenGrid: build')
                        //var containerRect = container == document.body ? new DOMRect(0, 0, window.innerWidth, window.innerHeight) : container.getBoundingClientRect();
                        var parentWidth = containerRect.width;
                        var parentHeight = containerRect.height;

                        var align = getControlsAlign();

                        var rectWidth = 90;
                        var rectHeight = 90;
                        var spaceBetween = 10;
                        var gridParams = getRectsGridParams(align);
                        var rectsOnLeftSide = gridParams.rectsOnLeftSide;
                        var rectsOnRightSide = gridParams.rectsOnRightSide;
                        var numOfRowsAlongWrapEl = gridParams.numOfRowsAlongWrapEl;
                        var perRow = gridParams.rectsPerRow;

                        //if(numOfRowsAlongWrapEl == 0 && (rectsOnLeftSide != 0 || rectsOnRightSide != 0)) numOfRowsAlongWrapEl = 1;
                        var totalRectsOnSides = numOfRowsAlongWrapEl == 0 ? 0 : (rectsOnLeftSide * numOfRowsAlongWrapEl) + (rectsOnRightSide * numOfRowsAlongWrapEl);

                        if(count < totalRectsOnSides) totalRectsOnSides = count;

                        var rects = [];
                        var currentRowRects = [];

                        /*if(maximized) {
                            count = totalRectsOnSides = count - 1;
                        }*/

                        if(align == 'top' || align == 'bottom') {
                            var isNextNewLast = false;
                            var startFrom, side;
                            startFrom = side = rectsOnRightSide != 0 ? 'right' : 'left';
                            var rowItemCounter = 1;
                            var leftSideCounter = 0;
                            var rightSideCounter = 0;
                            var createNewRowOnLeft = false;
                            var createNewRowOnRight = false;
                            var i, x, y, prevRect, latestLeftRect, latestRightRect;
                            for (i = 0; i < totalRectsOnSides; i++) {
                                log('build totalRectsOnSides for')

                                if (side == "right") {
                                    log('build totalRectsOnSides for right')

                                    if (latestRightRect) prevRect = latestRightRect
                                    if (rightSideCounter >= 1) {
                                        y = prevRect.y;
                                        x = prevRect.x + (rectWidth + spaceBetween);

                                    } else if (createNewRowOnRight) {

                                        if (align == 'bottom' || align == 'bottomleft' || align == 'bottomright') {
                                            y = prevRect.y - (rectHeight + spaceBetween);
                                        } else if (align == 'top' || align == 'topleft' || align == 'topright') {
                                            y = prevRect.y + prevRect.height + spaceBetween;
                                        }

                                        if (align == 'bottomleft' || align == 'bottomright' || align == 'topleft' || align == 'topright') {
                                            x = startFrom == 'right' ? parentWidth / 2 - rectWidth / 2 : latestLeftRect.left + rectWidth + spaceBetween;
                                        } else {
                                            var allRects = currentRowRects;
                                            for (var a in rects) {
                                                allRects = allRects.concat(rects[a]);
                                            }
                                            x = allRects.filter(function (rect) {
                                                return rect.side == 'right';
                                            }).reduce(function (prev, current) {
                                                return (prev.rect.x < current.rect.x) ? prev : current;
                                            }).rect.x
                                        }

                                        createNewRowOnRight = false;
                                    } else {

                                        if (align == 'bottom' || align == 'bottomleft' || align == 'bottomright') {
                                            y = parentHeight - (rectHeight + spaceBetween);
                                        } else if (align == 'top' || align == 'topleft' || align == 'topright') {
                                            y = spaceBetween;
                                        }

                                        if (align == 'bottomleft' || align == 'bottomright' || align == 'topleft' || align == 'topright') {
                                            x = startFrom == 'right' ? parentWidth / 2 - rectWidth / 2 : latestLeftRect.left + rectWidth + spaceBetween;
                                        } else {
                                            x = ((elementToWrap.left - containerRect.left) + elementToWrap.width + spaceBetween);
                                        }

                                    }

                                    rightSideCounter++;

                                    if (rightSideCounter == rectsOnRightSide) {
                                        log('build totalRectsOnSides for createNewRowOnRight')

                                        createNewRowOnRight = true;
                                        rightSideCounter = 0;
                                    }
                                    if (rectsOnLeftSide != 0) {
                                        log('build totalRectsOnSides for right next', rightSideCounter, createNewRowOnRight, (createNewRowOnLeft && createNewRowOnRight), (createNewRowOnLeft && rightSideCounter > 1 && !createNewRowOnRight))

                                        if (rectsOnLeftSide == rectsOnRightSide) {
                                            side = 'left';
                                            log('build totalRectsOnSides for left next 0')

                                        } else if (rectsOnLeftSide != rectsOnRightSide) {
                                            if ((!createNewRowOnLeft && !createNewRowOnRight)
                                                || (createNewRowOnRight && !createNewRowOnLeft)
                                                || (createNewRowOnLeft && createNewRowOnRight && (rectsOnRightSide == 1 || rectsOnLeftSide == 1))) {
                                                side = 'left';
                                                log('build totalRectsOnSides for left next 1')

                                            } else if ((createNewRowOnLeft && createNewRowOnRight) || (createNewRowOnLeft && rightSideCounter > 1 && !createNewRowOnRight)) {
                                                side = 'right';
                                                log('build totalRectsOnSides for left next 2')
                                            }
                                        }
                                    }

                                    var rect = latestRightRect = new DOMRect(x, y, rectWidth, rectHeight);
                                    currentRowRects.push({side: 'right', rect: rect});
                                } else if (side == "left") {
                                    log('build totalRectsOnSides for left')
                                    if (latestLeftRect) prevRect = latestLeftRect;

                                    if (leftSideCounter >= 1) {

                                        y = prevRect.y;
                                        x = prevRect.x - (rectWidth + spaceBetween);

                                    } else if (createNewRowOnLeft) {
                                        if (align == 'bottom' || align == 'bottomleft' || align == 'bottomright') {
                                            y = prevRect.y - (rectHeight + spaceBetween);
                                        } else if (align == 'top' || align == 'topleft' || align == 'topright') {
                                            y = prevRect.y + (rectHeight + spaceBetween);
                                        }

                                        if (align == 'bottomleft' || align == 'bottomright' || align == 'topleft' || align == 'topright') {
                                            x = startFrom == 'left' ? parentWidth / 2 - rectWidth / 2 : latestRightRect.left - rectWidth - spaceBetween;
                                        } else {
                                            var allRects = currentRowRects;
                                            for (var a in rects) {
                                                allRects = allRects.concat(rects[a]);
                                            }
                                            x = allRects.filter(function (rect) {
                                                return rect.side == 'left';
                                            }).reduce(function (prev, current) {
                                                return (prev.rect.x > current.rect.x) ? prev : current;
                                            }).rect.x;
                                        }

                                        createNewRowOnLeft = false;
                                    } else {
                                        if (align == 'bottom' || align == 'bottomleft' || align == 'bottomright') {
                                            y = parentHeight - (rectHeight + spaceBetween);
                                        } else if (align == 'top' || align == 'topleft' || align == 'topright') {
                                            y = spaceBetween;
                                        }

                                        if (align == 'bottomleft' || align == 'bottomright' || align == 'topleft' || align == 'topright') {
                                            x = startFrom == 'left' ? parentWidth / 2 - rectWidth / 2 : latestRightRect.left - rectWidth - spaceBetween;
                                        } else {
                                            x = ((elementToWrap.left - containerRect.left) - (rectWidth + spaceBetween));
                                        }
                                    }

                                    leftSideCounter++;

                                    if (leftSideCounter == rectsOnLeftSide) {
                                        createNewRowOnLeft = true;
                                        leftSideCounter = 0;
                                    }

                                    if (rectsOnRightSide != 0) {
                                        if (rectsOnLeftSide == rectsOnRightSide) {
                                            side = 'right';
                                        } else if (rectsOnLeftSide != rectsOnRightSide) {
                                            if (createNewRowOnRight && !createNewRowOnLeft) {
                                                side = 'left';
                                            } else if ((!createNewRowOnLeft && !createNewRowOnRight) ||
                                                (createNewRowOnLeft && createNewRowOnRight) ||
                                                (createNewRowOnLeft && !createNewRowOnRight) ||
                                                (createNewRowOnLeft && createNewRowOnRight && rectsOnLeftSide == 1)) {
                                                side = 'right';
                                            }
                                        }
                                    }

                                    var rect = latestLeftRect = new DOMRect(x, y, rectWidth, rectHeight);
                                    currentRowRects.push({side: 'left', rect: rect});
                                }

                                if (i == perRow - 1 || i == totalRectsOnSides - 1) {
                                    rects.push(currentRowRects);
                                    currentRowRects = [];
                                }

                                count = count - 1;
                            }
                        }

                        if(align == 'bottomleft' || align == 'bottomright' || align == 'topleft' || align == 'topright') {

                            for(var i in rects){
                                var currentRowRects = rects[i];
                                var minX = Math.min.apply(Math, currentRowRects.map(function(o) { return o.rect.x; }));
                                var maxX = Math.max.apply(Math, currentRowRects.map(function(o) { return o.rect.x+o.rect.width; }));

                                var rowWidth = maxX - minX;

                                var newMinX = parentWidth / 2 - rowWidth / 2;

                                var fixOn = Math.abs(minX - newMinX);
                                for (var r = 0; r < currentRowRects.length; r++) {
                                    if(minX > parentWidth - maxX) {
                                        currentRowRects[r].rect.x = currentRowRects[r].rect.x - fixOn;
                                    } else {
                                        currentRowRects[r].rect.x = currentRowRects[r].rect.x + fixOn;
                                    }
                                }
                            }

                        }

                        var arr = [];
                        for(var i in rects){
                            arr = arr.concat(rects[i]);
                        }
                        rects = arr;

                        var minX, maxX, minY, maxY;

                        if(align == 'bottom' || align == 'top') {
                            minX = Math.min.apply(Math, rects.map(function (o) {
                                return o.rect.x;
                            }));
                            maxX = Math.max.apply(Math, rects.map(function (o) {
                                return o.rect.x + o.rect.width;
                            }));
                            if (minX > (elementToWrap.left - containerRect.left)) minX = (elementToWrap.left - containerRect.left) + spaceBetween;
                            if (maxX < (elementToWrap.left - containerRect.left)) maxX = elementToWrap.right -  containerRect.left;
                            minY = Math.min.apply(Math, rects.map(function (o) {
                                return o.rect.y;
                            }));
                            maxY = Math.max.apply(Math, rects.map(function (o) {
                                return o.rect.y;
                            }));

                            var rectsNum = Math.ceil((maxX-minX)/(rectWidth + spaceBetween));
                            rectWidth = ((maxX-minX)-(spaceBetween*(rectsNum-1)))/rectsNum;
                            perRow =  Math.ceil(rectsNum);
                        } else if(align == 'bottomleft' || align == 'bottomright' || align == 'topleft' || align == 'topright') {
                            //var perRow =  Math.floor(parentWidth / (rectWidth + spaceBetween));
                            //let intersect = (elementToWrap.top < containerRect.bottom && (elementToWrap.left < containerRect.right || elementToWrap.right > containerRect.left)) ||
                            //    (elementToWrap.bottom > containerRect.top && (elementToWrap.left < containerRect.right || elementToWrap.right > containerRect.left));
                            let intersect = intersects(containerRect, elementToWrap);
                            perRow =  Math.floor((parentWidth - elementToWrap.width) / (rectWidth + spaceBetween));

                            if(align == 'bottomleft' || align == 'topleft') {
                                if(intersect) perRow =  Math.floor((parentWidth - (elementToWrap.right - containerRect.left)) / (rectWidth + spaceBetween));
                                maxX =  parentWidth - spaceBetween;
                            } else if (align == 'bottomright' || align == 'topright') {
                                if(intersect) perRow =  Math.floor((parentWidth - (containerRect.right - elementToWrap.left)) / (rectWidth + spaceBetween));
                                maxX = (elementToWrap.left - containerRect.left) - spaceBetween;
                            }

                            minY = spaceBetween;
                            maxY = parentHeight;
                        } else {
                            minX = spaceBetween;
                            maxX = parentWidth - spaceBetween;
                            minY = spaceBetween;
                            maxY = parentHeight;
                        }

                        var latestRect;
                        var isNextNewLast = false;
                        var rowItemCounter = 1;
                        var i;
                        for (i = 1; i <= count; i++) {
                            //var firstRect = new DOMRect(size.parentWidth - (rectWidth + spaceBetween), size.parentHeight - (rectHeight + spaceBetween), rectWidth, rectHeight)
                            if(latestRect != null) var prevRect = latestRect;
                            var currentRow = isNextNewLast  ? perRow : Math.ceil(i/perRow);
                            var isNextNewRow  = rowItemCounter  == perRow;
                            isNextNewLast = isNextNewLast == true ? true : isNextNewRow && currentRow + 1 == perRow;

                            var x,y
                            if(rowItemCounter > 1 && prevRect) {
                                y = prevRect.y;
                                x = prevRect.x - (rectWidth + spaceBetween);
                            } else {
                                var startX = maxX;
                                if(align == 'bottom' || align == 'bottomleft' || align == 'bottomright') {
                                    var startY = prevRect != null ? prevRect.y : maxY;
                                    y = startY - (rectHeight + spaceBetween);
                                } else if (align == 'top' || align == 'topleft' || align == 'topright') {
                                    y = prevRect != null ? (prevRect.y + rectHeight + spaceBetween) : minY;
                                } else if (align == 'top-full'){
                                    var startY = prevRect != null ? prevRect.y  + rectHeight + spaceBetween: minY;
                                    y = startY;
                                } else if (align == 'bottom-full'){
                                    var startY = prevRect != null ? prevRect.y : maxY;
                                    y = startY - (rectHeight + spaceBetween);
                                }
                                x = startX - rectWidth;
                            }
                            var rect = latestRect = new DOMRect(x, y, rectWidth, rectHeight);

                            rects.push({side:null, rect: rect});

                            if(rowItemCounter == perRow) {
                                rowItemCounter = 1;
                            } else rowItemCounter++;
                        }

                        rects = rects.map(function(rectObj){
                            return rectObj.rect;
                        });

                        //return alignFullRows(rects)
                        return rects;
                    }

                    function addAndUpdate(container, count, elementToWrap, maximized) {
                        log('minimizedOrMaximizedScreenGrid: addAndUpdate')
                        var align = getControlsAlign();

                        var currentRects = _layoutTool.currentRects;

                        if(_layoutTool.maximizedScreen != null) {
                            currentRects = _layoutTool.currentRects.filter(function(r, i){
                                return (r.x == activeScreenRect.x && r.y == activeScreenRect.y
                                && r.width == activeScreenRect.width && r.height == activeScreenRect.height ? false : true)
                            });
                        } else {
                            currentRects = _layoutTool.currentRects;
                        }

                        //var containerRect = container == document.body ? new DOMRect(0, 0, window.innerWidth, window.innerHeight) : container.getBoundingClientRect();

                        var gridParams = getRectsGridParams(align);
                        var rectsOnLeftSide = gridParams.rectsOnLeftSide;
                        var rectsOnRightSide = gridParams.rectsOnRightSide;
                        var numOfRowsAlongWrapEl = gridParams.numOfRowsAlongWrapEl;
                        var perRow = gridParams.rectsPerRow;

                        var getRectsRows = function () {
                            log('minimizedOrMaximizedScreenGrid: getRectsRows')
                            var rows = {};
                            var left = [];
                            var right = [];
                            var none = [];
                            var i, count = currentRects.length;
                            for(i = 0; i < count; i++) {
                                var rect = currentRects[i];


                                if(align == 'bottom' || align == 'top') {
                                    let isTopFullRow = align == 'top' && rect.top >= (elementToWrap.bottom - containerRect.top);
                                    let isBottomFullRow = align == 'bottom' && rect.bottom <= (elementToWrap.top - containerRect.top);

                                    if(rect.left < (elementToWrap.left - containerRect.left) && !isTopFullRow && !isBottomFullRow) {
                                        if(rows[rect.top + '_l'] == null) rows[rect.top + '_l'] = [];

                                        rows[rect.top + '_l'].push({indx: i, top: rect.top, rect:rect, side:'left'});
                                    } else if (rect.left >= (elementToWrap.left - containerRect.left) && !isTopFullRow && !isBottomFullRow){

                                        if(rows[rect.top + '_r'] == null) rows[rect.top + '_r'] = [];

                                        rows[rect.top + '_r'].push({indx: i, top: rect.top, rect:rect, side:'right'});
                                    } else {
                                        if(rows[rect.top] == null) rows[rect.top] = [];

                                        rows[rect.top].push({indx: i, top: rect.top, rect:rect, side:'none'});
                                    }
                                } else {
                                    if(rows[rect.top] == null) rows[rect.top] = [];

                                    rows[rect.top].push({indx: i, top: rect.top, rect:rect, side:'none'});
                                }
                            }

                            var rowsArray = [];
                            for (var property in rows) {
                                if (rows.hasOwnProperty(property)) {
                                    if(rows[property][0].side == 'left') {
                                        left.push(rows[property]);
                                    } else if(rows[property][0].side == 'right') {
                                        right.push(rows[property]);
                                    } else {
                                        none.push(rows[property]);
                                    }
                                    rowsArray.push(rows[property]);
                                }
                            }

                            return {
                                left: left,
                                right: right,
                                none: none,
                                all: rowsArray
                            };
                        }

                        var getAvailableRects = function (sortedRows) {
                            log('minimizedOrMaximizedScreenGrid: getAvailableRects')
                            var  rows = sortedRows.all;
                            var availableRects = [];
                            var availableRectsFullRow = [];
                            var availableRectsOnLeft = [];
                            var availableRectsOnRight = [];


                            var minX, maxX, minY, maxY;

                            if(align == 'bottom' || align == 'top') {

                                minX = Math.min.apply(Math, currentRects.map(function (o) {return o.x;}));
                                maxX = Math.max.apply(Math, currentRects.map(function (o) {return o.x + o.width;}));

                                if (minX > (elementToWrap.left - containerRect.left)) minX = (elementToWrap.left - containerRect.left) + spaceBetween;
                                if (maxX < (elementToWrap.left - containerRect.left)) maxX = (elementToWrap.left - containerRect.left) + elementToWrap.width;


                            } else if(align == 'bottomleft' || align == 'topleft') {
                                //var perRow =  Math.floor(parentWidth / (rectWidth + spaceBetween));
                                //perRow =  Math.floor((parentWidth - elementToWrap.width) / rectWidth);
                                perRow =  Math.floor((parentWidth - (elementToWrap.right - containerRect.left)) / (rectWidth + spaceBetween));
                                maxX =  parentWidth - spaceBetween;
                                minX =  elementToWrap.right - containerRect.left;
                            } else if(align == 'bottomright' || align == 'topright') {
                                //perRow =  Math.floor((parentWidth - elementToWrap.width) / rectWidth);
                                perRow =  Math.floor((parentWidth - (elementToWrap.right - containerRect.right)) / (rectWidth + spaceBetween));
                                maxX = (elementToWrap.left - containerRect.left);
                                minX = spaceBetween;
                            } else {
                                perRow =  Math.floor(parentWidth / rectWidth);
                                minX = spaceBetween;
                                maxX = parentWidth;
                            }

                            /*var minX = Math.min.apply(Math, currentRects.map(function(o) { return o.x; }));
                            var maxX = Math.max.apply(Math, currentRects.map(function(o) { return o.x+o.width; }));*/
                            var maxWidth = maxX - minX;

                            var i, rowsCount = rows.length;
                            for(i = 0; i < rowsCount; i++) {
                                var row = rows[i];
                                var sampleRect = row[0];

                                if(sampleRect.side == 'left') {

                                    var maxRectsOnLeftSide = Math.floor((elementToWrap.left - containerRect.left) / (sampleRect.rect.width + spaceBetween));

                                    if(row.length != maxRectsOnLeftSide){
                                        var rowsMinX = Math.min.apply(Math, row.map(function(o) { return o.rect.x; }));
                                        var rowsMaxX = Math.max.apply(Math, row.map(function(o) { return o.rect.x+o.rect.width; }));

                                        var r, numRectsToAdd = maxRectsOnLeftSide - row.length, prevRect;
                                        for(r = 0; r < numRectsToAdd; r++){
                                            var newRect;
                                            if(r == 0) {
                                                newRect = new DOMRect(rowsMinX - sampleRect.rect.width - spaceBetween, sampleRect.rect.y, sampleRect.rect.width, sampleRect.rect.height)
                                            } else {
                                                newRect = new DOMRect(prevRect.x - sampleRect.rect.width - spaceBetween, sampleRect.rect.y, sampleRect.rect.width, sampleRect.rect.height)
                                            }
                                            availableRectsOnLeft.push(newRect);

                                            prevRect = newRect;
                                        }
                                    }

                                } else if (sampleRect.side == 'right') {

                                    var maxRectsOnRightSide = Math.floor((containerRect.right - elementToWrap.right) / (row[0].rect.width + spaceBetween));

                                    if(row.length != maxRectsOnRightSide){
                                        var rowsMinX = Math.min.apply(Math, row.map(function(o) { return o.rect.x; }));
                                        var rowsMaxX = Math.max.apply(Math, row.map(function(o) { return o.rect.x+o.rect.width; }));

                                        var r, numRectsToAdd = maxRectsOnRightSide - row.length, prevRect;
                                        for(r = 0; r < numRectsToAdd; r++){
                                            var newRect;
                                            if(r == 0) {
                                                newRect = new DOMRect(rowsMaxX + spaceBetween, sampleRect.rect.y, sampleRect.rect.width, sampleRect.rect.height)
                                            } else {
                                                newRect = new DOMRect(prevRect.x + prevRect.width + spaceBetween, sampleRect.rect.y, sampleRect.rect.width, sampleRect.rect.height)
                                            }
                                            availableRectsOnRight.push(newRect);

                                            prevRect = newRect;
                                        }
                                    }

                                } else {

                                    var maxRectsInCurrentRow = Math.floor((maxWidth + spaceBetween) / (sampleRect.rect.width + spaceBetween));

                                    if(row.length != maxRectsInCurrentRow){
                                        var rowsMinX = Math.min.apply(Math, row.map(function(o) { return o.rect.x; }));
                                        var rowsMaxX = Math.max.apply(Math, row.map(function(o) { return o.rect.x+o.rect.width; }));

                                        var r, numRectsToAdd = maxRectsInCurrentRow - row.length, prevRect;
                                        for(r = 0; r < numRectsToAdd; r++){
                                            var newRect;
                                            if(r == 0) {
                                                newRect = new DOMRect(rowsMinX - sampleRect.rect.width - spaceBetween, sampleRect.rect.y, sampleRect.rect.width, sampleRect.rect.height)
                                            } else {
                                                newRect = new DOMRect(prevRect.x - sampleRect.rect.width - spaceBetween, sampleRect.rect.y, sampleRect.rect.width, sampleRect.rect.height)
                                            }
                                            availableRectsFullRow.push(newRect);

                                            prevRect = newRect;
                                        }
                                    }
                                }


                            }

                            if(sortedRows.left.length != sortedRows.right.length) {

                                //if there are more rows on the left side than on the right, complete row on the right side
                                if(sortedRows.left.length > sortedRows.right.length && rectsOnRightSide != 0){

                                    var rowsToCreate = sortedRows.left.length - sortedRows.right.length;

                                    var i;
                                    for(i = sortedRows.right.length; i < sortedRows.left.length; i++) {
                                        var leftRow = sortedRows.left[i];
                                        var sampleRect = leftRow[0];

                                        var r, prevRect;
                                        for(r = 0; r < rectsOnRightSide; r++){
                                            var newRect;
                                            if(r == 0) {
                                                newRect = new DOMRect((elementToWrap.right - containerRect.left) + spaceBetween, sampleRect.rect.y, rectWidth, rectHeight)
                                            } else {
                                                newRect = new DOMRect(prevRect.x + prevRect.width + spaceBetween, sampleRect.rect.y, rectWidth, rectHeight)
                                            }

                                            availableRectsOnRight.push(newRect);

                                            prevRect = newRect;
                                        }

                                    }

                                } else if(sortedRows.right.length > sortedRows.left.length && rectsOnLeftSide != 0) {

                                    var rowsToCreate = sortedRows.right.length - sortedRows.left.length;

                                    var i;
                                    for(i = sortedRows.left.length; i < sortedRows.right.length; i++) {

                                        var rightRow = sortedRows.right[i];
                                        var sampleRect = rightRow[0];

                                        var r, prevRect;
                                        for(r = 0; r < rectsOnLeftSide; r++){
                                            var newRect;
                                            if(r == 0) {
                                                newRect = new DOMRect((elementToWrap.left - containerRect.left) - sampleRect.rect.width - spaceBetween, sampleRect.rect.y, sampleRect.rect.width, sampleRect.rect.height)
                                            } else {
                                                newRect = new DOMRect(prevRect.x - sampleRect.rect.width - spaceBetween, sampleRect.rect.y, sampleRect.rect.width, sampleRect.rect.height)
                                            }

                                            availableRectsOnLeft.push(newRect);

                                            prevRect = newRect;
                                        }

                                    }

                                }
                            }


                            var longerSide = availableRectsOnRight.length >= availableRectsOnLeft.length ? availableRectsOnRight : availableRectsOnLeft;
                            var shorterSide = availableRectsOnRight.length >= availableRectsOnLeft.length ? availableRectsOnLeft : availableRectsOnRight;

                            var alternatedArray = [];

                            var i, length = longerSide.length;
                            for (i = 0; i < length; i++) {
                                var sampleRect = longerSide[i];

                                var currentLeftRow = sortedRows.left.filter(function(r){
                                    return r[0].top == sampleRect.top ? true : false;
                                })[0];
                                var currentRightRow = sortedRows.right.filter(function(r){
                                    return r[0].top == sampleRect.top ? true : false;
                                })[0];

                                if(currentLeftRow != null && currentRightRow != null && currentLeftRow.length != 0 && currentRightRow.length != 0) {
                                    if(currentRightRow.length <= currentLeftRow.length) {
                                        if(availableRectsOnRight[i] != null) alternatedArray.push(availableRectsOnRight[i]);
                                        if(availableRectsOnLeft[i] != null) alternatedArray.push(availableRectsOnLeft[i]);
                                    } else {
                                        if(availableRectsOnLeft[i] != null) alternatedArray.push(availableRectsOnLeft[i]);
                                        if(availableRectsOnRight[i] != null) alternatedArray.push(availableRectsOnRight[i]);
                                    }
                                } else if(currentLeftRow == null && currentRightRow != null) {
                                    if(availableRectsOnLeft[i] != null) alternatedArray.push(availableRectsOnLeft[i]);
                                    if(availableRectsOnRight[i] != null) alternatedArray.push(availableRectsOnRight[i]);
                                } else if(currentLeftRow != null && currentRightRow == null) {
                                    if(availableRectsOnRight[i] != null) alternatedArray.push(availableRectsOnRight[i]);
                                    if(availableRectsOnLeft[i] != null) alternatedArray.push(availableRectsOnLeft[i]);
                                }

                            }

                            availableRects = availableRects.concat(alternatedArray);
                            availableRects = availableRects.concat(availableRectsFullRow);
                            return availableRects;
                        }

                        var createNewRows = function(numRectsToAdd, rows, availableRects) {
                            log('minimizedOrMaximizedScreenGrid: createNewRows')
                            // var containerRect = container == document.body ? new DOMRect(0, 0, window.innerWidth, window.innerHeight) : container.getBoundingClientRect();
                            var parentWidth = containerRect.width;
                            var parentHeight = containerRect.height;

                            var align = getControlsAlign();

                            var gridParams = getRectsGridParams(align);
                            var rectsOnLeftSide = gridParams.rectsOnLeftSide;
                            var rectsOnRightSide = gridParams.rectsOnRightSide;
                            var numOfRowsAlongWrapEl = gridParams.numOfRowsAlongWrapEl;
                            var perRow = gridParams.rectsPerRow;

                            var minX = Math.min.apply(Math, currentRects.map(function(o) { return o.x; }));
                            var maxX = Math.max.apply(Math, currentRects.map(function(o) { return o.x+o.width; }));
                            var maxWidth = maxX - minX;
                            var minY = currentRects.length == 0 ? parentHeight : Math.min.apply(Math, currentRects.map(function(o) { return o.y; }));
                            var maxY = Math.max.apply(Math, currentRects.map(function(o) { return o.y; }));

                            var newRects = [];

                            var craeteRowsOnControlsSides = function(){
                                var startFrom, side;
                                var minLeftY, minRightY, maxLeftY, maxRightY;

                                var figureOutCoordsonLeft = function() {
                                    if(rows.left.length != 0) {
                                        var allrects = [];
                                        for(var l in rows.left) {
                                            allrects = allrects.concat(rows.left[l])
                                        }
                                        minLeftY = Math.min.apply(Math, allrects.map(function(o) { return o.top; }));
                                        maxLeftY = Math.max.apply(Math, allrects.map(function(o) { return o.top; }));
                                    } else {
                                        if(align == 'bottom' || align == 'bottomleft' || align == 'bottomright' || align == 'bottom-full') {
                                            minLeftY = maxLeftY = parentHeight;
                                        } else if (align == 'top' || align == 'topleft' || align == 'topright' || align == 'top-full') {
                                            minLeftY = maxLeftY = (0 - rectHeight);
                                        }
                                    }
                                }

                                var figureOutCoordsonRight = function() {
                                    if(rows.right.length != 0) {

                                        var allrects = [];
                                        for(var l in rows.right) {
                                            allrects = allrects.concat(rows.right[l])
                                        }
                                        minRightY = Math.min.apply(Math, allrects.map(function(o) { return o.top; }));
                                        maxRightY = Math.max.apply(Math, allrects.map(function(o) { return o.top; }));
                                    } else {

                                        if(align == 'bottom' || align == 'bottomleft' || align == 'bottomright' || align == 'bottom-full') {
                                            minRightY = maxRightY = parentHeight;
                                        } else if (align == 'top' || align == 'topleft' || align == 'topright' || align == 'top-full') {
                                            minRightY = maxRightY = (0 - rectHeight);
                                        }

                                    }
                                }

                                if(rows.left.length == rows.right.length && rows.right.length != 0) {
                                    figureOutCoordsonRight();
                                    figureOutCoordsonLeft();
                                    startFrom = side = 'right';

                                } else if (rectsOnRightSide != 0 && rectsOnLeftSide != 0) {
                                    figureOutCoordsonRight();
                                    figureOutCoordsonLeft();

                                    if (rows.right.length < rows.left.length) {
                                        startFrom = side = 'right';
                                    } else if (rows.left.length < rows.right.length) {
                                        startFrom = side = 'left';
                                    } else {
                                        startFrom = side = 'right';
                                    }
                                } else if (rectsOnLeftSide != 0) {
                                    figureOutCoordsonLeft();

                                    startFrom = side = 'left';
                                } else if (rectsOnRightSide != 0) {
                                    figureOutCoordsonRight();

                                    startFrom = side = 'right';
                                } else {

                                }

                                var numOfRowsAlongWrapEl = gridParams.numOfRowsAlongWrapEl, rectsToTheTopOnLeft = 0, rectsToTheTopOnRight = 0;

                                if(align == 'bottom' || align == 'bottomleft' || align == 'bottomright') {
                                    if (minLeftY) rectsToTheTopOnLeft = Math.ceil((minLeftY - elementToWrap.top  + spaceBetween) / (rectHeight + spaceBetween));
                                    if (minRightY) rectsToTheTopOnRight = Math.ceil((minRightY - elementToWrap.top + spaceBetween) / (rectHeight + spaceBetween));

                                    /*if(minY < containerRect.bottom - elementToWrap.top) {
                                        numOfRowsAlongWrapEl = 0;
                                        rectsToTheTopOnLeft = 0;
                                        rectsToTheTopOnRight = 0;
                                    }*/

                                } else if (align == 'top' || align == 'topleft' || align == 'topright') {

                                    if(maxLeftY) rectsToTheTopOnLeft = Math.ceil(((elementToWrap.top + elementToWrap.height) - (maxLeftY + rectHeight) + spaceBetween) / (rectHeight + spaceBetween));
                                    if(maxRightY) rectsToTheTopOnRight = Math.ceil(((elementToWrap.top + elementToWrap.height) - (maxRightY + rectHeight) + spaceBetween) / (rectHeight + spaceBetween));

                                    /*if(minY < elementToWrap.top - containerRect.top) {
                                        log('addAndUpdate createNewRows craeteRowsOnControlsSides if 123');

                                        numOfRowsAlongWrapEl = 0;
                                        rectsToTheTopOnLeft = 0;
                                        rectsToTheTopOnRight = 0;
                                    }*/
                                }

                                /*var count = numRectsToAdd;
                                var totalRectsOnLeftSide = gridParams.rectsOnLeftSide * gridParams.numOfRowsAlongWrapEl;
                                var totalRectsOnRightSide = gridParams.rectsOnRightSide * gridParams.numOfRowsAlongWrapEl;
                                var totalRectsOnSides = totalRectsOnLeftSide + totalRectsOnRightSide;*/

                                var count = numRectsToAdd;
                                var totalRectsOnLeftSide = rectsToTheTopOnLeft * numOfRowsAlongWrapEl;
                                var totalRectsOnRightSide = rectsToTheTopOnRight * numOfRowsAlongWrapEl;
                                var totalRectsOnSides = totalRectsOnLeftSide + totalRectsOnRightSide;

                                if(count < totalRectsOnSides) totalRectsOnSides = count;

                                var rects = [];
                                var currentRowRects = [];

                                /*if(maximized) {
                                    count = totalRectsOnSides = count - 1;
                                }*/

                                var leftSideCounter = 0;
                                var rightSideCounter = 0;
                                var createNewRowOnLeft = false;
                                var createNewRowOnRight = false;
                                var i, x, y, prevRect, latestLeftRect, latestRightRect;
                                for (i = 0; i < totalRectsOnSides; i++) {
                                    if(side == "right") {

                                        if(latestRightRect) prevRect = latestRightRect
                                        if(rightSideCounter >= 1) {

                                            y = prevRect.y;
                                            x = prevRect.x + (rectWidth + spaceBetween);

                                        } else if(createNewRowOnRight) {

                                            if(align == 'bottom' || align == 'bottomleft' || align == 'bottomright') {
                                                y = prevRect.y - (rectHeight + spaceBetween);
                                            } else if (align == 'top' || align == 'topleft' || align == 'topright') {
                                                y = prevRect.y + prevRect.height + spaceBetween;
                                            }

                                            if(align == 'bottomleft' || align == 'bottomright' || align == 'topleft' || align == 'topright') {
                                                x = startFrom == 'right' ? parentWidth / 2 - rectWidth / 2 : latestLeftRect.left + rectWidth + spaceBetween;
                                            } else {
                                                var allRects = currentRowRects;
                                                for (var a in rects) {
                                                    allRects = allRects.concat(rects[a]);
                                                }
                                                x = allRects.filter(function(rect){
                                                    return rect.side == 'right';
                                                }).reduce(function(prev, current) {
                                                    return (prev.rect.x < current.rect.x) ? prev : current;
                                                }).rect.x
                                            }

                                            createNewRowOnRight = false;
                                        } else {

                                            if(align == 'bottom' || align == 'bottomleft' || align == 'bottomright') {
                                                y = minRightY - (rectHeight + spaceBetween);
                                            } else if (align == 'top' || align == 'topleft' || align == 'topright') {
                                                y = maxRightY + rectHeight + spaceBetween;
                                            }

                                            if(align == 'bottomleft' || align == 'bottomright' || align == 'topleft' || align == 'topright') {
                                                x = startFrom == 'right' ? parentWidth / 2 - rectWidth / 2 : latestLeftRect.left + rectWidth + spaceBetween;
                                            } else {
                                                x = ((elementToWrap.left - containerRect.left) + elementToWrap.width + spaceBetween);
                                            }

                                        }

                                        rightSideCounter++;

                                        if(rightSideCounter == rectsOnRightSide) {
                                            createNewRowOnRight = true;
                                            rightSideCounter = 0;
                                        }
                                        if (totalRectsOnLeftSide != 0) {
                                            if (rectsOnLeftSide == rectsOnRightSide) {
                                                side = 'left';
                                            } else if (rectsOnLeftSide != rectsOnRightSide && !createNewRowOnLeft) {
                                                side = 'left';
                                            } else if (rectsOnLeftSide != rectsOnRightSide && createNewRowOnLeft && createNewRowOnRight) {
                                                side = 'left';
                                            }

                                        }
                                        var rect = latestRightRect = new DOMRect(x, y, rectWidth, rectHeight);
                                        currentRowRects.push({side:'right', rect: rect});

                                    } else if(side == "left") {

                                        if(latestLeftRect) prevRect = latestLeftRect;

                                        if(leftSideCounter >= 1 ) {

                                            y = prevRect.y;
                                            x = prevRect.x - (rectWidth + spaceBetween);

                                        } else if(createNewRowOnLeft) {

                                            if(align == 'bottom' || align == 'bottomleft' || align == 'bottomright') {
                                                y = prevRect.y - (rectHeight + spaceBetween);
                                            } else if (align == 'top' || align == 'topleft' || align == 'topright') {
                                                y = prevRect.y + (rectHeight + spaceBetween);
                                            }

                                            if(align == 'bottomleft' || align == 'bottomright' || align == 'topleft' || align == 'topright') {
                                                x = startFrom == 'left' ? parentWidth / 2 - rectWidth / 2 : latestRightRect.left - rectWidth - spaceBetween;
                                            } else {
                                                var allRects = currentRowRects;
                                                for (var a in rects) {
                                                    allRects = allRects.concat(rects[a]);
                                                }
                                                x = allRects.filter(function(rect){
                                                    return rect.side == 'left';
                                                }).reduce(function(prev, current) {
                                                    return (prev.rect.x > current.rect.x) ? prev : current;
                                                }).rect.x;
                                            }

                                            createNewRowOnLeft = false;
                                        } else {

                                            if(align == 'bottom' || align == 'bottomleft' || align == 'bottomright') {
                                                y = minLeftY - (rectHeight + spaceBetween);
                                            } else if (align == 'top' || align == 'topleft' || align == 'topright') {
                                                y = maxLeftY + rectHeight + spaceBetween;
                                            }

                                            if(align == 'bottomleft' || align == 'bottomright' || align == 'topleft' || align == 'topright') {
                                                x = startFrom == 'left' ? parentWidth / 2 - rectWidth / 2 : latestRightRect.left - rectWidth - spaceBetween;
                                            } else {
                                                x = ((elementToWrap.left - containerRect.left) - (rectWidth + spaceBetween));
                                            }
                                        }

                                        leftSideCounter++;

                                        if(leftSideCounter == rectsOnLeftSide) {
                                            createNewRowOnLeft = true;
                                            leftSideCounter = 0;
                                        }

                                        if (totalRectsOnRightSide != 0) {
                                            if (rectsOnLeftSide == rectsOnRightSide) {
                                                side = 'right';
                                            } else if (rectsOnLeftSide != rectsOnRightSide && !createNewRowOnRight) {
                                                side = 'right';
                                            } else if (rectsOnLeftSide != rectsOnRightSide && createNewRowOnLeft && createNewRowOnRight) {
                                                side = 'right';
                                            }
                                        }

                                        var rect = latestLeftRect = new DOMRect(x, y, rectWidth, rectHeight);
                                        currentRowRects.push({side:'left', rect: rect});


                                    }

                                    if(i == perRow - 1 || i == totalRectsOnSides - 1) {
                                        rects.push(currentRowRects);
                                        currentRowRects = [];
                                    }

                                    count = count - 1;
                                }


                                var arr = [];
                                for(var i in rects){
                                    arr = arr.concat(rects[i]);
                                }

                                return arr.map(function(rectObj){
                                    return rectObj.rect;
                                });
                            }

                            var createFullRows = function(count) {
                                log('minimizedOrMaximizedScreenGrid: createFullRows')
                                var allRects = currentRects.concat(newRects).concat(availableRects);
                                var minX, maxX, rectsNum;
                                if(align == 'top' || align == 'bottom') {

                                    var minX = Math.min.apply(Math, allRects.map(function(o) { return o.x; }));
                                    var maxX = Math.max.apply(Math, allRects.map(function(o) { return o.x+o.width; }));

                                    if(minX > (elementToWrap.left - containerRect.left)) minX = (elementToWrap.left - containerRect.left) + spaceBetween;
                                    if(maxX < (elementToWrap.left - containerRect.left)) maxX = (elementToWrap.left - containerRect.left) + elementToWrap.width;

                                    rectsNum = Math.ceil((maxX-minX)/(rectWidth + spaceBetween));
                                    rectWidth = ((maxX-minX)-(spaceBetween*(rectsNum-1)))/rectsNum;


                                } else if (align == 'bottomleft' || align == 'topleft') {
                                    maxX =  parentWidth - spaceBetween;
                                    minX =  (elementToWrap.left - containerRect.left) + spaceBetween;
                                    rectsNum = Math.floor((maxX-minX)/(rectWidth + spaceBetween));

                                } else if (align == 'bottomright' || align == 'topright') {
                                    maxX = (elementToWrap.left - containerRect.left) - spaceBetween;
                                    minX = spaceBetween;
                                    rectsNum = Math.floor((maxX-minX)/(rectWidth + spaceBetween));
                                } else {
                                    maxX = parentWidth - spaceBetween;
                                    minX = spaceBetween;
                                    rectsNum = Math.floor((maxX-minX)/(rectWidth + spaceBetween));
                                }

                                if (align == 'top-full') {
                                    var minY = Math.min.apply(Math, allRects.map(function(o) { return o.y; }));
                                    var maxY = Math.max.apply(Math, allRects.map(function(o) { return o.y+o.height; }));
                                } else {
                                    var minY = Math.min.apply(Math, allRects.map(function(o) { return o.y; }));
                                    var maxY = Math.max.apply(Math, allRects.map(function(o) { return o.y; }));
                                }

                                var perRow = rectsNum;

                                var rects = []
                                var latestRect, createNewRow;
                                var isNextNewLast = false;
                                var rowItemCounter = 1;

                                var i;
                                for (i = 1; i <= count; i++) {
                                    //var firstRect = new DOMRect(size.parentWidth - (rectWidth + spaceBetween), size.parentHeight - (rectHeight + spaceBetween), rectWidth, rectHeight)
                                    var currentRow = isNextNewLast  ? perRow : Math.ceil(i/perRow);
                                    var isNextNewRow = rowItemCounter == perRow;
                                    isNextNewLast = isNextNewLast == true ? true : isNextNewRow && currentRow + 1 == perRow;

                                    var x,y
                                    if(rowItemCounter > 1) {
                                        y = latestRect.y;
                                        x = latestRect.x - (rectWidth + spaceBetween);
                                    } else if(createNewRow) {
                                        if(align == 'bottom' || align == 'bottomleft' || align == 'bottomright' || align == 'bottom-full') {
                                            y =  latestRect.y - (rectHeight + spaceBetween);
                                        } else if (align == 'top' || align == 'topleft' || align == 'topright' || align == 'top-full') {
                                            y =  latestRect.y + latestRect.height + spaceBetween;
                                        }
                                        x = maxX - rectWidth;
                                        createNewRow = false;
                                    } else {
                                        if(align == 'bottom' || align == 'bottomleft' || align == 'bottomright') {
                                            y = minY - (rectHeight + spaceBetween);
                                        } else if (align == 'top' || align == 'topleft' || align == 'topright') {
                                            y = maxY + rectHeight + spaceBetween;
                                        } else if (align == 'top-full'){
                                            y = maxY + spaceBetween;
                                        } else if (align == 'bottom-full'){
                                            y = minY - (rectHeight + spaceBetween);
                                        }
                                        x = maxX - rectWidth;
                                    }
                                    var rect = latestRect = new DOMRect(x, y, rectWidth, rectHeight);

                                    rects.push({side:null, rect: rect});

                                    if(rowItemCounter == perRow) {
                                        createNewRow = true;
                                        rowItemCounter = 1;
                                    } else rowItemCounter++;

                                }

                                return rects.map(function(rectObj){
                                    return rectObj.rect;
                                });
                            }

                            if((rows.left.length == numOfRowsAlongWrapEl && rows.right.length == numOfRowsAlongWrapEl)
                                || (rows.left.length == 0 && rows.right.length == numOfRowsAlongWrapEl)
                                || (rows.right.length == 0 && rows.left.length == numOfRowsAlongWrapEl)
                                || (rectsOnLeftSide == 0 && rectsOnRightSide == 0)) {

                                newRects = createFullRows(numRectsToAdd);

                            } else {

                                newRects = craeteRowsOnControlsSides();

                                if(newRects.length < numRectsToAdd) {
                                    newRects = newRects.concat(createFullRows(numRectsToAdd - newRects.length));
                                }

                            }

                            return newRects;
                        }

                        var rectsToAddNum = count - _layoutTool.currentRects.length;

                        var rows = getRectsRows();
                        var availableRects = getAvailableRects(rows);

                        var newRows;
                        if(rectsToAddNum > availableRects.length) {
                            rectsToAddNum = (rectsToAddNum - availableRects.length);
                            newRows = createNewRows(rectsToAddNum, rows, availableRects);
                            availableRects = availableRects.concat(newRows);
                        } else if(availableRects.length > rectsToAddNum) {
                            availableRects = availableRects.slice(0, rectsToAddNum);
                        }

                        //resultRects = alignFullRows(resultRects);

                        return availableRects;

                    }

                    function alignFullRows(elementRects) {
                        var groupBy = function(xs, key) {
                            var groupedRows = xs.reduce(function(rv, x) {
                                (rv[x[key]] = rv[x[key]] || []).unshift(x);
                                return rv;
                            }, {});

                            var groupedArray = [];
                            for (var property in groupedRows) {
                                if (groupedRows.hasOwnProperty(property)) {
                                    groupedArray.push(groupedRows[property]);
                                }
                            }

                            return groupedArray;
                        };

                        var sortByX = function compare( a, b ) {
                            if ( a.rect.left < b.rect.left ){
                                return -1;
                            }
                            if ( a.rect.left > b.rect.left ){
                                return 1;
                            }
                            return 0;
                        }

                        var fullRowsRects = [];
                        var i, count = elementRects.length;
                        for (i = 0; i < count; i++) {
                            var rect = elementRects[i];
                            if(rect.top + rect.height <= elementToWrap.top) {
                                fullRowsRects.push({indx: i, top: rect.top, rect: rect});
                            }
                        }

                        var fullWidthRows = groupBy(fullRowsRects, 'top');

                        var minX = Math.min.apply(Math, elementRects.map(function(o) { return o.x; }));
                        var maxX = Math.max.apply(Math, elementRects.map(function(o) { return o.x+o.width; }));

                        var i, rowCount = fullWidthRows.length;

                        for (i = 0; i < rowCount; i++) {
                            var row = fullWidthRows[i];
                            row.sort(sortByX);

                            var x, rectsCount = row.length, widthSum = 0;
                            for (x = 0; x < rectsCount; x++) {
                                let rect = row[x];
                                widthSum += rect.rect.width;
                            }
                            widthSum = widthSum + ((rectsCount - 1) * spaceBetween)


                            var newMinX = ((maxX - minX) / 2) - (widthSum / 2) + minX;

                            let prevRect = null;
                            for (let r = 0; r < row.length; r++) {


                                if(r != 0) {
                                    elementRects[row[r].indx].x = prevRect.x + prevRect.width + spaceBetween;
                                } else {
                                    elementRects[row[r].indx].x = newMinX;
                                }

                                prevRect = elementRects[row[r].indx];
                            }

                        }

                        return elementRects;
                    };

                    function compareLayoutStates(prevRects, newRects) {
                        log('minimizedOrMaximizedScreenGrid: compareLayoutStates')
                        var diffEls = [];
                        var count = prevRects.length;

                        var findInCurrentLayout = function (prevLayoutRect) {

                            var count = newRects.length;
                            for (var c = 0; c < count; c++) {

                                var diffTop = Math.abs(prevLayoutRect.top - newRects[c].top);
                                var diffLeft = Math.abs(prevLayoutRect.left - newRects[c].left);

                                if((diffTop + diffLeft) / 2 < 2) {
                                    return true;
                                }
                            }

                            return false;
                        }

                        for (let i = 0; i < count; i++) {
                            var prevLayoutRect = new DOMRect(prevRects[i].x, prevRects[i].y, prevRects[i].width, prevRects[i].height);
                            if(!findInCurrentLayout(prevLayoutRect)) {

                                diffEls.push(prevLayoutRect);
                            }
                        }

                        return diffEls;
                    }

                    function changeRectPosition(oldRect, newRect, rects) {
                        var i, count = rects.length;
                        for (i = 0; i < count; i++) {
                            if(oldRect.top == rects[i].top && oldRect.left == rects[i].left) {
                                rects[i] = newRect;
                                break;
                            }
                        }
                        return rects;
                    }

                    function findClosest(diffRect, rects) {
                        if(!diffRect) return null;
                        var closestOnTop = findClosesVerticallyRect(diffRect, rects);

                        if(closestOnTop != null) {
                            return closestOnTop
                        } else {
                            var closestOnSide = findClosesHorizontalyRect(diffRect, rects);

                            if(closestOnSide != null) {
                                return closestOnSide;
                            }
                        }
                        return null;
                    }



                    function findClosesVerticallyRect(rect, rects) {
                        log('minimizedOrMaximizedScreenGrid: findClosesVerticallyRect')
                        var distance = function (x1,y1,x2,y2) {
                            return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
                        }

                        var align = getControlsAlign();

                        var nextRow;
                        if(align == 'bottom' || align == 'bottomleft' || align == 'bottomright' || align == 'bottom-full') {
                            nextRow = rects.filter(function (r) {
                                if (r.top < rect.top) return true;
                                return false;
                            })

                        } else if (align == 'top' || align == 'topleft' || align == 'topright' || align == 'top-full') {
                            nextRow = rects.filter(function (r) {
                                if (r.top > rect.top) return true;
                                return false;
                            })
                        }

                        if(nextRow.length != 0) {
                            var isRowFull
                            if(align == 'bottom') {
                                isRowFull = nextRow[0].top + nextRow[0].height < (elementToWrap.top - containerRect.top);

                            } else if (align == 'top') {
                                isRowFull = nextRow[0].top > (elementToWrap.top - containerRect.top);
                            } else {
                                isRowFull = true;
                            }

                            var closestVerticaly;
                            closestVerticaly = nextRow.reduce(function (prev, current) {
                                return (distance(current.left, current.top + current.height, rect.left, rect.top + rect.height) < distance(prev.left, prev.top + prev.height, rect.left, rect.top + rect.height)) ? current : prev;
                                //return (Math.abs((current.left + current.width / 2) -  Math.abs(rect.left + rect.width / 2)) <  Math.abs((prev.left + prev.width / 2) - Math.abs(rect.left + rect.width / 2))) ? current : prev;
                            })



                            if ((!isRowFull && Math.sign(90 - Math.abs((closestVerticaly.left + 90) - (rect.left + 90))) >= 0) || isRowFull) {
                                return closestVerticaly;
                            } else {
                                return null;
                            }
                        } else {
                            return null;
                        }
                    }

                    function findClosesHorizontalyRect(rect, rects) {
                        log('minimizedOrMaximizedScreenGrid: findClosesHorizontalyRect')
                        var distance = function (x1,y1,x2,y2) {
                            return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
                        }

                        var align = getControlsAlign();

                        var isRowFull
                        if(align == 'bottom') {
                            isRowFull = rect.top + rect.height < (elementToWrap.top - containerRect.top);

                        } else if (align == 'top') {
                            isRowFull = rect.top > (elementToWrap.top - containerRect.top) + elementToWrap.height;
                        } else {
                            isRowFull = true;
                        }

                        var currentRowRect;
                        if(isRowFull) {
                            currentRowRect = rects.filter(function (r) {
                                if (r.top == rect.top && r.left < rect.left) {
                                    return true
                                }
                                return false;
                            })
                        } else if(rect.left <= elementToWrap.left) {
                            currentRowRect = rects.filter(function (r) {
                                if (r.top == rect.top && r.left < rect.left && rect.left < (elementToWrap.left - containerRect.left)) {
                                    return true
                                }
                                return false;
                            })
                        } else {
                            currentRowRect = rects.filter(function (r) {
                                if (r.top == rect.top && r.left > rect.left && rect.left > (elementToWrap.left - containerRect.left)) {
                                    return true
                                }
                                return false;
                            })
                        }

                        if(currentRowRect.length != 0) {
                            var closestHorizontaly = currentRowRect.reduce(function (prev, current) {
                                return (distance(current.left, current.top + 90, rect.left, rect.top + 90) < distance(prev.left, prev.top + 90, rect.left, rect.top + 90)) ? current : prev;
                                //return (90 - Math.abs((current.left+90) - (rect.left+90)) > 90 - Math.abs((prev.left+90) - (rect.left+90))) ? current : prev;
                            })

                            return closestHorizontaly;
                        }

                        return null;
                        /*for (var i = 0; i < count; i++) {
                            var rect = newRects[i];
                            if(rect.top + rect.height )
                        }*/
                    }

                    function fillFreeSpaceWithClosestRects(spaceToFill, rects, skipRects) {
                        var closest;
                        if(skipRects != null) {
                            closest = findClosest(spaceToFill, rects.filter(function(o, i) {
                                var exclude = false;
                                for(let r in skipRects) {
                                    if(skipRects[r].x == o.x && skipRects[r].y == o.y
                                        && skipRects[r].width == o.width  && skipRects[r].height == o.height) {

                                        exclude = true;
                                        break;
                                    }
                                }

                                return (exclude == false ? true : false);
                            }));
                        } else {
                            closest = findClosest(spaceToFill, rects);
                        }

                        if(closest != null) {
                            changeRectPosition(closest, spaceToFill, rects);
                            return fillFreeSpaceWithClosestRects(closest, rects, (activeScreenRect ? [activeScreenRect] : null));
                        } else {
                            //rects = alignFullRows(rects);
                            return rects;
                        }
                    }

                    function removeAndUpdate() {
                        log('minimizedOrMaximizedScreenGrid: removeAndUpdate')
                        var count = roomScreens.length;

                        var elementRects = [];

                        var currentlyMaximizedElIndex;
                        for (let i = 0; i < count; i++) {
                            var screen = roomScreens[i];
                            if(screen == activeScreen) currentlyMaximizedElIndex = i;
                            var screenRect = screen.screenEl.getBoundingClientRect();
                            if(_roomsMedia.contains(screen.screenEl)) elementRects.push(screenRect);
                        }

                        var actualLayoutRects = []
                        for(var i = 0; i < _layoutTool.state.currentMappedRects.length; i++) {
                            if(_roomsMedia.contains(_layoutTool.state.currentMappedRects[i].el) ) {
                                actualLayoutRects.push(_layoutTool.state.currentMappedRects[i].rect);
                            }
                        }

                        var diff = compareLayoutStates(_layoutTool.basicGridRects, actualLayoutRects);

                        var resultLayoutRects;

                        if(diff.length != 0) {
                            for(var s in diff) {
                                resultLayoutRects = fillFreeSpaceWithClosestRects(diff[s], actualLayoutRects, (activeScreenRect ? [activeScreenRect] : null));
                            }
                        } else resultLayoutRects = elementRects;


                        return resultLayoutRects;
                    }
                },
                squaresGrid: function (container, count) {
                    if(roomScreens.length == 0) return;

                    var defaultSide = 'top-full';

                    var containerRect = container.constructor.name != 'DOMRect' ? container.getBoundingClientRect() : container;
                    var parentWidth = containerRect.width;
                    var parentHeight = containerRect.height;
                    var startFromX = container.constructor.name == 'DOMRect' ? container.x : 0;
                    var startFromY = container.constructor.name == 'DOMRect' ? container.y : 0;

                    _layoutTool.state.currentGenerator = 'squaresGrid';

                    if(_layoutTool.currentRects.length == 0) {
                        _layoutTool.currentRects = build(container, count);
                    } else {

                        if(count > _layoutTool.currentRects.length) {
                            _layoutTool.basicGridRects = build(container, count);
                            //var availableRects = addAndUpdate(container, count);
                            //_layoutTool.currentRects = _layoutTool.basicGridRects = _layoutTool.currentRects.concat(availableRects);
                            let numOfEls = _layoutTool.basicGridRects.length - _layoutTool.currentRects.length;
                            let last = _layoutTool.basicGridRects.slice(Math.max(_layoutTool.basicGridRects.length - numOfEls, 0))

                            let updatedRects = updateRealToBasicGrid();
                            _layoutTool.currentRects = updatedRects.concat(last);

                        } else if(count < _layoutTool.currentRects.length) {
                            _layoutTool.basicGridRects = build(container, count);
                            _layoutTool.currentRects = updateRealToBasicGrid();
                            //_layoutTool.currentRects = removeAndUpdate();
                        }
                    }

                    return  _layoutTool.currentRects;

                    function getLayoutType() {
                        return defaultSide;
                    }

                    function build(container, count) {
                        if(count == 1) {
                            return buildGrid(container, count, 1)
                        } else if(count == 2) {
                            return buildGrid(container, count, 2)
                        } else if(count == 3 ) {

                            var first = buildGrid(container, 1, 1)
                            var second = buildGrid(container, count - 1, 2, first)
                            return first.concat(second);

                        } else if(count == 4) {

                            return buildGrid(container, count, 2)

                        } else/* if(count == 2 || count == 3 || count == 4 || count == 6) */{

                            return buildGrid(container, count, 2)

                        }


                    }

                    function buildGrid(container, count, perRow, existingRects) {
                        var align = getLayoutType();

                        var rectWidth = 90;
                        var rectHeight = 90;
                        var spaceBetween = 5;

                        if(perRow == 1) {
                            rectWidth = parentWidth - (spaceBetween * 2);
                            rectHeight = (rectWidth / 16) * 9;
                        } else if(perRow == 2) {
                            rectWidth = (parentWidth - (spaceBetween * (perRow + 1))) / 2;
                            rectHeight = rectWidth / 4 * 3;
                        } else if(perRow == 3) {
                            rectWidth = (parentWidth - (spaceBetween * (perRow + 1))) / 3;
                            rectHeight = rectWidth / 4 * 3;
                        } else {
                            rectWidth = (parentWidth - (spaceBetween * (perRow + 1))) / perRow;
                            rectHeight = rectWidth / 4 * 3;
                        }

                        var rects = [];

                        var arr = [];
                        for(var i in rects){
                            arr = arr.concat(rects[i]);
                        }
                        rects = arr;

                        var minX, maxX, minY, maxY;
                        if(existingRects != null) {
                            minX = Math.min.apply(Math, existingRects.map(function(o) { return o.x; }));
                            maxX = Math.max.apply(Math, existingRects.map(function(o) { return o.x+o.width; }));
                            minY = Math.min.apply(Math, existingRects.map(function(o) { return o.y; }));
                            maxY = Math.max.apply(Math, existingRects.map(function(o) { return o.y + o.height; }));
                        } else {
                            minX = startFromX + spaceBetween;
                            maxX = parentWidth;
                            minY = startFromY + spaceBetween;
                            maxY = spaceBetween;
                        }

                        var latestRect;
                        var isNextNewLast = false;
                        var rowItemCounter = 1;
                        var i;
                        for (i = 1; i <= count; i++) {
                            //var firstRect = new DOMRect(size.parentWidth - (rectWidth + spaceBetween), size.parentHeight - (rectHeight + spaceBetween), rectWidth, rectHeight)
                            if(latestRect != null) var prevRect = latestRect;
                            var currentRow = isNextNewLast  ? perRow : Math.ceil(i/perRow);
                            var isNextNewRow  = rowItemCounter  == perRow;
                            isNextNewLast = isNextNewLast == true ? true : isNextNewRow && currentRow + 1 == perRow;

                            var x,y
                            if(rowItemCounter > 1 && prevRect) {
                                y = prevRect.y;
                                x = prevRect.x + (rectWidth + spaceBetween);
                            } else {
                                if (align == 'top-full'){
                                    x = minX;
                                    var startY = prevRect != null ? prevRect.y  + rectHeight + spaceBetween : maxY + spaceBetween;
                                    y = startY;
                                } else if (align == 'bottom-full'){
                                    var startY = prevRect != null ? prevRect.y : parentHeight;
                                    y = startY - (rectHeight + spaceBetween);
                                    x = minX;
                                }
                            }
                            if(i == count && rowItemCounter != perRow) {
                                x = startFromX + ((parentWidth / 2) - (rectWidth / 2))
                            }
                            var rect = latestRect = new DOMRect(x, y, rectWidth, rectHeight);

                            rects.push({side:null, rect: rect});

                            if(rowItemCounter == perRow) {
                                rowItemCounter = 1;
                            } else rowItemCounter++;
                        }

                        rects = rects.map(function(rectObj){
                            return rectObj.rect;
                        });

                        //return alignFullRows(rects)
                        return rects;
                    }

                    function updateRealToBasicGrid() {

                        var actualLayoutRects = []
                        for(var i = 0; i < _layoutTool.state.currentMappedRects.length; i++) {
                            if(_roomsMedia.contains(_layoutTool.state.currentMappedRects[i].el) ) {
                                actualLayoutRects.push({
                                    key: actualLayoutRects.length,
                                    rect: _layoutTool.state.currentMappedRects[i].rect
                                });
                            }
                        }

                        let actualLayoutRectsClone = [...actualLayoutRects];

                        for(let r in _layoutTool.basicGridRects) {
                            let rect = _layoutTool.basicGridRects[r];

                            let closestIndex = closest(rect, actualLayoutRectsClone);

                            if(closestIndex == null) continue;

                            actualLayoutRects[closestIndex].rect.x = rect.x;
                            actualLayoutRects[closestIndex].rect.y = rect.y;
                            actualLayoutRects[closestIndex].rect.width = rect.width;
                            actualLayoutRects[closestIndex].rect.height = rect.height;
                            //rectsToSkip.push(closestIndex);

                            for(let c in actualLayoutRectsClone) {
                                if(actualLayoutRectsClone[c].key == closestIndex) {
                                    actualLayoutRectsClone.splice(c, 1);
                                }

                            }
                        }

                        return actualLayoutRects.map(function (o) {
                            return o.rect;
                        })

                        function closest(rect, rects) {
                            var distance = function (x1,y1,x2,y2) {
                                return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
                            }

                            if(rects.length != 0) {

                                let closestRect = rects.reduce(function (prev, current, index) {
                                    return (distance(current.rect.left, current.rect.top + current.rect.height, rect.left, rect.top + rect.height) < distance(prev.rect.left, prev.rect.top + prev.rect.height, rect.left, rect.top + rect.height)) ? current : prev;
                                })

                                return closestRect.key;

                            } else {
                                return null;
                            }
                        }
                    }
                }
            }

            function removeScreensByParticipant(participant) {
                log('removeScreensByParticipant', participant);

                for(var i in roomScreens) {
                    log('removeScreensByParticipant 1', roomScreens[i]);
                    log('removeScreensByParticipant 1', roomScreens[i].participant == participant);

                    if(roomScreens[i].participant != participant || roomScreens[i].participant.sid != participant.sid) continue;
                    log('removeScreensByParticipant 2', roomScreens[i]);

                    var screenEl = roomScreens[i].screenEl;
                    removeScreenFromCommonList(roomScreens[i]);
                    if(screenEl != null && screenEl.parentNode != null) screenEl.parentNode.removeChild(screenEl)
                }
            }

            function addScreenToCommonList(screen) {
                log('addScreenToCommonList');
                try {
                    var err = (new Error);
                    log(err.stack);
                } catch (e) {

                }
                screen.show();
                /*app.event.dispatch('screenAdded', {
                    screen: screen,
                    participant: screen.participant
                });*/
                if(_controlsTool && _controlsTool.participantsListTool) _controlsTool.participantsListTool.updateItem(screen.participant);
                updateLayout();

            }

            function removeScreenFromCommonList(screen, removeScreenEntirely) {
                log('removeScreenFromCommonList')
                try {
                    var err = (new Error);
                    log(err.stack);
                } catch (e) {

                }
                if(!removeScreenEntirely) {
                    screen.hide();
                } else {
                    screen.remove();
                }

                /*app.event.dispatch('screenRemoved', {
                    screen: screen,
                    participant: screen.participant
                });*/
                if(_controlsTool && _controlsTool.participantsListTool) _controlsTool.participantsListTool.updateItem(screen.participant);

                updateLayout();
            }

            function onVideoMute(track, participant, counter) {
                log('onVideoMute: START', track);

                if(track.parentScreen == null || track.kind != 'video') return;

                if(track.parentScreen.activeScreenType == 'audio') {
                    track.parentScreen.fillAudioScreenWithAvatarOrVideo();
                    return;
                } 

                log('onVideoMute: screens.length',  participant.screens.length);
                let actionDone = false;
                if(participant.screens.length == 1 && !track.parentScreen.hasLiveTracks('video')) {
                    log('onVideoMute: 1', track.stream.active, track.parentScreen.hasLiveTracks('video'), track.parentScreen.tracks);

                    track.parentScreen.fillVideoScreenWithAvatarOrVideo();
                    if (track.parentScreen.screensharing) {
                        log('onVideoMute: 1.3');
                        track.parentScreen.screensharing = false;
                    }
                    actionDone = true;
                } else if(participant.screens.length > 1 && !track.parentScreen.hasLiveTracks('video')) {
                    log('onVideoMute: 2');
                    removeScreenFromCommonList(track.parentScreen, true);
                    if(track.parentScreen.screensharing) {
                        log('onVideoMute: 2.1');
                        track.parentScreen.screensharing = false;
                    }
                    actionDone = true;
                }

                //for now Chrome (maybe other) do not change MediaStream's status to inactive right after track was stopped by remote side
                //so we need to check whether track is active after some time
                if(counter == null) {
                    counter = 0;
                }
                if(!actionDone && counter <= 5) {
                    log('onVideoMute: timer');

                    setTimeout(function(){
                        onVideoMute(track, participant, counter + 1)                    
                    }, 1000);
                }
                
            }

            function onVideoUnMute(track) {
                log('mediaStreamTrack unmuted 1', track);
                if(track.parentScreen == null || track.kind != 'video') return;

                if(track.parentScreen.activeScreenType == 'audio') {
                    track.parentScreen.fillAudioScreenWithAvatarOrVideo();
                    return;
                } else {
                    track.parentScreen.fillVideoScreenWithAvatarOrVideo();
                }
            }

            function onVideoTrackLoaded(track) {
                log('onVideoTrackLoaded', track)
                if(track.parentScreen == null || track.kind != 'video') return;
                track.parentScreen.isActive = true;

                addScreenToCommonList(track.parentScreen);
                updateLayout();

                hideLoader('videoTrackLoaded', {screen: track.parentScreen, participant: track.parentScreen.participant});

                if(track.trackEl) {
                    fitScreenToVideo(track.trackEl, track.parentScreen);
                    track.play();
                }
            }

            function onScreensharingStarting(e) {
                log('onScreensharingStarting', e)
                let videoTracks = e.participant.videoTracks(true);
                console.log('onScreensharingStarting: videoTracks', videoTracks)
                if(videoTracks.length != 0) {
                    log('onScreensharingStarting 1')
                    var screenForScreensharing = createRoomScreen(e.participant);
                    screenForScreensharing.screensharing = true;
                } else {
                    log('onScreensharingStarting 2')
                    e.participant.screens[0].screensharing = true;
                }
            }

            function onSomeonesCameraEnabled(participant) {
                if(_options.limits && (_options.limits.audio || _options.limits.video)) {
                    for(let i in participant.screens) {
                        addScreenToCommonList(participant.screens[i]);
                    }
                }
            }

            function onSomeonesMicEnabled(participant) {
                if(_options.limits && (_options.limits.audio || _options.limits.video)) {
                    for(let i in participant.screens) {
                        addScreenToCommonList(participant.screens[i]);
                    }
                }
            }

            function onSomeonesCameraDisabled(participant) {
                if(!participant.localMediaControlsState.camera && !participant.localMediaControlsState.mic) {
                    for(let i in participant.screens) {
                        removeScreenFromCommonList(participant.screens[i]);
                    }
                }
            }

            function onSomeonesMicDisabled(participant) {
                if(!participant.localMediaControlsState.camera && !participant.localMediaControlsState.mic) {
                    for(let i in participant.screens) {
                        removeScreenFromCommonList(participant.screens[i]);
                    }
                }
            }

            function removeParticipantsScreens() {
                for(var i = roomScreens.length -1; i >= 0; i--){
                    var currentScreen = this;
                    var screen = roomScreens[i];
                    if(currentScreen != screen.participant) continue;
                    screen.isActive = false;
                    if(screen.screenEl && screen.screenEl.parentNode != null) screen.screenEl.parentNode.removeChild(screen.screenEl);
                    roomScreens.splice(i, 1);
                }
            }

            function getScreens(all) {
                if(all) {
                    return roomScreens;
                } else {
                    return roomScreens.filter(function (screen) {
                        return (screen.isActive == true);
                    });
                }
            }

            function layoutEvents() {
                return layoutEvents;
            }

            return {
                setViewMode:setViewMode,
                updateLayout:updateLayout,
                removeScreensByParticipant:removeScreensByParticipant,
                removeScreenFromCommonList:removeScreenFromCommonList,
                addScreenToCommonList:addScreenToCommonList,
                onVideoMute:onVideoMute,
                onVideoUnMute:onVideoUnMute,
                onVideoTrackLoaded:onVideoTrackLoaded,
                onScreensharingStarting:onScreensharingStarting,
                onSomeonesCameraEnabled:onSomeonesCameraEnabled,
                onSomeonesMicEnabled:onSomeonesMicEnabled,
                onSomeonesCameraDisabled:onSomeonesCameraDisabled,
                onSomeonesMicDisabled:onSomeonesMicDisabled,
                onParticipantConnected:onParticipantConnected,
                onParticipantDisconnected:onParticipantDisconnected,
                getActiveViewMode:getActiveViewMode,
                getActiveSreen:getActiveSreen,
                getScreens:getScreens,
                layoutEvents:layoutEvents,
                createRoomScreen:createRoomScreen,
                removeParticipantsScreens:removeParticipantsScreens,
                videoTrackIsAdding:videoTrackIsAdding,
                newTrackAdded:newTrackAdded,
                fitScreenToVideo:fitScreenToVideo,
                toggleViewMode:toggleViewMode,
                updateLocalScreenClasses:updateLocalScreenClasses,
                renderMaximizedScreensGrid:renderMaximizedScreensGrid,
                renderMaximizedScreensGridMobile:renderMaximizedScreensGridMobile,
                renderDesktopScreensGrid:renderDesktopScreensGrid,
                renderTiledScreensGridDesktop:renderTiledScreenGridDesktop,
                renderTiledScreensGridMobile:renderTiledScreenGridMobile,
                renderManualScreensGrid:renderManualScreensGrid,
                renderFullScreenLayout:renderFullScreenLayout,
                renderAudioScreensGrid:renderAudioScreensGrid,
                renderSquaresGridMobile:renderSquaresGridMobile,
                toggleLoudestScreenMode:toggleLoudestScreenMode,
                disableLoudesScreenMode:disableLoudesScreenMode,
                showLoader:showLoader,
                hideLoader:hideLoader
            };
        })()

        /**
         * Bind Qbix stream events. Currentlt isn't in use.
         * @method bindStreamsEvents
         * @param {Object} [stream] stream that represents room
         */
        function bindStreamsEvents(stream) {
            log('bindStreamsEvents', stream)
            stream.onMessage('Streams/joined').set(function (stream, message) {

            });

            stream.onMessage('Streams/connected').set(function (stream, message) {

            });

            stream.onMessage("Streams/left").set(function (stream, message) {

            });

            stream.onMessage("Streams/closed").set(function (stream, message) {

            });

            stream.onMessage("Streams/webrtc/forceDisconnect").set(function (stream, message) {
                log('bindStreamsEvents: Streams/webrtc/forceDisconnect add', stream, message);
                if(!module.isActive()) return;
                var message = JSON.parse(message.content);
                var roomParticipants = webrtcSignalingLib.roomParticipants();
                var localParticipant = webrtcSignalingLib.localParticipant();

                var userId = localParticipant.identity != null ? localParticipant.identity.split('\t')[0] : null;

                if(message.userId == userId) {
                    if(message.immediate === true) {
                        if(webrtcSignalingLib.initNegotiationState == 'ended') notice.show(message.msg || text.webrtc.notices.forceDisconnectingImmediately);
                        module.stop();
                    } else {
                        if(webrtcSignalingLib.initNegotiationState == 'ended') notice.show(message.msg || text.webrtc.notices.forceDisconnecting);

                        setTimeout(function () {
                            module.stop();
                        }, 5000);
                    }
                } else {
                    for(let p in roomParticipants) {
                        if(roomParticipants[p].isLocal) continue;
                        var platformId = roomParticipants[p].identity != null ? roomParticipants[p].identity.split('\t')[0] : null;
                        if(userId == platformId) {
                            roomParticipants[p].remove();
                        }
                    }
                }

            });
        }

        /**
         * Bind events that are triggered by WebRTC library (app.js)
         * @method bindConferenceEvents
         */
        function bindConferenceEvents(webrtcSignalingLib) {
            function setRealName(participant, callback) {
                var userId = participant.identity != null ? participant.identity.split('\t')[0] : null;

                if(userId != null){
                    var firstName;
                    var lastName;
                    var fullName = '';
                    Q.Streams.get(userId, 'Streams/user/firstName', function () {
                        if(!this || !this.fields) {
                            console.warn('Error while getting Streams/user/firstName');
                            return;
                        }
                        firstName = this.fields.content;
                        if(firstName != null) {
                            fullName += firstName;
                        }
                        try {
                            Q.Streams.get(userId, 'Streams/user/lastName', function () {
                                lastName = this.fields.content;

                                if(lastName != null) {
                                    fullName += ' ' + lastName;
                                }

                                participant.username = fullName;

                                if(callback != null) callback({firstName:firstName, lastName:lastName});
                            });
                        } catch (e) {
                            participant.username = fullName;
                            if(callback != null) callback({firstName:firstName, lastName:lastName});
                        }

                    });
                }
            }
            function setUserGreeting(participant, callback) {
                var userId = participant.identity != null ? participant.identity.split('\t')[0] : null;
                if(userId != null){
                    Q.Streams.get(userId, 'Streams/greeting/' + Q.Users.communityId, function () {
                        if(!this || !this.fields) {
                            console.warn('Error while getting Streams/user/firstName');
                            return;
                        }
                        participant.greeting = this.fields.content;
                    });
                }
            }

            function setUserAvatar(participant) {
                log('setUserAvatar', participant);
                var userId = participant.identity != null ? participant.identity.split('\t')[0] : null;

                if(userId != null){
                    Q.Streams.Avatar.get(userId, function (err, avatar) {
                        if (!avatar) {
                            return;
                        }

                        var src = Q.url(avatar.iconUrl(400));
                        if(src != null) {
                            var avatarImg = new Image();
                            avatarImg.src = src;
                            log('setUserAvatar set');

                            participant.avatar = {src:src, image:avatarImg};
                        }


                    });
                }
            }

            webrtcSignalingLib.event.on('log', function (params) {
                appDebug.logInfo(params, true);
            });

            webrtcSignalingLib.event.on('joined', function (participant) {
                if(document.querySelector('.Streams_webrtc_instructions_dialog') == null) Q.Dialogs.pop();
                if(participant.sid == 'recording') return;
                setRealName(participant);
                setUserAvatar(participant);
                setUserGreeting(participant);
                screensRendering.onParticipantConnected(participant);
            });

            webrtcSignalingLib.event.on('participantConnected', function (participant) {
                log('user joined',  participant);
                if(participant.sid == 'recording') return;
                setRealName(participant, function(name){
                    if(webrtcSignalingLib.initNegotiationState == 'ended') notice.show(text.webrtc.notices.joining.interpolate({userName: name.firstName}));
                });
                setUserAvatar(participant);
                setUserGreeting(participant);
                screensRendering.onParticipantConnected(participant);

                if(webrtcSignalingLib.initNegotiationState == 'ended') {
                    log('play joined music');

                    if(Q.Audio.collection[_options.sounds.participantConnected]) {
                        log('play joined music 1', _options.sounds.participantConnected, this);
                        Q.Audio.collection[_options.sounds.participantConnected].audio.play()
                    } else {
                        Q.Audio.load(_options.sounds.participantConnected, function () {
                            log('play joined music 2', _options.sounds.participantConnected, this);

                            Q.Audio.collection[_options.sounds.participantConnected].audio.play()
                        });
                    }

                }

                //screensRendering.updateLayout();
            });
            webrtcSignalingLib.event.on('participantDisconnected', function (participant) {
                log('user disconnected',  participant);
                try {
                    var err = (new Error);
                    log(err.stack);
                } catch (e) {

                }
                var userId = participant.identity != null ? participant.identity.split('\t')[0] : null;


                if(userId != null){
                    Q.Streams.get(userId, 'Streams/user/firstName', function () {
                        if(!this || !this.fields) {
                            console.warn('Error while getting Streams/user/firstName');
                            return;
                        }
                        var firstName = this.fields.content;
                        notice.show(text.webrtc.notices.sbLeftRoom.interpolate({userName: firstName}));

                    });
                }


                if(Q.Audio.collection[_options.sounds.participantDisconnected]) {
                    log('play leave music 1', _options.sounds.participantDisconnected, this);
                    Q.Audio.collection[_options.sounds.participantDisconnected].audio.play()
                } else {
                    Q.Audio.load(_options.sounds.participantDisconnected, function () {
                        log('play leave music 2', _options.sounds.participantDisconnected, this);
                        Q.Audio.collection[_options.sounds.participantDisconnected].audio.play()
                    });
                }

                screensRendering.onParticipantDisconnected(participant);

                screensRendering.updateLayout();
            });
            webrtcSignalingLib.event.on('localParticipantDisconnected', function (participant) {
                log('you left the room')
                notice.show(Q.getObject("webrtc.notices.youLeftRoom", text));
                screensRendering.updateLayout();
            });
            webrtcSignalingLib.event.on('participantRemoved', function (participant) {
                log('you left the room')
                //screensRendering.removeParticipantsScreens();
                screensRendering.onParticipantDisconnected(participant);
            });


            webrtcSignalingLib.event.on('screenAdded', function (participant) {
                log('screen added', participant)
                screensRendering.updateLayout();
            });
            webrtcSignalingLib.event.on('screenRemoved', function (participant) {
                log('screen removed', participant)
                screensRendering.updateLayout();
            });
            webrtcSignalingLib.event.on('trackAdded', function (e) {
                log('track added', e)
                screensRendering.newTrackAdded(e.track, e.participant);
                //screensRendering.updateLayout();


                //screensRendering.newTrackAdded(e.track);
            });

            webrtcSignalingLib.event.on('trackMuted', function (e) {
                log('track muted', e)
                if(e.track.kind == 'video') {
                    screensRendering.showLoader('videoMuted', {screen: e.screen, participant: e.screen.participant});
                    screensRendering.onVideoMute(e.track, e.participant);
                }


            });

            webrtcSignalingLib.event.on('trackUnmuted', function (e) {
                log('track unmuted', e)
                if(e.track.kind == 'video') {
                    screensRendering.hideLoader('videoUnmuted', {screen: e.screen, participant: e.screen.participant});
                    screensRendering.onVideoUnMute(e.track);
                }
            });

            webrtcSignalingLib.event.on('videoTrackIsBeingAdded', function (e) {
                log('video track is being added', e)
                screensRendering.videoTrackIsAdding(e.track, e.participant);
                screensRendering.updateLayout();
            });

            webrtcSignalingLib.event.on('videoTrackLoaded', function (e) {
                log('video track loaded', e)
                screensRendering.onVideoTrackLoaded(e.track);
            });

            webrtcSignalingLib.event.on('remoteScreensharingStarting', function (e) {
                log('screen sharing is being started', e)

                screensRendering.toggleLoudestScreenMode('disabled');
                screensRendering.onScreensharingStarting(e);
                screensRendering.showLoader('screensharingStarting', {participant: e.participant});
            });

            webrtcSignalingLib.event.on('remoteScreensharingStarted', function (e) {
                log('screen sharing is started', e)

                var handleScreensharring = function() {
                    let tracks = e.participant.tracks;
                    let screensharingTrack;
                    for (let i in tracks) {
                        if(!tracks[i].stream) continue;    
                        if(tracks[i].stream.id == e.content.streamId) {
                            screensharingTrack = tracks[i];
                        }
                    }
    
                    if(!screensharingTrack) {
                        return false;
                    }

                    let currentViewMode = screensRendering.getActiveViewMode();
                    let currentViewModeIsRight = false;
                    if(Q.info.isMobile) {
                        if(currentViewMode == 'maximizedMobile') currentViewModeIsRight = true
                    } else {
                        if(currentViewMode == 'fullScreen' || currentViewMode == 'screenSharing') currentViewModeIsRight = true
                    }
                    if(screensharingTrack.parentScreen && screensharingTrack.parentScreen.screensharing && currentViewModeIsRight) {
                        return true
                    };
    
                    if(Q.info.isMobile){
                        screensRendering.renderMaximizedScreensGridMobile(screensharingTrack.parentScreen);
                    } else {
                        screensRendering.renderFullScreenLayout(screensharingTrack.parentScreen);
                    }
                    screensRendering.updateLayout();

                    return true;
                }

                var checkIfScreensharingTrackAdded = function () {
                    setTimeout(function () {
                        if (!handleScreensharring()) {
                            checkIfScreensharingTrackAdded();
                        }
                    }, 500);
                }

                if(!handleScreensharring()) {
                    checkIfScreensharingTrackAdded();
                }                
            });

            webrtcSignalingLib.event.on('afterCamerasToggle', function (e) {
                screensRendering.hideLoader('afterCamerasToggle', {participant: e.participant});
            });
            webrtcSignalingLib.event.on('beforeCamerasToggle', function (e) {
                screensRendering.showLoader('beforeCamerasToggle', {participant: e.participant});
            });
            webrtcSignalingLib.event.on('screensharingStarted', function (e) {
                log('screen sharing started', e)
                
            });
            webrtcSignalingLib.event.on('remoteScreensharingFailed', function (e) {
                log('screen sharing failed')
                screensRendering.hideLoader('screensharingFailed', {participant: e.participant});
            });
            webrtcSignalingLib.event.on('screensharingStopped', function (e) {
                //screensharingStopped is local only event that is fired when localParticipant stops sharing screen
                log('screen sharing stopped')
                let usersScreens = webrtcSignalingLib.localParticipant().screens;
                for(let s in usersScreens) {
                    if(usersScreens[s].screensharing && usersScreens.length > 1) {
                        usersScreens[s].remove();
                    }
                }
                screensRendering.updateLayout();
            });
            webrtcSignalingLib.event.on('cameraRequested', function (e) {
                log('somebody requested camera')


            });

            webrtcSignalingLib.event.on('someonesCameraEnabled', function (e) {
                screensRendering.onSomeonesCameraEnabled(e.participant);
            })
            webrtcSignalingLib.event.on('someonesMicEnabled', function (e) {
                screensRendering.onSomeonesMicEnabled(e.participant);
            })

            webrtcSignalingLib.event.on('someonesCameraDisabled', function (e) {
                screensRendering.onSomeonesCameraDisabled(e.participant);
            })
            webrtcSignalingLib.event.on('someonesMicDisabled', function (e) {
                screensRendering.onSomeonesMicDisabled(e.participant);
            })

            webrtcSignalingLib.event.on('connected', function () {
                log('Connected to server')
                connectionState.updateStatus('Connected');
                connectionState.show();

                setTimeout(function () {
                    connectionState.hide();

                }, 1000);
            });
            webrtcSignalingLib.event.on('connectError', function () {
                log('Server connection failed')
                connectionState.show();
                //connectionState.updateStatus('reconnecting', 'Server connection failed: ');
            });
            webrtcSignalingLib.event.on('reconnectError', function () {
                log('Server reconnection failed')
                connectionState.updateStatus('reconnection failed', 'Server connection failed: ');
            });
            webrtcSignalingLib.event.on('reconnectAttempt', function (n) {
                log('Server reconnection attempt ' + n)
                connectionState.updateStatus('reconnection attempt ' + n, 'Server connection failed: ');
            });
            webrtcSignalingLib.event.on('forceLeave', function () {
                log('force leave')
                module.stop(null, true);
                module.start();
            });

            var updateLayoutOnResize = function() {
                setTimeout(function () {
                    screensRendering.updateLayout();
                }, 1000)
            }

            window.addEventListener("resize", updateLayoutOnResize);

            webrtcSignalingLib.event.on('disconnected', function () {
                window.removeEventListener('resize', updateLayoutOnResize);
            });

        }

        /**
         * Show dialog with insturctions in case when it's impossible to access microphone or camera.
         * @method showInstructionsDialog
         * @param {String} [kind] Name of device that is not accessible.
         */
        var connectionState = (function () {

            var preparingWindow = (_options.showPreparingDialog || (!_options.startWith.video && !_options.startWith.audio));

            var _notice = null;
            var _currentState = preparingWindow ? "Checking room's state" : 'Connecting...';

            function show(state) {
                if(state != null) updateStatus(state);
            }

            function hide() {
                var removeNotice = function() {
                    if(_notice != null && _notice.element.parentNode != null && document.body.contains(_notice.element)) {
                        _notice.remove();
                    }
                }

                if(_currentState.toLowerCase() == 'connected') {
                    setTimeout(removeNotice, 4000);
                } else {
                    removeNotice();
                }

            }

            function updateStatus(state, text) {
                _currentState = state;
                var message = ''
                if(text != null) message += text;
                if(state != null) message += state;

                if(_notice != null && document.body.contains(_notice.element)) {
                    _notice.update(message);
                } else {
                    _notice = notice.show(message, true, true, 'left');
                }
            }

            return {
                show:show,
                hide:hide,
                updateStatus:updateStatus
            }

        }());

        /**
         * Show dialog with insturctions in case when it's impossible to access microphone or camera.
         * @method showInstructionsDialog
         * @param {String} [kind] Name of device that is not accessible.
         */
        function showInstructionsDialog(kind) {
            var instructionsPermissionDialog = document.createElement('DIV');
            instructionsPermissionDialog.className = 'Streams_webrtc_devices_dialog_inner';
            var dialogList = document.createElement('OL');
            dialogList.className = 'Streams_webrtc_instructions_dialog';

            if(Q.info.platform === 'ios') {
                dialogList.innerHTML = `<div>` + text.webrtc.webIosInstructionsDialog.permissionDenied.interpolate({kind: kind}) + `</div>`;
                //Q.getObject("webrtc.allow." + titleText, text)
            } else {
                dialogList.innerHTML = `<div>` + text.webrtc.webInstructionsDialog.permissionDenied.interpolate({kind: kind}) + `</div>
									<li>` + Q.getObject("webrtc.webInstructionsDialog.point1", text) + `</li>
									<li>` + text.webrtc.webInstructionsDialog.point2.interpolate({hostname: location.hostname}) + `</li>`;
            }

            instructionsPermissionDialog.appendChild(dialogList);
            Q.Dialogs.push({
                title: Q.getObject("webrtc.webInstructionsDialog.dialogTitle", text),
                className: 'Streams_webrtc_devices_dialog',
                content: instructionsPermissionDialog,
                apply: true
            });
        }

        /**
         * Show dialog with buttons to get permissions for camera and/or mirophone and "Join room" button.
         * @method showPreparingDialog
         */
        function showPreparingDialog(callback, closeCallback, streams) {
            var micSVG = '<svg class="microphone-icon" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"    y="0px" viewBox="-0.165 -0.245 99.499 99.498"    enable-background="new -0.165 -0.245 99.499 99.498" xml:space="preserve">  <path fill="#FFFFFF" d="M49.584-0.245c-27.431,0-49.749,22.317-49.749,49.749c0,27.432,22.317,49.749,49.749,49.749   c27.432,0,49.75-22.317,49.75-49.749C99.334,22.073,77.016-0.245,49.584-0.245z M41.061,32.316c0-4.655,3.775-8.43,8.431-8.43   c4.657,0,8.43,3.774,8.43,8.43v19.861c0,4.655-3.773,8.431-8.43,8.431c-4.656,0-8.431-3.775-8.431-8.431V32.316z M63.928,52.576   c0,7.32-5.482,13.482-12.754,14.336v5.408h6.748v3.363h-16.86V72.32h6.749v-5.408c-7.271-0.854-12.753-7.016-12.754-14.336v-10.33   h3.362v10.125c0,6.115,4.958,11.073,11.073,11.073c6.116,0,11.073-4.958,11.073-11.073V42.246h3.363V52.576z"/>  </svg>';
            var disabledMicSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="0.049 -0.245 99.499 99.498" enable-background="new 0.049 -0.245 99.499 99.498"    xml:space="preserve">  <path fill="#FFFFFF" d="M49.797,99.253c-27.431,0-49.749-22.317-49.749-49.749c0-27.431,22.317-49.749,49.749-49.749   c27.432,0,49.75,22.317,49.75,49.749C99.548,76.936,77.229,99.253,49.797,99.253z M49.797,3.805   c-25.198,0-45.698,20.5-45.698,45.699s20.5,45.699,45.698,45.699c25.2,0,45.7-20.501,45.7-45.699S74.997,3.805,49.797,3.805z"/>  <path fill="#FFFFFF" d="M49.798,60.607c4.657,0,8.43-3.775,8.43-8.431v-8.634L44.893,59.024   C46.276,60.017,47.966,60.607,49.798,60.607z"/>  <path fill="#FFFFFF" d="M58.229,32.316c0-4.656-3.773-8.43-8.43-8.43c-4.656,0-8.43,3.775-8.431,8.43v19.861   c0,0.068,0.009,0.135,0.01,0.202l16.851-19.563V32.316z"/>  <path fill="#FFFFFF" d="M48.117,66.912v5.408h-6.749v3.363h16.86V72.32h-6.748v-5.408c7.271-0.854,12.754-7.016,12.754-14.336   v-10.33H60.87v10.125c0,6.115-4.957,11.073-11.072,11.073c-2.537,0-4.867-0.862-6.733-2.297l-2.305,2.675   C42.813,65.475,45.331,66.585,48.117,66.912z"/>  <path fill="#FFFFFF" d="M38.725,52.371V42.246h-3.362v10.33c0,1.945,0.397,3.803,1.102,5.507l2.603-3.022   C38.852,54.198,38.725,53.301,38.725,52.371z"/>  <rect x="47.798" y="11.385" transform="matrix(0.7578 0.6525 -0.6525 0.7578 43.3634 -20.8757)" fill="#C12337" width="4" height="73.163"/>  </svg>';
            var cameraSVG = '<svg version="1.1"    xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/"    x="0px" y="0px" width="101px" height="101px" viewBox="-0.335 -0.255 101 101" enable-background="new -0.335 -0.255 101 101"    xml:space="preserve">  <defs>  </defs>  <path opacity="0.2" d="M50,2.5C23.809,2.5,2.5,23.808,2.5,50S23.808,97.499,50,97.499c26.191,0,47.5-21.308,47.5-47.499   C97.5,23.809,76.19,2.5,50,2.5z"/>  <path fill="#FFFFFF" d="M50,0C22.431,0,0,22.43,0,50c0,27.57,22.429,49.999,50,49.999c27.57,0,50-22.429,50-49.999   C100,22.431,77.569,0,50,0z M77.71,61.245l-15.599-9.006v8.553H25.516V37.254h36.595v8.839l15.599-9.006V61.245z"/>  </svg>';
            var disabledCameraSVG = '<svg  version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="-0.165 -0.245 99.499 99.498" enable-background="new -0.165 -0.245 99.499 99.498"    xml:space="preserve">  <path fill="#FFFFFF" d="M49.584-0.245c-27.431,0-49.749,22.317-49.749,49.749c0,27.432,22.317,49.749,49.749,49.749   c27.432,0,49.75-22.317,49.75-49.749C99.334,22.073,77.016-0.245,49.584-0.245z M49.584,95.203   c-25.198,0-45.698-20.501-45.698-45.699s20.5-45.699,45.698-45.699c25.199,0,45.699,20.5,45.699,45.699S74.783,95.203,49.584,95.203   z"/>  <polygon fill="#FFFFFF" points="61.635,39.34 43.63,60.242 61.635,60.242 61.635,51.732 77.156,60.693 77.156,36.656 61.635,45.617    "/>  <polygon fill="#FFFFFF" points="25.223,36.822 25.223,60.242 34.391,60.242 54.564,36.822 "/>  <rect x="47.585" y="11.385" transform="matrix(0.7578 0.6525 -0.6525 0.7578 43.3117 -20.7363)" fill="#C12337" width="4" height="73.163"/>  </svg>';
            var screenSharingSVG = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"  width="100px" height="100px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"> <path fill="#FFFFFF" d="M50.072,0.054c-27.57,0-49.999,22.429-49.999,50c0,27.57,22.429,50,49.999,50  c27.571,0,50.001-22.43,50.001-50C100.073,22.484,77.644,0.054,50.072,0.054z M76.879,63.696H53.705v5.222h5.457v3.77H40.987v-3.77  h5.458v-5.222H23.268V31.439H76.88L76.879,63.696L76.879,63.696z"/> </svg>';
            var disabledScreenSharingSVG = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"  width="100px" height="100px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"> <path fill="#FFFFFF" d="M50.172,100.346C22.508,100.346,0,77.838,0,50.172C0,22.508,22.508,0,50.172,0  c27.666,0,50.173,22.508,50.173,50.172C100.346,77.838,77.839,100.346,50.172,100.346z M50.172,4.084  C24.76,4.084,4.084,24.76,4.084,50.172c0,25.414,20.675,46.088,46.088,46.088c25.414,0,46.088-20.675,46.088-46.088  C96.261,24.76,75.586,4.084,50.172,4.084z"/> <g>  <polygon fill="#FCFCFC" points="60.309,31.439 23.268,31.439 23.268,63.696 32.533,63.696 "/>  <polygon fill="#FCFCFC" points="68.252,31.439 40.478,63.696 46.444,63.696 46.444,68.918 40.987,68.918 40.987,72.688   59.162,72.688 59.162,68.918 53.705,68.918 53.705,63.696 76.879,63.696 76.88,63.696 76.88,31.439 "/> </g> <rect x="47.83" y="11.444" transform="matrix(-0.7577 -0.6526 0.6526 -0.7577 56.1462 117.2643)" fill="#C12337" width="4.02" height="73.532"/> </svg>';
            var userSVG = '<svg version="1.1" id="Слой_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"  width="100px" height="100px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"> <path d="M65.904,52.834c-4.734,3.725-10.695,5.955-17.172,5.955c-6.316,0-12.146-2.119-16.821-5.68C16.654,55.575,5,68.803,5,84.757  c0,11.78,14.356,10.197,32.065,10.197h25.869C80.643,94.954,95,97,95,84.757C95,68.051,82.221,54.333,65.904,52.834z"/> <path d="M48.732,55.057c13.286,0,24.092-10.809,24.092-24.095c0-13.285-10.807-24.094-24.092-24.094  c-13.285,0-24.093,10.809-24.093,24.094C24.64,44.248,35.448,55.057,48.732,55.057z"/> </svg>';

            var usersAvatar = null;
            var preJoiningStreams = [];

            var preAudioStream, preVideoStream;
            if(streams.length != 0) {
                preAudioStream = {kind:'audio', stream:new MediaStream()};
                preVideoStream = {kind:'camera', stream:new MediaStream()};

                for(let s in streams) {
                    let tracks = streams[s].getTracks();
                    for(let t in tracks) {
                        if(tracks[t].kind == 'audio') {
                            preAudioStream.stream.addTrack(tracks[t]);
                        } else {
                            preVideoStream.stream.addTrack(tracks[t]);
                        }
                    }
                }
                if(preAudioStream.stream.getTracks().length != 0) {
                    preJoiningStreams.push(preAudioStream);
                    _options.startWith.audio = true;
                } else {
                    preAudioStream = null;
                }
                if(preVideoStream.stream.getTracks().length != 0) {
                    preJoiningStreams.push(preVideoStream);
                    _options.startWith.video = true;
                } else {
                    preVideoStream = null;
                }
            }

            var md = navigator.mediaDevices;

            var setAvatarOnPreview = function(cameraPreview) {
                if(!cameraPreview.parentNode.classList.contains('Streams_webrtc_preparing_active-audio')) cameraPreview.parentNode.classList.add('Streams_webrtc_preparing_active-audio');

                if(usersAvatar != null) {
                    cameraPreview.innerHTML = '';
                    cameraPreview.appendChild(usersAvatar);
                } else {
                    Q.Streams.Avatar.get(Q.Users.loggedInUserId(), function (err, avatar) {
                        if (!avatar) {
                            return;
                        }

                        var src = Q.url(avatar.iconUrl(400));
                        if(src != null) {
                            var avatarImg = new Image();
                            avatarImg.src = src;
                            let avatarCon = document.createElement('DIV');
                            avatarCon.className = 'Streams_webrtc_preparing_camera-preview-avatar-con';
                            avatarCon.appendChild(avatarImg);
                            cameraPreview.innerHTML = '';
                            cameraPreview.appendChild(avatarCon);
                            usersAvatar = avatarCon;

                        }
                    });
                }
            }

            var gotDevicesList = function(mediaDevices) {
                var videoDevices = 0;
                var audioDevices = 0;
                for(var i in mediaDevices) {
                    if (mediaDevices[i].kind === 'videoinput' || mediaDevices[i].kind === 'video') {
                        videoDevices++;
                    } else if (mediaDevices[i].kind === 'audioinput' || mediaDevices[i].kind === 'audio') {
                        audioDevices++;
                    }
                }

                var mediaDevicesDialog = document.createElement('DIV');
                mediaDevicesDialog.className = 'Streams_webrtc_preparing_dialog_inner';

                if(Q.info.isMobile){
                    var close=document.createElement('div');
                    close.className = 'Streams_webrtc_close-dialog-sign';
                    close.innerHTML = '&#10005;';
                    close.addEventListener('click', function() {
                        let preparingScreen = document.querySelector('.Streams_webrtc_preparing_screen');
                        if(preparingScreen != null && preparingScreen.parentNode != null) preparingScreen.parentNode.removeChild(preparingScreen);
                        if(checkStatusInterval) {
                            clearInterval(checkStatusInterval);
                            checkStatusInterval = null;
                        }
                        switchMic(true);
                        switchCamera(true);
                        switchScreenshare(true);
                        Q.handle(_options.onWebRTCRoomEnded);
                        if(closeCallback != null) closeCallback();
                    });
                    mediaDevicesDialog.appendChild(close);
                }


                var cameraPreview = document.createElement('DIV');
                cameraPreview.className = 'Streams_webrtc_preparing_camera-preview';

                var buttonsCon = document.createElement('DIV');
                buttonsCon.className = 'Streams_webrtc_devices_dialog_buttons_con';
                var buttonsInner = document.createElement('DIV');
                buttonsInner.className = 'Streams_webrtc_devices_dialog_buttons_inner_con';

                if(Q.info.isCordova && Q.info.platform === 'ios' && _options.useCordovaPlugins) {
                    buttonsCon.style.position = 'relative';
                    mediaDevicesDialog.classList.add('Streams_webrtc_preparing_dialog_inner_cordova');
                    mediaDevicesDialog.style.background = 'black';
                }

                var switchMicBtn = document.createElement('DIV');
                switchMicBtn.type = 'button';
                switchMicBtn.className = 'Streams_webrtc_prep-switch-mic';
                switchMicBtn.innerHTML = preAudioStream ? micSVG : disabledMicSVG;

                var switchCameraBtn = document.createElement('DIV');
                switchCameraBtn.type = 'button';
                switchCameraBtn.className = 'Streams_webrtc_prep-switch-camera';
                switchCameraBtn.innerHTML = preVideoStream ? cameraSVG : disabledCameraSVG;

                var switchScreenSharingBtn = document.createElement('DIV');
                switchScreenSharingBtn.type = 'button';
                switchScreenSharingBtn.className = 'Streams_webrtc_prep-switch-screen';
                switchScreenSharingBtn.innerHTML = disabledScreenSharingSVG;

                var joinButtonCon = document.createElement('DIV');
                joinButtonCon.className = 'Streams_webrtc_join-button-con';
                var joinButton = document.createElement('DIV');
                joinButton.type = 'button';
                joinButton.className = 'Q_button Streams_webrtc_join-button';
                joinButton.innerHTML = Q.getObject("webrtc.preparing.joinNow", text);


                //meetingStatus.appendChild(participantsIcon);
                mediaDevicesDialog.appendChild(cameraPreview);
                buttonsInner.appendChild(switchMicBtn);
                if(!_options.audioOnlyMode) buttonsInner.appendChild(switchCameraBtn);
                if(!(Q.info.isMobile || Q.info.isTablet || _options.audioOnlyMode) || Q.info.isCordova) buttonsInner.appendChild(switchScreenSharingBtn);
                buttonsCon.appendChild(buttonsInner);
                mediaDevicesDialog.appendChild(buttonsCon);
                joinButtonCon.appendChild(joinButton);
                mediaDevicesDialog.appendChild(joinButtonCon);
                //mediaDevicesDialog.appendChild(breakEl);

                if(!preVideoStream) setAvatarOnPreview(cameraPreview);

                var switchMic = function (off) {
                    if(audioDevices == 0) {
                        Q.alert('Audio input devices were not found on your device.')
                        return
                    }

                    let audioIsAlreadyEnabled = false;
                    for(let s in preJoiningStreams) {
                        if(preJoiningStreams[s].kind == 'audio') {
                            audioIsAlreadyEnabled = s;
                        }
                    }
                    log('switchMic: audioIsAlreadyEnabled ' +  audioIsAlreadyEnabled)

                    if((_options.startWith.audio === false || audioIsAlreadyEnabled === false || preJoiningStreams[audioIsAlreadyEnabled].stream == null) && off == null) {
                        log('switchMic: getUserMedia: before')

                        if(audioIsAlreadyEnabled !== false && preJoiningStreams[audioIsAlreadyEnabled].stream != null) {
                            _options.startWith.audio = true;
                            switchMicBtn.innerHTML = micSVG;
                        } else {
                            var preStream = {kind:'audio', stream:null};
                            preJoiningStreams.push(preStream);

                            md.getUserMedia({audio:true})
                                .then(function (stream) {
                                    log('switchMic: getUserMedia: got stream')

                                    preStream.stream = stream;
                                    switchMicBtn.innerHTML = micSVG;
                                    _options.startWith.audio = true;
                                }).catch(function (err) {
                                if(err.name == "NotAllowedError") showInstructionsDialog('camera/microphone');
                                for (let s = preJoiningStreams.length - 1; s >= 0; s--) {
                                    if(preJoiningStreams[s] == preStream) {
                                        preJoiningStreams.splice(s, 1);
                                    }
                                }
                                console.error(err.name + ": " + err.message);
                            });
                        }

                    } else if(_options.startWith.audio === true && audioIsAlreadyEnabled !== false && preJoiningStreams[audioIsAlreadyEnabled].stream != null) {
                        log('switchMic: audioIsAlreadyEnabled ' + audioIsAlreadyEnabled)

                        if(off) {
                            let tracks = preJoiningStreams[audioIsAlreadyEnabled].stream.getAudioTracks();
                            for(let t in tracks) {
                                tracks[t].stop();
                            }

                            preJoiningStreams.splice(audioIsAlreadyEnabled, 1);
                        }

                        switchMicBtn.innerHTML = disabledMicSVG;
                        _options.startWith.audio = false;
                    }
                }

                switchMicBtn.addEventListener('mouseup', function () {
                    switchMic();
                });

                var setVideoPreview = function(stream) {
                    log('setVideoPreview', stream);
                    let videoPreview = document.createElement('video');
                    let screenVideo = cameraPreview.querySelector('video');
                    try {
                        videoPreview.srcObject = stream;

                    } catch (e) {
                        console.error(e);
                    }

                    videoPreview.setAttributeNode(document.createAttribute('autoplay'));
                    videoPreview.setAttributeNode(document.createAttribute('playsinline'));
                    if(screenVideo != null) {
                        screenVideo.parentElement.insertBefore(videoPreview, screenVideo);
                    } else {
                        cameraPreview.innerHTML = '';
                        cameraPreview.appendChild(videoPreview);
                    }

                    if(cameraPreview.parentNode.classList.contains('Streams_webrtc_preparing_active-audio')) {
                        cameraPreview.parentNode.classList.remove('Streams_webrtc_preparing_active-audio');
                    }



                    videoPreview.play().then((e) => {
                        log('camera: play func success')
                    }).catch((e) => {
                        console.error(e)
                        log('camera: play func error')
                    });
                }

                var switchCamera = function (off) {
                    if(videoDevices == 0) {
                        Q.alert('Video input devices were not found on your device.')
                        return
                    }

                    let cameraIsAlreadyEnabled = false;
                    for(let s in preJoiningStreams) {
                        if(preJoiningStreams[s].kind == 'camera') {
                            cameraIsAlreadyEnabled = s;
                        }
                    }

                    log('switchCamera', cameraIsAlreadyEnabled)

                    if(cameraIsAlreadyEnabled === false && off == null) {
                        log('switchCamera: getUserMedia: before')

                        var preStream = {kind:'camera', stream:null};
                        preJoiningStreams.push(preStream);

                        let constraints;
                        if(Q.info.isCordova) {
                            constraints = {
                                'audio': false,
                                'video': {
                                    width: { min: 320, max: 1280 },
                                    height: { min: 240, max: 720 }
                                }
                            }
                        } else {
                            constraints = {video:true};
                        }
                        md.getUserMedia(constraints)
                            .then(function (stream) {
                                preStream.stream = stream;
                                setVideoPreview(stream);
                                switchCameraBtn.innerHTML = cameraSVG;
                                _options.startWith.video = true;
                            }).catch(function (err) {
                            if(err.name == "NotAllowedError") showInstructionsDialog('camera/microphone');
                            for (let s = preJoiningStreams.length - 1; s >= 0; s--) {
                                if(preJoiningStreams[s] == preStream) {
                                    preJoiningStreams.splice(s, 1);
                                }
                            }
                            console.error(err.name + ": " + err.message);

                        });
                    } else if(cameraIsAlreadyEnabled !== false && preJoiningStreams[cameraIsAlreadyEnabled].stream != null) {
                        log('switchCamera: cameraIsAlreadyEnabled ' + cameraIsAlreadyEnabled)

                        let tracks = preJoiningStreams[cameraIsAlreadyEnabled].stream.getVideoTracks();
                        for(let t in tracks) {
                            tracks[t].stop();
                        }
                        preJoiningStreams.splice(cameraIsAlreadyEnabled, 1);
                        switchCameraBtn.innerHTML = disabledCameraSVG;
                        let screenVideo = cameraPreview.querySelectorAll('video');
                        if(screenVideo.length == 2) {
                            cameraPreview.removeChild(cameraPreview.firstChild);
                        } else {
                            setAvatarOnPreview(cameraPreview);
                        }
                        _options.startWith.video = false;
                    }

                }
                if(preVideoStream) setVideoPreview(preVideoStream.stream);

                switchCameraBtn.addEventListener('mouseup', function () {
                    switchCamera();
                });

                var switchScreenshare = function (off) {
                    let screenIsAlreadyEnabled = false;
                    for(let s in preJoiningStreams) {
                        if(preJoiningStreams[s].kind == 'screen') {
                            screenIsAlreadyEnabled = s;
                        }
                    }

                    var getUserScreen = function() {
                        if(navigator.getDisplayMedia || navigator.mediaDevices.getDisplayMedia) {

                            if(navigator.mediaDevices.getDisplayMedia) {
                                return navigator.mediaDevices.getDisplayMedia({video: true});
                            }
                            else if(navigator.getDisplayMedia) {
                                return navigator.getDisplayMedia({video: true})
                            }
                            return;
                        }
                    }

                    if(screenIsAlreadyEnabled === false && off == null) {
                        log('switchScreenshare: getUserScreen: before')

                        var preStream = {kind:'screen', stream:null};
                        preJoiningStreams.push(preStream);

                        getUserScreen().then(function (stream) {
                            stream.getVideoTracks()[0].contentHint = 'detail';
                            preStream.stream = stream;
                            let screenPreview = document.createElement('video');
                            let cameraVideos = cameraPreview.querySelector('video');
                            if(cameraVideos != null) {
                                cameraPreview.appendChild(screenPreview);
                            } else {
                                cameraPreview.innerHTML = '';
                                cameraPreview.appendChild(screenPreview);
                            }

                            if(cameraPreview.parentNode.classList.contains('Streams_webrtc_preparing_active-audio')) {
                                cameraPreview.parentNode.classList.remove('Streams_webrtc_preparing_active-audio');
                            }

                            screenPreview.srcObject = stream;
                            screenPreview.setAttributeNode(document.createAttribute('autoplay'));
                            screenPreview.setAttributeNode(document.createAttribute('playsinline'));

                            switchScreenSharingBtn.innerHTML = screenSharingSVG;
                            screenPreview.play().then((e) => {
                                log('screen: play func success')
                            }).catch((e) => {
                                console.error(e)
                                log('screen: play func error')

                            });

                            _options.startWith.video = true;
                        }).catch(function(error) {
                            for (let s = preJoiningStreams.length - 1; s >= 0; s--) {
                                if(preJoiningStreams[s] == preStream) {
                                    preJoiningStreams.splice(s, 1);
                                }
                            }
                            console.error(error.name + ': ' + error.message);
                        });
                    } else if(screenIsAlreadyEnabled !== false && preJoiningStreams[screenIsAlreadyEnabled].stream != null) {
                        log('switchScreenshare: getUserScreen: screenIsAlreadyEnabled ' + screenIsAlreadyEnabled)

                        let tracks = preJoiningStreams[screenIsAlreadyEnabled].stream.getVideoTracks();
                        for(let t in tracks) {
                            tracks[t].stop();
                        }

                        preJoiningStreams.splice(screenIsAlreadyEnabled, 1);
                        switchScreenSharingBtn.innerHTML = disabledScreenSharingSVG;
                        let screenVideo = cameraPreview.querySelectorAll('video');
                        if(screenVideo.length == 2) {
                            cameraPreview.removeChild(cameraPreview.lastChild);
                        } else {
                            setAvatarOnPreview(cameraPreview);
                        }
                        _options.startWith.video = false;
                    }

                }
                //if(_options.showPreparingDialog.screen === true) switchScreenshare();
                switchScreenSharingBtn.addEventListener('mouseup', function () {
                    switchScreenshare();
                });

                //var roomId = _options.roomId != null ? _options.roomId : null;
                //if(_options.roomPublisherId == null) _options.roomPublisherId = Q.Users.loggedInUser.id;

                function checkmeetingStatus() {

                    Q.req("Streams/webrtc", ["status"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);

                        if (msg) {
                            return Q.alert(msg);
                        }

                        if(!response.slots) return;
                        let stream = response.slots.status.stream;
                        let live = response.slots.status.live;
                        if(live) {
                            if(connectionState) {
                                connectionState.updateStatus('Room is live');
                            }
                        } else {
                            if(connectionState){
                                connectionState.updateStatus('Room is offline');
                            }
                        }
                    }, {
                        method: 'get',
                        fields: {
                            roomId: _options.roomId,
                            publisherId: _options.roomPublisherId,
                        }
                    });
                }
                if(_options.roomId != null && _options.roomPublisherId != null) {
                    checkmeetingStatus();
                    var checkStatusInterval = setInterval(checkmeetingStatus, 3000);
                }

                var joinAction = false;
                var joinNow = function() {
                    if(_options.streams == null) {
                        _options.streams = [];
                    }

                    let audioEnabled = false;
                    for(let s in preJoiningStreams) {
                        if(preJoiningStreams[s].kind == 'audio') {
                            audioEnabled = true;
                        }
                    }
                    if((Q.info.isMobile || Q.info.isTablet) && !Q.info.isCordova && audioEnabled == false) {
                        if(connectionState) connectionState.show('You should to turn microphone on to be able to join');
                        return;
                    }

                    for(let s in preJoiningStreams) {
                        _options.streams.push(preJoiningStreams[s].stream);
                    }

                    joinAction = true;
                    var dialog = Q.Dialogs.pop();
                    joinAction = false;
                    //if(dialog && dialog.parentNode != null) dialog.parentNode.removeChild(dialog);

                    if(checkStatusInterval) {
                        clearInterval(checkStatusInterval);
                        checkStatusInterval = null;
                    }

                    let preparingScreen = document.querySelector('.Streams_webrtc_preparing_screen');
                    if(preparingScreen != null && preparingScreen.parentNode != null) preparingScreen.parentNode.removeChild(preparingScreen);
                    if(callback != null) callback()
                }

                joinButton.addEventListener('mouseup', joinNow);


                if(Q.info.isMobile && !Q.info.isCordova) {
                    var screen = document.createElement('DIV')
                    screen.className = 'Streams_webrtc_preparing_screen';
                    screen.appendChild(mediaDevicesDialog);
                    if( _options.element != null) document.body.appendChild(screen);
                } else {


                    Q.Dialogs.push({
                        title: Q.text.Streams.webrtc.preparing.dialogTitle,
                        className: 'Streams_webrtc_preparing_dialog',
                        content: mediaDevicesDialog,
                        apply: false,
                        mask: false,
                        hidePrevious:true,
                        removeOnClose: true,
                        beforeClose: function() {
                            if(joinAction) return;
                            if(checkStatusInterval) {
                                clearInterval(checkStatusInterval);
                                checkStatusInterval = null;
                            }
                            switchMic(true);
                            switchCamera(true);
                            switchScreenshare(true);
                            Q.handle(_options.onWebRTCRoomEnded);
                            if(closeCallback != null) closeCallback();

                        },
                        onClose:function () {

                        },
                    });
                }



            }

            if(Q.info.isCordova && Q.info.platform === 'ios' && _options.useCordovaPlugins) {
                cordova.plugins.iosrtc.enumerateDevices().then(gotDevicesList)
            } else {
                navigator.mediaDevices.enumerateDevices().then(gotDevicesList)
            }

        }

        /**
         * Prepare media tracks while user are joining the room and publish them after user is joined the room.
         * @method getMediaStream
         */
        function getMediaStream(constrains) {
            log('getMediaStream: video = ' + (constrains != null && constrains.video))
            log('getMediaStream: audio = ' + (constrains != null && constrains.audio))

            if(Q.info.isCordova && Q.info.platform === 'ios' && _options.useCordovaPlugins) {
                return new Promise(function(resolve, reject) {

                    cordova.plugins.iosrtc.enumerateDevices().then(function(mediaDevicesList) {
                        var mediaDevices = mediaDevicesList;

                        var videoDevices = 0;
                        var audioDevices = 0;
                        for (var i in mediaDevices) {
                            if (mediaDevices[i].kind.indexOf('video') != -1) {
                                videoDevices++;
                            } else if (mediaDevices[i].kind.indexOf('audio') != -1) {
                                audioDevices++;
                            }
                        }

                        var showInstructionsDialogIos = function(kind) {
                            var instructionsPermissionDialog = document.createElement('DIV');
                            instructionsPermissionDialog.className = 'Streams_webrtc_devices_dialog_inner';
                            var dialogList = document.createElement('OL');
                            dialogList.className = 'Streams_webrtc_instructions_dialog';
                            dialogList.innerHTML = `<div>` + text.webrtc.iosInstructionsDialog.permissionDenied.interpolate({kind: kind}) + `</div>
									<li>` + Q.getObject("webrtc.iosInstructionsDialog.point1", text) + `</li>
									<li>` + Q.getObject("webrtc.iosInstructionsDialog.point2", text) + `</li>
									<li>` + text.webrtc.iosInstructionsDialog.point3.interpolate({kind: kind}) + `</li>
									<li>` + text.webrtc.iosInstructionsDialog.point4.interpolate({communityId: Q.Users.communityId}) + `</li>`;
                            instructionsPermissionDialog.appendChild(dialogList);
                            Q.Dialogs.push({
                                title: Q.getObject("webrtc.iosInstructionsDialog.dialogTitle", text),
                                className: 'Streams_webrtc_devices_dialog',
                                content: instructionsPermissionDialog,
                                apply: true
                            });
                        }

                        if(constrains.video && videoDevices != 0 && constrains.audio && audioDevices != 0) {

                            cordova.plugins.iosrtc.getUserMedia( { video: true, audio: false } )
                                .then(function (videoStream) {
                                    log('requestVideoStream: got stream');
                                    cordova.plugins.iosrtc.getUserMedia( { video: false, audio: true } )
                                        .then(function (audioStream) {
                                            log('requestAudioStream: got stream');
                                            resolve([videoStream, audioStream]);
                                        })
                                        .catch(function (err) {
                                            showInstructionsDialogIos('Microphone');
                                        });
                                })
                                .catch(function (err) {
                                    showInstructionsDialogIos('Camera');
                                });

                        } else if(constrains.video && videoDevices != 0) {

                            cordova.plugins.iosrtc.getUserMedia( { video: true, audio: false } )
                                .then(function (videoStream) {
                                    log('requestVideoStream: got stream');
                                    resolve([videoStream]);
                                })
                                .catch(function (err) {
                                    showInstructionsDialogIos('Camera');
                                });
                        } else if(constrains.audio && audioDevices != 0) {

                            cordova.plugins.iosrtc.getUserMedia( { video: false, audio: true } )
                                .then(function (audioStream) {
                                    log('requestVideoStream: got stream');

                                    resolve([audioStream]);
                                })
                                .catch(function (err) {
                                    showInstructionsDialogIos('Microphone');
                                });
                        }

                    }).catch(function (err) {
                        reject(err);
                    });

                });
            }

            return new Promise(function(resolve, reject) {
                log('getMediaStream: before enumerate');

                navigator.mediaDevices.enumerateDevices().then(function (mediaDevices) {
                    var videoDevices = 0;
                    var audioDevices = 0;
                    for(var i in mediaDevices) {
                        if (mediaDevices[i].kind === 'videoinput' || mediaDevices[i].kind === 'video') {
                            videoDevices++;
                        } else if (mediaDevices[i].kind === 'audioinput' || mediaDevices[i].kind === 'audio') {
                            audioDevices++;
                        }
                    }

                    log('getMediaStream: before getUserMedia');
                    //if(!Q.info.isMobile && !Q.info.isTablet && (!constrains.video || videoDevices == 0) && (!constrains.audio || audioDevices == 0)) return;

                    navigator.mediaDevices.getUserMedia({video:constrains.video && videoDevices != 0, audio:constrains.audio && audioDevices != 0})
                        .then(function (stream) {
                            log('getMediaStream: getUserMedia: got stream');

                            resolve([stream]);
                        }).catch(function(err) {
                            reject(err);
                        });
                }).catch(function (e) {
                    reject(e);
                });
            });

        }


        /**
         * Update stream participant's data after user got socket id
         * @method updateParticipantData
         */
        function updateParticipantData() {
            log('initWithNodeServer: webrtcSignalingLi 2', webrtcSignalingLib);
            log('initWithNodeServer: webrtcSignalingLi 3', webrtcSignalingLib.localParticipant());
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
                    participantSid: webrtcSignalingLib.localParticipant().sid
                }
            })
        }

        /**
         * Init conference using own node.js server for signalling process.
         * @method initWithStreams
         * @param {Object} [turnCredentials] Creadentials that are needed to use TURN server.
         * @param {String} [turnCredentials.url] Address of TURN server
         * @param {String} [turnCredentials.credential] Passphrase
         * @param {String} [turnCredentials.username] Username
         */
        function initWithNodeServer(socketServer, turnCredentials) {
            log('initWithNodeServer');       

            var initConference = function(){
                log('initWithNodeServer: initConference');
                try {
                    var err = (new Error);
                    console.log(err.stack);
                } catch (e) {

                }

                if(typeof window.WebRTCRoomClient == 'undefined') return;
                var roomId = (_roomStream.fields.name).replace('Streams/webrtc/', '');
                var roomStartTime = _roomStream.getAttribute('startTime');
                log('initWithNodeServer: initConference: roomId = ' + roomId)
                log('initWithNodeServer: initConference: roomStartTime = ' + roomStartTime)
                log('initWithNodeServer: initConference: _roomStream = ', _roomStream)
                log('initWithNodeServer: initConference: webrtcSignalingLib = ', webrtcSignalingLib)

                webrtcSignalingLib = new WebRTCRoomClient({
                    mode:'node',
                    useAsLibrary: true,
                    socket: Q.Socket,
                    nodeServer: socketServer,
                    roomName: roomId,
                    roomStartTime: roomStartTime,
                    roomPublisher: _roomStream.getAll().publisherId,
                    sid: Q.Users.loggedInUser.id,
                    username:  Q.Users.loggedInUser.id + '\t' + _roomStartTime,
                    video: false,
                    audio: false,
                    startWith: _options.startWith,
                    streams: _options.streams != null ? _options.streams : null,
                    limits: _options.limits,
                    sounds: _options.sounds != null ? _options.sounds : null,
                    onlyOneScreenSharingAllowed: _options.onlyOneScreenSharingAllowed,
                    liveStreaming: _options.liveStreaming,
                    showScreenSharingInSeparateScreen: _options.showScreenSharingInSeparateScreen,
                    turnCredentials: turnCredentials,
                    debug: _debug,
                    useCordovaPlugins: _options.useCordovaPlugins,
                    logger: appDebug.createLogMethod('app.js')
                });

                bindConferenceEvents(webrtcSignalingLib);
                log('initWithNodeServer: initConference: start init');

                webrtcSignalingLib.init(function (app) {
                    log('initWithNodeServer: initConference: inited');
                    log('initWithNodeServer: webrtcSignalingLib', webrtcSignalingLib, app);
                    updateParticipantData();
                    connectionState.hide();
                    _debugTimer.loadEnd = performance.now();

                    Q.handle(_options.onWebRTCRoomCreated);

                    Q.activate(
                        document.body.appendChild(
                            Q.Tool.setUpElement(
                                "div", // or pass an existing element
                                "Streams/webrtc/controls",
                                {
                                    webrtcRoomInstance: function () {
                                        return module;
                                    },
                                    debug: _debug,
                                    onCreate: function () {
                                        Q.handle(_options.onWebrtcControlsCreated, this);
                                    },
                                    onChildToolsLoaded: function () {
                                        var moveWithinArea = 'window';
                                        let _controlsTool = this;
                                        let _controls = this.element;
                                        var elementsToIgnore = [
                                            _controlsTool.videoInputsTool.videoinputListEl,
                                            _controlsTool.audioTool.audioOutputListEl,
                                            _controlsTool.audioTool.audioinputListEl,
                                            _controlsTool.participantsListTool.participantListEl,
                                            _controlsTool.textChat.chatBox
                                            ];

                                        Q.activate(
                                            Q.Tool.setUpElement(
                                                _controls.firstChild, // or pass an existing element
                                                "Q/resize",
                                                {
                                                    move: true,
                                                    resize: false,
                                                    active: true,
                                                    ignoreOnElements: elementsToIgnore,
                                                    elementPosition: 'fixed',
                                                    snapToSidesOnly: true,
                                                    moveWithinArea: moveWithinArea, //window/parent/DOMRect
                                                    onMovingStart: function () {
                                                        _controls.classList.add('isMoving');
                                                    },
                                                    onMovingStop: function () {
                                                        _controls.classList.remove('isMoving');
                                                    },
                                                    onMoved: function () {
                                                        screensRendering.updateLayout();
                                                    }
                                                }
                                            ),
                                            {},
                                            function () {
                                                log('initWithNodeServer: initConference: activated controls', this);
                                                
                                                var columnsTools = Q.Tool.byName('Q/columns');
                                                var dashboard = document.getElementById('dashboard_slot');
                                                var columnsTool = columnsTools[Object.keys(columnsTools)[0]];
                                                var updateArearectangle = function () {
                    
                                                    var moveWithinArea;
                                                    if(Object.keys(columnsTools).length == 0 && dashboard) {
                                                        var dashboardPos = dashboard.classList.contains('Q_fixed_top') ? 'top' : 'bottom';
                    
                                                        var windowWidth =  window.innerWidth;
                                                        var windowHeight =  window.innerHeight;
                                                        var dashboardHeight =  dashboard.offsetHeight;
                    
                                                        if(dashboardPos == 'bottom') {
                                                            moveWithinArea = new DOMRect(0, 0, windowWidth, windowHeight - dashboardHeight);
                                                        } else if(dashboardPos == 'top') {
                                                            moveWithinArea = new DOMRect(0, dashboardHeight, windowWidth, windowHeight - dashboardHeight);
                                                        }
                                                    } else {
                    
                                                        var currentColumn = columnsTool.state.$currentColumn.get()[0];
                                                        moveWithinArea = currentColumn.getBoundingClientRect();
                                                    }
                    
                                                    return moveWithinArea;
                                                }
                    
                                                if(Q.info.isMobile) {
                                                    moveWithinArea = updateArearectangle();
                                                }
                    
                                                var resizeTool = this;
                                                if (columnsTool && Q.info.isMobile) {
                                                    columnsTool.state.onActivate.add(function () {
                                                        var moveWithinArea = updateArearectangle();
                                                        resizeTool.setContainerRect(moveWithinArea);
                                                        screensRendering.updateLayout();
                                                    });
                                                    columnsTool.state.onClose.add(function () {
                                                        var moveWithinArea = updateArearectangle();
                                                        resizeTool.setContainerRect(moveWithinArea);
                                                        screensRendering.updateLayout();
                                                    });

                                                }

                                                if (typeof screen != 'undefined' && screen.orientation != null) {
                                                    screen.orientation.addEventListener("change", function () {
                                                        setTimeout(function () {
                                                            var moveWithinArea = updateArearectangle();
                                                            resizeTool.setContainerRect(moveWithinArea);
                                                            screensRendering.updateLayout();
                                                        }, 1000);
                                                    });
                                                }

                                                window.addEventListener("resize", function () {
                                                    setTimeout(function () {
                                                        var moveWithinArea = updateArearectangle();
                                                        resizeTool.setContainerRect(moveWithinArea);
                                                        screensRendering.updateLayout();
                                                    }, 1000);
                                                });

                                                if (_options.controlsPosition == 'top') {
                                                    this.snapTo('top');
                                                } else if (_options.controlsPosition == 'bottom') {
                                                    this.snapTo('bottom');
                                                } else if (_options.controlsPosition == 'left') {
                                                    this.snapTo('left');
                                                } else if (_options.controlsPosition == 'right') {
                                                    this.snapTo('right');
                                                } else {
                                                    this.snapTo('bottom');
                                                }
                                            }
                                        );
                                    }
                                }

                            )
                        ),
                        {},
                        function () {
                            log('initWithNodeServer: initConference: activate controls', webrtcSignalingLib.initNegotiationState );

                            //get info about active camera/mic slot requests
                            if(webrtcSignalingLib.initNegotiationState == 'ended') {
                                log('initWithNodeServer: initConference: fi1');

                                webrtcSignalingLib.socketConnection().emit('Streams/webrtc/controlsLoaded')
                            } else {
                                log('initWithNodeServer: initConference: fi2');
                                webrtcSignalingLib.event.on('initNegotiationEnded', function () {
                                    log('initWithNodeServer: initConference: initNegotiationEnded');

                                    webrtcSignalingLib.socketConnection().emit('Streams/webrtc/controlsLoaded')
                                })
                            }

                            _controls = this.element;
                            log('initWithNodeServer: initConference: activate controls', this, this.element);

                            _controlsTool = this;
                            screensRendering.updateLayout();
                            }
                    );
                });
                /*webrtcSignalingLib.event.on('joined', function () {
                    navigator.mediaDevices.enumerateDevices().then(function (mediaDevices) {
                        webrtcSignalingLib.localMediaControls.loadDevicesList(mediaDevices);
                    }).catch(function (e) {
                        console.error('ERROR: cannot get device info: ' + e.message);
                    });
                });*/
            }

            var findScript = function (src) {
                var scripts = document.getElementsByTagName('script');
                var src = Q.url(src);
                for (var i=0; i<scripts.length; ++i) {
                    var srcTag = scripts[i].getAttribute('src');
                    if (srcTag && srcTag.indexOf(src) != -1) {
                        return true;
                    }
                }
                return null;
            };

            if(findScript('{{Streams}}/js/tools/webrtc/app.js')) {
                log('initWithNodeServer: app.js exists');

                initConference();
            } else {
                log('initWithNodeServer: add app.js');
                Q.addScript([
                    "{{Streams}}/js/tools/webrtc/app.js?time=" + Date.now(),
                    "{{Streams}}/js/tools/webrtc/HackTimer.js",
                    "{{Streams}}/js/tools/webrtc/RecordRTC.js",
                ], function () {
                    initConference();
                });
            }

        }

        function overrideDefaultOptions(options) {
            if(typeof options === 'object') {
                for (var key in options) {
                    if(key == 'mode') continue;
                    _options[key] = options.hasOwnProperty(key) && typeof options[key] !== 'undefined' ? options[key] : _options[key];
                }

                /*if(!Q.info.isMobile && options.defaultDesktopViewMode != null) {
                    screensRendering.setViewMode(options.defaultDesktopViewMode );
                } else if(Q.info.isMobile && options.defaultMobilevViewMode != null) {
                    screensRendering.setViewMode(options.defaultMobileViewMode);
                }*/
            }

        }

        function unsetResizeObserver() {
           if(_resizeObserver == null) return;

            _resizeObserver.unobserve(_roomsMedia);
        }

        function setResizeObserver() {
            if(typeof ResizeObserver == 'undefined') return;
            _resizeObserver = new ResizeObserver(entries => {
                screensRendering.updateLayout();
                if(webrtcSignalingLib) webrtcSignalingLib.mediaManager.audioVisualization.updateCommonVisualizationWidth();

            });

            _resizeObserver.observe(_roomsMedia);
        }

        /**
         * Start WebRTC conference room
         * @method start
         * @param {Object} [options] Options, including:
         * @param {Object} [options.element] Parent DOM element where video screens will be rendered
         * @param {String} [options.roomId] Uniq id of room that will be part of Stream name (Streams/webrtc/[roomId])
         * @param {Number} [options.roomPublisherId] Id of publisher of the stream (stream represents room).
         *      Is required as argument for getting Stream from db
         */
        module.start = function () {
            var socketConns = Q.Users.Socket.get();
            if(!socketConns || Object.keys(socketConns).length == 0 || socketConns[Object.keys(socketConns)[0]] == null || !socketConns[Object.keys(socketConns)[0]].socket.id) {
                Q.Socket.onConnect('Users').add(function() {
                    log('initWithNodeServer: no socket connection yet');
                    module.start();
                })
                return;   
            }
            if(Object.keys(socketConns).length == 0) {
                Q.alert('To continue you should be connected to the socket server.');
                return;
            } 
            
            loadStyles().then(function () {
                startConference();
            });

            function loadStyles() {
                return new Promise(function (resolve, reject) {
                    Q.addStylesheet('{{Streams}}/css/tools/webrtc.css?ts=' + performance.now(), function () {
                        resolve();
                    });
                });
            }

            function startConference() {
                console.log('startConference START');
                log('start: load time ' + (performance.now() - _debugTimer.loadStart));
                log('start: onTextLoad: _options', _options);

                log('Start WebRTC conference room', module);

                var preparingWindow = (_options.showPreparingDialog/* || (!_options.startWith.video && !_options.startWith.audio)*/);

                connectionState.show(preparingWindow ? "Checking room's state" : 'Connecting...');

                _debugTimer.loadStart = performance.now();

                _roomStartTime = Date.now();

                appDebug.sendReportsInterbal = setInterval(function () {
                    appDebug.sendReportToServer();
                }, 3000);

                if (appDebug.isiOSwebView()) {
                    return Q.alert(text.webrtc.notices.openInBrowserAlert != null ? text.webrtc.notices.openInBrowserAlert : 'Open link in Safari browser to join the conference.');
                }

                var ua = navigator.userAgent;
                var startWith = _options.startWith || {};
                var preparingWindow = (_options.showPreparingDialog/* || (!_options.startWith.video && !_options.startWith.audio)*/);

                log('start: onTextLoad', preparingWindow, _options.showPreparingDialog.video, _options.showPreparingDialog.audio);


                if((typeof window.RTCPeerConnection == 'undefined' && typeof window.mozRTCPeerConnection == 'undefined' && typeof  window.webkitRTCPeerConnection == 'undefined')) {
                    Q.alert('Unfortunatelly your browser doesn\'t support WebRTC')
                }

                if(_options.leaveOtherActiveRooms) {
                    log('start: onTextLoad: leave existing rooms');
                    if(Q.Streams.WebRTCRooms != null && Q.Streams.WebRTCRooms.length != 0) {
                        for(var r in Q.Streams.WebRTCRooms) {
                            Q.Streams.WebRTCRooms[r].stop();
                        }
                    }
                }
                log('start: onTextLoad: continue');

                //var roomId = _options.roomId != null ? _options.roomId : null;
                //if(_options.roomPublisherId == null) _options.roomPublisherId = Q.Users.loggedInUser.id;

                var roomsMedia = document.createElement('DIV');
                roomsMedia.className = 'Streams_webrtc_room-media Q_floatAboveDocument';
                if(_options.margins != null) {
                    var totalHeight = 0;
                    var totalWidth = 0;
                    if(_options.margins.top != null) {
                        roomsMedia.style.top = _options.margins.top + 'px';
                        totalHeight = totalHeight + _options.margins.top
                    }
                    if(_options.margins.right != null) {
                        roomsMedia.style.right = _options.margins.right + 'px';
                        totalWidth = totalWidth + _options.margins.right
                    }
                    if(_options.margins.bottom != null) {
                        roomsMedia.style.bottom = _options.margins.bottom + 'px';
                        totalHeight = totalHeight + _options.margins.bottom
                    }
                    if(_options.margins.left != null) {
                        roomsMedia.style.left = _options.margins.left + 'px';
                        totalWidth = totalWidth + _options.margins.left
                    }

                    roomsMedia.style.height = 'calc(100% - ' + totalHeight + 'px)';
                    roomsMedia.style.width = 'calc(100% - ' + totalWidth + 'px)';

                } else if(Q.info.isMobile) {
                    var columnsTools = Q.Tool.byName('Q/columns');
                    var columnsTool = columnsTools[Object.keys(columnsTools)[0]];
                    var dashboard = document.getElementById('dashboard_slot');

                    var updateContainerSize = function () {
                        if(Object.keys(columnsTools).length == 0 && dashboard) {
                            log('initWithNodeServer: initConference: activate controls: no columns');
                            var dashboardPos = dashboard.classList.contains('Q_fixed_top') ? 'top' : 'bottom';

                            var windowWidth =  window.innerWidth;
                            var windowHeight =  window.innerHeight;
                            var dashboardHeight =  dashboard.offsetHeight;
                            log('initWithNodeServer: initConference: activate controls: no columns', windowWidth, windowHeight, dashboardHeight);
                            var moveWithinArea;
                            roomsMedia.style.height = 'calc(100% - ' + dashboardHeight + 'px)';
                            if(dashboardPos == 'bottom') {
                                roomsMedia.style.top = '0px';
                            } else if(dashboardPos == 'top') {
                                roomsMedia.style.top = dashboardHeight + 'px';
                            }
                        } else if (Object.keys(columnsTools).length != 0) {
                            var currentColumn = columnsTool.state.$currentColumn.get()[0];
                            var currentColumnRect = currentColumn.getBoundingClientRect();
                            roomsMedia.style.height = currentColumnRect.height + 'px';
                            log('initWithNodeServer: initConference: activate controls: columns != 0', currentColumn, currentColumnRect);

                        } else {
                            roomsMedia.style.height = '100%';
                        }
                    }
                    updateContainerSize();

                    if(columnsTool) columnsTool.state.onClose.add(updateContainerSize);
                    if(columnsTool) columnsTool.state.onActivate.add(updateContainerSize);
                }

                if (!_options.element) {
                    _options.element = document.body;
                }
                if (_options.element != document.body) {
                    _options.element.dataset.webrtcContainer = true;
                }
                (_options.element || document.body).appendChild(roomsMedia);
                _roomsMedia = roomsMedia;
                setResizeObserver();
                Q.activate(
                    Q.Tool.setUpElement(
                        _roomsMedia, // or pass an existing element
                        "Q/layouts",
                        {/*alternativeContainer: Q.info.isMobile ? null : document.body*/}
                    ),
                    {},
                    function () {
                        _layoutTool = this;
                        window.layoutTool = _layoutTool;
                        _layoutTool.currentRects = [];
                        _layoutTool.basicGridRects = [];
                    }
                );


                var createOrJoinRoomStream = function (roomId, asPublisherId) {
                    log('createRoomStream START', roomId, asPublisherId)
                    try {
                        var err = (new Error);
                        console.log(err.stack);
                    } catch (e) {
        
                    }
                    Q.req("Streams/webrtc", ["room"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);

                        console.log('err, response ', err, response )
                        if (_options.inviteToken && response.slots.room.waitingRoomStream) {
                            var waitingRoomStream = response.slots.room.waitingRoomStream;
                            connectionState.updateStatus('Waiting for yout call to be accepted.');
                            if(_waitingRoomStream != null) {
                                return;
                            }
                            Q.Streams.get(waitingRoomStream.fields.publisherId, waitingRoomStream.fields.name, function (err, stream) {
                                console.log('got waiting room stream', stream)
                                
                                _waitingRoomStream = stream;
                                stream.onMessage('Streams/webrtc/admit').set(function (stream, message) {
                                    createOrJoinRoomStream(roomId, asPublisherId);
                                });
                                stream.onMessage('Streams/webrtc/close').set(function (stream, message) {
                                    let instructions = JSON.parse(message.instructions)
                                    console.log('Streams/webrtc/close', message)
                                    if(instructions.msg) {
                                        connectionState.updateStatus(instructions.msg);
                                    }
                                    module.stop();
                                });
                            });
                            return;
                        } else if (msg) {
                            _options.streams.map(function (mediStream) {
                                mediStream.getTracks().forEach(function (t) {
                                    t.stop();
                                })
                            });
                            connectionState.updateStatus('Disconnected');
                            setTimeout(function() {
                                connectionState.hide();
                            }, 3000);
                            return Q.alert(msg);
                        }
                        log('createRoomStream: joined/connected', response.slots.room);

                        roomId = (response.slots.room.roomId).replace('Streams/webrtc/', '');
                        if(_options.roomId == null) _options.roomId = roomId;
                        if(_options.roomPublisherId == null) _options.roomPublisherId = response.slots.room.stream.fields.publisherId;
                        var turnCredentials = response.slots.room.turnCredentials;
                        var socketServer = response.slots.room.socketServer;
                        _debug = response.slots.room.debug;

                        overrideDefaultOptions(response.slots.room.options);
                        log('createRoomStream: Q.Streams.get', response.slots.room, response.slots.room.stream.fields);
                        log('createRoomStream: Q.Streams.get 2', _options.roomPublisherId);

                        //var connectUrl = updateQueryStringParameter(location.href, 'Q.rid', roomId);
                        //connectUrl = updateQueryStringParameter(connectUrl, 'Q.pid', asPublisherId);
                        Q.Streams.get(response.slots.room.stream.fields.publisherId, 'Streams/webrtc/' + roomId, function (err, stream) {
                            log('createRoomStream: joined/connected: pull stream');

                            _roomStream = stream;
                            if(Q.Streams.WebRTCRooms == null){
                                Q.Streams.WebRTCRooms = [];
                            }

                            Q.Streams.WebRTCRooms.push(module);

                            _options.hosts = response.slots.room.hosts;
                            bindStreamsEvents(stream);

                            initWithNodeServer(socketServer, turnCredentials);
                        });

                    }, {
                        method: 'post',
                        fields: {
                            roomId: _options.roomId,
                            publisherId: asPublisherId,
                            inviteToken: _options.inviteToken,
                            invitingUserId: _options.invitingUserId,
                            socketId: socketConns[Object.keys(socketConns)[0]].socket.id,
                            description: _options.description,
                            resumeClosed: _options.resumeClosed,
                            closeManually: _options.closeManually,
                            onlyParticipantsAllowed: _options.onlyParticipantsAllowed,
                            writeLevel: _options.writeLevel,
                            useRelatedTo: _options.useRelatedTo,
                            relate: _options.relate
                        }
                    });
                }

                if(Q.info.isMobile || Q.info.isTablet) {
                    log('start: onTextLoad: connect from mobile/tablet browser');

                    if(preparingWindow) {
                        showPreparingDialog(function () {
                            createOrJoinRoomStream(_options.roomId, _options.roomPublisherId);
                        }, function () {
                            connectionState.updateStatus('Disconnected');
                            setTimeout(function() {
                                connectionState.hide();
                            }, 3000);
                            unsetResizeObserver();
                        });
                    } else {

                        let premissionGrantedCallback = function (streams) {
                            _options.streams = _options.streams.concat(streams);

                            createOrJoinRoomStream(_options.roomId, _options.roomPublisherId);
                        };

                        if (Q.info.isCordova && Q.info.isAndroid()) {
                            log('start: onTextLoad: isCordova && isAndroid');

                            var showInstructions = function(kind) {
                                var instructionsPermissionDialog = document.createElement('DIV');
                                instructionsPermissionDialog.className = 'Streams_webrtc_devices_dialog_inner';
                                var dialogList = document.createElement('OL');
                                dialogList.className = 'Streams_webrtc_instructions_dialog';
                                dialogList.innerHTML = `<div>` + text.webrtc.androidInstructionsDialog.permissionDenied.interpolate({kind: kind}) + `</div>
									<li>` + Q.getObject("webrtc.androidInstructionsDialog.point1", text) + `</li>
									<li>` + Q.getObject("webrtc.androidInstructionsDialog.point2", text) + `</li>
									<li>` + text.webrtc.androidInstructionsDialog.point3.interpolate({communityId: Q.Users.communityId}) + `</li>
									<li>` + Q.getObject("webrtc.androidInstructionsDialog.point4", text) + `</li>
									<li>` + text.webrtc.androidInstructionsDialog.point5.interpolate({kind: kind}) + `</li>`;
                                instructionsPermissionDialog.appendChild(dialogList);
                                Q.Dialogs.push({
                                    title: Q.getObject("webrtc.androidInstructionsDialog.dialogTitle", text),
                                    className: 'Streams_webrtc_devices_dialog',
                                    content: instructionsPermissionDialog,
                                    apply: true
                                });
                            }

                            var requestMicPermission = function (callback) {
                                cordova.plugins.permissions.checkPermission("android.permission.RECORD_AUDIO", function(result){
                                    if(!result.hasPermission) {
                                        cordova.plugins.permissions.requestPermission("android.permission.RECORD_AUDIO", function(result){
                                            if(!result.hasPermission) {
                                                showInstructions('audio');
                                            } else {
                                                if(callback != null) callback();
                                            }
                                        }, function(){console.error("Permission is not granted");})
                                    } else {
                                        if(callback != null) callback();
                                    }
                                }, function(){console.error("Permission is not granted");})
                            }

                            var requestCameraPermission = function (callback) {
                                cordova.plugins.permissions.checkPermission("android.permission.CAMERA", function(result){
                                    if(!result.hasPermission) {
                                        cordova.plugins.permissions.requestPermission("android.permission.CAMERA", function(result){
                                            if(!result.hasPermission) {
                                                showInstructions('video');
                                            } else {
                                                if(callback != null) callback();
                                            }
                                        }, function(){console.error("Permission is not granted");})
                                    } else {
                                        //Permission granted
                                        if(callback != null) callback();
                                    }
                                }, function(){console.error("Permission is not granted");})
                            }

                            if(startWith.audio && startWith.video && !_options.audioOnlyMode) {
                                requestMicPermission(function () {
                                    requestCameraPermission(function () {
                                        getMediaStream({video: true, audio: true}).then(function (streams) {
                                            premissionGrantedCallback(streams);
                                        }).catch(function (err) {
                                            console.error(err.name + ": " + err.message);
                                            if(err.name == 'NotAllowedError') showInstructionsDialog('camera/microphone');
                                        });
                                    });
                                });
                            } else if (startWith.audio) {
                                requestMicPermission(function () {
                                    getMediaStream({video: false, audio: true}).then(function (streams) {
                                        premissionGrantedCallback(streams);
                                    }).catch(function (err) {
                                        console.error(err.name + ": " + err.message);
                                        if(err.name == 'NotAllowedError') showInstructionsDialog('camera/microphone');
                                    });
                                });
                            } else if (startWith.video && !_options.audioOnlyMode) {
                                requestCameraPermission(function () {
                                    getMediaStream({video: true, audio: true}).then(function (streams) {
                                        premissionGrantedCallback(streams);
                                    }).catch(function (err) {
                                        console.error(err.name + ": " + err.message);
                                        if(err.name == 'NotAllowedError') showInstructionsDialog('camera/microphone');
                                    });
                                });
                            }

                        } else if(!Q.info.isCordova || (Q.info.isCordova && Q.info.platform === 'ios' && !_options.useCordovaPlugins) || (Q.info.isCordova && Q.info.platform === 'ios' && _options.useCordovaPlugins)){
                            log('start: onTextLoad: isCordova && isiOS');

                            //requesting access to users media. Audio should always be true to avoid autoplay issues
                            if(startWith.video && startWith.audio && !_options.audioOnlyMode) {
                                getMediaStream({video: true, audio: true}).then(function (streams) {
                                    premissionGrantedCallback(streams);
                                }).catch(function (err) {
                                    console.error(err.name + ": " + err.message);
                                    if(err.name == 'NotAllowedError') showInstructionsDialog('camera/microphone');
                                });
                            } else {
                                getMediaStream({video: startWith.video, audio: true}).then(function (streams) {
                                    premissionGrantedCallback(streams);
                                }).catch(function (err) {
                                    console.error(err.name + ": " + err.message);
                                    if(err.name == 'NotAllowedError') showInstructionsDialog('camera/microphone');
                                });

                            }
                        }
                    }

                } else {

                    log('start: onTextLoad: regular connect (desktop)');

                    if(preparingWindow) {
                        getMediaStream({video: startWith.video, audio: true}).then(function (streams) {
                            showPreparingDialog(function () {
                                createOrJoinRoomStream(_options.roomId, _options.roomPublisherId);
                            }, function () {
                                unsetResizeObserver();
                                connectionState.updateStatus('Disconnected')
                            }, streams);
                        }).catch(function (err) {
                            console.error(err.name + ": " + err.message);
                            if(err.name == 'NotAllowedError') showInstructionsDialog('camera/microphone');
                        });

                    } else {
                        let premissionGrantedCallback = function (streams) {
                            console.log('premissionGrantedCallback', streams, _options);
                            _options.streams = _options.streams.concat(streams);
                            createOrJoinRoomStream(_options.roomId, _options.roomPublisherId);
                        };

                        //requesting access to users media. Audio should always be true to avoid autoplay issues
                        if(startWith.video && startWith.audio && !_options.audioOnlyMode) {
                            getMediaStream({video: true, audio: true}).then(function (streams) {
                                premissionGrantedCallback(streams);
                            }).catch(function (err) {
                                console.error(err.name + ": " + err.message);
                                if(err.name == 'NotAllowedError') showInstructionsDialog('camera/microphone');
                            });
                        } else {
                            getMediaStream({video: startWith.video, audio: true}).then(function (streams) {
                                premissionGrantedCallback(streams);
                            }).catch(function (err) {
                                console.error(err.name + ": " + err.message);
                                if(err.name == 'NotAllowedError') showInstructionsDialog('camera/microphone');
                            });

                        }

                    }


                }

            }

            return module;
        }

        module.switchTo = function (publisherId, streamName, options) {
            log('switch WebRTC conference room', publisherId, streamName);
            log('switch webrtcSignalingLib', webrtcSignalingLib);

            log('switchTo: _options.beforeSwitch', _options.beforeSwitch)

            if(_options.beforeSwitch) {
                _options.beforeSwitch().then(function () {
                    return continueSwitching();
                });
            } else {
                return continueSwitching();
            }

            function continueSwitching() {
                log('switchTo: promise: onResolve')

                if(notice) connectionState.updateStatus(Q.getObject("webrtc.notices.switchingRoom", text));

                if(Q.Socket.getAll()['/webrtc']) {
                    Q.Socket.getAll()['/webrtc'] = null;
                }
                _events.dispatch('beforeRoomSwitch', {
                    from: {
                        publisherId: _roomStream.fields.publisherId,
                        name: _roomStream.fields.name
                    },
                    to: {
                        publisherId: publisherId,
                        name: streamName
                    }
                });

                return new Promise (function (resolve, reject) {

                    function onPlayEnd() {

                        log('switchTo: createRoomStream')
                        var roomIdToJoin = streamName.replace('Streams/webrtc/', '');

                        Q.req("Streams/webrtc", ["room"], function (err, response) {
                            var msg = Q.firstErrorMessage(err, response && response.errors);

                            if (msg) {
                                return Q.alert(msg);
                            }
                            log('switchTo: createRoomStream: joined/connected');


                            Q.Streams.get(publisherId, 'Streams/webrtc/' + roomIdToJoin, function (err, stream) {
                                log('switchTo: createRoomStream: joined/connected: pull stream', stream);

                                _roomStream = stream;
                                if(Q.Streams.WebRTCRooms == null){
                                    Q.Streams.WebRTCRooms = [];
                                }

                                log('switchTo: createOrJoinRoomStream: webrtcSignalingLib', webrtcSignalingLib)
                                webrtcSignalingLib.mediaManager.audioVisualization.removeCommonVisualization();

                                bindStreamsEvents(_roomStream);
                                webrtcSignalingLib.switchTo(publisherId, roomIdToJoin).then(function (newRoomClientInstance) {
                                    log('switchTo: createOrJoinRoomStream: newRoomClientInstance', newRoomClientInstance)
                                    bindConferenceEvents(newRoomClientInstance);

                                    newRoomClientInstance.event.on('initNegotiationEnded', function () {
                                        log('switchTo: createOrJoinRoomStream: initNegotiationEnded')
                                        webrtcSignalingLib = newRoomClientInstance;

                                        updateParticipantData();

                                        screensRendering.updateLayout();

                                        resolve();
                                    });
                                });


                            });

                        }, {
                            method: 'post',
                            fields: {
                                roomId: roomIdToJoin,
                                publisherId: publisherId,
                                resumeClosed: options && options.resumeClosed != null ? options.resumeClosed : _options.resumeClosed
                            }
                        });
                    }

                    function playSwitchSound() {
                        log('switchTo: playSwitchSound')

                        let playSwitchSound = Q.Audio.collection[_options.sounds.roomSwitch].audio.play();
                        playSwitchSound.then(function () {
                            log('switchTo: playSwitchSound success')
                            Q.Audio.collection[_options.sounds.roomSwitch].onEnded.set(function () {
                                onPlayEnd()

                                Q.Audio.collection[_options.sounds.roomSwitch].onEnded.remove('Q.WebRTC.switchTo');
                            }, 'Q.WebRTC.switchTo');

                        }).catch(function(e){
                            log('switchTo: playSwitchSound error')
                            onPlayEnd()
                            console.error(e);
                        });
                    }

                    if(Q.Audio.collection[_options.sounds.roomSwitch]) {
                        log('switchTo: playSwitchSound')

                        playSwitchSound();
                    } else {
                        log('switchTo: .Audio.load')

                        Q.Audio.load(_options.sounds.roomSwitch, function () {
                            playSwitchSound();
                        });
                    }
                });
            }
        }

        /**
         * Stops WebRTC conference room (closes all peer2peer connections,
         * clears all timeouts, removes tools)
         * @method stop
         * @param {function} callback executed when all actions done.
         */
        module.stop = function (callback, suspend) {
            log('WebRTC.stop', webrtcSignalingLib);

            if (!module.isActive() || _roomStream == null) {
                return Q.handle(callback);
            }

            if(webrtcSignalingLib && webrtcSignalingLib.localParticipant() != null) webrtcSignalingLib.localParticipant().online = false;

            if(appDebug.sendReportsInterbal != null) {
                appDebug.sendReportToServer();
                clearTimeout(appDebug.sendReportsInterbal);
            }
            _roomStream.leave();
            if(webrtcSignalingLib) webrtcSignalingLib.disconnect();

            if(Q.Socket.getAll()['/webrtc']) {
                Q.Socket.getAll()['/webrtc'] = null;
            }

            //_options.streams = [];
            if(!suspend) {
                for(let i in _options.streams) {
                    let tracks = _options.streams[i].getTracks();
                    for(let t in tracks) {
                        tracks[t].stop();
                    }
                }
                _options.streams = [];
            }
            if(_roomsMedia.parentNode != null) _roomsMedia.parentNode.removeChild(_roomsMedia);
            if(_controls != null) {
                var controlsTool = Q.Tool.from(_controls, "Streams/webrtc/controls");
                screensRendering.disableLoudesScreenMode();
                if(_controls.parentNode != null) _controls.parentNode.removeChild(_controls);
                Q.Tool.remove(controlsTool);
            }

            _layoutTool.clearCustomGenerators();
            Q.Tool.remove(_layoutTool);
            window.removeEventListener('beforeunload', stop);
            unsetResizeObserver();
            webrtcSignalingLib = null;
            Q.handle(_options.onWebRTCRoomEnded);

            Q.Page.onActivate('').remove('Streams.WebRTC');

            var currentRoom = Q.Streams.WebRTCRooms.indexOf(module);
            if(currentRoom != -1) {
                Q.Streams.WebRTCRooms.splice(currentRoom, 1);
            }
        }

        module.getWebrtcSignalingLib = function () {
            return webrtcSignalingLib;
        }

        module.controls = function () {
            return _controlsTool;
        }

        module.roomsMediaContainer = function () {
            return _roomsMedia;
        }

        module.roomStream = function () {
            return _roomStream;
        }

        module.getOptions = function () {
            return _options;
        }

        module.isActive = function () {
            return webrtcSignalingLib != null && webrtcSignalingLib.state != 'disconnected' ? true : false;
        }

        module.text = function () {
            return Q.text.Streams;
        }

        module.screenRendering = screensRendering;
        module.notice = notice;
        module.events = _events;

        return module;

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

        function log(text) {
            if(_debug === false) return;
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
            appDebug.logInfo(params);
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
    };

    /**
     * Start live stream conference related to some stream.
     * @method WebRTC.start
     * @param {Object} options options for the method
     * @param {String} options.publisherId Required. Publisher of stream to which webrtc will be related.
     * @param {String} options.streamName Required. Name of stream to which webrtc will be related.
     * @param {String} [options.relationType='Streams/webrtc']
     * @param {HTMLElement} [options.element=document.body] Parent DOM element where video screens will be rendered
     * @param {String} [options.tool=true] Tool to relate Q.events to. By default true used - which means page.
     * @param {String} [options.resumeClosed=true]  If false, close stream completely (unrelate) when last participant
     * left, and create new stream next time instead resume.
     * @param {Function} [options.onWebrtcControlsCreated] Callback called when Webrtc Controls Created
     * @param {Function} [options.onStart] Callback called when Webrtc started.
     * @param {Function} [options.onEnd] Callback called when Webrtc ended.
     */
    Streams.WebRTC.start = function (options) {
        options = Q.extend({
            element: document.body,
            mode: 'node',
            tool: true,
            relationType: "Streams/webrtc",
            resumeClosed: true
        }, options);

        console.log('Streams.WebRTC.start', options)

        let conference = Q.Streams.WebRTC({
            audioOnlyMode: options.audioOnlyMode,
            element: options.element,
            roomId: options.roomId,
            roomPublisherId: options.roomPublisherId || options.publisherId,
            defaultDesktopViewMode: options.defaultDesktopViewMode,
            defaultMobileViewMode: options.defaultDesktopViewMode,
            writeLevel: options.writeLevel,
            resumeClosed: options.resumeClosed,
            closeManually: options.closeManually,
            description: options.description,
            useRelatedTo: !!options.useRelatedTo,
            onlyParticipantsAllowed: options.onlyParticipantsAllowed,
            relate: {
                publisherId: options.publisherId,
                streamName: options.streamName,
                relationType: options.relationType
            },
            onWebrtcControlsCreated: function () {
                //TODO: for some reason this.Q.beforeRemove doesn't call when user leave conference
                // may be tool doesn't close at all?

                Q.handle(options.onWebrtcControlsCreated, this);

                this.Q.beforeRemove.set(function () {
                    Q.handle(options.onEnd, this);
                }, this);

                // this is duplicate to above approach
                /*Q.Streams.Stream.onMessage(stream.fields.publisherId, stream.fields.name, 'Streams/left').set(function(stream, message) {
                    if (message.byUserId !== userId) {
                        return;
                    }

                    Q.handle(options.onEnd, this);
                }, options.tool);*/
            },
            onWebRTCRoomCreated: function () {
                Q.handle(options.onStart, this);
            },
            onWebRTCRoomEnded: function () {
                Q.handle(options.onEnd, this);
            }
        });
        conference.start();

        return conference;

    }
})(Q, jQuery);