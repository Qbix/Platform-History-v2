<?php

namespace Elphin\IcoFileLoader;

interface ParserInterface
{
    /**
     * Returns true if string is more likely to be binary ico data rather than a filename
     * @param string $data
     * @return boolean
     */
    public function isSupportedBinaryString($data);

    /**
     * @param string $data binary string containing an icon
     * @return Icon
     */
    public function parse($data);
}
