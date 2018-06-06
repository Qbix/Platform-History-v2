<?php

function Streams_after_Q_Plugin_install($params)
{
	$plugin_name = $params['plugin_name'];
	$result = Users_User::select('COUNT(1)')
		->fetchAll(PDO::FETCH_NUM);
	$c = $result[0][0];
	echo "$plugin_name inserting streams for users...";
	$offset = 0;
	$batch = 1000;
	for ($i=1; true; ++$i) {
		$users = Users_User::select()
			->orderBy('id')
			->limit($batch, $offset)
			->fetchDbRows();
		if (!$users) {
			break;
		}
		$offset += $batch;
		foreach ($users as $user) {
			$simulated = array(
				'row' => $user,
				'inserted' => true,
				'modifiedFields' => $user->fields,
				'query' => null
			);
			$user->set('Streams', 'skipExistingOnInsert', true);
			Q::event('Db/Row/Users_User/saveExecute', $simulated, 'after');
			echo "\033[100D";
			echo "$plugin_name processed streams for $i of $c users                          ";
		}
	}
	echo PHP_EOL;
}
