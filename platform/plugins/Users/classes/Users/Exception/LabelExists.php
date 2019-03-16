<?php

/**
 * @module Users
 */
class Users_Exception_LabelExists extends Q_Exception
{
	/**
	 * An exception is raised if label already exists
	 * @class Users_Exception_LabelExists
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Users_Exception_LabelExists', 'That label already exists');
