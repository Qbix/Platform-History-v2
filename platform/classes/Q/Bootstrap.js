/**
 * @module Q
 */
var Q = require('../Q');
/**
 * Define properties and methods needed to load and initialize platform classes and config
 * @class Bootstrap
 * @namespace Q
 */
var Bootstrap = {};

/**
 * Add path to the list of paths checked by node.js while searching a module
 * @method setIncludePath
 * @param {string} path
 * @param {boolean} whether a new path was added
 */
Bootstrap.setIncludePath = function (path) {
	var paths = (process.env.NODE_PATH || '').split(Q.PS);
	if (!path) {
		paths.unshift(Q.app.CLASSES_DIR, Q.CLASSES_DIR);
	} else if (paths.indexOf(path) >= 0) {
		return false;
	} else {
		paths.splice(1, 0, path);
	}
	var normalize = require('path').normalize;
	for (var i = 0, l = paths.length; i<l; ++i) {
		paths[i] = normalize(paths[i]);
	}
	process.env.NODE_PATH = paths.join(Q.PS);
	require('module')._initPaths();
	return true;
};

/**
 * @method registerExceptionHandler
 */
Bootstrap.registerExceptionHandler = function() {
	process.on('uncaughtException', Q.exceptionHandler);
};

var _reloadConfig;

/**
 * Load platform configuration
 * @method configure
 * @param {function} callback Callback is fired when config is ready. 
 *  Errors are thrown if "reload" is false and passed to "callback" if "reload" is true
 * @param {boolean} [reload=false] Wheather config is loaded on process start or reloaded by active process
 * @throws {Error} if reload is `false` throws any errors appearing during config load process, otherwise
 * 	passes them to callback
 */
Bootstrap.configure = function (callback, reload) {
	if (reload) {
		clearTimeout(_reloadConfig); // if called manually clear the loop
	}
	var c = callback;
	callback = function () {
		process.env.TZ = Q.Config.expect(['Q', 'defaultTimezone']);
		c.apply(this, arguments);
	};
	var Config = new Q.Tree();
	var pluginInfo = {};
	var p = new Q.Pipe(['Q_config', 'app_merged'], function (params) {
		for (var k in params) {
			if (params[k][0]) {
				if (reload) {
					callback && callback(params[k][0]);
					return;
				} else {
					throw params[k][0];
				}
			}
		}
		var app_merged = params.app_merged[1];
		if (app_merged.Q.plugins && app_merged.Q.plugins.length) {
			var plugins = [];
			for (var i in app_merged.Q.plugins) {
				plugins.push(app_merged.Q.plugins[i]);
			}
			if (app_merged.Q.plugins.indexOf('Q') < 0) {
				app_merged.Q.plugins.unshift('Q');
			}
			var filenames = [];
			for (i in app_merged.Q.plugins) {
				var plugin = app_merged.Q.plugins[i];
				var tree = new Q.Tree();
				filenames.push(Q.PLUGINS_DIR+'/'+plugin+'/config/plugin.json');
				var dirs = {
					CLASSES_DIR: 'classes',
					CONFIG_DIR: 'config',
					FILES_DIR: 'files',
					HANDLERS_DIR: 'handlers',
					SCRIPTS_DIR: 'scripts',
					TESTS_DIR: 'tests',
					VIEWS_DIR: 'views'
				};
				pluginInfo[plugin] = {};
				for (var dir in dirs) {
					pluginInfo[plugin][dir] = Q.PLUGINS_DIR+'/'+plugin+'/'+dirs[dir];
				}
				Bootstrap.setIncludePath(Q.PLUGINS_DIR+'/'+plugin+'/classes');
			}
			Q.pluginInfo = pluginInfo;
			// load and merge all the plugin config files
			Config.load(filenames, function (err) {
				// finally, merge the app_merged config on top
				_merge_app_config(err);
			});
		} else {
			_merge_app_config();
		}
		function _startConfigLoop() {
			var timeout = Q.Config.get(['Q', 'internal', 'configServer', 'interval'], 60)*100;
			if (timeout)
				_reloadConfig = setTimeout(function () {
					Bootstrap.configure(function (err) {
						if (err) Q.emit('Config/reload', err);
					}, true);
				}, timeout);
			else
				Bootstrap.configure(function (err) {
					if (err) Q.emit('Config/reload', err);
				}, true);
		}
		function _loadConfigExtras (callback) {
			// Now, load any other files we were supposed to load
			var config_files = Config.get(['Q', 'configFiles'], []);
			if (config_files.length) {
				var p = new Q.Pipe(config_files, function (params) {
					for (var k in params) {
						if (params[k][0]) throw params[k][0];
						else Config.merge(params[k][1]);
					}
					// second round to catch configFiles inside configFiles
					config_files = Config.get(['Q', 'configFiles'], []);
					if (config_files.length) {
						var p = new Q.Pipe(config_files, function(params) {
							for (var k in params) {
								if (params[k][0]) throw params[k][0];
								else Config.merge(params[k][1]);
							}
							callback && callback();
						});
						for (var i=0; i<config_files.length; i++) {
							Q.Config.getFromServer(config_files[i], p.fill(config_files[i]));
						}
					}
				});
				for (var i=0; i<config_files.length; i++) {
					Q.Config.getFromServer(config_files[i], p.fill(config_files[i]));
				}
			} else {
				callback && callback();
			}
		}
		function _merge_app_config (err) {
			if (err) {
				if (reload) return callback && callback(err);
				throw err;
			}
			Config.merge(app_merged);
			if (reload) {
				try {
					_loadConfigExtras(function () {
						Q.Config.clear(); // clear the config
						Q.Config.set(Config.getAll());
						// TODO: THIS LEAKS MEMORY!  FIX IT
						// THANKSFULLY WE DON'T NEED IT FOR NOW
						// _startConfigLoop();
						/**
						 * Config tree hs been reloaded
						 * @event Config/reload
						 * @param {Error} error
						 *	The error object if any
						 */
						Q.emit('Config/reload', null);
						callback && callback();
					});
				} catch (err) {
					callback && callback(err);
				}
			}
			else {
				// start config server listener before loading other files
				Q.Config.clear();
				Q.Config.set(Config.getAll());
				Q.Config.listen(function() {
					_loadConfigExtras(function() {
						Q.Config.clear(); // clear the config to make merge faster
						Q.Config.set(Config.getAll());
						_startConfigLoop();
						callback && callback();
					});
				});
			}
		}
	});
	Config.load(Q.CONFIG_DIR+'/Q.json', p.fill('Q_config'));
	var app_merged = new Q.Tree();
	app_merged.load([
		Q.app.CONFIG_DIR+'/app.json',
		Q.app.LOCAL_DIR+'/app.json',
		Q.app.LOCAL_DIR+'/app.json.php'
	], p.fill('app_merged'));
};

