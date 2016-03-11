(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * Activates placeholder effect on any input and textarea elements contained within this jquery.
 * Attribute placeholder must be set for element
 * @class Q placeholders
 * @constructor
 * @param {Object} [options]
 */
Q.Tool.jQuery('Q/placeholders',

function () {
	
	return this.plugin('Q/placeholders', 'setup');
},

{
	// properties
},

{
	setup: function () {
		
		function manage(event) {
			var $this = $(this);
			var $placeholder = $this.data('Q-placeholder');
			if (!$placeholder) {
				return;
			}
			var p;
			if (p = $this.attr('placeholder')) {
				$placeholder.text(p);
				$this.removeAttr('placeholder');
			}
			if ($this.val()) { //  || event.type === 'keypress' || event.type === 'change'
				$placeholder.hide();
			} else {
				$placeholder.show();
			}
		}
		
		$('input', this)
		.add($(this))
		.not('input.Q_leave_alone')
		.not('input[type=file]')
		.not('input[type=hidden]')
		.not('input[type=submit]')
		.add('textarea', this).each(function () {
			var t = this.tagName.toLowerCase();
			if (t != 'input' && t != 'textarea') return;
		
			var $this = $(this);
		
			var plch = $this.attr('placeholder');
			$this.removeAttr('placeholder');
			if(!(plch))
				return;

			if (!$this.is(':visible')) {
				return;
			}
			var span = $('<span />')
				.css('position', 'relative')
				.addClass('Q_placeholders_container');
			var cs = $this[0].getBoundingClientRect();
			var csw = cs.right - cs.left; // the object can change, so get the values now
			var csh = cs.bottom - cs.top;
			$this.css({
				'width': csw,
				'height': csh
			}); // because they might have been percentages
			Q.each(['left', 'right', 'top', 'bottom'], function (i, pos) {
				$this.css('padding-'+pos, $this.css('padding-'+pos))
					.css('margin-'+pos, $this.css('margin-'+pos));
			});
			$this.wrap(span);
			span = $this.parent();
			span.on(Q.Pointer.fastclick, function() {
				$this.trigger('focus');
			});
			var $placeholder = $('<div />').text(plch).css({
				'position': 'absolute',
				'left': $this.position().left,
				'top': $this.position().top,
				'margin-top': $this.css('margin-top'),
				'margin-left': $this.css('margin-left'),
				'padding-left': parseInt($this.css('padding-left'))+3+'px',
				'padding-top': $this.css('padding-top'),
				'border-top': 'solid ' + $this.css('border-top-width') + ' transparent',
				'border-left': 'solid ' + $this.css('border-left-width') + ' transparent',
				'box-sizing': $this.css('box-sizing'),
				'font-size': $this.css('font-size'),
				'font-weight': $this.css('font-weight'),
				'line-height': $this.css('line-height'),
				'overflow': 'hidden',
				'width': $this.css('width'),
				'height': $this.css('height'),
				'text-align': $this.css('text-align'),
				'pointer-events': 'none',
				'color': $this.css('color'),
				'opacity': '0.5'
			}).addClass('Q_placeholder').insertAfter($this);
			if (t === 'input') {
				$placeholder.css('white-space', 'nowrap');
			}
			// IE8 workaround
			$placeholder[0].style.fontFamily = $this[0].style.fontFamily;
			if ($this.val()) {
				$placeholder.stop().hide();
			}
			var interval;
			$this.focus(function () {
				$placeholder.parent().addClass('Q_focus');
			});
			$this.blur(function () {
				$placeholder.parent().removeClass('Q_focus');
				if (interval) clearInterval(interval);
			});
			$this.data('Q-placeholder', $placeholder);
		}).on('keypress keyup change input focus paste blur'
		    + ' Q_refresh Q_refresh_placeholders',
			manage
		);
	}
}

);

})(Q, jQuery, window, document);