import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet, apiPut } from "../../services/api";
import LoadingState from "../../components/shared/LoadingState";

const QuizViewPage = () => {
  const { getToken } = useContext(AuthContext);
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editQuestions, setEditQuestions] = useState([]);
  const [editCountAsGrade, setEditCountAsGrade] = useState(false);
  const [editGradeWeight, setEditGradeWeight] = useState(1);
  const [editSemester, setEditSemester] = useState("2");
  const [saving, setSaving] = useState(false);
  const [versionBanner, setVersionBanner] = useState("");
  const savingRef = useRef(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const data = await apiGet(`/api/quiz/${quizId}`, null, token);
        setQuiz(data);
      } catch {
        setError("Nie udało się pobrać szczegółów quizu.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId, getToken]);

  const enterEditMode = () => {
    setEditTitle(quiz.title);
    setEditQuestions(
      quiz.questions.map(q => ({
        id: q.id,
        question: q.questionText,
        type: q.type,
        options: q.options ? [...q.options] : [],
        correctAnswer: q.correctAnswer ?? "",
      }))
    );
    setEditCountAsGrade(Boolean(quiz.countAsGrade));
    setEditGradeWeight(quiz.gradeWeight || 1);
    setEditSemester(quiz.semester || "2");
    setVersionBanner("");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setEditTitle("");
    setEditQuestions([]);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!editTitle.trim()) {
      alert("Podaj tytuł quizu.");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const token = await getToken();
      const response = await apiPut(`/api/quiz/${quiz.id}`, {
        title: editTitle,
        questions: editQuestions,
        countAsGrade: editCountAsGrade,
        gradeWeight: editCountAsGrade ? Number(editGradeWeight) : null,
        semester: editCountAsGrade ? editSemester : null,
      }, token);

      if (response.id !== quiz.id) {
        // Fork was created — navigate to new version
        setIsEditing(false);
        setVersionBanner(`Utworzono nową wersję quizu (v${response.version}) — poprzednia wersja zachowana w historii`);
        setQuiz(response);
        navigate(`/teacher/quiz/${response.id}`, { replace: true });
      } else {
        setQuiz(response);
        setIsEditing(false);
      }
    } catch (err) {
      alert("Błąd podczas zapisywania: " + err.message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // Question editing helpers
  const addQuestion = (type) => {
    setEditQuestions(prev => [
      ...prev,
      { question: "", type, options: type === "CLOSED" ? ["", "", "", ""] : [], correctAnswer: "" }
    ]);
  };

  const removeQuestion = (idx) => {
    setEditQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, value) => {
    setEditQuestions(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const updateOption = (qIdx, oIdx, value) => {
    setEditQuestions(prev => {
      const next = [...prev];
      const opts = [...next[qIdx].options];
      opts[oIdx] = value;
      next[qIdx] = { ...next[qIdx], options: opts };
      return next;
    });
  };

  return (
    <div className="app-container" style={{ paddingBottom: "2rem" }}>
      <div className="top-bar">
        <button
          className="icon-btn"
          onClick={() => navigate("/teacher/quizzes")}
          style={{ background: "transparent", color: "var(--text-primary)" }}
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h2 className="top-bar-title" style={{ marginRight: isEditing ? 0 : "2.5rem" }}>
          {isEditing ? "Edytuj Quiz" : "Szczegóły Quizu"}
        </h2>
        {!loading && !error && quiz && (
          isEditing ? (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="btn-white"
                onClick={cancelEdit}
                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "0.75rem" }}
              >
                Anuluj
              </button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "0.75rem" }}
              >
                {saving ? "Zapisuję..." : "Zapisz"}
              </button>
            </div>
          ) : (
            <button
              className="icon-btn"
              onClick={enterEditMode}
              style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}
            >
              <span className="material-symbols-outlined">edit</span>
            </button>
          )
        )}
      </div>

      {loading ? (
        <LoadingState label="Ładowanie quizu..." />
      ) : error ? (
        <div style={{ padding: "1rem" }}>
          <div className="error-state">
            <span className="material-symbols-outlined" style={{ fontSize: "2rem" }}>error</span>
            {error}
          </div>
        </div>
      ) : quiz ? (
        <>
          {versionBanner && (
            <div style={{
              margin: "0 1rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              background: "rgba(22,163,74,0.08)",
              border: "1px solid rgba(22,163,74,0.25)",
              fontSize: "0.875rem",
              color: "#15803d",
              fontWeight: 600
            }}>
              {versionBanner}
            </div>
          )}

          <div className="desktop-centered-content" style={{ padding: "1rem" }}>
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              {isEditing ? (
                <input
                  className="form-input"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Tytuł quizu"
                  style={{ width: "100%", padding: "0.75rem", boxSizing: "border-box",
                           fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}
                />
              ) : (
                <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem" }}>{quiz.title}</h1>
              )}
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                {quiz.description || "Brak opisu"}
              </p>
              <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
                <div className="detail-pill">
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>quiz</span>
                  <p style={{ margin: 0 }}>
                    {isEditing ? editQuestions.length : (quiz.questions?.length || 0)} pytań
                  </p>
                </div>
                <div className="detail-pill">
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>event</span>
                  <p style={{ margin: 0 }}>{new Date(quiz.createdAt).toLocaleDateString()}</p>
                </div>
                {quiz.version > 1 && (
                  <div className="detail-pill">
                    <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>history</span>
                    <p style={{ margin: 0 }}>v{quiz.version}</p>
                  </div>
                )}
              </div>
              {isEditing ? (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-light)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontWeight: 800 }}>
                    <input
                      type="checkbox"
                      checked={editCountAsGrade}
                      onChange={(e) => setEditCountAsGrade(e.target.checked)}
                    />
                    Dodaj wynik quizu jako ocenę
                  </label>
                  {editCountAsGrade && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.75rem" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", fontWeight: 700 }}>
                        Waga
                        <input className="form-input" type="number" min="1" value={editGradeWeight} onChange={(e) => setEditGradeWeight(e.target.value)} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", fontWeight: 700 }}>
                        Semestr
                        <input className="form-input" value={editSemester} onChange={(e) => setEditSemester(e.target.value)} />
                      </label>
                    </div>
                  )}
                </div>
              ) : quiz.countAsGrade ? (
                <div className="detail-pill" style={{ marginTop: "1rem", width: "fit-content" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>grade</span>
                  <p style={{ margin: 0 }}>Quiz liczony jako ocena, waga {quiz.gradeWeight}, semestr {quiz.semester}</p>
                </div>
              ) : null}
              {isEditing && quiz.hasSubmissions && (
                <div style={{
                  marginTop: "1rem",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  background: "rgba(234,179,8,0.08)",
                  border: "1px solid rgba(234,179,8,0.3)",
                  fontSize: "0.8rem",
                  color: "#92400e",
                  fontWeight: 600
                }}>
                  Ten quiz ma już odpowiedzi od studentów — zapisanie zmian utworzy nową wersję.
                </div>
              )}
            </div>
          </div>

          <h3 className="section-title">Pytania</h3>

          {isEditing ? (
            <div className="desktop-centered-content" style={{ padding: "0 1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {editQuestions.map((q, qIdx) => (
                <div key={qIdx} className="glass-card" style={{ padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <span style={{ fontWeight: 800, color: "var(--color-primary)" }}>Pytanie #{qIdx + 1}</span>
                    <button
                      onClick={() => removeQuestion(qIdx)}
                      style={{ border: "none", background: "none", color: "#f87171", cursor: "pointer" }}
                    >
                      Usuń
                    </button>
                  </div>

                  <select
                    className="form-input"
                    value={q.type}
                    onChange={e => updateQuestion(qIdx, "type", e.target.value)}
                    style={{ marginBottom: "1rem", width: "100%" }}
                  >
                    <option value="CLOSED">Zamknięte (ABCD)</option>
                    <option value="OPEN">Otwarte (Opisowe)</option>
                  </select>

                  <textarea
                    className="form-input"
                    placeholder="Treść pytania..."
                    value={q.question}
                    onChange={e => updateQuestion(qIdx, "question", e.target.value)}
                    style={{ width: "100%", minHeight: "60px", padding: "0.75rem",
                             boxSizing: "border-box", marginBottom: "1rem" }}
                  />

                  {q.type === "CLOSED" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, width: "1.5rem" }}>
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          <input
                            className="form-input"
                            placeholder={`Opcja ${String.fromCharCode(65 + oIdx)}`}
                            value={opt}
                            onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                            style={{ flex: 1, padding: "0.6rem" }}
                          />
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={q.correctAnswer === opt && opt !== ""}
                            onChange={() => updateQuestion(qIdx, "correctAnswer", opt)}
                          />
                        </div>
                      ))}
                      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                        Zaznacz kropkę obok poprawnej odpowiedzi.
                      </p>
                    </div>
                  ) : (
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      Pytanie otwarte — oceniane ręcznie.
                    </p>
                  )}
                </div>
              ))}

              <div style={{ display: "flex", gap: "1rem" }}>
                <button className="btn-white" onClick={() => addQuestion("CLOSED")} style={{ flex: 1, fontSize: "0.8rem" }}>
                  + Zamknięte
                </button>
                <button className="btn-white" onClick={() => addQuestion("OPEN")} style={{ flex: 1, fontSize: "0.8rem" }}>
                  + Otwarte
                </button>
              </div>
            </div>
          ) : (
            <div className="list-container">
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
                            background: q.correctAnswer === opt ? "rgba(22, 163, 74, 0.1)" : "var(--surface-card, rgba(255,255,255,0.06))",
                            border: q.correctAnswer === opt ? "1px solid #16a34a" : "1px solid var(--border-light)",
                            fontSize: "0.85rem",
                            display: "flex",
                            justifyContent: "space-between"
                          }}
                        >
                          <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                          {q.correctAnswer === opt && (
                            <span className="material-symbols-outlined" style={{ fontSize: "1.1rem", color: "#16a34a" }}>
                              check_circle
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: "1rem", borderRadius: "0.75rem", background: "var(--surface-card, rgba(255,255,255,0.06))", border: "1px dashed var(--border-light)" }}>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                        Miejsce na odpowiedź opisową studenta.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default QuizViewPage;
