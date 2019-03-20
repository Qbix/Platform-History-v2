<?php
	
class Users_Device_Ios extends Users_Device
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
		list($appId, $appInfo) = Users::appInfo($this->platform, $this->appId);
		$authority = USERS_PLUGIN_FILES_DIR.DS.'Users'.DS.'certs'.DS.'EntrustRootCA.pem';
		$ssl = Q_Config::expect('Users', 'apps', 'ios', $appId, 'ssl');
		if (empty($ssl['cert'])) {
			throw Q_Exception_MissingConfig("Users/apps/ios/$appId/ssl/cert");
		}
		$sandbox = Q::ifset($appInfo, 'sandbox', false);
		$s = $sandbox ? 'sandbox' : 'production';
		$cert = Q::realPath($ssl['cert']);
		if (!$cert) {
			throw new Q_Exception_MissingFile(array(
				'filename' => $ssl['cert']
			));
		}
		$env = $sandbox
			? ApnsPHP_Abstract::ENVIRONMENT_SANDBOX
			: ApnsPHP_Abstract::ENVIRONMENT_PRODUCTION;

		if (isset(self::$push)) {
			$push = self::$push;
		} else {
			$logger = new Users_ApnsPHP_Logger();
			$push = self::$push = new ApnsPHP_Push($env, $cert);
			$push->setLogger($logger);
			$push->setRootCertificationAuthority($authority);
			if (isset($ssl['passphrase'])) {
				$push->setProviderCertificatePassphrase($ssl['passphrase']);
			}
			$push->connect();
		}
		if (isset($notification['alert'])) {
			$alert = $notification['alert'];
			if (is_string($alert)) {
				$message = new ApnsPHP_Message($this->deviceId);
				$message->setText($alert);
			} else if (is_array($alert)) {
				$message = new ApnsPHP_Message_Custom($this->deviceId);
				foreach ($alert as $k => $v) {
					$methodName = 'set'.ucfirst($k);
					$message->$methodName($v);
				}
			}
		} else {
			$message = new ApnsPHP_Message($this->deviceId);
		}
		if (!empty($notification['priority'])) {
			$p = $notification['priority'];
			if (!is_numeric($p)) {
				$p = ($p === 'high') ? 10 : 5;
			}
			$message->setCustomProperty('apns-priority', $notification['priority']);
		}
		if (!empty($notification['collapseId'])) {
			$message->setCustomProperty('apns-collapse-id', $notification['collapseId']);
		}
		if (!empty($notification['id'])) {
			$message->setCustomIdentifier($notification['id']);
		}
		foreach (array('badge', 'sound', 'category', 'expiry') as $k) {
			if (isset($notification[$k])) {
				$methodName = 'set'.ucfirst($k);
				$message->$methodName($notification[$k]);
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
			self::sendPushNotifications();
		}
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
		$push = self::$push;
		$push->send();
		// no need to disconnect since socket is persistent
		$errors = $push->getErrors();
		if (!empty($errors)) {
			throw new Users_Exception_DeviceNotification(array(
				'statusMessage' => json_encode($errors)
			));
		}
	}
	
	static protected $push = null;
}