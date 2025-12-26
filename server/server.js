import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path'; // <--- ADDED
import { fileURLToPath } from 'url'; // <--- ADDED
import User from './models/User.js';
import Complaint from './models/Complaint.js';
import { authMiddleware, adminMiddleware } from './middleware/auth.js';

// ============= SETUP DIRECTORY PATHS (Required for ES Modules) =============
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============= ENVIRONMENT SETUP =============

// Load environment variables (only in non-production)
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

// ============= VALIDATE REQUIRED ENVIRONMENT VARIABLES =============

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ FATAL: Missing required environment variables:');
    missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n💡 Set these in Azure App Service Configuration or local .env file');
    process.exit(1);
}

// Validate MongoDB URI format
const mongoUri = process.env.MONGO_URI.trim();
if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    console.error('❌ FATAL: MONGO_URI must start with mongodb:// or mongodb+srv://');
    console.error('Expected format: mongodb+srv://username:password@cluster.mongodb.net/dbname');
    process.exit(1);
}

// Validate JWT_SECRET strength
if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ FATAL: JWT_SECRET must be at least 32 characters for security');
    process.exit(1);
}

// Cache admin credentials (validated at startup, not per-request)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

console.log('✅ Environment variables validated');
console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);

// ============= EXPRESS APP SETUP =============

const app = express();
const PORT = process.env.PORT || 5000;

// ============= HEALTH CHECK ROUTE (FIRST - BEFORE ALL MIDDLEWARE) =============

// Health check for Azure App Service - MUST be first to bypass all middleware
// This endpoint works with NO Origin header (health probes, server-to-server)
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development'
    });
});

// ============= BODY PARSING MIDDLEWARE =============

// Body parser - must come before routes that need to parse request bodies
app.use(express.json({ limit: '10mb' }));

// ============= SECURITY MIDDLEWARE =============

// Helmet - Security headers
app.use(helmet({
    contentSecurityPolicy: false, // Disabled briefly to avoid conflicts with React loading scripts
}));

// Sanitize data - Prevent NoSQL injection
app.use(mongoSanitize());

// ============= CORS CONFIGURATION (SCOPED TO /api ROUTES ONLY) =============

// Parse allowed origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

// CORS configuration - applies ONLY to /api routes
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, server-to-server, health checks)
        if (!origin) {
            return callback(null, true);
        }

        // Check if origin is in allowed list
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        // Reject origin not in whitelist
        return callback(new Error('CORS policy violation: Origin not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS ONLY to /api routes
app.use('/api', cors(corsOptions));

// ============= RATE LIMITING (SCOPED TO /api ROUTES ONLY) =============

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting ONLY to /api routes
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/admin/login', authLimiter);

// ============= DATABASE CONNECTION =============

async function connectDatabase() {
    try {
        console.log('🔌 Connecting to MongoDB...');

        await mongoose.connect(mongoUri, {
            dbName: "complaint_box",
            serverSelectionTimeoutMS: 5000,
        });

        console.log('✅ MongoDB connected to complaint_box database');

        // Test the connection
        await mongoose.connection.db.admin().ping();
        console.log('✅ Database ping successful\n');

    } catch (error) {
        console.error('❌ MongoDB Connection Error:');
        console.error('Error:', error.message);
        console.error('\n💡 Common fixes:');
        console.error('1. Verify MONGO_URI is correct');
        console.error('2. Check MongoDB Atlas IP whitelist (0.0.0.0/0 for Azure)');
        console.error('3. Ensure database user has correct permissions');
        console.error('4. Check if password has special characters (URL encode them)\n');
        process.exit(1);
    }
}

// ============= API ROUTES =============

// Root endpoint - simple status check (Modified to not conflict with frontend)
app.get('/api/status', (req, res) => {
    res.json({
        message: 'Complaint API Running ✅',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// ============= AUTH ROUTES =============

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, employeeNumber, department, workLocation } = req.body;

        // Input validation
        if (!name || !password || !employeeNumber || !department || !workLocation) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Phone number validation (10 digits)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(employeeNumber)) {
            return res.status(400).json({ success: false, message: 'Phone number must be exactly 10 digits' });
        }

        // Password strength validation
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // Check if phone number already exists
        const existingUser = await User.findOne({ employeeNumber });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Phone number already registered' });
        }

        // Generate unique email from phone number to avoid duplicate key error
        const generatedEmail = email || `${employeeNumber}@complaintbox.local`;

        const user = await User.create({
            name,
            email: generatedEmail,
            password,
            employeeNumber,
            department,
            workLocation,
            approvalStatus: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful! Wait for admin approval.',
            user: { _id: user._id, name: user.name, employeeNumber: user.employeeNumber }
        });
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).json({ success: false, message: 'Server error occurred' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Support both email and phone number for backward compatibility
        // But primarily use phone number (stored in employeeNumber field)
        const phoneNumber = email; // Frontend sends it as 'email' field

        if (!phoneNumber || !password) {
            return res.status(400).json({ success: false, message: 'Phone number and password required' });
        }

        // Find user by phone number (employeeNumber field)
        const user = await User.findOne({ employeeNumber: phoneNumber });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (user.approvalStatus === 'pending') {
            return res.status(403).json({ success: false, message: 'Account pending approval' });
        }

        if (user.approvalStatus === 'rejected') {
            return res.status(403).json({ success: false, message: 'Account rejected. Contact HR.' });
        }

        // Generate JWT token
        const token = user.generateAuthToken();

        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                workLocation: user.workLocation,
                employeeNumber: user.employeeNumber,
                approvalStatus: user.approvalStatus
            }
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ success: false, message: 'Server error occurred' });
    }
});

