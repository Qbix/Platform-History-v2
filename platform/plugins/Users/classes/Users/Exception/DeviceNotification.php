<?php

/**
 * @module Users
 */
class Users_Exception_DeviceNotification extends Q_Exception
{
	/**
	 * An exception is raised if push notification can't be sent
	 * @class Users_Exception_DeviceNotification
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $statusMessage
	 */
};

Q_Exception::add('Users_Exception_DeviceNotification', 'Sending notification failed: {{statusMessage}}');
