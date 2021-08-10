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
                preview.state.onRefresh.add(tool.refresh.bind(tool));
            });

            tool.refresh();
        },

{
			editable: false,
			mainWebrtcStream: null,
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


            function getMainWebRTCStreams(callback) {
                if(!state.parentClipTool) return false;
                state.parentClipTool.stream.relatedTo(Q.Media.clip.webrtc.relations.main, function(){
                    if(callback) callback(this.relatedStreams);
                })
            }

            if(state.mainWebrtcStream != null) {
                renderTool(state.mainWebrtcStream.fields.publisherId, state.mainWebrtcStream.fields.name);
            } else {
                getMainWebRTCStreams(function (relatedStreams) {
                    var keys = Object.keys(relatedStreams);
                    var stream = relatedStreams[keys[0]];
                    renderTool(stream.fields.publisherId, stream.fields.name);
                })
            }

            function renderTool(mainWebRTCStreamPublisher, mainWebRTCStreamName) {

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
                            var $pc = tool.$('.Streams_preview_contents');
                            if ($pc.parent().is(":visible")) {
                                $pc.width(0).width($pc[0].remainingWidth());
                            }
                            Q.onLayout(tool.element).set(function () {
                                var $pc = tool.$('.Streams_preview_contents');
                                if ($pc.parent().is(':visible')) {
                                    $pc.width(0).width($pc[0].remainingWidth());
                                }
                            }, tool);
                            Q.handle(state.onRender, tool);
                        });
                    },
                    state.templates.view
                );

                var callButton = tool.$('.Streams_preview_call_button');
                var switchBackButton = tool.$('.Streams_preview_switch_back_button');
                var acceptButton = tool.$('.Streams_preview_accept_button');
                var disconnectButton = tool.$('.Streams_preview_disconnect_button');

                function switchBack(accept) {
                    var forceDisconnect = function() {
                        tool.preview.delete();

                        Q.Streams.get(fields.publisherId, fields.streamName, function(err, stream) {
                            var guestWebrtcStream = this;
                            var msg;
                            if (msg = Q.firstErrorMessage(err)) {
                                alert(msg);
                            }
                            guestWebrtcStream.post({
                                type: 'Streams/webrtc/forceDisconnect',
                                content: JSON.stringify({
                                    userId: fields.publisherId
                                }),
                            })
                        })
                    }
                    if(tool.state.guestWaitingRoom == null) {
                        acceptButton.css('display', 'none');
                        switchBackButton.css('display', 'none');
                        if(accept != null) disconnectButton.css('display', 'flex');
                        if(accept == null) forceDisconnect();
                    } else if (tool.state.mainWebrtcRoom && tool.state.mainWebrtcRoom.currentConferenceLibInstance()) {
                        tool.state.guestWaitingRoom.switchTo(mainWebRTCStreamPublisher, mainWebRTCStreamName, function () {
                            acceptButton.css('display', 'none');
                            switchBackButton.css('display', 'none');

                            if(accept == null) forceDisconnect();
                        }, {
                            resumeClosed: true
                        });
                    } else {
                        tool.state.guestWaitingRoom.stop();
                    }


                }

                acceptButton.on(Q.Pointer.fastclick, function () {
                    Q.req('Media/live', 'manage', function () {
                       /* state.parentClipTool.stream.post({
                            type: 'Streams/webrtc/invite',
                            content: JSON.stringify({publisherId: mainWebRTCStreamPublisher, name: mainWebRTCStreamName, userId: stream.fields.publisherId}),
                        }, function() {
                            console.log('sent')
                        })*/

                        if(tool.state.guestWaitingRoom != null) {
                            switchBack(true);
                        }

                        acceptButton.css('display', 'none');
                        disconnectButton.css('display', 'flex');
                        callButton.css('display', 'none');
                    }, {
                        fields: {
                            action: 'join', userId: fields.publisherId
                        }
                    })

                });

                disconnectButton.on(Q.Pointer.fastclick, function () {
                    Q.Streams.get(mainWebRTCStreamPublisher, mainWebRTCStreamName, function() {
                        Q.req('Media/live', 'manage', function () {
                            tool.preview.delete();

                            tool.state.mainWebrtcStream.post({
                                type: 'Streams/webrtc/forceDisconnect',
                                content: JSON.stringify({
                                    publisherId: mainWebRTCStreamPublisher,
                                    name: mainWebRTCStreamName,
                                    userId: fields.publisherId,
                                    clipStreamPublisherId:tool.stream.fields.publisherId,
                                    clipStreamName:tool.stream.fields.name
                                }),
                            }, function() {

                                /* //acceptButton.css('display', 'flex');
                                 //disconnectButton.css('display', 'none');
                                 tool.preview.delete();*/

                            })

                        }, {
                            fields: {
                                action: 'leave', userId: fields.publisherId
                            }
                        })



                    })

                });



                callButton.on(Q.Pointer.fastclick, function () {

                    if(tool.state.mainWebrtcRoom == null || (tool.state.mainWebrtcRoom != null && tool.state.mainWebrtcRoom.currentConferenceLibInstance() == null)) {

                        var WebConference = Q.Streams.WebRTC();
                        tool.state.guestWaitingRoom = WebConference.start({
                            element: document.body,
                            roomId: stream.fields.name.split('/').pop(),
                            roomPublisherId: stream.fields.publisherId,
                            mode: 'node',
                            startWith: {video: false, audio: true},
                            onWebRTCRoomCreated: function() {
                                callButton.css('display', 'none');
                                switchBackButton.css('display', 'flex');
                                Q.handle(state.onWebRTCRoomCreated, tool, [tool.state.waitingtWebRTCRoom]);
                            },
                            onWebrtcControlsCreated: function() {
                                Q.handle(state.onWebrtcControlsCreated, tool, [tool.state.waitingtWebRTCRoom]);
                            },
                            onWebRTCRoomEnded: function () {
                                Q.handle(state.onWebRTCRoomEnded, tool, [tool.state.waitingtWebRTCRoom]);
                            }
                        });
                    } else {

                        tool.state.mainWebrtcRoom.switchTo( stream.fields.publisherId, stream.fields.name.split('/').pop(), function () {
                            tool.state.guestWaitingRoom = tool.state.mainWebrtcRoom;
                            //tool.state.mainWebrtcRoom = null;
                            callButton.css('display', 'none');
                            switchBackButton.css('display', 'flex');
                            Q.handle(state.onWebRTCRoomCreated, tool, [tool.state.mainWebrtcRoom]);
                        }, {
                            resumeClosed: true
                        });
                    }


                });
                switchBackButton.on(Q.Pointer.fastclick, function () {
                    switchBack();
                });
            }
        }
    });

