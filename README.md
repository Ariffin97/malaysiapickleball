# Malaysia Pickleball Association Website

A modern, responsive web platform for the Malaysia Pickleball Association, built with Node.js and EJS templating engine.

## 🏓 Project Overview

This website serves as the official platform for the Malaysia Pickleball Association, providing tournament management, player registration, event organization guidelines, and administrative tools for managing the pickleball community in Malaysia.

## ✨ Features

### 🎯 Core Features
- **Tournament Calendar** - Interactive calendar showing upcoming tournaments and events
- **Admin Dashboard** - Comprehensive management interface with statistics and controls
- **User Registration** - Player registration and profile management system
- **Event Organization** - Guidelines and procedures for organizing tournaments
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices

### 📊 Admin Features
- Real-time statistics dashboard
- Tournament management system
- Player registration oversight
- Venue management
- Sponsor relationship management
- Referee and coach management
- Player rankings system

### 🎨 User Experience
- Modern gradient designs
- Smooth animations and transitions
- Mobile-first responsive layout
- Interactive navigation with dropdown menus
- Search and filter functionality
- Touch-friendly mobile interface

## 🛠️ Technology Stack

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **EJS** - Embedded JavaScript templating engine

### Frontend
- **Tailwind CSS** - Utility-first CSS framework
- **Font Awesome** - Icon library
- **Chart.js** - Data visualization for admin dashboard
- **Vanilla JavaScript** - Interactive functionality

### Development Tools
- **Git** - Version control
- **npm** - Package management

## 📁 Project Structure

```
malaysia-pickleball/
├── views/
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── dashboard.ejs
│   │   │   ├── manage-tournaments.ejs
│   │   │   ├── manage-venues.ejs
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── registration.ejs
│   │   │   ├── application-organizing.ejs
│   │   │   └── ...
│   │   ├── home.ejs
│   │   ├── tournament.ejs
│   │   └── ...
│   └── partials/
│       ├── header.ejs
│       ├── footer.ejs
│       └── sidebar.ejs
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── script.js
│   └── images/
├── server.js
├── package.json
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd malaysia-pickleball
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Access the website**
   Open your browser and navigate to `http://localhost:3000`

## 📱 Responsive Design

The website is fully optimized for all devices:

- **Mobile (≤640px)** - Touch-friendly interface with collapsible navigation
- **Tablet (641px-1024px)** - Optimized layout for medium screens
- **Desktop (≥1025px)** - Full-featured experience with sidebar navigation

## 🎨 Design Features

### Color Scheme
- **Primary Colors** - Green gradients representing Malaysian nature
- **Secondary Colors** - Blue accents for trust and professionalism
- **Accent Colors** - Yellow highlights for energy and sports

### UI Components
- **Gradient Backgrounds** - Modern visual appeal
- **Card-based Layout** - Clean content organization
- **Interactive Animations** - Smooth hover effects and transitions
- **Glass Morphism** - Backdrop blur effects for modern aesthetics

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-session-secret
```

### Customization
- **Styling** - Edit `/public/css/styles.css` for custom styles
- **Content** - Modify EJS templates in `/views/pages/`
- **Navigation** - Update `/views/partials/header.ejs` and `/views/partials/sidebar.ejs`

## 📊 Admin Dashboard

The admin dashboard provides comprehensive management tools:

### Statistics Overview
- Total registered players
- Active tournaments
- Pending registrations
- Venue locations

### Management Sections
- **Content Management** - Homepage, tournaments, venues, sponsors
- **People Management** - Referees, coaches, player rankings
- **Activity Monitoring** - Real-time notifications and recent activity

## 🏆 Tournament Management

### Calendar View
- Interactive monthly calendar
- Color-coded tournament categories
- Quarterly breakdown display
- Mobile-responsive table design

### Tournament Categories
- **Local Tournaments** - Community level events
- **State Tournaments** - State-wide competitions
- **National Tournaments** - Malaysia national events
- **International** - Major international competitions

## 🔐 Security Features

- Session-based authentication
- Protected admin routes
- Input validation and sanitization
- CSRF protection

## 🚀 Deployment

### Production Setup
1. Set environment variables for production
2. Configure database connections
3. Set up SSL certificates
4. Deploy to hosting platform (AWS, Heroku, etc.)

### Performance Optimization
- Image optimization
- CSS and JS minification
- CDN integration for static assets
- Caching strategies

## 📞 Support & Contact

### Technical Support
- Check the issues section for common problems
- Create detailed bug reports with screenshots
- Include browser and device information

### Content Updates
- Admin users can update content through the dashboard
- Tournament information managed via admin panel
- News and announcements system

## 🤝 Contributing

### Development Guidelines
1. Follow existing code structure and naming conventions
2. Test responsive design on multiple devices
3. Ensure accessibility standards are met
4. Update documentation for new features

### Code Style
- Use consistent indentation (2 spaces)
- Follow EJS templating best practices
- Maintain clean, readable CSS with Tailwind utilities
- Comment complex JavaScript functionality

## 📄 License

This project is proprietary software for the Malaysia Pickleball Association.

## 🙏 Acknowledgments

- **Tailwind CSS** - For the excellent utility-first CSS framework
- **Font Awesome** - For comprehensive icon library
- **Chart.js** - For beautiful data visualizations
- **EJS Community** - For the flexible templating engine

---

**Malaysia Pickleball Association**  
*Building a stronger pickleball community in Malaysia*

🏓 **Play. Compete. Excel.**
