<?php

function Users_account_response_form()
{
    // Calling this will fill the slots
    Q::tool('Users/account', array('setSlots' => true));
    return true;
}
