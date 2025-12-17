import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import User from './models/User.js';
import Complaint from './models/Complaint.js';
import { authMiddleware, adminMiddleware } from './middleware/auth.js';

// Load environment variables FIRST
dotenv.config();

// NUCLEAR DEBUG: Force clean the URI and inspect it
const rawUri = process.env.MONGO_URI;
const cleanUri = String(rawUri || '').trim();

console.log('\n🔍 NUCLEAR DEBUG - MongoDB URI Inspection:');
console.log('═══════════════════════════════════════════');
console.log('Raw value exists:', !!rawUri);
console.log('Raw value type:', typeof rawUri);
console.log('Raw value length:', rawUri?.length || 0);
console.log('Clean value length:', cleanUri.length);
console.log('First 20 chars:', JSON.stringify(cleanUri.substring(0, 20)));
console.log('Starts with mongodb:', cleanUri.startsWith('mongodb'));
console.log('Starts with mongodb+srv:', cleanUri.startsWith('mongodb+srv://'));
console.log('Full URI (JSON):', JSON.stringify(cleanUri));
console.log('═══════════════════════════════════════════\n');

// Validate URI before attempting connection
if (!cleanUri) {
    console.error('❌ FATAL: MONGO_URI is empty or undefined');
    console.error('Check your .env file in the server/ folder');
    process.exit(1);
}

if (!cleanUri.startsWith('mongodb://') && !cleanUri.startsWith('mongodb+srv://')) {
    console.error('❌ FATAL: MONGO_URI does not start with mongodb:// or mongodb+srv://');
    console.error('Current value starts with:', cleanUri.substring(0, 15));
    console.error('Expected format: mongodb+srv://username:password@cluster.mongodb.net/...');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5001;

// ============= SECURITY MIDDLEWARE =============

// Helmet - Security headers
app.use(helmet());

// CORS - Restrict to specific origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('CORS policy violation'), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

// Rate limiting - Prevent brute force
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 login attempts per 15 minutes
    message: 'Too many login attempts, please try again later.'
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));

// Sanitize data - Prevent NoSQL injection
app.use(mongoSanitize());

// MongoDB Connection with cleaned URI
console.log('🔌 Attempting MongoDB connection...');
console.log('Using URI starting with:', cleanUri.substring(0, 25) + '...');

mongoose.connect(cleanUri, {
    dbName: "complaint_box"
})
    .then(() => {
        console.log('✅ MongoDB Connected to complaint_box database');
        console.log('✅ Connection successful!\n');
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:');
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        console.error('\n💡 Common fixes:');
        console.error('1. Check if password has special characters - they need URL encoding');
        console.error('2. Verify cluster name is correct');
        console.error('3. Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)');
        console.error('4. Ensure database user exists with correct password\n');
        process.exit(1);
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
        console.error('Registration error:', error);
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
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error occurred' });
    }
});

// Admin Login
app.post('/api/auth/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check against environment variables
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        if (username !== adminUsername || password !== adminPassword) {
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
                username: adminUsername
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
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

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Complaint API Running ✅', version: '1.0.0' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});