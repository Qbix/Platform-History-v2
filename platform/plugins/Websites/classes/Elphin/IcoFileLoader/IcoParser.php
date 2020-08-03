<?php

namespace Elphin\IcoFileLoader;

/**
 * IcoParser provides the means to read an ico file and produce an Icon object
 * containing an IconImage objects for each image in the ico file
 *
 * @package Elphin\IcoFileLoader
 */
class IcoParser implements ParserInterface
{
    /**
     * @inheritdoc
     */
    public function isSupportedBinaryString($data)
    {
        $supported = !is_null($this->parseIconDir($data));
        $supported = $supported || $this->isPNG($data);
        return $supported;
    }

    /**
     * Reads the ICONDIR header and verifies it looks sane
     * @param string $data
     * @return array|null - null is returned if the file doesn't look like an .ico file
     */
    private function parseIconDir($data)
    {
        $icondir = unpack('SReserved/SType/SCount', $data);
        if ($icondir['Reserved'] == 0 && $icondir['Type'] == 1) {
            return $icondir;
        }
        return null;
    }

    /**
     * @param $data
     * @return bool true if first four bytes look like a PNG
     */
    private function isPNG($data)
    {
        $signature = unpack('LFourCC', $data);
        return ($signature['FourCC'] == 0x474e5089);
    }

    /**
     * @inheritdoc
     */
    public function parse($data)
    {
        if ($this->isPNG($data)) {
            return $this->parsePNGAsIco($data);
        }
        return $this->parseICO($data);
    }

    private function parseICO($data)
    {
        $icondir = $this->parseIconDir($data);
        if (!$icondir) {
            throw new \InvalidArgumentException('Invalid ICO file format');
        }

        //nibble the header off our data
        $data = substr($data, 6);

        //parse the ICONDIRENTRY headers
        $icon = new Icon();
        $data = $this->parseIconDirEntries($icon, $data, $icondir['Count']);

        // Extract additional headers for each extracted ICONDIRENTRY
        $iconCount = count($icon);
        for ($i = 0; $i < $iconCount; ++$i) {
            if ($this->isPNG(substr($data, $icon[$i]->fileOffset, 4))) {
                $this->parsePng($icon[$i], $data);
            } else {
                $this->parseBmp($icon[$i], $data);
            }
        }

        return $icon;
    }

    private function parsePNGAsIco($data)
    {
        $png = imagecreatefromstring($data);
        $w = imagesx($png);
        $h = imagesy($png);
        $bits = imageistruecolor($png) ? 32 : 8;
        imagedestroy($png);

        //fake enough header data for IconImage to do its job
        $icoDirEntry = [
            'width' => $w,
            'height' => $h,
            'bitCount' => $bits
        ];

        //create the iconimage and give it the PNG data
        $image = new IconImage($icoDirEntry);
        $image->setPngFile($data);

        $icon = new Icon();
        $icon[] = $image;
        return $icon;
    }

    /**
     * Parse the sequence of ICONDIRENTRY structures
     * @param Icon $icon
     * @param string $data
     * @param integer $count
     * @return string
     */
    private function parseIconDirEntries(Icon $icon, $data, $count)
    {
        for ($i = 0; $i < $count; ++$i) {
            $icoDirEntry = unpack(
                'Cwidth/Cheight/CcolorCount/Creserved/Splanes/SbitCount/LsizeInBytes/LfileOffset',
                $data
            );
            $icoDirEntry['fileOffset'] -= ($count * 16) + 6;
            if ($icoDirEntry['colorCount'] == 0) {
                $icoDirEntry['colorCount'] = 256;
            }
            if ($icoDirEntry['width'] == 0) {
                $icoDirEntry['width'] = 256;
            }
            if ($icoDirEntry['height'] == 0) {
                $icoDirEntry['height'] = 256;
            }

            $entry = new IconImage($icoDirEntry);
            $icon[] = $entry;

            $data = substr($data, 16);
        }

        return $data;
    }

    /**
     * Handle icon image which is PNG formatted
     * @param IconImage $entry
     * @param string $data
     */
    private function parsePng(IconImage $entry, $data)
    {
        //a png icon contains a complete png image at the file offset
        $png = substr($data, $entry->fileOffset, $entry->sizeInBytes);
        $entry->setPngFile($png);
    }

    /**
     * Handle icon image which is BMP formatted
     * @param IconImage $entry
     * @param string $data
     */
    private function parseBmp(IconImage $entry, $data)
    {
        $bitmapInfoHeader = unpack(
            'LSize/LWidth/LHeight/SPlanes/SBitCount/LCompression/LImageSize/' .
            'LXpixelsPerM/LYpixelsPerM/LColorsUsed/LColorsImportant',
            substr($data, $entry->fileOffset, 40)
        );

        $entry->setBitmapInfoHeader($bitmapInfoHeader);

        switch ($entry->bitCount) {
            case 32:
            case 24:
                $this->parseTrueColorImageData($entry, $data);
                break;
            case 8:
            case 4:
            case 1:
                $this->parsePaletteImageData($entry, $data);
                break;
        }
    }

    /**
     * Parse an image which doesn't use a palette
     * @param IconImage $entry
     * @param string $data
     */
    private function parseTrueColorImageData(IconImage $entry, $data)
    {
        $length = $entry->bmpHeaderWidth * $entry->bmpHeaderHeight * ($entry->bitCount / 8);
        $bmpData = substr($data, $entry->fileOffset + $entry->bmpHeaderSize, $length);
        $entry->setBitmapData($bmpData);
    }

    /**
     * Parse an image which uses a limited palette of colours
     * @param IconImage $entry
     * @param string $data
     */
    private function parsePaletteImageData(IconImage $entry, $data)
    {
        $pal = substr($data, $entry->fileOffset + $entry->bmpHeaderSize, $entry->colorCount * 4);
        $idx = 0;
        for ($j = 0; $j < $entry->colorCount; ++$j) {
            $entry->addToBmpPalette(ord($pal[$idx + 2]), ord($pal[$idx + 1]), ord($pal[$idx]), ord($pal[$idx + 3]));
            $idx += 4;
        }

        $length = $entry->bmpHeaderWidth * $entry->bmpHeaderHeight * (1 + $entry->bitCount) / $entry->bitCount;
        $bmpData = substr($data, $entry->fileOffset + $entry->bmpHeaderSize + $entry->colorCount * 4, $length);
        $entry->setBitmapData($bmpData);
    }
}
