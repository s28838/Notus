import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet } from "../../services/api";
import LoadingState from "../../components/shared/LoadingState";

const StudentQuizReviewPage = () => {
  const { assignmentId } = useParams();
  const { getToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const token = await getToken();
        const data = await apiGet(`/api/quiz-assignments/${assignmentId}/my-answers`, null, token);
        setReview(data);
      } catch {
        setError("Nie udało się pobrać szczegółów quizu.");
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [assignmentId, getToken]);

  if (loading) {
    return (
      <div className="app-container">
        <LoadingState label="Ładowanie odpowiedzi..." />
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="app-container">
        <div className="top-bar">
          <button className="icon-btn" onClick={() => navigate(-1)} style={{ background: "transparent", color: "var(--text-primary)" }}>
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h2 className="top-bar-title" style={{ marginRight: "2.5rem" }}>Błąd</h2>
        </div>
        <div style={{ padding: "1rem" }}>
          <div className="error-state">
            <span className="material-symbols-outlined" style={{ fontSize: "2rem" }}>error</span>
            {error || "Brak danych."}
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
        <h2 className="top-bar-title" style={{ marginRight: "2.5rem" }}>{review.quizTitle}</h2>
      </div>

      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Header summary */}
        <div className="glass-card" style={{ display: "flex",flexDirection: "column", gap: "0.75rem", alignItems: "center", textAlign: "center", background: "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))" }}>
          <span className="material-symbols-outlined" style={{ color: "var(--color-primary)", fontSize: "2.5rem" }}>grading</span>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Mój Wynik</h2>
            <p style={{ margin: "0.25rem 0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>{review.scheduleSubject}</p>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
            <span style={{ fontSize: "1.5rem", fontWeight: 800, color: review.score > 0 ? "#16a34a" : "var(--text-primary)" }}>
              {review.score}/{review.total}
            </span>
            <span style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.9rem" }}>
               ({review.total > 0 ? Math.round((review.score / review.total) * 100) : 0}%)
            </span>
          </div>

          {review.pendingOpenReview && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "rgba(234, 179, 8, 0.1)", color: "#b45309", padding: "0.4rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 600, marginTop: "0.25rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>hourglass_top</span>
              Oczekuje na ocenę otwartych
            </div>
          )}
        </div>

        <h3 style={{ margin: "0.5rem 0 0", fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>Rozwiązane pytania</h3>

        {/* Questions List */}
        {review.answers.map((ans, i) => (
          <div key={ans.questionId} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>
              {i + 1}. {ans.questionText}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.25rem" }}>
              {/* Student's answer styled by correctness */}
              <div style={{
                padding: "0.75rem",
                borderRadius: "0.5rem",
                background: ans.isCorrect === true ? "rgba(22, 163, 74, 0.1)" : (ans.isCorrect === false ? "rgba(239, 68, 68, 0.1)" : "rgba(255, 255, 255, 0.05)"),
                border: ans.isCorrect === true ? "1px solid rgba(22, 163, 74, 0.3)" : (ans.isCorrect === false ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)"),
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: ans.isCorrect === true ? "#16a34a" : (ans.isCorrect === false ? "#ef4444" : "var(--text-tertiary)") }}>
                     {ans.isCorrect === true ? "check_circle" : (ans.isCorrect === false ? "cancel" : "help")}
                  </span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Twoja odpowiedź</span>
                </div>
                <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: ans.studentAnswer ? 600 : 400, color: "var(--text-primary)" }}>
                  {ans.studentAnswer || <span style={{ fontStyle: "italic", color: "var(--text-tertiary)" }}>Brak odpowiedzi</span>}
                </p>
              </div>

              {/* Show correct answer explicitly if closed question or marked wrong */}
              {ans.isCorrect === false && ans.type === "CLOSED" && (
                <div style={{ padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.03)", border: "1px dashed var(--border-light)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>task_alt</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Poprawna odpowiedź</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {ans.correctAnswer}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentQuizReviewPage;
