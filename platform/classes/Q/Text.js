/**
 * @module Q
 */

var Q = require('../Q');
var fs = require('fs');

/**
 * Holds application config
 * @class Text
 * @namespace Q
 * @static
 */
var Text = {
	language: 'en',
	locale: 'US'
};

/**
 * Call this function to get the basename to use for loading files,
 * based on the language and locale set on this class.
 * Used to load files customized to a user's language (and locale).
 * @param {array} [options]
 * @param {string} [options.language=Q.Text.language] Override language
 * @param {string} [options.locale=Q.Text.locale] Override locale
 * @return {string} something like "en-US"
 */
Text.basename = function(options) {
	var language;
	var locale = Q.Config.get(['Q', 'text', 'useLocale'], false) && Text.locale || '';
	if (options.language) {
		language = options.language;
		locale = ('locale' in options) ? options.locale : locale;
	} else {
		language = Text.language;
	}
	return locale ? language + '-' + locale : language;
};

/**
 * Synchronously loads data from text file and parse to JSON
 * @method get
 * @param {string} filename The filename of the file to load.
 * @param {object} [options]
 * @param {string} [options.language=Q.Text.language] Preferred language, can be of the form "en" or "en-US"
 * @param {string} [options.language=Q.Text.language] Preferred language, can be of the form "en" or "en-US"
 * @param {boolean} [options.reload=false] Whether to reload the file even if it was already loaded before
 * @return {object} JSON object
 */
Text.get = function (filename, options) {
	var o = options || {};
	var language, locale;
	language = o.language || Text.language;
	[language, locale] = language.split('-');
	var basename = Text.basename({
		language: language,
		locale: locale
	});
	var path = Q.app.DIR + '/text/' + filename + '/' + basename + '.json';
	if (!o.reload && Text.get.results[path]) {
		return Text.get.results[path];
	}
	var data = fs.readFileSync(path, 'utf-8');

	try {
		data = data.replace(/\s*(?!<")\/\*[^\*]+\*\/(?!")\s*/gi, '');
		data = JSON.parse(data);
	} catch (e) {
		return console.error(e.message);
	}

	return Text.get.results[path] = data;
};

Text.get.results = {};

/**
 * Get parameters merged from all the text sources corresponding to a view template
 * @method params
 * @param {string} viewPath The view name, such as "Module/cool/view.handlebars"
 * @param {string} [language] Preferred language
 * @param {boolean} [reload=false] Whether to reload the files even if they was already loaded before
 * @return {array} The merged parameters that come from the text
 */
Text.params = function (viewPath, language, reload) {
	if(typeof viewPath === 'string') {
		viewPath = viewPath.split('/');
	}
	var language = language || Text.language;
	var key = viewPath + '/' + language;
	if (Text.params.results[key]) {
		return Text.params.results[key];
	}

	var count = viewPath.length;
	var _try = [];
	for (var i=0, j=0; i<=count; ++i) {
		_try[j] = viewPath.slice(0);
		if (i > 0) {
			_try[j].splice(-i, i, '*');
		}
		++j;
	}

	count = _try.length;
	var tree = new Q.Tree();
	var p, text;
	for (j=0; j < count; ++j) {
		p = ['Q', 'text'].concat(_try[j].slice(0));
		if (text = Q.Config.get(p, null)) {
			if (Array.isArray(text)) {
				// options2 = options;
			} else if (typeof text === 'object') {
				// options2 = Q.extend(options, text);
				if (!text.sources) {
					continue;
				}
				text = text.sources;
			} else {
				continue;
			}

			tree.merge(Text.get(text, language, reload));
		}
	}
	return Text.params.results[key] = tree.getAll();
};

Text.params.results = {};

module.exports = Text;