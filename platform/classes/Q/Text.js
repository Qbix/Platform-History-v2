/**
 * @module Q
 */

var Q = require('../Q');

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
 * Loads data from text file
 * @method get
 * @param {string} filename The filename of the file to load.
 * @param {string} [language] Preferred language
 * @param {function} [callback=null] Function to call back, with params (err, data)
 */
Text.get = function (filename, language, callback) {
	var preferredLanguage = Text.language;

	if (typeof language === 'function') {
		callback = language;
	} else if (typeof language === 'string') {
		preferredLanguage = language;
	}

	(new Q.Tree()).load(Q.app.DIR + '/text/' + filename + '/' + preferredLanguage + '.json', function(err, data) {
		if (err) {
			if (err.code !== "ENOENT") {
				return Q.handle(callback, null, [err]);
			} else data = {};
		}
		Q.handle(callback, null, [null, data]);
	});
};

module.exports = Text;