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
	var header = "This is a Node On Qbix project...\n";

	var paths_filename = app_dir + '/local/paths';
	fs.exists(paths_filename+'.js', function (exists) {
		if (!exists) {
			var basename = path.basename(app_dir);
			throw header+"please copy "+basename+"/local.sample to "
				+basename+"/local, and edit local/paths.js";
		}
		var paths = require(paths_filename);
		var Q = require(paths.Q_DIR+'/classes/Q');
		if (callback) {
			Q.on('init', callback);
		}
		Q.init({DIR: path.dirname(__dirname)});
	});

};