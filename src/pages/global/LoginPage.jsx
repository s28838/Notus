import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import notusLogo from "../../assets/notus-logo2.png";
import { Navigate } from "react-router-dom";
import { apiPost } from "../../services/api";
import { useClerk } from "@clerk/react";

const fieldStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid var(--border-light)",
  borderRadius: "0.75rem",
  padding: "0.85rem 1rem",
  fontSize: "0.95rem",
  color: "var(--text-primary)",
  background: "var(--surface-light)",
  outline: "none"
};

const primaryButtonStyle = {
  width: "100%",
  minHeight: "52px",
  padding: "0.9rem 1rem",
  borderRadius: "0.85rem",
  border: "none",
  background: "var(--color-primary)",
  color: "#ffffff",
  fontWeight: 900,
  fontSize: "0.95rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
  boxShadow: "0 12px 24px rgba(244, 89, 37, 0.28)"
};

const secondaryButtonStyle = {
  width: "100%",
  minHeight: "48px",
  padding: "0.8rem 1rem",
  borderRadius: "0.75rem",
  border: "1px solid var(--border-light)",
  background: "var(--surface-light)",
  color: "var(--text-primary)",
  fontWeight: 800,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem"
};

const ClerkGoogleButton = ({ mode = "signIn", onPrepare, onError, disabled, style, children }) => {
  const clerk = useClerk();
  const [redirecting, setRedirecting] = useState(false);
  const isReady = clerk.loaded && clerk.client;

  const handleGoogleRedirect = async () => {
    setRedirecting(true);
    try {
      const shouldContinue = await onPrepare?.();
      if (shouldContinue === false) {
        setRedirecting(false);
        return;
      }

      const authResource = mode === "signUp" ? clerk.client.signUp : clerk.client.signIn;
      if (!isReady || !authResource) {
        throw new Error("Clerk nie jest jeszcze gotowy. Spróbuj ponownie za chwilę.");
      }

      await authResource.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/login"
      });
    } catch (err) {
      onError?.(err.message || "Nie udało się rozpocząć logowania przez Google.");
      setRedirecting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleRedirect}
      disabled={disabled || redirecting || !isReady}
      style={{
        ...style,
        opacity: disabled || redirecting || !isReady ? 0.75 : 1,
        cursor: disabled || redirecting || !isReady ? "wait" : "pointer"
      }}
    >
      {children}
    </button>
  );
};

