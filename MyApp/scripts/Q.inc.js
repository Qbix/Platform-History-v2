/**
 * For including Qbix in your scripts
 */
 module.exports = function (callback) {

	//
	// Constants -- you might have to change these
	//
	var path = require('path');
	var fs = require('fs');
	var app_dir = path.normalize(__dirname+'/..');

	//
	// Include Q
	//
	var header = "This is a Qbix Node script...\n";

	var paths_filename = app_dir + '/local/paths';
	var paths, json, php;
	if (fs.existsSync(paths_filename+'.json.php')) {
		php = fs.readFileSync(paths_filename+'.json.php', 'utf8');
		json = php.split("\n").slice(1, -1);
		paths = {Q_DIR: JSON.parse(json).platform};
	} else if (fs.existsSync(paths_filename+'.json')) {
		json = fs.readFileSync(paths_filename+'.json', 'utf8');
		paths = {Q_DIR: JSON.parse(json).platform};
	} else if (fs.existsSync(paths_filename+'.js')) {
		// for backward compatibility
		paths = require(paths_filename);
	} else {
		var basename = path.basename(app_dir);
			throw header+"please copy "+basename+"/local.sample to "
				+basename+"/local, and edit local/paths.js";
	}

	var Q = require(paths.Q_DIR+'/classes/Q');
	if (callback) {
		Q.on('init', callback);
	}
	Q.init({DIR: path.dirname(__dirname)});
};
