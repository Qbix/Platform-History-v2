<?php

function MyApp_after_Q_configure()
{
	if (Q_Config::get('Db', 'logging', true)) {
		// logging database queries
		Q::log(PHP_EOL."-----");
		Q_Config::set(
			'Q', 'handlersAfterEvent', 'Db/query/execute',
			array('MyApp_log_shard_query'));
		Q_Config::set(
			'Q', 'handlersAfterEvent', 'Db/query/exception',
			array('MyApp_log_shard_query')
		);
	}
}

function MyApp_log_shard_query($params)
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
		Q::log("Query $connection on shard \"$shard\":\n$params[sql]\n(duration: $duration ms)\n\n", null, array('maxLength' => 10000));
		if ($commit = $query->getClause('COMMIT')
		and $query->nestedTransactionCount == 0) {
			Q::log($commit);
		}
		if (!empty($params['exception'])) {
			Q::log("ROLLBACK (due to exception)");
			Q::log("query was: " . $params['sql']);
			Q::log($params['exception'], null, true, array(
				'maxLength' => 2000
			));
		} else if ($rollback = $query->getClause('ROLLBACK')) {
			Q::log($rollback);
		}
	}
}
