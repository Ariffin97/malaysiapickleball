import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ManageTournament from '../components/ManageTournament';
import ManageJourney from '../components/ManageJourney';
import ManagePlayers from '../components/ManagePlayers';
import UnregisteredPlayers from '../components/UnregisteredPlayers';
import ManageNews from '../components/ManageNews';
import ManageCourses from '../components/ManageCourses';
import ManageClinics from '../components/ManageClinics';
import ManageMessages from '../components/ManageMessages';
import ManagePickleZoneReports from '../components/ManagePickleZoneReports';
import './AdminDashboard.css';

function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState('manage-tournament');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
      navigate('/admin');
    }
  }, [navigate]);

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Prevent body scroll when sidebar is open on mobile
    if (sidebarOpen && window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  const [pickleZoneExpanded, setPickleZoneExpanded] = useState(false);
  const [playersExpanded, setPlayersExpanded] = useState(false);

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
      isSection: true,
      subItems: [
        {
          id: 'registered-players',
          icon: 'fa-user-check',
          label: 'Registered Players',
        },
        {
          id: 'unregistered-players',
          icon: 'fa-user-clock',
          label: 'Unregistered Players',
        },
      ],
    },
    {
      id: 'manage-messages',
      icon: 'fa-envelope',
      label: 'Messages',
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
      id: 'picklezone',
      icon: 'fa-table-tennis',
      label: 'PickleZone',
      isSection: true,
      subItems: [
        {
          id: 'picklezone-report',
          icon: 'fa-chart-bar',
          label: 'Report',
        },
        {
          id: 'picklezone-enquiry',
          icon: 'fa-question-circle',
          label: 'Enquiry',
        },
      ],
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
      case 'registered-players':
        return (
          <div className="dashboard-content">
            <ManagePlayers />
          </div>
        );

      case 'unregistered-players':
        return (
          <div className="dashboard-content">
            <UnregisteredPlayers />
          </div>
        );

      case 'manage-messages':
        return (
          <div className="dashboard-content">
            <ManageMessages />
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

      case 'picklezone-report':
        return (
          <div className="dashboard-content">
            <ManagePickleZoneReports />
          </div>
        );

      case 'picklezone-enquiry':
        return (
          <div className="dashboard-content">
            <div className="content-header">
              <h1>PickleZone Enquiry</h1>
            </div>
            <div className="content-body">
              <p className="placeholder-text">PickleZone enquiry management interface will be here</p>
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

  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
    // Close sidebar on mobile after clicking menu item
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Mobile Overlay */}
      {sidebarOpen && window.innerWidth <= 768 && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
            <div key={item.id}>
              {item.isSection ? (
                <>
                  <button
                    className={`nav-item section-item ${
                      (item.id === 'picklezone' && pickleZoneExpanded) ||
                      (item.id === 'manage-players' && playersExpanded)
                        ? 'expanded'
                        : ''
                    }`}
                    onClick={() => {
                      if (item.id === 'picklezone') {
                        setPickleZoneExpanded(!pickleZoneExpanded);
                      } else if (item.id === 'manage-players') {
                        setPlayersExpanded(!playersExpanded);
                      }
                    }}
                  >
                    <i className={`fas ${item.icon}`}></i>
                    {sidebarOpen && <span>{item.label}</span>}
                    {sidebarOpen && (
                      <i className={`fas fa-chevron-${
                        (item.id === 'picklezone' && pickleZoneExpanded) ||
                        (item.id === 'manage-players' && playersExpanded)
                          ? 'down'
                          : 'right'
                      } chevron-icon`}></i>
                    )}
                  </button>
                  {((item.id === 'picklezone' && pickleZoneExpanded) ||
                    (item.id === 'manage-players' && playersExpanded)) && sidebarOpen && (
                    <div className="sub-menu">
                      {item.subItems.map((subItem) => (
                        <button
                          key={subItem.id}
                          className={`nav-item sub-item ${activeMenu === subItem.id ? 'active' : ''}`}
                          onClick={() => handleMenuClick(subItem.id)}
                        >
                          <i className={`fas ${subItem.icon}`}></i>
                          <span>{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
                  onClick={() => handleMenuClick(item.id)}
                >
                  <i className={`fas ${item.icon}`}></i>
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              )}
            </div>
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
