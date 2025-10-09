import { useState, useEffect } from 'react';
import './ManageCourses.css';

function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
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
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      console.log('Fetching courses from:', `${apiUrl}/api/courses`);
      const response = await fetch(`${apiUrl}/api/courses`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
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
      const url = editingCourse
        ? `${import.meta.env.VITE_API_BASE_URL}/api/courses/${editingCourse._id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/courses`;

      const method = editingCourse ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(editingCourse ? 'Course updated successfully!' : 'Course created successfully!');
        setShowForm(false);
        setEditingCourse(null);
        resetForm();
        fetchCourses();
      } else {
        const error = await response.json();
        alert(`Failed to ${editingCourse ? 'update' : 'create'} course: ${error.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while saving the course');
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      date: course.date,
      time: course.time,
      location: course.location,
      coach: course.coach,
      maxParticipants: course.maxParticipants,
      price: course.price,
      status: course.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/courses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Course deleted successfully!');
        fetchCourses();
      } else {
        const error = await response.json();
        alert(`Failed to delete course: ${error.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while deleting the course');
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
    setEditingCourse(null);
    resetForm();
  };

  return (
    <div className="manage-courses">
      <div className="content-header">
        <h1>Manage Courses</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          <i className="fas fa-plus"></i>
          Add New Course
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h2>{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
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
                  placeholder="e.g., 9:00 AM - 12:00 PM"
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
                {editingCourse ? 'Update Course' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="courses-list">
        {courses.length === 0 ? (
          <div className="no-data">No courses available</div>
        ) : (
          <div className="courses-grid">
            {courses.map(course => (
              <div key={course._id} className="course-card">
                <div className="course-header">
                  <h3>{course.title}</h3>
                  <span className={`status-badge ${course.status}`}>
                    {course.status}
                  </span>
                </div>
                <p className="course-description">{course.description}</p>
                <div className="course-details">
                  <div className="detail-item">
                    <i className="fas fa-calendar"></i>
                    <span>{new Date(course.date).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-clock"></i>
                    <span>{course.time}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{course.location}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-user"></i>
                    <span>{course.coach}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-users"></i>
                    <span>{course.enrolled || 0}/{course.maxParticipants}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-tag"></i>
                    <span>RM {course.price}</span>
                  </div>
                </div>
                <div className="course-actions">
                  <button className="btn-edit" onClick={() => handleEdit(course)}>
                    <i className="fas fa-edit"></i>
                    Edit
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(course._id)}>
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

export default ManageCourses;
