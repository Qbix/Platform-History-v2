<?php

/**
 * @module Users
 */
class Users_Exception_Quota extends Q_Exception
{
	/**
	 * An exception is raised if a quota has been exceeded
	 * @class Users_Exception_Quota
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $title
	 */
};

Q_Exception::add('Users_Exception_Quota', 'Rate exceeded for {{title}}. Maybe try again later.', 429);
