<?php

/**
 * The default implementation.
 */
function Q_errors($params) {
	extract($params);
	/**
	 * @var Exception $exception
	 * @var boolean $startedResponse
	 */

	if (!empty($exception)) {
		Q_Response::addError($exception);
	}
	$errors = Q_Response::getErrors();

	$errors_array = Q_Exception::toArray($errors);

	// Simply return the errors, if this was an AJAX request
	if ($is_ajax = Q_Request::isAjax()) {
		try {
			$errors_json = @Q::json_encode($errors_array);
		} catch (Exception $e) {
			$errors_array = array_slice($errors_array, 0, 1);
			unset($errors_array[0]['trace']);
			$errors_json = @Q::json_encode($errors_array);
		}
		$json = "{\"errors\": $errors_json}";
		$callback = Q_Request::callback();
		switch (strtolower($is_ajax)) {
		case 'iframe':
			if (!Q_Response::$batch) {
				header("Content-type: text/html");
			}
			echo <<<EOT
<!doctype html><html lang=en>
<head><meta charset=utf-8><title>Q Result</title></head>
<body>
<script type="application/javascript">
window.result = function () { return $json };
</script>
</body>
</html>
EOT;
			break;
		case 'json':
		default:
			header("Content-type: " . ($callback ? "application/javascript" : "application/json"));
			echo $callback ? "$callback($json)" : $json;
		}
		return;
	}

	// Forward internally, if it was requested
	if ($onErrors = Q_Request::special('onErrors', null)) {
		$uri1 = Q_Dispatcher::uri();
		$uri2 = Q_Uri::from($onErrors);
		$url2 = $uri2->toUrl();
		if (!isset($uri2)) {
			throw new Q_Exception_WrongValue(array(
				'field' => 'onErrors',
				'range' => 'an internal URI reachable from a URL'
			));
		}
		if ($uri1->toUrl() !== $url2) {
			Q_Dispatcher::forward($uri2);
			return; // we don't really need this, but it's here anyway
		}
	}
	
	$params2 = compact('errors', 'exception', 'errors_array', 'exception_array');
	
	if (Q::eventStack('Q/response')) {
		// Errors happened while rendering response. Just render errors view.
		return Q::view('Q/errors.php', $params2);
	}

	if (!$startedResponse) {
		try {
			// Try rendering the response, expecting it to
			// display the errors along with the rest.
			$ob = new Q_OutputBuffer();
			Q::event('Q/response', $params2);
			$ob->endFlush();
			return;
		} catch (Exception $e) {
			if (get_class($e) === 'Q_Exception_DispatcherForward') {
				throw $e; // if forwarding was requested, do it
				// for all other errors, continue trying other things
			}

			if(is_object($ob)){
				$output = $ob->getClean();
			}
		}
	}
	if ($errors) {
		// Try rendering the app's errors response, if any.
		$app = Q::app();
		if (Q::canHandle("$app/errors/response/content")) {
			Q_Dispatcher::forward("$app/errors");
		} else {
			echo Q::view("Q/errors.php", compact('errors'));
		}
	}
	if (!empty($e)) {
		return Q::event('Q/exception', array('exception' => $e));
	}
}
