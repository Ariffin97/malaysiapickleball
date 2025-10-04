import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './News.css';

function News() {
  const { newsId } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [loading, setLoading] = useState(true);

  const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    if (newsId && news.length > 0) {
      const found = news.find(item => item.newsId === newsId);
      setSelectedNews(found);
    } else if (news.length > 0) {
      setSelectedNews(news[0]);
    }
  }, [newsId, news]);

  const fetchNews = async () => {
    try {
      const response = await fetch(`${PORTAL_API_URL}/news?status=Published&limit=50`);
      const data = await response.json();
      setNews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleNewsClick = (item) => {
    setSelectedNews(item);
    navigate(`/news/${item.newsId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="news-page">
        <div className="container">
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading news...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="news-page">
      <div className="container">
        <div className="news-layout">
          {/* Main News Content */}
          <div className="news-main">
            {selectedNews ? (
              <article className="news-article">
                <div className="news-article-date">{formatDate(selectedNews.publishDate)}</div>
                <h1 className="news-article-title">{selectedNews.title}</h1>

                {selectedNews.media && selectedNews.media.length > 0 && selectedNews.media[0].url && (
                  <div className="news-article-image">
                    <img
                      src={`http://localhost:5001${selectedNews.media[0].url}`}
                      alt={selectedNews.title}
                    />
                  </div>
                )}

                <div className="news-article-content">
                  {selectedNews.content}
                </div>
              </article>
            ) : (
              <div className="empty-state">
                <i className="fas fa-newspaper"></i>
                <p>No news selected</p>
              </div>
            )}
          </div>

          {/* News Sidebar */}
          <aside className="news-sidebar">
            <h3>All News</h3>
            <div className="news-list">
              {news.map((item) => (
                <div
                  key={item._id}
                  className={`news-list-item ${selectedNews?._id === item._id ? 'active' : ''}`}
                  onClick={() => handleNewsClick(item)}
                >
                  {item.media && item.media.length > 0 && item.media[0].url && (
                    <div className="news-list-image">
                      <img
                        src={`http://localhost:5001${item.media[0].url}`}
                        alt={item.title}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div className="news-list-content">
                    <div className="news-list-date">{formatDate(item.publishDate)}</div>
                    <h4>{item.title}</h4>
                    <p>{item.summary || item.content.substring(0, 80)}...</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default News;
