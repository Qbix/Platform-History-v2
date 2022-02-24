<?php

function Assets_purchase_post($params)
{
    file_put_contents(
        APP_FILES_DIR . DS . 'Assets' . DS . 'purchases.log',
        Q::json_encode($_POST, true) . "\n\n\n",
        FILE_APPEND
    );

    $fields = $_POST;
    $fields = array_merge($fields, Q::ifset($_POST, 'data', array()));

    $purchase = new Assets_Purchase();
    foreach ($fields as $k => $v) {
        $purchase->{$k} = $v;
    }
    $purchase->save(true);

    Q_Response::setSlot('result', true);
}