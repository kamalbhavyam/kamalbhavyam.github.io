document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll("nav ul li a");
    const photos = document.querySelectorAll(".photo img");
    const photoLoad = document.querySelectorAll(".photo");
    const header = document.querySelector("header");
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    let currentIndex = 0;

    // Lazy loading for images
    const lazyImages = document.querySelectorAll("img[loading='lazy']");
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                observer.unobserve(img);
            }
        });
    }, { rootMargin: "0px 0px 100px 0px" });

    lazyImages.forEach(img => {
        observer.observe(img);
    });

    // Detect image aspect ratio & apply classes
    function applyMasonryLayout() {
        photos.forEach(img => {
            img.onload = function () {
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                if (aspectRatio > 1.2) {
                    img.parentElement.classList.add("landscape");
                } else {
                    img.parentElement.classList.add("portrait");
                }
            };
        });
    }

    applyMasonryLayout();
    window.addEventListener("resize", applyMasonryLayout);

    // Smooth scrolling & active link highlight
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
            photoLoad.forEach(photo => {
                if (category === "home" || photo.dataset.category === category) {
                    photo.style.display = "block";  // Show matching images
                } else {
					photo.style.display = "none";  // Hide non-matching images
                }
            });
    }

    // Image click to open lightbox
    photos.forEach((img, index) => {
        img.addEventListener("click", function () {
            lightbox.style.display = "flex";
            lightboxImg.src = img.src;
            currentIndex = index;
        });
    });

    // Close lightbox
    document.querySelector(".close").addEventListener("click", function () {
        lightbox.style.display = "none";
    });

    // Navigate images
    document.querySelector(".prev").addEventListener("click", function () {
        changeImage(-1);
    });
    document.querySelector(".next").addEventListener("click", function () {
        changeImage(1);
    });

    function changeImage(direction) {
        currentIndex += direction;
        if (currentIndex < 0) currentIndex = photos.length - 1;
        if (currentIndex >= photos.length) currentIndex = 0;
        lightboxImg.src = photos[currentIndex].src;
    }

    // Change header background on scroll
    window.addEventListener("scroll", function () {
        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    });

});