Q.Template.set('Streams/webrtc/preview/view',
	'<div class="Streams_preview_container Streams_preview_view Q_clearfix">'
	+ '<img alt="{{alt}}" class="Streams_preview_icon">'
	+ '<div class="Streams_preview_contents {{titleClass}}">'
	+ '<{{titleTag}} class="Streams_preview_preamble">{{preamble}} <span class="Streams_webrtc_duration">{{duration}}</span></{{titleTag}}>'
	+ '<{{titleTag}} class="Streams_preview_title">{{title}}</{{titleTag}}>'
	+ '<div class="Streams_preview_content">{{content}}</div>'
	+ '<div class="Streams_preview_body">'
	+ '{{&tool "Streams/participants" "" publisherId=publisherId streamName=streamName maxShow=10 invite=false hideIfNoParticipants=true showSummary=false}}'
    + '<div class="Streams_preview_call_control">'
    + '<div class="Streams_preview_call_control_call">'
    + '<div class="Streams_preview_call_button">call</div>'
    + '<div class="Streams_preview_switch_back_button">end call</div>'
    + '</div>'
    + '<div class="Streams_preview_call_control_allow">'
    + '<div class="Streams_preview_accept_button">accept</div>'
    + '<div class="Streams_preview_disconnect_button">disconnect</div>'
    + '</div>'
    + '</div></div></div></div>'
);

})(Q, Q.$, window);