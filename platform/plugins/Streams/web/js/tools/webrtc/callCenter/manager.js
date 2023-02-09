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
        tool.endpointCallsListEl = null;
        tool.relatedStreamsTool = null;
        tool.callsList = [];

        tool.loadStyles().then(function() {
            return tool.getCallCenterEndpointStream();
        }).then(function(stream) {
            tool.callCenterStream = stream;
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
            buildInterface: function () {
                var tool = this;
                var toolContainer = document.createElement('DIV');
                toolContainer.className = 'streams-callcenter-m-container';

                var toolContainerInner = document.createElement('DIV');
                toolContainerInner.className = 'streams-callcenter-m-container-inner';
                toolContainer.appendChild(toolContainerInner);
                
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
                            tool.reloadCallsList(e.relatedStreams);
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
            reloadCallsList: function (relatedStreams) {
                var tool = this;
                console.log('reloadCallsList: relatedStreams', relatedStreams);

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

                    let callElements = createCallItemElement(stream);
                    let callDataObject = {
                        title: stream.fields.title,
                        topic: stream.fields.content,
                        callElement: callElements.callElement,
                        callTitleEl: callElements.callTitleEl,
                        callTopicEl: callElements.callTopicEl,
                        webrtcStream: stream
                    }

                    console.log('reloadCallsList: callDataObject', callDataObject);
                    tool.callsList.unshift(callDataObject);
                    if(tool.endpointCallsListEl.firstChild) {
                        tool.endpointCallsListEl.insertBefore(callElements.callElement, tool.endpointCallsListEl.firstChild);
                    } else {
                        tool.endpointCallsListEl.appendChild(callElements.callElement);
                    }

                    tool.handleStreamEvents(stream, callDataObject);
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
                    if(callIsClosed) {
                        console.log('reloadCallsList: callsList for remove', i)
                        if(tool.callsList[i].callElement && tool.callsList[i].callElement.parentElement != null) {
                            tool.callsList[i].callElement.parentElement.removeChild(tool.callsList[i].callElement);
                        }
                        tool.callsList.splice(i, 1);
                    }
                }

                function createCallItemElement(stream) {
                    var callItemContainer = document.createElement('DIV');
                    callItemContainer.className = 'streams-callcenter-m-calls-item';
    
                    var callItemInnerCon = document.createElement('DIV');
                    callItemInnerCon.className = 'streams-callcenter-m-calls-item-inner';
                    callItemContainer.appendChild(callItemInnerCon);
    
                    var callTitle = document.createElement('DIV');
                    callTitle.className = 'streams-callcenter-m-calls-item-title';
                    callTitle.innerHTML = stream.fields.title;
                    callItemInnerCon.appendChild(callTitle);
    
                    var callTopic = document.createElement('DIV');
                    callTopic.className = 'streams-callcenter-m-calls-item-title';
                    callTopic.innerHTML = stream.fields.content;
                    callItemInnerCon.appendChild(callTopic);
    
                    var callButtons = document.createElement('DIV');
                    callButtons.className = 'streams-callcenter-m-calls-item-buttons';
                    callItemInnerCon.appendChild(callButtons);
    
                    var acceptButton = document.createElement('BUTTON');
                    acceptButton.className = 'streams-callcenter-m-calls-item-buttons-btn streams-callcenter-m-calls-item-buttons-accept';
                    acceptButton.innerHTML = 'Accept';
                    callButtons.appendChild(acceptButton);
    
                    var declineButton = document.createElement('BUTTON');
                    declineButton.className = 'streams-callcenter-m-calls-item-buttons-btn streams-callcenter-m-calls-item-buttons-decline';
                    declineButton.innerHTML = 'Decline';
                    callButtons.appendChild(declineButton);

                    declineButton.addEventListener('click', function () {
                        stream.close(function (err) {
                            if (err) {
                                return console.error(err);
                            }
            
                        });
                    });
    
                    return {
                        callElement: callItemContainer,
                        callTitleEl: callTitle,
                        callTopicEl: callTopic
                    };
                }         
            }             
        }

    );

})(window.jQuery, window);