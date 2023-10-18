<?php
function Users_after_Users_transaction_mined_Users_templates_R1_community_factory_produce($params)
{
 	
	//TODO 0: additionally need to get cdontract address from transaction receipt (`event InstanceCreated`)
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