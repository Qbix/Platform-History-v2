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
	 * @param {array} [$data=array()] 
	 * @param {integer} [$startTime=null] a timestamp
	 * @param {integer} [$endTime=null] a timestamp
	 */
	function __construct(
		$permissions, 
		$data = array(), 
		$startTime = null, 
		$endTime = null
	) {
		$permissions = self::_permissions($permissions);
		$this->permissions = $permissions;
		$this->startTime = $startTime;
		$this->endTime = $endTime;
	}
	
	function addPermission($permission)
	{
		$permissions = self::_permissions($permission);
		$this->permissions = array_unique(
			array_merge($this->permissions, $permissions)
		);
		sort($this->permissions);
		return $this;
	}
	
	function removePermission($permission)
	{
		$permissions = self::_permissions($permission);
		$this->permissions = array_diff($this->permissions, array($permission));
		sort($this->permissions);
	}

	function validate($permissions)
	{
		return Q_Valid::capability($this, $permissions);
	}
	
	function setData($key, $value)
	{
		$this->data[$key] = $value;
	}
	
	function exportArray()
	{
		return Q_Utils::sign($this->_toArray());
	}

	function signature()
	{
		return Q_Utils::signature($this->_toArray());
	}

	function __toString() {
		$p = implode('+', $this->permissions);
		$startTime = $this->startTime ? $this->startTime : '';
		$endTime = $this->endTime ? $this->endTime : '';
		$core = "$p,$startTime,$endTime";
		$data = Q_Utils::serialize($this->data);
		$arr = $this->exportArray();
		$sf = Q_Config::get('Q', 'internal', 'sigField', 'sig');
		$sig = $arr["Q.$sf"];
		$core = str_replace(";", "\;", $core);
		$data = str_replace(";", "\;", $data);
		return "$core;$data;$sig";
	}

	private function _toArray()
	{
		$permissions = array();
		$arr = array('permissions' => $this->permissions);
		if (isset($this->startTime)) {
			$arr['startTime'] = $this->startTime;
		}
		if (isset($this->endTime)) {
			$arr['endTime'] = $this->endTime;
		}
		return array_merge($arr, $this->data);
	}

	private static function _permissions($permission) {
		$config = Q_Config::get('Q', 'capability', 'permissions', array());
		$permissions = is_array($permission)
			? $permission
			: array($permission);
		foreach ($permissions as $i => $p) {
			$k = array_search($p, $config);
			if ($k !== false) {
				$permissions[$i] = $k;
			}
		}
		return $permissions;
	}
	
	public $permissions = array();
	public $startTime = null;
	public $endTime = null;
	public $data = array();
}
