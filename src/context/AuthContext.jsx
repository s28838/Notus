import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth, useClerk } from "@clerk/react";

export const AuthContext = React.createContext(null);

export const AuthProvider = ({ children }) => {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
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
          clerkId: clerkUser.id
        });
      } else if (isLoaded && !isSignedIn) {
        setUser(null);
      }
    } catch (err) {
      console.error("Error in AuthContext useEffect:", err);
    }
  }, [isLoaded, isSignedIn, clerkUser]);

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
    setUser({ email, role, name: "Logged User", index: email.split('@')[0] });
    navigate(role === "student" ? "/student" : "/teacher");
  };

  const authValue = { user, login, logout, isLoaded, getToken };

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
