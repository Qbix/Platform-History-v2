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
 * Call this function to get the lls to use for loading files,
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
	return language.toLowerCase() + (locale ? '-' + locale.toUpperCase() : '');
};

/**
 * Sets the text for a specific text source (only inside the process)
 * @method set
 * @static
 * @param {String} name The name of the text source
 * @param {Object} content The content, a hierarchical object whose leaves are
 *  the actual text translated into the current language in Q.Text.language
 * @param {Object} [options]
 * @param {String} [options.language=Q.Text.language] Preferred language, e.g. "en"
 * @param {String} [options.locale=Q.Text.locale] Preferred locale, e.g. "US"
 * @param {Boolean} [options.merge=false] If true, merges on top instead of replacing
 * @return {Object} The content that was set, with any loaded overrides applied
 */
Text.set = function (name, content, options) {
	var obj, override, n, o, toMerge, merged;
	var o = options || {};
	var language, locale;
	language = o.language || Text.language;
	[language, locale] = language.split('-');
	var lls = Text.basename({
		language: language,
		locale: locale
	});
	if (Q.getObject([lls, name], Text.override)) {
		// override was specified for this content, merge over it
		content = Q.extend({}, content, 10, Text.override[lls][name]);
	}
	if (o.merge) {
		obj = Q.getObject([lls, name], Q.Text.collection);
	}
	if (obj) {
		Q.extend(obj, 10, content);
	} else {
		Q.setObject([lls, name], content, Text.collection);
	}
	override = (content && content['@override']) || {};
	for (n in override) {
		toMerge = Q.getObject([lls, n], Text.override);
		merged = Q.extend({}, toMerge, 10, override[n]);
		Q.setObject([lls, n], merged, Text.override);
		if (o = Q.getObject([lls, n], Text.collection)) {
			// content was already loaded, merge over it in text collection
			Q.extend(o, 10, Text.override[lls][n]);
		}
	}
	return content;
};

/**
 * Synchronously loads data from text file and parse to JSON
 * @method get
 * @param {Strin|Arrayg} name The name of the file to load, e.g. "Streams/content".
 * @param {Object} [options]
 * @param {String} [options.language=Q.Text.language] Preferred language, e.g. "en"
 * @param {String} [options.locale=Q.Text.locale] Preferred locale, e.g. "US"
 * @param {Boolean} [options.reload=false] Whether to reload the file even if it was already loaded before
 * @return {Object} the object containing text tree data
 */
Text.get = function (name, options) {
	if (Q.isArrayLike(name)) {
		function onlyUnique(value, index, array) {
			return array.indexOf(value) === index;
		}
		var tree = new Q.Tree();
		name.filter(onlyUnique).forEach(function (item) {
			tree.merge(Text.get(item, options));
		});
		return tree.getAll();
	}
	var o = options || {};
	var language, locale;
	language = o.language || Text.language;
	[language, locale] = language.split('-');
	var lls = Text.basename({
		language: language,
		locale: locale || ''
	});
	var path = Q.app.DIR + '/text/' + name + '/' + lls + '.json';
	var content = Q.getObject([lls, path], Text.collection);
	if (!o.reload && content) {
		return content;
	}
	var data = fs.readFileSync(path, 'utf-8');
	try {
		data = data.replace(/\s*(?!<")\/\*[^\*]+\*\/(?!")\s*/gi, '');
		data = JSON.parse(data);
	} catch (e) {
		return console.error(e.message);
	}
	return Text.set(name, data, options);
};

Text.collection = {};
Text.override = {};

/**
 * Get parameters merged from all the text sources corresponding to a view template
 * @method params
 * @param {string} viewPath The view name, such as "Module/cool/view.handlebars"
 * @param {object} options
 * @param {string} [options.language=Q.Text.language] Preferred language
 * @param {boolean} [options.reload=false] Whether to reload the files even if they was already loaded before
 * @return {array} The merged tree that comes from the text files
 */
Text.params = function (viewPath, options) {
	options = options || {};
	if(typeof viewPath === 'string') {
		viewPath = viewPath.split('/');
	}
	var language = options.language || Text.language;
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
	for (j=0; j<count; ++j) {
		p = ['Q', 'text'].concat(_try[j].slice(0));
		if (text = Q.Config.get(p, null)) {
			if (Array.isArray(text)) {
				options2 = options;
			} else if (typeof text === 'object') {
				if (!text.sources) {
					continue;
				}
				text = text.sources;
			} else {
				continue;
			}
			tree.merge(Text.get(text, options2));
			break; // just take whatever is there, no merging
		}
	}
	return Text.params.results[key] = tree.getAll();
};

Text.params.results = {};

module.exports = Text;