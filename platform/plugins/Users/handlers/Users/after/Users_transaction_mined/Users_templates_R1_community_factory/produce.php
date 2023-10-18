<?php
function Users_after_Users_transaction_mined_Users_templates_R1_Community_factory_produce($params)
{
	//TODO 0: additionally need to get contract address from transaction receipt (`event InstanceCreated`)
	//		if not present in params contract
	//		main goal is to update Users_externalTo table and setup address for community user
	$externalTo = new Users_ExternalTo();
	$externalTo->userId   = $params['communityId'];
	$externalTo->platform = 'web3';
	$externalTo->appId    = $params['chainId'];
	$data = $externalTo->retrieve();

	if (!$data->xid) {
		$user = Users::fetch($params['communityId'], true);
		$user->setXid("web3_{$params['chainId']}", $params['contract']);
		$user->save();

		$externalTo->xid = $params['contract'];
		$externalTo->save(true); // this also saves externalTo
	}
}