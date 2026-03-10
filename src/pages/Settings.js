/* src/pages/Settings.js */
import React, { useState, useRef, useEffect } from 'react';
import api from '../api/client';
import '../styles/Settings.css';
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState({
    name: '',
    email: '',
    bio: '',
    notifications: true
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
    fetchAvatar();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await api.get('/users/me');
      if (res.data) {
        setUser({
          name: res.data.name || '',
          email: res.data.email || '',
          bio: res.data.bio || '',
          notifications: res.data.notifications !== false
        });
      }
    } catch (err) {
      console.error("Failed to load user data", err);
    }
  };

  const fetchAvatar = async () => {
    try {
      const response = await api.get(`/users/me/avatar?t=${Date.now()}`, { responseType: 'blob' });
      if (response.data && response.data.size > 0) {
        setAvatarUrl(URL.createObjectURL(response.data));
      }
    } catch (error) {
      // It's normal if no avatar exists yet
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("File is too large. Max 2MB.", "danger");
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast("Profile photo updated!");
      fetchAvatar();
    } catch (error) {
      showToast("Failed to upload photo.", "danger");
      console.error(error);
    }
  };

  const handlePhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/users/me', {
        name: user.name,
        bio: user.bio,
        notifications: user.notifications
      });
      showToast("Profile settings updated successfully!");
    } catch (err) {
      showToast("Failed to update profile settings.", "danger");
      console.error(err);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) {
      showToast("Please fill in both password fields.", "danger");
      return;
    }
    try {
      await api.patch('/users/me/password', passwords);
      showToast("Password updated securely!");
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update password.";
      showToast(msg, "danger");
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/users/me');
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.setItem("eventlys_isLoggedIn", "false");
      localStorage.setItem("eventlys_userRole", "user");
      localStorage.removeItem("userId");
      window.location.href = "/login";
    } catch (err) {
      showToast("Failed to delete account.", "danger");
      console.error(err);
    }
  };

  const handleNotificationChange = async (type, value) => {
    // We only have one single generic 'notifications' column in the schema.
    const newNotificationsState = value;
    setUser(prev => ({ ...prev, notifications: newNotificationsState }));
    try {
      await api.patch('/users/me', { notifications: newNotificationsState });
      showToast("Notification preferences updated.");
    } catch (err) {
      showToast("Failed to update preferences.", "danger");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
    <div className="settings-container animate-up">
      {/* --- PREMIUM TOAST NOTIFICATION --- */}
      {toast.show && (
        <div className={`settings-toast ${toast.type} animate-slide-in`}>
          <span className="toast-dot"></span>
          {toast.message}
        </div>
      )}

      <header className="settings-header">
        <h1 className="cinzel-font">Account <span>Settings</span></h1>
        <p>Manage your profile and platform preferences</p>
      </header>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} 
            onClick={() => setActiveTab('profile')}
          >
            <i className="far fa-user"></i> Public Profile
          </button>
          <button 
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} 
            onClick={() => setActiveTab('security')}
          >
            <i className="fas fa-shield-alt"></i> Security
          </button>
          <button 
            className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} 
            onClick={() => setActiveTab('notifications')}
          >
            <i className="far fa-bell"></i> Notifications
          </button>
        </aside>

        <main className="settings-content glass-panel">
          {activeTab === 'profile' && (
            <div className="tab-pane fade-in">
              <h3 className="cinzel-font">Profile <span>Details</span></h3>
              <form onSubmit={handleUpdate}>
                <div className="profile-upload">
                  <div className="avatar-placeholder">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'
                    )}
                  </div>
                  <div className="upload-controls">
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      style={{ display: 'none' }} 
                    />
                    <button type="button" className="btn-avatar-gold" onClick={handlePhotoClick}>Change Photo</button>
                    <p className="upload-hint">JPG or PNG. Max 1MB.</p>
                  </div>
                </div>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={user.name} onChange={(e) => setUser({...user, name: e.target.value})} placeholder="Enter your full name" />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={user.email} disabled style={{opacity: 0.6, cursor: "not-allowed"}} title="Email cannot be changed" />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea rows="4" value={user.bio} onChange={(e) => setUser({...user, bio: e.target.value})} />
                </div>
                <button type="submit" className="btn-auth-main">Save Changes</button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="tab-pane fade-in">
              <h3 className="cinzel-font">Security <span>Settings</span></h3>
              <form onSubmit={handleUpdatePassword}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    placeholder="Enter new password" 
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  />
                </div>
                <button type="submit" className="btn-auth-main">Update Password</button>
              </form>

              <div className="danger-zone">
                <h4 className="danger-title">Danger Zone</h4>
                <p>Once you delete your account, there is no going back. Please be certain.</p>
                
                {showConfirmDelete ? (
                  <div className="confirm-actions animate-pulse">
                    <button className="btn-delete-confirm" onClick={handleDeleteAccount}>Confirm Permanent Delete</button>
                    <button className="btn-text-cancel" onClick={() => setShowConfirmDelete(false)}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn-delete-account" onClick={() => setShowConfirmDelete(true)}>
                    Delete Account
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="tab-pane fade-in">
              <h3 className="cinzel-font">Email <span>Preferences</span></h3>
              <div className="pref-row">
                <div>
                  <h4>Event & Account Reminders</h4>
                  <p>Get notified about upcoming events and important updates.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={user.notifications} 
                  onChange={(e) => handleNotificationChange('all', e.target.checked)} 
                />
              </div>
              
              <div className="pref-row" style={{opacity: 0.5}}>
                <div>
                  <h4>Newsletter (Coming Soon)</h4>
                  <p>Receive weekly updates on new premium events.</p>
                </div>
                <input type="checkbox" disabled />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
    </motion.div>
  );
};

export default Settings;