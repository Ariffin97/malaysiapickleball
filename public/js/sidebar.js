// Sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('Sidebar loaded - handling dropdown menus');
  
  // Services dropdown functionality
  const servicesToggle = document.getElementById('services-toggle');
  const servicesMenu = document.getElementById('services-menu');
  const servicesArrow = document.getElementById('services-arrow');
  
  if (servicesToggle) {
    servicesToggle.addEventListener('click', function() {
      const isHidden = servicesMenu.classList.contains('hidden');
      
      if (isHidden) {
        servicesMenu.classList.remove('hidden');
        servicesMenu.classList.add('expanded');
        servicesArrow.classList.add('rotated');
      } else {
        servicesMenu.classList.add('hidden');
        servicesMenu.classList.remove('expanded');
        servicesArrow.classList.remove('rotated');
      }
    });
  }
  
  // State Association dropdown functionality
  const stateAssociationToggle = document.getElementById('state-association-toggle');
  const stateAssociationMenu = document.getElementById('state-association-menu');
  const stateAssociationArrow = document.getElementById('state-association-arrow');
  
  if (stateAssociationToggle) {
    stateAssociationToggle.addEventListener('click', function() {
      const isHidden = stateAssociationMenu.classList.contains('hidden');
      
      if (isHidden) {
        stateAssociationMenu.classList.remove('hidden');
        stateAssociationMenu.classList.add('expanded');
        stateAssociationArrow.classList.add('rotated');
      } else {
        stateAssociationMenu.classList.add('hidden');
        stateAssociationMenu.classList.remove('expanded');
        stateAssociationArrow.classList.remove('rotated');
      }
    });
  }
}); 