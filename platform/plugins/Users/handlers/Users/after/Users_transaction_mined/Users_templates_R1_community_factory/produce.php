<?php
//use SWeb3\SWeb3; 
//use SWeb3\SWeb3_Contract;
use SWeb3\ABI; 
function Users_after_Users_transaction_mined_Users_templates_R1_Community_factory_produce($params)
{

	$transaction = $params['transaction'];
	if (empty($params['contract'])) {
		// try to decode from transaction result
		
		$contractABI_json = Users_Web3::getABI($transaction->contractABIName, $transaction->chainId);
		$contractABI = Q::json_encode($contractABI_json);
		
		// TODO 1: need to move the code below into new object Sweb3/Transaction, 
		// which initiated by response result or transaction hash
		// then by eventName can be decoded adnd return  argument's event
		$ABI = new ABI();
        $ABI->Init($contractABI);  
		
		$resultData = Q::json_decode($transaction->result);
		$resultlogs = $resultData->logs;
		foreach($resultlogs as $log) {
			$event = $ABI->GetEventFromHash($log->topics[0]);
			if(($event != null) && ($event->name  == 'InstanceCreated')) {
				$decoded_data = $ABI->DecodeEvent($event, $log);
			}
		}
		
		if (!$decoded_data || !$decoded_data->data->instance) {
			throw new Q_Exception_BadValue(array(
				'internal' => 'contract', 
				'problem' => "no address found from logs"
			), 'contract');
		}
		
		$params['contract'] = $decoded_data->data->instance;
		
	}
	
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