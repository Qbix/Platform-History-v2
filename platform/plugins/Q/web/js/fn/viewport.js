(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * This plugin enables the user to move & scale content inside a container using the mouse
 * and mousewheel, or touches on a touchscreen.
 * @class Q viewport
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {String} [options.containerClass] any class names to add to the actions container
 *   @default ''
 *   @param {Object} [options.initial] can be used to set initial bounds of content to display inside tool.
 *   @param {Object} [options.initial.x] horizontal midpoint, from 0 to 1
 *   @param {Object} [options.initial.y] horizontal midpoint, from 0 to 1
 *   @param {Object} [options.initial.scale] initial scale
 *   @param {Q.Event} [options.onRelease] This event triggering after viewport creation
 *   @default Q.Event()
 *   @param {Q.Event} [options.onScale] Occurs when the user scales the content
 *   @default Q.Event()
 *   @param {Q.Event} [options.onMove] Occurs when user moves the content around
 *   @default Q.Event()
 *   @param {Q.Event} [options.onUpdate] Occurs when the selection changes in any way
 *   @default Q.Event()
 */
Q.Tool.jQuery('Q/viewport',

function _Q_viewport(options) {
	var container, stretcher;
	var position = this.css('position');
	var display = this.css('display');
	var state = this.addClass('Q_viewport').state('Q/viewport');
	var $this = $(this);
	state.oldCursor = this.css('cursor');
	this.css('cursor', 'move');

	var ow = this.outerWidth(true);
	var oh = this.outerHeight(true);
	if (!state.width) { state.width = ow; }
	if (!state.height) { state.height = oh; }
	if ( this.parent('.Q_viewport_stretcher').length ) {
        stretcher = this.parent();
        container = stretcher.parent();
    } else {
		container = $('<span class="Q_viewport_container" />').css({
			'display': (display === 'inline' || display === 'inline-block') ? 'inline-block' : display,
			'zoom': 1,
			'position': position === 'static' ? 'relative' : position,
			'left': position === 'static' ? 0 : this.position().left,
			'top': position === 'static' ? 0 : this.position().top,
			'margin': '0px',
			'padding': '0px',
			'border': '0px solid transparent',
			'float': this.css('float'),
			'z-index': this.css('z-index'),
			'overflow': 'hidden',
			'width': state.width + 'px',
			'height': state.height + 'px',
			'text-align': 'left',
			'overflow': 'hidden',
			'line-height': this.css('line-height'),
			'vertical-align': this.css('vertical-align'),
			'text-align': this.css('text-align')
		}).addClass('Q_viewport_container ' + (options.containerClass || ''))
		.insertAfter(this);
		
		stretcher = $('<div class="Q_viewport_stretcher" />')
		.appendTo(container)
		.append(this);
	}
	
	var initial = state.initial;
	var iw = ow, ih = oh, il = 0, it = 0;
	if (initial && initial.x) {
		il -= iw * initial.x - state.width/2;
	}
	if (initial && initial.y) {
		it -= ih * initial.y - state.height/2;
	}
	
	stretcher.css({
		'position': 'absolute',
		'overflow': 'visible',
		'padding': '0px',
		'margin': '0px',
		'left': il+'px',
		'top': it+'px',
		'width': ow+0.5+'px',
		'height': oh+0.5+'px',
	});
	
	var useZoom = Q.info.isIE(0, 8);
	var offset = stretcher.offset();	
	var grab = null;
	var cur = null;
	var pos = {
		left: parseInt(stretcher.css('left')),
		top: parseInt(stretcher.css('top'))
	};
	
	var s = (initial && initial.scale)
		|| (state.minScale + state.maxScale) / 2
		|| 1;
	state.scale = Math.max(state.minScale, Math.min(state.maxScale, s));
	var off = stretcher.offset();
	scale(state.scale, off.left+ow/2, off.top+oh/2);

	state.$container = container;
	state.$stretcher = stretcher;
	pos = null;
	
	container.on('dragstart', function () {
		return false;
	}).on(Q.Pointer.start, function (e) {
		
		var f = useZoom ? state.scale : 1;
		var touches = e.originalEvent.touches;
		var touchDistance;
		if (touches && touches.length > 1) {
			touchDistance = Math.sqrt(
				Math.pow(touches[1].pageX - touches[0].pageX, 2) +
				Math.pow(touches[1].pageY - touches[0].pageY, 2)
			);
		}
		
		function _moveHandler (e) {
			var offset, touches;
			offset = stretcher.offset();
			cur = {
				x: Q.Pointer.getX(e),
				y: Q.Pointer.getY(e)
			};
			if (!pos) return;
			if (Q.info.isTouchscreen && (touches = e.originalEvent.touches)) {
				if (touches.length > 1) {
					var newDistance = Math.sqrt(
						Math.pow(touches[1].pageX - touches[0].pageX, 2) +
						Math.pow(touches[1].pageY - touches[0].pageY, 2)
					);
					if (touchDistance) {
						var midX = (touches[0].pageX + touches[1].pageX) / 2;
						var midY = (touches[0].pageY + touches[1].pageY) / 2;
						var factor = state.scale * newDistance / touchDistance;
						scale(factor, midX, midY);
					}
					touchDistance = newDistance;
				}
			} else if (Q.Pointer.which(e) !== Q.Pointer.which.LEFT) {
				return;
			}
			var x = Q.Pointer.getX(e);
			var y = Q.Pointer.getY(e);
			var newPos = {
				left: pos.left + (x - grab.x)/f,
				top: pos.top + (y - grab.y)/f
			};
			fixPosition(newPos);
			stretcher.css(newPos);
			Q.Pointer.cancelClick(e, null, true); // even on the slightest move
			Q.handle(state.onMove, $this, [state.selection, state.scale]);
			Q.handle(state.onUpdate, $this, [state.selection, state.scale]);
			e.preventDefault();
		}
		
		function _endHandler (e) {
			start = pos = null;
			container.off(Q.Pointer.move);
			$(window).off(Q.Pointer.end, _endHandler);
			$(window).off(Q.Pointer.clickHandler, _clickHandler);
			e.preventDefault();
		}
		
		function _cancelHandler (e) {
			$(window).off(Q.Pointer.end, _endHandler);
			$(window).off(Q.Pointer.clickHandler, _clickHandler);
		}
		
		function _clickHandler (e) {
			$(window).off(Q.Pointer.clickHandler, _clickHandler);
			e.preventDefault();
		}
		
		if (Q.Pointer.canceledClick) {
			return;
		}
		grab = cur = {
			x: Q.Pointer.getX(e),
			y: Q.Pointer.getY(e)
		};
		pos = {
			left: parseInt(stretcher.css('left')),
			top: parseInt(stretcher.css('top'))
		};
		container.on(Q.Pointer.move, _moveHandler);
		$(window).on(Q.Pointer.end, _endHandler);
		$(window).on(Q.Pointer.cancel, _cancelHandler);
		$(window).on(Q.Pointer.click, _clickHandler);
	});
	
	container.on(Q.Pointer.wheel, function (e) {
		if (Q.Pointer.started) {
			return;
		}
		if (typeof e.deltaY === 'number' && !isNaN(e.deltaY)) {
			scale(
				state.scale - e.deltaY * 0.01,
				Q.Pointer.getX(e),
				Q.Pointer.getY(e)
			);
		}
		return false;
	});
	
	function scale(factor, x, y) {
		if (state.maxScale > 0) {
			factor = Math.min(state.maxScale, factor);
		}
		factor = Math.max(0, state.minScale, factor);
		var cw = container.width();
		var ch = container.height();
		var sw = stretcher.width();
		var sh = stretcher.height();
		var f = useZoom ? state.scale : 1;
		var w = sw*factor/f;
		var h = sh*factor/f;
		if (w < cw || h < ch) { // don't let it get too small
			factor = Math.max(cw / sw * f, ch / sh * f);
		}
		var df = factor / state.scale - 1;
		var left1, left2, left3, top1, top2, top3, offset, css;
		var offset = stretcher.offset();
		left1 = parseInt(stretcher.css('left')) * f;
		top1 = parseInt(stretcher.css('top')) * f;
		left1 -= (x - offset.left) * df;
		top1 -= (y - offset.top) * df;
		if (!useZoom) {
			css = { 
				left: left1,
				top: top1,
				transform: 'scale('+factor+')',
				transformOrigin: '0% 0%'
			};
			fixPosition(css);
			for (var k in css) {
				css[Q.info.browser.prefix+k] = css[k];
			}
			stretcher.css(css);
		} else if (!scale.inProgress) {
			scale.inProgress = true;
			css = {
				left: left1 / factor,
				top: top1 / factor,
				zoom: factor
			};
			fixPosition(css);
			stretcher.css(css);
			scale.inProgress = false;
		}
		if (state.scale !== factor) {
			Q.handle(state.onScale, $this, [state.selection, state.scale]);
			Q.handle(state.onUpdate, $this, [state.selection, state.scale]);
		}
		state.scale = factor;
	}
	
	function fixPosition(pos) {
		var s = state.scale;
		var f = useZoom ? s : 1;
		var cw = container.width();
		var ch = container.height();
		var w = stretcher.width()*s/f;
		var h = stretcher.height()*s/f;
		var w2 = cw/f - w;
		var h2 = ch/f - h;
		var left = Math.min(0, Math.max(parseFloat(pos.left), w2+1));
		var top = Math.min(0, Math.max(parseFloat(pos.top), h2+1));
		pos.left = left + 'px';
		pos.top = top + 'px';
		state.selection = {
			left: -left/w,
			top: -top/h,
			width: cw/w,
			height: ch/h
		};
	}
},

{	// default options:
	containerClass: '', // any class names to add to the actions container
	initial: null,
	scale: 1,
	minScale: null,
	maxScale: 2,
	width: null,
	height: null,
	onRelease: new Q.Event(),
	onScale: new Q.Event(),
	onMove: new Q.Event(),
	onUpdate: new Q.Event()
},

{
	remove: function () {
		this.css('cursor', this.state('Q/viewport').oldCursor);
	}
}

);

})(Q, jQuery, window, document);