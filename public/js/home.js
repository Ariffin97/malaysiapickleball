document.addEventListener('DOMContentLoaded', async () => {
  try {
    const container = document.getElementById('upcomingTournamentsContainer');
    if (!container) return;

    const resp = await fetch('/api/tournaments/upcoming?limit=4');
    const data = await resp.json();
    const tournaments = (data?.data?.tournaments) || [];

    container.innerHTML = '';

    tournaments.slice(0, 4).forEach(t => {
      const start = t.startDate ? new Date(t.startDate) : null;
      const end = t.endDate ? new Date(t.endDate) : null;
      const dateLabel = (start && end)
        ? `${start.toLocaleString('en-US', { month: 'short' })} ${start.getDate()}-${end.getDate()}`
        : '';

      const type = (t.type || '').toLowerCase();
      const headerClasses = type === 'local'
        ? 'from-green-500 to-blue-600'
        : type === 'state'
        ? 'from-red-500 to-orange-600'
        : type === 'national'
        ? 'from-blue-500 to-purple-600'
        : 'from-yellow-500 to-yellow-600';

      const badgeText = type ? type.toUpperCase() : 'EVENT';
      const locationText = t.location || t.city || '';
      const venueText = t.venue || locationText || 'TBD';

      const card = document.createElement('div');
      card.className = 'bg-white rounded-xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105';
      card.innerHTML = `
        <div class="bg-gradient-to-br ${headerClasses} p-4 text-white">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">${badgeText}</span>
            <span class="text-xs">${dateLabel}</span>
          </div>
          <h3 class="font-bold text-lg mb-1">${t.name || 'Tournament'}</h3>
          <p class="text-white/90 text-sm">${locationText}</p>
        </div>
        <div class="p-4">
          <div class="flex items-center text-sm text-gray-600 mb-3">
            <i class="fas fa-map-marker-alt text-red-500 mr-2"></i>
            <span>${venueText}</span>
          </div>
          <div class="flex items-center text-sm text-gray-600 mb-3">
            <i class="fas fa-calendar text-blue-500 mr-2"></i>
            <span>${t.status === 'upcoming' ? 'Registration Open' : (t.status || 'Details Soon')}</span>
          </div>
          <a href="/tournament" class="inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            View Details
          </a>
        </div>
      `;
      container.appendChild(card);
    });

    if (container.children.length === 0) {
      container.innerHTML = '<div class="col-span-full text-center text-gray-500">No upcoming tournaments.</div>';
    }
    // Initialize auto carousel for latest news if available
    try {
      const carousel = document.getElementById('latestNewsContainer');
      const leftBtn = document.getElementById('newsScrollLeft');
      const rightBtn = document.getElementById('newsScrollRight');
      const indicators = document.getElementById('newsIndicators');
      if (carousel && indicators) {
        const cards = Array.from(carousel.children);
        // Ensure cards render before measuring
        if (cards.length === 0) return;
        const newsCount = cards.length;
        if (newsCount === 0) return;
        let currentIndex = 0;
        let autoTimer;

        // Create indicators
        indicators.innerHTML = '';
        for (let i = 0; i < newsCount; i++) {
          const dot = document.createElement('button');
          dot.className = `w-2.5 h-2.5 rounded-full ${i===0?'bg-blue-600':'bg-gray-300'}`;
          dot.addEventListener('click', ()=> goTo(i));
          indicators.appendChild(dot);
        }

        function updateDots(){
          Array.from(indicators.children).forEach((d, i)=>{
            d.className = `w-2.5 h-2.5 rounded-full ${i===currentIndex?'bg-blue-600':'bg-gray-300'}`;
          });
        }

        function getStepHeight(){
          const first = cards[0];
          if (!first) return 0;
          const style = getComputedStyle(carousel);
          const gap = parseFloat(style.gap || '16');
          return first.getBoundingClientRect().height + gap;
        }
        function goTo(index){
          currentIndex = (index + newsCount) % newsCount;
          const top = Math.round(currentIndex * getStepHeight());
          carousel.scrollTo({ top, behavior: 'smooth' });
          updateDots();
        }

        function next(){ goTo(currentIndex + 1); }
        function prev(){ goTo((currentIndex - 1 + newsCount) % newsCount); }

        // Buttons
        leftBtn && leftBtn.addEventListener('click', ()=>{ stop(); prev(); start(); });
        rightBtn && rightBtn.addEventListener('click', ()=>{ stop(); next(); start(); });

        function start(){
          stop();
          autoTimer = setInterval(next, 4000);
        }
        function stop(){ if (autoTimer) clearInterval(autoTimer); }

        // Pause on hover
        carousel.addEventListener('mouseenter', stop);
        carousel.addEventListener('mouseleave', start);

        // Recalculate on resize
        window.addEventListener('resize', ()=>{ goTo(currentIndex); });

        // Start auto-scroll
        if (newsCount > 1) start();
      }
    } catch(err){ console.warn('News carousel init failed:', err); }
  } catch (e) {
    console.error('Failed to load upcoming tournaments:', e);
  }
});

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