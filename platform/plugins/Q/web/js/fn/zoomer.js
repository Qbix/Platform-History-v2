(function (Q, $, window, document, undefined) {

    /**
     * Zoomer tool Generates an image and zooms it
     * @method zoomer
     * @param {Object} [options] this object contains properties for function
     *  @param {Number} [options.overlayWidth] Image Overlay Width
     *  @default 75
     *  @param {Number} [options.overlayHeight] Image Overlay Height
     *  @default 75
     *  @param {Number} [options.leftMargin] Image left margin
     *  @default 0.1
     *  @param {Number} [options.rightMargin] Image right Margin
     *  @default 0.1
     *  @param {Number} [options.topMargin] Image top Margin
     *  @default 0.1
     *  @param {Number} [options.bottomMargin] Image bottom Margin
     *  @default 0.1
     *  @param {Number} [options.zoomedWidth] Zooming width
     *  @default null
     *  @param {Number} [options.zoomedHeight] Zooming height
     *  @default null
     *  @param {Number} [options.widthRatio] Ratio for width on zooming
     *  @default 2
     *  @param {Number} [options.heightRatio] Ratio for height on zooming
     *  @default 2
     *  @param {String} [options.overlayClass] Class for Overlay styles
     *  @default "Q_zoomer"
     */

    Q.Tool.jQuery('Q/zoomer',

        function _Q_zoomer(o) {

            // they should all be images
            var $this = this;
            if (!$this.is('img')) {
                return;
            }

            var data = $this.data('Q/zoomer');
            if (data) {
                $this.off(Q.Pointer.move, data.onMouseMove);
                $this.off(Q.Pointer.leave, data.onMouseLeave);

                data.o_div.off(Q.Pointer.move, data.onZoomerMouseMove);
                data.o_div.off(Q.Pointer.leave, data.onZoomerMouseLeave);
                data.o_div.remove();
                $this.data('Q/zoomer', null);
            }

            var o_div = $('<div />')
                .css('position', 'absolute')
                .css('display', 'none')
                .css('overflow', 'hidden')
                .addClass('Q_zoomer')
                .addClass(o.overlayClass);
            var z_img = $('<img />')
                .css('position', 'absolute');
            if (o.zoomedWidth) {
                z_img.css('width', zoomedWidth);
            } else if (o.widthRatio) {
                z_img.width((o.widthRatio * $this.width()));
            }
            if (o.zoomedHeight) {
                z_img.css('height', zoomedHeight);
            } else if (o.heightRatio) {
                z_img.height((o.heightRatio * $this.height()));
            }
            z_img.attr('src', $this.attr('src'));
            if (o.overlayWidth) {
                o_div.width(o.overlayWidth);
            }
            if (o.overlayHeight) {
                o_div.height(o.overlayHeight);
            }

            function onMouseMove(e) {
                var offset = $this.offset();
                var iw = $this.width(); // not inner, because it's an img
                var ih = $this.height();
                var ow = o_div.width();
                var oh = o_div.height();
                var zw = z_img.width();
                var zh = z_img.height();
                var o_bw = o_div.css('borderWidth');
                var o_bh = o_div.css('borderHeight');

                var x = e.pageX - offset.left;
                var y = e.pageY - offset.top;
                var xf = x/iw;
                var yf = y/ih;
                xf = (xf - o.leftMargin) / (1 - o.rightMargin - o.leftMargin);
                yf = (yf - o.topMargin) / (1 - o.bottomMargin - o.topMargin);
                xf = Math.min(1, Math.max(0, xf));
                yf = Math.min(1, Math.max(0, yf));

                var o_left = offset.left + xf * (iw - ow);
                var o_top = offset.top + yf * (ih - oh);
                var z_left = offset.left + xf * (iw - zw) - o_left;
                var z_top = offset.top + yf * (ih - zh) - o_top;

                o_div.css('left', o_left+'px')
                    .css('top', o_top+'px');
                z_img.css('left', z_left+'px')
                    .css('top', z_top+'px');
                o_div.css('position', 'absolute');
                o_div.css('display', 'block');
            };

            function onMouseLeave(e) {
                var offset = $this.offset();
                if (e.pageX < offset.left
                    || e.pageY < offset.top
                    || e.pageX > offset.left + $this.width()
                    || e.pageY > offset.top + $this.height()) {
                    o_div.css('display', 'none');
                }
            };

            function onZoomerMouseMove(e) {
                var offset = $this.offset();
                if (e.pageX < offset.left
                    || e.pageY < offset.top
                    || e.pageX > offset.left + $this.width()
                    || e.pageY > offset.top + $this.height()) {
                    onMouseLeave(e);
                } else {
                    onMouseMove(e);
                }
            };
            var onZoomerMouseLeave = onZoomerMouseMove;

            //this.css('height', '200px');
            $this.on(Q.Pointer.move, onMouseMove);
            $this.on(Q.Pointer.leave, onMouseLeave);

            o_div.on(Q.Pointer.move, onZoomerMouseMove);
            o_div.on(Q.Pointer.leave, onZoomerMouseLeave);

            o_div.empty().append(z_img);
            o_div.appendTo('body');

            $this.data('Q/zoomer', {
                'onMouseMove': onMouseMove,
                'onMouseLeave': onMouseLeave,
                'onZoomerMouseMove': onZoomerMouseMove,
                'onZoomerMouseLeave': onZoomerMouseLeave,
                'o_div': o_div
            });

        },

        {
            "overlayWidth": 75,
            "overlayHeight": 75,
            "leftMargin": 0.1,
            "rightMargin": 0.1,
            "topMargin": 0.1,
            "bottomMargin": 0.1,
            "zoomedWidth": null,
            "zoomedHeight": null,
            "widthRatio": 2,
            "heightRatio": 2,
            "overlayClass": "Q_zoomer"
        },

        {
            remove: function () {
	            var data = $this.data('Q/zoomer');
	            if (data) {
		            $this.off(Q.Pointer.move, data.onMouseMove);
		            $this.off(Q.Pointer.leave, data.onMouseLeave);

		            data.o_div.off(Q.Pointer.move, data.onZoomerMouseMove);
		            data.o_div.off(Q.Pointer.leave, data.onZoomerMouseLeave);
		            data.o_div.remove();
		            $this.data('Q/zoomer', null);
	            }
            }
        }

    );

})(Q, jQuery, window, document);