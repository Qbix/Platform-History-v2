<?php

require USERS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

use Minishlink\WebPush\WebPush;

class Users_Device_Web
{

	static function prepare($notification)
	{
		// lead to common standard
		if (is_string($notification['alert'])) {
			$notification['alert'] = array(
				'title' => Users::communityName(),
				'body' => $notification['alert']
			);
		}

		return array(
			'title' => Q::ifset($notification, 'alert', 'title', null),
			'body' => Q::ifset($notification, 'alert', 'body', null),
			'icon' => Q::ifset($notification, 'icon', ''),
			'click_action' => Q::ifset($notification, 'url', null),
			'sound' => Q::ifset($notification, 'sound', 'default')
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