import { useState, useEffect } from 'react';
import './TrainingProgram.css';

function TrainingProgram() {
  const [courses, setCourses] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);

  useEffect(() => {
    fetchCourses();
    fetchClinics();
  }, []);

  useEffect(() => {
    updateSelectedDateEvents();
  }, [selectedDate, courses, clinics]);

  const fetchCourses = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/courses`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/clinics`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setClinics(data);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const coursesOnDate = courses.filter(course => course.date === dateStr).map(c => ({ ...c, type: 'course' }));
    const clinicsOnDate = clinics.filter(clinic => clinic.date === dateStr).map(c => ({ ...c, type: 'clinic' }));
    return [...coursesOnDate, ...clinicsOnDate];
  };

  const updateSelectedDateEvents = () => {
    const events = getEventsForDate(selectedDate);
    setSelectedDateEvents(events);
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(clickedDate);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="training-program-page">
      <div className="training-header">
        <h1>Training Programs</h1>
        <p>Professional courses and clinics for all skill levels</p>
      </div>

      <div className="training-body">
        {/* Calendar Section */}
        <section className="calendar-section">
          <h2>Schedule</h2>
          <div className="calendar-container">
            {/* Calendar Grid */}
            <div className="calendar-grid-area">
              <div className="calendar-header">
                <button onClick={handlePrevMonth} className="calendar-nav">
                  ←
                </button>
                <h3>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={handleNextMonth} className="calendar-nav">
                  →
                </button>
              </div>

              <div className="calendar-month">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="calendar-day-header">{day}</div>
                ))}

                {/* Empty cells for days before month starts */}
                {Array.from({ length: getFirstDayOfMonth(currentMonth) }, (_, i) => (
                  <div key={`empty-${i}`} className="calendar-day empty" />
                ))}

                {/* Calendar days */}
                {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => {
                  const day = i + 1;
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const events = getEventsForDate(date);
                  const isToday = new Date().toDateString() === date.toDateString();
                  const isSelected = selectedDate.toDateString() === date.toDateString();

                  return (
                    <div
                      key={day}
                      onClick={() => handleDateClick(day)}
                      className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    >
                      <div className="day-number">{day}</div>
                      {events.length > 0 && (
                        <div className="event-dots">
                          {events.slice(0, 3).map((event, idx) => (
                            <div
                              key={idx}
                              className={`event-dot ${event.type}`}
                            />
                          ))}
                          {events.length > 3 && (
                            <div className="event-more">+{events.length - 3}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="calendar-legend">
                <div className="legend-item">
                  <span className="legend-dot course"></span>
                  <small>Course</small>
                </div>
                <div className="legend-item">
                  <span className="legend-dot clinic"></span>
                  <small>Clinic</small>
                </div>
              </div>
            </div>

            {/* Selected Date Details */}
            <div className="selected-date-details">
              <h4>
                {selectedDate.toLocaleDateString('default', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h4>

              {selectedDateEvents.length === 0 ? (
                <div className="no-events">
                  <p>No training programs on this date</p>
                </div>
              ) : (
                <div className="events-list">
                  {selectedDateEvents.map(event => (
                    <div key={event._id} className={`event-card ${event.type}`}>
                      <div className="event-card-header">
                        <h5>{event.title}</h5>
                        <span className={`badge ${event.type}`}>
                          {event.type === 'course' ? 'Course' : 'Clinic'}
                        </span>
                      </div>
                      <p className="event-description">{event.description}</p>
                      <div className="event-info">
                        <div className="info-row">
                          <i className="fas fa-clock"></i>
                          <span>{event.time}</span>
                        </div>
                        <div className="info-row">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{event.location}</span>
                        </div>
                        <div className="info-row">
                          <i className="fas fa-user"></i>
                          <span>{event.coach}</span>
                        </div>
                        <div className="info-row">
                          <i className="fas fa-users"></i>
                          <span>{event.enrolled || 0}/{event.maxParticipants}</span>
                        </div>
                        <div className="info-row">
                          <i className="fas fa-tag"></i>
                          <span>RM {event.price}</span>
                        </div>
                      </div>
                      <button className="enroll-btn">
                        {event.type === 'course' ? 'Enroll Now' : 'Book Now'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* All Courses & Clinics List */}
        <section className="all-programs-section">
          <h2>All Programs</h2>
          <div className="programs-tabs">
            <button className="tab-btn active">All</button>
            <button className="tab-btn">Courses ({courses.length})</button>
            <button className="tab-btn">Clinics ({clinics.length})</button>
          </div>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="training-list">
              {[...courses.map(c => ({ ...c, type: 'course' })), ...clinics.map(c => ({ ...c, type: 'clinic' }))]
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(item => (
                  <div key={item._id} className="training-card">
                    <div className="card-header">
                      <h3>{item.title}</h3>
                      <span className={`badge ${item.type}`}>
                        {item.type === 'course' ? 'Course' : 'Clinic'}
                      </span>
                    </div>
                    <p className="description">{item.description}</p>
                    <div className="info-grid">
                      <div className="info-item">
                        <i className="fas fa-calendar"></i>
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                      <div className="info-item">
                        <i className="fas fa-clock"></i>
                        <span>{item.time}</span>
                      </div>
                      <div className="info-item">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>{item.location}</span>
                      </div>
                      <div className="info-item">
                        <i className="fas fa-user"></i>
                        <span>{item.coach}</span>
                      </div>
                      <div className="info-item">
                        <i className="fas fa-users"></i>
                        <span>{item.enrolled || 0}/{item.maxParticipants}</span>
                      </div>
                      <div className="info-item">
                        <i className="fas fa-tag"></i>
                        <span>RM {item.price}</span>
                      </div>
                    </div>
                    <button className="enroll-btn">
                      {item.type === 'course' ? 'Enroll Now' : 'Book Now'}
                    </button>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default TrainingProgram;
