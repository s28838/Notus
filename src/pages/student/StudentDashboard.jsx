import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../../services/api";
import StudentBottomNav from "../../components/student/StudentBottomNav";

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
          window.dispatchEvent(new Event("student-notifications:changed"));
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
        window.dispatchEvent(new Event("student-notifications:changed"));
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
  const freshGrade = latestGrades.find(isFreshGrade);
  const freshGradeCount = latestGrades.filter(isFreshGrade).length;

  const renderScheduleSection = () => {
    if (loadingSchedule) {
      return (
        <>
          <h3 className="section-title">Następne Zajęcia</h3>
          <div className="list-container">
            {[1].map(i => (
              <div key={i} className="list-item" style={{ opacity: 0.4 }}>
                <div className="list-item-content">
                  <div style={{ height: "0.85rem", width: "60%", background: "var(--border-light)", borderRadius: "4px", marginBottom: "0.5rem" }} />
                  <div style={{ height: "0.75rem", width: "40%", background: "var(--border-light)", borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    return (
      <>
        <h3 className="section-title">{upcomingIsNextDay ? "Jutrzejsze Zajęcia" : "Następne Zajęcia"}</h3>
        <div className="list-container">
          {upcomingLessons.length > 0 ? (
            upcomingLessons.map((lesson, i) => {
              const label = upcomingIsNextDay ? { text: "Jutro", style: "secondary" } : getLessonLabel(lesson.time);
              return (
                <div key={lesson.id || i} className="list-item" onClick={goToSchedule} style={{ cursor: "pointer" }}>
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
            })
          ) : (
            <div className="list-item" onClick={goToSchedule} style={{ cursor: "pointer" }}>
              <div className="list-item-content">
                <h4 className="list-item-title">Brak zaplanowanych zajęć</h4>
                <div className="list-item-details">
                  <div className="detail-pill">
                    <span className="material-symbols-outlined">calendar_month</span>
                    <p style={{ margin: 0 }}>Sprawdź pełny plan</p>
                  </div>
                </div>
              </div>
              <div className="list-item-action">
                <span className="material-symbols-outlined">chevron_right</span>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderActivitySection = () => {
    const hasActivity = activeQuiz || freshGrade || reviewNotifications.length > 0;
    if (!hasActivity) return null;

    return (
      <>
        <h3 className="section-title">Aktywność</h3>
        <div className="list-container">
          {freshGrade && (
            <div className="list-item dashboard-status-card success" onClick={() => openGrade(freshGrade)} style={{ cursor: "pointer" }}>
              <span className="material-symbols-outlined dashboard-status-icon">notifications_active</span>
              <div className="list-item-content">
                <h4 className="list-item-title">Masz nową ocenę</h4>
                <div className="list-item-details">
                  <div className="detail-pill">
                    <span className="material-symbols-outlined">school</span>
                    <p style={{ margin: 0 }}>{freshGrade.subject || "Oceny"}</p>
                  </div>
                </div>
              </div>
              <div className="list-item-action">
                <span className="material-symbols-outlined">chevron_right</span>
              </div>
            </div>
          )}

          {activeQuiz && (
            <div
              className={`list-item dashboard-status-card ${activeQuiz.alreadySubmitted ? "success" : "primary"}`}
              onClick={() => !activeQuiz.alreadySubmitted && navigate(`/student/quiz/${activeQuiz.assignmentId}`)}
              style={{ cursor: activeQuiz.alreadySubmitted ? "default" : "pointer" }}
            >
              <span className="material-symbols-outlined dashboard-status-icon">
                {activeQuiz.alreadySubmitted ? "check_circle" : "quiz"}
              </span>
              <div className="list-item-content">
                <h4 className="list-item-title">{activeQuiz.quizTitle}</h4>
                <div className="list-item-details">
                  <div className="detail-pill">
                    <span className="material-symbols-outlined">{activeQuiz.alreadySubmitted ? "done" : "bolt"}</span>
                    <p style={{ margin: 0 }}>
                      {activeQuiz.alreadySubmitted
                        ? `Ukończono · ${activeQuiz.myScore}/${activeQuiz.myTotal} pkt`
                        : "Quiz aktywny"}
                    </p>
                  </div>
                </div>
              </div>
              {!activeQuiz.alreadySubmitted && (
                <div className="list-item-action">
                  <span className="material-symbols-outlined">chevron_right</span>
                </div>
              )}
            </div>
          )}

          {reviewNotifications.map(n => (
            <div
              key={n.submissionId}
              className="list-item dashboard-status-card success"
              onClick={() => { navigate(`/student/quiz/${n.assignmentId}`); dismissReview(n.submissionId); }}
              style={{ cursor: "pointer" }}
            >
              <span className="material-symbols-outlined dashboard-status-icon">mark_email_read</span>
              <div className="list-item-content">
                <h4 className="list-item-title">Quiz oceniony: {n.quizTitle}</h4>
                <div className="list-item-details">
                  <div className="detail-pill">
                    <span className="material-symbols-outlined">grading</span>
                    <p style={{ margin: 0 }}>{n.score}/{n.total} pkt</p>
                  </div>
                </div>
              </div>
              <button
                className="dashboard-dismiss-btn"
                onClick={e => { e.stopPropagation(); dismissReview(n.submissionId); }}
                aria-label="Ukryj powiadomienie"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderGradesSection = () => {
    if (latestGrades.length === 0) return null;

    return (
      <>
        <h3 className="section-title">Ostatnie oceny</h3>
        <div className="list-container">
          {latestGrades.map(grade => (
            <div key={grade.id} className="list-item" onClick={() => openGrade(grade)} style={{ cursor: "pointer" }}>
              <div className="list-item-content">
                <div className="list-item-top">
                  {isFreshGrade(grade) && <p className="list-item-tag primary">Nowa</p>}
                  {freshGradeCount > 0 && isFreshGrade(grade) && <p className="list-item-tag secondary">+{freshGradeCount}</p>}
                </div>
                <h4 className="list-item-title">{grade.subject}</h4>
                <div className="list-item-details">
                  <div className="detail-pill">
                    <span className="material-symbols-outlined">groups</span>
                    <p style={{ margin: 0 }}>{grade.groupName || "Grupa"}</p>
                  </div>
                </div>
              </div>
              <div className="dashboard-grade-value">{grade.value}</div>
            </div>
          ))}
        </div>
      </>
    );
  };

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

      {renderScheduleSection()}
      {renderActivitySection()}
      {renderGradesSection()}



      <StudentBottomNav />
    </div>
  );
};

export default StudentDashboard;
