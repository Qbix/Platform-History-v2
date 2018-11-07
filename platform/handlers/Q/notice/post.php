<?php

function Q_notice_post()
{
	if (!isset($_REQUEST['key'])) {
		throw new Q_Exception_RequiredField(array('field' => 'key'), 'key');
	}

	Q_Response::setNotice($_REQUEST['key'], $_REQUEST['content'], $_REQUEST['options']);
}
