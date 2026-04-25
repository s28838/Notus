import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const TeacherBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Główna", icon: "home", path: "/teacher" },
    { label: "Plan", icon: "calendar_month", path: "/teacher/schedule" },
    { label: "Historia", icon: "history", path: "/teacher/stats" },
    { label: "Quizy", icon: "quiz", path: "/teacher/quizzes" },
    { label: "Profil", icon: "person", path: "/teacher/settings" },
  ];

  return (
    <nav className="bottom-nav-stitch">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            className={`nav-item ${isActive ? "active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <span className={`material-symbols-outlined ${isActive ? "fill" : ""}`}>
              {item.icon}
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};

export default TeacherBottomNav;
