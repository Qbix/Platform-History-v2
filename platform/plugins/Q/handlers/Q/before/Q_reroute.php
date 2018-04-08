<?php

function Q_before_Q_reroute()
{
	if ($appId = Q_Request::appId()) {
		Q_Response::setCookie('Q_appId', $appId);
	}
	if ($udid = Q_Request::udid()) {
		Q_Response::setCookie('Q_udid', $udid);
	}
}