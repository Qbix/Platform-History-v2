<?php

class Users_Device_Android extends Users_Device
{

	/**
	 * You can use this method to send push notifications.
	 * It is far better, however, to use the Qbix Platform's offline notification
	 * mechanisms using Node.js instead of PHP. That way, you can be sure of re-using
	 * the same persistent connection.
	 * @method pushNotification
	 * @param {array} $notification See Users_Device->pushNotification parameters
	 * @param {array} [$options] See Users_Device->pushNotification parameters
	 */
	function handlePushNotification($notification, $options = array())
	{
		self::$push[] = array(
			'title' => $notification['alert']['title'],
			'body' => $notification['alert']['body'],
			'icon' => empty($notification['icon']) ? '' : $notification['icon'],
			'click_action' => empty($notification['url']) ? null : $notification['url'],
			'sound' => empty($notification['sound']) ? 'default' : $notification['sound']
		);
	}

	/**
	 * Sends all scheduled push notifications
	 * @method sendPushNotifications
	 * @static
	 * @throws Users_Exception_DeviceNotification
	 */
	static function sendPushNotifications()
	{
		if (!self::$push) {
			return;
		}
		$apiKey = Q_Config::expect('Users', 'apps', 'android', Q::app(), "key");
		foreach (self::$push as $notification) {
			$fields = array(
				'to' => self::$device->deviceId,
				'notification' => $notification
			);
			$headers = array(
				'Authorization: key=' . $apiKey,
				'Content-Type: application/json'
			);
			$ch = curl_init();
			curl_setopt($ch, CURLOPT_URL, 'https://fcm.googleapis.com/fcm/send');
			curl_setopt($ch, CURLOPT_POST, true);
			curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
			curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
			curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fields));
			$result = curl_exec($ch);
			curl_close($ch);
		}
		self::$push = [];
	}

	static protected $push = [];

	static $device = null;

}