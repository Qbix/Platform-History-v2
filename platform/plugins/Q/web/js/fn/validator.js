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
 * @param {String} [options.errorClass='Q_errors'] invalidate method adds this to input elements with errors
 * @param {String} [options.messageClass='Q_error_message'] adder to error message elements
 * @param {String} [options.position='bottom'] can be either "top", "bottom", "left", or "right"
 * @param {Q.Event} [options.onFail] An event that is fired for when certain inputs fail validation
 */
Q.Tool.jQuery('Q/validator', function _Q_sortable(options) {
	var $this = $(this);
	var state = $this.state('Q/validator');
	state.$containers = $();
	$this.on('change input', function (event) {
		$this.plugin('Q/validator', 'reset', event.target);
	});
},

{	// default options:
	errorClass: 'Q_errors',
	messageClass: 'Q_error_message',
	position: 'bottom',
	offset: [0, 0],
	onFail: new Q.Event()
},
	
{
	/**
	 * Reset all the fields, clearing any errors
	 * @method reset
	 * @param {HTMLElement|Array|jQuery} elements Any elements for which to clear errors.
	 *  Defaults to all elements for which the validator added errors.
	 */
	reset: function (elements) {
		var state = $(this).state('Q/validator');
		if (elements) {
			$(elements).each(function () {
				var element = this;
				state.$containers.each(function () {
					var $container = $(this);
					if ($container.data('element') === element) {
						$container.remove();
						state.$containers = state.$containers.not(this);
						$(element).removeClass(state.errorClass);
					}
				});
			});
		} else {
			state.$containers.remove();
			state.$containers = $();
			$(":input", this).removeClass(state.errorClass);
		}
	},
	/**
	 * Display errors on some fields
	 * @method invalidate
	 * @param {Object} errors contains {fieldName: errorHTML} pairs
	 */
	invalidate: function (errors) {
		var element = this;
		var $this = $(this);
		var state = $this.state('Q/validator');
		$this.plugin('Q/validator', 'reset');
		Q.each(errors, function (name, errorHtml) {
			var $element = $this.find('[name="' + name + '"]')
				.addClass(state.errorClass);
			var $container = $('<div class="Q_validator_container" />')
				.data('element', $element[0])
				.css({
					position: 'relative',
					width: 0,
					height: 0,
					top: 0,
					width: 0,
					overflow: 'visible'
				}).insertBefore($element);
			var className = 'Q_validator_error ' + (state.messageClass || '');
			var $error = $('<div />', {"class": className})
				.html(errorHtml)
				.css('position', 'absolute')
				.appendTo($container);
			var parts = state.position.split(' ');
			if (parts.indexOf('top') >= 0) {
				$error.width($element.width())
					.css('top', '-' + $error.outerHeight() + 'px');
			}
			if (parts.indexOf('bottom') >= 0) {
				$error.width($element.width())
					.css('top', $element.outerHeight() + 'px');
			}
			if (parts.indexOf('left') >= 0) {
				$error.height($element.height())
					.css('left', '-' + $error.outerWidth + 'px');
			}
			if (parts.indexOf('right') >= 0) {
				$error.height($element.height())
					.css('left', $element.outerWidth() + 'px');
			}
			state.$containers = state.$containers.add($container);
		});
	}
}

);

})(Q, Q.jQuery, window, document);