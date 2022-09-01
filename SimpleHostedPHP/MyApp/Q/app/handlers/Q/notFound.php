<?php

/**
 * Override Q/notFound handler.
 * just goes on to render our app's response,
 * which will echo a 404 view.
 */
function Q_notFound($params)
{
	$app = Q::app();
	$uri = Q_Dispatcher::uri();
	$module = Q::ifset($uri, 'module', $app);
	if ($module !== $app) {
		$module = $app;
	}
	Q_Dispatcher::forward("$module/notFound");
}
