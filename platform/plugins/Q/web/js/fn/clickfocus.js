(function (Q, $, window, document, undefined) {

/**
 * Plugin clickfocus
 * @method clickfocus
 * @param {Object} [options] options for clickfocus plugin
 * @param {Boolean} [options.scroll=Q.info.isTouchscreen] 
 * @param {Boolean} [options.scrollTopMargin=80] Number of pixels from the top
 * @param {Number} [options.timeout] milliseconds before one more attempt to fous
 * @default 100
*/

Q.Tool.jQuery("Q/clickfocus",

function _Q_clickfocus(o) {
	var $this = this;
	var prevScrollTop = Q.Pointer.scrollTop();
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
		// $this[0].scrollIntoView();
		var scrollTop = $this[0].getBoundingClientRect().top
		 	- $p[0].getBoundingClientRect().top
		 	- o.scrollTopMargin;
		// do it again after keyboard appears, in case the OS shifted things
		var autoScrolled = prevScrollTop - Q.Pointer.scrollTop();
		$p.scrollTop(scrollTop - autoScrolled);
	}
	if ($this.is('input, textarea, select')) {
		$this.focus();
		$this.click();
	}
	$this.focus();
	setTimeout(function () {
		$this.focus();
	}, o.timeout);
	return $this;
},

{
	scroll: Q.info.isTouchscreen,
	scrollTopMargin: 80,
	timeout: 100
}

);

})(Q, jQuery, window, document);