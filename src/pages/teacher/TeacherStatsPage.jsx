import React, { useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { API_BASE, apiGet } from "../../services/api";
import TeacherBottomNav from "../../components/teacher/TeacherBottomNav";
import LoadingState from "../../components/shared/LoadingState";
import AppPageLayout from "../../components/shared/AppPageLayout";
import { EmptyState, ErrorState } from "../../components/shared/PageState";

const pillStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "0.4rem 0.75rem",
  borderRadius: "0.5rem",
  fontSize: "0.8rem",
  fontWeight: 600
};

const TeacherStatsPage = () => {
  const { getToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        const data = await apiGet("/api/history/teacher", null, token);
        setHistory(Array.isArray(data) ? data : []);
      } catch {
        setError("Nie udało się pobrać historii.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [getToken]);

  const handleDownloadPdf = async (scheduleId) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${API_BASE}/api/history/teacher/session/${scheduleId}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "podsumowanie-zajec.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Nie udało się pobrać PDF.");
    }
  };

  const openSessionDetails = async (session) => {
    setSelectedSession(session);
    setSessionLoading(true);
    setSessionDetails(null);

    try {
      const token = await getToken();
      const data = await apiGet(`/api/history/teacher/session/${session.scheduleId}`, null, token);
      setSessionDetails(Array.isArray(data) ? data : []);
    } catch {
      setSessionDetails({ error: true });
    } finally {
      setSessionLoading(false);
    }
  };

  const closeSessionDetails = () => {
    setSelectedSession(null);
    setSessionDetails(null);
    setSessionLoading(false);
  };

  const openReview = (submissionId) => {
    closeSessionDetails();
    navigate(`/teacher/review/${submissionId}`);
  };

  const renderSessionCard = (session) => (
    <div
      key={session.scheduleId}
      className="glass-card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        marginBottom: "1rem",
        border: "1px solid var(--border-light)",
        cursor: "pointer"
      }}
      onClick={() => openSessionDetails(session)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: "0 0 0.25rem", fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)" }}>
            {session.scheduleSubject}
          </p>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            {new Date(session.scheduleDate).toLocaleDateString()} · {session.scheduleTime}
          </p>
        </div>
        <span className="material-symbols-outlined" style={{ color: "var(--text-tertiary)" }}>
          open_in_full
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
        {session.sessionId ? (
          <span style={{ ...pillStyle, background: "rgba(34, 197, 94, 0.1)", color: "#16a34a" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>group</span>
            {session.attendanceCount} obecnych
          </span>
        ) : (
          <span style={{ ...pillStyle, background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>group_off</span>
            Brak obecności
          </span>
        )}

        {session.quizAssignmentId ? (
          <span style={{ ...pillStyle, background: "rgba(56, 189, 248, 0.1)", color: "#0ea5e9" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>quiz</span>
            {session.quizSubmissionCount} odp. ({session.quizAvgScore}% śr)
          </span>
        ) : (
          <span style={{ ...pillStyle, background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>quiz</span>
            Brak quizu
          </span>
        )}
      </div>

      <button
        className="secondary-action-btn"
        onClick={(event) => {
          event.stopPropagation();
          openSessionDetails(session);
        }}
        style={{ alignSelf: "flex-start", padding: "0.5rem 0.75rem", fontSize: "0.8rem" }}
      >
        Zobacz uczestników
      </button>
    </div>
  );

  const renderParticipantsModal = () => {
    if (!selectedSession) return null;

    return createPortal(
      <div className="modal-backdrop" onClick={closeSessionDetails}>
        <div
          className="modal-card"
          role="dialog"
          aria-modal="true"
          aria-label="Lista uczestników sesji"
          onClick={(event) => event.stopPropagation()}
          style={{ width: "min(820px, 100%)", gap: "1rem" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.35rem" }}>{selectedSession.scheduleSubject}</h2>
              <p style={{ margin: "0.25rem 0 0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                {new Date(selectedSession.scheduleDate).toLocaleDateString()} · {selectedSession.scheduleTime}
              </p>
            </div>
            <button className="icon-btn" type="button" onClick={closeSessionDetails} aria-label="Zamknij">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={{ ...pillStyle, background: "rgba(34, 197, 94, 0.1)", color: "#16a34a" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>group</span>
              {selectedSession.attendanceCount} obecnych
            </span>
            {selectedSession.quizAssignmentId ? (
              <span style={{ ...pillStyle, background: "rgba(56, 189, 248, 0.1)", color: "#0ea5e9" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>quiz</span>
                {selectedSession.quizSubmissionCount} odp. ({selectedSession.quizAvgScore}% śr)
              </span>
            ) : (
              <span style={{ ...pillStyle, background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>quiz</span>
                Brak quizu
              </span>
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "0.75rem" }}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Lista uczestników
            </h3>

            {sessionLoading ? (
              <LoadingState label="Ładowanie uczniów..." compact />
            ) : sessionDetails?.error ? (
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#ef4444" }}>Brak danych lub błąd.</p>
            ) : sessionDetails?.length === 0 ? (
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                Nikogo nie było na tych zajęciach, nikt też nie jest przypisany do tej grupy.
              </p>
            ) : (
              <div className="session-participants-scroll">
                <div className="session-participants-list">
                  {sessionDetails.map((student) => {
                    const hasQuiz = student.quizScore != null;
                    const pendingReview = Boolean(student.pendingOpenReview);
                    const canReview = Boolean(student.submissionId);
                    const quizPercent = hasQuiz && student.quizTotal > 0
                      ? Math.round((student.quizScore / student.quizTotal) * 100)
                      : 0;

                    return (
                      <div
                        key={student.studentId}
                        className="session-participant-row"
                      >
                        <span className="session-participant-name">
                          {student.studentName}
                        </span>
                        <span className={`attendance-result-chip ${student.attended ? "present" : "absent"}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
                            {student.attended ? "check_circle" : "cancel"}
                          </span>
                          {student.attended ? "Obecny" : "Nieobecny"}
                        </span>
                        {selectedSession.quizAssignmentId && (
                          hasQuiz ? (
                            <button
                              type="button"
                              className={`quiz-result-chip ${pendingReview ? "pending-review" : ""}`}
                              onClick={() => canReview && openReview(student.submissionId)}
                              disabled={!canReview}
                            >
                              <span className="material-symbols-outlined">
                                {pendingReview ? "rate_review" : "fact_check"}
                              </span>
                              {pendingReview ? "Oceń odpowiedź" : `${student.quizScore}/${student.quizTotal} (${quizPercent}%)`}
                            </button>
                          ) : (
                            <span className="quiz-result-chip empty">
                              -/-
                            </span>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {selectedSession.quizId && (
            <button
              className="pdf-download-btn"
              onClick={() => handleDownloadPdf(selectedSession.scheduleId)}
            >
              <span className="material-symbols-outlined">picture_as_pdf</span>
              Pobierz podsumowanie PDF
            </button>
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <AppPageLayout
      title="Historia Sesji"
      leftIcon="arrow_back"
      onLeftClick={() => navigate("/teacher")}
      leftAriaLabel="Wróć do panelu nauczyciela"
      loading={loading}
      loadingLabel="Ładowanie historii..."
      bottomNav={<TeacherBottomNav />}
      shell="teacher"
    >
      {error ? (
        <ErrorState iconStyle={{ fontSize: "2rem" }}>{error}</ErrorState>
      ) : history.length === 0 ? (
        <EmptyState icon="history" iconStyle={{ fontSize: "3rem", color: "var(--border-light)" }}>
          <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>Brak historii</p>
          <p style={{ margin: 0, fontSize: "0.875rem" }}>
            Otwórz listę obecności lub zadaj quiz w trakcie zajęć.
          </p>
        </EmptyState>
      ) : (
        <div className="list-container">
          {history.map(renderSessionCard)}
        </div>
      )}

      {renderParticipantsModal()}
    </AppPageLayout>
  );
};

export default TeacherStatsPage;
