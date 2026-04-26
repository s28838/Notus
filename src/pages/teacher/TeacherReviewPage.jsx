import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet, apiPost } from "../../services/api";

const TeacherReviewPage = () => {
  const { submissionId } = useParams();
  const { getToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [answers, setAnswers] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = await getToken();
        const data = await apiGet(`/api/quiz-assignments/submissions/${submissionId}/answers`, null, token);
        setAnswers(Array.isArray(data) ? data : []);
        // Pre-fill any already-graded answers
        const initial = {};
        (Array.isArray(data) ? data : []).forEach(a => {
          if (a.correct !== null && a.correct !== undefined) {
            initial[a.answerId] = a.correct;
          }
        });
        setMarks(initial);
      } catch {
        setError("Nie udało się pobrać odpowiedzi.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [submissionId, getToken]);

  const handleMark = (answerId, correct) => {
    setMarks(prev => ({ ...prev, [answerId]: correct }));
  };

  const handleSubmit = async () => {
    const ungraded = answers.filter(a => marks[a.answerId] === undefined || marks[a.answerId] === null);
    if (ungraded.length > 0) {
      setError("Oceń wszystkie odpowiedzi przed wysłaniem.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const token = await getToken();
      await apiPost(`/api/quiz-assignments/submissions/${submissionId}/review`, { marks }, token);
      setDone(true);
    } catch {
      setError("Nie udało się wysłać oceny.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="app-container">
        <div className="top-bar">
          <button className="icon-btn" onClick={() => navigate(-1)} style={{ background: "transparent", color: "var(--text-primary)" }}>
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h2 className="top-bar-title" style={{ marginRight: "2.5rem" }}>Ocena</h2>
        </div>
        <div style={{ padding: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem", textAlign: "center", borderRadius: "1rem", background: "var(--surface-light)", border: "1px solid var(--border-light)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "var(--color-primary)" }}>check_circle</span>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>Ocena wysłana</h2>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Student otrzyma powiadomienie o wynikach.
            </p>
            <button className="btn-primary" onClick={() => navigate(-1)} style={{ width: "auto", padding: "0.75rem 2rem" }}>
              Wróć do wyników
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="top-bar">
        <button className="icon-btn" onClick={() => navigate(-1)} style={{ background: "transparent", color: "var(--text-primary)" }}>
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h2 className="top-bar-title" style={{ marginRight: "2.5rem" }}>Ocena odpowiedzi</h2>
      </div>

      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            Ładowanie odpowiedzi...
          </div>
        ) : error && answers.length === 0 ? (
          <div className="error-state">
            <span className="material-symbols-outlined" style={{ fontSize: "2rem" }}>error</span>
            {error}
          </div>
        ) : answers.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined" style={{ fontSize: "2.5rem", color: "var(--border-light)" }}>check_circle</span>
            <p style={{ margin: 0, fontWeight: 600 }}>Brak odpowiedzi otwartych</p>
          </div>
        ) : (
          <>
            {answers.map((a, i) => (
              <div key={a.answerId} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Pytanie {i + 1}
                </p>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>{a.questionText}</p>
                <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "var(--bg-light)", border: "1px solid var(--border-light)" }}>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                    {a.answerText?.trim() || <span style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>Brak odpowiedzi</span>}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleMark(a.answerId, true)}
                    style={{
                      flex: 1, padding: "0.6rem", borderRadius: "0.75rem", fontWeight: 700, fontSize: "0.85rem",
                      border: marks[a.answerId] === true ? "2px solid #16a34a" : "1.5px solid var(--border-light)",
                      background: marks[a.answerId] === true ? "rgba(22,163,74,0.1)" : "var(--bg-light)",
                      color: marks[a.answerId] === true ? "#16a34a" : "var(--text-secondary)",
                      cursor: "pointer", transition: "all 0.15s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem"
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>check</span>
                    Poprawna
                  </button>
                  <button
                    onClick={() => handleMark(a.answerId, false)}
                    style={{
                      flex: 1, padding: "0.6rem", borderRadius: "0.75rem", fontWeight: 700, fontSize: "0.85rem",
                      border: marks[a.answerId] === false ? "2px solid #ef4444" : "1.5px solid var(--border-light)",
                      background: marks[a.answerId] === false ? "rgba(239,68,68,0.1)" : "var(--bg-light)",
                      color: marks[a.answerId] === false ? "#ef4444" : "var(--text-secondary)",
                      cursor: "pointer", transition: "all 0.15s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem"
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>close</span>
                    Niepoprawna
                  </button>
                </div>
              </div>
            ))}

            {error && (
              <div className="error-state">
                <span className="material-symbols-outlined" style={{ fontSize: "1.5rem" }}>error</span>
                {error}
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ marginTop: "0.5rem" }}
            >
              {submitting ? "Wysyłanie..." : "Wyślij ocenę"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherReviewPage;
