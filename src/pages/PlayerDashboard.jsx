import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import './PlayerDashboard.css';

// Function to calculate skill level from DUPR rating
function calculateSkillLevel(duprRating) {
  if (!duprRating || duprRating <= 0) {
    return 'Beginner';
  }

  if (duprRating <= 2.499) {
    return 'Novice';
  } else if (duprRating <= 2.999) {
    return 'Intermediate';
  } else if (duprRating <= 3.499) {
    return 'Intermediate+';
  } else if (duprRating <= 3.999) {
    return 'Advanced';
  } else if (duprRating <= 4.499) {
    return 'Advanced+';
  } else {
    return 'Elite';
  }
}

function PlayerDashboard() {
  const [activeMenu, setActiveMenu] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('playerLoggedIn');
    if (!isLoggedIn) {
      navigate('/player/login');
      return;
    }

    // Fetch player data
    const fetchPlayerData = async () => {
      try {
        const playerId = localStorage.getItem('playerId');
        const token = localStorage.getItem('playerToken');
        const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

        const response = await fetch(`${PORTAL_API_URL}/players/${playerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPlayerData(data);
        } else {
          // If unauthorized, redirect to login
          handleLogout();
        }
      } catch (error) {
        console.error('Error fetching player data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
    fetchMessages();
    fetchPlayerMessages();
    fetchFriends();
    fetchFriendRequests();
  }, [navigate]);

  const fetchMessages = async () => {
    try {
      const playerId = localStorage.getItem('playerId');
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

      const response = await fetch(`${PORTAL_API_URL}/players/${playerId}/messages`);

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        const unread = data.filter(msg => !msg.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleMessageClick = async (message) => {
    setSelectedMessage(message);

    // Mark message as read if it's unread
    if (!message.read) {
      try {
        const playerId = localStorage.getItem('playerId');
        const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

        if (message.type === 'admin') {
          // Mark admin message as read
          await fetch(`${PORTAL_API_URL}/players/${playerId}/messages/${message._id}/read`, {
            method: 'PATCH',
          });

          // Update local state
          setMessages(messages.map(msg =>
            msg._id === message._id ? { ...msg, read: true } : msg
          ));
          setUnreadCount(prev => Math.max(0, prev - 1));
        } else {
          // Mark player message as read
          await fetch(`${PORTAL_API_URL}/player-messages/${message._id}/read`, {
            method: 'PATCH',
          });

          // Update local state
          setPlayerMessages(playerMessages.map(msg =>
            msg._id === message._id ? { ...msg, read: true } : msg
          ));
          setPlayerUnreadCount(prev => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('playerLoggedIn');
    localStorage.removeItem('playerToken');
    localStorage.removeItem('playerId');
    localStorage.removeItem('playerName');
    navigate('/player/login');
  };

  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Player-to-Player Messaging State
  const [playersList, setPlayersList] = useState([]);
  const [playerMessages, setPlayerMessages] = useState([]);
  const [playerUnreadCount, setPlayerUnreadCount] = useState(0);
  const [sendMessageData, setSendMessageData] = useState({
    recipientId: '',
    subject: '',
    message: ''
  });
  const [sendMessageLoading, setSendMessageLoading] = useState(false);
  const [sendMessageError, setSendMessageError] = useState('');
  const [sendMessageSuccess, setSendMessageSuccess] = useState('');

  // Friend Management State
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');
  const [showQRCode, setShowQRCode] = useState(false);
  const [scannedQR, setScannedQR] = useState('');

  // QR Code ref for download
  const qrCodeRef = useRef(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [selectedProfilePicture, setSelectedProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    // Validate password length
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setPasswordLoading(true);

    try {
      const playerId = localStorage.getItem('playerId');
      const token = localStorage.getItem('playerToken');
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

      const response = await fetch(`${PORTAL_API_URL}/players/${playerId}/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setPasswordError(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Unable to connect to server. Please try again later.');
    } finally {
      setPasswordLoading(false);
    }
  };


  // Send message to another player
  const handleSendMessage = async (e) => {
    e.preventDefault();
    setSendMessageError('');
    setSendMessageSuccess('');
    setSendMessageLoading(true);

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';
      const senderId = localStorage.getItem('playerMpaId');
      const senderName = localStorage.getItem('playerName');

      const selectedPlayer = playersList.find(p => p.friendId === sendMessageData.recipientId);

      if (!selectedPlayer) {
        setSendMessageError('Please select a recipient');
        setSendMessageLoading(false);
        return;
      }

      const response = await fetch(`${PORTAL_API_URL}/player-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId,
          senderName,
          recipientId: sendMessageData.recipientId,
          recipientName: selectedPlayer.friendName,
          subject: sendMessageData.subject,
          message: sendMessageData.message
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSendMessageSuccess('Message sent successfully!');
        setSendMessageData({
          recipientId: '',
          subject: '',
          message: ''
        });
        setTimeout(() => {
          setSendMessageSuccess('');
        }, 3000);
      } else {
        setSendMessageError(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setSendMessageError('Unable to connect to server. Please try again later.');
    } finally {
      setSendMessageLoading(false);
    }
  };

  // Fetch player messages
  const fetchPlayerMessages = async () => {
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';
      const playerId = localStorage.getItem('playerId');

      const response = await fetch(`${PORTAL_API_URL}/players/${playerId}/player-messages`);

      if (response.ok) {
        const data = await response.json();
        setPlayerMessages(data.messages);
        setPlayerUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching player messages:', error);
    }
  };

  // Fetch friends list
  const fetchFriends = async () => {
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';
      const playerId = localStorage.getItem('playerId');

      const response = await fetch(`${PORTAL_API_URL}/players/${playerId}/friends`);

      if (response.ok) {
        const data = await response.json();
        setFriends(data);
        // Update playersList to only show friends for messaging
        setPlayersList(data);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  // Fetch friend requests
  const fetchFriendRequests = async () => {
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';
      const playerId = localStorage.getItem('playerId');

      const response = await fetch(`${PORTAL_API_URL}/players/${playerId}/friend-requests`);

      if (response.ok) {
        const data = await response.json();
        setFriendRequests(data);
        setFriendRequestsCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  // Search for players
  const handleSearchPlayers = async (query) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${PORTAL_API_URL}/players/search?query=${encodeURIComponent(query)}`);

      if (response.ok) {
        const data = await response.json();
        // Filter out current player and existing friends
        const currentPlayerId = localStorage.getItem('playerMpaId');
        const friendIds = friends.map(f => f.friendId);
        const filtered = data.filter(p => p.playerId !== currentPlayerId && !friendIds.includes(p.playerId));
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Error searching players:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Send friend request
  const handleSendFriendRequest = async (recipientId, recipientName, recipientUsername) => {
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';
      const requesterId = localStorage.getItem('playerMpaId');
      const requesterName = localStorage.getItem('playerName');
      const requesterUsername = playerData.username;

      const response = await fetch(`${PORTAL_API_URL}/friend-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requesterId,
          requesterName,
          requesterUsername,
          recipientId,
          recipientName,
          recipientUsername
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Friend request sent successfully!');
        setSearchQuery('');
        setSearchResults([]);
      } else {
        alert(data.error || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Unable to send friend request');
    }
  };

  // Accept friend request
  const handleAcceptFriendRequest = async (requestId) => {
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

      const response = await fetch(`${PORTAL_API_URL}/friend-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'accepted' })
      });

      if (response.ok) {
        alert('Friend request accepted!');
        fetchFriendRequests();
        fetchFriends();
      } else {
        alert('Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Unable to accept friend request');
    }
  };

  // Reject friend request
  const handleRejectFriendRequest = async (requestId) => {
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

      const response = await fetch(`${PORTAL_API_URL}/friend-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected' })
      });

      if (response.ok) {
        alert('Friend request rejected');
        fetchFriendRequests();
      } else {
        alert('Failed to reject friend request');
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Unable to reject friend request');
    }
  };

  // Remove friend
  const handleRemoveFriend = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';
      const playerId = localStorage.getItem('playerId');

      const response = await fetch(`${PORTAL_API_URL}/players/${playerId}/friends/${friendId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Friend removed successfully');
        fetchFriends();
      } else {
        alert('Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Unable to remove friend');
    }
  };

  // Add friend by QR code
  const handleAddFriendByQR = async (qrPlayerId) => {
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

      const response = await fetch(`${PORTAL_API_URL}/players/qr/${qrPlayerId}`);

      if (response.ok) {
        const player = await response.json();
        await handleSendFriendRequest(player.playerId, player.fullName, player.username);
        setScannedQR('');
      } else {
        alert('Player not found');
      }
    } catch (error) {
      console.error('Error adding friend by QR:', error);
      alert('Unable to add friend');
    }
  };

  // Download QR Code
  const handleDownloadQRCode = () => {
    const canvas = qrCodeRef.current?.querySelector('canvas');
    if (!canvas) return;

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) return;

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${playerData?.playerId || 'player'}-qrcode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  const handleEditProfile = () => {
    setEditFormData({
      fullName: playerData.fullName,
      email: playerData.email,
      phoneNumber: playerData.phoneNumber,
      addressLine1: playerData.addressLine1,
      addressLine2: playerData.addressLine2 || '',
      city: playerData.city,
      state: playerData.state,
      duprRating: playerData.duprRating || '',
      duprId: playerData.duprId || ''
    });
    setSelectedProfilePicture(null);
    setProfilePicturePreview(playerData.profilePicture || null);
    setUpdateError('');
    setUpdateSuccess('');
    setShowEditModal(true);
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUpdateError('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUpdateError('File size must be less than 5MB');
        return;
      }

      setSelectedProfilePicture(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');
    setUpdateLoading(true);

    try {
      const playerId = localStorage.getItem('playerId');
      const token = localStorage.getItem('playerToken');
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

      // If profile picture is selected, upload it first
      if (selectedProfilePicture) {
        const formData = new FormData();
        formData.append('profilePicture', selectedProfilePicture);

        const uploadResponse = await fetch(`${PORTAL_API_URL}/players/${playerId}/profile-picture`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          setUpdateError('Error uploading profile picture');
          setUpdateLoading(false);
          return;
        }
      }

      // Update other profile fields
      const response = await fetch(`${PORTAL_API_URL}/players/${playerId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        const updatedData = await response.json();
        setPlayerData(updatedData);
        setUpdateSuccess('Profile updated successfully!');

        setTimeout(() => {
          setShowEditModal(false);
          setUpdateSuccess('');
          setSelectedProfilePicture(null);
          setProfilePicturePreview(null);
          // Reload to show new profile picture
          window.location.reload();
        }, 1500);
      } else {
        const data = await response.json();
        setUpdateError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateError('Unable to connect to server. Please try again later.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const menuItems = [
    {
      id: 'profile',
      icon: 'fa-user',
      label: 'My Profile',
    },
    {
      id: 'friends',
      icon: 'fa-user-friends',
      label: 'Friend List',
      badge: friendRequestsCount > 0 ? friendRequestsCount : null,
    },
    {
      id: 'send-message',
      icon: 'fa-paper-plane',
      label: 'Send Message',
    },
    {
      id: 'inbox',
      icon: 'fa-inbox',
      label: 'Inbox',
      badge: (unreadCount + playerUnreadCount) > 0 ? (unreadCount + playerUnreadCount) : null,
    },
    {
      id: 'tournaments',
      icon: 'fa-trophy',
      label: 'My Tournaments',
    },
    {
      id: 'stats',
      icon: 'fa-chart-bar',
      label: 'Statistics',
    },
    {
      id: 'training',
      icon: 'fa-dumbbell',
      label: 'Training Programs',
    },
    {
      id: 'picklezone',
      label: 'PickleZone',
      badge: 'Coming Up',
      badgeType: 'info',
    },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="dashboard-content">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading...</p>
          </div>
        </div>
      );
    }

    switch (activeMenu) {
      case 'profile':
        return (
          <div className="dashboard-content">
            <div className="content-header">
              <div>
                <h1>My Profile</h1>
                <p className="subtitle">Manage your personal information</p>
              </div>
              <button className="btn-edit-profile" onClick={handleEditProfile}>
                <i className="fas fa-edit"></i>
                Edit Profile
              </button>
            </div>

            {playerData && (
              <>
                {/* Profile Summary Card */}
                <div className="profile-summary-card">
                  <div className="profile-summary-left">
                    <div className="profile-avatar-section">
                      <div className="profile-avatar">
                        {playerData.profilePicture ? (
                          <img src={playerData.profilePicture} alt={playerData.fullName} />
                        ) : (
                          <i className="fas fa-user"></i>
                        )}
                      </div>
                      <div className="profile-main-info">
                        <h2>{playerData.fullName}</h2>
                        <p className="username">@{playerData.username}</p>
                        <div className="mpa-id-display">
                          <i className="fas fa-id-badge"></i>
                          <span>{playerData.playerId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="profile-stats">
                      <div className="stat-item">
                        <span className="stat-label">Membership</span>
                        <span className="stat-value">{playerData.membershipType || 'Standard'}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Skill Level</span>
                        <span className="stat-value">{calculateSkillLevel(playerData.duprRating)}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">DUPR Rating</span>
                        <span className="stat-value">{playerData.duprRating || 'Not set'}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Status</span>
                        <span className={`stat-value status-${playerData.status}`}>
                          {playerData.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="profile-qr-section">
                    <div className="qr-code-header">
                      <i className="fas fa-qrcode"></i>
                      <h3>My QR Code</h3>
                    </div>
                    <div className="qr-code-container" ref={qrCodeRef}>
                      <QRCodeCanvas
                        value={`${window.location.origin}/add-friend/${playerData.playerId}`}
                        size={180}
                        level="H"
                        includeMargin={true}
                        imageSettings={{
                          src: "/mpa.png",
                          height: 35,
                          width: 35,
                          excavate: true,
                        }}
                      />
                    </div>
                    <p className="qr-code-description">
                      Share this QR code to connect with other players
                    </p>
                    <button className="btn-download-qr" onClick={handleDownloadQRCode}>
                      <i className="fas fa-download"></i>
                      Download QR Code
                    </button>
                  </div>
                </div>

                {/* Information Grid */}
                <div className="info-grid">
                  {/* Personal Information */}
                  <div className="info-card">
                    <div className="info-card-header">
                      <i className="fas fa-user-circle"></i>
                      <h3>Personal Information</h3>
                    </div>
                    <div className="info-card-body">
                      <div className="info-item">
                        <span className="info-label">Email</span>
                        <span className="info-value">{playerData.email}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Phone</span>
                        <span className="info-value">{playerData.phoneNumber}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Gender</span>
                        <span className="info-value">{playerData.gender}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Age</span>
                        <span className="info-value">{playerData.age} years old</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">I/C Number</span>
                        <span className="info-value">{playerData.icNumber}</span>
                      </div>
                      {playerData.duprId && (
                        <div className="info-item">
                          <span className="info-label">DUPR ID</span>
                          <span className="info-value">{playerData.duprId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="info-card">
                    <div className="info-card-header">
                      <i className="fas fa-map-marker-alt"></i>
                      <h3>Address</h3>
                    </div>
                    <div className="info-card-body">
                      <div className="info-item">
                        <span className="info-label">Street</span>
                        <span className="info-value">{playerData.addressLine1}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">City</span>
                        <span className="info-value">{playerData.city}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">State</span>
                        <span className="info-value">{playerData.state}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 'send-message':
        return (
          <div className="dashboard-content">
            <div className="content-header">
              <div>
                <h1>Send Message</h1>
                <p>Send a message to another player</p>
              </div>
            </div>

            <div className="send-message-container">
              {playersList.length === 0 ? (
                <div className="no-friends-message">
                  <i className="fas fa-user-friends"></i>
                  <h3>No Friends Yet</h3>
                  <p>You need to add friends before you can send messages.</p>
                  <p>Go to <strong>Friend List</strong> to add friends!</p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="send-message-form">
                  {sendMessageError && (
                    <div className="error-message">
                      {sendMessageError}
                    </div>
                  )}

                  {sendMessageSuccess && (
                    <div className="success-message">
                      {sendMessageSuccess}
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="recipient">
                      <i className="fas fa-user"></i>
                      To (Select Friend)
                    </label>
                    <select
                      id="recipient"
                      value={sendMessageData.recipientId}
                      onChange={(e) => setSendMessageData({...sendMessageData, recipientId: e.target.value})}
                      required
                    >
                      <option value="">-- Select a friend --</option>
                      {playersList.map(friend => (
                        <option key={friend.friendId} value={friend.friendId}>
                          {friend.friendName} (@{friend.friendUsername})
                        </option>
                      ))}
                    </select>
                  </div>

                <div className="form-group">
                  <label htmlFor="subject">
                    <i className="fas fa-tag"></i>
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={sendMessageData.subject}
                    onChange={(e) => setSendMessageData({...sendMessageData, subject: e.target.value})}
                    placeholder="Enter message subject"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">
                    <i className="fas fa-comment"></i>
                    Message
                  </label>
                  <textarea
                    id="message"
                    value={sendMessageData.message}
                    onChange={(e) => setSendMessageData({...sendMessageData, message: e.target.value})}
                    placeholder="Type your message here..."
                    rows="8"
                    required
                  ></textarea>
                </div>

                  <button type="submit" className="btn-send-message" disabled={sendMessageLoading}>
                    <i className="fas fa-paper-plane"></i>
                    {sendMessageLoading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        );

      case 'friends':
        return (
          <div className="dashboard-content">
            <div className="content-header">
              <div>
                <h1>Friend List</h1>
                <p>Manage your friends and requests</p>
              </div>
            </div>

            <div className="friends-container">
              {/* Tabs */}
              <div className="friends-tabs">
                <button
                  className={`friends-tab ${activeTab === 'friends' ? 'active' : ''}`}
                  onClick={() => setActiveTab('friends')}
                >
                  <i className="fas fa-user-friends"></i>
                  My Friends ({friends.length})
                </button>
                <button
                  className={`friends-tab ${activeTab === 'requests' ? 'active' : ''}`}
                  onClick={() => setActiveTab('requests')}
                >
                  <i className="fas fa-user-clock"></i>
                  Requests ({friendRequests.length})
                </button>
                <button
                  className={`friends-tab ${activeTab === 'add' ? 'active' : ''}`}
                  onClick={() => setActiveTab('add')}
                >
                  <i className="fas fa-user-plus"></i>
                  Add Friend
                </button>
              </div>

              {/* Friends Tab */}
              {activeTab === 'friends' && (
                <div className="friends-list">
                  {friends.length === 0 ? (
                    <div className="empty-state">
                      <i className="fas fa-user-friends"></i>
                      <h3>No Friends Yet</h3>
                      <p>Start adding friends to connect with other players!</p>
                    </div>
                  ) : (
                    friends.map(friend => (
                      <div key={friend._id} className="friend-card">
                        <div className="friend-avatar">
                          {friend.friendProfilePicture ? (
                            <img src={friend.friendProfilePicture} alt={friend.friendName} />
                          ) : (
                            <i className="fas fa-user-circle"></i>
                          )}
                        </div>
                        <div className="friend-info">
                          <h4>{friend.friendName}</h4>
                          <p>@{friend.friendUsername}</p>
                        </div>
                        <button
                          className="btn-remove-friend"
                          onClick={() => handleRemoveFriend(friend.friendId)}
                          title="Remove Friend"
                        >
                          <i className="fas fa-user-times"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Friend Requests Tab */}
              {activeTab === 'requests' && (
                <div className="friends-list">
                  {friendRequests.length === 0 ? (
                    <div className="empty-state">
                      <i className="fas fa-inbox"></i>
                      <h3>No Friend Requests</h3>
                      <p>You don't have any pending friend requests.</p>
                    </div>
                  ) : (
                    friendRequests.map(request => (
                      <div key={request._id} className="friend-request-card">
                        <div className="friend-avatar">
                          <i className="fas fa-user-circle"></i>
                        </div>
                        <div className="friend-info">
                          <h4>{request.requesterName}</h4>
                          <p>@{request.requesterUsername}</p>
                        </div>
                        <div className="friend-request-actions">
                          <button
                            className="btn-accept"
                            onClick={() => handleAcceptFriendRequest(request._id)}
                          >
                            <i className="fas fa-check"></i>
                            Accept
                          </button>
                          <button
                            className="btn-reject"
                            onClick={() => handleRejectFriendRequest(request._id)}
                          >
                            <i className="fas fa-times"></i>
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Add Friend Tab */}
              {activeTab === 'add' && (
                <div className="add-friend-container">
                  {/* Search by Name/Username */}
                  <div className="search-section">
                    <h3><i className="fas fa-search"></i> Search by Name or Username</h3>
                    <div className="search-bar">
                      <input
                        type="text"
                        placeholder="Enter name or username..."
                        value={searchQuery}
                        onChange={(e) => handleSearchPlayers(e.target.value)}
                      />
                      {searchLoading && <i className="fas fa-spinner fa-spin"></i>}
                    </div>
                    {searchResults.length > 0 && (
                      <div className="search-results">
                        {searchResults.map(player => (
                          <div key={player.playerId} className="search-result-card">
                            <div className="friend-avatar">
                              {player.profilePicture ? (
                                <img src={player.profilePicture} alt={player.fullName} />
                              ) : (
                                <i className="fas fa-user-circle"></i>
                              )}
                            </div>
                            <div className="friend-info">
                              <h4>{player.fullName}</h4>
                              <p>@{player.username}</p>
                            </div>
                            <button
                              className="btn-add-friend"
                              onClick={() => handleSendFriendRequest(player.playerId, player.fullName, player.username)}
                            >
                              <i className="fas fa-user-plus"></i>
                              Add Friend
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* QR Code Section */}
                  <div className="qr-section">
                    <h3><i className="fas fa-qrcode"></i> Add by QR Code</h3>

                    <div className="qr-options">
                      <button
                        className="btn-show-qr"
                        onClick={() => setShowQRCode(!showQRCode)}
                      >
                        <i className="fas fa-qrcode"></i>
                        {showQRCode ? 'Hide My QR Code' : 'Show My QR Code'}
                      </button>

                      {showQRCode && (
                        <div className="qr-code-display">
                          <div className="qr-code-box">
                            <div className="qr-placeholder">
                              <i className="fas fa-qrcode"></i>
                              <p>QR Code for: {localStorage.getItem('playerMpaId')}</p>
                              <small>Other players can scan this to add you</small>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="qr-scan-input">
                        <input
                          type="text"
                          placeholder="Or enter Player ID manually (e.g., MPA001)"
                          value={scannedQR}
                          onChange={(e) => setScannedQR(e.target.value)}
                        />
                        <button
                          className="btn-add-by-qr"
                          onClick={() => handleAddFriendByQR(scannedQR)}
                          disabled={!scannedQR}
                        >
                          <i className="fas fa-plus"></i>
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'inbox':
        // Combine admin messages and player messages
        const allMessages = [
          ...messages.map(msg => ({ ...msg, type: 'admin', senderName: 'Administrator' })),
          ...playerMessages.map(msg => ({ ...msg, type: 'player' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const totalUnread = unreadCount + playerUnreadCount;

        return (
          <div className="dashboard-content">
            <div className="content-header">
              <div>
                <h1>Inbox</h1>
                {totalUnread > 0 && (
                  <span className="inbox-unread-badge">{totalUnread} unread</span>
                )}
              </div>
            </div>

            <div className="inbox-split-container">
              {allMessages.length === 0 ? (
                <div className="empty-messages">
                  <i className="fas fa-inbox"></i>
                  <p>No messages yet</p>
                </div>
              ) : (
                <>
                  {/* Messages List - Left Side */}
                  <div className="inbox-messages-list">
                    {allMessages.map((message) => (
                      <div
                        key={message._id}
                        className={`inbox-message-item ${selectedMessage?._id === message._id ? 'selected' : ''} ${message.read ? 'read' : 'unread'}`}
                        onClick={() => handleMessageClick(message)}
                      >
                        <div className="inbox-message-item-header">
                          <div className="inbox-message-from">
                            {message.type === 'admin' ? (
                              <><i className="fas fa-user-shield"></i><span>Administrator</span></>
                            ) : (
                              <><i className="fas fa-user"></i><span>{message.senderName}</span></>
                            )}
                          </div>
                          {!message.read && <span className="inbox-unread-dot"></span>}
                        </div>
                        <div className="inbox-message-subject">
                          {message.subject}
                        </div>
                        <div className="inbox-message-preview">
                          {message.message.length > 60 ? message.message.substring(0, 60) + '...' : message.message}
                        </div>
                        <div className="inbox-message-date">
                          {new Date(message.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Content - Right Side */}
                  <div className="inbox-message-content">
                    {selectedMessage ? (
                      <>
                        <div className="inbox-content-header">
                          <h2>{selectedMessage.subject}</h2>
                          <div className="inbox-content-meta">
                            <div className="inbox-content-from">
                              {selectedMessage.type === 'admin' ? (
                                <><i className="fas fa-user-shield"></i><span>Administrator</span></>
                              ) : (
                                <><i className="fas fa-user"></i><span>{selectedMessage.senderName}</span></>
                              )}
                            </div>
                            <div className="inbox-content-date">
                              {new Date(selectedMessage.createdAt).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="inbox-content-body">
                          {selectedMessage.message}
                        </div>
                      </>
                    ) : (
                      <div className="inbox-no-selection">
                        <i className="fas fa-envelope-open"></i>
                        <p>Select a message to read</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'tournaments':
        return (
          <div className="dashboard-content">
            <div className="content-header">
              <h1>My Tournaments</h1>
            </div>
            <div className="content-body">
              <p className="placeholder-text">Your tournament registrations will appear here</p>
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="dashboard-content">
            <div className="content-header">
              <h1>Statistics</h1>
            </div>
            <div className="content-body">
              <p className="placeholder-text">Your performance statistics will appear here</p>
            </div>
          </div>
        );

      case 'training':
        return (
          <div className="dashboard-content">
            <div className="content-header">
              <h1>Training Programs</h1>
            </div>
            <div className="content-body">
              <p className="placeholder-text">Available training programs will appear here</p>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="dashboard-content">
            <div className="content-header">
              <h1>Settings</h1>
            </div>

            <div className="settings-section">
              <div className="info-card">
                <div className="info-card-header">
                  <i className="fas fa-lock"></i>
                  <h3>Change Password</h3>
                </div>
                <div className="info-card-body">
                  <form onSubmit={handlePasswordChange} className="password-form">
                    {passwordError && (
                      <div className="error-message">
                        <i className="fas fa-exclamation-circle"></i>
                        {passwordError}
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="success-message">
                        <i className="fas fa-check-circle"></i>
                        {passwordSuccess}
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="currentPassword">Current Password</label>
                      <input
                        type="password"
                        id="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Enter your current password"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <input
                        type="password"
                        id="newPassword"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Enter your new password"
                        required
                        minLength="6"
                      />
                      <small>Password must be at least 6 characters long</small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirm your new password"
                        required
                        minLength="6"
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save"></i>
                          Change Password
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="dashboard-content">
            <p className="placeholder-text">Select a menu item</p>
          </div>
        );
    }
  };

  return (
    <div className="player-dashboard">
      {/* Top Header */}
      <header className="dashboard-header">
        <button
          className="toggle-sidebar"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <i className="fas fa-bars"></i>
        </button>
        <div className="header-info">
          <h2>Welcome, {playerData?.fullName || 'Player'}</h2>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <img src="/mpa.png" alt="MPA Logo" className="sidebar-logo" />
            {sidebarOpen && <span className="sidebar-title">Player Portal</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => {
                if (item.id === 'picklezone') {
                  navigate('/picklezone');
                } else {
                  setActiveMenu(item.id);
                }
              }}
            >
              {item.icon && <i className={`fas ${item.icon}`}></i>}
              {sidebarOpen && <span>{item.label}</span>}
              {item.badge && (
                <span className={`nav-badge ${item.badgeType ? `badge-${item.badgeType}` : ''}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className={`nav-item ${activeMenu === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveMenu('settings')}
          >
            <i className="fas fa-cog"></i>
            {sidebarOpen && <span>Settings</span>}
          </button>
          <button className="nav-item" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="dashboard-body">
          {renderContent()}
        </div>
      </main>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="edit-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h2>Edit Profile</h2>
              <button className="edit-modal-close" onClick={() => setShowEditModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="edit-modal-form">
              {updateError && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {updateError}
                </div>
              )}

              {updateSuccess && (
                <div className="success-message">
                  <i className="fas fa-check-circle"></i>
                  {updateSuccess}
                </div>
              )}

              {/* Profile Picture Upload */}
              <div className="profile-picture-section">
                <label>Profile Picture</label>
                <div className="profile-picture-container">
                  <div className="profile-picture-display">
                    {profilePicturePreview ? (
                      <img src={profilePicturePreview} alt="Profile preview" />
                    ) : (
                      <i className="fas fa-user"></i>
                    )}
                  </div>
                  <div className="profile-picture-upload-btn">
                    <input
                      type="file"
                      id="profile-picture-upload"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="profile-picture-upload" className="upload-label">
                      <i className="fas fa-camera"></i>
                      {profilePicturePreview ? 'Change Photo' : 'Upload Photo'}
                    </label>
                    <small>Max 5MB. JPG, PNG, GIF</small>
                  </div>
                </div>
              </div>

              <div className="edit-form-group">
                <label htmlFor="edit-fullName">Full Name</label>
                <input
                  type="text"
                  id="edit-fullName"
                  value={editFormData.fullName || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="edit-email">Email</label>
                <input
                  type="email"
                  id="edit-email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  required
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="edit-phone">Phone Number</label>
                <input
                  type="tel"
                  id="edit-phone"
                  value={editFormData.phoneNumber || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                  required
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="edit-addressLine1">Address Line 1</label>
                <input
                  type="text"
                  id="edit-addressLine1"
                  value={editFormData.addressLine1 || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, addressLine1: e.target.value })}
                  required
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="edit-addressLine2">Address Line 2</label>
                <input
                  type="text"
                  id="edit-addressLine2"
                  placeholder="Optional"
                  value={editFormData.addressLine2 || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, addressLine2: e.target.value })}
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="edit-city">City</label>
                <input
                  type="text"
                  id="edit-city"
                  value={editFormData.city || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  required
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="edit-state">State</label>
                <input
                  type="text"
                  id="edit-state"
                  value={editFormData.state || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                  required
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="edit-duprId">DUPR ID</label>
                <input
                  type="text"
                  id="edit-duprId"
                  placeholder="Enter your DUPR ID"
                  value={editFormData.duprId || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, duprId: e.target.value })}
                />
              </div>

              <div className="edit-form-group">
                <label htmlFor="edit-duprRating">DUPR Rating</label>
                <input
                  type="number"
                  id="edit-duprRating"
                  step="0.001"
                  min="0"
                  max="8"
                  placeholder="Enter your DUPR rating"
                  value={editFormData.duprRating || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, duprRating: e.target.value })}
                />
                {editFormData.duprRating && editFormData.duprRating > 0 && (
                  <small className="rating-info">
                    Skill Level: {calculateSkillLevel(parseFloat(editFormData.duprRating))}
                  </small>
                )}
              </div>

              <div className="edit-modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowEditModal(false)}
                  disabled={updateLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={updateLoading}
                >
                  {updateLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default PlayerDashboard;
