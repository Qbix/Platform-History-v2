<?php

class Users_Device_Firefox extends Users_Device
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
		$notification = [
			'title' => $notification['alert']['title'],
			'body' => $notification['alert']['body'],
			'icon' => empty($notification['badge']) ? '' : $notification['badge'],
			'click_action' => empty($notification['payload']['click_action']) ? '/' : $notification['payload']['click_action']
		];
		self::$push[] = $notification;
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

		$app = Q_Config::expect('Q', 'app');
		$apiKey = Q_Config::expect('Users', 'apps', 'chrome', $app, "server", "key");

		foreach (self::$push as $notification) {
			$fields = array
			(
				'to'		=> self::$deviceId,
				'notification'	=> $notification
			);
			$headers = array
			(
				'Authorization: key=' . $apiKey,
				'Content-Type: application/json'
			);

			# Send Reponse To FireBase Server
			$ch = curl_init();
			curl_setopt( $ch,CURLOPT_URL, 'https://fcm.googleapis.com/fcm/send' );
			curl_setopt( $ch,CURLOPT_POST, true );
			curl_setopt( $ch,CURLOPT_HTTPHEADER, $headers );
			curl_setopt( $ch,CURLOPT_RETURNTRANSFER, true );
			curl_setopt( $ch,CURLOPT_SSL_VERIFYPEER, false );
			curl_setopt( $ch,CURLOPT_POSTFIELDS, json_encode( $fields ) );
			$result = curl_exec($ch );
			curl_close( $ch );
		}

	}

	static protected $push = [];

	static $deviceId = null;

}