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

handlebars.registerHelper('call', function(path) {
	if (!path) {
		return "{{call missing method name}}";
	}
	var parts = path.split('.');
	var p0 = parts[0];
	var p1 = parts[1];
	if (this[p0] && typeof this[p0][p1] === 'function') {
		var args = Array.prototype.slice.call(
			arguments, 1, arguments.length-1
		);
		return this[p0][p1].apply(this[p0], args);
	}
	return "{{call \""+path+"\" not found}}";
});

/**
 * Creates a Q.Handlebars object
 * @class Handlebars
 * @namespace Q
 */
module.exports = {

	/**
	 * Search for handlebars template
	 * @method template
	 * @param {string} path The template name
	 * @return {string|null}
	 */
	template: function (path) {
		if (_templates[path]) return _templates[path];
		var i, tpl = null, loaders = _getLoaders();
		for (i=0; i<loaders.length; i++) {
			if ((tpl = loaders[i](path))) break;
		}
		return tpl ? (_templates[path] = tpl.toString()) : null;
	},

	/**
	 * Render handlebars template
	 * @method render
	 * @param {string} template The template name
	 * @param {object} data Optional. The data to render
	 * @param {Array} partials Optional. The names of partials to load and use for rendering.
	 * @return {string|null}
	 */
	render: function(tPath, data, partials) {
		try {
			if (!tPath) return null;
			var i, tpl = this.template(tPath), part = {}, path;

			if (!tpl) return null;

			if (partials) {
				for (path in partials) {
					var path = partials[i];
					for (j=0; j<_partials.length; j++) {
						if (part[path] = _partials[j](path)) {
							break;
						}
					}
				}
			}
			return handlebars.compile(tpl)(data, {partials: part});
		} catch(e) {
			console.warn(e);
			throw e;
		}
	},

	/**
	 * Render handlebars literal source string
	 * @method render
	 * @param {string} content The source content
	 * @param {object} data Optional. The data to render
	 * @param {Array} partials Optional. The names of partials to load and use for rendering.
	 * @return {string|null}
	 */
	renderSource: function(content, data, partials) {
		var i, j, path, part = {};

		if (partials) {
			_getLoaders();
			for (i=0; i<partials.length; i++) {
				var path = partials[i];
				for (j=0; j<_partials.length; j++) {
					if (part[path] = _partials[j](path)) {
						break;
					}
				}
			}
		}
		return handlebars.compile(content)(data, {partials: part});
	}
};