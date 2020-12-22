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

	var Elp = Element.prototype;
	
	Q.ensure(window.IntersectionObserver, _polyfill, function () {
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
					html = originalGet.call(element);
				}
				originalSet.call(this, html);
				if (found) {
					tool.observe(tool.prepare(this, true));
				}
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
				return true;
			},
			exiting: function (img) {
				// no need to do anything
				return true;
			},
			preparing: function (img, beingInsertedIntoDOM) {
				if (!beingInsertedIntoDOM) {
					return true; // too late anyway, browser will load image
				}
				if (img.hasClass('Q_lazy_load') || img.hasClass('Q_lazy_loaded')) {
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
				if (element.hasAttribute('data-q-lazyload')
				&& (!element.Q || !element.Q.tool)) {
					element.addClass('Q_lazy_load');
					element.setAttribute('data-q-lazyload', 'activating');
					Q.activate(element, function () {
						element.setAttribute('data-q-lazyload', 'activated');
						element.addClass('Q_lazy_loaded');
					}, {}, true);
					return true;
				}
			},
			exiting: function (element, entry) {
				if (element.hasAttribute('data-q-lazyload')
				&& element.Q.tool) {
					Q.Tool.remove(element);
					element.removeClass('Q_lazy_loading');
					element.removeClass('Q_lazy_loaded');
					element.setAttribute('data-q-lazyload', 'removed');
					if (this.state.handlers.tool.exitingRemoveHTML) {
						element.innerHTML = '';
					}
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

function _polyfill(callback) {
	// Exit early if all IntersectionObserver and IntersectionObserverEntry
	// features are natively supported.
	if ('IntersectionObserver' in window &&
	    'IntersectionObserverEntry' in window &&
	    'intersectionRatio' in window.IntersectionObserverEntry.prototype) {

	  // Minimal polyfill for Edge 15's lack of `isIntersecting`
	  // See: https://github.com/w3c/IntersectionObserver/issues/211
	  if (!('isIntersecting' in window.IntersectionObserverEntry.prototype)) {
	    Object.defineProperty(window.IntersectionObserverEntry.prototype,
	      'isIntersecting', {
	      get: function () {
	        return this.intersectionRatio > 0;
	      }
	    });
	  }
	  return Q.handle(callback);
	}
	Q.addScript('{{Q}}/js/polyfills/IntersectionObserver.js', callback);
}

_polyfill();

})(Q, jQuery);