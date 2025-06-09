// Home page functionality
document.addEventListener('DOMContentLoaded', function() {
  // Show popup if it exists
  const popupModal = document.getElementById('popup-modal');
  const popupContent = document.getElementById('popup-content');
  const closePopupBtn = document.getElementById('close-popup');
  const popupOkBtn = document.getElementById('popup-ok-btn');

  if (popupModal) {
    // Handle image loading errors
    const popupImg = document.getElementById('popup-image');
    if (popupImg) {
      popupImg.addEventListener('error', function() {
        console.log('Popup image failed to load:', this.src);
        this.style.display = 'none';
        this.parentElement.style.display = 'none';
      });
    }
    
    // Show popup with animation
    setTimeout(() => {
      popupModal.classList.remove('opacity-0');
      popupModal.classList.add('opacity-100');
      popupContent.classList.remove('scale-95');
      popupContent.classList.add('scale-100');
    }, 500); // Delay to let page load

    // Close popup handlers
    const closePopup = () => {
      popupModal.classList.remove('opacity-100');
      popupModal.classList.add('opacity-0');
      popupContent.classList.remove('scale-100');
      popupContent.classList.add('scale-95');
      setTimeout(() => {
        popupModal.style.display = 'none';
      }, 300);
    };

    if (closePopupBtn) {
      closePopupBtn.addEventListener('click', closePopup);
    }

    if (popupOkBtn) {
      popupOkBtn.addEventListener('click', closePopup);
    }

    // Close on background click
    popupModal.addEventListener('click', (e) => {
      if (e.target === popupModal) {
        closePopup();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popupModal.style.display !== 'none') {
        closePopup();
      }
    });
  }

  // Add click handlers for feature cards with navigation
  const featureCards = document.querySelectorAll('.feature-card[data-href]');
  featureCards.forEach(card => {
    const href = card.getAttribute('data-href');
    if (href) {
      card.addEventListener('click', () => {
        window.location.href = href;
      });
    }
  });

  // Intersection Observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);

  // Observe all feature cards and news cards
  document.querySelectorAll('.feature-card, .news-card').forEach(el => {
    observer.observe(el);
  });

  // Parallax effect
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.parallax-bg');
    if (parallax) {
      const speed = scrolled * 0.5;
      parallax.style.transform = `translateY(${speed}px)`;
    }
  });

  // CTA button click handlers
  const ctaButton = document.querySelector('.cta-button');
  if (ctaButton) {
    ctaButton.addEventListener('click', () => {
      window.location.href = '/tournament';
    });
  }

  // Add hover sound effect (optional)
  document.querySelectorAll('.feature-card, .news-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      // Optional: Add subtle sound effect
    });
  });
}); 