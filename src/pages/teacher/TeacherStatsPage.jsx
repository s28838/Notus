import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet } from "../../services/api";
import TeacherBottomNav from "../../components/teacher/TeacherBottomNav";

const TeacherStatsPage = () => {
  const { getToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        // Fetch teacher's combined session history
        const data = await apiGet("/api/history/teacher", null, token);
        setHistory(Array.isArray(data) ? data : []);
      } catch {
        setError("Nie udało się pobrać historii.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [getToken]);

  const handleDownloadPdf = async (scheduleId) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/history/teacher/session/${scheduleId}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `podsumowanie-zajec.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Nie udało się pobrać PDF.");
    }
  };

  const toggleSession = async (h) => {
    if (expandedSessionId === h.scheduleId) {
      setExpandedSessionId(null);
      setSessionDetails(null);
      return;
    }

    setExpandedSessionId(h.scheduleId);
    setSessionLoading(true);
    setSessionDetails(null);

    try {
      const token = await getToken();
      const data = await apiGet(`/api/history/teacher/session/${h.scheduleId}`, null, token);
      setSessionDetails(data);
    } catch {
      setSessionDetails({ error: true });
    } finally {
      setSessionLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="top-bar">
        <button
          className="icon-btn"
          onClick={() => navigate("/teacher")}
          style={{ background: "transparent", color: "var(--text-primary)" }}
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h2 className="top-bar-title" style={{ marginRight: "2.5rem" }}>Historia Sesji</h2>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          Ładowanie...
        </div>
      ) : error ? (
        <div style={{ padding: "1rem" }}>
          <div className="error-state">
            <span className="material-symbols-outlined" style={{ fontSize: "2rem" }}>error</span>
            {error}
          </div>
        </div>
      ) : history.length === 0 ? (
        <div style={{ padding: "0 1rem" }}>
          <div className="empty-state">
            <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "var(--border-light)" }}>history</span>
            <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>Brak historii</p>
            <p style={{ margin: 0, fontSize: "0.875rem" }}>Otwórz listę obecności lub zadaj quiz w trakcie zajęć.</p>
          </div>
        </div>
      ) : (
        <div className="list-container" style={{ padding: "1rem", paddingBottom: "5.5rem" }}>
          {history.map((h) => {
            const isExpanded = expandedSessionId === h.scheduleId;

            return (
              <div 
                key={h.scheduleId} 
                className="glass-card" 
                style={{ 
                  display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem',
                  border: isExpanded ? '1px solid var(--color-primary)' : '1px solid var(--border-light)',
                  transition: 'all 0.2s', cursor: 'pointer'
                }}
                onClick={() => toggleSession(h)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{h.scheduleSubject}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(h.scheduleDate).toLocaleDateString()} · {h.scheduleTime}
                    </p>
                  </div>
                  <span className="material-symbols-outlined" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--text-tertiary)' }}>
                    expand_more
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {h.sessionId ? (
                    <span
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600
                      }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>group</span>
                      {h.attendanceCount} obecnych
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>group_off</span>
                      Brak obecności
                    </span>
                  )}

                  {h.quizAssignmentId ? (
                    <span
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(56, 189, 248, 0.1)', color: '#0ea5e9', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600
                      }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>quiz</span>
                      {h.quizSubmissionCount} odp. ({h.quizAvgScore}% śr)
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>quiz</span>
                      Brak quizu
                    </span>
                  )}
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }} onClick={e => e.stopPropagation()}>
                    <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Lista uczestników</h4>
                    
                    {sessionLoading ? (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ładowanie uczniów...</p>
                    ) : sessionDetails?.error ? (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#ef4444' }}>Brak danych lub błąd.</p>
                    ) : sessionDetails?.length === 0 ? (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Nikogo nie było na tych zajęciach, nikt też nie jest przypisany do tej grupy.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {sessionDetails?.map(student => {
                          const hasQuiz = student.quizScore != null;
                          return (
                            <div 
                              key={student.studentId} 
                              onClick={() => hasQuiz ? navigate(`/teacher/review/${h.quizAssignmentId}/${student.studentId}`) : null}
                              style={{ 
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                background: 'rgba(255,255,255,0.05)', 
                                padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                                cursor: hasQuiz ? 'pointer' : 'default',
                                border: hasQuiz ? '1px solid rgba(255,255,255,0.1)' : 'none'
                              }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{student.studentName}</span>
                                {hasQuiz && (
                                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--text-tertiary)' }}>chevron_right</span>
                                )}
                              </div>

                              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                {/* Attendance Status */}
                                {student.attended ? (
                                  <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: '1.2rem' }}>check_circle</span>
                                ) : (
                                  <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '1.2rem' }}>cancel</span>
                                )}
                                {/* Quiz Status */}
                                {h.quizAssignmentId && (
                                  <span style={{ 
                                    background: hasQuiz ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)', 
                                    color: hasQuiz ? 'white' : 'var(--text-tertiary)',
                                    padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 700 
                                  }}>
                                    {hasQuiz 
                                      ? `${student.quizScore}/${student.quizTotal} (${student.quizTotal > 0 ? Math.round((student.quizScore / student.quizTotal) * 100) : 0}%)` 
                                      : '-/-'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {h.quizId && (
                          <button
                            className="btn-secondary"
                            style={{ marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            onClick={() => handleDownloadPdf(h.scheduleId)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>picture_as_pdf</span>
                            Pobierz podsumowanie PDF
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <TeacherBottomNav />
    </div>
  );
};

export default TeacherStatsPage;
