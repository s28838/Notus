import { useContext, useEffect, useRef, useState } from "react";
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

const StudentDashboard = () => {
  const { user, getToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [upcomingIsNextDay, setUpcomingIsNextDay] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [reviewNotifications, setReviewNotifications] = useState([]);
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
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const token = await getToken();
        const data = await apiGet("/api/student/schedule/range", {
          start: startOfDay.toISOString(),
          end: endOfDay.toISOString(),
        }, token);

        const curMins = now.getHours() * 60 + now.getMinutes();

        const upcoming = (data || [])
          .filter(l => {
            if (!l.time || !l.time.includes(" - ")) return false;
            const endStr = l.time.split(" - ")[1];
            const [eH, eM] = endStr.split(":").map(Number);
            return eH * 60 + eM >= curMins;
          })
          .sort((a, b) => {
            const [aH, aM] = a.time.split(" - ")[0].split(":").map(Number);
            const [bH, bM] = b.time.split(" - ")[0].split(":").map(Number);
            return (aH * 60 + aM) - (bH * 60 + bM);
          })
          .slice(0, 3);

        if (upcoming.length > 0) {
          setUpcomingLessons(upcoming);
          setUpcomingIsNextDay(false);
        } else {
          // No remaining lessons today — try tomorrow
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const startOfTomorrow = new Date(tomorrow);
          startOfTomorrow.setHours(0, 0, 0, 0);
          const endOfTomorrow = new Date(tomorrow);
          endOfTomorrow.setHours(23, 59, 59, 999);
          const tomorrowData = await apiGet("/api/student/schedule/range", {
            start: startOfTomorrow.toISOString(),
            end: endOfTomorrow.toISOString(),
          }, token);
          if (tomorrowData && tomorrowData.length > 0) {
            const tomorrowUpcoming = tomorrowData
              .filter(l => l.time && l.time.includes(" - "))
              .sort((a, b) => {
                const [aH, aM] = a.time.split(" - ")[0].split(":").map(Number);
                const [bH, bM] = b.time.split(" - ")[0].split(":").map(Number);
                return (aH * 60 + aM) - (bH * 60 + bM);
              })
              .slice(0, 3);
            setUpcomingLessons(tomorrowUpcoming);
            setUpcomingIsNextDay(true);
          } else {
            setUpcomingLessons([]);
            setUpcomingIsNextDay(false);
          }
        }
      } catch {
        setUpcomingLessons([]);
        setUpcomingIsNextDay(false);
      } finally {
        setLoadingSchedule(false);
      }
    };

    if (user) fetchSchedule();
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

  const goToProfile = () => navigate("/student/profile");
  const goToSchedule = () => navigate("/student/schedule");
  const goToScanQR = () => navigate("/student/scan-qr");
  const goToStats = () => navigate("/student/stats");

  return (
    <div className="app-container">
      <header className="top-bar">
        <button className="icon-btn" onClick={() => navigate("/student/profile")}>
          <span className="material-symbols-outlined">account_circle</span>
        </button>
        <h2 className="top-bar-title">Centrum Obecności</h2>
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
              <h1 className="hero-card-title">Szybki Skan</h1>
              <p className="hero-card-subtitle">Zeskanuj kod QR, aby potwierdzić obecność</p>
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

      {loadingSchedule ? (
        <>
          <h3 className="section-title">Następne Zajęcia</h3>
          <div className="list-container">
            {[1, 2].map(i => (
              <div key={i} className="list-item" style={{ opacity: 0.4 }}>
                <div className="list-item-content">
                  <div style={{ height: "0.85rem", width: "60%", background: "var(--border-light)", borderRadius: "4px", marginBottom: "0.5rem" }} />
                  <div style={{ height: "0.75rem", width: "40%", background: "var(--border-light)", borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : upcomingLessons.length > 0 ? (
        <>
          <h3 className="section-title">{upcomingIsNextDay ? "Jutrzejsze Zajęcia" : "Następne Zajęcia"}</h3>
          <div className="list-container">
            {upcomingLessons.map((lesson, i) => {
              const label = upcomingIsNextDay ? { text: "Jutro", style: "secondary" } : getLessonLabel(lesson.time);
              return (
                <div key={i} className="list-item" onClick={goToSchedule} style={{ cursor: "pointer" }}>
                  <div className="list-item-content">
                    {label && (
                      <div className="list-item-top">
                        <span className="material-symbols-outlined list-item-tag primary" style={{ fontSize: "14px" }}>schedule</span>
                        <p className={`list-item-tag ${label.style}`}>{label.text}</p>
                      </div>
                    )}
                    <h4 className="list-item-title">{lesson.subject}</h4>
                    <div className="list-item-details">
                      <div className="detail-pill">
                        <span className="material-symbols-outlined">alarm</span>
                        <p style={{ margin: 0 }}>{lesson.time}</p>
                      </div>
                      <div className="detail-pill">
                        <span className="material-symbols-outlined">location_on</span>
                        <p style={{ margin: 0 }}>{lesson.room || "TBD"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="list-item-action">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      <nav className="bottom-nav-stitch">
        <button className="nav-item active" onClick={() => navigate("/student")}>
          <span className="material-symbols-outlined fill">home</span>
          Główna
        </button>
        <button className="nav-item" onClick={goToSchedule}>
          <span className="material-symbols-outlined">calendar_month</span>
          Plan
        </button>
        <button className="nav-item" onClick={goToStats}>
          <span className="material-symbols-outlined">history</span>
          Historia
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