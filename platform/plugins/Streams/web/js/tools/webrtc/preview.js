(function (Q, $, window, undefined) {

    /**
     * Streams/webrtc/preview tool.
     * Renders a tool to preview Streams/webrtc
     * @class Streams/webrtc/preview
     * @constructor
     * @param {Object} [options] options to pass besides the ones to Streams/preview tool
     * @param {Q.Event} [options.onWebRTCRoomCreated]
     * @param {Q.Event} [options.onWebrtcControlsCreated]
     * @param {Q.Event} [options.onWebRTCRoomEnded]
     * @param {Q.Event} [options.onRender] called when tool element completely rendered
     */
    Q.Tool.define("Streams/webrtc/preview", ["Streams/preview"], function _Streams_webrtc_preview (options, preview) {
            console.log('center: Streams/webrtc/preview', this);

            var tool = this;
            this.state = Q.extend({}, this.state, options);
            console.log('center: Streams/webrtc/preview2', this.state);

            var state = this.state;
            tool.preview = preview;

            preview.state.editable = state.editable;

            //preview.state.creatable.preprocess = tool.composer.bind(this);

            Q.addStylesheet('{{Streams}}/css/tools/previews.css', { slotName: 'Streams' });

            Q.Text.get('Streams/content', function (err, text) {
                var msg = Q.firstErrorMessage(err);
                if (msg) {
                    return console.warn(msg);
                }

                tool.text = text;
                preview.state.onRefresh.add(tool.refresh.bind(tool));
            });

            this.preview.state.beforeClose = function (wasRemoved) {
                let previewTool = this;
                tool.stream.post({
                    type: 'Streams/webrtc/forceDisconnect',
                    content: JSON.stringify({
                        userId:  tool.stream.fields.publisherId
                    }),
                }, function () {
                    if (tool.state.mainWebrtcRoom && tool.state.mainWebrtcRoom.isActive()) {
                        tool.state.guestWaitingRoom.switchTo(state.mainRoomStream.fields.publisherId, state.mainRoomStream.fields.name, {
                            resumeClosed: true
                        }).then(function () {
                            previewTool.delete();
                        });
                    } else {
                        if(tool.state.guestWaitingRoom) tool.state.guestWaitingRoom.stop();
                        previewTool.delete();
                    }
                })

            };

            tool.refresh();


        },

        {
            editable: false,
            mainRoomStream: null,
            templates: {
                view: {
                    name: 'Streams/webrtc/preview/view',
                    fields: { alt: 'icon', titleClass: '', titleTag: 'h3' }
                }
            },
            onWebRTCRoomCreated: new Q.Event(),
            onWebrtcControlsCreated: new Q.Event(),
            onWebRTCRoomEnded: new Q.Event(),
            onRender: new Q.Event()
        },

        {
            refresh: function (stream) {
                var tool = this;
                var state = this.state;
                var $toolElement = $(tool.element);

                if (!Q.Streams.isStream(stream)) {
                    return;
                }

                stream.observe();

                //stream of user's waiting webrtc room
                tool.stream = stream;

                // retain with stream
                Q.Streams.retainWith(tool).get(stream.fields.publisherId, stream.fields.name);

                var preamble = Q.getObject('webtc.preview.Meeting', tool.text) || 'Meeting';
                var duration = "";
                if (stream.getAttribute("endTime")) {
                    var durationArr = Q.displayDuration(parseInt(stream.getAttribute("endTime")) - parseInt(stream.getAttribute("startTime"))).split(":");
                    for (var i=durationArr.length-1; i>=0; i--) {
                        duration = durationArr[i] + " " + (["sec", "min", "h"][durationArr.length - (i + 1)]) + " " + duration;
                    }
                    preamble = Q.getObject('webtc.preview.MeetingEnded', tool.text) || 'Meeting ended';
                }

                var fields = Q.extend({}, state.templates.view.fields, {
                    publisherId: stream.fields.publisherId,
                    streamName: stream.fields.name,
                    alt: 'icon',
                    title: stream.fields.title,
                    content: stream.fields.content,
                    duration: duration,
                    preamble: preamble
                });

                console.log('preview: fields', fields, stream);


                if(state.mainRoomStream == null) return;

                console.log('preview: renderTool', state.mainRoomStream.fields.publisherId, state.mainRoomStream.fields.name);
                Q.Template.render(
                    'Streams/webrtc/preview/view',
                    fields,
                    function (err, html) {
                        if (err) return;
                        tool.element.innerHTML = html;
                        Q.activate(tool, function () {
                            // load the icon
                            // TODO: make this use flexbox instead
                            var jq = tool.$('img.Streams_preview_icon');
                            tool.preview.icon(jq[0], null);
                            /*var $pc = tool.$('.Streams_preview_contents');
                            if ($pc.parent().is(":visible")) {
                                $pc.width(0).width($pc[0].remainingWidth());
                            }
                            Q.onLayout(tool.element).set(function () {
                                var $pc = tool.$('.Streams_preview_contents');
                                if ($pc.parent().is(':visible')) {
                                    $pc.width(0).width($pc[0].remainingWidth());
                                }
                            }, tool);*/
                            Q.handle(state.onRender, tool);
                        });
                    },
                    state.templates.view
                );

                var titleContainer = tool.element.querySelector('.Streams_preview_title');
                var aboutContainer = tool.element.querySelector('.Streams_preview_about');
                var previewMediaContainer = tool.element.querySelector('.Streams_preview_media_container');
                var praticipantsContainer = tool.element.querySelector('.Streams_preview_participants');
                var callButton = tool.$('.Streams_preview_call_button');
                var switchBackButton = tool.$('.Streams_preview_switch_back_button');
                var acceptButton = tool.$('.Streams_preview_accept_button');
                var holdButton = tool.$('.Streams_preview_hold_button');

                acceptButton.on(Q.Pointer.fastclick, function () {
                    Q.req('Streams/calls', 'manage', function () {
                        acceptButton.css('display', 'none');
                        switchBackButton.css('display', 'none');
                        acceptButton.css('display', 'none');
                        callButton.css('display', 'none');

                        if(tool.state.mainWebrtcRoom == null || !tool.state.mainWebrtcRoom.isActive()) {
                            if(tool.state.guestWaitingRoom) tool.state.guestWaitingRoom.stop();
                            tool.preview.delete();

                        } else if (tool.state.mainWebrtcRoom && tool.state.mainWebrtcRoom.isActive()) {
                            tool.state.guestWaitingRoom.switchTo(state.mainRoomStream.fields.publisherId, state.mainRoomStream.fields.name, {
                                resumeClosed: true
                            }).then(function () {
                                tool.preview.delete();
                                moveVisualizationToMainContainer();
                            });
                        } else {
                            if(tool.state.guestWaitingRoom) tool.state.guestWaitingRoom.stop();
                        }

                        tool.stream.post({
                            type: 'Streams/calls/interviewing',
                            content: 'ended',
                        })

                    }, {
                        fields: {
                            action: 'join',
                            userId: fields.publisherId,
                            webrtcStreamPublisher: state.mainRoomStream.fields.publisherId,
                            webrtcStreamName: state.mainRoomStream.fields.name,
                            eventsStreamPublisher: state.eventsStream.fields.publisherId,
                            eventsStreamName: state.eventsStream.fields.name,
                        }
                    })

                });

                callButton.on(Q.Pointer.fastclick, function () {

                    if(tool.state.mainWebrtcRoom != null && tool.state.mainWebrtcRoom.isActive()) {
                        tool.state.mainWebrtcRoom.switchTo( stream.fields.publisherId, stream.fields.name.split('/').pop(), {
                            resumeClosed: false
                        }).then(function () {
                            tool.state.guestWaitingRoom = tool.state.mainWebrtcRoom;
                            //tool.state.mainWebrtcRoom = null;

                            moveVisualizationToPreview();
                            //praticipantsContainer.style.display = 'none';
                            callButton.css('display', 'none');
                            holdButton.css('display', 'flex');
                            switchBackButton.css('display', 'flex');

                            tool.stream.post({
                                type: 'Streams/calls/interviewing',
                                content: 'started',
                            })
                            Q.handle(state.onWebRTCRoomCreated, tool, [tool.state.mainWebrtcRoom]);
                        });

                    } else {
                        console.log('previewMediaContainer', previewMediaContainer);
                        var WebConference = Q.Streams.WebRTC();
                        tool.state.guestWaitingRoom = WebConference.start({
                            element: previewMediaContainer,
                            roomId: stream.fields.name.split('/').pop(),
                            roomPublisherId: stream.fields.publisherId,
                            mode: 'node',
                            startWith: {video: false, audio: true},
                            defaultDesktopViewMode: 'audio',
                            defaultMobileViewMode: 'audio',
                            onWebRTCRoomCreated: function() {
                                callButton.css('display', 'none');
                                switchBackButton.css('display', 'flex');
                                holdButton.css('display', 'flex');
                                moveVisualizationToPreview();
                                Q.handle(state.onWebRTCRoomCreated, tool, [tool.state.waitingtWebRTCRoom]);
                            },
                            onWebrtcControlsCreated: function() {
                                Q.handle(state.onWebrtcControlsCreated, tool, [tool.state.waitingtWebRTCRoom]);
                            },
                            onWebRTCRoomEnded: function () {
                                Q.handle(state.onWebRTCRoomEnded, tool, [tool.state.waitingtWebRTCRoom]);
                            }
                        });
                    }


                });
                switchBackButton.on(Q.Pointer.fastclick, function () {
                    tool.stream.post({
                        type: 'Streams/webrtc/forceDisconnect',
                        content: JSON.stringify({
                            userId: fields.publisherId
                        }),
                    }, function () {
                        if (tool.state.mainWebrtcRoom && tool.state.mainWebrtcRoom.isActive()) {
                            tool.state.guestWaitingRoom.switchTo(state.mainRoomStream.fields.publisherId, state.mainRoomStream.fields.name, {
                                resumeClosed: true
                            }).then(function () {
                                acceptButton.css('display', 'none');
                                switchBackButton.css('display', 'none');

                                tool.preview.delete();
                                moveVisualizationToMainContainer();
                            });
                        } else {
                            acceptButton.css('display', 'none');
                            switchBackButton.css('display', 'none');
                            if(tool.state.guestWaitingRoom) tool.state.guestWaitingRoom.stop();
                            tool.preview.delete();


                        }
                    })

                });


                holdButton.on(Q.Pointer.fastclick, function () {
                    if (tool.state.mainWebrtcRoom && tool.state.mainWebrtcRoom.isActive()) {
                        tool.state.guestWaitingRoom.switchTo(state.mainRoomStream.fields.publisherId, state.mainRoomStream.fields.name, {
                            resumeClosed: true
                        }).then(function () {
                            switchBackButton.css('display', 'none');
                            holdButton.css('display', 'none');
                            acceptButton.css('display', '');
                            callButton.css('display', '');

                            moveVisualizationToMainContainer();
                        });
                    } else {
                        if(tool.state.guestWaitingRoom) tool.state.guestWaitingRoom.stop();
                        previewMediaContainer.style.display = 'none';
                        aboutContainer.style.display = '';
                        switchBackButton.css('display', 'none');
                        holdButton.css('display', 'none');
                        acceptButton.css('display', '');
                        callButton.css('display', '');

                    }
                });

                function moveVisualizationToPreview() {
                    console.log('moveVisualizationToPreview');
                    let currentMediaContainer = tool.state.guestWaitingRoom.roomsMediaContainer();
                    if(currentMediaContainer) {
                        previewMediaContainer.appendChild(currentMediaContainer)
                        previewMediaContainer.style.display = 'block';
                        aboutContainer.style.display = 'none';
                    }
                }
                function moveVisualizationToMainContainer() {
                    console.log('moveVisualizationToMainContainer');
                    let mediaContainerOfMainRoom = tool.state.guestWaitingRoom.options().element;
                    let currentMediaContainer = tool.state.guestWaitingRoom.roomsMediaContainer();
                    if(currentMediaContainer && mediaContainerOfMainRoom) {
                        mediaContainerOfMainRoom.appendChild(currentMediaContainer)
                        previewMediaContainer.style.display = 'none';
                        aboutContainer.style.display = '';
                    }
                }

                tool.stream.onMessage("Streams/calls/interviewing").set(function (stream, message) {
                    console.log('PREVIEW stream interview msg:', message)
                    let byUserId = message.byUserId;
                    if(message.content == 'started') {
                        if (tool.isHost(byUserId) && byUserId != Q.Users.loggedInUserId()) {
                            titleContainer.innerHTML = 'Currently is interviewed by another host';
                        }
                    } else {
                        if (tool.isHost(byUserId) && byUserId != Q.Users.loggedInUserId()) {
                            titleContainer.innerHTML = tool.text.calls.WaitingRoom;
                        }
                    }
                }, tool);

            },
            isHost: function (userId) {
                if(!this.state.hostsUsers) return false;
                return this.state.hostsUsers.includes(userId);
            },

        });

    Q.Template.set('Streams/webrtc/preview/view',
        '<div class="Streams_preview_container Streams_preview_view Q_clearfix">'
        + '<img alt="{{alt}}" class="Streams_preview_icon">'
        + '<div class="Streams_preview_contents {{titleClass}}">'
        + '<{{titleTag}} class="Streams_preview_preamble">{{preamble}} <span class="Streams_webrtc_duration">{{duration}}</span></{{titleTag}}>'
        + '<{{titleTag}} class="Streams_preview_title">{{title}}</{{titleTag}}>'
        + '<div class="Streams_preview_content">'
        + '<div class="Streams_preview_about"><div class="Streams_preview_about_avatar">{{&tool "Users/avatar" userId=publisherId}}</div><div class="Streams_chat_bubble"><div class="Streams_chat_tick"></div><div class="Streams_chat_message">{{content}}</div></div></div>'
        + '<div class="Streams_preview_body">'
        + '<div class="Streams_preview_media_container" style="display: none;"></div>'
        + '<div class="Streams_preview_participants" style="display: none;">{{&tool "Streams/participants" "" publisherId=publisherId streamName=streamName maxShow=10 invite=false hideIfNoParticipants=true showSummary=false}}</div>'
        + '<div class="Streams_preview_call_control">'
        + '<div class="Streams_preview_call_control_call">'
        + '<div class="Streams_preview_call_button">Interview</div>'
        + '<div class="Streams_preview_switch_back_button">End Call</div>'
        + '<div class="Streams_preview_hold_button">Hold</div>'
        + '</div>'
        + '<div class="Streams_preview_call_control_allow">'
        + '<div class="Streams_preview_accept_button">Accept The Call</div>'
        + '</div>'
        + '</div></div></div></div>'
    );

})(Q, Q.$, window);