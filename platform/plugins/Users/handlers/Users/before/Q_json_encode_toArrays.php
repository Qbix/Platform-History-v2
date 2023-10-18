<?php
use phpseclib\Math\BigInteger;
function Users_before_Q_json_encode_toArrays($params, &$result)
{
    if ($result instanceof BigInteger) {
        $result = $result->toString();
    }
}