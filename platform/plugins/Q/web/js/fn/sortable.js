(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */
	
/**
 * This jQuery plugin adds a behavior to a container that allows the user to sort its children via drag-and-drop in various environments.
 * @class Q sortable
 * @constructor
 * @param {Object} [options] options object which conatins parameters for function
 * @param {String} [options.draggable='*'] Selector for elements that can be dragged
 * @param {String} [options.droppable='*'] Selector for elements that can act as drop targets
 * @param {Number} [options.zIndex=999999] CSS z-index for sortable elements
 * @param {Number} [options.draggedOpacity=0.8] Element Drag effect opacity
 * @param {Number} [options.placeholderOpacity=0.1] Opacity for elements placeholder
 * @param {Object} [options.lift] parameters object for vertical movement
 *   @param {Number} [options.lift.delay=300] movement delay in milliseconds
 *   @param {Number} [options.lift.delayTouchscreen=300] movement delay for touchscreens in milliseconds
 *   @param {Number} [options.lift.threshhold=10] Start moving elemnt after threshhold pixels mouse (touch) dragging
 *   @param {Number} [options.lift.zoom=1.1] Zoom element on dragging
 *   @param {Number} [options.lift.animate=100] Animation speed in milliseconds
 * @param {Object} [options.scroll] parameters object for horisontal movement and scroll dragging
 *   @param {Number} [options.scroll.delay=300] movement delay in milliseconds
 *   @param {Number} [options.scroll.delayTouchscreen=300] movement delay for touchscreens in milliseconds
 *   @param {Number} [options.scroll.threshhold=10] Start moving elemnt after threshhold pixels mouse (touch) dragging
 *   @param {Number} [options.scroll.distance=1.5] Scrolling distance
 *   @param {Number} [options.scroll.distanceWindow=0.1] distance to block corner
 *   @param {Number} [options.scroll.speed=30] Element horizontal movement , scrolling speed
 *   @param {Number} [options.scroll.acceleration=0.1] Movement Step value
 * @param {Object} [options.drop] object for dropping effect options
 *   @param {Number} [options.drop.duration] Duration of dropping effect
 *   @default 300
 * @param {Q.Event} [options.onLift] This triggers when an item was lifted up for dragging
 * @param {Q.Event} [options.onIndicate] This triggers whenever a drop result is indicated
 * @param {Q.Event} [options.beforeDrop] This triggers right before a drop
 * @param {Q.Event} [options.onDrop] This triggers after a drop. You can override the default handler the tool attaches.
 * @param {Boolean} [options.requireDropTarget] Whether to prevent dropping on something that is not a drop target (not in options.droppable)
 * @default true
 * @param {Q.Event} [options.onSuccess] This event triggers after a successful drag and drop
 */
Q.Tool.jQuery('Q/sortable', function _Q_sortable(options) {

	var $this = $(this);
	var state = $this.state('Q/sortable');
	var mx, my, gx, gy, tLift, tScroll, iScroll, lifted, pressed;
	var $scrolling = null, ost = null, osl = null;

	state.draggable = state.draggable || '*';
	$this.off([Q.Pointer.start, '.Q_sortable']);
	$this.off([Q.Pointer.end, '.Q_sortable']);
	$this.on([Q.Pointer.start, '.Q_sortable'], state.draggable, liftHandler);
	$this.on([Q.Pointer.end, '.Q_sortable'], state.draggable, function () {
		if (tLift) clearTimeout(tLift);

		$this.off(Q.Pointer.move, moveHandler);
		Q.removeEventListener(body, Q.Pointer.move, moveHandler, false);
	});

	$('*', $this).css('-webkit-touch-callout', 'none');
	$this.off('dragstart.Q_sortable');
	$this.on('dragstart.Q_sortable', state.draggable, function () {
		if (state.draggable === '*' && this.parentNode !== $this[0]) {
			return;
		}
		return false;
	});

	state.onCancelClickEventKey = Q.Pointer.onCancelClick.set(
	function (event, extraInfo) {
		if (!extraInfo || !extraInfo.comingFromSortable) {
			complete(true);
		}
		if (tLift) {
			clearTimeout(tLift);
		}
	});

	function liftHandler(event) {
		if (Q.Pointer.canceledClick
			|| $(event.target).parents('.Q_discouragePointerEvents').length
			|| $(event.target).is('.Q_discouragePointerEvents')) {
			return;
		}
		if (Q.Pointer.which(event) > 1) {
			return; // only left mouse button or touches
		}
		pressed = true;
		if (state.draggable === '*' && this.parentNode !== $this[0]) {
			return;
		}
		var $item = $(this);
		_setStyles(this);
		$('body')[0].preventSelections(true);
		this.preventSelections(true);
		function leaveHandler(event) {
			if (event.target === document) {
				complete(true);
			}
		}
		$(document)
		.off('keydown.Q_sortable')
		.on('keydown.Q_sortable', function (e) {
			if (lifted && e.keyCode == 27) { // escape key
				complete(true, true);
				return false;
			}
		})
		.off([Q.Pointer.cancel, 'Q_sortable'])
		.off([Q.Pointer.leave, 'Q_sortable'])
		.on([Q.Pointer.cancel, 'Q_sortable'], leaveHandler)
		.on([Q.Pointer.leave, 'Q_sortable'], leaveHandler);
		moveHandler.xStart = mx = Q.Pointer.getX(event);
		moveHandler.yStart = my = Q.Pointer.getY(event);
		var element = this;
		var sl = [], st = [];
		$body.data(dataLifted, $(this));
		$item.off(Q.Pointer.move, moveHandler)
		.on(Q.Pointer.move, moveHandler);
		Q.removeEventListener(body, [Q.Pointer.end, Q.Pointer.cancel], dropHandler);
		Q.removeEventListener(body, Q.Pointer.move, dropHandler);
		Q.addEventListener(body, [Q.Pointer.end, Q.Pointer.cancel], dropHandler, false, true);
		Q.addEventListener(body, Q.Pointer.move, moveHandler, false, true);
		$item.parents().each(function () {
			sl.push(this.scrollLeft);
			st.push(this.scrollTop);
		});
		tLift = setTimeout(function () {
			var efp = Q.Pointer.elementFromPoint(moveHandler.xStart, moveHandler.yStart), i=0, cancel = false;
			$item.parents().each(function () {
				if (this.scrollLeft !== sl[i] || this.scrollTop !== st[i]) {
					cancel = true;
					return false;
				}
				++i;
			});
			if (cancel || !pressed || !(element.contains(efp))) {
				return;
			}
			lift.call(element, event);
		}, Q.info.useTouchEvents ? state.lift.delayTouchscreen : state.lift.delay);
		state.moveHandler = moveHandler;
		state.dropHandler = dropHandler;
	}

	function lift(event) {
		if (tLift) clearTimeout(tLift);

		var $item = $(this);
		if ($item.parents('.Q_discouragePointerEvents').length) {
			return;
		}

		Q.Pointer.cancelClick(false, event, {
			comingFromSortable: true
		});

		if (Q.Pointer.touchCount(event) !== 1) return;

		var x = Q.Pointer.getX(event),
			y = Q.Pointer.getY(event),
			offset = $item.offset();

		$('body')[0].preventSelections(true);
		this.preventSelections(true);
		this.cloned = this.cloneNode(true).copyComputedStyle(this);
		this.cloned.preventSelections(true);
		Q.find(this, null, function (element, options, shared, parent, i) {
			if (parent) {
				var children = parent.cloned.children || parent.cloned.childNodes;
				element.cloned = children[i].copyComputedStyle(element);
			}
		});
		var $placeholder = $(this.cloned).css({
			opacity: state.placeholderOpacity
		}).insertAfter($item); //.hide('slow');

		_hideActions();

		this.cloned = this.cloneNode(true).copyComputedStyle(this);
		Q.find(this, null, function (element, options, shared, parent, i) {
			if (parent) {
				var children = parent.cloned.children || parent.cloned.childNodes;
				element.cloned = children[i].copyComputedStyle(element);
			}
		});

		gx = x - offset.left;
		gy = y - offset.top;

		var $dragged = $(this.cloned);
		state.prevStyleTransition = this.cloned.style.transition;
		this.cloned.style.transition = 'none';
		delete this.cloned;

		$('*', $dragged).each(function () {
			$(this).css('pointerEvents', 'none');
		});

		$item.hide();
		$(this).data('Q/sortable', {
			$placeholder: $placeholder,
			$dragged: $dragged,
			parentNode: $placeholder[0].parentNode,
			nextSibling: $placeholder[0].nextSibling,
			position: $item.css('position'),
			left: $item.css('left'),
			top: $item.css('top'),
			zIndex: $item.css('z-index'),
		});
		$placeholder.css('pointer', 'move')
			.addClass('Q-sortable-placeholder');
		$dragged.prependTo('body')
			.css({
				opacity: state.draggedOpacity,
				position: 'absolute',
				zIndex: $this.state('Q/sortable').zIndex,
				pointerEvents: 'none'
			}).css({ // allow a reflow to occur
				left: x - gx,
				top: y - gy
			}).addClass('Q-sortable-dragged');
		var factor = state.lift.zoom;
		if (factor != 1) {
			Q.Animation.play(function (x, y) {
				var f = factor*y+(1-y);
				$dragged.css({
					'-moz-transform': 'scale('+f+')',
					'-webkit-transform': 'scale('+f+')',
					'-o-transform': 'scale('+f+')',
					'-ms-transform': 'scale('+f+')',
					'transform': 'scale('+f+')'
				});
			}, state.lift.animate);
		}
		lifted = true;
		$item.parents().each(function () {
			$(this).off('scroll.Q_sortable')
			.on('scroll.Q_sortable', function () {
				return false; // don't scroll parents while we are dragging
			});
		});
		Q.handle(state.onLift, $this, [this, {
			event: event,
			$dragged: $dragged,
			$placeholder: $placeholder
		}]);
	}
	
	function dropHandler(event, target) {
		pressed = false;
		$('body')[0].restoreSelections(true);
		if (!lifted) {
			return;
		}
		var x = Q.Pointer.getX(event);
		var y = Q.Pointer.getY(event);
		var $target = getTarget(x, y);
		var $item = $body.data(dataLifted);
		if(Q.isEmpty($item)){
			return;
		}
		var data = $item.data('Q/sortable');
		if (data) {
			data.$dragged[0].style.transition = state.prevStyleTransition;
		}
		moveHandler.xStart = moveHandler.yStart = null;
		complete(!$target && state.requireDropTarget);
	}

	function complete(revert, pointerDidntEnd) {
		
		if (!pressed && !lifted) {
			return;
		}

		_restoreActions();
		_restoreStyles();
		
		Q.Pointer.cancelClick(false, null, {
			comingFromSortable: true
		});
		if (!pointerDidntEnd) {
			Q.Pointer.ended(); // because mouseleave occurs instead on some browsers
		}
		body.restoreSelections(true);
		
		var $item = $body.data(dataLifted);
		if ($item) {
			$item.off(Q.Pointer.move, moveHandler);
		}
		Q.removeEventListener(body, Q.Pointer.move, moveHandler, false);
		Q.removeEventListener(body, [Q.Pointer.end, Q.Pointer.cancel], dropHandler, false);

		if (tLift) clearTimeout(tLift);
		if (tScroll) clearTimeout(tScroll);
		if (iScroll) clearInterval(iScroll);
		
		$body.removeData(dataLifted);
		if (!$item) return;
		
		var data = $item.data('Q/sortable');
		if (!data) return;

		var params = {
			$placeholder: data.$placeholder,
			$dragged: data.$dragged,
			$scrolling: $scrolling
		};

		if (revert) {
			$item.show();
			params.direction = 0;
			params.target = null;
		} else {
			if (data.$placeholder.next()[0] === $item[0]
			|| data.$placeholder.prev()[0] === $item[0]) {
				params.direction = 0;
				params.target = null;
			} else if ($item[0].isBefore(data.$placeholder[0])) {
				params.direction = 1;
				params.target = params.$placeholder.prev()[0];
			} else {
				params.direction = -1;
				params.target = params.$placeholder.next()[0];
			}
		}

		$item.parents().each(function () {
			$(this).off('scroll.Q_sortable');
		});

		lifted = false;
		if (revert && $scrolling) {
			$scrolling.scrollLeft(osl);
			$scrolling.scrollTop(ost);
		}
		$item.css({
			position: data.position,
			zIndex: data.zIndex
		}).css({
			left: data.left,
			top: data.top
		});

		Q.handle(state.beforeDrop, $this, [$item, revert, params]);

		if (!revert) {
			$item.insertAfter(data.$placeholder).show();
		}
		data.$placeholder.hide();
		$item.removeData('Q/sortable');

		Q.handle(state.onDrop, $this, [$item, revert, params]);

		if (!revert) {
			Q.handle(state.onSuccess, $this, [$item, params]);
		}
		if (!data.$placeholder.retain) {
			data.$placeholder.remove();
		}
		if (!data.$dragged.retain) {
			data.$dragged.remove();
		}
		ost = osl = null;
		$scrolling = null;
	}

	function moveHandler(event) {
		var $item = $body.data(dataLifted), x, y;
		if (!$item) {
			return;
		}
		if (!Q.Pointer.started
		|| Q.Pointer.touchCount(event) !== 1) {
			complete(true);
			return;
		}
		mx = x = Q.Pointer.getX(event);
		my = y = Q.Pointer.getY(event);
		if (!Q.info.isTouchscreen && !lifted) {
			if ((moveHandler.xStart !== undefined && Math.abs(moveHandler.xStart - x) > state.lift.threshhold)
				|| (moveHandler.yStart !== undefined && Math.abs(moveHandler.yStart - y) > state.lift.threshhold)) {
				lift.call($item[0], event);
			}
		}
		if ((moveHandler.x !== undefined && Math.abs(moveHandler.x - x) > state.scroll.threshhold)
			|| (moveHandler.y !== undefined && Math.abs(moveHandler.y - y) > state.scroll.threshhold)) {
			scrolling($item, x, y);
		}
		moveHandler.x = x;
		moveHandler.y = y;
		if (lifted) {
			move($item, x, y);
			return false;
		}
	}

	i = 0;
	var move = Q.throttle(function ($item, x, y) {
		var data;
		if (data = $item.data('Q/sortable')) {
			data.$dragged.css({
				left: x - gx,
				top: y - gy
			});
		}
		removeTextSelections();
		indicate($item, x, y);
	}, 25, true);
	
	var removeTextSelections = Q.throttle(function () {
		var sel = window.getSelection ? window.getSelection() : document.selection;
		if (sel) {
			if (sel.removeAllRanges) {
				sel.removeAllRanges();
			} else if (sel.empty) {
				sel.empty();
			}
		}
	}, 300);

	function scrolling($item, x, y) {
		if (tScroll) clearTimeout(tScroll);
		if (!lifted) return;
		var dx = 0, dy = 0, isWindow = false;
		var speed = state.scroll.speed;
		var beyond = false;
		$item.parents().each(function () {
			var $t = $(this);
			if ($t.css('overflow') === 'visible' && !$t.is('body')) {
				return;
			}
			if (!$t.is('body') && $t.width()) {
				if ($t.scrollLeft() > 0
					&& x < $t.offset().left + $t.width() * state.scroll.distance) {
					dx = -speed;
					beyond = (x < $t.offset().left);
				}
				if ($t.scrollLeft() + $t.innerWidth() < this.scrollWidth
					&& x > $t.offset().left + $t.width() * (1-state.scroll.distance)) {
					dx = speed;
					beyond = (x > $t.offset().left + $t.width());
				}
			}
			if (!$t.is('body') && $t.height()) {
				if ($t.scrollTop() > 0
					&& y < $t.offset().top + $t.height() * state.scroll.distance) {
					dy = -speed;
					beyond = (y < $t.offset().top);
				}
				if ($t.scrollTop() + $t.innerHeight() < this.scrollHeight
					&& y > $t.offset().top + $t.height() * (1-state.scroll.distance)) {
					dy = speed;
					beyond = (y > $t.offset().top + $t.height());
				}
			}
			var $w = $(window);
			if (x - document.body.scrollLeft < $w.innerWidth() * state.scroll.distanceWindow) {
				dx = -speed; isWindow = true;
			}
			if (x - document.body.scrollLeft > $w.innerWidth() * (1 - state.scroll.distanceWindow)) {
				dx = speed; isWindow = true;
			}
			if (y - document.body.scrollTop < $w.innerHeight() * state.scroll.distanceWindow) {
				dy = -speed; isWindow = true;
			}
			if (y - document.body.scrollTop > $w.innerHeight() * (1 - state.scroll.distanceWindow)) {
				dy = speed; isWindow = true;
			}
			if (dx || dy) {
				$scrolling = $t;
				osl = (osl === null) ? $scrolling.scrollLeft() : osl;
				ost = (ost === null) ? $scrolling.scrollTop() : ost;
				return false;
			}
		});
		if (!dx && !dy) {
			if (iScroll) clearInterval(iScroll);
			scrolling.accel = 0;
			return;
		}
		var delay = Q.info.useTouchEvents ? state.scroll.delayTouchscreen : state.scroll.delay;
		tScroll = setTimeout(function () {
			var draggable;
			if (iScroll) clearInterval(iScroll);
			iScroll = setInterval(function () {
				scrolling.accel = scrolling.accel || 0;
				scrolling.accel += state.scroll.acceleration;
				scrolling.accel = Math.min(scrolling.accel, 1);
				var $s = isWindow ? $(window) : $scrolling;
				if (dx) $s.scrollLeft($s.scrollLeft()+dx*scrolling.accel);
				if (dy) $s.scrollTop($s.scrollTop()+dy*scrolling.accel);
				move($item, x, y);
			}, 50);
		}, beyond ? 0 : delay);
	}

	function getDraggable(state) {
		return (state.draggable === '*') ? $this.children() : $(state.draggable, $this);
	}

	function getTarget(x, y) {
		var element = Q.Pointer.elementFromPoint(x, y);
		var $target = null;
		state.droppable = state.droppable || '*';
		var $jq = (state.droppable === '*')
			? $this.children(state.droppable)
			: $(state.droppable, $this);
		$jq.each(function () {
			if (this.contains(element)) {
				$target = $(this);
				return false;
			}
		});
		return $target;
	}

	function indicate($item, x, y) {
		var $target = getTarget(x, y);
		var data = $item.data('Q/sortable');
		if (!data) {
			return;
		}
		data.$dragged.css('pointerEvents', 'none');
		var element = Q.Pointer.elementFromPoint(x, y);
		var offset = $this.offset();
		if ($(element).closest($this).length
			|| ((x >= offset.left && x <= offset.left + $this.width()
			&& y >= offset.top && y <= offset.top + $this.height()))) {
			data.$dragged.css('pointerEvents', 'none');
		} else {
			data.$dragged.css('pointerEvents', 'auto');
		}

		var $placeholder = data.$placeholder;
		if (!$target) {
			if (state.requireDropTarget) {
				$item.after($placeholder);
			}
			return;
		}
		if ($target.is($placeholder)) {
			return;
		}
		var direction;
		var $n = $target.next(), $p = $target.prev();
		while ($n.length && !$n.is(':visible')) {
			$n = $n.next();
		}
		while ($p.length && !$p.is(':visible')) {
			$p = $p.prev();
		}
		var tw = $target.width(),
			th = $target.height(),
			toff = $target.offset(),
			nh = $n.height(),
			noff = $n.offset(),
			ph = $p.height(),
			poff = $p.offset();
		var condition = ((poff && poff.top + ph <= toff.top) || (noff && toff.top + th <= noff.top))
			? (y < toff.top + th/2)
			: (x < toff.left + tw/2);
		if (condition) {
			$target.before($placeholder);
			direction = 'before';
		} else {
			$target.after($placeholder);
			direction = 'after';
		}
		data.$prevTarget = $target;
		Q.handle(state.onIndicate, $this, [$item, {
			$target: $target,
			direction: direction,
			$placeholder: $placeholder,
			$dragged: data.$dragged,
			$scrolling: $scrolling
		}]);
	}

	function _hideActions() { // Temporarily hide Q/actions if any
		state.actionsContainer = $('.Q_actions_container');
		state.actionsContainerVisibility = state.actionsContainer.css('visibility');
		state.actionsContainer.css('visibility', 'hidden');
	}

	function _restoreActions() { // Restore Q/actions if any
		if (!state.actionsContainer) return;
		state.actionsContainer.css('visibility', state.actionsContainerVisibility);
		delete state.actionsContainer;
		delete state.actionsContainerVisibility;
	}

	function _setStyles(elem) {
		if (!elem) return;
		state.prevWebkitUserSelect = elem.style.webkitUserSelect;
		state.prevWebkitTouchCallout = elem.style.webkitTouchCallout;
		state.elem = elem;
		elem.style.webkitUserSelect = 'none';
		elem.style.webkitTouchCallout = 'none';
	}

	function _restoreStyles() {
		if (!state.elem) return;
		state.elem.style.webkitUserSelect = state.prevWebkitUserSelect;
		state.elem.style.webkitTouchCallout = state.prevWebkitTouchCallout;
		state.prevWebkitUserSelect = state.prevWebkitTouchCallout = state.elem = null;
	}
},

{	// default options:
	draggable: '*', // which elements can be draggable
	droppable: '*', // which elements can be moved
	zIndex: 999999,
	draggedOpacity: 0.8,
	placeholderOpacity: 0.1,
	lift: {
		delay: 300,
		delayTouchscreen: 300,
		threshhold: 10,
		zoom: 1.1,
		animate: 100
	},
	scroll: {
		delay: 300,
		delayTouchscreen: 300,
		threshhold: 0,
		distance: 0.15,
		distanceWindow: 0.1,
		speed: 30,
		acceleration: 0.1
	},
	drop: {
		duration: 300
	},
	requireDropTarget: true,
	onLift: new Q.Event(),
	onIndicate: new Q.Event(),
	beforeDrop: new Q.Event(),
	onDrop: new Q.Event(function ($item, revert, data) {
		var offset = $item.offset();
		var moreleft = 0, moretop = 0;
		var $scrolling = data.$scrolling;
		var duration = this.state('Q/sortable').drop.duration;
		if ($scrolling) {
			var so, il, it, ir, ib, sl, st, sr, sb, ssl, sst;
			so = $scrolling.offset();
			il = offset.left;
			it = offset.top;
			ir = il + $item.width();
			ib = it + $item.height();
			ssl = $scrolling.scrollLeft();
			sst = $scrolling.scrollTop();

			var found = false;
			$item.parents().each(function () {
				var $t = $(this);
				if ($t.css('overflow') !== 'visible' && !$t.is('body')) {
					found = true;
					return false;
				}
			});

			if (found) { // found a scrollable container
				sl = so.left;
				st = so.top;
				sr = so.left + $scrolling.width(),
					sb = so.top + $scrolling.height();
			} else {
				sl = ssl;
				st = sst;
				sr = ssl + $(window).innerWidth();
				sb = sst + $(window).innerHeight();
			}
			if (il < sl) {
				$scrolling.animate({'scrollLeft': ssl + il - sl}, duration);
				moreleft = sl - il;
			}
			if (it < st) {
				$scrolling.animate({'scrollTop': sst + it - st}, duration);
				moretop = st - it;
			}
			if (ir > sr) {
				$scrolling.animate({'scrollLeft': ssl + ir - sr}, duration);
				moreleft = sr - ir;
			}
			if (ib > sb) {
				$scrolling.animate({'scrollTop': sst + ib - sb}, duration);
				moretop = sb - ib;
			}
		}
		$item.css('opacity', 0).animate({'opacity': 1}, duration);
		data.$dragged.animate({
			opacity: 0,
			left: offset.left + moreleft,
			top: offset.top + moretop
		}, duration, function () {
			data.$dragged.remove(); // we have to do it ourselves since we retained it
		});
		data.$dragged.retain = true;
	}, 'Q/sortable'),
	onSuccess: new Q.Event()
},
	
{
	remove: function () {
		// TODO: implement cleanup
		var $item = $body.data(dataLifted);
		var data;
		if ($item) {
			if ((data = $item.data('Q/sortable')) && data.$dragged) {
				data.$dragged.remove();
			}
			$item.off(Q.Pointer.move, state && state.moveHandler);
		}
		$body.removeData(dataLifted).off('.Q_sortable');
		this.removeData('Q/sortable');
		this.off('.Q_sortable');
		var state = this.state('Q/sortable');
		if (state) {
			Q.Pointer.onCancelClick.remove(state.onCancelClickEventKey);
			if (state.moveHandler) {
				Q.removeEventListener(body, Q.Pointer.move, state.moveHandler, false);
				Q.removeEventListener(body, [Q.Pointer.end, Q.Pointer.cancel], state.dropHandler, false);
			}
		}
	}
}

);

var $body = $('body');
var body = $body[0];
var dataLifted = 'Q/sortable dragging';

})(Q, Q.$, window, document);