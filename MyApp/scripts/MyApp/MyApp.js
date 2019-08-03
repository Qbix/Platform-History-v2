var http = require('http');
require('../Q.inc')(function(Q) {
	
	Q.plugins.Users.listen();
	Q.plugins.Streams.listen();
	
	// TODO: Make some classes in classes/MyApp and then require() them

	var Db = require('Db');
	Db.on('query', function (query, sql, client) {
		if (query.clauses.BEGIN) {
			Q.log('BEGIN', 'sql');
		}
		Q.log(sql, 'sql');
		if (query.clauses.COMMIT) {
			Q.log('COMMIT', 'sql');
		}
		if (query.clauses.ROLLBACK) {
			Q.log('ROLLBACK', 'sql');
		}
	});

	var port = Q.Config.get(['Streams', 'webrtc', 'socketServerPort'], false);
	var https = Q.Config.get(['Q', 'node', 'https'], false);
	require(Q.pluginInfo.Streams.SCRIPTS_DIR + '/Streams/webrtc/server.js')(port, https);
});