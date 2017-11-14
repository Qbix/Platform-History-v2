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
	 * @param {string} $device.userId the id of a user in the system
	 * @param {string} $device.deviceId the id of the device on the external platform
	 * @param {string} $device.platform an external platform, such as "ios" or "facebook"
	 * @param {string} $device.appId external app id registered with the platform
	 * @param {string} $device.formFactor the form factor of the device
	 * @param {string} $device.version the version of the platform
	 * @param {string} [$device.sessionId=Q_Session::id()] the session id to associate to the device.
	 * @param {boolean} [$skipNotification=false] if true, skips sending notification
	 * @return {Users_Device}
	 */
	static function add($device, $skipNotification=false)
	{
		if (($device['platform'] === 'chrome') || ($device['platform'] === 'firefox')) {
			$fields = array('userId', 'deviceId', 'platform', 'appId', 'formFactor', 'version', 'auth', 'p256dh');
		} else {
			$fields = array('userId', 'deviceId', 'platform', 'appId', 'formFactor', 'version');
		}
		Q_Valid::requireFields($fields, $device, true);
		$userId = $device['userId'];
		$deviceId = $device['deviceId'];
		$platform = $device['platform'];
		$platformAppId = $device['appId'];
		$auth = !empty($device['auth']) ? $device['auth'] : null;
		$p256dh = !empty($device['p256dh']) ? $device['p256dh'] : null;
		$apps = Q_Config::expect('Users', 'apps', $platform);
		list($appId, $info) = Users::appInfo($platform, $platformAppId);
		if (!$info) {
			throw new Q_Exception_MissingConfig(array(
				'fieldpath' => "Users/apps/$platform/.../appId=$platformAppId"
			));
		}
		$sessionId = isset($device['sessionId']) ? $device['sessionId'] : Q_Session::id();
		$user = Users::loggedInUser();
		$info = array_merge(Q_Request::userAgentInfo(), array(
			'sessionId' => $sessionId,
			'userId' => $userId,
			'deviceId' => $deviceId,
			'appId' => $platformAppId,
			'auth' => $auth,
			'p256dh' => $p256dh
		));
		$deviceArray = Q::take($device, $info);
		$className = "Users_Device_" . ucfirst($platform);
		$deviceRow = new $className($deviceArray);
		if (!$skipNotification) {
			// The following call may throw an exception if deviceId is invalid.
			// This may cancel Users::register() registration and remove user.
			$alert = Q_Config::get(
				"Users", "apps", $platform, $appId, "device", "added",
				"Notifications have been enabled"
			);
			$payload = compact('userId');
			$deviceRow->pushNotification(compact('alert', 'payload'));
		}
		$deviceRow->save(true);
		$deviceArray['deviceId'] = $deviceRow->deviceId;
		if ($sessionId) {
			$fields = array('deviceId', 'appId', 'platform', 'version', 'formFactor');
			Users_Session::update()
				->set(Q::take($deviceArray, $fields))
				->where(array('id' => $sessionId))
				->execute();
		}
		$deviceArray['Q/method'] = 'Users/device';
		Q_Utils::sendToNode($deviceArray);
		return $deviceRow;
	}
	
	/**
	 * Given a userId and optional platform and appId,
	 * retrieve an array of the latest devices, ordered by time inserted.
	 * @method byApp
	 * @static
	 * @param {string} [$userId=Users::loggedInUser()] The id of the user
	 * @param {string} [$platform=Q_Request::platform()] The external platform
	 * @param {string} [$appId=Q::app()] External or internal platform app id
	 * @return {array}
	 */
	static function byApp($userId = null, $platform = null, $appId = null)
	{
		if (!isset($userId)) {
			$user = Users::loggedInUser();
			if (!$user) {
				return array();
			}
			$userId = $user->id;
		}
		if (!isset($platform)) {
			$platform = Q_Request::platform();
		}
		if (!isset($appId)) {
			$appId = Q::app();
		} else {
			list($appId, $appInfo) = Users::appInfo($appId);
			$appId = $appInfo['appId'];
		}
		return Users_Device::select()
			->where(compact('userId', 'platform', 'appId'))
			->orderBy('insertedTime', false)
			->fetchDbRows();
	}
	
	/**
	 * You can use this method to send push notifications.
	 * It is far better, however, to use the Qbix Platform's offline notification
	 * mechanisms using Node.js instead of PHP. That way, you can be sure of re-using
	 * the same persistent connection.
	 * @method pushNotification
	 * @param {array} $notification
	 * @param {string|array} [$notification.alert] Either the text of an alert to show,
	 *  or an object with the following fields:
	 * @param {string} [$notification.alert.title] The title of the notification
	 * @param {string} [$notification.alert.body] The body of the notification
	 * @param {string} [$notification.alert.titleLocKey] Apple-only
	 * @param {string} [$notification.alert.titleLocArgs] Apple-only
	 * @param {string} [$notification.alert.actionLocKey] Apple-only
	 * @param {string} [$notification.alert.locKey] Apple-only
	 * @param {string} [$notification.alert.locArgs] Apple-only
	 * @param {string} [$notification.alert.launchImage] Apple-only
	 * @param {string} [$notification.badge] The badge
	 * @param {string} [$notification.sound] The name of the sound file in the app bundle or Library/Sounds folder
	 * @param {string} [$notification.icon] Url of icon, can be png any square size
	 * @param {string} [$notification.url] Url to which the notifiation will be linked
	 * @param {array} [$notification.actions] Array of up to two arrays with keys 'action' and 'title'.
	 * @param {string} [$notification.category] Apple-only. The name of the category for actions registered on the client side.
	 * @param {array} [$notification.payload] Put all your custom notification fields here
	 * @param {integer} [$notification.expiry=null] Number of seconds until notification expires
	 *    and does not need to be stored anymore on the device.
	 *    Pass -1 to ask the device not to store it at all.
	 * @param {string} [$notification.priority="high"] Can be set to "normal" to make it lower priority
	 * @param {string} [$notification.collapseId] A string under 64 bytes for collapsing notifications
	 * @param {string} [$notification.id] You can provide your own uuid for the notification
	 * @param {array} [$options]
	 * @param {boolean} [$options.scheduled=false] if true, doesn't send immediately.
	 *  You should call Users_Device_{YourPlatform}::sendPushNotifications()
	 *  to send all scheduled notifications in a batch.
	 * @param {boolean} [$options.silent=false] Deliver a silent notification, may throw an exception
	 */
	function pushNotification($notification, $options = array())
	{
		$this->handlePushNotification($notification, $options);
	}
	
	/**
	 * Schedules a push notification.
	 * This default implementation, just throws an error.
	 * @method handlePushNotification
	 */
	protected function handlePushNotification($notifications, $options = array())
	{
		throw new Q_Exception_MethodNotSupported(array(
			'method' => 'schedulePushNotification'
		));
	}
	
	/**
	 * Sends all scheduled push notifications
	 * @method sendPushNotifications
	 * Default implementation
	 */
	static function sendPushNotifications()
	{
		throw new Q_Exception_MethodNotSupported(array(
			'method' => 'sendPushNotifications'
		));
	}

	/**
	 * Called by various Db methods to get a custom row object
	 * @param {array} $fields Any fields to set in the row
	 * @param {string} [$stripPrefix=null] Any prefix to strip from the fields
	 * @return Users_Device
	 */
	static function newRow($fields, $stripPrefix = null)
	{
		Q_Valid::requireFields(array('platform'), $fields, true);
		$platform = ucfirst(strtolower($fields['platform']));
		$className = "Users_Device_$platform";
		$row = new $className();
		return $row->copyFrom($fields, $stripPrefix, false, false);
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