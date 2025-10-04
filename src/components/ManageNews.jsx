import { useState, useEffect } from 'react';
import './ManageNews.css';

function ManageNews() {
  const [news, setNews] = useState([]);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('news'); // 'news' or 'video'
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);

  const [newsFormData, setNewsFormData] = useState({
    title: '',
    summary: '',
    content: '',
    publishDate: new Date().toISOString().split('T')[0],
    imageFile: null,
    imagePreview: null
  });

  const [videoFormData, setVideoFormData] = useState({
    title: '',
    description: '',
    videoUrl: ''
  });

  const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchNews();
    fetchFeaturedVideo();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch(`${PORTAL_API_URL}/news?limit=50`);
      const data = await response.json();
      setNews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedVideo = async () => {
    try {
      const response = await fetch(`${PORTAL_API_URL}/featured-video`);
      const data = await response.json();
      setFeaturedVideo(data);
    } catch (error) {
      console.error('Error fetching featured video:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewsFormData({
          ...newsFormData,
          imageFile: file,
          imagePreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('newsId', editingNews ? editingNews.newsId : `NEWS${Date.now()}`);
      formData.append('title', newsFormData.title);
      formData.append('summary', newsFormData.summary);
      formData.append('content', newsFormData.content);
      formData.append('publishDate', newsFormData.publishDate);
      formData.append('status', 'Published');

      if (newsFormData.imageFile) {
        formData.append('newsImage', newsFormData.imageFile);
      }

      const url = editingNews
        ? `${PORTAL_API_URL}/news/${editingNews.newsId}`
        : `${PORTAL_API_URL}/news`;

      const method = editingNews ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData
      });

      if (response.ok) {
        alert(editingNews ? 'News updated successfully!' : 'News added successfully! It will now appear on the homepage.');
        fetchNews();
        setShowNewsModal(false);
        resetNewsForm();
      } else {
        const error = await response.json();
        alert('Error saving news: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving news:', error);
      alert('Error saving news: ' + error.message);
    }
  };

  const extractVideoUrl = (input) => {
    if (!input) return '';

    // Trim whitespace
    input = input.trim();

    // If it's already a URL, return it
    if (input.startsWith('http')) {
      return input;
    }

    // Extract URL from embed code - try both double and single quotes
    const srcMatch = input.match(/src=["']([^"']+)["']/);
    if (srcMatch) {
      return srcMatch[1];
    }

    return input;
  };

  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    try {
      const extractedUrl = extractVideoUrl(videoFormData.videoUrl);

      if (!extractedUrl) {
        alert('Please enter a valid YouTube embed code or URL');
        return;
      }

      const response = await fetch(`${PORTAL_API_URL}/featured-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: videoFormData.title,
          description: videoFormData.description,
          videoUrl: extractedUrl
        })
      });

      if (response.ok) {
        alert('Featured video updated successfully!');
        fetchFeaturedVideo();
        setShowVideoModal(false);
        resetVideoForm();
      } else {
        const error = await response.json();
        alert('Error saving video: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving video:', error);
      alert('Error saving video: ' + error.message);
    }
  };

  const handleDeleteNews = async (newsId) => {
    if (!confirm('Are you sure you want to delete this news?')) return;

    try {
      const response = await fetch(`${PORTAL_API_URL}/news/${newsId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchNews();
      }
    } catch (error) {
      console.error('Error deleting news:', error);
    }
  };

  const handleEditNews = (newsItem) => {
    setEditingNews(newsItem);
    setNewsFormData({
      title: newsItem.title,
      summary: newsItem.summary || '',
      content: newsItem.content,
      publishDate: newsItem.publishDate ? new Date(newsItem.publishDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      imageFile: null,
      imagePreview: newsItem.media && newsItem.media[0] ? newsItem.media[0].url : null
    });
    setShowNewsModal(true);
  };

  const resetNewsForm = () => {
    setEditingNews(null);
    setNewsFormData({
      title: '',
      summary: '',
      content: '',
      publishDate: new Date().toISOString().split('T')[0],
      imageFile: null,
      imagePreview: null
    });
  };

  const resetVideoForm = () => {
    setVideoFormData({
      title: '',
      description: '',
      videoUrl: ''
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="manage-news">
      <div className="content-header">
        <div>
          <h1>Manage News & Featured Video</h1>
          <p className="subtitle">Update homepage content</p>
        </div>
      </div>

      <div className="tabs-section">
        <button
          className={`tab-btn ${activeTab === 'news' ? 'active' : ''}`}
          onClick={() => setActiveTab('news')}
        >
          <i className="fas fa-newspaper"></i>
          Latest News
        </button>
        <button
          className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          <i className="fas fa-video"></i>
          Featured Video
        </button>
      </div>

      {activeTab === 'news' && (
        <div className="news-section">
          <div className="section-header">
            <h2>Latest News</h2>
            <button className="btn-add" onClick={() => { resetNewsForm(); setShowNewsModal(true); }}>
              <i className="fas fa-plus"></i>
              Add News
            </button>
          </div>

          <div className="content-body">
            {loading ? (
              <div className="loading-state">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading news...</p>
              </div>
            ) : news.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-newspaper"></i>
                <p>No news articles yet</p>
              </div>
            ) : (
              <div className="news-list">
                {news.map((item) => (
                  <div key={item._id} className="news-card">
                    <div className="news-card-header">
                      <h3>{item.title}</h3>
                      <div className="news-card-actions">
                        <button className="btn-edit" onClick={() => handleEditNews(item)}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn-delete-icon" onClick={() => handleDeleteNews(item.newsId)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <p className="news-date">{formatDate(item.publishDate)}</p>
                    <p className="news-summary">{item.summary || item.content.substring(0, 150)}...</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'video' && (
        <div className="video-section">
          <div className="section-header">
            <h2>Featured Video</h2>
            <button className="btn-add" onClick={() => setShowVideoModal(true)}>
              <i className="fas fa-plus"></i>
              Update Video
            </button>
          </div>

          <div className="content-body">
            {featuredVideo ? (
              <div className="video-preview">
                <div className="video-container">
                  <iframe
                    width="100%"
                    height="400"
                    src={featuredVideo.videoUrl}
                    title={featuredVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <h3>{featuredVideo.title}</h3>
                <p>{featuredVideo.description}</p>
              </div>
            ) : (
              <div className="empty-state">
                <i className="fas fa-video"></i>
                <p>No featured video set</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit News Modal */}
      {showNewsModal && (
        <div className="modal-overlay" onClick={() => { setShowNewsModal(false); resetNewsForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingNews ? 'Edit News' : 'Add News'}</h2>
              <button className="modal-close" onClick={() => { setShowNewsModal(false); resetNewsForm(); }}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleNewsSubmit}>
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={newsFormData.title}
                    onChange={(e) => setNewsFormData({ ...newsFormData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Publish Date *</label>
                  <input
                    type="date"
                    value={newsFormData.publishDate}
                    onChange={(e) => setNewsFormData({ ...newsFormData, publishDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>News Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {newsFormData.imagePreview && (
                    <div className="image-preview">
                      <img src={newsFormData.imagePreview} alt="Preview" />
                    </div>
                  )}
                  <small>Upload an image for the news article (max 5MB)</small>
                </div>
                <div className="form-group">
                  <label>Summary</label>
                  <textarea
                    value={newsFormData.summary}
                    onChange={(e) => setNewsFormData({ ...newsFormData, summary: e.target.value })}
                    rows="2"
                    placeholder="Brief summary (optional)"
                  />
                </div>
                <div className="form-group">
                  <label>Content *</label>
                  <textarea
                    value={newsFormData.content}
                    onChange={(e) => setNewsFormData({ ...newsFormData, content: e.target.value })}
                    rows="6"
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => { setShowNewsModal(false); resetNewsForm(); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingNews ? 'Update News' : 'Add News'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Featured Video Modal */}
      {showVideoModal && (
        <div className="modal-overlay" onClick={() => { setShowVideoModal(false); resetVideoForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Featured Video</h2>
              <button className="modal-close" onClick={() => { setShowVideoModal(false); resetVideoForm(); }}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleVideoSubmit}>
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={videoFormData.title}
                    onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>YouTube Embed Code or URL *</label>
                  <textarea
                    value={videoFormData.videoUrl}
                    onChange={(e) => setVideoFormData({ ...videoFormData, videoUrl: e.target.value })}
                    placeholder='Paste the full embed code from YouTube (e.g., <iframe src="https://www.youtube.com/embed/VIDEO_ID"...></iframe>) or just the URL'
                    required
                    rows="4"
                  />
                  <small>Paste the complete embed code from YouTube's Share → Embed option, or just the embed URL</small>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={videoFormData.description}
                    onChange={(e) => setVideoFormData({ ...videoFormData, description: e.target.value })}
                    rows="4"
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => { setShowVideoModal(false); resetVideoForm(); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Update Video
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageNews;
