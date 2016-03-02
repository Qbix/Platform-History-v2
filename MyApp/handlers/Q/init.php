<?php

function Q_init()
{
	if (Q_Config::get('Db', 'logging', true)) {
		// logging database queries
		Q::log("\n-----");
		Q_Config::set('Q', 'handlersAfterEvent', 'Db/query/execute', 'log_shard_query');
		Q_Config::set('Q', 'handlersAfterEvent', 'Db/query/exception', 'log_shard_query');
	}
	
	if (!empty($_SERVER['HTTP_HOST'])) {
		// the following statement causes the session to be opened for every request
		Q_Session::setNonce();
	}
	
	if (Q_Config::get('MyApp', 'testing', false)) {
		// sometimes the APC can cause files to appear missing
		// if they were created after it tried to load them once
		apc_clear_cache('user');
	}
}

function log_shard_query($params)
{
	foreach ($params['queries'] as $shard => $query) {
		if ($query->className === 'Users_Session') {
			continue;
		} 
		$connection = $query->db->connectionName();
		if ($begin = $query->getClause('BEGIN')
		and $query->nestedTransactionCount == 1) {
			Q::log($begin);
		}
		$duration = ceil($query->endedTime - $query->startedTime);
		Q::log("Query $connection on shard \"$shard\":\n$params[sql]\n(duration: $duration ms)\n\n");
		if ($commit = $query->getClause('COMMIT')
		and $query->nestedTransactionCount == 0) {
			Q::log($commit);
		}
		if (!empty($params['exception'])) {
			Q::log("ROLLBACK (due to exception)");
			Q::log("query was: " . $params['sql']);
			Q::log($params['exception']);
		} else if ($rollback = $query->getClause('ROLLBACK')) {
			Q::log($rollback);
		}
	}
}