#!/bin/bash

# Check for Inkscape
if ! command -v inkscape &> /dev/null; then
   echo "Inkscape is not installed. Please install it first:"
   echo "For Ubuntu/Debian: sudo apt-get install inkscape"
   echo "For MacOS: brew install inkscape"
   exit 1
fi

# Convert SVG to PNGs
for size in 16 48 128; do
   inkscape --export-type=png \
            --export-filename=icon${size}.png \
            --export-width=${size} \
            --export-height=${size} \
            icon.svg
done
