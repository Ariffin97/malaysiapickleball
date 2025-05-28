document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.querySelector('#sidebar-toggle');
  const servicesToggle = document.querySelector('#services-toggle');
  const servicesMenu = document.querySelector('#services-menu');
  const servicesArrow = document.querySelector('#services-arrow');

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target) && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }
  });

  // Toggle services menu
  servicesToggle.addEventListener('click', () => {
    servicesMenu.classList.toggle('hidden');
    servicesArrow.classList.toggle('rotate-180');
  });

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