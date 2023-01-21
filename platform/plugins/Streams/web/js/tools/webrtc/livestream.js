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
        
        tool.livestreamStream = null;
        tool.activeLivestreamings = [];
        tool.inactiveLivestreamings = [];
        tool.videoContainerEl = null;
        tool.videoContainerTabsEl = null;
        tool.textChatContainerEl = null;
        tool.relatedStreams = [];
        tool.publicChatStream = null;
        tool.privateChatStream = null;

        Q.addStylesheet('{{Streams}}/css/tools/livestream.css?ts=' + performance.now(), function () {
            Q.Streams.get(tool.state.publisherId, tool.state.streamName, function () {
                if(!this || !this.fields) {
                    console.error('Error while getting stream');
                    return;
                }
                tool.livestreamStream = this;
                if (Q.Users.loggedInUserId()) {
                    tool.livestreamStream.observe();
                }
                tool.declareStreamEventHandlers();
                
                Q.Streams.related(tool.state.publisherId, tool.state.streamName, "Streams/webrtc/livestream/chat", true, function (err) {
                    if (err) {
                        console.error(err)
                        return;
                    }
        
                    console.log('this.relatedStreams', this.relatedStreams)
                    for (var key in this.relatedStreams) {
                        if (this.relatedStreams.hasOwnProperty(key)) {
                            tool.relatedStreams.push(this.relatedStreams[key]);
                            if(this.relatedStreams[key].getAttribute('publicChat') == true) {
                                tool.publicChatStream = this.relatedStreams[key];
                            } else {
                                tool.privateChatStream = this.relatedStreams[key];
                            }
                        }
                    }
                    
                    var params = {
                        type: ["Streams/livestream/start", "Streams/livestream/stop"]
                    };
                    Q.Streams.Message.get(tool.state.publisherId, tool.state.streamName, params,
                        function(err, messages){
                            if (err) {
                                return Q.handle(state.onError, this, [err]);
                            }
                            tool.syncLivestreamsList(messages);
                            tool.create();
                        }
                    );
                });
                
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
            declareStreamEventHandlers: function() {
                var tool = this;
                tool.livestreamStream.onMessage("Streams/livestream/start").set(function (stream, message) {
                    tool.syncLivestreamsList([message]);
                    tool.videoTabsTool.syncVideoTabsList.apply(tool);
                }, tool);
                tool.livestreamStream.onMessage("Streams/livestream/stop").set(function (stream, message) {
                    tool.syncLivestreamsList([message]);
                    tool.videoTabsTool.syncVideoTabsList.apply(tool);
                }, tool);
            },
            create: function () {
                var tool = this;
                var toolContainer = document.createElement('DIV');
                toolContainer.className = 'streams-livestream-container';

                var toolContainerInner = document.createElement('DIV');
                toolContainerInner.className = 'streams-livestream-container-inner';
                toolContainer.appendChild(toolContainerInner);

                var livestreamingTabsCon = document.createElement('DIV');
                livestreamingTabsCon.className = 'streams-livestream-video-tabs-con';
                toolContainerInner.appendChild(livestreamingTabsCon);

                var livestreamingTabsTool = tool.videoContainerTabsEl = document.createElement('DIV');
                livestreamingTabsTool.className = 'streams-livestream-video-tabs-tool';
                livestreamingTabsCon.appendChild(livestreamingTabsTool);

                tool.videoTabsTool.syncVideoTabsList.apply(tool);

                var livestreamVideoCon = document.createElement('DIV');
                livestreamVideoCon.className = 'streams-livestream-video-con';
                toolContainerInner.appendChild(livestreamVideoCon);

                var livestreamVideoInner = tool.videoContainerEl = document.createElement('DIV');
                livestreamVideoInner.className = 'streams-livestream-video-inner';
                livestreamVideoCon.appendChild(livestreamVideoInner);

                var livestreamParticipantsCon = document.createElement('DIV');
                livestreamParticipantsCon.className = 'streams-livestream-participants-con';
                toolContainerInner.appendChild(livestreamParticipantsCon);

                var livestreamParticipantsTool = document.createElement('DIV');
                livestreamParticipantsTool.className = 'streams-livestream-participants-tool';
                livestreamParticipantsCon.appendChild(livestreamParticipantsTool);

                console.log('tool.publicChatStream', tool.publicChatStream.fields)
                Q.activate(
                    Q.Tool.setUpElement(livestreamParticipantsTool, 'Streams/participants', {
                        publisherId: tool.publicChatStream.fields.publisherId,
                        streamName: tool.publicChatStream.fields.name,
                        invite: true,
                        showBlanks: true,
                        showSummary: false
                    }),
                    {},
                    function () {}
                );

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

                var publicTab;
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
                    if(parseInt(i) == 0) {
                        publicTab = livestreamChatTabsItem;
                    }
                }

                var livestreamChatToolCon = document.createElement('DIV');
                livestreamChatToolCon.className = 'streams-livestream-chat-tool-con';
                livestreamChatInner.appendChild(livestreamChatToolCon);
                tool.textChatContainerEl = livestreamChatToolCon;

                tool.element.appendChild(toolContainer);

                if(publicTab) publicTab.click();
            
            },
            syncLivestreamsList: function (messages) {
                var tool = this;
                console.log('syncLivestreamsList', messages);
                let livestreamMessages = [];
                for (let key in messages) {
                    if (messages.hasOwnProperty(key)) {
                        livestreamMessages.push(messages[key]);
                    }
                }

                //group messages by livestream id in instructions
                let livestreams = livestreamMessages.reduce(function(livestreams, item) {
                    console.log('item', item);
                    let id = item.getInstruction('id');
                    const livestream = (livestreams[id] || []);
                    livestream.push(item);
                    livestreams[id] = livestream;
                    return livestreams;
                }, {});

                console.log('syncLivestreamsList livestreams', livestreams);

                //if one group has 2 messages ("start" and "stop"), then livestream ended, otherwise - active
                for (let key in livestreams) {
                    if (livestreams.hasOwnProperty(key)) {
                        let startMessage = livestreams[key][0];
                        let instructions = JSON.parse(startMessage.instructions)

                        let livestreamingExists = null;
                        for(let a in tool.activeLivestreamings) {
                            let activeStreamData = tool.activeLivestreamings[a];
                            console.log('syncLivestreamsList livestreams active', activeStreamData.id, instructions.id);

                            if(activeStreamData.id == instructions.id) {
                                livestreamingExists = activeStreamData;
                                break;
                            }
                        }
                        for(let n in tool.inactiveLivestreamings) {
                            let inactiveStreamData = tool.inactiveLivestreamings[n];
                            console.log('syncLivestreamsList livestreams inactive', inactiveStreamData.id, instructions.id);

                            if(inactiveStreamData.id == instructions.id) {
                                livestreamingExists = inactiveStreamData;
                                break;
                            }
                        }

                        let liveData;
                        if(livestreamingExists != null) {
                            liveData = livestreamingExists;
                            livestreamingExists.messages = livestreamingExists.messages.concat(livestreams[key]);
                            console.log('concat', livestreamingExists.messages, livestreams[key])
                        } else {
                            liveData = {
                                id:instructions.id,
                                linkToLive:instructions.linkToLive,
                                platform:instructions.platform,
                                messages:livestreams[key]
                            }
                        }
                        
                        if(liveData.messages.length == 1) {
                            console.log('syncLivestreamsList add as active', liveData)

                            tool.activeLivestreamings.push(liveData);
                        } else {
                            console.log('syncLivestreamsList add as INactive', liveData)
                            tool.inactiveLivestreamings.push(liveData);
                            if(livestreamingExists) {
                                for(let e = tool.activeLivestreamings.length - 1; e >= 0; e--) {
                                    if(tool.activeLivestreamings[e] == liveData) {
                                        tool.activeLivestreamings.splice(e, 1);
                                    }
                                }
                            }
                        }
                    }
                }

            },
            generateLivestreamVideo: function (livestreamData) {
                var src, title;
                if(livestreamData.platform == 'youtube') {
                    let liveVideoId = livestreamData.linkToLive.split("/").pop();
                    src = 'https://www.youtube.com/embed/' + liveVideoId;
                    title = 'Youtube video player';
                } else if(livestreamData.platform == 'twitch') {
                    let twitchChannelName = livestreamData.linkToLive.split("/").pop();
                    let parentDomain = location.origin.replace('https://', '');
                    src = 'https://player.twitch.tv/?channel=' + twitchChannelName + '&parent=' + parentDomain;
                    title = 'Twitch video player';
                }

                let iframeContainer = document.createElement('DIV');
                iframeContainer.className = 'streams-livestream-video-iframe-con';
                let iframe = document.createElement('IFRAME');
                iframe.src = src;
                iframe.title = title;
                iframe.width = '560';
                iframe.height = '315';
                iframe.frameborder = 0;
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
                iframe.setAttribute('allowfullscreen', '');
                iframeContainer.appendChild(iframe);

                return iframeContainer;
            },
            videoTabsTool: {
                tabs: [],
                syncVideoTabsList: function () {
                    var tool = this;
                    for(let i in tool.activeLivestreamings) {
                        let livestreamData = tool.activeLivestreamings[i];
    
                        let tabExists = false;
                        for (let t in tool.videoTabsTool.tabs) {
                            if( tool.videoTabsTool.tabs[t].livestreamData == livestreamData) {
                                tabExists = true;
                                break;
                            }
                        }
    
                        if(tabExists) continue;
    
                        let livestreamVideoTabsItem = document.createElement('DIV');
                        livestreamVideoTabsItem.className = 'streams-livestream-video-tabs-tool-tab streams-livestream-video-tabs-tool-tab-streaming streams-livestream-video-tabs-tool-tab-' + livestreamData.platform;
                        livestreamVideoTabsItem.dataset.tabName = livestreamData.id;
                        tool.videoContainerTabsEl.appendChild(livestreamVideoTabsItem);
                        let livestreamVideoTabsItemTitle = document.createElement('DIV');
                        livestreamVideoTabsItemTitle.className = 'streams-livestream-video-tabs-tool-tab-title';
                        livestreamVideoTabsItemTitle.innerHTML = livestreamData.platform;
                        livestreamVideoTabsItem.appendChild(livestreamVideoTabsItemTitle);
                        
                        let tabObject = {
                            title: livestreamData.platform,
                            key: livestreamData.id,
                            tabElement: livestreamVideoTabsItem,
                            active: true,
                            tabContent: tool.generateLivestreamVideo(livestreamData),
                            livestreamData: livestreamData
                        }
    
                        tool.videoTabsTool.tabs.push(tabObject);
    
                        livestreamVideoTabsItem.addEventListener('click', function (e) {
                            tool.videoTabsTool.tabHandler.bind(tool)(e);
                        });
                    }
    
                    for(let i in tool.inactiveLivestreamings) {
                        let livestreamData = tool.inactiveLivestreamings[i];
    
                        let tabExists = null;
                        for (let t in tool.videoTabsTool.tabs) {
                            if(tool.videoTabsTool.tabs[t].livestreamData == livestreamData) {
                                tabExists = tool.videoTabsTool.tabs[t];
                                break;
                            }
                        }
    
                        if(tabExists != null && tabExists.active == false) {
                            continue;
                        } else if(tabExists != null && tabExists.active == true) {
                            tabExists.active = false;
                            tool.videoContainerTabsEl.appendChild(tabExists.tabElement);
                            tabExists.tabElement.classList.remove('streams-livestream-video-tabs-tool-tab-streaming');
                        } else {
                            let livestreamVideoTabsItem = document.createElement('DIV');
                            livestreamVideoTabsItem.className = 'streams-livestream-video-tabs-tool-tab streams-livestream-video-tabs-tool-tab-' + livestreamData.platform;
                            livestreamVideoTabsItem.dataset.tabName = livestreamData.id;
                            tool.videoContainerTabsEl.appendChild(livestreamVideoTabsItem);
                            let livestreamVideoTabsItemTitle = document.createElement('DIV');
                            livestreamVideoTabsItemTitle.className = 'streams-livestream-video-tabs-tool-tab-title';
                            livestreamVideoTabsItemTitle.innerHTML = livestreamData.platform;
                            livestreamVideoTabsItem.appendChild(livestreamVideoTabsItemTitle);
                            
                            let tabObject = {
                                title: livestreamData.platform,
                                key: livestreamData.id,
                                tabElement: livestreamVideoTabsItem,
                                active: true,
                                tabContent: tool.generateLivestreamVideo(livestreamData),
                                livestreamData: livestreamData
                            }
        
                            tool.videoTabsTool.tabs.push(tabObject);
        
                            livestreamVideoTabsItem.addEventListener('click', function (e) {
                                tool.videoTabsTool.tabHandler.bind(tool)(e);
                            });
                        }
                    }
                },
                tabHandler: function(e) {
                    var tool = this;

                    console.log('videoTabsTool: tabHandler', this, e);
                    var clickedTabName = e.currentTarget.dataset.tabName;
                    console.log('videoTabsTool: tabHandler clickedTabName', clickedTabName);

                    var clickedTabObject = null;
                    for (let i in tool.videoTabsTool.tabs) {
                        let tab = tool.videoTabsTool.tabs[i];

                        console.log('videoTabsTool: tabHandler for tab', tab);
                        if (tab.key != clickedTabName) {
                            tab.tabElement.classList.remove('streams-livestream-video-tabs-tool-tab-active')
                        }
                        if (tab.key == clickedTabName && !tab.tabElement.classList.contains('streams-livestream-video-tabs-tool-tab-active')) {
                            tab.tabElement.classList.add('streams-livestream-video-tabs-tool-tab-active')
                        }
                        if (tab.key == clickedTabName) {
                            clickedTabObject = tab;
                        }
                    }
                    console.log('videoTabsTool: tabHandler clickedTabObject',clickedTabObject);

                    if(!clickedTabObject) return;

                    tool.videoContainerEl.innerHTML = '';
                    if(clickedTabObject.tabContent) {
                        tool.videoContainerEl.appendChild(clickedTabObject.tabContent)
                    }
    
                }
            },
            chatTabsTool: {
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
                        tool.textChatContainerEl.innerHTML = '';
                        if(clickedTabObject.tabContent) {
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
                                        publisherId: tool.publicChatStream.fields.publisherId,
                                        streamName: tool.publicChatStream.fields.name
                                    }
                                )
                                ,
                                {},
                                function () {}
                            );
                        }                        
                    } else if(clickedTabName == 'private') {
                        tool.textChatContainerEl.innerHTML = '';
                        if(clickedTabObject.tabContent) {
                            tool.textChatContainerEl.appendChild(clickedTabObject.tabContent)
                        } else {

                            function activateChat(stream) {
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
                            }

                            if(tool.privateChatStream) {
                                activateChat(tool.privateChatStream);
                            } else {
                                Q.Streams.create({
                                    publisherId: Q.Users.loggedInUserId(),
                                    type: 'Streams/chat',
                                    title: Q.Users.loggedInUser.displayName ? Q.Users.loggedInUser.displayName : 'Private chat',
                                    readLevel: 0,
                                    writeLevel: 0,
                                    adminLevel: 0
                                }, function (err) {
                                    if (err) {
                                        console.error(err);
                                        return;
                                    }
    
                                    var stream = this;
    
                                    stream.relateTo('Streams/webrtc/livestream/chat', tool.state.publisherId, tool.state.streamName, function() {                
                                        activateChat(stream);
                                    })
                                }/*, {
                                    publisherId: tool.state.publisherId,
                                    streamName: tool.state.streamName,
                                    type: 'Streams/webrtc/livestream/chat'
                                }*/);
                            }
                            
                            
                        }        
                    }
    
                }
            },            
        }

    );

})(window.jQuery, window);