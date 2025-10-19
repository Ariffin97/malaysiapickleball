import { useState, useEffect } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Tournament.css';
import tournamentService from '../services/tournamentService';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Color mapping based on tournament type
const getColorFromType = (type) => {
  const colorMap = {
    local: 'green',
    state: 'red',
    national: 'blue',
    international: 'orange'
  };
  return colorMap[type?.toLowerCase()] || 'blue';
};

function Tournament() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileView, setMobileView] = useState('list');
  const [currentMonth, setCurrentMonth] = useState(0);
  const [notices, setNotices] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch tournaments from MPA Portal
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await tournamentService.getApprovedTournaments();
        setTournaments(data);
      } catch (err) {
        console.error('Error fetching tournaments:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  // Fetch tournament notices from MPA Portal
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${PORTAL_API_URL}/news?category=Tournament&status=Published`);

        if (response.ok) {
          const data = await response.json();
          // Get only the latest 3 tournament notices
          setNotices(data.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching notices:', err);
      }
    };

    fetchNotices();
  }, []);

  const openModal = (tournament) => {
    setSelectedTournament(tournament);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTournament(null);
  };

  const handleRegisterNow = () => {
    if (!selectedTournament) return;

    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('playerLoggedIn') === 'true';
    const playerToken = localStorage.getItem('playerToken');

    const tournamentId = selectedTournament._id || selectedTournament.applicationId;

    // Store tournament data in localStorage for registration page
    localStorage.setItem('selectedTournamentData', JSON.stringify(selectedTournament));

    if (isLoggedIn && playerToken) {
      // User is logged in, go directly to registration page with state
      navigate(`/tournament/register/${tournamentId}`, {
        state: { tournament: selectedTournament }
      });
    } else {
      // User not logged in, redirect to login with return URL
      navigate(`/player/login?returnUrl=/tournament/register/${tournamentId}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const getTypeBadgeClass = (type) => {
    const classes = {
      local: 'bg-green-100 text-green-800',
      state: 'bg-red-100 text-red-800',
      national: 'bg-blue-100 text-blue-800',
      international: 'bg-orange-100 text-orange-800'
    };
    return classes[type] || 'bg-gray-100 text-gray-800';
  };

  // Calculate tournament schedule for calendar grid
  const calculateSchedule = (tournament) => {
    const schedule = Array(12).fill().map(() => ({}));

    if (!tournament.startDate) return schedule;

    const start = new Date(tournament.startDate);
    const end = tournament.endDate ? new Date(tournament.endDate) : new Date(tournament.startDate);

    const startMonth = start.getMonth();
    const endMonth = end.getMonth();

    const getWeekInMonth = (date) => {
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const firstWeekday = firstDay.getDay();
      const dayOfMonth = date.getDate();
      return Math.ceil((dayOfMonth + firstWeekday) / 7);
    };

    const getQuarterFromWeek = (week) => {
      if (week <= 1) return 1;
      if (week <= 2) return 2;
      if (week <= 3) return 3;
      return 4;
    };

    if (startMonth === endMonth) {
      const startWeek = getWeekInMonth(start);
      const endWeek = getWeekInMonth(end);
      const startQuarter = getQuarterFromWeek(startWeek);
      const endQuarter = getQuarterFromWeek(endWeek);

      if (startQuarter === endQuarter) {
        schedule[startMonth][startQuarter] = {
          type: 'single',
          start: true,
          end: true
        };
      } else {
        for (let q = startQuarter; q <= endQuarter; q++) {
          schedule[startMonth][q] = {
            type: 'span',
            start: q === startQuarter,
            end: q === endQuarter,
            middle: q > startQuarter && q < endQuarter
          };
        }
      }
    } else {
      for (let m = startMonth; m <= endMonth; m++) {
        if (m === startMonth) {
          const startWeek = getWeekInMonth(start);
          const startQuarter = getQuarterFromWeek(startWeek);
          for (let q = startQuarter; q <= 4; q++) {
            schedule[m][q] = {
              type: 'span',
              start: q === startQuarter,
              end: false,
              middle: q > startQuarter
            };
          }
        } else if (m === endMonth) {
          const endWeek = getWeekInMonth(end);
          const endQuarter = getQuarterFromWeek(endWeek);
          for (let q = 1; q <= endQuarter; q++) {
            schedule[m][q] = {
              type: 'span',
              start: false,
              end: q === endQuarter,
              middle: q < endQuarter
            };
          }
        } else {
          for (let q = 1; q <= 4; q++) {
            schedule[m][q] = {
              type: 'span',
              start: false,
              end: false,
              middle: true
            };
          }
        }
      }
    }

    return schedule;
  };

  const tournamentData = tournaments.map((t, index) => ({
    ...t,
    id: t._id || t.applicationId || `tournament-${index}`, // Ensure unique ID
    index,
    color: getColorFromType(t.type),
    schedule: calculateSchedule(t)
  }));

  const getDuration = (start, end) => {
    return Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="tournament-page">
      <main className="tournament-main">
        <div className="tournament-container">
          {/* Header */}
          <div className="tournament-header">
            <h2>Tournament Management</h2>
          </div>

          {/* Notice Banner */}
          {notices.length > 0 && (
            <div className="notice-banner">
              <div className="notice-header">
                <i className="fas fa-bullhorn"></i>
                <h3>Tournament Updates & Notices</h3>
              </div>
              <div className="notices-list">
                {notices.map((notice, index) => (
                  <div key={notice.newsId || index} className="notice-item">
                    <div className="notice-item-header">
                      <span className={`notice-priority priority-${notice.priority?.toLowerCase() || 'normal'}`}>
                        {notice.priority || 'Normal'}
                      </span>
                      <span className="notice-date">
                        {new Date(notice.publishDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <h4>{notice.title}</h4>
                    <p>{notice.summary || notice.content?.substring(0, 150) + '...'}</p>
                    {notice.relatedTournament && (
                      <div className="notice-tournament">
                        <i className="fas fa-trophy"></i>
                        <span>Related: {notice.relatedTournament}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner">
                <i className="fas fa-spinner fa-spin"></i>
              </div>
              <p>Loading tournaments...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="error-container">
              <div className="error-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3>Failed to load tournaments</h3>
              <p>{error}</p>
              <button
                className="btn-retry"
                onClick={() => window.location.reload()}
              >
                <i className="fas fa-redo"></i>
                Retry
              </button>
            </div>
          )}

          {/* Control Panel */}
          {!loading && !error && (
            <>
              <div className="control-panel">
                <div className="control-panel-content">
                  <div className="download-buttons">
                    <button className="btn-download">
                      <i className="fas fa-download"></i>
                      <span>Auto PDF</span>
                    </button>
                    <button className="btn-print">
                      <i className="fas fa-print"></i>
                      <span>Print PDF</span>
                    </button>
                  </div>
                  <div className="stats-info">
                    <div className="stat-item">
                      <div className="stat-number">{tournaments.length}</div>
                      <div className="stat-label">Events</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">4</div>
                      <div className="stat-label">Types</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar View */}
              <div className="calendar-view">
                <div className="calendar-view-header">
                  <h2>
                    <i className="fas fa-calendar-check"></i>
                    Tournament Calendar
                  </h2>
                  <div className="mobile-view-toggle-container">
                    <button
                      className="mobile-view-toggle"
                      onClick={() => setMobileView(mobileView === 'list' ? 'calendar' : 'list')}
                    >
                      <i className={`fas fa-${mobileView === 'list' ? 'calendar' : 'list'}`}></i>
                      <span>Switch to {mobileView === 'list' ? 'Calendar' : 'List'} View</span>
                    </button>
                  </div>
                </div>

                {/* Desktop Calendar Grid */}
                <div className="calendar-grid-wrapper desktop-only">
                  <div className="calendar-grid">
                    {/* Header Corner */}
                    <div className="grid-header-corner">
                      <i className="fas fa-trophy"></i>
                      Tournament
                    </div>

                    {/* Month Headers */}
                    {months.map((month) => (
                      <div key={month} className="grid-month-header">{month}</div>
                    ))}

                    {/* Subheader Corner */}
                    <div className="grid-subheader-corner"></div>

                    {/* Quarter Headers */}
                    {months.map((month, idx) => (
                      <div key={`quarter-header-${month}-${idx}`} className="grid-quarter-header">
                        <span>W1</span>
                        <span>W2</span>
                        <span>W3</span>
                        <span>W4</span>
                      </div>
                    ))}

                    {/* Tournament Rows */}
                    {tournamentData.map((tournament) => (
                      <React.Fragment key={tournament.id}>
                        {/* Tournament Name Cell */}
                        <div
                          className="grid-tournament-name"
                          onClick={() => openModal(tournament)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="tournament-name-content">
                            <i className="fas fa-trophy"></i>
                            <div>
                              <div className="tournament-name-title">{tournament.name}</div>
                              <div className="tournament-name-date">
                                {tournament.startDate && (
                                  <>
                                    {new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    {tournament.endDate && tournament.endDate !== tournament.startDate && (
                                      <> - {new Date(tournament.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Month Cells */}
                        {months.map((month, monthIdx) => (
                          <div key={`${tournament.id}-${monthIdx}`} className="grid-month-cell">
                            {[1, 2, 3, 4].map((quarter) => {
                              const cellData = tournament.schedule[monthIdx][quarter];
                              const hasEvent = !!cellData;

                              let cellClass = "grid-quarter-cell";
                              if (hasEvent) {
                                cellClass += ` filled-${tournament.color}`;

                                if (cellData.type === 'span') {
                                  if (cellData.start && !cellData.end) {
                                    cellClass += " span-start";
                                  } else if (cellData.end && !cellData.start) {
                                    cellClass += " span-end";
                                  } else if (cellData.middle) {
                                    cellClass += " span-middle";
                                  } else if (cellData.start && cellData.end) {
                                    cellClass += " span-complete";
                                  }
                                }
                              }

                              return (
                                <div
                                  key={`${tournament.id}-${monthIdx}-${quarter}`}
                                  className={cellClass}
                                  title={hasEvent ? tournament.name : ''}
                                  onClick={hasEvent ? () => openModal(tournament) : undefined}
                                  style={hasEvent ? { cursor: 'pointer' } : {}}
                                >
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Mobile Tournament List */}
                {mobileView === 'list' && (
                  <div className="mobile-tournament-list mobile-only">
                    {tournamentData.map((tournament) => (
                      <div
                        key={tournament.id}
                        className="mobile-tournament-card"
                        onClick={() => openModal(tournament)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="mobile-card-content">
                          <div className="mobile-card-header">
                            <div className={`mobile-color-dot color-${tournament.color}`}></div>
                            <h3>{tournament.name}</h3>
                          </div>
                          <div className="mobile-card-date">
                            <i className="fas fa-calendar-alt"></i>
                            {new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {tournament.endDate && tournament.endDate !== tournament.startDate && (
                              <> - {new Date(tournament.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                            )}
                          </div>
                          <div className="mobile-card-badge">
                            <span className={`tournament-badge ${getTypeBadgeClass(tournament.type)}`}>
                              {getTypeLabel(tournament.type)}
                            </span>
                          </div>
                        </div>
                        <i className="fas fa-chevron-right"></i>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mobile Calendar Grid */}
                {mobileView === 'calendar' && (
                  <div className="mobile-calendar-grid mobile-only">
                    <div className="mobile-month-selector">
                      <button
                        onClick={() => setCurrentMonth(currentMonth > 0 ? currentMonth - 1 : 11)}
                        className="month-nav-btn"
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      <div className="current-month-display">{months[currentMonth]} 2025</div>
                      <button
                        onClick={() => setCurrentMonth(currentMonth < 11 ? currentMonth + 1 : 0)}
                        className="month-nav-btn"
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>

                    <div className="mobile-month-tournaments">
                      {tournamentData
                        .filter(t => t.schedule[currentMonth] && Object.keys(t.schedule[currentMonth]).length > 0)
                        .map((tournament) => (
                          <div
                            key={tournament.id}
                            className="mobile-tournament-card"
                            onClick={() => openModal(tournament)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="mobile-card-content">
                              <div className="mobile-card-header">
                                <div className={`mobile-color-dot color-${tournament.color}`}></div>
                                <h3>{tournament.name}</h3>
                              </div>
                              <div className="mobile-card-date">
                                <i className="fas fa-calendar-alt"></i>
                                {new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                            <i className="fas fa-chevron-right"></i>
                          </div>
                        ))}
                      {tournamentData.filter(t => t.schedule[currentMonth] && Object.keys(t.schedule[currentMonth]).length > 0).length === 0 && (
                        <div className="no-tournaments">
                          <i className="fas fa-calendar-times"></i>
                          <p>No events this month</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Simple Tournament Modal */}
      {showModal && selectedTournament && (
        <div className="popup-overlay" onClick={closeModal}>
          <div className="popup-window" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={closeModal}>×</button>

            <h3 className="popup-title">{selectedTournament.name}</h3>

            <div className="popup-content">
              <div className="popup-row">
                <span className="popup-label">Type</span>
                <span className="popup-value">{getTypeLabel(selectedTournament.type)}</span>
              </div>

              <div className="popup-row">
                <span className="popup-label">Start Date</span>
                <span className="popup-value">
                  {new Date(selectedTournament.startDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <div className="popup-row">
                <span className="popup-label">End Date</span>
                <span className="popup-value">
                  {new Date(selectedTournament.endDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              {selectedTournament.venue && (
                <div className="popup-row">
                  <span className="popup-label">Venue</span>
                  <span className="popup-value">{selectedTournament.venue}</span>
                </div>
              )}

              {selectedTournament.city && (
                <div className="popup-row">
                  <span className="popup-label">City</span>
                  <span className="popup-value">{selectedTournament.city}</span>
                </div>
              )}

              {selectedTournament.organizer && (
                <div className="popup-row">
                  <span className="popup-label">Organizer</span>
                  <span className="popup-value">{selectedTournament.organizer}</span>
                </div>
              )}

              {selectedTournament.personInCharge && (
                <div className="popup-row">
                  <span className="popup-label">Contact Person</span>
                  <span className="popup-value">{selectedTournament.personInCharge}</span>
                </div>
              )}

              {selectedTournament.phoneNumber && (
                <div className="popup-row">
                  <span className="popup-label">Phone</span>
                  <span className="popup-value">
                    <a href={`tel:${selectedTournament.phoneNumber}`}>{selectedTournament.phoneNumber}</a>
                  </span>
                </div>
              )}
            </div>

            <div className="popup-actions">
              <button className="popup-btn popup-btn-primary" onClick={handleRegisterNow}>
                Register Now
              </button>
              <button className="popup-btn popup-btn-secondary">Download Info</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tournament;
