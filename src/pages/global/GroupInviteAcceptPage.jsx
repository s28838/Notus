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
      setError("To zaproszenie jest nieprawidłowe albo wygasło.");
      setLoading(false);
      return;
    }

    localStorage.setItem("notus:pendingGroupInviteToken", token);
    apiGet("/api/group-invitations/preview", { token }, null)
      .then(setPreview)
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
            {!isAuthReady ? null : !user ? (
              <>
                <p className="muted">Zaloguj się lub zarejestruj jako uczeń, a potem wróć do tego linku.</p>
                <button className="primary-action-btn" onClick={() => navigate("/login")}>Przejdź do logowania</button>
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
