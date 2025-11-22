import { Link } from 'react-router-dom';
import './RankingSystem.css';

function RankingSystem() {
  return (
    <div className="ranking-system-page">
      <section className="page-header">
        <h1>Malaysia Pickleball Ranking System</h1>
        <p>MPRS - Understanding How Points are Calculated</p>
      </section>

      <section className="content-section">
        <div className="container">
          {/* Introduction */}
          <div className="intro-box">
            <h2>About MPRS</h2>
            <p>
              The Malaysia Pickleball Ranking System (MPRS) is a transparent, merit-based system that ranks players
              based on their tournament performance, skill level, and tournament tier. Rankings are
              calculated from the <strong>best 8 tournament results</strong> within the <strong>past 52 weeks</strong>.
            </p>

            <div className="current-features">
              <h3>How MPRS Works</h3>
              <ul>
                <li>Rankings based on actual competitive tournament performance</li>
                <li>Points calculated from verified tournament results</li>
                <li>Tournament history is transparent and publicly available</li>
                <li>Rolling 52-week window ensures rankings reflect recent performance</li>
              </ul>
            </div>

            <div className="future-vision">
              <h4><i className="fas fa-rocket"></i> Future Development: Malaysian Rating</h4>
              <p>
                <strong>The Challenge:</strong> Current rating and ranking systems are suffering from <strong>sandbagging</strong> -
                a practice where better players intentionally manipulate their ratings to compete in lower divisions for easier wins,
                allowing them to take unfair advantage of less experienced players.
              </p>
              <p>
                <strong>The Solution:</strong> Once MPRS rankings are well-established, MPA plans to introduce a
                <strong> Malaysian Rating</strong> - a domestic rating system based purely on tournament results within Malaysia.
                This rating system will be specifically designed to:
              </p>
              <ul>
                <li>Tie ratings directly to verified competitive performance</li>
                <li>Prevent manipulation through selective or casual play</li>
                <li>Provide fair tournament seeding and division placement</li>
                <li>Create objective skill divisions that cannot be gamed</li>
              </ul>
              <p>
                This future rating system will work alongside MPRS rankings to create a more honest and competitive environment
                for Malaysian pickleball.
              </p>
            </div>
          </div>

          {/* Formula */}
          <div className="formula-section">
            <h2>The MPRS Formula</h2>
            <div className="formula-box">
              <div className="formula">
                <span className="formula-text">Points = Tier Base × Placement % × Skill % × Age %</span>
              </div>
              <p className="formula-description">
                Every tournament result is calculated using this formula, which considers four key factors:
                tournament importance (tier), finishing position, player skill level, and age category.
              </p>
            </div>
          </div>

          {/* Tier System */}
          <div className="points-section">
            <h2>1. Tournament Tier (Base Points)</h2>
            <p className="section-description">
              Tournaments are assigned tiers based on their significance. Higher-tier tournaments award more base points.
            </p>
            <div className="points-grid">
              <div className="points-card tier-1">
                <div className="tier-badge">Tier 1</div>
                <div className="points-value">1000 Points</div>
                <div className="tier-description">National Championships, Major Events</div>
              </div>
              <div className="points-card tier-2">
                <div className="tier-badge">Tier 2</div>
                <div className="points-value">500 Points</div>
                <div className="tier-description">Regional Championships</div>
              </div>
              <div className="points-card tier-3">
                <div className="tier-badge">Tier 3</div>
                <div className="points-value">250 Points</div>
                <div className="tier-description">State Championships</div>
              </div>
              <div className="points-card tier-4">
                <div className="tier-badge">Tier 4</div>
                <div className="points-value">100 Points</div>
                <div className="tier-description">Local Tournaments</div>
              </div>
            </div>
          </div>

          {/* Placement Multipliers */}
          <div className="points-section">
            <h2>2. Placement Multipliers</h2>
            <p className="section-description">
              Your finishing position in the tournament determines what percentage of the base points you earn.
            </p>
            <div className="multiplier-table">
              <table>
                <thead>
                  <tr>
                    <th>Placement</th>
                    <th>Multiplier</th>
                    <th>Example (Tier 2)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="highlight-row">
                    <td><i className="fas fa-trophy"></i> Winner</td>
                    <td>100%</td>
                    <td>500 points</td>
                  </tr>
                  <tr>
                    <td><i className="fas fa-medal"></i> Finalist</td>
                    <td>85%</td>
                    <td>425 points</td>
                  </tr>
                  <tr>
                    <td>Semifinalist</td>
                    <td>70%</td>
                    <td>350 points</td>
                  </tr>
                  <tr>
                    <td>Quarterfinalist</td>
                    <td>55%</td>
                    <td>275 points</td>
                  </tr>
                  <tr>
                    <td>Top 16</td>
                    <td>40%</td>
                    <td>200 points</td>
                  </tr>
                  <tr>
                    <td>Top 32</td>
                    <td>25%</td>
                    <td>125 points</td>
                  </tr>
                  <tr>
                    <td>Top 64</td>
                    <td>5%</td>
                    <td>25 points</td>
                  </tr>
                  <tr>
                    <td>Participation</td>
                    <td>2%</td>
                    <td>10 points</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Skill Divisions */}
          <div className="points-section">
            <h2>3. Skill Division Multipliers (Rating-Based)</h2>
            <p className="section-description">
              Players are grouped by their skill rating level. Higher skill divisions earn more points to reflect the
              competition level. The Open Skill division has no rating limits and awards full points (100%).
              Players may provide their rating as a reference for skill level classification.
              The system uses linear interpolation for ratings between thresholds.
            </p>
            <div className="multiplier-table">
              <table>
                <thead>
                  <tr>
                    <th>Division</th>
                    <th>Rating Range</th>
                    <th>Multiplier</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="highlight-row">
                    <td>Open Skill</td>
                    <td>No limits</td>
                    <td>100%</td>
                  </tr>
                  <tr>
                    <td>Advanced+</td>
                    <td>&lt; 4.5</td>
                    <td>60%</td>
                  </tr>
                  <tr>
                    <td>Advanced</td>
                    <td>&lt; 4.0</td>
                    <td>36%</td>
                  </tr>
                  <tr>
                    <td>Intermediate+</td>
                    <td>&lt; 3.5</td>
                    <td>22%</td>
                  </tr>
                  <tr>
                    <td>Intermediate</td>
                    <td>&lt; 3.0</td>
                    <td>13%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="disclaimer-note">
              <i className="fas fa-info-circle"></i> <strong>Note:</strong> Players may self-report their skill rating
              for classification purposes. Common rating systems include DUPR, which is an independent rating system not
              affiliated with MPA or MPRS.
            </p>
          </div>

          {/* Age Groups */}
          <div className="points-section">
            <h2>4. Age Group Multipliers</h2>
            <p className="section-description">
              Age-restricted categories use multipliers to balance the competition level.
            </p>
            <div className="multiplier-table">
              <table>
                <thead>
                  <tr>
                    <th>Age Group</th>
                    <th>Multiplier</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Under 12 (U12)</td>
                    <td>22%</td>
                  </tr>
                  <tr>
                    <td>Under 15 (U15)</td>
                    <td>36%</td>
                  </tr>
                  <tr>
                    <td>Under 18 (U18)</td>
                    <td>60%</td>
                  </tr>
                  <tr className="highlight-row">
                    <td>All-Ages (Open)</td>
                    <td>100%</td>
                  </tr>
                  <tr>
                    <td>35+ (Seniors)</td>
                    <td>60%</td>
                  </tr>
                  <tr>
                    <td>50+ (Masters)</td>
                    <td>36%</td>
                  </tr>
                  <tr>
                    <td>60+ (Grand Masters)</td>
                    <td>22%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Example Calculation */}
          <div className="example-section">
            <h2>Example Calculation</h2>
            <div className="example-box">
              <h3>Scenario:</h3>
              <ul>
                <li>Tournament: Tier 2 (Regional Championship) - <strong>500 base points</strong></li>
                <li>Placement: Winner - <strong>100%</strong></li>
                <li>Skill: Open Skill - <strong>100%</strong></li>
                <li>Age: All-Ages - <strong>100%</strong></li>
              </ul>
              <div className="calculation">
                <p><strong>Calculation:</strong></p>
                <p className="calc-formula">500 × 1.0 × 1.0 × 1.0 = <span className="result">500 points</span></p>
              </div>
            </div>

            <div className="example-box">
              <h3>Another Scenario:</h3>
              <ul>
                <li>Tournament: Tier 3 (State Championship) - <strong>250 base points</strong></li>
                <li>Placement: Semifinalist - <strong>70%</strong></li>
                <li>Skill: Advanced (rating 3.8) - <strong>36%</strong></li>
                <li>Age: All-Ages - <strong>100%</strong></li>
              </ul>
              <div className="calculation">
                <p><strong>Calculation:</strong></p>
                <p className="calc-formula">250 × 0.7 × 0.36 × 1.0 = <span className="result">63 points</span></p>
              </div>
            </div>
          </div>

          {/* Best 8 System */}
          <div className="info-section">
            <h2>Best 8 Rolling System</h2>
            <div className="info-content">
              <p>
                Your national ranking is calculated from your <strong>best 8 tournament results</strong> in the
                <strong> past 52 weeks</strong>. This means:
              </p>
              <ul className="info-list">
                <li><i className="fas fa-check-circle"></i> Only your top 8 highest-scoring results count</li>
                <li><i className="fas fa-check-circle"></i> Results older than 52 weeks automatically expire</li>
                <li><i className="fas fa-check-circle"></i> Rankings update in real-time as new results are added</li>
                <li><i className="fas fa-check-circle"></i> You can improve your ranking by competing in more tournaments</li>
              </ul>
              <div className="tip-box">
                <i className="fas fa-lightbulb"></i>
                <strong>Pro Tip:</strong> To maximize your ranking, compete regularly in higher-tier tournaments
                and aim for top placements. Your ranking will reflect your best performances over the past year.
              </div>
            </div>
          </div>

          {/* View Rankings CTA */}
          <div className="cta-section">
            <h2>Ready to See the Rankings?</h2>
            <p>View the current national rankings and see where Malaysia's top players stand.</p>
            <Link to="/national-rankings" className="btn-view-rankings">
              <i className="fas fa-medal"></i> View National Rankings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default RankingSystem;
