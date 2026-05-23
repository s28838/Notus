import React, { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet } from "../../services/api";
import { TEACHER_REALTIME_EVENTS, useTeacherRealtime } from "../../hooks/useTeacherRealtime";

const READ_NOTIFICATIONS_KEY = "notus_teacher_read_notifications";

const loadReadNotificationIds = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

const TeacherBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnread = useCallback(async () => {
    try {
      const response = await apiGet("/api/teacher/notifications");
      const readIds = loadReadNotificationIds();
      const notifications = Array.isArray(response.notifications) ? response.notifications : [];
      setUnreadCount(notifications.filter((item) => !item.read && !readIds.has(item.id)).length);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    loadUnread();
    window.addEventListener("teacher-notifications:read", loadUnread);
    window.addEventListener("storage", loadUnread);
    return () => {
      window.removeEventListener("teacher-notifications:read", loadUnread);
      window.removeEventListener("storage", loadUnread);
    };
  }, [loadUnread]);

  useTeacherRealtime(TEACHER_REALTIME_EVENTS, loadUnread);

  const navItems = [
    { label: "Główna", icon: "home", path: "/teacher" },
    { label: "Plan", icon: "calendar_month", path: "/teacher/schedule" },
    { label: "Grupy", icon: "groups", path: "/teacher/groups" },
    { label: "Aktywność", icon: "notifications", path: "/teacher/activity" },
    { label: "Historia", icon: "history", path: "/teacher/stats" },
    { label: "Quizy", icon: "quiz", path: "/teacher/quizzes" },
    { label: "Profil", icon: "person", path: "/teacher/settings" },
  ];

  return (
    <nav className="bottom-nav-stitch">
      <div className="nav-main-items">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon-wrap">
                <span className={`material-symbols-outlined ${isActive ? "fill" : ""}`}>
                  {item.icon}
                </span>
                {item.path === "/teacher/activity" && unreadCount > 0 && (
                  <span className="nav-notification-badge">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
      <button className="nav-item nav-logout" onClick={logout}>
        <span className="material-symbols-outlined">logout</span>
        Wyloguj
      </button>
    </nav>
  );
};

export default TeacherBottomNav;
