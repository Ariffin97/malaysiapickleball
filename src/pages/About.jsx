import './About.css';

function About() {
  return (
    <div className="about-page">
      <section className="page-header">
        <h1>About Us</h1>
        <p>Learn more about Malaysia Pickleball Association</p>
      </section>

      <section className="content-section">
        <div className="container">
          <h2>Our Mission</h2>
          <p>
            Malaysia Pickleball Association is dedicated to promoting and developing the sport of pickleball
            throughout Malaysia. We aim to create a vibrant community of players, provide quality training,
            and organize competitive events for all skill levels.
          </p>

          <h2>Our Vision</h2>
          <p>
            To establish pickleball as one of Malaysia's premier recreational and competitive sports,
            fostering a healthy, active lifestyle and building strong communities through the love of the game.
          </p>

          <h2>What We Do</h2>
          <ul className="services-list">
            <li>Organize regular tournaments and competitions</li>
            <li>Provide coaching and training programs</li>
            <li>Facilitate court bookings and club memberships</li>
            <li>Build a strong pickleball community across Malaysia</li>
            <li>Promote the sport to schools and communities</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default About;
