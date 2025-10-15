import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PlayerDashboard.css';

// Function to calculate skill level from DUPR rating
function calculateSkillLevel(duprRating) {
  if (!duprRating || duprRating <= 0) {
    return 'Beginner';
  }

  if (duprRating <= 2.499) {
    return 'Novice';
  } else if (duprRating <= 2.999) {
    return 'Intermediate';
  } else if (duprRating <= 3.499) {
    return 'Intermediate+';
  } else if (duprRating <= 3.999) {
    return 'Advanced';
  } else if (duprRating <= 4.499) {
    return 'Advanced+';
  } else {
    return 'Elite';
  }
}

function PlayerDashboard() {
  const [activeMenu, setActiveMenu] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('playerLoggedIn');
    if (!isLoggedIn) {
      navigate('/player/login');
      return;
    }

    // Fetch player data
    const fetchPlayerData = async () => {
      try {
        const playerId = localStorage.getItem('playerId');
        const token = localStorage.getItem('playerToken');
        const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

        const response = await fetch(`${PORTAL_API_URL}/players/${playerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPlayerData(data);
        } else {
          // If unauthorized, redirect to login
          handleLogout();
        }
      } catch (error) {
        console.error('Error fetching player data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
    fetchMessages();
  }, [navigate]);

  const fetchMessages = async () => {
    try {
      const playerId = localStorage.getItem('playerId');
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

      const response = await fetch(`${PORTAL_API_URL}/players/${playerId}/messages`);

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        const unread = data.filter(msg => !msg.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleMessageClick = async (message) => {
    setSelectedMessage(message);

    // Mark message as read if it's unread
    if (!message.read) {
      try {
        const playerId = localStorage.getItem('playerId');
        const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

        await fetch(`${PORTAL_API_URL}/players/${playerId}/messages/${message._id}/read`, {
          method: 'PATCH',
        });

        // Update local state
        setMessages(messages.map(msg =>
          msg._id === message._id ? { ...msg, read: true } : msg
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('playerLoggedIn');
    localStorage.removeItem('playerToken');
    localStorage.removeItem('playerId');
    localStorage.removeItem('playerName');
    navigate('/player/login');
  };

  const handleEditProfile = () => {
    setEditFormData({
      fullName: playerData.fullName,
      email: playerData.email,
      phoneNumber: playerData.phoneNumber,
      gender: playerData.gender,
      addressLine1: playerData.addressLine1,
      addressLine2: playerData.addressLine2 || '',
      city: playerData.city,
      state: playerData.state,
      duprRating: playerData.duprRating || '',
      duprId: playerData.duprId || ''
    });
    setSelectedProfilePicture(null);
    setProfilePicturePreview(playerData.profilePicture || null);
    setShowEditModal(true);
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedProfilePicture(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const playerId = localStorage.getItem('playerId');
      const token = localStorage.getItem('playerToken');
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

      // If profile picture is selected, upload it first
      if (selectedProfilePicture) {
        const formData = new FormData();
        formData.append('profilePicture', selectedProfilePicture);

        const uploadResponse = await fetch(`${PORTAL_API_URL}/players/${playerId}/profile-picture`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          alert('Error uploading profile picture');
          return;
        }
      }

      // Update other profile fields
      const response = await fetch(`${PORTAL_API_URL}/players/${playerId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        const updatedData = await response.json();
        setPlayerData(updatedData);
        setShowEditModal(false);
        setSelectedProfilePicture(null);
        setProfilePicturePreview(null);
        alert('Profile updated successfully!');
        // Reload to show new profile picture
        window.location.reload();
      } else {
        alert('Error updating profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [selectedProfilePicture, setSelectedProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  const menuItems = [
    {
      id: 'profile',
      icon: 'fa-user',
      label: 'My Profile',
    },
    {
      id: 'inbox',
      icon: 'fa-inbox',
      label: 'Inbox',
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      id: 'tournaments',
      icon: 'fa-trophy',
      label: 'My Tournaments',
    },
    {
      id: 'stats',
      icon: 'fa-chart-bar',
      label: 'Statistics',
    },
    {
      id: 'training',
      icon: 'fa-dumbbell',
      label: 'Training Programs',
    },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="dashboard-content">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading...</p>
          </div>
        </div>
      );
    }

    switch (activeMenu) {
      case 'profile':
        return (
          <div className="dashboard-content">
            <div className="content-header">
              <div>
                <h1>My Profile</h1>
                <p className="subtitle">Manage your personal information</p>
              </div>
              <button className="btn-edit-profile" onClick={handleEditProfile}>
                <i className="fas fa-edit"></i>
                Edit Profile
              </button>
            </div>

            {playerData && (
              <>
                {/* Profile Summary Card */}
                <div className="profile-summary-card">
                  <div className="profile-avatar-section">
                    <div className="profile-avatar">
                      {playerData.profilePicture ? (
                        <img src={playerData.profilePicture} alt={playerData.fullName} />
                      ) : (
                        <i className="fas fa-user"></i>
                      )}
                    </div>
                    <div className="profile-main-info">
                      <h2>{playerData.fullName}</h2>
                      <p className="username">@{playerData.username}</p>
                      <div className="mpa-id-display">
                        <i className="fas fa-id-badge"></i>
                        <span>{playerData.playerId}</span>
                      </div>
                    </div>
                  </div>
                  <div className="profile-stats">
                    <div className="stat-item">
                      <span className="stat-label">Membership</span>
                      <span className="stat-value">{playerData.membershipType || 'Standard'}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Skill Level</span>
                      <span className="stat-value">{calculateSkillLevel(playerData.duprRating)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">DUPR Rating</span>
                      <span className="stat-value">{playerData.duprRating || 'Not set'}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Status</span>
                      <span className={`stat-value status-${playerData.status}`}>
                        {playerData.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Information Grid */}
                <div className="info-grid">
                  {/* Personal Information */}
                  <div className="info-card">
                    <div className="info-card-header">
                      <i className="fas fa-user-circle"></i>
                      <h3>Personal Information</h3>
                    </div>
                    <div className="info-card-body">
                      <div className="info-item">
                        <span className="info-label">Email</span>
                        <span className="info-value">{playerData.email}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Phone</span>
                        <span className="info-value">{playerData.phoneNumber}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Gender</span>
                        <span className="info-value">{playerData.gender}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Age</span>
                        <span className="info-value">{playerData.age} years old</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">I/C Number</span>
                        <span className="info-value">{playerData.icNumber}</span>
                      </div>
                      {playerData.duprId && (
                        <div className="info-item">
                          <span className="info-label">DUPR ID</span>
                          <span className="info-value">{playerData.duprId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="info-card">
                    <div className="info-card-header">
                      <i className="fas fa-map-marker-alt"></i>
                      <h3>Address</h3>
                    </div>
                    <div className="info-card-body">
                      <div className="info-item">
                        <span className="info-label">Street</span>
                        <span className="info-value">{playerData.addressLine1}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">City</span>
                        <span className="info-value">{playerData.city}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">State</span>
                        <span className="info-value">{playerData.state}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 'inbox':
        return (
          <div className="dashboard-content">
            <div className="content-header">
              <div>
                <h1>Inbox</h1>
              </div>
            </div>

            <div className="inbox-split-container">
              {messages.length === 0 ? (
                <div className="empty-messages">
                  <i className="fas fa-inbox"></i>
                  <p>No messages yet</p>
                </div>
              ) : (
                <>
                  {/* Messages List - Left Side */}
                  <div className="inbox-messages-list">
                    {messages.map((message) => (
                      <div
                        key={message._id}
                        className={`inbox-message-item ${selectedMessage?._id === message._id ? 'selected' : ''} ${message.read ? 'read' : 'unread'}`}
                        onClick={() => handleMessageClick(message)}
                      >
                        <div className="inbox-message-item-header">
                          <div className="inbox-message-from">
                            <i className="fas fa-user-shield"></i>
                            <span>Administrator</span>
                          </div>
                          {!message.read && <span className="inbox-unread-dot"></span>}
                        </div>
                        <div className="inbox-message-subject">
                          {message.subject}
                        </div>
                        <div className="inbox-message-preview">
                          {message.message.length > 60 ? message.message.substring(0, 60) + '...' : message.message}
                        </div>
                        <div className="inbox-message-date">
                          {new Date(message.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Content - Right Side */}
                  <div className="inbox-message-content">
                    {selectedMessage ? (
                      <>
                        <div className="inbox-content-header">
                          <h2>{selectedMessage.subject}</h2>
                          <div className="inbox-content-meta">
                            <div className="inbox-content-from">
                              <i className="fas fa-user-shield"></i>
                              <span>Administrator</span>
                            </div>
                            <div className="inbox-content-date">
                              {new Date(selectedMessage.createdAt).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="inbox-content-body">
                          {selectedMessage.message}
                        </div>
                      </>
                    ) : (
                      <div className="inbox-no-selection">
                        <i className="fas fa-envelope-open"></i>
                        <p>Select a message to read</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'tournaments':
        return (
          <div className="dashboard-content">
            <div className="content-header">
              <h1>My Tournaments</h1>
            </div>
            <div className="content-body">
              <p className="placeholder-text">Your tournament registrations will appear here</p>
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="dashboard-content">
            <div className="content-header">
              <h1>Statistics</h1>
            </div>
            <div className="content-body">
              <p className="placeholder-text">Your performance statistics will appear here</p>
            </div>
          </div>
        );

      case 'training':
        return (
          <div className="dashboard-content">
            <div className="content-header">
              <h1>Training Programs</h1>
            </div>
            <div className="content-body">
              <p className="placeholder-text">Available training programs will appear here</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="dashboard-content">
            <p className="placeholder-text">Select a menu item</p>
          </div>
        );
    }
  };

  return (
    <div className="player-dashboard">
      {/* Top Header */}
      <header className="dashboard-header">
        <button
          className="toggle-sidebar"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <i className="fas fa-bars"></i>
        </button>
        <div className="header-info">
          <h2>Welcome, {playerData?.fullName || 'Player'}</h2>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <img src="/mpa.png" alt="MPA Logo" className="sidebar-logo" />
            {sidebarOpen && <span className="sidebar-title">Player Portal</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.id)}
            >
              <i className={`fas ${item.icon}`}></i>
              {sidebarOpen && <span>{item.label}</span>}
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="dashboard-body">
          {renderContent()}
        </div>
      </main>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleUpdateProfile}>
                {/* Profile Picture Upload */}
                <div className="profile-picture-upload-section">
                  <label>Profile Picture</label>
                  <div className="profile-picture-upload">
                    <div className="profile-picture-preview">
                      {profilePicturePreview ? (
                        <img src={profilePicturePreview} alt="Profile preview" />
                      ) : (
                        <i className="fas fa-user"></i>
                      )}
                    </div>
                    <div className="profile-picture-actions">
                      <input
                        type="file"
                        id="profile-picture-input"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="profile-picture-input" className="btn-upload-picture">
                        <i className="fas fa-camera"></i>
                        {profilePicturePreview ? 'Change Picture' : 'Upload Picture'}
                      </label>
                      <p className="upload-hint">Max size: 5MB. Supported formats: JPG, PNG, GIF</p>
                    </div>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={editFormData.fullName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      value={editFormData.phoneNumber || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      value={editFormData.gender || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>DUPR ID</label>
                    <input
                      type="text"
                      placeholder="Enter your DUPR ID"
                      value={editFormData.duprId || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, duprId: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>DUPR Rating</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max="8"
                      placeholder="Enter your DUPR rating"
                      value={editFormData.duprRating || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, duprRating: e.target.value })}
                    />
                    <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      {editFormData.duprRating && editFormData.duprRating > 0
                        ? `Skill Level: ${calculateSkillLevel(parseFloat(editFormData.duprRating))}`
                        : 'Your skill level will be calculated automatically'}
                    </small>
                  </div>

                  <div className="form-group full-width">
                    <label>Address Line 1 *</label>
                    <input
                      type="text"
                      value={editFormData.addressLine1 || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, addressLine1: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      value={editFormData.addressLine2 || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, addressLine2: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      value={editFormData.city || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>State *</label>
                    <input
                      type="text"
                      value={editFormData.state || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerDashboard;
