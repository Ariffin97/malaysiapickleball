import { useState, useEffect } from 'react';
import './ManageClinics.css';

function ManageClinics() {
  const [clinics, setClinics] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClinic, setEditingClinic] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    coach: '',
    maxParticipants: '',
    price: '',
    status: 'active'
  });

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      console.log('Fetching clinics from:', `${apiUrl}/api/clinics`);
      const response = await fetch(`${apiUrl}/api/clinics`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setClinics(data);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      console.error('Error details:', error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingClinic
        ? `${import.meta.env.VITE_API_BASE_URL}/api/clinics/${editingClinic._id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/clinics`;

      const method = editingClinic ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(editingClinic ? 'Clinic updated successfully!' : 'Clinic created successfully!');
        setShowForm(false);
        setEditingClinic(null);
        resetForm();
        fetchClinics();
      } else {
        const error = await response.json();
        alert(`Failed to ${editingClinic ? 'update' : 'create'} clinic: ${error.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while saving the clinic');
    }
  };

  const handleEdit = (clinic) => {
    setEditingClinic(clinic);
    setFormData({
      title: clinic.title,
      description: clinic.description,
      date: clinic.date,
      time: clinic.time,
      location: clinic.location,
      coach: clinic.coach,
      maxParticipants: clinic.maxParticipants,
      price: clinic.price,
      status: clinic.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this clinic?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/clinics/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Clinic deleted successfully!');
        fetchClinics();
      } else {
        const error = await response.json();
        alert(`Failed to delete clinic: ${error.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while deleting the clinic');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      coach: '',
      maxParticipants: '',
      price: '',
      status: 'active'
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingClinic(null);
    resetForm();
  };

  return (
    <div className="manage-clinics">
      <div className="content-header">
        <h1>Manage Clinics</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <i className="fas fa-plus"></i>
          Add New Clinic
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h2>{editingClinic ? 'Edit Clinic' : 'Create New Clinic'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Coach *</label>
                <input
                  type="text"
                  name="coach"
                  value={formData.coach}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Time *</label>
                <input
                  type="text"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  placeholder="e.g., 2:00 PM - 4:00 PM"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Max Participants *</label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price (RM) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingClinic ? 'Update Clinic' : 'Create Clinic'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="clinics-list">
        {clinics.length === 0 ? (
          <div className="no-data">No clinics available</div>
        ) : (
          <div className="clinics-grid">
            {clinics.map(clinic => (
              <div key={clinic._id} className="clinic-card">
                <div className="clinic-header">
                  <h3>{clinic.title}</h3>
                  <span className={`status-badge ${clinic.status}`}>
                    {clinic.status}
                  </span>
                </div>
                <p className="clinic-description">{clinic.description}</p>
                <div className="clinic-details">
                  <div className="detail-item">
                    <i className="fas fa-calendar"></i>
                    <span>{new Date(clinic.date).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-clock"></i>
                    <span>{clinic.time}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{clinic.location}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-user"></i>
                    <span>{clinic.coach}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-users"></i>
                    <span>{clinic.enrolled || 0}/{clinic.maxParticipants}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-tag"></i>
                    <span>RM {clinic.price}</span>
                  </div>
                </div>
                <div className="clinic-actions">
                  <button className="btn-edit" onClick={() => handleEdit(clinic)}>
                    <i className="fas fa-edit"></i>
                    Edit
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(clinic._id)}>
                    <i className="fas fa-trash"></i>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageClinics;
