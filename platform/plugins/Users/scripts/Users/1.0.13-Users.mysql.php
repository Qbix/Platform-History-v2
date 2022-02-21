<?php

function Users_1_0_13_rename_Users_Identify()
{
    echo "Renaming identifier in rows: Users_Identify..." . PHP_EOL;
	$rows = Users_Identify::select()->fetchDbRows();
	$c = count($rows);
	$i = 0;
	foreach ($rows as $row) {
		++$i;
		echo "\033[100D";
		echo "Processed $i of $c rows";
        $row->identifier = str_replace("\t", "_", $row->identifier);
        try {
            $row->save();
        } catch (Exception $e) {
            // duplicate info, remove the conflict
            $row->remove();
        }
	}
	echo PHP_EOL;
}

Users_1_0_13_rename_Users_Identify();