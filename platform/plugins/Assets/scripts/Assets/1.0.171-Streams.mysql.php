<?php
$rows = Assets_Customer::select()->where(['payments' => 'stripe'])->fetchDbRows();
foreach ($rows as $row) {
	if (empty($row->hash)) {
		$row->hash = Assets_Customer::getHash();
		$row->save();
	}
}