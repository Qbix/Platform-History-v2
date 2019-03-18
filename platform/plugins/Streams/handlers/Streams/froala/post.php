<?php

function Streams_froala_post($params = array())
{
	$params = array_merge($_REQUEST, $params);
	try {
		$p = $params;
		if (empty($p['icon'])) {
			$p['icon'] = array();
		}
		if (!empty($p['image'])) {
			$p['icon']['data'] = $p['image'];
		}
		$p['icon']['save'] = array('x' => 'x.png');
		Q::event('Streams/stream/post', $p);
		Q_Response::output(json_encode(array(
			'link' => Streams::$cache['stream']->iconUrl('x.png')
		)));
	} catch (Exception $e) {
		Q_Response::output(json_encode(array(
			'error' => $e->getMessage()
		)));
	}
}