(function (Q, $) {
/**
 * @module Q-tools
 */

/**
 * Implements lazy-loading for various types of elements.
 * By default, has implementations for "img" and "Q_tool" selectors.
 * The "Q_tool" handler only works with tools whose elements have a "data-q-lazyload" attribute .
 * Note that the elements must have a stable, nonzero width height set in the CSS even
 * if they are empty, otherwise they might not be lazy-loaded, and they might
 * thrash back and forth if removed.
 * @class Q lazyload
 * @constructor
 * @param {Object} [options] Override various options for this tool
 * @param {Array} [options.handle] Set this to 
 * @param {Object} [options.handlers] You can modify the defaults by passing an object
 *    that looks like {handlerName: { selector: String, entering: Function, exiting: Function, preparing: Function}}
 *    Function "entering" receives (element, intersectionObserverEntry)
 *    Function "exiting" receives (element, intersectionObserverEntry)
 *    Function "preparing" receives (element) and is used the first time to prepare the element
 *    Both functions must return true if the element was modified.
 * @param {Element} [root=tool.element] The container inside which to watch for intesections
 * @param {Object} [debounce]
 * @param {Number} [debounce.milliseconds] How many milliseconds to wait before starting the lazyload, to avoid loading during fast scrolling
 * @param {Object} [observerOptions] Override any options to pass to IntersectionObserver
 * @param {Element} [observerOptions.root=tool.element.scrollingParent(true)]
 * @param {String} [observerOptions.rootMargin='0px']
 * @param {String} [observerOptions.threshold=0]
 * @return {Q.Tool}
 */
Q.Tool.define('Q/lazyload', function (options) {

	var tool = this;
	var state = this.state;
	state.root = state.root || this.element;

	tool.timeouts = new WeakMap();
	tool.frozen = new WeakMap();

	var Elp = Element.prototype;
	
	Q.ensure('IntersectionObserver', function () {
		// Observe whatever is on the page already
		var p = tool.element.scrollingParent(true);
		if (p === document.body) {
			p = document.documentElement;
		}
		tool.observer = _createObserver(tool, p);
		tool.observe(tool.prepare(tool.element, false));

		// Override innerHTML

		var originalSet = Object.getOwnPropertyDescriptor(Elp, 'innerHTML').set;
		var originalGet = Object.getOwnPropertyDescriptor(Elp, 'innerHTML').get;

		Object.defineProperty(Elp, 'innerHTML', {
			set: function (html) {
				var element = document.createElement('div');
				var root = state.root || document.documentElement;
				var inside = (root === this) || root.contains(this);
				if (!inside) {
					originalSet.call(this, html);
					return html;
				}
				originalSet.call(element, html);
				var found = false;
				Q.each(state.handlers, function (name, info) {
					var elements = element.querySelectorAll
						? Array.from(element.querySelectorAll(info.selector))
						: [];
					if (elements.length) {
						found = true;
						return false;
					}
				});
				if (found) {
					// prepare all images 
					tool.prepare(element, true);
				}
				originalSet.call(this, originalGet.call(element));
				tool.observe(tool.prepare(this, true));
				return html;
			},
			get: originalGet
		});

		Q.each(['insertBefore', 'appendChild'], function (i, fn) {
			var orig = Elp[fn];
			Elp[fn] = function (element) {
				if (!(element instanceof HTMLElement)) {
					return orig.apply(this, arguments);
				}
				var root = state.root || document.documentElement;
				var inside = (root === this) || root.contains(this);
				if (!inside) {
					return orig.apply(this, arguments);
				}
				var found = false;
				Q.each(state.handlers, function (name, info) {
					if (element.matches && element.matches(info.selector)) {
						found = true;
						return false;
					}
					var elements = element.querySelectorAll
						? Array.from(element.querySelectorAll(info.selector))
						: [];
					if (elements.length) {
						found = true;
						return false;
					}
				});
				if (found) {
					tool.observe(tool.prepare(element, true));
				}
				return orig.apply(this, arguments);
			};
		});
	});

},

{
	handlers: {
		img: {
			selector: 'img',
			entering: function (img, entry) {
				function _loaded() {
					img.addClass('Q_lazy_loaded');
				}
				var tool = this;
				tool.timeouts.set(img, setTimeout(function () {
					var src = img.getAttribute('data-lazyload-src');
					if (src) {
						img.setAttribute('src', Q.url(src));
						img.removeAttribute('data-lazyload-src');
						img.addClass('Q_lazy_load');
						if (img.complete) {
							_loaded();
						}
						img.addEventListener('load', _loaded);
					}
					if (tool.timeouts.get(img)) {
						clearTimeout(tool.timeouts.get(img));
					}
					tool.timeouts.delete(img);
				}, this.state.debounce.milliseconds));
				return true;
			},
			exiting: function (img) {
				if (this.timeouts.get(img)) {
					clearTimeout(this.timeouts.get(img));
					this.timeouts.delete(img);
				}
				return true; // no need to do anything else
			},
			preparing: function (img, beingInsertedIntoDOM) {
				if (!beingInsertedIntoDOM) {
					return true; // too late anyway, browser will load image
				}
				if (img.hasClass('Q_lazy_load')
				|| img.hasClass('Q_lazy_loaded')
				|| img.hasClass('Q_no_lazyload')) {
					return true; // this was already processed by lazy-loading
				}
				var src = img.getAttribute('src');
				if (src && src.substr(0, 5) !== 'data:'
				&& !img.hasAttribute('data-lazyload-src')) {
					img.setAttribute('data-lazyload-src', Q.url(src));
					img.setAttribute('src', Q.url(
						Q.getObject('Q.images.lazyload.loadingSrc')
						|| "{{Q}}/img/throbbers/transparent.gif"	
					));
				}
				return true;
			}
		},
		tool: {
			selector: '.Q_tool',
			entering: function (element, entry) {
				var tool = this;
				var ep = tool.frozen.get(element);
				var c = element.parentElement;
				if (!ep || !c) {
					// element didn't exit before, so its dimensions weren't frozen
				} else {
					var r = c.getBoundingClientRect();
					if (!ep.containerRect || ep.containerRect.width !== r.width) {
						// container was resized, so throw away the frozen dimensions
						// because a reflow should happen anyway
						tool.unfreezeDimensions(element);
					} else {
						// inform tools that their element has frozen dimensions,
						// so the tools may want to revert the frozen dimensions
						element.addClass('Q_frozen_dimensions');
					}
				}
				this.timeouts.set(element, setTimeout(function () {
					if (element.hasAttribute('data-q-lazyload')
					&& (!element.Q || !element.Q.tool)) {
						element.addClass('Q_lazy_load');
						element.setAttribute('data-q-lazyload', 'activating');
						Q.activate(element, function () {
							element.setAttribute('data-q-lazyload', 'activated');
							element.addClass('Q_lazy_loaded');
						}, {}, {lazyload: true});
					}
					if (tool.timeouts.get(element)) {
						clearTimeout(tool.timeouts.get(element));
						tool.timeouts.delete(element);
					}
				}, this.state.debounce.milliseconds));
				return true;
			},
			exiting: function (element, entry) {
				if (element.hasAttribute('data-q-lazyload')
				&& element.Q.tool) {
					// Take a snapshot of the current width and height of the element,
					// to restore it when it's later inserted back into the container,
					// and prevent all the elements shifting. However, if the container
					// itself is resizing, then we will remove this snapshot since things
					// will shift anyway.
					tool.frozen.set(element, {
						width: element.style.width,
						height: element.style.height,
						containerRect: element.container.getBoundingClientRect()
					});
					element.style.width = element.offsetWidth + 'px';
					element.style.height = element.offsetHeight + 'px';
					Q.Tool.remove(element);
					element.removeClass('Q_lazy_loading');
					element.removeClass('Q_lazy_loaded');
					element.setAttribute('data-q-lazyload', 'removed');
					if (this.state.handlers.tool.exitingRemoveHTML) {
						element.innerHTML = '';
					}
				}
				if (this.timeouts.get(element)) {
					clearTimeout(this.timeouts.get(element));
					this.timeouts.delete(element);
				}
				return true;
			},
			preparing: function (element) {
				return true;
			},
			exitingRemoveHTML: true
		}
	},
	root: undefined,
	observerOptions: {
		root: undefined,
		rootMargin: '0px',
		threshold: 0
	},
	debounce: {
		milliseconds: 300
	}
}, 

{
	prepare: function (container, beingInsertedIntoDOM) {
		var tool = this;
		var found = [];
		Q.each(tool.state.handlers, function (name, info) {
			var elements = container.querySelectorAll
				? Array.from(container.querySelectorAll(info.selector))
				: [];
			if (container.matches && container.matches(info.selector)) {
				elements.push(container);
			}
			Q.each(elements, function (i, element) {
				if (info.preparing.call(tool, element, beingInsertedIntoDOM) === true) {
					found.push(element);
				}
			});
		});
		return found;
	},
	observe: function (elements) {
		var tool = this;
		tool.observer && Q.each(elements, function (i, element) {
			tool.observer.observe(element);
		});
	},
	unobserve: function (elements) {
		var tool = this;
		tool.observer && Q.each(elements, function (i, element) {
			tool.observer.unobserve(element);
		});
	},
	unfreezeDimensions: function(element) {
		var ep = this.frozen.get(element);
		if (ep.width) {
			element.style.width = ep.width;
		} else {
			element.style.removeProperty('width');
		}
		if (ep.height) {
			element.style.height = ep.height;
		} else {
			element.style.removeProperty('height');
		}
	},
	Q: {
		beforeRemove: function () {
			this.observer && this.observer.disconnect();
		}
	}
});

function _createObserver(tool, container) {
	var o = Q.copy(tool.state.observerOptions);
	if (o.root === undefined) {
		o.root = (container === document.documentElement) ? null : (container || null);
	}
	return new IntersectionObserver(function (entries, observer) {
		Q.each(entries, function (i, entry) {
			Q.each(tool.state.handlers, function (name, info) {
				if (entry.target.matches && entry.target.matches(info.selector)) {
					if (entry.isIntersecting) {
						info.entering.call(tool, entry.target, entry);
					} else  {
						var rect = entry.target.getBoundingClientRect();
						if (rect.width > 0 && rect.height > 0) {
							// also covers !document.body.contains(entry.target)
							info.exiting.call(tool, entry.target, entry);
						} // otherwise it might get a false positive
					}
				}
			});
		});
	}, o);
}

})(Q, jQuery);