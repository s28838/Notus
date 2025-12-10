// src/pages/LoginPage.jsx
import React, { useContext, useState } from "react";
import { AuthContext } from "../App";
import notusLogo from "../assets/notus-logo.png";

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    login(email); // na razie mock – hasło ignorowane
  };

  return (
<div className="login-page">
  <div className="login-card">

    {/* Logo Notus w niebieskim okręgu */}
    <div className="login-logo-circle">
      <img src={notusLogo} alt="Notus logo" />
    </div>

    {/* Tytuł */}
    <h1 className="login-title">Logowanie</h1>

    {/* Formularz logowania */}
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Hasło"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit" className="login-btn">
        Zaloguj
      </button>
    </form>

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