/**
 * Add plugins to Q.plugins namespace
 * @method loadPlugins
 * @param {function} callback
 */
Bootstrap.loadPlugins = function (callback) {
	Q.plugins = {};
	var plugins = Q.Config.get(['Q', 'plugins'], []);
	var len = plugins.length;
	for (var i=0; i<len; ++i) {
		if (plugins[i] === 'Q') {
			continue;
		}
		var pluginName = plugins[i];
		Q.plugins[pluginName] = Q.require(pluginName);
	}
	callback();
};

/**
 * Load handlers available in the platform and plugins
 * @method loadHandlers
 * @param {function} callback
 */
Bootstrap.loadHandlers = function (callback) {
	Q.handlers = {};
	var plugins = Q.Config.get(['Q', 'plugins'], []);
	while (plugins.indexOf('Q') >= 0) {
		plugins.splice(plugins.indexOf('Q'), 1);
	}
	// first load Q handlers
	loadHandlers(Q.HANDLERS_DIR, function() {
		// now load plugins handlers one by one
		loadHandlers(plugins.map(function (a) { 
			return Q.PLUGINS_DIR+'/'+a+'/handlers';
		}), function () {
			// finally load application handlers
			loadHandlers(Q.app.HANDLERS_DIR, callback);
		});
	});
	function loadHandlers(dir, cb) {
		if (typeof dir !== "string") {
			if (dir.length > 0) {
				loadHandlers(dir.shift(), function () {
					loadHandlers(dir, cb);
				});
			} else cb();
		} else {
			Q.dir(dir, function (err, result) {
				// if (err) throw new Error(err);
				if (!result || !result.files) {
					cb();
					return;
				}
				var len = dir.length + 1;
				for (var i = 0; i<result.files.length; ++i) {
					var filename = result.files[i];
					if (filename.substr(-3) !== '.js') {
						continue;
					}
					var parts = filename.substring(len, filename.length-3).split(Q.DS);
					var handler = Q.require(filename);
					var obj = Q.handlers;
					for (var j=0; j<parts.length-1; ++j) {
						if (!obj [parts[j] ] ) {
							obj[ parts[j] ] = {};
						}
						obj = obj[ parts[j] ];
					}
					obj[ parts[parts.length-1] ] = handler;
				}
				cb();
			});
		}
	}
};

module.exports = Bootstrap;