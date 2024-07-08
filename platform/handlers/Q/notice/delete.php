<?php

function Q_notice_delete()
{
	if (!isset($_REQUEST['key'])) {
		throw new Q_Exception_RequiredField(array('field' => 'key'), 'key');
	}

	Q_Response::removeNotice($_REQUEST['key']);
}
