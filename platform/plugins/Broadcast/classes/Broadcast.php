<?php
/**
 * Broadcast model
 * @module Broadcast
 * @main Broadcast
 */
/**
 * Static methods for the Broadcast models.
 * @class Broadcast
 * @extends Base_Broadcast
 */
abstract class Broadcast extends Base_Broadcast
{
	/*
	 * This is where you would place all the static methods for the models,
	 * the ones that don't strongly pertain to a particular row or table.
	 
	 * * * */

	/**
	 * Model cache
	 * @property $cache
	 * @static
	 * @type array
	 */
	static $cache = array();
	/* * * */
};