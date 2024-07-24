<?php

/**
 * This is the default handler for the Q/responseExtras event.
 * It should not send session data like the nonce, which prevents CSRF
 * attacks. For that, see the Q/sessionExtras handler.
 */
function Q_before_Q_initialExtras()
{
	$app = Q::app();
	$base_url = Q_Request::baseUrl();
	$cache_base_url = Q_Config::get('Q', 'response', 'cacheBaseUrl', null);
	$ajax = Q_Request::isAjax();
	$languages = Q_Request::languages();
	$info = array(
		'languages' => $languages
	);
	if (!$ajax) {
		$text = Q::take(Q_Config::get('Q', 'text', array()), array('useLocale'));
		$info = array_merge(
			array('app' => Q::app()),
			$info,
			array(
				'proxies' => Q_Config::get('Q', 'proxies', array()),
				'baseUrl' => $base_url,
				'proxyBaseUrl' => Q_Uri::url($base_url),
				'cacheBaseUrl' => Q_Uri::url($cache_base_url),
				'text' => $text,
				'sessionName' => Q_Session::name(),
				'sessionIdPrefixes' => Q_Config::get('Q', 'session', 'id', 'prefixes', array()),
				'nodeUrl' => Q_Utils::nodeUrl(),
				'socketPath' => Q_Utils::socketPath(),
				'maxUploadSize' => Q_Utils::maxUploadSize(),
				'slotNames' => Q_Config::get("Q", "response", "slotNames", array(
					'content', 'dashboard', 'title', 'notices'
				)),
				'timestamp' => time()
			)
		);
	}
	foreach ($info as $k => $v) {
		Q_Response::setScriptData("Q.info.$k", $v);
	}
    $uris = Q_Config::get('Q', 'javascript', 'uris', array());
    $urls = array();
    foreach ($uris as $u) {
        $urls["$u"] = Q_Uri::url("$u");
    }
    Q_Response::setScriptData('Q.urls', $urls);

	Q_Response::setScriptData('Q.allSlotNames', Q_Response::allSlotNames());
	
	// Attach stylesheets and scripts
	foreach (Q_Config::get('Q', 'javascript', 'initialExtras', array()) as $key => $extras) {
        foreach ($extras as $src => $b) {
		    if (!$b) {
                continue;
            }
		    Q_Response::addScript($src, $key);
        }
	}
	foreach (Q_Config::get('Q', 'stylesheets', 'initialExtras', array()) as $key => $extras) {
        foreach ($extras as $src => $media) {
            if (!$media) {
                continue;
            }
            if ($media === true) {
                $media = 'screen,print';
            }
            Q_Response::addStylesheet($src, $key, compact('media'));
        }
	}
	
	// Language and texts
	Q_Response::setMeta(array(
		'name' => 'http-equiv',
		'value' => 'Content-Language',
		'content' => Q_Text::basename()
	));
	Q_Response::setScriptData('Q.info.text', Q_Config::get('Q', 'text', array()));
	
	if (!Q_Request::special('sb') and (
		Q_Config::get('Q', 'web', 'statusBarOverlapped')
		or Q_Request::isCordova()
	)) {
		Q_Response::addHtmlCssClass('Q_statusBarOverlapped');
	}
	if (!Q_Request::isMobile()
	and Q_Config::get('Q', 'response', 'layout', 'sidebar', false)) {
		Q_Response::addHtmlCssClass('Q_layout_sidebar');
	} else {
		Q_Response::addHtmlCssClass('Q_layout_widebar');
	}
	Q_Response::setScriptData('Q.info.isTouchscreen', Q_Request::isTouchscreen());
	Q_Response::setScriptData('Q.info.isMobile', Q_Request::isMobile());
	Q_Response::setScriptData('Q.info.isTablet', Q_Request::isTablet());

	Q_Response::setScriptData('Q.info.layout', Q_Config::get('Q', 'response', 'layout', array()));
	
	// We may want to set the initial URL and updateTimestamp cookie
	$lazyload = Q_Config::get('Q', 'images', 'lazyload', false);
	$environment = Q_Config::get('Q', 'environment', '');
	$config = Q_Config::get('Q', 'environments', $environment, 'urls', array());
	$config['updateBeforeInit'] = (!empty($config['integrity']) or !empty($config['caching']));
	Q_Response::setScriptData('Q.info.urls', $config);
	Q_Response::setScriptData('Q.info.cookies', array('Q_cordova', 'Q_nonce', 'Q_dpr'));
	Q_Response::setScriptData('Q.images.lazyload', $lazyload);

	$providers = Q_Config::get("Q", "video", "cloud", "upload", "providers", array());
	Q_Response::setScriptData('Q.videos.provider', $providers[0]);

	$converters = array_keys(Q_Config::get("Q", "video", "cloud", "convert", array()));
	Q_Response::setScriptData('Q.videos.converters', $converters);
	Q_Response::setScriptData('Q.videos.converter', $converters[0]);

	// pass videos data to client
	$videoConfig = Q_Config::get("Q", "video", "cloudUpload", array());
	foreach ($videoConfig as $provider => $data) {
		if (!empty($data['url'])) {
			Q_Response::setScriptData('Q.video.cloudUpload.'.$provider.'.url', $data["url"]);
		}
	}
}
