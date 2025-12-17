import { Navigate } from 'react-router-dom';

/**
 * Protected Route Component
 * Prevents unauthorized access to admin pages
 */
export const AdminRoute = ({ children }) => {
    const adminToken = localStorage.getItem('adminToken');

    // If no admin token, redirect to home
    if (!adminToken) {
        return <Navigate to="/" replace />;
    }

    return children;
};

/**
 * Employee Route Component
 * Prevents unauthenticated access to employee pages
 */
export const EmployeeRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    // If no token, redirect to login
    if (!token) {
        return <Navigate to="/" replace />;
    }

    return children;
};

/**
 * Public Route Component
 * Redirects authenticated users away from login page
 */
export const PublicRoute = ({ children }) => {
    const adminToken = localStorage.getItem('adminToken');
    const employeeToken = localStorage.getItem('token');

    // If admin is logged in, redirect to admin dashboard
    if (adminToken) {
        return <Navigate to="/admin" replace />;
    }

    // If employee is logged in, redirect to employee page
    if (employeeToken) {
        return <Navigate to="/employee" replace />;
    }

    return children;
};
