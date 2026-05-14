import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet, apiPost } from "../../services/api";

const TeacherAssignQuizPage = () => {
  const { scheduleId } = useParams();
  const { getToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = await getToken();
        const data = await apiGet("/api/quiz/my", null, token);
        setQuizzes(Array.isArray(data) ? data : []);
      } catch {
        setError("Nie udało się pobrać quizów.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [getToken]);

  const handleAssign = async (quizId) => {
    setAssigning(quizId);
    setError("");
    try {
      const token = await getToken();
      await apiPost("/api/quiz-assignments", { quizId, scheduleId }, token);
      setSuccess(true);
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      setError(err.message || "Nie udało się przypisać quizu.");
      setAssigning(null);
    }
  };

  return (
    <div className="app-container">
      <div className="top-bar">
        <button
          className="icon-btn"
          onClick={() => navigate(-1)}
          style={{ background: "transparent", color: "var(--text-primary)" }}
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h2 className="top-bar-title" style={{ marginRight: "2.5rem" }}>Przypisz Quiz</h2>
      </div>

      <div style={{ padding: "1rem" }}>
        {success ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "3rem 1rem", textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "#22c55e" }}>check_circle</span>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem" }}>Quiz przypisany!</p>
          </div>
        ) : loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            Ładowanie quizów...
          </div>
        ) : (
          <>
            {error && (
              <div className="error-state" style={{ marginBottom: "1rem" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "1.5rem" }}>error</span>
                {error}
              </div>
            )}
            {quizzes.length === 0 ? (
              <div className="empty-state">
                <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "var(--border-light)" }}>quiz</span>
                <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>Brak quizów</p>
                <p style={{ margin: 0, fontSize: "0.875rem" }}>Najpierw utwórz quiz.</p>
                <button
                  className="btn-primary"
                  onClick={() => navigate("/teacher/create-quiz")}
                  style={{ width: "auto", padding: "0.75rem 1.5rem" }}
                >
                  Utwórz quiz
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <p style={{ margin: "0 0 0.5rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  Wybierz quiz do przypisania do tych zajęć:
                </p>
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="glass-card"
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1rem" }}
                  >
                    <div>
                      <p style={{ margin: "0 0 0.2rem", fontWeight: 700, fontSize: "1rem" }}>{quiz.title}</p>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        {quiz.questions?.length || 0} pytań
                      </p>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => handleAssign(quiz.id)}
                      disabled={assigning !== null}
                      style={{ width: "auto", padding: "0.6rem 1.25rem", fontSize: "0.875rem" }}
                    >
                      {assigning === quiz.id ? "..." : "Przypisz"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherAssignQuizPage;
