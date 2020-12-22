(function (Q, $, window, undefined) {

    /**
     * Streams/webrtc/preview tool.
     * Renders a tool to preview Streams/webrtc
     * @class Streams/webrtc/preview
     * @constructor
     * @param {Object} [options] options to pass besides the ones to Streams/preview tool
     */
    Q.Tool.define("Streams/webrtc/preview", ["Streams/preview"], function _Streams_webrtc_preview (options, preview) {
            var tool = this;
            var state = this.state;
            tool.preview = preview;
			
			preview.state.editable = false;

            //preview.state.creatable.preprocess = tool.composer.bind(this);

            //Q.addStylesheet('{{Streams}}/css/tools/webrtcPreview.css', { slotName: 'Streams' });

            Q.Text.get('Streams/content', function (err, text) {
                var msg = Q.firstErrorMessage(err);
                if (msg) {
                    return console.warn(msg);
                }

                tool.text = text;
                preview.state.onRefresh.add(tool.refresh.bind(tool));
            });
        },

        {
			templates: {
				view: {
					name: 'Streams/webrtc/preview/view',
					fields: { alt: 'icon', titleClass: '', titleTag: 'h3' }
				}
			}
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

			var fields = Q.extend({}, state.templates.view.fields, {
				alt: 'icon',
				title: stream.fields.title,
				preamble: Q.getObject('webtc.preview.preamble', tool.text) || 'Meeting'
			});
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

            setTimeout(function () {
                $toolElement.tool("Streams/preview", {
                    publisherId: state.publisherId,
                    streamName: state.streamName
                }).tool("Streams/default/preview").activate();
            }, 0);

            $toolElement.on(Q.Pointer.fastclick, function () {
                var WebConference = Q.Streams.WebRTC();
                WebConference.start({
                    element: document.body,
                    roomId: stream.fields.name.split('/').pop(),
                    roomPublisherId: stream.fields.publisherId,
                    mode: 'node',
                    startWith: {video: false, audio: true},
                    onWebRTCRoomCreated: function() {
                        console.log('onWebRTCRoomCreated', this);
                    },
                    onWebrtcControlsCreated: function() {
                        console.log('onWebrtcControlsCreated', this);
                    }
                });
            });
        }
    });
	
Q.Template.set('Streams/webrtc/preview/view',
	'<div class="Streams_preview_container Streams_preview_view Q_clearfix">'
	+ '<img alt="{{alt}}" class="Streams_preview_icon">'
	+ '<div class="Streams_preview_contents {{titleClass}}">'
	+ '<{{titleTag}} class="Streams_preview_preamble">{{preamble}}</{{titleTag}}'
	+ '<{{titleTag}} class="Streams_preview_title">{{title}}</{{titleTag}}>'
	+ '<div class="Streams_preview_file_size">{{size}}</div>'
	+ '</div></div>'
);

})(Q, Q.$, window);