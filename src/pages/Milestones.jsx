import { useState, useEffect } from 'react';
import journeyService from '../services/journeyService';
import './Milestones.css';

function Milestones() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        setLoading(true);
        const data = await journeyService.getAllMilestones();
        setMilestones(data);
      } catch (error) {
        console.error('Error fetching milestones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
  }, []);

  if (loading) {
    return (
      <div className="milestones-page">
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
    <div className="milestones-page">
      <div className="milestones-hero">
        <div className="container">
          <h1>Our Journey</h1>
          <p>Explore the milestones that shaped Malaysia Pickleball Association</p>
        </div>
      </div>

      <div className="container">
        <div className="milestones-timeline">
          {milestones.length > 0 ? (
            milestones.map((milestone, index) => (
              <div key={milestone._id} className={`milestone-card ${index % 2 === 0 ? 'left' : 'right'}`}>
                <div className="milestone-content-wrapper">
                  <div className="milestone-image-section">
                    {milestone.image ? (
                      <div className="milestone-image-container">
                        <img src={milestone.image} alt={milestone.title} />
                      </div>
                    ) : (
                      <div className="milestone-image-placeholder">
                        <i className="fas fa-image"></i>
                      </div>
                    )}
                  </div>

                  <div className="milestone-text-section">
                    <div className="milestone-date-badge">
                      {new Date(milestone.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <h2>{milestone.title}</h2>
                    <p>{milestone.description}</p>
                  </div>
                </div>

                <div className="milestone-connector">
                  <div className="milestone-dot"></div>
                  {index < milestones.length - 1 && <div className="milestone-line"></div>}
                </div>

                <div className="milestone-number">{index + 1}</div>
              </div>
            ))
          ) : (
            <div className="no-milestones">
              <i className="fas fa-calendar-times"></i>
              <h3>No milestones yet</h3>
              <p>Check back soon for updates on our journey!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Milestones;
