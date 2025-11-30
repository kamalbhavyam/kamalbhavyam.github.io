#!/bin/bash

# Smart Image Processor - Processes NEW images and generates AVIF versions
# This script:
# - Checks if thumbnail and medium versions already exist
# - Generates AVIF versions only (no JPEG fallbacks)
# - Extracts image dimensions for layout shift prevention
# - Only processes images that are missing versions
# - Automatically updates images-data.json with new images after first 6 entries

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

# Check if jq is installed (for JSON manipulation)
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed${NC}"
    echo -e "${YELLOW}Install it with: brew install jq${NC}"
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

    # Create thumbnail versions if they don't exist (400px wide, AVIF only)
    if [ "$thumb_avif_exists" = false ]; then
        echo -e "  ${BLUE}→${NC} Creating thumbnail AVIF..."
        magick "$img" -resize 400x -quality 80 "images/thumb/${filename_no_ext}.avif"
    else
        echo -e "  ${YELLOW}→${NC} Thumbnail exists, skipping"
    fi

    # Create medium versions if they don't exist (1200px wide, AVIF only)
    if [ "$medium_avif_exists" = false ]; then
        echo -e "  ${BLUE}→${NC} Creating medium AVIF..."
        magick "$img" -resize 1200x -quality 85 "images/medium/${filename_no_ext}.avif"
    else
        echo -e "  ${YELLOW}→${NC} Medium version exists, skipping"
    fi

    # Extract dimensions from thumbnail for layout shift prevention
    dimensions=$(magick identify -format "%w %h" "images/thumb/${filename_no_ext}.avif")
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

    # Automatically update images-data.json
    if [ ${#dimension_data[@]} -gt 0 ]; then
        echo -e "${BLUE}Updating images-data.json...${NC}"

        # Create a temporary JSON array of new images
        temp_new_images="["
        for i in "${!dimension_data[@]}"; do
            entry="${dimension_data[$i]}"
            # Remove leading spaces and add proper formatting
            entry=$(echo "$entry" | sed 's/^[[:space:]]*//')
            temp_new_images+="$entry"
            # Add comma if not the last element
            if [ $i -lt $((${#dimension_data[@]} - 1)) ]; then
                temp_new_images+=","
            fi
        done
        temp_new_images+="]"

        # Save the new images JSON to a temp file
        echo "$temp_new_images" > /tmp/new_images.json

        # Use jq to insert new images after the first 6 entries
        # Keep first 6 images, add new images, then add remaining images
        jq --slurpfile new /tmp/new_images.json \
           '.images = (.images[:6] + $new[0] + .images[6:])' \
           images-data.json > /tmp/images-data-updated.json

        # Backup original file
        cp images-data.json images-data.json.backup

        # Replace with updated file
        mv /tmp/images-data-updated.json images-data.json

        # Clean up temp files
        rm /tmp/new_images.json

        echo -e "${GREEN}✓ images-data.json updated successfully!${NC}"
        echo -e "${YELLOW}  → First 6 images remain fixed${NC}"
        echo -e "${YELLOW}  → ${#dimension_data[@]} new image(s) inserted after position 6${NC}"
        echo -e "${YELLOW}  → Backup saved as images-data.json.backup${NC}"
        echo ""

        echo -e "${BLUE}New images added:${NC}"
        for entry in "${dimension_data[@]}"; do
            # Extract filename from the entry
            filename=$(echo "$entry" | grep -o '"src": "[^"]*"' | cut -d'"' -f4)
            echo -e "  ${GREEN}→${NC} $filename"
        done
        echo ""
    fi

    echo -e "${BLUE}Next steps:${NC}"
    echo -e "1. Review images-data.json to verify the changes"
    echo -e "2. Update the category field for new images if needed (landscape/portraits/wildlife/astro)"
    echo -e "3. Test your portfolio to ensure images load correctly"
    echo -e "4. Commit and push to GitHub"
fi

echo ""

