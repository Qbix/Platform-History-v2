(function (Q, $) {

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
 */
Q.Tool.define("Streams/basic", function(options) {
	var me = this;
	var tool = this.element;

	if (Q.plugins.Users.facebookApps[Q.info.app]) {
		Q.plugins.Users.login({
			tryQuietly: true,
			using: 'facebook',
			onSuccess: function (user) {

				FB.api({
					method: 'fql.query',
					query:'SELECT user_birthday FROM permissions WHERE uid=me()'
				}, function (response) {
					var also_birthday = '';
					if (response && response[0] && response[0].user_birthday) {
						also_birthday = ', birthday_date';
					}
					FB.api({
						method: 'fql.query',
						query:'SELECT firstName, lastName, gender'+also_birthday+' FROM user WHERE uid=me()'
					}, function (response) {
						if (!response || !response[0]) return;
						for (var k in {firstName:1,lastName:1,gender:1}) {
							var tag = $('#'+this.prefix+k);
							if (!tag.val()) {
								tag.val(response[0][k]);
							}
						}
						if (response[0].birthday_date) {
							var parts = response[0].birthday_date.split('/');
							$('#'+this.prefix+'birthday_day').val(parts[1]);
							if (parts[2]) {
								$('#'+this.prefix+'birthday_year').val(parts[2]);
							}
							$('#'+this.prefix+'birthday_month').val(parts[0]);
						} else {
							$('#'+this.prefix+'birthday_month').focus();
						}
					});
				});
			}
		});
	}

	$('form', tool).validator({
		onFail: function(a, b) {

		}
	}).submit(function() {
		var $this = $(this);
		$('input', $this).css({
			'background-image': 'url(' +Q.url('/plugins/Q/img/throbbers/loading.gif') + ')',
			'background-repeat': 'no-repeat'
		});
		var url = Q.ajaxExtend($this.attr('action'), 'data');
		$.post(url, $this.serialize(), function(response) {
			$('input', $this).css('background-image', 'none');
			if (response.errors) {
				// there were errors
				$this.data("validator").reset().invalidate(Q.ajaxErrors(
					response.errors,
					['firstName', 'lastName', 'gender', 'birthday_year', 'birthday_month', 'birthday_day']
				));
				$('input.Q_errors:not([type=hidden])', $this)
				.add('select.Q_errors', $this)
				.add('textarea.Q_errors', $this)
				.add('button', $this)
				.on('input change', function () {
					$this.data("validator").reset($(this));
				}).eq(0).focus();
				return;
			}
			// success!
			$this.data('validator').reset();
			if (options.onSuccess) {
				Q.handle(options.onSuccess);
			} else {
				Q.handle(window.location);
			}
		}, 'json');
		return false;
	});
}
);

})(Q, jQuery, window);