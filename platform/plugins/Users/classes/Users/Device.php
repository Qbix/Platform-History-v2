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
	 * @param {string} $device.platform
	 * @param {string} $device.appId external app id registered with the platform
	 * @param {string} [$device.formFactor]
	 * @param {string} [$device.version] the version of the platform
	 * @param {string} [$device.sessionId=Q_Session::id()] the session id to associate to the device.
	 * @param {boolean} [$skipNotification=false] if true, skips sending notification
	 * @return {Users_Device}
	 */
	static function add($device, $skipNotification=false)
	{
		$fields = array('userId', 'deviceId', 'platform', 'appId');
		Q_Valid::requireFields($fields, $device, true);
		$userId = $device['userId'];
		$deviceId = $device['deviceId'];
		$platform = $device['platform'];
		$platformAppId = $device['appId'];
		$apps = Q_Config::expect('Users', 'apps', $platform);
		list($appId, $info) = Users::appInfo($platform, $platformAppId);
		if (!$info) {
			throw new Q_Exception_MissingConfig("Users/apps/$platform/.../appId=$platformAppId");
		}
		$sessionId = isset($device['sessionId']) ? $device['sessionId'] : Q_Session::id();
		$user = Users::loggedInUser();
		$info = array_merge(Q_Request::userAgentInfo(), array(
			'sessionId' => $sessionId,
			'userId' => $userId,
			'deviceId' => null,
			'appId' => $platformAppId
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
		if ($sessionId) {
			Users_Session::update()
				->set(compact('deviceId'))
				->where(array('id' => $sessionId))
				->execute();
		}
		$deviceArray['Q/method'] = 'Users/device';
		Q_Utils::sendToNode($device2);
		return $d;
	}
	
	/**
	 * Retrieve the latest device, if any, from a user id and platform
	 * @param {string} [$userId] Defaults to logged-in user
	 * @param {string} [$platform] Defaults to Q_Request::platform()
	 * @return {Users_Device|null}
	 */
	static function byPlatform($userId = null, $platform = null)
	{
		if (!isset($userId)) {
			$user = Users::loggedInUser();
			if (!$user) {
				return null;
			}
			$userId = $user->id;
		}
		if (!isset($platform)) {
			$platform = Q_Request::platform();
		}
		$devices = Users_Device::select('*')
			->where(compact('userId', 'platform'))
			->orderBy('insertedTime', false)
			->fetchDbRows();
		return $devices ? reset($devices) : null;
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
	 * @param {array} [$notification.actions] Array of up to two arrays with keys 'action' and 'title'.
	 * @param {string} [$notification.category] Apple-only. The name of the category for actions registered on the client side.
	 * @param {Object} [$notification.payload] Put all your custom notification fields here
	 * @param {Object} [$options]
	 * @param {boolean} [$options.scheduled=false] if true, doesn't send immediately. You should call Users_Device::sendPushNotifications() to send all scheduled notifications in a batch.
	 * @param {string} [$options.view] Optionally set a view to render for the alert body
	 * @param {Boolean} [$options.isSource] If true, uses Q.Handlebars.renderSource instead of render
	 * @param {timestamp} [$options.expiration] A UNIX timestamp for when the notification expires
	 * @param {string} [$options.priority="high"] Can be set to "normal" to make it lower priority
	 * @param {string} [$options.collapseId] A string under 64 bytes for collapsing notifications
	 * @param {string} [$options.id] You can provide your own uuid for the notification
	 * @param {boolean} [$options.silent=false] Deliver a silent notification, may throw an exception
	 */
	function pushNotification($notification, $options = array())
	{
		$this->schedulePushNotification($notification, $options);
	}
	
	/**
	 * Schedules a push notification
	 * @method schedulePushNotifications
	 * Default implementation
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