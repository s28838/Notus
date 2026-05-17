import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiGet } from "../../services/api";

const READ_NOTIFICATIONS_KEY = "notus_student_read_notifications";

const loadReadNotificationIds = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

const StudentBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;

    const loadUnread = async () => {
      try {
        const response = await apiGet("/api/student/notifications");
        const readIds = loadReadNotificationIds();
        const notifications = Array.isArray(response.notifications) ? response.notifications : [];
        const count = notifications.filter((item) => !item.read && !readIds.has(item.id)).length;
        if (active) setUnreadCount(count);
      } catch {
        if (active) setUnreadCount(0);
      }
    };

    loadUnread();
    window.addEventListener("student-notifications:read", loadUnread);
    window.addEventListener("storage", loadUnread);
    const interval = window.setInterval(loadUnread, 60000);
    return () => {
      active = false;
      window.removeEventListener("student-notifications:read", loadUnread);
      window.removeEventListener("storage", loadUnread);
      window.clearInterval(interval);
    };
  }, []);

  const navItems = [
    { label: "Główna", icon: "home", path: "/student" },
    { label: "Plan", icon: "calendar_month", path: "/student/schedule" },
    { label: "Grupy", icon: "groups", path: "/student/groups" },
    { label: "Aktywność", icon: "notifications", path: "/student/activity" },
    { label: "Profil", icon: "person", path: "/student/settings" },
  ];

  return (
    <nav className="bottom-nav-stitch">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button key={item.path} className={`nav-item ${isActive ? "active" : ""}`} onClick={() => navigate(item.path)}>
            <span className="nav-icon-wrap">
              <span className={`material-symbols-outlined ${isActive ? "fill" : ""}`}>{item.icon}</span>
              {item.path === "/student/activity" && unreadCount > 0 && (
                <span className="nav-notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};

export default StudentBottomNav;
