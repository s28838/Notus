import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import notusLogo from "../../assets/notus-logo2.png";
import { SignIn, useUser } from "@clerk/react";
import { Navigate } from "react-router-dom";

const LoginPage = () => {
  const { user, isLoaded, login } = useContext(AuthContext);

  if (isLoaded && user) {
    return <Navigate to={user.role === "student" ? "/student" : "/teacher"} />;
  }

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem', minHeight: '100vh', background: 'var(--bg-light)' }}>
      
      {/* Decorative blurred background circle */}
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '350px', height: '350px', background: 'rgba(244, 89, 37, 0.15)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }}></div>
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '250px', height: '250px', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }}></div>

      <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Logo Container */}
        <div style={{ 
          width: '140px', height: '140px', 
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #ff8c5a 100%)', 
          borderRadius: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
          margin: '0 auto 1.5rem',
          boxShadow: '0 16px 32px -8px rgba(244, 89, 37, 0.4)'
        }}>
          <img src={notusLogo} alt="Notus logo" style={{ width: '112px', height: 'auto', filter: 'brightness(0) invert(1)' }} />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2rem 0', textAlign: 'center' }}>Witaj w Notus</h1>

        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: {
                backgroundColor: 'var(--color-primary)',
                '&:hover': {
                  backgroundColor: '#d3481e'
                }
              },
              card: {
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
                border: '1px solid var(--border-light)',
                borderRadius: '1.25rem'
              }
            }
          }}
        />

        {/* Dev Login Section */}
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dev Access</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }}></div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={() => login("s12345@student.pwr.edu.pl")}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: 'white', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>school</span>
              Student
            </button>
            <button 
              onClick={() => login("t.kowalski@pwr.edu.pl")}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', background: 'white', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>cast_for_education</span>
              Teacher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
