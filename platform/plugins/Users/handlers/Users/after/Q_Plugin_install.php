<?php

function Users_after_Q_Plugin_install($params)
{
	$plugin_name = $params['plugin_name'];

	echo "$plugin_name: inserting labels for users...";

	// get label need to install
	$labelsToInstall = Q_Config::get('Users', 'onInsert', 'labels', array());
    $rolesToInstall = Q_Config::get('Users', 'onInsert', 'roles', array());
	
	// for backwards compatibility
	if (Q::isAssociative($labelsToInstall)) {
		$arr = array();
		foreach ($labelsToInstall as $k => $v) {
			if (is_integer($k)) {
				$arr[] = $v;
			} else {
				$arr[] = $k;
			}
		}
		$labelsToInstall = $arr;
	}
	if (Q::isAssociative($rolesToInstall)) {
		$arr = array();
		foreach ($rolesToInstall as $k => $v) {
			if (is_integer($k)) {
				$arr[] = $v;
			} else {
				$arr[] = $k;
			}
		}
		$rolesToInstall = $arr;
	}

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
                Users_Label::addLabel($rolesNeedToInstall, $user->id, null, null, $user->id, false, true);
            } else {
                Users_Label::addLabel($labelsNeedToInstall, $user->id, null, null, $user->id, false, true);
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
}