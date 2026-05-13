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
      const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          setMessage('เข้าสู่ระบบสำเร็จ!');
          localStorage.setItem('token', data.token);
          // Pass user data to App.jsx
          if (onLoginSuccess) onLoginSuccess(data.user);
          setTimeout(() => onClose(), 1000);
        } else {
          setMessage('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
          // Switch to login view
          setIsLogin(true);
          // Clear password but keep email
          setFormData(prev => ({ ...prev, password: '' }));
        }
      } else {
        setMessage(data.message || 'การยืนยันตัวตนล้มเหลว');
      }
    } catch (error) {
      setMessage('เกิดข้อผิดพลาดเครือข่าย กรุณาลองใหม่');
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
        <h2>{isLogin ? 'ยินดีต้อนรับกลับ' : 'สร้างบัญชีใหม่'}</h2>
        <p className="subtitle">
          {isLogin ? 'เข้าสู่ระบบเพื่อดูเส้นทางที่บันทึกไว้' : 'เข้าร่วม Smart Logistics เพื่อบันทึกเส้นทางของคุณ'}
        </p>
        
        {message && <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>{message}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <User className="input-icon" size={18} />
              <input 
                type="text" 
                name="username" 
                placeholder="ชื่อผู้ใช้" 
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
              placeholder="อีเมล" 
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
              placeholder="รหัสผ่าน" 
              required 
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'กำลังดำเนินการ...' : (isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')}
          </button>
        </form>

        <p className="toggle-text">
          {isLogin ? 'ยังไม่มีบัญชี? ' : 'มีบัญชีอยู่แล้ว? '}
          <span className="toggle-link" onClick={toggleMode}>
            {isLogin ? 'สมัครสมาชิกที่นี่' : 'เข้าสู่ระบบที่นี่'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default RegisterModal;
