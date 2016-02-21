(function (Q, $, window, undefined) {
	
var Users = Q.Users;

/**
 * Users Tools
 * @module Users-tools
 * @main
 */

/**
 * Avatar representing a user
 * @class Users avatar
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {String} [options.userId] The id of the user object. Can be '' for a blank-looking avatar.
 *   @required
 *   @param {String} [options.icon=Q.Users.icon.defaultSize] Size of the icon to render before the display name. Or 0 for no icon.
 *   @param {Object} [options.templates] Object for avatar template parameters
 *     @param {Object} [options.templates.icon]
 *       @param {String} [options.templates.icon.dir='plugins/Users/views']
 *       @param {String} [options.templates.icon.name='Users/avatar/icon']
 *       @param {Object} [options.templates.icon.fields]
 *         @param {String} [options.templates.icon.fields.alt="user icon"]
 *     @param {Object} [options.templates.contents]
 *       @param {String} [options.templates.contents.dir='plugins/Users/views']
 *       @param {String} [options.templates.contents.name='Users/avatar/contents']
 *       @param {Object} [options.templates.contents.fields]
 *         @param {String} [options.templates.contents.fields.tag="span"]
 */
Q.Tool.define("Users/avatar", function(options) {
	if (this.element.childNodes.length) {
		return;
	}
	var tool = this;
	var state = this.state;
	if (state.userId === undefined) {
		console.warn("Users/avatar: no userId provided");
		return; // empty
	}
	if (state.icon === true) {
		state.icon = Users.icon.defaultSize;
	}
	
	var p = new Q.Pipe(['icon', 'contents'], function (params) {
		tool.element.innerHTML = params.icon[0] + params.contents[0];
	});
	
	if (state.me) {
		state.userId = Users.loggedInUserId();
	}
	
	if (state.userId === '') {
		var fields = Q.extend({}, state.templates.contents.fields, {
			name: ''
		});
		Q.Template.render('Users/avatar/icon/blank', fields, function (err, html) {
			p.fill('icon')(html);
		});
		Q.Template.render('Users/avatar/contents/blank', fields, function (err, html) {
			p.fill('contents')(html);
		});
		return;
	}
	
	Q.Users.get(state.userId, function (err, user) {
		var fields;
		if (!user) return;
		state.user = user;
		if (state.icon) {
			fields = Q.extend({}, state.templates.icon.fields, {
				src: Q.Users.iconUrl(this.icon, state.icon)
			});
			Q.Template.render('Users/avatar/icon', fields, function (err, html) {
				p.fill('icon')(html);
			}, state.templates.icon);
		} else {
			p.fill('icon')('');
		}

		fields = Q.extend({}, state.templates.contents.fields, {
			name: this.username
		});
		Q.Template.render('Users/avatar/contents', fields, function (err, html) {
			p.fill('contents')(html);
		}, state.templates.contents);
	});
},

{
	user: null,
	icon: Users.icon.defaultSize,
	templates: {
		icon: {
			dir: 'plugins/Users/views',
			name: 'Users/avatar/icon',
			fields: { alt: "user icon" }
		},
		contents: {
			dir: 'plugins/Users/views',
			name: 'Users/avatar/contents',
			fields: { tag: "span" }
		}
	}
}

);

Q.Template.set('Users/avatar/icon', '<img src="{{& src}}" alt="{{alt}}" class="Users_avatar_icon">');
Q.Template.set('Users/avatar/contents', '<{{tag}} class="Users_avatar_name">{{& name}}</{{tag}}>');
Q.Template.set('Users/avatar/icon/blank', '<div class="Users_avatar_icon Users_avatar_icon_blank"></div>');
Q.Template.set('Users/avatar/contents/blank', '<div class="Users_avatar_name Users_avatar_name_blank">&nbsp;</div>');

})(Q, jQuery, window);