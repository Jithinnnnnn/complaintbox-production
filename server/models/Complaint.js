import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    employeeName: { type: String, required: true },
    employeeEmail: { type: String, required: true },
    employeeNumber: { type: String },
    department: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    message: { type: String, required: true },
    status: { type: String, enum: ['pending', 'received', 'resolved'], default: 'pending' },
    adminReply: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Complaint', complaintSchema);
