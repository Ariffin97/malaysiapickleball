// Header functionality
document.addEventListener('DOMContentLoaded', function() {
  // Navbar scroll effect
  window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar-modern');
    const progressBar = document.querySelector('.progress-bar');
    
    if (navbar && window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else if (navbar) {
      navbar.classList.remove('scrolled');
    }
    
    // Progress bar based on scroll
    if (progressBar) {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      progressBar.style.width = scrollPercent + '%';
    }
  });
  
  // User dropdown functionality
  const userMenuButton = document.getElementById('user-menu-button');
  const userDropdown = document.getElementById('user-dropdown');
  
  if (userMenuButton && userDropdown) {
    userMenuButton.addEventListener('click', function(e) {
      e.stopPropagation();
      userDropdown.classList.toggle('opacity-0');
      userDropdown.classList.toggle('invisible');
      userDropdown.classList.toggle('translate-y-2');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
      userDropdown.classList.add('opacity-0', 'invisible', 'translate-y-2');
    });
  }
  
  // Mobile menu enhanced animation
  const mobileToggle = document.getElementById('mobile-sidebar-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', function() {
      const svg = this.querySelector('svg');
      if (svg) {
        svg.style.transform = svg.style.transform === 'rotate(90deg)' ? 'rotate(0deg)' : 'rotate(90deg)';
      }
    });
  }
}); 