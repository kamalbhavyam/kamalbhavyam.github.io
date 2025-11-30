document.addEventListener("DOMContentLoaded", function () {
    // Cache DOM elements
    const navLinks = document.querySelectorAll("nav ul li a");
    const header = document.querySelector("header");
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxSpinner = document.querySelector(".lightbox-spinner");
    const gallery = document.querySelector(".gallery");
    const hamburger = document.querySelector(".hamburger");
    const nav = document.querySelector("nav");
    const menuClose = document.querySelector(".menu-close");

    let currentIndex = 0;
    let allPhotos = []; // Will be populated after images are loaded
    let visiblePhotos = []; // Currently visible photos for lightbox navigation

    // Progressive image loading: thumb -> medium -> full (on click)
    // Lazy loading for medium-quality images using IntersectionObserver
    let observedImagesCount = 0;
    let loadedImagesCount = 0;

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                let imageProcessed = false;

                // Helper function to handle image load completion
                const handleImageProcessed = () => {
                    imageObserver.unobserve(img);
                    loadedImagesCount++;

                    // Disconnect observer when all images are loaded to prevent memory leak
                    if (loadedImagesCount >= observedImagesCount) {
                        imageObserver.disconnect();
                        console.log(`All images loaded (${loadedImagesCount}/${observedImagesCount}), IntersectionObserver disconnected`);
                    }
                };

                // Load thumbnail if not already loaded
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    // Also load srcset if present
                    if (img.dataset.srcset) {
                        img.srcset = img.dataset.srcset;
                        img.removeAttribute('data-srcset');
                    }
                    img.removeAttribute('data-src');
                    imageProcessed = true;

                    // Add error handler to prevent memory leak if image fails to load
                    img.onerror = () => {
                        console.warn('Failed to load image:', img.dataset.src || img.src);
                        handleImageProcessed();
                    };
                }

                // Upgrade thumbnails to medium quality ONLY if not eager-loaded
                // Eager-loaded images stay as thumbnails for fast LCP
                if (img.src.includes('/thumb/') && img.dataset.medium && !img.dataset.eager) {
                    const mediumSrc = img.dataset.medium;
                    const tempImg = new Image();
                    tempImg.onload = () => {
                        img.src = mediumSrc;
                    };
                    tempImg.onerror = () => {
                        console.warn('Failed to load medium quality image:', mediumSrc);
                        // Still count as processed even if medium quality fails
                        if (!imageProcessed) {
                            handleImageProcessed();
                        }
                    };
                    tempImg.src = mediumSrc;
                    // Only mark as processed if we didn't already process it above
                    if (!imageProcessed) {
                        imageProcessed = true;
                    }
                }

                // Unobserve and increment counter only once per image
                if (imageProcessed) {
                    handleImageProcessed();
                }
            }
        });
    }, {
        rootMargin: "800px 0px", // Start loading 800px before image enters viewport (AVIF decode time)
        threshold: 0.01
    });

    // Observe all lazy images
    function observeLazyImages() {
        const lazyImages = document.querySelectorAll("img[data-src]");
        const thumbImages = document.querySelectorAll("img[src*='/thumb/']:not([data-eager])");

        // Track total images to observe
        observedImagesCount = lazyImages.length + thumbImages.length;

        lazyImages.forEach(img => imageObserver.observe(img));
        thumbImages.forEach(img => imageObserver.observe(img));

        console.log(`Observing ${observedImagesCount} images for lazy loading`);
    }

    // Listen for custom event from imageLoader.js
    // This ensures we set up the observer AFTER images are in the DOM
    document.addEventListener('imagesLoaded', function(e) {
        console.log(`Received imagesLoaded event: ${e.detail.count} images`);
        // Initialize photos list after images are loaded
        updatePhotosList();
        // Set up lazy loading observer
        requestAnimationFrame(() => observeLazyImages());
    });

    // Navigation and filtering
    navLinks.forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const targetId = this.getAttribute("href").substring(1);
            filterImages(targetId);

            // Update active class
            navLinks.forEach(link => link.classList.remove("active"));
            this.classList.add("active");
        });
    });

    function filterImages(category) {
        const photoContainers = document.querySelectorAll(".photo");
        visiblePhotos = []; // Reset visible photos array

        photoContainers.forEach(photo => {
            const img = photo.querySelector("img");
            if (category === "home" || photo.dataset.category === category) {
                // Reset to default display (empty string)
                photo.style.display = "";
                if (img) visiblePhotos.push(img);
            } else {
                photo.style.display = "none";
            }
        });

        // Re-apply masonry layout after filtering
        // Dispatch custom event to trigger masonry re-layout
        const event = new CustomEvent('filterApplied');
        document.dispatchEvent(event);
    }

    // Initialize visible photos array
    function updatePhotosList() {
        allPhotos = Array.from(document.querySelectorAll(".photo img"));
        visiblePhotos = allPhotos.slice();
    }

    // Store last focused element for accessibility
    let lastFocusedElement = null;

    // Helper function to load image in lightbox
    function loadLightboxImage(src, alt) {
        lightboxImg.src = '';
        lightboxImg.alt = alt || 'Loading...';
        lightboxSpinner.classList.add('active');

        lightboxImg.onload = function() {
            lightboxSpinner.classList.remove('active');
        };
        lightboxImg.onerror = function() {
            lightboxSpinner.classList.remove('active');
            console.error('Failed to load lightbox image:', src);
        };

        lightboxImg.src = src;
    }

    // Lightbox functionality - use event delegation for better performance
    // Load full-resolution image in lightbox
    gallery.addEventListener("click", function(e) {
        const img = e.target.closest(".photo img");
        if (img) {
            // Use full-resolution image for lightbox (data-full attribute)
            const fullSrc = img.dataset.full || img.src || img.dataset.src;
            if (fullSrc && !fullSrc.includes('data:')) {
                // Store currently focused element
                lastFocusedElement = document.activeElement;

                lightbox.style.display = "flex";
                lightbox.setAttribute('aria-hidden', 'false');

                // Trigger animation after display is set
                requestAnimationFrame(() => {
                    lightbox.classList.add("active");
                });

                // Load the image using helper function
                loadLightboxImage(fullSrc, img.alt || 'Gallery image');

                currentIndex = visiblePhotos.indexOf(img);

                // Focus on close button for keyboard accessibility
                setTimeout(() => {
                    document.querySelector('.close').focus();
                }, 100);
            }
        }
    });

    // Close lightbox
    document.querySelector(".close").addEventListener("click", closeLightbox);

    // Close on background click
    lightbox.addEventListener("click", function(e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    function closeLightbox() {
        lightbox.classList.remove("active");
        lightbox.setAttribute('aria-hidden', 'true');
        lightboxSpinner.classList.remove('active'); // Hide spinner when closing

        // Wait for animation to complete before hiding
        setTimeout(() => {
            lightbox.style.display = "none";

            // Restore focus to last focused element for accessibility
            if (lastFocusedElement) {
                lastFocusedElement.focus();
                lastFocusedElement = null;
            }
        }, 400); // Match CSS transition duration
    }

    // Navigate images in lightbox
    document.querySelector(".prev").addEventListener("click", function (e) {
        e.stopPropagation();
        changeImage(-1);
    });

    document.querySelector(".next").addEventListener("click", function (e) {
        e.stopPropagation();
        changeImage(1);
    });

    function changeImage(direction) {
        if (visiblePhotos.length === 0) return;

        currentIndex += direction;
        if (currentIndex < 0) currentIndex = visiblePhotos.length - 1;
        if (currentIndex >= visiblePhotos.length) currentIndex = 0;

        const newImg = visiblePhotos[currentIndex];
        // Use full resolution for lightbox
        const fullSrc = newImg.dataset.full || newImg.src || newImg.dataset.src;

        if (fullSrc) {
            loadLightboxImage(fullSrc, newImg.alt || 'Gallery image');
        }
    }

    // Keyboard navigation for lightbox
    document.addEventListener("keydown", function(e) {
        if (lightbox.style.display === "flex") {
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowLeft") changeImage(-1);
            if (e.key === "ArrowRight") changeImage(1);
        }
    });

    // Touch/swipe support for mobile lightbox navigation
    let touchStartX = 0;
    let touchEndX = 0;
    const SWIPE_THRESHOLD = 50; // Minimum distance for swipe detection

    lightbox.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeDistance = touchEndX - touchStartX;

        // Swipe left - next image
        if (swipeDistance < -SWIPE_THRESHOLD) {
            changeImage(1);
        }
        // Swipe right - previous image
        else if (swipeDistance > SWIPE_THRESHOLD) {
            changeImage(-1);
        }
    }

    // Combined optimized scroll handler with throttling
    // Handles both header scrolled state and mobile hide/show behavior
    let scrollTimeout;
    let isScrolled = false;
    let lastScrollTop = 0;
    const SCROLL_THRESHOLD = 5;        // Minimum scroll distance to trigger hide/show
    const SCROLL_THROTTLE_MS = 100;    // Throttle scroll events to every 100ms
    const MOBILE_BREAKPOINT = 768;     // Mobile viewport width
    const HEADER_HIDE_THRESHOLD = 100; // Don't hide header when near top

    window.addEventListener('scroll', function() {
        // Throttle scroll events for performance
        if (scrollTimeout) return;

        scrollTimeout = setTimeout(() => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

            // Update scrolled state for styling
            const shouldBeScrolled = scrollTop > 50;
            if (shouldBeScrolled !== isScrolled) {
                isScrolled = shouldBeScrolled;
                header.classList.toggle("scrolled", isScrolled);
            }

            // Mobile-only: Hide header on scroll down, show on scroll up
            if (isMobile) {
                // Don't hide header at the very top of the page
                if (scrollTop < HEADER_HIDE_THRESHOLD) {
                    header.classList.remove('header-hidden');
                } else if (Math.abs(scrollTop - lastScrollTop) > SCROLL_THRESHOLD) {
                    // Check scroll direction
                    if (scrollTop > lastScrollTop) {
                        // Scrolling down - hide header
                        header.classList.add('header-hidden');
                    } else {
                        // Scrolling up - show header
                        header.classList.remove('header-hidden');
                    }
                    lastScrollTop = scrollTop;
                }
            } else {
                // Desktop: always show header
                header.classList.remove('header-hidden');
            }

            scrollTimeout = null;
        }, SCROLL_THROTTLE_MS);
    }, { passive: true });

    // Hamburger menu toggle (mobile only)
    if (hamburger && nav) {
        // Open menu
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = hamburger.classList.toggle('active');
            nav.classList.toggle('menu-open');

            // Update ARIA attributes for accessibility
            hamburger.setAttribute('aria-expanded', isOpen);
            nav.setAttribute('aria-hidden', !isOpen);
        });

        // Close menu with close button
        if (menuClose) {
            menuClose.addEventListener('click', function(e) {
                e.stopPropagation();
                hamburger.classList.remove('active');
                nav.classList.remove('menu-open');
                hamburger.setAttribute('aria-expanded', 'false');
                nav.setAttribute('aria-hidden', 'true');
            });
        }

        // Close menu when clicking on a nav link
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                nav.classList.remove('menu-open');
                hamburger.setAttribute('aria-expanded', 'false');
                nav.setAttribute('aria-hidden', 'true');

                // Update active state and aria-current
                navLinks.forEach(l => {
                    l.classList.remove('active');
                    l.removeAttribute('aria-current');
                });
                this.classList.add('active');
                this.setAttribute('aria-current', 'page');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
                hamburger.classList.remove('active');
                nav.classList.remove('menu-open');
                hamburger.setAttribute('aria-expanded', 'false');
                nav.setAttribute('aria-hidden', 'true');
            }
        });
    }

});
