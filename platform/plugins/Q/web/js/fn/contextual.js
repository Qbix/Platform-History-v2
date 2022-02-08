(function (Q, $, window, document, undefined) {


/**
 * Q Tools
 * @module Q-tools
 */

/**
 * This plugin Makes a contextual menu from given options and handles its showing / hiding.
 * @class Q contextual
 * @constructor
 * @param {Object} [options] options an object that can include:
 * @param {Array} [options.elements] elements is an array of LI elements to add
 * @param {String} [options.className=''] className is a CSS class name for additional styling. Optional
 * @param {Integer} [options.hideDelay] Amount of milliseconds before hide contextual.
 * @param {Integer} [options.fadeTime] Amount of milliseconds to fade out.
 * @param {Boolean} [options.doubleBlink] If true use selected menu item double blinked (like iOS style) before console closed.
 * @param {Q.Event|function|String} [options.defaultHandler=null] defaultHandler is a Q.Event, or function which is called when a specific handler for selected item is not defined.
 *   So you can use just one handler for whole contextual or provide separate handlers for each item.
 * @param {Object} [options.size=null] size is an object with values for override default contextual size.
 * @param {Number} [options.size.width] width
 * @param {Number} [options.size.height] height
 */
Q.Tool.jQuery('Q/contextual', function _Q_contextual() {

	var $this = $(this);
	var state = $this.state('Q/contextual');

	// the first time when any contextual is added we need to preload its graphics,
	if ($('.Q_contextual_arrows_preloaded').length == 0) {
		$('<div class="Q_contextual_arrows_preloaded Q_contextual">' +
			'<div class="Q_contextual_top_arrow"></div>' +
			'<div class="Q_contextual_bottom_arrow"></div>' +
		'</div>').appendTo(document.body);
	}
	if (state.defaultHandler
	&& Q.typeOf(state.defaultHandler) != 'Q.Event'
	&& typeof(state.defaultHandler) != 'function'
	&& typeof(state.defaultHandler) != 'string') {
		console.warn("Default handler must be a valid Q.Event object, function or function string name.");
	}
	
	if ($this.hasClass('Q_selected')) {
		$this.removeClass('Q_selected');
		state.restoreSelected = true;
	}

	var contextual = $('<div class="Q_contextual" />');
	if (state.className) {
		contextual.addClass(state.className);
	}
	if (state.fadeTime) {
		contextual.data("fadeTime", state.fadeTime);
	}
	if (state.hideDelay) {
		contextual.data("hideDelay", state.hideDelay);
	} else if (state.doubleBlink) {
		var hideDelay = 300;
		contextual.data("hideDelay", hideDelay);
		contextual.on(Q.Pointer.fastclick, "li", function () {
			var $this = $(this);
			$this.addClass("Q_contextual_pulsate").on("animationend", function () {
				$this.removeClass("Q_contextual_pulsate");
			});
		});
	}
	var listingWrapper = $('<div class="Q_listing_wrapper" />');
	if (state.defaultHandler) {
		if (typeof(state.defaultHandler) == 'string') {
			contextual.attr('data-handler', state.defaultHandler);
		} else {
			contextual.data('defaultHandler', state.defaultHandler);
		}
	}
	var listing = $('<ul class="Q_listing" />');
	if (state.elements) {
		for (var i = 0; i < state.elements.length; ++i) {
			listing.append(state.elements[i]);
		}
	}
	contextual.append(listingWrapper.append(listing));

	// set contextual max z-index
	var highestZ = 0;
	Q.each($('div'), function () {
		var z = parseInt($(this).css("z-index"), 10);
		if(z > highestZ) {
			highestZ = z;
		}
	});
	contextual.css("z-index", highestZ);

	$(document.body).append(contextual);

	var cid = Q.Contextual.add($this, contextual, null, state.size);
	state.id = cid;
	state.contextual = contextual;
	
	Q.handle(state.onConstruct, $this, [contextual, cid]);
},

{
	className: '',
	defaultHandler: null,
	size: null,
	onConstruct: new Q.Event(),
	onShow: new Q.Event()
},

{
	/**
	 * Removes the contextual functionality from the element
	 * @method remove
	 */
	remove: function () {
		var $this = $(this);
		var state = $this.state('Q/contextual');
		if (!state) return;
		var cid = state.id;
		if (cid !== undefined) {
			var removed = Q.Contextual.remove(cid);
			removed.contextual.remove();
		}
		if (state.restoreSelected) {
			$this.addClass('Q_selected');
			state.restoreSelected = false;
		}
		state.contextual.removeData('Q/contextual trigger');
	}
}

);

Q.addStylesheet('{{Q}}/css/contextual.css', { slotName: 'Q' });

})(Q, Q.$, window, document);