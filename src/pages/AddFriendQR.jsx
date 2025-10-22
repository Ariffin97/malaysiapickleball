import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AddFriendQR.css';

function AddFriendQR() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = localStorage.getItem('playerLoggedIn');
    const currentId = localStorage.getItem('playerMpaId');
    setIsLoggedIn(!!loggedIn);
    setCurrentPlayerId(currentId);

    // Fetch player data
    fetchPlayerData();
  }, [playerId]);

  const fetchPlayerData = async () => {
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${PORTAL_API_URL}/players/qr/${playerId}`);

      if (response.ok) {
        const data = await response.json();
        setPlayerData(data);
      } else {
        setError('Player not found');
      }
    } catch (error) {
      console.error('Error fetching player:', error);
      setError('Unable to load player information');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!isLoggedIn) {
      // Redirect to login with return URL
      navigate(`/player/login?returnUrl=/add-friend/${playerId}`);
      return;
    }

    setSending(true);
    setError('');

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';
      const requesterName = localStorage.getItem('playerName');
      const requesterUsername = localStorage.getItem('playerUsername');

      const response = await fetch(`${PORTAL_API_URL}/friend-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requesterId: currentPlayerId,
          requesterName,
          requesterUsername,
          recipientId: playerData.playerId,
          recipientName: playerData.fullName,
          recipientUsername: playerData.username
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/player/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      setError('Unable to send friend request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/player/dashboard');
  };

  const handleLogin = () => {
    navigate(`/player/login?returnUrl=/add-friend/${playerId}`);
  };

  if (loading) {
    return (
      <div className="add-friend-qr-page">
        <div className="add-friend-container">
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading player information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !playerData) {
    return (
      <div className="add-friend-qr-page">
        <div className="add-friend-container">
          <div className="error-state">
            <i className="fas fa-exclamation-circle"></i>
            <h2>Player Not Found</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/')} className="btn-back-home">
              <i className="fas fa-home"></i>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if trying to add yourself
  const isSelf = currentPlayerId === playerData?.playerId;

  return (
    <div className="add-friend-qr-page">
      <div className="add-friend-container">
        <div className="add-friend-card">
          {/* Header */}
          <div className="add-friend-header">
            <img src="/mpa.png" alt="MPA Logo" className="add-friend-logo" />
            <h1>Add Friend</h1>
            <p className="subtitle">Connect with this player</p>
          </div>

          {/* Player Profile */}
          {playerData && (
            <div className="player-profile-preview">
              <div className="player-avatar">
                {playerData.profilePicture ? (
                  <img src={playerData.profilePicture} alt={playerData.fullName} />
                ) : (
                  <i className="fas fa-user-circle"></i>
                )}
              </div>
              <h2>{playerData.fullName}</h2>
              <p className="player-username">@{playerData.username}</p>
              <div className="player-id-badge">
                <i className="fas fa-id-badge"></i>
                <span>{playerData.playerId}</span>
              </div>
            </div>
          )}

          {/* Messages */}
          {success && (
            <div className="success-message">
              <i className="fas fa-check-circle"></i>
              <span>Friend request sent successfully! Redirecting...</span>
            </div>
          )}

          {error && playerData && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="add-friend-actions">
            {!isLoggedIn ? (
              <>
                <button onClick={handleLogin} className="btn-primary">
                  <i className="fas fa-sign-in-alt"></i>
                  Login to Add Friend
                </button>
                <p className="login-hint">You need to be logged in to send friend requests</p>
              </>
            ) : isSelf ? (
              <>
                <div className="info-message">
                  <i className="fas fa-info-circle"></i>
                  <span>This is your own profile</span>
                </div>
                <button onClick={handleGoToDashboard} className="btn-secondary">
                  <i className="fas fa-arrow-left"></i>
                  Go to Dashboard
                </button>
              </>
            ) : success ? (
              <button onClick={handleGoToDashboard} className="btn-secondary">
                <i className="fas fa-arrow-left"></i>
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={handleSendFriendRequest}
                  className="btn-primary"
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus"></i>
                      Send Friend Request
                    </>
                  )}
                </button>
                <button onClick={handleGoToDashboard} className="btn-secondary">
                  <i className="fas fa-arrow-left"></i>
                  {isLoggedIn ? 'Back to Dashboard' : 'Back to Home'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddFriendQR;
