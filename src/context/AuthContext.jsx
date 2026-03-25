import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth, useClerk } from "@clerk/react";
import { apiGet } from "../services/api";

export const AuthContext = React.createContext(null);

export const AuthProvider = ({ children }) => {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const syncToken = async () => {
      try {
        if (isLoaded && isSignedIn) {
          const t = await getToken();
          if (t) {
            localStorage.setItem("clerkToken", t);
          }
        } else if (isLoaded && !isSignedIn) {
          localStorage.removeItem("clerkToken");
        }
      } catch (err) {
        console.error("Token sync error:", err);
      }
    };

    syncToken();
    // Refresh token every 5 minutes to keep localStorage in sync
    const interval = setInterval(syncToken, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    const syncUserToBackend = async () => {
      try {
        if (isLoaded && isSignedIn && clerkUser) {
          const token = await getToken();
          const name = clerkUser.fullName ||
                       (clerkUser.firstName && clerkUser.lastName ? `${clerkUser.firstName} ${clerkUser.lastName}` : null) ||
                       clerkUser.firstName ||
                       clerkUser.username ||
                       clerkUser.primaryEmailAddress?.emailAddress ||
                       "";
          // This call triggers findOrCreate in the backend
          const backendUser = await apiGet("/api/me", { name }, token);
          if (backendUser && backendUser.id) {
            setUser(prev => ({ ...prev, id: backendUser.id }));
          }
        }
      } catch (err) {
        console.error("Backend user sync failed:", err);
      }
    };

    try {
      if (isLoaded && isSignedIn && clerkUser) {
        const email = clerkUser.primaryEmailAddress?.emailAddress || "";
        const role = email.trim().toLowerCase().startsWith("s")
          ? "student"
          : "teacher";

        let indexNumber = null;
        if (role === "student" && email.includes('@')) {
          indexNumber = email.split('@')[0];
        }

        setUser({
          email,
          role,
          name: clerkUser.fullName || clerkUser.username || email,
          index: indexNumber,
          photoURL: clerkUser.imageUrl || null,
          clerkId: clerkUser.id,
          isDev: false
        });

        // Trigger synchronization with backend
        syncUserToBackend();
      } else if (isLoaded && !isSignedIn) {
        // Only clear if not a dev user
        setUser(prev => (prev?.isDev ? prev : null));
      }
    } catch (err) {
      console.error("Error in AuthContext useEffect:", err);
    } finally {
      if (isLoaded) setIsAuthReady(true);
    }
  }, [isLoaded, isSignedIn, clerkUser, getToken]);

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const login = (email) => {
    const role = email.trim().toLowerCase().startsWith("s") ? "student" : "teacher";
    // For Dev Mode, we assign ID 1 by default so the dashboard can fetch data
    setUser({ 
      id: 1, 
      email, 
      role, 
      name: "Dev Mode User", 
      index: email.split('@')[0], 
      isDev: true 
    });
    navigate(role === "student" ? "/student" : "/teacher");
  };

  const authValue = { user, login, logout, isLoaded, isAuthReady, getToken };

  // Don't render until Clerk is loaded to avoid flashes or context errors
  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-light)' }}>
        <div style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Ładowanie...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};
