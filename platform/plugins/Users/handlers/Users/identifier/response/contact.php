<?php

function Users_identifier_response_content()
{
        Q_Session::start();
        return Q::tool('Users/identifier');
}
