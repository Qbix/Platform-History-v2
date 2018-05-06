(function (Q, $) {
	
/**
 * @module Q-tools
 */

var dataKey_index = 'index';
var dataKey_scrollTop = 'scrollTop';
var dataKey_hide = 'hide';
var dataKey_lastShow = 'lastShow';
var dataKey_opening = 'opening';
	
/**
 * This tool contains functionality to show things in columns
 * @class Q columns
 * @constructor
 * @param {Object}   [options] Override various options for this tool
 *  @param {String}  [options.title] You can put a default title for all columns here (which is shown as they are loading)
 *  @param {String}  [options.column] You can put a default content for all columns here (which is shown as they are loading)
 *  @param {String}  [options.controls] You can put default controls HTML for all columns here (which is shown as they are loading)
 *  @param {Object}  [options.data] Any data you want to associate with the column, to be retrieved later by the tool.data() method
 *  @param {Object}  [options.attributes] Any attributes you want to add to the column element
 *  @param {Object}  [options.animation] For customizing animated transitions
 *  @param {Number}  [options.animation.duration] The duration of the transition in milliseconds, defaults to 500
 *  @param {Object}  [options.animation.hide] The css properties in "hide" state of animation
 *  @param {Object}  [options.back] For customizing the back button on mobile
 *  @param {String}  [options.back.src] The src of the image to use for the back button
 *  @param {Boolean} [options.back.triggerFromTitle] Whether the whole title would be a trigger for the back button. Defaults to true.
 *  @param {Object}  [options.textfill={}] Options for Q/textfill on the title, or pass null here to skip this effect.
 *  @param {Boolean} [options.back.hide] Whether to hide the back button. Defaults to false, but you can pass true on android, for example.
 *  @param {Object}  [options.close] For customizing the back button on desktop and tablet
 *  @param {String}  [options.close.src] The src of the image to use for the close button
 *  @param {Object}  [options.close.clickable] If not null, enables the Q/clickable tool with options from here. Defaults to null.
 *  @param {Object}  [options.scrollbarsAutoHide] If an object, enables Q/scrollbarsAutoHide functionality with options from here. Enabled by default.
 *  @param {Object}  [options.handlers] Pairs of columnName: handler where the handler can be a function or a string, in which you assign a function to Q.exports .
 *  @param {Boolean} [options.fullscreen] Whether to use fullscreen mode on mobile phones, using document to scroll instead of relying on possibly buggy "overflow" CSS implementation. Defaults to true on Android stock browser, false everywhere else.
 *  @param {Boolean} [options.hideBackgroundColumns=true] Whether to hide background columns on mobile (perhaps improving browser rendering).
 *  @param {Boolean} [options.pagePushUrl] if this is true and the url of the column 
 *    is specified, then Q.Page.push() is called with this URL.
 *  @param {Q.Event} [options.beforeOpen] Event that happens before a column is opened. Return false to prevent opening. Receives (options, index).
 *  @param {Q.Event} [options.beforeClose] Event that happens before a column is closed. Receives (index, indexAfterClose, columnElement). Return false to prevent closing.
 *  @param {Q.Event} [options.onOpen] Event that happens after a column is opened. Receives (options, index, columnElement).
 *  @param {Q.Event} [options.afterDelay] Event that happens after a column is opened, after a delay intended to wait out various animations. Receives (options, index, columnElement).
 *  @param {Q.Event} [options.onClose] Event that happens after a column is closed.
 * @return {Q.Tool}
 */
Q.Tool.define("Q/columns", function(options) {
	var tool = this;
	var state = tool.state;
	options = options || {};

	//state.triggers = [];
	
	Q.addStylesheet('{{Q}}/css/columns.css', function () {
		prepareColumns(tool);

		if (state.title === undefined) {
			state.title = '<img class="Q_columns_loading" src="' + Q.url('{{Q}}/img/throbbers/loading.gif') +'" alt="">';
		}

		var selector = '.Q_close';
		if (Q.info.isMobile && state.back.triggerFromTitle) {
			selector = '.Q_columns_title';
		}
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
		}, 100), tool);

		if (Q.info.isAndroidStock) {
			var w = Q.Pointer.windowWidth();
			$(tool.element).parents().andSelf().each(function () {
				$(this).data('Q/columns maxWidth', this.style.maxWidth)
					.css('max-width', w);
			});
		}

		// Call setControls whenever a controls slot or a parent element is activated
		Q.onActivate.set(function (element) {
			var isContained = !!$(tool.element).closest(element).length;
			for (var i=0, l=state.columns.length; i<l; ++i) {
				var column = tool.column(i);
				if (!column) continue;
				var $controlsSlot = $('.Q_controls_slot', column);
				if (($controlsSlot[0] && isContained)
					|| $controlsSlot[0] === element) {
					var html = $controlsSlot.html();
					column.setClass('Q_columns_hasControls', html)
					presentColumn(tool);
				}
			}
		}, tool);

		tool.refresh();
		Q.onLayout(tool).set(function () {
			tool.refresh();
		}, tool);
	}, { slotName: 'Q' });
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
		src: "{{Q}}/img/back-v.png",
		triggerFromTitle: true,
		hide: false
	},
	close: {
		src: "{{Q}}/img/x.png",
		clickable: null
	},
	handlers: {},
	title: undefined,
	column: undefined,
	columns: [],
	controls: undefined,
	pagePushUrl: true,
	scrollbarsAutoHide: {},
	textfill: {},
	fullscreen: Q.info.useFullscreen,
	hideBackgroundColumns: true,
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
	 *  @param {String} [options.name] any name to assign to the column
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
		if (index === undefined) {
			index = tool.max();
		}
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
		var titleSlot, columnSlot, controlsSlot;
		var $div, $mask, $close, $title, $controls, $tc;
		var createdNewDiv = false;
		if (!div) {
			createdNewDiv = true;
			div = document.createElement('div').addClass('Q_columns_column');
			div.style.display = 'none';
			$div = $(div);
			++this.state.max;
			this.state.columns[index] = div;
			var $tc = $('<div class="Q_columns_title_container">');
			var $ts = $('<h2 class="Q_title_slot"></h2>').appendTo($tc);
			titleSlot = $ts[0];
			$title = $('<div class="Q_columns_title"></div>').append($tc);
			columnSlot = document.createElement('div').addClass('Q_column_slot');
			$controls = $('<h2 class="Q_controls_slot"></h2>');
			controlsSlot = $controls[0];
			state.container = tool.$('.Q_columns_container')[0];
			$div.append($title, columnSlot, controlsSlot)
				.data(dataKey_index, index)
				.data(dataKey_scrollTop, Q.Pointer.scrollTop())
				.appendTo(state.container);
			if (o.fullscreen) {
				$(window).scrollTop(0);
			}
			setTimeout(function () {
				// give the browser a chance to calculate dimensions of elements
				div.setClass('Q_columns_hasControls', controlsSlot.innerHTML)
				presentColumn(tool, $div, o.fullscreen);
			});
		} else {
			$div = $(div);
			$close = $('.Q_close', div);
			$tc = $('.Q_columns_title_container', div);
			$title = $('.Q_columns_title', div);
			titleSlot = $('.Q_title_slot', div)[0];
			columnSlot = $('.Q_column_slot', div)[0];
			controlsSlot = $('.Q_controls_slot', div)[0];
			$div.attr('data-title', $(titleSlot).text() || document.title);
		}
		if (o.url) {
			var url = Q.url(o.url);
			$div.attr('data-url', url);
		}
		if (o && o.columnClass) {
			$div.addClass(o.columnClass);
		}
		var dataMore = div.getAttribute('data-more');
		tool.state.data[index] = Q.extend(
			{},
			dataMore && JSON.parse(dataMore),
			options && options.data
		);
		if (o.attributes) {
			$div.attr(attributes);
		}
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
			var n = Q.normalize(options.name, null, null, null, true);
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
			var $te = $(tool.element);
			var $titleSlot = $(titleSlot);
			var $columnSlot = $(columnSlot);
			var $controlsSlot = $(controlsSlot);
			var p = Q.pipe();
			var _suddenlyClosing = false;
			var waitFor = ['animation'];
			if (options.url) {
				waitFor.push('activated');
				function _suddenClose() {
					_suddenlyClosing = true;
					$mask.remove();
					$div.removeClass('Q_columns_loading');
					tool.close(index);
				}
				var url = options.url;
				var params = Q.extend({
					slotNames: ["title", "column", "controls"], 
					slotContainer: {
						title: titleSlot,
						column: columnSlot
					},
					quiet: true,
					ignoreHistory: true,
					ignorePage: true,
					onError: {"Q/columns": _suddenClose},
					onRedirect: {"Q": _suddenClose}
				}, options);
				params.handler = function _handler(response) {
					var elementsToActivate = {};
					if ('title' in response.slots) {
						$(titleSlot).html(response.slots.title);
						elementsToActivate['title'] = titleSlot;
					}
					if ('controls' in response.slots) {
						$(controlsSlot).html(response.slots.controls);
						elementsToActivate['controls'] = controlsSlot;
					}
					columnSlot.innerHTML = response.slots.column;
					elementsToActivate['column'] = columnSlot;
					return elementsToActivate;
				};
				params.onActivate = p.fill('activated');
				// this.state.triggers[index] = options.trigger || null;
				Q.loadUrl(url, params);
			}
			
			if (o.title != undefined) {
				$titleSlot.empty().append(
					Q.instanceOf(o.title, Element) ? $(o.title) : o.title
				);
				$div.attr('data-title', $titleSlot.text());
			}
			if (o.column != undefined) {
				$columnSlot.empty().append(
					Q.instanceOf(o.column, Element) ? $(o.column) : o.column
				);
			}
			if (o.controls != undefined) {
				$controlsSlot.empty().append(
					Q.instanceOf(o.controls, Element) ? $(o.controls) : o.controls
				);
			}
			waitFor.push('activated1', 'activated2', 'activated3');
			$titleSlot.activate(o.activateOptions, p.fill('activated1'));
			$columnSlot.activate(o.activateOptions, p.fill('activated2'));
			$controlsSlot.activate(o.activateOptions, p.fill('activated3'));
			p.add(waitFor, function () {
				var data = tool.data(index);
				if ($(div).closest('html').length) {
					var name = $(div).attr('data-name');
					var js = state.handlers && state.handlers[name];
					if (js) {
						if (typeof js === 'string') {
							Q.require(js, function (js) {
								Q.handle(js, tool, [options, index, div, data]);
							});
						} else {
							Q.handle(js, tool, [options, index, div, data]);
						}
					}
					// check url before document location changed
					var url = $div.attr('data-url');
					// set document title anyway
					document.title = $div.find('.Q_title_slot').text();
					$div.attr('data-title', document.title);
					if (o.pagePushUrl && createdNewDiv && url && url !== location.href) {
						Q.Page.push(url);
					}

					// call the callback before the events,
					// so something custom can be done first
					Q.handle(callback, tool, [options, index, div, data]);
					Q.handle(options.onOpen, tool, [options, index, div, data]);
					state.onOpen.handle.call(tool, options, index, div, data);
					setTimeout(function () {
						$mask.remove();
						$div.removeClass('Q_columns_loading');
						Q.handle(options.afterDelay, tool, [options, index, div, data]);
						Q.handle(state.afterDelay, tool, [options, index, div, data]);
					}, o.delay.duration);
				} else {
					$mask.remove();
					$div.removeClass('Q_columns_loading');
				}
				div.setClass('Q_columns_hasControls', !!$controlsSlot[0].innerHTML);
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
			tool.oldMinHeight = undefined;
			var hide = o.animation.css.hide;
			$div.css('position', 'absolute');
			if (Q.info.isMobile) {
				var $sc = $(state.container);
				var h = Q.Pointer.windowHeight() - $sc.offset().top;
				show.width = tool.element.clientWidth;
				show.height = h;
				$sc.height(h);
			} else {
				var cs = $div[0].computedStyle();
				$div.show();
				show.width = cs.width;
				show.height = tool.element.clientHeight;
				for (var k in hide) {
					var str = hide[k].toString();
					if (str.substr(str.length-1) === '%') {
						hide[k] = parseFloat(show.height) * parseInt(hide[k]) / 100;
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
					$sc.width(width).addClass('Q_columns_sized');

					var $toScroll = ($te.css('overflow') === 'visible')
						? $te.parents()
						: $te;
					$toScroll.each(function () {
						var $this = $(this);
						$this.animate({
							scrollLeft: this.scrollWidth
						});
						if ($this.css('overflow') !== 'visible') {
							return false;
						}
					});
				}
				
				$div.data(dataKey_lastShow, show)
					.data(dataKey_opening, true);
				tool.oldMinHeight = $div.css('min-height');
				$div.css('min-height', 0);
				
				if (o.fullscreen) {
					$ct.css('position', 'absolute');
					$cs.css('overflow', 'hidden');
				} else if (Q.info.isMobile) {
					$('html').addClass('Q_overflowHidden');
				}
				$mask = $('<div class="Q_columns_mask" />')
				.appendTo($div);
				$div.show()
				.addClass('Q_columns_opening')
				.css(o.animation.css.hide)
				.stop()
				.animate(show, duration, function() {
					$tc.outerWidth($tc[0].remainingWidth());
					if (o.textfill) {
						$tc.plugin('Q/textfill', o.textfill);
					}
					setTimeout(function () {
						$div.data(dataKey_opening, false);
						afterAnimation($cs, $sc, $ct);
					}, 0);
				});
				$div.addClass('Q_columns_loading');
			}

			function afterAnimation($cs, $sc, $ct){
				
				if (Q.info.isMobile) {
					if (!_suddenlyClosing && o.hideBackgroundColumns) {
						$div.prev().hide();
					}
					$div.width('100%');
				} else {
					if (o.close.clickable) {
						$close.plugin("Q/clickable", o.close.clickable);
					}
				}
				
				$div.removeClass('Q_columns_opening')
				.addClass('Q_columns_opened');

				if (!Q.info.isMobile) {
					$cs.height(
						$(tool.element).height()
						- $cs.offset().top + $cs.parent().offset().top
						- parseInt($cs.css('padding-top'))
						- parseInt($cs.css('padding-bottom'))
					);
				}
				presentColumn(tool, $div, o.fullscreen);

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
								"{{Q}}/js/overthrow.js",
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
	 * @param {Function} callback Called when the column is closed, or if no column
	 *  Receives (index, column) where the column could be null if it wasn't found.
	 * @param {Object} options Can be used to override some values taken from tool state
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
		var div = tool.column(index);
		if (p) {
			p.add(waitFor, function () {
				Q.handle(callback, tool, [index, div]);
			}).run();
			return false;
		}
		if (!div) {
			Q.handle(callback, tool, [index, div]);
			return false;
		}
		var o = Q.extend({}, 10, state, 10, options);
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
		
		if (Q.info.isMobile && o.hideBackgroundColumns) {
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
		
		Q.Pointer.cancelClick();
		
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
			var url = $prev.attr('data-url');
			var title = $prev.attr('data-title');
			if (o.pagePushUrl && url && url !== location.href) {
				Q.Page.push(url, title);
			}
		}
	},

	/**
	 * Get the column element by column index
	 * @param {Number} index
	 */
	column: function (index) {
		return this.state.columns[index] || null;
	},
	
	/**
	 * Get the data object associated to a certain column, by its index.
	 * @param {Number} index
	 */
	data: function (index) {
		return this.state.data[index] || null;
	},
	
	/**
	 * Refresh the tool and make it render its columns
	 */
	refresh: function () {
		var tool = this;
		var state = tool.state;
		var $te = $(tool.element);
		var $columns = $('.Q_columns_column', $te);
		var $container = $('.Q_columns_container', $te);
		var $cs = $('.Q_columns_column .Q_column_slot', $te);
		var top = 0;
		
		$te.prevAll()
		.each(function () {
			var $this = $(this);
			if ($this.css('position') === 'fixed'
			&& !$this.hasClass('Q_drawers_drawer')) {
				top += $this.outerHeight() + parseInt($this.css('margin-bottom'));
			}
		});
		
		if (Q.info.isMobile) {
			$te.css('top', top + 'px');
			if (!state.fullscreen) {
				$te.add($container)
					.add($columns)
					.height(Q.Pointer.windowHeight()-$te.offset().top);
			}
		}
		presentColumn(tool);

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
	
	setControls: function (index, html, callback) {
		var tool = this;
		var column = tool.column(index);
		if (!column) {
			return null;
		}
		var $controlsSlot = $('.Q_controls_slot', column);
		if (html) {
			$(column).addClass('Q_columns_hasControls');
			$controlsSlot.html(html).show().activate(function () {
				Q.handle(callback, tool);
			});
		} else {
			$(column).removeClass('Q_columns_hasControls');
			$controlsSlot.empty().hide();
		}
		presentColumn(tool);
		return $controlsSlot[0];
	},
	
	Q: {
		onRetain: function(newOptions, incomingElement) {
			Q.replace(this.element, incomingElement);
			var tool = this;
			setTimeout(function () {
				prepareColumns(tool);
				tool.refresh();
			}, 0);
		},
		beforeRemove: function () {
			if (Q.info.isAndroidStock) {
				var w = Q.Pointer.windowWidth();
				$(this.element).parents().andSelf().each(function () {
					this.style.maxWidth = $(this).data('Q/columns maxWidth');
				});
			}
		}
	}
}
);

Q.Template.set('Q/columns/column',
	'<div class="Q_contextual"><ul class="Q_listing"></ul></div>'
);

function presentColumn(tool, $column, fullscreen) {
	if (!$column) {
		$column = tool.state.$currentColumn;
		fullscreen = tool.state.fullscreen;
		if (!$column || !$column.length) {
			return;
		}
	}
	var $ct = $('.Q_columns_title', $column);
	var $cs = $('.Q_column_slot', $column);
	var $controls = $column.find('.Q_controls_slot');
	var cth = $ct.is(":visible") ? $ct.height() : 0;
	var controlsh = $controls.is(":visible") ? $controls.height() : 0;
	if (Q.info.isMobile) {
		var heightToBottom = Q.Pointer.windowHeight()
			- $cs.offset().top
			- parseInt($cs.css('padding-top'))
			- parseInt($cs.css('padding-bottom'))
			- controlsh;
		if (fullscreen) {
			$cs.add($div).css('height', 'auto');
			$cs.css('min-height', heightToBottom);
		} else {
			$cs.height(heightToBottom);
			$column.css('height', 'auto');
		}
	} else {
		$column.css('min-height', tool.oldMinHeight);
		var show = $column.data(dataKey_lastShow);
		if (show && show.height) {
			$cs.css('height', show.height - cth - controlsh + 'px');
		}
	}
	Q.layout($cs[0]);
	if (!fullscreen) {
		return;
	}
	$ct.css('position', 'fixed');
	$ct.css('top', $(tool.element).offset().top + 'px');
	var paddingTop = $ct.outerHeight();
	$cs.css('padding-top', paddingTop);
	if (Q.info.isMobile) {
		heightToBottom = Q.Pointer.windowHeight()
			- $cs.offset().top
			- paddingTop
			- parseInt($cs.css('padding-bottom'))
			- $controls.height();
		$cs.add($div).css('height', 'auto');
		$cs.css('min-height', heightToBottom);
	} else {
		$column.css('min-height', tool.oldMinHeight);
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
		tool.element.appendChild(state.container);
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

})(Q, jQuery);
