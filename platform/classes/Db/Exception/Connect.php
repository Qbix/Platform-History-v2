<?php

/**
 * @module Db
 */

class Db_Exception_Connect extends Db_Exception
{
	/**
	 * Represents an exception indicating that the script couldn't establish a database connection
	 * @class Db_Exception_Connect
	 * @constructor
	 * @extends Db_Exception
	 * @param {string} $shard_name The connection's shard
	 * @param {string} $connection The connection name
	 * @param {string} $dbname The database name
	 */
};

Db_Exception::add('Db_Exception_Connect', 'Could not connect to connection {{connection}} on database {{dbname}}');
