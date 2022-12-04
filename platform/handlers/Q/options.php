<?php

function Q_options($params)
{
	$uri = Q_Dispatcher::uri();
	$module = $uri->module;
	$action = $uri->action;
	if (!Q::canHandle("$module/$action/options")) {

		$origin = Q::ifset($_SERVER, "HTTP_ORIGIN", null);
		$allowed = array('OPTIONS');

		$allow = false;
		if ($origin) {
			$scheme = Q::ifset($_SERVER, "REQUEST_SCHEME", null);
			$host = Q::ifset($_SERVER, "HTTP_HOST", null);
			if ("$scheme://$host" === $origin) {
				$allow = true;
			} else {
				$url = Q_Request::baseUrl();
				$scheme2 = parse_url($url, PHP_URL_SCHEME);
				$host2 = parse_url($url, PHP_URL_HOST);
				if ($_SERVER["HTTP_ORIGIN"] === "$scheme2://$host2") {
					$allow = true;
				}
			}
		}

		if ($allow) {
			$METHODS = array(
				'response' => 'GET', 
				'post' => 'POST', 
				'put' => 'PUT', 
				'delete' => 'DELETE'
			);
			foreach ($METHODS as $m => $M) {
				if (Q::canHandle("$module/$action/$m")) {
					$allowed[] = $M;
				}
			}
		}

		echo <<<EOT

HTTP/1.1 204 No Content
Connection: keep-alive
Access-Control-Allow-Origin: $origin
Access-Control-Allow-Methods: $METHODS
Access-Control-Max-Age: 86400

EOT;
		return true;
	}
	return Q::event("$module/$action/options", $params);
}
