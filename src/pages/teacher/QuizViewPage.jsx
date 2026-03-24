import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet } from "../../services/api";

const QuizViewPage = () => {
  const { getToken } = useContext(AuthContext);
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const data = await apiGet(`/api/quiz/${quizId}`, null, token);
        setQuiz(data);
      } catch (err) {
        console.error(err);
        setError("Nie udało się pobrać szczegółów quizu.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  return (
    <div className="app-container" style={{ paddingBottom: "2rem" }}>
      <div className="top-bar">
        <button
          className="icon-btn"
          onClick={() => navigate("/teacher/quizzes")}
          style={{ background: "transparent", color: "var(--text-primary)" }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="top-bar-title">Szczegóły Quizu</h2>
      </div>

      <div style={{ padding: "1rem" }}>
        {loading ? (
          <div className="glass-card" style={{ padding: "2rem", textAlign: "center" }}>
            Ładowanie...
          </div>
        ) : error ? (
          <div className="glass-card" style={{ padding: "2rem", color: "#dc2626" }}>
            {error}
          </div>
        ) : quiz ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem" }}>{quiz.title}</h1>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                {quiz.description || "Brak opisu"}
              </p>
              <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
                <div className="detail-pill">
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>quiz</span>
                  <p style={{ margin: 0 }}>{quiz.questions?.length || 0} pytań</p>
                </div>
                <div className="detail-pill">
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>event</span>
                  <p style={{ margin: 0 }}>{new Date(quiz.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <h3 className="section-title">Pytania</h3>
            {quiz.questions?.map((q, idx) => (
              <div key={q.id} className="glass-card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <span style={{ fontWeight: 800, color: "var(--color-primary)" }}>Pytanie #{idx + 1}</span>
                  <span className="list-item-tag primary" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                    {q.type === "CLOSED" ? "ZAMKNIĘTE" : "OTWARTE"}
                  </span>
                </div>
                <p style={{ fontWeight: 600, margin: "0 0 1rem 0" }}>{q.questionText}</p>
                
                {q.type === "CLOSED" && q.options ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {q.options.map((opt, oIdx) => (
                      <div 
                        key={oIdx} 
                        style={{ 
                          padding: "0.75rem", 
                          borderRadius: "0.75rem", 
                          background: q.correctAnswer === opt ? "rgba(22, 163, 74, 0.1)" : "#f8fafc",
                          border: q.correctAnswer === opt ? "1px solid #16a34a" : "1px solid transparent",
                          fontSize: "0.85rem",
                          display: "flex",
                          justifyContent: "space-between"
                        }}
                      >
                        <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                        {q.correctAnswer === opt && (
                          <span className="material-symbols-outlined" style={{ fontSize: "1.1rem", color: "#16a34a" }}>check_circle</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "1rem", borderRadius: "0.75rem", background: "#f8fafc", border: "1px dashed #cbd5e1" }}>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                      Miejsce na odpowiedź opisową studenta.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default QuizViewPage;
