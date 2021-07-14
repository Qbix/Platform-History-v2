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

    /**
     * Manages UI of WebRTC conference
     * @class Streams.WebRTC
     * @constructor
     */

    Streams.WebRTC = function Streams_WebRTC() {
        var _options = {
            mode: 'node',
            conferenceStartedTime: null,
            startTime: null,
            mediaDevicesDialog: {timeout:2000},
            startWith: {
                audio: true,
                video: false
            },
            preparing: {
                video: false,
                audio: true,
                screen: false
            },
            useCordovaPlugins: false,
            showScreenSharingInSeparateScreen: true,
            minimizeOnPageSwitching: true,
            leaveOtherActiveRooms: true,
            onlyOneScreenSharingAllowed: false,
            disconnectBtnInParticipants: false,
            controlsPosition: 'auto',
            margins:null,
            sounds: {
                participantConnected:Q.url('{{Streams}}/audio/user_disconnected.mp3'),
                participantDisconnected:Q.url('{{Streams}}/audio/user_connected.mp3')
            },
            liveStreaming: {
                startFbLiveViaGoLiveDialog: false,
                useRecordRTCLibrary: true,
                drawBackground: false,
                timeSlice: 6000,
                sounds:true,
                showLabelWithNames: true,
                audioLayoutBgColor: '#000',
                showLayoutBorders: true,
                loopAudio: true,
                loopVideo: true,
                localOutput: true
                /*chunkSize: 10000*/
            },
            eyesDetection: true,
            eyes: true,
            faces: false,
            onWebRTCRoomCreated: new Q.Event(),
            onWebRTCRoomEnded: new Q.Event(),
            onWebrtcControlsCreated: new Q.Event(),
            hosts:[],
            defaultDesktopViewMode:null,
            defaultMobileViewMode:null,
            writeLevel:10
        };
        var WebRTCconference;

        var _textes = null;
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
                            if(room.startTimeTs == _options.conferenceStartedTime && room.roomName == _options.roomId) {
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
                    var localParticipant = WebRTCconference.localParticipant();

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
                    var participants = WebRTCconference.roomParticipants();
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
                            //console.log('logArray', logArray.join(', '))

                            logContent.innerText = logResultArr.join(', ');
                        } else {
                            logContent.innerHTML = JSON.stringify(log.log);

                        }

                        //console.log('log.log',log.type, log.log);
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
                        fields: {
                            adapter: _options.mode
                        }
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
                            startTimeDate: startTimeDate,
                            adapter: _options.mode
                        }
                    });
                }

                function getLogByUser(roomId, callStartedDate, userId, startTime, callback) {
                    var userIdAndStartTime;
                    if(typeof userId == 'undefined' && typeof startTime == 'undefined') {
                        userIdAndStartTime = Q.Users.loggedInUser.id + '\t' + _options.startTime;
                    } else {
                        userIdAndStartTime = userId + '\t' + startTime;
                    }

                    if(typeof roomId == 'undefined') {
                        roomId = _options.roomId;
                    }

                    if(_options.roomId == null || _options.roomPublisherId == null) return;
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
                            participant: userIdAndStartTime,
                            adapter: _options.mode
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


            function logInfo(args, isWebRTCLog) {
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
                        'type': isWebRTCLog == null ? "WebRTC.js" : "app.js",
                        'log':consoleArr
                    };
                    _infoLog.push(logObj);

                } catch (e) {
                    var logObj = {
                        'type': isWebRTCLog == null ? "WebRTC.js" : "app.js",
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
                        participant: Q.Users.loggedInUser.id + '\t' + _options.startTime,
                        adapter: _options.mode
                    }
                });
            }

            return {
                logInfo: logInfo,
                logError: logError,
                getInfoLog: getInfoLog,
                sendReportToServer: sendReportToServer,
                debugWidget: function() {return debugWidget;},
                isiOSwebView: function() {return _isiOSWebView;}
            }
        }());
        window.webrtcDebug = appDebug;

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
        }

        /**
         * Create snipped that is showing when participant joins/leave the room.
         * @method createInfoSnippet
         */
        function createInfoSnippet(){
            var noticeContainer = document.createElement('div');
            noticeContainer.className = 'notice-container notice-container-default';

            document.body.appendChild(noticeContainer);
        }

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

            return {
                show:show
            }
        }());

        /**
         * Bind Qbix stream events. Currentlt isn't in use.
         * @method bindStreamsEvents
         * @param {Object} [stream] stream that represents room
         */
        function bindStreamsEvents(stream) {
            log('bindStreamsEvents', stream)
            stream.onMessage('Streams/join').set(function (stream, message) {

            });

            stream.onMessage('Streams/connected').set(function (stream, message) {

            });

            stream.onMessage("Streams/leave").set(function (stream, message) {

            });

            stream.onMessage("Streams/webrtc/invite").set(function (stream, message) {
                console.log('bindStreamsEvents: Streams/webrtc/invite', stream, message);
                if(webRTCInstance== null || WebRTCconference == null) return;
                var streamToJoin = JSON.parse(message.content);
                if(streamToJoin.userId != Q.Users.loggedInUserId()) return;

                webRTCInstance.switchTo(streamToJoin.publisherId, streamToJoin.name);
            });


            stream.onMessage("Streams/webrtc/forceDisconnect").set(function (stream, message) {
                console.log('bindStreamsEvents: Streams/webrtc/forceDisconnect add', stream, message);
                if(webRTCInstance== null || WebRTCconference == null) return;
                var message = JSON.parse(message.content);
                var roomParticipants = WebRTCconference.roomParticipants();
                var localParticipant = WebRTCconference.localParticipant();

                var userId = localParticipant.identity != null ? localParticipant.identity.split('\t')[0] : null;


                if(message.userId == userId) {
                    if(WebRTCconference.initNegotiationState == 'ended') notice.show(_textes.webrtc.notices.forceDisconnecting);

                    setTimeout(function () {
                        WebRTCconference.disconnect();
                        webRTCInstance.stop();
                    }, 5000);


                    /*Q.Streams.unrelate(
                        state.publisherId,
                        state.streamName,
                        state.relationType,
                        this.stream.fields.publisherId,
                        this.stream.fields.name
                    );*/
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
        function bindConferenceEvents(WebRTCconference) {
            var tool = this;

            function setRealName(participant, callback) {
                var userId = participant.identity != null ? participant.identity.split('\t')[0] : null;

                if(userId != null){
                    var firstName;
                    var lastName;
                    var fullName = '';
                    Q.Streams.get(userId, 'Streams/user/firstName', function () {
                        firstName = this.fields.content;

                        Q.Streams.get(userId, 'Streams/user/lastName', function () {
                            lastName = this.fields.content;
                        });

                        if(firstName != null) {
                            fullName += firstName;
                        }
                        if(lastName != null) {
                            fullName += ' ' + lastName;
                        }

                        participant.username = fullName;

                        if(callback != null) callback({firstName:firstName, lastName:lastName});

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

            WebRTCconference.event.on('log', function (params) {
                appDebug.logInfo(params, true);
            });

            WebRTCconference.event.on('joined', function (participant) {
                if(document.querySelector('.Streams_webrtc_instructions_dialog') == null) Q.Dialogs.pop();
                if(participant.sid == 'recording') return;
                setRealName(participant);
                setUserAvatar(participant);
                screensRendering.onParticipantConnected(participant);
            });

            WebRTCconference.event.on('participantConnected', function (participant) {
                log('user joined',  participant);
                if(participant.sid == 'recording') return;
                setRealName(participant, function(name){
                    if(WebRTCconference.initNegotiationState == 'ended') notice.show(_textes.webrtc.notices.joining.interpolate({userName: name.firstName}));
                });
                setUserAvatar(participant);
                screensRendering.onParticipantConnected(participant);

                if(WebRTCconference.initNegotiationState == 'ended') {
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
            WebRTCconference.event.on('participantDisconnected', function (participant) {
                log('user disconnected',  participant);
                var userId = participant.identity != null ? participant.identity.split('\t')[0] : null;


                if(userId != null){
                    Q.Streams.get(userId, 'Streams/user/firstName', function () {
                        var firstName = this.fields.content;
                        notice.show(_textes.webrtc.notices.sbLeftRoom.interpolate({userName: firstName}));

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
            WebRTCconference.event.on('localParticipantDisconnected', function (participant) {
                log('you left the room')
                notice.show(Q.getObject("webrtc.notices.youLeftRoom", _textes));
                screensRendering.updateLayout();
            });
            WebRTCconference.event.on('participantRemoved', function (participant) {
                log('you left the room')
                screensRendering.removeParticipantsScreens();
            });


            WebRTCconference.event.on('screenAdded', function (participant) {
                log('screen added', participant)
                screensRendering.updateLayout();
            });
            WebRTCconference.event.on('screenRemoved', function (participant) {
                log('screen removed', participant)
                screensRendering.updateLayout();
            });
            WebRTCconference.event.on('trackAdded', function (e) {
                log('track added', e)
                screensRendering.newTrackAdded(e.track, e.participant);
                //screensRendering.updateLayout();


                //screensRendering.newTrackAdded(e.track);
            });

            WebRTCconference.event.on('trackMuted', function (e) {
                log('track muted', e)
                if(e.track.kind == 'video') {
                    screensRendering.showLoader('videoMuted', {screen: e.screen, participant: e.screen.participant});
                    screensRendering.onVideoMute(e.track, e.participant);
                }


            });

            WebRTCconference.event.on('trackUnmuted', function (e) {
                log('track unmuted', e)
                if(e.track.kind == 'video') {
                    screensRendering.hideLoader('videoUnmuted', {screen: e.screen, participant: e.screen.participant});
                    screensRendering.onVideoUnMute(e.track);
                }
            });

            WebRTCconference.event.on('videoTrackIsBeingAdded', function (e) {
                log('video track is being added', e)
                screensRendering.videoTrackIsAdding(e.track, e.participant);
                screensRendering.updateLayout();
            });

            WebRTCconference.event.on('videoTrackLoaded', function (e) {
                log('video track loaded', e)
                screensRendering.onVideoTrackLoaded(e.track);
            });

            WebRTCconference.event.on('screensharingStarting', function (e) {
                log('screen sharing is being started', e)

                screensRendering.onScreensharingStarting(e);
                screensRendering.showLoader('screensharingStarting', {participant: e.participant});
            });

            WebRTCconference.event.on('afterCamerasToggle', function (e) {
                screensRendering.hideLoader('afterCamerasToggle', {participant: e.participant});
            });
            WebRTCconference.event.on('beforeCamerasToggle', function (e) {
                screensRendering.showLoader('beforeCamerasToggle', {participant: e.participant});
            });
            WebRTCconference.event.on('screensharingStarted', function (e) {
                log('screen sharing started', e)
                /*if(screensRendering.getActiveViewMode() != 'screenSharing') {
                    var screensharingTrack;
				    if(e.content && e.content.trackId != null) {
                        screensharingTrack = e.participant.videoTracks().filter(function (t) {
                            return t.mediaStreamTrack.id == e.content.trackId ? true : false;
                        })[0];
                    } else {
				        var videoTracks =e.participant.videoTracks();
                        if(videoTracks.length != 0) screensharingTrack = videoTracks.reduce(function(prev, current) {
                            return ((prev.trackEl.videoWidth * prev.trackEl.videoHeight) > (current.trackEl.videoWidth * current.trackEl.videoHeight)) ? prev : current;
                        })
                    }

                    if(screensharingTrack) {
                        screensharingTrack.screensharing = true;
                        screensRendering.renderFullScreenLayout(screensharingTrack.parentScreen);
                    }
                }*/
                //screensRendering.hideLoader('screensharingStarting', data.participant);
            });
            WebRTCconference.event.on('screensharingFailed', function (e) {
                log('screen sharing failed')
                screensRendering.hideLoader('screensharingFailed', {participant: e.participant});
            });

            WebRTCconference.event.on('connected', function () {
                log('Connected to server')
                connectionState.updateStatus('Connected');
                connectionState.show();

                setTimeout(function () {
                    connectionState.hide();

                }, 1000);
            });
            WebRTCconference.event.on('connectError', function () {
                log('Server connection failed')
                connectionState.show();
                //connectionState.updateStatus('reconnecting', 'Server connection failed: ');
            });
            WebRTCconference.event.on('reconnectError', function () {
                log('Server reconnection failed')
                connectionState.updateStatus('reconnection failed', 'Server connection failed: ');
            });
            WebRTCconference.event.on('reconnectAttempt', function (n) {
                log('Server reconnection attempt ' + n)
                connectionState.updateStatus('reconnection attempt ' + n, 'Server connection failed: ');
            });

            var updateLayoutOnResize = function() {
                setTimeout(function () {
                    screensRendering.updateLayout();
                }, 1000)
            }

            window.addEventListener("resize", updateLayoutOnResize);

            WebRTCconference.event.on('disconnected', function () {
                window.removeEventListener('resize', updateLayoutOnResize);
            });

        }

        /**
         * Show dialog with insturctions in case when it's impossible to access microphone or camera.
         * @method showInstructionsDialog
         * @param {String} [kind] Name of device that is not accessible.
         */
        var connectionState = (function () {

            var preparingRoom = ((_options.preparing.video || _options.preparing.audio) || (!_options.startWith.video && !_options.startWith.audio));

            var _notice = null;
            var _currentState = preparingRoom ? "Checking room's state" : 'Connecting...';

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
                dialogList.innerHTML = `<div>` + _textes.webrtc.webIosInstructionsDialog.permissionDenied.interpolate({kind: kind}) + `</div>`;
                //Q.getObject("webrtc.allow." + titleText, _textes)
            } else {
                dialogList.innerHTML = `<div>` + _textes.webrtc.webInstructionsDialog.permissionDenied.interpolate({kind: kind}) + `</div>
									<li>` + Q.getObject("webrtc.webInstructionsDialog.point1", _textes) + `</li>
									<li>` + _textes.webrtc.webInstructionsDialog.point2.interpolate({hostname: location.hostname}) + `</li>`;
            }

            instructionsPermissionDialog.appendChild(dialogList);
            Q.Dialogs.push({
                title: Q.getObject("webrtc.webInstructionsDialog.dialogTitle", _textes),
                className: 'Streams_webrtc_devices_dialog',
                content: instructionsPermissionDialog,
                apply: true
            });
        }

        /**
         * Show dialog with buttons to get permissions for camera and/or mirophone.
         * @method showPermissionsDialogue
         */
        function showPermissionsDialogue(constrains, callback) {

            var micIcon = '<svg class="microphone-icon" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"    y="0px" viewBox="-0.165 -0.245 99.499 99.498"    enable-background="new -0.165 -0.245 99.499 99.498" xml:space="preserve">  <path fill="#FFFFFF" d="M49.584-0.245c-27.431,0-49.749,22.317-49.749,49.749c0,27.432,22.317,49.749,49.749,49.749   c27.432,0,49.75-22.317,49.75-49.749C99.334,22.073,77.016-0.245,49.584-0.245z M41.061,32.316c0-4.655,3.775-8.43,8.431-8.43   c4.657,0,8.43,3.774,8.43,8.43v19.861c0,4.655-3.773,8.431-8.43,8.431c-4.656,0-8.431-3.775-8.431-8.431V32.316z M63.928,52.576   c0,7.32-5.482,13.482-12.754,14.336v5.408h6.748v3.363h-16.86V72.32h6.749v-5.408c-7.271-0.854-12.753-7.016-12.754-14.336v-10.33   h3.362v10.125c0,6.115,4.958,11.073,11.073,11.073c6.116,0,11.073-4.958,11.073-11.073V42.246h3.363V52.576z"/>  </svg>';
            var cameraIcon = '<svg class="camera-icon" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="-0.165 -0.245 99.499 99.498" enable-background="new -0.165 -0.245 99.499 99.498"    xml:space="preserve">  <path fill="#FFFFFF" class="cameraPath" d="M49.584-0.245c-27.431,0-49.749,22.317-49.749,49.749c0,27.432,22.317,49.749,49.749,49.749   c27.432,0,49.75-22.317,49.75-49.749C99.334,22.073,77.016-0.245,49.584-0.245z M77.156,60.693l-15.521-8.961v8.51H25.223v-23.42   h36.412v8.795l15.521-8.961V60.693z"/>  </svg>';


            var addStreamToRoom = function(stream) {

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

                    if(WebRTCconference.state == 'connected' && _options.streams == null) {
                        publishTracks();
                    } else {
                        WebRTCconference.event.on('joined', function () {
                            if (_options.streams == null) {
                                publishTracks();
                            }
                        });
                    }

                } else if (_options.streams == null) {
                    if(_options.startWith.video == true || _options.startWith.audio == true) _options.streams = [stream];
                    if((Q.info.isMobile || Q.info.isTablet) && !Q.info.isCordova && _options.startWith.video == false && _options.startWith.audio == false) {
                        if(callback != null) callback();
                        return;
                    }
                    if(callback != null) callback();
                }
                if(document.querySelector('.Streams_webrtc_instructions_dialog') == null) Q.Dialogs.pop();
            }

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

                var mediaDevicesDialog = document.createElement('DIV');
                mediaDevicesDialog.className = 'Streams_webrtc_devices_dialog_inner';
                var turnOnBtn = document.createElement('BUTTON');
                turnOnBtn.type = 'button';
                turnOnBtn.className = 'Q_button Streams_webrtc_enable-microphone-btn';
                var btnText = document.createElement('SPAN');
                turnOnBtn.appendChild(btnText)
                var titleText;
                if (constrains.audio) {
                    turnOnBtn.innerHTML = micIcon + turnOnBtn.innerHTML;
                    titleText = 'microphoneBtn';
                }
                if (constrains.video) {
                    turnOnBtn.innerHTML = turnOnBtn.innerHTML + cameraIcon;
                    titleText = 'cameraBtn';
                }
                if (constrains.audio && constrains.video) {
                    titleText = 'cameraAndMicrophoneBtn';
                }
                var text = Q.getObject("webrtc.allow." + titleText, _textes);
                turnOnBtn.querySelector('SPAN').innerHTML = text;


                mediaDevicesDialog.appendChild(turnOnBtn);
                mediaDevicesDialog.addEventListener('mouseup', function (e) {
                    if(_options.streams != null && _options.streams.length != 0) return;
                    navigator.mediaDevices.getUserMedia({video: constrains.video && videoDevices != 0, audio:constrains.audio && audioDevices != 0})
                        .then(function (stream) {
                            addStreamToRoom(stream);
                        }).catch(function (err) {
                        if(err.name == "NotAllowedError") showInstructionsDialog('camera/microphone');
                        console.error(err.name + ": " + err.message);
                    });
                });

                Q.Dialogs.push({
                    title: Q.getObject("webrtc.allow.dialogTitle", _textes),
                    className: 'Streams_webrtc_devices_dialog',
                    content: mediaDevicesDialog,
                    apply: true
                });

            })
        }

        /**
         * Show dialog with buttons to get permissions for camera and/or mirophone and "Join room" button.
         * @method showPermissionsDialogue
         */
        function showPreparingDialogue(callback, closeCallback) {
            var micSVG = '<svg class="microphone-icon" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"    y="0px" viewBox="-0.165 -0.245 99.499 99.498"    enable-background="new -0.165 -0.245 99.499 99.498" xml:space="preserve">  <path fill="#FFFFFF" d="M49.584-0.245c-27.431,0-49.749,22.317-49.749,49.749c0,27.432,22.317,49.749,49.749,49.749   c27.432,0,49.75-22.317,49.75-49.749C99.334,22.073,77.016-0.245,49.584-0.245z M41.061,32.316c0-4.655,3.775-8.43,8.431-8.43   c4.657,0,8.43,3.774,8.43,8.43v19.861c0,4.655-3.773,8.431-8.43,8.431c-4.656,0-8.431-3.775-8.431-8.431V32.316z M63.928,52.576   c0,7.32-5.482,13.482-12.754,14.336v5.408h6.748v3.363h-16.86V72.32h6.749v-5.408c-7.271-0.854-12.753-7.016-12.754-14.336v-10.33   h3.362v10.125c0,6.115,4.958,11.073,11.073,11.073c6.116,0,11.073-4.958,11.073-11.073V42.246h3.363V52.576z"/>  </svg>';
            var disabledMicSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="0.049 -0.245 99.499 99.498" enable-background="new 0.049 -0.245 99.499 99.498"    xml:space="preserve">  <path fill="#FFFFFF" d="M49.797,99.253c-27.431,0-49.749-22.317-49.749-49.749c0-27.431,22.317-49.749,49.749-49.749   c27.432,0,49.75,22.317,49.75,49.749C99.548,76.936,77.229,99.253,49.797,99.253z M49.797,3.805   c-25.198,0-45.698,20.5-45.698,45.699s20.5,45.699,45.698,45.699c25.2,0,45.7-20.501,45.7-45.699S74.997,3.805,49.797,3.805z"/>  <path fill="#FFFFFF" d="M49.798,60.607c4.657,0,8.43-3.775,8.43-8.431v-8.634L44.893,59.024   C46.276,60.017,47.966,60.607,49.798,60.607z"/>  <path fill="#FFFFFF" d="M58.229,32.316c0-4.656-3.773-8.43-8.43-8.43c-4.656,0-8.43,3.775-8.431,8.43v19.861   c0,0.068,0.009,0.135,0.01,0.202l16.851-19.563V32.316z"/>  <path fill="#FFFFFF" d="M48.117,66.912v5.408h-6.749v3.363h16.86V72.32h-6.748v-5.408c7.271-0.854,12.754-7.016,12.754-14.336   v-10.33H60.87v10.125c0,6.115-4.957,11.073-11.072,11.073c-2.537,0-4.867-0.862-6.733-2.297l-2.305,2.675   C42.813,65.475,45.331,66.585,48.117,66.912z"/>  <path fill="#FFFFFF" d="M38.725,52.371V42.246h-3.362v10.33c0,1.945,0.397,3.803,1.102,5.507l2.603-3.022   C38.852,54.198,38.725,53.301,38.725,52.371z"/>  <rect x="47.798" y="11.385" transform="matrix(0.7578 0.6525 -0.6525 0.7578 43.3634 -20.8757)" fill="#C12337" width="4" height="73.163"/>  </svg>';
            var cameraSVG = '<svg version="1.1"    xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/"    x="0px" y="0px" width="101px" height="101px" viewBox="-0.335 -0.255 101 101" enable-background="new -0.335 -0.255 101 101"    xml:space="preserve">  <defs>  </defs>  <path opacity="0.2" d="M50,2.5C23.809,2.5,2.5,23.808,2.5,50S23.808,97.499,50,97.499c26.191,0,47.5-21.308,47.5-47.499   C97.5,23.809,76.19,2.5,50,2.5z"/>  <path fill="#FFFFFF" d="M50,0C22.431,0,0,22.43,0,50c0,27.57,22.429,49.999,50,49.999c27.57,0,50-22.429,50-49.999   C100,22.431,77.569,0,50,0z M77.71,61.245l-15.599-9.006v8.553H25.516V37.254h36.595v8.839l15.599-9.006V61.245z"/>  </svg>';
            var disabledCameraSVG = '<svg  version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"    viewBox="-0.165 -0.245 99.499 99.498" enable-background="new -0.165 -0.245 99.499 99.498"    xml:space="preserve">  <path fill="#FFFFFF" d="M49.584-0.245c-27.431,0-49.749,22.317-49.749,49.749c0,27.432,22.317,49.749,49.749,49.749   c27.432,0,49.75-22.317,49.75-49.749C99.334,22.073,77.016-0.245,49.584-0.245z M49.584,95.203   c-25.198,0-45.698-20.501-45.698-45.699s20.5-45.699,45.698-45.699c25.199,0,45.699,20.5,45.699,45.699S74.783,95.203,49.584,95.203   z"/>  <polygon fill="#FFFFFF" points="61.635,39.34 43.63,60.242 61.635,60.242 61.635,51.732 77.156,60.693 77.156,36.656 61.635,45.617    "/>  <polygon fill="#FFFFFF" points="25.223,36.822 25.223,60.242 34.391,60.242 54.564,36.822 "/>  <rect x="47.585" y="11.385" transform="matrix(0.7578 0.6525 -0.6525 0.7578 43.3117 -20.7363)" fill="#C12337" width="4" height="73.163"/>  </svg>';
            var screenSharingSVG = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"  width="100px" height="100px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"> <path fill="#FFFFFF" d="M50.072,0.054c-27.57,0-49.999,22.429-49.999,50c0,27.57,22.429,50,49.999,50  c27.571,0,50.001-22.43,50.001-50C100.073,22.484,77.644,0.054,50.072,0.054z M76.879,63.696H53.705v5.222h5.457v3.77H40.987v-3.77  h5.458v-5.222H23.268V31.439H76.88L76.879,63.696L76.879,63.696z"/> </svg>';
            var disabledScreenSharingSVG = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"  width="100px" height="100px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"> <path fill="#FFFFFF" d="M50.172,100.346C22.508,100.346,0,77.838,0,50.172C0,22.508,22.508,0,50.172,0  c27.666,0,50.173,22.508,50.173,50.172C100.346,77.838,77.839,100.346,50.172,100.346z M50.172,4.084  C24.76,4.084,4.084,24.76,4.084,50.172c0,25.414,20.675,46.088,46.088,46.088c25.414,0,46.088-20.675,46.088-46.088  C96.261,24.76,75.586,4.084,50.172,4.084z"/> <g>  <polygon fill="#FCFCFC" points="60.309,31.439 23.268,31.439 23.268,63.696 32.533,63.696 "/>  <polygon fill="#FCFCFC" points="68.252,31.439 40.478,63.696 46.444,63.696 46.444,68.918 40.987,68.918 40.987,72.688   59.162,72.688 59.162,68.918 53.705,68.918 53.705,63.696 76.879,63.696 76.88,63.696 76.88,31.439 "/> </g> <rect x="47.83" y="11.444" transform="matrix(-0.7577 -0.6526 0.6526 -0.7577 56.1462 117.2643)" fill="#C12337" width="4.02" height="73.532"/> </svg>';
            var userSVG = '<svg version="1.1" id="Слой_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"  width="100px" height="100px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"> <path d="M65.904,52.834c-4.734,3.725-10.695,5.955-17.172,5.955c-6.316,0-12.146-2.119-16.821-5.68C16.654,55.575,5,68.803,5,84.757  c0,11.78,14.356,10.197,32.065,10.197h25.869C80.643,94.954,95,97,95,84.757C95,68.051,82.221,54.333,65.904,52.834z"/> <path d="M48.732,55.057c13.286,0,24.092-10.809,24.092-24.095c0-13.285-10.807-24.094-24.092-24.094  c-13.285,0-24.093,10.809-24.093,24.094C24.64,44.248,35.448,55.057,48.732,55.057z"/> </svg>';

            var usersAvatar = null;
            var preJoiningStreams = [];

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
                            log('setUserAvatar set');
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
                    close.className = 'Streams_webrtc_popup-close-dialog-sign';
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
                        Q.handle(_options.onWebRTCRoomEnded, webRTCInstance);
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
                switchMicBtn.innerHTML = disabledMicSVG;

                var switchCameraBtn = document.createElement('DIV');
                switchCameraBtn.type = 'button';
                switchCameraBtn.className = 'Streams_webrtc_prep-switch-camera';
                switchCameraBtn.innerHTML = disabledCameraSVG;

                var switchScreenSharingBtn = document.createElement('DIV');
                switchScreenSharingBtn.type = 'button';
                switchScreenSharingBtn.className = 'Streams_webrtc_prep-switch-screen';
                switchScreenSharingBtn.innerHTML = disabledScreenSharingSVG;

                var joinButtonCon = document.createElement('DIV');
                joinButtonCon.className = 'Streams_webrtc_join-button-con';
                var joinButton = document.createElement('DIV');
                joinButton.type = 'button';
                joinButton.className = 'Q_button Streams_webrtc_join-button';
                joinButton.innerHTML = Q.getObject("webrtc.preparing.joinNow", _textes);


                //meetingStatus.appendChild(participantsIcon);
                mediaDevicesDialog.appendChild(cameraPreview);
                buttonsInner.appendChild(switchMicBtn);
                buttonsInner.appendChild(switchCameraBtn);
                if(!(Q.info.isMobile || Q.info.isTablet) || Q.info.isCordova) buttonsInner.appendChild(switchScreenSharingBtn);
                buttonsCon.appendChild(buttonsInner);
                mediaDevicesDialog.appendChild(buttonsCon);
                joinButtonCon.appendChild(joinButton);
                mediaDevicesDialog.appendChild(joinButtonCon);
                //mediaDevicesDialog.appendChild(breakEl);

                setAvatarOnPreview(cameraPreview);

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

                    if(audioIsAlreadyEnabled === false && off == null) {
                        log('switchMic: getUserMedia: before')

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
                    } else if(audioIsAlreadyEnabled !== false && preJoiningStreams[audioIsAlreadyEnabled].stream != null) {
                        log('switchMic: audioIsAlreadyEnabled ' + audioIsAlreadyEnabled)

                        let tracks = preJoiningStreams[audioIsAlreadyEnabled].stream.getAudioTracks();
                        for(let t in tracks) {
                            tracks[t].stop();
                        }

                        preJoiningStreams.splice(audioIsAlreadyEnabled, 1);
                        switchMicBtn.innerHTML = disabledMicSVG;
                        _options.startWith.audio = false;
                    }
                }

                if(_options.preparing.audio === true) switchMic();

                switchMicBtn.addEventListener('mouseup', function () {
                    switchMic();
                });

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
                                    console.log('camera: play func success')
                                }).catch((e) => {
                                    console.error(e)
                                    console.log('camera: play func error')

                                });

                                videoPreview.addEventListener('canplay', function () {
                                    console.log('camera: canplay')


                                });
                                videoPreview.addEventListener('emptied', function () {
                                    console.log('camera: emptied')
                                });
                                videoPreview.addEventListener('loadeddata', function () {
                                    console.log('camera: loadeddata')
                                });
                                videoPreview.addEventListener('loadedmetadata', function () {
                                    console.log('camera: loadedmetadata')
                                });
                                videoPreview.addEventListener('loadstart', function () {
                                    console.log('camera: loadstart')
                                });
                                videoPreview.addEventListener('play', function () {
                                    console.log('camera: play')
                                });
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
                if(_options.preparing.video === true) switchCamera();
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
                                console.log('screen: play func success')
                            }).catch((e) => {
                                console.error(e)
                                console.log('screen: play func error')

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
                if(_options.preparing.screen === true) switchScreenshare();
                switchScreenSharingBtn.addEventListener('mouseup', function () {
                    switchScreenshare();
                });

                var roomId = _options.roomId != null ? _options.roomId : null;
                if(_options.roomPublisherId == null) _options.roomPublisherId = Q.Users.loggedInUser.id;

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
                            roomId: roomId,
                            publisherId: _options.roomPublisherId,
                        }
                    });
                }
                checkmeetingStatus();
                var checkStatusInterval = setInterval(checkmeetingStatus, 3000);

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
                        title: 'Turn camera or mic on/off before you join',
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
                            Q.handle(_options.onWebRTCRoomEnded, webRTCInstance);
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
         * @method publishMediaTracks
         */
        function publishMediaTracks(constrains, callback) {
            log('publishMediaTracks: video = ' + (constrains != null && constrains.video))
            log('publishMediaTracks: audio = ' + (constrains != null && constrains.audio))

            if(Q.info.isCordova && Q.info.platform === 'ios' && _options.useCordovaPlugins) {
                cordova.plugins.iosrtc.enumerateDevices(function(mediaDevicesList) {
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
                        dialogList.innerHTML = `<div>` + _textes.webrtc.iosInstructionsDialog.permissionDenied.interpolate({kind: kind}) + `</div>
									<li>` + Q.getObject("webrtc.iosInstructionsDialog.point1", _textes) + `</li>
									<li>` + Q.getObject("webrtc.iosInstructionsDialog.point2", _textes) + `</li>
									<li>` + _textes.webrtc.iosInstructionsDialog.point3.interpolate({kind: kind}) + `</li>
									<li>` + _textes.webrtc.iosInstructionsDialog.point4.interpolate({communityId: Q.Users.communityId}) + `</li>`;
                        instructionsPermissionDialog.appendChild(dialogList);
                        Q.Dialogs.push({
                            title: Q.getObject("webrtc.iosInstructionsDialog.dialogTitle", _textes),
                            className: 'Streams_webrtc_devices_dialog',
                            content: instructionsPermissionDialog,
                            apply: true
                        });
                    }

                    var publishStreams = function (streams) {
                        if (_options.streams != null) return;
                        if (WebRTCconference != null) {
                            _options.streams = streams;
                            var publishTracks = function () {
                                for (var s in streams) {
                                    var tracks = streams[s].getTracks();
                                    for (var t in tracks) {
                                        WebRTCconference.conferenceControl.addTrack(tracks[t], streams[s]);
                                    }
                                }

                                navigator.mediaDevices.enumerateDevices().then(function (mediaDevices) {
                                    WebRTCconference.conferenceControl.loadDevicesList(mediaDevices);
                                }).catch(function (e) {
                                    console.error('ERROR: cannot get device info: ' + e.message);
                                });
                            }

                            if (WebRTCconference.state == 'connected') {
                                log('publishMediaTracks: got stream: publishTracks');

                                publishTracks();
                                if(document.querySelector('.Streams_webrtc_instructions_dialog') == null) Q.Dialogs.pop();
                            } else {
                                log('publishMediaTracks: got stream: delay publishing');

                                WebRTCconference.event.on('joined', function () {
                                    publishTracks();
                                    if(document.querySelector('.Streams_webrtc_instructions_dialog') == null) Q.Dialogs.pop();
                                });
                            }
                        } else if (_options.streams == null) {
                            log('publishMediaTracks: got stream: add to options');

                            _options.streams = streams;
                            window.sstream = streams;

                        }
                    }

                    var requestVideoStream = function (callback) {
                        cordova.plugins.iosrtc.getUserMedia(
                            {
                                video: true,
                                audio: false
                            },
                            function (stream) {
                                log('requestVideoStream: got stream');
                                if(callback != null) callback(stream);
                            },
                            function (error) {
                                showInstructionsDialogIos('Camera');
                                console.error(error);
                            }
                        );
                    }

                    var requestAudioStream = function (callback) {
                        cordova.plugins.iosrtc.getUserMedia(
                            {
                                video: false,
                                audio: true
                            },
                            function (stream) {
                                log('publishMediaTracks: got stream');
                                if(callback != null) callback(stream);
                            },
                            function (error) {
                                showInstructionsDialogIos('Microphone');
                                console.error(error);
                            }
                        );
                    }

                    if(_options.startWith.video && videoDevices != 0 && _options.startWith.audio && audioDevices != 0) {
                        requestVideoStream(function (videoStream) {
                            requestAudioStream(function (audioStream) {
                                publishStreams([videoStream, audioStream]);
                            });
                        });
                    } else if(_options.startWith.video && videoDevices != 0) {
                        requestVideoStream(function (videoStream) {
                            publishStreams([videoStream]);
                        });
                    } else if(_options.startWith.audio && audioDevices != 0) {
                        requestAudioStream(function (audioStream) {
                            publishStreams([audioStream]);
                        });
                    }


                })
                return;
            }


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

                if(!Q.info.isMobile && !Q.info.isTablet && (!constrains.video || videoDevices == 0) && (!constrains.audio || audioDevices == 0)) return;

                navigator.mediaDevices.getUserMedia({video:constrains.video && videoDevices != 0, audio:constrains.audio && audioDevices != 0})
                    .then(function (stream) {
                        if(_options.streams != null) return;
                        Q.Dialogs.pop();
                        if(WebRTCconference != null){
                            log('publishMediaTracks: stream is being added the room', stream);

                            _options.streams = [stream];
                            var publishTracks = function() {
                                var tracks = stream.getTracks();
                                log('publishMediaTracks: addTrack ', tracks);

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
                                if(document.querySelector('.Streams_webrtc_instructions_dialog') == null) Q.Dialogs.pop();
                            } else {
                                WebRTCconference.event.on('joined', function () {
                                    publishTracks();
                                    if(document.querySelector('.Streams_webrtc_instructions_dialog') == null) Q.Dialogs.pop();
                                });
                            }
                        } else if (_options.streams == null) {
                            log('publishMediaTracks: stream is added to options', stream);
                            _options.streams = [stream];
                            if((Q.info.isMobile || Q.info.isTablet) && !Q.info.isCordova && _options.startWith.video == false && _options.startWith.audio == false) {
                                if(callback != null) callback();
                                return;
                            }
                            if(callback != null) callback();
                        }
                    }).catch(function(err) {
                    console.error(err.name + ": " + err.message);
                    if(err.name == 'NotAllowedError') showInstructionsDialog('camera/microphone');
                });
            }).catch(function (e) {
                console.error('ERROR: cannot get device info: ' + e.message);
            });
        }

        /**
         * Connect WebRTC room using Twilio-video.js.
         * @method startTwilioRoom
         * @param {roomId} Room id to connet
         * @param {accessToken} Access token retrieved via Twilio API
         */
        function startTwilioRoom(roomId, accessToken) {

            var initConference = function() {
                var ua=navigator.userAgent;

                var initRoom = function(TwilioInstance) {
                    var twilioRoomName = _roomStream.getAttribute('twilioRoomName');
                    WebRTCconference = window.WebRTCconferenceLib({
                        mode:'twilio',
                        roomName:twilioRoomName,
                        twilioAccessToken: accessToken,
                        useAsLibrary: true,
                        video: false,
                        audio: false,
                        startWith: _options.startWith,
                        streams: _options.streams != null ? _options.streams : null,
                        onlyOneScreenSharingAllowed: _options.onlyOneScreenSharingAllowed,
                        liveStreaming: _options.liveStreaming,
                        TwilioInstance: TwilioInstance,
                        debug: _debug
                    });

                    bindConferenceEvents(WebRTCconference);

                    WebRTCconference.init(function () {
                        screensRendering.updateLayout();
                        updateParticipantData();
                        connectionState.hide();
                        Q.handle(_options.onWebRTCRoomCreated, webRTCInstance);
                        _debugTimer.loadEnd = performance.now();
                        notice.show(Q.getObject("webrtc.notices.youJoinedRoom", _textes));

                        Q.activate(
                            document.body.appendChild(
                                Q.Tool.setUpElement(
                                    "div", // or pass an existing element
                                    "Streams/webrtc/controls",
                                    {
                                        webRTClibraryInstance: WebRTCconference,
                                        webrtcClass: webRTCInstance,
                                        onCreate: function () {
                                            Q.handle(_options.onWebrtcControlsCreated, this);
                                        }
                                    }
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
                }

                var src = Q.url('{{Streams}}/js/tools/webrtc/twilio-video.min.js');
                Q.require([src], function (TwilioInstance) {
                    initRoom(TwilioInstance);
                });


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
                initConference();
            } else {
                Q.addScript([
                    "{{Streams}}/js/tools/webrtc/app.js"
                ], function () {
                    initConference();
                });
            }

            /*if(_options.eyesDetection) {
                if(findScript('{{Q}}/js/webgazer.js')) {
                    initConference();
                } else {
                    Q.addScript([
                        "{{Q}}/js/webgazer.js"
                    ], function () {
                        initConference();
                    });
                }
            }*/
        }

        /**
         * Update stream participant's data after SID was assigned by twilio.
         * @method updateParticipantData
         */
        function updateParticipantData() {
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
                    participantSid: WebRTCconference.localParticipant().sid
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

                if(typeof window.WebRTCconferenceLib == 'undefined') return;
                var roomId = (_roomStream.fields.name).replace('Streams/webrtc/', '');
                var roomStartTime = _roomStream.getAttribute('startTime');
                log('initWithNodeServer: initConference: roomId = ' + roomId)
                log('initWithNodeServer: initConference: roomStartTime = ' + roomStartTime)
                log('initWithNodeServer: initConference: _roomStream = ', _roomStream)

                WebRTCconference = window.WebRTCconferenceLib({
                    mode:'node',
                    useAsLibrary: true,
                    nodeServer: socketServer,
                    roomName: roomId,
                    roomStartTime: roomStartTime,
                    roomPublisher: _roomStream.getAll().publisherId,
                    sid: Q.Users.loggedInUser.id,
                    username:  Q.Users.loggedInUser.id + '\t' + _options.startTime,
                    video: false,
                    audio: false,
                    startWith: _options.startWith,
                    streams: _options.streams != null ? _options.streams : null,
                    sounds: _options.sounds != null ? _options.sounds : null,
                    onlyOneScreenSharingAllowed: _options.onlyOneScreenSharingAllowed,
                    liveStreaming: _options.liveStreaming,
                    showScreenSharingInSeparateScreen: _options.showScreenSharingInSeparateScreen,
                    turnCredentials: turnCredentials,
                    debug: _debug
                });

                bindConferenceEvents(WebRTCconference);
                log('initWithNodeServer: initConference: start init');
                if(Q.info.isCordova) {
                    cordova.plugins.CordovaCall.sendCall('Daniel Marcus');
                }
                WebRTCconference.init(function (app) {
                    log('initWithNodeServer: initConference: inited');
                    updateParticipantData();
                    connectionState.hide();
                    _debugTimer.loadEnd = performance.now();

                    screensRendering.updateLayout();
                    Q.handle(_options.onWebRTCRoomCreated, webRTCInstance);
                    if(Q.info.isCordova) {
                        cordova.plugins.CordovaCall.connectCall();
                    }
                    Q.activate(
                        document.body.appendChild(
                            Q.Tool.setUpElement(
                                "div", // or pass an existing element
                                "Streams/webrtc/controls",
                                {
                                    webRTClibraryInstance: WebRTCconference,
                                    webrtcClass: webRTCInstance,
                                    onCreate: function () {
                                        Q.handle(_options.onWebrtcControlsCreated, this);
                                    }
                                }

                            )
                        ),
                        {},
                        function () {
                            log('initWithNodeServer: initConference: activate controls');

                            _controls = this.element;
                            _controlsTool = this;
                            screensRendering.updateLayout();

                            var moveWithinArea = 'window';
                            var columnsTools = Q.Tool.byName('Q/columns');
                            var dashboard = document.getElementById('dashboard_slot');
                            var columnsTool = columnsTools[Object.keys(columnsTools)[0]];
                            if(Q.info.isMobile) {
                                var updateArearectangle = function () {
                                    var moveWithinArea;
                                    if(Object.keys(columnsTools).length == 0 && dashboard) {
                                        log('initWithNodeServer: initConference: activate controls: no columns');
                                        var dashboardPos = dashboard.classList.contains('Q_fixed_top') ? 'top' : 'bottom';

                                        var windowWidth =  window.innerWidth;
                                        var windowHeight =  window.innerHeight;
                                        var dashboardHeight =  dashboard.offsetHeight;
                                        log('initWithNodeServer: initConference: activate controls: no columns', windowWidth, windowHeight, dashboardHeight);

                                        if(dashboardPos == 'bottom') {
                                            moveWithinArea = new DOMRect(0, 0, windowWidth, windowHeight - dashboardHeight);
                                        } else if(dashboardPos == 'top') {
                                            moveWithinArea = new DOMRect(0, dashboardHeight, windowWidth, windowHeight - dashboardHeight);
                                        }
                                    } else {
                                        log('initWithNodeServer: initConference: activate controls: columns != 0');

                                        var currentColumn = columnsTool.state.$currentColumn.get()[0];
                                        moveWithinArea = currentColumn.getBoundingClientRect();
                                    }

                                    return moveWithinArea;
                                }

                                moveWithinArea = updateArearectangle();


                            }

                            log('initWithNodeServer: initConference: activate controls: moveWithinArea', moveWithinArea);


                            var elementsToIgnore = [_controlsTool.settingsPopupEl, _controlsTool.textChat.chatBox, _controlsTool.participantListEl.parentNode];
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

                                    var resizeTool = this;
                                    if(columnsTool && Q.info.isMobile) {
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

                                    if(_options.controlsPosition == 'top') {
                                        this.snapTo('top');
                                    } else if(_options.controlsPosition == 'bottom') {
                                        this.snapTo('bottom');
                                    } else if(_options.controlsPosition == 'left') {
                                        this.snapTo('left');
                                    } else if(_options.controlsPosition == 'right') {
                                        this.snapTo('right');
                                    } else {
                                        this.snapTo('bottom');
                                        /*var dashboard = document.getElementById('dashboard_slot');
                                        if(dashboard && Q.info.isMobile && !Q.info.isTablet) {
                                            var dashboardPos = dashboard.classList.contains('Q_fixed_top') ? 'top' : 'bottom';
                                            if(dashboardPos == 'top') {
                                                this.snapTo('bottom');
                                            } else if (dashboardPos == 'bottom') {
                                                this.snapTo('top');
                                            }

                                        }*/
                                    }
                                }
                            );
                        }
                    );
                });
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
                    "{{Streams}}/js/tools/webrtc/app.js",
                    "{{Streams}}/js/tools/webrtc/RecordRTC.js",
                ], function () {

                    /*var gApi = document.createElement('SCRIPT');
					gApi.src = 'https://apis.google.com/js/api.js';
					gApi.defer = true;
					gApi.async = true;
					gApi.onload = function(){
						youtubeApi.handleClientLoad();
					}
					gApi.onreadystatechange = function(){
						if (this.readyState === 'complete') this.onload();
					}
					document.head.appendChild(gApi);*/
                    initConference();
                });
            }

        }

        var youtubeApi = (function () {
            var api = {};
            var CLIENT_ID = '';
            var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"];
            var SCOPES = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube';
            var DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v2/files/';
            var ACCESS_TOKEN;

            var defchannel = 'dechguyweb';

            function updateSigninStatus(isSignedin) {
                if(isSignedin) {
                    ACCESS_TOKEN = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
                } else {
                    ACCESS_TOKEN = null;
                }
            }

            api.login = function () {
                gapi.auth2.getAuthInstance().signIn();
            }

            api.logOut = function ()  {
                gapi.auth2.getAuthInstance().signOut();
            }

            api.getChannel = function (channel) {
                gapi.client.youtube.channels.list({
                    'part': 'snippet,contentDetails,statistics',
                    'forUsername': 'GoogleDevelopers'
                }).then(function(response) {
                    console.log(response);
                });
            }

            function initClient() {
                gapi.client.init({
                    discoveryDocs: DISCOVERY_DOCS,
                    clientId: CLIENT_ID,
                    scope: SCOPES
                }).then(function () {
                    // Listen for sign-in state changes.
                    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
                    // Handle the initial sign-in state.
                    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
                    /*authorizeButton.onclick = handleAuthClick;
					signoutButton.onclick = handleSignoutClick;*/
                });
            }

            api.handleClientLoad = function () {
                gapi.load('client:auth2', initClient);

                Q.addScript([
                    "{{Streams}}/js/tools/webrtc/upload_video.js",
                    "{{Streams}}/js/tools/webrtc/cors_upload.js"
                ], function () {

                });
            }

            return api;
        }())

        /**
         * Render screens of all participants in the room
         * @method screensRendering
         */
        var screensRendering = (function () {
            var activeScreen;
            var activeScreenRect;
            var viewMode;
            var prevViewMode;
            var roomScreens = [];
            var layoutEvents = new EventSystem();

            layoutEvents.on('layoutRendered', function (e) {

                if(e.viewMode == 'audio') {
                    console.log('layoutrendered : audio', e);
                    WebRTCconference.screensInterface.audioVisualization().buildCommonVisualization({
                        name: 'common',
                        type: 'bars',
                        element: _options.element
                    });

                    if(_controlsTool) _controlsTool.updateViewModeBtns();
                    lockScreenResizingAndDragging();
                } else if(e.viewMode == 'minimized') {
                    updateScreensButtons();
                    resetAudioVisualization();
                    if(_controlsTool != null) {
                        _controlsTool.participantsPopup().disableLoudesScreenMode();
                        _controlsTool.updateViewModeBtns();
                    }
                    unlockScreenResizingAndDragging();
                    WebRTCconference.screensInterface.audioVisualization().removeCommonVisualization();
                } else if(e.viewMode == 'screenSharing' || e.viewMode == 'fullScreen') {
                    if(_controlsTool) _controlsTool.updateViewModeBtns();
                    updateScreensButtons()
                    resetAudioVisualization();
                    lockScreenResizingAndDragging();
                    WebRTCconference.screensInterface.audioVisualization().removeCommonVisualization();
                } else {
                    if(_controlsTool) _controlsTool.updateViewModeBtns();
                    updateScreensButtons();
                    resetAudioVisualization();
                    unlockScreenResizingAndDragging();
                    WebRTCconference.screensInterface.audioVisualization().removeCommonVisualization();
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
                this.hasLiveTracks = function () {
                    var hasLiveTracks = false;
                    for(let t in this.tracks) {
                        let track = this.tracks[t];
                        if(track.mediaStreamTrack.enabled == true && track.mediaStreamTrack.readyState == 'live') {
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
                this.switchToAudioScreen = function () {
                    log('switchToAudioScreen : switchToAudioScreen0', this.activeScreenType)
                    if(this.activeScreenType == 'audio') return;
                    log('switchToAudioScreen : switchToAudioScreen1', this.activeScreenType)


                    this.show();
                    this.activeScreenType = 'audio';
                    this.removeAudioVisualization('video');
                    this.showAudioVisualization('audio');
                    //this.screenEl.innerHTML = '';
                    if(this.videoScreen.screenEl && this.videoScreen.screenEl.parentNode != null) {
                        this.videoScreen.screenEl.parentNode.removeChild(this.videoScreen.screenEl);
                    }
                    this.screenEl.appendChild(this.audioScreen.screenEl);
                };
                this.switchToVideoScreen = function () {
                    if(this.activeScreenType == 'video') return;
                    this.activeScreenType = 'video';
                    var videoTracks =  this.tracks.filter(function(t){
                        return t.kind == 'video' && t.mediaStreamTrack.enabled == true && t.mediaStreamTrack.readyState == 'live' ? true : false
                    })
                    log('switchToVideoScreen : videoTracks', videoTracks)
                    if(videoTracks.length == 0) {
                        this.hide();
                    } else {
                        for(let t in videoTracks) {
                            if(videoTracks[t].trackEl) {
                                videoTracks[t].trackEl.play().then((e) => {
                                    console.log('switchToVideoScreen: videoTracks play func success')
                                }).catch((e) => {
                                    console.error(e)
                                    console.log('switchToVideoScreen: videoTracks play func error')

                                });
                            }
                        }
                    }
                    this.removeAudioVisualization('audio');
                    this.showAudioVisualization('video');

                    //this.screenEl.innerHTML = '';
                    if(this.audioScreen.screenEl && this.audioScreen.screenEl.parentNode != null) {
                        this.audioScreen.screenEl.parentNode.removeChild(this.audioScreen.screenEl);
                    }
                    this.screenEl.appendChild(this.videoScreen.screenEl);
                };
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
                    log('screen.show', this.participant.isLocal, this.participant.identity);
                    log('screen.show: ', roomScreens.length);
                    try {
                        var err = (new Error);
                        console.log(err.stack);
                    } catch (e) {

                    }
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

                    WebRTCconference.event.dispatch('screenShown', screen);

                    if(screen.activeScreenType == 'video') {
                        this.showAudioVisualization('video');
                    } else {
                        this.showAudioVisualization('audio');
                    }

                }
                this.showAudioVisualization = function () {
                    var screen = this;
                    if(screen.activeScreenType == 'audio') {
                        if(screen.audioScreen.avatarCon != null && screen.participant.soundMeter.visualizations['participantScreenAudio'] == null) {

                            WebRTCconference.screensInterface.audioVisualization().build({
                                name: 'participantScreenAudio',
                                type: 'circles',
                                participant: screen.participant,
                                element: screen.audioScreen.avatarCon,
                                stopOnMute: true
                            });
                        }
                    } else if (screen.activeScreenType == 'video') {
                        if(screen.videoScreen.soundEl != null && screen.participant.soundMeter.visualizations['participantScreenVideo'] == null) {
                            WebRTCconference.screensInterface.audioVisualization().build({
                                name: 'participantScreenVideo',
                                participant: screen.participant,
                                element: screen.videoScreen.soundEl,
                                stopOnMute: true
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
                viewMode = prevViewMode = _options.defaultMobileViewMode || 'maximizedMobile';

            } else viewMode = prevViewMode = _options.defaultDesktopViewMode || 'regular';
            console.log('viewMode', viewMode);
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
                if(WebRTCconference == null) return;
                log('updateLayout, current mode is ', viewMode);

                log('updateLayout, roomScreens', roomScreens.length);

                var roomParticipants = WebRTCconference.roomParticipants();
                var i, participantScreen;
                for(i = 0; participantScreen = roomScreens[i]; i++) {
                    if(participantScreen.isLocal) updateLocalScreenClasses(participantScreen);

                    //createRoomScreen(participantScreen);
                }

                function doPlayTracks() {
                    var i, screen;
                    for (i = 0; screen = roomScreens[i]; i++) {
                        if(screen.videoTrack != null && screen.isActive) {
                            screen.videoTrack.play().then((e) => {
                                console.log('updateLayout: videoTracks play func success')
                            }).catch((e) => {
                                console.error(e)
                                console.log('updateLayout: videoTracks play func error')

                            });

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
             * @param {Object} [screen] screen object generated by WebRTCconference (WebRTC library)
             * @return {HTMLElement}
             */
            function createRoomScreen(participant) {
                log('createRoomScreen', participant, participant.isLocal);
                try {
                    var err = (new Error);
                    console.log(err.stack);
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
             * @param {Object} [screen] screen object generated by WebRTCconference (WebRTC library)
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

                if(screen.participant.soundMeter.visualizations['participantScreenVideo'] == null) {
                    WebRTCconference.screensInterface.audioVisualization().build({
                        name: 'participantScreenVideo',
                        participant: screen.participant,
                        element: participantVoice,
                        stopOnMute: true
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
             * @param {Object} [screen] screen object generated by WebRTCconference (WebRTC library)
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
                var chatParticipantAvatarInner = document.createElement('DIV');
                chatParticipantAvatarInner.className = 'Streams_webrtc_chat-participant-avatar';
                var chatParticipantName = screen.audioScreen.nameEl = document.createElement('DIV');
                chatParticipantName.className = 'Streams_webrtc_chat-participant-name';
                var participantNameTextCon = document.createElement("DIV");
                participantNameTextCon.className = "Streams_webrtc_participant-name-text";
                var participantNameText = document.createElement("DIV");
                var userId = screen.participant.identity != null ? screen.participant.identity.split('\t')[0] : Q.Users.loggedInUser.id;

                if(screen.participant.soundMeter.visualizations['participantScreenAudio'] == null) {
                    WebRTCconference.screensInterface.audioVisualization().build({
                        name: 'participantScreenAudio',
                        participant: screen.participant,
                        type: 'circles',
                        element: screen.audioScreen.avatarCon,
                        stopOnMute: true
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
                    WebRTCconference.screensInterface.audioVisualization().build({
                        name: 'participantScreen',
                        participant: screen.participant,
                        element: participantVoice,
                        stopOnMute: true
                    });
                }*/

                participantNameTextCon.appendChild(participantNameText);
                chatParticipantName.appendChild(participantNameTextCon);
                chatParticipantAvatarCon.appendChild(chatParticipantAvatarInner);
                audioScreenEl.appendChild(chatParticipantAvatarCon);
                audioScreenEl.appendChild(chatParticipantName);

                chatParticipantAvatarCon.addEventListener('click', function (e) {
                    e.preventDefault();
                });

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

                if(track.kind == 'video') {
                    var trackParentScreen;
                    if(track.parentScreen != null) {
                        trackParentScreen = track.parentScreen;
                    }  else if(participant.screens.length == 1 && participant.screens[0].tracks.length == 0){
                        log('newTrackAdded if2');

                        trackParentScreen = participant.screens[0];
                    } else {
                        log('newTrackAdded else');
                        trackParentScreen = createRoomScreen(participant);
                    }

                    trackParentScreen.videoScreen.videoCon.appendChild(track.trackEl);
                }

            }


            function onParticipantConnected(participant) {
                log('onParticipantConnected', participant,participant.isLocal)

                if(participant.screens.length == 0) {
                    var newScreen = createRoomScreen(participant);
                    addScreenToCommonList(newScreen);
                }
            }

            function onParticipantDisconnected(participant) {
                screensRendering.removeScreensByParticipant(participant);
                //addScreenToCommonList(newScreen);
            }

            function videoTrackIsAdding(track, participant) {
                var screenToAttach;
                if(track.kind == 'video' && track.screensharing) {
                    log('videoTrackIsAdding: screensharing', participant.screens);

                    if(!participant.isLocal) {
                        screenToAttach = participant.screens.filter(function (scrn) {
                            return scrn.screensharing == true && scrn.videoTrack == null;
                        })[0];
                    } else {
                        screenToAttach = participant.screens.filter(function (scrn) {
                            return scrn.videoTrack == null;
                        })[0];
                    }

                    if(!screenToAttach) {
                        screenToAttach = createRoomScreen(participant);
                    }
                    track.parentScreen = screenToAttach;
                    screenToAttach.videoTrack = track.trackEl;
                } else if(track.kind == 'video') {
                    log('videoTrackIsAdding: regular video');

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
                    screenToAttach.videoTrack = track.trackEl;

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
                                    keepRatioBasedOnElement: participantScreen.videoTrack != null ? participantScreen.videoTrack : null ,
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
                    resizeTool.state.keepRatioBasedOnElement = videoEl;
                }
            }

            /**
             * Flip local video from front camera / remove flipping of screensharing video
             * @method updateLocalScreenClasses
             * @param {Object} [screen] Local screen to update.
             */
            function updateLocalScreenClasses(screen) {

                if(screen.screensharing == true) {
                    if(!screen.screenEl.classList.contains('Streams_webrtc_chat-active-screen-sharing')) screen.screenEl.classList.add('Streams_webrtc_chat-active-screen-sharing');
                    if(screen.videoScreen.videoCon.classList.contains('Streams_webrtc_chat-flipped-video')) screen.videoScreen.videoCon.classList.remove('Streams_webrtc_chat-flipped-video');
                }


                var frontCameraDevice = WebRTCconference.conferenceControl.frontCameraDevice();
                var currentCameraDevice = WebRTCconference.conferenceControl.currentCameraDevice();
                if(!screen.screensharing && (currentCameraDevice == frontCameraDevice || Q.info.isTouchscreen == false)) {
                    if(screen.videoScreen.videoCon != null && !screen.videoScreen.videoCon.classList.contains('Streams_webrtc_chat-flipped-video')) screen.videoScreen.videoCon.classList.add('Streams_webrtc_chat-flipped-video');
                    if(screen.screenEl.classList.contains('Streams_webrtc_chat-active-screen-sharing')) screen.screenEl.classList.remove('Streams_webrtc_chat-active-screen-sharing');
                } else if(screen.videoScreen.videoCon) {
                    if(screen.videoScreen.videoCon.classList.contains('Streams_webrtc_chat-flipped-video')) screen.videoScreen.videoCon.classList.remove('Streams_webrtc_chat-flipped-video');
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

                } else if(viewMode == 'minimized' || viewMode == 'tiled' || viewMode == 'minimizedMobile') {
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
                var participants = WebRTCconference.roomParticipants();
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
                    //if(loaderName == 'screensharingStarting') {
                    screen = participant.screens.filter(function (scrn) {
                        return (scrn.screensharing == true && scrn.videoTrack == null);
                    })[0];
                    log('showLoader screen 1', screen)

                    if(screen == null) {
                        screen = participant.screens.filter(function (scrn) {
                            return !scrn.screensharing;
                        })[0];
                    }
                    /* } else {
                        screen = participant.screens[0];
                    }*/
                }

                log('showLoader', screen,  participant.screens.length)
                if(screen == null) return;
                if(screen.screenEl == null) {
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

                    _controlsTool.participantsPopup().showScreen(screen);

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

                    if(loaderName == 'screensharingFailed'){
                        screen.screensharng = false;
                        if(screen.videoTrack == null) {
                            screen.hide();
                            screensRendering.updateLayout();
                        }
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

                if(viewMode == 'audio') return;

                e.stopImmediatePropagation();
                e.preventDefault();

                if(viewMode == 'tiled' || viewMode == 'regular' || viewMode == 'tiledMobile' || viewMode == 'sideBySideMobile' || viewMode == 'maximizedMobile') {
                    viewModeToSwitchBack = viewMode;
                }

                var tappedScreen = roomScreens.filter(function (obj) {
                    return obj.screenEl.contains(e.target) || obj.screenEl == e.target;
                })[0];

                if(tappedScreen == null) return;
                var resizeTool = Q.Tool.from(tappedScreen.screenEl, "Q/resize");
                var videoResizeTool = Q.Tool.from(tappedScreen.videoScreen.videoCon, "Q/resize");
                if(resizeTool != null) {
                    if(resizeTool.state.appliedRecently) return;
                }
                if(videoResizeTool != null) {
                    if(videoResizeTool.state.appliedRecently) return;
                }


                if(_controlsTool != null) _controlsTool.participantsPopup().disableLoudesScreenMode();

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
                var participants = WebRTCconference.roomParticipants();
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
                    'Streams_webrtc_side-by-side-screens-grid',
                    'Streams_webrtc_maximized-screens-grid',
                    'Streams_webrtc_fullscreen-grid',
                    'Streams_webrtc_regular-screens-grid',
                    'Streams_webrtc_audio-screens-grid',
                ];
                var screenClasses = [
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
							if(screen.videoTrack != null && screen.videoTrack.videoWidth == 0 && screen.videoTrack.videoHeight == 0) screen.videoTrack.style.display = 'none';
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
                            if(screen.videoTrack != null && screen.videoTrack.videoWidth == 0 && screen.videoTrack.videoHeight == 0) screen.videoTrack.style.display = 'none';
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
                /*updateScreensButtons();
                resetAudioVisualization();
                if(_controlsTool) _controlsTool.updateViewModeBtns();*/
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

                /*updateScreensButtons();
                resetAudioVisualization();
                if(_controlsTool) _controlsTool.updateViewModeBtns();*/
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
                /*updateScreensButtons();
                resetAudioVisualization();
                if(_controlsTool) _controlsTool.updateViewModeBtns();
                unlockScreenResizingAndDragging();*/
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
                        return customLayouts.regularScreensGrid(document.body, roomScreens);
                    });
                }

                prevViewMode = viewMode;
                _layoutTool.animate('regularScreensGrid', elements, 500, true);
                viewMode = 'regular';

                layoutEvents.dispatch('layoutRendered', {prevViewMode:prevViewMode, viewMode});

                /*updateScreensButtons();
                resetAudioVisualization();
                if(_controlsTool) _controlsTool.updateViewModeBtns();
                unlockScreenResizingAndDragging();*/
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
                        return customLayouts.audioScreensGrid(_options.element, roomScreens);
                    });
                }

                prevViewMode = viewMode;
                _layoutTool.animate('audioScreensGrid', elements, 500, true);

                viewMode = 'audio';

                layoutEvents.dispatch('layoutRendered', {prevViewMode:prevViewMode, viewMode});
                /*WebRTCconference.screensInterface.audioVisualization().buildCommonVisualization({
                    name: 'common',
                    type: 'bars',
                    element: _options.element,
                });
                //updateScreensButtons();
                //resetAudioVisualization();
                if(_controlsTool) _controlsTool.updateViewModeBtns();
                lockScreenResizingAndDragging();*/
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

                /*updateScreensButtons();
                resetAudioVisualization();
                if(_controlsTool) _controlsTool.updateViewModeBtns();
                unlockScreenResizingAndDragging();*/
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
                        return customLayouts.minimizedOrMaximizedScreenGrid(document.body, count, _controls.querySelector('.Streams_webrtc_conference-control'), false);
                    });
                }

                switchScreenType('video');

                var elements = toggleScreensClass('minimizedScreensGrid');

                prevViewMode = viewMode;
                _layoutTool.animate('minimizedScreensGrid', elements, 500, true);
                viewMode = 'minimized';

                layoutEvents.dispatch('layoutRendered', {prevViewMode:prevViewMode, viewMode});

                /*updateScreensButtons();
                resetAudioVisualization();
                if(_controlsTool != null) {
                    _controlsTool.participantsPopup().disableLoudesScreenMode();
                    _controlsTool.updateViewModeBtns();
                }
                unlockScreenResizingAndDragging();*/
            }

            /**
             * Render maximized view mode on desktop (one screen is maximized, rest - minimized).
             * @method renderMaximizedScreensGrid
             */
            function renderMaximizedScreensGrid(screenToMaximize, duration) {
                if(typeof duration == 'undefined') duration = 500;
                log('renderMaximizedScreensGrid', screenToMaximize)
                //TODO: check if "(screenToMaximize != null && screenToMaximize == activeScreen)" impacts updating layout
                if(_layoutTool == null || _controls == null || (screenToMaximize != null && screenToMaximize == activeScreen && !(viewMode == 'screenSharing' || viewMode == 'fullScreen'))) return;

                switchScreenType('video');

                if(screenToMaximize != null && screenToMaximize.isActive) activeScreen = screenToMaximize;
                if(screenToMaximize == null && (activeScreen == null || activeScreen.isLocal) /*&& roomScreens.length == 2*/) {

                    var screensToTakeInc = roomScreens.filter(function (s) {
                        return (!s.isLocal ? true : false);
                    });
                    if(screensToTakeInc.length != 0) {
                        activeScreen = screensToTakeInc.reduce(function (prev, current) {
                            return (prev.participant.connectedTime > current.participant.connectedTime) ? prev : current;
                        });

                    }
                }

                if(activeScreen == null || !_roomsMedia.contains(activeScreen.screenEl)) activeScreen = roomScreens[0];
                log('renderMaximizedScreensGrid activeScreen')

                if(!_layoutTool.getLayoutGenerator('maximizedScreensGrid')) _layoutTool.setLayoutGenerator('maximizedScreensGrid', function (container, count) {
                    return customLayouts.minimizedOrMaximizedScreenGrid(document.body, count, _controls.querySelector('.Streams_webrtc_conference-control'), true);
                });

                var elements = toggleScreensClass('maximizedScreensGrid');
                prevViewMode = viewMode;
                _layoutTool.animate('maximizedScreensGrid', elements, duration, true);
                viewMode = 'maximized';

                layoutEvents.dispatch('layoutRendered', {prevViewMode:prevViewMode, viewMode});

                /*updateScreensButtons();
                resetAudioVisualization();
                if(_controlsTool) _controlsTool.updateViewModeBtns();
                unlockScreenResizingAndDragging();*/
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

                /*if(_controlsTool) _controlsTool.updateViewModeBtns();
                updateScreensButtons()
                resetAudioVisualization();
                lockScreenResizingAndDragging();*/
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
                /*if(_controlsTool) _controlsTool.updateViewModeBtns();
                updateScreensButtons()
                resetAudioVisualization();*/
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

                /*if(_controlsTool) _controlsTool.updateViewModeBtns();

                updateScreensButtons();
                resetAudioVisualization();*/
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
                regularScreensGrid: function (container, roomScreens) {

                    var containerRect = container == document.body ? new DOMRect(0, 0, window.innerWidth, window.innerHeight) : container.getBoundingClientRect();
                    var parentWidth = containerRect.width;
                    var parentHeight = containerRect.height;
                    var centerX = containerRect.width / 2;
                    var centerY = containerRect.height / 2;
                    var rectsRows = [];
                    var currentRow = [];

                    var spaceBetween = 10;

                    var count = roomScreens.length;
                    var i, screen;
                    for (i = 0; i < count; i++) {
                        var screen = roomScreens[i];

                        var screenElRect = screen.screenEl.getBoundingClientRect();
                        var videoWidth = screen.videoTrack != null && screen.videoTrack.videoWidth != 0 ? screen.videoTrack.videoWidth : 0
                        var videoHeight = (screen.videoTrack != null && screen.videoTrack.videoHeight != 0 ? screen.videoTrack.videoHeight : 0);

                        var newRectSize = null;
                        if(videoWidth != 0 && videoHeight != 0) {
                            newRectSize = getElementSizeKeepingRatio({
                                width: videoWidth,
                                height: videoHeight
                            }, {width: 250, height: 250})
                        } else if(videoWidth == 0 && videoHeight == 0 && screenElRect.width != 0 && screenElRect.height != 0 ) {
                            newRectSize = {
                                width: screen.videoScreen.nameEl.firstChild.scrollWidth + 30 + (screen.videoScreen.nameEl.firstChild.offsetLeft * 2),
                                height: screen.videoScreen.nameEl.scrollHeight
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

                /**
                 * Prepare data for animated changing view mode to audio layout
                 * @method audioScreensGrid
                 * @param {Object} [container] HTML parent element participants' screens.
                 * @return {Array} List of DOMRects that will be passed to Q.layout.
                 */
                audioScreensGrid: function (container, roomScreens) {
                    var parentRect = container == document.body ? new DOMRect(0, 0, window.innerWidth, window.innerHeight) : container.getBoundingClientRect();
                    if(parentRect == 0 || parentRect.height == 0) return false;
                    var count = roomScreens.length;
                    var rects = [];
                    console.log('parentRect', parentRect)

                    //var mainRadius = Math.min(size.parentWidth, size.parentHeight);

                    var centerX = parentRect.width / 2;
                    var centerY = parentRect.height / 2;
                    var spaceBetween = 15;

                    var ratio = parentRect.width / parentRect.height;
                    var isRatherNotMobile = parentRect.width < 360 || parentRect.height < 360;
                    console.log('isRatherNotMobile', isRatherNotMobile)
                    try {
                        var err = (new Error);
                        console.log(err.stack);
                    } catch (e) {

                    }

                    if(ratio > 4.2 || (isRatherNotMobile && ratio > 3.8)) {
                        var rectHeight = (parentRect.height / 100  * 80) + 19;
                        console.log('rectHeight', rectHeight, parentRect.height)
                        if(rectHeight > parentRect.height) rectHeight = parentRect.height - 5;
                        var rectWidth = rectHeight - 19;
                        var spaceBetween = 15;
                        var startFrom  = (parentRect.width / 2) - ((rectWidth * count) + (spaceBetween * count)) / 2;
                        var prevRect = new DOMRect(startFrom, 0, 0, 0);
                        for ( var i=0; i<=count; i++ ) {
                            let x = prevRect.x + prevRect.width + spaceBetween;
                            let y = (parentRect.height / 2) - (rectHeight / 2);
                            console.log('y',y,parentRect.height)
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
                            console.log('y',y,parentRect.height)
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
                        console.log('newRect', newRect)

                        var twentyPercent = ((newRect.width / 2) / 100 * 20);

                        console.log('twentyPercent', twentyPercent)
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

                        var videoWidth = screen.videoTrack != null && screen.videoTrack.videoWidth != 0 ? screen.videoTrack.videoWidth : 0
                        var videoHeight = (screen.videoTrack != null && screen.videoTrack.videoHeight != 0 ? screen.videoTrack.videoHeight : 0);


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

                        return  _layoutTool.currentRects;

                        function getControlsAlign() {

                            if(!document.body.contains(wrapElement)) return defaultSide;
                            //var containerRect = container == document.body ? new DOMRect(0, 0, window.innerWidth, window.innerHeight) : container.getBoundingClientRect();
                            var parentHeight = containerRect.height;

                            if(wrapElement.classList.contains('Q_resize_snapped_left') && elementToWrap.top < parentHeight / 2) {
                                return 'topleft';
                            } else if(wrapElement.classList.contains('Q_resize_snapped_left') && elementToWrap.top > parentHeight / 2) {
                                return 'bottomleft';
                            } else if(wrapElement.classList.contains('Q_resize_snapped_right') && elementToWrap.top < parentHeight / 2) {
                                return 'topright';
                            } else if(wrapElement.classList.contains('Q_resize_snapped_right') && elementToWrap.top > parentHeight / 2) {
                                return 'bottomright';
                            } else if(wrapElement.classList.contains('Q_resize_snapped_top')) {
                                return 'top';
                            } else if(wrapElement.classList.contains('Q_resize_snapped_bottom')) {
                                return 'bottom';
                            } else {
                                return 'bottom';
                            }
                        }

                        function maximizeScreen(){
                            var indexToMaximize;

                            for(let s in roomScreens) {
                                if(activeScreen == roomScreens[s]) {
                                    indexToMaximize = s;
                                    break;
                                }
                            }

                            var currentMaximizedIndex;
                            if(_layoutTool.maximizedScreen != null) {
                                for(let s in roomScreens) {
                                    if(_layoutTool.maximizedScreen == roomScreens[s]) {
                                        currentMaximizedIndex = s;
                                        break;
                                    }
                                }
                            }

                            var align = getControlsAlign();

                            if(activeScreenRect != null) {
                                var rectsToTakeInc = _layoutTool.currentRects.filter(function(r, i){
                                    return (r.x == activeScreenRect.x && r.y == activeScreenRect.y
                                    && r.width == activeScreenRect.width && r.height == activeScreenRect.height ? false : true)
                                });
                                var minY = Math.min.apply(Math, rectsToTakeInc.map(function(o) { return o.y; }));
                                var maxY = Math.max.apply(Math, rectsToTakeInc.map(function(o) { return o.y + o.height; }));
                            } else {
                                var minY = Math.min.apply(Math, _layoutTool.currentRects.map(function(o) { return o.y; }));
                                var maxY = Math.max.apply(Math, _layoutTool.currentRects.map(function(o) { return o.y + o.height; }));
                            }


                            var y, baseHeight;
                            if(align == 'bottom' || align == 'bottomleft' || align == 'bottomright' || align == 'bottom-full') {
                                baseHeight = (minY - spaceBetween) - 50;
                            } else if (align == 'top' || align == 'topleft' || align == 'topright' || align == 'top-full') {
                                baseHeight = parentHeight - (maxY + spaceBetween) - 50;
                            }
                            var videoWidth = typeof activeScreen != 'undefined' && activeScreen.videoTrack != null && activeScreen.videoTrack.videoWidth != 0 ? activeScreen.videoTrack.videoWidth : 480;
                            var videoHeight = typeof activeScreen != 'undefined' && activeScreen.videoTrack != null && activeScreen.videoTrack.videoHeight != 0 ? activeScreen.videoTrack.videoHeight : 270;

                            var mainScreenSize = getElementSizeKeepingRatio({
                                width: videoWidth,
                                height: videoHeight
                            }, {width: parentWidth / 100 * 90, height: Math.min(baseHeight - 50, ((parentHeight - (align == 'top' || align == 'bottom' ? elementToWrap.height : spaceBetween)) / 100 * 90) - 50)})
                            mainScreenSize.height = mainScreenSize.height + 50;

                            if(align == 'bottom' || align == 'bottomleft' || align == 'bottomright' || align == 'bottom-full') {
                                if(align == 'bottom') minY = count > 1 ? minY : parentHeight - elementToWrap.height;
                                y = (minY / 2) - mainScreenSize.height / 2;
                            } else if (align == 'top' || align == 'topleft' || align == 'topright' || align == 'top-full') {
                                y = ((parentHeight - maxY) / 2) - (mainScreenSize.height / 2) + maxY;

                            }

                            var maximizedRect = new DOMRect((parentWidth / 2) - mainScreenSize.width / 2, y, mainScreenSize.width, mainScreenSize.height);

                            if(indexToMaximize) {
                                var minimizedRect = _layoutTool.currentRects[indexToMaximize];

                                minimizedRect = new DOMRect(minimizedRect.x, minimizedRect.y, minimizedRect.width, minimizedRect.height);
                                _layoutTool.currentRects[indexToMaximize].x = maximizedRect.x;
                                _layoutTool.currentRects[indexToMaximize].y = maximizedRect.y;
                                _layoutTool.currentRects[indexToMaximize].width = maximizedRect.width;
                                _layoutTool.currentRects[indexToMaximize].height = maximizedRect.height;

                                activeScreenRect = _layoutTool.currentRects[indexToMaximize];
                            }

                            if(!currentMaximizedIndex && indexToMaximize || currentMaximizedIndex == indexToMaximize) {
                                if(_layoutTool.currentRects.length == 3 && roomScreens[1] == activeScreen) {

                                    _layoutTool.currentRects[2].x = minimizedRect.x;
                                    _layoutTool.currentRects[2].y = minimizedRect.y;
                                    _layoutTool.currentRects[2].width = minimizedRect.width;
                                    _layoutTool.currentRects[2].height = minimizedRect.height;
                                }
                            }

                            if(currentMaximizedIndex && currentMaximizedIndex != indexToMaximize) {

                                _layoutTool.currentRects[currentMaximizedIndex].x = minimizedRect.x;
                                _layoutTool.currentRects[currentMaximizedIndex].y = minimizedRect.y;
                                _layoutTool.currentRects[currentMaximizedIndex].width = minimizedRect.width;
                                _layoutTool.currentRects[currentMaximizedIndex].height = minimizedRect.height;
                            } else {
                                _layoutTool.currentRects = fillFreeSpaceWithClosestRects(minimizedRect, _layoutTool.currentRects, (activeScreenRect ? [activeScreenRect] : null))
                            }

                            _layoutTool.maximizedScreen = activeScreen;

                            return _layoutTool.currentRects;
                        }

                        function minimizeScreen(){
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
                            var rectsPerRow =  Math.floor(parentWidth / (rectWidth + spaceBetween));

                            var rectsOnLeftSide, rectsOnRightSide, numOfRowsAlongWrapEl
                            if(wrapElPosition == 'bottom' || wrapElPosition == 'top') {
                                rectsOnLeftSide = Math.floor(elementToWrap.left / (rectWidth + spaceBetween));
                                rectsOnRightSide = Math.floor((parentWidth - (elementToWrap.left + elementToWrap.width)) / (rectWidth + spaceBetween));
                                //numOfRowsAlongWrapEl = Math.floor((elementToWrap.top + spaceBetween) / (rectWidth + spaceBetween));
                                if (wrapElPosition == 'bottom') {
                                    numOfRowsAlongWrapEl = Math.ceil((parentHeight - elementToWrap.top) / (rectHeight + spaceBetween));
                                } else if (wrapElPosition == 'top') {
                                    numOfRowsAlongWrapEl = Math.ceil((elementToWrap.top + elementToWrap.height) / (rectHeight + spaceBetween));
                                }
                            } else if(wrapElPosition == 'bottomleft' || wrapElPosition == 'bottomright') {
                                rectsOnLeftSide = rectsOnRightSide =  Math.floor(rectsPerRow / 2);
                                numOfRowsAlongWrapEl = Math.floor(parentHeight / (rectHeight + spaceBetween));
                            } else if(wrapElPosition == 'topleft' || wrapElPosition == 'topright') {
                                rectsOnLeftSide = rectsOnRightSide = Math.floor(rectsPerRow / 2);
                                numOfRowsAlongWrapEl = Math.floor(parentHeight / (rectHeight + spaceBetween));
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


                            if(numOfRowsAlongWrapEl == 0 && (rectsOnLeftSide != 0 || rectsOnRightSide != 0)) numOfRowsAlongWrapEl = 1;
                            var totalRectsOnSides = (rectsOnLeftSide * numOfRowsAlongWrapEl) + (rectsOnRightSide * numOfRowsAlongWrapEl);
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
                                    if (side == "right") {

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
                                                x = (elementToWrap.left + elementToWrap.width + spaceBetween);
                                            }

                                        }

                                        rightSideCounter++;

                                        if (rightSideCounter == rectsOnRightSide) {
                                            createNewRowOnRight = true;
                                            if (createNewRowOnRight) rightSideCounter = 0;
                                        }
                                        if (rectsOnLeftSide != 0) {
                                            if (rectsOnLeftSide == rectsOnRightSide) {
                                                side = 'left';
                                            } else if (rectsOnLeftSide != rectsOnRightSide) {
                                                if ((!createNewRowOnLeft && !createNewRowOnRight)
                                                    || (createNewRowOnRight && !createNewRowOnLeft)
                                                    || (createNewRowOnLeft && rightSideCounter == 1 && !createNewRowOnRight)) {
                                                    side = 'left';
                                                } else if ((createNewRowOnLeft && createNewRowOnRight) || (createNewRowOnLeft && rightSideCounter > 1 && !createNewRowOnRight)) {
                                                    side = 'right';
                                                }
                                            }

                                        }

                                        var rect = latestRightRect = new DOMRect(x, y, rectWidth, rectHeight);
                                        currentRowRects.push({side: 'right', rect: rect});
                                    } else if (side == "left") {
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
                                                x = (elementToWrap.left - (rectWidth + spaceBetween));
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
                                                } else if ((!createNewRowOnLeft && !createNewRowOnRight) || (createNewRowOnLeft && createNewRowOnRight) || (createNewRowOnLeft && !createNewRowOnRight)) {
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
                                if (minX > elementToWrap.left) minX = elementToWrap.left + spaceBetween;
                                if (maxX < elementToWrap.left) maxX = elementToWrap.left + elementToWrap.width;
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

                                perRow =  Math.floor((parentWidth - elementToWrap.width) / (rectWidth + spaceBetween));
                                if(align == 'bottomleft' || align == 'topleft') {
                                    maxX =  parentWidth - spaceBetween;
                                } else if (align == 'bottomright' || align == 'topright') {
                                    maxX = elementToWrap.left - spaceBetween;
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
                                var rows = {};
                                var left = [];
                                var right = [];
                                var none = [];
                                var i, count = currentRects.length;
                                for(i = 0; i < count; i++) {
                                    var rect = currentRects[i];


                                    if(align == 'bottom' || align == 'top') {
                                        let isTopFullRow = align == 'top' && rect.top > elementToWrap.bottom
                                        let isBottomFullRow = align == 'bottom' && rect.bottom < elementToWrap.top
                                        if(rect.left < elementToWrap.left && !isTopFullRow && !isBottomFullRow) {
                                            if(rows[rect.top + '_l'] == null) rows[rect.top + '_l'] = [];

                                            rows[rect.top + '_l'].push({indx: i, top: rect.top, rect:rect, side:'left'});
                                        } else if (rect.left >= elementToWrap.left && !isTopFullRow && !isBottomFullRow){
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
                                var  rows = sortedRows.all;
                                var availableRects = [];
                                var availableRectsFullRow = [];
                                var availableRectsOnLeft = [];
                                var availableRectsOnRight = [];


                                var minX, maxX, minY, maxY;

                                if(align == 'bottom' || align == 'top') {

                                    minX = Math.min.apply(Math, currentRects.map(function (o) {return o.x;}));
                                    maxX = Math.max.apply(Math, currentRects.map(function (o) {return o.x + o.width;}));

                                    if (minX > elementToWrap.left) minX = elementToWrap.left + spaceBetween;
                                    if (maxX < elementToWrap.left) maxX = elementToWrap.left + elementToWrap.width;


                                } else if(align == 'bottomleft' || align == 'topleft') {
                                    //var perRow =  Math.floor(parentWidth / (rectWidth + spaceBetween));
                                    perRow =  Math.floor((parentWidth - elementToWrap.width) / (rectWidth + spaceBetween));
                                    maxX =  parentWidth - spaceBetween;
                                    minX =  elementToWrap.left + elementToWrap.width + spaceBetween;
                                } else if(align == 'bottomright' || align == 'topright') {
                                    perRow =  Math.floor((parentWidth - elementToWrap.width) / (rectWidth + spaceBetween));
                                    maxX = elementToWrap.left - spaceBetween;
                                    minX = spaceBetween;
                                } else {
                                    perRow =  Math.floor(parentWidth / (rectWidth + spaceBetween));
                                    minX = spaceBetween;
                                    maxX = parentWidth - spaceBetween;
                                }

                                /*var minX = Math.min.apply(Math, currentRects.map(function(o) { return o.x; }));
                                var maxX = Math.max.apply(Math, currentRects.map(function(o) { return o.x+o.width; }));*/
                                var maxWidth = maxX - minX;


                                var i, rowsCount = rows.length;
                                for(i = 0; i < rowsCount; i++) {
                                    var row = rows[i];
                                    var sampleRect = row[0];

                                    if(sampleRect.side == 'left') {

                                        var maxRectsOnLeftSide = Math.floor(elementToWrap.left / (sampleRect.rect.width + spaceBetween));

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

                                        var maxRectsOnRightSide = Math.floor((parentWidth - (elementToWrap.left + elementToWrap.width)) / (row[0].rect.width + spaceBetween));

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

                                            var rowsMinX = elementToWrap.left + elementToWrap.width + spaceBetween;
                                            var rowsMaxX = parentWidth - spaceBetween;

                                            var r, prevRect;
                                            for(r = 0; r < rectsOnRightSide; r++){
                                                var newRect;
                                                if(r == 0) {
                                                    newRect = new DOMRect(elementToWrap.left + elementToWrap.width + spaceBetween, sampleRect.rect.y, rectWidth, rectHeight)
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

                                            var rowsMinX = spaceBetween;
                                            var rowsMaxX = elementToWrap.left - spaceBetween;

                                            var r, prevRect;
                                            for(r = 0; r < rectsOnLeftSide; r++){
                                                var newRect;
                                                if(r == 0) {
                                                    newRect = new DOMRect(elementToWrap.left - sampleRect.rect.width - spaceBetween, sampleRect.rect.y, sampleRect.rect.width, sampleRect.rect.height)
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

                                    var numOfRowsAlongWrapEl, rectsToTheTopOnLeft, rectsToTheTopOnRight;

                                    if(align == 'bottom' || align == 'bottomleft' || align == 'bottomright') {
                                        rectsToTheTopOnLeft = Math.ceil((minLeftY - elementToWrap.top  + spaceBetween) / (rectHeight + spaceBetween));
                                        rectsToTheTopOnRight = Math.ceil((minRightY - elementToWrap.top + spaceBetween) / (rectHeight + spaceBetween));

                                        if(minY < elementToWrap.top) {
                                            numOfRowsAlongWrapEl = 0;
                                            rectsToTheTopOnLeft = 0;
                                            rectsToTheTopOnRight = 0;
                                        }

                                    } else if (align == 'top' || align == 'topleft' || align == 'topright') {
                                        rectsToTheTopOnLeft = Math.ceil(((elementToWrap.top + elementToWrap.height) - (maxLeftY + rectHeight) + spaceBetween) / (rectHeight + spaceBetween));
                                        rectsToTheTopOnRight = Math.ceil(((elementToWrap.top + elementToWrap.height) - (maxRightY + rectHeight) + spaceBetween) / (rectHeight + spaceBetween));

                                        if(minY < elementToWrap.top) {
                                            numOfRowsAlongWrapEl = 0;
                                            rectsToTheTopOnLeft = 0;
                                            rectsToTheTopOnRight = 0;
                                        }
                                    }

                                    var count = numRectsToAdd;
                                    var totalRectsOnLeftSide = (rectsOnLeftSide != 0 ? (rectsOnLeftSide * rectsToTheTopOnLeft) : 0);
                                    var totalRectsOnRightSide = (rectsOnRightSide != 0 ? (rectsOnRightSide * rectsToTheTopOnRight) : 0);
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
                                                    x = (elementToWrap.left + elementToWrap.width + spaceBetween);
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
                                                    x = (elementToWrap.left - (rectWidth + spaceBetween));
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

                                    var allRects = currentRects.concat(newRects).concat(availableRects);
                                    var minX, maxX, rectsNum;
                                    if(align == 'top' || align == 'bottom') {

                                        var minX = Math.min.apply(Math, allRects.map(function(o) { return o.x; }));
                                        var maxX = Math.max.apply(Math, allRects.map(function(o) { return o.x+o.width; }));

                                        if(minX > elementToWrap.left) minX = elementToWrap.left + spaceBetween;
                                        if(maxX < elementToWrap.left) maxX = elementToWrap.left + elementToWrap.width;

                                        rectsNum = Math.ceil((maxX-minX)/(rectWidth + spaceBetween));
                                        rectWidth = ((maxX-minX)-(spaceBetween*(rectsNum-1)))/rectsNum;

                                    } else if (align == 'bottomleft' || align == 'topleft') {
                                        maxX =  parentWidth - spaceBetween;
                                        minX =  elementToWrap.left + spaceBetween;
                                        rectsNum = Math.floor((maxX-minX)/(rectWidth + spaceBetween));

                                    } else if (align == 'bottomright' || align == 'topright') {
                                        maxX = elementToWrap.left - spaceBetween;
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
                                    isRowFull = nextRow[0].top + nextRow[0].height < elementToWrap.top;

                                } else if (align == 'top') {
                                    isRowFull = nextRow[0].top > elementToWrap.top;
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
                            var distance = function (x1,y1,x2,y2) {
                                return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
                            }

                            var align = getControlsAlign();

                            var isRowFull
                            if(align == 'bottom') {
                                isRowFull = rect.top + rect.height < elementToWrap.top;

                            } else if (align == 'top') {
                                isRowFull = rect.top > elementToWrap.top + elementToWrap.height;
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
                                    if (r.top == rect.top && r.left < rect.left && rect.left < elementToWrap.left) {
                                        return true
                                    }
                                    return false;
                                })
                            } else {
                                currentRowRect = rects.filter(function (r) {
                                    if (r.top == rect.top && r.left > rect.left && rect.left > elementToWrap.left) {
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
                    }
            }

            window.layouts = customLayouts;

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
                    console.log(err.stack);
                } catch (e) {

                }
                screen.show();
                /*app.event.dispatch('screenAdded', {
                    screen: screen,
                    participant: screen.participant
                });*/
                if(_controlsTool) _controlsTool.participantsPopup().update(screen.participant);
                updateLayout();

            }

            function removeScreenFromCommonList(screen) {
                log('removeScreenFromCommonList')
                try {
                    var err = (new Error);
                    console.log(err.stack);
                } catch (e) {

                }
                screen.hide();

                /*app.event.dispatch('screenRemoved', {
                    screen: screen,
                    participant: screen.participant
                });*/
                if(_controlsTool) _controlsTool.participantsPopup().update(screen.participant);

                updateLayout();
            }

            function onVideoMute(track, participant) {
                log('mediaStreamTrack mute', track);

                if(track.parentScreen == null || track.kind != 'video') return;

                if(track.mediaStreamTrack.enabled == false || track.mediaStreamTrack.readyState == 'ended'){
                    removeScreenFromCommonList(track.parentScreen);
                    track.parentScreen.removeTimer = null;
                } else {
                    if(track.trackEl != null) {
                        if(track.hideScreenTimer == null) {
                            track.hideScreenTimer = {
                                currentTime: Date.now(),
                                counter: 0,
                            };
                        }

                        var checkOrRemove = function() {
                            if((track.hideScreenTimer.counter == 0 || track.hideScreenTimer.counter == 1) && track.trackEl.currentTime == track.trackEl.currentTime) {
                                track.hideScreenTimer.counter = track.hideScreenTimer.counter + 1;
                                setTimeout(checkOrRemove, 1000);
                            } else if(track.hideScreenTimer.counter >= 2 && track.trackEl.currentTime == track.trackEl.currentTime) {
                                removeScreenFromCommonList(track.parentScreen);
                                track.hideScreenTimer = null;
                            } else {
                                track.hideScreenTimer = null;
                            }
                        }
                        track.parentScreen.removeTimer = setTimeout(checkOrRemove, 1000);
                    }
                }

                //if track is still muted after 3s, hide parent screen
              /*  track.parentScreen.removeTimer = setTimeout(function () {
                    if((track.mediaStreamTrack.muted == true || track.mediaStreamTrack.enabled == false || track.mediaStreamTrack.readyState == 'ended') && hasLiveTracks == false){
                        removeScreenFromCommonList(track.parentScreen);
                        track.parentScreen.removeTimer = null;
                    }
                }, 3000);*/
            }

            function onVideoUnMute(track) {
                log('mediaStreamTrack unmuted 1', track);
                if(track.parentScreen == null || track.kind != 'video') return;
                if(track.parentScreen.removeTimer != null) {
                    clearTimeout(track.parentScreen.removeTimer);
                    track.parentScreen.removeTimer = null;
                } else if (track.parentScreen.removeTimer == null /*&& track.participant.videoTracks(true).length != 0*/) {
                    addScreenToCommonList(track.parentScreen);
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
                    track.trackEl.play().then((e) => {
                        console.log('videoTrackLoaded: trackEl play func success')
                    }).catch((e) => {
                        console.error(e)
                        console.log('videoTrackLoaded: trackEl play func error')

                    });
                }
            }

            function onScreensharingStarting(e) {
                var screenForScreensharing = createRoomScreen(e.participant);
                screenForScreensharing.screensharing = true;
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
                onParticipantConnected:onParticipantConnected,
                onParticipantDisconnected:onParticipantDisconnected,
                getActiveViewMode:getActiveViewMode,
                getActiveSreen:getActiveSreen,
                getScreens:getScreens,
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
                showLoader:showLoader,
                hideLoader:hideLoader
            };
        })()

        function overrideDefaultOptions(options) {
            if(typeof options === 'object') {
                for (var key in options) {
                    if(key == 'mode') continue;
                    _options[key] = options.hasOwnProperty(key) && typeof options[key] !== 'undefined' ? options[key] : _options[key];
                }

                if(!Q.info.isMobile && options.defaultDesktopViewMode != null) {
                    screensRendering.setViewMode(options.defaultDesktopViewMode );
                } else if(Q.info.isMobile && options.defaultMobilevViewMode != null) {
                    screensRendering.setViewMode(options.defaultMobileViewMode);
                }
            }

        }

        function unsetResizeObserver() {
           if(_resizeObserver == null) return;

            _resizeObserver.unobserve(_options.element);
        }

        function setResizeObserver() {
            if(typeof ResizeObserver == 'undefined') return;
            _resizeObserver = new ResizeObserver(entries => {
                console.log('Size changed');
                screensRendering.updateLayout();
                if(WebRTCconference) WebRTCconference.screensInterface.audioVisualization().updateCommonVisualizationWidth();

            });
            console.log('_options.element', _options.element);

            _resizeObserver.observe(_options.element);
        }


        /**
         * Start WebRTC conference room
         * @method start
         * @param {Object} [options] Options, including:
         * @param {Object} [options.element] Parent DOM element where video screens will be rendered
         * @param {String} [options.roomId] Uniq id of room that will be part of Stream name (Streams/webrtc/[roomId])
         * @param {Number} [options.roomPublisherId] Id of publisher of the stream (stream represents room).
         *      Is required as argument for getting Stream from db
         * @param {String} [options.mode] Technology that is used to start conference ('twilio' OR 'node')
         */
        function start(options) {

            Q.addStylesheet('{{Streams}}/css/tools/webrtc.css?ts=' + performance.now(), function () {

                createInfoSnippet()
                //showPageLoader();
                log('Start WebRTC conference room');

                var preparingRoom = ((_options.preparing.video || _options.preparing.audio) || (!_options.startWith.video && !_options.startWith.audio));

                connectionState.show(preparingRoom ? "Checking room's state" : 'Connecting...');

                _debugTimer.loadStart = performance.now();

                _options.startTime = Date.now();

                appDebug.sendReportsInterbal = setInterval(function () {
                    appDebug.sendReportToServer();
                }, 3000);
                overrideDefaultOptions(options);
                setResizeObserver();
                Q.Text.get("Streams/content", function (err, result) {
                    log('start: translation loaded');

                    _textes = result;

                    if(appDebug.isiOSwebView()) {
                        return Q.alert(_textes.webrtc.notices.openInBrowserAlert != null ? _textes.webrtc.notices.openInBrowserAlert : 'Open link in Safari browser to join the conference.' );
                    }

                    onConnect();
                })

                function onConnect() {
                    log('start: load time ' + (performance.now() - _debugTimer.loadStart));
                    log('start: onConnect');

                    var ua = navigator.userAgent;
                    var startWith = _options.startWith || {};
                    //var preparingRoom = false;

                    log('start: onConnect', preparingRoom, _options.preparing.video, _options.preparing.audio);


                    if (Q.info.isCordova && Q.info.isAndroid()) {
                        log('start: onConnect: isCordova && isAndroid');

                        var showInstructions = function(kind) {
                            var instructionsPermissionDialog = document.createElement('DIV');
                            instructionsPermissionDialog.className = 'Streams_webrtc_devices_dialog_inner';
                            var dialogList = document.createElement('OL');
                            dialogList.className = 'Streams_webrtc_instructions_dialog';
                            dialogList.innerHTML = `<div>` + _textes.webrtc.androidInstructionsDialog.permissionDenied.interpolate({kind: kind}) + `</div>
									<li>` + Q.getObject("webrtc.androidInstructionsDialog.point1", _textes) + `</li>
									<li>` + Q.getObject("webrtc.androidInstructionsDialog.point2", _textes) + `</li>
									<li>` + _textes.webrtc.androidInstructionsDialog.point3.interpolate({communityId: Q.Users.communityId}) + `</li>
									<li>` + Q.getObject("webrtc.androidInstructionsDialog.point4", _textes) + `</li>
									<li>` + _textes.webrtc.androidInstructionsDialog.point5.interpolate({kind: kind}) + `</li>`;
                            instructionsPermissionDialog.appendChild(dialogList);
                            Q.Dialogs.push({
                                title: Q.getObject("webrtc.androidInstructionsDialog.dialogTitle", _textes),
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

                        if(startWith.audio && startWith.video) {
                            requestMicPermission(function () {
                                requestCameraPermission(function () {
                                    publishMediaTracks({video: startWith.video, audio: startWith.audio});
                                });
                            });
                        } else if (startWith.audio) {
                            requestMicPermission(function () {
                                publishMediaTracks({video: startWith.video, audio: startWith.audio});
                            });
                        } else if (startWith.video) {
                            requestCameraPermission(function () {
                                publishMediaTracks({video: startWith.video, audio: startWith.audio});
                            });
                        }

                    } else if(Q.info.isCordova && Q.info.platform === 'ios' && !_options.useCordovaPlugins){
                        log('start: onConnect: isCordova && isiOS');
                        //publishMediaTracks({video: startWith.video, audio: startWith.audio});
                        showPreparingDialogue(function () {
                            createOrJoinRoomStream(roomId, _options.roomPublisherId);
                        }, function () {
                            connectionState.updateStatus('Disconnected');
                            setTimeout(function() {
                                connectionState.hide();
                            }, 3000);
                            unsetResizeObserver();
                        });
                    } else if(Q.info.isCordova && Q.info.platform === 'ios' && _options.useCordovaPlugins){
                        log('start: onConnect: isCordova && isiOS');
                        publishMediaTracks({video: startWith.video, audio: startWith.audio});
                    } else if(!((Q.info.isMobile || Q.info.isTablet) && !Q.info.isCordova)) {
                        log('start: onConnect: isDesktop');
                    }



                    if((typeof window.RTCPeerConnection == 'undefined' && typeof window.mozRTCPeerConnection == 'undefined' && typeof  window.webkitRTCPeerConnection == 'undefined')) {
                        Q.alert('Unfortunatelly your browser doesn\'t support WebRTC')
                    }

                    if(_options.leaveOtherActiveRooms) {
                        log('start: onConnect: leave existing rooms');
                        if(Q.Streams.WebRTCRooms != null && Q.Streams.WebRTCRooms.length != 0) {
                            for(var r in Q.Streams.WebRTCRooms) {
                                Q.Streams.WebRTCRooms[r].stop();
                            }
                        }
                    }

                    var roomId = _options.roomId != null ? _options.roomId : null;
                    if(_options.roomPublisherId == null) _options.roomPublisherId = Q.Users.loggedInUser.id;

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


                        /*var dashboard = document.getElementById('dashboard_slot');
                        if(dashboard && Q.info.isMobile && !Q.info.isTablet) {
                            var dashboardPos = dashboard.classList.contains('Q_fixed_top') ? 'top' : 'bottom';
                            roomsMedia.style.height = 'calc(100% - ' + dashboard.offsetHeight + 'px)';
                            if(dashboardPos == 'top') {
                                roomsMedia.style.top = dashboard.offsetHeight + 'px';
                            } else if (dashboardPos == 'bottom') {
                                roomsMedia.style.bottom = dashboard.offsetHeight + 'px';
                            }

                        }*/
                    }


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
                            window.layoutTool = _layoutTool;
                            _layoutTool.currentRects = [];
                            _layoutTool.basicGridRects = [];
                        }
                    );


                    var createOrJoinRoomStream = function (roomId, asPublisherId) {
                        log('createRoomStream')

                        Q.req("Streams/webrtc", ["room"], function (err, response) {
                            var msg = Q.firstErrorMessage(err, response && response.errors);

                            if (msg) {
                                return Q.alert(msg);
                            }
                            log('createRoomStream: joined/connected');

                            roomId = (response.slots.room.roomId).replace('Streams/webrtc/', '');
                            var turnCredentials = response.slots.room.turnCredentials;
                            var socketServer = response.slots.room.socketServer;
                            _debug = response.slots.room.debug;

                            overrideDefaultOptions(response.slots.room.options);

                            //var connectUrl = updateQueryStringParameter(location.href, 'Q.rid', roomId);
                            //connectUrl = updateQueryStringParameter(connectUrl, 'Q.pid', asPublisherId);
                            Q.Streams.get(asPublisherId, 'Streams/webrtc/' + roomId, function (err, stream) {
                                log('createRoomStream: joined/connected: pull stream');

                                _roomStream = stream;
                                if(Q.Streams.WebRTCRooms == null){
                                    Q.Streams.WebRTCRooms = [];
                                }

                                Q.Streams.WebRTCRooms.push(webRTCInstance);

                                _options.conferenceStartedTime = stream.getAttribute('startTime');
                                _options.hosts = response.slots.room.hosts;
                                log('start: createOrJoinRoomStream: mode ' + _options.mode)
                                bindStreamsEvents(stream);
                                if(_options.mode === 'twilio') {
                                    startTwilioRoom(roomId, response.slots.room.accessToken);
                                } else {
                                    initWithNodeServer(socketServer, turnCredentials);
                                }

                                //window.addEventListener('beforeunload', webRTCInstance.stop);

                            });

                        }, {
                            method: 'post',
                            fields: {
                                roomId: roomId,
                                publisherId: asPublisherId,
                                adapter: _options.mode,
                                resumeClosed: _options.resumeClosed,
                                writeLevel: _options.writeLevel
                            }
                        });
                    }



                    if(roomId == null && _options.roomPublisherId == null) return;

                    if((Q.info.isMobile || Q.info.isTablet)) {
                        log('start: onConnect: connect from mobile/tablet browser');

                        if(preparingRoom) {
                            showPreparingDialogue(function () {
                                createOrJoinRoomStream(roomId, _options.roomPublisherId);
                            }, function () {
                                connectionState.updateStatus('Disconnected');
                                setTimeout(function() {
                                    connectionState.hide();
                                }, 3000);
                                unsetResizeObserver();
                            });
                        } else {
                            var permissionPopupTimeout;
                            var premissionGrantedCallback = function () {
                                if(permissionPopupTimeout != null) clearTimeout(permissionPopupTimeout);
                                createOrJoinRoomStream(roomId, _options.roomPublisherId);
                            };
                            publishMediaTracks({video: startWith.video, audio: true}, premissionGrantedCallback);

                            /*permissionPopupTimeout = setTimeout(function () {
                                if(_options.streams != null) return;
                                showPermissionsDialogue({video: startWith.video, audio: true}, premissionGrantedCallback);
                            }, _options.mediaDevicesDialog.timeout != null ? _options.mediaDevicesDialog.timeout : 2000);*/
                        }

                    } else {

                        log('start: onConnect: regular connect (desktop)');


                        if(preparingRoom) {
                            showPreparingDialogue(function () {
                                createOrJoinRoomStream(roomId, _options.roomPublisherId);
                            }, function () {
                                unsetResizeObserver();
                                connectionState.updateStatus('Disconnected')
                            });
                        } else {
                            publishMediaTracks({video: startWith.video, audio: startWith.audio});
                            if(_options.mediaDevicesDialog != null && (startWith.audio || startWith.video)) {
                                setTimeout(function () {
                                    if(_options.streams != null) return;
                                    showPermissionsDialogue({video: startWith.video, audio: startWith.audio});
                                }, _options.mediaDevicesDialog.timeout != null ? _options.mediaDevicesDialog.timeout : 2000);

                            }
                            createOrJoinRoomStream(roomId, _options.roomPublisherId);
                        }


                    }

                }
            });

        }

        function switchTo(publisherId, streamName, callback, options) {
            //showPageLoader();
            log('switch WebRTC conference room', publisherId, streamName);
            log('switch WebRTCconference', WebRTCconference);
            if(notice) connectionState.updateStatus(Q.getObject("webrtc.notices.switchingRoom", _textes));

                log('createRoomStream')
                var roomIdToJoin = streamName.replace('Streams/webrtc/', '');

                Q.req("Streams/webrtc", ["room"], function (err, response) {
                    var msg = Q.firstErrorMessage(err, response && response.errors);

                    if (msg) {
                        return Q.alert(msg);
                    }
                    log('createRoomStream: joined/connected');

                    var turnCredentials = response.slots.room.turnCredentials;
                    var socketServer = response.slots.room.socketServer;

                    Q.Streams.get(publisherId, 'Streams/webrtc/' + roomIdToJoin, function (err, stream) {
                        log('createRoomStream: joined/connected: pull stream', stream);
                        console.log('createRoomStream: joined/connected: roomScreens.length', screensRendering.getScreens().length);

                        _roomStream = stream;
                        if(Q.Streams.WebRTCRooms == null){
                            Q.Streams.WebRTCRooms = [];
                        }

                        _options.conferenceStartedTime = stream.getAttribute('startTime');
                        log('switchTo: createOrJoinRoomStream: mode ' + _options.mode)
                        log('switchTo: createOrJoinRoomStream: WebRTCconference', WebRTCconference)
                        bindStreamsEvents(_roomStream);
                        WebRTCconference.switchTo(publisherId, roomIdToJoin, function (newInstance) {
                            bindConferenceEvents(newInstance);
                            let prevRoom = WebRTCconference;
                            console.log('createRoomStream: joined/connected: roomScreens.length0', screensRendering.getScreens().length);
                            console.log('createRoomStream: joined/connected:  newInstance.event',  newInstance.event);

                            newInstance.event.on('initNegotiationEnded', function () {
                                console.log('createRoomStream: joined/connected: roomScreens.length1', screensRendering.getScreens().length);
                                log('switchTo: createOrJoinRoomStream: newInstance', newInstance)
                                WebRTCconference = newInstance;
                                // prevRoom.disconnect(true);

                                updateParticipantData();
                                _controlsTool.state.webRTClibraryInstance = WebRTCconference;
                                _controlsTool.refresh();

                                screensRendering.updateLayout();
                                if(callback) callback();
                                log('createRoomStream: joined/connected: roomScreens.length2', screensRendering.getScreens().length);

                            });
                        });
                        //initWithNodeServer(socketServer, turnCredentials);
                    });

                }, {
                    method: 'post',
                    fields: {
                        roomId: roomIdToJoin,
                        publisherId: publisherId,
                        adapter: _options.mode,
                        resumeClosed: options && options.resumeClosed != null ? options.resumeClosed : _options.resumeClosed
                    }
                });




        }

        /**
         * Stops WebRTC conference room (closes all peer2peer connections,
         * clears all timeouts, removes tools)
         * @method stop
         * @param {function} callback executed when all actions done.
         */
        function stop(callback) {
            log('WebRTC.stop', WebRTCconference);

            if (_roomStream == null) {
                return Q.handle(callback);
            }

            if(WebRTCconference && WebRTCconference.localParticipant() != null) WebRTCconference.localParticipant().online = false;

            /*if(WebRTCconference.roomParticipants().length === 0) {

				Q.req("Streams/webrtc", ["endRoom"], function (err, response) {
					log('stop: room closed');

					var msg = Q.firstErrorMessage(err, response && response.errors);

					if (msg) {
						console.error(msg);
						return Q.alert(msg);
					}

					Q.handle(callback);
				}, {
					method: 'put',
					fields: {
						roomId:  _options.roomId,
						publisherId: _options.roomPublisherId,
						adapter: _options.mode
					}
				});

			}*/
            if(appDebug.sendReportsInterbal != null) {
                appDebug.sendReportToServer();
                clearTimeout(appDebug.sendReportsInterbal);
            }
            _roomStream.leave();
            WebRTCconference.disconnect();
            _options.streams = null;
            if(_roomsMedia.parentNode != null) _roomsMedia.parentNode.removeChild(_roomsMedia);
            if(_controls != null) {
                var controlsTool = Q.Tool.from(_controls, "Streams/webrtc/controls");
                controlsTool.participantsPopup().disableLoudesScreenMode();
                controlsTool.participantsPopup().disableCheckActiveMediaTracks();
                if(_controls.parentNode != null) _controls.parentNode.removeChild(_controls);
                Q.Tool.remove(controlsTool);
            }

            _layoutTool.clearCustomGenerators();
            Q.Tool.remove(_layoutTool);
            window.removeEventListener('beforeunload', webRTCInstance.stop);
            unsetResizeObserver();
            WebRTCconference = null;
            Q.handle(_options.onWebRTCRoomEnded, webRTCInstance);

            Q.Page.onActivate('').remove('Streams.WebRTC');

            var currentRoom = Q.Streams.WebRTCRooms.indexOf(webRTCInstance);
            if(currentRoom != -1) {
                Q.Streams.WebRTCRooms.splice(currentRoom, 1);
            }
        }

        function currentConferenceLibInstance() {
            return WebRTCconference;
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

        var webRTCInstance = {
            start: start,
            stop: stop,
            switchTo: switchTo,
            screenRendering: screensRendering,
            currentConferenceLibInstance: currentConferenceLibInstance,
            controls: function () {
                return _controlsTool;
            },
            roomsMediaContainer: function () {
                return _roomsMedia;
            },
            roomStream: function () {
                return _roomStream;
            },
            options: function () {
                return _options;
            },
            textes: function () {
                return _textes;
            },
            loader: connectionState,
            notice: notice
        };

        return webRTCInstance;
    };

    /**
     * Start live stream conference related to some stream.
     * @method WebRTC.start
     * @param {Object} options options for the method
     * @param {String} options.publisherId Required. Publisher of stream to which webrtc will be related.
     * @param {String} options.streamName Required. Name of stream to which webrtc will be related.
     * @param {String} [options.relationType='Streams/webrtc']
     * @param {HTMLElement} [options.element=document.body] Parent DOM element where video screens will be rendered
     * @param {String} [options.mode='node'] Technology that is used to start conference ('twillio' OR 'node')
     * @param {String} [options.tool=true] Tool to relate Q.events to. By default true used - which means page.
     * @param {String} [options.useExisting=true] If false, don't request related stream to use, but create new.
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
            useExisting: true,
            resumeClosed: true
        }, options);

        var userId = Q.Users.loggedInUserId();

        function _createStream () {
            Q.req("Streams/webrtc", ["room"], function (err, response) {
                var msg = Q.firstErrorMessage(err, response && response.errors);
                if (msg) {
                    return Q.alert(msg);
                }

                Q.Streams.get(userId, response.slots.room.roomId, function (err) {
                    var fem = Q.firstErrorMessage(err);
                    if (fem) {
                        return console.warn("Streams.webrtc.start.create: " + fem);
                    }

                    _createRoom(this);
                });
            }, {
                method: 'post',
                fields: {
                    publisherId: userId,
                    resumeClosed: options.resumeClosed,
                    content: options.content || null,
                    adapter: options.mode,
                    writeLevel: options.writeLevel,
                    closeManually: options.closeManually,
                    relate: {
                        publisherId: options.publisherId,
                        streamName: options.streamName,
                        relationType: options.relationType
                    }
                }
            });
        }

        function _createRoom(stream) {
            // connect to this particular conversation
            Q.Streams.WebRTC().start({
                element: options.element,
                roomId: stream.fields.name,
                roomPublisherId: stream.fields.publisherId,
                mode: options.mode,
                defaultDesktopViewMode: options.defaultDesktopViewMode,
                defaultMobileViewMode: options.defaultDesktopViewMode,
                writeLevel: options.writeLevel,
                onWebrtcControlsCreated: function () {
                    //TODO: for some reason this.Q.beforeRemove doesn't call when user leave conference
                    // may be tool doesn't close at all?

                    Q.handle(options.onWebrtcControlsCreated, this, [stream]);

                    this.Q.beforeRemove.set(function () {
                        Q.handle(options.onEnd, this, [stream]);
                    }, this);

                    // this is duplicate to above approach
                    Q.Streams.Stream.onMessage(stream.fields.publisherId, stream.fields.name, 'Streams/leave').set(function(stream, message) {
                        if (message.byUserId !== userId) {
                            return;
                        }

                        Q.handle(options.onEnd, this, [stream]);
                    }, options.tool);
                },
                onWebRTCRoomCreated: function () {
                    Q.handle(options.onStart, this, [stream]);
                },
                onWebRTCRoomEnded: function () {
                    Q.handle(options.onEnd, this, [stream]);
                }
            });
        }

        if (!options.useExisting) {
            return _createStream();
        }

        Streams.related.force(options.publisherId,  options.streamName,  'Streams/webrtc',  true, {limit: 1, stream: true} , function (err) {
            if (err) {
                return;
            }

            // get first property from relatedStreams (actually it should be only one)
            var stream = Q.first(this.relatedStreams);

            if (stream && !stream.getAttribute('endTime')) {
                if (!stream.testWriteLevel('join')) {
                    return Q.alert(_texts.webrtc.notAllowedToJoinCall);
                }

                _createRoom(stream);
            } else {
                _createStream();
            }
        });
    }
})(Q, jQuery);