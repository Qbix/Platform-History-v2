<?php

/**
 * Default Q/response handler.
 * 1. Gets some slots, depending on what was requested.
 * 2. Renders them in a layout
 *    The layout expects "title", "dashboard" and "contents" slots to be filled.
 */
function Q_response($params)
{
	$exception = isset($params['exception']) ? $params['exception'] : null;
	$errors = isset($params['errors']) ? $params['errors'] : null;
	if (empty($errors)) {
		$errors = Q_Response::getErrors();
	}

	// If output is set, use that
	$output = Q_Response::output();
	if (isset($output)) {
		if ($output === true) {
			return;
		}
		if (is_string($output)) {
			echo $output;
		}
		return;
	}

	// Redirect to success page, if requested.
	$isAjax = Q_Request::isAjax();
	if (empty($errors) and empty($exception)) {
		if (!$isAjax and null !== Q_Request::special('onSuccess', null)) {
			$onSuccess = Q_Request::special('onSuccess', null);
			if (Q_Config::get('Q', 'response', 'onSuccessShowFrom', true)) {
				$onSuccess = Q_Uri::url($onSuccess.'?Q.fromSuccess='.Q_Dispatcher::uri());
			}
			Q_Response::redirect($onSuccess);
			return;
		}
	}

	// Get the requested module
	$uri = Q_Dispatcher::uri();
	if (!isset($module)) {
		$module = $uri->module;
		if (!isset($module)) {
			$module = 'Q';
			Q_Dispatcher::uri()->module = 'Q';
		}
	}

	Q_Response::processResponseExtras('before');
	Q_Response::processSessionExtras('before');

	$action = $uri->action;
	if (Q::canHandle("$module/$action/response")) {
		if (false === Q::event("$module/$action/response", $_REQUEST)) {
			if ($isAjax !== 'json') {
				return; // response was handled,
			}
		}
	}
	
	$slotNames = Q_Request::slotNames(true);
	$idPrefixes = array();
	if ($temp = Q_Request::special('idPrefixes', null)) {
		foreach (explode(',', $temp) as $i => $prefix) {
			if (!isset($slotNames[$i])) {
				throw new Q_Exception("More id prefixes than slot names", "Q.idPrefixes");
			}
			$idPrefixes[$slotNames[$i]] = $prefix;
		}
	}

	// What to do if this is an AJAX request
	if ($isAjax) {
		$to_encode = array();
		if (Q_Response::$redirected) {
			// We already called Q_Response::redirect from Q/response
			$to_encode['redirect']['url'] = Q_Uri::url(Q_Response::$redirected);
			try {
				$to_encode['redirect']['uri'] = Q_Uri::from(Q_Response::$redirected)->toArray();
			} catch (Exception $e) {
				// couldn't get internal URI
			}
		} else if (is_array($slotNames)) {
			foreach ($slotNames as $slotName) {
				Q_Response::fillSlot($slotName, 'default',
					Q::ifset($idPrefixes, $slotName, null)
				);
			}
			// Go through the slots again, because other handlers may have overwritten
			// their contents using Q_Response::setSlot()
			foreach ($slotNames as $sn) {
				Q_Response::fillSlot($sn, 'default',
					Q::ifset($idPrefixes, $slotName, null)
				);
			}
			if (Q_Request::shouldLoadExtras()) {
				Q_Response::processResponseExtras('after');
				Q_Response::processSessionExtras('after');
				$to_encode['slots'] = Q_Response::slots(true);
				// add stylesheets, stylesinline, scripts, scriptlines, scriptdata, templates
				$temp = Q_Response::htmlCssClassesArray($slotName, true, " ", false);
				if ($temp) $to_encode['htmlCssClasses'] = $temp;
				foreach (Q_Response::allSlotNames() as $slotName) {
					$temp = Q_Response::stylesheetsArray($slotName);
					if ($temp) $to_encode['stylesheets'][$slotName] = $temp;
					$temp = Q_Response::stylesInline($slotName);
					if ($temp) $to_encode['stylesInline'][$slotName] = $temp;
					$temp = Q_Response::scriptsArray($slotName);
					if ($temp) $to_encode['scripts'][$slotName] = $temp;
					$temp = Q_Response::scriptLines($slotName, true, "\n", false);
					if ($temp) $to_encode['scriptLines'][$slotName] = $temp;
					$temp = Q_Response::scriptData($slotName);
					if ($temp) $to_encode['scriptData'][$slotName] = $temp;
					$temp = Q_Response::templateData($slotName);
					if ($temp) $to_encode['templates'][$slotName] = $temp;
					$temp = Q_Response::metasArray($slotName);
					if ($temp) $to_encode['metas'][$slotName] = $temp;
					$to_encode['sessionDataPaths'] =
						!empty(Q_Response::$sessionDataPaths)
						? Q_Response::$sessionDataPaths
						: array();
				}
			} else {
				$to_encode['slots'] = Q_Response::slots(true);
				// add stylesinline, scriptlines, scriptdata, templates
				foreach (array_merge(array(''), $slotNames) as $slotName) {
					$temp = Q_Response::stylesInline($slotName);
					if ($temp) $to_encode['stylesInline'][$slotName] = $temp;
					$temp = Q_Response::scriptData($slotName);
					if ($temp) $to_encode['scriptData'][$slotName] = $temp;
					$temp = Q_Response::scriptLines($slotName, true, "\n", false);
					if ($temp) $to_encode['scriptLines'][$slotName] = $temp;
					$temp = Q_Response::metasArray($slotName);
					if ($temp) $to_encode['metas'][$slotName] = $temp;
				}
			}
		}
		if (Q_Response::$redirected) {
			// We already called Q_Response::redirect
			$to_encode['redirect']['url'] = Q_Uri::url(Q_Response::$redirected);
			try {
				$to_encode['redirect']['uri'] = Q_Uri::from(Q_Response::$redirected)->toArray();
			} catch (Exception $e) {
				// couldn't get internal URI
			}
		}
		$to_encode['timestamp'] = microtime(true);
		$echo = Q_Request::contentToEcho();
		if (isset($echo)) {
			$to_encode['echo'] = $echo;
		}

		$json = Q::json_encode(Q::cutoff($to_encode));
		$callback = Q_Request::callback();
		switch (strtolower($isAjax)) {
		case 'iframe':
			if (!Q_Response::$batch) {
				header("Content-type: text/html");
			}
			echo <<<EOT
<!doctype html><html lang=en>
<head><meta charset=utf-8><title>Q Result</title></head>
<body>
<script type="text/javascript">
window.result = function () { return $json };
</script>
</body>
</html>
EOT;
			break;
		case 'json':
		default:
			if (!Q_Response::$batch) {
				header("Content-type: " . ($callback ? "text/javascript" : "application/json"));
			}
			echo $callback ? "/**/$callback($json)" : $json;
		}
		return;
	}

	// If this is a request for a regular webpage,
	// fill the usual slots and render a layout.

	if (Q_Response::$redirected) {
		return; // If already set a redirect header, simply return -- no reason to output all this HTML
	}

	static $added_Q_init = false;
	
	if (Q_Request::isFrame()) {
		// $headers = headers_list();
		// $setCookieJS = array();
		// foreach ($headers as $header) {
		// 	if (Q::startsWith($header, 'Set-Cookie-JS:')) {
		// 		$headerValue = ltrim(substr($header, 14));
		// 		$setCookieJS[] = $headerValue;
		// 	}
		// }
		// $setCookieJSON = Q::json_encode($setCookieJS, JSON_PRETTY_PRINT);
		$cookieJarId = Q::json_encode('abc');
		Q_Response::setScriptData("Q.info.startServiceWorker", true);
		Q_Response::addScriptLine("
// Start a service worker
Q.ServiceWorker.start($cookieJarId);", null, '@end');	
	}

	if (!$added_Q_init) {
		Q_Response::addScriptLine("
// Now, initialize Q
Q.init();
", null, '@end');
		$added_Q_init = true;
	}

	// Content security policy, if any
	$csp = Q_Config::get('Q', 'web', 'contentSecurityPolicy', array());
	$header = 'Content-Security-Policy: ';
	foreach ($csp as $type => $values) {
		$header .= " $type-src " . implode(' ', $values) . ';';
	}
	$baseUrl = Q_Request::baseUrl();
	$parts = parse_url($baseUrl);
	$header = Q::interpolate($header, $parts);
	header($header);

	// Get all the usual slots for a webpage
	Q_Response::fillSlots($slotNames, $idPrefixes);

	$output = Q_Response::output();
	if (isset($output)) {
		if ($output === true) {
			return;
		}
		if (is_string($output)) {
			echo $output;
		}
		return;
	}

	Q_Response::processResponseExtras('after');
	Q_Response::processSessionExtras('after');

	$slots = Q_Response::slots(false);

	// Render a full HTML layout
	$layout_view = Q_Response::layoutView();
	echo Q::view($layout_view, $slots);
}
