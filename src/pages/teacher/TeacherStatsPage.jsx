import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet } from "../../services/api";
import TeacherBottomNav from "../../components/teacher/TeacherBottomNav";

const TeacherStatsPage = () => {
  const { getToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = await getToken();
        const data = await apiGet("/api/quiz-assignments/my", null, token);
        setAssignments(Array.isArray(data) ? data : []);
      } catch {
        setError("Nie udało się pobrać historii.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [getToken]);

  const openResults = async (assignment) => {
    setSelected(assignment);
    setResults(null);
    setLoadingResults(true);
    try {
      const token = await getToken();
      const data = await apiGet(`/api/quiz-assignments/${assignment.id}/results`, null, token);
      setResults(data);
    } catch {
      setResults({ error: true });
    } finally {
      setLoadingResults(false);
    }
  };

  const handleDownloadPdf = async (quizId) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/quiz/${quizId}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quiz-${quizId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Nie udało się pobrać PDF.");
    }
  };

  // --- Results detail view ---
  if (selected) {
    return (
      <div className="app-container">
        <div className="top-bar">
          <button
            className="icon-btn"
            onClick={() => { setSelected(null); setResults(null); }}
            style={{ background: "transparent", color: "var(--text-primary)" }}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="top-bar-title" style={{ marginRight: "2.5rem" }}>Wyniki</h2>
        </div>

        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="glass-card">
            <p style={{ margin: "0 0 0.25rem", fontWeight: 700, fontSize: "1rem" }}>{selected.quizTitle}</p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {selected.scheduleSubject} · {selected.scheduleDate} · {selected.scheduleTime}
            </p>
          </div>

          {loadingResults ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              Ładowanie wyników...
            </div>
          ) : results?.error ? (
            <div className="error-state">
              <span className="material-symbols-outlined" style={{ fontSize: "1.5rem" }}>error</span>
              Nie udało się pobrać wyników.
            </div>
          ) : results?.submissions?.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined" style={{ fontSize: "2.5rem", color: "var(--border-light)" }}>person_off</span>
              <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>Brak odpowiedzi</p>
              <p style={{ margin: 0, fontSize: "0.875rem" }}>Żaden student jeszcze nie odpowiedział.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {(results?.submissions || []).map((s, i) => {
                const pct = s.total > 0 ? Math.round((s.score / s.total) * 100) : 0;
                return (
                  <div key={i} className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: "0 0 0.15rem", fontWeight: 700, fontSize: "0.95rem" }}>{s.studentName}</p>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        {s.indexNumber || "Brak indeksu"} · {s.submittedAt ? new Date(s.submittedAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }) : "–"}
                      </p>
                      {s.pendingOpenReview && (
                        <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "0.3rem",
                            padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700,
                            background: "rgba(234,179,8,0.12)", color: "#b45309", border: "1px solid rgba(234,179,8,0.3)"
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "0.85rem" }}>pending</span>
                            Wymaga oceny
                          </span>
                          <button
                            className="btn-primary"
                            onClick={() => navigate(`/teacher/review/${s.submissionId}`)}
                            style={{ padding: "0.25rem 0.75rem", fontSize: "0.78rem", width: "auto", borderRadius: "999px" }}
                          >
                            Oceń
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ margin: "0 0 0.1rem", fontWeight: 800, fontSize: "1.1rem", color: pct >= 50 ? "var(--color-primary)" : "#ef4444" }}>
                        {s.score}/{s.total}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>{pct}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={() => handleDownloadPdf(selected.quizId)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>download</span>
            Pobierz PDF quizu
          </button>
        </div>

        <TeacherBottomNav />
      </div>
    );
  }

  // --- Assignments list view ---
  return (
    <div className="app-container">
      <div className="top-bar">
        <button
          className="icon-btn"
          onClick={() => navigate("/teacher")}
          style={{ background: "transparent", color: "var(--text-primary)" }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="top-bar-title" style={{ marginRight: "2.5rem" }}>Historia Quizów</h2>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          Ładowanie historii...
        </div>
      ) : error ? (
        <div style={{ padding: "1rem" }}>
          <div className="error-state">
            <span className="material-symbols-outlined" style={{ fontSize: "2rem" }}>error</span>
            {error}
          </div>
        </div>
      ) : assignments.length === 0 ? (
        <>
          <h3 className="section-title">Przypisane Quizy</h3>
          <div style={{ padding: "0 1rem" }}>
            <div className="empty-state">
              <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "var(--border-light)" }}>history_edu</span>
              <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>Brak historii</p>
              <p style={{ margin: 0, fontSize: "0.875rem" }}>Przypisz quiz do zajęć z poziomu planu lekcji.</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <h3 className="section-title">Przypisane Quizy</h3>
          <div className="list-container">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="list-item"
                onClick={() => openResults(a)}
                style={{ cursor: "pointer" }}
              >
                <div className="list-item-content">
                  <div className="list-item-top">
                    <span className="material-symbols-outlined list-item-tag primary" style={{ fontSize: "14px" }}>quiz</span>
                    <p className="list-item-tag secondary">{a.scheduleDate}</p>
                  </div>
                  <h4 className="list-item-title">{a.quizTitle}</h4>
                  <div className="list-item-details">
                    <div className="detail-pill">
                      <span className="material-symbols-outlined">school</span>
                      <p style={{ margin: 0 }}>{a.scheduleSubject}</p>
                    </div>
                    <div className="detail-pill">
                      <span className="material-symbols-outlined">alarm</span>
                      <p style={{ margin: 0 }}>{a.scheduleTime}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                    <div className="detail-pill">
                      <span className="material-symbols-outlined">group</span>
                      <p style={{ margin: 0 }}>{a.submissionCount} odpowiedzi</p>
                    </div>
                    {a.submissionCount > 0 && (
                      <div className="detail-pill">
                        <span className="material-symbols-outlined">trending_up</span>
                        <p style={{ margin: 0, color: "var(--color-primary)", fontWeight: 700 }}>{a.avgScore}% śr.</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="list-item-action">
                  <span className="material-symbols-outlined">chevron_right</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <TeacherBottomNav />
    </div>
  );
};

export default TeacherStatsPage;
