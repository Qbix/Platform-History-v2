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

    /**
     * Streams/webrtc/callCenter/client tool.
     * 
     * @module Streams
     * @constructor
     * @param {Object} options
     */
    Q.Tool.define("Streams/webrtc/callCenter/client", function (options) {
        var tool = this;
        
        tool.myWaitingRoomStream = null;
        tool.currentActiveWebRTCRoom = null;
    },

        {
            publisherId: null,
            streamName: null,
            onRefresh: new Q.Event()
        },

        {
            refresh: function () {
                var tool = this;
            },
            declareStreamEventHandlers: function() {
                var tool = this;
                tool.myWaitingRoomStream.onMessage("Streams/webrtc/accepted").set(function (stream, message) {
                    tool.onAcceptedHandler(message);
                }, tool);
                tool.myWaitingRoomStream.onMessage("Streams/webrtc/callEnded").set(function (stream, message) {
                    tool.onCallEndedHandler(message);
                }, tool);
                tool.myWaitingRoomStream.onMessage("Streams/webrtc/callDeclined").set(function (stream, message) {
                    tool.onCallEndedHandler(message);
                }, tool);

            },
            getCallCenterEndpointStream: function () {
                var tool = this;
                return new Promise(function (resolve, reject) {
                    Q.Streams.get(tool.state.publisherId, tool.state.streamName, function (err, stream) {
                        if (!stream) {
                            console.error('Error while getting call center stream');
                            reject('Error while getting call center stream');
                            return;
                        }

                        resolve(stream);
                    });
                });
            },
            requestCall: function () {
                var tool = this;
                var socketConns = Q.Users.Socket.get();
                if(!socketConns || Object.keys(socketConns).length == 0 || socketConns[Object.keys(socketConns)[0]] == null || !socketConns[Object.keys(socketConns)[0]].socket.id) {
                    Q.Socket.onConnect('Users').add(function() {
                        console.log('onSession: no socket connection yet');
                        tool.requestCall();
                    })
                    return;   
                }
                //console.log('Object.keys(socketConns)', Object.keys(socketConns).length, Object.keys(socketConns)[0])
                if(Object.keys(socketConns).length == 0) {
                    Q.alert('To continue you should be connected to the socket server.');
                    return;
                }                
                
                Q.prompt(null, function(topic) {

                    Q.req("Streams/callCenter", ["room"], function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);

                        if (msg) {
                            return Q.alert(msg);
                        }
                        console.log('requestCall: created waiting room', response.slots.room);

                        Q.Streams.get(response.slots.room.stream.fields.publisherId, response.slots.room.stream.fields.name, function (err, stream) {
                            console.log('requestCall: created waiting room: stream', stream);

                            tool.myWaitingRoomStream = stream;
                            tool.declareStreamEventHandlers();
                
                        });

                    }, {
                        method: 'post',
                        fields: {
                            publisherId: Q.Users.loggedInUserId(),
                            description: topic,
                            socketId: socketConns[Object.keys(socketConns)[0]].socket.id,
                            relate: {
                                publisherId: tool.state.publisherId,
                                streamName: tool.state.streamName,
                                relationType: 'Streams/webrtc/callCenter/call'
                            }
                        }
                    });


                    /*tool.currentActiveWebRTCRoom = Q.Streams.WebRTC({
                        roomPublisherId: Q.Users.loggedInUserId(),
                        element: document.body,
                        relate: {
                            publisherId: tool.state.publisherId,
                            streamName: tool.state.streamName,
                            relationType: 'Streams/webrtc/callCenter/call'
                        },
                        startWith: { video: false, audio: true },
                        onWebRTCRoomCreated: function () {
                            tool.myWaitingRoomStream = tool.currentActiveWebRTCRoom.roomStream();
                            tool.myWaitingRoomStream.pendingFields.content = topic;
                            tool.myWaitingRoomStream.save();
                            tool.declareStreamEventHandlers();
                        }
                    });

                    tool.currentActiveWebRTCRoom.start();*/
                }, {
                    title: 'What is this call about'
                })
                
            },
            onAcceptedHandler: function () {
                var tool = this;
                if(tool.currentActiveWebRTCRoom && tool.currentActiveWebRTCRoom.isActive()) {
                    tool.myWaitingRoomStream.setAttribute('closeManually', true);
                    tool.myWaitingRoomStream.save({
                        onSave: function () {
                            tool.currentActiveWebRTCRoom.switchTo(tool.state.publisherId, tool.state.streamName.split('/').pop(), { resumeClosed: true }).then(function () {

                            });
                        }
                    });
                } else {
                    tool.currentActiveWebRTCRoom = Q.Streams.WebRTC({
                        roomId: tool.state.streamName.split('/').pop(),
                        roomPublisherId: tool.state.publisherId,
                        element: document.body,
                        startWith: { video: false, audio: true }
                    });

                    tool.currentActiveWebRTCRoom.start();
                }
            },
            onCallEndedHandler: function (message) {
                var tool = this;
                if(tool.currentActiveWebRTCRoom && tool.currentActiveWebRTCRoom.isActive()) {
                    var message = JSON.parse(message.instructions);
                    var signalingLib = tool.currentActiveWebRTCRoom.currentConferenceLibInstance();
                    var localParticipant = signalingLib.localParticipant();
    
                    var userId = localParticipant.identity != null ? localParticipant.identity.split('\t')[0] : null;
    
                    if(message.userId == userId) {
                        if(message.immediate === true) {
                            if(signalingLib.initNegotiationState == 'ended') tool.currentActiveWebRTCRoom.notice.show(message.msg);
                            tool.currentActiveWebRTCRoom.stop();
                        } else {
                            if(signalingLib.initNegotiationState == 'ended') tool.currentActiveWebRTCRoom.notice.show(message.msg);
    
                            setTimeout(function () {
                                tool.currentActiveWebRTCRoom.stop();
                            }, 5000);
                        }
                    }
                } else {
                    var message = JSON.parse(message.content);
                    Q.alert(message.msg);
                }
            }  ,
            onCallDeclinedHandler: function (message) {
                var tool = this;
                if(tool.currentActiveWebRTCRoom && tool.currentActiveWebRTCRoom.isActive()) {
                    var message = JSON.parse(message.content);
                    var signalingLib = tool.currentActiveWebRTCRoom.currentConferenceLibInstance();
                    var localParticipant = signalingLib.localParticipant();
    
                    var userId = localParticipant.identity != null ? localParticipant.identity.split('\t')[0] : null;
    
                    if(message.userId == userId) {
                        if(message.immediate === true) {
                            if(signalingLib.initNegotiationState == 'ended') tool.currentActiveWebRTCRoom.notice.show(message.msg);
                            tool.currentActiveWebRTCRoom.stop();
                        } else {
                            if(signalingLib.initNegotiationState == 'ended') tool.currentActiveWebRTCRoom.notice.show(message.msg);
    
                            setTimeout(function () {
                                tool.currentActiveWebRTCRoom.stop();
                            }, 5000);
                        }
                    }
                }
            }    
        }

    );

})(window.jQuery, window);