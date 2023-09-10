Q.exports(function (Users, priv, _doCancel, _handleXid, _doAuthenticate) {

    /**
     * Users plugin's front end code
     *
     * @module Users
     * @class Users
     */
	/**
	 * Displays a dialog allowing the user to set a different identifier
	 * (email address, mobile number, etc.) as their primary login method
	 * @method setIdentifier
	 * @param {Object} [options] You can pass several options here
	 *  It is passed the user information if the user changed.
	 *  @param {String} [options.identifierType] the type of the identifier, which could be "mobile" or "email" or "email,mobile" or "web3"
	 *  @param {String} [options.userId] You can set this to the id of a user in the database who doesn't have any email or mobile number set yet. This can happen if the user was e.g. invited via a printed invitation and lost it, and allows someone to help set up the first identifier for that user.
	 *  @param {Q.Event} [options.onActivate] event that occurs right after dialog is shown
	 *  @param {Q.Event} [options.onSuccess] event that occurs on success, you can pass a URL to redirect to here
	 *  @param {Q.Event} [options.onCancel] event that occurs if the dialog is canceled
	 *  @param {Function} [options.onResult] event that occurs before either onSuccess or onCancel
	 */
	return function Users_setIdentifier (options) {
		options = Q.extend({}, Users.setIdentifier.options, options);
		var identifierType = Q.getObject("identifierType", options).toLowerCase();

		function onSuccess() {
			if (false !== Q.handle(options.onResult, this, [])) {
				Q.handle(options.onSuccess, this, []);
			}
		}

		function onCancel() {
			if (false !== Q.handle(options.onResult, this, [])) {
				Q.handle(options.onCancel, this, []);
			}
		}

		priv.setIdentifier_onSuccess = onSuccess;
		priv.setIdentifier_onCancel = onCancel;

		var xid = Users.Web3.getLoggedInUserXid();
		if (identifierType === 'web3' && !xid) {
			Users.Web3.login(null, onSuccess);
		} else {
			setIdentifier_setupDialog(identifierType, options);
		}
	};

	function setIdentifier_callback(err, response) {
		var identifier_input = $('#Users_setIdentifier_identifier')
			.css('background-image', 'none');
		var form = $('#Users_setIdentifier_step1_form');

		var msg = Q.firstErrorMessage(err, response);
		if (msg) {
			// There were errors
			Q.handle(priv.setIdentifier_onCancel, this, [err, response]);
			if (identifier_input.is(":visible")) {
				form.plugin('Q/validator', 'invalidate',
					Q.ajaxErrors(response.errors, 'identifier')
				);
				identifier_input.plugin('Q/clickfocus');
			} else {
				Q.Notices.add({
					key: 'Users.setIdentifier',
					content: msg,
					type: 'error',
					timeout: 2
				});
			}
			return;
		}

		// Remove any errors we may have displayed
		form.plugin('Q/validator', 'reset');

		Q.handle(priv.setIdentifier_onSuccess, response);

		Q.Dialogs.pop();
	}

	function setIdentifier_setupDialog(identifierType, options) {
		options = options || {};
		var placeholder = Q.text.Users.setIdentifier.placeholders.identifier;
		var type = Q.info.useTouchEvents ? 'email' : 'text';
		var parts = identifierType ? identifierType.split(',') : [];
		if (parts.length === 1) {
			if (parts[0] === 'email') {
				type = 'email';
				placeholder = Q.text.Users.setIdentifier.placeholders.email;
			} else if (parts[0] === 'mobile') {
				type = 'tel';
				placeholder = Q.text.Users.setIdentifier.placeholders.mobile;
			}
		}
		if (identifierType === 'web3') {
			type = 'hidden';
		}

		var step1_form = $('<form id="Users_setIdentifier_step1_form" />');
		var step1_div = $('<div id="Users_setIdentifier_step1" class="Q_big_prompt" />').html(step1_form);

		var autocomplete = (type === 'text') ? 'on' : type;
		var identifier = (identifierType === "web3")
			? Users.Web3.getLoggedInUserXid()
			: Q.getObject("Q.Users.loggedInUser." + identifierType);
		var $identifierInput = $('<input />', {
			id: 'Users_setIdentifier_identifier',
			name: 'identifier',
			autocomplete: autocomplete,
			type: type,
			maxlength: Q.text.Users.login.maxlengths.identifier,
			placeholder: placeholder,
			value: identifier
		});
		var $identifierTypeInput = $('<input id="Users_setIdentifier_type" type="hidden" name="identifierType" />')
			.val(identifierType);

		var $button = (identifierType === 'web3')
		? $("<button class='Q_button' />")
			.text(Q.text.Users.web3.ChangeWallet)
			.on(Q.Pointer.fastclick, function () {
				Users.Web3.login(null, function (user) {
					setIdentifier_callback(null, user);
				}, null, {
					updateXid: true
				});
				return false;
			})
		: $('<button type="submit" class="Q_button Users_setIdentifier_go Q_main_button" />')
			.html(Q.text.Users.setIdentifier.sendMessage) 

		step1_form.empty().append(
			$identifierInput, $identifierTypeInput, $button
		).submit(function (event) {
			var h = $identifierInput.outerHeight() - 5;
			$identifierInput.css({
				'background-image': 'url(' + Q.info.imgLoading + ')',
				'background-repeat': 'no-repeat',
				'background-position': 'right center',
				'background-size': 'auto ' + h + 'px'
			});
			var url = Q.action('Users/identifier') + '?' + $(this).serialize();
			Q.request(url, 'data', setIdentifier_callback, {"method": "post"});
			event.preventDefault();
		});
		if (options.userId) {
			step1_form.append($('<input />', {
				type: "hidden",
				name: "userId"
			})).val(options.userId);
		}
		step1_form.plugin('Q/validator');
		var classNames = ['Users_setIdentifier_dialog'];
		options.className && classNames.push(options.className);
		identifierType === 'web3' && classNames.push('Users_setIdentifier_web3');
		setIdentifier_setupDialog.dialog = Q.Dialogs.push({
			title: options.title || Q.text.Users.setIdentifier.title,
			content: $(step1_div),
			elementId: 'Users_setIdentifier_dialog',
			className: classNames.join(' '),
			fullscreen: !!options.fullscreen,
			noClose: !!options.noClose,
			closeOnEsc: Q.typeOf(options.closeOnEsc) === 'undefined' ? true : !!options.closeOnEsc,
			beforeLoad: function () {
				setTimeout(function () {
					$('input[type!=hidden]', this).val('').trigger('change');
				}, 0);
			},
			onActivate: function () {
				var dialog = this;
				if (options.identifierType === 'web3') {
					var xid = Users.Web3.getLoggedInUserXid();
					$("<div class='Users_identifier_web3 Q_pop'>")
						.insertBefore($identifierTypeInput)
						.html(Users.Web3.abbreviateAddress(xid))
						.on('click', function () {
							Q.Dialogs.pop();
							navigator.clipboard.writeText(xid);
							Q.Notices.add({
								key: 'Users.setIdentifier.copied',
								content: Q.text.Users.clipboard.Copied,
								timeout: 2
							});
						});
				} else {
					$(dialog).plugin('Q/placeholders');
					var $firstInput = $('input[type!=hidden]', dialog)
						.eq(0).plugin('Q/clickfocus');
					setTimeout(function () {
						$firstInput[0].select();
					}, 10);
				}
				Q.handle(options.onActivate, dialog, [options]);
			},
			onClose: function () {
				$('form', this).each(function () {
					$(this).plugin('Q/validator', 'reset');
				});
				if (priv.setIdentifier_onCancel) {
					priv.setIdentifier_onCancel();
				}
				$(this).remove();
				setIdentifier_setupDialog.dialog = null;
			}
		});
	};

});