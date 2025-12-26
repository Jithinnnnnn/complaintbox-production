import axios from 'axios';

const api = axios.create({
    // ✅ Change this to a relative path.
    // This works automatically on Localhost AND Azure!
    baseURL: '/api',
});
// Request interceptor - Add token to all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor - Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear tokens and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('adminToken');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;
