<?php

function MyApp_before_Q_responseExtras()
{
	Q_Response::addHtmlCssClass('Q_hideUntilLoaded Q_dialogs_animationFX Q_columns_animationFX');
	Q_Response::addStylesheet('css/MyApp.css', '@end');
	Q_Response::addScript('js/MyApp.js', 'MyApp');
	if (Q_Request::isIE()) {
		header("X-UA-Compatible", "IE=edge");
	}
	header('Vary: User-Agent');
	Q_Response::addStylesheet('https://fonts.googleapis.com/css?family=Open+Sans:400italic,400,300,700', 'MyApp');
}
