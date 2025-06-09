// Popup management functions
let popupActive = false;

// Test function to verify JavaScript is working
function testFunction() {
  console.log('Test function called - JavaScript is working!');
  alert('JavaScript is working! Check console for more details.');
  
  // Test if elements exist
  const title = document.getElementById('popup-title');
  const content = document.getElementById('popup-content');
  const startBtn = document.getElementById('start-popup-btn');
  
  console.log('Elements found:', {
    title: title ? 'YES' : 'NO',
    content: content ? 'YES' : 'NO', 
    startBtn: startBtn ? 'YES' : 'NO'
  });
}

function startPopup(buttonElement) {
  console.log('startPopup function called'); // Debug log
  
  const title = document.getElementById('popup-title').value.trim();
  const content = document.getElementById('popup-content').value.trim();
  
  console.log('Starting popup with:', { title, content }); // Debug log
  
  if (!title || !content) {
    alert('Please enter both title and content for the popup message.');
    return;
  }

  // Show loading state
  const startBtn = buttonElement || document.getElementById('start-popup-btn');
  const originalText = startBtn.innerHTML;
  startBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Starting...';
  startBtn.disabled = true;

  // Send request to backend to activate popup
  fetch('/admin/popup/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title,
      content: content,
      active: true
    })
  })
  .then(response => {
    console.log('Response status:', response.status); // Debug log
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Response data:', data); // Debug log
    if (data.success) {
      popupActive = true;
      updateStatus('Active', 'bg-green-100', 'text-green-800');
      showNotification('Popup activated successfully!', 'success');
    } else {
      showNotification('Failed to activate popup: ' + (data.error || 'Unknown error'), 'error');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showNotification('Error activating popup: ' + error.message, 'error');
  })
  .finally(() => {
    // Restore button state
    startBtn.innerHTML = originalText;
    startBtn.disabled = false;
  });
}

function endPopup(buttonElement) {
  console.log('endPopup function called'); // Debug log
  
  // Show loading state
  const endBtn = buttonElement || document.getElementById('end-popup-btn');
  const originalText = endBtn.innerHTML;
  endBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Ending...';
  endBtn.disabled = true;

  // Send request to backend to deactivate popup
  fetch('/admin/popup/end', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      popupActive = false;
      updateStatus('Inactive', 'bg-red-100', 'text-red-800');
      showNotification('Popup deactivated successfully!', 'success');
    } else {
      showNotification('Failed to deactivate popup.', 'error');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showNotification('Error deactivating popup.', 'error');
  })
  .finally(() => {
    // Restore button state
    endBtn.innerHTML = originalText;
    endBtn.disabled = false;
  });
}

function previewPopup() {
  const title = document.getElementById('popup-title').value.trim();
  const content = document.getElementById('popup-content').value.trim();
  
  console.log('Previewing popup with:', { title, content }); // Debug log
  
  if (!title || !content) {
    alert('Please enter both title and content to preview the popup.');
    return;
  }

  // Create preview popup
  showPreviewPopup(title, content);
}

function showPreviewPopup(title, content) {
  // Create modal backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
  backdrop.onclick = () => backdrop.remove();

  // Create popup content
  const popup = document.createElement('div');
  popup.className = 'bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all duration-300 scale-95 opacity-0';
  popup.onclick = (e) => e.stopPropagation();

  popup.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-bold text-gray-800">${title}</h3>
      <button class="close-preview-btn text-gray-400 hover:text-gray-600">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="text-gray-600 mb-4">${content}</div>
    <div class="text-center">
      <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Preview Mode</span>
    </div>
  `;

  // Add event listener to close button
  const closeBtn = popup.querySelector('.close-preview-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      backdrop.remove();
    });
  }

  backdrop.appendChild(popup);
  document.body.appendChild(backdrop);

  // Animate in
  setTimeout(() => {
    popup.classList.remove('scale-95', 'opacity-0');
    popup.classList.add('scale-100', 'opacity-100');
  }, 10);
}

function updateStatus(text, bgClass, textClass) {
  const statusElement = document.getElementById('popup-status');
  statusElement.textContent = text;
  statusElement.className = `px-3 py-1 rounded-full text-sm font-medium ${bgClass} ${textClass}`;
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transform transition-all duration-300 translate-x-full ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  }`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 10);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function removePopupImage() {
  if (confirm('Are you sure you want to remove the popup image?')) {
    fetch('/admin/popup/remove-image', {
      method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        location.reload();
      } else {
        showNotification('Failed to remove image.', 'error');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      showNotification('Error removing image.', 'error');
    });
  }
}

// Show image preview when file is selected
function showImagePreview() {
  const fileInput = document.getElementById('popup-image');
  const file = fileInput.files[0];
  
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      // Create or update preview
      let previewContainer = document.getElementById('image-preview');
      if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.id = 'image-preview';
        previewContainer.className = 'mt-4';
        fileInput.closest('form').appendChild(previewContainer);
      }
      
      previewContainer.innerHTML = `
        <h4 class="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
        <img src="${e.target.result}" alt="Preview" class="w-full max-w-xs rounded-lg border shadow-sm">
        <p class="text-xs text-gray-500 mt-1">Click "Upload Image" to save this image</p>
      `;
    };
    reader.readAsDataURL(file);
  }
}

// Load popup status on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded - Setting up event listeners');
  
  // Add event listeners for buttons
  const startBtn = document.getElementById('start-popup-btn');
  const endBtn = document.getElementById('end-popup-btn');
  const previewBtn = document.getElementById('preview-popup-btn');
  const testBtn = document.getElementById('test-btn');
  const removeImageBtn = document.getElementById('remove-popup-image-btn');
  const fileInput = document.getElementById('popup-image');

  if (startBtn) {
    startBtn.addEventListener('click', function() {
      startPopup(this);
    });
    console.log('Start button event listener added');
  } else {
    console.error('Start button not found!');
  }

  if (endBtn) {
    endBtn.addEventListener('click', function() {
      endPopup(this);
    });
    console.log('End button event listener added');
  }

  if (previewBtn) {
    previewBtn.addEventListener('click', function() {
      previewPopup();
    });
    console.log('Preview button event listener added');
  }

  if (testBtn) {
    testBtn.addEventListener('click', function() {
      testFunction();
    });
    console.log('Test button event listener added');
  }

  if (removeImageBtn) {
    removeImageBtn.addEventListener('click', function() {
      removePopupImage();
    });
    console.log('Remove image button event listener added');
  }

  // Add file input change listener
  if (fileInput) {
    fileInput.addEventListener('change', showImagePreview);
    console.log('File input event listener added');
  }

  // Load popup status
  fetch('/admin/popup/status')
    .then(response => response.json())
    .then(data => {
      console.log('Loaded popup status:', data); // Debug log
      if (data.active) {
        popupActive = true;
        updateStatus('Active', 'bg-green-100', 'text-green-800');
        if (data.title) document.getElementById('popup-title').value = data.title;
        if (data.content) document.getElementById('popup-content').value = data.content;
      }
    })
    .catch(error => {
      console.error('Error loading popup status:', error);
    });
}); 