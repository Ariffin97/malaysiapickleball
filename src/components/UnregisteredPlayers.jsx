import { useState, useEffect } from 'react';
import './ManagePlayers.css';

function UnregisteredPlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    fetchUnregisteredPlayers();
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

  const fetchUnregisteredPlayers = async () => {
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';
      const response = await fetch(`${PORTAL_API_URL}/unregistered-players`);
      const data = await response.json();

      // Transform the data to match our needs
      const transformedPlayers = (Array.isArray(data) ? data : []).map(player => ({
        id: player._id,
        fullName: player.name || 'N/A',
        email: player.email || 'N/A',
        phone: player.phone || 'N/A',
        gender: player.gender || 'N/A',
        icNumber: player.icNumber || 'N/A',
        city: player.city || 'N/A',
        state: player.state || 'N/A',
        submissionDate: player.createdAt,
        addressLine1: player.addressLine1 || 'N/A',
        addressLine2: player.addressLine2 || '',
        dateOfBirth: player.dateOfBirth,
        age: player.age
      }));

      setPlayers(transformedPlayers);
    } catch (error) {
      console.error('Error fetching unregistered players:', error);
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

  const handleApprovePlayer = async (player) => {
    if (!confirm(`Send registration email to ${player.fullName} (${player.email})?`)) return;

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';
      const response = await fetch(`${PORTAL_API_URL}/unregistered-players/${player.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert('Registration email sent successfully to ' + player.email);
        fetchUnregisteredPlayers();
      } else {
        const error = await response.json();
        alert('Error sending registration email: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending registration email:', error);
      alert('Error sending registration email');
    }
  };

  const handleDeletePlayer = async (player) => {
    if (!confirm(`Are you sure you want to delete ${player.fullName}? This action cannot be undone.`)) return;

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';
      const response = await fetch(`${PORTAL_API_URL}/unregistered-players/${player.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Unregistered player deleted successfully');
        fetchUnregisteredPlayers();
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
      player.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.icNumber.includes(searchTerm);

    return matchesSearch;
  });

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
          <h1>Unregistered Players</h1>
          <p className="subtitle">View and manage player registration requests</p>
        </div>
        <div className="player-stats">
          <div className="stat-badge">
            <i className="fas fa-user-clock"></i>
            <span>{players.length} Pending</span>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by name, email, or IC number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="content-body">
        {loading ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading unregistered players...</p>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-user-slash"></i>
            <p>No unregistered players found</p>
          </div>
        ) : (
          <div className="players-table-container">
            <table className="players-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Full Name</th>
                  <th>IC Number</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Submission Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player, index) => (
                  <tr key={player.id}>
                    <td>{index + 1}</td>
                    <td>
                      <span className="player-name">{player.fullName}</span>
                    </td>
                    <td>{player.icNumber}</td>
                    <td>{player.email}</td>
                    <td>{player.phone}</td>
                    <td>{player.age || 'N/A'}</td>
                    <td>{player.gender}</td>
                    <td>{formatDate(player.submissionDate)}</td>
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
                                handleApprovePlayer(player);
                                setOpenDropdown(null);
                              }}
                            >
                              <i className="fas fa-envelope"></i>
                              Send Registration Email
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
              <h2>Unregistered Player Details</h2>
              <button className="modal-close" onClick={closeDetailsModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="player-details-header">
                <div className="player-photo-placeholder">
                  <i className="fas fa-user"></i>
                </div>
                <div className="player-basic-info">
                  <h3>{selectedPlayer.fullName}</h3>
                  <p className="player-mpa-id">Status: <strong>Pending Registration</strong></p>
                </div>
              </div>

              <div className="player-details-grid">
                <div className="detail-section">
                  <h4>Personal Information</h4>
                  <div className="detail-item">
                    <span className="label">Full Name:</span>
                    <span className="value">{selectedPlayer.fullName}</span>
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
                    <span className="label">Age:</span>
                    <span className="value">{selectedPlayer.age || 'N/A'}</span>
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
                  <h4>Submission Information</h4>
                  <div className="detail-item">
                    <span className="label">Submission Date:</span>
                    <span className="value">{formatDate(selectedPlayer.submissionDate)}</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={closeDetailsModal}
                >
                  Close
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    closeDetailsModal();
                    handleApprovePlayer(selectedPlayer);
                  }}
                >
                  <i className="fas fa-envelope"></i>
                  Send Registration Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UnregisteredPlayers;
