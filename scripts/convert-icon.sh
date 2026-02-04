#!/bin/bash

# Script to convert JPG icon to PNG format for PWA
# Uses macOS built-in sips command

PUBLIC_DIR="$(cd "$(dirname "$0")/../public" && pwd)"
INPUT_FILE="$PUBLIC_DIR/menchies-icon.jpg"
OUTPUT_192="$PUBLIC_DIR/icon-192x192.png"
OUTPUT_512="$PUBLIC_DIR/icon-512x512.png"

echo "Converting icon to PNG format..."

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: $INPUT_FILE not found!"
    exit 1
fi

# Check if sips is available (macOS)
if command -v sips &> /dev/null; then
    echo "Using macOS sips command..."
    
    # Create 192x192 PNG icon
    sips -s format png -z 192 192 "$INPUT_FILE" --out "$OUTPUT_192"
    echo "✓ Created icon-192x192.png"
    
    # Create 512x512 PNG icon
    sips -s format png -z 512 512 "$INPUT_FILE" --out "$OUTPUT_512"
    echo "✓ Created icon-512x512.png"
    
    echo ""
    echo "✅ Icon conversion complete!"
    echo "Icons created:"
    echo "  - icon-192x192.png"
    echo "  - icon-512x512.png"
    
elif command -v convert &> /dev/null; then
    # Fallback to ImageMagick if available
    echo "Using ImageMagick convert command..."
    
    convert "$INPUT_FILE" -resize 192x192 -background white -gravity center -extent 192x192 "$OUTPUT_192"
    echo "✓ Created icon-192x192.png"
    
    convert "$INPUT_FILE" -resize 512x512 -background white -gravity center -extent 512x512 "$OUTPUT_512"
    echo "✓ Created icon-512x512.png"
    
    echo ""
    echo "✅ Icon conversion complete!"
    
else
    echo "Error: Neither 'sips' (macOS) nor 'convert' (ImageMagick) found!"
    echo "Please install ImageMagick or use the Node.js script with sharp."
    echo ""
    echo "To use Node.js script:"
    echo "  1. Run: npm install sharp --save-dev"
    echo "  2. Run: npm run convert-icon"
    exit 1
fi
