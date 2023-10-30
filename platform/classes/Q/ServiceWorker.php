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
    static function inlineCode()
    {
        $config = Q_Config::get('Q', 'javascript', 'serviceWorker', 'modules', array());
        $js = array();
        foreach ($config as $plugin => $filename) {
            $filename = Q::pluginDir($plugin, 'SCRIPTS') . DS . $filename;
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