(function (Q, $) {

/**
 * @module Q-tools
 */
	
/**
 * Place this tool inside a <form> tag to create nice AJAX forms
 * @class Q form
 * @constructor
 * @param {Object} [options] This is an object of parameters for this function
 *   @param {Q.Event} [options.onSubmit] This event triggers On form submit
 *   @default Q.Event()
 *   @param {Q.Event} [options.onResponse] This event triggers after getting some response from from url request
 *   @default Q.Event()
 *   @param {Q.Event} [options.onSuccess] This event triggers if response returned with 200 success code , and if there are no HTTP errors in response headers
 *   @default Q.Event()
 *   @param {String} [options.slotsToRequest] Slot names for Q.request
 *   @default 'form'
 *   @param {Object} [options.contentElements] An Object of {slotName: Element} pairs to replace their content.
 *     Otherwise, by default, after a response with no errors, we replace the content in the tool's container element,
 *     from the first slot found in slotsToRequest.
 *   @default {}
 *   @param {Function} [options.loader] Main request function which calls on form submit
 *   @default <code>function (url, method, params, slots, callback) {  Q.request(url+"?"+params, slots, callback, {method: method}); }</code>
 *      @param {String} [options.loader.url] Url for request
 *      @param {String} [options.loader.method] Form Method / Request Method
 *      @param {String} [options.loader.params] Url Encoded /Serialised form data as URL parameters
 *      @param {String} [options.loader.slots] Slot Names
 *      @param {Function} [options.loader.callback] Callback function after request
 *
*/

Q.Tool.define('Q/form', function(options) {

	Q.addStylesheet('{{Q}}/css/form.css');
	this.refresh(options);

},

{
	onSubmit: new Q.Event(),
	onResponse: new Q.Event(),
	onSuccess: new Q.Event(),
	slotsToRequest: 'form',
	contentElements: {},
	loader: function (url, method, form, slots, callback) {
		if (method.toUpperCase() === 'GET') {
			Q.request(params, url, slots, callback);
		} else {
			Q.request(url, slots, callback, {
				method: method,
				formdata: new FormData(form)
			});
		}
	}
},

{
	Q: {
		beforeRemove: {"Q/form": function () {
			var form = $(this.element).closest('form');
			if (form.data('Q/form tool') === this) {
				form.removeData('Q/form tool');
				form.off('submit.Q_form');
			}
		}},
	
		onRetain: {"Q/form": function (options) {
			this.refresh(options);
		}}
	},
	
	/**
	 * @method refresh
	 */
	refresh: function () {
		// constructor & private declarations
		var tool = this;

		var $te = $(tool.element);
		var $form = $te.closest('form');
		if (!$form.length) return;
		if ($form.data('Q/form tool')) return;
		$form.on('submit.Q_form', function(event) {
			function onResponse(err, data) {
				$form.removeClass('Q_working').removeAttr('disabled');
				document.activeElement = tool.activeElement;
				var msg;
				if (msg = Q.firstErrorMessage(err)) {
					return alert(msg);
				}
				Q.handle(tool.state.onResponse, tool, arguments);
				$('div.Q_form_undermessagebubble', $te).empty();
				$('tr.Q_error', $te).removeClass('Q_error');
				if ('errors' in data) {
					tool.applyErrors(data.errors);
					$('tr.Q_error').eq(0).prev().find(':input:visible').eq(0).focus();
					if (data.scriptLines && data.scriptLines.form) {
						eval(data.scriptLines.form);
					}
				} else {
					var slots = Object.keys(data.slots);
					var pipe = new Q.pipe(slots, function () {
						Q.handle(tool.state.onSuccess, tool, arguments);
					});
					for (var slot in data.slots) {
						var e;
						switch (typeof tool.state.contentElements[slot]) {
						case 'HTMLElement':
						case 'jQuery':
							e = $(tool.state.contentElements[slot]); break;
						case 'string':
							e = $(tool.state.contentElements[slot], form); break;
						default:
							e = $(tool.element);
						}
						if (data.slots[slot] != null) {
							var replaced = Q.replace(e[0], data.slots[slot]);
							Q.activate(replaced, pipe.fill(slot));
						}
						if (data.scriptLines && data.scriptLines[slot]) {
							eval(data.scriptLines[slot]);
						}
					}
				}
			};
			event.preventDefault();
			tool.activeElement = document.activeElement;
			$form.addClass('Q_working').attr('disabled', 'disabled');
			var result = {};
			var action = $form.attr('action');
			if (!action) {
				action = window.location.href.split('?')[0];
			}
			Q.handle(tool.state.onSubmit, tool, [$form[0], result]);
			if (result.cancel) {
				return false;
			}
			var input = $('input[name="Q.method"]', $form);
			method = (input.val() || $form.attr('method') || 'post').toUpperCase();
			if (tool.state.ignoreCache
			&& typeof tool.state.loader.forget === "function") {
				tool.state.ignoreCache = false;
				tool.state.loader.forget(action, method, $form.serialize(), tool.state.slotsToRequest);
			}
			tool.state.loader(action, method, $form[0], tool.state.slotsToRequest, onResponse);
		});
		$('input', $form).add('select', $form).on('input', function () {
			if ($form.state('Q/validator')) {
				$form.plugin('Q/validator', 'reset', $(this));
			}
		});
		$form.data('Q/form tool', tool);
	},
	
	/**
	 * @method applyErrors
	 * @param {Object} errors
	 */
	applyErrors: function(errors) {
		var err = null;
		for (var i=0; i<errors.length; ++i) {
			if (!('fields' in errors[i])
			|| Q.typeOf(errors[i].fields) !== 'array'
			|| !errors[i].fields.length) {
				err = errors[i];
				continue;
			}
			for (var j=0; j<errors[i].fields.length; ++j) {
				var k = errors[i].fields[j];
				var td = $("td[data-fieldname='"+k+"']", this.element);
				if (!td.length) {
					err = errors[i];
				}
				var tr = td.closest('tr').next();
				tr.addClass('Q_error');
				$('div.Q_form_undermessagebubble', tr)
					.html(errors[i].message);
			}
		}
		if (err) {
			alert(err.message);
		}
	}
}

);

})(Q, jQuery);