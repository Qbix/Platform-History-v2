<?php

namespace Elphin\IcoFileLoader;

/**
 * Holds data on an image within an Icon
 */
class IconImage
{
    /**
     * @var integer Width, in pixels, of the image
     */
    public $width;
    /**
     * @var integer Height, in pixels, of the image
     */
    public $height;
    /**
     * @var integer Number of colors in image
     */
    public $colorCount;
    /**
     * @var integer Reserved ( must be 0)
     */
    public $reserved;
    /**
     * @var integer Color Planes
     */
    public $planes;
    /**
     * @var integer bits per pixel
     */
    public $bitCount;
    /**
     * @var integer How many bytes in this resource?
     */
    public $sizeInBytes;
    /**
     * @var integer Where in the file is this image?
     */
    public $fileOffset;

    /**
     * @var integer size of BITMAPINFOHEADER structure
     */
    public $bmpHeaderSize;

    /**
     * @var integer image width from BITMAPINFOHEADER
     */
    public $bmpHeaderWidth;

    /**
     * @var integer image height from BITMAPINFOHEADER
     */
    public $bmpHeaderHeight;

    /**
     * @var string PNG file for icon images which use PNG
     */
    public $pngData = null;

    /**
     * @var string BMP bitmap data for images which use BMP
     */
    public $bmpData = null;

    public $palette = [];

    /**
     * IconEntry constructor.
     * @param array $data array of data extracted from a ICONDIRENTRY binary structure
     */
    public function __construct($data)
    {
        foreach ($data as $name => $value) {
            $this->$name = $value;
        }
    }

    public function getDescription()
    {
        return sprintf(
            '%dx%d pixel %s @ %d bits/pixel',
            $this->width,
            $this->height,
            $this->isPng() ? 'PNG' : 'BMP',
            $this->bitCount
        );
    }

    /**
     * Stores binary PNG file for the icon
     * @param string $pngData
     */
    public function setPngFile($pngData)
    {
        $this->pngData = $pngData;
    }

    public function isPng()
    {
        return !empty($this->pngData);
    }

    public function isBmp()
    {
        return empty($this->pngData);
    }

    public function setBitmapInfoHeader($bmpInfo)
    {
        //bit depth can be zero in the ICONDIRENTRY, we trust the bitmap header more...
        $this->bitCount = $bmpInfo['BitCount'];

        //we need this to calculate offsets when rendering
        $this->bmpHeaderWidth = $bmpInfo['Width'];
        $this->bmpHeaderHeight = $bmpInfo['Height'];
        $this->bmpHeaderSize = $bmpInfo['Size'];
    }

    public function setBitmapData($bmpData)
    {
        $this->bmpData = $bmpData;
    }

    public function addToBmpPalette($r, $g, $b, $reserved)
    {
        $this->palette[] = ['red' => $r, 'green' => $g, 'blue' => $b, 'reserved' => $reserved];
    }
}
