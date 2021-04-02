(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 */

/**
 * Adds a cool "popping" effect to a clickable element when you press it,
 * which especially looks nice on touchscreens.
 * I originally came up with this effect at Intermagix.
 * @class Q clickable
 * @constructor
 * @param {Object} [options] options for function configuration
 * @param {String} [options.className] any CSS classes to add to the container element
 * @param {Object|null} [options.shadow] shadow effect configuration, or false for no shadow
 * @param {String} [options.shadow.src="{{Q}}/img/shadow3d.png"] url of the shadow image
 * @param {Number} [options.shadow.stretch=1.5] stretch
 * @param {Number} [options.shadow.dip=0.25] dip
 * @param {Number} [options.shadow.opacity=0.5] opacity
 * @param {Object} [options.press] press
 * @param {Number} [options.press.duration=100] duration
 * @param {Number} [options.press.size=0.85] size
 * @param {Number} [options.press.opacity=1] opacity
 * @param {Q.Animation.ease} [option.press.ease=Q.Animation.ease.linear] ease
 * @param {Object} [options.release] release
 * @param {Number} [options.release.duration=75] duration
 * @param {Number} [options.release.size=1.3] size
 * @param {Number} [options.release.opacity=0.5] opacity
 * @param {Q.Animation.ease} [options.release.ease=Q.Animation.ease.smooth] ease
 * @param {Object} [options.snapback] snapback
 * @param {Number} [options.snapback.duration=75] duration
 * @param {Q.Animation.ease} [options.snapback.ease=Q.Animation.ease.smooth]
 * @param {Object} [options.center] center
 * @param {Number} [options.center.x=0.5] x
 * @param {Number} [options.center.y=0.5] y
 * @param {Boolean} [options.selectable=false]
 * @param {Boolean} [options.triggers=null] A jquery selector or jquery of additional elements to trigger the clickable
 * @param {Q.Event} [options.onPress] onPress occurs after the user begins a click or tap.
 * @param {Q.Event} [options.onRelease] onRelease occurs after the user ends the click or tap. This event receives parameters (event, overElement)
 * @param {Q.Event} [options.afterRelease] afterRelease occurs after the user ends the click or tap and the release animation completed. This event receives parameters (evt, overElement)
 * @param {Q.Event} [options.onClick] This is triggered after the user completes a click or tap over the element.
 * @param {Number} [options.cancelDistance=15] cancelDistance
 *
 */
Q.Tool.jQuery('Q/clickable', function _Q_clickable(o) {
	var $this = $(this);
	var state = $this.state('Q/clickable');
	$this.on('invoke.Q_clickable', function () {
		$(this).trigger('mousedown');
		setTimeout(function () {
			$(this).trigger('release')
		}, o.press.duration);
	});
	var originalTime = Date.now();
	var timing = state.timing;

	setTimeout(function _clickify() {
		// if element already wrapped clickable container, do nothing
		if ($this.closest(".Q_clickable_container").length) {
			return;
		}

		if (!$this.is(':visible')) {
			if (!$this.closest('body').length) {
				return;
			}
			if (isNaN(timing.waitingPeriod) || Date.now() - originalTime >= timing.waitingPeriod) {
				return;
			}
			if (timing.waitingInterval) {
				setTimeout(_clickify, timing.waitingInterval);
			}
			return;
		}
		
		Q.onLayout($this.parent()[0]).set(function () {
			var state = $this.state('Q/clickable');
			$this.plugin('Q/clickable', 'remove')
				.plugin('Q/clickable', state);	
		}, 'Q/clickable');

		state.oldStyle = $this.attr('style');
		var display = $this.css('display');
		var position = $this.css('position');
		var p = $this.parent();
		if (p.length && p[0].tagName.toUpperCase() === 'TD') {
			p.css('position', 'relative');
		}
	    if (!o.selectable) {
			$this[0].preventSelections(true);
		}
		var $triggers;
		if (o.triggers) {
			$triggers = (typeof o.triggers === 'function')
				? $(o.triggers.call($this, o))
				: $(o.triggers);
		}
		var rect = $this[0].getBoundingClientRect();
		var csw = Math.ceil(rect.width);
		var csh = Math.ceil(rect.height);
		// $this.css('height', $this.height()+'px');
		var $container = $('<span class="Q_clickable_container" />').css({
			'display': (display === 'inline' || display === 'inline-block') ? 'inline-block' : display,
			'zoom': 1,
			'position': position === 'static' ? 'relative' : position,
			'left': position === 'static' ? 0 : $this.css('left'),
			'right': position === 'static' ? 'auto' : $this.css('right'),
			'top': position === 'static' ? 0 : $this.css('top'),
			'margin': '0px',
			'padding': '0px',
			'border': '0px solid transparent',
			'float': $this.css('float'),
			// 'z-index': $this.css('z-index') + 1, //10000,
			'width': csw+'px',
			'height': csh+'px',
			'max-width': $this.css('max-width'),
			'max-height': $this.css('max-height'),
			'overflow': 'visible',
			'line-height': $this.css('line-height'),
			'vertical-align': $this.css('vertical-align'),
			'text-align': $this.css('text-align')
		}).attr({
			'data-origin-classes': $this.attr('class'),
			'data-origin-attributes': function () {
				var i,
					attributeNodes = $this[0].attributes,
					length = attributeNodes.length,
					attrs = '';

				for (i = 0; i < length; i++) {
					if (attributeNodes[i].name === 'class') {
						continue;
					}

					attrs += attributeNodes[i].name + ':' + attributeNodes[i].value + ';';
				}
				return attrs;
			}()
		});
		if (state.className) {
			$container.addClass(state.className);
		}
		$this.hide(); // to get percentage values, if any, for margins & padding
		Q.each(['left', 'right', 'top', 'bottom'], function (i, pos) {
			$container.css('margin-'+pos, $this.css('margin-'+pos));
		});
		$this.show();
		$this.css('margin', 0);
		$container.insertAfter($this);
		// $this.css('height', h);
		// if (display === 'inline') {
		// 	$container.html('&nbsp;');
		// }
		if (!o.allowCallout) {
			$this.css('-webkit-touch-callout', 'none');
		}
		if (o.shadow && o.shadow.src) {
			var shadow = $('<img />').addClass('Q_clickable_shadow')
				.attr('src', Q.url(o.shadow.src));
			shadow.css('display', 'none').appendTo($container).on('load', function () {
				var $this = $(this);
				var width = csw * o.shadow.stretch;
				var height = Math.min($this.height() * width / $this.width(), csh/2);
				var toSet = {
					'position': 'absolute',
					'left': (csw - width)/2+'px',
					'top': csh - height * (1-o.shadow.dip)+'px',
					'width': width+'px',
					'height': height+'px',
					'opacity': o.shadow.opacity,
					'display': '',
					'padding': '0px',
					'background': 'none',
					'border': '0px',
					'outline': '0px'
				};
				var i, l, props = Object.keys(toSet);
				$this.css(toSet);
			});
		}
		var $stretcher = $('<div class="Q_clickable_stretcher" />').css({
			'position': 'absolute',
			'left': '0px',
			'top': '0px',
			'width': csw+'px',
			'height': csh+'px',
			'overflow': 'visible',
			'padding': '0px',
			'margin': '0px'
		}).addClass('Q_clickable_sized')
		.appendTo($container);
		var triggers = $stretcher;
		var width = csw;
		var height = csh;
		var left = parseInt($container.css('left'));
		var top = parseInt($container.css('top'));
		var tw = $this.outerWidth();
		var th = $this.outerHeight();
		$this.appendTo($stretcher).css({
			position: 'absolute',
			left: '0px',
			top: '0px'
			// width: csw,
			// height: csh
		});
		var zindex;
		var anim = null;
	
		triggers = $stretcher;
		if ($triggers && $triggers.length) {
			if (!Q.info.isTouchscreen) {
				$triggers.mouseenter(function () {
					$container.addClass('Q_hover');
				}).mouseleave(function () {
					$container.removeClass('Q_hover');
				});
			}
			triggers = triggers.add($triggers);
		}
	
		var _started = null;
		triggers.on('dragstart', function () {
			return false;
		}).on(Q.Pointer.start, function (evt) {
			/*if (Q.info.isTouchscreen) {
				evt.preventDefault();
				evt.stopPropagation();
			}*/
			if ($this.css('pointer-events') === 'none') return;
			if (_started) return;
			_started = this;
			setTimeout(function () {
				_started = null;
			}, 0);
			if (Q.Pointer.canceledClick
			|| $('.Q_discouragePointerEvents', evt.target).length) {
				return;
			}
			if (!o.selectable) {
				triggers[0].preventSelections(true);
			}
			zindex = $this.css('z-index');
			$container.css('z-index', 1000000).addClass('Q_pressed');
			Q.handle(o.onPress, $this, [evt, triggers]);
			state.animation = Q.Animation.play(function(x, y) {
				scale(1 + y * (o.press.size-1));
				$this.css('opacity', 1 + y * (o.press.opacity-1));
			}, o.press.duration, o.press.ease);
			//$this.bind('click.Q_clickable', function () {
			//	return false;
			//});
			var pos = null;
			$container.parents().each(function () {
				var $t = $(this);
				$t.data('Q/clickable scrollLeft', $t.scrollLeft());
				$t.data('Q/clickable scrollTop', $t.scrollTop());
				$t.data('Q/clickable transform', $t.css('transform'));
			});
			Q.Pointer.onCancelClick.set(function (e, extraInfo) {
				if (!extraInfo || !extraInfo.comingFromPointerMovement) {
					return;
				}
				var jq = $(document.elementFromPoint(
					extraInfo.toX, 
					extraInfo.toY
				));
				var scrolled = false;
				$container.removeClass('Q_pressed')
				.parents().each(function () {
					var $t = $(this);
					if ($t.data('Q/clickable scrollLeft') != $t.scrollLeft()
					|| $t.data('Q/clickable scrollTop') != $t.scrollTop()
					|| $t.data('Q/clickable transform') != $t.css('transform')) {
						// there was some scrolling of parent elements
						scrolled = true;
						return false;
					}
				});
				if (!scrolled) {
					var overElement = (jq.closest(triggers).length > 0);
					if (overElement) {
						return false; // click doesn't have to be canceled
					}
				}
				state.animation && state.animation.pause();
				scale(1);
			}, 'Q/clickable');
			var _released = false;
			$(window).add(triggers).on('release.Q_clickable', onRelease);
			state.onEndedKey = Q.Pointer.onEnded.set(onRelease, state.onEndedKey);
			if (state.preventDefault) {
				evt.preventDefault();
			}
			if (state.stopPropagation) {
				evt.stopPropagation();
			}
			function onRelease (evt) {
				if (_released) return;
				_released = true;
				setTimeout(function () { 
					_released = false;
				}, 0);
				$container.removeClass('Q_pressed')
				.parents().each(function () {
					$(this).removeData(
						['Q/clickable scrollTop',
						 'Q/clickable scrollTop', 
						 'Q/clickable transform']
					); 
				});
				var jq;
				if (!evt) {
					jq = null;
				} else if (evt.type === 'release') {
					jq = $this;
				} else {
					var x = Q.Pointer.getX(evt);
					var y = Q.Pointer.getY(evt);
					jq = $(Q.Pointer.elementFromPoint(x, y));
				}
				Q.Pointer.onEnded.remove(state.onEndedKey);
				var overElement = !Q.Pointer.canceledClick 
					&& jq && jq.closest(triggers).length > 0;
				var factor = scale.factor || 1;
				state.animation && state.animation.pause();
				if (overElement) {
					state.animation = Q.Animation.play(function(x, y) {
						scale(factor + y * (o.release.size-factor));
						$this.css('opacity', o.press.opacity + y * (o.release.opacity-o.press.opacity));
					}, o.release.duration, o.release.ease);
					var key = state.animation.onComplete.set(function () {
						state.animation = Q.Animation.play(function(x, y) {
							scale(o.release.size + y * (1-o.release.size));
							$this.css('opacity', 1 + y * (1 - o.release.opacity));
						}, o.snapback.duration, o.snapback.ease);
						state.animation.onComplete.set(function () {
							Q.handle(o.afterRelease, $this, [evt, overElement]);
							$this.trigger('afterRelease', $this, evt, overElement);
							$container.css('z-index', zindex);
							// $this.unbind('click.Q_clickable');
							// $this.trigger('click');
							state.animation = null;
						});
					});
				} else {
					state.animation = Q.Animation.play(function(x, y) {
						scale(factor + y * (1-factor));
						$this.css('opacity', o.press.opacity + y * (1-o.press.opacity));
						// if (x === 1) {
						// 	$this.off('click.Q_clickable');
						// }
					}, o.release.duration, o.release.ease);
					state.animation.onComplete.set(function () {
						state.animation = null;
					});
					setTimeout(function () {
						Q.handle(o.afterRelease, $this, [evt, overElement]);
						$this.trigger('afterRelease', $this, evt, overElement);
						$container.css('z-index', zindex);
						state.animation = null;
					}, o.release.duration);
				}
			
				if (!o.selectable) {
					triggers[0].restoreSelections(true);
				}
			
				$(window).add(triggers)
					.off([Q.Pointer.end, '.Q_clickable'])
					.off('release.Q_clickable');
				var ts = $this.state('Q/clickable');
				if (ts) { // it may have been removed already
					Q.handle(ts.onRelease, $this, [evt, overElement, triggers]);
				}
			};
			function scale(factor) {
				scale.factor = factor;
				if (!Q.info.isIE(0, 8)) {
					$stretcher.css({
						'-moz-transform': 'scale('+factor+')',
						'-webkit-transform': 'scale('+factor+')',
						'-o-transform': 'scale('+factor+')',
						'-ms-transform': 'scale('+factor+')',
						'transform': 'scale('+factor+')'
					});
				} else if (!scale.started) {
					scale.started = true;
					$stretcher.css({
						left: width * (o.center.x - factor/2) * factor +'px',
						top: height * (o.center.y - factor/2) * factor +'px',
						zoom: factor
					});
					scale.started = false;
				}
			}
		}).on(Q.Pointer.click, function (evt) {
			if (state.preventDefault) {
				evt.preventDefault();
			}
		}).on('focus', function (evt) {
			if (state.stopPropagation) {
				evt.stopPropagation();
			}
		});
		
		if (timing.renderingInterval) {
			var csw2, csh2;
			setTimeout(function _update() {
				if (state.animation || Date.now() - originalTime >= timing.renderingPeriod) {
					return;
				}
				$stretcher.removeClass('Q_clickable_sized');
				var rect = $this[0].getBoundingClientRect();
				var csw = Math.ceil(rect.width);
				var csh = Math.ceil(rect.height);
				if (csw2 != csw || csh2 != csh) {
					if (!$this.is(':visible')) {
						return;
					}
					$container.css({
						'width': csw,
						'height': csh
					});
					$stretcher.css({
						'width': csw+'px',
						'height': csh+'px'
					});
				}
				csw2 = csw;
				csh2 = csh;
				$stretcher.addClass('Q_clickable_sized');
				setTimeout(_update, timing.renderingInterval);
			}, timing.renderingInterval);
		}
	}, timing.renderingDelay);
	return this;
},

{	// default options
	shadow: {
		src: "{{Q}}/img/shadow3d.png",
		stretch: 1.5,
		dip: 0.25,
		opacity: 0.5
	},
	press: {
		duration: 100,
		size: 0.85,
		opacity: 1,
		ease: Q.Animation.ease.linear
	},
	release: {
		duration: 75,
		size: 1.3,
		opacity: 0.5,
		ease: Q.Animation.ease.smooth
	},
	snapback: {
		duration: 75,
		ease: Q.Animation.ease.smooth
	},
	center: {
		x: 0.5,
		y: 0.5
	},
	timing: {
		renderingPeriod: 0,
		renderingInterval: 100,
		waitingPeriod: 0,
		waitingInterval: 100,
		renderingDelay: 0
	},
	selectable: false,
	allowCallout: false,
	cancelDistance: 15,
	preventDefault: false,
	stopPropagation: true,
	onPress: new Q.Event(),
	onRelease: new Q.Event(function (event, overElement) {
		if (overElement) {
			Q.handle(this.state.onClick, this, [event]);
		}
	}),
	afterRelease: new Q.Event(),
	onClick: new Q.Event()
},

{
	remove: function () {
		var $container = this.parent().parent('.Q_clickable_container');
		var state = this.state('Q/clickable');
		this.attr('style', state.oldStyle || "").insertAfter($container);
		this[0].restoreSelections();
		Q.Pointer.onEnded.remove(state.onEndedKey);
		$container.remove();
	}
}

);

})(Q, Q.$, window, document);