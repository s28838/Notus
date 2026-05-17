import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../../services/api";

const getLessonLabel = (timeStr) => {
  if (!timeStr || !timeStr.includes(" - ")) return null;
  const [startStr, endStr] = timeStr.split(" - ");
  const [sH, sM] = startStr.split(":").map(Number);
  const [eH, eM] = endStr.split(":").map(Number);
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = sH * 60 + sM;
  const end = eH * 60 + eM;
  if (cur >= start && cur <= end) return { text: "Teraz", style: "primary" };
  if (cur < start) {
    const diff = start - cur;
    if (diff <= 60) return { text: `Za ${diff} min`, style: "primary" };
    return { text: `Za ${Math.floor(diff / 60)}h ${diff % 60}min`, style: "secondary" };
  }
  return null;
};

const isFreshGrade = (grade) => Boolean(grade?.isNew ?? grade?.new);

const StudentDashboard = () => {
  const { user, getToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [upcomingIsNextDay, setUpcomingIsNextDay] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [reviewNotifications, setReviewNotifications] = useState([]);
  const [latestGrades, setLatestGrades] = useState([]);
  const pollRef = useRef(null);
  const reviewPollRef = useRef(null);

  useEffect(() => {
    const loadAttendanceStatus = () => {
      const saved = localStorage.getItem("student_attendance_status");

      if (!saved) {
        setAttendanceStatus(null);
        return;
      }

      try {
  const parsed = JSON.parse(saved);

  if (parsed.sessionEndsAt && new Date(parsed.sessionEndsAt) < new Date()) {
    localStorage.removeItem("student_attendance_status");
    setAttendanceStatus(null);
    return;
  }

  setAttendanceStatus(parsed);
} catch {
        localStorage.removeItem("student_attendance_status");
        setAttendanceStatus(null);
      }
    };

    loadAttendanceStatus();

    window.addEventListener("focus", loadAttendanceStatus);
    window.addEventListener("storage", loadAttendanceStatus);

    return () => {
      window.removeEventListener("focus", loadAttendanceStatus);
      window.removeEventListener("storage", loadAttendanceStatus);
    };
  }, []);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const token = await getToken();
        const data = await apiGet("/api/schedule/next", null, token);
        
        if (data && data.id) {
          setUpcomingLessons([data]);
          const todayStr = new Date().toDateString();
          const lessonDateStr = new Date(data.date).toDateString();
          setUpcomingIsNextDay(todayStr !== lessonDateStr);
        } else {
          setUpcomingLessons([]);
          setUpcomingIsNextDay(false);
        }
      } catch {
        setUpcomingLessons([]);
        setUpcomingIsNextDay(false);
      } finally {
        setLoadingSchedule(false);
      }
    };

    const fetchGrades = async () => {
      try {
        if (user?.role !== 'teacher') {
          const token = await getToken();
          const res = await apiGet("/api/grades/recent", null, token);
          
          const now = new Date();
          const mappedGrades = (res || []).map(grade => {
            const issueDate = new Date(grade.issueDate);
            const is24h = (now - issueDate) < 24 * 60 * 60 * 1000;
            return {
              ...grade,
              isRecent24h: is24h
            };
          });
          
          setLatestGrades(mappedGrades);
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (user) {
      fetchSchedule();
      fetchGrades();
    }
  }, [user, getToken]);

  useEffect(() => {
    const sessionId = attendanceStatus?.sessionId;

    const check = async () => {
      if (!sessionId) { setActiveQuiz(null); return; }
      try {
        const token = await getToken();
        const data = await apiGet(
          "/api/quiz-assignments/active-for-session",
          { sessionId },
          token
        );
        setActiveQuiz(data?.assignmentId ? data : null);
      } catch {
        setActiveQuiz(null);
      }
    };

    check();
    pollRef.current = setInterval(check, 5000);
    return () => clearInterval(pollRef.current);
  }, [attendanceStatus?.sessionId, getToken]);

  useEffect(() => {
    const checkReviews = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await apiGet("/api/quiz-assignments/new-reviews", null, token);
        setReviewNotifications(Array.isArray(data) ? data : []);
      } catch {
        // silently ignore
      }
    };

    checkReviews();
    reviewPollRef.current = setInterval(checkReviews, 5000);
    return () => clearInterval(reviewPollRef.current);
  }, [getToken]);

  const dismissReview = async (submissionId) => {
    try {
      const token = await getToken();
      await apiPost(`/api/quiz-assignments/submissions/${submissionId}/mark-seen`, {}, token);
      setReviewNotifications(prev => prev.filter(n => n.submissionId !== submissionId));
    } catch {
      // silently ignore
    }
  };

  const clearAttendanceStatus = () => {
    localStorage.removeItem("student_attendance_status");
    setAttendanceStatus(null);
    setActiveQuiz(null);
  };

  const openGrade = async (grade) => {
    try {
      const token = await getToken();
      if (grade?.id) {
        await apiPost(`/api/grades/${grade.id}/mark-seen`, {}, token);
        setLatestGrades((prev) => prev.map((item) => item.id === grade.id ? { ...item, isNew: false, new: false } : item));
      }
    } catch {
      // Nawigacja do ocen jest ważniejsza niż samo oznaczenie powiadomienia jako przeczytane.
    }

    if (grade?.groupId) {
      navigate(`/student/groups/${grade.groupId}/grades`);
    } else {
      navigate("/student/groups");
    }
  };

  const goToProfile = () => navigate("/student/settings");
  const goToSchedule = () => navigate("/student/schedule");
  const goToGroups = () => navigate("/student/groups");
  const goToScanQR = () => navigate("/student/scan-qr");
  const goToStats = () => navigate("/student/stats");

  return (
    <div className="app-container">
      <header className="top-bar">
        <button className="icon-btn" onClick={() => navigate("/student/settings")}>
          <span className="material-symbols-outlined">account_circle</span>
        </button>
        <h2 className="top-bar-title">Strona Główna</h2>
        <div style={{ width: "2.5rem" }} />
      </header>

      <div className="hero-card">
        <div className="hero-card-icon">
          <span className="material-symbols-outlined" style={{ fontSize: "2rem" }}>
            {attendanceStatus ? "fact_check" : "qr_code_scanner"}
          </span>
        </div>

        <div className="hero-card-inner">
          {attendanceStatus ? (
            <div className="hero-card-details">
              <h1 className="hero-card-title">
                {activeQuiz && !activeQuiz.alreadySubmitted ? "Quiz jest aktywny!" : "Jesteś obecny"}
              </h1>
              <p className="hero-card-subtitle" style={{ fontWeight: 700 }}>
                {activeQuiz && !activeQuiz.alreadySubmitted ? activeQuiz.quizTitle : (attendanceStatus.sessionTitle || "Aktywna sesja")}
              </p>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.92)", fontSize: "0.85rem", fontWeight: 600 }}>
                {activeQuiz && !activeQuiz.alreadySubmitted 
                  ? "Możesz już wypełnić quiz" 
                  : `Zapisano: ${attendanceStatus.checkedInAt ? new Date(attendanceStatus.checkedInAt).toLocaleTimeString() : "-"}`}
              </p>
              {attendanceStatus.indexNumber && (
                <p style={{ margin: "0.3rem 0 0 0", color: "rgba(255,255,255,0.82)", fontSize: "0.8rem", fontWeight: 500 }}>
                  Nr indeksu: {attendanceStatus.indexNumber}
                </p>
              )}
              
              {/* Moved Quiz Button here for better visibility within the card flow */}
              {activeQuiz && !activeQuiz.alreadySubmitted && (
                <button
                  className="btn-white btn-hero pulse-animation"
                  onClick={() => navigate(`/student/quiz/${activeQuiz.assignmentId}`)}
                  style={{
                    marginTop: "1rem",
                    color: "#16a34a",
                    fontWeight: 800,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>quiz</span>
                    Weź Quiz
                  </span>
                </button>
              )}
            </div>
          ) : (
            <>
              <h1 className="hero-card-title" style={{ fontSize: "1.5rem" }}>Zeskanuj kod QR</h1>
              <p className="hero-card-subtitle">Zeskanuj kod w sali, aby zalogować obecność</p>
            </>
          )}
        </div>

        <div className="hero-card-button-group">
          {(!activeQuiz || activeQuiz.alreadySubmitted) && (
            <button className="btn-white btn-hero" onClick={goToScanQR}>
              Otwórz skaner
            </button>
          )}
          
          {attendanceStatus && (
            <button className="btn-outline-white" onClick={clearAttendanceStatus} style={{ marginTop: activeQuiz && !activeQuiz.alreadySubmitted ? "0" : "0.5rem" }}>
              Wyczyść status
            </button>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            marginRight: "-4rem",
            marginTop: "-4rem",
            width: "12rem",
            height: "12rem",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%"
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            marginLeft: "-2rem",
            marginBottom: "-2rem",
            width: "8rem",
            height: "8rem",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "50%"
          }}
        />
      </div>

      {!loadingSchedule && (
        <div className="interactive-card" style={{ margin: "0 1rem", padding: "1rem", borderRadius: "1rem", background: "var(--surface-light)", border: "1px solid var(--border-light)", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", cursor: "pointer" }} onClick={goToSchedule}>
           <div style={{ background: "rgba(244,89,37,0.1)", padding: "0.75rem", borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
             <span className="material-symbols-outlined" style={{ color: "var(--color-primary)", fontSize: "1.5rem" }}>schedule</span>
           </div>
           <div style={{ flex: 1, minWidth: 0 }}>
             <p style={{ margin: "0 0 0.25rem", fontSize: "0.7rem", fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
               {upcomingLessons.length > 0 ? (upcomingIsNextDay ? "Jutrzejsze zajęcia" : "Następne zajęcia") : "Najbliższe zajęcia"}
             </p>
             <p style={{ margin: "0 0 0.25rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
               {upcomingLessons.length > 0 ? upcomingLessons[0].subject : "Brak zaplanowanych zajęć"}
             </p>
             <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
               {upcomingLessons.length > 0 ? (
                 <>
                   <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>schedule</span> {upcomingLessons[0].time}
                   <span className="material-symbols-outlined" style={{ fontSize: "1rem", marginLeft: "0.5rem" }}>location_on</span> {upcomingLessons[0].room || "TBD"}
                 </>
               ) : (
                 "Sprawdź swój pełny plan"
               )}
             </p>
           </div>
           <span className="material-symbols-outlined" style={{ color: "var(--text-tertiary)" }}>chevron_right</span>
        </div>
      )}

      {user?.role !== "teacher" && latestGrades.some(isFreshGrade) && (
        <div
          className="interactive-card"
          style={{ margin: "1rem 1rem 0 1rem", padding: "0.85rem 1rem", borderRadius: "1rem", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
          onClick={() => openGrade(latestGrades.find(isFreshGrade))}
        >
          <span className="material-symbols-outlined" style={{ color: "#16a34a", fontSize: "1.4rem" }}>notifications_active</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 800, color: "var(--text-primary)", fontSize: "0.9rem" }}>Masz nową ocenę</p>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.78rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Kliknij, aby przejść do ocen z przedmiotu {latestGrades.find(isFreshGrade)?.subject || "w grupie"}.
            </p>
          </div>
          <span className="material-symbols-outlined" style={{ color: "#16a34a" }}>chevron_right</span>
        </div>
      )}

      {user?.role !== "teacher" && latestGrades.length > 0 && (
        <div className="interactive-card" style={{ margin: "1rem 1rem 0 1rem", padding: "1rem", borderRadius: "1rem", background: "var(--surface-light)", border: "1px solid var(--border-light)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <span className="material-symbols-outlined" style={{ color: "#16a34a", fontSize: "1.25rem" }}>school</span>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>Ostatnie oceny</h3>
            {latestGrades.filter(isFreshGrade).length > 0 && (
              <span style={{ background: "#16a34a", color: "white", padding: "0.1rem 0.4rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 800, marginLeft: "auto" }}>
                +{latestGrades.filter(isFreshGrade).length} nowe
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {latestGrades.map(grade => (
              <button
                key={grade.id}
                type="button"
                onClick={() => openGrade(grade)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", padding: "0.45rem 0", border: 0, borderBottom: "1px solid rgba(22, 163, 74, 0.1)", background: "transparent", cursor: "pointer", textAlign: "left" }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{grade.subject}</span>
                  <small style={{ display: "block", color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{grade.groupName || "Grupa"}</small>
                </span>
                {isFreshGrade(grade) && (
                  <span style={{ background: "rgba(22,163,74,0.12)", color: "#16a34a", padding: "0.1rem 0.35rem", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 900 }}>
                    Nowa
                  </span>
                )}
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: isFreshGrade(grade) || grade.isRecent24h ? "#16a34a" : "var(--text-primary)" }}>{grade.value}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeQuiz && (
        <div
          style={{
            margin: "0 1rem",
            borderRadius: "0.75rem",
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            background: activeQuiz.alreadySubmitted ? "rgba(34,197,94,0.08)" : "rgba(244,89,37,0.07)",
            border: `1px solid ${activeQuiz.alreadySubmitted ? "rgba(34,197,94,0.25)" : "rgba(244,89,37,0.2)"}`,
            cursor: activeQuiz.alreadySubmitted ? "default" : "pointer",
          }}
          onClick={() => !activeQuiz.alreadySubmitted && navigate(`/student/quiz/${activeQuiz.assignmentId}`)}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "1.25rem", color: activeQuiz.alreadySubmitted ? "#16a34a" : "var(--color-primary)", flexShrink: 0 }}
          >
            {activeQuiz.alreadySubmitted ? "check_circle" : "quiz"}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)" }}>
              {activeQuiz.quizTitle}
            </p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              {activeQuiz.alreadySubmitted
                ? `Ukończono · ${activeQuiz.myScore}/${activeQuiz.myTotal} pkt`
                : "Quiz aktywny — kliknij, aby wypełnić"}
            </p>
          </div>
          {!activeQuiz.alreadySubmitted && (
            <span className="material-symbols-outlined" style={{ fontSize: "1.1rem", color: "var(--color-primary)" }}>
              chevron_right
            </span>
          )}
        </div>
      )}

      {reviewNotifications.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", margin: "0 1rem" }}>
          {reviewNotifications.map(n => (
            <div
              key={n.submissionId}
              style={{
                borderRadius: "0.75rem", padding: "0.75rem 1rem",
                display: "flex", alignItems: "center", gap: "0.75rem",
                background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)",
                cursor: "pointer"
              }}
              onClick={() => { navigate(`/student/quiz/${n.assignmentId}`); dismissReview(n.submissionId); }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "1.25rem", color: "#16a34a", flexShrink: 0 }}>
                mark_email_read
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  Quiz oceniony: {n.quizTitle}
                </p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  Wynik: {n.score}/{n.total} pkt — kliknij, aby zobaczyć
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); dismissReview(n.submissionId); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "var(--text-secondary)" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>close</span>
              </button>
            </div>
          ))}
        </div>
      )}



      <nav className="bottom-nav-stitch">
        <button className="nav-item active" onClick={() => navigate("/student")}>
          <span className="material-symbols-outlined fill">home</span>
          Główna
        </button>
        <button className="nav-item" onClick={goToSchedule}>
          <span className="material-symbols-outlined">calendar_month</span>
          Plan
        </button>
        <button className="nav-item" onClick={goToGroups}>
          <span className="material-symbols-outlined">groups</span>
          Grupy
        </button>
        <button className="nav-item" onClick={() => navigate("/student/activity")}>
          <span className="material-symbols-outlined">notifications</span>
          Aktywność
        </button>
        <button className="nav-item" onClick={goToProfile}>
          <span className="material-symbols-outlined">person</span>
          Profil
        </button>
      </nav>
    </div>
  );
};

export default StudentDashboard;
