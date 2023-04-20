(function ($, window, undefined) {

    var ua = navigator.userAgent;
    var _isiOS = false;
    var _isAndroid = false;
    var _isiOSCordova = false;
    var _isAndroidCordova = false;
    if (ua.indexOf('iPad') != -1 || ua.indexOf('iPhone') != -1 || ua.indexOf('iPod') != -1) _isiOS = true;
    if (ua.indexOf('Android') != -1) _isAndroid = true;
    if (typeof cordova != 'undefined' && _isiOS) _isiOSCordova = true;
    if (typeof cordova != 'undefined' && _isAndroid) _isAndroidCordova = true;

    function log() { }
    if (Q.Streams.WebRTCdebugger) {
        log = Q.Streams.WebRTCdebugger.createLogMethod('waitingRoomList.js')
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
    Q.Tool.define("Streams/webrtc/waitingRoomList", function (options) {
        var tool = this;
        tool.waitingRoomsListEl = null;
        tool.waitingRoomsList = [];
        tool.relatedStreams = [];
        tool.trackedStreams = [];

        tool.webrtcUserInterface = options.webrtcUserInterface();
        tool.webrtcRoomStream = tool.webrtcUserInterface.roomStream();
        tool.webrtcSignalingLib = tool.webrtcUserInterface.getWebrtcSignalingLib();

        tool.loadStyles().then(function () {
            tool.createList();
            tool.declareEventsHandlers();
        });

    },

        {
            onRefresh: new Q.Event(),
            controlsTool: null,
            webrtcUserInterface: null,
            hostSocketId: null
        },

        {
            loadStyles: function () {
                return new Promise(function (resolve, reject) {
                    Q.addStylesheet('{{Streams}}/css/tools/waitingRoomList.css?ts=' + Date.now(), function () {
                        resolve();
                    });
                });
            },
            refresh: function () {
                var tool = this;

            },
            declareEventsHandlers: function () {
                var tool = this;

            },
            /**
             * Create participants popup that appears while pointer hovers users button on desktop/in modal box on mobile
             * @method participantsPopup
             */
            createList: function () {
                var tool = this;

                var tool = this;
                var socketConns = Q.Users.Socket.get();
                if (!socketConns || Object.keys(socketConns).length == 0 || socketConns[Object.keys(socketConns)[0]] == null || !socketConns[Object.keys(socketConns)[0]].socket.id) {
                    console.log('createList no socket', socketConns)

                    Q.Socket.onConnect('Users').add(function () {
                        console.log('onSession: no socket connection yet');
                        tool.createList()
                    })
                    return;
                }

                if (Object.keys(socketConns).length == 0) {
                    Q.alert('To continue you should be connected to the socket server.');
                    return;
                }

                tool.state.hostSocketId = socketConns[Object.keys(socketConns)[0]].socket.id;

                tool.waitingRoomsListEl = document.createElement('UL');
                tool.waitingRoomsListEl.className = 'Streams_webrtc_participants-waiting-list';
                tool.element.appendChild(tool.waitingRoomsListEl);

                Q.activate(
                    Q.Tool.setUpElement('div', 'Streams/related', {
                        publisherId: tool.webrtcRoomStream.fields.publisherId,
                        streamName: tool.webrtcRoomStream.fields.name,
                        relationType: 'Streams/webrtc/waitingRoom',
                        tag: 'div',
                        isCategory: true,
                        creatable: false,
                        realtime: true,
                        onUpdate: function (e) {
                            console.log('onUpdate', e, this)
                            tool.relatedStreams = e.relatedStreams;
                            tool.reloadWaitingRoomsList();
                            if (!tool.roomsListLoaded) {
                                tool.roomsListLoaded = true;
                                tool.onRoomsListFirstLoadHandler()
                            }
                        }
                    }),
                    {},
                    function () {

                    }
                );
            },
            onRoomsListFirstLoadHandler: function () {
                var tool = this;
                //check whether some waiting rooms are already inactive and close them
                for (let i in tool.waitingRoomsList) {
                    let roomDataObject = tool.waitingRoomsList[i];
                    console.log('onRoomsListFirstLoadHandler: closeIfOffline', roomDataObject.webrtcStream.fields.publisherId, roomDataObject.webrtcStream.fields.name, roomDataObject.webrtcStream.getAttribute('socketId'));

                    Q.req("Streams/webrtc", ["closeIfOffline"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);

                        if (msg) {
                            return Q.alert(msg);
                        }

                    }, {
                        method: 'post',
                        fields: {
                            publisherId: roomDataObject.webrtcStream.fields.publisherId,
                            streamName: roomDataObject.webrtcStream.fields.name,
                            socketId: roomDataObject.webrtcStream.getAttribute('socketId'),
                            hostSocketId: tool.state.hostSocketId
                        }
                    });
                }
            },
            handleStreamEvents: function (stream, roomDataObject) {
                var tool = this;
                var streamAlreadyTracked = false;
                for (let i in tool.trackedStreams) {
                    if(tool.trackedStreams[i].fields.name == stream.fields.name) {
                        streamAlreadyTracked = true;
                        break;
                    }
                }
                if(streamAlreadyTracked) {
                    return;
                }
                stream.onMessage('Streams/webrtc/admit').set(function (stream, message) {
                    console.log('Streams/changed0', stream.getAttribute('status'));
                    roomDataObject.webrtcStream = stream;
                    tool.relatedStreams[`${stream.fields.publisherId}\t${stream.fields.name}`] = stream;
                    tool.reloadWaitingRoomsList();
                });
                stream.onMessage('Streams/changed').set(function (stream, message) {
                    console.log('Streams/changed1', stream.getAttribute('status'));
                    roomDataObject.webrtcStream = stream;
                    tool.relatedStreams[`${stream.fields.publisherId}\t${stream.fields.name}`] = stream;
                    tool.reloadWaitingRoomsList();
                });
                tool.trackedStreams.push(stream);
            },
            reloadWaitingRoomsList: function () {
                var tool = this;
                var relatedStreams = tool.relatedStreams;
                console.log('reloadRoomsList: relatedStreams', relatedStreams);
                for (let s in relatedStreams) {
                    let stream = relatedStreams[s];
                    let roomExists;
                    for (let c in tool.waitingRoomsList) {
                        console.log('reloadRoomsList: for', stream.fields.name, tool.waitingRoomsList[c].webrtcStream.fields.name);
                        if (stream.fields.name == tool.waitingRoomsList[c].webrtcStream.fields.name) {
                            roomExists = tool.waitingRoomsList[c];
                            break;
                        }
                    }
                    console.log('reloadRoomsList: roomExists', roomExists);

                    var status = stream.getAttribute('status');
                    console.log('reloadRoomsList: status', status);

                    if(roomExists != null) {
                        continue;
                    }

                    let roomDataObject = {
                        title: stream.fields.title,
                        topic: stream.fields.content,
                        webrtcStream: stream,
                        statusInfo: {
                            status: status ? status : 'waiting'
                        }
                    }
                    //stream.subscribe()
                    //stream.observe()
                    tool.handleStreamEvents(stream, roomDataObject);
                    
                    createRoomItemElement(roomDataObject);

                    console.log('reloadRoomsList: roomDataObject', roomDataObject);
                    tool.waitingRoomsList.unshift(roomDataObject);

                    tool.waitingRoomsList.sort(function (x, y) {
                        return y.timestamp - x.timestamp;
                    })

                    //tool.handleStreamEvents(stream, roomDataObject);
                }

                for (let c in tool.waitingRoomsList) {
                    tool.waitingRoomsListEl.appendChild(tool.waitingRoomsList[c].roomElement);
                }

                console.log('reloadRoomsList: roomsList', tool.waitingRoomsList.length)
                for (let i = tool.waitingRoomsList.length - 1; i >= 0; i--) {
                    console.log('reloadRoomsList: roomsList for', i)

                    let roomIsClosed = true;
                    for (let n in relatedStreams) {
                        let status = tool.waitingRoomsList[i].webrtcStream.getAttribute('status');
                        console.log('reloadRoomsList: roomsList for status', status, tool.waitingRoomsList[i].webrtcStream)

                        if (relatedStreams[n].fields.name == tool.waitingRoomsList[i].webrtcStream.fields.name && status == 'waiting') {
                            roomIsClosed = false;
                        }
                    }
                    if (roomIsClosed) {
                        console.log('reloadRoomsList: roomsList for remove', i)
                        if (tool.waitingRoomsList[i].roomElement && tool.waitingRoomsList[i].roomElement.parentElement != null) {
                            tool.waitingRoomsList[i].roomElement.parentElement.removeChild(tool.waitingRoomsList[i].roomElement);
                        }
                        tool.waitingRoomsList.splice(i, 1);
                    }
                }

                function createRoomItemElement(roomDataObject) {
                    var roomItemCon = document.createElement('LI');
                    roomItemCon.className = 'webrtc-waiting-item';
                    roomDataObject.roomElement = roomItemCon;

                    let roomItemAvatar = document.createElement('DIV');
                    roomItemAvatar.className = 'webrtc-waiting-item-avatar-con';
                    roomItemCon.appendChild(roomItemAvatar);

                    let roomItemAvatarTool = document.createElement('DIV');
                    roomItemAvatarTool.className = 'webrtc-waiting-item-avatar-tool';
                    roomItemAvatar.appendChild(roomItemAvatarTool);

                    Q.activate(
                        Q.Tool.setUpElement(
                            roomItemAvatarTool, // or pass an existing element
                            "Users/avatar",
                            {
                                userId: roomDataObject.webrtcStream.fields.publisherId,
                                contents: false
                            }
                        )
                    );


                    let roomItemAvatarText = document.createElement('DIV');
                    roomItemAvatarText.className = 'webrtc-waiting-item-avatar-texttool';

                    roomItemAvatar.appendChild(roomItemAvatarText);
                    Q.activate(
                        Q.Tool.setUpElement(
                            roomItemAvatarText, // or pass an existing element
                            "Users/avatar",
                            {
                                userId: roomDataObject.webrtcStream.fields.publisherId,
                                icon: false
                            }
                        )
                    );

                    let roomItemButtons = document.createElement('DIV');
                    roomItemButtons.className = 'webrtc-waiting-item-buttons';
                    roomItemCon.appendChild(roomItemButtons);
                    let roomItemButtonsAdmit = document.createElement('BUTTON');
                    roomItemButtonsAdmit.className = 'webrtc-waiting-button webrtc-waiting-item-buttons-admit';
                    roomItemButtonsAdmit.innerHTML = 'Admit';
                    roomItemButtons.appendChild(roomItemButtonsAdmit);
                    let roomItemButtonsRemove = document.createElement('BUTTON');
                    roomItemButtonsRemove.className = 'webrtc-waiting-button webrtc-waiting-item-buttons-remove';
                    roomItemButtonsRemove.innerHTML = 'Remove';
                    roomItemButtons.appendChild(roomItemButtonsRemove);

                    roomItemButtonsAdmit.addEventListener('click', function () {
                        tool.onAdmitHandler(roomDataObject);
                    })

                    roomItemButtonsRemove.addEventListener('click', function () {
                        tool.onRemoveHandler(roomDataObject);
                    })

                }
            },
            onAdmitHandler: function (roomDataObject) {
                var tool = this;
                Q.req("Streams/webrtc", ["admitUserToRoom"], function (err, response) {
                    var msg = Q.firstErrorMessage(err, response && response.errors);

                    if (msg) {
                        return Q.alert(msg);
                    }
                    roomDataObject.statusInfo.status = 'accepted';
                }, {
                    method: 'post',
                    fields: {
                        publisherId: tool.webrtcRoomStream.fields.publisherId,
                        streamName: tool.webrtcRoomStream.fields.name,
                        waitingRoomStreamName: roomDataObject.webrtcStream.fields.name,
                        userIdToAdmit: roomDataObject.webrtcStream.fields.publisherId
                    }
                });
            },
            onRemoveHandler: function (roomDataObject) {
                var tool = this;
                Q.req("Streams/webrtc", ["closeWaitingRoom"], function (err, response) {
                    var msg = Q.firstErrorMessage(err, response && response.errors);

                    if (msg) {
                        return Q.alert(msg);
                    }
                    roomDataObject.statusInfo.status = 'closed';
                }, {
                    method: 'post',
                    fields: {
                        publisherId: tool.webrtcRoomStream.fields.publisherId,
                        streamName: tool.webrtcRoomStream.fields.name,
                        waitingRoomStreamName: roomDataObject.webrtcStream.fields.name,
                        waitingRoomUserId: roomDataObject.webrtcStream.fields.publisherId
                    }
                });
            }
        }
    );

})(window.jQuery, window);