import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    employeeNumber: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    workLocation: { type: String, required: true },
    role: { type: String, enum: ['employee', 'admin'], default: 'employee' },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign(
        {
            _id: this._id,
            email: this.email,
            role: this.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
    return token;
};

// Static method to generate admin token
userSchema.statics.generateAdminToken = function (adminUser) {
    const token = jwt.sign(
        {
            _id: adminUser._id,
            email: adminUser.email,
            role: 'admin'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
    return token;
};

export default mongoose.model('User', userSchema);
