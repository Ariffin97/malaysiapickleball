import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ManageTournament from '../components/ManageTournament';
import ManageJourney from '../components/ManageJourney';
import ManagePlayers from '../components/ManagePlayers';
import ManageNews from '../components/ManageNews';
import ManageCourses from '../components/ManageCourses';
import ManageClinics from '../components/ManageClinics';
import './AdminDashboard.css';

function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState('manage-tournament');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  const menuItems = [
    {
      id: 'manage-tournament',
      icon: 'fa-trophy',
      label: 'Manage Tournament',
    },
    {
      id: 'manage-players',
      icon: 'fa-users',
      label: 'Manage Players',
    },
    {
      id: 'manage-courses',
      icon: 'fa-graduation-cap',
      label: 'Manage Courses',
    },
    {
      id: 'manage-clinics',
      icon: 'fa-chalkboard-teacher',
      label: 'Manage Clinics',
    },
    {
      id: 'manage-journey',
      icon: 'fa-map-marked-alt',
      label: 'Manage Journey',
    },
    {
      id: 'update-news',
      icon: 'fa-newspaper',
      label: 'Update News & Video',
    },
    {
      id: 'manage-venue',
      icon: 'fa-map-marker-alt',
      label: 'Manage Venue',
    },
    {
      id: 'settings',
      icon: 'fa-cog',
      label: 'Settings',
    },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'manage-tournament':
        return (
          <div className="dashboard-content">
            <ManageTournament />
          </div>
        );

      case 'manage-players':
        return (
          <div className="dashboard-content">
            <ManagePlayers />
          </div>
        );

      case 'manage-courses':
        return (
          <div className="dashboard-content">
            <ManageCourses />
          </div>
        );

      case 'manage-clinics':
        return (
          <div className="dashboard-content">
            <ManageClinics />
          </div>
        );

      case 'manage-journey':
        return (
          <div className="dashboard-content">
            <ManageJourney />
          </div>
        );

      case 'update-news':
        return (
          <div className="dashboard-content">
            <ManageNews />
          </div>
        );

      case 'manage-venue':
        return (
          <div className="dashboard-content">
            <div className="content-header">
              <h1>Manage Venue</h1>
              <button className="btn-primary">
                <i className="fas fa-plus"></i>
                Add New Venue
              </button>
            </div>
            <div className="content-body">
              <p className="placeholder-text">Venue management interface will be here</p>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="dashboard-content">
            <div className="content-header">
              <h1>Settings</h1>
            </div>
            <div className="content-body">
              <div className="settings-section">
                <h2>Account Settings</h2>
                <div className="settings-form">
                  <div className="form-group">
                    <label>Change Username</label>
                    <input type="text" placeholder="Enter new username" />
                  </div>
                  <div className="form-group">
                    <label>Change Password</label>
                    <input type="password" placeholder="Enter new password" />
                  </div>
                  <button className="btn-primary">Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Top Header */}
      <header className="dashboard-header">
        <button
          className="toggle-sidebar"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <i className="fas fa-bars"></i>
        </button>
        <div className="header-info">
          <h2>Welcome, Admin</h2>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <img src="/mpa.png" alt="MPA Logo" className="sidebar-logo" />
            {sidebarOpen && <span className="sidebar-title">Admin Panel</span>}
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
          <a href="/" className="nav-item home-btn">
            <i className="fas fa-home"></i>
            {sidebarOpen && <span>Home</span>}
          </a>
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Content Area */}
        <main className="content-area">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
