// Modern Login Page JavaScript - CSP Compliant
document.addEventListener('DOMContentLoaded', function() {
  
  // Elements
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const togglePassword = document.getElementById('togglePassword');
  const toggleIcon = document.getElementById('toggleIcon');
  const submitBtn = document.getElementById('submitBtn');
  const buttonText = submitBtn.querySelector('.button-text');
  const spinner = submitBtn.querySelector('.spinner');

  // Security tracking
  let loginAttempts = parseInt(localStorage.getItem('loginAttempts') || '0');
  let lastAttemptTime = parseInt(localStorage.getItem('lastAttemptTime') || '0');
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

  // Check if user is locked out
  function checkLockout() {
    const now = Date.now();
    if (loginAttempts >= MAX_ATTEMPTS) {
      const timeRemaining = LOCKOUT_TIME - (now - lastAttemptTime);
      if (timeRemaining > 0) {
        showError(`Too many failed attempts. Try again in ${Math.ceil(timeRemaining / 60000)} minutes.`);
        disableForm(true);
        return true;
      } else {
        // Reset attempts after lockout period
        loginAttempts = 0;
        localStorage.setItem('loginAttempts', '0');
        disableForm(false);
      }
    }
    return false;
  }

  // Disable/enable form
  function disableForm(disabled) {
    usernameInput.disabled = disabled;
    passwordInput.disabled = disabled;
    submitBtn.disabled = disabled;
    if (disabled) {
      submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }

  // Initialize security check
  checkLockout();

  // Password visibility toggle
  if (togglePassword && toggleIcon) {
    togglePassword.addEventListener('click', function() {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      // Toggle icon
      if (type === 'text') {
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
      } else {
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
      }
    });
  }

  // Real-time input validation
  function validateInput(input) {
    const value = input.value.trim();
    const errorDiv = input.parentElement.querySelector('.error-text');
    let isValid = true;
    let errorMessage = '';

    // Clear previous error state
    input.classList.remove('border-red-500');
    errorDiv.classList.add('hidden');

    // Required validation
    if (input.hasAttribute('data-validate')) {
      if (input.getAttribute('data-validate').includes('required') && !value) {
        isValid = false;
        errorMessage = `${input.previousElementSibling.textContent.replace(/[^\w\s]/gi, '').trim()} is required`;
      }
    }

    // Specific validations
    if (input.id === 'username' && value) {
      if (value.length < 3) {
        isValid = false;
        errorMessage = 'Username must be at least 3 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        isValid = false;
        errorMessage = 'Username can only contain letters, numbers, and underscores';
      }
    }

    if (input.id === 'password' && value) {
      if (value.length < 6) {
        isValid = false;
        errorMessage = 'Password must be at least 6 characters';
      }
    }

    // Show error if invalid
    if (!isValid) {
      input.classList.add('border-red-500');
      errorDiv.textContent = errorMessage;
      errorDiv.classList.remove('hidden');
    }

    return isValid;
  }

  // Add input event listeners for real-time validation
  [usernameInput, passwordInput].forEach(input => {
    if (input) {
      // Validate on blur
      input.addEventListener('blur', () => validateInput(input));
      
      // Clear errors on input
      input.addEventListener('input', () => {
        if (input.classList.contains('border-red-500')) {
          const errorDiv = input.parentElement.querySelector('.error-text');
          input.classList.remove('border-red-500');
          errorDiv.classList.add('hidden');
        }
      });

      // Enhanced focus effects
      input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
      });

      input.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
      });
    }
  });

  // Form submission with enhanced security
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();

      // Check lockout again
      if (checkLockout()) {
        return;
      }

      // Validate all inputs
      const usernameValid = validateInput(usernameInput);
      const passwordValid = validateInput(passwordInput);

      if (!usernameValid || !passwordValid) {
        showError('Please correct the errors above');
        return;
      }

      // Show loading state
      setLoadingState(true);

      // Security: Rate limiting check
      const now = Date.now();
      if (now - lastAttemptTime < 1000) { // Prevent rapid submissions
        setLoadingState(false);
        showError('Please wait a moment before trying again');
        return;
      }

             // Update attempt tracking
       lastAttemptTime = now;
       localStorage.setItem('lastAttemptTime', now.toString());

       // Show loading state for user feedback
       setTimeout(() => {
         setLoadingState(false);
         // Reset attempts on successful validation
         loginAttempts = 0;
         localStorage.setItem('loginAttempts', '0');
         
         // Submit form traditionally
         loginForm.submit();
       }, 800); // Give user visual feedback
    });
  }

  // Loading state management
  function setLoadingState(loading) {
    if (loading) {
      buttonText.classList.add('hidden');
      spinner.classList.remove('hidden');
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-75');
    } else {
      buttonText.classList.remove('hidden');
      spinner.classList.add('hidden');
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-75');
    }
  }

  // Error display
  function showError(message) {
    removeExistingAlerts();
    const alertDiv = createAlert(message, 'error');
    insertAlert(alertDiv);
  }

  // Warning display
  function showWarning(message) {
    removeExistingAlerts();
    const alertDiv = createAlert(message, 'warning');
    insertAlert(alertDiv);
  }

  // Success display
  function showSuccess(message) {
    removeExistingAlerts();
    const alertDiv = createAlert(message, 'success');
    insertAlert(alertDiv);
  }

  // Create alert element
  function createAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-message mb-6 px-4 py-3 rounded-xl flex items-center ${getAlertClasses(type)}`;
    
    const icon = getAlertIcon(type);
    alertDiv.innerHTML = `
      <i class="${icon} mr-3"></i>
      <span>${message}</span>
    `;
    
    return alertDiv;
  }

  // Get alert classes based on type
  function getAlertClasses(type) {
    switch (type) {
      case 'error':
        return 'bg-red-100 border border-red-400 text-red-700 error-message';
      case 'warning':
        return 'bg-yellow-100 border border-yellow-400 text-yellow-700';
      case 'success':
        return 'bg-green-100 border border-green-400 text-green-700 success-animation';
      default:
        return 'bg-blue-100 border border-blue-400 text-blue-700';
    }
  }

  // Get alert icon based on type
  function getAlertIcon(type) {
    switch (type) {
      case 'error':
        return 'fas fa-exclamation-triangle';
      case 'warning':
        return 'fas fa-exclamation-circle';
      case 'success':
        return 'fas fa-check-circle';
      default:
        return 'fas fa-info-circle';
    }
  }

  // Insert alert into form
  function insertAlert(alertDiv) {
    const form = document.querySelector('#loginForm');
    const firstElement = form.firstElementChild;
    form.insertBefore(alertDiv, firstElement);
  }

  // Remove existing alerts
  function removeExistingAlerts() {
    const existingAlerts = document.querySelectorAll('.alert-message');
    existingAlerts.forEach(alert => alert.remove());
  }

  // Keyboard navigation enhancements
  document.addEventListener('keydown', function(e) {
    // Enter key on username field moves to password
    if (e.key === 'Enter' && document.activeElement === usernameInput) {
      e.preventDefault();
      passwordInput.focus();
    }
    
    // Escape key clears form
    if (e.key === 'Escape') {
      loginForm.reset();
      removeExistingAlerts();
      // Clear any error states
      [usernameInput, passwordInput].forEach(input => {
        if (input) {
          input.classList.remove('border-red-500');
          const errorDiv = input.parentElement.querySelector('.error-text');
          if (errorDiv) {
            errorDiv.classList.add('hidden');
          }
        }
      });
    }
  });

  // Security: Clear sensitive data on page unload
  window.addEventListener('beforeunload', function() {
    if (passwordInput) {
      passwordInput.value = '';
    }
  });

  // Auto-focus username field on page load
  if (usernameInput && !usernameInput.disabled) {
    setTimeout(() => {
      usernameInput.focus();
    }, 500);
  }

  // Monitor for suspicious activity
  let keystrokes = 0;
  let rapidClicks = 0;
  
  document.addEventListener('keydown', () => {
    keystrokes++;
    if (keystrokes > 100) {
      console.warn('Suspicious keyboard activity detected');
    }
  });

  document.addEventListener('click', () => {
    rapidClicks++;
    setTimeout(() => rapidClicks--, 1000);
    if (rapidClicks > 10) {
      console.warn('Suspicious clicking activity detected');
    }
  });

  // Console security warning
  console.warn('🚨 SECURITY WARNING: This is a browser feature intended for developers. If someone told you to copy-paste something here, it could be a scam to steal your information.');
  
}); 