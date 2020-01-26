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
 * @param {Object} [observerOptions] Override any options to pass to IntersectionObserver
 * @return {Q.Tool}
 */
Q.Tool.define('Q/lazyload', function (options) {

	var tool = this;
	var state = this.state;

	var Elp = Element.prototype;

	// Observe whatever is on the page already
	tool.observer = _createObserver(tool, tool.element);
	tool.findAndObserve(tool.element);

	// Override innerHTML

	var originalSet = Object.getOwnPropertyDescriptor(Elp, 'innerHTML').set;
	var originalGet = Object.getOwnPropertyDescriptor(Elp, 'innerHTML').get;

	Object.defineProperty(Elp, 'innerHTML', {
		set: function (html) {
			var element = document.createElement('div');
			originalSet.call(element, html);
			var found = false;
			Q.each(state.handlers, function (name, info) {
				var elements = element.querySelectorAll
					? Array.from(element.querySelectorAll(info.selector))
					: [];
				Q.each(elements, function (i, element) {
					if (info.preparing.call(tool, element, true) === true) {
						found = true;
					}
				});
			});
			if (found) {
				html = originalGet.call(element);
			}
			originalSet.call(this, html);
			if (found) {
				tool.findAndObserve(this);
			}
			return html;
		},
		get: originalGet
	});

	Q.each(['insertBefore', 'appendChild'], function (i, fn) {
		var orig = Elp[fn];
		Elp[fn] = function (element) {
			if (!element) {
				return;
			}
			var found = false;
			Q.each(state.handlers, function (name, info) {
				var elements = element.querySelectorAll
					? Array.from(element.querySelectorAll(info.selector))
					: [];
				if (element.matches && element.matches(info.selector)) {
					elements.push(element);
				}
				Q.each(elements, function (i, element) {
					if (info.preparing.call(tool, element, true) === true) {
						found = true;
						tool.observer.observe(element);
					}
				});
			});
			return orig.apply(this, arguments);
		};
	});

},

{
	root: null,
	handlers: {
		img: {
			selector: 'img',
			entering: function (img, entry) {
				var src = img.getAttribute('data-lazyload-src');
				if (src) {
					img.setAttribute('src', src);
					img.removeAttribute('data-lazyload-src');
					img.addClass('Q_lazy_load');
					img.addEventListener('load', function () {
						img.addClass('Q_lazy_loaded');
					});
				}
				return true;
			},
			exiting: function (img) {
				// no need to do anything
				return true;
			},
			preparing: function (img, entry, beingInsertedIntoDOM) {
				if (!beingInsertedIntoDOM) {
					return true; // too late anyway, browser will load image
				}
				var src = img.getAttribute('src');
				if (src) {
					img.setAttribute('data-lazyload-src', src);
					img.removeAttribute('src');
				}
				return true;
			}
		},
		tool: {
			selector: '.Q_tool',
			entering: function (element, entry) {
				if (element.hasAttribute('data-Q-lazyload')
				&& (!element.Q || !element.Q.tool)) {
					element.addClass('Q_lazy_load');
					Q.activate(element, function () {
						element.addClass('Q_lazy_loaded');
					});
					return true;
				}
			},
			exiting: function (element, entry) {
				if (element.hasAttribute('data-Q-lazyload')
				&& element.Q.tool) {
					Q.Tool.remove(element);
					element.removeClass('Q_lazy_loading');
					element.removeClass('Q_lazy_loaded');
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
	observerOptions: {
		root: null,
		rootMargin: '0px',
		threshold: 0
	}
}, 

{
	refresh: function () {
		var tool = this;
		var state = tool.state;
		var index = state.index;
		var total = state.total;
		if (!Q.isInteger(state.total) || state.total < 0) {
			throw new Q.Error("Q/paging: total is not valid: " + state.total);
		}
		$(tool.element).empty();
		for (var i=0; i<=state.total-1; ++i) {
			var $dot = $('<img />').attr({
				'src': Q.url((i === index) ? state.pages.current : state.pages.other),
				'class': 'Q_paging_dot '
					+ (i === index) ? 'Q_paging_dot_current' : 'Q_paging_dot_other'
			}).appendTo(tool.element);
		}
	},
	findAndObserve: function (container) {
		var tool = this;
		var found = false;
		Q.each(tool.state.handlers, function (name, info) {
			var elements = container.querySelectorAll
				? Array.from(container.querySelectorAll(info.selector))
				: [];
			if (container.matches && container.matches(info.selector)) {
				elements.push(container);
			}
			Q.each(elements, function (i, element) {
				if (info.preparing.call(tool, element) === true) {
					found = true;
					tool.observer.observe(element);
				}
			});
		});
	}
});

function _createObserver(tool, container) {
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
	}, tool.state.observerOptions);
}

})(Q, jQuery);