(function (Q, $, window, document, undefined) {

var Websites = Q.plugins.Websites;

/**
 * @module Websites-tools
 */

/**
 * Tool for admins to edit the meta tags on a page, for SEO purposes.
 * @method Websites seo
 * @param {Object} [options]
 *   @param {Object} [options.template] Optional fields to override info for seo tool template
 *   @param {String} [options.template.name="Websites/seo"] name of template
 *   @param {Object} [options.inplace={}] Hash of {attributeName: options} for Streams/inplace tools
 *   <code>
 *        url: { inplace: { placeholder: "Url" } },
 *        title: { inplace: { placeholder: "Title" } },
 *        keywords: { inplace: { placeholder: "Keywords" } },
 *        description: { inplace: { placeholder: "Description" } }
 *   </code>
 */

Q.Tool.define("Websites/seo", function () {
	var tool = this, state = tool.state;
	
	if (state.skip) {
		return;
	}
	
	var publisherId = Websites.userId;
	var streamName = Websites.seoStreamName;
	
	var templateFields = {};
	var ipo, i;
	for (var a in state.inplace) {
		if (!state.inplace[a]) continue;
		ipo = Q.extend({
			inplaceType: 'text',
			publisherId: publisherId,
			streamName: streamName,
			attribute: a, 
			inplace: { placeholder: a.toCapitalized() }
		}, state.inplace[a]);
		templateFields[a] = tool.setUpElementHTML('div', 'Streams/inplace', ipo);
	}
	
	Q.Streams.get(publisherId, streamName, function _proceed(err) {
		if (err) {
			if (Q.getObject([0, 0, 'classname'], arguments) !== "Q_Exception_MissingRow") {
				return console.warn(err);
			}
			Q.req("Websites/seo", ['stream'], function (err, data) {
				var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
				if (msg) {
					var args = [err, data];
					return console.warn("POST to Websites/seo: "+ msg);
				}
				Q.Streams.construct(Q.getObject('slots.stream', data), {}, function (err) {
					_proceed.call(this, err);
				});
			}, {
				method: 'post',
				fields: {streamName: streamName, uri: Q.info.uriString}
			});
			return;
		}
		Q.Template.render(
			'Websites/seo',
			templateFields,
			function (err, html) {
				if (err) return;
				tool.element.innerHTML = html;
				Q.activate(tool);
			},
			state.template
		);
	});
},

{
	template: {
		name: "Websites/seo"
	},
	inplace: {
		url: { inplace: { placeholder: "Url" } },
		title: { inplace: { placeholder: "Title" } },
		keywords: { inplace: { placeholder: "Keywords" } },
		description: { inplace: { placeholder: "Description" } }
	}
}

);

Q.Template.set("Websites/seo",
	"{{& url}}{{& title}}{{& keywords}}{{& description}}"
);

})(Q, jQuery, window, document);