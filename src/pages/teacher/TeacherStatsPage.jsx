import React from "react";
import { useNavigate } from "react-router-dom";

const TeacherStatsPage = () => {
  const navigate = useNavigate();

  const goToHome = () => navigate("/teacher");
  const goToCreateSession = () => navigate("/teacher/create-session");
  const goToSchedule = () => navigate("/teacher/schedule");
  const goToProfile = () => navigate("/teacher/profile");

  return (
    <div className="app-container" style={{ paddingBottom: '0' }}>
      {/* Header */}
      <div className="top-bar">
        <button className="icon-btn" onClick={() => navigate(-1)} style={{ background: 'transparent', color: 'var(--text-primary)' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="top-bar-title" style={{ marginRight: '2.5rem' }}>Raporty i Statystyki</h2>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '1rem' }}>
        <div style={{ flex: '1', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderRadius: '0.75rem', padding: '1.25rem', background: 'rgba(244, 89, 37, 0.05)', border: '1px solid rgba(244, 89, 37, 0.1)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>Średnia Frekwencja</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
            <p style={{ color: 'var(--color-primary)', fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>84%</p>
            <span style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 700 }}>+9.0%</span>
          </div>
        </div>
        
        <div className="glass-card" style={{ flex: '1', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>Zagrożeni Studenci</p>
          <p style={{ color: '#ef4444', fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>12</p>
        </div>
        
        <div className="glass-card" style={{ flex: '1', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>Przeprowadzone Zajęcia</p>
          <p style={{ color: 'var(--text-primary)', fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>28</p>
        </div>
      </div>


      {/* Subject Breakdown */}
      <section style={{ padding: '1rem', paddingBottom: '6rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', marginTop: 0 }}>Frekwencja na Przedmiotach</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          {/* Subject Items */}
          {[
            { name: "Bazy Danych (L)", att: "128/150", pct: 85, icon: "dataset", color: "#f97316", bg: "#ffedd5" },
            { name: "Algorytmy (W)", att: "210/250", pct: 84, icon: "account_tree", color: "#2563eb", bg: "#dbeafe" },
            { name: "Sieci Komputerowe (C)", att: "28/30", pct: 93, icon: "router", color: "#16a34a", bg: "#dcfce3" },
            { name: "Podstawy Programowania", att: "180/200", pct: 90, icon: "terminal", color: "#9333ea", bg: "#f3e8ff" }
          ].map((subj, i) => (
            <div key={i} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: subj.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: subj.color }}>{subj.icon}</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700 }}>{subj.name}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Obecnych: {subj.att}</p>
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
          Główna
        </button>
        <button className="nav-item" onClick={goToSchedule}>
          <span className="material-symbols-outlined">calendar_month</span>
          Plan
        </button>
        <button className="nav-item active">
          <span className="material-symbols-outlined fill">bar_chart</span>
          Staty
        </button>
        <button className="nav-item" onClick={goToProfile}>
          <span className="material-symbols-outlined">person</span>
          Profil
        </button>
      </nav>
    </div>
  );
};

export default TeacherStatsPage;
