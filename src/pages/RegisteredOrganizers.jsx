import { useState, useEffect, useRef } from 'react';
import './RegisteredOrganizers.css';
import organizerService from '../services/organizerService';

function RegisteredOrganizers() {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;

  // Fetch organizers from API
  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await organizerService.getAllOrganizers();
      setOrganizers(data);
    } catch (err) {
      console.error('Error fetching organizers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Connect to WebSocket for real-time updates
  const connectWebSocket = () => {
    // Clear any existing connection
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        console.log('Error closing previous WebSocket:', e);
      }
      wsRef.current = null;
    }

    try {
      const wsUrl = organizerService.getWebSocketURL();
      console.log(`🔌 WebSocket connection attempt #${reconnectAttemptsRef.current + 1}`);
      console.log('🔌 Connecting to:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.log('⏱️ WebSocket connection timeout');
          ws.close();
        }
      }, 10000); // 10 second timeout

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('✅ WebSocket connected successfully!');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0; // Reset reconnect counter on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message:', data.type);

          // Handle different types of updates
          switch (data.type) {
            case 'CONNECTED':
              console.log('✅ Server confirmed:', data.message);
              break;
            case 'ORGANIZER_ADDED':
              console.log('➕ Organizer added');
              setOrganizers(prev => [...prev, data.organizer]);
              break;
            case 'ORGANIZER_UPDATED':
              console.log('✏️ Organizer updated');
              setOrganizers(prev =>
                prev.map(org => org._id === data.organizer._id ? data.organizer : org)
              );
              break;
            case 'ORGANIZER_DELETED':
              console.log('🗑️ Organizer deleted');
              setOrganizers(prev =>
                prev.filter(org => org._id !== data.organizerId)
              );
              break;
            case 'ORGANIZERS_REFRESH':
              console.log('🔄 Refreshing:', data.message);
              fetchOrganizers();
              break;
            default:
              console.log('❓ Unknown message type:', data.type);
          }
        } catch (err) {
          console.error('❌ Error parsing message:', err);
        }
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('❌ WebSocket error');
        console.log('ReadyState:', ws.readyState);
        console.log('URL:', ws.url);
        setConnectionStatus('error');
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log('🔌 WebSocket closed');
        console.log(`Code: ${event.code}, Reason: ${event.reason || 'None'}, Clean: ${event.wasClean}`);

        wsRef.current = null;
        setConnectionStatus('disconnected');

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
          console.log(`🔄 Reconnecting in ${delay / 1000}s (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else {
          console.error('❌ Max reconnection attempts reached');
          setConnectionStatus('error');
        }
      };
    } catch (err) {
      console.error('❌ Error creating WebSocket:', err);
      setConnectionStatus('error');
    }
  };

  // Initial fetch and WebSocket connection
  useEffect(() => {
    let isComponentMounted = true;

    fetchOrganizers();

    // Delay WebSocket connection to avoid React Strict Mode double-mount issues
    const connectTimeout = setTimeout(() => {
      if (isComponentMounted) {
        connectWebSocket();
      }
    }, 100);

    // Cleanup on unmount
    return () => {
      isComponentMounted = false;
      clearTimeout(connectTimeout);

      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Close WebSocket connection
      if (wsRef.current) {
        console.log('🧹 Cleaning up WebSocket connection');
        const ws = wsRef.current;
        wsRef.current = null;

        // Remove all event listeners before closing
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;

        // Close if still open
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      }
    };
  }, []);

  const getConnectionStatusClass = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'status-connected';
      case 'disconnected':
        return 'status-disconnected';
      case 'error':
        return 'status-error';
      default:
        return '';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live Updates Active';
      case 'disconnected':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return '';
    }
  };

  const handleOrganizerClick = (organizer) => {
    setSelectedOrganizer(organizer);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrganizer(null);
  };

  return (
    <div className="registered-organizers-page">
      <div className="organizers-container">
        {loading && (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading organizers...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <i className="fas fa-exclamation-circle"></i>
            <p>Error loading organizers: {error}</p>
            <button onClick={fetchOrganizers} className="retry-button">
              <i className="fas fa-redo"></i> Retry
            </button>
          </div>
        )}

        {!loading && !error && organizers.length === 0 && (
          <div className="empty-state">
            <i className="fas fa-users"></i>
            <p>No organizers registered yet</p>
          </div>
        )}

        {!loading && !error && organizers.length > 0 && (
          <>
            <p className="organizers-description">All organizers and companies registered under MPA will be listed here.</p>

            <div className="organizers-table-wrapper">
              <table className="organizers-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Organization Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>State</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {organizers.map((organizer, index) => (
                    <tr key={organizer._id}>
                      <td className="table-number">{index + 1}</td>
                      <td>
                        <button
                          className="organizer-name-link"
                          onClick={() => handleOrganizerClick(organizer)}
                        >
                          {organizer.organizationName || organizer.name}
                        </button>
                      </td>
                      <td>{organizer.email || '-'}</td>
                      <td>{organizer.phone || '-'}</td>
                      <td>{organizer.state || '-'}</td>
                      <td>
                        {organizer.status && (
                          <span className={`status-badge status-${organizer.status.toLowerCase()}`}>
                            {organizer.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal for organizer details */}
      {showModal && selectedOrganizer && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <i className="fas fa-times"></i>
            </button>

            <div className="modal-header">
              <h2>{selectedOrganizer.organizationName || selectedOrganizer.name}</h2>
            </div>

            <div className="modal-body">
              <div className="detail-row-simple">
                <span className="detail-label">Organization ID</span>
                <span className="detail-value">{selectedOrganizer.organizationId || '-'}</span>
              </div>

              <div className="detail-row-simple">
                <span className="detail-label">Email</span>
                <span className="detail-value">{selectedOrganizer.email || '-'}</span>
              </div>

              <div className="detail-row-simple">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{selectedOrganizer.phone || '-'}</span>
              </div>

              <div className="detail-row-simple">
                <span className="detail-label">State</span>
                <span className="detail-value">{selectedOrganizer.state || '-'}</span>
              </div>

              <div className="detail-row-simple">
                <span className="detail-label">City</span>
                <span className="detail-value">{selectedOrganizer.city || '-'}</span>
              </div>

              <div className="detail-row-simple">
                <span className="detail-label">Address</span>
                <span className="detail-value">{selectedOrganizer.address || '-'}</span>
              </div>

              <div className="detail-row-simple">
                <span className="detail-label">Registration Date</span>
                <span className="detail-value">
                  {selectedOrganizer.registrationDate
                    ? new Date(selectedOrganizer.registrationDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : '-'}
                </span>
              </div>

              <div className="detail-row-simple">
                <span className="detail-label">Status</span>
                <span className="detail-value">
                  {selectedOrganizer.status && (
                    <span className={`status-badge status-${selectedOrganizer.status.toLowerCase()}`}>
                      {selectedOrganizer.status}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegisteredOrganizers;
