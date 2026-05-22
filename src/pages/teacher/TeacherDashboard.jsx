import React, { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../../services/api";
import TeacherBottomNav from "../../components/teacher/TeacherBottomNav";
import LoadingState from "../../components/shared/LoadingState";
import AppTopBar from "../../components/shared/AppTopBar";
import {
  DashboardItemContent,
  DashboardListItem,
  DashboardSection,
  DashboardSkeletonItem,
} from "../../components/shared/DashboardSection";
import { useTeacherRealtime } from "../../hooks/useTeacherRealtime";

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

const TeacherDashboard = () => {
  const { user, getToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [currentLesson, setCurrentLesson] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [upcomingLessons, setUpcomingLessons] = useState([]);
  const [upcomingIsNextDay, setUpcomingIsNextDay] = useState(false);

  const [qr, setQr] = useState(() => {
    const saved = localStorage.getItem("active_qr_session");
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed.sessionEndsAt && parsed.sessionEndsAt * 1000 < Date.now()) {
      localStorage.removeItem("active_qr_session");
      return null;
    }
    return parsed;
  });
  const [loadingQr, setLoadingQr] = useState(false);
  const [errorQr, setErrorQr] = useState("");

  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);

  const [lessonAssignment, setLessonAssignment] = useState(null);
  const [activatingQuiz, setActivatingQuiz] = useState(false);

  useEffect(() => {
    if (qr) {
      localStorage.setItem("active_qr_session", JSON.stringify(qr));
    } else {
      localStorage.removeItem("active_qr_session");
    }
  }, [qr]);

  useEffect(() => {
    const fetchTodaySchedule = async () => {
      try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const token = await getToken();
        let params = {
          start: startOfDay.toISOString(),
          end: endOfDay.toISOString(),
        };

        if (user?.role === "teacher") {
          if (!user.id) return; // Wait for backend synchronization
          params.teacherId = user.id;
        }

        const data = await apiGet("/api/schedule", params, token);

        if (data && data.length > 0) {
          const now = new Date();
          const currentTime = now.getHours() * 60 + now.getMinutes();

          let active = null;
          let next = null;

          for (const l of data) {
            if (!l.time || !l.time.includes(" - ")) continue;

            const [startStr, endStr] = l.time.split(" - ");
            const [sH, sM] = startStr.split(":").map(Number);
            const [eH, eM] = endStr.split(":").map(Number);

            const startMins = sH * 60 + sM;
            const endMins = eH * 60 + eM;

            if (currentTime >= startMins && currentTime <= endMins) {
              active = l;
              break;
            }

            if (currentTime < startMins && !next) {
              next = l;
            }
          }

          setCurrentLesson(active || next);

          const upcoming = data
            .filter(l => {
              if (!l.time || !l.time.includes(" - ")) return false;
              const endStr = l.time.split(" - ")[1];
              const [eH, eM] = endStr.split(":").map(Number);
              return eH * 60 + eM >= currentTime;
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
            const tomorrowParams = {
              start: startOfTomorrow.toISOString(),
              end: endOfTomorrow.toISOString(),
              ...(user?.id ? { teacherId: user.id } : {}),
            };
            const tomorrowData = await apiGet("/api/schedule", tomorrowParams, token);
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
        } else {
          setCurrentLesson(null);
          setUpcomingLessons([]);
          setUpcomingIsNextDay(false);
        }
      } catch {
        // schedule unavailable, currentLesson stays null
        setUpcomingLessons([]);
      } finally {
        setLoadingSchedule(false);
      }
    };

    if (user?.name) {
      fetchTodaySchedule();
    }
  }, [user, getToken]);

  useEffect(() => {
    if (!currentLesson?.id) return;
    const fetchAssignment = async () => {
      try {
        const token = await getToken();
        const data = await apiGet(
          "/api/quiz-assignments/by-schedules",
          { scheduleIds: currentLesson.id },
          token
        );
        setLessonAssignment(Array.isArray(data) && data.length > 0 ? data[0] : null);
      } catch {
        setLessonAssignment(null);
      }
    };
    fetchAssignment();
  }, [currentLesson?.id, getToken]);

  const handleActivateQuiz = async () => {
    if (!lessonAssignment || !qr?.sessionId) return;
    setActivatingQuiz(true);
    try {
      const token = await getToken();
      await apiPost(
        `/api/quiz-assignments/${lessonAssignment.assignmentId}/activate`,
        { sessionId: qr.sessionId },
        token
      );
      setLessonAssignment(prev => ({ ...prev, active: true }));
    } catch {
      // silent — button stays enabled
    } finally {
      setActivatingQuiz(false);
    }
  };

  const handleDeactivateQuiz = async () => {
    if (!lessonAssignment) return;
    setActivatingQuiz(true);
    try {
      const token = await getToken();
      await apiPost(
        `/api/quiz-assignments/${lessonAssignment.assignmentId}/deactivate`,
        {},
        token
      );
      setLessonAssignment(prev => ({ ...prev, active: false }));
    } catch {
      // silent
    } finally {
      setActivatingQuiz(false);
    }
  };

  const fetchAttendance = useCallback(async (sessionId) => {
    if (!sessionId) return;

    try {
      setAttendanceLoading(true);
      const token = await getToken();
      const data = await apiGet(`/api/attendance/sessions/${sessionId}/records`, null, token);
      setAttendanceList(Array.isArray(data) ? data : []);
    } catch {
      setAttendanceList([]);
    } finally {
      setAttendanceLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (!qr?.sessionId || !showAttendance) return;

    fetchAttendance(qr.sessionId);
  }, [qr?.sessionId, showAttendance, fetchAttendance]);

  const handleAttendanceRealtime = useCallback((data) => {
    if (!showAttendance || !qr?.sessionId) return;
    if (Number(data?.payload?.sessionId) === Number(qr.sessionId)) {
      fetchAttendance(qr.sessionId);
    }
  }, [fetchAttendance, qr?.sessionId, showAttendance]);

  useTeacherRealtime(["attendance.checked_in"], handleAttendanceRealtime, Boolean(qr?.sessionId));

  const handleGenerateQr = async () => {
    if (!currentLesson) return;

    setLoadingQr(true);
    setErrorQr("");
    setAttendanceList([]);
    setShowAttendance(false);

    try {
      const token = await getToken();
      const sessionTitle = `${currentLesson.subject} (${currentLesson.time})`;

      const created = await apiPost(
        "/api/attendance/sessions",
        { scheduleId: currentLesson.id },
        token
      );

      const qrResp = await apiGet(
        `/api/attendance/sessions/${created.sessionId}/qr`,
        null,
        token
      );

      setQr(qrResp);
    } catch {
      setErrorQr("Nie udało się wygenerować kodu.");
    } finally {
      setLoadingQr(false);
    }
  };

  const handleCloseSession = async () => {
    if (!qr?.sessionId) return;
    setLoadingQr(true);
    setErrorQr("");
    try {
      const token = await getToken();
      await apiPost(`/api/attendance/sessions/${qr.sessionId}/close`, {}, token);
      setQr(null);
      setAttendanceList([]);
      setShowAttendance(false);
    } catch (err) {
      setErrorQr(err.message || "Nie udało się zamknąć sesji.");
    } finally {
      setLoadingQr(false);
    }
  };

  const handleToggleAttendance = async () => {
    if (!qr?.sessionId) return;

    const nextValue = !showAttendance;
    setShowAttendance(nextValue);

    if (nextValue) {
      await fetchAttendance(qr.sessionId);
    }
  };

  const handleCreateQuiz = () => {
    navigate("/teacher/create-quiz");
  };

  const goToProfile = () => navigate("/teacher/settings");
  const goToSchedule = () => navigate("/teacher/schedule");
  const goToHistory = () => navigate("/teacher/stats");

  return (
    <div className="app-container">
      <AppTopBar
        title="Panel Nauczyciela"
        leftIcon="account_circle"
        onLeftClick={() => navigate("/teacher/settings")}
        leftAriaLabel="Przejdź do profilu"
      />

      <div className="hero-card">
        <div className="hero-card-icon">
          <span className="material-symbols-outlined" style={{ fontSize: "2rem" }}>
            {qr ? "qr_code_2" : "add_box"}
          </span>
        </div>

        <div className="hero-card-inner">
          <h1 className="hero-card-title">
            {qr ? "Aktywna Sesja QR" : "Pokaż kod dla zajęć"}
          </h1>
          <p className="hero-card-subtitle">
            {loadingSchedule ? (
              "Ładowanie planu..."
            ) : currentLesson ? (
              (() => {
                const now = new Date();
                const currentTime = now.getHours() * 60 + now.getMinutes();
                const [startStr, endStr] = currentLesson.time.split(" - ");
                const [sH, sM] = startStr.split(":").map(Number);
                const [eH, eM] = endStr.split(":").map(Number);
                const startMins = sH * 60 + sM;
                const endMins = eH * 60 + eM;
                const isActive = currentTime >= startMins && currentTime <= endMins;
                return (
                  <>
                    <span style={{ fontWeight: 700, opacity: 0.9 }}>
                      {isActive ? "Teraz: " : "Następne: "}
                    </span>
                    {currentLesson.subject} ({currentLesson.time})
                  </>
                );
              })()
            ) : (
              "Brak zajęć na dziś"
            )}
          </p>
        </div>

        <div className="hero-card-button-group">
          {qr ? (
            <div className="hero-card-inner" style={{ alignItems: "center", gap: "1rem" }}>
              <div className="hero-qr-container">
                <img
                  src={`data:image/png;base64,${qr.qrPngBase64}`}
                  alt="QR"
                  style={{ width: "140px", height: "140px", display: "block" }}
                />
              </div>

              <p className="hero-qr-code-text">
                KOD: {qr.shortCode}
              </p>

              <div style={{ display: "flex", gap: "0.75rem", width: "100%", justifyContent: "center", flexWrap: "wrap" }}>
                {lessonAssignment ? (
                  <>
                    {lessonAssignment.active ? (
                      <button
                        className="hero-pill-btn"
                        onClick={handleDeactivateQuiz}
                        disabled={activatingQuiz}
                        style={{ background: "#22c55e", color: "white" }}
                      >
                        {activatingQuiz ? "..." : "✓ Quiz aktywny"}
                      </button>
                    ) : (
                      <button
                        className="hero-pill-btn"
                        onClick={handleActivateQuiz}
                        disabled={activatingQuiz}
                      >
                        {activatingQuiz ? "..." : "Aktywuj quiz"}
                      </button>
                    )}
                    <button
                      className="hero-pill-btn"
                      onClick={() => navigate(`/teacher/assign-quiz/${currentLesson?.id}`)}
                    >
                      Zmień quiz
                    </button>
                  </>
                ) : (
                  <button className="hero-pill-btn" onClick={() => navigate(`/teacher/assign-quiz/${currentLesson?.id}`)}>
                    Dodaj quiz
                  </button>
                )}
                <button className="hero-pill-btn" onClick={handleCloseSession} disabled={loadingQr}>
                  {loadingQr ? "Zamykam..." : "Zamknij sesję"}
                </button>
                <button className="hero-pill-btn" onClick={() => navigate(`/teacher/attendance/${qr.sessionId}`)}>
                  Lista obecności
                </button>
              </div>

              {showAttendance && (
                <div className="attendance-list-overlay">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Lista obecności</h3>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                      {attendanceList.length} os.
                    </span>
                  </div>

                  {attendanceLoading ? (
                    <LoadingState label="Ładowanie obecności..." compact />
                  ) : attendanceList.length === 0 ? (
                    <div className="empty-state" style={{ padding: "1rem" }}>Na razie nikt się nie odbił.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {attendanceList.map((item, index) => (
                         <div key={`${item.studentUid}-${index}`} className="attendance-row">
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{item.studentName}</div>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{item.indexNumber || "Brak indeksu"}</div>
                          </div>
                          <div style={{ whiteSpace: "nowrap", fontSize: "0.8rem", fontWeight: 600 }}>
                            {item.checkedInAt ? new Date(item.checkedInAt).toLocaleTimeString() : "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              className="btn-white btn-hero"
              onClick={handleGenerateQr}
              disabled={loadingQr || !currentLesson}
            >
              {loadingQr ? "Generuję..." : "Generuj kod QR"}
            </button>
          )}
          {errorQr && (
            <p style={{ textAlign: "center", fontSize: "0.875rem", color: "rgba(255,255,255,0.9)", margin: 0 }}>
              {errorQr}
            </p>
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
            borderRadius: "50%",
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
            borderRadius: "50%",
          }}
        />
      </div>


      {loadingSchedule ? (
        <DashboardSection title="Następne Zajęcia">
          {[1, 2].map(i => <DashboardSkeletonItem key={i} />)}
        </DashboardSection>
      ) : upcomingLessons.length > 0 ? (
        <DashboardSection title={upcomingIsNextDay ? "Jutrzejsze Zajęcia" : "Następne Zajęcia"}>
            {upcomingLessons.map((lesson, i) => {
              const label = upcomingIsNextDay ? { text: "Jutro", style: "secondary" } : getLessonLabel(lesson.time);
              return (
                <DashboardListItem key={lesson.id || i} onClick={goToSchedule}>
                  <DashboardItemContent
                    tag={label?.text}
                    tagStyle={label?.style || "primary"}
                    title={lesson.subject}
                    details={[
                      { icon: "alarm", label: lesson.time },
                      { icon: "location_on", label: lesson.room || "TBD" },
                    ]}
                  />
                </DashboardListItem>
              );
            })}
        </DashboardSection>
      ) : null}

      <TeacherBottomNav />
    </div>
  );
};

export default TeacherDashboard;
