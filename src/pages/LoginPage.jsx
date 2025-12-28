// src/pages/LoginPage.jsx
import React, { useContext, useState } from "react";
import { AuthContext } from "../App";
import notusLogo from "../assets/notus-logo.png";

import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { apiGet } from "../api";

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loginGoogle = async () => {
    setError("");
    setLoading(true);

    try {
      // 1) popup Google
      const result = await signInWithPopup(auth, googleProvider);

      // 2) Firebase ID token
      const token = await result.user.getIdToken();
      localStorage.setItem("firebaseToken", token);

      // 3) backend: pobierz /api/me (backend zwróci usera z rolą)
      const me = await apiGet("/api/me");
      console.log("ME:", me);

      // 4) na razie używamy Twojego starego login(email)
      // (potem zmienimy AuthContext, żeby brał role z backendu)
      login(me.email);
    } catch (e) {
      console.error(e);
      setError("Nie udało się zalogować przez Google. Sprawdź konsolę i konfigurację Firebase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-circle">
          <img src={notusLogo} alt="Notus logo" />
        </div>

        {/* Tytuł */}
        <h1 className="login-title">Logowanie</h1>

        {/* Komunikat błędu */}
        {error && (
          <div style={{ marginTop: 12, marginBottom: 12, color: "salmon" }}>
            {error}
          </div>
        )}

        {/* Google login */}
        <button
          type="button"
          className="login-btn"
          onClick={loginGoogle}
          disabled={loading}
        >
          {loading ? "Logowanie..." : "Zaloguj przez Google"}
        </button>

        {/* Linki pomocnicze */}
        <div className="login-links">
          <span>Zapomniałeś hasła?</span>
          <span>Potrzebujesz pomocy?</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
