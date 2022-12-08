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
 * @param {Object} [options]
 *   @param {String} options.userId The user's id, e.g. Q.Users.loggedInUserId(). Can be '' for a blank-looking avatar.
 *   @param {Number|String|true} [options.icon=Q.Users.icon.defaultSize] Size of the icon to render before the display name. Or 0 for no icon. You can also pass true here for default size. Or pass a string to specify the url of the icon.
 *   @param {Boolean} [options.contents] Set to false to not show the name
 *   @param {String} [options.className] Any css classes to add to the tool element
 *   @param {Object} [options.templates] Object for avatar template parameters
 *     @param {Object} [options.templates.icon]
 *       @param {String} [options.templates.icon.dir='{{Users}}/views']
 *       @param {String} [options.templates.icon.name='Users/avatar/icon']
 *       @param {Object} [options.templates.icon.fields]
 *         @param {String} [options.templates.icon.fields.alt="user icon"]
 *     @param {Object} [options.templates.contents]
 *       @param {String} [options.templates.contents.dir='{{Users}}/views']
 *       @param {String} [options.templates.contents.name='Users/avatar/contents']
 *       @param {Object} [options.templates.contents.fields]
 *         @param {String} [options.templates.contents.fields.tag="span"]
 *   @param {Q.Event} [options.onRefresh]  An event that occurs when the avatar is refreshed
 *   @param {Q.Event} [options.onMissing]  An event that occurs if the avatar info turns out to be missing
 */
Q.Tool.define("Users/avatar", function Users_avatar_tool(options) {
	if (this.element.childNodes.length) {
		return;
	}
	var tool = this;
	var state = this.state;
	if (state.icon === true) {
		state.icon = Users.icon.defaultSize;
	}
	if (state.className) {
		$(tool.element).addClass(state.className);
	}
	tool.refresh();
},

{
	userId: null,
	icon: Users.icon.defaultSize,
	contents: true,
	templates: {
		icon: {
			dir: '{{Users}}/views',
			name: 'Users/avatar/icon',
			fields: { alt: "user icon" }
		},
		contents: {
			dir: '{{Users}}/views',
			name: 'Users/avatar/contents',
			fields: { tag: "span" }
		}
	},
	onMissing: new Q.Event(function () {
		this.element.style.display = 'none';
	}, 'Users/avatar'),
	onRefresh: new Q.Event()
},

{
	/**
	 * Refresh the avatar's display
	 * @method refresh
	 */
	refresh: function () {
		var tool = this;
		var state = this.state;
		var p = new Q.Pipe(['icon', 'contents'], function (params) {
			var icon = state.icon ? params.icon[0] : '';
			var contents = state.contents ? params.contents[0] : '';
			tool.element.innerHTML = icon + contents;
		});
	
		if (state.userId === '') {
			var fields = Q.extend({}, state.templates.contents.fields, {
				name: '',
				state: state
			});
			Q.Template.render('Users/avatar/icon/blank', fields, function (err, html) {
				p.fill('icon')(html);
			});
			Q.Template.render('Users/avatar/contents/blank', fields, function (err, html) {
				p.fill('contents')(html);
			});
			return;
		}
		
		var fields = Q.extend({}, state.templates.icon.fields, {
			src: Users.iconUrl('loading', 40)
		});
		Q.Template.render('Users/avatar/loading', fields, function (err, html) {
			tool.element.innerHTML = html;
		});
		tool.element.addClass('Q_loading');
	
		Users.get(state.userId, function (err, user) {
			var fields;
			tool.element.removeClass('Q_loading');
			if (!user) {
				return Q.handle(state.onMissing, tool, [err]);
			}
			state.user = user;
			if (state.icon) {
				var src = isNaN(state.icon)
					? state.icon
					: Q.url(avatar.iconUrl(state.icon), 40);
				fields = Q.extend({}, state.templates.icon.fields, {src: src});
				Q.Template.render('Users/avatar/icon', fields, function (err, html) {
					p.fill('icon')(html);
				}, Q.extend({size: state.icon}, state.templates.icon));
			} else {
				p.fill('icon')('');
			}

			fields = Q.extend({}, state.templates.contents.fields, {
				name: this.username.encodeHTML()
			});
			Q.Template.render('Users/avatar/contents', fields, function (err, html) {
				p.fill('contents')(html);
				Q.handle(state.onRefresh, tool, []);
			}, state.templates.contents);
		});
	}
}

);

Q.Template.set('Users/avatar/loading', '{{#if state.icon}}<img src="{{& src}}" alt="{{alt}}" class="Users_avatar_loading Users_avatar_icon Users_avatar_icon_{{size}}">{{else}}...{{/if}}');
Q.Template.set('Users/avatar/icon', '<img src="{{& src}}" alt="{{alt}}" class="Users_avatar_icon Users_avatar_icon_{{size}}">');
Q.Template.set('Users/avatar/contents', '<{{tag}} class="Users_avatar_name">{{& name}}</{{tag}}>');
Q.Template.set('Users/avatar/icon/blank', '<div class="Users_avatar_icon Users_avatar_icon_blank"></div>');
Q.Template.set('Users/avatar/contents/blank', '<div class="Users_avatar_name Users_avatar_name_blank">&nbsp;</div>');

})(Q, Q.$, window);