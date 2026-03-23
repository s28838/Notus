import React from "react";
import { useNavigate } from "react-router-dom";

const StatsPage = () => {
  const navigate = useNavigate();

  const goToProfile = () => navigate("/student/profile");
  const goToSchedule = () => navigate("/student/schedule");
  const goToHome = () => navigate("/student");

  return (
    <div className="app-container" style={{ paddingBottom: '0' }}>
      {/* Header */}
      <div className="top-bar">
        <button className="icon-btn" onClick={() => navigate(-1)} style={{ background: 'transparent', color: 'var(--text-primary)' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="top-bar-title" style={{ marginRight: '2.5rem' }}>Attendance Stats</h2>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '1rem' }}>
        <div style={{ flex: '1', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderRadius: '0.75rem', padding: '1.25rem', background: 'rgba(244, 89, 37, 0.05)', border: '1px solid rgba(244, 89, 37, 0.1)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>Overall Attendance</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
            <p style={{ color: 'var(--color-primary)', fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>92%</p>
            <span style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 700 }}>+2.4%</span>
          </div>
        </div>
        
        <div className="glass-card" style={{ flex: '1', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>Classes Attended</p>
          <p style={{ color: 'var(--text-primary)', fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>46</p>
        </div>
        
        <div className="glass-card" style={{ flex: '1', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>Classes Missed</p>
          <p style={{ color: 'var(--text-primary)', fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>4</p>
        </div>
      </div>


      {/* Subject Breakdown */}
      <section style={{ padding: '1rem', paddingBottom: '6rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', marginTop: 0 }}>Subject Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          {/* Subject Items */}
          {[
            { name: "Advanced Mathematics", att: "12/13", pct: 94, icon: "functions", color: "#f97316", bg: "#ffedd5" },
            { name: "Quantum Physics", att: "10/12", pct: 83, icon: "science", color: "#2563eb", bg: "#dbeafe" },
            { name: "English Literature", att: "15/15", pct: 100, icon: "language", color: "#16a34a", bg: "#dcfce3" },
            { name: "World History", att: "9/11", pct: 81, icon: "history_edu", color: "#9333ea", bg: "#f3e8ff" }
          ].map((subj, i) => (
            <div key={i} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: subj.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: subj.color }}>{subj.icon}</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700 }}>{subj.name}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{subj.att} classes attended</p>
                  </div>
                </div>
                <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{subj.pct}%</span>
              </div>
              <div style={{ width: '100%', background: 'var(--border-light)', height: '0.5rem', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ background: 'var(--color-primary)', height: '100%', width: `${subj.pct}%`, borderRadius: '999px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Nav */}
      <nav className="bottom-nav-stitch">
        <button className="nav-item" onClick={goToHome}>
          <span className="material-symbols-outlined">home</span>
          Home
        </button>
        <button className="nav-item" onClick={goToSchedule}>
          <span className="material-symbols-outlined">calendar_month</span>
          Schedule
        </button>
        <button className="nav-item active">
          <span className="material-symbols-outlined fill">bar_chart</span>
          Stats
        </button>
        <button className="nav-item" onClick={goToProfile}>
          <span className="material-symbols-outlined">person</span>
          Profile
        </button>
      </nav>
    </div>
  );
};

export default StatsPage;
