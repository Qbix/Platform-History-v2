<?php

require Q_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

use Mdanter\Ecc\Crypto\Signature\SignHasher;
use Mdanter\Ecc\EccFactory;
use Mdanter\Ecc\Crypto\Signature\Signer;
use Mdanter\Ecc\Crypto\Signature\Signature;
use Mdanter\Ecc\Serializer\PublicKey\PemPublicKeySerializer;
use Mdanter\Ecc\Serializer\PublicKey\DerPublicKeySerializer;
use Mdanter\Ecc\Serializer\Signature\DerSignatureSerializer;

/**
 * @module Q
 */
/**
 * Used for crypto operations in Q
 * @class Q_Crypto
 */
class Q_Crypto {
    /**
     * Verify a signature on a payload serialized into a canonical string,
     * using P-384 ECDSA curve.
     * @method verify
     * @static
     * @param {string} $serialized the serialized data
     * @param {string} $signature 192 characters, 96 r and 96 s
     * @param {string} $publicKey ECDSA
     * @param {string} $algorithm for the hashing of serialized data
     * @return {boolean} true if the signature is correct
     */ 
    static function verify($serialized, $signature, $publicKey, $algorithm = 'sha256')
    {
        $adapter = EccFactory::getAdapter();
        $generator = EccFactory::getNistCurves()->generator384();

        if (is_array($signature)) {
            $signature = new Signature(
                gmp_init($signature[0], 16),
                gmp_init($signature[1], 16)
            );
        } else {
            $r = gmp_init(substr($signature, 0, 96), 16);
            $s = gmp_init(substr($signature, 96), 16);
            $signature = new Signature($r, $s);
            // $signature = self::p1363_to_asn1(hex2bin($signature)); 
        }
        
        // Parse signature
        // $sigSerializer = new DerSignatureSerializer();
        // $sig = $sigSerializer->parse($signature);
        
        // Parse public key
        $key_PEM = ( "-----BEGIN PUBLIC KEY-----" . PHP_EOL
            . chunk_split(base64_encode(hex2bin($publicKey)), 64, PHP_EOL)
            . "-----END PUBLIC KEY-----" );

        $derSerializer = new DerPublicKeySerializer($adapter);
        $pemSerializer = new PemPublicKeySerializer($derSerializer);
        $key = $pemSerializer->parse($key_PEM);
        
        $hasher = new SignHasher($algorithm);
        $hash = $hasher->makeHash($serialized, $generator);
        
        $signer = new Signer($adapter);
        return $signer->verify($key, $signature, $hash);
    }

    /**
     * Converts an IEEE P1363 signature into ASN.1/DER.
     *
     * @param string $p1363 Binary IEEE P1363 signature.
     */
    private static function p1363_to_asn1($p1363)
    {
        // P1363 format: r followed by s.

        // ASN.1 format: 0x30 b1 0x02 b2 r 0x02 b3 s.
        //
        // r and s must be prefixed with 0x00 if their first byte is > 0x7f.
        //
        // b1 = length of contents.
        // b2 = length of r after being prefixed if necessary.
        // b3 = length of s after being prefixed if necessary.

        $asn1  = '';                        // ASN.1 contents.
        $len   = 0;                         // Length of ASN.1 contents.
        $c_len = intdiv(strlen($p1363), 2); // Length of each P1363 component.

        // Separate P1363 signature into its two equally sized components.
        foreach (str_split($p1363, $c_len) as $c) {
            // 0x02 prefix before each component.
            $asn1 .= "x02";

            if (unpack('C', $c)[1] > 0x7f) {
                // Add 0x00 because first byte of component > 0x7f.
                // Length of component = ($c_len + 1).
                $asn1 .= pack('C', $c_len + 1) . "x00";
                $len += 2 + ($c_len + 1);
            } else {
                $asn1 .= pack('C', $c_len);
                $len += 2 + $c_len;
            }

            // Append formatted component to ASN.1 contents.
            $asn1 .= $c;
        }

        // 0x30 b1, then contents.
        return "x30" . pack('C', $len) . $asn1;
    }
}