import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../../services/api";


const TeacherDashboard = () => {
  const { user, getToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [currentLesson, setCurrentLesson] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  const [qr, setQr] = useState(() => {
    const saved = localStorage.getItem("active_qr_session");
    return saved ? JSON.parse(saved) : null;
  });
  const [loadingQr, setLoadingQr] = useState(false);
  const [errorQr, setErrorQr] = useState("");

  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);

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

        if (user?.role === "teacher" && user?.name) {
          params.teacherName = user.name;
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
        } else {
          setCurrentLesson(null);
        }
      } catch (err) {
        console.error("Dashboard schedule error:", err);
      } finally {
        setLoadingSchedule(false);
      }
    };

    if (user?.name) {
      fetchTodaySchedule();
    }
  }, [user, getToken]);

  const fetchAttendance = async (sessionId) => {
    if (!sessionId) return;

    try {
      setAttendanceLoading(true);
      const token = await getToken();
      const data = await apiGet(`/api/attendance/sessions/${sessionId}/records`, token);
      setAttendanceList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Attendance fetch error:", err);
      setAttendanceList([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (!qr?.sessionId || !showAttendance) return;

    fetchAttendance(qr.sessionId);

    const interval = setInterval(() => {
      fetchAttendance(qr.sessionId);
    }, 3000);

    return () => clearInterval(interval);
  }, [qr?.sessionId, showAttendance]);

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
        { title: sessionTitle },
        token
      );

      const qrResp = await apiGet(
        `/api/attendance/sessions/${created.sessionId}/qr`,
        token
      );

      setQr(qrResp);
    } catch (err) {
      console.error("QR Generation Error:", err);
      setErrorQr("Nie udało się wygenerować kodu.");
    } finally {
      setLoadingQr(false);
    }
  };

  const handleCloseSession = () => {
    setQr(null);
    setAttendanceList([]);
    setShowAttendance(false);
    setErrorQr("");
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

  const goToProfile = () => navigate("/teacher/profile");
  const goToSchedule = () => navigate("/teacher/schedule");
  const goToHistory = () => navigate("/teacher/stats");

  return (
    <div className="app-container">
      <div className="top-bar">
        <div
          className="icon-btn"
          style={{ background: "rgba(244, 89, 37, 0.1)", cursor: "default" }}
        >
          <span className="material-symbols-outlined text-primary">shield_person</span>
        </div>
        <h2 className="top-bar-title">Teacher Hub</h2>
        <button
          className="icon-btn"
          style={{ background: "transparent", color: "var(--text-primary)" }}
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>

      <div
        className="hero-card"
        style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", width: "100%" }}>
          <div className="hero-card-icon" style={{ margin: 0, flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: "2rem" }}>
              {qr ? "qr_code_2" : "add_box"}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <h1 className="hero-card-title" style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>
              {qr ? "Aktywna Sesja QR" : "Pokaż kod dla zajęć"}
            </h1>
            <p className="hero-card-subtitle" style={{ margin: 0 }}>
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
        </div>

        {qr ? (
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              alignItems: "center",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "1.25rem",
              padding: "1.5rem 1rem",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "0.75rem",
                borderRadius: "1rem",
                boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
              }}
            >
              <img
                src={`data:image/png;base64,${qr.qrPngBase64}`}
                alt="QR"
                style={{ width: "140px", height: "140px", display: "block" }}
              />
            </div>

            <p
              style={{
                marginTop: "0.25rem",
                fontWeight: 800,
                fontSize: "0.875rem",
                color: "white",
                letterSpacing: "0.05em",
                textAlign: "center",
                width: "100%",
                wordBreak: "break-all",
                padding: "0 1rem",
                boxSizing: "border-box",
              }}
            >
              KOD: {qr.qrToken}
            </p>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                width: "100%",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleCreateQuiz}
                style={{
                  background: "white",
                  border: "none",
                  color: "var(--color-primary)",
                  padding: "0.6rem 1rem",
                  borderRadius: "99px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
              >
                Stwórz quiz
              </button>

              <button
                onClick={handleCloseSession}
                style={{
                  background: "white",
                  border: "none",
                  color: "var(--color-primary)",
                  padding: "0.6rem 1rem",
                  borderRadius: "99px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
              >
                Zamknij sesję
              </button>

              <button
                onClick={() => navigate(`/teacher/attendance/${qr.sessionId}`)}
                style={{
                  background: "white",
                  border: "none",
                  color: "var(--color-primary)",
                  padding: "0.6rem 1rem",
                  borderRadius: "99px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
              >
                Lista obecności
              </button>
            </div>

            {showAttendance && (
              <div
                style={{
                  width: "100%",
                  background: "white",
                  borderRadius: "1rem",
                  padding: "1rem",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.75rem",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    Lista obecności
                  </h3>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    {attendanceList.length} os.
                  </span>
                </div>

                {attendanceLoading ? (
                  <div
                    style={{
                      padding: "0.75rem",
                      textAlign: "center",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Ładowanie obecności...
                  </div>
                ) : attendanceList.length === 0 ? (
                  <div
                    style={{
                      padding: "0.75rem",
                      textAlign: "center",
                      background: "#f8fafc",
                      borderRadius: "0.75rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Na razie nikt się nie odbił.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    {attendanceList.map((item, index) => (
                      <div
                        key={`${item.studentUid}-${index}`}
                        style={{
                          padding: "0.75rem",
                          borderRadius: "0.75rem",
                          background: "#f8fafc",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              wordBreak: "break-all",
                              fontSize: "0.9rem",
                              color: "var(--text-primary)",
                            }}
                          >
                            {item.studentUid}
                          </div>
                          <div
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            Student obecny
                          </div>
                        </div>

                        <div
                          style={{
                            whiteSpace: "nowrap",
                            fontSize: "0.8rem",
                            color: "var(--text-secondary)",
                            fontWeight: 600,
                          }}
                        >
                          {item.checkedInAt
                            ? new Date(item.checkedInAt).toLocaleTimeString()
                            : "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button
              className="btn-white"
              onClick={handleGenerateQr}
              disabled={loadingQr || !currentLesson}
              style={{ width: "100%", justifyContent: "center", height: "3.5rem", fontSize: "1rem" }}
            >
              {loadingQr ? "Generuję..." : "Generuj kod QR"}
            </button>
            {errorQr && (
              <p
                style={{
                  textAlign: "center",
                  fontSize: "0.875rem",
                  color: "rgba(255,255,255,0.9)",
                  margin: 0,
                }}
              >
                {errorQr}
              </p>
            )}
          </div>
        )}

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

      <div
        className="stats-card glass-card"
        style={{ margin: "0 1rem", padding: "1rem", border: "1px solid var(--border-light)" }}
      >
        <div className="stats-header">
          <p className="stats-title">
            <span className="material-symbols-outlined text-primary">groups</span>
            Średnia Frekwencja
          </p>
          <p className="stats-value">84%</p>
        </div>
        <div className="progress-track" style={{ marginBottom: "0.75rem" }}>
          <div className="progress-fill" style={{ width: "84%" }}></div>
        </div>
        <div className="stats-footer">
          <p className="stats-target" style={{ margin: 0 }}>Oczekiwana: 75%</p>
          <p className="stats-above" style={{ margin: 0, color: "#16a34a" }}>+9% powyżej normy</p>
        </div>
      </div>

      <h3 className="section-title">Narzędzia</h3>
      <div className="list-container">
        <div className="list-item" onClick={goToSchedule} style={{ cursor: "pointer" }}>
          <div className="list-item-content">
            <h4 className="list-item-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: "1.25rem" }}>
                calendar_month
              </span>
              Twój Plan Zajęć
            </h4>
            <div className="list-item-details">
              <div className="detail-pill">
                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>schedule</span>
                <p style={{ margin: 0 }}>Zobacz harmonogram</p>
              </div>
            </div>
          </div>
          <div className="list-item-action">
            <span className="material-symbols-outlined">chevron_right</span>
          </div>
        </div>

        <div className="list-item" onClick={goToHistory} style={{ cursor: "pointer" }}>
          <div className="list-item-content">
            <h4 className="list-item-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="material-symbols-outlined text-slate-500" style={{ fontSize: "1.25rem" }}>
                history
              </span>
              Historia Sesji
            </h4>
            <div className="list-item-details">
              <div className="detail-pill">
                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>fact_check</span>
                <p style={{ margin: 0 }}>Przeglądaj frekwencję</p>
              </div>
            </div>
          </div>
          <div className="list-item-action" style={{ background: "var(--border-light)", color: "var(--text-secondary)" }}>
            <span className="material-symbols-outlined">chevron_right</span>
          </div>
        </div>
      </div>

      <nav className="bottom-nav-stitch">
        <button className="nav-item active" onClick={() => navigate("/teacher")}>
          <span className="material-symbols-outlined fill">home</span>
          Główna
        </button>
        <button className="nav-item" onClick={goToSchedule}>
          <span className="material-symbols-outlined">calendar_month</span>
          Plan
        </button>
        <button className="nav-item" onClick={goToHistory}>
          <span className="material-symbols-outlined">bar_chart</span>
          Staty
        </button>
        <button className="nav-item" onClick={goToProfile}>
          <span className="material-symbols-outlined">person</span>
          Profil
        </button>
      </nav>
    </div>
  );
};

export default TeacherDashboard;