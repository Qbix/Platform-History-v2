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
            state.parentClipTool = options.parentClipTool;
            var pipe = new Q.pipe(["style", "text", "stream"], function () {
                if (tool.stream.testWriteLevel("edit")) {
                    state.isAdmin = true;
                    tool.settings();
                } else {
                    state.parentClipTool.stream.onMessage("Media/webrtc/guest").set(function (stream, message) {
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
                                    });
                                }
                            } else {

                            }
                        } else {
                            if(instructions.userId == Q.Users.loggedInUserId()) {
                                if(state.waitingRoom != null) {
                                    state.waitingRoom.stop();
                                }
                            } else {

                            }
                        }

                    }, tool);
                    tool.call();
                }
            });

            Streams.get.force(state.publisherId, state.streamName, function (err) {
                var msg = Q.firstErrorMessage(err);
                if (msg) {
                    return Q.alert(msg);
                }

                // join every user to allow get messages
                this.join();

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
            relationType: "Streams/calls"
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
                            var $callsRelated = $(".Streams_calls_related", parentElement);
                            $callsRelated.tool("Streams/related", {
                                publisherId: state.publisherId,
                                streamName: state.streamName,
                                relationType: state.relationType,
                                editable: false,
                                closeable: true,
                                sortable: false,
                                realtime: true
                            }).activate();
                            $callsRelated[0].forEachTool("Streams/webrtc/preview", function () {
                                this.state.onRender.add(function () {
                                    $(".Streams_preview_title", this.element).html(tool.text.calls.WaitingRoom);
                                });
                            });

                            $("button[name=update]", parentElement).on(Q.Pointer.fastclick, function () {
                                var maxCalls = parseInt($select.val());
                                var maxRelations = tool.stream.getAttribute("maxRelations") || {};
                                var oldMaxCalls = parseInt(Q.getObject(state.relationType, maxRelations));

                                if (maxCalls !== oldMaxCalls) {
                                    maxRelations[state.relationType] = maxCalls;
                                    tool.stream.setAttribute("maxRelations", maxRelations).save();
                                }
                            });

                            parentElement.forEachTool("Streams/webrtc/preview", function () {
						var previewTool = this;
                        this.state.parentClipTool = state.parentClipTool;
                        this.state.mainWebrtcRoom = state.parentClipTool.state.mainWebrtcRoom;
                        this.state.mainWebrtcStream = state.parentClipTool.state.webrtcStream;
                                this.state.onWebRTCRoomEnded.set(function () {
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
                                }, tool);
                            }, tool);
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
                var $clipToolElement = $(state.parentClipTool.element);
                var $hostsParticipants = $(".Media_clip_hosts_participants", $clipToolElement);
                $toolElement.addClass("Streams_calls_call").on(Q.Pointer.fastclick, function () {
                    Q.prompt(null, function (content) {
                        if (!content) {
                            return;
                        }

                        console.log('call state', state, state.relationType );

                        state.waitingRoom = Streams.WebRTC.start({
                            element: $hostsParticipants[0],
                            publisherId: state.publisherId,
                            streamName: state.streamName,
                            relationType: state.relationType,
                            content: content,
                            resumeClosed: false,
                            useExisting: false,
                            tool: tool
                        });
                    }, {
                        title: tool.text.calls.CallReasonTitle,
                        noClose: false
                    });
                });
            }
        });

    Q.Template.set("Streams/calls/settings",
        '<div class="Streams_calls_related"></div>' +
        '<label>{{text.MaxCalls}}</label><select name="maxCalls"></select>' +
        '<button class="Q_button" name="update">{{text.Update}}</button>'
    );

})(Q, Q.$, window);