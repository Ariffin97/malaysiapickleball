import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PlayerDashboard.css';

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
      state: playerData.state
    });
    setShowEditModal(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const playerId = localStorage.getItem('playerId');
      const token = localStorage.getItem('playerToken');
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

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
        alert('Profile updated successfully!');
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});

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
                      <span className="stat-value">{playerData.skillLevel || 'Beginner'}</span>
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
                <p className="subtitle">Messages from administrators</p>
              </div>
            </div>

            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-messages">
                  <i className="fas fa-inbox"></i>
                  <p>No messages yet</p>
                </div>
              ) : (
                <div className="messages-list">
                  {messages.map((message) => (
                    <div key={message._id} className={`message-card ${message.read ? 'read' : 'unread'}`}>
                      <div className="message-header">
                        <div className="message-from">
                          <i className="fas fa-user-shield"></i>
                          <span>Administrator</span>
                        </div>
                        <div className="message-date">
                          {new Date(message.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="message-subject">
                        {!message.read && <span className="unread-badge"></span>}
                        {message.subject}
                      </div>
                      <div className="message-body">
                        {message.message}
                      </div>
                    </div>
                  ))}
                </div>
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
