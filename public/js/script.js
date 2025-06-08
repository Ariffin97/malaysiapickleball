document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  const main = document.querySelector('main');
  const toggleBtn = document.querySelector('#sidebar-toggle');
  const mobileToggleBtn = document.querySelector('#mobile-sidebar-toggle');
  const servicesToggle = document.querySelector('#services-toggle');
  const servicesMenu = document.querySelector('#services-menu');
  const servicesArrow = document.querySelector('#services-arrow');

  // Function to toggle sidebar
  const toggleSidebar = (forceClose = false) => {
    if (sidebar && main) {
      const isCurrentlyOpen = sidebar.classList.contains('open');
      const shouldClose = forceClose || isCurrentlyOpen;
      
      if (window.innerWidth <= 768) {
        // Mobile behavior
        if (shouldClose) {
          sidebar.classList.remove('open');
          sidebar.style.transform = 'translateX(-100%)';
        } else {
          sidebar.classList.add('open');
          sidebar.style.transform = 'translateX(0)';
        }
      } else {
        // Desktop behavior
        if (shouldClose) {
          sidebar.style.transform = 'translateX(-100%)';
          main.style.marginLeft = '0';
          main.style.paddingLeft = '2.5rem';
          if (toggleBtn) toggleBtn.style.left = '1rem';
        } else {
          sidebar.style.transform = 'translateX(0)';
          main.style.marginLeft = '16rem';
          main.style.paddingLeft = '2.5rem';
          if (toggleBtn) toggleBtn.style.left = '17rem';
        }
        sidebar.classList.toggle('open', !shouldClose);
      }
    }
  };

  // Handle desktop toggle button
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      toggleSidebar();
    });
  }
  
  // Handle mobile toggle button
  if (mobileToggleBtn) {
    mobileToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebar();
    });
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        sidebar && sidebar.classList.contains('open') && 
        !sidebar.contains(e.target) && 
        (!mobileToggleBtn || !mobileToggleBtn.contains(e.target))) {
      toggleSidebar(true);
    }
  });

  // Close sidebar on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
      toggleSidebar(true);
    }
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && sidebar) {
      // Reset mobile classes when switching to desktop
      sidebar.classList.remove('open');
      sidebar.style.transform = '';
      if (main) {
        main.style.marginLeft = '';
        main.style.paddingLeft = '';
      }
    }
  });

  // Toggle services menu
  if (servicesToggle && servicesMenu && servicesArrow) {
    servicesToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Toggle the hidden class instead of using complex animations
      servicesMenu.classList.toggle('hidden');
      servicesArrow.classList.toggle('rotate-180');
      
      // Debug logging
      console.log('Services menu toggled, hidden:', servicesMenu.classList.contains('hidden'));
    });
  } else {
    console.log('Services elements not found:', {
      toggle: !!servicesToggle,
      menu: !!servicesMenu,
      arrow: !!servicesArrow
    });
  }

  // Enhanced form validation with real-time feedback
  document.querySelectorAll('form').forEach(form => {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    // Real-time validation on input
    inputs.forEach(input => {
      input.addEventListener('input', validateField);
      input.addEventListener('blur', validateField);
    });

    // Form submission validation
    form.addEventListener('submit', e => {
      let valid = true;
      
      inputs.forEach(input => {
        if (!validateField({ target: input })) {
          valid = false;
        }
      });
      
      if (!valid) {
        e.preventDefault();
        showNotification('Please fix the errors in the form', 'error');
      }
    });
  });

  // Field validation function
  function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    let isValid = true;
    
    // Reset field styling
    field.classList.remove('border-red-500', 'border-green-500');
    
    // Validate required fields
    if (field.hasAttribute('required') && !value) {
      field.classList.add('border-red-500');
      isValid = false;
    } else if (value) {
      field.classList.add('border-green-500');
    }
    
    return isValid;
  }

  // Dashboard-specific features
  initializeDashboard();
});

// Dashboard initialization
function initializeDashboard() {
  // Animate cards on load
  const cards = document.querySelectorAll('.dashboard-card, .stat-card, .action-btn');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      card.style.transition = 'all 0.6s ease-out';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 100);
  });

  // Initialize search and filter functionality
  initializeSearchAndFilter();
  
  // Initialize data refresh functionality
  initializeDataRefresh();
  
  // Update timestamp
  updateTimestamp();
}

// Enhanced search and filter functionality
function initializeSearchAndFilter() {
  const searchInput = document.getElementById('playerSearch');
  const filterSelect = document.getElementById('playerFilter');
  const playerCards = document.querySelectorAll('.player-card');

  if (!searchInput || !filterSelect || !playerCards.length) return;

  // Debounce search input
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filterPlayers, 300);
  });

  filterSelect.addEventListener('change', filterPlayers);

  function filterPlayers() {
    const searchTerm = searchInput.value.toLowerCase();
    const ageFilter = filterSelect.value;
    let visibleCount = 0;

    playerCards.forEach((card, index) => {
      const playerName = card.dataset.name || '';
      const playerAge = parseInt(card.dataset.age) || 0;
      
      let ageMatch = true;
      if (ageFilter === 'youth') ageMatch = playerAge < 18;
      else if (ageFilter === 'adult') ageMatch = playerAge >= 18 && playerAge <= 50;
      else if (ageFilter === 'senior') ageMatch = playerAge > 50;
      
      const nameMatch = playerName.includes(searchTerm);
      const shouldShow = nameMatch && ageMatch;
      
      if (shouldShow) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });
  }
}

// Data refresh functionality
function initializeDataRefresh() {
  window.refreshData = function() {
    const button = event.target.closest('button');
    const originalText = button.innerHTML;
    
    // Show loading state
    button.innerHTML = '<div class="loading-spinner inline-block mr-2"></div>Refreshing...';
    button.disabled = true;
    button.classList.add('opacity-75');
    
    // Simulate API call
    setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
      button.classList.remove('opacity-75');
      
      // Update timestamp
      updateTimestamp();
      
      // Show success notification
      showNotification('Data refreshed successfully!', 'success');
      
      // Add pulse animation to updated elements
      document.querySelectorAll('.stat-card').forEach(card => {
        card.style.animation = 'pulse 0.6s ease-in-out';
        setTimeout(() => {
          card.style.animation = '';
        }, 600);
      });
    }, 2000);
  };
}

// Update timestamp
function updateTimestamp() {
  const timestampEl = document.getElementById('lastUpdated');
  if (timestampEl) {
    timestampEl.textContent = new Date().toLocaleTimeString();
  }
}

// Notification system
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform translate-x-full transition-transform duration-300`;
  
  // Set color based on type
  switch (type) {
    case 'success':
      notification.classList.add('bg-green-500', 'text-white');
      break;
    case 'error':
      notification.classList.add('bg-red-500', 'text-white');
      break;
    case 'warning':
      notification.classList.add('bg-yellow-500', 'text-white');
      break;
    default:
      notification.classList.add('bg-blue-500', 'text-white');
  }
  
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'} mr-2"></i>
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white opacity-75 hover:opacity-100">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  requestAnimationFrame(() => {
    notification.classList.remove('translate-x-full');
  });
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
}