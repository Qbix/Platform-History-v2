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
 * Class A192GCMKW.
 */
final class A192GCMKW extends AESGCMKW
{
    /**
     * {@inheritdoc}
     */
    protected function getKeySize()
    {
        return 192;
    }

    /**
     * {@inheritdoc}
     */
    public function getAlgorithmName()
    {
        return 'A192GCMKW';
    }
}
