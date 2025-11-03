# WorkOrbit Careers - Recruitment Web Portal

A modern, responsive web application for job seekers to browse and apply for positions at WorkOrbit. This is the public-facing recruitment portal that complements the Flutter mobile app used by HR managers.

## 🚀 Features

### For Job Seekers
- **Browse Jobs**: Search and filter job listings by location, type, department, and keywords
- **Job Details**: View comprehensive job information including requirements, responsibilities, and benefits
- **Easy Application**: Apply for jobs without creating an account
- **Application Tracking**: Track application status using unique tracking code and PIN
- **QR Code Support**: Scan QR codes from job posters to quickly access job details
- **Mobile Responsive**: Optimized for all device sizes

### Key Highlights
- **No Account Required**: Candidates can apply and track applications without registration
- **Tracking System**: Unique tracking codes (e.g., WO2024ABC123) with 4-digit PINs
- **Real-time Status**: Live updates on application progress
- **Professional UI**: Clean, modern design with excellent UX
- **Fast Performance**: Built with Vite for optimal loading speeds

## 🛠 Technology Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **QR Codes**: qrcode.js

## 📦 Installation & Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

## 🏗 Project Structure

```
webworkorbit/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.jsx      # Navigation header
│   │   ├── Footer.jsx      # Site footer
│   │   ├── JobCard.jsx     # Job listing card
│   │   ├── LoadingSpinner.jsx
│   │   └── QRCodeDisplay.jsx
│   ├── pages/              # Page components
│   │   ├── JobList.jsx     # Job listings page
│   │   ├── JobDetails.jsx  # Individual job page
│   │   ├── ApplicationForm.jsx # Job application form
│   │   └── TrackApplication.jsx # Application tracking
│   ├── services/           # API integration
│   │   └── api.js          # API service functions
│   ├── App.jsx             # Main app component
│   ├── App.css             # Custom styles
│   └── index.css           # Tailwind CSS imports
```

## 🔗 API Integration

The app connects to the Node.js backend API:

### Job Endpoints
- `GET /api/jobs` - List all jobs with filtering
- `GET /api/jobs/:id` - Get specific job details

### Application Endpoints
- `POST /api/applications` - Submit new application
- `POST /api/applications/track` - Track application status

## 📱 Responsive Design

Fully responsive and optimized for:
- **Desktop** (1024px+): Full layout with sidebar navigation
- **Tablet** (768px - 1023px): Adapted layout with collapsible elements
- **Mobile** (320px - 767px): Stack layout with mobile-optimized interactions

## 🤝 Integration with WorkOrbit System

This web portal integrates with the complete WorkOrbit recruitment system:

1. **Backend API**: Node.js + Express + PostgreSQL
2. **HR Mobile App**: Flutter app for HR managers
3. **Notifications**: SMS/Email integration

### Complete Workflow
1. HR creates job in Flutter app → QR code generated
2. QR code shared via posters/social media
3. Candidates scan QR → Directed to this web portal
4. Candidates apply → Tracking code sent via SMS/Email
5. Candidates track status → Real-time updates
6. HR manages applications → Candidates notified

## 🚀 Current Status

✅ **Development server is running at `http://localhost:5177`**
✅ **Tailwind CSS v3.4.0 - Fully working**
✅ **All components styled and responsive**
✅ **No PostCSS configuration errors**

---

**Built with ❤️ for WorkOrbit**
