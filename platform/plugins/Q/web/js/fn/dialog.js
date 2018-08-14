(function (Q, $, window, document, undefined) {

/**
 * This plugin Makes an overlay to show some content above the page.
 * Suitable for showing dialogs, for example.
 * It does not automatically activate its contents, like Q/dialog does.
 * @method overlay
 * @param {Object} [options]
 * @param {Boolean} [options.apply] Set to true if the dialog should show the "apply" style button to close dialog
 * @param {String} [options.htmlClass] Any class to add to the html element while the overlay is open
 * @param {Boolean|String} [options.mask=false] If true, adds a mask to cover the screen behind the overlay. If a string, this is passed as the className of the mask.
 * @param {Boolean} [options.noClose=false] If true, overlay close button will not appear and overlay won't be closed by pressing 'Esc' key.
 * @param {Boolean} [options.closeOnEsc=true] closeOnEsc Indicates whether to close overlay on 'Esc' key press. Has sense only if 'noClose' is false.
 * @param {Boolean} [options.closeOnMask=false] If true, closes the dialog if the user clicks anywhere on the mask behind the dialog
 * @param {Boolean} [options.fadeInOut=true] Indicates whether to use fadeIn() / fadeOut() animations when loading dialog.
 * Note: if set to false, 'onLoad' callback will be called synchronously with dialog load,
 * otherwise it will be called on fadeIn() animation completion.
 * @param {Boolean} [options.noCalculatePosition=false] Set to true to prevent calculating position automatically
 * @param {String} [options.left='center'] left is a Horizontal position of the overlay, May have 'center' value to be centered horizontally or have a percentage or absolute (pixels) value of offset from the left border of 'alignParent'.
 * @param {String} [options.top='middle'] top is a Vertical position of the overlay. May have 'middle' value to be centered vertically or have a percentage or absolute (pixels) value of offset from the top border of 'alignParent'. Optional
 * @param {DOMElement} [options.alignParent]  Can be DOM element, jQuery object or jQuery selector.
 * If provided overlay will be positioned relatively to that element. If null, overlay will be positioned considering window dimensions. Optional.
 * @param {DOMElement} [options.adjustPositionMs=500] How many milliseconds between adjusting position interval
 * @param {Object} [options.loadUrl={}] options to override for the call to Q.loadUrl
 * @param {Q.Event} [options.beforeLoad] beforeLoad Q.Event or function which is called before overlay is loaded (shown).
 * @param {Q.Event} [options.onLoad] onLoad occurs when overlay has been loaded (shown).
 * @param {Q.Event} [options.beforeClose] beforeClose occurs when .close() was called on the dialog and it's still visible. Can return false to cancel closing.
 * @param {Q.Event} [options.onClose] onClose Q.Event or function which is called when overlay is closed and hidden. Optional.
 */
Q.Tool.jQuery('Q/overlay',

	function _Q_overlay(o) {
		function calculatePosition($this) {
			var data = $this.data('Q/overlay');
			o = (data && data.options) || o;
			if (o.noCalculatePosition) {
				return;
			}
			var width = $this.outerWidth(), height = $this.outerHeight();

			if (!width && $this.css('width'))
				width = parseInt($this.css('width'));
			if (!height && $this.css('height'))
				height = parseInt($this.css('height'));

			var ap = o.alignParent && (o.alignParent[0] || o.alignParent);
			var apr = ap && ap.getBoundingClientRect();
			var br = document.body.getBoundingClientRect();
			var sl = ap ? apr.left : -br.left;

			var st = ap ? apr.top : -br.top;
			// if dialog element have position=fixed - it means it positioned related to viewport
			// It means that position independent of scrolls of all ancestors.
			st = $this.css("position") === "fixed" ? 0 : st;

			var sw = ap ? apr.right - apr.left : Q.Pointer.windowWidth();
			var sh = ap ? apr.bottom - apr.top : Q.Pointer.windowHeight();

			var diff = 2;
			if (($this.previousWidth === undefined) || (Math.abs(width - $this.previousWidth) > diff)) {
				if (o.left === 'center') {
					$this.css({ 'left': (sl + (sw - width) / 2) + 'px' });
				} else if (typeof(o.left) === 'string' && o.left.indexOf('%') !== -1) {
					var left = sl + sw * parseInt(o.left) / 100;
					$this.css({ 'left': left + 'px' });
				} else {
					$this.css({ 'left': sl + o.left + 'px' });
				}
			}
			$this.previousWidth = width;
			if (o.top === 'middle') {
				$this.css({ 'top': (st + (sh - height) / 2) + 'px' });
			} else if (typeof(o.top) === 'string' && o.top.indexOf('%') !== -1) {
				var top = st + sh * parseInt(o.top) / 100;
				$this.css({ 'top': top + 'px' });
			} else {
				$this.css({ 'top': st + o.top + 'px' });
			}
		}

		var $this = this;
		$this.hide().css('visibility', 'hidden').addClass('Q_overlay');
		$this.css('position', Q.info.platform === 'ios' ? 'absolute' : 'fixed');

		function closeThisOverlayOnEsc(e)
		{
			var topDialog = dialogs[dialogs.length - 1];
			if (e.keyCode === 27 && !o.noClose && o.closeOnEsc
				&& $this.is(":visible") && (!topDialog || $this[0] === topDialog)) {
				$this.data('Q/overlay').close(e);
			}
		}

		$this.data('Q/overlay', {
			options: o,
			load: function()
			{
				var data = $this.data('Q/overlay');
				data.documentScrollTop = Q.Pointer.scrollTop();
				data.documentScrollLeft = Q.Pointer.scrollLeft();
				if ($this.hasClass('Q_overlay_open')) {
					return;
				}
				var topZ = 0;
				$('body').children().each(function () {
					var $this = $(this);
					if ($this.hasClass('Q_click_mask')) {
						return;
					}
					var z = parseInt($this.css('z-index'));
					if (!isNaN(z)) {
						topZ = Math.max(topZ, z)
					}
				});
				$this.css('z-index', topZ);
				Q.handle(data.options.beforeLoad, $this, [$this]);
				calculatePosition($this);
				$this.show();
				dialogs.push($this[0]);
				var $body = $('body');
				data.bodyStyle = {
					left: $body.css('left'),
					top: $body.css('top')
				};
				var hs = document.documentElement.style;
				var sl = (hs.width === '100%' && hs.overflowX === 'hidden')
					? 0
					: Q.Pointer.scrollLeft();
				var st = (hs.height === '100%' && hs.overflowY === 'hidden')
					? 0
					: Q.Pointer.scrollTop();
				$body.css({
					left: -sl + 'px',
					top: -st + 'px'
				}).addClass('Q_preventScroll');
				var oom = data.options.mask;
				var mcn = (typeof oom === 'string') ? ' ' + oom : '';
				if (data.options.fadeInOut)
				{
					if (typeof data.options.fadeInOut === 'function') {
						data.options.fadeInOut(_doFade);
					} else {
						_doFade();
					}
					function _doFade() {
						$this.css('opacity', 0).show();
						Q.Animation.play(function (x, y) {
							$this.css('opacity', y);
							if (x === 1) {
								if (!data.options.noClose && data.options.closeOnEsc) {
									$(document).on('keydown', closeThisOverlayOnEsc);
								}
								Q.handle(data.options.onLoad, $this, [$this]);
							}
						}, o.fadeTime);
						if (data.options.mask)
						{
							var mask = Q.Masks.show('Q.screen.mask', {
								fadeTime: o.fadeTime,
								className: 'Q_dialog_mask' + mcn,
								zIndex: topZ - 1
							});
							if (data.options.closeOnMask) {
								$(mask.element).on(Q.Pointer.click, function () {
									$this.data('Q/overlay').close();
								});
							}
						}
					}
				}
				else
				{
					$this.show();
					if (data.options.mask) {
						var mask = Q.Masks.show('Q.screen.mask', {
							className: 'Q_screen_mask' + mcn,
							zIndex: $this.css('z-index') - 1
						});
						if (data.options.closeOnMask) {
							$(mask.element).on(Q.Pointer.click, function () {
								$this.data('Q/overlay').close();
							});
						}
					}
					if (!data.options.noClose && data.options.closeOnEsc) {
						$(document).on('keydown', closeThisOverlayOnEsc);
					}
					Q.handle(data.options.onLoad, $this, [$this]);
				}
				$this.addClass('Q_overlay_open');
				if (data.options.htmlClass) {
					var $html = $('html');
					if ($html.hasClass(data.options.htmlClass)) {
						data.htmlHadClass = true;
					} else {
						$('html').addClass(data.options.htmlClass);
					}
				}
				Q.Pointer.cancelClick();
			},
			close: function(e)
			{
				dialogs.pop();
				var data = $this.data('Q/overlay');
				var $html = $('html');
				if (data.options.htmlClass && !data.htmlHadClass) {
					$html.removeClass(data.options.htmlClass);
				}
				$('body').removeClass('Q_preventScroll').css(data.bodyStyle);
				$('html,body').scrollTop(data.documentScrollTop)
					.scrollLeft(data.documentScrollLeft);
				if (!data.options.noClose) {
					$(document).off('keydown', closeThisOverlayOnEsc);
				}
				$this.removeClass('Q_overlay_open');
				$this.find('input, select, textarea').trigger('blur');
				if (false === Q.handle(data.options.beforeClose, $this, [$this])) {
					return false;
				}
				if (data.options.fadeInOut)
				{
					Q.Animation.play(function (x, y) {
						if (x === 1) {
							$this.hide();
							Q.handle(data.options.onClose, $this, []);
						} else {
							$this.css('opacity', 1-y);
						}
					}, o.fadeTime);
					if (data.options.mask)
					{
						Q.Masks.hide('Q.screen.mask');
					}
				}
				else
				{
					$this.hide();
					if (data.options.mask)
					{
						Q.Masks.hide('Q.screen.mask');
					}
					Q.handle(data.options.onClose, $this, [$this]);
				}
				if (e) $.Event(e).preventDefault();
				Q.Pointer.stopHints($this[0]);
				Q.Pointer.cancelClick();
			},
			calculatePosition: function () {
				calculatePosition($this);
			}
		});

		if (!o.noClose)
		{
			var $close = $('<a class="Q_close" />');
			$this.append($close);
			$close.on(Q.Pointer.fastclick, $this.data('Q/overlay').close);
		}
	},


	{
		left: 'center',
		top: 'middle',
		alignParent: null,
		htmlClass: null,
		mask: false,
		noClose: false,
		closeOnEsc: true,
		closeOnMask: false,
		fadeInOut: true,
		fadeTime: 300,
		apply: false,
		beforeLoad: new Q.Event(),
		onLoad: new Q.Event(),
		beforeClose: new Q.Event(),
		onClose: new Q.Event()
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
 *   @param {String} [options.htmlClass] Any class to add to the html element while the overlay is open
 *   @param {Boolean|String} [options.mask=true] If true, adds a mask to cover the screen behind the dialog. If a string, this is passed as the className of the mask.
 *   @param {Boolean} [options.fullscreen]
 *   If true, dialog will be shown not as overlay but instead will be prepended to document.body and all other child elements of the body will be hidden. Thus dialog will occupy all window space, but still will behave like regular dialog, i.e. it can be closed by clicking / tapping close icon. Defaults to true on Android stock browser, false everywhere else.
 *   @param {String} [options.left='center'] left is a Horizontal position of the overlay, May have 'center' value to be centered horizontally or have a percentage or absolute (pixels) value of offset from the left border of 'alignParent'.
 *   @param {String} [options.top='middle'] top is a Vertical position of the overlay. May have 'middle' value to be centered vertically or have a percentage or absolute (pixels) value of offset from the top border of 'alignParent'. Optional
 *   @param {Boolean} [options.alignByParent=false] If true, the dialog will be aligned to the center of not the entire window, but to the center of containing element instead.
 *   @param {Boolean} [options.fadeInOut=!Q.info.isTouchscreen]
 *   For desktop and false for touch devices. If true, dialog will load asynchronously with fade animation and 'onLoad' will be called when fade animation is completed. If false, dialog will appear immediately and 'onLoad' will be called at the same time.
 * @param {Boolean} [options.waitForBackgroundImage=!Q.info.isTouchscreen] Whether to wait for the background image to load before showing the dialog
 *   @param {Boolean} [options.noClose=false]
 *   If true, overlay close button will not appear and overlay won't be closed by pressing 'Esc' key.
 *   @param {Boolean} [options.closeOnEsc=true]
 *   Indicates whether to close dialog on 'Esc' key press. Has sense only if 'noClose' is false.
 *   @param {Boolean} [options.closeOnMask=false] If true, closes the dialog if the user clicks anywhere on the mask behind the dialog
 *   @param {Boolean} [options.removeOnClose=false] If true, dialog DOM element will be removed from the document on close.
 *   @param {Boolean} [options.noCalculatePosition=false] Set to true to prevent calculating position automatically
 *   @param {Object} [options.loadUrl={}] options to override for the call to Q.loadUrl
 *   @param {Q.Event} [options.beforeLoad] beforeLoad Q.Event or function which is called before overlay is loaded (shown).
 *   @param {Q.Event} [options.onLoad] onLoad occurs when overlay has been loaded (shown).
 *   @param {Q.Event} [options.beforeClose] beforeClose occurs when .close() was called on the dialog and it's still visible. Can return false to cancel closing.
 *   @param {Q.Event} [options.onActivate]  Q.Event or function which is called when dialog is activated (all inner tools, if any, are activated and dialog is fully loaded and shown).
 *   @param {Q.Event} [options.onClose]  Q.Event or function which is called when dialog is closed and hidden and probably removed from DOM (if 'removeOnClose' is 'true'). * @param {Boolean} [options.apply] Set to true if the dialog should show the "apply" style button to close dialog
 */
Q.Tool.jQuery('Q/dialog', function _Q_dialog (o) {

		var $this = this;
		var ots = $('.Q_title_slot', $this);
		var ods = $('.Q_dialog_slot', $this);
		if (!ots.length) {
			alert("Please add an element with the class 'Q_title_slot' before calling dialog()");
			return;
		}
		if (!ods.length) {
			alert("Please add an element with the class 'Q_dialog_slot' before calling dialog()");
			return;
		}

		if (!o.fullscreen) {
			var topPos = o.topMargin;
			if (Q.info.isMobile) {
				if (topPos.indexOf('%') !== -1) {
					topPos = parseInt(topPos) / 100 * Q.Pointer.windowHeight();
				}
				var noticeSlot = $('#notices_slot');
				if (noticeSlot.length && noticeSlot.outerHeight() >= topPos) {
					topPos += noticeSlot.outerHeight();
				}
			}

			$this.plugin('Q/overlay', {
				top: topPos,
				htmlClass: o.htmlClass,
				mask: o.mask,
				closeOnMask: o.closeOnMask,
				closeOnEsc: o.closeOnEsc,
				noClose: o.noClose,
				beforeLoad: {"Q/dialog": function () {
					$this.css('opacity', 0).show();
					Q.handle(o.beforeLoad, this, arguments);
					function _onContent() {
						Q.activate([ots, ods], {}, function() {
							_handlePosAndScroll.call($this, o);
							Q.handle(o.onActivate, $this, [$this]);
							$this.css('opacity', 1);
						});
					}
					if (o.url) {
						_loadUrl.call($this, o, _onContent);
					} else {
						_onContent();
					}
				}},
				onLoad: { "Q/dialog": function() {
					Q.handle(o.onLoad, this);
				}},
				beforeClose: o.beforeClose,
				onClose: { "Q/dialog": function () {
					if (o.removeOnClose) {
						Q.removeElement($this[0], true);
					}
					Q.handle(o.onClose, $this, [$this]);
				}},
				noCalculatePosition: o.noCalculatePosition,
				alignParent: (o.alignByParent && !Q.info.isMobile ? $this.parent() : null),
				fadeInOut: o.fadeInOut && function (callback) {
					o.onActivate.add(callback, "Q/overlay");
				}
			});
			$this.data('Q/dialog', $this.data('Q/overlay'));
		} else {
			Q.handle(o.beforeLoad, $this, [$this]);
			var hiddenChildren = [];
			$(document.body).children().each(function() {
				var child = $(this);
				if (child[0] !== $this[0] && child.css('display') !== 'none' && this.className.indexOf('mask') === -1) {
					child.hide();
					hiddenChildren.push(child);
				}
			});
			$(document.body).prepend($this);
			$this.addClass('Q_fullscreen_dialog');
			$this.css({
				'width': Q.Pointer.windowWidth() + 'px',
				'height': Q.Pointer.windowHeight() + 'px'
			});
			var $close = $('<a class="Q_close" />');
			$this.append($close);
			$this.hide();

			var dialogData = {
				load: function() {
					dialogData.documentScrollTop = Q.Pointer.scrollTop();
					if ($this.hasClass('Q_overlay_open')) {
						return;
					}
					$this.css({
						'width': Q.Pointer.windowWidth() + 'px',
						'height': Q.Pointer.windowHeight() + 'px'
					});
					for (var i = 0; i < hiddenChildren.length; i++) {
						hiddenChildren[i].hide();
					}
					$this.show().css('opacity', 0);
					ods.css('padding-top', ots.outerHeight());

					if (o.url) {
						_loadUrl.call($this, o, function() {
							Q.activate(this, {}, function () {
								$this.css('opacity', 1);
								Q.handle(o.onActivate, $this, [$this]);
							});
						});
					} else {
						Q.activate($this[0], {}, function () {
							$this.css('opacity', 1);
							Q.handle(o.onActivate, $this, [$this]);
						});
					}
				},
				close: function(e) {
					if (false === Q.handle(o.beforeClose, $this, [$this])) {
						return false;
					}
					for (var i = 0; i < hiddenChildren.length; i++) {
						hiddenChildren[i].show();
					}

					if (o.removeOnClose) {
						Q.removeElement($this[0], true);
					} else {
						$this.hide();
					}

					$('html,body').scrollTop(dialogData.documentScrollTop);

					Q.handle(o.onClose, $this, [$this]);
					if (e) $.Event(e).preventDefault();
				}
			};

			$close.on(Q.Pointer.fastclick, dialogData.close);

			$(document).on('keydown', function(e) {
				if (e.which === 27) {
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
		var matches = $div.css('background-image').match(/url\(\"?(.*?)\"?\)/);
		var src = matches && matches[1] ? matches[1] : '';
		$div.remove();
		if (src.isUrl() && o.waitForBackgroundImage && !bgLoaded) {
			var $img = $('<img />').on('load', function () {
				bgLoaded = true;
				$(this).remove();
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
		htmlClass: null,
		mask: true,
		fullscreen: Q.info.useFullscreen,
		fadeInOut: !Q.info.isTouchscreen,
		alignByParent: false,
		waitForBackgroundImage: !Q.info.isTouchscreen,
		noClose: false,
		closeOnEsc: true,
		closeOnMask: false,
		removeOnClose: false,
		loadUrl: {},
		topMargin: '10%',
		bottomMargin: '10%',
		beforeLoad: new Q.Event(),
		onLoad: new Q.Event(),
		onActivate: new Q.Event(),
		beforeClose: new Q.Event(),
		onClose: new Q.Event()
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
	var ots = $('.Q_title_slot', $this);
	var ods = $('.Q_dialog_slot', $this);
	$this.addClass('Q_loading');
	ods.empty().addClass('Q_throb');

	Q.loadUrl(o.url, Q.extend({
		ignoreHistory: true,
		ignorePage: true,
		ignoreDialogs: true,
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
	var ots = $('.Q_title_slot', $this);
	var ods = $('.Q_dialog_slot', $this);
	var parent = $this.parent();
	var topMargin = 0, bottomMargin = 0, parentHeight = 0;
	var wasVertical = null; // for touch devices
	var inputWasFocused = false;

	var contentsWrapper = null, contentsLength = 0;

	if (interval) {
		clearInterval(interval);
	}

	interval = setInterval(_adjustPosition, o.adjustPositionMs || 500);
	_adjustPosition();

	function _adjustPosition() {
		var maxContentsHeight;
		var isInput = $(document.activeElement).is(":input");
		if (isInput) {
			inputWasFocused = true;
			setTimeout(function () {
				inputWasFocused = false;
			}, 400);
		}
		if ($this.css('display') === 'block')
		{
			topMargin = o.topMargin || 0;
			parentHeight = (!o.alignByParent || parent[0] === document.body)
				? Q.Pointer.windowHeight()
				: parent.height();
			if (typeof(topMargin) === 'string') // percentage
				topMargin = Math.round(parseInt(topMargin) / 100 * parentHeight);
			bottomMargin = o.bottomMargin || 0;
			if (typeof(bottomMargin) === 'string') // percentage
				bottomMargin = Math.round(parseInt(bottomMargin) / 100 * parentHeight);

			var rect = Q.Pointer.boundingRect(document.body, ['Q_mask']);
			var outerWidth = $this.outerWidth();
			if (!o.noCalculatePosition
				&& (!Q.info.isTouchscreen || !inputWasFocused)) {
				$this.data('Q/overlay').calculatePosition();
			}

			if (!o.fullscreen && o.topMargin !== undefined) {
				var maxHeight = parentHeight - topMargin - bottomMargin;
				var $ts = $this.find('.Q_title_slot');
				if ($ts.is(":visible")) {
					maxHeight -= $ts.height();
				}
				var $ds = $this.find('.Q_dialog_slot');
				var atBottom = ($ds.scrollTop() >= $ds[0].scrollHeight - $ds[0].clientHeight);
				$ds.css('max-height', maxHeight + 'px');
				if ($ds.hasClass('Q_scrollToBottom') && atBottom) {
					$ds.scrollTop($ds[0].scrollHeight - $ds[0].clientHeight);
				}
			}

			// also considering orientation
			if (Q.info.isTouchscreen)
			{
				if (!wasVertical)
					wasVertical = Q.info.isVertical;
				if (Q.info.isVertical !== wasVertical)
				{
					wasVertical = Q.info.isVertical;
					var topPos = o.topMargin;
					if (topPos.indexOf('%') !== -1) {
						topPos = parseInt(topPos) / 100 * Q.Pointer.windowHeight();
					}
					var noticeSlot = $('#notices_slot');
					if (noticeSlot.length && noticeSlot.outerHeight() >= topPos) {
						topPos += noticeSlot.outerHeight();
					}
					var curTop = parseInt($this.css('top'));
					if (curTop !== 0)
						$this.css({ 'top': Q.Pointer.scrollTop() + topPos + 'px' });
				}
			}
		} else {
			clearInterval(interval);
		}
		$this.css('visibility', 'visible');
	}
}

var interval;
var bgLoaded;
var dialogs = [];

})(Q, jQuery, window, document);
