import { useState, useEffect } from 'react';
import './ManagePlayers.css';

function ManagePlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterAge, setFilterAge] = useState('all');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [credentials, setCredentials] = useState(null);
  const [messageData, setMessageData] = useState({ subject: '', message: '', playerName: '', playerEmail: '' });
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.action-dropdown')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);

  // Helper function to extract date of birth from Malaysian IC number
  const extractDOBFromIC = (icNumber) => {
    if (!icNumber || icNumber === 'N/A') return null;

    // Malaysian IC format: YYMMDD-PB-###G
    const icParts = icNumber.split('-');
    if (icParts.length < 1) return null;

    const dateStr = icParts[0];
    if (dateStr.length !== 6) return null;

    try {
      const year = dateStr.substring(0, 2);
      const month = dateStr.substring(2, 4);
      const day = dateStr.substring(4, 6);

      // Determine century (assume year < 30 is 2000s, otherwise 1900s)
      const fullYear = parseInt(year) < 30 ? `20${year}` : `19${year}`;

      // Create date object
      const dob = new Date(`${fullYear}-${month}-${day}`);

      // Validate the date
      if (isNaN(dob.getTime())) return null;

      return dob.toISOString();
    } catch (error) {
      return null;
    }
  };

  const fetchPlayers = async () => {
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';
      const response = await fetch(`${PORTAL_API_URL}/players`);
      const data = await response.json();

      // Transform the data to match our needs
      const transformedPlayers = (Array.isArray(data) ? data : []).map(player => ({
        id: player._id,
        playerId: player.playerId || player._id,
        fullName: player.fullName || 'N/A',
        email: player.email || 'N/A',
        phone: player.phoneNumber || 'N/A',
        gender: player.gender || 'N/A',
        icNumber: player.icNumber || 'N/A',
        city: player.city || 'N/A',
        state: player.state || 'N/A',
        membershipStatus: player.status || 'active',
        membershipType: 'Standard',
        registrationDate: player.createdAt,
        skillLevel: 'N/A',
        username: player.username || 'N/A',
        profilePicture: player.profilePicture,
        dateOfBirth: player.dateOfBirth || extractDOBFromIC(player.icNumber),
        addressLine1: player.addressLine1 || 'N/A',
        addressLine2: player.addressLine2 || '',
        street: player.addressLine1 || 'N/A',
        age: player.age
      }));

      setPlayers(transformedPlayers);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewPlayerDetails = (player) => {
    setSelectedPlayer(player);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedPlayer(null);
  };

  const handleEditPlayer = (player) => {
    setEditFormData({
      playerId: player.playerId,
      fullName: player.fullName,
      email: player.email,
      phoneNumber: player.phone,
      gender: player.gender,
      icNumber: player.icNumber,
      city: player.city,
      state: player.state,
      addressLine1: player.addressLine1,
      addressLine2: player.addressLine2,
      status: player.membershipStatus
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';
      const response = await fetch(`${PORTAL_API_URL}/players/${editFormData.playerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        alert('Player updated successfully');
        setShowEditModal(false);
        fetchPlayers();
      } else {
        const error = await response.json();
        alert('Error updating player: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating player:', error);
      alert('Error updating player');
    }
  };

  const handleSuspendPlayer = async (player) => {
    if (!confirm(`Are you sure you want to suspend ${player.fullName}?`)) return;

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';
      const response = await fetch(`${PORTAL_API_URL}/players/${player.playerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'suspended' })
      });

      if (response.ok) {
        alert('Player suspended successfully');
        fetchPlayers();
      } else {
        alert('Error suspending player');
      }
    } catch (error) {
      console.error('Error suspending player:', error);
      alert('Error suspending player');
    }
  };

  const handleMessagePlayer = (player) => {
    setMessageData({
      subject: '',
      message: '',
      playerName: player.fullName,
      playerEmail: player.email,
      playerId: player.playerId
    });
    setShowMessageModal(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';
      const response = await fetch(`${PORTAL_API_URL}/players/${messageData.playerId}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: messageData.subject,
          message: messageData.message
        })
      });

      if (response.ok) {
        alert('Message sent successfully!');
        setShowMessageModal(false);
        setMessageData({ subject: '', message: '', playerName: '', playerEmail: '' });
      } else {
        const error = await response.json();
        alert('Error sending message: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    }
  };

  const handleViewCredentials = async (player) => {
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';
      const response = await fetch(`${PORTAL_API_URL}/players/${player.playerId}/credentials`);

      if (response.ok) {
        const data = await response.json();
        setCredentials({ ...data, playerId: player.playerId });
        setShowCredentialsModal(true);
      } else {
        alert('Error fetching credentials');
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
      alert('Error fetching credentials');
    }
  };

  const handleResetPassword = async () => {
    if (!confirm('Generate a new password for this player? The old password will no longer work.')) return;

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';
      const response = await fetch(`${PORTAL_API_URL}/players/${credentials.playerId}/reset-password`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setCredentials({ ...credentials, password: data.newPassword, isPlainText: true });
        alert('New password generated successfully!');
      } else {
        alert('Error generating new password');
      }
    } catch (error) {
      console.error('Error generating password:', error);
      alert('Error generating new password');
    }
  };

  const handleDeletePlayer = async (player) => {
    if (!confirm(`Are you sure you want to delete ${player.fullName}? This action cannot be undone.`)) return;

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';
      const response = await fetch(`${PORTAL_API_URL}/players/${player.playerId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Player deleted successfully');
        fetchPlayers();
      } else {
        alert('Error deleting player');
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Error deleting player');
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch =
      player.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.playerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.icNumber.includes(searchTerm);

    const matchesStatus =
      filterStatus === 'all' || player.membershipStatus === filterStatus;

    const matchesState =
      filterState === 'all' || player.state === filterState;

    const matchesGender =
      filterGender === 'all' || player.gender === filterGender;

    const matchesAge = () => {
      if (filterAge === 'all') return true;
      const age = player.age;
      if (!age) return false;

      switch (filterAge) {
        case 'under-18':
          return age < 18;
        case '18-30':
          return age >= 18 && age <= 30;
        case '31-45':
          return age >= 31 && age <= 45;
        case '46-60':
          return age >= 46 && age <= 60;
        case 'over-60':
          return age > 60;
        default:
          return true;
      }
    };

    return matchesSearch && matchesStatus && matchesState && matchesGender && matchesAge();
  });

  // Get unique states from players
  const uniqueStates = ['all', ...new Set(players.map(p => p.state).filter(s => s && s !== 'N/A'))];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="manage-players">
      <div className="content-header">
        <div>
          <h1>Manage Players</h1>
          <p className="subtitle">View and manage all registered players</p>
        </div>
        <div className="player-stats">
          <div className="stat-badge">
            <i className="fas fa-users"></i>
            <span>{players.length} Players</span>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by name, MPA ID, email, or IC number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters-container">
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            className="filter-select"
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
          >
            {uniqueStates.map(state => (
              <option key={state} value={state}>
                {state === 'all' ? 'All States' : state}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
          >
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <select
            className="filter-select"
            value={filterAge}
            onChange={(e) => setFilterAge(e.target.value)}
          >
            <option value="all">All Ages</option>
            <option value="under-18">Under 18</option>
            <option value="18-30">18-30</option>
            <option value="31-45">31-45</option>
            <option value="46-60">46-60</option>
            <option value="over-60">Over 60</option>
          </select>
        </div>
      </div>

      <div className="content-body">
        {loading ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading players...</p>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-user-slash"></i>
            <p>No players found</p>
          </div>
        ) : (
          <div className="players-table-container">
            <table className="players-table">
              <thead>
                <tr>
                  <th>MPA ID</th>
                  <th>Full Name</th>
                  <th>IC Number</th>
                  <th>Email</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => (
                  <tr key={player.id}>
                    <td className="mpa-id-cell">
                      <span className="mpa-id">{player.playerId}</span>
                    </td>
                    <td>
                      <span className="player-name">{player.fullName}</span>
                    </td>
                    <td>{player.icNumber}</td>
                    <td>{player.email}</td>
                    <td>{player.age || 'N/A'}</td>
                    <td>{player.gender}</td>
                    <td>
                      <span className={`status-badge status-${player.membershipStatus}`}>
                        {player.membershipStatus}
                      </span>
                    </td>
                    <td>
                      <div className="action-dropdown">
                        <button
                          className="dropdown-trigger"
                          onClick={() => setOpenDropdown(openDropdown === player.id ? null : player.id)}
                        >
                          <i className="fas fa-ellipsis-h"></i>
                        </button>
                        {openDropdown === player.id && (
                          <div className="dropdown-menu">
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                viewPlayerDetails(player);
                                setOpenDropdown(null);
                              }}
                            >
                              <i className="fas fa-eye"></i>
                              View Details
                            </button>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                handleEditPlayer(player);
                                setOpenDropdown(null);
                              }}
                            >
                              <i className="fas fa-edit"></i>
                              Edit
                            </button>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                handleSuspendPlayer(player);
                                setOpenDropdown(null);
                              }}
                            >
                              <i className="fas fa-ban"></i>
                              Suspend
                            </button>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                handleMessagePlayer(player);
                                setOpenDropdown(null);
                              }}
                            >
                              <i className="fas fa-envelope"></i>
                              Message
                            </button>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                handleViewCredentials(player);
                                setOpenDropdown(null);
                              }}
                            >
                              <i className="fas fa-key"></i>
                              View Credentials
                            </button>
                            <button
                              className="dropdown-item dropdown-item-danger"
                              onClick={() => {
                                handleDeletePlayer(player);
                                setOpenDropdown(null);
                              }}
                            >
                              <i className="fas fa-trash"></i>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Player Details Modal */}
      {showDetailsModal && selectedPlayer && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Player Details</h2>
              <button className="modal-close" onClick={closeDetailsModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="player-details-header">
                {selectedPlayer.profilePicture ? (
                  <img src={selectedPlayer.profilePicture} alt={selectedPlayer.fullName} className="player-photo" />
                ) : (
                  <div className="player-photo-placeholder">
                    <i className="fas fa-user"></i>
                  </div>
                )}
                <div className="player-basic-info">
                  <h3>{selectedPlayer.fullName}</h3>
                  <p className="player-mpa-id">MPA ID: <strong>{selectedPlayer.playerId}</strong></p>
                  <span className={`status-badge status-${selectedPlayer.membershipStatus}`}>
                    {selectedPlayer.membershipStatus}
                  </span>
                </div>
              </div>

              <div className="player-details-grid">
                <div className="detail-section">
                  <h4>Personal Information</h4>
                  <div className="detail-item">
                    <span className="label">Username:</span>
                    <span className="value">{selectedPlayer.username}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">I/C Number:</span>
                    <span className="value">{selectedPlayer.icNumber}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{selectedPlayer.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Phone:</span>
                    <span className="value">{selectedPlayer.phone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Gender:</span>
                    <span className="value">{selectedPlayer.gender}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Date of Birth:</span>
                    <span className="value">{formatDate(selectedPlayer.dateOfBirth)}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Address Information</h4>
                  <div className="detail-item">
                    <span className="label">Address Line 1:</span>
                    <span className="value">{selectedPlayer.addressLine1}</span>
                  </div>
                  {selectedPlayer.addressLine2 && (
                    <div className="detail-item">
                      <span className="label">Address Line 2:</span>
                      <span className="value">{selectedPlayer.addressLine2}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="label">City:</span>
                    <span className="value">{selectedPlayer.city}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">State:</span>
                    <span className="value">{selectedPlayer.state}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Membership Information</h4>
                  <div className="detail-item">
                    <span className="label">Membership Type:</span>
                    <span className="value">{selectedPlayer.membershipType}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Skill Level:</span>
                    <span className="value">{selectedPlayer.skillLevel}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Registration Date:</span>
                    <span className="value">{formatDate(selectedPlayer.registrationDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Player Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Player</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleEditSubmit}>
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
                    <label>IC Number *</label>
                    <input
                      type="text"
                      value={editFormData.icNumber || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, icNumber: e.target.value })}
                      required
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label>Status *</label>
                    <select
                      value={editFormData.status || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
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
                    Update Player
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Credentials Modal */}
      {showCredentialsModal && credentials && (
        <div className="modal-overlay" onClick={() => setShowCredentialsModal(false)}>
          <div className="modal-content credentials-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Player Credentials</h2>
              <button className="modal-close" onClick={() => setShowCredentialsModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="credentials-info">
                <div className="credential-item">
                  <label>Username:</label>
                  <div className="credential-value">
                    <span>{credentials.username}</span>
                    <button
                      className="copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(credentials.username);
                        alert('Username copied to clipboard!');
                      }}
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                </div>

                <div className="credential-item">
                  <label>Password:</label>
                  {credentials.isPlainText ? (
                    <div className="credential-value">
                      <span className="password-text">{credentials.password}</span>
                      <button
                        className="copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(credentials.password);
                          alert('Password copied to clipboard!');
                        }}
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="password-hashed">
                      <i className="fas fa-lock"></i>
                      <span>Password is encrypted and cannot be displayed</span>
                      <button className="btn-reset-password" onClick={handleResetPassword}>
                        <i className="fas fa-key"></i>
                        Generate New Password
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="credentials-warning">
                <i className="fas fa-exclamation-triangle"></i>
                <p>Keep these credentials secure. Share them only with the player.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Player Modal */}
      {showMessageModal && (
        <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send Message to {messageData.playerName}</h2>
              <button className="modal-close" onClick={() => setShowMessageModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="recipient-info">
                <i className="fas fa-envelope"></i>
                <span>To: {messageData.playerEmail}</span>
              </div>

              <form onSubmit={handleSendMessage}>
                <div className="form-group">
                  <label>Subject *</label>
                  <input
                    type="text"
                    value={messageData.subject}
                    onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
                    placeholder="Enter message subject"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Message *</label>
                  <textarea
                    value={messageData.message}
                    onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                    placeholder="Type your message here..."
                    rows="8"
                    required
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setShowMessageModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <i className="fas fa-paper-plane"></i>
                    Send Message
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

export default ManagePlayers;
