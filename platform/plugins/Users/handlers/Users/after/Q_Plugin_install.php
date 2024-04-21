<?php

function Users_after_Q_Plugin_install($params)
{
	$plugin_name = $params['plugin_name'];

	echo "$plugin_name: inserting labels for users...";

	// get label need to install
	$labelsToInstall = Q_Config::get('Users', 'onInsert', 'labels', array());
    $rolesToInstall = Q_Config::get('Users', 'onInsert', 'roles', array());

	// get labels already installed
    $extra = Q_Plugin::extra('Users', 'plugin', 'Users');
    $key = "Users/onInsert/labels";
    $labelsInstalled = $extra[$key] = Q::ifset($extra, $key, array());
	$labelsNeedToInstall = array_values(array_diff($labelsToInstall, $labelsInstalled));
    $key = "Users/onInsert/roles";
    $rolesInstalled = $extra[$key] = Q::ifset($extra, $key, array());
	$rolesNeedToInstall = array_values(array_diff($rolesToInstall, $rolesInstalled));

	// if all roles and labels already inserted - exit
	if (!$labelsNeedToInstall && !$rolesNeedToInstall) {
		echo "  already inserted".PHP_EOL;
		return;
	}

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
            if (Users::isCommunityId($user->id)) {
                Users_Label::addLabel($rolesNeedToInstall, $user->id, null, null, $user->id);
            } else {
                Users_Label::addLabel($labelsNeedToInstall, $user->id, null, null, $user->id);
            }
			echo "\033[100D";
			echo "$plugin_name: processed labels for ".($j + $offset + 1)." of $c users"
				. str_repeat(' ', 20);
			if (is_callable('gc_collect_cycles')) {
				gc_collect_cycles();
			}
		}
		$offset += $batch;
	}
    echo PHP_EOL;

	// if new labels or roles installed
	if ($rolesToInstall or $labelsToInstall) {
		// save installed streams to table [plugin_name]_q_plugin extra field
	    $extra = Q_Plugin::extra('Users', 'plugin', 'Users');
        $key = "Users/onInsert/labels";
	    $extra[$key] = Q::ifset($extra, $key, array());
	    $extra[$key] = array_values(array_unique(array_merge($extra[$key], $labelsToInstall)));
        $key = "Users/onInsert/roles";
	    $extra[$key] = Q::ifset($extra, $key, array());
	    $extra[$key] = array_values(array_unique(array_merge($extra[$key], $rolesToInstall)));
	    return Q_Plugin::extra('Users', 'plugin', 'Users', @compact('extra'));
	}


    








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
	    $extra = Q_Plugin::extra('Streams', 'plugin', 'Streams');
	    $extra[$key] = isset($extra[$key]) && is_array($extra[$key]) ? $extra[$key] : array();
	    $extra[$key] = array_values(array_unique(array_merge($extra[$key], $streamsToInstall)));
	    return Q_Plugin::extra('Streams', 'plugin', 'Streams', @compact('extra'));
	}










    echo "Adding labels for users...";
	$users = Users_User::select()->fetchDbRows();
	$c = count($users);
	$i = 0;
	$labels = Q_Config::get('Users', 'onInsert', 'labels', array());
	foreach ($users as $user) {
		// skip labels for community
		if (Users::isCommunityId($user->id)) {
			continue;
		}

		Users_Label::addLabel($labels, $user->id, null, null, $user->id);
		++$i;
		echo "\033[100D";
		echo "Added labels for $i of $c users";
	}
	echo "\n";
}