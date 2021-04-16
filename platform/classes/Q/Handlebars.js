/**
 * @module Q
 */
 
var Q = require('../Q');
var fs = require('fs');
var handlebars = require('handlebars');

var _loaders;
var _partials;
var _templates = {};

var _ext = Q.Config.get(['Q', 'extensions', 'handlebars'], '.handlebars');

function _loader(path) {
	return function(name) {
		if (name.slice(-_ext.length) !== _ext) {
			name += _ext;
		}
		if (fs.existsSync(path+Q.DS+name)) {
			return fs.readFileSync(path+Q.DS+name, 'utf8');
		}
	};
}

function _getLoaders() {
	if (_loaders === undefined) {
		_loaders = []; _partials = [];
		if (fs.existsSync(Q.VIEWS_DIR)) {
			_loaders.unshift(_loader(Q.VIEWS_DIR));
		}
		if (fs.existsSync(Q.VIEWS_DIR+Q.DS+'partials')) {
			_partials.unshift(_loader(Q.VIEWS_DIR+Q.DS+'partials'));
		}
		var plugins = Q.Config.get(['Q', 'plugins'], []);
		for (i=0; i<plugins.length; i++) {
			path = Q.pluginInfo[plugins[i]].VIEWS_DIR;
			if (fs.existsSync(path)) {
				_loaders.unshift(_loader(path));
			}
			if (fs.existsSync(path+Q.DS+'partials')) {
				_partials.unshift(_loader(path+Q.DS+'partials'));
			}
		}
		if (fs.existsSync(Q.app.VIEWS_DIR)) {
			_loaders.unshift(_loader(Q.app.VIEWS_DIR));
		}
		if (fs.existsSync(Q.app.VIEWS_DIR+Q.DS+'partials')) {
			_partials.unshift(_loader(Q.app.VIEWS_DIR+Q.DS+'partials'));
		}
	}
	return _loaders;
}

/**
 * Call this in your helpers to parse the args into a useful array.
 * You must call it like this: handlebars.prepareArgs.call(this, arguments)
 * @method prepareArgs
 * @static
 * @param {Array} arguments to helper function
 * @return {array}
 */
handlebars.prepareArgs = function(args) {
	var arr = Array.prototype.slice.call(args, 0);
	var last = arr.pop(); // last parameter is for the hash
	arr.shift(); // the pattern
	var result = Q.isEmpty(last.hash) ? {} : Q.copy(last.hash);
	Q.each(arr, function (i, item) {
		result[i] = item;
	});
	return Q.extend(result, this);
};

handlebars.registerHelper('call', function(path) {
	if (!path) {
		return "{{call missing method name}}";
	}
	var args = handlebars.prepareArgs.call(this, arguments);
	var parts = path.split('.');
	var subparts = parts.slice(0, -1);
	var i=0;
	var params = [];
	do {
		params.push(args[i]);
	} while (args[++i]);
	var f = Q.getObject(parts, this);
	if (typeof f === 'function') {
		return f.apply(Q.getObject(subparts, this), params);
	}
	if (parts[0] === 'Q') {
		parts.shift();
		subpath.shift();
		f = Q.getObject(parts, Q);
		if (typeof f === 'function') {
			return f.apply(Q.getObject(subparts, Q), params);
		}
	}
	return "{{call "+path+" not found}}";
});

handlebars.registerHelper('toUrl', function(url) {
	if (Q.isPlainObject(url)) {
		// we meant to pass a variable, not call a helper
		url = Q.getObject('data.root.toUrl', url);
	}
	if (!url) {
		return "{{url missing}}";
	}
	return Q.url(Q.getObject('data.root.toUrl', url) || url);
});

handlebars.registerHelper('toCapitalized', function(text) {
	if (Q.isPlainObject(text)) {
		// we meant to pass a variable, not call a helper
		text = Q.getObject('data.root.toCapitalized', text);
	}
	text = text || '';
	return text.charAt(0).toUpperCase() + text.slice(1);
});

handlebars.registerHelper('json', function(context) {
	if (typeof context == "object") {
		return JSON.stringify(context);
	}
	return context;
});

handlebars.registerHelper('interpolate', function(expression) {
	if (Q.isEmpty(expression) || arguments.length < 2) {
		return '';
	}
	var args = handlebars.prepareArgs.call(this, arguments);
	return expression.interpolate(args);
});

handlebars.registerHelper('option', function(value, html, selectedValue) {
	var attr = value == selectedValue ? ' selected="selected"' : '';
	return new Handlebars.SafeString(
		'<option value="'+value.encodeHTML()+'"'+attr+'>'+html+"</option>"
	);
});

handlebars.registerHelper('replace', function(find, replace, options) {
	return options.fn(this).replace(find, replace);
});

/* helper to compare two arguemnts for equal: {{#ifEquals arg1 arg2}} */
Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
	return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});


/**
 * Creates a Q.Handlebars object
 * @class Handlebars
 * @namespace Q
 */
module.exports = {
	
	handlebars: handlebars,

	/**
	 * Load and return the content of a handlebars template (synchronously)
	 * @method template
	 * @param {string} path The template name
	 * @return {string|null} The content of the template, or null if it wasn't found
	 */
	template: function (path) {
		if (_templates[path]) {
			return _templates[path];
		}
		var i, tpl = null, loaders = _getLoaders();
		for (i=0; i<loaders.length; i++) {
			if ((tpl = loaders[i](path))) break;
		}
		return tpl ? (_templates[path] = tpl.toString()) : null;
	},

	/**
	 * Render handlebars template
	 * @method render
	 * @param {string} tPath Path to template
	 * @param {object} [fields] Optional. The fields to pass to the template.
	 * @param {Array} partials Optional. The names of partials to load and use for rendering.
	 * @return {string|null}
	 */
	render: function(tPath, fields, partials) {
		try {
			if (!tPath) return null;
			var i, tpl = this.template(tPath), part = {}, path;

			if (!tpl) return null;

			if (partials) {
				for (path in partials) {
					path = partials[i];
					for (j=0; j<_partials.length; j++) {
						if (part[path] = _partials[j](path)) {
							break;
						}
					}
				}
			}
			return handlebars.compile(tpl)(fields, {partials: part});
		} catch(e) {
			console.warn(e);
			throw e;
		}
	},

	/**
	 * Render handlebars literal source string
	 * @method render
	 * @param {string} content The source content
	 * @param {object} [fields] Optional. The fields to pass to the template
	 * @param {Array} partials Optional. The names of partials to load and use for rendering.
	 * @return {string|null}
	 */
	renderSource: function(content, fields, partials) {
		var i, j, path, part = {};

		if (partials) {
			_getLoaders();
			for (i=0; i<partials.length; i++) {
				path = partials[i];
				for (j=0; j<_partials.length; j++) {
					if (part[path] = _partials[j](path)) {
						break;
					}
				}
			}
		}
		return handlebars.compile(content)(fields, {partials: part});
	}
};