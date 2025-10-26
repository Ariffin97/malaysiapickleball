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
  const [showPrintDropdown, setShowPrintDropdown] = useState(false);
  const [showSelectPlayersModal, setShowSelectPlayersModal] = useState(false);
  const [selectedPlayersForPrint, setSelectedPlayersForPrint] = useState([]);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerImage, setViewerImage] = useState('');

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
        age: player.age,
        duprRating: player.duprRating || null,
        duprId: player.duprId || null,
        parentGuardianName: player.parentGuardianName || null,
        parentGuardianIcNumber: player.parentGuardianIcNumber || null,
        parentGuardianContact: player.parentGuardianContact || null,
        parentalConsent: player.parentalConsent || false
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

  const handlePrintAllPlayers = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>All Players List</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: Arial, sans-serif; padding: 20px; }');
    printWindow.document.write('h1 { text-align: center; color: #1f2937; }');
    printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
    printWindow.document.write('th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }');
    printWindow.document.write('th { background-color: #3b82f6; color: white; }');
    printWindow.document.write('tr:nth-child(even) { background-color: #f9fafb; }');
    printWindow.document.write('.header { text-align: center; margin-bottom: 20px; }');
    printWindow.document.write('.date { text-align: right; color: #6b7280; font-size: 0.875rem; }');
    printWindow.document.write('</style></head><body>');
    printWindow.document.write('<div class="header">');
    printWindow.document.write('<h1>Malaysia Pickleball Association</h1>');
    printWindow.document.write('<h2>All Players List</h2>');
    printWindow.document.write('</div>');
    printWindow.document.write('<div class="date">Generated on: ' + new Date().toLocaleString() + '</div>');
    printWindow.document.write('<table>');
    printWindow.document.write('<thead><tr><th>No.</th><th>MPA ID</th><th>Full Name</th><th>IC Number</th><th>Age</th><th>Gender</th><th>Status</th></tr></thead>');
    printWindow.document.write('<tbody>');

    filteredPlayers.forEach((player, index) => {
      printWindow.document.write('<tr>');
      printWindow.document.write('<td>' + (index + 1) + '</td>');
      printWindow.document.write('<td>' + player.playerId + '</td>');
      printWindow.document.write('<td>' + player.fullName + '</td>');
      printWindow.document.write('<td>' + player.icNumber + '</td>');
      printWindow.document.write('<td>' + (player.age || 'N/A') + '</td>');
      printWindow.document.write('<td>' + player.gender + '</td>');
      printWindow.document.write('<td>' + player.membershipStatus + '</td>');
      printWindow.document.write('</tr>');
    });

    printWindow.document.write('</tbody></table>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
    setShowPrintDropdown(false);
  };

  const handlePrintSelectedPlayers = () => {
    if (selectedPlayersForPrint.length === 0) {
      alert('Please select at least one player to print');
      return;
    }

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Selected Players Details</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: Arial, sans-serif; padding: 20px; }');
    printWindow.document.write('h1 { text-align: center; color: #1f2937; }');
    printWindow.document.write('.player-card { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; page-break-inside: avoid; }');
    printWindow.document.write('.player-header { background-color: #3b82f6; color: white; padding: 10px; margin: -20px -20px 20px -20px; }');
    printWindow.document.write('.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }');
    printWindow.document.write('.info-item { margin-bottom: 10px; }');
    printWindow.document.write('.label { font-weight: bold; color: #374151; }');
    printWindow.document.write('.value { color: #1f2937; }');
    printWindow.document.write('.header { text-align: center; margin-bottom: 20px; }');
    printWindow.document.write('.date { text-align: right; color: #6b7280; font-size: 0.875rem; margin-bottom: 20px; }');
    printWindow.document.write('</style></head><body>');
    printWindow.document.write('<div class="header">');
    printWindow.document.write('<h1>Malaysia Pickleball Association</h1>');
    printWindow.document.write('<h2>Player Details</h2>');
    printWindow.document.write('</div>');
    printWindow.document.write('<div class="date">Generated on: ' + new Date().toLocaleString() + '</div>');

    selectedPlayersForPrint.forEach(playerId => {
      const player = players.find(p => p.id === playerId);
      if (player) {
        printWindow.document.write('<div class="player-card">');
        printWindow.document.write('<div class="player-header"><h3>' + player.fullName + ' (' + player.playerId + ')</h3></div>');
        printWindow.document.write('<div class="info-grid">');
        printWindow.document.write('<div class="info-item"><span class="label">Username:</span> <span class="value">' + player.username + '</span></div>');
        printWindow.document.write('<div class="info-item"><span class="label">IC Number:</span> <span class="value">' + player.icNumber + '</span></div>');
        printWindow.document.write('<div class="info-item"><span class="label">Email:</span> <span class="value">' + player.email + '</span></div>');
        printWindow.document.write('<div class="info-item"><span class="label">Phone:</span> <span class="value">' + player.phone + '</span></div>');
        printWindow.document.write('<div class="info-item"><span class="label">Gender:</span> <span class="value">' + player.gender + '</span></div>');
        printWindow.document.write('<div class="info-item"><span class="label">Age:</span> <span class="value">' + (player.age || 'N/A') + '</span></div>');
        printWindow.document.write('<div class="info-item"><span class="label">Date of Birth:</span> <span class="value">' + formatDate(player.dateOfBirth) + '</span></div>');
        printWindow.document.write('<div class="info-item"><span class="label">Address:</span> <span class="value">' + player.addressLine1 + (player.addressLine2 ? ', ' + player.addressLine2 : '') + '</span></div>');
        printWindow.document.write('<div class="info-item"><span class="label">City:</span> <span class="value">' + player.city + '</span></div>');
        printWindow.document.write('<div class="info-item"><span class="label">State:</span> <span class="value">' + player.state + '</span></div>');
        printWindow.document.write('<div class="info-item"><span class="label">Status:</span> <span class="value">' + player.membershipStatus + '</span></div>');
        printWindow.document.write('<div class="info-item"><span class="label">Registration Date:</span> <span class="value">' + formatDate(player.registrationDate) + '</span></div>');
        printWindow.document.write('</div></div>');
      }
    });

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
    setShowSelectPlayersModal(false);
    setSelectedPlayersForPrint([]);
  };

  const togglePlayerSelection = (playerId) => {
    setSelectedPlayersForPrint(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
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
          <div className="print-dropdown-container">
            <button
              className="btn-print"
              onClick={() => setShowPrintDropdown(!showPrintDropdown)}
            >
              <i className="fas fa-print"></i>
              Print
            </button>
            {showPrintDropdown && (
              <div className="print-dropdown-menu">
                <button
                  className="print-dropdown-item"
                  onClick={handlePrintAllPlayers}
                >
                  <i className="fas fa-list"></i>
                  Print All Players List
                </button>
                <button
                  className="print-dropdown-item"
                  onClick={() => {
                    setShowSelectPlayersModal(true);
                    setShowPrintDropdown(false);
                  }}
                >
                  <i className="fas fa-user-check"></i>
                  Print Certain Players Detail
                </button>
              </div>
            )}
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
                  <th>No.</th>
                  <th>MPA ID</th>
                  <th>Full Name</th>
                  <th>IC Number</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player, index) => (
                  <tr key={player.id}>
                    <td>{index + 1}</td>
                    <td className="mpa-id-cell">
                      <span className="mpa-id">{player.playerId}</span>
                    </td>
                    <td>
                      <span className="player-name">{player.fullName}</span>
                    </td>
                    <td>{player.icNumber}</td>
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

      {/* Player Details Modal - New Clean Design */}
      {showDetailsModal && selectedPlayer && (
        <div className="player-detail-overlay" onClick={closeDetailsModal}>
          <div className="player-detail-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="player-detail-header">
              <div className="player-detail-title">
                <i className="fas fa-user-circle"></i>
                <h2>Player Information</h2>
              </div>
              <button className="player-detail-close" onClick={closeDetailsModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="player-detail-body">
              {/* Profile Section */}
              <div className="player-profile-section">
                <div className="player-profile-info">
                  <h3>{selectedPlayer.fullName}</h3>
                  <p className="player-id">
                    <i className="fas fa-id-card"></i>
                    {selectedPlayer.playerId}
                  </p>
                  <span className={`player-status-badge status-${selectedPlayer.membershipStatus}`}>
                    {selectedPlayer.membershipStatus === 'active' ? 'Active Member' : selectedPlayer.membershipStatus}
                  </span>
                </div>
                <div
                  className={`player-avatar ${selectedPlayer.profilePicture ? 'clickable' : ''}`}
                  onClick={() => {
                    if (selectedPlayer.profilePicture) {
                      setViewerImage(selectedPlayer.profilePicture);
                      setShowImageViewer(true);
                    }
                  }}
                >
                  {selectedPlayer.profilePicture ? (
                    <>
                      <img src={selectedPlayer.profilePicture} alt={selectedPlayer.fullName} />
                      <div className="image-overlay">
                        <i className="fas fa-search-plus"></i>
                        <span>Click to enlarge</span>
                      </div>
                    </>
                  ) : (
                    <div className="avatar-placeholder">
                      <i className="fas fa-user"></i>
                    </div>
                  )}
                </div>
              </div>

              {/* Information Grid */}
              <div className="player-info-grid">
                {/* Account Information */}
                <div className="info-card">
                  <div className="info-card-header">
                    <i className="fas fa-user-cog"></i>
                    <h4>Account Information</h4>
                  </div>
                  <div className="info-card-content">
                    <div className="info-row">
                      <span className="info-label">Username</span>
                      <span className="info-value">{selectedPlayer.username || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Registration Date</span>
                      <span className="info-value">{formatDate(selectedPlayer.registrationDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="info-card">
                  <div className="info-card-header">
                    <i className="fas fa-user"></i>
                    <h4>Personal Information</h4>
                  </div>
                  <div className="info-card-content">
                    <div className="info-row">
                      <span className="info-label">Full Name</span>
                      <span className="info-value">{selectedPlayer.fullName}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">I/C Number</span>
                      <span className="info-value">{selectedPlayer.icNumber || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Date of Birth</span>
                      <span className="info-value">{selectedPlayer.dateOfBirth ? formatDate(selectedPlayer.dateOfBirth) : 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Age</span>
                      <span className="info-value">{selectedPlayer.age || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Gender</span>
                      <span className="info-value">{selectedPlayer.gender}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="info-card">
                  <div className="info-card-header">
                    <i className="fas fa-address-book"></i>
                    <h4>Contact Information</h4>
                  </div>
                  <div className="info-card-content">
                    <div className="info-row">
                      <span className="info-label">Email</span>
                      <span className="info-value">
                        <a href={`mailto:${selectedPlayer.email}`}>{selectedPlayer.email}</a>
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Phone</span>
                      <span className="info-value">
                        <a href={`tel:${selectedPlayer.phone}`}>{selectedPlayer.phone}</a>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="info-card">
                  <div className="info-card-header">
                    <i className="fas fa-map-marker-alt"></i>
                    <h4>Address</h4>
                  </div>
                  <div className="info-card-content">
                    <div className="info-row">
                      <span className="info-label">Address Line 1</span>
                      <span className="info-value">{selectedPlayer.addressLine1 || 'N/A'}</span>
                    </div>
                    {selectedPlayer.addressLine2 && selectedPlayer.addressLine2 !== '' && (
                      <div className="info-row">
                        <span className="info-label">Address Line 2</span>
                        <span className="info-value">{selectedPlayer.addressLine2}</span>
                      </div>
                    )}
                    <div className="info-row">
                      <span className="info-label">City</span>
                      <span className="info-value">{selectedPlayer.city || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">State</span>
                      <span className="info-value">{selectedPlayer.state || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Parental Consent Information - Only show if data exists */}
                {selectedPlayer.parentGuardianName && (
                  <div className="info-card parental-consent-card">
                    <div className="info-card-header">
                      <i className="fas fa-user-shield"></i>
                      <h4>Parental/Guardian Consent</h4>
                    </div>
                    <div className="info-card-content">
                      <div className="info-row">
                        <span className="info-label">Parent/Guardian Name</span>
                        <span className="info-value">{selectedPlayer.parentGuardianName}</span>
                      </div>
                      {selectedPlayer.parentGuardianIcNumber && (
                        <div className="info-row">
                          <span className="info-label">Parent/Guardian I/C Number</span>
                          <span className="info-value">{selectedPlayer.parentGuardianIcNumber}</span>
                        </div>
                      )}
                      {selectedPlayer.parentGuardianContact && (
                        <div className="info-row">
                          <span className="info-label">Parent/Guardian Contact</span>
                          <span className="info-value">
                            <a href={`tel:${selectedPlayer.parentGuardianContact}`}>{selectedPlayer.parentGuardianContact}</a>
                          </span>
                        </div>
                      )}
                      <div className="info-row">
                        <span className="info-label">Consent Status</span>
                        <span className={`info-value ${selectedPlayer.parentalConsent ? 'consent-granted' : 'consent-pending'}`}>
                          {selectedPlayer.parentalConsent ? (
                            <>
                              <i className="fas fa-check-circle"></i> Granted
                            </>
                          ) : (
                            <>
                              <i className="fas fa-times-circle"></i> Pending
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Membership Information */}
                <div className="info-card">
                  <div className="info-card-header">
                    <i className="fas fa-medal"></i>
                    <h4>Membership</h4>
                  </div>
                  <div className="info-card-content">
                    <div className="info-row">
                      <span className="info-label">Status</span>
                      <span className="info-value">
                        <span className={`inline-status status-${selectedPlayer.membershipStatus}`}>
                          {selectedPlayer.membershipStatus}
                        </span>
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Membership Type</span>
                      <span className="info-value">{selectedPlayer.membershipType || 'Standard'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Member Since</span>
                      <span className="info-value">{formatDate(selectedPlayer.registrationDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Skill Information */}
                <div className="info-card">
                  <div className="info-card-header">
                    <i className="fas fa-star"></i>
                    <h4>Skill Level</h4>
                  </div>
                  <div className="info-card-content">
                    <div className="info-row">
                      <span className="info-label">DUPR Rating</span>
                      <span className="info-value">{selectedPlayer.duprRating || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">DUPR ID</span>
                      <span className="info-value">{selectedPlayer.duprId || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Skill Level</span>
                      <span className="info-value">{selectedPlayer.skillLevel || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="player-detail-footer">
              <button className="btn-close-detail" onClick={closeDetailsModal}>
                <i className="fas fa-check"></i>
                Close
              </button>
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

      {/* Select Players to Print Modal */}
      {showSelectPlayersModal && (
        <div className="modal-overlay" onClick={() => setShowSelectPlayersModal(false)}>
          <div className="modal-content select-players-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Players to Print</h2>
              <button className="modal-close" onClick={() => setShowSelectPlayersModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                Select the players you want to print detailed information for:
              </p>

              <div className="players-selection-list">
                {filteredPlayers.map((player) => (
                  <div key={player.id} className="player-checkbox-item">
                    <input
                      type="checkbox"
                      id={`player-${player.id}`}
                      checked={selectedPlayersForPrint.includes(player.id)}
                      onChange={() => togglePlayerSelection(player.id)}
                    />
                    <label htmlFor={`player-${player.id}`}>
                      <span className="player-check-name">{player.fullName}</span>
                      <span className="player-check-id">{player.playerId}</span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="selection-summary">
                <span>{selectedPlayersForPrint.length} player(s) selected</span>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowSelectPlayersModal(false);
                    setSelectedPlayersForPrint([]);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handlePrintSelectedPlayers}
                >
                  <i className="fas fa-print"></i>
                  Print Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {showImageViewer && (
        <div className="image-viewer-overlay" onClick={() => setShowImageViewer(false)}>
          <div className="image-viewer-modal" onClick={(e) => e.stopPropagation()}>
            <button className="image-viewer-close" onClick={() => setShowImageViewer(false)}>
              <i className="fas fa-times"></i>
            </button>
            <div className="image-viewer-content">
              <img src={viewerImage} alt="Player Profile" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagePlayers;
