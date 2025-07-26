// Sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
  // Services dropdown functionality
  const servicesToggle = document.getElementById('services-toggle');
  const servicesMenu = document.getElementById('services-menu');
  const servicesArrow = document.getElementById('services-arrow');
  
  if (servicesToggle && servicesMenu && servicesArrow) {
    servicesToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      if (servicesMenu.classList.contains('hidden')) {
        servicesMenu.classList.remove('hidden');
        servicesArrow.classList.add('rotated');
      } else {
        servicesMenu.classList.add('hidden');
        servicesArrow.classList.remove('rotated');
      }
    });
  }
  
  // State Association dropdown functionality
  const stateAssociationToggle = document.getElementById('state-association-toggle');
  const stateAssociationMenu = document.getElementById('state-association-menu');
  const stateAssociationArrow = document.getElementById('state-association-arrow');
  
  if (stateAssociationToggle && stateAssociationMenu && stateAssociationArrow) {
    stateAssociationToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      if (stateAssociationMenu.classList.contains('hidden')) {
        stateAssociationMenu.classList.remove('hidden');
        stateAssociationArrow.classList.add('rotated');
      } else {
        stateAssociationMenu.classList.add('hidden');
        stateAssociationArrow.classList.remove('rotated');
      }
    });
  }
}); 