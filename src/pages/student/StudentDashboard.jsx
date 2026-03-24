import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../../services/api";

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
  const [loadingSchedule, setLoadingSchedule] = useState(true);

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
        const data = await apiGet("/api/schedule", {
          start: startOfDay.toISOString(),
          end: endOfDay.toISOString(),
        }, token);

        if (!data || data.length === 0) {
          setUpcomingLessons([]);
          return;
        }

        const curMins = now.getHours() * 60 + now.getMinutes();

        const upcoming = data
          .filter(l => {
            if (!l.time || !l.time.includes(" - ")) return false;
            const endStr = l.time.split(" - ")[1];
            const [eH, eM] = endStr.split(":").map(Number);
            return eH * 60 + eM >= curMins;
          })
          .slice(0, 3);

        setUpcomingLessons(upcoming);
      } catch {
        setUpcomingLessons([]);
      } finally {
        setLoadingSchedule(false);
      }
    };

    if (user) fetchSchedule();
  }, [user, getToken]);

  const clearAttendanceStatus = () => {
    localStorage.removeItem("student_attendance_status");
    setAttendanceStatus(null);
  };

  const goToProfile = () => navigate("/student/profile");
  const goToSchedule = () => navigate("/student/schedule");
  const goToScanQR = () => navigate("/student/scan-qr");
  const goToStats = () => navigate("/student/stats");

  return (
    <div className="app-container">
      <div className="top-bar">
        <div
          className="icon-btn"
          style={{ background: "rgba(244, 89, 37, 0.1)", cursor: "default" }}
        >
          <span className="material-symbols-outlined text-primary">
            account_circle
          </span>
        </div>
        <h2 className="top-bar-title">Attendance Hub</h2>
        <button className="icon-btn">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>

      <div className="hero-card">
        <div className="hero-card-icon">
          <span className="material-symbols-outlined" style={{ fontSize: "2rem" }}>
            {attendanceStatus ? "fact_check" : "qr_code_scanner"}
          </span>
        </div>

        <div style={{ zIndex: 2 }}>
          {attendanceStatus ? (
            <>
              <h1 className="hero-card-title">Jesteś obecny</h1>
              <p
                className="hero-card-subtitle"
                style={{ marginBottom: "0.35rem", fontWeight: 700 }}
              >
                {attendanceStatus.sessionTitle || "Aktywna sesja"}
              </p>
              <p
                style={{
                  margin: 0,
                  color: "rgba(255,255,255,0.92)",
                  fontSize: "0.85rem",
                  fontWeight: 600
                }}
              >
                Zapisano:{" "}
                {attendanceStatus.checkedInAt
                  ? new Date(attendanceStatus.checkedInAt).toLocaleTimeString()
                  : "-"}
              </p>

              {attendanceStatus.indexNumber && (
                <p
                  style={{
                    margin: "0.3rem 0 0 0",
                    color: "rgba(255,255,255,0.82)",
                    fontSize: "0.8rem",
                    fontWeight: 500
                  }}
                >
                  Nr indeksu: {attendanceStatus.indexNumber}
                </p>
              )}
            </>
          ) : (
            <>
              <h1 className="hero-card-title">Quick Scan</h1>
              <p className="hero-card-subtitle">
                Tap to mark attendance via QR code
              </p>
            </>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.65rem",
            zIndex: 2
          }}
        >
          <button className="btn-white" onClick={goToScanQR}>
            {attendanceStatus ? "Otwórz skaner" : "Open Scanner"}
          </button>

          {attendanceStatus && (
            <button
              onClick={clearAttendanceStatus}
              style={{
                border: "1px solid rgba(255,255,255,0.45)",
                background: "rgba(255,255,255,0.12)",
                color: "white",
                padding: "0.8rem 1rem",
                borderRadius: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
                backdropFilter: "blur(4px)"
              }}
            >
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

      {loadingSchedule ? (
        <div style={{ padding: "0 1rem" }}>
          <h3 className="section-title">Next Classes</h3>
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
        </div>
      ) : upcomingLessons.length > 0 ? (
        <div style={{ padding: "0 1rem" }}>
          <h3 className="section-title">Next Classes</h3>
          <div className="list-container">
            {upcomingLessons.map((lesson, i) => {
              const label = getLessonLabel(lesson.time);
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
        </div>
      ) : null}

      <nav className="bottom-nav-stitch">
        <button className="nav-item active" onClick={() => navigate("/student")}>
          <span className="material-symbols-outlined fill">home</span>
          Home
        </button>
        <button className="nav-item" onClick={goToSchedule}>
          <span className="material-symbols-outlined">calendar_month</span>
          Schedule
        </button>
        <button className="nav-item" onClick={goToStats}>
          <span className="material-symbols-outlined">bar_chart</span>
          Stats
        </button>
        <button className="nav-item" onClick={goToProfile}>
          <span className="material-symbols-outlined">person</span>
          Profile
        </button>
      </nav>
    </div>
  );
};

export default StudentDashboard;