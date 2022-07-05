(function (Q, $, window, document, undefined) {

/**
 * Plugin clickfocus
 * @method clickfocus
 * @param {Object} [options] options for clickfocus plugin
 * @param {Boolean} [options.scroll] Set to true or false to override the iOS scrolling effect. The default is true only if (Q.info.isTouchscreen and the input is not in an overlay.)
 * @param {Boolean} [options.scrollTopMargin=80] Number of pixels from the top
 * @param {Number} [options.timeout] milliseconds before one more attempt to fous
 * @default 100
*/

Q.Tool.jQuery("Q/clickfocus",

function _Q_clickfocus(o) {
	var $this = this;
	var prevScrollTop = Q.Pointer.scrollTop();
	if (o.scroll == null) {
		o.scroll = Q.info.isTouchscreen && !$this.closest('.Q_overlay').length;
	}
	if (o.scroll) {
		var $p = $($this[0].scrollingParent());
		if ($p.outerHeight() < Q.Pointer.windowHeight()) {
			var $div = $('<div />').css({
				height: Q.Pointer.windowHeight()
			}).appendTo($p);
			$this.on('blur.clickfocus', function _Q_clickfocus_blur() {
				$div.remove();
			});
		}
		var scrollTop = $this[0].getBoundingClientRect().top
		 	- $p[0].getBoundingClientRect().top
		 	- o.scrollTopMargin;
		// do it again after keyboard appears, in case the OS shifted things
		var autoScrolled = prevScrollTop - Q.Pointer.scrollTop();
		$p.scrollTop(scrollTop - autoScrolled);
	}
	if ($this.is('input, textarea, select')) {
		if (!$this.attr('tabindex')) {
			$this.attr('tabindex', '-1');
		}
		$this.trigger("focus").trigger("click");
	}
	$this.focus();
	setTimeout(function () {
		$this.focus();
	}, o.timeout);
	return $this;
},

{
	scroll: null,
	scrollTopMargin: 80,
	timeout: 100
}

);

})(Q, Q.$, window, document);