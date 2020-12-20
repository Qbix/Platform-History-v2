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
                    startWith: {video: true, audio: true},
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

})(Q, Q.$, window);