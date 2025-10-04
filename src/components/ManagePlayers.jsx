import { useState, useEffect } from 'react';
import './ManagePlayers.css';

function ManagePlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${PORTAL_API_URL}/players?limit=100`);
      const data = await response.json();

      // Transform the data to match our needs
      const transformedPlayers = data.players.map(player => ({
        id: player._id,
        playerId: player.playerId,
        fullName: player.personalInfo?.fullName || 'N/A',
        email: player.personalInfo?.email || 'N/A',
        phone: player.personalInfo?.phone || 'N/A',
        gender: player.personalInfo?.gender || 'N/A',
        icNumber: player.personalInfo?.icNumber || 'N/A',
        city: player.personalInfo?.address?.city || 'N/A',
        state: player.personalInfo?.address?.state || 'N/A',
        membershipStatus: player.membership?.status || 'N/A',
        membershipType: player.membership?.membershipType || 'N/A',
        registrationDate: player.membership?.registrationDate || player.createdAt,
        skillLevel: player.playerInfo?.skillLevel || 'N/A',
        username: player.username || 'N/A',
        profilePicture: player.profilePicture,
        dateOfBirth: player.personalInfo?.dateOfBirth,
        street: player.personalInfo?.address?.street || 'N/A'
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

  const filteredPlayers = players.filter(player => {
    const matchesSearch =
      player.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.playerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.icNumber.includes(searchTerm);

    const matchesFilter =
      filterStatus === 'all' || player.membershipStatus === filterStatus;

    return matchesSearch && matchesFilter;
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

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            Active
          </button>
          <button
            className={`filter-btn ${filterStatus === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilterStatus('inactive')}
          >
            Inactive
          </button>
          <button
            className={`filter-btn ${filterStatus === 'suspended' ? 'active' : ''}`}
            onClick={() => setFilterStatus('suspended')}
          >
            Suspended
          </button>
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
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Gender</th>
                  <th>State</th>
                  <th>Status</th>
                  <th>Registration Date</th>
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
                    <td>{player.email}</td>
                    <td>{player.phone}</td>
                    <td>{player.gender}</td>
                    <td>{player.state}</td>
                    <td>
                      <span className={`status-badge status-${player.membershipStatus}`}>
                        {player.membershipStatus}
                      </span>
                    </td>
                    <td>{formatDate(player.registrationDate)}</td>
                    <td>
                      <button
                        className="btn-view"
                        onClick={() => viewPlayerDetails(player)}
                      >
                        <i className="fas fa-eye"></i>
                        View
                      </button>
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
                    <span className="label">I/C Number:</span>
                    <span className="value">{selectedPlayer.icNumber}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Date of Birth:</span>
                    <span className="value">{formatDate(selectedPlayer.dateOfBirth)}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Address Information</h4>
                  <div className="detail-item">
                    <span className="label">Street:</span>
                    <span className="value">{selectedPlayer.street}</span>
                  </div>
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
    </div>
  );
}

export default ManagePlayers;
