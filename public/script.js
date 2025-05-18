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

// Carousel functionality (generic for Calendar, News, and Coaches)
function setupCarousel(carouselId, prevBtnId, nextBtnId) {
    const carousel = document.getElementById(carouselId);
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);
    let currentIndex = 0;
    const items = carousel.children;
    const totalItems = items.length;

    // Move carousel to specific index
    function moveCarousel() {
        carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    // Button controls
    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % totalItems;
        moveCarousel();
    });

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + totalItems) % totalItems;
        moveCarousel();
    });

    // Auto-scroll every 5 seconds
    let autoScroll = setInterval(() => {
        currentIndex = (currentIndex + 1) % totalItems;
        moveCarousel();
    }, 5000);

    // Pause auto-scroll on hover
    carousel.parentElement.addEventListener('mouseenter', () => clearInterval(autoScroll));
    carousel.parentElement.addEventListener('mouseleave', () => {
        autoScroll = setInterval(() => {
            currentIndex = (currentIndex + 1) % totalItems;
            moveCarousel();
        }, 5000);
    });

    // Swipe functionality
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        clearInterval(autoScroll); // Pause auto-scroll during swipe
    });

    carousel.addEventListener('touchmove', (e) => {
        touchEndX = e.changedTouches[0].screenX;
    });

    carousel.addEventListener('touchend', () => {
        const swipeDistance = touchEndX - touchStartX;
        const minSwipeDistance = 50; // Minimum distance for a swipe

        if (swipeDistance > minSwipeDistance) {
            // Swipe right (previous)
            currentIndex = (currentIndex - 1 + totalItems) % totalItems;
        } else if (swipeDistance < -minSwipeDistance) {
            // Swipe left (next)
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

// Initialize carousels
setupCarousel('calendar-items', 'calendar-prev-btn', 'calendar-next-btn');
setupCarousel('news-items', 'news-prev-btn', 'news-next-btn');
setupCarousel('coaches-items', 'coaches-prev-btn', 'coaches-next-btn');