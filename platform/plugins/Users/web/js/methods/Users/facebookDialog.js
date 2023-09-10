Q.exports(function (Users, priv) {

    /**
     * Users plugin's front end code
     *
     * @module Users
     * @class Users
     */
	/**
	 * Makes a dialog that resembles a facebook dialog
	 * @method facebookDialog
     * @static
	 * @param {Object} [options] A hash of options, that can include:
	 *  @param {String} [options.title] Dialog title.
	 *  @required
	 *  @param {String} [options.content] Dialog content, can be plain text or some html.
	 *  @required
	 *  @param {Array} [options.buttons] Array of object containing fields:
	 *  @required
	 *    @param {String} [options.buttons.label] is the label of the button
	 *    @param {Function} [options.buttons.handler] is a click handler for the button
	 *    @param {Boolean} [options.buttons.default] is a boolean which makes this button styled as default.
	 *  @param {Object} [options.position] Hash of x/y coordinates. By default (or if null) dialog is centered on the screen.
	 *  @optional
	 *  @param {Boolean} [options.shadow]
	 *  Whether to make a full screen shadow behind the dialog, making other elements on the page inaccessible.
	 *  @default false
	 */
	return function Users_facebookDialog (options) {
		$('.Users_facebookDialog').remove();
		$('.Users_facebookDialog_shadow').remove();

		var o = $.extend({
			'position': null,
			'shadow': false,
			'title': 'Needs a title',
			'content': 'Needs content',
			'buttons': {}
		}, options);

		if (o.shadow) {
			var shadow = $('<div class="Users_facebookDialog_shadow" />');
			$('body').append(shadow);
		}
		var dialog = $('<div class="Users_facebookDialog">' +
			'<div class="Users_facebookDialog_title">' + o.title + '</div>' +
			'<div class="Users_facebookDialog_content">' + o.content + '</div>' +
			'</div>');
		var buttonsBlock = $('<div class="Users_facebookDialog_buttons" />');
		Q.each(o.buttons, function (k, b) {
			function _buttonHandler(handler) {
				return function () {
					if (handler) {
						handler(dialog);
					} else {
						alert("Users.facebookDialog has no click handler for this button");
						dialog.close();
					}
				};
			}

			var button = $('<button />')
				.html(b.label || 'Needs a label')
				.click(_buttonHandler(b.handler))
				.appendTo(buttonsBlock);
			if (b['default']) {
				button.addClass('Q_button Users_facebookDialog_default_button');
			}
		});
		dialog.append(buttonsBlock);
		$('body').append(dialog);
		if (o.position) {
			dialog.css({
				left: o.position.x + 'px',
				top: o.position.y + 'px'
			});
		} else {
			dialog.css({
				left: ((Q.Pointer.windowHeight() - dialog.width()) / 2) + 'px',
				top: ((Q.Pointer.windowHeight() - dialog.height()) / 2) + 'px'
			});
		}
		dialog.show();

		dialog.close = function () {
			dialog.remove();
			if (typeof(shadow) != 'undefined') {
				shadow.remove();
			}
		};
	};

});