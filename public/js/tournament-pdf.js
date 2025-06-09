// Tournament PDF Download Functionality
document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.getElementById('download-pdf-btn');
    
    if (downloadBtn) {
        // Add click handler for enhanced UX
        downloadBtn.addEventListener('click', function(e) {
            // Show loading state
            const originalContent = this.innerHTML;
            const originalHref = this.href;
            
            // Update button to show loading
            this.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating PDF...';
            this.classList.add('opacity-75', 'cursor-not-allowed');
            this.removeAttribute('href');
            
            // Create a hidden iframe for download
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = originalHref;
            document.body.appendChild(iframe);
            
            // Reset button after a delay
            setTimeout(() => {
                this.innerHTML = originalContent;
                this.classList.remove('opacity-75', 'cursor-not-allowed');
                this.href = originalHref;
                
                // Remove iframe
                document.body.removeChild(iframe);
                
                // Show success message
                showNotification('PDF download started! Check your downloads folder.', 'success');
            }, 3000);
            
            // Prevent default link behavior
            e.preventDefault();
        });
    }
});

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.pdf-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `pdf-notification fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
    
    // Set notification style based on type
    if (type === 'success') {
        notification.classList.add('bg-green-500', 'text-white');
        notification.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
    } else if (type === 'error') {
        notification.classList.add('bg-red-500', 'text-white');
        notification.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i>${message}`;
    } else {
        notification.classList.add('bg-blue-500', 'text-white');
        notification.innerHTML = `<i class="fas fa-info-circle mr-2"></i>${message}`;
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
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