import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet } from "../../services/api";

const LessonDetailPage = () => {
  const { id } = useParams();
  const { getToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const token = await getToken();
        const data = await apiGet(`/api/schedule/${id}`, null, token);
        setLesson(data);
      } catch {
        setError("Nie udało się załadować lekcji.");
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [id, getToken]);

  const topBar = (
    <div className="top-bar">
      <button className="icon-btn" onClick={() => navigate(-1)} style={{ background: 'transparent', color: 'var(--text-primary)' }}>
        <span className="material-symbols-outlined text-primary">arrow_back</span>
      </button>
      <h2 className="top-bar-title">Szczegóły lekcji</h2>
      <div style={{ width: '2.5rem' }} />
    </div>
  );

  if (loading) {
    return (
      <div className="app-container page-enter">
        {topBar}
        <div className="loading-state"><div className="loading-spinner"></div>Ładowanie...</div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="app-container page-enter">
        {topBar}
        <div className="error-state">
          <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>error</span>
          <p style={{ margin: 0 }}>{error || "Nie znaleziono lekcji."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container page-enter">
      {topBar}
      <div style={{ padding: '1.5rem 1rem' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.375rem', margin: 0 }}>{lesson.subject}</h2>
            <span style={{
              background: 'rgba(244, 89, 37, 0.1)', color: 'var(--color-primary)',
              padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
            }}>{lesson.type}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.25rem' }}>calendar_today</span>
              <span style={{ fontSize: '0.9rem' }}>{lesson.date ? new Date(lesson.date).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.25rem' }}>schedule</span>
              <span style={{ fontSize: '0.9rem' }}>{lesson.time}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.25rem' }}>location_on</span>
              <span style={{ fontSize: '0.9rem' }}>{lesson.room}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.25rem' }}>person</span>
              <span style={{ fontSize: '0.9rem' }}>{lesson.teacher || '—'}</span>
            </div>
            {lesson.studentGroupName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.25rem' }}>group</span>
                <span style={{ fontSize: '0.9rem' }}>{lesson.studentGroupName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonDetailPage;
