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
 * @param {Number|Element} [options.maxWidth] maxWidth The input won't get larger than this number or element
 * @default 1000
 * @param {Number} [options.minWidth] minWidth The input won't get smaller than this
 * @default 0
 * @param {Number} [options.comfortZone] How many pixels of padding to allocate for typing ahead
 * @default 10
 * @param [Q.Event] [options.onResize] Triggered during a size change, its "this" object is the jQuery selector of the plugin. If used with a text input, the first parameter is the new width.
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

	this.filter('textarea').each(function (i) {
		var $t = $(this), t = this;
		var val = '';

		t.style.resize = 'none';
		t.style.overflow = 'hidden';

		var tVal = t.value;			
		t.style.height = '0px';
		t.value = "W\nW\nW";
		var H3 = t.scrollHeight;
		t.value = "W\nW\nW\nW";
		var H4 = t.scrollHeight;
		var H = H4 - H3;
		t.value = tVal;
		tVal = null;

		++p.count;
		var $c = $t.parent();
		if (!$c.hasClass('Q_autogrow_container')) {
			$c = $('<div id="jQuery_fn_autogrow_'+p.count+'" class="Q_autogrow_container"></div>');
			$t.before($c);
			$t.appendTo($c);
		}
		var c = $c[0];
		c.style.padding = '0px';
		c.style.margin = '0px';

		$t.on('focus', function(){
			t.startUpdating()
		}).on('blur', function(){
			t.stopUpdating()
		});
		
		var prevH = 0;

		function updateHeight() {
			t.style.height = '0px';
			var tH = t.scrollHeight; // + H;
			t.style.height = tH + 'px';
			setTimeout(function () {
				c.style.height = t.offsetHeight + 'px';
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
			clearTimeout(t.timeout1);
			clearTimeout(t.timeout2);
		};
		
		updateHeight();
	});

	this.filter('input:text').each(function() {
		var minWidth = o.minWidth || 20;
		var val = '';
		var input = $(this);
		var testSubject = $(this).data('Q-tester');
		var $t = $(this);
		if (!testSubject) {
			testSubject = $('<div class="Q_tester"/>');
			$(this).data('Q-tester', testSubject);
			testSubject.insertAfter(input);
		}
		function updateWidth() {
			val = input.val();
			if (!val) {
				val = input.attr('placeholder') || '';
			}

			// Enter new content into testSubject
			var escaped = val.encodeHTML();
			testSubject.css({
				position: 'absolute',
				top: -9999,
				left: -9999,
				width: 'auto',
				'max-width': 'none',
				'max-height': 'none',
				fontSize: input.css('fontSize'),
				fontFamily: input.css('fontFamily'),
				fontWeight: input.css('fontWeight'),
				letterSpacing: input.css('letterSpacing'),
				padding: input.css('padding'),
				margin: input.css('margin'),
				whiteSpace: 'nowrap'
			});
			testSubject.html(escaped);

			// Calculate new width + whether to change
			testSubject.show();
			var testerWidth = testSubject.outerWidth(true);
			testSubject.hide();
			var newWidth = Math.max(testerWidth + o.comfortZone, minWidth);
			var currentWidth = input.outerWidth(true);
			var maxWidth = (typeof o.maxWidth === 'string')
				? $t.closest(o.maxWidth)[0]
				: o.maxWidth;
			if (maxWidth) {
				maxWidth = Q.instanceOf(maxWidth, Element)
					? $(maxWidth).innerWidth()
					: maxWidth;
			}
			var isValidWidthChange = ((
				(newWidth < currentWidth && newWidth >= minWidth)
				|| (newWidth > minWidth)
			) && (!maxWidth || newWidth <= maxWidth));

			// Animate width
			if (isValidWidthChange) {
				input.width(newWidth);
				Q.handle(o.onResize, $t, [newWidth]);
			} else if (input.width() < minWidth) {
				input.width(minWidth);
			}

		};

		$(this).off(possibleEvents).on(possibleEvents, updateWidth);
		updateWidth();

	});

	return this;

},

{	// default options:
	maxWidth: 1000,
	minWidth: 0,
	comfortZone: 10,
	onResize: new Q.Event()
}

);

var p = {
	count: 0
}

})(Q, jQuery, window, document);