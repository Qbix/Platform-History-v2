(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * jQuery plugin that adds action icons that appear over elements and allow the user to perform some action, and display correctly on both desktop and mobile.
 * @class Q actions
 * @constructor
 * @param {Object} [options] possible options
 * @param {Array} [options.actions={}] actions an array of name:function pairs
 * @param {String} [options.containerClass=''] containerClass any class names to add to the actions container
 * @param {Number} [options.zIndex=null] zIndex z-index from style
 * @param {String} [options.position='mr'] position one of 't', 'm', 'b' followed by one of 'l', 'c', 'r'
 * @param {Number} [options.size=32] size number for css class basic , example 32 for basic32 class
 * @param {Boolean} [options.alwaysShow=Q.info.isTouchscreen] if false, shows the actions on mouseover, otherwise always shows
 * @param {Boolean} [options.horizontal=true] horizontal if true, show actions horizontally
 * @param {Boolean} [options.reverse=false] reverse if true, show in reverse order
 * @param {Boolean} [options.clickable=true] clickable use clickable plugin
 * @param {Object} [options.context={}] context any context to pass to the actions
 * @param {Number} [options.repositionMs=200] repositionMs how many milliseconds between repositioning
 * @param {Q.Event} [options.onShow] onShow , event that triggering after action show
 * @param [Q.Event] [options.beforeHide] beforeHide , event that triggering before action close
 * @param [Q.Event] [options.onClick] onClick , event that triggering on action click
*/
Q.Tool.jQuery('Q/actions',

function _Q_actions(options) {
	$(this).plugin('Q/actions', 'refresh');
},

{	// default options:
	actions: {}, // an array of name:function pairs
	containerClass: '', // any class names to add to the actions container
	zIndex: null,
	position: 'mr', // one of 't', 'm', 'b' followed by one of 'l', 'c', 'r'
	size: 32, // could be 16
	alwaysShow: Q.info.isTouchscreen,
	horizontal: true, // if true, show actions horizontally
	reverse: false, // if true, show in reverse order
	clickable: true, // use clickable plugin
	context: {}, // any context to pass to the actions
	repositionMs: 200, // how many milliseconds between repositioning
	onShow: new Q.Event(),
	beforeHide: new Q.Event(),
	onClick: new Q.Event()
},

{
	remove: function () {
		var $this = $(this);
		var state = $this.state('Q/actions');
		var tool = Q.getObject('Q.tools.q_actions', $this[0]);
		if (tool) {
			tool.remove();
		}
		state.container.remove();
		$this.off('mouseenter.Q_actions mouseleave.Q_actions');
	},
	refresh: function (){
		var $this = $(this);
		var state = $this.state('Q/actions');
		var cw, ch;
		if (!state.container) {
			var container = $('<div class="Q_actions_container" />').css({
				'position': 'absolute',
				'zIndex': state.zIndex,
				'white-space': 'nowrap'
			});
			var interval = null;
			if (state.containerClass) {
				container.addClass(state.containerClass);
			}
			var size = state.size;
			if (state.horizontal) {
				cw = 0;
				ch = size;
			} else {
				cw = size;
				ch = 0;
			}
			state.container = container;
			var buttons = {};
			Q.each(state.actions, function (action, callback) {
				var button = $("<div class='Q_actions_action basic"+size+"' />")
					.addClass('Q_actions_'+action)
					.addClass('basic'+size+'_'+action)
					.attr('action', action)
					.on(Q.Pointer.fastclick, function (event) {
						Q.handle(callback, this, [action, state.context], {
							fields: {
								action: action,
								context: state.context
							}
						});
						Q.Pointer.cancelClick(true, event);
						event.stopPropagation();
						Q.handle(state.onClick, $this, [this]);
					}).on(Q.Pointer.start, function (event) {
						$(this).addClass('Q_discouragePointerEvents');
						$(window).on([Q.Pointer.end, '.Q_actions'], function () {
							$(this).removeClass('Q_discouragePointerEvents');
							$(window).off([Q.Pointer.end, '.Q_actions']);
						});
					}).click(function (event) {
						Q.Pointer.cancelClick(true, event);
						event.stopPropagation();
					});
				buttons[action] = button;
				if (state.reverse) {
					button.prependTo(container);
				} else {
					button.appendTo(container);
				}
				if (state.horizontal) {
					cw += size/16*17;
				} else {
					ch += size/16*17;
				}
			});
			state.buttons = {};
			Q.each(state.actions, function (action, callback) {
				state.buttons[action] = buttons[action];
			});
		}
		if ($this.css('position') === 'static') {
			$this.css('position', 'relative');
		}
		if (state.alwaysShow) {
			_show($this, state, state.container);
		} else {
			$this.off('mouseenter.Q_actions mouseleave.Q_actions');
			$this.on('mouseenter.Q_actions', function () {
				_show($this, state, state.container);
			});
			$this.on('mouseleave.Q_actions', function () {
				_hide($this, state, state.container);
			});
		}
	
		function _show($this, state, container) {
			container.appendTo($this);
			if (state.horizontal) {
				$('.Q_actions_action', container).css({
					'display': 'inline-block',
					'zoom': 1
				});
			}
			container.css({
				'width': cw+'px',
				'height': ch+'px',
				'line-height': ch+'px'
			});
			if (state.clickable) {
				var $action = $('.Q_actions_action', container);
				if (!$action.state('Q/clickable')) {
					$action.plugin('Q/clickable').width(0);
				}
			}
		
			_position($this, state.position, container);
			Q.onLayout($this[0]).set(function () {
				_position($this, state.position, container);
			}, Math.random().toString(36));

			state.onShow.handle.apply($this, [state, container]);
		}
	
		function _hide($this, state, container) {
			interval && clearInterval(interval);
			if (false === state.beforeHide.handle.apply($this, [state, container])) {
				return false;
			}
			container.detach();
		}
	}
}

);


function _position($this, position, container) {
	if (!$this.is(':visible')) {
		return container.hide();
	}
	container.show();
	var cw = container.width(), ch = container.height(), left, top;
	switch (position[0]) {
		case 'b':
			top = ($this.innerHeight()-ch)+'px';
			break;
		case 'm':
			top = ($this.innerHeight()/2-ch/2)+'px';
			break;
		case 't':
		default:
			top = $this.css('margin-left');
			break;
	}
	switch (position[1]) {
		case 'l':
			left = 0;
			break;
		case 'c':
			left = (+$this.innerWidth()/2-cw/2)+'px';
			break;
		case 'r':
		default:
			left = ($this.innerWidth()-cw)+'px';
			break;
	}
	container.css('top', top);
	container.css('left', left);
}

})(Q, Q.$, window, document);