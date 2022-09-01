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
 *   @param {Number} [options.maxLines=null] Maximum number of lines,
 *   set this if you'd like to have a maximum number of lines.
 *   @param {boolean} [options.refreshOnLayout=true] Whether to refresh the textfill on any layout change that affects its container
 *   @param {boolean} [options.fillPadding=false] Whether to have the text extend into the padding as well
 */
Q.Tool.jQuery('Q/textfill',

	function _Q_textfill(options) {

		var $this = $(this);
		$this.plugin('Q/textfill', 'refresh', options);
		
		if (options.refreshOnLayout) {
			$this.state('Q/textfill').layoutEventKey
			= Q.onLayout(this[0]).set(function () {
				$this.plugin('Q/textfill', 'refresh', options);
			});
		}

	},

{
		maxFontSize: 30,
		minFontSize: 10,
		refreshOnLayout: true
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
				//var e = new Q.Error("Q/textfill missing a visible element inside the container");
				//console.warn(e);
				return false;
			}
			var $this = $(this);
			var fontSize = o.maxFontPixels || ($this.height() + 10);
			var maxHeight = Math.round(o.fillPadding ? $this.innerHeight() : $this.height());
			var maxWidth = Math.round(o.fillPadding ? $this.innerWidth() : $this.width());
			var textHeight, textWidth, lines, tooBig;
			ourElement.addClass('Q_textfill_resizing');
			while (fontSize > options.minFontSize) {
				ourElement.css('font-size', fontSize + 'px');
				textHeight = Math.round(ourElement.outerHeight(true));
				textWidth = Math.round(ourElement.outerWidth(true));
				if (o.maxLines) {
					lines = textHeight / Math.floor(fontSize * 1.5);
				}

				if (textHeight <= maxHeight && textWidth <= maxWidth) {
					if (o.maxLines) {
						if (lines <= o.maxLines) {
							break;
						}
					} else {
						break;
					}
				}

				fontSize = Math.floor(--fontSize);
			}
			if (fontSize > options.maxFontSize) {
				fontSize = options.maxFontSize;
			} else if (fontSize < options.minFontSize) {
				fontSize = options.minFontSize;
			}
			ourElement.add(this).css('font-size', fontSize + 'px');
			ourElement.removeClass('Q_textfill_resizing').addClass('Q_textfill_resized');
			return this;
		},
		
		remove: function () {
			Q.onLayout(this[0]).remove(this.state('Q/textfill').layoutEventKey);
		}
	}

);

})(Q, Q.$, window, document);