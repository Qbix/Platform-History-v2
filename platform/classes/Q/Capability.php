<?php

/**
 * @module Q
 */
class Q_Capability
{
	/**
	 * Represents a capability signed by our server
	 * @class Q_Capability
	 * @constructor
	 * @param {array} $permissions Array of strings
	 * @param {integer} $startTime a timestamp
	 * @param {integer} $endTime a timestamp
	 */
	function __construct($permissions, $startTime, $endTime)
	{
		$this->permissions = $permissions;
		$this->startTime = $startTime;
		$this->endTime = $endTime;
	}
	
	function addPermission($permission)
	{
		if (is_array($permission)) {
			$this->permissions = array_merge($this->permissions, $permission);
		} else {
			$this->permissions[] = $permission;
		}
		$this->permissions = array_unique($this->permissions);
		return $this;
	}
	
	function removePermission($permission)
	{
		$this->permissions = array_diff($this->permissions, array($permission));
	}
	
	function setData($key, $value)
	{
		$this->data[$key] = $value;
	}
	
	function exportArray()
	{
		return Q_Utils::sign(array_merge(array(
			'permissions' => $this->permissions,
			'startTime' => $this->startTime,
			'endTime' => $this->endTime
		), $this->data));
	}
	
	public $permissions = array();
	public $startTime = null;
	public $endTime = null;
	public $data = array();
}
