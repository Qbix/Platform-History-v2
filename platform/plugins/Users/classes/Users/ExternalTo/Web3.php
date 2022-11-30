<?php

/**
 * @module Users
 */

/**
 * Class representing Web3 app user.
 *
 * @class Users_ExternalTo_Web3
 * @extends Users_ExternalTo
 */
class Users_ExternalTo_Web3 extends Users_ExternalTo implements Users_ExternalTo_Interface
{

	/**
	 * Calls getAddresses(roleIds) on CommunityContract located at $this->xid
	 * on the chain $this->appId
	 * @method fetchXids
	 * @param {array} $roleIds Pass integers (or stringified integers) here
	 * @param {array} [$options=array()]
	 * @param {string} [$options.pathABI] optionally override the default ABI
	 * @return {array} an array of (externalLabel => xids) pairs
	 */
	function fetchXids($roleIds, $options = array())
	{
		foreach ($roleIds as $i => $roleId) {
			$roleIds[$i] = (int)$roleId;
		}
		$pathABI = Q::ifset($options, 'pathABI', 'Users/templates/R1/Community/contract');
		$results = Users_Web3::execute($pathABI, $this->xid, 'getAddresses', array($roleIds), $this->appId);
		foreach ($results as $i => $xids) {
			$roleId = $roleIds[$i];
			$externalLabel = Users_Label::external($this->platformId, $this->appId, $roleId);
			$results[$externalLabel] = $xids;
		}
		return $results;
	}

	/**
	 * Calls getRoles(xids) on CommunityContract located at $this->xid
	 * on the chain $this->appId
	 * @method fetchXids
	 * @param {array} $xids Pass external addresses here
	 * @param {array} [$options=array()]
	 * @param {string} [$options.pathABI] optionally override the default ABI
	 * @return {array} an array of (externalLabel => xids) pairs
	 */
	function fetchExternalLabels($xids, $options = array())
	{
		$pathABI = Q::ifset($options, 'pathABI', 'Users/templates/R1/Community/contract');
		$results = Users_Web3::execute($pathABI, $this->xid, 'getRoles', array($xids));
		foreach ($results as $i => $roleId) {
			$xid = $xids[$i];
			$results[$xid] = Users_Label::external($this->platformId, $this->appId, $roleId);
		}
		return $results;
	}

}