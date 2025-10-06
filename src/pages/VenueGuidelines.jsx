import './VenueGuidelines.css';

function VenueGuidelines() {
  return (
    <div className="venue-guidelines-page">
      <div className="guidelines-header">
        <div className="container">
          <h1>Venue Guidelines</h1>
          <p>The Malaysia Pickleball Association (MPA) emphasizes the importance of standardizing all pickleball courts in Malaysia in accordance with internationally recognized specifications.</p>
        </div>
      </div>

      <div className="guidelines-body">
        <div className="container">

          <h2>Requirements for Court Owners</h2>

          <h3>Follow Standardized Dimensions</h3>
          <p>Court measurements, markings, and net heights must strictly comply with MPA-approved dimensions to ensure fair play and consistent game quality across all venues.</p>

          <h3>Ensure Clear Line Markings</h3>
          <p>Proper line width, color contrast, and surface finish must be implemented to prevent disputes, including "ball in or out" decisions. A well-marked court eliminates unnecessary arguments and upholds the integrity of the game.</p>

          <h3>Maintain Safety & Playability</h3>
          <p>Surfaces must be non-slip and well-maintained, with sufficient spacing between courts, adequate lighting, and no obstructions within the playing area.</p>

          <h3>Provide Fair Competition Conditions</h3>
          <p>All facilities must ensure that playing conditions are equal for all players, avoiding any modifications or unofficial adjustments that could give unfair advantages.</p>

          <h3>Support the Growth of Pickleball</h3>
          <p>Owners are encouraged to work with MPA to promote community participation, organize events, and contribute to the development of the sport nationwide.</p>

          <p className="highlight-text">The MPA's objective is to ensure that every player in Malaysia enjoys the game under the same professional standards, whether for recreation or competition. We seek full cooperation from all court owners to uphold these principles.</p>

          <h2>Court Specifications</h2>

          <div className="diagrams-grid">
            <div className="diagram-section">
              <h3>Court Dimensions</h3>
              <div className="diagram-placeholder">
                <img src="/court.png" alt="Pickleball Court Dimensions" />
              </div>
            </div>

            <div className="diagram-section">
              <h3>Net Specifications</h3>
              <div className="diagram-placeholder">
                <img src="/Net.png" alt="Pickleball Net Diagram" />
              </div>
            </div>
          </div>

          <div className="specs-grid">
            <div>
              <h4>Key Measurements</h4>
              <ul>
                <li>Net height at center: <strong>34 inches</strong></li>
                <li>Net height at sidelines: <strong>36 inches</strong></li>
                <li>Net width (bottom to top): <strong>30 inches minimum</strong></li>
                <li>Net length: <strong>21 feet 9 inches minimum</strong></li>
              </ul>
            </div>
            <div>
              <h4>Construction Details</h4>
              <ul>
                <li>Posts: <strong>22 feet apart</strong></li>
                <li>Post diameter: <strong>3 inches maximum</strong></li>
                <li>Top edge: Cord/cable with 2-inch tape</li>
                <li>Mesh prevents ball passage</li>
              </ul>
            </div>
          </div>

          <h3>Official Line Tolerances</h3>
          <div className="tolerance-list">
            <div className="tolerance-item">
              <span>Net line to outside of NVZ line:</span>
              <span className="measurement">7' ± ⅛"</span>
            </div>
            <div className="tolerance-item">
              <span>Net line to outside of baseline:</span>
              <span className="measurement">22' ± ¼"</span>
            </div>
            <div className="tolerance-item">
              <span>Outside sideline to outside sideline:</span>
              <span className="measurement">20' ± ¼"</span>
            </div>
            <div className="tolerance-item">
              <span>Outside sideline to centerline:</span>
              <span className="measurement">10' ± ⅛"</span>
            </div>
            <div className="tolerance-item">
              <span>Diagonal dimension to out of lines:</span>
              <span className="measurement">48' 4" ± ¾"</span>
            </div>
          </div>

          <h2>Detailed Construction Guidelines</h2>

          <h3>Court Layout</h3>
          <div className="layout-grid">
            <div>
              <h4>Baselines</h4>
              <p>Sit parallel to the net at the end of the court.</p>

              <h4>Sidelines</h4>
              <p>Running the length of the court.</p>
            </div>
            <div>
              <h4>Non-Volley Zone (NVZ)</h4>
              <p>The area on either side of the net bound in by a line parallel to and 7 feet from the net and two sidelines.</p>

              <h4>Centerline & Service Area</h4>
              <p>Centerline extends from the baselines to the NVZ, dividing the court. Service area is beyond the NVZ on either side of the centerline.</p>
            </div>
          </div>

          <h3>Surface Requirements</h3>
          <p>Any hard surface (concrete or asphalt) will suffice for outdoor gameplay, provided it's free of debris. The ideal surface area should be approximately 30 feet by 60 feet to allow adequate playing space.</p>
          <p className="highlight-text"><strong>Professional Installation:</strong> For permanent outdoor courts, specialized sport surfacing systems and professional installation services are recommended to ensure optimal playing conditions and longevity.</p>

          <h3>Netting Specifications</h3>
          <div className="layout-grid">
            <div>
              <h4>Net Material & Size</h4>
              <ul>
                <li>Mesh material that prevents ball passage</li>
                <li>Minimum 21 feet 9 inches long</li>
                <li>Minimum 30 inches wide (bottom to top)</li>
              </ul>
            </div>
            <div>
              <h4>Posts & Height</h4>
              <ul>
                <li>Posts 22 feet apart, max 3 inches diameter</li>
                <li>Net height: 36 inches at sidelines</li>
                <li>Net height: 34 inches at center</li>
                <li>Top edge with cord/cable, 2-inch tape cover</li>
              </ul>
            </div>
          </div>

          <div className="two-column-grid">
            <div>
              <h3>Line Markings</h3>
              <p>Court lines can be created using various materials including chalk, tape, or paint. For DIY installations, tape is generally the most practical and effective option for achieving clean, consistent markings.</p>
            </div>

            <div>
              <h3>Indoor Considerations</h3>
              <p>Indoor courts maintain the same line, netting, and space requirements as outdoor courts, but offer additional options for lighting (fluorescent, HID, LED), flooring (hardwood, rubberized surfaces), and simplified fencing requirements due to controlled environment conditions.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default VenueGuidelines;
