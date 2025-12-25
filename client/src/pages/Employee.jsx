import { useState, useEffect } from 'react';
import api from '../utils/api';
import './Employee.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Employee() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [user, setUser] = useState(null);
    const [view, setView] = useState('list');
    const [complaints, setComplaints] = useState([]);
    const [selectedComplaint, setSelectedComplaint] = useState(null);

    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [registerForm, setRegisterForm] = useState({
        name: '',
        password: '',
        employeeNumber: '',
        department: '',
        workLocation: ''
    });

    const [complaintForm, setComplaintForm] = useState({
        category: '',
        message: '',
        priority: 'medium'
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        if (user?._id) {
            fetchComplaints();
        }
    }, [user]);

    const fetchComplaints = async () => {
        try {
            const res = await api.get('/complaints');
            setComplaints(res.data.filter(c => c.employeeId === user._id));
        } catch (err) {
            console.error('Failed to fetch complaints');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', loginForm);
            if (res.data.success) {
                setUser(res.data.user);
                setIsAuthenticated(true);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                // Store the JWT token for API requests and route protection
                if (res.data.token) {
                    localStorage.setItem('token', res.data.token);
                }
                setLoginForm({ email: '', password: '' });
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Login failed');
        }
    };

    const [registrationStatus, setRegistrationStatus] = useState(null);

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/register', registerForm);
            if (res.data.success) {
                setRegistrationStatus('pending');
                setRegisterForm({ name: '', password: '', employeeNumber: '', department: '', workLocation: '' });
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Registration failed');
        }
    };

    // Add this to your JSX, after auth screen check:
    if (registrationStatus === 'pending') {
        return (
            <div className="auth-screen">
                <div className="auth-container">
                    <div className="auth-header">
                        <h1>⏳ Registration Successful!</h1>
                        <p>Your account is pending admin approval</p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                        <p style={{ color: '#64748b', lineHeight: 1.7, marginBottom: '2rem' }}>
                            Your registration has been submitted successfully.
                            An administrator will review your account shortly.
                            You will be able to login once approved.
                        </p>
                        <button
                            className="btn-primary"
                            onClick={() => {
                                setRegistrationStatus(null);
                                setAuthMode('login');
                            }}
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }




    const handleSubmitComplaint = async (e) => {
        e.preventDefault();
        try {
            await api.post('/complaints', {
                ...complaintForm,
                employeeId: user._id,
                employeeName: user.name,
                employeeEmail: user.email,
                employeeNumber: user.employeeNumber,
                department: user.department
            });
            setComplaintForm({ category: '', message: '', priority: 'medium' });
            setView('list');
            fetchComplaints();
            alert('Complaint submitted successfully!');
        } catch (err) {
            console.error('Submit complaint error:', err);
            alert(err.response?.data?.message || 'Failed to submit complaint');
        }
    };

    const handleLogout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setView('list');
    };

    const viewDetail = (comp) => {
        setSelectedComplaint(comp);
        setView('detail');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Auth Screen
    if (!isAuthenticated) {
        return (
            <div className="auth-screen">
                <div className="auth-container">
                    <div className="auth-header">

                        <p>Employee Portal</p>
                    </div>

                    {authMode === 'login' ? (
                        <div className="auth-form">
                            <h2>Login</h2>
                            <form onSubmit={handleLogin}>
                                <div className="field">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        value={loginForm.email}
                                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                        placeholder="Enter your phone number"
                                        pattern="[0-9]{10}"
                                        title="Please enter a 10-digit phone number"
                                        required
                                    />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        value={loginForm.password}
                                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn-primary">Login</button>
                            </form>
                            <div className="auth-switch">
                                Don't have an account?
                                <button onClick={() => setAuthMode('register')}>Register</button>
                            </div>
                        </div>
                    ) : (
                        <div className="auth-form">
                            <h2>Register</h2>
                            <form onSubmit={handleRegister}>
                                <div className="field">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        value={registerForm.name}
                                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>
                                <div className="field">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        value={registerForm.employeeNumber}
                                        onChange={(e) => setRegisterForm({ ...registerForm, employeeNumber: e.target.value })}
                                        placeholder="Enter your phone number"
                                        pattern="[0-9]{10}"
                                        title="Please enter a 10-digit phone number"
                                        required
                                    />
                                </div>
                                <div className="field">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        value={registerForm.password}
                                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                                        placeholder="Create a password"
                                        minLength="6"
                                        required
                                    />
                                </div>
                                <div className="field">
                                    <label>Department</label>
                                    <select
                                        value={registerForm.department}
                                        onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        <option value="Sales">Sales</option>
                                        <option value="Service">Service</option>
                                        <option value="Parts">Parts</option>
                                        <option value="Finance">Finance</option>
                                        <option value="HR">HR</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div className="field">
                                    <label>Work Location</label>
                                    <select
                                        value={registerForm.workLocation}
                                        onChange={(e) => setRegisterForm({ ...registerForm, workLocation: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Work Location</option>
                                        <option value="Airport">Airport</option>
                                        <option value="OMR">OMR</option>
                                        <option value="Pallavaram">Pallavaram</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn-primary">Register</button>
                            </form>
                            <div className="auth-switch">
                                Already have an account?
                                <button onClick={() => setAuthMode('login')}>Login</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Dashboard
    return (
        <div className="dashboard">
            <header className="header">
                <div className="logo">ComplaintBox</div>
                <div className="user">
                    <span>{user?.name || 'User'}</span>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <div className="container">
                <aside className="sidebar">
                    <div className="profile">
                        <h3>{user?.name || 'User'}</h3>
                        <p>{user?.role || 'Employee'}</p>
                        <div className="info">
                            <span style={{ fontWeight: 'bold' }}> Id 📧 :{user?.email || 'N/A'}</span>
                            <span style={{ fontWeight: 'bold' }}>Location 📍 : {user?.workLocation || 'N/A'}</span>
                            <span style={{ fontWeight: 'bold' }}>Department 🏬 :  {user?.department || 'N/A'}</span>

                        </div>
                        <button className="btn-primary" onClick={() => setView('form')}>
                            + New Complaint
                        </button>
                    </div>
                </aside>

                <main className="content">
                    {view === 'form' && (
                        <div className="form-section">
                            <div className="header-row">
                                <h2>Submit Complaint</h2>
                                <button onClick={() => setView('list')}>← Back</button>
                            </div>
                            <form onSubmit={handleSubmitComplaint}>
                                <div className="field">
                                    <label>Category</label>
                                    <select
                                        value={complaintForm.category}
                                        onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Attendence">Attendence</option>
                                        <option value="Sallary Advance">Sallary Advance</option>
                                        <option value="Pay Roll">Pay Roll</option>
                                        <option value="Full and Final Settlement">Full and Final Settlement</option>
                                        <option value="ESI">ESI</option>
                                        <option value="PF">PF</option>
                                        <option value="Payroll">Payroll</option>
                                        <option value="General">Other</option>
                                    </select>
                                </div>

                                <div className="field">
                                    <label>Priority Level</label>
                                    <select
                                        value={complaintForm.priority}
                                        onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value })}
                                        required
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>

                                <div className="field">
                                    <label>Description</label>
                                    <textarea
                                        value={complaintForm.message}
                                        onChange={(e) => setComplaintForm({ ...complaintForm, message: e.target.value })}
                                        rows="6"
                                        placeholder="Describe your complaint in detail..."
                                        required
                                    />
                                    <small>Please provide as much detail as possible</small>
                                </div>

                                <button type="submit" className="btn-primary">
                                    Submit Complaint
                                </button>
                            </form>
                        </div>
                    )}

                    {view === 'list' && (
                        <div className="list-section">
                            <div className="header-row">
                                <h2>My Complaints ({complaints.length})</h2>
                            </div>
                            {complaints.length === 0 ? (
                                <div className="empty">
                                    <p>No complaints submitted yet</p>
                                </div>
                            ) : (
                                <div className="grid">
                                    {complaints.map(comp => (
                                        <div key={comp._id} className="card" onClick={() => viewDetail(comp)}>
                                            <div className="card-header">
                                                <span className={`badge ${comp.status}`}>{comp.status}</span>
                                                <span className="date">{formatDate(comp.createdAt)}</span>
                                            </div>
                                            <h4>{comp.category}</h4>
                                            <p>{comp.message.substring(0, 120)}...</p>
                                            <small>Priority: <strong>{comp.priority}</strong></small>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'detail' && selectedComplaint && (
                        <div className="detail-card">
                            <div className="header-row">
                                <h2>Complaint Details</h2>
                                <button onClick={() => setView('list')}>← Back</button>
                            </div>

                            <div className="badge-row">
                                <span className={`badge ${selectedComplaint.status}`}>
                                    {selectedComplaint.status}
                                </span>
                                <span className="category">{selectedComplaint.category}</span>
                                <span className="category">Priority: {selectedComplaint.priority}</span>
                            </div>

                            <div className="detail-info">
                                <p><strong>Submitted:</strong> {formatDate(selectedComplaint.createdAt)}</p>
                                <p><strong>Department:</strong> {selectedComplaint.department}</p>
                            </div>

                            <div className="message">
                                {selectedComplaint.message}
                            </div>

                            {selectedComplaint.adminReply && (
                                <div className="admin-reply">
                                    <h4>Admin Response</h4>
                                    <p>{selectedComplaint.adminReply}</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
