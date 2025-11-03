# WorkOrbit Backend API

A comprehensive Node.js backend API for the WorkOrbit Employee Management System with PostgreSQL database.

## Features

- 🔐 **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin, HR, Manager, Employee)
  - Refresh token mechanism
  
- 👥 **Hierarchy Management**
  - Organization creation and management
  - Multi-level approval system
  - HR and staff registration with approval workflow
  
- 🏢 **Organization Structure**
  - Admin-owned organizations
  - HR managers with specific codes
  - Employee hierarchy with managers
  
- 🔒 **Security**
  - Password hashing with bcrypt
  - Rate limiting
  - Helmet for security headers
  - CORS configuration

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nodeworkorbit
```

2. Install dependencies:
```bash
npm install
```

3. Set up PostgreSQL database:
```sql
CREATE DATABASE workorbit_db;
```

4. Configure environment variables:
   - Copy `.env` file and update with your settings
   - Update `DB_PASSWORD` with your PostgreSQL password
   - Update `JWT_SECRET` and `JWT_REFRESH_SECRET` with secure keys

5. Run database migrations:
```bash
npm run migrate
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API endpoints and usage.

## Project Structure

```
nodeworkorbit/
├── src/
│   ├── config/
│   │   └── database.js         # Database configuration
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   └── hierarchyController.js # Hierarchy management
│   ├── middleware/
│   │   ├── auth.js             # Authentication middleware
│   │   ├── errorHandler.js    # Error handling
│   │   └── validation.js      # Request validation
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── Organization.js    # Organization model
│   │   ├── HRManager.js       # HR Manager model
│   │   ├── JoinRequest.js     # Join request model
│   │   └── index.js           # Model associations
│   ├── routes/
│   │   ├── authRoutes.js      # Auth endpoints
│   │   └── hierarchyRoutes.js # Hierarchy endpoints
│   ├── utils/
│   │   ├── jwt.js             # JWT utilities
│   │   └── codeGenerator.js   # Code generation utilities
│   └── server.js              # Main server file
├── .env                       # Environment variables
├── package.json              # Dependencies
└── README.md                 # Documentation
```

## Registration Flow

### 1. Admin Registration
- Admin registers with organization details
- Organization is created with unique ORG code (e.g., ORG001)
- Admin gets immediate access

### 2. HR Registration
- HR registers with organization code
- Request goes to admin for approval
- Upon approval, HR gets unique HR code (e.g., HR001-ORG001)

### 3. Staff Registration (Manager/Employee)
- Staff registers with HR code
- Request goes to HR for approval
- Upon approval, employee ID is generated

## Environment Variables

Key environment variables in `.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=workorbit_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Testing

### Test Authentication
```bash
# Register admin
curl -X POST http://localhost:5000/api/v1/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Test123!",
    "name": "Test Admin",
    "organizationName": "Test Company"
  }'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Test123!"
  }'
```

## Security Considerations

1. **Change default secrets** in production
2. **Use HTTPS** in production
3. **Enable SSL** for PostgreSQL in production
4. **Implement rate limiting** (already configured)
5. **Regular security updates** for dependencies

## License

ISC

## Support

For issues or questions, please create an issue in the repository.