<?php

function Users_account_response_content()
{
        Q_Session::start();
        return Q::tool('Users/account');
}
