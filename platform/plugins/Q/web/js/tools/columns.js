(function (Q, $) {
/**
 * @module Q-tools
 */
	
/**
 * This tool contains functionality to show things in columns
 * @class Q columns
 * @constructor
 * @param {Object}   [options] Override various options for this tool
 *  @param {Object}  [options.animation] For customizing animated transitions
 *  @param {Number}  [options.animation.duration] The duration of the transition in milliseconds, defaults to 500
 *  @param {Object}  [options.animation.hide] The css properties in "hide" state of animation
 *  @param {Object}  [options.back] For customizing the back button on mobile
 *  @param {String}  [options.back.src] The src of the image to use for the back button
 *  @param {Boolean} [options.back.triggerFromTitle] Whether the whole title would be a trigger for the back button. Defaults to true.
 *  @param {Boolean} [options.back.hide] Whether to hide the back button. Defaults to false, but you can pass true on android, for example.
 *  @param {Object}  [options.close] For customizing the back button on desktop and tablet
 *  @param {String}  [options.close.src] The src of the image to use for the close button
 *  @param {Object}  [options.close.clickable] If not null, enables the Q/clickable tool with options from here. Defaults to null.
 *  @param {String}  [options.title] You can put a default title for all columns here (which is shown as they are loading)
 *  @param {String}  [options.column] You can put a default content for all columns here (which is shown as they are loading)
 *  @param {Object}  [options.scrollbarsAutoHide] If an object, enables Q/scrollbarsAutoHide functionality with options from here. Enabled by default.
 *  @param {Boolean} [options.fullscreen] Whether to use fullscreen mode on mobile phones, using document to scroll instead of relying on possibly buggy "overflow" CSS implementation. Defaults to true on Android, false everywhere else.
 *  @param {Boolean} [options.hideBackgroundColumns=false] Whether to hide background columns on mobile (perhaps improving browser rendering). Defaults to false (true if fullscreen is true), because background columns may have elements whose positioning properties are being queried.
 *  @param {Q.Event} [options.beforeOpen] Event that happens before a column is opened. Return false to prevent opening.
 *  @param {Q.Event} [options.beforeClose] Event that happens before a column is closed. Receives (index, indexAfterClose, columnDiv). Return false to prevent closing.
 *  @param {Q.Event} [options.onOpen] Event that happens after a column is opened.
 *  @param {Q.Event} [options.afterDelay] Event that happens after a column is opened, after a delay intended to wait out various animations.
 *  @param {Q.Event} [options.onClose] Event that happens after a column is closed.
 * @return {Q.Tool}
 */
Q.Tool.define("Q/columns", function(options) {
	var tool = this;
	var state = tool.state;
	options = options || {};

	//state.triggers = [];
	
	Q.addStylesheet('plugins/Q/css/columns.css');

	prepareColumns(tool);

	var selector = '.Q_close';
	if (Q.info.isMobile && state.back.triggerFromTitle) {
		selector = '.Q_columns_title';
	};
	$(tool.element).on(Q.Pointer.fastclick, selector, function(){
		var index = $(this).closest('.Q_columns_column').data(dataKey_index);
		if (state.locked) return;
		if (index) {
			tool.close(index);
		}
	}); // no need for key, it will be removed when tool element is removed
	
	Q.onScroll.set(Q.debounce(function () {
		if (state.$currentColumn) {
			state.$currentColumn.data(dataKey_scrollTop, Q.Pointer.scrollTop());
		}
	}, 100));
	
	tool.refresh();
	Q.onLayout(tool).set(function () {
		tool.refresh();
	}, tool);
},

{
	animation: { 
		duration: 300, // milliseconds
		css: {
			hide: {
				opacity: 0.1, 
				top: '40%',
				height: '0'
			}
		},
	},
	delay: {
		duration: 300 // until it's safe to register clicks
	},
	back: {
		src: "plugins/Q/img/back-v.png",
		triggerFromTitle: true,
		hide: false
	},
	close: {
		src: "plugins/Q/img/x.png",
		clickable: null
	},
	title: '<img class="Q_columns_loading" src="' + Q.url('plugins/Q/img/throbbers/loading.gif') +'" alt="">',
	column: undefined,
	scrollbarsAutoHide: {},
	fullscreen: Q.info.isMobile && Q.info.isAndroid(1000) && Q.info.isAndroidStock,
	hideBackgroundColumns: Q.info.isMobile && Q.info.isAndroid(1000) && Q.info.isAndroidStock,
	beforeOpen: new Q.Event(),
	beforeClose: new Q.Event(),
	onOpen: new Q.Event(function () {
		Q.Pointer.stopHints();
	}, 'Q/columns'),
	onClose: new Q.Event(),
	afterDelay: new Q.Event()
},

{
	max: function () {
		return this.state.max;
	},
	
	/**
	 * Opens a new column at the end
	 * @method push
	 * @param {Object} options Can be used to override various tool options
	 * @param {Function} callback Called when the column is opened
	 */
	push: function (options, callback) {
		this.open(options, this.max(), callback);
		return this;
	},
	
	/**
	 * Closes the last column
	 * @method pop
	 * @param {Function} callback Called when the column is closed
	 * @param {Object} options Can be used to override various tool options
	 */
	pop: function (callback, options) {
		this.close(this.max()-1, callback, options);
		return this;
	},
	
	/**
	 * Opens a column
	 * @method open
	 * @param {Object} options Can be used to override various tool options,
	 *  including events such as "onOpen" and "onClose". Additional options include:
	 *  @param {String} [options.columnClass] to add a class to the column
	 *  @param {Object} [options.data] to add data on the column element with jQuery
	 *  @param {Object} [options.template] template to render for the "column" slot
	 *  @param {Object} [options.fields] fields for the template, if any
	 *  @param {Object} [options.title] override the title of the column
	 *  @param {Object} [options.column] override the html of the column
	 *  @param {Object} [options.url] a url to request the slots "title" and "column" from
	 * @param {Number} index The index of the column to open
	 * @param {Function} callback Called when the column is opened
	 * @return {Boolean} Whether the column will be opened
	 */
	open: function (options, index, callback, internal) {
		var tool = this;
		var state = this.state;
		if (typeof options === 'number') {
			options = {};
			callback = index;
			index = options;
		}
		var o = Q.extend({}, 10, state, 10, options);

		if (index > this.max()) {
			throw new Q.Exception("Q/columns open: index is too big");
		}
		if (index < 0) {
			throw new Q.Exception("Q/columns open: index is negative");
		}
		
		if (false === state.beforeOpen.handle.call(tool, options, index)
		 || false === Q.handle(options.beforeOpen, tool, [options, index])) {
			return false;
		}
		
		if (!internal && state.columns[index]) {
			this.close(index, null, {animation: {duration: 0}});
		}
		
		var div = this.column(index);
		var titleSlot, columnSlot;
		var $div, $mask, $close, $title;
		if (!div) {
			div = document.createElement('div').addClass('Q_columns_column');
			div.style.display = 'none';
			$div = $(div);
			++this.state.max;
			this.state.columns[index] = div;
			var $ts = $('<h2 class="Q_title_slot"></h2>');
			titleSlot = $ts[0];
			$title = $('<div class="Q_columns_title"></div>')
				.append($ts);
			columnSlot = document.createElement('div').addClass('Q_column_slot');
			state.container = tool.$('.Q_columns_container')[0];
			$div.append($title, columnSlot)
				.data(dataKey_index, index)
				.data(dataKey_scrollTop, Q.Pointer.scrollTop())
				.appendTo(state.container);
			if (o.fullscreen) {
				$(window).scrollTop(0);
			}
			presentColumn(tool);
		} else {
			$div = $(div);
			$close = $('.Q_close', div);
			$title = $('.Q_columns_title', div);
			titleSlot = $('.Q_title_slot', div)[0];
			columnSlot = $('.Q_column_slot', div)[0];
		}
		if (options && options.columnClass) {
			$div.addClass(options.columnClass);
		}
		var dataMore = div.getAttribute('data-more');
		tool.state.data[index] = Q.extend(
			{},
			options && options.data,
			dataMore ? JSON.parse(dataMore) : null
		);
		if (!$close || !$close.length) {
			$close = !index ? $() : $('<div class="Q_close"></div>');
			if (Q.info.isMobile) {
				$close.addClass('Q_back').append(
					$('<img alt="Back" />').attr('src', Q.url(o.back.src))
				);
			} else {
				$close.append(
					$('<img alt="Close" />').attr('src', Q.url(o.close.src))
				);
			}
			if (index) {
				$title.prepend($close);
			}
		}
		state.$currentColumn = $div;
		state.currentIndex = index;
		if (o.back.hide) {
			$close.hide();
		}
		
		if ($div.css('position') === 'static') {
			$div.css('position', 'relative');
		}

		$div.attr('data-index', index).addClass('Q_column_'+index);
		if (options.name) {
			var n = Q.normalize(options.name);
			$div.attr('data-name', options.name)
				.addClass('Q_column_'+n);
		}
		
		if (o.template) {
			Q.Template.render(o.template, o.fields, function (err, html) {
				o.column = html;
				_open();
			});
		} else {
			_open();
		}
		return true;
		
		function _open() {
			var p = Q.pipe();
			var waitFor = ['animation'];
			if (options.url) {
				waitFor.push('activated');
				var url = options.url;
				var params = Q.extend({
					slotNames: ["title", "column"], 
					slotContainer: {
						title: titleSlot,
						column: columnSlot
					},
					quiet: true,
					ignoreHistory: true,
					ignorePage: true,
					onError: {"Q/columns": function () {
						$mask.remove();
					}}
				}, options);
				params.handler = function _handler(response) {
					var elementsToActivate = {};
					if ('title' in response.slots) {
						$(titleSlot).html(response.slots.title);
						elementsToActivate['title'] = titleSlot;
					}
					columnSlot.innerHTML = response.slots.column;
					elementsToActivate['column'] = columnSlot;
					return elementsToActivate;
				};
				params.onActivate = p.fill('activated');
				// this.state.triggers[index] = options.trigger || null;
				Q.loadUrl(url, params);
			}
			
			var $te = $(tool.element);
			if (o.title != undefined) {
				$(titleSlot).empty().append(
					Q.instanceOf(o.title, Element) ? $(o.title) : o.title
				);
			}
			if (o.column != undefined) {
				$(columnSlot).empty().append(
					Q.instanceOf(o.column, Element) ? $(o.column) : o.column
				);
			}
			waitFor.push('activated1', 'activated2');
			$(titleSlot).activate(p.fill('activated1'));
			$(columnSlot).activate(p.fill('activated2'));
			p.add(waitFor, function () {
				var data = tool.data(index);
				if ($(div).closest('html').length) {
					Q.handle(callback, tool, [options, index, div, data]);
					state.onOpen.handle.call(tool, options, index, div, data);
					Q.handle(options.onOpen, tool, [options, index, div, data]);
					setTimeout(function () {
						$mask.remove();
						Q.handle(options.afterDelay, tool, [options, index, div, data]);
					}, o.delay.duration);
				} else {
					$mask.remove();
				}
			}).run();
			
			Q.each(['on', 'before'], function (k, prefix) {
				var event = options[prefix+'Close'];
				var stateEvent = state[prefix+'Close'];
				event = Q.extend(new Q.Event(), event);
				var key = stateEvent.set(function (i) {
					if (i != index) return;
					event.handle.apply(this, arguments);
					stateEvent.remove(key);
				});
			});
			
			var show = {
				opacity: 1,
				top: 0
			};
			var oldMinHeight;
			var hide = o.animation.css.hide;
			$div.css('position', 'absolute');
			if (Q.info.isMobile) {
				var $sc = $(state.container);
				var h = Q.Pointer.windowHeight() - $sc.offset().top;
				show.width = $(tool.element).width();
				show.height = h;
				$sc.height(h);
			} else {
				$div.show();
				show.width = $div.width();
				show.height = $div.height();
				for (var k in hide) {
					var str = hide[k].toString();
					if (str.substr(str.length-1) === '%') {
						hide[k] = show.height * parseInt(hide[k]) / 100;
					}
				}
				$div.hide()
				.css('position', 'relative');
			}
			var lastShow = $div.data(dataKey_lastShow);
			if (lastShow) {
				show = lastShow;
			}
			$div.data(dataKey_hide, hide);
			
			state.locked = true;
			openAnimation();

			function openAnimation(){
				// open animation
				var duration = o.animation.duration;
				var $sc = $(state.container);
				var $cs = $('.Q_column_slot', $div);
				var $ct = $('.Q_columns_title', $div);
				
				var $prev = $div.prev();
				$div.css('z-index', $prev.css('z-index')+1 || 1);
				
				if (Q.info.isMobile) {
					$div.add($ct).css('width', '100%');
				} else {
					var width = 0;
					tool.$('.Q_columns_column').each(function () {
						width += $(this).outerWidth(true);
					});
					$sc.width(width);

					var $toScroll = ($te.css('overflow') === 'visible')
						? $te.parents()
						: $te;
					$toScroll.each(function () {
						$(this).animate({
							scrollLeft: this.scrollWidth
						});
					});
				}
				
				$div.data(dataKey_lastShow, show)
					.data(dataKey_opening, true);
				oldMinHeight = $div.css('min-height');
				$div.css('min-height', 0);
				
				if (o.fullscreen) {
					$ct.css('position', 'absolute');
				} else if (Q.info.isMobile) {
					$('html').css('overflow', 'hidden');
				}
				$mask = $('<div class="Q_columns_mask" />')
				.appendTo($div);
				$div.show()
				.addClass('Q_columns_opening')
				.css(o.animation.css.hide)
				.stop()
				.animate(show, duration, function() {
					setTimeout(function () {
						$div.data(dataKey_opening, false);
						afterAnimation($cs, $sc, $ct);
					}, 0);
				});
			}

			function afterAnimation($cs, $sc, $ct){
				
				var heightToBottom = Q.Pointer.windowHeight()
					- $cs.offset().top
					- parseInt($cs.css('padding-top'));
				if (Q.info.isMobile) {
					if (o.fullscreen) {
						$cs.add($div).css('height', 'auto');
						$cs.css('min-height', heightToBottom);
					} else {
						$cs.height(heightToBottom);
						$div.css('height', 'auto');
					}
					Q.layout($cs[0]);
					if (o.hideBackgroundColumns) {
						$div.prev().hide();
					}
				} else {
					if (o.close.clickable) {
						$close.plugin("Q/clickable", o.close.clickable);
					}
					$div.css('min-height', oldMinHeight);
				}
				
				$div.removeClass('Q_columns_opening')
				.addClass('Q_columns_opened');
				
				presentColumn(tool);

				if (!Q.info.isMobile) {
					var heightToBottom = $(tool.element).height()
						- $cs.offset().top + $cs.parent().offset().top
						- parseInt($cs.css('padding-top'));
					$cs.height(heightToBottom);
				}

				if (Q.info.isTouchscreen) {
					if (o.fullscreen) {
						$cs.css({
							'overflow': 'visible', 
							'height': 'auto'
						});
					} else {
						$cs.addClass('Q_overflow');
						if (Q.info.isTouchscreen) {
							Q.ensure(
								window.overthrow, 
								"plugins/Q/js/overthrow.js",
								function () {
									overthrow.scrollIndicatorClassName = 'Q_overflow';
									overthrow.set();
								}
							)
						}
					}
				} else if (o.scrollbarsAutoHide) {
					$cs.plugin('Q/scrollbarsAutoHide', o.scrollbarsAutoHide);
				}
				
				state.locked = false;

				p.fill('animation')();
			}
		}
	},

	/**
	 * Closes a column
	 * @method close
	 * @param {Number|Array|Object} index The index of the column to close.
	 *  You can pass an array of indexes here, or an object with "min" and
	 *  optional "max"
	 * @param {Function} callback Called when the column is opened
	 * @param {Object} options Can be used to override various tool options
	 * @return {Boolean} Whether the column was actually closed.
	 */
	close: function (index, callback, options) {
		var tool = this;
		var state = tool.state;
		var t = Q.typeOf(index);
		var p, waitFor = [];
		if (t === 'object') {
			p = new Q.Pipe();
			Q.each(index.max||state.max-1, index.min||0, -1, function (i) {
				try { tool.close(i, p.fill(i), options); } catch (e) {}
				waitFor.push(i);
			});
		} else if (t === 'array') {
			p = new Q.Pipe();
			Q.each(index, function (k, i) {
				try { tool.close(i, p.fill(i), options); } catch (e) {}
				waitFor.push(i);
			}, {ascending: false});
		}
		if (p) {
			p.add(waitFor, callback).run();
			return false;
		}
		var o = Q.extend({}, 10, state, 10, options);
		var div = tool.column(index);
		if (!div) {
			return false;
		}
		var $div = $(div);
		var width = $div.outerWidth(true);
		var w = $div.outerWidth(true);
		var duration = o.animation.duration;
		var $prev = $div.prev();
		
		var prevIndex = $prev.attr('data-index');
		var shouldContinue = o.beforeClose.handle.call(tool, index, prevIndex, div);
		if (shouldContinue === false) {
			return false;
		}
		
		if (o.hideBackgroundColumns) {
			$prev.show();
		}
		if (state.fullscreen) {
			$(window).scrollTop($prev.data(dataKey_scrollTop) || 0);
			// make the title move while animating, until it is removed
			$('.Q_columns_title', $div).css('position', 'absolute');
		}
		state.$currentColumn = $prev;
		state.currentIndex = prevIndex;
		if (index === state.columns.length -1) {
			state.columns.pop();
		} else {
			state.columns[index] = null;
		}
		presentColumn(tool);
	
		$div.css('min-height', 0);
		
		if (index === state.max-1) {
			--state.max;
		}
		
		if (duration) {
			$div.animate($div.data(dataKey_hide), duration, _close);
		} else {
			$div.hide();
			_close();
		}
		
		return true;
		
		function _close() {
			Q.removeElement(div, true); // remove it correctly

			var data = tool.data(index);
			var $sc = $(state.container);
			$sc.width($sc.width() - w);
			presentColumn(tool);
			Q.handle(callback, tool, [index, div]);
			state.onClose.handle.call(tool, index, div, data);
		}
	},

	column: function (index) {
		return this.state.columns[index] || null;
	},
	
	data: function (index) {
		return this.state.data[index] || null;
	},
	
	refresh: function () {
		var tool = this;
		var state = tool.state;
		var $te = $(tool.element);
		var $columns = $('.Q_columns_column', $te);
		var $container = $('.Q_columns_container', $te);
		var $cs = $('.Q_columns_column .Q_column_slot', $te);
		var top = 0;
		
		$te.prevAll()
		.add($te.parents().prevAll())
		.each(function () {
			var $this = $(this);
			if ($this.css('position') === 'fixed'
			&& !$this.hasClass('Q_drawers_drawer')) {
				top += $this.outerHeight() + parseInt($this.css('margin-bottom'));
			}
		});
		
		if (Q.info.isMobile) {
			$te.css('top', top + 'px');
			$te.add($container)
				.add($columns)
				.width($(window).width());
			if (!state.fullscreen) {
				$te.add($container)
					.add($columns)
					.height(Q.Pointer.windowHeight()-$te.offset().top);
			}
			presentColumn(tool);
		}

		if (state.fullscreen) {
			$te.addClass('Q_fullscreen');
		}
		
		var overshoot = Q.Pointer.scrollTop() + $(document).height()
			- Q.Pointer.windowHeight();
		if (overshoot > 0) {
			$(window).scrollTop( $(window).scrollTop()-overshoot );
		}
		return this;
	},
	Q: {
		onRetain: function(newOptions, incomingElement) {
			Q.replace(this.element, incomingElement);
			var tool = this;
			setTimeout(function () {
				prepareColumns(tool);
				tool.refresh();
			}, 0);
		}
	}
}
);

Q.Template.set('Q/columns/column',
	'<div class="Q_contextual"><ul class="Q_listing"></ul></div>'
);

function presentColumn(tool) {
	if (!tool.state.$currentColumn || !tool.state.$currentColumn.length) return;
	var $cs = $('.Q_column_slot', tool.state.$currentColumn);
	if (tool.state.fullscreen) {
		var $ct = tool.$('.Q_columns_title');
		$ct.css('position', 'fixed');
		$ct.css('top', $(tool.element).offset().top + 'px');
		$cs.css('padding-top', $cs.prev().outerHeight()+'px');
	}
	if (Q.info.isMobile) {
		var heightToBottom = Q.Pointer.windowHeight()
			- $cs.offset().top
			- parseInt($cs.css('padding-top'));
		if (!tool.state.fullscreen) {
			$cs.height(heightToBottom);
			// TODO: iscroll
		} else {
			$cs.css('min-height', heightToBottom);
		}
	}
}

function prepareColumns(tool) {
	var state = tool.state;
	state.max = 0;
	state.data = [];
	state.container = tool.$('.Q_columns_container')[0];
	if (!state.container) {
		state.container = document.createElement('div')
			.addClass('Q_columns_container Q_clearfix');
		tool.element.appendChild(this.state.container);
	} else {
		state.columns = [];
		tool.$('.Q_columns_column').each(function (index) {
			var $this = $(this);
			state.columns.push(this);
			$this.data(dataKey_index, index)
				.data(dataKey_scrollTop, Q.Pointer.scrollTop());
			++state.max;
			if (!$this.hasClass('Q_columns_opened')
			 && !$this.hasClass('Q_columns_opening')) {
				tool.open({
					title: undefined,
					column: undefined,
					animation: {duration: 0}
				}, index, null, true);
			}
		});
	}
}

var dataKey_index = 'index';
var dataKey_scrollTop = 'scrollTop';
var dataKey_hide = 'hide';
var dataKey_lastShow = 'lastShow';
var dataKey_opening = 'opening';

})(Q, jQuery);