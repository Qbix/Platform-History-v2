/**
 * @module Q
 */
/**
 * Extra process for shards split
 * @namespace Q.Utils
 * @class Split
 * @static
 */
var Q = require('Q');

Q.on('init', function () {
	var Db_Mysql = Q.require('Db/Mysql');
	var Utils = Q.require('Q/Utils');
	try {
		var _class = process.argv[3];
		var _connection = process.argv[4];
		var _dbTable = process.argv[5];
		var _shard = process.argv[6];
		var _part = process.argv[7];
		var _parts = JSON.parse(process.argv[8]);
		var _where = process.argv[9];
		var _rowClass = Q.require(_class.split('_').join('/')); // shall be fine as tested by parent process
	} catch (err) {
		process.send({type: 'log', content: ["Wrong arguments supplied to child process.", err.message]});
		process.exit(99);
	}

	var read = 0;
	// now read original table and save to new shards
	(new Db_Mysql(_connection)).reallyConnect(function(client) {
		client.query("SELECT COUNT(*) AS count FROM "+_dbTable+" WHERE "+_where, function (err, res) {
			if (err) {
				process.send({type: 'log', content: ["Could not count records in '%s'.", _dbTable, err.message]});
				client.destroy();
				process.exit(99);
			}
			// load all data from the old table, pass it trough new partition and save to new shards
			process.send({type: 'start', count: res[0].count, timestamp: (new Date()).getTime()});
			client.query("SELECT * FROM "+_dbTable+" WHERE "+_where)
				// when query has no callback only event is emmited on error
				.on('error', function (err) {
					if (err) {
						process.send({type: 'log', content: ["Error processing table '%s'.", _dbTable, err.message]});
						client.destroy();
						process.exit(99);
					}
				}) // on 'error'
				.on('row', function (row) {
					read++;
					var shards = Object.keys((new _rowClass(row)).retrieve('*', true, true).shard(_parts));
					if (shards.length !== 1) {
						process.send({type: 'log', content: ["Could not determine unique shard to save row.\nfound shard(s)\n'%j'\nfor row\n%j", shards, row]});
						client.destroy();
						process.exit(99);
					}
					process.send({type: 'row', shard: shards[0], row: row});
				}) // on 'row'
				.on('end', function () {
					process.send({type: 'stop', count: read});
					client.end(function (err) {
						if (err) process.send({type: 'log', content: ["Error closing database connection.", err.message]});
						process.exit(0);
					});
				}); // on 'end'
		});
	}, _shard); // reallyConnect
});

Q.init({DIR: process.argv[2]}, "Child process to split data to new shards forked");
