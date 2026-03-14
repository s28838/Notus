import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const userName = user?.name || "Student User";
  const userRole = user?.role === "student" ? "Student" : "Teacher";
  const userIndex = user?.index || "20230541"; 

  const handleLogout = () => {
    logout();
  };
  
  const handleBack = () => navigate(-1);
  const goToSchedule = () => navigate(user?.role === "teacher" ? "/teacher/schedule" : "/student/schedule");
  const goToStats = () => navigate(user?.role === "teacher" ? "/teacher/stats" : "/student/stats");
  const goToHome = () => navigate(user?.role === "teacher" ? "/teacher" : "/student");

  return (
    <div className="app-container" style={{ paddingBottom: '0' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2rem 1.5rem 1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Profile</h1>
        <button className="icon-btn" style={{ background: 'rgba(244, 89, 37, 0.1)' }}>
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      {/* Profile Info Section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '1rem 0 0' }}>{userName}</h2>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>{userRole === 'Student' ? `Student ID: ${userIndex}` : userRole}</p>
      </div>

      {/* Academic Information */}
      <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '0.75rem', marginLeft: '0.25rem', marginTop: 0 }}>Academic Information</h3>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: 'rgba(244, 89, 37, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
              <span className="material-symbols-outlined">school</span>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>Department</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Computer Science & AI</p>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: 'rgba(244, 89, 37, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
              <span className="material-symbols-outlined">calendar_today</span>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>Academic Year</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>3rd Year, Semester 2</p>
            </div>
          </div>

        </div>
      </div>

      {/* Preferences */}
      <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '0.75rem', marginLeft: '0.25rem', marginTop: 0 }}>Preferences</h3>
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          
          {[
            { icon: "person", text: "Account Settings" },
            { icon: "notifications", text: "Notification Preferences" },
            { icon: "verified_user", text: "Privacy Policy" },
            { icon: "help", text: "Help & Support" }
          ].map((pref, i) => (
            <button key={i} style={{ 
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              padding: '1rem', background: 'transparent', border: 'none', 
              borderBottom: i < 3 ? '1px solid var(--border-light)' : 'none',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="material-symbols-outlined text-slate-500">{pref.icon}</span>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{pref.text}</span>
              </div>
              <span className="material-symbols-outlined text-slate-500">chevron_right</span>
            </button>
          ))}

        </div>
      </div>

      {/* Logout */}
      <div style={{ padding: '0 1.5rem', marginBottom: '8rem' }}>
        <button className="btn-white" onClick={handleLogout} style={{ 
          background: 'var(--color-primary)', color: 'white', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem',
          boxShadow: '0 10px 15px -3px rgba(244, 89, 37, 0.2)'
        }}>
          <span className="material-symbols-outlined">logout</span>
          <span>Log Out</span>
        </button>
      </div>

      {/* Bottom Nav Bar */}
      <nav className="bottom-nav-stitch">
        <button className="nav-item" onClick={goToHome}>
          <span className="material-symbols-outlined">home</span>
          {user?.role === "teacher" ? "Główna" : "Home"}
        </button>
        <button className="nav-item" onClick={goToSchedule}>
          <span className="material-symbols-outlined">calendar_month</span>
          {user?.role === "teacher" ? "Plan" : "Schedule"}
        </button>
        <button className="nav-item" onClick={goToStats}>
          <span className="material-symbols-outlined">bar_chart</span>
          {user?.role === "teacher" ? "Staty" : "Stats"}
        </button>
        <button className="nav-item active">
          <span className="material-symbols-outlined fill">person</span>
          {user?.role === "teacher" ? "Profil" : "Profile"}
        </button>
      </nav>
    </div>
  );
};

export default ProfilePage;