import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TeacherBottomNav from "../../components/teacher/TeacherBottomNav";
import { AuthContext } from "../../context/AuthContext";
import { apiPost, apiGet } from "../../services/api";
import "./CreateSessionPage.css";

const CreateSessionPage = () => {
  const { getToken, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qr, setQr] = useState(null);
  
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);

  useEffect(() => {
    const fetchTodaySchedule = async () => {
      setLoading(true);
      try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        
        const token = await getToken();
        let params = {
          start: startOfDay.toISOString(),
          end: endOfDay.toISOString()
        };

        if (user?.id) {
          params.teacherId = user.id;
        } else if (user?.name) {
          params.teacherName = user.name;
        }

        const data = await apiGet("/api/schedule", params, token);
        
        setLessons(data || []);
        
        if (data && data.length > 0) {
          const now = new Date();
          const currentTime = now.getHours() * 60 + now.getMinutes();
          
          let active = null;
          for (const l of data) {
            if (!l.time) continue;
            const [start, end] = l.time.split(" - ");
            if (start && end) {
              const [startH, startM] = start.split(":").map(Number);
              const [endH, endM] = end.split(":").map(Number);
              const startTime = startH * 60 + startM;
              const endTime = endH * 60 + endM;
              
              if (currentTime >= startTime - 30 && currentTime <= endTime) {
                active = l;
                break;
              }
            }
          }
          setCurrentLesson(active || data[0]);
        }
      } catch {
         setError("Nie udało się pobrać planu zajęć.");
      } finally {
         setLoading(false);
      }
    };
    
    if (user?.name) {
        fetchTodaySchedule();
    }
  }, [user]);

  const createAndGetQr = async () => {
    if (!currentLesson) {
      setError("Brak wybranych zajęć.");
      return;
    }

    setError("");
    setLoading(true);
    setQr(null);

    try {
      const token = await getToken();
      const created = await apiPost("/api/attendance/sessions", { scheduleId: currentLesson.id }, token);
      const qrResp = await apiGet(`/api/attendance/sessions/${created.sessionId}/qr`, token);
      setQr(qrResp);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const refreshQr = async () => {
    if (!qr?.sessionId) return;

    setError("");
    setLoading(true);

    try {
      const token = await getToken();
      const qrResp = await apiGet(`/api/attendance/sessions/${qr.sessionId}/qr`, token);
      setQr(qrResp);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div className="top-bar">
        <button className="icon-btn" onClick={() => navigate(-1)} style={{ background: 'transparent', color: 'var(--text-primary)' }}>
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h2 className="top-bar-title" style={{ marginRight: '2.5rem' }}>Utwórz zajęcia</h2>
      </div>

      <div style={{ padding: '1.5rem' }}>
        
        {/* Form Container */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            <span className="material-symbols-outlined text-primary">school</span>
            Dzisiejsze zajęcia
          </label>
          
          {lessons.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              {loading ? "Ładowanie zajęć..." : "Brak przypisanych zajęć na dziś."}
            </div>
          ) : (
            <select
              value={currentLesson?.id || ""}
              onChange={(e) => {
                const selected = lessons.find(l => l.id === e.target.value);
                setCurrentLesson(selected);
              }}
              style={{
                display: "block", width: "100%", padding: '1rem', boxSizing: 'border-box',
                borderRadius: '0.5rem', border: '1px solid var(--border-light)', 
                background: 'var(--bg-light)', color: 'var(--text-primary)',
                fontFamily: 'inherit', outline: 'none', cursor: 'pointer', appearance: 'none',
                WebkitAppearance: 'none'
              }}
            >
              {lessons.map(l => (
                <option key={l.id} value={l.id}>
                  {l.time} - {l.subject} ({l.type})
                </option>
              ))}
            </select>
          )}

          {error && (
            <div style={{ padding: '0.75rem', marginTop: '1rem', background: '#fef2f2', color: '#ef4444', borderRadius: '0.5rem', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
               <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>error</span>
               {error}
            </div>
          )}

          <button
            className="btn-white"
            onClick={createAndGetQr}
            disabled={loading || !currentLesson}
            style={{ 
              width: '100%', marginTop: '1.5rem', padding: '1rem', background: 'var(--color-primary)', 
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              opacity: (loading || !currentLesson) ? 0.6 : 1, cursor: (loading || !currentLesson) ? 'not-allowed' : 'pointer'
            }}
          >
            <span className="material-symbols-outlined">{loading ? 'hourglass_empty' : 'qr_code'}</span>
            {loading ? "Generuję..." : "Generuj kod QR"}
          </button>
        </div>

        {/* QR Result */}
        {qr && (
          <div className="glass-card" style={{ marginTop: '1.5rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined text-primary">check_circle</span>
              Sesja #{qr.sessionId}
            </h2>

            <div style={{ background: 'var(--surface-light)', padding: '1rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <img
                alt="QR Code"
                src={`data:image/png;base64,${qr.qrPngBase64}`}
                style={{ width: '220px', height: '220px', display: 'block' }}
              />
            </div>

            <button 
              onClick={refreshQr} 
              disabled={loading} 
              style={{ 
                marginTop: '1.5rem', padding: '0.75rem 1.5rem', borderRadius: '999px',
                border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>refresh</span>
              Odśwież QR
            </button>

            <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: 'var(--bg-light)', borderRadius: '0.5rem', width: '100%', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Kod (Token) dla studentów:</span>
              <code style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.1em' }}>{qr.qrToken}</code>
            </div>
          </div>
        )}

      </div>
      <TeacherBottomNav />

    </div>
  );
};

export default CreateSessionPage;