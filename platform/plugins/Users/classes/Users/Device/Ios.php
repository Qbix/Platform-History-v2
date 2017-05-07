<?php
	
class Users_Device_Ios extends Users_Device
{
	function handlePushNotification($notification, $options = array())
	{	
		$authority = USERS_PLUGIN_FILES_DIR.DS.'Users'.DS.'certs'.DS.'EntrustRootCA.pem';
		$ssl = Q_Config::expect(array('Users', 'apps', 'ios', $this->appId, 'ssl'));
		if (empty($ssl['cert'])) {
			throw Q_Exception_MissingConfig("Users/apps/ios/{$this->appId}/ssl/cert");
		}
		$sandbox = Q::ifset($device, 'sandbox', false);
		$s = $sandbox ? 'sandbox' : 'production';
		$cert = $ssl['cert'];
		$env = $sandbox
			? ApnsPHP_Abstract::ENVIRONMENT_SANDBOX
			: ApnsPHP_Abstract::ENVIRONMENT_PRODUCTION;

		$logger = new Users_ApnsPHP_Logger();
		$push = self::$push = new ApnsPHP_Push($env, $cert);
		$push->setLogger($logger);
		$push->setRootCertificationAuthority($authority);
		if (isset($ssl['passphrase'])) { 			$push->setProviderCertificatePassphrase($ssl['passphrase']);
		}
		$push->connect();
		if (isset($notification['alert'])) {
			$alert = $notification['alert'];
			if (is_string($alert)) {
				$message = new ApnsPHP_Message($deviceId);
				$message->setText($alert);
			} else if (is_array($alert)) {
				$message = new ApnsPHP_Message_Custom($deviceId);
				foreach ($alert as $k => $v) {
					$methodName = 'set'.ucfirst($k);
					$message->$methodName($v);
				}
			}
		} else {
			$message = new ApnsPHP_Message($deviceId);
		}
		if (!empty($notification['priority'])) {
			$p = $notification['priority'];
			if (!is_numeric($p)) {
				$p = ($p === 'high') ? 10 : 5;
			}
			$message->setCustomProperty('apns-priority', $notification['priority']);
		}
		foreach (array('badge', 'sound', 'category', 'expiry') as $k) {
			if (isset($notification[$k])) {
				$methodName = 'set'.ucfirst($k);
				$message->$messageName($notification[$k]);
			}
		}
		if (!empty($options['silent'])) {
			$message->setContentAvailable(true);
		}
		if (isset($notification['payload'])) {
			foreach ($notification['payload'] as $k => $v) {
				$message->setCustomProperty($k, $v);
			}
			unset($notification['payload']);
		}
		$push->add($message);
		if (empty($options['scheduled'])) {
			$push->send();
		}
		// no need to disconnect since socket is persistent
		$errors = $push->getErrors();
		if (!empty($errors)) {
			throw new Q_Exception(reset($errors));
		}
	}
	
	/**
	 * Sends all scheduled push notifications
	 * @method sendPushNotifications
	 * Default implementation
	 */
	static function sendPushNotifications()
	{
		if (self::$push) {
			self::$push->send();
		}
		throw new Q_Exception_MethodNotSupported(array(
			'method' => 'sendPushNotifications'
		));
	}
	
	static protected $push = null;
}