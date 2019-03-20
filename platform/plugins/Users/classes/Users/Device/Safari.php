<?php
	
class Users_Device_Safari extends Users_Device
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
		// todo: implement this using documented arguments sent to for pushNotification
	}
	
	/**
	 * Sends all scheduled push notifications
	 * @method sendPushNotifications
	 * @static
	 * @throws Users_Exception_DeviceNotification
	 */
	static function sendPushNotifications()
	{
		// todo: implement this using documented arguments sent to for pushNotification
	}
	
	static protected $push = null;
}