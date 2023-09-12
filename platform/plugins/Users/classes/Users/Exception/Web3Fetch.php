<?php

/**
 * @module Users
 */
class Users_Exception_Web3Fetch extends Q_Exception
{
	/**
	 * Thrown when attempting to fetch information from Web3 blockchain fails
	 * @class Users_Exception_Web3Fetch
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Users_Exception_Web3Fetch', 'Error fetching web3 blockchain');
