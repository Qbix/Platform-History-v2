<?php

function Platform_iframe_response()
{
	if (empty($_POST['html'])) {
		echo "POST field 'html' is empty";
		return false;
	}
	if ($stylesheet = Q::ifset($_POST, 'stylesheet', null)) {
		Q_Response::addStylesheet($stylesheet, '@end');
	}
	$html = $_POST['html'];
	// use a regular layout, add all the scripts for Users and Streams and whatever
	// and then call Q.activate()
	// either that, or change html to a template that is rendered with handlebars in PHP
	Q_Response::addScriptLine('Q.init();', '@end');
	$stylesheets = Q_Response::stylesheets(true, "\n\t");
	$scripts = Q_Response::scripts(true, "\n\t");
	$templates = Q_Response::templates(true, "\n\t");
	$scriptLines = Q_Response::scriptLines(true);
	echo <<<EOT
<!doctype html>
<html>
    <head>
        <title>Qbix Platform</title>
		$stylesheets
		$scripts
		<style>
		html { height: 100%; }
		body { height: 100%; }
		</style>
    </head>
    <body>
		<div id="Platform_parsed_html">
			$html
		</div>
		$scriptLines
    </body>
</html>
EOT;
	return false;
}