/**
 * Image Loader Module
 * Loads image data from JSON and renders gallery with progressive loading
 * - Eager loads first few images for LCP optimization
 * - Lazy loads remaining images with IntersectionObserver
 * - Supports AVIF format with JPEG fallback
 */

// Configuration constants
const CONFIG = {
    EAGER_LOAD_COUNT_DESKTOP: 9,  // Desktop (3 columns): Load first 9 images (~3 rows)
    EAGER_LOAD_COUNT_MOBILE: 6,   // Mobile (2 columns): Load first 6 images (~3 rows)
    HIGH_PRIORITY_COUNT: 3,       // Number of images to mark as high priority
    MOBILE_BREAKPOINT: 768,       // Viewport width for mobile detection
    DATA_SOURCE: 'images-data.json'
};

document.addEventListener("DOMContentLoaded", function () {
    // Load image data from JSON file
    fetch(CONFIG.DATA_SOURCE)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load image data: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.images || !Array.isArray(data.images)) {
                throw new Error('Invalid image data format');
            }
            loadImages(data.images);
        })
        .catch(error => {
            console.error('Error loading images:', error);
            // Display user-friendly error message
            const gallery = document.querySelector(".gallery");
            if (gallery) {
                gallery.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Unable to load images. Please refresh the page.</p>';
            }
        });

    /**
     * Get indices of images to eager load
     * For masonry layout, the top 3 images are always: hero1 (0), iceland1 (1), iceland2 (2)
     * @returns {Set} Set of indices to eager load
     */
    function getEagerLoadIndices() {
        // Top row images that need high priority for LCP
        const highPriorityIndices = [0, 1, 2]; // hero1, iceland1, iceland2

        // Eager load more images for better initial render
        const eagerCount = window.innerWidth <= CONFIG.MOBILE_BREAKPOINT
            ? CONFIG.EAGER_LOAD_COUNT_MOBILE
            : CONFIG.EAGER_LOAD_COUNT_DESKTOP;

        const eagerIndices = new Set();
        for (let i = 0; i < eagerCount; i++) {
            eagerIndices.add(i);
        }

        return { eagerIndices, highPriorityIndices };
    }

    /**
     * Load images into gallery (CSS multi-column handles distribution)
     * @param {Array} images - Array of image objects with src, category, w, h properties
     */
    function loadImages(images) {
        const gallery = document.querySelector(".gallery");

        if (!gallery) {
            console.error('Gallery element not found');
            return;
        }

        // Clear gallery
        gallery.innerHTML = '';

        // Get eager load indices
        const { eagerIndices, highPriorityIndices } = getEagerLoadIndices();

        // Create image elements
        images.forEach((img, index) => {
            // Validate image data
            if (!img.src || !img.category) {
                console.warn('Invalid image data:', img);
                return;
            }

            // Check if this image should be eager loaded
            const isEager = eagerIndices.has(index);
            const isHighPriority = highPriorityIndices.includes(index);

            // Create photo container
            const photoDiv = document.createElement('div');
            photoDiv.className = 'photo';
            photoDiv.dataset.category = img.category;

            // Get file name without extension for AVIF
            const fileNameWithoutExt = img.src.replace(/\.(jpg|JPG|jpeg|JPEG)$/, '');

            // Create image element
            const imgElement = document.createElement('img');

            // Set dimensions to prevent layout shift
            if (img.w && img.h) {
                imgElement.width = img.w;
                imgElement.height = img.h;
            }

            // Add load event to stop shimmer animation
            imgElement.addEventListener('load', function() {
                photoDiv.classList.add('loaded');
            });

            if (isEager) {
                // Eager load first images with AVIF thumbnails for fast LCP
                imgElement.src = `images/thumb/${fileNameWithoutExt}.avif`;
                imgElement.srcset = `images/thumb/${fileNameWithoutExt}.avif 400w, images/medium/${fileNameWithoutExt}.avif 1200w`;
                imgElement.sizes = '(max-width: 900px) 50vw, 33vw';

                // Mark top row images (hero1, iceland1, iceland2) as high priority
                if (isHighPriority) {
                    imgElement.fetchPriority = 'high';
                }
                imgElement.dataset.eager = 'true';
            } else {
                // Lazy load remaining images with AVIF
                imgElement.dataset.src = `images/thumb/${fileNameWithoutExt}.avif`;
                imgElement.dataset.srcset = `images/thumb/${fileNameWithoutExt}.avif 400w, images/medium/${fileNameWithoutExt}.avif 1200w`;
                imgElement.sizes = '(max-width: 900px) 50vw, 33vw';
                imgElement.loading = 'lazy';
            }

            // Store medium AVIF for progressive loading and full JPEG for lightbox
            imgElement.dataset.medium = `images/medium/${fileNameWithoutExt}.avif`;
            imgElement.dataset.full = `images/${img.src}`;
            imgElement.alt = `${img.category} photo`;
            imgElement.decoding = 'async';

            photoDiv.appendChild(imgElement);

            // Add to gallery
            gallery.appendChild(photoDiv);
        });

        // Apply masonry layout after DOM is updated
        // Use requestAnimationFrame to ensure DOM has been painted
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                applyMasonryLayout();
            });
        });

        // Dispatch custom event to notify that images are loaded
        // This allows script.js to set up IntersectionObserver after images are in DOM
        const event = new CustomEvent('imagesLoaded', {
            detail: { count: images.length }
        });
        document.dispatchEvent(event);
    }

    /**
     * Get breakpoint values from CSS custom properties
     */
    function getBreakpoints() {
        const rootStyles = getComputedStyle(document.documentElement);
        return {
            mobile: parseInt(rootStyles.getPropertyValue('--breakpoint-mobile')) || 768,
            tablet: parseInt(rootStyles.getPropertyValue('--breakpoint-tablet')) || 900
        };
    }

    /**
     * Apply masonry layout by positioning images in columns
     */
    function applyMasonryLayout() {
        const gallery = document.querySelector('.gallery');
        if (!gallery) return;

        // Only position visible photos (not display:none)
        const allPhotos = Array.from(gallery.querySelectorAll('.photo'));
        const photos = allPhotos.filter(photo => photo.style.display !== 'none');

        if (photos.length === 0) return;

        // Determine number of columns based on viewport (same as CSS multi-column)
        const breakpoints = getBreakpoints();
        const isMobile = window.innerWidth <= breakpoints.mobile;
        const isTablet = window.innerWidth <= breakpoints.tablet && window.innerWidth > breakpoints.mobile;
        const columnCount = isMobile || isTablet ? 2 : 3;

        // Calculate column width exactly like CSS multi-column does
        // Get the computed padding to subtract from clientWidth
        const computedStyle = window.getComputedStyle(gallery);
        const paddingLeft = parseFloat(computedStyle.paddingLeft);
        const paddingRight = parseFloat(computedStyle.paddingRight);
        const availableWidth = gallery.clientWidth - paddingLeft - paddingRight;

        // Read gap from CSS custom property
        const rootStyles = getComputedStyle(document.documentElement);
        const gap = parseInt(rootStyles.getPropertyValue('--column-gap')) || 9;
        const totalGaps = gap * (columnCount - 1);
        const columnWidth = (availableWidth - totalGaps) / columnCount;

        // Initialize column heights
        const columnHeights = new Array(columnCount).fill(0);

        // Position each visible photo
        photos.forEach((photo, index) => {
            const img = photo.querySelector('img');

            // Use getAttribute to get original dimensions, not rendered dimensions
            const originalWidth = parseInt(img.getAttribute('width'));
            const originalHeight = parseInt(img.getAttribute('height'));

            if (!originalWidth || !originalHeight) {
                console.warn('Missing dimensions for image:', img.src || img.dataset.src);
                return;
            }

            // Find shortest column
            const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));

            // Calculate scaled height based on original dimensions
            const scaleFactor = columnWidth / originalWidth;
            const scaledHeight = originalHeight * scaleFactor;

            // Position the photo (add paddingLeft to account for gallery padding)
            const left = paddingLeft + (shortestColumn * (columnWidth + gap));
            const top = columnHeights[shortestColumn];

            photo.style.left = `${left}px`;
            photo.style.top = `${top}px`;
            photo.style.width = `${columnWidth}px`;

            // Update column height
            columnHeights[shortestColumn] += scaledHeight + gap;
        });

        // Set gallery height to tallest column
        const tallestColumn = Math.max(...columnHeights);
        gallery.style.height = `${tallestColumn}px`;
    }

    // Re-layout on window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(applyMasonryLayout, 100);
    });

    // Re-layout when filter is applied
    document.addEventListener('filterApplied', () => {
        // Small delay to ensure display:none is applied first
        setTimeout(applyMasonryLayout, 10);
    });
});