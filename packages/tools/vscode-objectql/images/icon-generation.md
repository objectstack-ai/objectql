# Icon Generation Guide

The extension icon needs to be in PNG format (128x128 pixels).

## Using Online Converters

1. Go to https://cloudconvert.com/svg-to-png
2. Upload `images/icon.svg`
3. Set dimensions to 128x128
4. Download and save as `images/icon.png`

## Using ImageMagick (if available)

```bash
convert -background none -resize 128x128 images/icon.svg images/icon.png
```

## Using Node.js sharp library

```bash
npm install sharp
node -e "require('sharp')('images/icon.svg').resize(128,128).toFile('images/icon.png')"
```

## Temporary Workaround

For now, we've included the SVG. To complete the extension:
1. Convert icon.svg to icon.png using one of the methods above
2. Update package.json if needed
