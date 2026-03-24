import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [attendanceStatus, setAttendanceStatus] = useState(null);

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
} catch (err) {
        console.error("Błąd odczytu statusu obecności:", err);
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

      <div className="stats-card">
        <div className="stats-header">
          <p className="stats-title">
            <span className="material-symbols-outlined text-primary">
              analytics
            </span>
            Total Attendance
          </p>
          <p className="stats-value">92%</p>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: "92%" }}></div>
        </div>
        <div className="stats-footer">
          <p className="stats-target">Target: 85%</p>
          <p className="stats-above">+7% above goal</p>
        </div>
      </div>

      <h3 className="section-title">Next Classes</h3>
      <div className="list-container">
        <div className="list-item">
          <div className="list-item-content">
            <div className="list-item-top">
              <span
                className="material-symbols-outlined list-item-tag primary"
                style={{ fontSize: "14px" }}
              >
                schedule
              </span>
              <p className="list-item-tag primary">Starts in 15 mins</p>
            </div>
            <h4 className="list-item-title">Advanced Calculus</h4>
            <div className="list-item-details">
              <div className="detail-pill">
                <span className="material-symbols-outlined">alarm</span>
                <p style={{ margin: 0 }}>10:30 AM</p>
              </div>
              <div className="detail-pill">
                <span className="material-symbols-outlined">location_on</span>
                <p style={{ margin: 0 }}>Room 402</p>
              </div>
            </div>
          </div>
          <div className="list-item-action">
            <span className="material-symbols-outlined">chevron_right</span>
          </div>
        </div>

        <div className="list-item" style={{ opacity: 0.8 }}>
          <div className="list-item-content">
            <div className="list-item-top">
              <span
                className="material-symbols-outlined list-item-tag secondary"
                style={{ fontSize: "14px" }}
              >
                schedule
              </span>
              <p className="list-item-tag secondary">Starts in 1 hour</p>
            </div>
            <h4 className="list-item-title">Data Structures</h4>
            <div className="list-item-details">
              <div className="detail-pill">
                <span className="material-symbols-outlined">alarm</span>
                <p style={{ margin: 0 }}>11:45 AM</p>
              </div>
              <div className="detail-pill">
                <span className="material-symbols-outlined">location_on</span>
                <p style={{ margin: 0 }}>Lab 03</p>
              </div>
            </div>
          </div>
          <div
            className="list-item-action"
            style={{
              background: "rgba(0,0,0,0.05)",
              color: "var(--text-tertiary)"
            }}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </div>
        </div>
      </div>

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