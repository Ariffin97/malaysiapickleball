import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './NationalRankings.css';
import playerService from '../services/playerService';

function NationalRankings() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [genderFilter, setGenderFilter] = useState('all'); // 'all', 'male', 'female'
  const [eventFilter, setEventFilter] = useState('all'); // 'all', 'singles', 'doubles', 'mixed'
  const [ageFilter, setAgeFilter] = useState('open'); // 'open', 'u12', 'u15', 'u18', '35+', '50+', '60+'
  const [skillFilter, setSkillFilter] = useState('open'); // 'open', 'advanced+', 'advanced', 'intermediate+', 'intermediate'
  const [stateFilter, setStateFilter] = useState('all'); // 'all', or specific state

  // Malaysian states
  const states = [
    'All States',
    'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang',
    'Penang', 'Perak', 'Perlis', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu',
    'Kuala Lumpur', 'Labuan', 'Putrajaya'
  ];

  // Fetch rankings from API
  const fetchRankings = async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = {};
      if (genderFilter !== 'all') filterParams.gender = genderFilter;
      if (eventFilter !== 'all') filterParams.eventType = eventFilter;
      if (ageFilter !== 'open') filterParams.ageGroup = ageFilter;
      if (skillFilter !== 'open') filterParams.skillLevel = skillFilter;
      if (stateFilter !== 'all') filterParams.state = stateFilter;

      const data = await playerService.getRankings(filterParams);

      setPlayers(data);
    } catch (err) {
      console.error('Error fetching rankings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchRankings();
  }, [genderFilter, eventFilter, ageFilter, skillFilter, stateFilter]);

  return (
    <div className="national-rankings-page">
      <section className="page-header">
        <h1>National Rankings</h1>
        <p>Malaysia Pickleball Ranking System (MPRS)</p>
      </section>

      <section className="content-section">
        <div className="container">
          {/* Brief Description */}
          <div className="brief-description">
            <p>
              Rankings are based on the best 8 tournament results within the past 52 weeks.
            </p>
            <Link to="/ranking-system" className="learn-more-link">
              Learn how points are calculated <i className="fas fa-arrow-right"></i>
            </Link>
          </div>

          {/* Filters */}
          <div className="filters-container">
            {/* Gender Filter */}
            <div className="filter-group">
              <label className="filter-label">Gender</label>
              <select
                className="filter-select"
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
              >
                <option value="all">All Genders</option>
                <option value="male">Men</option>
                <option value="female">Women</option>
              </select>
            </div>

            {/* Event Type Filter */}
            <div className="filter-group">
              <label className="filter-label">Event Type</label>
              <select
                className="filter-select"
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
              >
                <option value="all">All Events</option>
                <option value="singles">Singles</option>
                <option value="doubles">Doubles</option>
                <option value="mixed">Mixed Doubles</option>
              </select>
            </div>

            {/* Age Group Filter */}
            <div className="filter-group">
              <label className="filter-label">Age Category</label>
              <select
                className="filter-select"
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
              >
                <option value="open">Open Age</option>
                <option value="u12">Under 12 (U12)</option>
                <option value="u15">Under 15 (U15)</option>
                <option value="u18">Under 18 (U18)</option>
                <option value="35+">35+ (Seniors)</option>
                <option value="50+">50+ (Masters)</option>
                <option value="60+">60+ (Grand Masters)</option>
              </select>
            </div>

            {/* Skill Level Filter */}
            <div className="filter-group">
              <label className="filter-label">Skill Division</label>
              <select
                className="filter-select"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
              >
                <option value="open">Open Skill</option>
                <option value="advanced+">Advanced+</option>
                <option value="advanced">Advanced</option>
                <option value="intermediate+">Intermediate+</option>
                <option value="intermediate">Intermediate</option>
              </select>
            </div>

            {/* State Filter */}
            <div className="filter-group">
              <label className="filter-label">State</label>
              <select
                className="filter-select"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
              >
                {states.map((state, index) => (
                  <option key={index} value={index === 0 ? 'all' : state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading rankings...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="error-state">
              <i className="fas fa-exclamation-circle"></i>
              <p>Error loading rankings: {error}</p>
              <button onClick={fetchRankings} className="retry-button">
                <i className="fas fa-redo"></i> Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && players.length === 0 && (
            <div className="empty-state">
              <i className="fas fa-medal"></i>
              <p>No ranked players yet</p>
            </div>
          )}

          {/* Rankings Table */}
          {!loading && !error && players.length > 0 && (
            <div className="rankings-table-wrapper">
              <table className="rankings-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Gender</th>
                    <th>Points</th>
                    <th>Rating</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, index) => (
                    <tr key={player._id || index}>
                      <td className="rank-cell">
                        <span className={`rank-badge ${index < 3 ? `top-${index + 1}` : ''}`}>
                          {player.rankPosition || index + 1}
                        </span>
                      </td>
                      <td className="player-name">
                        {player.name || player.fullName || '-'}
                      </td>
                      <td>
                        <span className={`gender-badge ${player.gender?.toLowerCase()}`}>
                          {player.gender === 'male' ? 'M' : player.gender === 'female' ? 'F' : '-'}
                        </span>
                      </td>
                      <td className="points-cell">
                        {player.currentRankingPoints?.toFixed(2) || '0.00'}
                      </td>
                      <td className="rating-cell">
                        {player.duprRating?.toFixed(2) || '-'}
                      </td>
                      <td>{player.state || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default NationalRankings;
