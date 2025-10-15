import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PickleZone.css';

function PickleZone() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [playerData, setPlayerData] = useState(null);
  const [showComments, setShowComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [viewingImage, setViewingImage] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [reportingPost, setReportingPost] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [linkPreview, setLinkPreview] = useState(null);
  const [fetchingPreview, setFetchingPreview] = useState(false);
  const [lastCheckedUrl, setLastCheckedUrl] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('playerLoggedIn');
    const playerId = localStorage.getItem('playerId');
    const playerUsername = localStorage.getItem('playerUsername');
    const playerName = localStorage.getItem('playerName');

    if (!isLoggedIn) {
      // Redirect to login if not authenticated
      navigate('/picklezone/login');
      return;
    }

    // Set player data from localStorage
    setPlayerData({
      playerId: playerId,
      fullName: playerName,
      username: playerUsername
    });

    // Fetch posts
    fetchPosts();
  }, [navigate]);

  const fetchPosts = async () => {
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';
      const response = await fetch(`${PORTAL_API_URL}/posts?limit=20`);

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (selectedImages.length + files.length > 5) {
      alert('You can only upload a maximum of 5 images per post');
      return;
    }

    // Validate each file
    const validFiles = [];
    const newPreviews = [];

    for (let file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select valid image files only');
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is larger than 5MB`);
        continue;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === validFiles.length) {
          setImagePreviews([...imagePreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }

    if (validFiles.length > 0) {
      setSelectedImages([...selectedImages, ...validFiles]);
    }

    // Clear the input
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const getVideoEmbedUrl = (url) => {
    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
        videoId: youtubeMatch[1]
      };
    }

    // Vimeo
    const vimeoRegex = /vimeo\.com\/(?:.*\/)?(\d+)/i;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        videoId: vimeoMatch[1]
      };
    }

    // Dailymotion
    const dailymotionRegex = /dailymotion\.com\/video\/([a-zA-Z0-9]+)/i;
    const dailymotionMatch = url.match(dailymotionRegex);
    if (dailymotionMatch) {
      return {
        type: 'dailymotion',
        embedUrl: `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}`,
        videoId: dailymotionMatch[1]
      };
    }

    return null;
  };

  const detectAndFetchLinkPreview = async (text) => {
    // URL regex pattern
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const urls = text.match(urlRegex);

    if (urls && urls.length > 0) {
      const url = urls[0]; // Get first URL

      // Don't fetch if it's the same URL we just checked
      if (url === lastCheckedUrl) return;

      setLastCheckedUrl(url);
      setFetchingPreview(true);

      // Check if it's a video URL
      const videoEmbed = getVideoEmbedUrl(url);
      if (videoEmbed) {
        setLinkPreview({
          url: url,
          title: `${videoEmbed.type.charAt(0).toUpperCase() + videoEmbed.type.slice(1)} Video`,
          description: '',
          image: '',
          domain: videoEmbed.type,
          isVideo: true,
          embedUrl: videoEmbed.embedUrl,
          videoType: videoEmbed.type
        });
        setFetchingPreview(false);
        return;
      }

      try {
        const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';
        const response = await fetch(`${PORTAL_API_URL}/link-preview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url })
        });

        if (response.ok) {
          const preview = await response.json();
          setLinkPreview(preview);
        } else {
          setLinkPreview(null);
        }
      } catch (error) {
        console.error('Error fetching link preview:', error);
        setLinkPreview(null);
      } finally {
        setFetchingPreview(false);
      }
    } else {
      // No URL found, clear preview
      setLinkPreview(null);
      setLastCheckedUrl('');
    }
  };

  const handleRemoveLinkPreview = () => {
    setLinkPreview(null);
    setLastCheckedUrl('');
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!newPostContent.trim() && selectedImages.length === 0 && !linkPreview) {
      alert('Please write something, select an image, or add a link before posting!');
      return;
    }

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';

      const formData = new FormData();
      formData.append('playerId', playerData.playerId);
      formData.append('fullName', playerData.fullName);
      formData.append('username', playerData.username);
      formData.append('content', newPostContent || '');

      // Determine post type
      if (selectedImages.length > 0) {
        formData.append('postType', 'image');
        // Append all images
        selectedImages.forEach((image) => {
          formData.append('image', image);
        });
      } else if (linkPreview) {
        formData.append('postType', 'link');
        formData.append('linkUrl', linkPreview.url);
        formData.append('linkTitle', linkPreview.title);
        formData.append('linkDescription', linkPreview.description);
        formData.append('linkImage', linkPreview.image || '');

        // Add video-specific data if it's a video
        if (linkPreview.isVideo) {
          formData.append('isVideo', 'true');
          formData.append('embedUrl', linkPreview.embedUrl);
          formData.append('videoType', linkPreview.videoType);
        }
      } else {
        formData.append('postType', 'text');
      }

      const response = await fetch(`${PORTAL_API_URL}/posts`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const newPost = await response.json();
        setPosts([newPost, ...posts]);
        setNewPostContent('');
        setSelectedImages([]);
        setImagePreviews([]);
        setLinkPreview(null);
        setLastCheckedUrl('');
      } else {
        alert('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post');
    }
  };

  const handleLike = async (postId) => {
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';

      const response = await fetch(`${PORTAL_API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: playerData.playerId
        })
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(posts.map(post =>
          post._id === postId ? updatedPost : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const toggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleAddComment = async (postId) => {
    const commentText = commentInputs[postId];

    if (!commentText || !commentText.trim()) {
      alert('Please write a comment!');
      return;
    }

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';

      const response = await fetch(`${PORTAL_API_URL}/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: playerData.playerId,
          fullName: playerData.fullName,
          username: playerData.username,
          comment: commentText
        })
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(posts.map(post =>
          post._id === postId ? updatedPost : post
        ));
        setCommentInputs(prev => ({
          ...prev,
          [postId]: ''
        }));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment');
    }
  };

  const handleImageClick = (imageUrl) => {
    setViewingImage(imageUrl);
    document.body.style.overflow = 'hidden';
  };

  const closeImageModal = () => {
    setViewingImage(null);
    document.body.style.overflow = '';
  };

  const handleReportPost = (postId) => {
    setReportingPost(postId);
    setReportReason('');
    setReportDetails('');
    document.body.style.overflow = 'hidden';
  };

  const handleCancelReport = () => {
    setReportingPost(null);
    setReportReason('');
    setReportDetails('');
    document.body.style.overflow = '';
  };

  const handleSubmitReport = async () => {
    if (!reportReason) {
      alert('Please select a reason for reporting this post');
      return;
    }

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';

      const response = await fetch(`${PORTAL_API_URL}/posts/${reportingPost}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportedBy: playerData.playerId,
          reporterName: playerData.fullName,
          reason: reportReason,
          details: reportDetails
        })
      });

      if (response.ok) {
        alert('Post has been reported. Our team will review it shortly.');
        handleCancelReport();
      } else {
        alert('Failed to report post');
      }
    } catch (error) {
      console.error('Error reporting post:', error);
      alert('Error reporting post');
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post._id);
    setEditContent(post.content || '');
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditContent('');
  };

  const handleSaveEdit = async (postId) => {
    if (!editContent.trim()) {
      alert('Post content cannot be empty!');
      return;
    }

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';

      const response = await fetch(`${PORTAL_API_URL}/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent,
          playerId: playerData.playerId
        })
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(posts.map(post =>
          post._id === postId ? updatedPost : post
        ));
        setEditingPost(null);
        setEditContent('');
      } else {
        alert('Failed to edit post');
      }
    } catch (error) {
      console.error('Error editing post:', error);
      alert('Error editing post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';

      const response = await fetch(`${PORTAL_API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: playerData.playerId
        })
      });

      if (response.ok) {
        setPosts(posts.filter(post => post._id !== postId));
        alert('Post deleted successfully');
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="picklezone">
        <div className="picklezone-container">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading PickleZone...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('playerToken');
    localStorage.removeItem('playerLoggedIn');
    localStorage.removeItem('playerId');
    localStorage.removeItem('playerName');
    localStorage.removeItem('playerUsername');
    navigate('/picklezone/login');
  };

  const handleBackToDashboard = () => {
    navigate('/player/dashboard');
  };

  const handleProfileClick = () => {
    setShowProfile(!showProfile);
  };

  const filteredPosts = showProfile
    ? posts.filter(post => post.author.playerId === playerData?.playerId)
    : posts;

  return (
    <div className="picklezone">
      {/* Navbar */}
      <nav className="picklezone-navbar">
        <div className="navbar-buttons">
          <button className="navbar-btn" onClick={handleProfileClick} title={showProfile ? "Back to Feed" : "My Profile"}>
            <i className={showProfile ? "fas fa-arrow-left" : "fas fa-user"}></i>
            <span>{showProfile ? "Back" : "Profile"}</span>
          </button>
          <button className="navbar-btn" onClick={handleLogout} title="Logout">
            <span>Logout</span>
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </nav>

      <div className="picklezone-container">
        {/* Header */}
        <div className="picklezone-header">
          <img src="/picklezonelogo.png" alt="PickleZone" className="picklezone-logo" />
          <p className="powered-by">Powered by Fenix Digital.</p>
          <p className="tagline">Smash, Snap, and Socialize!</p>
        </div>

        {/* Create Post Form */}
        {!showProfile && (
          <div className="create-post-card">
          <h3 className="create-post-title">What's on your mind, {playerData?.username}?</h3>
          <form onSubmit={handleCreatePost}>
            <textarea
              className="post-input"
              placeholder="Share something with the community..."
              value={newPostContent}
              onChange={(e) => {
                setNewPostContent(e.target.value);
                // Detect and fetch link preview after a short delay
                setTimeout(() => detectAndFetchLinkPreview(e.target.value), 500);
              }}
              rows="3"
            />

            {/* Link Preview */}
            {linkPreview && (
              <div className="link-preview-container">
                {linkPreview.isVideo ? (
                  <div className="video-preview-card">
                    <button
                      type="button"
                      className="btn-remove-link-preview"
                      onClick={handleRemoveLinkPreview}
                      title="Remove video preview"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                    <div className="video-embed-preview">
                      <iframe
                        src={linkPreview.embedUrl}
                        title={linkPreview.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <div className="video-preview-info">
                      <i className="fas fa-play-circle"></i>
                      <span>{linkPreview.title}</span>
                    </div>
                  </div>
                ) : (
                  <div className="link-preview-card">
                    <button
                      type="button"
                      className="btn-remove-link-preview"
                      onClick={handleRemoveLinkPreview}
                      title="Remove link preview"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                    {linkPreview.image && (
                      <div className="link-preview-image">
                        <img src={linkPreview.image} alt={linkPreview.title} />
                      </div>
                    )}
                    <div className="link-preview-content">
                      <div className="link-preview-domain">
                        <i className="fas fa-link"></i>
                        <span>{linkPreview.domain}</span>
                      </div>
                      <h4 className="link-preview-title">{linkPreview.title}</h4>
                      {linkPreview.description && (
                        <p className="link-preview-description">{linkPreview.description}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {fetchingPreview && (
              <div className="fetching-preview">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Fetching link preview...</span>
              </div>
            )}

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className={`image-previews-container
                ${imagePreviews.length === 1 ? 'single' : ''}
                ${imagePreviews.length === 2 ? 'two' : ''}
                ${imagePreviews.length === 3 ? 'three' : ''}
                ${imagePreviews.length === 4 ? 'four' : ''}
                ${imagePreviews.length === 5 ? 'five' : ''}`}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={preview} alt={`Preview ${index + 1}`} className="image-preview" />
                    <button
                      type="button"
                      className="btn-remove-image"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {selectedImages.length > 0 && selectedImages.length < 5 && (
              <p className="image-count-text">{selectedImages.length}/5 images selected</p>
            )}

            <div className="create-post-actions">
              <div className="post-options">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                  disabled={selectedImages.length >= 5}
                />
                <label
                  htmlFor="image-upload"
                  className={`btn-add-image ${selectedImages.length >= 5 ? 'disabled' : ''}`}
                  style={selectedImages.length >= 5 ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
                >
                  <i className="fas fa-image"></i>
                  <span>Photo {selectedImages.length > 0 && `(${selectedImages.length}/5)`}</span>
                </label>
              </div>
              <button type="submit" className="btn-post">
                Post
              </button>
            </div>
          </form>
        </div>
        )}

        {/* Posts Feed */}
        <div className="posts-feed">
          {showProfile && (
            <div className="profile-header">
              <h2>{playerData?.username || playerData?.fullName}'s Posts</h2>
              <p>{filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}</p>
            </div>
          )}
          {filteredPosts.length === 0 ? (
            <div className="empty-feed">
              <i className="fas fa-comments"></i>
              <p>{showProfile ? "You haven't posted anything yet." : "No posts yet. Be the first to share something!"}</p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const isLiked = post.likes?.includes(playerData?.playerId);
              const isOwner = post.author.playerId === playerData?.playerId;
              return (
                <div key={post._id} className="post-card">
                  <div className="post-header">
                    <div className="post-author">
                      <div className="post-avatar">
                        {post.author.profilePicture ? (
                          <img src={post.author.profilePicture} alt={post.author.fullName} />
                        ) : (
                          <i className="fas fa-user"></i>
                        )}
                      </div>
                      <div className="post-author-info">
                        <h4>{post.author.username || post.author.fullName}</h4>
                        <span className="post-time">{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                    <div className="post-actions-menu">
                      {isOwner ? (
                        <>
                          <button
                            className="post-menu-btn"
                            onClick={() => handleEditPost(post)}
                            title="Edit post"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="post-menu-btn delete"
                            onClick={() => handleDeletePost(post._id)}
                            title="Delete post"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </>
                      ) : (
                        <button
                          className="post-menu-btn report"
                          onClick={() => handleReportPost(post._id)}
                          title="Report post"
                        >
                          <i className="fas fa-flag"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="post-content">
                    {editingPost === post._id ? (
                      <div className="edit-post-form">
                        <textarea
                          className="edit-post-input"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows="3"
                        />
                        <div className="edit-post-actions">
                          <button
                            className="btn-cancel-edit"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn-save-edit"
                            onClick={() => handleSaveEdit(post._id)}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {post.content && <p>{post.content}</p>}
                      </>
                    )}
                    {/* Link Preview in Feed */}
                    {post.linkData && (
                      <>
                        {post.linkData.isVideo ? (
                          <div className="post-video-embed">
                            <div className="video-embed-container">
                              <iframe
                                src={post.linkData.embedUrl}
                                title={post.linkData.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                            </div>
                          </div>
                        ) : (
                          <div className="post-link-preview" onClick={() => window.open(post.linkData.url, '_blank')}>
                            <div className="link-preview-card">
                              {post.linkData.image && (
                                <div className="link-preview-image">
                                  <img src={post.linkData.image} alt={post.linkData.title} />
                                </div>
                              )}
                              <div className="link-preview-content">
                                <div className="link-preview-domain">
                                  <i className="fas fa-link"></i>
                                  <span>{new URL(post.linkData.url).hostname}</span>
                                </div>
                                <h4 className="link-preview-title">{post.linkData.title}</h4>
                                {post.linkData.description && (
                                  <p className="link-preview-description">{post.linkData.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {/* Multiple images */}
                    {post.imageUrls && post.imageUrls.length > 0 && (
                      <div className={`post-images-grid
                        ${post.imageUrls.length === 1 ? 'single' : ''}
                        ${post.imageUrls.length === 2 ? 'two' : ''}
                        ${post.imageUrls.length === 3 ? 'three' : ''}
                        ${post.imageUrls.length === 4 ? 'four' : ''}
                        ${post.imageUrls.length === 5 ? 'five' : ''}`}>
                        {post.imageUrls.map((imageUrl, imgIndex) => (
                          <div key={imgIndex} className="post-image-item">
                            <img
                              src={imageUrl}
                              alt={`Post image ${imgIndex + 1}`}
                              onClick={() => handleImageClick(imageUrl)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Legacy single image support */}
                    {!post.imageUrls && post.imageUrl && (
                      <div className="post-image">
                        <img
                          src={post.imageUrl}
                          alt="Post"
                          onClick={() => handleImageClick(post.imageUrl)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="post-actions">
                    <button
                      className={`post-action-btn ${isLiked ? 'liked' : ''}`}
                      onClick={() => handleLike(post._id)}
                    >
                      <i className={isLiked ? "fas fa-heart" : "far fa-heart"}></i>
                      <span>{post.likes?.length || 0}</span>
                    </button>
                    <button
                      className="post-action-btn"
                      onClick={() => toggleComments(post._id)}
                    >
                      <i className="far fa-comment"></i>
                      <span>{post.comments?.length || 0}</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {showComments[post._id] && (
                    <div className="comments-section">
                      {/* Existing Comments */}
                      {post.comments && post.comments.length > 0 && (
                        <div className="comments-list">
                          {post.comments.map((comment, index) => (
                            <div key={index} className="comment-item">
                              <div className="comment-avatar">
                                {comment.profilePicture ? (
                                  <img src={comment.profilePicture} alt={comment.fullName} />
                                ) : (
                                  <i className="fas fa-user"></i>
                                )}
                              </div>
                              <div className="comment-content">
                                <div className="comment-header">
                                  <span className="comment-author">{comment.username || comment.fullName}</span>
                                  <span className="comment-time">{formatDate(comment.createdAt)}</span>
                                </div>
                                <p className="comment-text">{comment.comment}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment Form */}
                      <div className="add-comment-form">
                        <div className="comment-avatar">
                          <i className="fas fa-user"></i>
                        </div>
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInputs[post._id] || ''}
                          onChange={(e) => setCommentInputs({
                            ...commentInputs,
                            [post._id]: e.target.value
                          })}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddComment(post._id);
                            }
                          }}
                        />
                        <button
                          className="btn-send-comment"
                          onClick={() => handleAddComment(post._id)}
                        >
                          <i className="fas fa-paper-plane"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <footer className="picklezone-footer">
          <p>&copy; 2025 PickleZone. All rights reserved.</p>
        </footer>
      </div>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={closeImageModal}>
              <i className="fas fa-times"></i>
            </button>
            <img src={viewingImage} alt="Full size view" />
          </div>
        </div>
      )}

      {/* Report Post Modal */}
      {reportingPost && (
        <div className="report-modal-overlay" onClick={handleCancelReport}>
          <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header">
              <h3>Report Post</h3>
              <button className="report-modal-close" onClick={handleCancelReport}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="report-modal-body">
              <p className="report-modal-description">
                Please select a reason for reporting this post:
              </p>

              <div className="report-reasons">
                <label className="report-reason-option">
                  <input
                    type="radio"
                    name="reportReason"
                    value="spam"
                    checked={reportReason === 'spam'}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                  <span>Spam or misleading</span>
                </label>

                <label className="report-reason-option">
                  <input
                    type="radio"
                    name="reportReason"
                    value="harassment"
                    checked={reportReason === 'harassment'}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                  <span>Harassment or hate speech</span>
                </label>

                <label className="report-reason-option">
                  <input
                    type="radio"
                    name="reportReason"
                    value="inappropriate"
                    checked={reportReason === 'inappropriate'}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                  <span>Inappropriate content</span>
                </label>

                <label className="report-reason-option">
                  <input
                    type="radio"
                    name="reportReason"
                    value="violence"
                    checked={reportReason === 'violence'}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                  <span>Violence or dangerous behavior</span>
                </label>

                <label className="report-reason-option">
                  <input
                    type="radio"
                    name="reportReason"
                    value="other"
                    checked={reportReason === 'other'}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                  <span>Other</span>
                </label>
              </div>

              <div className="report-details-section">
                <label htmlFor="reportDetails">Additional details (optional):</label>
                <textarea
                  id="reportDetails"
                  className="report-details-input"
                  placeholder="Please provide more information about why you're reporting this post..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows="4"
                />
              </div>

              <div className="report-modal-actions">
                <button className="btn-cancel-report" onClick={handleCancelReport}>
                  Cancel
                </button>
                <button className="btn-submit-report" onClick={handleSubmitReport}>
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PickleZone;
