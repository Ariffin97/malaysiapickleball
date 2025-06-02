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

  // Form validation on client side
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      let valid = true;
      form.querySelectorAll('input[required]').forEach(input => {
        if (!input.value.trim()) {
          input.style.borderColor = 'red';
          valid = false;
        } else {
          input.style.borderColor = '';
        }
      });
      if (!valid) e.preventDefault();
    });
  });
});