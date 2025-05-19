// Mobile menu toggle
document.getElementById('menu-btn').addEventListener('click', () => {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
});

// Scroll animations for sections
const sections = document.querySelectorAll('section');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.2 });

sections.forEach(section => {
    observer.observe(section);
});

// Carousel functionality (for Calendar, News, and Coaches)
function setupCarousel(carouselId) {
    console.log(`Initializing carousel: ${carouselId}`);
    const carousel = document.getElementById(carouselId);
    if (!carousel) {
        console.error(`Carousel with ID ${carouselId} not found`);
        return;
    }

    let currentIndex = 0;
    const items = carousel.children;
    const totalItems = items.length;
    console.log(`Total items in ${carouselId}: ${totalItems}`);

    // Move carousel to specific index
    function moveCarousel() {
        console.log(`Moving ${carouselId} to index ${currentIndex}`);
        carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    // Auto-scroll every 5 seconds
    let autoScroll = setInterval(() => {
        console.log(`Auto-scrolling ${carouselId} to index ${currentIndex + 1}`);
        currentIndex = (currentIndex + 1) % totalItems;
        moveCarousel();
    }, 5000);

    // Pause auto-scroll on hover
    carousel.parentElement.addEventListener('mouseenter', () => {
        console.log(`Pausing auto-scroll for ${carouselId}`);
        clearInterval(autoScroll);
    });
    carousel.parentElement.addEventListener('mouseleave', () => {
        console.log(`Resuming auto-scroll for ${carouselId}`);
        autoScroll = setInterval(() => {
            currentIndex = (currentIndex + 1) % totalItems;
            moveCarousel();
        }, 5000);
    });

    // Swipe functionality
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', (e) => {
        console.log(`Touch start on ${carouselId}`);
        touchStartX = e.changedTouches[0].screenX;
        clearInterval(autoScroll); // Pause auto-scroll during swipe
    });

    carousel.addEventListener('touchmove', (e) => {
        touchEndX = e.changedTouches[0].screenX;
    });

    carousel.addEventListener('touchend', () => {
        console.log(`Touch end on ${carouselId}`);
        const swipeDistance = touchEndX - touchStartX;
        const minSwipeDistance = 50; // Minimum distance for a swipe

        if (swipeDistance > minSwipeDistance) {
            // Swipe right (previous)
            console.log(`Swiping right on ${carouselId}`);
            currentIndex = (currentIndex - 1 + totalItems) % totalItems;
        } else if (swipeDistance < -minSwipeDistance) {
            // Swipe left (next)
            console.log(`Swiping left on ${carouselId}`);
            currentIndex = (currentIndex + 1) % totalItems;
        }

        moveCarousel();

        // Resume auto-scroll after swipe
        autoScroll = setInterval(() => {
            currentIndex = (currentIndex + 1) % totalItems;
            moveCarousel();
        }, 5000);
    });
}

// Initialize carousels after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    setupCarousel('calendar-items');
    setupCarousel('news-items');
    setupCarousel('coaches-items');
});