// Admin Login
app.post('/api/auth/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password required' });
        }

        // Use cached admin credentials (validated at startup)
        if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
            return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }

        // Create a temporary admin user object for token generation
        const adminUser = {
            _id: 'admin',
            role: 'admin',
            email: 'admin@system.com'
        };

        // Generate token using User model method
        const token = User.generateAdminToken(adminUser);

        res.json({
            success: true,
            token,
            user: {
                role: 'admin',
                username: ADMIN_USERNAME
            }
        });
    } catch (error) {
        console.error('Admin login error:', error.message);
        res.status(500).json({ success: false, message: 'Server error occurred' });
    }
});

// ============= COMPLAINT ROUTES (Protected) =============

// Get all complaints (Protected)
app.get('/api/complaints', authMiddleware, async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        console.error('Get complaints error:', error);
        res.status(500).json({ success: false, message: 'Server error occurred' });
    }
});

// Create complaint (Protected)
app.post('/api/complaints', authMiddleware, async (req, res) => {
    try {
        const complaint = await Complaint.create(req.body);
        res.status(201).json({ success: true, complaint });
    } catch (error) {
        console.error('Create complaint error:', error);
        res.status(500).json({ success: false, message: 'Server error occurred' });
    }
});

// Get single complaint (Protected)
app.get('/api/complaints/:id', authMiddleware, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, complaint });
    } catch (error) {
        console.error('Get complaint error:', error);
        res.status(500).json({ success: false, message: 'Server error occurred' });
    }
});

// ============= ADMIN ROUTES (Protected + Admin Only) =============

// Get users (Admin only)
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Server error occurred' });
    }
});

// Get pending users (Admin only)
app.get('/api/admin/users/pending', adminMiddleware, async (req, res) => {
    try {
        const users = await User.find({ approvalStatus: 'pending' }).select('-password').sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (error) {
        console.error('Get pending users error:', error);
        res.status(500).json({ success: false, message: 'Server error occurred' });
    }
});

// Approve/Reject user (Admin only)
app.patch('/api/admin/users/:id/approval', adminMiddleware, async (req, res) => {
    try {
        const { approvalStatus } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(approvalStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid approval status' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, { approvalStatus }, { new: true });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Approval error:', error);
        res.status(500).json({ success: false, message: 'Server error occurred' });
    }
});

// DELETE USER (Admin only)
app.delete('/api/admin/users/:id', adminMiddleware, async (req, res) => {
    try {
        const userId = req.params.id;

        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Delete all complaints belonging to this user
        await Complaint.deleteMany({ employeeId: userId });

        res.json({ success: true, message: 'User and associated complaints deleted successfully' });
    } catch (error) {
        console.error("Delete User Error:", error);
        res.status(500).json({ success: false, message: 'Server error occurred' });
    }
});

// Get admin complaints (Admin only)
app.get('/api/admin/complaints', adminMiddleware, async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.json({ success: true, complaints });
    } catch (error) {
        console.error('Get admin complaints error:', error);
        res.status(500).json({ success: false, message: 'Server error occurred' });
    }
});

// Update status (Admin only)
app.patch('/api/admin/complaints/:id/status', adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'received', 'resolved'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status }, { new: true });

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        res.json({ success: true, complaint });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: 'Server error occurred' });
    }
});

// DELETE COMPLAINT (Admin only)
app.delete('/api/admin/complaints/:id', adminMiddleware, async (req, res) => {
    try {
        const deletedComplaint = await Complaint.findByIdAndDelete(req.params.id);

        if (!deletedComplaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        res.json({ success: true, message: 'Complaint deleted successfully' });
    } catch (error) {
        console.error("Delete Complaint Error:", error);
        res.status(500).json({ success: false, message: 'Server error occurred' });
    }
});

// ============= 404 HANDLER FOR API ONLY =============

// Handle undefined API routes (Keeps API behavior strict)
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.originalUrl
    });
});

// ============= SERVE FRONTEND (MODIFIED SECTION) =============

// Serve static files from the React client "dist" folder
// Note: If you use 'Create React App' instead of 'Vite', change 'dist' to 'build' below.
app.use(express.static(path.join(__dirname, '../client/dist')));

// The Catch-All Handler: Serves React's index.html for any unknown non-API routes.
// This allows React Router to handle page navigation (e.g., /dashboard, /login).
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ============= GLOBAL ERROR HANDLER =============

app.use((err, req, res, next) => {
    console.error('Global error:', err.message);

    // Handle CORS errors specifically
    if (err.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            message: 'CORS policy violation: Origin not allowed'
        });
    }

    // Don't leak error details in production
    const errorMessage = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

    res.status(err.status || 500).json({ success: false, message: errorMessage });
});

// ============= SERVER STARTUP =============

async function startServer() {
    try {
        // Step 1: Connect to database first
        await connectDatabase();

        // Step 2: Start the server only after successful DB connection
        const server = app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 Health check: http://localhost:${PORT}/health`);
            // MODIFIED: Updated log message
            console.log(`✅ App Ready: Serving React Frontend + API`);
        });

        // ============= GRACEFUL SHUTDOWN =============

        const gracefulShutdown = async (signal) => {
            console.log(`\n${signal} received. Starting graceful shutdown...`);

            // Stop accepting new connections
            server.close(async () => {
                console.log('✅ HTTP server closed');

                try {
                    // Close database connection
                    await mongoose.connection.close();
                    console.log('✅ MongoDB connection closed');

                    console.log('✅ Graceful shutdown complete');
                    process.exit(0);
                } catch (error) {
                    console.error('❌ Error during shutdown:', error.message);
                    process.exit(1);
                }
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                console.error('⚠️  Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        // Listen for termination signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error.message);
            console.error(error.stack);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise);
            console.error('Reason:', reason);
            gracefulShutdown('UNHANDLED_REJECTION');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

// Start the application
startServer();