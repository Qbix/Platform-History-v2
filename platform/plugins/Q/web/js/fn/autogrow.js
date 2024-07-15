(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * Plugin that allows a textbox or textarea to grow to encompass its content as it changes
 * @class Q autogrow
 * @constructor
 * @param {Object} [options] , object for an options
 * @param {Number|Element} [options.maxWidth=1000] maxWidth The input won't get larger than this number or element
 * @param {Number} [options.minWidth=0] minWidth The input won't get smaller than this
 * @param {Number} [options.minHeight=0] minHeight The textarea won't get smaller than this
 * @param {Number} [options.comfortZone=10] How many pixels of padding to allocate for typing ahead
 * @param {Q.Event} [options.onResize] Triggered during a size change, its "this" object is the jQuery selector of the plugin. If used with a text input, the first parameter is the new width.
 * @default new Q.Event()
 */

Q.Tool.jQuery('Q/autogrow',

function _Q_autogrow(o) {

	var possibleEvents = 'input.Q_autogrow'
		+ 'keyup.Q_autogrow'
		+ ' blur.Q_autogrow'
		+ ' update.Q_autogrow'
		+ ' paste.Q_autogrow'
		+ ' autogrowCheck';
		
	this.addClass('Q_autogrow_resizing');

	this.filter('textarea').each(function (i) {
		var $t = $(this), t = this;
		var val = '';
		
		var $p = _surroundPlaceholders.call($t);

		t.style.resize = 'none';
		t.style.overflow = 'hidden';

		var tVal = t.value;
		t.style.height = Math.max($t.state('Q/autogrow').minHeight || 0, 0) + 'px';
		t.value = "W\nW\nW";
		var H3 = t.scrollHeight;
		t.value = "W\nW\nW\nW";
		var H4 = t.scrollHeight;
		var H = H4 - H3;
		t.value = tVal;
		tVal = null;

		++p.count;
		var $c = $t.closest('.Q_autogrow_container');
		if (!$c.length) {
			$c = $('<div id="Q_autogrow_container_'+p.count+'" class="Q_autogrow_container"></div>')
			.insertBefore($p)
			.append($p);
		}
		var c = $c[0];
		c.style.padding = '0px';
		c.style.margin = '0px';
		
		var visible = $t.is(":visible");
		if (visible) {
			$t.hide();
			$c.width($t[0].style.width);
			$t.show();
		}

		$t.on('focus', function(){
			t.startUpdating();
		}).on('blur', function(){
			t.stopUpdating();
		});
		
		var prevH = 0;

		function updateHeight() {
			var minHeight = $t.state('Q/autogrow').minHeight || 0;
			t.style.height = '0px';
			var tH = t.scrollHeight; // + H;
			t.style.height = Math.max(minHeight, tH) + 'px';
			setTimeout(function () {
				var h = $p.outerHeight(true);
				c.style.height = h + 'px';
				if (prevH && prevH != tH) {
					var $sp = $(c.scrollingParent());
					var st = $sp.scrollTop();
					if (tH > prevH
					|| st < $sp[0].scrollHeight - $sp[0].clientHeight) {
						$sp.scrollTop(st + tH - prevH);
					}
				}
				if (prevH && tH && prevH != tH) {
					Q.handle(o.onResize, $t, []);
				}
				prevH = tH;
			}, 0)
		};

		this.startUpdating = function() {
			$(this).off(possibleEvents).on(possibleEvents, updateHeight);
			t.timeout1 = setTimeout(updateHeight, 0);
			t.timeout2 = setTimeout(updateHeight, 100);
		};

		this.stopUpdating = function(){
			$(this).off(possibleEvents);
			clearTimeout(t.timeout1);
			clearTimeout(t.timeout2);
		};
		
		updateHeight();
	});

	this.filter('input:text').each(function() {
		var $t = $(this);
		var input = $t;
		var minWidth = (typeof o.minWidth === 'string')
			? ($t.parent().children(o.minWidth)[0] || 20)
			: o.minWidth || 20;
		if (minWidth && Q.instanceOf(minWidth, Element)) {
			var $testSubject = $('<div class="Q_tester"/>').css({
				position: 'absolute',
				top: -9999,
				left: -9999,
				visibility: 'hidden',
				'pointer-events': 'none',
				width: 'auto',
				'max-width': 'none',
				'max-height': 'none',
				whiteSpace: 'nowrap'
			}).appendTo('body');
			var cs = minWidth.computedStyle();
			$testSubject.css({
				fontSize: cs.fontSize,
				fontFamily: cs.fontFamily,
				fontWeight: cs.fontWeight,
				letterSpacing: cs.letterSpacing,
				padding: cs.padding,
				margin: cs.margin,
			})
			$testSubject.html(minWidth.innerHTML);
			minWidth = $testSubject.outerWidth(true);
			$testSubject.remove();
		}
		var val = '';
		function updateWidth() {
			val = input.val();
			if (!val) {
				val = input.attr('placeholder') || '';
			}

			// Enter new content into testSubject
			var escaped = val.encodeHTML();
			var $testSubject = $('<div class="Q_tester"/>').css({
				position: 'absolute',
				top: -9999,
				left: -9999,
				visibility: 'hidden',
				'pointer-events': 'none',
				width: 'auto',
				'max-width': 'none',
				'max-height': 'none',
				whiteSpace: 'nowrap',
				fontSize: input.css('fontSize'),
				fontFamily: input.css('fontFamily'),
				fontWeight: input.css('fontWeight'),
				letterSpacing: input.css('letterSpacing'),
				padding: input.css('padding'),
				margin: input.css('margin'),
				whiteSpace: 'nowrap'
			}).appendTo('body');
			$testSubject.html(escaped);

			// Calculate new width + whether to change
			var testerWidth = $testSubject.outerWidth(true);
			$testSubject.remove();
			var newWidth = Math.max(testerWidth + o.comfortZone, minWidth);
			var currentWidth = input.outerWidth(true);
			var maxWidth = (typeof o.maxWidth === 'string')
				? $t.closest(o.maxWidth)[0]
				: o.maxWidth;
			if (maxWidth) {
				maxWidth = Q.instanceOf(maxWidth, Element)
					? $(maxWidth).innerWidth()
					: maxWidth;
				newWidth = Math.min(newWidth, maxWidth);
			}
			var isValidWidthChange = (
				(newWidth < currentWidth && newWidth >= minWidth) || (newWidth > minWidth)
			);

			$container = input.parent('.Q_placeholders_container');

			// Animate width
			if (isValidWidthChange) {
				input.add($container).width(newWidth);
				Q.handle(o.onResize, $t, [newWidth]);
			} else if (input.width() < minWidth) {
				input.add($container).width(minWidth);
			}
			$container.css({
				width: input.css('width'),
				height: input.css('height')
			});
		};

		$(this).off(possibleEvents).on(possibleEvents, updateWidth);
		updateWidth();

	});
	
	Q.handle(o.onResize, $(this), []);

	return this;

},

{	// default options:
	maxWidth: 1000,
	minWidth: '.Q_placeholder',
	minHeight: 0,
	comfortZone: 10,
	onResize: new Q.Event(_surroundPlaceholders, 'Q/autogrow')
},

{
	remove: function () {
		this.filter('textarea').each(function () {
			this.stopUpdating(); // clear timers
		});
	}
}

);

var p = {
	count: 0
}

function _surroundPlaceholders() {
	var $container = this.closest('.Q_placeholders_container');
	if (!$container.length || !$(this).is('textarea')) {
		return this;
	}
	$container.css('height', 'auto');
	var $placeholder = $container.find('.Q_placeholder');
	var h = $placeholder[0].style.height;
	$placeholder[0].style.height = 'auto';
	var $t = $(this);
	setTimeout(function () {
		$t.add($container).css('min-height', $placeholder.outerHeight() + 'px');
		$placeholder[0].style.height = h;
		$t.removeClass('Q_autogrow_resizing');
	}, 0);
	return $container;
}

})(Q, Q.jQuery, window, document);