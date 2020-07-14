<?php

/**
 * @module Db
 */

class Db_Exception_Blocked extends Db_Exception
{
	/**
	 * Represents an exception thrown by Db_Query_Mysql::excecute() when shard is blocked during split process
	 * @class Db_Exception_Blocked
	 * @constructor
	 * @extends Db_Exception
	 * @param {string} $shard_name The blocked shard
	 * @param {string} $connection The blocked connection
	 */
};

Db_Exception::add('Db_Exception_Blocked', 'shard {{shard_name}} for connection {{connection}} is temporarily blocked for writing');
