(function (Q, $) {

var Users = Q.Users;

/**
 * Streams Tools
 * @module Streams-tools
 */

/**
 * Interface for the logged-in user to edit their basic profile fields
 * @class Streams basic
 * @constructor
 * @method basic
 * @param {Object} [options] this object contains function parameters
 *   @param {Q.Event} [options.onSuccess]
 *   @param {String} [options.platform="facebook"]
 */
Q.Tool.define("Streams/basic", function(options) {
	var tool = this;
	var af = Users.apps.facebook;
	if (af && af[Q.info.app]) {
		Users.login({
			tryQuietly: true,
			using: options.platform,
			onSuccess: function (user) {
				Users.scope(options.platform, function (perms, checked) {
					var also_birthday = checked[0] ? ',birthday' : '';
					FB.api('/me?fields=first_name,last_name,gender'+also_birthday,
					function (response) {
						if (!response) {
							return;
						}
						var map = {
							'first_name': 'firstName',
							'last_name': 'lastName',
							'gender': 'gender'
						};
						for (var k in map) {
							var tag = $('#'+tool.prefix+map[k]);
							if (!tag.val()) {
								tag.val(response[k]);
							}
						}
						if (response.birthday) {
							var parts = response.birthday.split('/');
							$('#'+tool.prefix+'birthday_day').val(parts[1]);
							if (parts[2]) {
								$('#'+tool.prefix+'birthday_year').val(parts[2]);
							} else {
								$('#'+tool.prefix+'birthday_year').focus();
							}
							$('#'+tool.prefix+'birthday_month').val(parts[0]);
						} else {
							$('#'+tool.prefix+'birthday_month').focus();
						}
					});
				}, {check: ['user_birthday']});
			}
		});
	}

	$('form', tool).plugin('Q/validator').submit(function() {
		var $this = $(this);
		$('input', $this).css({
			'background-image': 'url(' +Q.url('/{{Q}}/img/throbbers/loading.gif') + ')',
			'background-repeat': 'no-repeat'
		});
		var url = Q.ajaxExtend($this.attr('action'), 'data');
		$.post(url, $this.serialize(), function(response) {
			$('input', $this).css('background-image', 'none');
			if (response.errors) {
				// there were errors
				$this.plugin('Q/validator', 'invalidate', Q.ajaxErrors(
					response.errors,
					['firstName', 'lastName', 'gender', 'birthday_year', 'birthday_month', 'birthday_day']
				));
				$('input.Q_errors:not([type=hidden])', $this)
				.add('select.Q_errors', $this)
				.add('textarea.Q_errors', $this)
				.add('button', $this)
				.on('input change', function () {
					$this.plugin("Q/validator", "reset", $(this));
				}).eq(0).focus();
				return;
			}
			// success!
			$this.plugin('Q/validator', 'reset');
			if (options.onSuccess) {
				Q.handle(options.onSuccess);
			} else {
				Q.handle(window.location);
			}
		}, 'json');
		return false;
	});
},

{
	platform: 'facebook'
}
);

})(Q, jQuery, window);