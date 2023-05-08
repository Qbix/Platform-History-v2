var http = require('http');
require('../Q.inc')(function(Q) {
	
	Q.plugins.Users.listen();
	Q.plugins.Streams.listen();
	Q.plugins.Media.WebRTC.listen();
	
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

});