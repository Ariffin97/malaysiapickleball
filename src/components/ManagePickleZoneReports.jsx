import { useState, useEffect } from 'react';
import './ManagePickleZoneReports.css';

function ManagePickleZoneReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';
      const response = await fetch(`${PORTAL_API_URL}/reports`);

      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId) => {
    if (!window.confirm('Mark this report as resolved?')) {
      return;
    }

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';
      const response = await fetch(`${PORTAL_API_URL}/reports/${reportId}/resolve`, {
        method: 'PUT',
      });

      if (response.ok) {
        setReports(reports.map(report =>
          report._id === reportId ? { ...report, status: 'resolved' } : report
        ));
        alert('Report marked as resolved');
      }
    } catch (error) {
      console.error('Error resolving report:', error);
      alert('Failed to resolve report');
    }
  };

  const handleDeletePost = async (postId, reportId) => {
    if (!window.confirm('Are you sure you want to delete this reported post?')) {
      return;
    }

    try {
      const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';
      const response = await fetch(`${PORTAL_API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAdmin: true })
      });

      if (response.ok) {
        // Also mark the report as resolved
        await handleResolveReport(reportId);
        alert('Post deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getReasonBadgeClass = (reason) => {
    switch (reason) {
      case 'spam':
        return 'badge-warning';
      case 'harassment':
        return 'badge-danger';
      case 'inappropriate':
        return 'badge-error';
      case 'violence':
        return 'badge-critical';
      default:
        return 'badge-info';
    }
  };

  const filteredReports = reports.filter(report => {
    if (filterStatus === 'all') return true;
    return report.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="reports-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="manage-reports">
      <div className="content-header">
        <h1>PickleZone Reports</h1>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({reports.length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            Pending ({reports.filter(r => r.status === 'pending').length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilterStatus('resolved')}
          >
            Resolved ({reports.filter(r => r.status === 'resolved').length})
          </button>
        </div>
      </div>

      <div className="content-body">
        {filteredReports.length === 0 ? (
          <div className="no-reports">
            <i className="fas fa-inbox"></i>
            <p>No reports found</p>
          </div>
        ) : (
          <div className="reports-list">
            {filteredReports.map((report) => (
              <div key={report._id} className={`report-card ${report.status}`}>
                <div className="report-header">
                  <div className="report-info">
                    <span className={`report-reason-badge ${getReasonBadgeClass(report.reason)}`}>
                      {report.reason}
                    </span>
                    <span className={`report-status-badge ${report.status}`}>
                      {report.status}
                    </span>
                  </div>
                  <span className="report-date">{formatDate(report.createdAt)}</span>
                </div>

                <div className="report-details">
                  <div className="report-field">
                    <strong>Reported by:</strong>
                    <span>{report.reporterName}</span>
                  </div>
                  {report.details && (
                    <div className="report-field">
                      <strong>Details:</strong>
                      <p className="report-details-text">{report.details}</p>
                    </div>
                  )}
                </div>

                {report.post && (
                  <div className="reported-post">
                    <h4>Reported Post:</h4>
                    <div className="post-preview">
                      <div className="post-author-info">
                        <strong>By:</strong> {report.post.author?.username || report.post.author?.fullName}
                      </div>
                      {report.post.content && (
                        <p className="post-content">{report.post.content}</p>
                      )}
                      {report.post.imageUrl && (
                        <img src={report.post.imageUrl} alt="Post" className="post-thumbnail" />
                      )}
                      {report.post.imageUrls && report.post.imageUrls.length > 0 && (
                        <div className="post-thumbnails">
                          {report.post.imageUrls.slice(0, 3).map((url, index) => (
                            <img key={index} src={url} alt={`Post ${index + 1}`} className="post-thumbnail" />
                          ))}
                          {report.post.imageUrls.length > 3 && (
                            <span className="more-images">+{report.post.imageUrls.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {report.status === 'pending' && (
                  <div className="report-actions">
                    <button
                      className="btn-resolve"
                      onClick={() => handleResolveReport(report._id)}
                    >
                      <i className="fas fa-check"></i>
                      Mark as Resolved
                    </button>
                    <button
                      className="btn-delete-post"
                      onClick={() => handleDeletePost(report.post._id, report._id)}
                    >
                      <i className="fas fa-trash"></i>
                      Delete Post
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagePickleZoneReports;
