import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet, apiPost } from "../../services/api";
import LoadingState from "../../components/shared/LoadingState";

const GroupInviteAcceptPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const [localUser, setLocalUser] = useState(null);
  const [localAuthReady, setLocalAuthReady] = useState(Boolean(auth));
  const user = auth?.user || localUser;
  const isAuthReady = auth?.isAuthReady ?? localAuthReady;
  const logout = auth?.logout || (async () => {
    localStorage.removeItem("clerkToken");
    localStorage.removeItem("notus:authProvider");
    localStorage.removeItem("notus:selectedRole");
    setLocalUser(null);
  });
  const token = useMemo(() => new URLSearchParams(location.search).get("token") || "", [location.search]);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState("register");
  const [studentName, setStudentName] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentConfirmPassword, setStudentConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [authPending, setAuthPending] = useState(false);
  const passwordRules = useMemo(() => ([
    { id: "length", label: "Minimum 8 znaków", valid: studentPassword.length >= 8 },
    { id: "upper", label: "Jedna duża litera", valid: /[A-Z]/.test(studentPassword) },
    { id: "lower", label: "Jedna mała litera", valid: /[a-z]/.test(studentPassword) },
    { id: "digit", label: "Jedna cyfra", valid: /\d/.test(studentPassword) }
  ]), [studentPassword]);
  const isPasswordStrong = passwordRules.every((rule) => rule.valid);
  const passwordsMatch = authMode !== "register" || (
    studentConfirmPassword.length > 0 && studentPassword === studentConfirmPassword
  );
  const canSubmitAuth = authMode === "login"
    ? studentPassword.length > 0 && !authPending
    : studentName.trim().length > 0 && isPasswordStrong && passwordsMatch && !authPending;

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

  useEffect(() => {
    if (auth) {
      return;
    }

    const storedToken = localStorage.getItem("clerkToken");
    if (!storedToken) {
      setLocalAuthReady(true);
      return;
    }

    apiGet("/api/me", null, storedToken)
      .then((backendUser) => {
        setLocalUser({
          id: backendUser.id,
          email: backendUser.email,
          role: backendUser.role.toLowerCase(),
          name: backendUser.name,
          index: backendUser.indexNumber || null,
          isLocalAuth: true
        });
      })
      .catch(() => {
        localStorage.removeItem("clerkToken");
        localStorage.removeItem("notus:authProvider");
      })
      .finally(() => setLocalAuthReady(true));
  }, [auth]);

  const accept = async () => {
    setError("");
    setMessage("");
    try {
      const response = await apiPost("/api/group-invitations/accept", { token });
      setMessage(response.message || "Dołączyłeś do grupy.");
      localStorage.removeItem("notus:pendingGroupInviteToken");
      navigate("/student");
    } catch (err) {
      setError(err.message || "To zaproszenie jest nieprawidłowe albo wygasło.");
    }
  };

  const acceptWithToken = async (authToken) => {
    const response = await apiPost("/api/group-invitations/accept", { token }, authToken);
    localStorage.removeItem("notus:pendingGroupInviteToken");
    setMessage(response.message || "Dołączyłeś do grupy.");
    navigate("/student");
  };

  const authenticateAndAccept = async () => {
    setError("");
    setMessage("");

    if (!preview?.email) {
      setError("Brakuje emaila zaproszenia.");
      return;
    }

    if (!studentPassword) {
      setError("Hasło jest wymagane.");
      return;
    }

    if (authMode === "register" && !isPasswordStrong) {
      setError("Hasło nie spełnia wymagań.");
      return;
    }

    if (authMode === "register" && studentPassword !== studentConfirmPassword) {
      setError("Hasła nie są takie same.");
      return;
    }

    setAuthPending(true);
    try {
      const response = authMode === "register"
        ? await apiPost("/api/auth/student/register", {
            name: studentName || preview.email,
            email: preview.email,
            password: studentPassword
          }, null)
        : await apiPost("/api/auth/student/login", {
            email: preview.email,
            password: studentPassword
          }, null);

      if (!response?.token || !response?.user) {
        throw new Error("Nie udało się zalogować ucznia.");
      }

      localStorage.setItem("clerkToken", response.token);
      localStorage.setItem("notus:selectedRole", "student");
      localStorage.setItem("notus:authProvider", "local");
      await acceptWithToken(response.token);
    } catch (err) {
      setError(err.message || "Nie udało się dołączyć do grupy.");
    } finally {
      setAuthPending(false);
    }
  };

  const goToLogin = () => {
    localStorage.setItem("notus:selectedRole", "student");
    if (token) {
      localStorage.setItem("notus:pendingGroupInviteToken", token);
    }
    navigate("/login");
  };

  const renderStudentAuthForm = (intro) => (
    <>
      {intro && <p className="muted">{intro}</p>}

      <div className="invite-auth-tabs">
        <button
          type="button"
          className={authMode === "login" ? "active" : ""}
          onClick={() => setAuthMode("login")}
        >
          Mam konto
        </button>
        <button
          type="button"
          className={authMode === "register" ? "active" : ""}
          onClick={() => setAuthMode("register")}
        >
          Utwórz konto
        </button>
      </div>

      <div className="invite-auth-form">
        {authMode === "register" && (
          <input
            value={studentName}
            onChange={(event) => setStudentName(event.target.value)}
            placeholder="Imię i nazwisko"
          />
        )}
        <input value={preview?.email || ""} readOnly aria-label="Email zaproszenia" />
        <div className="password-field">
          <input
            value={studentPassword}
            onChange={(event) => {
              setStudentPassword(event.target.value);
              setError("");
            }}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            placeholder="Hasło"
            type={showPassword ? "text" : "password"}
            aria-invalid={authMode === "register" && studentPassword.length > 0 && !isPasswordStrong}
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
          >
            <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
          </button>
        </div>
        {authMode === "register" && (passwordFocused || studentPassword.length > 0) && (
          <div className="password-rules-tooltip" role="status">
            <strong>Hasło musi spełniać:</strong>
            {passwordRules.map((rule) => (
              <span key={rule.id} className={rule.valid ? "valid" : "invalid"}>
                <span className="material-symbols-outlined">{rule.valid ? "check_circle" : "radio_button_unchecked"}</span>
                {rule.label}
              </span>
            ))}
          </div>
        )}
        {authMode === "register" && (
          <>
            <div className="password-field">
              <input
                value={studentConfirmPassword}
                onChange={(event) => {
                  setStudentConfirmPassword(event.target.value);
                  setError("");
                }}
                placeholder="Powtórz hasło"
                type={showConfirmPassword ? "text" : "password"}
                aria-invalid={studentConfirmPassword.length > 0 && !passwordsMatch}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={showConfirmPassword ? "Ukryj powtórzone hasło" : "Pokaż powtórzone hasło"}
              >
                <span className="material-symbols-outlined">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
            {studentConfirmPassword.length > 0 && !passwordsMatch && (
              <div className="password-inline-error">Hasła nie są takie same.</div>
            )}
          </>
        )}
      </div>

      <button className="primary-action-btn" onClick={authenticateAndAccept} disabled={!canSubmitAuth}>
        {authPending
          ? "Dołączanie..."
          : authMode === "register"
            ? "Utwórz konto i dołącz"
            : "Zaloguj i dołącz"}
      </button>
      <button className="secondary-action-btn" onClick={goToLogin} disabled={authPending}>
        Kontynuuj przez Google / Clerk
      </button>
    </>
  );

  return (
    <div className="login-page invite-page">
      <div className="invite-panel">
        <span className="material-symbols-outlined invite-icon">mark_email_read</span>
        <h1>Zaproszenie do grupy</h1>

        {loading ? (
          <LoadingState label="Sprawdzanie zaproszenia..." compact />
        ) : error ? (
          <div className="error-banner">{error}</div>
        ) : (
          <>
            <p>Zaproszono Cię do grupy: <strong>{preview.groupName}</strong></p>
            {preview.teacherName && <p>Nauczyciel: <strong>{preview.teacherName}</strong></p>}
            {preview.email && <p className="muted">Zaproszenie wysłano na adres: {preview.email}</p>}
            {!isAuthReady || !user ? (
              renderStudentAuthForm("Aby dołączyć do grupy, zaloguj się albo utwórz konto ucznia na ten email.")
            ) : user.role !== "student" ? (
              <>
                <div className="error-banner">Jesteś zalogowany jako nauczyciel. Wyloguj się i wejdź jako uczeń, żeby zaakceptować zaproszenie.</div>
                {renderStudentAuthForm("Możesz też od razu zalogować albo zarejestrować konto ucznia dla tego zaproszenia.")}
                <button className="secondary-action-btn" onClick={logout}>Wyloguj nauczyciela</button>
              </>
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
