document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.querySelector('#sidebar-toggle');
  const mobileToggleBtn = document.querySelector('#mobile-sidebar-toggle');
  const servicesToggle = document.querySelector('#services-toggle');
  const servicesMenu = document.querySelector('#services-menu');
  const servicesArrow = document.querySelector('#services-arrow');

  // Function to toggle sidebar
  const toggleSidebar = () => {
    sidebar.classList.toggle('open');
  };

  // Handle both toggle buttons
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleSidebar);
  }
  
  if (mobileToggleBtn) {
    mobileToggleBtn.addEventListener('click', toggleSidebar);
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (sidebar && sidebar.classList.contains('open')) {
      // Check if click is outside sidebar and toggle buttons
      if (!sidebar.contains(e.target) && 
          !toggleBtn?.contains(e.target) && 
          !mobileToggleBtn?.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });

  // Close sidebar on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
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
});