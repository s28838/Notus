import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet, apiDelete } from "../../services/api";
import TeacherBottomNav from "../../components/teacher/TeacherBottomNav";
import LoadingState from "../../components/shared/LoadingState";

const QuizzesPage = () => {
  const { getToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const data = await apiGet("/api/quiz/my", null, token);
      setQuizzes(Array.isArray(data) ? data : []);
    } catch {
      setError("Nie udało się pobrać listy quizów.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Czy na pewno chcesz usunąć ten quiz?")) return;
    try {
      const token = await getToken();
      await apiDelete(`/api/quiz/${id}`, token);
      setQuizzes(quizzes.filter(q => q.id !== id));
    } catch (err) {
      alert("Błąd podczas usuwania: " + err.message);
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
        <h2 className="top-bar-title">Twoje Quizy</h2>
        <button
          className="icon-btn"
          onClick={() => navigate("/teacher/create-quiz")}
          style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      <div style={{ padding: "1rem" }}>
        {loading ? (
          <LoadingState label="Ładowanie quizów..." />
        ) : error ? (
          <div className="error-state">
            <span className="material-symbols-outlined" style={{ fontSize: "2rem" }}>error</span>
            {error}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "var(--border-light)" }}>quiz</span>
            <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>Brak quizów</p>
            <p style={{ margin: 0, fontSize: "0.875rem" }}>Nie masz jeszcze żadnych quizów.</p>
            <button
              className="btn-primary"
              onClick={() => navigate("/teacher/create-quiz")}
              style={{ width: "auto", padding: "0.75rem 1.5rem" }}
            >
              Stwórz pierwszy quiz
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="glass-card"
                onClick={() => navigate(`/teacher/quiz/${quiz.id}`)}
                style={{
                  padding: "1.25rem",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.1rem" }}>{quiz.title}</h3>
                    {quiz.version > 1 && (
                      <span className="list-item-tag secondary" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                        v{quiz.version}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {quiz.questions?.length || 0} pytań • {new Date(quiz.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  className="icon-btn"
                  onClick={(e) => handleDelete(e, quiz.id)}
                  style={{ background: "rgba(220, 38, 38, 0.1)", color: "#dc2626" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <TeacherBottomNav />
    </div>
  );
};

export default QuizzesPage;
