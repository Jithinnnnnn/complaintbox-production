import { useState, useEffect } from 'react';
import './Admin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Admin() {
    const [isAuth, setIsAuth] = useState(false);
    const [creds, setCreds] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [tab, setTab] = useState('complaints');
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState('All');
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null, type: null, title: '' });
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) setIsAuth(true);
    }, []);

    useEffect(() => {
        if (isAuth) {
            fetchUsers();
            fetchPendingUsers();
            fetchComplaints();
        }
    }, [isAuth]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch(`${API_URL}/auth/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: creds.username,
                    password: creds.password
                })
            });

            const data = await res.json();

            if (data.success && data.token) {
                setIsAuth(true);
                localStorage.setItem('adminToken', data.token);
                setError('');
            } else {
                setError(data.message || 'Invalid credentials');
            }
        } catch (err) {
            console.error('Admin login error:', err);
            setError('Login failed. Please check your connection.');
        }
    };

    const handleLogout = () => {
        setIsAuth(false);
        localStorage.removeItem('adminToken');
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setUsers(data.users);
        } catch (err) { console.error(err); }
    };

    const fetchPendingUsers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/users/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setPendingUsers(data.users);
        } catch (err) { console.error(err); }
    };

    const fetchComplaints = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/complaints`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setComplaints(data.complaints);
        } catch (err) { console.error(err); }
    };

    const handleUserApproval = async (userId, status) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/users/${userId}/approval`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ approvalStatus: status })
            });
            const data = await res.json();
            if (data.success) {
                fetchUsers();
                fetchPendingUsers();
                showToast(`User ${status === 'approved' ? 'approved' : 'rejected'} successfully!`, status === 'approved' ? 'success' : 'error');
            }
        } catch (err) {
            showToast('Failed to update user status', 'error');
        }
    };

    const confirmDelete = (id, type, title) => {
        setDeleteModal({ show: true, id, type, title });
    };

    const executeDelete = async () => {
        const { id, type } = deleteModal;
        try {
            const token = localStorage.getItem('adminToken');
            const endpoint = type === 'user' ? `/admin/users/${id}` : `/admin/complaints/${id}`;
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                if (type === 'user') {
                    fetchUsers();
                    fetchPendingUsers();
                    fetchComplaints();
                } else {
                    fetchComplaints();
                    setSelected(null);
                }
                showToast(`${type === 'user' ? 'User' : 'Complaint'} deleted successfully`, 'success');
            } else {
                showToast(data.message || 'Delete failed', 'error');
            }
        } catch (err) {
            showToast('Network error occurred', 'error');
        } finally {
            setDeleteModal({ show: false, id: null, type: null, title: '' });
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/admin/complaints/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                fetchComplaints();
                if (selected?._id === id) setSelected(data.complaint);
                showToast(`Status updated to ${status}`, 'success');
            }
        } catch (err) { console.error(err); }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const filtered = filter === 'All' ? complaints : complaints.filter(c => c.status === filter);
    const stats = {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'pending').length,
        received: complaints.filter(c => c.status === 'received').length,
        resolved: complaints.filter(c => c.status === 'resolved').length,
        users: users.length,
    };

    if (!isAuth) {
        return (
            <div className="login-screen">
                <div className="login-box">
                    <h1>🔐 Admin Portal</h1>
                    <p>Enter credentials to continue</p>
                    {error && <div className="error">{error}</div>}
                    <form onSubmit={handleLogin}>
                        <input type="text" placeholder="Username" value={creds.username} onChange={(e) => setCreds({ ...creds, username: e.target.value })} required />
                        <input type="password" placeholder="Password" value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} required />
                        <button type="submit">Login</button>
                    </form>
                    <small>Default: admin / admin123</small>
                </div>
            </div>
        );
    }

    return (
        <div className="admin">
            {toast.show && <div className={`toast ${toast.type}`}>{toast.message}</div>}

            {deleteModal.show && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-icon">⚠️</div>
                        <h3>Are you sure?</h3>
                        <p>You are about to delete <strong>{deleteModal.title}</strong>. This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setDeleteModal({ ...deleteModal, show: false })}>Cancel</button>
                            <button className="btn-confirm-delete" onClick={executeDelete}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <header className="admin-header">
                <div><h1>Admin Dashboard</h1><p>Complaint Management</p></div>
                <button onClick={handleLogout}>Logout</button>
            </header>

            <div className="stats">
                <div className="stat blue"><h3>{stats.total}</h3><p>Total</p></div>
                <div className="stat yellow"><h3>{stats.pending}</h3><p>Pending</p></div>
                <div className="stat purple"><h3>{stats.received}</h3><p>Recived</p></div>
                <div className="stat green"><h3>{stats.resolved}</h3><p>Resolved</p></div>
                <div className="stat pink"><h3>{stats.users}</h3><p>Users</p></div>
            </div>

            <div className="tabs">
                <button className={tab === 'complaints' ? 'active' : ''} onClick={() => setTab('complaints')}>Complaints</button>
                <button className={tab === 'approvals' ? 'active' : ''} onClick={() => setTab('approvals')}>Approvals {pendingUsers.length > 0 && <span className="badge-count">{pendingUsers.length}</span>}</button>
                <button className={tab === 'employees' ? 'active' : ''} onClick={() => setTab('employees')}>Employees</button>
            </div>

            <div className="content">
                {tab === 'complaints' && !selected && (
                    <>
                        <div className="header-row">
                            <h2>Complaints ({filtered.length})</h2>
                            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                                <option value="All">All</option>
                                <option value="pending">Pending</option>
                                <option value="received">Review</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        </div>
                        {filtered.length === 0 ? <div className="empty">No complaints found</div> : (
                            <table>
                                <thead>
                                    <tr><th>ID</th><th>Employee</th><th>Category</th><th>Priority</th><th>Status</th><th>Date</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {filtered.map(c => (
                                        <tr key={c._id}>
                                            <td>#{c.employeeNumber || 'N/A'}</td>
                                            <td><strong>{c.employeeName}</strong><br /><small>{c.employeeEmail}</small></td>
                                            <td><span className="badge">{c.category}</span></td>
                                            <td><span className="badge">{c.priority}</span></td>
                                            <td><span className={`status ${c.status}`}>{c.status}</span></td>
                                            <td>{formatDate(c.createdAt)}</td>
                                            <td>
                                                <button className="btn" onClick={() => setSelected(c)} style={{ marginRight: '5px' }}>View</button>
                                                <button className="btn-icon-delete" onClick={() => confirmDelete(c._id, 'complaint', `Complaint #${c.employeeNumber}`)}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                )}

                {tab === 'approvals' && (
                    <>
                        <div className="header-row"><h2>Pending User Approvals ({pendingUsers.length})</h2></div>
                        {pendingUsers.length === 0 ? <div className="empty">No pending approvals</div> : (
                            <table>
                                <thead><tr><th>Emp ID</th><th>Name</th><th>Email</th><th>Dept</th><th>Location</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {pendingUsers.map(u => (
                                        <tr key={u._id}>
                                            <td>#{u.employeeNumber}</td>
                                            <td><strong>{u.name}</strong></td>
                                            <td>{u.email}</td>
                                            <td><span className="badge">{u.department}</span></td>
                                            <td><span className="badge">{u.workLocation}</span></td>
                                            <td>
                                                <div className="approval-actions">
                                                    <button className="btn-approve" onClick={() => handleUserApproval(u._id, 'approved')}>✓</button>
                                                    <button className="btn-reject" onClick={() => handleUserApproval(u._id, 'rejected')}>✕</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                )}

                {tab === 'employees' && (
                    <>
                        <div className="header-row"><h2>All Employees ({users.length})</h2></div>
                        {users.length === 0 ? <div className="empty">No employees found</div> : (
                            <table>
                                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Dept</th><th>Location</th><th>Status</th><th>Action</th></tr></thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u._id}>
                                            <td>#{u.employeeNumber || 'N/A'}</td>
                                            <td><strong>{u.name}</strong></td>
                                            <td>{u.email}</td>
                                            <td><span className="badge">{u.department}</span></td>
                                            <td><span className="badge">{u.workLocation}</span></td>
                                            <td><span className={`status ${u.approvalStatus}`}>{u.approvalStatus}</span></td>
                                            <td>
                                                <button className="btn-icon-delete" onClick={() => confirmDelete(u._id, 'user', u.name)}>🗑️ Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                )}

                {tab === 'complaints' && selected && (
                    <div>
                        <button className="back" onClick={() => setSelected(null)}>← Back</button>
                        <div className="detail-header">
                            <div><h2>{selected.category}</h2><p>From {selected.employeeName} • {formatDate(selected.createdAt)}</p></div>
                            <div className="actions">
                                <button className="pending" onClick={() => updateStatus(selected._id, 'pending')}>Pending</button>
                                <button className="received" onClick={() => updateStatus(selected._id, 'received')}>Review</button>
                                <button className="resolved" onClick={() => updateStatus(selected._id, 'resolved')}>Resolved</button>
                                <button className="btn-reject" style={{ marginLeft: '10px' }} onClick={() => confirmDelete(selected._id, 'complaint', 'this complaint')}>Delete</button>
                            </div>
                        </div>
                        <div className="info-box">
                            <p><strong>Email:</strong> {selected.employeeEmail}</p>
                            <p><strong>Department:</strong> {selected.department}</p>
                            <p><strong>Priority:</strong> {selected.priority}</p>
                            <p><strong>Status:</strong> <span className={`status ${selected.status}`}>{selected.status}</span></p>
                        </div>
                        <div className="message-box"><h3>Complaint</h3><p>{selected.message}</p></div>
                    </div>
                )}
            </div>
        </div>
    );
}