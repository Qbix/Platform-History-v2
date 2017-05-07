<?php
	
class Users_Device_Ios extends Users_Device
{
	function deliverPushNotification($notification, $options = array())
	{	
		$sandbox = Q::ifset($device, 'sandbox', false);
		$s = $sandbox ? 'sandbox' : 'production';
		
		if (isset($notification['payload'])) {
			$notification = array_merge($notification, $notification['payload']);
			unset($notification['payload']);
		}
		
		$o = Q_Config::expect(array('Users', 'apps', 'ios', $this->appId));
		if (empty($o['token']['key'])) {
			throw Q_Exception_MissingConfig("Users/apps/ios/{$this->appId}/token/key");
		}

		use Jose\Factory\JWKFactory;
		use Jose\Factory\JWSFactory;
		$token = $o['token'];
		$key = $token['key'];
		$secret = null; // If the key is encrypted, the secret must be set in this variable
		$private_key = JWKFactory::createFromKeyFile($key_file, $secret, [
		    'kid' => $token['keyId'], // The Key ID obtained from your developer account
		    'alg' => 'ES256',         // Not mandatory but recommended
		    'use' => 'sig',           // Not mandatory but recommended
		]);
		$payload = array(
		    'iss' => $token['teamId'],
		    'iat' => time(),
		);
		$header = array(
		    'alg' => 'ES256',
		    'kid' => $private_key->get('kid'),
		);
		$jws = JWSFactory::createJWSToCompactJSON(
		    $payload,
		    $private_key,
		    $header
		);
		// this is only needed with php prior to 5.5.24
		if (!defined('CURL_HTTP_VERSION_2_0')) {
		    define('CURL_HTTP_VERSION_2_0', 3);
		}

		// use curl
		$http2ch = curl_init();
		curl_setopt($http2ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_2_0);
		$message = Q::json_encode(array(
			"aps" => $notification
		));
		$token = $this->deviceId;
		$app_bundle_id = $o['bundleId'];
		$http2_server = $sandbox
			? 'https://api.development.push.apple.com';
			: 'https://api.push.apple.com';
		array($result, $info) = $this->sendHTTP2Push(
			$http2ch, $http2_server, $app_bundle_id, $message, $token, $jws, $options
		);
		curl_close($http2ch);
		if ($info[CURLINFO_HTTP_CODE] !== 200) {
			throw new Users_Exception_DeviceNotification(array(
				'code' => $info[CURLINFO_HTTP_CODE],
				'statusMessage' => $result
			));
		}
	}
	
	function sendHTTP2Push(
		$http2ch, 
		$http2_server, 
		$app_bundle_id, 
		$message, 
		$token, 
		$jws,
		$options
	) {
	    $url = "{$http2_server}/3/device/{$token}";
	    $headers = array(
	        "apns-topic: {$app_bundle_id}",
	        'Authorization: bearer ' . $jws
	    );
		if (!empty($options['expiration'])) {
			$headers[] = "apns-expiration" = $options['expiration'];
		}
		if (!empty($options['priority'])) {
			$headers[] = "apns-priority" = $options['priority'];
		}
		if (!empty($options['collapseId'])) {
			$headers[] = "apns-collapse-id" = $options['collapse-id'];
		}
		if (!empty($options['id'])) {
			$headers[] = "apns-id" = $options['id'];
		}
		if (!empty($options['silent'])) {
			unset($notification['alert']);
			$notification['content-available'] = 1;
		}
	    curl_setopt_array($http2ch, array(
	        CURLOPT_URL => $url,
	        CURLOPT_PORT => 443,
	        CURLOPT_HTTPHEADER => $headers,
	        CURLOPT_POST => TRUE,
	        CURLOPT_POSTFIELDS => $message,
	        CURLOPT_RETURNTRANSFER => TRUE,
	        CURLOPT_TIMEOUT => 30,
	        CURLOPT_SSL_VERIFYPEER => false,
	        CURLOPT_HEADER => 1
	    ));
	    $result = curl_exec($http2ch);
	    if ($result === FALSE) {
	        throw new Q_Exception("Curl failed: " .  curl_error($http2ch));
	    }
		$info = curl_getinfo($http2ch);
	    return array($result, $info);
	}
}