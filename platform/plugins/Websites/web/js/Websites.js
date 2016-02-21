/**
 * Websites plugin's front end code
 *
 * @module Websites
 * @class Websites
 */

(function(Q, $) {
	
var Websites = Q.Websites = Q.plugins.Websites = {

};

/**
 * Websites Tools
 * @module Websites-tools
 * @main
 */

/**
 * Display a user's article on the website, which the user can edit
 * @class Websites article
 * @constructor
 */

Q.Tool.define("Websites/article", function (fields) {
	var gittool = this.$('.Users_getintouch_tool');
	var form = this.$('form.Websites_getintouch');
	function _refresh() {
		var checkbox = $('input[type=checkbox]', form);
		var opacity = (!checkbox.length || checkbox.attr('checked')) ? 1 : 0.5;
		gittool.css('opacity', opacity);
	}
	this.state['.Q_form_tool'] = {
		onSuccess: _refresh
	};
	_refresh();
	$('button', form).hide();
	$('input[type=checkbox]', form).click(function () { $(this).submit() });
});

Q.Streams.define("Websites/article", function (fields) {
	this.fields.article = fields.article;
});

Q.onInit.set(function () {
	Q.Streams.Stream.onFieldChanged(Q.plugins.Websites.userId, "Websites/title", "content").set(function (fields, k) {
		document.title = fields[k];
	}, "Websites");
}, "Websites");

/**
 * Interface for editing some common meta fields for search engine optimization
 * @class Websites seo
 * @constructor
 */
Q.Tool.define({
	"Websites/seo": "plugins/Websites/js/tools/seo.js"
});

Q.page('', function () {
	var streamName = Websites.seoStreamName;
	var publisherId = Q.plugins.Websites.userId;
	Q.Streams.Stream.onUpdated(publisherId, streamName, "title")
	.set(function (attributes, k) {
		document.title = attributes[k];
	}, "Websites");
	if (Websites.seoReload) {
		Q.Streams.Stream.onUpdated(publisherId, streamName, "url")
		.set(function (attributes, k) {
			var tail = attributes[k];
			if (tail && location !== Q.url(tail)) {
				Q.Streams.refresh(function () {
					Q.handle(Q.url(tail));
				});
			}
		}, "Websites");
	}
	return function () {
		Q.Streams.Stream.onUpdated(
			Q.plugins.Websites.userId, Websites.seoStreamName, "title"
		).remove("Websites");
	}
}, 'Websites');

})(Q, jQuery);