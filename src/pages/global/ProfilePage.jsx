import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import TeacherBottomNav from "../../components/teacher/TeacherBottomNav";

const ProfilePage = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const userName = user?.name || "Student User";
  const userRole = user?.role === "student" ? "Student" : "Teacher";
  const userIndex = user?.index || "20230541"; 

  const handleLogout = () => {
    logout();
  };
  
  const goToSchedule = () => navigate(user?.role === "teacher" ? "/teacher/schedule" : "/student/schedule");
  const goToStats = () => navigate(user?.role === "teacher" ? "/teacher/stats" : "/student/stats");
  const goToHome = () => navigate(user?.role === "teacher" ? "/teacher" : "/student");

  return (
    <div className="app-container">
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2rem 1.5rem 1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Profil</h1>
        <button className="icon-btn" style={{ background: 'rgba(244, 89, 37, 0.1)' }}>
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      {/* Profile Info Section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '1rem 0 0' }}>{userName}</h2>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>{userRole === 'Student' ? `Nr indeksu: ${userIndex}` : userRole}</p>
      </div>


      {/* Preferences */}
      <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '0.75rem', marginLeft: '0.25rem', marginTop: 0 }}>Ustawienia</h3>
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          
          {[
            { icon: "person", text: "Ustawienia konta" },
            { icon: "notifications", text: "Powiadomienia" },
            { icon: "verified_user", text: "Polityka prywatności" },
            { icon: "help", text: "Pomoc i wsparcie" }
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
      <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
        <button className="btn-white" onClick={handleLogout} style={{ 
          background: 'var(--color-primary)', color: 'white', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem',
          boxShadow: '0 10px 15px -3px rgba(244, 89, 37, 0.2)'
        }}>
          <span className="material-symbols-outlined">logout</span>
          <span>Wyloguj się</span>
        </button>
      </div>

      {user?.role === "teacher" ? (
        <TeacherBottomNav />
      ) : (
        <nav className="bottom-nav-stitch">
          <button className="nav-item" onClick={goToHome}>
            <span className="material-symbols-outlined">home</span>
            Główna
          </button>
          <button className="nav-item" onClick={goToSchedule}>
            <span className="material-symbols-outlined">calendar_month</span>
            Plan
          </button>
          <button className="nav-item" onClick={goToStats}>
            <span className="material-symbols-outlined">bar_chart</span>
            Statystyki
          </button>
          <button className="nav-item active">
            <span className="material-symbols-outlined fill">person</span>
            Profil
          </button>
        </nav>
      )}
    </div>
  );
};

export default ProfilePage;