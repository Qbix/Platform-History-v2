<?php

function Users_1_0_12_rename_Users_Identify()
{
    echo "Renaming appId in rows: Users_Identify...";
	$rows = Users_Identify::select()->fetchDbRows();
	$c = count($rows);
	$i = 0;
	foreach ($rows as $row) {
		++$i;
		echo "\033[100D";
		echo "Processed $i of $c rows";
        $parts1 = explode("_hashed:", $row->identifier);
        $parts2 = explode("\t", $parts1[0]);
        if (count($parts2) == 1) {
            continue;
        }
        list($platform, $app) = $parts2;
        list($appId, $appInfo) = Users::appInfo($platform, $appId);
        if (isset($appInfo['appIdForAuth'])) {
            $parts1[0] = $platform . '_' . $appInfo['appIdForAuth'];
        }
        $parts1[0] = Q_Utils::normalize($parts1[0]);
        $row->identifier = implode("_hashed:", $parts1);
        try {
            $row->save();
        } catch (Exception $e) {
            // duplicate info, remove the conflict
            $row->remove();
        }
	}
	echo PHP_EOL;
}

function Users_1_0_12_rename_Users_External($from)
{
    $fromString = $from ? 'From' : 'To';
    echo "Renaming appId in Users_External$fromString..." . PHP_EOL;
	$rows = $from
        ? Users_ExternalFrom::select()->fetchDbRows()
        : Users_ExternalTo::select()->fetchDbRows();
	$c = count($rows);
	$i = 0;
	foreach ($rows as $row) {
		++$i;
		echo "\033[100D";
		echo "Processed $i of $c rows";
        list($appId, $appInfo) = Users::appInfo($row->platform, $row->appId);
        if (isset($appInfo['appIdForAuth'])) {
            $row->appId = $appInfo['appIdForAuth'];
            try {
                $row->save();
            } catch (Exception $e) {
                // duplicate info, remove the conflict
                $row->remove();
            }
        }
	}
	echo PHP_EOL;
}

Users_1_0_12_rename_Users_Identify();
Users_1_0_12_rename_Users_External(false);
Users_1_0_12_rename_Users_External(true);