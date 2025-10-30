import './ContactUs.css';

function ContactUs() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="contact-page">
      <section className="page-header">
        <h1>Contact Us</h1>
        <p>Get in touch with us</p>
      </section>

      <section className="content-section">
        <div className="container">
          <div className="contact-grid">
            {/* Technical Contact */}
            <div className="contact-card">
              <div className="card-header">
                <i className="fas fa-laptop-code"></i>
                <h2>Technical Contact</h2>
              </div>
              <div className="card-body">
                <div className="contact-item">
                  <i className="fas fa-envelope"></i>
                  <div>
                    <a href="mailto:ariffin@fenixdigital.my">ariffin@fenixdigital.my</a>
                  </div>
                </div>
                <div className="contact-item">
                  <i className="fas fa-phone"></i>
                  <div>
                    <a href="tel:+60111619747">+6011-16197471</a>
                  </div>
                </div>
                <div className="contact-item">
                  <i className="fas fa-envelope"></i>
                  <div>
                    <a href="mailto:zac@fenixdigital.my">zac@fenixdigital.my</a>
                  </div>
                </div>
                <div className="contact-item">
                  <i className="fas fa-phone"></i>
                  <div>
                    <a href="tel:+60178941403">+6017-8941403</a>
                  </div>
                </div>
              </div>
            </div>

            {/* MPA Contact */}
            <div className="contact-card">
              <div className="card-header">
                <i className="fas fa-building"></i>
                <h2>MPA Contact</h2>
              </div>
              <div className="card-body">
                <div className="contact-item">
                  <i className="fas fa-user"></i>
                  <div>
                    <strong>Puan Delima Ibrahim</strong>
                  </div>
                </div>
                <div className="contact-item">
                  <i className="fas fa-phone"></i>
                  <div>
                    <a href="tel:+60128830407">+6012-8830407</a>
                  </div>
                </div>
                <div className="contact-item">
                  <i className="fas fa-envelope"></i>
                  <div>
                    <a href="mailto:president@malaysiapickleballassociation.org">president@malaysiapickleballassociation.org</a>
                  </div>
                </div>
                <div className="contact-item">
                  <i className="fas fa-envelope"></i>
                  <div>
                    <a href="mailto:tournament@malaysiapickleballassociation.org">tournament@malaysiapickleballassociation.org</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-note">
            <p>&copy; {currentYear} Malaysia Pickleball Association</p>
            <p>Powered by Fenix Digital</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ContactUs;
