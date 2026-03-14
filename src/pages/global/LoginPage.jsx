import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import notusLogo from "../../assets/notus-logo.png";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";

const LoginPage = () => {
  const { loginWithGoogle, login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  const loginMock = () => {
    if (!email) {
      setError("Podaj email (zaczynający się od s dla ucznia)");
      return;
    }
    login(email);
  };

  const loginGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      loginWithGoogle(result.user);
    } catch (e) {
      console.error(e);
      setError("Logowanie przez Google nie powiodło się.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem', minHeight: '100vh', background: 'var(--bg-light)' }}>
      
      {/* Decorative blurred background circle */}
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '350px', height: '350px', background: 'rgba(244, 89, 37, 0.15)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }}></div>
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '250px', height: '250px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }}></div>

      <div className="glass-card" style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem 1.5rem', zIndex: 10, position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)' }}>
        
        {/* Logo Container */}
        <div style={{ width: '72px', height: '72px', background: 'rgba(244, 89, 37, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <img src={notusLogo} alt="Notus logo" style={{ width: '40px', height: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0', textAlign: 'center' }}>Witaj w Notus</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 2rem 0', textAlign: 'center' }}>Zaloguj się, aby kontynuować</p>

        {error && (
          <div style={{ width: '100%', padding: '0.75rem', background: '#fef2f2', color: '#ef4444', borderRadius: '0.5rem', fontSize: '0.875rem', marginBottom: '1.25rem', border: '1px solid #fca5a5', textAlign: 'center', boxSizing: 'border-box' }}>
            {error}
          </div>
        )}

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '0.25rem' }}>Email</label>
            <input 
              type="email" 
              placeholder="np. student@notus.edu" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: 'white', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
            />
          </div>

          <button 
            onClick={loginMock}
            style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 14px 0 rgba(244, 89, 37, 0.3)', transition: 'transform 0.1s, box-shadow 0.2s', marginTop: '0.5rem' }}
            onMouseOver={(e) => e.target.style.boxShadow = '0 6px 20px 0 rgba(244, 89, 37, 0.4)'}
            onMouseOut={(e) => e.target.style.boxShadow = '0 4px 14px 0 rgba(244, 89, 37, 0.3)'}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            Zaloguj się
          </button>
        </div>

        <div style={{ width: '100%', display: 'flex', alignItems: 'center', margin: '1.5rem 0', opacity: 0.8 }}>
           <hr style={{ flex: 1, borderColor: 'var(--border-light)', borderStyle: 'solid', borderWidth: '1px 0 0 0', margin: 0 }} />
           <span style={{ fontSize: '0.75rem', padding: '0 1rem', color: 'var(--text-tertiary)', fontWeight: 700 }}>LUB</span>
           <hr style={{ flex: 1, borderColor: 'var(--border-light)', borderStyle: 'solid', borderWidth: '1px 0 0 0', margin: 0 }} />
        </div>

        <button 
          onClick={loginGoogle}
          disabled={loading}
          style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: 'white', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', boxSizing: 'border-box', transition: 'background 0.2s' }}
          onMouseOver={(e) => !loading && (e.target.style.background = '#f8fafc')}
          onMouseOut={(e) => e.target.style.background = 'white'}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '1.25rem', height: '1.25rem' }} />
          {loading ? "Logowanie..." : "Zaloguj przez Google"}
        </button>
      </div>

      <div style={{ position: 'relative', zIndex: 10, marginTop: '2.5rem', display: 'flex', gap: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
        <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>Zapomniałeś hasła?</span>
        <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>Potrzebujesz pomocy?</span>
      </div>
    </div>
  );
};

export default LoginPage;
