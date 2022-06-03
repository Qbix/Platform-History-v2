/**
 * Provides a set of tools mostly related to client side of the application.
 * This includes tools for application layout management depending on different conditions, some convenient UI
 * elements for interaction and navigation and other.
 * @module Q
 * @submodule Tools
 */
(function (Q, $) {

	/**
	 * Operates contextuals: adding, event handling, showing, hiding.
	 * @class Q.Contextual
	 */
	Q.Contextual = {
	
		// stores all contextuals in array of object, each object contains two jQuery objects inside: trigger and contextual,
		// and optional 'info' field, which may contain arbitrary data assosiated with given contextual;
		// so it's like [{ 'trigger': obj, 'contextual': obj, 'info': obj }]
		collection: [],

		// stores currently shown contextual id, it's '-1' when no contextual is shown at the moment
		current: -1,

		// stores current mouse position inside body
		currentMousePosition: [0, 0],

		// timeout before react on mousemove event on desktop
		mousemoveTimeout: Q.info.isTouchscreen ? 0 : 300,

		// indicates if contextual show() has just been called, need to prevent contextual hiding in 'start' lifecycle handler
		justShown: false,
	
		// contextual fade-in / fade-out time
		fadeTime: 0,
	
		// timeout to dismiss contextual when trigger element tap & hold'ed too long
		dismissTimeout: 1000,
	
		// indicates that the contextual is about to be dismissed because timeout passed
		toDismiss: false,
	
		// option which indicates whether to allow contextual show when mouseover'ing trigger element (only for desktop version)
		triggerOnHover: true,
	
		// settable value to temporary disable contextual showing
		triggeringDisabled: false,

		// timeout before hide
		hideDelay: 0,

		/**
		 * Adds a contextual to the collection for further managing it.
	     * @method add
		 * @param {Object|String} trigger . Required. DOM element, jQuery object or jQuery selector which triggers
		 *				contextual showing on mousedown / touchstart event.
		 * @param {Object|String}  contextual . Required. DOM element, jQuery object or jQuery selector.
		 *	 This is the element to be shown as contextual.
		 *	 It must have such structure:
		 *	 <div class="Q_contextual" data-handler="[javascript function name]">
					 <ul class="Q_listing">
						 <!-- data-action is only demonstrational here, you may make attribute of you choice, 'data-item' for example.
									You also may provide 'data-handler' for each item separately -->
						 <li data-action="[some-action]">...</li>
						 ...
					 </ul>
				 </div>
		 *	 For easier creation of such element it's recommended to use Q/contextual plugin.
		 * @param {Object} coords . Optional. If provided, must be an object with such structure: { 'x': value, 'y': value }.
		 *	 By default contextual is shown relatively to trigger element with auto positioning nearly to it
		 *	 considering where it's located: at the top or at the bottom of screen.
		 * @param {Object} size . Optional. If provided, must be an object with such structure: { 'width': value, 'height': value }.
		 *	 Used to override predefined size of the contextual.
		 */
		add: function(trigger, contextual, coords, size, events)
		{
			var info = {
				'inBottomHalf': false,
				'coords': { 'x': 0, 'y': 0 },
				'size': size,
				'relativeToElement': false,
				'startY': 0,
				'moveY': 0,
				'moveTarget': null,
				'selectedAtStart': false,
				'arrowHeight': 0,
				'curScroll': '',
				'inside': false,
				'ellipsissed': false
			};
		
			contextual = $(contextual);
			contextual.appendTo('body');
			trigger = $(trigger);
			if (coords)
			{
				info.coords.x = coords.x;
				info.coords.y = coords.y;
				inBottomHalf = info.coords.y > $(window).height() / 2;
			}
			else
			{
				info.relativeToElement = true;
				Q.Contextual.calcRelativeCoords(trigger, contextual, info);
			}
			Q.Contextual.collection.push({ 'trigger': trigger, 'contextual': contextual, 'info': info });
		
			Q.Contextual.makeShowHandler(events);
			Q.Contextual.makeLifecycleHandlers();
		
			contextual.on('click', function (e) {
				e.preventDefault();
			});
		
			return Q.Contextual.collection.length - 1;
		},
	
		/**
		 * Removes a contextual from collection by given id and
		 * returns collection object (it's contextual along with its trigger and associated data).
	     * @method remove
		 */
		remove: function(cid)
		{
			var col = Q.Contextual.collection;
			for (var i=cid+1, l=col.length; i<l; ++i) {
				var state = col[i].trigger.state('Q/contextual');
				if (state && state.id) {
					--state.id;
				}
			}
			var current = col.splice(cid, 1)[0];
			current.trigger.unbind('mouseenter.Q_contextual');
			return current;
		},
	
		/**
		 * Calculates contextual showing coordinates when it's relatively positioned to the trigger.
		 * Parameters are the same as for Q.Contextual.add(), except for 'info', which is new.
	     * @method calcRelativeCoords
		 * @param {Object} info . Required. Object containing some data associated with contextual.
		 *	 Particularly here it's used to store calculated coordinates in it.
		 */
		calcRelativeCoords: function(trigger, contextual, info)
		{
			info.coords.x = trigger.offset().left + ((trigger.outerWidth() - (info.size ? info.size.width : contextual.outerWidth())) / 2)
				- document.body.scrollLeft - document.documentElement.scrollLeft;
			var y = trigger.offset().top + trigger.outerHeight() / 2
				- document.body.scrollTop - document.documentElement.scrollTop;
			info.inBottomHalf = y > $(window).height() / 2;
			info.coords.y = info.inBottomHalf ? y - trigger.outerHeight() / 2 : y + trigger.outerHeight() / 2;
		},
	
		/**
		 * Updates all contextuals layout.
		 * Particularly it adjusts contextual coordinates if they're relatively positioned to the trigger.
		 * Useful when trigger position changed, for example when screen orientation of mobile device is changed.
	     * @method updateLayout
		 */
		updateLayout: function()
		{
			var col = Q.Contextual.collection;
			var trigger = null, contextual = null, info = null;
			for (var i = 0; i < col.length; i++)
			{
				if (col[i].info)
				{
					trigger = col[i].trigger;
					contextual = col[i].contextual;
					info = col[i].info;
					if (info.relativeToElement)
						Q.Contextual.calcRelativeCoords(trigger, contextual, info);
				}
			}
		},
	
		/**
		 * Creates 'show' handler for contextual which watches for trigger element and
		 * calls Q.Contextual.show() when trigger receives an event.
		 * This method makes required operations only once and one event handler watches all triggers and manages all contextuals using
		 * contextuals collection. This is done to not overload document with many event handlers.
	     * @method makeShowHandler
		 */
		makeShowHandler: function(events)
		{
			if (!Q.Contextual.showHandler)
			{
				Q.Contextual.showHandler = function(e)
				{
					if (Q.Contextual.triggeringDisabled) {
						return;
					}
					var col = Q.Contextual.collection;
					var trigger = null, contextual = null, triggerTarget = null;
					var event = (Q.info.isTouchscreen ? e.touches[0] : e);
					var px = Q.Pointer.getX(e), py = Q.Pointer.getY(e), offset = null;
					for (var i = 0; i < col.length; i++)
					{
						trigger = col[i].trigger;
						if (trigger.length !== 0)
						{
							triggerTarget = trigger[0];
							offset = trigger.offset();
							contextual = col[i].contextual;
							if (px >= offset.left && px <= offset.left + trigger.outerWidth() &&
									py >= offset.top && py <= offset.top + trigger.outerHeight() &&
									($(e.target).closest(triggerTarget).length))
							{
								var current = Q.Contextual.current;
								if (current !== -1)
									Q.Contextual.hide();
							
								if (current === i) // if triggering same contextual that was shown before
									return e.preventDefault();
							
								Q.Contextual.current = i;
								Q.Contextual.show();
								var cs = trigger.state('Q/contextual');
								if (cs) {
									Q.layout(cs.contextual[0]);
									Q.handle(cs.onShow, trigger, [cs]);
								}
								Q.Contextual.justShown = true;
								setTimeout(function()
								{
									Q.Contextual.justShown = false;
								}, 0);
							
								Q.Contextual.toDismiss = false;
								setTimeout(function()
								{
									Q.Contextual.toDismiss = true;
								}, Q.Contextual.dismissTimeout);
							
								return e.preventDefault();
							}
						}
					}
				};
				Q.addEventListener(document.body, Q.Pointer.start.eventName, Q.Contextual.showHandler, {
					passive: false
				});
			}
		
			// if 'triggerOnHover' is on then we should create separate handler for latest added contextual
			if (Q.Contextual.triggerOnHover && !Q.info.isTouchscreen)
			{
				(function()
				{
					var latestId = Q.Contextual.collection.length - 1;
					var latest = Q.Contextual.collection[latestId];
					latest.trigger.bind('mouseenter.Q_contextual', function()
					{
						if (Q.Contextual.current !== -1)
							Q.Contextual.hide();
				 
						if (!Q.Contextual.triggeringDisabled)
						{
							Q.Contextual.current = latestId;
							Q.Contextual.show();
						}
					});
				})();
			}
		},
	
		/**
		 * Creates 'lifecycle' event handlers for contextuals.
		 * This includes 'start', 'move' and 'end' event handlers.
		 * These handlers used to operate with items selection, applying different scrolling algorithms etc.
	     * @method makeLifecycleHandlers
		 */
		makeLifecycleHandlers: function()
		{
			if (!Q.Contextual.startEventHandler || !Q.Contextual.moveEventHandler || !Q.Contextual.endEventHandler)
			{	
				Q.Contextual.startEventHandler = function(e)
				{
					if (!(Q.Contextual.current !== -1 && !Q.Contextual.justShown))
					{
						return;
					}

					var contextual = Q.Contextual.collection[Q.Contextual.current].contextual;
					var offset = contextual.offset();
					var info = Q.Contextual.collection[Q.Contextual.current].info;

					var event = (Q.info.isTouchscreen ? e.originalEvent.touches[0] : e);
					var px = Q.Pointer.getX(event), py = Q.Pointer.getY(event);
					info.startY = info.moveY = py;
					if (px >= offset.left && px <= offset.left + contextual.outerWidth() &&
							py >= offset.top && py <= offset.top + contextual.outerHeight())
					{
						info.moveTarget = null;
						if (event.target.tagName && event.target.tagName.toLowerCase() === 'li')
							info.moveTarget = $(event.target);
						else if (event.target.parentNode.tagName && event.target.parentNode.tagName.toLowerCase() === 'li')
							info.moveTarget = $(event.target.parentNode);
						if (info.moveTarget)
						{
							info.moveTarget.addClass('Q_selected Q_contextual_selected');
							info.selectedAtStart = true;
						}
					}
					else
					{
						Q.Contextual.hide();
					}
					return false;
				};
				$(document.body).on(Q.Pointer.start.eventName, Q.Contextual.startEventHandler);
			
				Q.Contextual.moveEventHandler = function(e)
				{
					if (Q.Contextual.current === -1)
					{
						return;
					}

					var current = Q.Contextual.collection[Q.Contextual.current];
					var contextual = current.contextual;
					var conOffset = contextual.offset();
					var trigger = current.trigger;
					var triggerOffset = (trigger.length !== 0 ? trigger.offset() : { 'top': -1000, 'left': -1000 });
					var info = current.info;
					var event = (Q.info.isTouchscreen ? e.originalEvent.changedTouches[0] : e);
					var px = Q.Contextual.currentMousePosition[0];
					var py = Q.Contextual.currentMousePosition[1];

					var newMoveTarget = $(Q.Pointer.elementFromPoint(px, py)).closest('.Q_listing li');
					if (info.moveTarget)
					{
						if (info.selectedAtStart)
						{
							if (info.startY !== 0 && Math.abs(info.moveY - info.startY) >= 5)
							{
								info.moveTarget.removeClass('Q_selected');
							}
						}
						else
						{
							if (px >= conOffset.left && px <= conOffset.left + contextual.outerWidth() &&
								py >= conOffset.top && py <= conOffset.top + contextual.outerHeight())
							{
								info.inside = true;
								if (newMoveTarget.length > 0 && newMoveTarget[0] !== info.moveTarget[0])
								{
									info.moveTarget.removeClass('Q_selected');
									newMoveTarget.addClass('Q_selected');
								}
							}
							else if (info.inside)
							{
								info.inside = false;
							}
							info.moveTarget = newMoveTarget;
						}
					}
					else
					{
						info.moveTarget = newMoveTarget;
					}

					if (info.startY === 0)
						info.startY = py;
					// this condition is again to fight against strange bug in Chrome (when touchmove coordinate is the same as on touchstart)
					else if (py !== info.startY)
						info.moveY = py;

					// if 'triggerOnHover' is on here we should track (only for desktop) if mouse cursor
					// is out of bounds of both contextual and its trigger element
					// if so, we're hiding contextual, but before that we should wait some time
					if (Q.Contextual.triggerOnHover && !Q.info.isTouchscreen)
					{
						if (!(
								(px >= conOffset.left && px <= conOffset.left + contextual.outerWidth() &&
									py >= conOffset.top - (info.inBottomHalf ? 0 : info.arrowHeight) &&
									py <= conOffset.top + contextual.outerHeight() + (info.inBottomHalf ? info.arrowHeight : 0))
							||	(px >= triggerOffset.left && px <= triggerOffset.left + trigger.outerWidth() &&
									py >= triggerOffset.top && py <= triggerOffset.top + trigger.outerHeight())
							|| (!info.inBottomHalf && py >= triggerOffset.bottom && py <= conOffset.top)
							|| (info.inBottomHalf && py <= triggerOffset.top && py >= conOffset.bottom)
						)) {
							Q.Contextual.hide();
						}
					}
				};
				$(document.body).on(Q.Pointer.move, function (e) {
					var that = this;

					// save current mouse position to use later in other methods
					Q.Contextual.currentMousePosition = [Q.Pointer.getX(e), Q.Pointer.getY(e)];

					setTimeout(function () {
						Q.handle(Q.Contextual.moveEventHandler, that, [e]);
					}, Q.Contextual.mousemoveTimeout);
				});

				Q.Contextual.enterEventHandler = function (e) {
					var c = Q.Contextual.collection[Q.Contextual.current];
					if (e.target.tagName.toLowerCase() === 'iframe'
					&& c && c.contextual && !c.contextual[0].contains(e.target)) {
						Q.Contextual.hide();
					}
				};
				$(document.body).on(Q.Pointer.enter, Q.Contextual.enterEventHandler);
			
				Q.Contextual.endEventHandler = function(e)
				{
					$('.Q_contextual_selected.Q_selected')
					.removeClass('Q_contextual_selected Q_selected');
					if ($(e.target).hasClass('Q_contextual_inactive')) {
						return;
					}
					if (Q.Contextual.current === -1) {
						return;
					}
					var current = Q.Contextual.collection[Q.Contextual.current];
					var contextual = current.contextual;
					var trigger = current.trigger;
					var info = current.info;
					var offset = trigger.offset();
					var listingWrapper = null;
					if (contextual.find('.Q_scroller_wrapper').length !== 0)
						listingWrapper = contextual.find('.Q_scroller_wrapper');
					else
						listingWrapper = contextual.children('.Q_listing_wrapper');

					var event = (Q.info.isTouchscreen ? e.originalEvent.changedTouches[0] : e);
					var target = (info.curScroll === 'iScroll' || info.curScroll === 'touchscroll'
							? event.target
							: Q.getObject("moveTarget.0", info) || event.target);
					var px = Q.Pointer.getX(event), py = Q.Pointer.getY(event);

					var element = target;
					while (element)
					{
						if (element.tagName && element.tagName.toLowerCase() === 'li' && $(element).parents('.Q_contextual').length !== 0) {
							break;
						}
						element = element.parentNode;
					}

					if ($(target).parentsUntil(element, '.Q_discouragePointerEvents').length
					|| $('.Q_discouragePointerEvents', target).length) {
						return;
					}


					// if it was mouseup / touchend on the triggering element, then use it to switch to iScroll instead of $.fn.scroller
					if (info.curScroll !== 'iScroll' && info.curScroll !== 'touchscroll' &&
							px >= offset.left && px <= offset.left + trigger.outerWidth() &&
							py >= offset.top && py <= offset.top + trigger.outerHeight())
					{
						Q.Contextual.toDismiss ?  Q.Contextual.hide() : Q.Contextual.applyScrolling();
					}
					else
					{
						/*if ((info.curScroll === 'iScroll' || info.curScroll === 'touchscroll' || listingWrapper.css('overflow') === 'auto') && Math.abs(info.moveY - info.startY) >= 5) {
							return;
						}*/
						while (element)
						{
							if (element.tagName && element.tagName.toLowerCase() === 'li' && $(element).parents('.Q_contextual').length !== 0)
								break;
							element = element.parentNode;
						}

						if (element)
						{
							Q.Contextual.itemSelectHandler(element, event);
						}
						else
						{
							if (contextual[0] !== event.target && $(event.target).parents('.Q_contextual').length === 0)
							{
								Q.Contextual.hide();
							}
						}
						Q.Pointer.cancelClick(false, e);
					}
				};
				$(document.body).on(Q.Pointer.end, Q.Contextual.endEventHandler);
			
				Q.Contextual.itemSelectHandler = function(element, event)
				{
					var contextual = Q.Contextual.collection[Q.Contextual.current].contextual;
					var li = $(element);

					// if event.target element is child of contextual element and event.type is 'touchmove' - just exit
					if (
						Q.Pointer.canceledClick
						&& $(event.target).parents('.Q_contextual').length
						&& Q.getObject(['Pointer', 'canceledEvent', 'type'], Q) === 'touchmove'
					) {
						return;
					}

					// deselect all element
					li.siblings().removeClass('Q_selected');

					// select current element
					li.addClass('Q_selected');

					var handler = li.attr('data-handler') || li.data('handler') || contextual.attr('data-handler') || contextual.data('defaultHandler');

					try
					{
						handler = eval(handler);
					}
					catch (e)
					{
						return;
					}
					Q.handle(handler, contextual, [li]);

					Q.Contextual.hide();
				};
			}
		},
	
		/**
		 * Applies appropriate scrolling to contextual contents.
		 * On mobile platforms iScroll is used and on desktop native scrolling with 'overflow: auto' is used.
	     * @method applyScrolling
		 */
		applyScrolling: function()
		{
			var contextual = Q.Contextual.collection[Q.Contextual.current].contextual;
			var info = Q.Contextual.collection[Q.Contextual.current].info;
			var listingWrapper = contextual.children('.Q_listing_wrapper');
			var listingWrapperHeight = listingWrapper.height();
			if (Q.info.isTouchscreen)
			{
				listingWrapper.plugin('Q/scroller', 'remove', { 'restoreOverflow': false, 'restoreHeight': false, 'unwrap': false });
				var scrollerWrapper = listingWrapper.hasClass('Q_scroller_wrapper')
					? listingWrapper
					: listingWrapper.children('.Q_scroller_wrapper');
				if (scrollerWrapper.length !== 0)
				{
					scrollerWrapper.css({ 'height': listingWrapperHeight + 'px' });
				
					var scrollTop = 0;
					var listing = scrollerWrapper.children('.Q_listing');
					if (info.inBottomHalf && listing.height() > listingWrapperHeight)
						scrollTop = listingWrapperHeight - listing.height();
					// scrollerWrapper.plugin('Q/iScroll', { 'y': scrollTop });
				}
				info.curScroll = scrollerWrapper.data('Q/iScroll') ? 'iScroll' : 'touchscroll';
			
				// adjusting scrollbar position
				if (info.curScroll === 'iScroll')
				{
					scrollerWrapper.children('div').css({
						'margin-right': contextual.css('padding-right'),
						'margin-top': (parseInt(contextual.css('padding-top')) - 2) + 'px',
						'height': listingWrapperHeight + 'px'
					});
					scrollerWrapper.plugin('Q/iScroll', 'refresh');
				}
			}
			else
			{
				listingWrapper.plugin('Q/scroller', 'remove', { 
					restoreOverflow: false, 
					restoreHeight: false
				});
				listingWrapper.css({ 'overflow': 'auto' });
				if (info.inBottomHalf)
				{
					listingWrapper.scrollTop(10000);
					setTimeout(function() {
						listingWrapper.scrollTop(10000);
					}, 0);
				} else {
					listingWrapper.scrollTop(0);
					setTimeout(function() {
						listingWrapper.scrollTop(0);
					}, 0);
				}
			}
		},
	
		/**
		 * Shows a contextual.
		 * You don't have to call it manually since event handling routines do that.
		 * However, if you manually handle contextuals workflow, you stil can.
	     * @method show
		 * @param id Number. Optional. If provided, contextual with given id will be shown.
		 */
		show: function(id)
		{
			if (id !== undefined) {
				Q.Contextual.current = id;
			} else if (Q.Contextual.current === -1) {
				return;
			}

			var current = Q.Contextual.collection[Q.Contextual.current];
			var trigger = current.trigger;
			var contextual = current.contextual;
			var info = current.info;
		
			var $body = $(document.body);
		
			if (trigger.length !== 0)
			{
				var triggerLeft = trigger.offset().left;
				if (triggerLeft + trigger.outerWidth() < 0|| triggerLeft > $body.width())
					return;
			}
		
			contextual.find('.Q_contextual_top_arrow, .Q_contextual_bottom_arrow').remove();
		
			contextual.data('Q/contextual trigger', trigger);
		
			if (info.size && info.size.width)
			{
				var width = info.size.width - parseInt(contextual.css('padding-left')) - parseInt(contextual.css('padding-right'));
				contextual.css({ 'width': width + 'px' });
			}
		
			var height = 0;
			if (info.size && info.size.height)
			{
				height = info.size.height - (parseInt(contextual.css('padding-top'))
							 + parseInt(contextual.css('padding-bottom'))) * (Q.info.isMobile ? 2.5 : 2);
			}
			else
			{
				height = Q.Contextual.options.height;
				if (typeof(height) === 'string' && height.indexOf('%') !== -1)
				{
					height = Q.Pointer.windowHeight() * (parseInt(height) / 100);
				}
			}
		
			// temporary showing contextual but making it invisible, it's only needed for getting correct height of contextual
			contextual.css({ 'visibility': 'hidden' });
			contextual.show();
		
			var listingWrapper = contextual.children('.Q_listing_wrapper');
			listingWrapper.children('.Q_scroller_wrapper').children().unwrap();
			// applying Q/sroller by default
			listingWrapper.plugin('Q/scroller', {
				'height': height,
				'startBottom': info.inBottomHalf,
				'eventDelegate': Q.info.isTouchscreen ? document.body : null
			});
			info.curScroll = 'scroller';

			Q.Contextual.calcRelativeCoords(trigger, contextual, info);

			if (info.inBottomHalf) {
				contextual.append('<div class="Q_contextual_bottom_arrow" />');
			} else {
				contextual.prepend('<div class="Q_contextual_top_arrow" />');
			}
			listingWrapper.find('.Q_listing').css('transform', 'none');
			var arrow = contextual.find('.Q_contextual_bottom_arrow, .Q_contextual_top_arrow');
			info.arrowHeight = arrow.outerHeight(true);
	
			var x = info.coords.x, y = info.coords.y;
			var w = (info.size && info.size.width) || contextual.outerWidth();
			var arrowLeft = 0;
			var minArrowLeft = 22;
			var leftOffset = Math.max(((w - arrow.outerWidth()) / 2), minArrowLeft);
			arrow.css('left', leftOffset + 'px');
			if (info.relativeToElement)
			{
				if (info.coords.x < 5)
				{
					x = 5;
					arrowLeft = (leftOffset + trigger.outerWidth()/2 + info.coords.x - 10);
					arrowLeft = arrowLeft < minArrowLeft ? minArrowLeft : arrowLeft;
					arrow.css({ 'left': arrowLeft + 'px' });
				}
				else if (info.coords.x + contextual.outerWidth() + 5 > $body.width())
				{
					x = $body.width() - contextual.outerWidth() - 10;
					arrowLeft = (leftOffset + trigger.outerWidth()/2 + info.coords.x - x);
					arrowLeft = arrowLeft < minArrowLeft ? minArrowLeft : arrowLeft;
					arrow.css({ 'left': arrowLeft + 'px' });
				}
			}
		
			// hiding contextual and making it visible again
			contextual.hide();
			contextual.css({ 'visibility': 'visible' });
			contextual.css({
				'top': (y + (info.inBottomHalf ? - (contextual.outerHeight() + 16) : 16)) + 'px',
				'left': x + 'px'
			});
			if (Q.Contextual.fadeTime > 0) {
				contextual.fadeIn(Q.Contextual.fadeTime);
			} else {
				contextual.show();
			}

			if (Q.info.isTouchscreen)
			{
				var mask = Q.Masks.show('Q.screen.mask', {
					fadeIn: Q.Contextual.fadeTime,
					zIndex: 'auto'
				});
				contextual.insertAfter(mask.element);
			}
		
			if (!info.ellipsissed)
			{
				contextual.find('.Q_listing li').each(function()
				{
					var listItem = $(this), text = listItem.children('.Q_listing_item_text');
					text.css({ 'max-width': (listItem.width() - text.prev().outerWidth(true) - 5) + 'px' });
				});
				info.ellipsissed = true;
			}

			$('html').addClass('Q_contextual_shown');
		},

		/**
		 * Hide contextual. Because only one contextual can be shown at a time, these function has no parameters.
		 * Also, usually you don't have to call this manually as contextuals hide automatically on appropriate events.
	     * @method hide
		 * @param leaveMask Boolean. Defaults to false. If true, mask won't be hidden along with contextual.
		 */
		hide: function(leaveMask)
		{
			if (Q.Contextual.current === -1)
			{
				return;
			}

			var contextual = Q.Contextual.collection[Q.Contextual.current].contextual;
			if (!contextual.is(":visible") || contextual.data("hideOccur")) { // nothing to hide if already hidden
				return ;
			}
			var info = Q.Contextual.collection[Q.Contextual.current].info;
			info.moveTarget = null;
			info.selectedAtStart = false;

			var hideDelay = contextual.data("hideDelay") || Q.Contextual.hideDelay;
			var hideDelayUsed = contextual.data("hideDelayUsed");
			if (hideDelay && !hideDelayUsed) {
				return setTimeout(function () {
					if (!contextual.is(":visible") || contextual.data("hideOccur")) {
						return;
					}

					contextual.data("hideDelayUsed", true);
					Q.Contextual.hide(leaveMask);
				}, hideDelay);
			}
			contextual.data("hideDelayUsed", false);
			contextual.data("hideOccur", true);

			contextual.find('.Q_selected').removeClass('Q_selected');

			var listingWrapper = contextual.children('.Q_listing_wrapper');
			listingWrapper.plugin('Q/scroller', 'remove');
			listingWrapper.plugin('Q/iScroll', 'remove');
			listingWrapper.children('.Q_scroller_wrapper').plugin('Q/iScroll', 'remove');
			listingWrapper.plugin('Q/touchscroll', 'remove');
			listingWrapper.children('.Q_scroller_wrapper').plugin('Q/touchscroll', 'remove');
			listingWrapper.css({ 'max-height': '' });

			var fadeTime = contextual.data("fadeTime") || Q.Contextual.fadeTime;
			if (fadeTime) {
				contextual.fadeOut(fadeTime, function () {
					contextual.data("hideOccur", false);
				});
			} else {
				contextual.hide();
				contextual.data("hideOccur", false);
			}

			if (!leaveMask)
			{
				Q.Masks.hide('Q.screen.mask');
			}

			Q.Contextual.current = -1;
			Q.Contextual.outOfBounds = false;

			$('html').removeClass('Q_contextual_shown');
		},
	
		/**
		 * Temporary disables contextuals triggering.
	     * @method disable
		 */
		disable: function()
		{
			Q.Contextual.triggeringDisabled = true;
		},
	
		/**
		 * Enables contextuals triggering if it was previously disabled.
	     * @method enable
		 */
		enable: function()
		{
			Q.Contextual.triggeringDisabled = false;
		}

	};

	// TODO: refactor all contextual options into this object
	Q.Contextual.options = {
		'height': '80%'
	};

})(Q, jQuery);
