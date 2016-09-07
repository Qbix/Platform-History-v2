<?php
/**
 * @module Users
 */
/**
 * Class representing 'Device' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a device row in the Users database.
 *
 * @class Users_Device
 * @extends Base_Users_Device
 */
class Users_Device extends Base_Users_Device
{
	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		parent::setUp();
	}
	
	/**
	 * Adds a device to the system, after sending a test notification to it
	 * @param {array} $device
	 * @param {string} $device.userId
	 * @param {string} $device.deviceId
	 * @param {string} [$device.formFactor]
	 * @param {string} [$device.platform]
	 * @param {string} [$device.version]
	 * @param {string} [$device.sessionId]
	 * @param {boolean} [$device.sandbox]
	 * @param {string} [$device.passphrase]
	 * @param {boolean} [$skipNotification=false] if true, skips sending notification
	 * @return {Users_Device}
	 */
	static function add($device, $skipNotification=false)
	{
		Q_Valid::requireFields(array('userId', 'deviceId'), $device, true);
		$userId = $device['userId'];
		$deviceId = $device['deviceId'];
		if (!$skipNotification) {
			$app = Q::app();
			$sandbox = Q::ifset($device, 'sandbox', null);
			if (!isset($sandbox)) {
				$sandbox = Q_Config::get($app, "cordova", "ios", "sandbox", false);
			}
			if ($sandbox) {
				$env = ApnsPHP_Abstract::ENVIRONMENT_SANDBOX;
				$s = 'sandbox';
			} else {
				$env = ApnsPHP_Abstract::ENVIRONMENT_PRODUCTION;
				$s = 'production';
			}
			$s = empty($device['sandbox']) ? 'production' : 'sandbox';
			$cert = APP_LOCAL_DIR.DS.'Users'.DS.'certs'.DS.$app.DS.$s.DS.'cert.pem';
			$authority = USERS_PLUGIN_FILES_DIR.DS.'Users'.DS.'certs'.DS.'EntrustRootCA.pem';
			$push = new ApnsPHP_Push($env, $cert);
			$push->setRootCertificationAuthority($authority);
			if (isset($device['passphrase'])) {
				$push->setProviderCertificatePassphrase($device['passphrase']);
			}
			$push->connect();
			$message = new ApnsPHP_Message($deviceId);
			$message->setCustomIdentifier('Users_Device-adding');
			$message->setBadge(0);
			$message->setText(Q_Config::get(
				$app, "cordova", "ios", "device", "text", "Notifications have been enabled"
			));
			$message->setCustomProperty('userId', $userId);
			$message->setExpiry(5);
			$push->add($message);
			$push->send();
			$push->disconnect();
			$errors = $push->getErrors();
			if (!empty($errors)) {
				throw new Q_Exception(reset($errors));
			}
		}
		$device2 = Q::take($device, array(
			'sessionId' => Q_Session::id(),
			'formFactor' => Q_Request::formFactor(),
			'platform' => Q_Request::platform(),
			'version' => Q_Request::OSVersion(),
			'userId' => null,
			'deviceId' => null
		));
		$d = new Users_Device($device2);
		$d->save();
		$_SESSION['Users']['deviceId'] = $token;
		$device2['Q/method'] = 'Users/device';
		Q_Utils::sendToNode($device2);
		return $d;
	}

	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_Device} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_Device();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};