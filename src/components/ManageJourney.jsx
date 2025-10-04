import { useState, useEffect } from 'react';
import journeyService from '../services/journeyService';
import './ManageJourney.css';

function ManageJourney() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    description: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const data = await journeyService.getAllMilestones();
      setMilestones(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingMilestone(null);
    setFormData({
      date: '',
      title: '',
      description: '',
      image: null
    });
    setImagePreview(null);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const openEditModal = (milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      date: milestone.date,
      title: milestone.title,
      description: milestone.description,
      image: milestone.image
    });
    setImagePreview(milestone.image);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMilestone(null);
    setFormData({
      date: '',
      title: '',
      description: '',
      image: null
    });
    setImagePreview(null);
    document.body.style.overflow = '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      try {
        const base64 = await journeyService.imageToBase64(file);
        setFormData(prev => ({
          ...prev,
          image: base64
        }));
        setImagePreview(base64);
        setError(null);
      } catch (err) {
        setError('Failed to process image');
      }
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null
    }));
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingMilestone) {
        await journeyService.updateMilestone(editingMilestone.id, formData);
      } else {
        await journeyService.createMilestone(formData);
      }

      await fetchMilestones();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setError(null);

    try {
      await journeyService.deleteMilestone(id);
      await fetchMilestones();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && milestones.length === 0) {
    return (
      <div className="manage-journey">
        <div className="loading-state">
          <div className="spinner">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <p>Loading milestones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-journey">
      <div className="manage-header">
        <div className="header-content">
          <h2>
            <i className="fas fa-map-marked-alt"></i>
            Manage Our Journey
          </h2>
        </div>
        <button className="btn-create" onClick={openCreateModal}>
          <i className="fas fa-plus"></i>
          Add Milestone
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className="milestones-list">
        {milestones.length === 0 ? (
          <div className="no-milestones">
            <i className="fas fa-calendar-times"></i>
            <h3>No milestones yet</h3>
            <p>Click "Add Milestone" to create your first timeline entry</p>
          </div>
        ) : (
          milestones.map((milestone) => (
            <div key={milestone.id} className="milestone-item">
              <div className="milestone-year-badge">{milestone.date}</div>

              <div className="milestone-details">
                {milestone.image && (
                  <div className="milestone-image">
                    <img src={milestone.image} alt={milestone.title} />
                  </div>
                )}

                <div className="milestone-info">
                  <h3>{milestone.title}</h3>
                  <p>{milestone.description}</p>
                </div>
              </div>

              <div className="milestone-actions">
                <button
                  className="btn-edit"
                  onClick={() => openEditModal(milestone)}
                >
                  <i className="fas fa-edit"></i>
                  Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => setDeleteConfirm(milestone)}
                >
                  <i className="fas fa-trash"></i>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className={`fas fa-${editingMilestone ? 'edit' : 'plus'}`}></i>
                {editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label htmlFor="date">
                  <i className="fas fa-calendar"></i>
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="title">
                  <i className="fas fa-heading"></i>
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Foundation"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  <i className="fas fa-align-left"></i>
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of this milestone..."
                  required
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>
                  <i className="fas fa-image"></i>
                  Image (Optional)
                </label>

                {!imagePreview ? (
                  <div className="image-upload-area">
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="image" className="upload-label">
                      <i className="fas fa-cloud-upload-alt"></i>
                      <span>Click to upload image</span>
                      <small>PNG, JPG up to 5MB</small>
                    </label>
                  </div>
                ) : (
                  <div className="image-preview-container">
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={handleRemoveImage}
                    >
                      <i className="fas fa-times"></i>
                      Remove Image
                    </button>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      {editingMilestone ? 'Update Milestone' : 'Create Milestone'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3>Are you sure you want to delete this milestone?</h3>
              <div className="delete-info">
                <div className="delete-item">
                  <strong>{deleteConfirm.date}</strong> - {deleteConfirm.title}
                </div>
                <p className="warning-text">This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={loading}
              >
                <i className="fas fa-trash"></i>
                {loading ? 'Deleting...' : 'Delete Milestone'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageJourney;
