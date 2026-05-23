import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { apiGet } from "../../services/api";
import StudentBottomNav from "../../components/student/StudentBottomNav";
import AppPageLayout from "../../components/shared/AppPageLayout";
import { EmptyState, ErrorState } from "../../components/shared/PageState";
import { useNavigate } from "react-router-dom";

const StatsPage = () => {
  const { getToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        // Fetch student's combined session history
        const data = await apiGet("/api/history/student", null, token);
        setHistory(Array.isArray(data) ? data : []);
      } catch {
        setError("Nie udało się pobrać historii.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [getToken]);

  const handleViewAnswers = (assignmentId) => {
    navigate(`/student/quiz-review/${assignmentId}`);
  };

  return (
    <AppPageLayout
        title="Historia"
        leftIcon="arrow_back"
        onLeftClick={() => navigate("/student")}
        leftAriaLabel="Wróć do strony głównej"
        loading={loading}
        loadingLabel="Ładowanie statystyk..."
        bottomNav={<StudentBottomNav />}
        shell="student"
      >

        {error ? (
          <ErrorState iconStyle={{ fontSize: "2rem" }}>{error}</ErrorState>
        ) : history.length === 0 ? (
          <EmptyState icon="history" iconStyle={{ fontSize: "3rem", color: "var(--border-light)" }}>
            <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>Brak historii</p>
            <p style={{ margin: 0, fontSize: "0.875rem", textAlign: "center" }}>Zaloguj się na zajęciach, lub zrób quiz, aby dodać go do historii.</p>
          </EmptyState>
        ) : (
          <div className="list-container">
            {history.map((h) => (
              <div key={h.scheduleId} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{h.scheduleSubject}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {new Date(h.scheduleDate).toLocaleDateString()} · {h.scheduleTime}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {h.attended ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>check_circle</span>
                      Obecny ({new Date(h.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>cancel</span>
                      Brak obecności
                    </span>
                  )}

                  {h.quizAssignmentId ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(56, 189, 248, 0.1)', color: '#0ea5e9', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>quiz</span>
                      {h.pendingOpenReview ? (
                        <span>W sprawdzaniu...</span>
                      ) : (
                        <span>{h.score}/{h.total} pkt.</span>
                      )}
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                       <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>quiz</span>
                       Brak quizu
                    </span>
                  )}

                  {h.quizAssignmentId && !h.pendingOpenReview && (
                     <button
                       onClick={() => handleViewAnswers(h.quizAssignmentId)}
                       style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none', background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                     >
                       <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>visibility</span>
                       Zobacz odpowiedzi
                     </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
    </AppPageLayout>
  );
};

export default StatsPage;
