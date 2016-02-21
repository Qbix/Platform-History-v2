<?php

function Users_identifier_response_static()
{
        // Calling this will fill the slots
        Q::tool('Users/identifier', array('setSlots' => true), array('tag' => null));
        return true;
}
