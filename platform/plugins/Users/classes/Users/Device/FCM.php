<?php

class Users_Device_FCM
{

	static function prepareForWeb($deviceId, $notification)
	{
		return array(
			'to' => $deviceId,
			'notification' => array(
				'title' => $notification['alert']['title'],
				'body' => $notification['alert']['body'],
				'icon' => empty($notification['icon']) ? '' : $notification['icon'],
				'click_action' => empty($notification['url']) ? null : $notification['url'],
				'sound' => empty($notification['sound']) ? 'default' : $notification['sound']
			)
		);
	}

	static function prepareForAndroid($deviceId, $notification)
	{
		return array(
			'to' => $deviceId,
			'notification' => array(
				'title' => $notification['alert']['title'],
				'body' => $notification['alert']['body'],
				'icon' => empty($notification['icon']) ? '' : $notification['icon'],
				'click_action' => empty($notification['url']) ? null : $notification['url'],
				'sound' => empty($notification['sound']) ? 'default' : $notification['sound']
			),
			'data' => array(
				'badge' => $notification['badge']
			)
		);
	}

	static function send($apiKey, $notification)
	{
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
		curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($notification));
		$result = curl_exec($ch);
		curl_close($ch);
		return $result;
	}

}