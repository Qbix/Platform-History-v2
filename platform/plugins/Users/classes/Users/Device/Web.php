<?php

require USERS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

use Minishlink\WebPush\WebPush;

class Users_Device_Web
{

	static function prepare($notification)
	{
		return array(
			'title' => $notification['alert']['title'],
			'body' => $notification['alert']['body'],
			'icon' => empty($notification['icon']) ? '' : $notification['icon'],
			'click_action' => empty($notification['url']) ? null : $notification['url'],
			'sound' => empty($notification['sound']) ? 'default' : $notification['sound']
		);
	}

	static function send($device, $notifications)
	{
		$appConfig = Q_Config::expect('Users', 'apps', 'chrome', Q::app());
		$auth = array(
			'VAPID' => array(
				'subject' => $appConfig["url"],
				'publicKey' => $appConfig["publicKey"],
				'privateKey' => $appConfig["privateKey"]
			),
		);
		$webPush = new WebPush($auth);
		// send multiple notifications with payload
		foreach ($notifications as $notification) {
			$webPush->sendNotification(
				$device->fields['deviceId'],
				json_encode($notification), // payload
				$device->fields['p256dh'],
				$device->fields['auth']
			);
		}
		$webPush->flush();
	}

}