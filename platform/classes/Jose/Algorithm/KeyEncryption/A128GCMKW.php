<?php

/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014-2016 Spomky-Labs
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

namespace Jose\Algorithm\KeyEncryption;

/**
 * Class A128GCMKW.
 */
final class A128GCMKW extends AESGCMKW
{
    /**
     * {@inheritdoc}
     */
    protected function getKeySize()
    {
        return 128;
    }

    /**
     * {@inheritdoc}
     */
    public function getAlgorithmName()
    {
        return 'A128GCMKW';
    }
}
