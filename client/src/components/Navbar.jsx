import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import './Navbar.css';

export default function Navbar() {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="nav-container">
                {/* Logo */}
                <Link to="/" className="nav-logo">
                    <span className="logo-text">Complaint Box</span>
                </Link>

                {/* Desktop Links */}
                <div className="nav-links">
                    <Link to="/" className={isActive('/') ? 'nav-link active' : 'nav-link'}>
                        Home
                    </Link>
                    <Link to="/employee" className={isActive('/employee') ? 'nav-link active' : 'nav-link'}>
                        Employee
                    </Link>

                </div>

                {/* Mobile Menu Button */}
                <button
                    className="mobile-menu-btn"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="mobile-menu">
                    <Link
                        to="/"
                        className={isActive('/') ? 'mobile-link active' : 'mobile-link'}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Home
                    </Link>
                    <Link
                        to="/employee"
                        className={isActive('/employee') ? 'mobile-link active' : 'mobile-link'}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Employee
                    </Link>

                </div>
            )}
        </nav>
    );
}
