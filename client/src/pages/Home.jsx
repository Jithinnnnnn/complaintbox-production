import './Home.css';
import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="home-wrapper">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div style={{ height: '60px' }}></div>
                    <h1 className="hero-title">
                        Digital <span className="highlight">Complaint Box</span>
                    </h1>
                    <p className="hero-description">
                        A simple and efficient platform to empower employees.
                        Submit workplace concerns confidentially and track resolutions in real-time.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/employee" className="btn-secondary">File a Complaint</Link>
                        <Link to="/employee" className="btn-secondary">Check Status</Link>
                    </div>
                </div>
                <div className="hero-image">
                    <div className="hero-illustration">📋</div>
                </div>
            </section>

            {/* How It Works */}

            <section className="how-it-works">
                <div style={{ height: '35px' }}></div>
                <h2 className="section-title"> </h2>
                <h2 className="section-title">Track and resolve in 4 easy steps</h2>
                <div style={{ height: '60px' }}></div>


                <div className="steps-container">
                    <div className="step-card">
                        <div className="step-number">1</div>
                        <div className="step-icon">👤</div>
                        <h3>Register/Login</h3>
                        <p>Create your account using your employee credentials. All data is encrypted and protected.</p>
                    </div>

                    <div className="step-card">
                        <div className="step-number">2</div>
                        <div className="step-icon">📝</div>
                        <h3>Submit Complaint</h3>
                        <p>Choose category and priority level. Describe your concern in detail for faster resolution.</p>
                    </div>

                    <div className="step-card">
                        <div className="step-number">3</div>
                        <div className="step-icon">🔍</div>
                        <h3>HR Reviews</h3>
                        <p>HR team reviews your complaint within 24-48 hours and initiates the investigation process.</p>
                    </div>

                    <div className="step-card">
                        <div className="step-number">4</div>
                        <div className="step-icon">✅</div>
                        <h3>Track & Resolve</h3>
                        <p>Monitor real-time status updates and receive resolution notifications in your dashboard.</p>
                    </div>
                </div>
            </section>



            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <h4>Complaint Box</h4>
                        <p>Leading automotive dealership committed to employee welfare and workplace satisfaction.</p>
                        <Link to="/admin"> Portal</Link>
                    </div>
                    <div className="footer-section">
                        <h4>Contact HR</h4>
                        <p>📧muhammed8921aslam@gmail.com</p>
                        <p>🕒 Mon-Sat: 9:00 AM - 6:00 PM</p>

                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2025 Complaint Box. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
