import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet, apiPost } from "../../services/api";
import LoadingState from "../../components/shared/LoadingState";

const StudentQuizPage = () => {
  const { assignmentId } = useParams();
  const { getToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = await getToken();
        const data = await apiGet(`/api/quiz-assignments/${assignmentId}/take`, null, token);
        setQuiz(data);
        if (data.alreadySubmitted) {
          setResult({ score: data.myScore, total: data.myTotal, pendingOpenReview: data.pendingOpenReview });
        }
      } catch {
        setError("Nie udało się pobrać quizu.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [assignmentId, getToken]);

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const token = await getToken();
      const res = await apiPost(
        `/api/quiz-assignments/${assignmentId}/submit`,
        { answers },
        token
      );
      setResult(res);
    } catch (err) {
      setError(err.message || "Nie udało się wysłać odpowiedzi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <LoadingState label="Ładowanie quizu..." />
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="app-container">
        <div className="top-bar">
          <button className="icon-btn" onClick={() => navigate(-1)} style={{ background: "transparent", color: "var(--text-primary)" }}>
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h2 className="top-bar-title" style={{ marginRight: "2.5rem" }}>Quiz</h2>
        </div>
        <div style={{ padding: "1rem" }}>
          <div className="error-state">
            <span className="material-symbols-outlined" style={{ fontSize: "2rem" }}>error</span>
            {error}
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
        <h2 className="top-bar-title" style={{ marginRight: "2.5rem" }}>{quiz?.quizTitle || "Quiz"}</h2>
      </div>

      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Lesson context */}
        <div className="glass-card" style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span className="material-symbols-outlined" style={{ color: "var(--color-primary)" }}>school</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>{quiz?.scheduleSubject}</p>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              {quiz?.scheduleDate} · {quiz?.scheduleTime}
            </p>
          </div>
        </div>

        {/* Result state */}
        {result ? (
          (() => {
            const hasPending = Boolean(result?.pendingOpenReview ?? quiz?.pendingOpenReview);
            return hasPending ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem", textAlign: "center", borderRadius: "1rem", background: "var(--surface-light)", border: "1px solid rgba(234,179,8,0.3)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "#b45309" }}>hourglass_top</span>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#b45309" }}>
                  Oczekuje na ocenę nauczyciela
                </h2>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.9rem" }}>
                  Twoje odpowiedzi otwarte zostaną sprawdzone przez nauczyciela. Otrzymasz powiadomienie po ocenie.
                </p>
                <button className="btn-primary" onClick={() => navigate(-1)} style={{ width: "auto", padding: "0.75rem 2rem" }}>
                  Wróć do planu
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem", textAlign: "center", borderRadius: "1rem", background: "var(--surface-light)", border: "1px solid var(--border-light)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "var(--color-primary)" }}>emoji_events</span>
                <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>
                  {result.score} / {result.total}
                </h2>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontWeight: 500 }}>
                  {result.total > 0
                    ? `${Math.round((result.score / result.total) * 100)}% poprawnych odpowiedzi`
                    : "Quiz ukończony"}
                </p>
                <button className="btn-primary" onClick={() => navigate(-1)} style={{ width: "auto", padding: "0.75rem 2rem" }}>
                  Wróć do planu
                </button>
              </div>
            );
          })()
        ) : (
          <>
            {error && (
              <div className="error-state">
                <span className="material-symbols-outlined" style={{ fontSize: "1.5rem" }}>error</span>
                {error}
              </div>
            )}

            {/* Questions */}
            {(quiz?.questions || []).map((q, i) => (
              <div key={q.id} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>
                  {i + 1}. {q.questionText}
                </p>
                {q.type === "CLOSED" && q.options?.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {q.options.map((opt, j) => {
                      const letters = ["A", "B", "C", "D", "E"];
                      const letter = j < letters.length ? letters[j] : String.fromCharCode(65 + j);
                      const selected = answers[q.id] === opt;
                      return (
                        <button
                          key={j}
                          onClick={() => handleAnswer(q.id, opt)}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.75rem",
                            padding: "0.75rem", borderRadius: "0.75rem", textAlign: "left",
                            border: selected ? "2px solid var(--color-primary)" : "1.5px solid var(--border-light)",
                            background: selected ? "rgba(244,89,37,0.08)" : "rgba(255, 255, 255, 0.05)",
                            cursor: "pointer", fontWeight: selected ? 700 : 500,
                            color: selected ? "var(--color-primary)" : "var(--text-primary)",
                            transition: "all 0.15s"
                          }}
                        >
                          <span style={{
                            width: "1.75rem", height: "1.75rem", borderRadius: "50%", flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.75rem", fontWeight: 700,
                            background: selected ? "var(--color-primary)" : "var(--border-light)",
                            color: selected ? "white" : "var(--text-secondary)"
                          }}>
                            {letter}
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    value={answers[q.id] || ""}
                    onChange={e => handleAnswer(q.id, e.target.value)}
                    placeholder="Wpisz odpowiedź..."
                    rows={3}
                    className="form-input"
                    style={{ resize: "vertical", padding: "0.75rem", width: "100%", boxSizing: "border-box" }}
                  />
                )}
              </div>
            ))}

            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ marginTop: "0.5rem" }}
            >
              {submitting ? "Wysyłanie..." : "Wyślij odpowiedzi"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentQuizPage;
