<?php
	
function Q_urls_response()
{
	if (Q_Request::isAjax() !== 'json') {
		echo '{}';
	}
	return false;
}