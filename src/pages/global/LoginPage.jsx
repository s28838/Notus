import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import notusLogo from "../../assets/notus-logo.png";
import { SignIn, useUser } from "@clerk/react";
import { Navigate } from "react-router-dom";

const LoginPage = () => {
  const { user, isLoaded } = useContext(AuthContext);

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
        <div style={{ width: '72px', height: '72px', background: 'rgba(244, 89, 37, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <img src={notusLogo} alt="Notus logo" style={{ width: '40px', height: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
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
      </div>

      <div style={{ position: 'relative', zIndex: 10, marginTop: '2.5rem', display: 'flex', gap: '2rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
        <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>Potrzebujesz pomocy?</span>
      </div>
    </div>
  );
};

export default LoginPage;
