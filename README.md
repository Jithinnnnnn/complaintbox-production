# Digital Complaint Box 📋

A secure, full-stack employee complaint management system with admin approval workflow.

## 🚀 Features

- **Employee Portal**: Submit and track complaints
- **Admin Dashboard**: Manage users and complaints
- **Secure Authentication**: JWT-based auth with bcrypt password hashing
- **Real-time Status**: Track complaint resolution progress
- **Approval Workflow**: Admin approval required for new users

## 🛠️ Tech Stack

**Frontend:**
- React 18 with Vite
- React Router for navigation
- Modern CSS with animations

**Backend:**
- Node.js + Express
- MongoDB with Mongoose
- JWT authentication
- Security: Helmet, CORS, Rate Limiting

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (free tier)

### Local Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Digitalcomplaintbox
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Configure environment variables**

Create `server/.env`:
```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
PORT=5001
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

4. **Run the application**
```bash
# Development mode (both client and server)
npm run dev

# Or run separately:
npm run server  # Backend on port 5001
npm run client  # Frontend on port 5173
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001/api

## 🌐 Azure Deployment

See [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy:**
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📱 Usage

### Employee Registration
1. Navigate to Employee Portal
2. Fill registration form:
   - Full Name
   - Phone Number (10 digits)
   - Password
   - Department
   - Work Location (Airport/OMR/Pallavaram)
3. Wait for admin approval

### Admin Access
- Default credentials: `admin` / `admin123`
- Change in production via environment variables

### Complaint Workflow
1. Employee submits complaint
2. Admin reviews and updates status
3. Employee tracks progress in dashboard

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ MongoDB injection prevention
- ✅ Rate limiting on API endpoints
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Admin approval workflow

## 📊 Project Structure

```
Digitalcomplaintbox/
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/      # Home, Employee, Admin
│   │   ├── components/ # Reusable components
│   │   └── utils/      # API utilities
│   └── package.json
├── server/              # Express backend
│   ├── models/         # Mongoose schemas
│   ├── middleware/     # Auth middleware
│   ├── server.js       # Main server file
│   └── package.json
├── .gitignore
├── package.json         # Root package.json
└── README.md
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Employee registration
- `POST /api/auth/login` - Employee login
- `POST /api/auth/admin/login` - Admin login

### Complaints (Protected)
- `GET /api/complaints` - Get all complaints
- `POST /api/complaints` - Submit complaint
- `GET /api/complaints/:id` - Get complaint details

### Admin (Protected + Admin Only)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/pending` - Get pending approvals
- `PATCH /api/admin/users/:id/approval` - Approve/reject user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/complaints` - Get all complaints
- `PATCH /api/admin/complaints/:id/status` - Update status
- `DELETE /api/admin/complaints/:id` - Delete complaint

## 🧪 Environment Variables

### Required
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `ADMIN_USERNAME` - Admin username
- `ADMIN_PASSWORD` - Admin password

### Optional
- `PORT` - Server port (default: 5001)
- `ALLOWED_ORIGINS` - CORS allowed origins

## 📝 License

ISC

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Made with ❤️ for better workplace communication**
