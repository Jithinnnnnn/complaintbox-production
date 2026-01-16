import React from 'react';
import { Link } from 'react-router-dom';
import {
    ShieldCheck,
    FileText,
    Search,
    Bell,
    Lock,
    Users,
    ArrowRight,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import './Home.css';

export default function Home() {
    return (
        <div className="home-wrapper">



            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="trust-badge">
                        <Lock size={14} />
                        <span>100% Anonymous & Encrypted</span>
                    </div>
                    <h1 className="hero-title">
                        Speak Up <span className="highlight">Safely.</span>
                    </h1>
                    <p className="hero-description">
                        A secure platform to empower employees. Submit workplace concerns confidentially
                        and track resolutions in real-time
                    </p>
                    <div className="hero-buttons">
                        <Link to="/employee" className="btn-secondary">
                            File a Complaint
                        </Link>
                        <Link to="/status" className="btn-secondary">
                            Check Status
                        </Link>
                    </div>
                </div>

                {/* REPLACE your existing <div className="hero-image"> with this: */}
                <div className="hero-image">
                    <div className="stats-card">

                        {/* Window Header - Mac Style for Premium Look */}
                        <div className="stats-header">
                            <div className="header-title">
                                <div className="live-dot"></div>
                                <span>Live System Monitor</span>
                            </div>
                            <div className="window-controls">
                                <span className="win-btn close"></span>
                                <span className="win-btn min"></span>
                                <span className="win-btn max"></span>
                            </div>
                        </div>

                        {/* Top Row: Key Metrics (Data vs Labels) */}
                        <div className="status-grid">
                            {/* Metric 1 */}
                            <div className="status-item">
                                <div className="icon-wrapper blue">
                                    <FileText size={22} strokeWidth={2.5} />
                                </div>
                                <div className="status-text">
                                    <span className="label">Complaint</span>
                                    <span className="value">Submit Digitally</span>
                                </div>
                            </div>

                            {/* Metric 2 */}
                            <div className="status-item">
                                <div className="icon-wrapper green">
                                    <CheckCircle size={22} strokeWidth={2.5} />
                                </div>
                                <div className="status-text">
                                    <span className="label">Status</span>
                                    <span className="value">Get Status updates</span>
                                </div>
                            </div>

                            {/* Metric 3 */}
                            <div className="status-item">
                                <div className="icon-wrapper navy">
                                    <Lock size={22} strokeWidth={2.5} />
                                </div>
                                <div className="status-text">
                                    <span className="label">Security</span>
                                    <span className="value">100% confidentiality</span>
                                </div>
                            </div>
                        </div>

                        {/* Middle Section: Department Progress */}
                        <div className="department-section">


                            <div className="dept-row">
                                <div className="dept-header">
                                    <span>Submit, track, and resolve complaints</span>

                                </div>

                            </div>


                        </div>

                        {/* Floating "Toast" Notification */}
                        <div className="floating-toast">
                            <div className="toast-icon">
                                <CheckCircle size={18} color="white" strokeWidth={3} />
                            </div>
                            <div className="toast-content">
                                <strong>Complete Resolution</strong>
                                <span>Get your Complaint Resolved</span>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Instructions / Guidelines Section (New Request) */}
            <section className="instructions-section">
                <div className="section-header">
                    <h2>Submission Guidelines</h2>
                    <p>Please read these rules before filing a complaint to ensure a smooth process.</p>
                </div>

                <div className="guidelines-grid">
                    <div className="guideline-card">
                        <AlertCircle className="guideline-icon" />
                        <h3>Be Specific</h3>
                        <p>Provide detailed information about dates, times, and people involved to help us investigate.</p>
                    </div>
                    <div className="guideline-card">
                        <Users className="guideline-icon" />
                        <h3>Respect Privacy</h3>
                        <p>Do not include sensitive personal data of others unless absolutely necessary for the case.</p>
                    </div>
                    <div className="guideline-card">
                        <CheckCircle className="guideline-icon" />
                        <h3>Honesty Matters</h3>
                        <p>False accusations are taken seriously. Ensure your report is truthful and accurate.</p>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works">
                <div className="section-header">
                    <h2>Resolution Process</h2>
                    <p>We handle every case with care and speed.</p>
                </div>

                <div className="steps-container">
                    <div className="step-card">
                        <div className="step-number">01</div>
                        <div className="step-icon"><Users size={32} /></div>
                        <h3>Login securely</h3>
                        <p>Access the portal using your employee credentials. Your identity remains protected.</p>
                    </div>

                    <div className="step-card">
                        <div className="step-number">02</div>
                        <div className="step-icon"><FileText size={32} /></div>
                        <h3>Submit Details</h3>
                        <p>Choose category and priority. Describe the issue clearly for faster resolution.</p>
                    </div>

                    <div className="step-card">
                        <div className="step-number">03</div>
                        <div className="step-icon"><Search size={32} /></div>
                        <h3>HR Review</h3>
                        <p>HR reviews the case within 24-48 hours and initiates an impartial investigation.</p>
                    </div>

                    <div className="step-card">
                        <div className="step-number">04</div>
                        <div className="step-icon"><Bell size={32} /></div>
                        <h3>Resolution</h3>
                        <p>Receive updates in your dashboard. Once resolved, the case is closed.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-section">
                        <div className="logo footer-logo">
                            <ShieldCheck size={24} />
                            <span>ComplaintBox</span>
                        </div>
                        <p>Commitment to a safer, happier workplace.</p>
                    </div>
                    <div className="footer-section">
                        <h4>Contact Support</h4>
                        <p>muhammed8921aslam@gmail.com</p>
                        <p>Mon-Fri: 9:00 AM - 6:00 PM</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2025 Complaint Box.</p>
                </div>
            </footer>
        </div>
    );
}