document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const toggleMobileMenu = () => {
      const menuBtn = document.getElementById('menu-btn');
      const mobileMenu = document.getElementById('mobile-menu');
      if (menuBtn && mobileMenu) {
        const toggle = () => {
          const isHidden = mobileMenu.classList.toggle('hidden');
          menuBtn.setAttribute('aria-expanded', !isHidden);
        };
        menuBtn.addEventListener('click', toggle);
        menuBtn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        });
      }
    };
  
    // Scroll Animations
    const setupScrollAnimations = () => {
      const sections = document.querySelectorAll('section');
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            entry.target.classList.toggle('visible', entry.isIntersecting);
          });
        },
        { threshold: 0.2 }
      );
      sections.forEach(section => observer.observe(section));
    };
  
    // Image Load Error Logging
    const logImageErrors = () => {
      document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', () => {
          console.warn(`Failed to load image: ${img.src}`);
        });
      });
    };
  
    // Carousel Setup
    const setupCarousel = (carouselId, prevBtnId, nextBtnId) => {
      const carousel = document.getElementById(carouselId);
      if (!carousel) {
        console.error(`Carousel with ID ${carouselId} not found`);
        return;
      }
      let currentIndex = 0;
      const items = carousel.children;
      const totalItems = items.length;
      const prevBtn = document.getElementById(prevBtnId);
      const nextBtn = document.getElementById(nextBtnId);
  
      const moveCarousel = () => {
        carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
      };
  
      if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
          currentIndex = (currentIndex - 1 + totalItems) % totalItems;
          moveCarousel();
        });
        nextBtn.addEventListener('click', () => {
          currentIndex = (currentIndex + 1) % totalItems;
          moveCarousel();
        });
      }
  
      let autoScroll = setInterval(() => {
        currentIndex = (currentIndex + 1) % totalItems;
        moveCarousel();
      }, 7000);
  
      carousel.parentElement.addEventListener('mouseenter', () => {
        clearInterval(autoScroll);
      });
      carousel.parentElement.addEventListener('mouseleave', () => {
        autoScroll = setInterval(() => {
          currentIndex = (currentIndex + 1) % totalItems;
          moveCarousel();
        }, 7000);
      });
  
      let touchStartX = 0;
      let touchEndX = 0;
      carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        clearInterval(autoScroll);
      });
      carousel.addEventListener('touchmove', (e) => {
        touchEndX = e.changedTouches[0].screenX;
      });
      carousel.addEventListener('touchend', () => {
        const swipeDistance = touchEndX - touchStartX;
        const minSwipeDistance = 100;
        if (swipeDistance > minSwipeDistance) {
          currentIndex = (currentIndex - 1 + totalItems) % totalItems;
        } else if (swipeDistance < -minSwipeDistance) {
          currentIndex = (currentIndex + 1) % totalItems;
        }
        moveCarousel();
        autoScroll = setInterval(() => {
          currentIndex = (currentIndex + 1) % totalItems;
          moveCarousel();
        }, 7000);
      });
  
      carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          currentIndex = (currentIndex - 1 + totalItems) % totalItems;
          moveCarousel();
        } else if (e.key === 'ArrowRight') {
          currentIndex = (currentIndex + 1) % totalItems;
          moveCarousel();
        }
      });
    };
  
    // Chart Initialization
    const initCharts = () => {
      const tournamentChart = document.getElementById('tournament-chart');
      const coachChart = document.getElementById('coach-chart');
      if (tournamentChart && coachChart) {
        new Chart(tournamentChart.getContext('2d'), {
          type: 'bar',
          data: {
            labels: ['Malaysia Open', 'Penang Classic', 'Johor Championship'],
            datasets: [{
              label: 'Tournament Day (2025)',
              data: [15, 10, 20],
              backgroundColor: ['#1e40af', '#3b82f6', '#2dd4bf'],
              borderColor: ['#1e3a8a', '#1e40af', '#14b8a6'],
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Day of Month' } },
              x: { title: { display: true, text: 'Tournament' } }
            },
            plugins: {
              legend: { display: false },
              title: { display: true, text: 'Tournament Schedule 2025' }
            }
          }
        });
  
        new Chart(coachChart.getContext('2d'), {
          type: 'pie',
          data: {
            labels: ['2-3 years', '4-5 years', '6+ years'],
            datasets: [{
              label: 'Coaches',
              data: [2, 3, 3],
              backgroundColor: ['#2dd4bf', '#3b82f6', '#1e40af'],
              borderColor: ['#14b8a6', '#1e40af', '#1e3a8a'],
              borderWidth: 1
            }]
          },
          options: {
            plugins: {
              legend: { position: 'bottom' },
              title: { display: true, text: 'Coach Experience Distribution' }
            }
          }
        });
      }
    };
  
    // Initialize Features
    toggleMobileMenu();
    setupScrollAnimations();
    logImageErrors();
    setupCarousel('calendar-items', 'calendar-prev', 'calendar-next');
    setupCarousel('news-items', 'news-prev', 'news-next');
    if (document.getElementById('coaches-items')) {
      setupCarousel('coaches-items', 'coaches-prev', 'coaches-next');
    }
    initCharts();
  });