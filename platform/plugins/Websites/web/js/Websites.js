/**
 * Websites plugin's front end code
 *
 * @module Websites
 * @class Websites
 * @main
 */

(function(Q, $) {

var Websites = Q.Websites = Q.plugins.Websites = {
	announcement: {
		url: function (articleId) {
			return Q.url('announcement/'+articleId);
		},
		onRelate: function (stateStream, chosenStream) {
			alert('Announcement posted');
			var announced = stateStream.getAttribute('announced') || {};
			var timestamp = Math.floor(Date.now()/1000);
			announced[timestamp] = {
				name: chosenStream.fields.name, 
				title: chosenStream.fields.title
			};
			stateStream.setAttribute('announced', announced);
			stateStream.save();
		}
	},
	presentation: {
		invoke: function (preview) {
			var ps = preview.state;
			Q.Streams.get(ps.publisherId, ps.streamName, function () {
				var className = 'Websites_slide_dialog';
				var editable = this.testWriteLevel('edit');
				if (editable) {
					className += ' Websites_slide_editable'
				}
				var element = Q.Tool.setUpElement('div', 'Websites/slide', {
					publisherId: ps.publisherId,
					streamName: ps.streamName
				});
				var $dialog = Q.Dialogs.push({
					title: this.fields.title,
					content: element,
					className: className,
					apply: editable,
					onActivate: function () {
						if (editable) {
							element.Q.tool.forEachChild('Streams/html', function () {
								this.state.onFroalaEditor.add(function () {
									this.focus();
								}, this)
							});
						}
					}
				});
			});
		}
	},
	advert: {
		creatives: function (publisherId, callback) {
			Q.Streams.related(
				publisherId, 'Websites/advert/creatives',
				'Websites/advert/creatives', true, function () {
					Q.handle(callback, this, arguments);
				}
			);
		}
	},
	/**
	 *	Get stream type from url
	 * @method getStreamType
	 * @param {string} param Can be url or extension
	 * @return {string}
	 */
	getStreamType: function (param) {
		var host = null;
		var extension = param;

		if (param.matchTypes('url').length) {
			param = param.match(/:\/\//gm) ? param : 'http://' + param;
			host = (new URL(param)).host;
			extension = param.substr(param.lastIndexOf('.') + 1);
		}

		var videoHosts = Q.getObject("Q.Websites.videoHosts");
		var videoExtensions = Q.getObject("Q.Websites.videoExtensions");
		var audioHosts = Q.getObject("Q.Websites.audioHosts");
		var audioExtensions = Q.getObject("Q.Websites.audioExtensions");

		if (new RegExp(videoHosts.join("|"), 'gi').test(host) || new RegExp(videoExtensions.join("|"), 'gi').test(extension)) {
			return "Streams/video";
		}

		if (new RegExp(audioHosts.join("|"), 'gi').test(host) || new RegExp(audioExtensions.join("|"), 'gi').test(extension)) {
			return "Streams/audio";
		}

		return 'Websites/webpage';
	}
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
	"Websites/seo": "{{Websites}}/js/tools/seo.js",
	"Websites/presentation": "{{Websites}}/js/tools/presentation.js",
	"Websites/slide": "{{Websites}}/js/tools/slide.js",
	"Websites/lookup": "{{Websites}}/js/tools/lookup.js",
	"Websites/webpage/composer": "{{Websites}}/js/tools/webpage/composer.js",
	"Websites/webpage/preview": "{{Websites}}/js/tools/webpage/preview.js",
	"Websites/webpage/chat": "{{Websites}}/js/tools/webpage/chat.js",
	"Websites/advert/campaign/preview": "{{Websites}}/js/tools/advert/campaign/preview.js",
	"Websites/advert/campaigns": function () {}
});

Q.Tool.onActivate("Streams/chat").set(function () {
	$(this.element).tool('Websites/webpage/chat').activate();
}, 'Websites');

Q.page('', function () {
	var streamName = Websites.seoStreamName;
	var publisherId = Q.plugins.Websites.userId;
	Q.Streams.Stream.onAttribute(publisherId, streamName, "title")
	.set(function (attributes, k) {
		document.title = attributes[k];
	}, "Websites");
	if (Websites.seoReload) {
		Q.Streams.Stream.onAttribute(publisherId, streamName, "url")
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
		Q.Streams.Stream.onAttribute(
			Q.plugins.Websites.userId, Websites.seoStreamName, "title"
		).remove("Websites");
	}
}, 'Websites');

})(Q, jQuery);