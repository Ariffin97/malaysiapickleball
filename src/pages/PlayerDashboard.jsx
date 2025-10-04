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
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('playerLoggedIn');
    localStorage.removeItem('playerToken');
    localStorage.removeItem('playerId');
    localStorage.removeItem('playerName');
    navigate('/player/login');
  };

  const menuItems = [
    {
      id: 'profile',
      icon: 'fa-user',
      label: 'My Profile',
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
                      <span className={`stat-value status-${playerData.membershipStatus}`}>
                        {playerData.membershipStatus}
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
    </div>
  );
}

export default PlayerDashboard;
