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
        $js = array();
        foreach ($config as $plugin => $filename) {
            if (!file_exists($filename)) {
                throw new Q_Exception_MissingFile(compact('filename'));
            }
            $mtime = filemtime($filename);
            $preamble = <<<JS
/**** Qbix: produced by Q_ServiceWorker::inlineCode()
 * SOURCE: $filename
 * TIME: $mtime
 */

JS;
            $js[$plugin] = $preamble . file_get_contents($filename);
        }
        $separator = "\n\n";
        return implode($separator, $js);
    }
}