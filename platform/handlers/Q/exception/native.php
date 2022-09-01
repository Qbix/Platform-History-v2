<?php

function Q_exception_native($params)
{
	extract($params);
	/**
	 * @var Exception $exception
	 */
	if (Q::textMode()) {
		echo Q_Exception::coloredString($exception);
		exit;
	}
	if ($is_ajax = Q_Request::isAjax()) {
		$json = @Q::json_encode(array(
			'errors' => Q_Exception::buildArray(array($exception))
		));
		$callback = Q_Request::callback();
		switch (strtolower($is_ajax)) {
		case 'iframe': // Render an HTML layout for ajax
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
		case 'json': // Render a JSON layout for ajax
		default:
			header("Content-type: " . ($callback ? "application/javascript" : "application/json"));
			echo $callback ? "$callback($json)" : $json;
		}
	} else {
		$message = $exception->getMessage();
		$file = $exception->getFile();
		$line = $exception->getLine();
		if (is_callable(array($exception, 'getTraceAsStringEx'))) {
			$trace_string = $exception->getTraceAsStringEx();
		} else {
			$trace_string = $exception->getTraceAsString();
		}
		if (($exception instanceof Q_Exception_PHPError)
		or !empty($exception->messageIsHtml)) {
			// do not sanitize $message
		} else {
			$message = Q_Html::text($message);
		}
		$content = "<h1 class='exception_message'>$message</h1>";
		if (Q_Config::get('Q', 'exception', 'showFileAndLine', true)) {
			$content .= "<h3 class='exception_fileAndLine'>in $file ($line)</h3>";
		}
		if (Q_Config::get('Q', 'exception', 'showTrace', true)) {
			$content .= "<pre class='exception_trace'>$trace_string</pre>";
		}
		$content .= str_repeat(' ', 512); // because of chrome
		$title = "Exception occurred";
		$dashboard = "";
		echo Q::view('Q/layout/html.php', @compact('content', 'dashboard', 'title'));
	}
	$app = Q_Config::get('Q', 'app', null);
	$colored = Q_Exception::coloredString($exception);
	Q::log(
		"$app: Exception in " . ceil(Q::milliseconds()) . "ms:\n\n$colored\n",
		null, true, array('maxLength' => 10000)
	);
}
