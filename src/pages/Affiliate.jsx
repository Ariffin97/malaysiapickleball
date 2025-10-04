import './Affiliate.css';

function Affiliate() {
  return (
    <div className="affiliate-page">
      <div className="umbrella-section">
        {/* Umbrella SVG */}
        <div className="umbrella-container">
          <svg className="umbrella-svg" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
            {/* Umbrella canopy */}
            <path
              d="M 200 80 Q 100 80 50 140 Q 50 160 70 160 Q 90 140 120 140 Q 140 160 160 160 Q 180 140 200 140 Q 220 160 240 160 Q 260 140 280 140 Q 310 160 330 160 Q 350 160 350 140 Q 300 80 200 80 Z"
              fill="white"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            {/* Umbrella handle */}
            <line x1="200" y1="140" x2="200" y2="220" stroke="#9ca3af" strokeWidth="4" strokeLinecap="round" />
            {/* Umbrella hook */}
            <path
              d="M 200 220 Q 210 230 210 240"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>

          {/* MPA Logo inside umbrella */}
          <div className="mpa-main-logo">
            <img src="/mpa.png" alt="Malaysia Pickleball Association" />
            <p>Malaysia Pickleball Association</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Affiliate;
