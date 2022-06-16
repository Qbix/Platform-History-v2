<?php

/**
 * @module Users
 */
class Users_Exception_MissingSignature extends Q_Exception
{
	/**
	 * This exception is thrown when a request is missing a signature
	 * @class Users_Exception_MissingSignature
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Users_Exception_MissingSignature', "Request is missing signature.");
