import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/AdminLogin.css';

const AdminLogin = ({ onAdminLogin, currentAdmin }) => {
  const [formData, setFormData] = useState({
    email: 'admin@driftwear.com',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentAdmin) {
      navigate('/admin');
    }
  }, [currentAdmin, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowSuccess(false);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Hardcoded admin credentials
      if (formData.email === 'admin@driftwear.com' && formData.password === 'admin123') {
        setShowSuccess(true);
        
        // Brief success display before navigation
        setTimeout(() => {
          const adminData = {
            id: '1',
            name: 'Super Admin',
            email: formData.email,
            role: 'super_admin',
            loginTime: new Date().toISOString()
          };

          // Store admin data in localStorage
          localStorage.setItem('driftwear_admin', JSON.stringify(adminData));
          
          // Call the onAdminLogin callback if provided
          if (onAdminLogin) {
            onAdminLogin(adminData);
          }
          
          // Redirect to admin dashboard
          navigate('/admin');
        }, 800);
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = () => {
    // In a real app, this would trigger a password reset flow
    alert('Password reset instructions would be sent to admin@driftwear.com in a production environment.');
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-logo">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h1>Admin Portal</h1>
            <p>Secure access to Driftwear Dashboard</p>
          </div>
          
          {showSuccess && (
            <div className="admin-success-message">
              <i className="fas fa-check-circle"></i>
              Login successful! Redirecting to dashboard...
            </div>
          )}

          {error && (
            <div className="admin-error-message">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <i className="fas fa-envelope"></i>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="admin@driftwear.com"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <i className="fas fa-lock"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button 
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="admin-login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Authenticating...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  Sign In to Dashboard
                </>
              )}
            </button>
          </form>

          <div className="admin-login-info">
            <h3>
              <i className="fas fa-info-circle"></i>
              Test Credentials
            </h3>
            <div className="credentials">
              <p>
                <i className="fas fa-user-circle"></i>
                <strong>Email:</strong> admin@driftwear.com
              </p>
              <p>
                <i className="fas fa-key"></i>
                <strong>Password:</strong> admin123
              </p>
            </div>
          </div>

          <div className="admin-login-footer">
            <button 
              onClick={() => navigate('/')}
              className="back-to-store-btn"
              disabled={loading}
            >
              <i className="fas fa-arrow-left"></i>
              Back to Storefront
            </button>
            
            <a 
              href="#" 
              className="forgot-password" 
              onClick={handleForgotPassword}
            >
              <i className="fas fa-question-circle"></i>
              Forgot Password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;