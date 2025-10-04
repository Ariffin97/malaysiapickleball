import { useState, useEffect } from 'react';
import tournamentService from '../services/tournamentService';
import './ManageTournament.css';

function ManageTournament() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tournamentService.getApprovedTournaments();
      setTournaments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (applicationId) => {
    try {
      setLoading(true);
      await tournamentService.deleteTournament(applicationId);
      // Refresh the list
      await fetchTournaments();
      setDeleteConfirm(null);
    } catch (err) {
      setError(`Failed to delete tournament: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (tournament) => {
    setSelectedTournament(tournament);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTournament(null);
    document.body.style.overflow = '';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getTypeBadgeClass = (type) => {
    const classes = {
      local: 'badge-green',
      state: 'badge-red',
      national: 'badge-blue',
      international: 'badge-orange'
    };
    return classes[type] || 'badge-gray';
  };

  const getTypeLabel = (type) => {
    const labels = {
      local: 'Local',
      state: 'State',
      national: 'National',
      international: 'International'
    };
    return labels[type] || 'General';
  };

  // Filter tournaments
  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || tournament.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading && tournaments.length === 0) {
    return (
      <div className="manage-tournament">
        <div className="loading-state">
          <div className="spinner">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <p>Loading tournaments from MPA Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-tournament">
      <div className="manage-header">
        <div className="header-content">
          <h2>
            <i className="fas fa-trophy"></i>
            Manage Tournaments
          </h2>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className="filter-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search tournaments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All ({tournaments.length})
          </button>
          <button
            className={`filter-btn ${filterType === 'local' ? 'active' : ''}`}
            onClick={() => setFilterType('local')}
          >
            <span className="color-dot dot-green"></span>
            Local ({tournaments.filter(t => t.type === 'local').length})
          </button>
          <button
            className={`filter-btn ${filterType === 'state' ? 'active' : ''}`}
            onClick={() => setFilterType('state')}
          >
            <span className="color-dot dot-red"></span>
            State ({tournaments.filter(t => t.type === 'state').length})
          </button>
          <button
            className={`filter-btn ${filterType === 'national' ? 'active' : ''}`}
            onClick={() => setFilterType('national')}
          >
            <span className="color-dot dot-blue"></span>
            National ({tournaments.filter(t => t.type === 'national').length})
          </button>
          <button
            className={`filter-btn ${filterType === 'international' ? 'active' : ''}`}
            onClick={() => setFilterType('international')}
          >
            <span className="color-dot dot-orange"></span>
            International ({tournaments.filter(t => t.type === 'international').length})
          </button>
        </div>
      </div>

      <div className="tournaments-grid">
        {filteredTournaments.length === 0 ? (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <h3>No tournaments found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          filteredTournaments.map((tournament) => (
            <div key={tournament.id} className="tournament-card">
              <div className="card-header">
                <div className="card-title">
                  <div className={`color-indicator color-${tournament.color}`}></div>
                  <h3>{tournament.name}</h3>
                </div>
                <span className={`type-badge ${getTypeBadgeClass(tournament.type)}`}>
                  {getTypeLabel(tournament.type)}
                </span>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <i className="fas fa-calendar-alt"></i>
                  <span>
                    {formatDate(tournament.startDate)}
                    {tournament.endDate !== tournament.startDate && (
                      <> - {formatDate(tournament.endDate)}</>
                    )}
                  </span>
                </div>
                <div className="info-row">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{tournament.venue}, {tournament.city}</span>
                </div>
                <div className="info-row">
                  <i className="fas fa-building"></i>
                  <span>{tournament.organizer}</span>
                </div>
                {tournament.personInCharge && (
                  <div className="info-row">
                    <i className="fas fa-user"></i>
                    <span>{tournament.personInCharge}</span>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <button
                  className="btn-view"
                  onClick={() => openModal(tournament)}
                >
                  <i className="fas fa-eye"></i>
                  View Details
                </button>
                <button
                  className="btn-delete"
                  onClick={() => setDeleteConfirm(tournament)}
                >
                  <i className="fas fa-trash"></i>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tournament Details Modal */}
      {showModal && selectedTournament && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tournament Details</h2>
              <button className="modal-close" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <div className="detail-title-row">
                  <h3>{selectedTournament.name}</h3>
                  <span className={`type-badge ${getTypeBadgeClass(selectedTournament.type)}`}>
                    {selectedTournament.classification}
                  </span>
                </div>
                <p className="application-id">
                  Application ID: <strong>{selectedTournament.applicationId}</strong>
                </p>
              </div>

              <div className="detail-section">
                <h4><i className="fas fa-calendar-alt"></i> Event Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Start Date</label>
                    <p>{formatDate(selectedTournament.startDate)}</p>
                  </div>
                  <div className="detail-item">
                    <label>End Date</label>
                    <p>{formatDate(selectedTournament.endDate)}</p>
                  </div>
                  <div className="detail-item">
                    <label>Event Type</label>
                    <p>{selectedTournament.eventType || 'Open'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Expected Participants</label>
                    <p>{selectedTournament.expectedParticipants || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4><i className="fas fa-map-marker-alt"></i> Venue Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Venue</label>
                    <p>{selectedTournament.venue}</p>
                  </div>
                  <div className="detail-item">
                    <label>City</label>
                    <p>{selectedTournament.city}</p>
                  </div>
                  <div className="detail-item full-width">
                    <label>State</label>
                    <p>{selectedTournament.state}</p>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4><i className="fas fa-users"></i> Organizer Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Organizer</label>
                    <p>{selectedTournament.organizer}</p>
                  </div>
                  <div className="detail-item">
                    <label>Person in Charge</label>
                    <p>{selectedTournament.personInCharge || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Phone</label>
                    <p>
                      <a href={`tel:${selectedTournament.phoneNumber}`}>
                        {selectedTournament.phoneNumber}
                      </a>
                    </p>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <p>
                      <a href={`mailto:${selectedTournament.contactEmail}`}>
                        {selectedTournament.contactEmail}
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {selectedTournament.description && (
                <div className="detail-section">
                  <h4><i className="fas fa-info-circle"></i> Event Summary</h4>
                  <p className="description">{selectedTournament.description}</p>
                </div>
              )}

              {selectedTournament.categories && selectedTournament.categories.length > 0 && (
                <div className="detail-section">
                  <h4><i className="fas fa-list"></i> Categories & Entry Fees</h4>
                  <div className="categories-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Malaysian Fee</th>
                          <th>International Fee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTournament.categories.map((cat, index) => (
                          <tr key={index}>
                            <td>{cat.category}</td>
                            <td>RM {cat.malaysianEntryFee}</td>
                            <td>{cat.internationalEntryFee ? `RM ${cat.internationalEntryFee}` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h4><i className="fas fa-cog"></i> Tournament Settings</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Scoring Format</label>
                    <p>{selectedTournament.scoringFormat === 'traditional' ? 'Traditional' : 'Rally Scoring'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <p><span className="status-approved">{selectedTournament.status}</span></p>
                  </div>
                  <div className="detail-item">
                    <label>Submission Date</label>
                    <p>{formatDate(selectedTournament.submissionDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3>Are you sure you want to delete this tournament?</h3>
              <p className="warning-text">
                This will permanently delete <strong>{deleteConfirm.name}</strong> from both
                the main website and the MPA Portal. This action cannot be undone.
              </p>
              <div className="delete-info">
                <div className="info-row">
                  <i className="fas fa-calendar"></i>
                  <span>{formatDate(deleteConfirm.startDate)}</span>
                </div>
                <div className="info-row">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{deleteConfirm.city}, {deleteConfirm.state}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => handleDelete(deleteConfirm.applicationId)}
                disabled={loading}
              >
                <i className="fas fa-trash"></i>
                {loading ? 'Deleting...' : 'Delete Tournament'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageTournament;
