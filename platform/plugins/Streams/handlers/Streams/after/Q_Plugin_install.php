<?php

function Streams_after_Q_Plugin_install($params)
{
	$plugin_name = $params['plugin_name'];
	$result = Users_User::select('COUNT(1)')
		->fetchAll(PDO::FETCH_NUM);
	$c = $result[0][0];

	echo "$plugin_name: inserting streams for users...";

	// get stream names need to install
	$onInsert = Q_Config::get('Streams', 'onInsert', array());
	$streamsToInstall = array_merge(
		Q::ifset($onInsert, 'user', array()),
		Q::ifset($onInsert, 'person', array()),
		Q::ifset($onInsert, 'community', array())
	);
	// get stream names already installed
    $key = "Streams/User/onInsert";
    $extra = Q_Plugin::extra('Streams', 'plugin', 'Streams');
    $extra[$key] = Q::ifset($extra, $key, array());
    $streamsInstalled = $extra[$key];

	$streamsNeedToInstall = array();
	foreach ($streamsToInstall as $streamToInstall) {
		if (!in_array($streamToInstall, $streamsInstalled)) {
			$streamsNeedToInstall[] = $streamToInstall;
		}
	}

	// if all streams already inserted - exit
	if (!count($streamsNeedToInstall)) {
		echo "  already inserted".PHP_EOL;
		return;
	}

	echo "\n  " . implode("\n  ", $streamsNeedToInstall) . "\n";
	
	echo PHP_EOL;

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
		foreach ($users as $j => $user) {
			$simulated = array(
				'row' => $user,
				'inserted' => true,
				'modifiedFields' => $user->fields,
				'query' => null
			);
			$user->set('Streams', 'skipExistingOnInsert', true);
			Q::event('Db/Row/Users_User/saveExecute', $simulated, 'after');
			echo "\033[100D";
			echo "$plugin_name: processed streams for ".($j + $offset + 1)." of $c users"
				. str_repeat(' ', 20);
			gc_collect_cycles();
		}
		$offset += $batch;
	}
	
	echo PHP_EOL;

	// if new streams installed
	if (count($streamsToInstall)) {
		// save installed streams to table [plugin_name]_q_plugin extra field
	    $key = "Streams/User/onInsert";
	    $extra = Q_Plugin::extra('Streams', 'plugin', 'Streams');
	    $extra[$key] = is_array($extra[$key]) ? $extra[$key] : array();
	    $extra[$key] = array_values(array_unique(array_merge($extra[$key], $streamsToInstall)));
	    return Q_Plugin::extra('Streams', 'plugin', 'Streams', @compact('extra'));
	}
}