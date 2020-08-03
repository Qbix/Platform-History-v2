<?php

namespace Elphin\IcoFileLoader;

/**
 * Provides a service for loading .ico files from files or from binary strings
 * If fopen wrappers are enabled, you can load from a URL also
 */
class IcoFileService
{
    /**
     * @var ParserInterface
     */
    protected $parser;

    /**
     * @var RendererInterface
     */
    protected $renderer;

    /**
     * IcoFileService constructor
     *
     * You can inject alternative implementations of the renderer or parser, but for most
     * typical uses, you can accept the defaults.
     *
     * @param RendererInterface|null $renderer
     * @param ParserInterface|null $parser
     */
    public function __construct(RendererInterface $renderer = null, ParserInterface $parser = null)
    {
        $this->parser = $parser ?: new IcoParser();
        $this->renderer = $renderer ?: new GdRenderer();
    }

    /**
     * This is a useful one-stop function for obtaining the best possible icon of a particular size from an .ico file
     *
     * As icons are often hand-crafted to look good at particular sizes, this will try to use the best quality image
     * in the icon at the required size. If it can't be found, then it will resize the largest icon it can find.
     *
     * This will either return a valid image, or will throw an \InvalidArgumentException in the event of the file
     * being unreadable.
     *
     * @param string $dataOrFile Either a filename to a .ico file, or binary data from an .ico file in a string
     * @param integer $w Desired width. The class tries to locate the best quality image at this size, but
     *                            if not found, the largest available icon will be used and resized to fit.
     * @param integer $h Desired height - as icons are usually square, this should be same as $w.
     * @param array $opts Array of renderer options. The built in renderer supports an optional 'background'
     *                            elemen in this array. Normally, the result will use alpha transparency, but you can
     *                            pass a hex colour to choose the colour of the transparent area instead, e.g.
     *                            ['background=>'#ffffff'] for a white background.
     * @return mixed              The built in renderer will return a gd image resource, which you could save with
     *                            the gd function imagepng(), for example. If you swap in an alternative renderer,
     *                            the result is whatever that renderer returns.
     * @throws \DomainException if icon does not contain any images.
     * @throws \InvalidArgumentException if file is not found or is invalid.
     */
    public function extractIcon($dataOrFile, $w, $h, array $opts = null)
    {
        $icon = $this->from($dataOrFile);
        $image = $icon->findBestForSize($w, $h);
        if (!$image) {
            //nothing at our required size, so we'll find the highest quality icon
            $image = $icon->findBest();
        }
        if (!$image) {
            throw new \DomainException('Icon does not contain any images.');
        }
        return $this->renderImage($image, $w, $h, $opts);
    }

    /**
     * Renders an IconImage at a desired width and height.
     *
     * @param IconImage $image Image obtained from an Icon object.
     * @param integer $w Desired width - if null, width of IconImage is used.
     * @param integer $h Desired height - if null, height of IconImage is used.
     * @param array $opts Array of renderer options. The built in renderer supports an optional 'background'
     *                            element in this array. Normally, the result will use alpha transparency, but you can
     *                            pass a hex colour to choose the colour of the transparent area instead, e.g.
     *                            ['background=>'#ffffff'] for a white background.
     * @return mixed              The built in renderer will return a gd image resource, which you could save with
     *                            the gd function imagepng(), for example. If you swap in an alternative renderer,
     *                            the result is whatever that renderer returns.
     * @throws \InvalidArgumentException if IconImage or options are invalid.
     */
    public function renderImage(IconImage $image, $w = null, $h = null, array $opts = null)
    {
        $opts = is_array($opts) ? $opts : [];
        $opts['w'] = $w;
        $opts['h'] = $h;
        return $this->renderer->render($image, $opts);
    }

    /**
     * Parses a .ico file from a pathname or binary data string and return an Icon object.
     *
     * This is a useful lower level member which can be used to inspect an icon before
     * rendering a particular image within it with renderImage.
     *
     * @param string $dataOrFile Either filename or binary data.
     * @return Icon
     * @throws \InvalidArgumentException if file is not found or invalid
     */
    public function from($dataOrFile)
    {
        if ($this->parser->isSupportedBinaryString($dataOrFile)) {
            return $this->parser->parse($dataOrFile);
        }
        return $this->fromFile($dataOrFile);
    }

    /**
     * Loads icon from file.
     *
     * @param string $file filename or URL (if fopen wrappers installed)
     * @return Icon
     * @throws \InvalidArgumentException if file is not found or invalid
     */
    public function fromFile($file)
    {
        try {
            $data = file_get_contents($file);
            if ($data !== false) {
                return $this->parser->parse($data);
            }
            throw new \InvalidArgumentException("file could not be loaded");
        } catch (\Exception $e) {
            throw new \InvalidArgumentException("file could not be loaded (" . $e->getMessage() . ")");
        }
    }

    /**
     * Loads icon from string.
     *
     * @param string $data binary data string containing a .ico file
     * @return Icon
     * @throws \InvalidArgumentException if file is not found or invalid
     */
    public function fromString($data)
    {
        return $this->parser->parse($data);
    }
}
