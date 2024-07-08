<?php

function Q_post($params)
{
	$uri = Q_Dispatcher::uri();
	$module = $uri->module;
	$action = $uri->action;
	if (!Q::canHandle("$module/$action/post")) {
		throw new Q_Exception_MethodNotSupported(array('method' => 'POST'));
	}
	if (isset($_SERVER['CONTENT_LENGTH'])) {
		$contentLength = (int)$_SERVER['CONTENT_LENGTH'];
		foreach (array('upload_max_filesize', 'post_max_size') as $name) {
			$value = ini_get($name);
			$v = intval($value);
			switch (substr($value, -1)) {
				case 'K': $v *= 1024; break;
				case 'M': $v *= 1024*1024; break;
				case 'B': $v *= 1024*1024*1024; break;
			}
			if ($contentLength > $v) {
				throw new Q_Exception_ContentLength(array('contentLength' => $contentLength, 'exceeds' => $name));
			}
		}
	}
	if (!Q_Session::$nonceWasSet) {
		// only if we didn't set a new nonce (e.g. for a new session)
		Q_Request::requireValidNonce();
	}
	return Q::event("$module/$action/post", $params);
}
