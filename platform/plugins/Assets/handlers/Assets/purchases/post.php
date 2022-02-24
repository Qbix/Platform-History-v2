<?php

function Assets_purchases_post()
{
    if (!Users::roles(null, 'Users/admins')) {
        throw new Users_Exception_NotAuthorized();
    }
    if (empty($_FILES['csvfile'])) {
        throw new Q_Exception_RequiredField(array('field' => 'csvfile'));
    }
    $name = basename($_FILES['csvfile']['name']);
    $parts = explode('.', $name);
    if (end($parts) !== 'csv') {
        throw new Q_Exception_WrongValue(array(
            'field' => 'csvfile', 
            'range' => 'file with csv extension'
        ));
    }
    $filename = APP_FILES_DIR . DS . 'Assets' . DS . 'purchases.csv';
    move_uploaded_file($_FILES['csvfile']['tmp_name'], $filename);
}