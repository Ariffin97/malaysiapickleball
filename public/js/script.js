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
        if (toggleButton) toggleButton.style.left = '1rem';
      } else {
        sidebar.style.transform = 'translateX(0)';
        main.style.marginLeft = '16rem';
        if (toggleButton) toggleButton.style.left = '17rem';
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
    if (sidebar && sidebar.classList.contains('open')) {
      if (!sidebar.contains(e.target) && 
          !toggleBtn?.contains(e.target) && 
          !mobileToggleBtn?.contains(e.target)) {
        toggleSidebar(true);
      }
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
    servicesToggle.addEventListener('click', () => {
      servicesMenu.classList.toggle('hidden');
      servicesArrow.classList.toggle('rotate-180');
    });
  }

  // Client-side form validation
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const inputs = form.querySelectorAll('input[required], textarea[required]');
      let valid = true;
      inputs.forEach(input => {
        if (!input.value.trim()) {
          valid = false;
          input.classList.add('border-red-500');
          const error = document.createElement('p');
          error.className = 'error';
          error.textContent = `${input.name} is required`;
          input.parentElement.appendChild(error);
        } else {
          input.classList.remove('border-red-500');
          const existingError = input.parentElement.querySelector('.error');
          if (existingError) existingError.remove();
        }
      });
      if (!valid) e.preventDefault();
    });
  });

  // Tournament page sidebar management
  if (window.location.pathname === '/tournament') {
    if (sidebar && main) {
      // Initially collapse the sidebar
      sidebar.style.transform = 'translateX(-100%)';
      main.style.marginLeft = '0';
      sidebar.classList.remove('open');

      // Create or find toggle button
      let toggleButton = document.querySelector('#tournament-sidebar-toggle');
      if (!toggleButton) {
        toggleButton = document.createElement('button');
        toggleButton.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        `;
        toggleButton.className = 'fixed top-24 left-4 z-20 bg-gray-700 text-white p-2 rounded-lg shadow-lg hover:bg-gray-600 transition-all duration-200';
        toggleButton.id = 'tournament-sidebar-toggle';
        toggleButton.title = 'Toggle Sidebar';
        document.body.appendChild(toggleButton);
      }

      // Toggle functionality
      let sidebarVisible = false;

      toggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        sidebarVisible = !sidebarVisible;
        toggleSidebar(!sidebarVisible, toggleButton);
      });

      // Close sidebar when clicking outside
      document.addEventListener('click', (e) => {
        if (sidebarVisible && 
            !sidebar.contains(e.target) && 
            !toggleButton.contains(e.target)) {
          sidebarVisible = false;
          toggleSidebar(true, toggleButton);
        }
      });

      // Close sidebar on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebarVisible) {
          sidebarVisible = false;
          toggleSidebar(true, toggleButton);
        }
      });
    }
  }
});