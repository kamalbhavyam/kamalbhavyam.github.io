#!/bin/bash

# Smart Image Processor - Processes NEW images and generates AVIF versions
# This script:
# - Checks if thumbnail and medium versions already exist
# - Generates both JPEG and AVIF versions for optimal performance
# - Extracts image dimensions for layout shift prevention
# - Only processes images that are missing versions

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Smart Image Processor for Portfolio${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null; then
    echo -e "${RED}Error: ImageMagick is not installed${NC}"
    echo -e "${YELLOW}Install it with: brew install imagemagick${NC}"
    exit 1
fi

# Create directories if they don't exist
mkdir -p images/thumb images/medium

# Counters
total_images=0
processed_images=0
skipped_images=0

# Array to store dimension data for JSON output
declare -a dimension_data

echo -e "${BLUE}Scanning for new images...${NC}"
echo ""

# Process all JPG images in the images directory
shopt -s nullglob
for img in images/*.jpg images/*.JPG images/*.jpeg images/*.JPEG; do
    # Skip if no files found
    [ -e "$img" ] || continue

    # Get filename without path and extension
    filename=$(basename "$img")
    filename_no_ext="${filename%.*}"

    # Check if AVIF versions already exist (primary format)
    thumb_avif_exists=false
    medium_avif_exists=false

    if [ -f "images/thumb/${filename_no_ext}.avif" ]; then
        thumb_avif_exists=true
    fi

    if [ -f "images/medium/${filename_no_ext}.avif" ]; then
        medium_avif_exists=true
    fi

    total_images=$((total_images + 1))

    # If both AVIF versions exist, skip this image
    if [ "$thumb_avif_exists" = true ] && [ "$medium_avif_exists" = true ]; then
        echo -e "${YELLOW}⏭  Skipping:${NC} $filename (already processed)"
        skipped_images=$((skipped_images + 1))
        continue
    fi

    # Process the image
    echo -e "${GREEN}✓ Processing:${NC} $filename"
    processed_images=$((processed_images + 1))

    # Create thumbnail versions if they don't exist (400px wide)
    if [ "$thumb_avif_exists" = false ]; then
        echo -e "  ${BLUE}→${NC} Creating thumbnail AVIF..."
        magick "$img" -resize 400x -quality 80 "images/thumb/${filename_no_ext}.avif"

        # Also create JPEG fallback
        echo -e "  ${BLUE}→${NC} Creating thumbnail JPEG fallback..."
        magick "$img" -resize 400x -quality 80 "images/thumb/$filename"
    else
        echo -e "  ${YELLOW}→${NC} Thumbnail exists, skipping"
    fi

    # Create medium versions if they don't exist (1200px wide)
    if [ "$medium_avif_exists" = false ]; then
        echo -e "  ${BLUE}→${NC} Creating medium AVIF..."
        magick "$img" -resize 1200x -quality 85 "images/medium/${filename_no_ext}.avif"

        # Also create JPEG fallback
        echo -e "  ${BLUE}→${NC} Creating medium JPEG fallback..."
        magick "$img" -resize 1200x -quality 85 "images/medium/$filename"
    else
        echo -e "  ${YELLOW}→${NC} Medium version exists, skipping"
    fi

    # Extract dimensions from thumbnail for layout shift prevention
    dimensions=$(magick identify -format "%w %h" "images/thumb/${filename_no_ext}.avif" 2>/dev/null || magick identify -format "%w %h" "images/thumb/$filename")
    width=$(echo $dimensions | cut -d' ' -f1)
    height=$(echo $dimensions | cut -d' ' -f2)

    if [ -n "$width" ] && [ -n "$height" ]; then
        echo -e "  ${BLUE}→${NC} Dimensions: ${width}x${height}"
        dimension_data+=("    { \"src\": \"$filename\", \"category\": \"landscape\", \"w\": $width, \"h\": $height }")
    fi

    echo ""
done

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Processing Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Total images found:     ${BLUE}$total_images${NC}"
echo -e "Images processed:       ${GREEN}$processed_images${NC}"
echo -e "Images skipped:         ${YELLOW}$skipped_images${NC}"
echo ""

if [ $processed_images -eq 0 ]; then
    echo -e "${GREEN}✓ All images are already optimized!${NC}"
else
    echo -e "${GREEN}✓ Successfully processed $processed_images new image(s)${NC}"
    echo ""

    # Output dimension data for easy copy-paste into images-data.json
    if [ ${#dimension_data[@]} -gt 0 ]; then
        echo -e "${BLUE}New image data for images-data.json:${NC}"
        echo -e "${YELLOW}(Copy and paste into your images-data.json file)${NC}"
        echo ""
        for entry in "${dimension_data[@]}"; do
            echo "$entry,"
        done
        echo ""
    fi

    echo -e "${BLUE}Next steps:${NC}"
    echo -e "1. Copy the dimension data above into images-data.json"
    echo -e "2. Update the category field for each image (landscape/portraits/wildlife/astro)"
    echo -e "3. Test your portfolio to ensure images load correctly"
    echo -e "4. Commit and push to GitHub"
fi

echo ""

