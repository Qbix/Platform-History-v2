(function ($, window, undefined) {
    var _livestreamToolIcons = {
    }

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
    Q.Tool.define("Streams/webrtc/livestream", function (options) {
        var tool = this;
        
        tool.textChatContainerEl = null;

        Q.addStylesheet('{{Streams}}/css/tools/livestream.css?ts=' + performance.now(), function () {
            Q.Streams.related(tool.state.publisherId, tool.state.streamName, "Streams/webrtc/livestream/chat", true, function (err) {
                if (err) {
                    console.error(err)
                    return;
                }
    
                console.log('this.relatedStreams', this.relatedStreams)
                tool.relatedStreams = [];
                for (var key in this.relatedStreams) {
                    if (this.relatedStreams.hasOwnProperty(key)) {
                        tool.relatedStreams.push(this.relatedStreams[key]);
                    }
                }
                
                tool.create();
            });
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
            create: function () {
                var tool = this;
                var toolContainer = document.createElement('DIV');
                toolContainer.className = 'streams-livestream-container';

                var toolContainerInner = document.createElement('DIV');
                toolContainerInner.className = 'streams-livestream-container-inner';
                toolContainer.appendChild(toolContainerInner);

                var livestreamVideoCon = document.createElement('DIV');
                livestreamVideoCon.className = 'streams-livestream-video-con';
                toolContainerInner.appendChild(livestreamVideoCon);

                var livestreamParticipantsCon = document.createElement('DIV');
                livestreamParticipantsCon.className = 'streams-livestream-participants-con';
                toolContainerInner.appendChild(livestreamParticipantsCon);

                var livestreamChatCon = document.createElement('DIV');
                livestreamChatCon.className = 'streams-livestream-chat-con';
                toolContainerInner.appendChild(livestreamChatCon);

                var livestreamChatInner = document.createElement('DIV');
                livestreamChatInner.className = 'streams-livestream-chat-inner';
                livestreamChatCon.appendChild(livestreamChatInner);

                var livestreamChatTabsCon = document.createElement('DIV');
                livestreamChatTabsCon.className = 'streams-livestream-chat-tabs-con';
                livestreamChatInner.appendChild(livestreamChatTabsCon);

                var livestreamChatTabsInner = document.createElement('DIV');
                livestreamChatTabsInner.className = 'streams-livestream-chat-tabs-inner';
                livestreamChatTabsCon.appendChild(livestreamChatTabsInner);

                var livestreamChatTabsTool = document.createElement('DIV');
                livestreamChatTabsTool.className = 'streams-livestream-chat-tabs-tool';
                livestreamChatTabsInner.appendChild(livestreamChatTabsTool);

                for (var i in tool.chatTabsTool.tabs) {
                    let livestreamChatTabsItem = document.createElement('DIV');
                    livestreamChatTabsItem.className = 'streams-livestream-chat-tabs-tool-tab streams-livestream-chat-tabs-tool-tab-' + tool.chatTabsTool.tabs[i].key;
                    livestreamChatTabsItem.dataset.tabName = tool.chatTabsTool.tabs[i].key;
                    livestreamChatTabsTool.appendChild(livestreamChatTabsItem);
                    let livestreamChatTabsItemTitle = document.createElement('DIV');
                    livestreamChatTabsItemTitle.className = 'streams-livestream-chat-tabs-tool-tab-title';
                    livestreamChatTabsItemTitle.innerHTML = tool.chatTabsTool.tabs[i].title;
                    livestreamChatTabsItem.appendChild(livestreamChatTabsItemTitle);
                    tool.chatTabsTool.tabs[i].tabElement = livestreamChatTabsItem;
                    livestreamChatTabsItem.addEventListener('click', function (e) {
                        tool.chatTabsTool.tabHandler.bind(tool)(e);
                    });
                }

                var livestreamChatToolCon = document.createElement('DIV');
                livestreamChatToolCon.className = 'streams-livestream-chat-tool-con';
                livestreamChatInner.appendChild(livestreamChatToolCon);
                tool.textChatContainerEl = livestreamChatToolCon;

               
                tool.element.appendChild(toolContainer);

                
            },
            chatTabsTool: {
                currentTabName: null,
                tabs: [
                    {
                        title: 'Public',
                        key: 'public',
                        tabElement: null,
                        tabContent: null
                    },
                    {
                        title: 'Private',
                        key: 'private',
                        tabElement: null,
                        tabContent: null
                    }
                ],
                tabHandler: function(e) {
                    var tool = this;

                    console.log('tabHandler', this, e);
                    var clickedTabName = e.currentTarget.dataset.tabName;
                    var clickedTabObject = null;
                    for (let i in tool.chatTabsTool.tabs) {
                        let tab = tool.chatTabsTool.tabs[i];
                        if (tab.key != clickedTabName) {
                            tab.tabElement.classList.remove('streams-livestream-chat-tabs-tool-tab-active')
                        }
                        if (tab.key == clickedTabName && !tab.tabElement.classList.contains('streams-livestream-chat-tabs-tool-tab-active')) {
                            tab.tabElement.classList.add('streams-livestream-chat-tabs-tool-tab-active')
                        }
                        if (tab.key == clickedTabName) {
                            clickedTabObject = tab;
                        }
                    }

                    if(!clickedTabObject) return;

                    if (clickedTabName == 'public') {
                        if(clickedTabObject.tabContent) {
                            tool.textChatContainerEl.innerHTML = '';
                            tool.textChatContainerEl.appendChild(clickedTabObject.tabContent)
                        } else {
                            var livestreamChatToolEl = document.createElement('DIV');
                            livestreamChatToolEl.className = 'streams-livestream-chat-tool-el';
                            tool.textChatContainerEl.appendChild(livestreamChatToolEl)
                            clickedTabObject.tabContent = livestreamChatToolEl;
    
                            Q.activate(
                                Q.Tool.setUpElement(
                                    livestreamChatToolEl,
                                    "Streams/chat",
                                    {
                                        publisherId: tool.relatedStreams[0].fields.publisherId,
                                        streamName: tool.relatedStreams[0].fields.name
                                    }
                                )
                                ,
                                {},
                                function () {}
                            );
                        }                        
                    } else if(clickedTabName == 'private') {
                        if(clickedTabObject.tabContent) {
                            tool.textChatContainerEl.innerHTML = '';
                            tool.textChatContainerEl.appendChild(clickedTabObject.tabContent)
                        } else {

                            Q.Streams.create({
                                publisherId: Q.Users.loggedInUserId(),
                                type: 'Streams/chat',
                                title: 'Private chat in livestream',
                                readLevel: 0,
                                writeLevel: 0,
                                adminLevel: 0
                            }, function (err) {
                                if (err) {
                                    console.error(err);
                                    return;
                                }

                                var stream = this;

                                var livestreamChatToolEl = document.createElement('DIV');
                                livestreamChatToolEl.className = 'streams-livestream-chat-tool-el';
                                tool.textChatContainerEl.appendChild(livestreamChatToolEl)
                                clickedTabObject.tabContent = livestreamChatToolEl;
        
                                Q.activate(
                                    Q.Tool.setUpElement(
                                        livestreamChatToolEl,
                                        "Streams/chat",
                                        {
                                            publisherId: stream.fields.publisherId,
                                            streamName: stream.fields.name
                                        }
                                    )
                                    ,
                                    {},
                                    function () {}
                                );
                                
                            }, {
                                publisherId: tool.state.publisherId,
                                streamName: tool.state.streamName,
                                type: 'Streams/webrtc/livestream/chat'
                            });
                            
                        }        
                    }
    
                }
            },            
        }

    );

})(window.jQuery, window);