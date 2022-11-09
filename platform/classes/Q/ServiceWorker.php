<?php

/**
 * @module Q
 */
/**
 * This class deals with service workers
 * @class Q_ServiceWorker
 */
class Q_ServiceWorker
{
    function inlineCode()
    {
        $config = Q_Config::get('Q', 'serviceWorkers', 'modules', array());
        foreach ($config as $plugin => $filename) {
            
        }
    }
}