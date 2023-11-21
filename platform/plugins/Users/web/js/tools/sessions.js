(function (Q, $, window, undefined) {

var Users = Q.Users;

/**
 * Users Tools
 * @module Users-tools
 * @main
 */

/**
 * Users sessions representation
 * @class Users sessions
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {String} options.userId The id of the user object. Defaults to id of the logged-in user, if any.
 *   @param {bool} options.editable Whether user can delete sessions.
 *   @param {bool} options.devices Whether to show devices info
 */
Q.Tool.define("Users/sessions", function Users_avatar_tool(options) {
	var tool = this;
	var state = this.state;
	if (state.userId == null) {
		state.userId = Users.loggedInUserId();
	}
	Q.addStylesheet('{{Users}}/css/tools/sessions.js', 'Users');
	// session delete action
	tool.$("button[name=delete]").on(Q.Pointer.fastclick, function (e) {
		var $this = $(this);
		var $tr = $this.closest("tr");
		var sessionId = $tr.find("td.sessionId").html();
		Q.confirm("", function(res){
			if (!res) {
				return;
			}
			$tr.addClass("Q_uploading");
			Q.req('Users/sessions', [], function (err, data) {
				var fem = Q.firstErrorMessage(err, data && data.errors);
				if (fem) {
					return Q.alert(fem);
				}
				$tr.remove()
			}, {
				method: 'delete',
				fields: {
					sessionId: sessionId
				}
			});

		}, state.confirmOptions);
	});
},

{
	user: null,
	confirmOptions: {
		title: "Are you sure?"
	}
});

})(Q, Q.jQuery, window);