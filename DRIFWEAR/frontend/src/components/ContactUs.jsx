import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/ContactUs.css';

const ContactUs = ({ openAuthModal, currentUser, onSendMessage }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    subject: '',
    message: '',
    priority: 'medium',
    orderId: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = onSendMessage(formData);
      
      if (result) {
        setSuccess(true);
        setFormData({
          name: currentUser?.name || '',
          email: currentUser?.email || '',
          subject: '',
          message: '',
          priority: 'medium',
          orderId: ''
        });
        
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      } else {
        setError('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('An error occurred while sending your message.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="contact-page">
        <div className="container">
          <div className="contact-success">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h1>Message Sent Successfully!</h1>
            <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
            <div className="success-actions">
              <button 
                className="btn-primary"
                onClick={() => navigate('/')}
              >
                <i className="fas fa-home"></i>
                Back to Home
              </button>
              <button 
                className="btn-outline"
                onClick={() => setSuccess(false)}
              >
                <i className="fas fa-envelope"></i>
                Send Another Message
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-page">
      <div className="container">
        <div className="contact-header">
          <h1>Contact Us</h1>
          <p>We're here to help! Send us a message and we'll respond as soon as possible.</p>
        </div>

        <div className="contact-content">
          <div className="contact-info">
            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <h3>Email Us</h3>
              <p>support@driftwear.com</p>
              <span>We'll respond within 24 hours</span>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-phone"></i>
              </div>
              <h3>Call Us</h3>
              <p>+1 (555) 123-4567</p>
              <span>Mon-Fri from 9am to 6pm</span>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h3>Visit Us</h3>
              <p>123 Fashion Street</p>
              <span>New York, NY 10001</span>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-clock"></i>
              </div>
              <h3>Business Hours</h3>
              <p>Monday - Friday: 9:00 - 18:00</p>
              <span>Saturday: 10:00 - 16:00</span>
            </div>
          </div>

          <div className="contact-form-container">
            <div className="contact-form">
              <h2>Send us a Message</h2>
              
              {error && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder="What is this regarding?"
                    />
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Order Number (Optional)</label>
                  <input
                    type="text"
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleChange}
                    placeholder="If related to an order, enter order number"
                  />
                </div>

                <div className="form-group">
                  <label>Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Please describe your inquiry in detail..."
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i>
                        Send Message
                      </>
                    )}
                  </button>
                  
                  {!currentUser && (
                    <div className="auth-notice">
                      <p>You need to be logged in to send a message.</p>
                      <button 
                        type="button"
                        className="btn-outline"
                        onClick={() => openAuthModal('login')}
                      >
                        <i className="fas fa-sign-in-alt"></i>
                        Sign In
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;