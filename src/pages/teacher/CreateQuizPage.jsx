import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet, apiPost, apiPostMultipart } from "../../services/api";

const CreateQuizPage = () => {
  const { getToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scheduleId = searchParams.get("scheduleId");

  const [activeTab, setActiveTab] = useState("manual"); // "manual" or "ai"
  const [title, setTitle] = useState("");
  const [countAsGrade, setCountAsGrade] = useState(false);
  const [gradeWeight, setGradeWeight] = useState(1);
  const [semester, setSemester] = useState("2");
  const [questions, setQuestions] = useState([
    { question: "", type: "CLOSED", options: ["", "", "", ""], correctAnswer: "" }
  ]);

  const [aiFile, setAiFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [contextLesson, setContextLesson] = useState(null);

  useEffect(() => {
    if (!scheduleId) return;
    const loadLesson = async () => {
      try {
        const token = await getToken();
        const lesson = await apiGet(`/api/schedule/${scheduleId}`, null, token);
        setContextLesson(lesson);
        setTitle((current) => current || `Quiz: ${lesson.subject || "zajęcia"}`);
      } catch {
        setContextLesson(null);
      }
    };
    loadLesson();
  }, [getToken, scheduleId]);

  const saveAndMaybeAssign = async (payload, token) => {
    const saved = await apiPost("/api/quiz/save", payload, token);
    if (scheduleId && saved?.id) {
      await apiPost("/api/quiz-assignments", { quizId: saved.id, scheduleId }, token);
      navigate(`/teacher/assign-quiz/${scheduleId}`);
      return;
    }
    navigate("/teacher/quizzes");
  };

  const addQuestion = (type = "CLOSED") => {
    setQuestions([...questions, { 
      question: "", 
      type, 
      options: type === "CLOSED" ? ["", "", "", ""] : [], 
      correctAnswer: "" 
    }]);
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, value) => {
    const newQs = [...questions];
    newQs[idx][field] = value;
    setQuestions(newQs);
  };

  const updateOption = (qIdx, oIdx, value) => {
    const newQs = [...questions];
    newQs[qIdx].options[oIdx] = value;
    setQuestions(newQs);
  };

  const handleManualSave = async () => {
    if (!title) {
       alert("Podaj tytuł quizu.");
       return;
    }
    try {
      setLoading(true);
      const token = await getToken();
      await saveAndMaybeAssign({
        title,
        questions,
        groupId: contextLesson?.teacherGroupId || null,
        countAsGrade,
        gradeWeight: countAsGrade ? Number(gradeWeight) : null,
        semester: countAsGrade ? semester : null,
      }, token);
    } catch (err) {
      alert("Błąd: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiFile) {
      alert("Wybierz plik PDF.");
      return;
    }
    try {
      setLoading(true);
      setStatusMsg("Analizuję PDF i generuję pytania...");
      const token = await getToken();
      const fd = new FormData();
      fd.append("file", aiFile);
      
      const generated = await apiPostMultipart("/api/quiz/from-pdf", fd, token);
      
      // After generation, we can either save automatically or let teacher review.
      // User said "Teacher should be able to create... using a PDF".
      // Let's save it and go back to list.
      await saveAndMaybeAssign({
        ...generated,
        groupId: contextLesson?.teacherGroupId || null,
        countAsGrade,
        gradeWeight: countAsGrade ? Number(gradeWeight) : null,
        semester: countAsGrade ? semester : null,
      }, token);
    } catch (err) {
      alert("Błąd AI: " + err.message);
    } finally {
      setLoading(false);
      setStatusMsg("");
    }
  };

  return (
    <div className="app-container" style={{ paddingBottom: "2rem" }}>
      <div className="top-bar">
        <button
          className="icon-btn"
          onClick={() => navigate(-1)}
          style={{ background: "transparent", color: "var(--text-primary)" }}
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h2 className="top-bar-title" style={{ marginRight: '2.5rem' }}>Stwórz Quiz</h2>
      </div>

      <div className="desktop-centered-content" style={{ padding: "1rem" }}>
        {contextLesson && (
          <div className="glass-card" style={{ marginBottom: "1rem", padding: "1rem" }}>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 700 }}>Quiz dla zajęć</p>
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-primary)", fontWeight: 800 }}>
              {contextLesson.subject} · {contextLesson.time}
            </p>
          </div>
        )}
        <div className="glass-card" style={{ display: "flex", padding: "0.5rem", marginBottom: "1.5rem" }}>
          <button
            onClick={() => setActiveTab("manual")}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "0.75rem",
              border: "none",
              background: activeTab === "manual" ? "var(--color-primary)" : "transparent",
              color: activeTab === "manual" ? "white" : "var(--text-secondary)",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Manualnie
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "0.75rem",
              border: "none",
              background: activeTab === "ai" ? "var(--color-primary)" : "transparent",
              color: activeTab === "ai" ? "white" : "var(--text-secondary)",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            AI z PDF
          </button>
        </div>

        {activeTab === "manual" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="glass-card" style={{ padding: "1.25rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.9rem" }}>Tytuł Quizu</label>
              <input
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="np. Kolokwium z Matematyki"
                style={{ width: "100%", padding: "0.75rem", boxSizing: "border-box" }}
              />
            </div>

            <div className="glass-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontWeight: 800 }}>
                <input
                  type="checkbox"
                  checked={countAsGrade}
                  onChange={(e) => setCountAsGrade(e.target.checked)}
                />
                Dodaj wynik quizu jako ocenę
              </label>
              {countAsGrade && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", fontWeight: 700 }}>
                    Waga
                    <input className="form-input" type="number" min="1" value={gradeWeight} onChange={(e) => setGradeWeight(e.target.value)} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.85rem", fontWeight: 700 }}>
                    Semestr
                    <input className="form-input" value={semester} onChange={(e) => setSemester(e.target.value)} />
                  </label>
                </div>
              )}
            </div>

            {questions.map((q, qIdx) => (
              <div key={qIdx} className="glass-card" style={{ padding: "1.25rem", position: "relative" }}>
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
                  onChange={(e) => updateQuestion(qIdx, "type", e.target.value)}
                  style={{ marginBottom: "1rem", width: "100%" }}
                >
                   <option value="CLOSED">Zamknięte (ABCD)</option>
                   <option value="OPEN">Otwarte (Opisowe)</option>
                </select>

                <textarea
                  className="form-input"
                  placeholder="Treść pytania..."
                  value={q.question}
                  onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
                  style={{ width: "100%", minHeight: "60px", padding: "0.75rem", boxSizing: "border-box", marginBottom: "1rem" }}
                />

                {q.type === "CLOSED" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, width: "1.5rem" }}>{String.fromCharCode(65 + oIdx)}.</span>
                        <input
                          className="form-input"
                          placeholder={`Opcja ${String.fromCharCode(65 + oIdx)}`}
                          value={opt}
                          onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
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
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>Zaznacz kropkę obok poprawnej odpowiedzi.</p>
                  </div>
                ) : (
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    Pytanie otwarte nie posiada opcji wyboru ani klucza odpowiedzi. Będziesz je oceniać ręcznie.
                  </p>
                )}
              </div>
            ))}

            <div style={{ display: "flex", gap: "1rem" }}>
              <button 
                className="btn-white" 
                onClick={() => addQuestion("CLOSED")} 
                style={{ flex: 1, fontSize: "0.8rem" }}
              >
                + Zamknięte
              </button>
              <button 
                className="btn-white" 
                onClick={() => addQuestion("OPEN")} 
                style={{ flex: 1, fontSize: "0.8rem" }}
              >
                + Otwarte
              </button>
            </div>

            <button 
              className="btn-primary" 
              onClick={handleManualSave} 
              disabled={loading}
              style={{ padding: "1rem", marginTop: "1rem" }}
            >
              {loading ? "Zapisywanie..." : "Zapisz Quiz"}
            </button>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: "2rem", textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "4rem", color: "var(--color-primary)", marginBottom: "1.5rem" }}>
              upload_file
            </span>
            <h3 style={{ margin: "0 0 1rem 0" }}>Generuj Quiz z PDF</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Prześlij plik PDF z materiałami, a AI wygeneruje dla Ciebie 5 pytań zamkniętych.
            </p>
            
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setAiFile(e.target.files[0])}
              style={{ display: "none" }}
              id="pdf-upload"
            />
            <label
              htmlFor="pdf-upload"
              className="btn-white"
              style={{ display: "inline-flex", cursor: "pointer", marginBottom: "1rem", width: "auto" }}
            >
              {aiFile ? aiFile.name : "Wybierz PDF"}
            </label>

            {statusMsg && (
              <p style={{ color: "var(--color-primary)", fontWeight: 700, fontSize: "0.85rem", margin: "1rem 0" }}>
                {statusMsg}
              </p>
            )}

            <button
              className="btn-primary"
              onClick={handleAiGenerate}
              disabled={loading || !aiFile}
              style={{ width: "100%", padding: "1rem", marginTop: "1rem" }}
            >
              {loading ? "Generuję..." : "Generuj z AI"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateQuizPage;
