import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock } from 'lucide-react';
import './RegisterModal.css';

const RegisterModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true); // Default to login
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setFormData(prev => ({ ...prev, password: '' }));
      setIsLogin(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          setMessage('Login successful!');
          localStorage.setItem('token', data.token);
          // Pass user data to App.jsx
          if (onLoginSuccess) onLoginSuccess(data.user);
          setTimeout(() => onClose(), 1000);
        } else {
          setMessage('Registration successful! Please login.');
          // Switch to login view
          setIsLogin(true);
          // Clear password but keep email
          setFormData(prev => ({ ...prev, password: '' }));
        }
      } else {
        setMessage(data.message || 'Authentication failed');
      }
    } catch (error) {
      setMessage('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setMessage('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glassmorphism">
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
        <h2>{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
        <p className="subtitle">
          {isLogin ? 'Login to view your saved routes.' : 'Join Smart Logistics to save your routes.'}
        </p>
        
        {message && <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>{message}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <User className="input-icon" size={18} />
              <input 
                type="text" 
                name="username" 
                placeholder="Username" 
                required={!isLogin}
                value={formData.username}
                onChange={handleChange}
              />
            </div>
          )}
          <div className="input-group">
            <Mail className="input-icon" size={18} />
            <input 
              type="email" 
              name="email" 
              placeholder="Email" 
              required 
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="input-group">
            <Lock className="input-icon" size={18} />
            <input 
              type="password" 
              name="password" 
              placeholder="Password" 
              required 
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register Now')}
          </button>
        </form>

        <p className="toggle-text">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span className="toggle-link" onClick={toggleMode}>
            {isLogin ? 'Register here' : 'Login here'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default RegisterModal;
