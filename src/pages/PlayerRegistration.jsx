import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './PlayerRegistration.css';

function PlayerRegistration() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [icValidation, setIcValidation] = useState({ status: '', message: '' });

  const [registerFormData, setRegisterFormData] = useState({
    fullName: '',
    profilePicture: null,
    gender: '',
    icNumber: '',
    age: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    phoneNumber: '',
    username: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    duprId: '',
    duprRating: '',
    parentGuardianName: '',
    parentGuardianIcNumber: '',
    parentGuardianContact: '',
    parentalConsent: false
  });

  const [prefilledInfo, setPrefilledInfo] = useState({
    softwareProvider: '',
    softwareName: ''
  });

  useEffect(() => {
    const fetchPrefilledData = async () => {
      try {
        const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

        const response = await fetch(`${PORTAL_API_URL}/unregistered-player/${token}`);
        const data = await response.json();

        if (data.success) {
          // Pre-fill the form with data from the token
          setRegisterFormData(prev => ({
            ...prev,
            fullName: data.player.fullName || '',
            email: data.player.email || '',
            phoneNumber: data.player.phoneNumber || '',
            age: data.player.age?.toString() || ''
          }));

          setPrefilledInfo({
            softwareProvider: data.player.softwareProvider || '',
            softwareName: data.player.softwareName || ''
          });

          // Check if already registered
          if (data.player.syncStatus === 'already_registered') {
            setError('This registration link has already been used. The player is already registered.');
          } else if (data.player.syncStatus === 'sync') {
            setError('This registration has already been completed.');
          }

          setLoading(false);
        } else {
          setError(data.error || 'Invalid registration link');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching pre-filled data:', err);
        setError('Failed to load registration data. Please try again later.');
        setLoading(false);
      }
    };

    // If token exists, try to fetch pre-filled data
    // If no token, just show the empty registration form
    if (token && token !== 'new') {
      fetchPrefilledData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleIcChange = async (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');

    let formatted = '';
    const digitsOnly = value.replace(/-/g, '');

    if (digitsOnly.length > 0) {
      formatted = digitsOnly.substring(0, 6);
      if (digitsOnly.length >= 7) {
        formatted += '-' + digitsOnly.substring(6, 8);
      }
      if (digitsOnly.length >= 9) {
        formatted += '-' + digitsOnly.substring(8, 12);
      }
    }

    if (digitsOnly.length <= 12) {
      setRegisterFormData(prev => ({ ...prev, icNumber: formatted }));

      // Calculate age from IC number
      if (digitsOnly.length >= 6) {
        const year = parseInt(digitsOnly.substring(0, 2));
        const currentYear = new Date().getFullYear() % 100;
        const fullYear = year > currentYear ? 1900 + year : 2000 + year;
        const age = new Date().getFullYear() - fullYear;
        setRegisterFormData(prev => ({ ...prev, age: age.toString() }));
      }

      // Check IC validation when complete
      if (digitsOnly.length === 12) {
        try {
          const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';
          const checkResponse = await fetch(`${PORTAL_API_URL}/players/check-ic/${formatted}`);
          const checkResult = await checkResponse.json();

          if (checkResult.exists) {
            setIcValidation({
              status: 'error',
              message: 'This I/C number is already registered'
            });
          } else {
            setIcValidation({
              status: 'success',
              message: 'I/C number is available'
            });
          }
        } catch (error) {
          console.error('Error checking IC:', error);
        }
      } else {
        setIcValidation({ status: '', message: '' });
      }
    }
  };

  const handleFormChange = (field, value) => {
    setRegisterFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRegisterFormData(prev => ({ ...prev, profilePicture: file }));
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (registerFormData.password !== registerFormData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    if (!registerFormData.termsAccepted) {
      alert('Please accept the terms and privacy policy!');
      return;
    }

    // Check parental consent for players under 18
    const age = parseInt(registerFormData.age);
    if (age < 18) {
      if (!registerFormData.parentGuardianName || registerFormData.parentGuardianName.trim() === '') {
        alert('Parent/Guardian name is required for players under 18!');
        return;
      }
      if (!registerFormData.parentGuardianIcNumber || registerFormData.parentGuardianIcNumber.trim() === '') {
        alert('Parent/Guardian IC number is required for players under 18!');
        return;
      }
      // Validate IC number format (should be 12 digits formatted as XXXXXX-XX-XXXX)
      const icDigitsOnly = registerFormData.parentGuardianIcNumber.replace(/-/g, '');
      if (icDigitsOnly.length !== 12) {
        alert('Parent/Guardian IC number must be 12 digits in format XXXXXX-XX-XXXX!');
        return;
      }
      if (!registerFormData.parentGuardianContact || registerFormData.parentGuardianContact.trim() === '') {
        alert('Parent/Guardian contact number is required for players under 18!');
        return;
      }
      if (!registerFormData.parentalConsent) {
        alert('Parental consent is required for players under 18!');
        return;
      }
    }

    setSubmitting(true);

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

      // Check if IC number already exists
      const checkResponse = await fetch(`${PORTAL_API_URL}/players/check-ic/${registerFormData.icNumber}`);
      const checkResult = await checkResponse.json();

      if (checkResult.exists) {
        const debugInfo = checkResult.debug ? ` (MPA ID: ${checkResult.debug.mpaId}, Name: ${checkResult.debug.fullName})` : '';

        // Update sync status to already_registered (only if we have a token)
        if (token && token !== 'new') {
          await fetch(`${PORTAL_API_URL}/unregistered-player/${token}/sync`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              syncStatus: 'already_registered'
            })
          });
        }

        setSubmitting(false);
        alert(`This I/C number (${registerFormData.icNumber}) is already registered${debugInfo}. A player with this I/C number already exists in our system. If you believe this is an error, please contact support.`);
        return;
      }

      // Check if email or phone already exists
      const emailCheckResponse = await fetch(`${PORTAL_API_URL}/players/check-email-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registerFormData.email,
          phoneNumber: registerFormData.phoneNumber
        })
      });

      const emailCheckResult = await emailCheckResponse.json();

      if (emailCheckResult.exists) {
        // Update sync status to already_registered (only if we have a token)
        if (token && token !== 'new') {
          await fetch(`${PORTAL_API_URL}/unregistered-player/${token}/sync`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              syncStatus: 'already_registered'
            })
          });
        }

        setSubmitting(false);
        alert(`${emailCheckResult.field === 'email' ? 'Email' : 'Phone number'} is already registered. Please use a different ${emailCheckResult.field}.`);
        return;
      }

      // Prepare form data for file upload
      const formData = new FormData();
      formData.append('fullName', registerFormData.fullName);
      formData.append('gender', registerFormData.gender);
      formData.append('icNumber', registerFormData.icNumber);
      formData.append('age', registerFormData.age);
      formData.append('email', registerFormData.email);
      formData.append('phoneNumber', registerFormData.phoneNumber);
      formData.append('addressLine1', registerFormData.addressLine1);
      formData.append('addressLine2', registerFormData.addressLine2);
      formData.append('city', registerFormData.city);
      formData.append('state', registerFormData.state);
      formData.append('username', registerFormData.username);
      formData.append('password', registerFormData.password);
      formData.append('termsAccepted', registerFormData.termsAccepted);

      // Include parental consent for players under 18
      if (age < 18) {
        formData.append('parentGuardianName', registerFormData.parentGuardianName);
        formData.append('parentGuardianIcNumber', registerFormData.parentGuardianIcNumber);
        formData.append('parentGuardianContact', registerFormData.parentGuardianContact);
        formData.append('parentalConsent', registerFormData.parentalConsent);
      }

      // Include token for sync only if it exists and is not 'new'
      if (token && token !== 'new') {
        formData.append('registrationToken', token);
      }

      if (registerFormData.duprId) {
        formData.append('duprId', registerFormData.duprId);
      }
      if (registerFormData.duprRating) {
        formData.append('duprRating', registerFormData.duprRating);
      }
      if (registerFormData.profilePicture) {
        formData.append('profilePicture', registerFormData.profilePicture);
      }

      const response = await fetch(`${PORTAL_API_URL}/players/register`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || 'Registration failed';
          // Add debug info if available
          if (error.details) {
            console.log('Error details:', error.details);
            errorMessage += ` (Existing player: MPA ID ${error.details.mpaId}, ${error.details.fullName})`;
          }
        } catch {
          errorMessage = `Registration service unavailable (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      // Check if response has content before parsing
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse response:', text);
        throw new Error('Invalid response from server');
      }

      // Registration successful - sync status will be updated by the backend
      alert(`Registration successful! Welcome to Malaysia Pickleball Association!\n\nA confirmation email with your login credentials has been sent to ${registerFormData.email}.\n\nPlease check your inbox (and spam folder) for further instructions.`);

      // Redirect to player login
      navigate('/player/login');

    } catch (error) {
      console.error('Registration error:', error);
      alert(`Registration failed: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <img src="/mpa.png" alt="MPA Logo" className="registration-logo" />
          <i className="fas fa-spinner fa-spin"></i>
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <img src="/mpa.png" alt="MPA Logo" />
          <h1>Registration Error</h1>
          <p>{error}</p>
          <Link to="/">Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-page">
      <div className="registration-container">
        {/* Header */}
        <div className="registration-header">
          <img src="/mpa.png" alt="MPA Logo" className="registration-logo" />
          <h1>Player Registration</h1>
          <p>
            {token && token !== 'new'
              ? 'Complete your registration to join Malaysia Pickleball Association'
              : 'Register as an official Malaysia Pickleball player and unlock exclusive benefits'}
          </p>
          {prefilledInfo.softwareProvider && (
            <div className="registration-info-badge">
              <i className="fas fa-info-circle"></i>
              Registered via {prefilledInfo.softwareProvider} ({prefilledInfo.softwareName})
            </div>
          )}
        </div>

        <form onSubmit={handleRegisterSubmit}>
          {/* Personal Information */}
          <div className="form-section">
            <h3>Personal Information</h3>

            <div className="form-group">
              <label htmlFor="fullName">Full Name *</label>
              <input
                type="text"
                id="fullName"
                value={registerFormData.fullName}
                onChange={(e) => handleFormChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                required
              />
              {token && token !== 'new' && (
                <small className="field-hint">Pre-filled from your registration request</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender *</label>
              <select
                id="gender"
                value={registerFormData.gender}
                onChange={(e) => handleFormChange('gender', e.target.value)}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="icNumber">IC Number * (XXXXXX-XX-XXXX)</label>
              <input
                type="text"
                id="icNumber"
                value={registerFormData.icNumber}
                onChange={handleIcChange}
                placeholder="000000-00-0000"
                required
              />
              {icValidation.status && (
                <small className={`ic-validation ${icValidation.status}`}>
                  {icValidation.message}
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="age">Age *</label>
              <input
                type="number"
                id="age"
                value={registerFormData.age}
                onChange={(e) => handleFormChange('age', e.target.value)}
                placeholder="Age"
                required
              />
              <small className="field-hint">Auto-calculated from IC number</small>
            </div>

            <div className="form-group">
              <label htmlFor="profilePicture">Profile Picture (Optional)</label>
              <input
                type="file"
                id="profilePicture"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <small className="field-hint">Upload a clear photo of yourself</small>
            </div>
          </div>

          {/* Parental Consent Section - Only show for ages under 18 */}
          {registerFormData.age && parseInt(registerFormData.age) < 18 && (
            <div className="form-section parental-consent-section">
              <div className="parental-consent-header">
                <i className="fas fa-user-shield"></i>
                <h3>Parental/Guardian Consent Required</h3>
                <p className="consent-description">
                  As the player is under 18 years old, we require consent from a parent or legal guardian to complete this registration.
                </p>
              </div>

              <div className="parental-consent-notice-banner">
                <i className="fas fa-exclamation-circle"></i>
                <div>
                  <strong>Important:</strong> A parent or legal guardian must complete this section and provide consent for the minor to participate in Malaysia Pickleball Association activities.
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="parentGuardianName">Parent/Guardian Full Name *</label>
                <input
                  type="text"
                  id="parentGuardianName"
                  value={registerFormData.parentGuardianName}
                  onChange={(e) => handleFormChange('parentGuardianName', e.target.value)}
                  placeholder="Enter parent or guardian full name as per IC"
                  required
                />
                <small className="field-hint">Full legal name of parent or guardian</small>
              </div>

              <div className="form-group">
                <label htmlFor="parentGuardianIcNumber">Parent/Guardian IC Number * (XXXXXX-XX-XXXX)</label>
                <input
                  type="text"
                  id="parentGuardianIcNumber"
                  value={registerFormData.parentGuardianIcNumber}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^0-9]/g, '');
                    let formatted = '';
                    const digitsOnly = value.replace(/-/g, '');

                    if (digitsOnly.length > 0) {
                      formatted = digitsOnly.substring(0, 6);
                      if (digitsOnly.length >= 7) {
                        formatted += '-' + digitsOnly.substring(6, 8);
                      }
                      if (digitsOnly.length >= 9) {
                        formatted += '-' + digitsOnly.substring(8, 12);
                      }
                    }

                    if (digitsOnly.length <= 12) {
                      handleFormChange('parentGuardianIcNumber', formatted);
                    }
                  }}
                  placeholder="000000-00-0000"
                  required
                />
                <small className="field-hint">Parent or guardian's IC number for verification</small>
              </div>

              <div className="form-group">
                <label htmlFor="parentGuardianContact">Parent/Guardian Contact Number *</label>
                <input
                  type="tel"
                  id="parentGuardianContact"
                  value={registerFormData.parentGuardianContact}
                  onChange={(e) => handleFormChange('parentGuardianContact', e.target.value)}
                  placeholder="+60123456789"
                  required
                />
                <small className="field-hint">Contact number to reach parent or guardian</small>
              </div>

              <div className="parental-consent-declaration">
                <h4>Parental Consent Declaration</h4>
                <div className="declaration-content">
                  <p>I, the undersigned parent/legal guardian, hereby:</p>
                  <ul>
                    <li>Confirm that I am the parent or legal guardian of the player named in this registration</li>
                    <li>Give permission for my child to register with Malaysia Pickleball Association</li>
                    <li>Consent to my child's participation in pickleball activities, training, and events</li>
                    <li>Acknowledge that I have read and agree to the terms and conditions on behalf of my child</li>
                    <li>Understand that I can be contacted regarding my child's participation</li>
                  </ul>
                </div>

                <label className="parental-consent-checkbox">
                  <input
                    type="checkbox"
                    checked={registerFormData.parentalConsent}
                    onChange={(e) => handleFormChange('parentalConsent', e.target.checked)}
                    required
                  />
                  <span>
                    <strong>I confirm that I am the parent/legal guardian and I give my full consent</strong> for the minor player to register and participate in Malaysia Pickleball Association activities. I acknowledge that I have read and understood the declaration above.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="form-section">
            <h3>Contact Information</h3>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                value={registerFormData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                placeholder="your.email@example.com"
                required
              />
              {token && token !== 'new' && (
                <small className="field-hint">Pre-filled from your registration request</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number *</label>
              <input
                type="tel"
                id="phoneNumber"
                value={registerFormData.phoneNumber}
                onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                placeholder="+60123456789"
                required
              />
              {token && token !== 'new' && (
                <small className="field-hint">Pre-filled from your registration request</small>
              )}
            </div>
          </div>

          {/* Address Information */}
          <div className="form-section">
            <h3>Address Information</h3>

            <div className="form-group">
              <label htmlFor="addressLine1">Address Line 1 *</label>
              <input
                type="text"
                id="addressLine1"
                value={registerFormData.addressLine1}
                onChange={(e) => handleFormChange('addressLine1', e.target.value)}
                placeholder="Street address, P.O. box"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="addressLine2">Address Line 2</label>
              <input
                type="text"
                id="addressLine2"
                value={registerFormData.addressLine2}
                onChange={(e) => handleFormChange('addressLine2', e.target.value)}
                placeholder="Apartment, suite, unit, building, floor, etc. (optional)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input
                type="text"
                id="city"
                value={registerFormData.city}
                onChange={(e) => handleFormChange('city', e.target.value)}
                placeholder="Enter your city"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">State *</label>
              <select
                id="state"
                value={registerFormData.state}
                onChange={(e) => handleFormChange('state', e.target.value)}
                required
              >
                <option value="">Select State</option>
                <option value="Johor">Johor</option>
                <option value="Kedah">Kedah</option>
                <option value="Kelantan">Kelantan</option>
                <option value="Kuala Lumpur">Kuala Lumpur</option>
                <option value="Labuan">Labuan</option>
                <option value="Melaka">Melaka</option>
                <option value="Negeri Sembilan">Negeri Sembilan</option>
                <option value="Pahang">Pahang</option>
                <option value="Penang">Penang</option>
                <option value="Perak">Perak</option>
                <option value="Perlis">Perlis</option>
                <option value="Putrajaya">Putrajaya</option>
                <option value="Sabah">Sabah</option>
                <option value="Sarawak">Sarawak</option>
                <option value="Selangor">Selangor</option>
                <option value="Terengganu">Terengganu</option>
              </select>
            </div>
          </div>

          {/* Account Information */}
          <div className="form-section">
            <h3>Account Information</h3>

            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                value={registerFormData.username}
                onChange={(e) => handleFormChange('username', e.target.value)}
                placeholder="Choose a unique username"
                required
              />
              <small className="field-hint">This will be used for logging into your account</small>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                value={registerFormData.password}
                onChange={(e) => handleFormChange('password', e.target.value)}
                placeholder="Create a strong password"
                required
              />
              <small className="field-hint">Minimum 8 characters recommended</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                value={registerFormData.confirmPassword}
                onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
                placeholder="Re-enter your password"
                required
              />
            </div>
          </div>

          {/* DUPR Information */}
          <div className="form-section">
            <h3>DUPR Information (Optional)</h3>

            <div className="form-group">
              <label htmlFor="duprId">DUPR ID</label>
              <input
                type="text"
                id="duprId"
                value={registerFormData.duprId}
                onChange={(e) => handleFormChange('duprId', e.target.value)}
                placeholder="Enter your DUPR ID if you have one"
              />
              <small className="field-hint">Leave blank if you don't have a DUPR account</small>
            </div>

            <div className="form-group">
              <label htmlFor="duprRating">DUPR Rating</label>
              <input
                type="text"
                id="duprRating"
                value={registerFormData.duprRating}
                onChange={(e) => handleFormChange('duprRating', e.target.value)}
                placeholder="e.g., 4.5"
              />
              <small className="field-hint">Your current DUPR skill rating</small>
            </div>
          </div>

          {/* Consent & Agreement */}
          <div className="form-section">
            <h3>Consent & Agreement</h3>

            <div className="consent-section">
              <label className="consent-checkbox">
                <input
                  type="checkbox"
                  checked={registerFormData.termsAccepted}
                  onChange={(e) => handleFormChange('termsAccepted', e.target.checked)}
                  required
                />
                <span>
                  I agree to the <Link to="/terms-and-conditions" target="_blank">Terms and Conditions</Link> and <Link to="/privacy-policy" target="_blank">Privacy Policy</Link> of Malaysia Pickleball Association
                </span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={icValidation.status === 'error' || submitting}
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Processing Registration...
                </>
              ) : (
                'Complete Registration'
              )}
            </button>
          </div>

          <div className="login-link">
            Already have an account?
            <Link to="/player/login">Sign In</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PlayerRegistration;
