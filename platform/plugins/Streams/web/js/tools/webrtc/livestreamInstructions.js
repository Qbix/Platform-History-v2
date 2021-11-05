(function ($, window, undefined) {

    /**
     * Streams/livestreamInstructions tool.
     *
     * @module Streams
     * @class Streams livestreamInstructions
     * @constructor
     * @param {Object} options
     *  Hash of possible options
     */
    Q.Tool.define("Streams/webrtc/livestreamInstructions", function(options) {

            this.state = Q.extend({}, this.state, options);

            this.create();
        },

        {

        },

        {
            create: function() {
                var tool = this;
                Q.addStylesheet('{{Streams}}/css/tools/livestreamInstructions.css');
                Q.Text.get("Streams/livestreamInstructions", function (err, livestreamInstructions) {
                    var youtubeLiveImg = Q.url('{{Streams}}/img/livestreamInstructions/youtube_live.png');
                    var fbLiveImg = Q.url('{{Streams}}/img/livestreamInstructions/fb_live.png');
                    var rtmpLiveImg = Q.url('{{Streams}}/img/livestreamInstructions/rtmp_live.png');
                    var rtmpFbLiveImg = Q.url('{{Streams}}/img/livestreamInstructions/rtmp_fb_live.png');

                    var youtubeContent = livestreamInstructions.youtube.interpolate({
                        youtubeLive: '<img src="' + youtubeLiveImg + '" />',
                        rtmpLive: '<img src="' + rtmpLiveImg + '" />'
                    });

                    var tabsCon = document.createElement('DIV');
                    tabsCon.className = 'livestream-instructions-tool-content'
                    var youtubeCon = document.createElement('DIV');
                    youtubeCon.class = 'livestream-instructions-youtube';
                    tabsCon.appendChild(youtubeCon);



                    Q.activate(
                        Q.Tool.setUpElement(
                            youtubeCon,
                            'Q/expandable',
                            {
                                title: 'Youtube',
                                content: youtubeContent,
                            },
                            'Q_expandable_yt_live-instructions'

                        ),
                        {},
                        function () {

                        }
                    );


                    var facebookCon = document.createElement('DIV');
                    facebookCon.class = 'livestream-instructions-youtube';
                    tabsCon.appendChild(facebookCon);

                    var facebooContent = livestreamInstructions.facebook.interpolate({
                        facebookLive: '<img src="' + fbLiveImg + '" />',
                        rtmpLive: '<img src="' + rtmpFbLiveImg + '" />'
                    });
                    Q.activate(
                        Q.Tool.setUpElement(
                            facebookCon,
                            'Q/expandable',
                            {
                                title: 'Facebook',
                                content: facebooContent,
                            },
                            'Q_expandable_fb_live-instructions'
                        ),
                        {},
                        function () {

                        }
                    );

                    var toolIconCon = document.createElement('DIV');
                    toolIconCon.className = 'Streams_livestream_instructions-icon-con';
                    var toolIcon = document.createElement('DIV');
                    toolIcon.className = 'Streams_livestream_instructions-icon';
                    toolIcon.innerHTML = '?';
                    toolIconCon.appendChild(toolIcon);

                    toolIconCon.addEventListener('click', function () {
                        Q.Dialogs.push({
                            title: 'Livestream instructions',
                            className: 'Streams_livestream_instructions_dialogue',
                            content: tabsCon,
                            apply: false,
                            mask: false,
                            hidePrevious:true,
                            removeOnClose: true,
                            beforeClose: function() {


                            },
                            onClose:function () {

                            },
                        });
                    });

                    tool.element.appendChild(toolIconCon);


                })

            },
            get: function () {

            },
            refresh: function() {

            }
        }

    );

})(window.jQuery, window);