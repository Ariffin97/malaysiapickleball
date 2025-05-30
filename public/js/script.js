document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  const main = document.querySelector('main');
  const toggleBtn = document.querySelector('#sidebar-toggle');
  const mobileToggleBtn = document.querySelector('#mobile-sidebar-toggle');
  const servicesToggle = document.querySelector('#services-toggle');
  const servicesMenu = document.querySelector('#services-menu');
  const servicesArrow = document.querySelector('#services-arrow');

  // Function to toggle sidebar
  const toggleSidebar = (isVisible, toggleButton) => {
    if (sidebar && main) {
      if (isVisible) {
        sidebar.style.transform = 'translateX(-100%)';
        main.style.marginLeft = '0';
        main.style.paddingLeft = '2.5rem'; // Ensure padding for button
        if (toggleButton) toggleButton.style.left = '1rem';
      } else {
        sidebar.style.transform = 'translateX(0)';
        main.style.marginLeft = '16rem'; // Sidebar width
        main.style.paddingLeft = '2.5rem'; // Maintain padding
        if (toggleButton) toggleButton.style.left = '17rem'; // Align with sidebar
      }
      sidebar.classList.toggle('open', !isVisible);
    }
  };

  // Handle default toggle buttons
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => toggleSidebar(sidebar.classList.contains('open')));
  }
  
  if (mobileToggleBtn) {
    mobileToggleBtn.addEventListener('click', () => toggleSidebar(sidebar.classList.contains('open')));
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && 
        sidebar && sidebar.classList.contains('open') && 
        !sidebar.contains(e.target) && 
        !toggleBtn.contains(e.target)) {
      toggleSidebar();
    }
  });

  // Close sidebar on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
      toggleSidebar(true);
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