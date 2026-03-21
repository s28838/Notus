import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { apiGet, apiPost } from "../../services/api";

const TeacherDashboard = () => {
  const { user, getToken } = useContext(AuthContext);
  const firstName = (user?.name || "Teacher").split(" ")[0];
  const navigate = useNavigate();
  
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  // QR States for inline display
  const [qr, setQr] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [errorQr, setErrorQr] = useState("");

  useEffect(() => {
    const fetchTodaySchedule = async () => {
      try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        
        let query = supabase
          .from('schedule')
          .select('*')
          .gte('date', startOfDay.toISOString())
          .lte('date', endOfDay.toISOString())
          .order('time', { ascending: true });
          
        if (user?.name) {
          query = query.ilike('teacher', `%${user.name}%`);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        if (data && data.length > 0) {
          const now = new Date();
          const currentTime = now.getHours() * 60 + now.getMinutes();
          
          let found = null;
          for (const l of data) {
            if (!l.time) continue;
            const [start] = l.time.split(" - ");
            const [startH, startM] = start.split(":").map(Number);
            const startTime = startH * 60 + startM;
            
            if (currentTime >= startTime - 30) {
                found = l;
            }
          }
          setCurrentLesson(found || data[0]);
        }
      } catch (err) {
        console.error("Dashboard schedule error:", err);
      } finally {
        setLoadingSchedule(false);
      }
    };

    if (user?.name) {
      fetchTodaySchedule();
    }
  }, [user]);

  const handleGenerateQr = async () => {
    if (!currentLesson) return;
    
    setLoadingQr(true);
    setErrorQr("");
    
    try {
      const token = await getToken();
      const sessionTitle = `${currentLesson.subject} (${currentLesson.time})`;
      
      const created = await apiPost("/api/attendance/sessions", { title: sessionTitle }, token);
      const qrResp = await apiGet(`/api/attendance/sessions/${created.sessionId}/qr`, token);
      setQr(qrResp);
    } catch (err) {
      console.error("QR Generation Error:", err);
      setErrorQr("Nie udało się wygenerować kodu.");
    } finally {
      setLoadingQr(false);
    }
  };

  const goToProfile = () => navigate("/teacher/profile");
  const goToSchedule = () => navigate("/teacher/schedule");
  const goToCreateSession = () => navigate("/teacher/create-session");
  const goToHistory = () => navigate("/teacher/stats");

  return (
    <div className="app-container">
      {/* Header */}
      <div className="top-bar">
        <div className="icon-btn" style={{ background: 'rgba(244, 89, 37, 0.1)', cursor: 'default' }}>
          <span className="material-symbols-outlined text-primary">shield_person</span>
        </div>
        <h2 className="top-bar-title">Teacher Hub</h2>
        <button className="icon-btn" style={{ background: 'transparent', color: 'var(--text-primary)'}}>
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>

      {/* Hero Card - Create Session */}
      <div className="hero-card" style={{ padding: qr ? '1.5rem' : '2rem' }}>
        {qr ? (
           /* Inline QR View */
           <div style={{ zIndex: 10, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: 'white', padding: '0.75rem', borderRadius: '1rem', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                <img 
                   src={`data:image/png;base64,${qr.qrPngBase64}`} 
                   alt="QR" 
                   style={{ width: '160px', height: '160px', display: 'block' }} 
                />
              </div>
              <p style={{ 
                marginTop: '0.75rem', fontWeight: 700, fontSize: '0.875rem', 
                color: 'white', letterSpacing: '0.05em', textAlign: 'center', 
                width: '100%', wordBreak: 'break-all', padding: '0 1rem', boxSizing: 'border-box' 
              }}>
                KOD: {qr.qrToken}
              </p>
              <button 
                onClick={() => setQr(null)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.5rem', cursor: 'pointer' }}
              >
                Zamknij
              </button>
           </div>
        ) : (
           /* Default CTA View */
           <>
            <div className="hero-card-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>add_box</span>
            </div>
            <div>
              <h1 className="hero-card-title">Pokaż kod dla zajęć</h1>
              <p className="hero-card-subtitle">
                {loadingSchedule ? "Ładowanie planu..." : (
                  currentLesson ? (
                    <>
                      <span style={{ fontWeight: 700, opacity: 0.9 }}>Teraz: </span>
                      {currentLesson.subject} ({currentLesson.time})
                    </>
                  ) : "Brak zajęć na dziś"
                )}
              </p>
              {errorQr && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', margin: '0.25rem 0 0 0' }}>{errorQr}</p>}
            </div>
            <button className="btn-white" onClick={handleGenerateQr} disabled={loadingQr || !currentLesson}>
              {loadingQr ? "Generuję..." : "Generuj kod QR"}
            </button>
           </>
        )}
        
        {/* Abstract Background Pattern elements */}
        <div style={{ position: 'absolute', top: 0, right: 0, marginRight: '-4rem', marginTop: '-4rem', width: '12rem', height: '12rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, marginLeft: '-2rem', marginBottom: '-2rem', width: '8rem', height: '8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
      </div>

      {/* Stats Overview */}
      <div className="stats-card glass-card" style={{ margin: '0 1rem', padding: '1rem', border: '1px solid var(--border-light)' }}>
        <div className="stats-header">
          <p className="stats-title">
            <span className="material-symbols-outlined text-primary">groups</span>
            Średnia Frekwencja
          </p>
          <p className="stats-value">84%</p>
        </div>
        <div className="progress-track" style={{ marginBottom: '0.75rem' }}>
          <div className="progress-fill" style={{ width: '84%' }}></div>
        </div>
        <div className="stats-footer">
          <p className="stats-target" style={{ margin: 0 }}>Oczekiwana: 75%</p>
          <p className="stats-above" style={{ margin: 0, color: '#16a34a' }}>+9% powyżej normy</p>
        </div>
      </div>

      {/* Quick Actions (Replacing Next Classes) */}
      <h3 className="section-title">Narzędzia</h3>
      <div className="list-container">
        
        {/* Plan Zajęć */}
        <div className="list-item" onClick={goToSchedule} style={{ cursor: 'pointer' }}>
          <div className="list-item-content">
            <h4 className="list-item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.25rem' }}>calendar_month</span>
              Twój Plan Zajęć
            </h4>
            <div className="list-item-details">
              <div className="detail-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>schedule</span>
                <p style={{ margin: 0 }}>Zobacz harmonogram</p>
              </div>
            </div>
          </div>
          <div className="list-item-action">
            <span className="material-symbols-outlined">chevron_right</span>
          </div>
        </div>

        {/* Historia Zajęć */}
        <div className="list-item" onClick={goToHistory} style={{ cursor: 'pointer' }}>
          <div className="list-item-content">
            <h4 className="list-item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined text-slate-500" style={{ fontSize: '1.25rem' }}>history</span>
              Historia Sesji
            </h4>
            <div className="list-item-details">
              <div className="detail-pill">
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>fact_check</span>
                <p style={{ margin: 0 }}>Przeglądaj frekwencję</p>
              </div>
            </div>
          </div>
          <div className="list-item-action" style={{ background: 'var(--border-light)', color: 'var(--text-secondary)' }}>
            <span className="material-symbols-outlined">chevron_right</span>
          </div>
        </div>

      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav-stitch">
        <button className="nav-item active" onClick={() => navigate("/teacher")}>
          <span className="material-symbols-outlined fill">home</span>
          Główna
        </button>
        <button className="nav-item" onClick={goToSchedule}>
          <span className="material-symbols-outlined">calendar_month</span>
          Plan
        </button>
        <button className="nav-item" onClick={goToHistory}>
          <span className="material-symbols-outlined">bar_chart</span>
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

export default TeacherDashboard;