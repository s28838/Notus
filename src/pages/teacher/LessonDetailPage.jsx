import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet, apiDelete } from "../../services/api";
import LoadingState from "../../components/shared/LoadingState";

const LessonDetailPage = () => {
  const { id } = useParams();
  const { getToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteChoice, setShowDeleteChoice] = useState(false);
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

  const performDelete = async (deleteFuture = false) => {
    setDeleting(true);
    try {
      const token = await getToken();
      await apiDelete(`/api/schedule/${id}${deleteFuture ? "?deleteFuture=true" : ""}`, token);
      navigate("/teacher/schedule");
    } catch {
      setDeleting(false);
      setShowDeleteChoice(false);
      alert("Nie udało się usunąć lekcji.");
    }
  };

  const handleDelete = async () => {
    if (lesson?.recurring) {
      setShowDeleteChoice(true);
      return;
    }
    if (!window.confirm("Czy na pewno chcesz usunąć tę lekcję?")) return;
    await performDelete(false);
  };

  if (loading) {
    return (
      <div className="app-container page-enter">
        <div className="top-bar">
          <button className="icon-btn" onClick={() => navigate(-1)} style={{ background: 'transparent', color: 'var(--text-primary)' }}>
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h2 className="top-bar-title">Lekcja</h2>
          <div style={{ width: '2.5rem' }} />
        </div>
        <LoadingState label="Ładowanie lekcji..." />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="app-container page-enter">
        <div className="top-bar">
          <button className="icon-btn" onClick={() => navigate(-1)} style={{ background: 'transparent', color: 'var(--text-primary)' }}>
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h2 className="top-bar-title">Lekcja</h2>
          <div style={{ width: '2.5rem' }} />
        </div>
        <div className="error-state">
          <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>error</span>
          <p style={{ margin: 0 }}>{error || "Nie znaleziono lekcji."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container page-enter">
      <div className="top-bar">
        <button className="icon-btn" onClick={() => navigate(-1)} style={{ background: 'transparent', color: 'var(--text-primary)' }}>
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h2 className="top-bar-title">Szczegóły lekcji</h2>
        <button
          className="icon-btn"
          onClick={() => navigate(`/teacher/edit-lesson/${id}`)}
          style={{ background: 'var(--color-primary)', color: 'white' }}
        >
          <span className="material-symbols-outlined">edit</span>
        </button>
      </div>

      <div className="desktop-centered-content" style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            {lesson.recurring && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.25rem' }}>repeat</span>
                <span style={{ fontSize: '0.9rem' }}>
                  Zajęcia cykliczne co {lesson.repeatEveryWeeks || 1} tydz.
                  {lesson.recurrenceEndsAt
                    ? ` do ${new Date(lesson.recurrenceEndsAt).toLocaleDateString('pl-PL')}`
                    : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700, background: deleting ? '#fca5a5' : '#ef4444', color: 'white', border: 'none', borderRadius: '0.75rem', cursor: deleting ? 'not-allowed' : 'pointer' }}
        >
          {deleting ? "Usuwanie..." : "Usuń lekcję"}
        </button>
      </div>

      {showDeleteChoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(15, 23, 42, 0.62)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => !deleting && setShowDeleteChoice(false)}
        >
          <div
            className="glass-card"
            style={{ width: 'min(100%, 520px)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.75rem' }}>repeat</span>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>To są zajęcia cykliczne</h3>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Ten termin należy do serii zajęć. Możesz usunąć tylko wybraną lekcję albo usunąć ten termin i wszystkie przyszłe zajęcia z tej serii.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => performDelete(false)}
                disabled={deleting}
                className="btn-white"
                style={{ padding: '0.95rem', opacity: deleting ? 0.7 : 1 }}
              >
                Usuń tylko tę lekcję
              </button>
              <button
                onClick={() => performDelete(true)}
                disabled={deleting}
                style={{
                  width: '100%',
                  padding: '0.95rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  background: deleting ? '#fca5a5' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1
                }}
              >
                Usuń tę i przyszłe lekcje
              </button>
              <button
                onClick={() => setShowDeleteChoice(false)}
                disabled={deleting}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontWeight: 800,
                  padding: '0.75rem',
                  cursor: deleting ? 'not-allowed' : 'pointer'
                }}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonDetailPage;
