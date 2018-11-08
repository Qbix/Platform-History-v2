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
	language: 'en'
};

/**
 * Synchronously loads data from text file and parse to JSON
 * @method get
 * @param {string} filename The filename of the file to load.
 * @param {string} [language] Preferred language
 * @return {object} JSON object
 */
Text.get = function (filename, language) {
	var preferredLanguage = language || Text.language;

	var path = Q.app.DIR + '/text/' + filename + '/' + preferredLanguage + '.json';
	var data = fs.readFileSync(path, 'utf-8');

	try {
		data = data.replace(/\s*(?!<")\/\*[^\*]+\*\/(?!")\s*/gi, '');
		data = JSON.parse(data);
	} catch (e) {
		return console.error(e.message);
	}

	return data;
};

/**
 * Get parameters merged from all the text sources corresponding to a view template
 * @method params
 * @param {string} viewPath The parts of the view name, to use with Q/text config
 * @param {object} [options] Object of options which will pass to Q.Text.get
 * @return {array} The merged parameters that come from the text
 */
Text.params = function (viewPath, options) {
	if(typeof viewPath === 'string') {
		viewPath = viewPath.split('/');
	}

	options = options || {};

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
	var p, text, options2;
	for (j=0; j < count; ++j) {
		p = ['Q', 'text'].concat(_try[j].slice(0));
		if (text = Q.Config.get(p, null)) {
			if (Array.isArray(text)) {
				options2 = options;
			} else if (typeof text === 'object') {
				options2 = Q.extend(options, text);
				if (!options2.sources) {
					continue;
				}
				text = options2.sources;
			} else {
				continue;
			}

			tree.merge(Q.Text.get(text, options2.language));
		}
	}
	return tree.getAll();
};

module.exports = Text;