import { useState, useEffect } from 'react';
import './ManageMessages.css';

function ManageMessages() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageType, setMessageType] = useState('all'); // 'all' or 'specific'
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';
      const response = await fetch(`${PORTAL_API_URL}/players`);
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
      alert('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      alert('Please fill in both subject and message');
      return;
    }

    if (messageType === 'specific' && !selectedPlayer) {
      alert('Please select a player');
      return;
    }

    setSending(true);

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';

      if (messageType === 'all') {
        // Send to all players
        let successCount = 0;
        let failCount = 0;

        for (const player of players) {
          try {
            await fetch(`${PORTAL_API_URL}/players/${player.playerId}/send-message`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                subject,
                message,
              }),
            });
            successCount++;
          } catch (error) {
            console.error(`Failed to send to ${player.fullName}:`, error);
            failCount++;
          }
        }

        alert(`Message sent successfully!\n✅ Sent: ${successCount} players\n❌ Failed: ${failCount} players`);
      } else {
        // Send to specific player
        const response = await fetch(`${PORTAL_API_URL}/players/${selectedPlayer}/send-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject,
            message,
          }),
        });

        if (response.ok) {
          const selectedPlayerData = players.find(p => p.playerId === selectedPlayer);
          alert(`Message sent successfully to ${selectedPlayerData.fullName}!`);
        } else {
          throw new Error('Failed to send message');
        }
      }

      // Reset form
      setSubject('');
      setMessage('');
      setSelectedPlayer('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Filter players based on search term
  const filteredPlayers = players.filter(player =>
    player.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.playerId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="manage-messages">
      <div className="content-header">
        <h1>
          <i className="fas fa-envelope"></i>
          Send Messages to Players
        </h1>
      </div>

      <div className="content-body">
        <div className="message-form-container">
          <form onSubmit={handleSendMessage} className="message-form">
            {/* Message Type Selection */}
            <div className="form-section">
              <h3>Recipients</h3>
              <div className="message-type-selector">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="messageType"
                    value="all"
                    checked={messageType === 'all'}
                    onChange={(e) => setMessageType(e.target.value)}
                  />
                  <span>
                    <i className="fas fa-users"></i>
                    Send to All Players ({players.length} players)
                  </span>
                </label>

                <label className="radio-option">
                  <input
                    type="radio"
                    name="messageType"
                    value="specific"
                    checked={messageType === 'specific'}
                    onChange={(e) => setMessageType(e.target.value)}
                  />
                  <span>
                    <i className="fas fa-user"></i>
                    Send to Specific Player
                  </span>
                </label>
              </div>
            </div>

            {/* Player Selection (shown only when messageType is 'specific') */}
            {messageType === 'specific' && (
              <div className="form-section">
                <h3>Select Player</h3>
                <div className="player-search">
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    placeholder="Search by name or MPA ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="player-select-wrapper">
                  <select
                    value={selectedPlayer}
                    onChange={(e) => setSelectedPlayer(e.target.value)}
                    required={messageType === 'specific'}
                    className="player-select"
                  >
                    <option value="">-- Select a Player --</option>
                    {filteredPlayers.map((player) => (
                      <option key={player.playerId} value={player.playerId}>
                        {player.fullName} - {player.playerId}
                      </option>
                    ))}
                  </select>
                </div>

                {filteredPlayers.length === 0 && searchTerm && (
                  <p className="no-results">No players found matching "{searchTerm}"</p>
                )}
              </div>
            )}

            {/* Message Content */}
            <div className="form-section">
              <h3>Message Details</h3>

              <div className="form-group">
                <label htmlFor="subject">
                  Subject <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter message subject"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">
                  Message <span className="required">*</span>
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows="10"
                  required
                  className="form-textarea"
                ></textarea>
                <small className="char-count">{message.length} characters</small>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSubject('');
                  setMessage('');
                  setSelectedPlayer('');
                  setSearchTerm('');
                }}
              >
                <i className="fas fa-times"></i>
                Clear
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={sending || loading}
              >
                {sending ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="info-box">
            <h4>
              <i className="fas fa-info-circle"></i>
              Information
            </h4>
            <ul>
              <li>Messages will be sent to player's inbox in their dashboard</li>
              <li>Players will see the message when they log in</li>
              <li>Sending to all players may take a few moments</li>
              <li>Make sure your message is clear and professional</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManageMessages;
