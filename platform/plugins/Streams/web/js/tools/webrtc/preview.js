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
            console.log('main preview', options);
            var tool = this;
            this.state = Q.extend({}, this.state, options);

            var state = this.state;
            tool.preview = preview;

            Q.addStylesheet('{{Streams}}/css/tools/previews.css', { slotName: 'Streams' });

            Q.Text.get('Streams/content', function (err, text) {
                var msg = Q.firstErrorMessage(err);
                if (msg) {
                    return console.warn(msg);
                }

                tool.text = text;
                tool.preview.state.onRefresh.add(tool.refresh.bind(tool));
            });

            if(this.state.previewType == 'Streams/webrtc/preview/call') {
                $(tool.element).tool("Streams/webrtc/preview/call", {
                    publisherId: state.publisherId,
                    streamName: state.streamName,
                    relationType: state.relationType,
                    editable: false,
                    closeable: true,
                    sortable: false,
                    realtime: true,
                }).activate(function () {

                });
            } else {

            }


        },

        {

        },

        {
            refresh: function (stream) {

            }

        });

})(Q, Q.$, window);