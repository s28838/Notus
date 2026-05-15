import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet, apiPost } from "../../services/api";

const GroupInviteAcceptPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthReady } = useContext(AuthContext);
  const token = useMemo(() => new URLSearchParams(location.search).get("token") || "", [location.search]);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("Brak tokenu zaproszenia.");
      setLoading(false);
      return;
    }

    localStorage.setItem("notus:pendingGroupInviteToken", token);
    apiGet("/api/group-invitations/preview", { token }, null)
      .then((response) => {
        if (!response.valid) {
          setError(response.message || "Zaproszenie jest nieprawidłowe albo wygasło.");
          return;
        }
        setPreview(response);
      })
      .catch((err) => setError(err.message || "To zaproszenie jest nieprawidłowe albo wygasło."))
      .finally(() => setLoading(false));
  }, [token]);

  const accept = async () => {
    setError("");
    setMessage("");
    try {
      const response = await apiPost("/api/group-invitations/accept", { token });
      setMessage(response.message || "Dołączyłeś do grupy.");
      localStorage.removeItem("notus:pendingGroupInviteToken");
    } catch (err) {
      setError(err.message || "To zaproszenie jest nieprawidłowe albo wygasło.");
    }
  };

  const goToLogin = () => {
    localStorage.setItem("notus:selectedRole", "student");
    if (token) {
      localStorage.setItem("notus:pendingGroupInviteToken", token);
    }
    navigate("/login");
  };

  return (
    <div className="login-page invite-page">
      <div className="invite-panel">
        <span className="material-symbols-outlined invite-icon">mark_email_read</span>
        <h1>Zaproszenie do grupy</h1>

        {loading ? (
          <p>Sprawdzanie zaproszenia...</p>
        ) : error ? (
          <div className="error-banner">{error}</div>
        ) : (
          <>
            <p>Zaproszono Cię do grupy: <strong>{preview.groupName}</strong></p>
            {preview.teacherName && <p>Nauczyciel: <strong>{preview.teacherName}</strong></p>}
            {preview.email && <p className="muted">Zaproszenie wysłano na adres: {preview.email}</p>}
            {!isAuthReady ? null : !user ? (
              <>
                <p className="muted">Aby dołączyć do grupy, zaloguj się lub utwórz konto ucznia.</p>
                <button className="primary-action-btn" onClick={goToLogin}>Zaloguj się / Utwórz konto</button>
              </>
            ) : user.role !== "student" ? (
              <div className="error-banner">Nie możesz zaakceptować zaproszenia jako nauczyciel.</div>
            ) : (
              <button className="primary-action-btn" onClick={accept}>Zaakceptuj zaproszenie</button>
            )}
          </>
        )}

        {message && <div className="success-banner">{message}</div>}
      </div>
    </div>
  );
};

export default GroupInviteAcceptPage;
