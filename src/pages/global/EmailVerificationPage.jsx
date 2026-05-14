import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiPost } from "../../services/api";

const EmailVerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useMemo(() => new URLSearchParams(location.search).get("token") || "", [location.search]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Potwierdzamy adres email...");
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    if (!token) {
      setStatus("error");
      setMessage("Link weryfikacyjny jest nieprawidłowy albo wygasł.");
      return;
    }

    apiPost("/api/auth/teacher/verify-email", { token }, null)
      .then((response) => {
        if (response?.token && response?.user) {
          localStorage.setItem("clerkToken", response.token);
          localStorage.setItem("notus:selectedRole", response.user.role?.toLowerCase?.() || "teacher");
          localStorage.setItem("notus:authProvider", "local");
          window.dispatchEvent(new Event("storage"));
        }
        setStatus("success");
        setMessage(response?.message || "Email potwierdzony.");
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error.message || "Link weryfikacyjny jest nieprawidłowy albo wygasł.");
      });
  }, [token]);

  const goToTeacherPanel = () => window.location.assign("/teacher");
  const goToLogin = () => navigate("/login", { replace: true });

  return (
    <div className="login-page invite-page">
      <div className="invite-panel">
        <span className="material-symbols-outlined invite-icon">
          {status === "success" ? "mark_email_read" : "mail"}
        </span>
        <h1>Weryfikacja emaila</h1>
        {status === "error" ? (
          <div className="error-banner">{message}</div>
        ) : status === "success" ? (
          <div className="success-banner">{message}</div>
        ) : (
          <p>{message}</p>
        )}
        {status === "success" && (
          <button className="primary-action-btn" onClick={goToTeacherPanel}>
            Przejdź do panelu nauczyciela
          </button>
        )}
        {status === "error" && (
          <button className="primary-action-btn" onClick={goToLogin}>
            Wróć do logowania
          </button>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
