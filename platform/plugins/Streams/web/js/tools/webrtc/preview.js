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
            console.log('WebRTC preview');

            var tool = this;
            this.state = Q.extend({}, this.state, options);

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
                tool.preview.state.onRefresh.add(tool.refresh.bind(tool));
            });

            this.preview.state.beforeClose = function (wasRemoved) {
                let previewTool = this;
                tool.stream.post({
                    type: 'Streams/webrtc/forceDisconnect',
                    content: JSON.stringify({
                        userId:  tool.stream.fields.publisherId
                    }),
                }, function () {
                    if (tool.state.mainWebrtcRoom && tool.state.mainWebrtcRoom.isActive() && tool.state.guestWaitingRoom) {
                        tool.state.guestWaitingRoom.switchTo(state.mainRoomStream.fields.publisherId, state.mainRoomStream.fields.name, {
                            resumeClosed: true
                        }).then(function () {
                            Q.handle(state.onRoomSwitch, tool, ['main']);
                            previewTool.delete();
                            tool.state.guestWaitingRoom = null;
                        });
                    } else {
                        if(tool.state.guestWaitingRoom) tool.state.guestWaitingRoom.stop();
                        previewTool.delete();
                    }
                })

            };

            console.log('WebRTC preview 2');
            //tool.refresh();


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
            onRender: new Q.Event(),
            onRoomSwitch: new Q.Event()
        },

        {
            refresh: function (stream) {
                var tool = this;
                var state = this.state;
                var $toolElement = $(tool.element);

                console.log('WebRTC preview refresh 1', stream, tool.state);
                if (!Q.Streams.isStream(stream)) {
                    return;
                }
                console.log('WebRTC preview refresh 2');

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

                var tzOffset = new Date().getTimezoneOffset();
                var updatedTimeTs= new Date(stream.fields.insertedTime).getTime() / 1000;
                var time = Math.sign(tzOffset) == -1 ? updatedTimeTs + (Math.abs(tzOffset) * 60) : updatedTimeTs - (Math.abs(tzOffset) * 60);
                var fields = Q.extend({}, state.templates.view.fields, {
                    publisherId: stream.fields.publisherId,
                    streamName: stream.fields.name,
                    alt: 'icon',
                    title: stream.fields.title,
                    content: stream.fields.content,
                    time:time,
                    duration: duration,
                    preamble: preamble,
                    text: tool.text
                });

                console.log('preview: fields', fields, stream);

                console.log('preview: renderTool');
                Q.Template.render(
                    'Streams/webrtc/preview/view',
                    fields,
                    function (err, html) {
                        if (err) {
                            console.error(err);
                            return;
                        }
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

                var titleContainer = tool.element.querySelector('.Streams_preview_title_text');
                var aboutContainer = tool.element.querySelector('.Streams_preview_about');
                var previewMediaContainer = tool.element.querySelector('.Streams_preview_media_container');
                var praticipantsContainer = tool.element.querySelector('.Streams_preview_participants');
                var callButton = tool.element.querySelector('.Streams_preview_call_button');
                var switchBackButton = tool.element.querySelector('.Streams_preview_switch_back_button');
                var acceptButton = tool.element.querySelector('.Streams_preview_accept_button');
                var holdButton = tool.element.querySelector('.Streams_preview_hold_button');
                var approveButton = tool.element.querySelector('.Streams_preview_approve_button');

                acceptButton.addEventListener('click', function () {
                    Q.req('Streams/calls', 'manage', function () {
                        acceptButton.style.display = 'none';
                        switchBackButton.style.display = 'none';
                        callButton.style.display = 'none';
                        holdButton.style.display = 'none';
                        approveButton.style.display = 'none';

                        if(tool.state.mainWebrtcRoom == null || !tool.state.mainWebrtcRoom.isActive()) {
                            if(tool.state.guestWaitingRoom) tool.state.guestWaitingRoom.stop();
                            tool.preview.delete();

                        } else if (tool.state.mainWebrtcRoom && tool.state.mainWebrtcRoom.isActive() && tool.state.guestWaitingRoom) {
                            tool.state.guestWaitingRoom.switchTo(state.mainRoomStream.fields.publisherId, state.mainRoomStream.fields.name, {
                                resumeClosed: true
                            }).then(function () {
                                tool.preview.delete();
                                moveVisualizationToMainContainer();
                                tool.state.guestWaitingRoom = null;
                                Q.handle(state.onRoomSwitch, tool, ['main']);
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

                callButton.addEventListener('click', function () {

                    console.log('callButton', tool.state.mainWebrtcRoom);
                    if(tool.state.mainWebrtcRoom != null && tool.state.mainWebrtcRoom.isActive()) {
                        tool.state.mainWebrtcRoom.switchTo( stream.fields.publisherId, stream.fields.name.split('/').pop(), {
                            resumeClosed: false
                        }).then(function () {
                            tool.state.guestWaitingRoom = tool.state.mainWebrtcRoom;
                            //tool.state.mainWebrtcRoom = null;

                            Q.handle(state.onRoomSwitch, tool, ['waiting']);
                            moveVisualizationToPreview();
                            //praticipantsContainer.style.display = 'none';
                            callButton.style.display = 'none';
                            holdButton.style.display = 'flex';
                            switchBackButton.style.display = 'flex';

                            tool.stream.post({
                                type: 'Streams/calls/interviewing',
                                content: 'started',
                            })
                            Q.handle(state.onWebRTCRoomCreated, tool, [tool.state.mainWebrtcRoom]);
                            Q.handle(state.onRoomSwitch, tool, ['waiting']);
                        });

                    } else {
                        console.log('previewMediaContainer', previewMediaContainer);
                        var WebConference = Q.Streams.WebRTC({
                            element: previewMediaContainer,
                            audioOnlyMode: true,
                            roomId: stream.fields.name.split('/').pop(),
                            roomPublisherId: stream.fields.publisherId,
                            mode: 'node',
                            startWith: {video: false, audio: true},
                            defaultDesktopViewMode: 'audio',
                            defaultMobileViewMode: 'audio',
                            onWebRTCRoomCreated: function() {
                                callButton.style.display = 'none';
                                switchBackButton.style.display = 'flex';
                                holdButton.style.display = 'flex';
                                moveVisualizationToPreview();
                                Q.handle(state.onWebRTCRoomCreated, tool, [tool.state.waitingtWebRTCRoom]);
                                Q.handle(state.onRoomSwitch, tool, ['waiting']);
                            },
                            onWebrtcControlsCreated: function() {
                                Q.handle(state.onWebrtcControlsCreated, tool, [tool.state.waitingtWebRTCRoom]);
                            },
                            onWebRTCRoomEnded: function () {
                                Q.handle(state.onRoomSwitch, tool, ['none']);
                                Q.handle(state.onWebRTCRoomEnded, tool, [tool.state.waitingtWebRTCRoom]);
                                tool.state.guestWaitingRoom = null;
                            }
                        });
                        tool.state.guestWaitingRoom = WebConference.start();
                    }


                });
                switchBackButton.addEventListener('click', function () {
                    tool.stream.post({
                        type: 'Streams/webrtc/forceDisconnect',
                        content: JSON.stringify({
                            userId: fields.publisherId
                        }),
                    }, function () {
                        if (tool.state.mainWebrtcRoom && tool.state.mainWebrtcRoom.isActive() && tool.state.guestWaitingRoom) {
                            tool.state.guestWaitingRoom.switchTo(state.mainRoomStream.fields.publisherId, state.mainRoomStream.fields.name, {
                                resumeClosed: true
                            }).then(function () {
                                acceptButton.style.display = 'none';
                                switchBackButton.style.display = 'none';

                                tool.preview.delete();
                                moveVisualizationToMainContainer();
                                tool.state.guestWaitingRoom = null;
                                Q.handle(state.onRoomSwitch, tool, ['main']);
                            });
                        } else {
                            acceptButton.style.display = 'none';
                            switchBackButton.style.display = 'none';
                            if(tool.state.guestWaitingRoom) tool.state.guestWaitingRoom.stop();
                            tool.preview.delete();


                        }
                    })

                });


                holdButton.addEventListener('click', function () {
                    if (tool.state.mainWebrtcRoom && tool.state.mainWebrtcRoom.isActive() && tool.state.guestWaitingRoom) {
                        tool.state.guestWaitingRoom.switchTo(state.mainRoomStream.fields.publisherId, state.mainRoomStream.fields.name, {
                            resumeClosed: true
                        }).then(function () {
                            switchBackButton.style.display = 'none';
                            holdButton.style.display = 'none';
                            acceptButton.style.display = '';
                            callButton.style.display = '';

                            if(tool.state.guestWaitingRoom.screenRendering.getActiveViewMode() == 'audio') moveVisualizationToMainContainer();
                            tool.stream.post({
                                type: 'Streams/calls/interviewing',
                                content: 'ended',
                            })
                            tool.state.guestWaitingRoom = null;
                            Q.handle(state.onRoomSwitch, tool, ['main']);
                        });
                    } else {
                        if(tool.state.guestWaitingRoom) tool.state.guestWaitingRoom.stop();
                        previewMediaContainer.style.display = 'none';
                        aboutContainer.style.display = '';
                        switchBackButton.style.display = 'none';
                        holdButton.style.display = 'none';
                        acceptButton.style.display = '';
                        callButton.style.display = '';

                    }
                });

                approveButton.addEventListener('click', function () {
                    Q.req('Streams/calls', 'approveCall', function (err, response) {

                        console.log('approveeeeeeee', response);
                        if(response.slots.approveCall == 'approve') {
                            tool.state.approved = true;
                            approveButton.innerHTML = 'Approved';
                        } else {
                            tool.state.approved = false;
                            approveButton.innerHTML = 'Mark Approved';
                        }

                        tool.stream.post({
                            type: 'Streams/approved',
                            content: 'true',
                        })

                    }, {
                        fields: {
                            action: tool.state.approved == true ? 'disapprove' : 'approve',
                            webrtcStreamPublisher: tool.stream.fields.publisherId,
                            webrtcStreamName: tool.stream.fields.name
                        }
                    })
                });

                updatePreview();

                function moveVisualizationToPreview() {
                    console.log('moveVisualizationToPreview');
                    let currentMediaContainer = tool.state.guestWaitingRoom.roomsMediaContainer();
                    console.log('moveVisualizationToPreview', currentMediaContainer, previewMediaContainer);

                    if(currentMediaContainer) {
                        previewMediaContainer.appendChild(currentMediaContainer)
                        previewMediaContainer.style.display = 'block';
                        aboutContainer.style.display = 'none';
                    }
                }
                function moveVisualizationToMainContainer() {
                    console.log('moveVisualizationToMainContainer');
                    let mediaContainerOfMainRoom = tool.state.guestWaitingRoom.getOptions().element;
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
                            titleContainer.innerHTML = tool.text.calls.interviewedByAnotherHost;
                        }
                    } else {
                        if (tool.isHost(byUserId) && byUserId != Q.Users.loggedInUserId()) {
                            titleContainer.innerHTML = tool.text.calls.WaitingRoom;
                        }
                    }
                });

                tool.stream.onMessage("Streams/join").set(function (stream, message) {
                    console.log('PREVIEW stream JOIN event:', message)
                    let byUserId = message.byUserId;
                    updateTitle();
                });

                tool.stream.onMessage("Streams/leave").set(function (stream, message) {
                    console.log('PREVIEW stream LEAVE event:', message)
                    let byUserId = message.byUserId;
                    updateTitle();
                });

                tool.stream.onMessage("Streams/changed").set(function (stream, message) {
                    console.log('PREVIEW stream CHANGED event:', message)
                    let byUserId = message.byUserId;
                    updatePreview(true);
                });

                function updatePreview(reload) {
                    var updateUI = function(stream) {
                        let currentlyApproved = tool.state.approved = stream.getAttribute('approved') == 'true' ? true : false;
                        if(currentlyApproved == true) {
                            approveButton.innerHTML = 'Approved';
                            if(!approveButton.classList.contains('Streams_preview_approve_button_approved')) approveButton.classList.add('Streams_preview_approve_button_approved');

                        } else {
                            approveButton.innerHTML = 'Mark Approved';
                            if(approveButton.classList.contains('Streams_preview_approve_button_approved')) approveButton.classList.remove('Streams_preview_approve_button_approved');
                        }
                    }
                    if(reload) {
                        Q.Streams.get(tool.stream.fields.publisherId, tool.stream.fields.name, function (err, stream) {
                            var msg = Q.firstErrorMessage(err);
                            if (msg) {
                                return console.warn(msg);
                            }

                            //tool.stream = stream;
                           updateUI(stream);

                        });
                        return;
                    }
                    updateUI(tool.stream);
                }

                function updateTitle() {
                    Q.req('Streams/calls', 'callParticipants', function (err, response) {
                        var msg = Q.firstErrorMessage(err, response && response.errors);

                        if (msg) {
                            return console.warn(msg);
                        }
                        console.log('callParticipants', response.slots.callParticipants);
                        console.log('callParticipants2', Object.keys(response.slots.callParticipants));
                        var participantsIds = Object.keys(response.slots.callParticipants);
                        for (let i in participantsIds) {
                            console.log('tool.isHost(participantsIds[i])',tool.isHost(participantsIds[i]), participantsIds[i] == Q.Users.loggedInUserId())
                            if ((tool.isHost(participantsIds[i]) || tool.isScreener(participantsIds[i])) && participantsIds[i] != Q.Users.loggedInUserId()) {
                                titleContainer.innerHTML = 'Currently is interviewed by another host';
                                return;
                            }
                        }
                        titleContainer.innerHTML = tool.text.calls.WaitingRoom;

                    }, {
                        fields: {
                            webrtcStreamPublisher: tool.stream.fields.publisherId,
                            webrtcStreamName: tool.stream.fields.name
                        }
                    })
                }
                updateTitle();
            },
            isHost: function (userId) {
                if(!this.state.hostsUsers) return false;
                return this.state.hostsUsers.includes(userId);
            },
            isScreener: function (userId) {
                if(!this.state.screenersUsers) return false;
                return this.state.screenersUsers.includes(userId);
            }

        });

    Q.Template.set('Streams/webrtc/preview/view',
        '<div class="Streams_preview_container Streams_preview_view Q_clearfix">'
        + '<img alt="{{alt}}" class="Streams_preview_icon">'
        + '<div class="Streams_preview_contents {{titleClass}}">'
        + '<{{titleTag}} class="Streams_preview_preamble">{{preamble}} <span class="Streams_webrtc_duration">{{duration}}</span></{{titleTag}}>'
        + '<{{titleTag}} class="Streams_preview_title"><span class="Streams_preview_title_text">{{title}}</span><span class="Streams_preview_titme">{{&tool "Q/timestamp" time=time}}</span></{{titleTag}}>'
        + '<div class="Streams_preview_content">'
        + '<div class="Streams_preview_about"><div class="Streams_preview_about_avatar">{{&tool "Users/avatar" userId=publisherId}}</div><div class="Streams_chat_bubble"><div class="Streams_chat_tick"></div><div class="Streams_chat_message">{{content}}</div></div></div>'
        + '<div class="Streams_preview_body">'
        + '<div class="Streams_preview_media_container" style="display: none;"></div>'
        + '<div class="Streams_preview_participants" style="display: none;">{{&tool "Streams/participants" "" publisherId=publisherId streamName=streamName maxShow=10 invite=false hideIfNoParticipants=true showSummary=false}}</div>'
        + '<div class="Streams_preview_call_control">'
        + '<div class="Streams_preview_call_control_call">'
        + '<div class="Streams_preview_approve_button">{{text.calls.markApproved}}</div>'
        + '<div class="Streams_preview_call_button">{{text.calls.interview}}</div>'
        + '<div class="Streams_preview_switch_back_button">{{text.calls.endCall}}</div>'
        + '<div class="Streams_preview_hold_button">{{text.calls.putOnHold}}</div>'
        + '</div>'
        + '<div class="Streams_preview_call_control_allow">'
        + '<div class="Streams_preview_accept_button">{{text.calls.bringToLive}}</div>'
        + '</div>'
        + '</div></div></div></div>'
    );

})(Q, Q.$, window);