const LoginPage = () => {
  const {
    user,
    isLoaded,
    isSignedIn,
    login,
    authError,
    retryUserSync,
    teacherEmailLogin,
    teacherEmailRegister,
    studentEmailLogin,
    studentEmailRegister
  } = useContext(AuthContext);
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) &&
    !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.includes("replace_me");

  const [selectedRole, setSelectedRole] = useState(() => localStorage.getItem("notus:selectedRole") || "student");
  const [teacherTab, setTeacherTab] = useState("login");
  const [studentTab, setStudentTab] = useState("login");
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [devTeacherCode, setDevTeacherCode] = useState(() => {
    const stored = localStorage.getItem("notus:teacherAccessCode");
    return stored && !stored.startsWith("TEST-") ? stored : "notus-teacher-dev";
  });
  const [studentLoginForm, setStudentLoginForm] = useState({ email: "", password: "" });
  const [studentRegisterForm, setStudentRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [teacherLoginForm, setTeacherLoginForm] = useState({ email: "", password: "" });
  const [teacherRegisterForm, setTeacherRegisterForm] = useState({
    code: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const roleButtonStyle = (role) => {
    const active = selectedRole === role;
    return {
      padding: "0.85rem",
      minHeight: "64px",
      borderRadius: "0.75rem",
      border: active ? "2px solid var(--color-primary)" : "1px solid var(--border-light)",
      background: active ? "rgba(244, 89, 37, 0.14)" : "var(--surface-light)",
      color: active ? "var(--color-primary)" : "var(--text-primary)",
      fontWeight: 800,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
      lineHeight: 1.2
    };
  };

  const teacherCodePanelStyle = {
    border: "1px solid rgba(244, 89, 37, 0.45)",
    borderRadius: "0.9rem",
    background: "rgba(244, 89, 37, 0.12)",
    padding: "0.75rem",
    boxShadow: "0 0 0 3px rgba(244, 89, 37, 0.08)"
  };

  const teacherCodeInputStyle = {
    ...fieldStyle,
    border: "1px solid rgba(244, 89, 37, 0.65)",
    background: "rgba(255, 255, 255, 0.04)"
  };

  const selectRole = (role) => {
    setSelectedRole(role);
    setLocalError(null);
    setSuccessMessage(null);
    localStorage.setItem("notus:selectedRole", role);
    if (role === "student") {
      localStorage.removeItem("notus:teacherRegistrationToken");
      localStorage.removeItem("notus:teacherAccessCode");
    }
  };

  const showMissingClerkError = () => {
    if (!clerkEnabled) {
      setLocalError("Brakuje VITE_CLERK_PUBLISHABLE_KEY w pliku .env. Wklej klucz Clerk i zrestartuj frontend.");
      return false;
    }
    return true;
  };

  const prepareTeacherGoogleAuth = () => {
    localStorage.setItem("notus:selectedRole", "teacher");
    if (!showMissingClerkError()) {
      return false;
    }
    setLocalError(null);
    setSuccessMessage(null);
    return true;
  };

  const prepareStudentGoogleAuth = () => {
    localStorage.setItem("notus:selectedRole", "student");
    localStorage.removeItem("notus:teacherRegistrationToken");
    localStorage.removeItem("notus:teacherAccessCode");
    if (!showMissingClerkError()) {
      return false;
    }
    setLocalError(null);
    setSuccessMessage(null);
    return true;
  };

  const handleTeacherLogin = async () => {
    setPending(true);
    setLocalError(null);
    setSuccessMessage(null);
    try {
      const response = await teacherEmailLogin(teacherLoginForm.email, teacherLoginForm.password);
      if (response?.requiresEmailVerification) {
        setSuccessMessage(response.message || "Potwierdź adres email przed zalogowaniem.");
      }
    } catch (err) {
      setLocalError(err.message || "Nie udało się zalogować nauczyciela.");
    } finally {
      setPending(false);
    }
  };

  const handleTeacherRegister = async () => {
    setLocalError(null);
    setSuccessMessage(null);

    if (!teacherRegisterForm.code.trim()) {
      setLocalError("Kod administratora jest wymagany.");
      return;
    }

    if (teacherRegisterForm.password !== teacherRegisterForm.confirmPassword) {
      setLocalError("Hasła nie są takie same.");
      return;
    }

    setPending(true);
    try {
      const response = await teacherEmailRegister(teacherRegisterForm);
      setSuccessMessage(response?.message || "Sprawdź swoją skrzynkę email i potwierdź konto.");
    } catch (err) {
      setLocalError(err.message || "Nie udało się zarejestrować nauczyciela.");
    } finally {
      setPending(false);
    }
  };

  const handleStudentLogin = async () => {
    setPending(true);
    setLocalError(null);
    setSuccessMessage(null);
    try {
      await studentEmailLogin(studentLoginForm.email, studentLoginForm.password);
    } catch (err) {
      setLocalError(err.message || "Nie udało się zalogować ucznia.");
    } finally {
      setPending(false);
    }
  };

  const handleStudentRegister = async () => {
    setLocalError(null);
    setSuccessMessage(null);

    if (studentRegisterForm.password !== studentRegisterForm.confirmPassword) {
      setLocalError("Hasła nie są takie same.");
      return;
    }

    setPending(true);
    try {
      await studentEmailRegister(studentRegisterForm);
    } catch (err) {
      setLocalError(err.message || "Nie udało się zarejestrować ucznia.");
    } finally {
      setPending(false);
    }
  };

  const prepareTeacherGoogleRegister = async () => {
    setLocalError(null);
    setSuccessMessage(null);

    if (!teacherRegisterForm.code.trim()) {
      setLocalError("Kod administratora jest wymagany.");
      return false;
    }

    try {
      const verification = await apiPost("/api/auth/teacher/verify-code", {
        code: teacherRegisterForm.code,
        email: teacherRegisterForm.email || null
      });
      localStorage.setItem("notus:teacherRegistrationToken", verification.registrationToken);
      return prepareTeacherGoogleAuth();
    } catch (err) {
      setLocalError(err.message || "Kod administratora jest nieprawidłowy albo wygasł.");
      return false;
    }
  };

  const renderGoogleButton = ({ mode = "signIn", onPrepare, children }) => {
    if (!clerkEnabled) {
      return (
        <button type="button" onClick={showMissingClerkError} disabled={pending} style={secondaryButtonStyle}>
          {children}
        </button>
      );
    }

    return (
      <ClerkGoogleButton
        mode={mode}
        onPrepare={onPrepare}
        onError={setLocalError}
        disabled={pending}
        style={secondaryButtonStyle}
      >
        {children}
      </ClerkGoogleButton>
    );
  };

  const handleStudentDevLogin = async () => {
    setPending(true);
    setLocalError(null);
    try {
      await login("s12345@student.pwr.edu.pl", "student");
    } catch (err) {
      setLocalError(err.message || "Nie udało się zalogować ucznia.");
    } finally {
      setPending(false);
    }
  };

  const handleTeacherDevLogin = async () => {
    setPending(true);
    setLocalError(null);
    localStorage.setItem("notus:teacherAccessCode", devTeacherCode);
    try {
      await login("t.kowalski@pwr.edu.pl", "teacher");
    } catch (err) {
      setLocalError(err.message || "Nie udało się zalogować nauczyciela w trybie dev.");
    } finally {
      setPending(false);
    }
  };

  if (isLoaded && user) {
    return <Navigate to={user.role === "student" ? "/student" : "/teacher"} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "2rem", minHeight: "100vh", background: "var(--bg-light)", boxSizing: "border-box" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "460px" }}>
        <div style={{
          width: "132px",
          height: "132px",
          background: "linear-gradient(135deg, var(--color-primary) 0%, #ff8c5a 100%)",
          borderRadius: "34px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem",
          boxShadow: "0 16px 32px -8px rgba(244, 89, 37, 0.4)"
        }}>
          <img src={notusLogo} alt="Notus logo" style={{ width: "104px", height: "auto", filter: "brightness(0) invert(1)" }} />
        </div>

        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 2rem 0", textAlign: "center" }}>Witaj w Notus</h1>

        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          <button type="button" onClick={() => selectRole("teacher")} style={roleButtonStyle("teacher")}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>cast_for_education</span>
            Nauczyciel
          </button>
          <button type="button" onClick={() => selectRole("student")} style={roleButtonStyle("student")}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>school</span>
            Uczeń
          </button>
        </div>

        {selectedRole === "teacher" ? (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <button type="button" onClick={() => setTeacherTab("login")} style={{ ...secondaryButtonStyle, borderColor: teacherTab === "login" ? "var(--color-primary)" : "var(--border-light)", color: teacherTab === "login" ? "var(--color-primary)" : "var(--text-primary)" }}>
                Masz konto
              </button>
              <button type="button" onClick={() => setTeacherTab("register")} style={{ ...secondaryButtonStyle, borderColor: teacherTab === "register" ? "var(--color-primary)" : "var(--border-light)", color: teacherTab === "register" ? "var(--color-primary)" : "var(--text-primary)" }}>
                Zakładasz konto
              </button>
            </div>

            {teacherTab === "login" ? (
              <>
                <input style={fieldStyle} value={teacherLoginForm.email} onChange={(event) => setTeacherLoginForm({ ...teacherLoginForm, email: event.target.value })} placeholder="Email nauczyciela" type="email" />
                <input style={fieldStyle} value={teacherLoginForm.password} onChange={(event) => setTeacherLoginForm({ ...teacherLoginForm, password: event.target.value })} placeholder="Hasło" type="password" />
                <button type="button" onClick={handleTeacherLogin} disabled={pending} style={{ ...primaryButtonStyle, opacity: pending ? 0.75 : 1, cursor: pending ? "wait" : "pointer" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>login</span>
                  {pending ? "Logowanie..." : "Zaloguj nauczyciela"}
                </button>
                {renderGoogleButton({ onPrepare: prepareTeacherGoogleAuth, children: (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>account_circle</span>
                    Kontynuuj z Google
                  </>
                ) })}
              </>
            ) : (
              <>
                <input style={fieldStyle} value={teacherRegisterForm.name} onChange={(event) => setTeacherRegisterForm({ ...teacherRegisterForm, name: event.target.value })} placeholder="Imię i nazwisko" />
                <input style={fieldStyle} value={teacherRegisterForm.email} onChange={(event) => setTeacherRegisterForm({ ...teacherRegisterForm, email: event.target.value })} placeholder="Email nauczyciela" type="email" />
                <input style={fieldStyle} value={teacherRegisterForm.password} onChange={(event) => setTeacherRegisterForm({ ...teacherRegisterForm, password: event.target.value })} placeholder="Hasło" type="password" />
                <input style={fieldStyle} value={teacherRegisterForm.confirmPassword} onChange={(event) => setTeacherRegisterForm({ ...teacherRegisterForm, confirmPassword: event.target.value })} placeholder="Powtórz hasło" type="password" />
                <div style={teacherCodePanelStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-primary)", fontSize: "0.8rem", fontWeight: 900, marginBottom: "0.5rem" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>verified_user</span>
                    Kod administratora
                  </div>
                  <input style={teacherCodeInputStyle} value={teacherRegisterForm.code} onChange={(event) => setTeacherRegisterForm({ ...teacherRegisterForm, code: event.target.value })} placeholder="Wymagany do rejestracji nauczyciela" />
                </div>
                <button type="button" onClick={handleTeacherRegister} disabled={pending} style={{ ...primaryButtonStyle, opacity: pending ? 0.75 : 1, cursor: pending ? "wait" : "pointer" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>person_add</span>
                  {pending ? "Tworzenie konta..." : "Zarejestruj konto nauczyciela"}
                </button>
                {renderGoogleButton({ mode: "signUp", onPrepare: prepareTeacherGoogleRegister, children: (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>account_circle</span>
                    Zarejestruj przez Google
                  </>
                ) })}
              </>
            )}
          </div>
        ) : (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <button type="button" onClick={() => setStudentTab("login")} style={{ ...secondaryButtonStyle, borderColor: studentTab === "login" ? "var(--color-primary)" : "var(--border-light)", color: studentTab === "login" ? "var(--color-primary)" : "var(--text-primary)" }}>
                Masz konto
              </button>
              <button type="button" onClick={() => setStudentTab("register")} style={{ ...secondaryButtonStyle, borderColor: studentTab === "register" ? "var(--color-primary)" : "var(--border-light)", color: studentTab === "register" ? "var(--color-primary)" : "var(--text-primary)" }}>
                Zakładasz konto
              </button>
            </div>

            {studentTab === "login" ? (
              <>
                <input style={fieldStyle} value={studentLoginForm.email} onChange={(event) => setStudentLoginForm({ ...studentLoginForm, email: event.target.value })} placeholder="Email ucznia" type="email" />
                <input style={fieldStyle} value={studentLoginForm.password} onChange={(event) => setStudentLoginForm({ ...studentLoginForm, password: event.target.value })} placeholder="Hasło" type="password" />
                <button type="button" onClick={handleStudentLogin} disabled={pending} style={{ ...primaryButtonStyle, opacity: pending ? 0.75 : 1, cursor: pending ? "wait" : "pointer" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>login</span>
                  {pending ? "Logowanie..." : "Zaloguj ucznia"}
                </button>
                {renderGoogleButton({ onPrepare: prepareStudentGoogleAuth, children: (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>account_circle</span>
                    Kontynuuj z Google jako uczeń
                  </>
                ) })}
              </>
            ) : (
              <>
                <input style={fieldStyle} value={studentRegisterForm.name} onChange={(event) => setStudentRegisterForm({ ...studentRegisterForm, name: event.target.value })} placeholder="Imię i nazwisko" />
                <input style={fieldStyle} value={studentRegisterForm.email} onChange={(event) => setStudentRegisterForm({ ...studentRegisterForm, email: event.target.value })} placeholder="Email ucznia" type="email" />
                <input style={fieldStyle} value={studentRegisterForm.password} onChange={(event) => setStudentRegisterForm({ ...studentRegisterForm, password: event.target.value })} placeholder="Hasło" type="password" />
                <input style={fieldStyle} value={studentRegisterForm.confirmPassword} onChange={(event) => setStudentRegisterForm({ ...studentRegisterForm, confirmPassword: event.target.value })} placeholder="Powtórz hasło" type="password" />
                <button type="button" onClick={handleStudentRegister} disabled={pending} style={{ ...primaryButtonStyle, opacity: pending ? 0.75 : 1, cursor: pending ? "wait" : "pointer" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>person_add</span>
                  {pending ? "Tworzenie konta..." : "Zarejestruj konto ucznia"}
                </button>
                {renderGoogleButton({ mode: "signUp", onPrepare: prepareStudentGoogleAuth, children: (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>account_circle</span>
                    Zarejestruj przez Google jako uczeń
                  </>
                ) })}
              </>
            )}
          </div>
        )}

        {(localError || authError) && (
          <div style={{ width: "100%", boxSizing: "border-box", marginTop: "1rem", border: "1px solid rgba(220, 38, 38, 0.35)", background: "rgba(220, 38, 38, 0.14)", color: "var(--text-primary)", borderRadius: "0.75rem", padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 700 }}>
            {localError || authError}
          </div>
        )}

        {successMessage && (
          <div style={{ width: "100%", boxSizing: "border-box", marginTop: "1rem", border: "1px solid rgba(34, 197, 94, 0.35)", background: "rgba(34, 197, 94, 0.14)", color: "var(--text-primary)", borderRadius: "0.75rem", padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 700 }}>
            {successMessage}
          </div>
        )}

        {isSignedIn && !user && (
          <button type="button" onClick={retryUserSync} style={{ ...secondaryButtonStyle, marginTop: "1rem" }}>
            Dokończ synchronizację konta
          </button>
        )}

        <div style={{ width: "100%", marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border-light)" }} />
            <span style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>Dev access</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border-light)" }} />
          </div>

          <input
            style={fieldStyle}
            value={devTeacherCode}
            onChange={(event) => {
              setDevTeacherCode(event.target.value);
              localStorage.setItem("notus:teacherAccessCode", event.target.value);
            }}
            placeholder="Kod dev nauczyciela"
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <button type="button" onClick={handleStudentDevLogin} disabled={pending} style={{ ...secondaryButtonStyle, opacity: pending ? 0.75 : 1, cursor: pending ? "wait" : "pointer" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>school</span>
              Test uczeń
            </button>
            <button type="button" onClick={handleTeacherDevLogin} disabled={pending} style={{ ...secondaryButtonStyle, opacity: pending ? 0.75 : 1, cursor: pending ? "wait" : "pointer" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>cast_for_education</span>
              Test nauczyciel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
