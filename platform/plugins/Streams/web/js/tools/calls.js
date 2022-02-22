(function (Q, $, window, undefined) {

    var Streams = Q.Streams;
    var Users = Q.Users;

    /**
     * @module Streams-tools
     */

    /**
     * Renders an interface to handle Streams/calls
     * @class Streams calls
     * @constructor
     * @param {Object} [options] any options for the tool
     * @param {Q.Event} [options.maxCalls=0] Max calls can be related to this category
     * @param {Q.Event} [options.publisherId=Users.currentCommunityId] Publisher of Streams/calls/main stream
     * @param {Q.Event} [options.streamName=Streams/calls/main] Category stream name
     */
    Q.Tool.define("Streams/calls", function(options) {

            var tool = this;
            var state = this.state;
            console.log('center: Streams/calls', state);

            var pipe = new Q.pipe(["style", "text", "stream"], function () {
                if (tool.stream.testWriteLevel("edit")) {
                    state.isAdmin = true;
                    tool.initMainRoom();
                    tool.settings();
                } else {
                    tool.state.eventsStream.onMessage("Media/webrtc/guest").set(function (stream, message) {
                        let instructions = JSON.parse(message.instructions);

                        console.log('Media/webrtc/guest instructions', instructions)
                        console.log('instructions state.waitingRoom', state.waitingRoom)
                        if(instructions.joined) {
                            if(instructions.userId == Q.Users.loggedInUserId()) {
                                if(state.waitingRoom != null) {
                                    state.waitingRoom.switchTo(instructions.webrtcStream.publisherId, instructions.webrtcStream.name, {
                                        resumeClosed: true
                                    }).then(function () {
                                        state.waitingRoom = null;
                                        if(tool.subtitleEl != null) tool.subtitleEl.innerHTML = tool.text.calls.LiveRoom;
                                    });
                                }
                            } else {

                            }
                        } else {
                            if(instructions.userId == Q.Users.loggedInUserId()) {
                                if(state.waitingRoom != null) {
                                    state.waitingRoom.stop();
                                }
                                if(tool.subtitleEl != null) {
                                    tool.subtitleEl.innerHTML = '';
                                }
                            } else {

                            }
                        }

                    }, tool);
                    tool.call();
                }
            });

            console.log('center: Streams/calls: get stream', state.publisherId, state.streamName);

            Streams.get.force(state.publisherId, state.streamName, function (err) {
                var msg = Q.firstErrorMessage(err);
                if (msg) {
                    return Q.alert(msg);
                }

                // join every user to allow get messages
                this.join();
                console.log('center: Streams/calls: get stream stream', this);

                tool.stream = this;

                // check availability and also listen messages Streams/relation/[available, unavailable]
                var calls = Q.getObject(["relatedToTotals", state.relationType, "Streams/webrtc"], this) || 0;
                var maxCalls = tool.getMaxCalls();
                tool.available(calls < maxCalls);
                this.onMessage("Streams/relation/available").set(function (stream, message) {
                    tool.available(true);
                }, tool);
                this.onMessage("Streams/relation/unavailable").set(function (stream, message) {
                    tool.available(false);
                }, tool);

                pipe.fill("stream")();
            }, {
                withRelatedToTotals: [state.relationType]
            });

            Q.Text.get("Streams/content", function (err, content) {
                if (err) {
                    return;
                }

                tool.text = content;
                pipe.fill("text")();
            });
            Q.addStylesheet('{{Streams}}/css/tools/calls.css', { slotName: 'Streams' }, pipe.fill("style"));
        },

        {
            maxCalls: 0,
            publisherId: Users.currentCommunityId,
            streamName: "Streams/calls/main",
            relationType: "Streams/calls",
            onCallStart: new Q.Event(),
            onCallEnd: new Q.Event(),
            activeRoom: null, //main|waiting|null
            activePreview: null
        },

        {
            /**
             * Set tool status to available/unavailable
             * @method available
             * @params {boolean} state
             */
            available: function (state) {
                var $toolElement = $(this.element);

                // available/unavailable only for regular users
                if (this.stream.testWriteLevel("edit")) {
                    return;
                }

                if (state) {
                    $toolElement.removeClass("Q_disabled_2");
                    $toolElement.addClass("Q_pulsate");
                } else {
                    $toolElement.addClass("Q_disabled_2");
                    $toolElement.removeClass("Q_pulsate");
                }
            },
            /**
             * Get current max calls from stream attributes
             * @method getMaxCalls
             * @params {boolean} state
             */
            getMaxCalls: function () {
                console.log('getMaxCalls', this.stream);
                console.log('getMaxCalls2', this.state.relationType);
                return Q.getObject(this.state.relationType, this.stream.getAttribute("maxRelations")) || 0;
            },
            initMainRoom: function() {
                var tool = this;
                var mainRoomStream = tool.state.mainRoomConfig.mainRoomStream;
                var WebRTCClientUI = tool.state.mainWebrtcRoom = Streams.WebRTC.start({
                    element: tool.state.mainRoomConfig.mainRoomContainer,
                    roomPublisherId: mainRoomStream ? mainRoomStream.fields.publisherId : null,
                    roomId: mainRoomStream ? mainRoomStream.fields.name : null,
                    publisherId: tool.state.eventsStream.fields.publisherId,
                    streamName: tool.state.eventsStream.fields.name, /*"Streams/webrtc/live"*/
                    relationType: tool.state.eventsStreamRelationType,
                    resumeClosed: true,
                    onlyParticipantsAllowed: true,
                    useExisting: false,
                    tool: tool,
                    defaultDesktopViewMode: 'audio',
                    defaultMobileViewMode: 'audio',
                    writeLevel: 10,
                    onStart: function () {
                        tool.state.mainRoomConfig.mainRoomStream = this.roomStream();
                        //tool.state.mainWebrtcRoom = this;
                        tool.state.activeRoom = 'main';
                        Q.handle(tool.state.onCallStart, tool, [tool.state.mainWebrtcRoom]);
                    },
                    onEnd: function () {
                        tool.state.activeRoom = null;
                        Q.handle(tool.state.onCallEnd, tool);
                    }
                });

                WebRTCClientUI.screenRendering.layoutEvents.on('layoutRendered', function (e) {
                    /*console.log('EVENT LAYOUT');
                    let mediaContainer = WebRTCClientUI.roomsMediaContainer();
                    console.log('EVENT LAYOUT 2',mediaContainer);

                    if(!mediaContainer) return;
                    console.log('EVENT LAYOUT 3', e);

                    if(e.viewMode != 'audio') {
                        if(document.body.firstChild) document.body.insertBefore(mediaContainer, document.body.firstChild);
                        console.log('EVENT LAYOUT if1');

                    } else if(tool.state.activeRoom == 'main') {
                        console.log('EVENT LAYOUT if2');

                        tool.state.mainRoomConfig.mainRoomContainer.appendChild(mediaContainer);
                    } else if(tool.state.activeRoom == 'waiting') {
                        console.log('EVENT LAYOUT if3');

                        var activePreviewTool = tool.state.activePreview;
                        if(!activePreviewTool) return;
                        var previewMediaContainer = activePreviewTool.element.querySelector('.Streams_preview_media_container');
                        previewMediaContainer.appendChild(mediaContainer);
                    }*/
                })
                WebRTCClientUI.screenRendering.layoutEvents.on('audioScreenCreated', function (e) {
                    var platformId = e.participant.identity != null ? e.participant.identity.split('\t')[0] : null;

                    if(platformId == null || tool.isHost(platformId) || WebRTCClientUI.roomStream().fields.name != tool.state.mainRoomConfig.mainRoomStream.fields.name) return;

                    var endCallIcon = '<svg version="1.1"  style="max-width:100%;max-height:100%;"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/"    x="0px" y="0px" width="101px" height="101px" viewBox="-0.067 -0.378 101 101" enable-background="new -0.067 -0.378 101 101"    xml:space="preserve">  <defs>  </defs>  <path fill="#C12236" d="M50,0C22.431,0,0,22.43,0,50s22.429,49.999,50,49.999S100,77.57,100,50C100,22.431,77.57,0,50,0z"/>  <path fill="#FFFFFF" d="M47.346,33.809c-28.439,0.546-25.041,14.627-24.39,16.693c0.699,3.513,3.39,5.271,6.12,4.276l5.196-1.627   c2.8-1.021,4.576-4.83,3.965-8.509l-0.116-0.696c9.448-2.674,17.595-1.987,23.953-0.218l-0.052,0.297   c-0.608,3.679,1.166,7.489,3.968,8.511l5.194,2.164c2.349,0.857,4.666-0.793,5.714-3.43c0.014,0.012,0.021,0.021,0.021,0.021   s0.144-0.355,0.289-0.963c0.012-0.047,0.021-0.1,0.033-0.146c0.022-0.112,0.047-0.227,0.071-0.352   c0.015-0.07,0.031-0.137,0.045-0.209l-0.006-0.004C78.111,45.135,77.328,33.237,47.346,33.809z"/>  <path fill="#FFFFFF" d="M58.133,60.57l-5.492,2.169V50.023c0-0.242-0.196-0.439-0.438-0.439H47.8c-0.244,0-0.44,0.196-0.44,0.439   v12.714l-5.493-2.168c-0.183-0.074-0.395-0.013-0.514,0.143c-0.059,0.08-0.087,0.173-0.087,0.269c0,0.093,0.03,0.188,0.091,0.269   l8.295,10.787c0.083,0.11,0.213,0.174,0.35,0.174s0.267-0.064,0.349-0.174l8.296-10.787c0.121-0.162,0.121-0.377,0.001-0.535   C58.529,60.556,58.317,60.497,58.133,60.57z"/>  </svg>'
                    var  disconnectBtn = document.createElement('DIV');
                    disconnectBtn.style.position = 'absolute';
                    disconnectBtn.style.top = '0';
                    disconnectBtn.style.right = '-10px';
                    disconnectBtn.style.width = '30px';
                    disconnectBtn.style.height = '30px';
                    disconnectBtn.style.cursor = 'pointer';
                    disconnectBtn.style.zIndex = '99999';
                    disconnectBtn.innerHTML = endCallIcon;
                    e.audioScreen.screenEl.appendChild(disconnectBtn);

                    disconnectBtn.addEventListener('click', function () {
                        Q.req('Streams/calls', 'manage', function () {
                            //tool.preview.delete();
                            console.log('Streams/webrtc/forceDisconnect');
                            tool.state.mainRoomConfig.mainRoomStream.post({
                                type: 'Streams/webrtc/forceDisconnect',
                                content: JSON.stringify({
                                    publisherId: tool.state.mainRoomConfig.mainRoomStream.fields.publisherId,
                                    name: tool.state.mainRoomConfig.mainRoomStream.fields.name,
                                    immediate: true,
                                    userId: platformId,
                                }),
                            }, function() {

                                /* //acceptButton.css('display', 'flex');
                                 //disconnectButton.css('display', 'none');
                                 tool.preview.delete();*/

                            })

                        }, {
                            fields: {
                                action: 'leave', userId: platformId
                            }
                        })
                    })

                    WebRTCClientUI.events.on('beforeRoomSwitch', function (e) {
                        console.log('beforeRoomSwitch', e);
                        if(e.to.name == tool.state.mainRoomConfig.mainRoomStream.fields.name && e.to.publisherId == tool.state.mainRoomConfig.mainRoomStream.fields.publisherId) {
                            disconnectBtn.style.display = 'block';
                        } else {
                            disconnectBtn.style.display = 'none';
                        }
                    });
                })

                console.log('tool.callPreviewsElement', tool.callPreviewsElement);
                if(tool.callPreviewsElement != null) {
                    tool.callPreviewsElement.forEachTool("Streams/webrtc/preview", function () {
                        this.state.mainWebrtcRoom = tool.state.mainWebrtcRoom;
                    }, tool);
                }

                /*1. get last created webrtc stream that is related to clip tool and type of Q.Media.clip.webrtc.relations.main
                * 2. if this stream exists, create webrtc room based on this stream; if doesn't exist, new
                *    webrtc stream will be created
                * 3. relate existing/created webrtc stream to the stream of live show
                * */
            },
            /**
             * Implement settings UI for admins
             * @method settings
             */
            settings: function () {
                var tool = this;
                var state = tool.state;
                var $toolElement = $(tool.element);

                $toolElement.addClass("Streams_calls_settings").on(Q.Pointer.fastclick, function () {
                    Q.invoke({
                        title: tool.text.calls.SettingsTitle,
                        className: "Streams_calls_settings",
                        template: {
                            name: "Streams/calls/settings",
                            fields: {
                                text: tool.text.calls
                            }
                        },
                        trigger: $toolElement[0],
                        callback: function () {
                            // max calls select element
                            var $select = $("select[name=maxCalls]", parentElement);
                            for (var i = 1; i <= 100; i++) {
                                $select.append($("<option>" + i + "</option>"));
                            }
                            $select.val(tool.getMaxCalls());

                            // if opened in columns - third argument is a column element,
                            // if opened dialog - first argument is dialog element
                            var parentElement = arguments[2] instanceof HTMLElement ? arguments[2] : arguments[0];
                            tool.callPreviewsElement = parentElement;
                            var $callsRelated = $(".Streams_calls_related", parentElement);
                            var prevTool = $callsRelated.tool("Streams/related", {
                                publisherId: state.publisherId,
                                streamName: state.streamName,
                                relationType: state.relationType,
                                editable: false,
                                closeable: true,
                                sortable: false,
                                realtime: true,
                                foo:'bar'
                            }).activate();
                            console.log('previewTool', $callsRelated, Q.Tool.from(prevTool))
                            var relatedTool = Q.Tool.from(prevTool);
                            relatedTool.state.onUpdate.add(function () {
                                updateCallInfoForPreviews();
                            });

                            $("button[name=update]", parentElement).on(Q.Pointer.fastclick, function () {
                                var maxCalls = parseInt($select.val());
                                var maxRelations = tool.stream.getAttribute("Streams/maxRelations") || {};
                                var oldMaxCalls = parseInt(Q.getObject(state.relationType, maxRelations));

                                if (maxCalls !== oldMaxCalls) {
                                    maxRelations[state.relationType] = maxCalls;
                                    tool.stream.setAttribute("Streams/maxRelations", maxRelations).save();
                                }
                            });

                            function updateCallInfoForPreviews() {
                                console.log('updateCallInfoForPreviews')

                                parentElement.forEachTool("Streams/webrtc/preview", function () {
                                    console.log('updateCallInfoForPreviews for', this)

                                    var previewTool = this;
                                    this.state.mainWebrtcRoom = tool.state.mainWebrtcRoom;
                                    this.state.mainRoomStream = tool.state.mainRoomConfig.mainRoomStream;
                                    this.state.hostsUsers = tool.state.mainRoomConfig.hostsUsers;
                                    this.state.screenersUsers = tool.state.mainRoomConfig.screenersUsers;
                                    this.state.eventsStream = tool.state.eventsStream;
                                    this.state.onRoomSwitch = function (roomType) {
                                        console.log('onRoomSwitch', this, roomType)
                                        tool.state.activeRoom = roomType == 'none' ? null : roomType;
                                        tool.state.activePreview = roomType == 'none' ? null : this;
                                    };
                                    /*this.state.onWebRTCRoomEnded.set(function () {
                                        if (!state.isAdmin) {
                                            return;
                                        }

                                        Q.Streams.unrelate(
                                            state.publisherId,
                                            state.streamName,
                                            state.relationType,
                                            this.stream.fields.publisherId,
                                            this.stream.fields.name
                                        );
                                    }, tool);*/
                                }, tool);
                            }
                            updateCallInfoForPreviews();
                        }
                    });
                });
            },
            /**
             * Implement call UI for regular users
             * @method call
             */
            call: function () {
                var tool = this;
                var state = tool.state;
                var $toolElement = $(tool.element);
                $toolElement.addClass("Streams_calls_call").on(Q.Pointer.fastclick, function () {
                    Q.prompt(null, function (content) {
                        if (!content) {
                            return;
                        }

                        console.log('call state', state, state.relationType );
                        var subtitleEl = tool.subtitleEl  = document.createElement('DIV');
                        subtitleEl.innerHTML = tool.text.calls.WaitingRoom;
                        subtitleEl.style.position = 'absolute';
                        subtitleEl.style.top = '0';
                        subtitleEl.style.left = '0';
                        subtitleEl.style.padding = '5px';
                        var containerForMedia = document.createElement('DIV');
                        tool.state.mainRoomConfig.mainRoomContainer.innerHTML = '';
                        tool.state.mainRoomConfig.mainRoomContainer.appendChild(subtitleEl);
                        tool.state.mainRoomConfig.mainRoomContainer.appendChild(containerForMedia);
                        //start webrtc waiting room and relate it to Streams/calls/main so hosts can see new call
                        state.waitingRoom = Streams.WebRTC.start({
                            element: tool.state.mainRoomConfig.mainRoomContainer,
                            publisherId: state.publisherId,
                            streamName: state.streamName,
                            relationType: state.relationType,
                            description: content,
                            resumeClosed: false,
                            useExisting: false,
                            defaultDesktopViewMode: 'audio',
                            defaultMobileViewMode: 'audio',
                            tool: tool,
                            onStart: function () {
                                tool.state.activeRoom = 'waiting';
                                Q.handle(tool.state.onCallStart, tool, [this]);
                            },
                            onEnd: function () {
                                if(tool.subtitleEl != null) tool.subtitleEl.innerHTML = '';

                                tool.state.activeRoom = null;
                                Q.handle(tool.state.onCallEnd, tool);
                            }
                        });
                    }, {
                        title: tool.text.calls.CallReasonTitle,
                        noClose: false
                    });
                });
            },
            /**
             * Detect whether logged user is host
             * @method isHost
             */
            isHost: function (userId) {
                if(!this.state.mainRoomConfig || !this.state.mainRoomConfig.hostsUsers) return false;
                return this.state.mainRoomConfig.hostsUsers.includes(userId);
            },
        });

    Q.Template.set("Streams/calls/settings",
        '<div class="Streams_calls_related"></div>' +
        '<label>{{text.MaxCalls}}</label><select name="maxCalls"></select>' +
        '<button class="Q_button" name="update">{{text.Update}}</button>'
    );

})(Q, Q.$, window);