# Video App - API-First Architecture

## Project Overview

A full-stack video streaming application demonstrating strict API-first architecture principles. The React Native frontend acts as a thin client with zero business logic, delegating all operations to a Flask REST API backend. The application showcases secure authentication, dynamic content delivery, and custom video playback controls while maintaining complete separation of concerns.

## Description

This project implements a video streaming platform where users can authenticate, browse videos, and watch content through a custom player interface. The architecture ensures that all business logic, data validation, and security measures are handled server-side, with the mobile application serving purely as a presentation layer. Videos are served through signed tokens with expiration, and YouTube URLs are completely abstracted from the client.

## Technical Stack

**Frontend:**
- React Native with Expo framework
- TypeScript for type safety
- Expo Router for file-based navigation
- AsyncStorage for local token persistence
- React Native WebView for cross-platform video rendering
- Fetch API for HTTP requests

**Backend:**
- Flask 3.0 web framework
- Python 3.11+
- PyJWT for JSON Web Token authentication
- PyMongo for MongoDB database operations
- Flask-CORS for cross-origin resource sharing
- Werkzeug for secure password hashing

**Database:**
- MongoDB Atlas (cloud-hosted NoSQL database)

**Development Tools:**
- ADB (Android Debug Bridge) for mobile testing
- Git for version control
- Virtual environments for Python dependency isolation

## Architecture

The application follows a three-tier architecture:

```
React Native Client → REST API (Flask) → MongoDB Atlas
```

All data flows through the API layer, ensuring the client never directly accesses the database or implements business rules. Authentication is handled via JWT tokens, and video access is controlled through signed playback tokens with short expiration periods.

## Core Skills Demonstrated

**Software Engineering:**
- API-first design patterns
- RESTful API development
- Token-based authentication
- Separation of concerns
- Client-server architecture

**Security:**
- JWT token management
- Password hashing and salting
- Token blacklisting
- Rate limiting implementation
- Signed URL generation

**Backend Development:**
- Flask framework proficiency
- MongoDB database design
- Route handling and middleware
- Error handling and logging
- CORS configuration

**Frontend Development:**
- React Native mobile development
- TypeScript implementation
- State management
- Asynchronous operations
- Cross-platform compatibility

**Database Management:**
- NoSQL schema design
- Query optimization
- Aggregation pipelines
- Index management
- Cloud database administration

## Installation and Setup

### Prerequisites

- Node.js v18 or higher
- Python 3.11 or higher
- MongoDB Atlas account
- Android Studio (optional, for Android testing)

### Backend Configuration

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

Create `.env` file in backend directory:

```env
FLASK_CONFIG=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/video_app
JWT_SECRET_KEY=your-secure-secret-key
JWT_ALGORITHM=HS256
PORT=5000
```

### Frontend Configuration

```bash
cd frontend

# Install dependencies
npm install

# Install additional packages
npx expo install @react-native-async-storage/async-storage react-native-webview
```

### Database Setup

1. Create MongoDB Atlas cluster at mongodb.com/cloud/atlas
2. Create database user with read/write permissions
3. Add IP address 0.0.0.0/0 to whitelist
4. Insert sample video documents into `videos` collection

## Running the Application

### Web Platform (Recommended)

Terminal 1 - Start Backend:
```bash
cd backend
python app.py
```

Terminal 2 - Start Frontend:
```bash
cd frontend
npx expo start
```

Press 'w' to open in web browser. Application will be available at http://localhost:8081

### Android Platform

Terminal 1 - Start Backend:
```bash
cd backend
python app.py
```

Terminal 2 - Configure Port Forwarding:
```bash
adb reverse tcp:5000 tcp:5000
```

Terminal 3 - Start Frontend:
```bash
cd frontend
npx expo start
```

Press 'a' to launch Android emulator

## API Endpoints

**Authentication:**
- POST /auth/signup - User registration
- POST /auth/login - User authentication
- GET /auth/me - Retrieve user profile
- POST /auth/logout - Token invalidation

**Video Management:**
- GET /dashboard - Retrieve 2 random active videos
- GET /video/{id}/stream - Fetch video embed URL with playback token
- POST /video/{id}/watch - Record video view event

**System:**
- GET /health - Backend health check

## Project Structure

```
backend/
├── app.py                    # Application entry point
├── auth/routes.py            # Authentication endpoints
├── video/routes.py           # Video endpoints
├── config/config.py          # Environment configuration
├── db/mongo.py               # Database connection
└── requirements.txt          # Python dependencies

frontend/
├── app/(tabs)/index.tsx      # Dashboard screen
├── app/auth/login.tsx        # Login screen
├── app/auth/signup.tsx       # Signup screen
├── app/video/[id].tsx        # Video player screen
├── components/VideoPlayer.tsx # Custom player component
├── constants/api.ts          # API configuration
├── services/api.ts           # API client service
└── utils/storage.ts          # Token storage utility
```

## Testing Procedures

1. Navigate to application URL
2. Create account via signup form
3. Login with credentials
4. Verify dashboard displays 2 videos
5. Click video tile to open player
6. Test Play/Pause functionality
7. Test Seek control (-10 seconds)
8. Test Mute/Unmute control
9. Verify logout functionality

## Key Features

- Secure JWT-based authentication with 24-hour token expiry
- Random video selection using MongoDB aggregation
- Custom video player with hidden YouTube URLs
- Three-button control interface (Play/Pause, Seek, Mute)
- Automatic watch history tracking
- Token blacklisting for secure logout
- Rate limiting on login attempts (5 per 5 minutes)
- Cross-platform compatibility (Web and Android)

## Security Implementation

- Password hashing using Werkzeug PBKDF2
- JWT tokens with expiration timestamps
- Signed video playback tokens (5-minute validity)
- Token blacklisting on logout
- Login attempt rate limiting
- CORS policy enforcement
- MongoDB injection prevention through PyMongo
- Environment variable configuration for secrets

## Troubleshooting

**MongoDB Connection Issues:**
Verify connection string, IP whitelist, and user permissions in MongoDB Atlas

**Android Network Errors:**
Execute `adb reverse tcp:5000 tcp:5000` before starting frontend

**Port Conflicts:**
Terminate processes using port 5000 before starting backend

**Module Import Errors:**
Clear node_modules and reinstall: `rm -rf node_modules && npm install`

## Assignment Compliance

This project fulfills all specified requirements:
- API-first architecture with no frontend business logic
- JWT authentication system
- Dashboard displaying 2 randomly selected videos
- Custom video player with concealed YouTube URLs
- Three custom playback controls
- Backend-managed watch history
- User profile and logout functionality