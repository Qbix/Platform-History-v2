<?php

require Q_DIR.'/../vendor/autoload.php';

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

	static function send($subscription_string, $notifications)
	{
		$auth = array(
			'VAPID' => array(
				'subject' => 'mailto:me@website.com', // can be a mailto: or your website address
				'publicKey' => Q_Config::expect('Users', 'apps', 'chrome', Q_Config::expect('Q', 'app'), "publicKey"),
				'privateKey' => Q_Config::expect('Users', 'apps', 'chrome', Q_Config::expect('Q', 'app'), "privateKey")
			),
		);
		$subscription = json_decode($subscription_string);
		$webPush = new WebPush($auth);
		// send multiple notifications with payload
		foreach ($notifications as $notification) {
			$webPush->sendNotification(
				$subscription->endpoint,
				json_encode($notification), // payload
				$subscription->keys->p256dh,
				$subscription->keys->auth);
		}
		$webPush->flush();
	}

}