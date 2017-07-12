<?php

class Users_Device_FCM
{

	static function prepareForWeb($notification)
	{
		// Web (JavaScript) — keys for notification messages
		// https://firebase.google.com/docs/cloud-messaging/http-server-ref
		return [
			'title' => $notification['alert']['title'],
			'body' => $notification['alert']['body'],
			'icon' => empty($notification['badge']) ? '' : $notification['badge'],
			'click_action' => empty($notification['url']) ? '/' : $notification['url']
		];
	}

	static function prepareForAndroid($notification)
	{
		// Android — keys for notification messages
		// https://firebase.google.com/docs/cloud-messaging/http-server-ref
		return [
			'title' => $notification['alert']['title'],
			'body' => $notification['alert']['body'],
			'icon' => empty($notification['badge']) ? '' : $notification['badge'],
			'click_action' => empty($notification['url']) ? null : $notification['url'],
			'sound' => empty($notification['sound']) ? 'default' : $notification['sound']
 		];
	}

	static function send($apiKey, $deviceId, $notification)
	{
		$fields = [
			'to' => $deviceId,
			'notification' => $notification
		];
		$headers = [
			'Authorization: key=' . $apiKey,
			'Content-Type: application/json'
		];
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, 'https://fcm.googleapis.com/fcm/send');
		curl_setopt($ch, CURLOPT_POST, true);
		curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fields));
		$result = curl_exec($ch);
		curl_close($ch);
		return $result;
	}

}