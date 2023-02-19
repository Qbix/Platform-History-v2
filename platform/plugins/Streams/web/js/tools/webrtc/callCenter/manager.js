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
     * Streams/webrtc/livestream tool.
     * 
     * @module Streams
     * @constructor
     * @param {Object} options
     */
    Q.Tool.define("Streams/webrtc/callCenter/manager", function (options) {
        var tool = this;
        
        tool.callCenterStream = null; //stream to which all calls is related
        tool.callCenterMode = 'regular'; //regular||liveShow
        tool.iAmConnectedToCallCenterRoom = false;
        tool.endpointCallsListEl = null;
        tool.relatedStreamsTool = null;
        tool.relatedStreams = [];
        tool.callsList = [];
        tool.currentActiveWebRTCRoom = null;

        tool.loadStyles().then(function() {
            return tool.getCallCenterEndpointStream();
        }).then(function(stream) {
            console.log('levels', stream.testReadLevel('relations'), stream.testWriteLevel('join'), stream.testAdminLevel('invite'))
            if(!stream.testReadLevel('relations') || !stream.testWriteLevel('max') || !stream.testAdminLevel('invite')) {
                return Q.alert('You are now allowed to create call center on this stream');
            }

            tool.callCenterStream = stream;
            tool.callCenterMode = stream.fields.type == 'Streams/webrtc' ? 'liveShow' : 'regular';
            console.log('callCenterStream', tool.callCenterStream);
            tool.callCenterStream.observe();
            //tool.declareStreamEventHandlers();
            tool.buildInterface();
        });
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
                tool.callCenterStream.onMessage("Streams/livestream/start").set(function (stream, message) {
                    //tool.syncLivestreamsList([message]);
                    //tool.videoTabsTool.syncVideoTabsList.apply(tool);
                }, tool);
                tool.callCenterStream.onMessage("Streams/livestream/stop").set(function (stream, message) {
                    //tool.syncLivestreamsList([message]);
                    //tool.videoTabsTool.syncVideoTabsList.apply(tool);
                }, tool);
            },
            loadStyles: function () {
                return new Promise(function(resolve, reject){
                    Q.addStylesheet('{{Streams}}/css/tools/callCenterManager.css?ts=' + performance.now(), function () {
                        resolve();
                    });
                });
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
            initColumnsTool: function (container) {
                return new Promise(function(resolve, reject) {
                    Q.activate(
                        Q.Tool.setUpElement(
                            container,
                            "Q/columns",
                            {
                                
                            }
                        ),
                        function () {
                            resolve(this);
                        }
                    );
                });
            },
            buildInterface: function () {
                var tool = this;
                var toolContainer = document.createElement('DIV');
                toolContainer.className = 'streams-callcenter-m-container';

                var toolContainerInner = document.createElement('DIV');
                toolContainerInner.className = 'streams-callcenter-m-container-inner';
                toolContainer.appendChild(toolContainerInner);
                
                
                if(tool.callCenterMode == 'liveShow' && tool.callCenterStream.testWriteLevel('join')) {
                    var controlButtonsCon = document.createElement('DIV');
                    controlButtonsCon.className = 'streams-callcenter-m-controls-con';
                    toolContainerInner.appendChild(controlButtonsCon);
                    
                    var controlButtons = document.createElement('DIV');
                    controlButtons.className = 'streams-callcenter-m-controls';
                    controlButtonsCon.appendChild(controlButtons);

                    let openWebrtcRoomBtn = document.createElement('BUTTON');
                    openWebrtcRoomBtn.className = 'streams-callcenter-m-controls-open-webrtc';
                    openWebrtcRoomBtn.innerHTML = 'Join Teleconference';
                    controlButtons.appendChild(openWebrtcRoomBtn);

                    openWebrtcRoomBtn.addEventListener('click', function () {
                        tool.startOrJoinLiveShowTeleconference();
                    });
                }
                
                var endpointCallsCon = document.createElement('DIV');
                endpointCallsCon.className = 'streams-callcenter-m-enpoints-calls-con';
                toolContainerInner.appendChild(endpointCallsCon);

                var endpointCallsInner = tool.endpointCallsListEl = document.createElement('DIV');
                endpointCallsInner.className = 'streams-callcenter-m-enpoints-calls';
                endpointCallsCon.appendChild(endpointCallsInner);

                tool.element.appendChild(toolContainer);

                Q.activate(
                    Q.Tool.setUpElement('div', 'Streams/related', {
                        publisherId: tool.callCenterStream.fields.publisherId,
                        streamName: tool.callCenterStream.fields.name,
                        relationType: 'Streams/webrtc/callCenter/call',
                        tag: 'div',
                        isCategory: true,
                        creatable: false,
                        realtime: true,
                        onUpdate: function (e) {
                            console.log('onUpdate', e, this)
                            tool.relatedStreams = e.relatedStreams;
                            tool.reloadCallsList();
                        },
                        beforeRenderPreview: function (e) {
                            console.log('beforeRenderPreview', e, this)
                        }
                    }),
                    {},
                    function () {
                        _relatedStreamsTool = this;
                    }
                ); 
            },
            handleStreamEvents: function (stream, callDataObject) {
                var tool = this;
                stream.onMessage("Streams/changed").set(function (stream, message) {
                    if(callDataObject.title != stream.fields.title) {
                        callDataObject.callTitleEl.innerHTML = callDataObject.title = stream.fields.title;
                    }
                    if(callDataObject.topic != stream.fields.content) {
                        callDataObject.callTopicEl.innerHTML = callDataObject.topic = stream.fields.content;
                    }
                }, tool);
            },
            reloadCallsList: function () {
                var tool = this;
                console.log('reloadCallsList: relatedStreams', relatedStreams);
                var relatedStreams = tool.relatedStreams;
                for (let s in relatedStreams) {
                    let stream = relatedStreams[s];
                    let callExists;
                    for (let c in tool.callsList) {
                        if(stream.fields.name == tool.callsList[c].webrtcStream.fields.name) {
                            callExists = tool.callsList[c];
                            break;
                        }
                    }
                    console.log('reloadCallsList: callExists', callExists);

                    if(callExists != null) {
                        if(callExists.title != stream.fields.title) {
                            callExists.callTitleEl.innerHTML = callExists.title = stream.fields.title;
                        }
                        if(callExists.topic != stream.fields.content) {
                            callExists.callTopicEl.innerHTML = callExists.topic = stream.fields.content;
                        }
                        continue;
                    }

                    
                    let callDataObject = {
                        title: stream.fields.title,
                        topic: stream.fields.content,
                        webrtcStream: stream,
                        timestamp: convertDateToTimestamp(stream.fields.insertedTime),
                        status: 'created'
                    }

                    createCallItemElement(callDataObject);
                    tool.updateCallButtons(callDataObject);

                    console.log('reloadCallsList: callDataObject', callDataObject);
                    tool.callsList.unshift(callDataObject);

                    tool.callsList.sort(function(x, y){
                        return y.timestamp - x.timestamp;
                    })
                   

                    tool.handleStreamEvents(stream, callDataObject);
                }

                for(let c in tool.callsList) {
                    tool.endpointCallsListEl.appendChild(tool.callsList[c].callElement);
                }

                console.log('reloadCallsList: callsList', tool.callsList.length)
                for (let i = tool.callsList.length - 1; i >= 0; i--) {
                    console.log('reloadCallsList: callsList for', i)

                    let callIsClosed = true;
                    for (let n in relatedStreams) {
                        if(relatedStreams[n].fields.name == tool.callsList[i].webrtcStream.fields.name) {
                            callIsClosed = false;
                        }
                    }
                    if(callIsClosed && tool.callsList[i].status != 'accepted') {
                        console.log('reloadCallsList: callsList for remove', i)
                        if(tool.callsList[i].callElement && tool.callsList[i].callElement.parentElement != null) {
                            tool.callsList[i].callElement.parentElement.removeChild(tool.callsList[i].callElement);
                        }
                        tool.callsList.splice(i, 1);
                    }
                }

                function createCallItemElement(callDataObject) {
                    if(tool.callCenterMode == 'regular') {
                        var callItemContainer = document.createElement('DIV');
                        callItemContainer.className = 'streams-callcenter-m-calls-item';
        
                        var callItemInnerCon = document.createElement('DIV');
                        callItemInnerCon.className = 'streams-callcenter-m-calls-item-inner';
                        callItemContainer.appendChild(callItemInnerCon);
        
                        var callItemAvatar = document.createElement('DIV');
                        callItemAvatar.className = 'streams-callcenter-m-calls-item-avatar';
                        callItemInnerCon.appendChild(callItemAvatar);
    
                        var callItemInfo = document.createElement('DIV');
                        callItemInfo.className = 'streams-callcenter-m-calls-item-info';
                        callItemInnerCon.appendChild(callItemInfo);
        
                        var callTitle = document.createElement('DIV');
                        callTitle.className = 'streams-callcenter-m-calls-item-title';
                        callTitle.innerHTML = callDataObject.webrtcStream.fields.title;
                        callItemInfo.appendChild(callTitle);
        
                        var callTopic = document.createElement('DIV');
                        callTopic.className = 'streams-callcenter-m-calls-item-topic';
                        callTopic.innerHTML = callDataObject.webrtcStream.fields.content;
                        callItemInfo.appendChild(callTopic);
        
                        var callButtons = document.createElement('DIV');
                        callButtons.className = 'streams-callcenter-m-calls-item-buttons';
                        callItemInfo.appendChild(callButtons);

                        var interviewButton = document.createElement('BUTTON');
                        interviewButton.className = 'streams-callcenter-m-calls-item-buttons-btn streams-callcenter-m-calls-item-buttons-interview';
                        interviewButton.innerHTML = 'Interview';
                        callButtons.appendChild(interviewButton);
        
                        var holdButton = document.createElement('BUTTON');
                        holdButton.className = 'streams-callcenter-m-calls-item-buttons-btn streams-callcenter-m-calls-item-buttons-hold';
                        holdButton.innerHTML = 'Hold';
                        callButtons.appendChild(holdButton);
        
                        var declineButton = document.createElement('BUTTON');
                        declineButton.className = 'streams-callcenter-m-calls-item-buttons-btn streams-callcenter-m-calls-item-buttons-decline';
                        declineButton.innerHTML = 'End Call';
                        callButtons.appendChild(declineButton);
    
                        interviewButton.addEventListener('click', function () {
                            tool.onInterviewHandler(callDataObject);
                            tool.updateCallButtons(callDataObject);
                        });
    
                        declineButton.addEventListener('click', function () {
                            tool.onDeclineHandler(callDataObject);
                            tool.updateCallButtons(callDataObject);
                        });
    
                        holdButton.addEventListener('click', function () {
                            tool.onHoldHandler(callDataObject);
                            tool.updateCallButtons(callDataObject);
                        });
    
                        Q.activate(
                            Q.Tool.setUpElement(
                                callItemAvatar,
                                "Users/avatar",
                                {
                                    userId: callDataObject.webrtcStream.publisherId,
                                    contents: false
                                }
                            )
                        );

                        callDataObject.callElement = callItemContainer;
                        callDataObject.callTitleEl = callTitle;
                        callDataObject.callTopicEl = callTopic;
                        callDataObject.interviewButtonEl = interviewButton;
                        callDataObject.holdButtonEl = holdButton;
                        callDataObject.declineButtonEl = declineButton;

                    } else if(tool.callCenterMode == 'liveShow') {
                        var callItemContainer = document.createElement('DIV');
                        callItemContainer.className = 'streams-callcenter-m-calls-item';
        
                        var callItemInnerCon = document.createElement('DIV');
                        callItemInnerCon.className = 'streams-callcenter-m-calls-item-inner';
                        callItemContainer.appendChild(callItemInnerCon);
        
                        var callItemAvatar = document.createElement('DIV');
                        callItemAvatar.className = 'streams-callcenter-m-calls-item-avatar';
                        callItemInnerCon.appendChild(callItemAvatar);
    
                        var callItemInfo = document.createElement('DIV');
                        callItemInfo.className = 'streams-callcenter-m-calls-item-info';
                        callItemInnerCon.appendChild(callItemInfo);
        
                        var callTitle = document.createElement('DIV');
                        callTitle.className = 'streams-callcenter-m-calls-item-title';
                        callTitle.innerHTML = callDataObject.webrtcStream.fields.title;
                        callItemInfo.appendChild(callTitle);
        
                        var callDate = document.createElement('DIV');
                        callDate.className = 'streams-callcenter-m-calls-item-date';
                        Q.activate(
                            Q.Tool.setUpElement(
                                callDate,
                                "Q/timestamp",
                                {
                                    time: callDataObject.webrtcStream.fields.insertedTime,
                                    capitalized: true,
                                    relative: false
                                }
                            )
                        );

                        callItemInfo.appendChild(callDate);
        
                        var callTopic = document.createElement('DIV');
                        callTopic.className = 'streams-callcenter-m-calls-item-topic';
                        callTopic.innerHTML = callDataObject.webrtcStream.fields.content;
                        callItemInfo.appendChild(callTopic);
        
                        var callButtons = document.createElement('DIV');
                        callButtons.className = 'streams-callcenter-m-calls-item-buttons';
                        callItemInfo.appendChild(callButtons);
        
                        var markApprovedButton = document.createElement('BUTTON');
                        markApprovedButton.className = 'streams-callcenter-m-calls-item-buttons-btn streams-callcenter-m-calls-item-buttons-approve';
                        markApprovedButton.innerHTML = 'Mark Approved';
                        callButtons.appendChild(markApprovedButton);
        
                        var acceptButton = document.createElement('BUTTON');
                        acceptButton.className = 'streams-callcenter-m-calls-item-buttons-btn streams-callcenter-m-calls-item-buttons-accept';
                        acceptButton.innerHTML = 'Accept';
                        callButtons.appendChild(acceptButton);
        
                        var interviewButton = document.createElement('BUTTON');
                        interviewButton.className = 'streams-callcenter-m-calls-item-buttons-btn streams-callcenter-m-calls-item-buttons-interview';
                        interviewButton.innerHTML = 'Interview';
                        callButtons.appendChild(interviewButton);
        
                        var holdButton = document.createElement('BUTTON');
                        holdButton.className = 'streams-callcenter-m-calls-item-buttons-btn streams-callcenter-m-calls-item-buttons-hold';
                        holdButton.innerHTML = 'Hold';
                        callButtons.appendChild(holdButton);
        
                        var declineButton = document.createElement('BUTTON');
                        declineButton.className = 'streams-callcenter-m-calls-item-buttons-btn streams-callcenter-m-calls-item-buttons-decline';
                        declineButton.innerHTML = 'End Call';
                        callButtons.appendChild(declineButton);
    
                        acceptButton.addEventListener('click', function () {
                            tool.onAcceptHandler(callDataObject);
                            tool.updateCallButtons(callDataObject);
                        });
                        
                        interviewButton.addEventListener('click', function () {
                            tool.onInterviewHandler(callDataObject);
                            tool.updateCallButtons(callDataObject);
                        });
    
                        declineButton.addEventListener('click', function () {
                            tool.onDeclineHandler(callDataObject);
                            tool.updateCallButtons(callDataObject);
                        });
    
                        holdButton.addEventListener('click', function () {
                            tool.onHoldHandler(callDataObject);
                            tool.updateCallButtons(callDataObject);
                        });
    
                        Q.activate(
                            Q.Tool.setUpElement(
                                callItemAvatar,
                                "Users/avatar",
                                {
                                    userId: callDataObject.webrtcStream.publisherId,
                                    contents: false
                                }
                            )
                        );

                        callDataObject.callElement = callItemContainer;
                        callDataObject.callTitleEl = callTitle;
                        callDataObject.callTopicEl = callTopic;
                        callDataObject.markApprovedButtonEl = markApprovedButton;
                        callDataObject.acceptButtonEl = acceptButton;
                        callDataObject.interviewButtonEl = interviewButton;
                        callDataObject.holdButtonEl = holdButton;
                        callDataObject.declineButtonEl = declineButton;
                        
                    }
                    
                }
                
                function convertDateToTimestamp(str) {
                    const [dateComponents, timeComponents] = str.split(' ');
                    console.log(dateComponents); 
                    console.log(timeComponents); 

                    const [year, month, day] = dateComponents.split('-');
                    const [hours, minutes, seconds] = timeComponents.split(':');

                    const date = new Date(+year, month - 1, +day, +hours, +minutes, +seconds);
                    console.log(date); 

                    const timestamp = date.getTime();
                    return timestamp;
                }
            },
            updateCallButtons: function (callDataObject) {
                var tool = this;
                console.log('updateCallButtons', callDataObject.status);
                if(tool.callCenterMode == 'regular') {
                    if(callDataObject.status == 'created') {
                        hideButton(callDataObject.holdButtonEl);
                        showButton(callDataObject.interviewButtonEl);
                        showButton(callDataObject.declineButtonEl); 
                    } else if(callDataObject.status == 'accepted') {
                        showButton(callDataObject.holdButtonEl);
                        showButton(callDataObject.declineButtonEl); 
                        hideButton(callDataObject.interviewButtonEl);
                    }
                } else if(tool.callCenterMode == 'liveShow') {
                    if(callDataObject.status == 'created' || callDataObject.status == 'hold') {
                        console.log('updateCallButtons 1');
                        hideButton(callDataObject.holdButtonEl);
                        showButton(callDataObject.markApprovedButtonEl);
                        showButton(callDataObject.acceptButtonEl);
                        showButton(callDataObject.interviewButtonEl);
                        showButton(callDataObject.declineButtonEl);
                        callDataObject.declineButtonEl.innerHTML = 'Decline';
                    } else if(callDataObject.status == 'interview') {
                        console.log('updateCallButtons 2');
                        hideButton(callDataObject.interviewButtonEl);
                        showButton(callDataObject.holdButtonEl);
                        showButton(callDataObject.declineButtonEl);
                        showButton(callDataObject.markApprovedButtonEl);
                        showButton(callDataObject.acceptButtonEl);
                        callDataObject.declineButtonEl.innerHTML = 'Decline';
                    } else if(callDataObject.status == 'accepted') {
                        console.log('updateCallButtons 3');
                        showButton(callDataObject.declineButtonEl);
                        hideButton(callDataObject.holdButtonEl);
                        hideButton(callDataObject.markApprovedButtonEl);
                        hideButton(callDataObject.acceptButtonEl);
                        hideButton(callDataObject.interviewButtonEl);
                        callDataObject.declineButtonEl.innerHTML = 'Remove From Live';
                    }
                }

                function showButton(buttonEl) {
                    buttonEl.classList.remove('streams-callcenter-m-button-hidden')
                }

                function hideButton(buttonEl) {
                    if(!buttonEl.classList.contains('streams-callcenter-m-button-hidden')) {
                        buttonEl.classList.add('streams-callcenter-m-button-hidden')
                    }
                }
            },
            startOrJoinLiveShowTeleconference: function () {
                var tool = this;
                if(tool.currentActiveWebRTCRoom && tool.currentActiveWebRTCRoom.isActive()) {
                    tool.switchBackToLiveShowRoom();
                } else {
                    tool.currentActiveWebRTCRoom = Q.Streams.WebRTC({
                        roomId: tool.callCenterStream.fields.name.split('/').pop(),
                        roomPublisherId: tool.callCenterStream.fields.publisherId,
                        element: document.body,
                        startWith: { video: false, audio: true }
                    });

                    tool.currentActiveWebRTCRoom.start();
                }
                tool.iAmConnectedToCallCenterRoom = true
            },
            switchBackToLiveShowRoom: function () {
                var tool = this;
                tool.currentActiveWebRTCRoom.switchTo(tool.callCenterStream.fields.publisherId, tool.callCenterStream.fields.name.split('/').pop(), {resumeClosed: true}).then(function () {
                            
                });
            },
            joinUsersWaitingRooom: function (callDataObject) {
                var tool = this;
                if(tool.currentActiveWebRTCRoom && tool.currentActiveWebRTCRoom.isActive()) {
                    callDataObject.status = 'interview';
                    tool.currentActiveWebRTCRoom.switchTo(callDataObject.webrtcStream.fields.publisherId, callDataObject.webrtcStream.fields.name.split('/').pop(), {}).then(function () {
                        
                    });
                } else {
                    callDataObject.status = 'interview';
                    tool.currentActiveWebRTCRoom = Q.Streams.WebRTC({
                        roomId: callDataObject.webrtcStream.fields.name,
                        roomPublisherId: callDataObject.webrtcStream.fields.publisherId,
                        element: document.body,
                        startWith: { video: false, audio: true }
                    });

                    tool.currentActiveWebRTCRoom.start();
                }
            },
            onHoldHandler: function (callDataObject) {
                var tool = this;
                if(tool.callCenterMode == 'regular') {

                } else if(tool.callCenterMode == 'liveShow') {
                    if(tool.iAmConnectedToCallCenterRoom && tool.currentActiveWebRTCRoom && tool.currentActiveWebRTCRoom.isActive()) {
                        callDataObject.status = 'hold';
                        tool.switchBackToLiveShowRoom();
                    } else if(tool.currentActiveWebRTCRoom && tool.currentActiveWebRTCRoom.isActive()) {
                        callDataObject.status = 'hold';
                        tool.currentActiveWebRTCRoom.stop();
                    }
                }
            },
            onInterviewHandler: function (callDataObject) {
                var tool = this;
                if(tool.callCenterMode == 'regular') {
                    tool.joinUsersWaitingRooom(callDataObject);
                } else if(tool.callCenterMode == 'liveShow') {
                    tool.joinUsersWaitingRooom(callDataObject);
                }
                
            },
            onAcceptHandler: function (callDataObject) {
                var tool = this;
                if(tool.callCenterMode != 'liveShow') return;
                
                //onAcceptHandler can be firen only in "liveShow", this handler moves user from his waiting room to liveShow webrtc room
                //so firstly, we need to give him max readLevel access, secondly - post message to his waiting room with streams info that he will use for
                //joining our webrtc room
                console.log('onAcceptHandler', callDataObject.status);
                let prevStatus = callDataObject.status;
                callDataObject.status = 'accepted';
                var fields = {
                    publisherId: tool.state.publisherId,
                    streamName: tool.state.streamName,
                    readLevel: 40,
                    writeLevel: 10,
                    ofUserId: callDataObject.webrtcStream.fields.publisherId
                };
                Q.req('Streams/access', ['data'], function (err, response) {
                    var msg;
                    if (msg = Q.firstErrorMessage(err, response && response.errors)) {
                        alert(msg);
                    }
                    tool.callCenterStream.refresh();

                    callDataObject.webrtcStream.post({
                        type: 'Streams/webrtc/accepted',
                        content: JSON.stringify({
                            msg: 'Your call request was accepted'
                        }),
                    }, function () {
                        if((prevStatus == 'interview' || prevStatus == 'hold')&& tool.iAmConnectedToCallCenterRoom) {
                            tool.switchBackToLiveShowRoom();
                        } else if(tool.currentActiveWebRTCRoom) {
                            tool.currentActiveWebRTCRoom.stop();
                        }       
                    })

                }, {
                    method: 'put',
                    fields: fields
                });
            },
            onDeclineHandler: function (callDataObject) {
                var tool = this;
                console.log('onDeclineHandler', callDataObject.status);
                var content;
               
                if(callDataObject.status == 'interview' || callDataObject.status == 'accepted') {
                    console.log('onDeclineHandler 1');

                    content = JSON.stringify({
                        immediate: true,
                        userId: callDataObject.webrtcStream.fields.publisherId,
                        msg: 'Call ended'
                    })
                } else {
                    console.log('onDeclineHandler 2');
                    content = JSON.stringify({
                        immediate: true,
                        userId: callDataObject.webrtcStream.fields.publisherId,
                        msg: 'Your call request was declined'
                    })
                }
                callDataObject.status = 'ended';
                callDataObject.webrtcStream.post({
                    type: 'Streams/webrtc/endCall',
                    content: content,
                }, function() {
                    callDataObject.webrtcStream.close(function (err) {
                        if (err) {
                            return console.error(err);
                        }
                        tool.reloadCallsList();
                    });
                })
            }            
        }

    );

})(window.jQuery, window);