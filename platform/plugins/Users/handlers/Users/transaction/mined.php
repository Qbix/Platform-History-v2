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
    if (!empty($transaction->contractABIName)) {
        Q::event("Users/transaction/mined/"
            . $transaction->contractABIName . '/'
            . $transaction->method,
            compact('transaction'),
            'after'
        );
    }
    // WARNING: not recommended to add hooks with these names,
    // since the same method name might be shared
    // among multiple types of smart contracts
    Q::event("Users/transaction/mined/"
        . $transaction->method,
        compact('transaction'),
        'after'
    );
}