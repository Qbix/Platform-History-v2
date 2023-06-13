(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * Adjusts the font size of the context text until it fills the element's width and height
 * @class Q textfill
 * @constructor
 * @param {Object} [options] options object that contains function parameters
 *   @param {Number} [options.maxFontPixels] Maximum size of text font,
 *   set this if your text container is large and you don't want to have extra large text on page
 *   @param {Number} [options.minFontPixels] Minimum size of text font,
 *   @param {Number} [options.maxLines=null] Maximum number of lines,
 *   set this if you'd like to have a maximum number of lines.
 *   @param {boolean} [options.refreshOnLayout=true] Whether to refresh the textfill on any layout change that affects its container
 *   @param {boolean} [options.fillPadding=false] Whether to have the text extend into the padding as well
 *   @param {boolean} [options.fillParent=false] Whether we should fit the parent of this element instead
 */
Q.Tool.jQuery('Q/textfill',

	function _Q_textfill(options) {

		var $this = $(this);
		$this.plugin('Q/textfill', 'refresh', options);
		
		if (options.refreshOnLayout) {
			$this.state('Q/textfill').layoutEventKey
			= Q.onLayout(this[0]).set(function () {
				$this.plugin('Q/textfill', 'refresh');
			});
		}

	},

	{
		maxFontPixels: 30,
		minFontPixels: 10,
		refreshOnLayout: true,
		maxLines: null
	},

	{
		refresh: function (options) {
			var o = Q.extend({}, this.state('Q/textfill'), options);
			var ourElement, ourText = "";
			this.children(':visible').each(function () {
				var $t = $(this);
				if ($t.text().length > ourText.length) {
					ourElement = $t;
					ourText = $t.text();
				}
			});
			if (!ourElement) {
				ourElement = this;
			}
			var $this = $(this);
			var fontSize = o.maxFontPixels || ($this.height() + 10);
			var lastGoodFontSize = 0, lastBadFontSize = fontSize, jump;
			var $c = o.fillParent ? $this.parent() : $this;
			if (!$c) {
				return false; // it's not part of the DOM yet
			}
			var maxHeight = Math.round(o.fillPadding ? $c.innerHeight() : $c.height());
			var maxWidth = Math.round(o.fillPadding ? $c.innerWidth() : $c.width());
			var textHeight, textWidth, lines, tooBig;
			ourElement.addClass('Q_textfill_resizing');
			for (var i=0; i<100; ++i) {
				ourElement.css('font-size', fontSize + 'px');
				textHeight = Math.round(ourElement.outerHeight(true));
				textWidth = Math.round(ourElement.outerWidth(true));
				if (o.maxLines) {
					lines = textHeight / Math.floor(fontSize * 1.5);
				}
				tooBig = (textHeight > maxHeight || textWidth > maxWidth
					|| (o.maxLines && lines > o.maxLines))
				if (tooBig) {
					lastBadFontSize = fontSize;
					jump = (lastGoodFontSize - fontSize) / 2;
				} else {
					lastGoodFontSize = fontSize;
					jump = (lastBadFontSize - fontSize) / 2
				}
				if (Math.abs(jump) < 1) {
					break;
				}
				fontSize = Math.floor(fontSize + jump);
				if (fontSize < 3) {
					lastGoodFontSize = 3;
					break; // container is super small
				}
			}
			lastGoodFontSize = Math.max(o.minFontPixels, lastGoodFontSize);
			ourElement.add(this).css('font-size', lastGoodFontSize + 'px');
			ourElement.removeClass('Q_textfill_resizing').addClass('Q_textfill_resized');
			return this;
		},
		
		remove: function () {
			Q.onLayout(this[0]).remove(this.state('Q/textfill').layoutEventKey);
		}
	}

);

})(Q, Q.$, window, document);