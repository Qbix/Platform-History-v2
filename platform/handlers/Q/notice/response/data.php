<?php

function Q_notice_response_data()
{
	$method = Q_Request::method();
	if ($method !== 'DELETE') {
		throw new Q_Exception_MethodNotSupported($method);
	}
	return Q::$cache['notice_deleted'];
}
