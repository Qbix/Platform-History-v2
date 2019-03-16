<?php

function Streams_after_Q_Plugin_install($params)
{
	$plugin_name = $params['plugin_name'];
	$result = Users_User::select('COUNT(1)')
		->fetchAll(PDO::FETCH_NUM);
	$c = $result[0][0];

	echo "$plugin_name: inserting streams for users...";

	// get stream names need to install
	$streamsToInstall = Q_Config::get('Streams', 'onInsert', 'Users_User', array());
	// get stream names already installed
	$streamsInstalled = Q_Plugin::getUsersStreams();

	$streamsNeedToInstall = array();
	foreach ($streamsToInstall as $streamToInstall) {
		if (!in_array($streamToInstall, $streamsInstalled)) {
			$streamsNeedToInstall[] = $streamToInstall;
		}
	}

	// if all streams already inserted - exit
	if (!count($streamsNeedToInstall)) {
		echo " already inserted".PHP_EOL;
		return;
	}
	
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
		$offset += $batch;
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
			echo "$plugin_name: processed streams for ".($j + 1)." of $c users                          ";
		}
	}

	// if new streams installed
	if (count($streamsToInstall)) {
		// save installed streams to table [plugin_name]_q_plugin extra field
		Q_Plugin::setUsersStreams($streamsToInstall);
	}

	echo PHP_EOL;
}
