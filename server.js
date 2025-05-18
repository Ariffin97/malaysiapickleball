const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Route for homepage
app.get('/', (req, res) => {
    const tournaments = [
        { name: 'Malaysia Open 2025', date: 'June 15-18, 2025', location: 'Kuala Lumpur' },
        { name: 'Penang Pickleball Classic', date: 'August 10-12, 2025', location: 'Penang' },
        { name: 'Johor Championship', date: 'October 20-22, 2025', location: 'Johor Bahru' }
    ];
    const news = [
        { title: 'New Court Opening in Johor', date: 'May 10, 2025', description: 'Join us for the grand opening of our new facility!' },
        { title: 'Youth Training Program', date: 'April 20, 2025', description: 'Registration open for ages 10-18.' }
    ];
    const coaches = [
        { name: 'Tan Wei Ming', experience: '5 years', contact: 'tan@example.com', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e' },
        { name: 'Lina Chong', experience: '3 years', contact: 'lina@example.com', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330' },
        { name: 'Ahmad Zulkifli', experience: '7 years', contact: 'ahmad@example.com', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7' },
        { name: 'Sofia Lim', experience: '4 years', contact: 'sofia@example.com', image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91' },
        { name: 'Rajesh Kumar', experience: '6 years', contact: 'rajesh@example.com', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d' },
        { name: 'Mei Ling', experience: '2 years', contact: 'mei@example.com', image: 'https://images.unsplash.com/photo-1517841903200-7a724dd77e98' },
        { name: 'Daniel Ong', experience: '8 years', contact: 'daniel@example.com', image: 'https://images.unsplash.com/photo-1530268729831-4e4d24c5b1c2' },
        { name: 'Nur Aisyah', experience: '5 years', contact: 'nur@example.com', image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df' }
    ];
    res.render('index', { tournaments, news, coaches });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});