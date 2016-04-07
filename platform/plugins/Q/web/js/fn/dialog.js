(function (Q, $, window, document, undefined) {

/**
 * This plugin Makes an overlay to show some content above the page.
 * Suitable for showing dialogs, for example.
 * This is replacement for jQuery Tools overlay, it has similar behavoir and API.
 * @method overlay
 * @param {Object} [options] options is an object of parameters
 * @param {Boolean} apply Optional. Set to true if the dialog should show the "apply" style button to close dialog
 * @param {String} [options.left='center'] left is a Horizontal position of the overlay, May have 'center' value to be centered horizontally or have a percentage or absolute (pixels) value of offset from the left border of 'alignParent'.
 * @param {String} [options.top='middle'] top is a Vertical position of the overlay. May have 'middle' value to be centered vertically or have a percentage or absolute (pixels) value of offset from the top border of 'alignParent'. Optional
 * @param {DOMElement} [options.alignParent] alignParent Can be DOM element, jQuery object or jQuery selector.
 * If provided overlay will be positioned relatively to that element. If null, overlay will be positioned considering window dimensions. Optional.
 * @param {Boolean} [options.mask=false] mask If true, mask behind the overlay will be shown, making it modal-like.
 * @param {Boolean} [options.noClose=false] noClose  If true, overlay close button will not appear and overlay won't be closed by pressing 'Esc' key.
 * @param {Boolean} [options.closeOnEsc=true] closeOnEsc Indicates whether to close overlay on 'Esc' key press. Has sense only if 'noClose' is false.
 * @param {Boolean} [options.fadeInOut=true] fadeInOut Indicates whether to use fadeIn() / fadeOut() animations when loading dialog.
 * Note: if set to false, 'onLoad' callback will be called synchronously with dialog load,
 * otherwise it will be called on fadeIn() animation completion.
 * @param {Object} [options.loadUrl={}] options to override for the call to Q.loadUrl
 * @param {Q.Event} [options.beforeLoad] beforeLoad Q.Event or function which is called before overlay is loaded (shown). Optional.
 * @param {Q.Event} [options.onLoad] onLoad  Q.Event or function which is called when overlay is loaded (shown). Optiona.
 * @param {Q.Event} [options.beforeClose] beforeClose Q.Event or function which is called when overlay closing initiated and it's still visible. Optional.
 * @param {Q.Event} [options.onClose] onClose Q.Event or function which is called when overlay is closed and hidden. Optional.
 */
Q.Tool.jQuery('Q/overlay',

function _Q_overlay(o) {
	function calculatePosition($this) {
		var width = $this.outerWidth(), height = $this.outerHeight();
		if (!width && $this.css('width'))
			width = parseInt($this.css('width'));
		if (!height && $this.css('height'))
			height = parseInt($this.css('height'));

		if (o.left == 'center') {
			var parentWidth = o.alignParent ? $(o.alignParent).width() : window.innerWidth;
			$this.css({ 'left': ((parentWidth - width) / 2) + 'px' });
		} else if (typeof(o.left) == 'string' && o.left.indexOf('%') != -1) {
			var percentage = parseInt(o.left) / 100;
			$this.css({ 'left': (o.alignParent ? $(o.alignParent).width() * percentage : window.innerWidth * percentage) + 'px' });
		} else {
			$this.css({ 'left': o.left + 'px' });
		}

		if (o.top == 'middle') {
			var parentHeight = o.alignParent ? $(o.alignParent).height() : window.innerHeight;
			$this.css({ 'top': ((parentHeight - height) / 2) + 'px' });
		} else if (typeof(o.top) == 'string' && o.top.indexOf('%') != -1) {
			percentage = parseInt(o.top) / 100;
			$this.css({ 'top': (o.alignParent ? $(o.alignParent).height() * percentage : Q.Pointer.scrollTop() + window.innerHeight * percentage) + 'px' });
		} else {
			$this.css({ 'top': Q.Pointer.scrollTop() + o.top + 'px' });
		}
	}

	var $this = this;
	$this.addClass('Q_overlay');
	$this.css('position', Q.info.platform === 'ios' ? 'absolute' : 'fixed');

	function closeThisOverlayOnEsc(e)
	{
		if (o.noClose || !o.closeOnEsc)
			return;
			
		if (e.keyCode == 27)
			$this.data('Q/overlay').close(e);
	}

	$this.data('Q/overlay', {
		options: o,
		load: function()
		{
			$this.data('Q/overlay').documentScrollTop = Q.Pointer.scrollTop();
			var $overlay = $this.data('Q/overlay');
			if ($this.css('display') == 'block') {
				return;
			}
			Q.handle($overlay.options.beforeLoad, $this, [$this]);
			calculatePosition($this);
			var $body = $('body');
			$overlay.bodyStyle = {
				left: $body.css('left'),
				top: $body.css('top')
			};
			var sl = Q.Pointer.scrollLeft();
			var st = Q.Pointer.scrollTop();
			$body.css({
				left: -sl + 'px',
				top: -st + 'px'
			}).addClass('Q_preventScroll');
			if ($overlay.options.fadeInOut)
			{
				$this.css('opacity', 0).show();
				Q.Animation.play(function (x, y) {
					$this.css('opacity', y);
					if (x === 1) {
						if (!$overlay.options.noClose && $overlay.options.closeOnEsc) {
							$(document).on('keydown', closeThisOverlayOnEsc);
						}
						Q.handle($overlay.options.onLoad, $this, [$this]);
					}
				}, o.fadeTime);
				if ($overlay.options.mask)
				{
					Q.Masks.show('Q.screen.mask', { 
						fadeTime: o.fadeTime,
						className: 'Q_dialog_mask'
					});
				}
			}
			else
			{
				$this.show();
				if ($overlay.options.mask)
				{
					Q.Masks.show('Q.screen.mask', { 'className': 'Q_screen_mask' });
				}
				if (!$overlay.options.noClose && $overlay.options.closeOnEsc) {
					$(document).on('keydown', closeThisOverlayOnEsc);
				}
				Q.handle($overlay.options.onLoad, $this, [$this]);
			}
		},
		close: function(e)
		{
			var $overlay = $this.data('Q/overlay');
			$('body').removeClass('Q_preventScroll').css($overlay.bodyStyle);
			$('html,body').scrollTop($this.data('Q/overlay').documentScrollTop);
			if (!$overlay.options.noClose) {
				$(document).off('keydown', closeThisOverlayOnEsc);
			}
			$this.find('input, select, textarea').trigger('blur');
			Q.handle($overlay.options.beforeClose, $this, [$this]);
			if ($overlay.options.fadeInOut)
			{
				Q.Animation.play(function (x, y) {
					if (x === 1) {
						$this.hide();
						Q.handle($overlay.options.onClose, $this, []);
					} else {
						$this.css('opacity', 1-y);
					}
				}, o.fadeTime);
				if ($overlay.options.mask)
				{
					Q.Masks.hide('Q.screen.mask');
				}
			}
			else
			{
				$this.hide();
				if ($overlay.options.mask)
				{
					Q.Masks.hide('Q.screen.mask');
				}
				Q.handle($overlay.options.onClose, $this, [$this]);
			}
			if (e) $.Event(e).preventDefault();
			Q.Pointer.stopHints($this[0]);
		}
	});

	if (!o.noClose)
	{
		var $close = $('<a class="Q_close" />');
		$this.append($close);
		$close.on(Q.Pointer.click, $this.data('Q/overlay').close);
	}
},


{
	'left': 'center',
	'top': 'middle',
	'alignParent': null,
	'applyIScroll': false,
	'mask': false,
	'noClose': false,
	'closeOnEsc': true,
	'fadeInOut': true,
	'fadeTime': 300,
	'apply': false,
	'beforeLoad': new Q.Event(),
	'onLoad': new Q.Event(),
	'beforeClose': new Q.Event(),
	'onClose': new Q.Event()
},

{
	load: function () {
		this.data('Q/overlay').load();
	},
	close: function () {
		this.data('Q/overlay').close();
	},
	remove: function () {
		this.each(function() {
			var $this = $(this);
			$this.find('a.close').remove();
			$this.removeClass('Q_overlay');
			$this.removeData('Q/overlay');
		});
	}
}

);

/**
 * Opens a dialog
 * @method Q/dialog
 * @param {Object} [options] A hash of options, that can include:
 *   @param {String} [options.url]  If provided, this url will be used to fetch the "title" and "dialog" slots, to display in the dialog.
 *   @optional
 *   @param {Boolean} [options.alignByParent=false] If true, the dialog will be aligned to the center of not the entire window, but to the center of containing element instead.
 *   @param {Boolean} [options.mask=true] If true, adds a mask to cover the screen behind the dialog.
 *   @param {Boolean} [options.fullscreen=true]
 *   Only on Android and false on all other platforms. If true, dialog will be shown not as overlay but instead will be prepended to document.body and all other child elements of the body will be hidden. Thus dialog will occupy all window space, but still will behave like regular dialog, i.e. it can be closed by clicking / tapping close icon.
 *   @param {Boolean} [options.asyncLoad=true]
 *   For desktop and false for touch devices. If true, dialog will load asynchronously with fade animation and 'onLoad' will be called when fade animation is completed. If false, dialog will appear immediately and 'onLoad' will be called at the same time.
 *   @param {Boolean} [options.noClose=false]
 *   If true, overlay close button will not appear and overlay won't be closed by pressing 'Esc' key.
 *   @param {Boolean} [options.closeOnEsc=true]
 *   Indicates whether to close dialog on 'Esc' key press. Has sense only if 'noClose' is false.
 *   @param {Boolean} [options.removeOnClose=false] If true, dialog DOM element will be removed from the document on close.
 *   @param {Q.Event} [options.beforeLoad]  Q.Event or function which is called before dialog is loaded.
 *   @param {Q.Event} [options.onActivate]  Q.Event or function which is called when dialog is activated (all inner tools, if any, are activated and dialog is fully loaded and shown).
 *   @optional
 *   @param {Q.Event} [options.beforeClose]  Q.Event or function which is called when dialog closing initiated but it's still visible and exists in DOM.
 *   @optional
 *   @param {Q.Event} [options.onClose]  Q.Event or function which is called when dialog is closed and hidden and probably removed from DOM (if 'removeOnClose' is 'true').
 *   @optional
 */
Q.Tool.jQuery('Q/dialog', function _Q_dialog (o) {
	
	var $this = this;
	var ots = $('.title_slot', $this);
	var ods = $('.dialog_slot', $this);
	if (!ots.length) {
		alert("Please add an element with the class 'title_slot' before calling dialog()");
		return;
	}
	if (!ods.length) {
		alert("Please add an element with the class 'dialog_slot' before calling dialog()");
		return;
	}
	
	if (!o.fullscreen) {
		var topPos = Q.Dialogs.options.topMargin;
		if (Q.info.isMobile) {
			if (topPos.indexOf('%') != -1) {
				topPos = parseInt(topPos) / 100 * window.innerHeight;
			}
			var noticeSlot = $('#notices_slot');
			if (noticeSlot.length && noticeSlot.outerHeight() >= topPos) {
				topPos += noticeSlot.outerHeight();
			}
		}

		$.fn.plugin.load('Q/iScroll');
		$this.plugin('Q/overlay', {
			top: topPos,
			mask: o.mask,
			noClose: o.noClose,
			beforeLoad: o.beforeLoad,
			onLoad: { "Q/dialog": function() {
				function _onLoadUrl() {
					Q.activate([ots, ods], {}, function() {
						_handlePosAndScroll.call($this, o);
						Q.handle(o.onActivate, $this, [$this]);
					});
				}
				if (o.url) {
					_loadUrl.call($this, o, _onLoadUrl);
				} else {
					_onLoadUrl();
				}
				Q.handle(o.onLoad);
			}},
			beforeClose: o.beforeClose,
			onClose: { "Q/dialog": function () {
				if (o.removeOnClose) {
					$this.remove();
				}
				Q.handle(o.onClose, $this, [$this]);
			}},
			alignParent: (o.alignByParent && !Q.info.isMobile ? $this.parent() : null),
			fadeInOut: o.asyncLoad
		});
		$this.data('Q/dialog', $this.data('Q/overlay'));
	} else {
		Q.handle(o.beforeLoad, $this, [$this]);
		var hiddenChildren = [];
		$(document.body).children().each(function() {
			var child = $(this);
			if (child[0] != $this[0] && child.css('display') != 'none' && this.className.indexOf('mask') == -1) {
				child.hide();
				hiddenChildren.push(child);
			}
		});
		$(document.body).prepend($this);
		$this.addClass('Q_fullscreen_dialog');
		$this.css({
			'width': window.innerWidth + 'px',
			'height': window.innerHeight + 'px'
		});
		var $close = $('<a class="Q_close" />');
		$this.append($close);
		$this.hide();

		var dialogData = {
			load: function() {
				dialogData.documentScrollTop = Q.Pointer.scrollTop();
				if ($this.css('display') == 'block') {
					return;
				}
				$this.css({
					'width': window.innerWidth + 'px',
					'height': window.innerHeight + 'px'
				});
				for (var i = 0; i < hiddenChildren.length; i++) {
					hiddenChildren[i].hide();
				}
				$this.show();
				ods.css('padding-top', ots.outerHeight());
				
				if (o.url) {
					_loadUrl.call($this, o, function() {
						Q.activate(this, {}, function () {
							Q.handle(o.onActivate, $this, [$this]);
						});
					});
				} else {
					Q.activate(this, {}, function () {
						Q.handle(o.onActivate, $this, [$this]);
					});
				}
			},
			close: function(e) {
				Q.handle(o.beforeClose, $this, [$this]);
				for (var i = 0; i < hiddenChildren.length; i++) {
					hiddenChildren[i].show();
				}
				
				if (o.removeOnClose) {
					$this.remove();
				} else {
					$this.hide();
				}
				
				$('html,body').scrollTop(dialogData.documentScrollTop);
				
				Q.handle(o.onClose, $this, [$this]);
				if (e) $.Event(e).preventDefault();
			}
		};

		$close.on(Q.Pointer.click, dialogData.close);

		$(document).on('keydown', function(e) {
			if (e.which == 27) {
				dialogData.close(e);
			}
		});

		$this.data('Q/dialog', dialogData);
	}
	
	var css = {
		position: 'absolute',
		pointerEvents: 'none',
		visibility: 'hidden'
	};
	var $div = $('<div />').addClass('Q_overlay').css(css).prependTo('body');
	var src = $div.css('background-image').match(/url\(\"?(.*?)\"?\)/)[1];
	$div.remove();
	if (src.isUrl() && !bgLoaded) {
		var $img = $('<img />').on('load', function () {
			bgLoaded = true;
			$img.remove();
			_loadIt();
		}).css(css)
		.attr('src', src)
		.appendTo('body');
	} else {
		_loadIt();
	}
	
	function _loadIt() {
		$this.data('Q/dialog').load();
	}
},

{
	'alignByParent': false,
	'mask': true,
	'fullscreen': Q.info.isMobile && Q.info.isAndroid(1000),
	'asyncLoad': !Q.info.isTouchscreen,
	'noClose': false,
	'closeOnEsc': true,
	'removeOnClose': false,
	'loadUrl': {},
	'beforeLoad': new Q.Event(),
	'onLoad': new Q.Event(),
	'onActivate': new Q.Event(),
	'beforeClose': new Q.Event(),
	'onClose': new Q.Event()
},

{
	load: function () {
		this.data('Q/dialog').load();
	},
	close: function (e) {
		this.data('Q/dialog').close(e);
	}
}

);

function _loadUrl(o, cb) {
	var $this = this;
	var ots = $('.title_slot', $this);
	var ods = $('.dialog_slot', $this);
	$this.addClass('Q_loading');
	ods.empty().addClass('Q_throb');

	Q.loadUrl(o.url, Q.extend({ 
		ignoreHistory: true,
		ignorePage: true,
		quiet: true,
		onActivate: cb,
		slotNames: 'title,dialog',
		handler: function(response) {
			ods.removeClass('Q_throb');
			$this.removeClass('Q_loading');

			var elementsToActivate = [];
			if ('title' in response.slots) {
				ots.html($('<h2 class="Q_dialog_title" />').html(response.slots.title));
				elementsToActivate['title'] = ots[0];
			}
			ods.html(response.slots.dialog);
			elementsToActivate['dialog'] = ods[0];

			return elementsToActivate;
		}
	}, o.loadUrl));
}

function _handlePosAndScroll(o)
{
	var $this = this;
	var ots = $('.title_slot', $this);
	var ods = $('.dialog_slot', $this);
	var parent = $this.parent();
	var topMargin = 0, bottomMargin = 0, parentHeight = 0;
	var lastOrientation = null; // for touch devices
		
	var contentsWrapper = null, contentsLength = 0;
	var iScrollBar = null;
	
	function applyIScroll(maxContentsHeight)
	{
		contentsWrapper = ods.parent('.Q_iscroll_dialog_wrapper');
		if (contentsWrapper.length != 0)
		{
			contentsWrapper.css({ 'max-height': maxContentsHeight + 'px' });
			var topOffset = contentsWrapper.offset().top;
			iScrollBar.css({
				'top': topOffset + 'px',
				'left': (contentsWrapper.offset().left + contentsWrapper.width() - iScrollBar.width()) + 'px',
				'height': maxContentsHeight + 'px'
			});
			contentsWrapper.plugin('Q/iScroll', 'refresh');
		}
		else
		{
			ods.wrap('<div class="Q_iscroll_dialog_wrapper" />');
			contentsWrapper = ods.parent();
			contentsWrapper.css({ 'max-height': maxContentsHeight + 'px' });
			contentsWrapper.plugin('Q/iScroll', function () {
				contentsLength = ods.html().length;
				iScrollBar = contentsWrapper.children('div:last');
				iScrollBar.detach().prependTo(document.body);
				var topOffset = contentsWrapper.offset().top;
				iScrollBar.css({
					'top': topOffset + 'px',
					'left': (contentsWrapper.offset().left + contentsWrapper.width() - iScrollBar.width()) + 'px',
					'height': maxContentsHeight + 'px',
					'z-index': '20100'
				});
				contentsWrapper.plugin('Q/iScroll', 'refresh');
			});
		}
	}
	
	if (interval) {
		clearInterval(interval);
	}

	Q.addScript("plugins/Q/js/QTools.js", function () {

	interval = setInterval(function() {
		var maxContentsHeight;
		if ($this.css('display') == 'block')
		{
			topMargin = Q.Dialogs.options.topMargin;
			parentHeight = (!o.alignByParent || parent[0] == document.body) ? window.innerHeight : parent.height();
			if (typeof(topMargin) == 'string') // percentage
				topMargin = Math.round(parseInt(Q.Dialogs.options.topMargin) / 100 * parentHeight);
			bottomMargin = Q.Dialogs.options.bottomMargin;
			if (typeof(bottomMargin) == 'string') // percentage
				bottomMargin = Math.round(parseInt(Q.Dialogs.options.bottomMargin) / 100 * parentHeight);
			
			var cs = $this[0].computedStyle();
			var outerWidth = Math.ceil(parseFloat(cs.width)
				+ parseFloat(cs.paddingLeft)
				+ parseFloat(cs.paddingRight));
			var winInnerWidth = window.innerWidth;
			var winInnerHeight = window.innerHeight;
			if (Q.info.isMobile)
			{
				// correcting x-pos
				var left = Math.ceil((winInnerWidth - outerWidth) / 2);
				if (parseInt($this.css('left')) != left)
				{
					$this.css({ 'left': left + 'px' });
					if (iScrollBar)
					{
						iScrollBar.css({ 'left': (contentsWrapper.offset().left + contentsWrapper.width() - iScrollBar.width()) + 'px' });
					}
				}
				
				// for mobile devices any height and y-pos corrections are done only if keyboard is not visible on the screen
				if (Q.Layout && Q.Layout.keyboardVisible) return;
				
				// correcting height
				if ($this.outerHeight() > winInnerHeight && o.applyIScroll)
				{
					$this.data('Q_dialog_default_height', $this.outerHeight());
					$this.css({ 'top': Q.Pointer.scrollTop() + 'px' });
					maxContentsHeight = winInnerHeight - ots.outerHeight()
																- parseInt($this.css('border-top-width')) * 2;
					applyIScroll(maxContentsHeight);
				}
				// in case if screen height got to value where dialog may fit we're removing iScroll and height restriction
				else if ($this.data('Q_dialog_default_height') !== undefined &&
				         $this.data('Q_dialog_default_height') <= winInnerHeight)
				{
					$this.removeData('Q_dialog_default_height');
					contentsWrapper.plugin('Q/iScroll', 'remove');
					ods.unwrap();
					$this.css({ 'top': Q.Pointer.scrollTop() + topMargin + 'px' });
				}
				// correcting top position
				else if ($this.offset().top + $this.outerHeight() > window.scrollY + winInnerHeight)
				{
					$this.data('Q_dialog_top_corrected', true);
					$this.css({ 'top': Q.Pointer.scrollTop() + 'px' });
				}
				// if case if dialog may fit on screen with topMargin we're setting it
				else if ((topMargin + $this.outerHeight() < window.scrollY + winInnerHeight) && $this.data('Q_dialog_top_corrected'))
				{
					$this.removeData('Q_dialog_top_corrected');
					$this.css({ 'top': Q.Pointer.scrollTop() + topMargin + 'px' });
				}
			}
			else
			{
				// correcting x-pos
				if (parseInt($this.css('left')) != Math.ceil((winInnerWidth - outerWidth) / 2))
				{
					$this.css({ 'left': Math.ceil((winInnerWidth - outerWidth) / 2) + 'px' });
					if (iScrollBar)
					{
						iScrollBar.css({ 'left': (contentsWrapper.offset().left + contentsWrapper.width() - iScrollBar.width()) + 'px' });
					}
				}
				
				// for touchscreen devices any height and y-pos corrections are done only if keyboard is not visible on the screen
				if (Q.info.isTouchscreen && Q.Layout && Q.Layout.keyboardVisible) return;

				// correcting height
				if ($this.outerHeight() + topMargin + bottomMargin > parentHeight)
				{
					$this.data('Q_dialog_default_height', $this.outerHeight());
					$this.css({ 'top': Q.Pointer.scrollTop() + topMargin + 'px' });
					maxContentsHeight = parentHeight - topMargin - bottomMargin - ots.outerHeight()
						- parseInt($this.css('border-top-width')) * 2;
					if (maxContentsHeight < 0) maxContentsHeight = 0;
					if (Q.info.isTouchscreen && $.fn.iScroll && o.applyIScroll)
					{
						applyIScroll(maxContentsHeight);
					}
					else
					{
						ods.css({ 'max-height': maxContentsHeight + 'px', 'overflow': 'auto' });
					}
				}
				// in case if screen height got to value where dialog may fit we're height restriction (and iScroll for touchscreen)
				else if ($this.data('Q_dialog_default_height') !== undefined &&
				         $this.data('Q_dialog_default_height') + topMargin + bottomMargin <= parentHeight)
				{
					$this.removeData('Q_dialog_default_height');
					if (Q.info.isTouchscreen && $.fn.iScroll)
					{
						contentsWrapper.plugin('Q/iScroll', 'remove');
						ods.unwrap();
					}
					else
					{
						ods.css({ 'max-height': '', 'overflow': '' });
					}
					$this.css({ 'top': Q.Pointer.scrollTop() + topMargin + 'px' });
				}
				// if case if dialog may fit on screen with topMargin we're setting it
				else if ($this.data('Q_dialog_default_height') === undefined &&
				         $this.offset().top + parent.offset().top != topMargin)
				{
					$this.css({ 'top': Q.Pointer.scrollTop() + topMargin + 'px' });
				}
			}
			
			// also considering orientation
			if (Q.info.isTouchscreen)
			{
				if (!lastOrientation)
					lastOrientation = Q.Layout.orientation;
				if (Q.Layout.orientation != lastOrientation)
				{
					lastOrientation = Q.Layout.orientation;
					parentHeight = (parent[0] == document.body) ? winInnerHeight : parent.height();
					topMargin = Q.Dialogs.options.topMargin;
					if (typeof(topMargin) == 'string') // percentage
						topMargin = Math.round(parseInt(Q.Dialogs.options.topMargin) / 100 * parentHeight);
					var curTop = parseInt($this.css('top'));
					if (curTop != 0)
						$this.css({ 'top': Q.Pointer.scrollTop() + topMargin + 'px' });
				}
			}
			
			if (contentsWrapper && contentsLength != ods.html().length)
			{
				contentsLength = ods.html().length;
				contentsWrapper.plugin('Q/iScroll', 'refresh');
			}
		} else {
			clearInterval(interval);
		}
	}, 100);
	
	});
};

var interval;
var bgLoaded;

})(Q, jQuery, window, document);
