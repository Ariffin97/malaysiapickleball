import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Tournament from './pages/Tournament';
import Affiliate from './pages/Affiliate';
import Organization from './pages/Organization';
import News from './pages/News';
import Milestones from './pages/Milestones';
import TournamentGuidelines from './pages/TournamentGuidelines';
import VenueGuidelines from './pages/VenueGuidelines';
import TrainingProgram from './pages/TrainingProgram';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PlayerLogin from './pages/PlayerLogin';
import PlayerDashboard from './pages/PlayerDashboard';
import PickleZone from './pages/PickleZone';
import PickleZoneLogin from './pages/PickleZoneLogin';
import RegisteredOrganizers from './pages/RegisteredOrganizers';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import './App.css';

function AppContent() {
  const location = useLocation();
  const hideNavFooter = location.pathname === '/admin' || location.pathname.startsWith('/admin/') ||
                        location.pathname === '/player/login' || location.pathname === '/player/dashboard' ||
                        location.pathname === '/picklezone/login' || location.pathname === '/picklezone';

  return (
    <div className="App">
      {!hideNavFooter && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/tournament" element={<Tournament />} />
          <Route path="/registered-organizers" element={<RegisteredOrganizers />} />
          <Route path="/affiliate" element={<Affiliate />} />
          <Route path="/organization" element={<Organization />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:newsId" element={<News />} />
          <Route path="/milestones" element={<Milestones />} />
          <Route path="/tournament-guidelines" element={<TournamentGuidelines />} />
          <Route path="/venue-guidelines" element={<VenueGuidelines />} />
          <Route path="/training" element={<TrainingProgram />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/player/login" element={<PlayerLogin />} />
          <Route path="/player/dashboard" element={<PlayerDashboard />} />
          <Route path="/picklezone/login" element={<PickleZoneLogin />} />
          <Route path="/picklezone" element={<PickleZone />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
      </main>
      {!hideNavFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
