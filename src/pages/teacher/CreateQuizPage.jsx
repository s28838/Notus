import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiDelete, apiGet, apiPost, apiPostMultipart } from "../../services/api";

const inputStyle = {
  width: "100%",
  padding: "0.75rem",
  boxSizing: "border-box"
};

const labelStyle = {
  display: "block",
  marginBottom: "0.5rem",
  fontWeight: 700,
  fontSize: "0.9rem"
};

const providerLabels = {
  OPENAI: "OpenAI",
  ANTHROPIC: "Anthropic",
  GOOGLE_GEMINI: "Google Gemini"
};

const providerOptions = Object.entries(providerLabels).map(([value, label]) => ({ value, label }));
const MAX_PDF_FILE_SIZE_BYTES = 25 * 1024 * 1024;

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
  const [aiQuizTitle, setAiQuizTitle] = useState("Quiz z dokumentu");
  const [aiQuizDescription, setAiQuizDescription] = useState("");
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiKeys, setAiKeys] = useState([]);
  const [aiModels, setAiModels] = useState([]);
  const [aiProvider, setAiProvider] = useState("OPENAI");
  const [aiKeyLabel, setAiKeyLabel] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [selectedAiKeyId, setSelectedAiKeyId] = useState("");
  const [selectedAiModel, setSelectedAiModel] = useState("");
  const [aiKeysLoading, setAiKeysLoading] = useState(false);
  const [savingAiKey, setSavingAiKey] = useState(false);
  const [aiKeyError, setAiKeyError] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [contextLesson, setContextLesson] = useState(null);

  const loadAiSettings = async () => {
    setAiKeysLoading(true);
    setAiKeyError("");
    try {
      const token = await getToken();
      const [keys, models] = await Promise.all([
        apiGet("/api/teacher/ai-keys", null, token),
        apiGet("/api/teacher/ai-keys/models", null, token)
      ]);
      const nextKeys = Array.isArray(keys) ? keys : [];
      const nextModels = Array.isArray(models) ? models : [];
      setAiKeys(nextKeys);
      setAiModels(nextModels);

      if (!selectedAiKeyId && nextKeys.length > 0) {
        const firstKey = nextKeys[0];
        setSelectedAiKeyId(String(firstKey.id));
        const firstModel = nextModels.find((model) => model.provider === firstKey.provider);
        if (firstModel) {
          setSelectedAiModel(firstModel.model);
        }
      }
    } catch (err) {
      setAiKeyError(err.message || "Nie udało się pobrać konfiguracji AI.");
    } finally {
      setAiKeysLoading(false);
    }
  };

  useEffect(() => {
    loadAiSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getToken]);

  useEffect(() => {
    const selectedKey = aiKeys.find((key) => String(key.id) === String(selectedAiKeyId));
    if (!selectedKey) {
      setSelectedAiModel("");
      return;
    }

    const modelsForProvider = aiModels.filter((model) => model.provider === selectedKey.provider);
    if (modelsForProvider.length > 0 && !modelsForProvider.some((model) => model.model === selectedAiModel)) {
      setSelectedAiModel(modelsForProvider[0].model);
    }
  }, [aiKeys, aiModels, selectedAiKeyId, selectedAiModel]);

  useEffect(() => {
    if (!scheduleId) return;
    const loadLesson = async () => {
      try {
        const token = await getToken();
        const lesson = await apiGet(`/api/schedule/${scheduleId}`, null, token);
        setContextLesson(lesson);
        setTitle((current) => current || `Quiz: ${lesson.subject || "zajęcia"}`);
        setAiQuizTitle((current) => current || `Quiz: ${lesson.subject || "zajęcia"}`);
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

  const getSelectedAiKey = () => (
    aiKeys.find((key) => String(key.id) === String(selectedAiKeyId)) || null
  );

  const getModelsForProvider = (provider) => (
    aiModels.filter((model) => model.provider === provider)
  );

  const handleSaveAiKey = async () => {
    if (!aiApiKey.trim()) {
      setAiKeyError("Wpisz klucz API.");
      return;
    }

    try {
      setSavingAiKey(true);
      setAiKeyError("");
      const token = await getToken();
      const created = await apiPost("/api/teacher/ai-keys", {
        provider: aiProvider,
        label: aiKeyLabel.trim() || null,
        apiKey: aiApiKey.trim()
      }, token);

      setAiApiKey("");
      setAiKeyLabel("");
      await loadAiSettings();
      if (created?.id) {
        setSelectedAiKeyId(String(created.id));
      }
    } catch (err) {
      setAiKeyError(err.message || "Nie udało się zapisać klucza API.");
    } finally {
      setSavingAiKey(false);
    }
  };

  const handleDeleteAiKey = async (id) => {
    if (!window.confirm("Usunąć ten klucz API z konta?")) return;

    try {
      setAiKeyError("");
      const token = await getToken();
      await apiDelete(`/api/teacher/ai-keys/${id}`, token);
      const remaining = aiKeys.filter((key) => String(key.id) !== String(id));
      setAiKeys(remaining);
      if (String(selectedAiKeyId) === String(id)) {
        const nextKey = remaining[0];
        setSelectedAiKeyId(nextKey ? String(nextKey.id) : "");
      }
    } catch (err) {
      setAiKeyError(err.message || "Nie udało się usunąć klucza API.");
    }
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
    if (aiFile.size > MAX_PDF_FILE_SIZE_BYTES) {
      alert("Plik PDF jest za duży. Maksymalny rozmiar to 25 MB.");
      return;
    }
    if (!aiQuizTitle.trim()) {
      alert("Podaj tytuł quizu.");
      return;
    }
    const questionCount = Number(aiQuestionCount);
    if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 30) {
      alert("Liczba pytań musi być od 1 do 30.");
      return;
    }
    const selectedKey = getSelectedAiKey();
    if (!selectedKey) {
      alert("Wybierz zapisany klucz API.");
      return;
    }
    if (!selectedAiModel) {
      alert("Wybierz model AI.");
      return;
    }
    try {
      setLoading(true);
      setStatusMsg("Analizuję PDF i generuję pytania...");
      const token = await getToken();
      const fd = new FormData();
      fd.append("file", aiFile);
      fd.append("apiKeyId", String(selectedKey.id));
      fd.append("model", selectedAiModel);
      fd.append("title", aiQuizTitle.trim());
      fd.append("description", aiQuizDescription.trim());
      fd.append("questionCount", String(questionCount));
      
      const generated = await apiPostMultipart("/api/quiz/from-pdf", fd, token);
      
      // After generation, we can either save automatically or let teacher review.
      // User said "Teacher should be able to create... using a PDF".
      // Let's save it and go back to list.
      await saveAndMaybeAssign({
        ...generated,
        title: aiQuizTitle.trim(),
        description: aiQuizDescription.trim(),
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

  const selectedAiKey = getSelectedAiKey();
  const aiModelsForSelectedKey = selectedAiKey ? getModelsForProvider(selectedAiKey.provider) : [];

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
            <div style={{ textAlign: "left", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: "0 0 0.5rem" }}>Klucze API nauczyciela</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0 0 1rem" }}>
                Klucz jest szyfrowany w bazie i po zapisie nie jest już zwracany w odpowiedziach API.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>
                  Dostawca
                  <select
                    className="form-input"
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value)}
                    style={{ ...inputStyle, marginTop: "0.35rem" }}
                  >
                    {providerOptions.map((provider) => (
                      <option key={provider.value} value={provider.value}>{provider.label}</option>
                    ))}
                  </select>
                </label>
                <label style={{ ...labelStyle, marginBottom: 0 }}>
                  Nazwa klucza
                  <input
                    className="form-input"
                    value={aiKeyLabel}
                    onChange={(e) => setAiKeyLabel(e.target.value)}
                    placeholder="np. konto szkolne"
                    style={{ ...inputStyle, marginTop: "0.35rem" }}
                  />
                </label>
              </div>

              <label style={labelStyle}>Klucz API</label>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "stretch" }}>
                <input
                  className="form-input"
                  type="password"
                  autoComplete="off"
                  spellCheck="false"
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  placeholder="Wklej klucz API"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  className="btn-primary"
                  type="button"
                  onClick={handleSaveAiKey}
                  disabled={savingAiKey || !aiApiKey.trim()}
                  style={{ width: "auto", minWidth: "8rem", padding: "0 1rem" }}
                >
                  {savingAiKey ? "Zapisuję..." : "Zapisz"}
                </button>
              </div>

              {aiKeyError && (
                <p style={{ color: "#f87171", fontSize: "0.85rem", fontWeight: 700, margin: "0.75rem 0 0" }}>
                  {aiKeyError}
                </p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
                {aiKeysLoading && <p style={{ color: "var(--text-secondary)", margin: 0 }}>Ładowanie kluczy...</p>}
                {!aiKeysLoading && aiKeys.length === 0 && (
                  <p style={{ color: "var(--text-secondary)", margin: 0 }}>Dodaj pierwszy klucz, aby generować quizy z PDF.</p>
                )}
                {aiKeys.map((key) => (
                  <div
                    key={key.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      border: "1px solid var(--border-color)",
                      borderRadius: "0.75rem",
                      padding: "0.75rem"
                    }}
                  >
                    <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", flex: 1, minWidth: 0 }}>
                      <input
                        type="radio"
                        name="selected-ai-key"
                        checked={String(selectedAiKeyId) === String(key.id)}
                        onChange={() => setSelectedAiKeyId(String(key.id))}
                      />
                      <span style={{ minWidth: 0 }}>
                        <strong style={{ display: "block", color: "var(--text-primary)" }}>{key.label}</strong>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                          {providerLabels[key.provider] || key.provider} · {key.keyPreview}
                        </span>
                      </span>
                    </label>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => handleDeleteAiKey(key.id)}
                      title="Usuń klucz"
                      style={{ color: "#f87171", background: "transparent" }}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <span className="material-symbols-outlined" style={{ fontSize: "4rem", color: "var(--color-primary)", marginBottom: "1.5rem" }}>
              upload_file
            </span>
            <h3 style={{ margin: "0 0 1rem 0" }}>Generuj Quiz z PDF</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Prześlij plik PDF z materiałami i określ podstawowe informacje o quizie.
            </p>
            
            <div style={{ textAlign: "left", marginBottom: "1rem" }}>
              <label style={labelStyle}>Tytuł quizu *</label>
              <input
                className="form-input"
                value={aiQuizTitle}
                onChange={(e) => setAiQuizTitle(e.target.value)}
                placeholder="np. Quiz z biologii komórki"
                style={{ ...inputStyle, marginBottom: "0.75rem" }}
              />

              <label style={labelStyle}>Opis quizu</label>
              <textarea
                className="form-input"
                value={aiQuizDescription}
                onChange={(e) => setAiQuizDescription(e.target.value)}
                placeholder="Krótki opis dla uczniów"
                style={{ ...inputStyle, minHeight: "84px", resize: "vertical", marginBottom: "0.75rem" }}
              />

              <label style={labelStyle}>Liczba pytań</label>
              <input
                className="form-input"
                type="number"
                min="1"
                max="30"
                value={aiQuestionCount}
                onChange={(e) => setAiQuestionCount(e.target.value)}
                style={{ ...inputStyle, marginBottom: "0.75rem" }}
              />

              <label style={labelStyle}>Aktywny klucz</label>
              <select
                className="form-input"
                value={selectedAiKeyId}
                onChange={(e) => setSelectedAiKeyId(e.target.value)}
                disabled={aiKeysLoading || aiKeys.length === 0}
                style={{ ...inputStyle, marginBottom: "0.75rem" }}
              >
                <option value="">{aiKeysLoading ? "Ładowanie kluczy..." : "Wybierz klucz"}</option>
                {aiKeys.map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.label} · {providerLabels[key.provider] || key.provider} · {key.keyPreview}
                  </option>
                ))}
              </select>

              <label style={labelStyle}>Model</label>
              <select
                className="form-input"
                value={selectedAiModel}
                onChange={(e) => setSelectedAiModel(e.target.value)}
                disabled={!selectedAiKey || aiModelsForSelectedKey.length === 0}
                style={{ ...inputStyle }}
              >
                <option value="">{selectedAiKey ? "Wybierz model" : "Najpierw wybierz klucz"}</option>
                {aiModelsForSelectedKey.map((model) => (
                  <option key={model.model} value={model.model}>{model.label}</option>
                ))}
              </select>
            </div>

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
              disabled={loading || !aiFile || !selectedAiKey || !selectedAiModel || !aiQuizTitle.trim()}
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
