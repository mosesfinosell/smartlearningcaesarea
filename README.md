# Caesarea Smart School API

Backend API for Caesarea Smart School online learning platform.

## 🚀 Quick Start

### Prerequisites
- Node.js (v20 or higher)
- MongoDB (Atlas or local)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your credentials:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_min_32_characters
JWT_REFRESH_SECRET=your_refresh_secret_min_32_characters
```

4. Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## 📁 Project Structure

```
src/
├── config/         # Configuration files
├── models/         # Database models
├── controllers/    # Route controllers
├── routes/         # API routes
├── middleware/     # Custom middleware
├── services/       # Business logic
├── utils/          # Utility functions
├── types/          # TypeScript types
└── app.ts          # Main application file
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user

## 🧪 Testing

```bash
npm test
```

## 🏗️ Build

```bash
npm run build
```

## 📝 Environment Variables

See `.env.example` for all required environment variables.

## 🛠️ Tech Stack

- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting

## 📄 License

MIT
# smartlearningcaesarea
