<?php
/**
 * 
 * @param type $params
 */
/**
 * Called when a transaction has changed status to "mined".
 * Proceeds to call Users/transaction
 * @param {array} $params
 * @param {Users_Web3_Transaction} $params.transaction
 */
function Users_transaction_response_mined($params)
{    
    $transaction = $params['transaction'];
    
}