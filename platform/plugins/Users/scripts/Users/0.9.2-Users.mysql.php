<?php

function Users_0_9_2_Users_mysql()
{
	$app = Q::app();
	$communityId = Users::communityId();
	$rows = Users_Session::select('COUNT(1)')
		->fetchAll(PDO::FETCH_NUM);
	$count = $rows[0][0];
	$limit = 100;
	$offset = 0;
	$sessions = Users_Session::select()
		->orderBy('id')
		->limit($limit, $offset)
		->caching(false)
		->fetchDbRows();
	echo "Adding userId to sessions...";
	while ($sessions) {
		foreach ($sessions as $s) {
			$parsed = Q::json_decode($s->content, true);
			if (empty($parsed['Users']['loggedInUser']['id'])) {
				continue;
			}
			$s->userId = $parsed['Users']['loggedInUser']['id'];
		}
		Users_Session::insertManyAndExecute($sessions, array(
			'onDuplicateKeyUpdate' => array(
				'userId' => new Db_Expression("VALUES(userId)")
			)
		));
		$min = min($offset + $limit, $count);
		echo "\033[100D";
		echo "Updated $min of $count sessions";
		$offset += $limit;
		if ($offset > $count) {
			break;
		}
		$sessions = Users_Session::select()
			->orderBy('id')
			->limit($limit, $offset)
			->caching(false)
			->fetchDbRows();
	}
	echo "\n";
}

Users_0_9_2_Users_mysql();