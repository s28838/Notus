import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth, useClerk } from "@clerk/react";
import { apiGet, apiPost } from "../services/api";

export const AuthContext = React.createContext(null);

export const AuthProvider = ({ children }) => {
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) &&
    !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.includes("replace_me");

  if (!clerkEnabled) {
    return <DevAuthProvider>{children}</DevAuthProvider>;
  }

  return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
};

const DevAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("clerkToken");
    const role = localStorage.getItem("notus:selectedRole");
    if (!token) {
      setIsAuthReady(true);
      return;
    }

    if (token.startsWith("mock-dev-token:") && role) {
      const email = token.split(":").slice(2).join(":");
      login(email, role, { redirect: false }).finally(() => setIsAuthReady(true));
      return;
    }

    apiGet("/api/me", null, token)
      .then((backendUser) => {
        setUser({
          id: backendUser.id,
          email: backendUser.email,
          role: backendUser.role.toLowerCase(),
          name: backendUser.name,
          index: backendUser.indexNumber || null,
          isLocalAuth: true
        });
      })
      .catch(() => localStorage.removeItem("clerkToken"))
      .finally(() => setIsAuthReady(true));
  }, []);

  const login = async (email, role = "student", options = { redirect: true }) => {
    const mockToken = `mock-dev-token:${role.toUpperCase()}:${email}`;
    localStorage.setItem("notus:selectedRole", role);

    try {
      const backendUser = await apiPost("/api/me", {
        role: role.toUpperCase(),
        name: "Dev Mode User",
        teacherAccessCode: role === "teacher"
          ? localStorage.getItem("notus:teacherAccessCode")
          : null
      }, mockToken);
      const backendRole = backendUser.role.toLowerCase();

      localStorage.setItem("clerkToken", mockToken);
      localStorage.setItem("notus:authProvider", "dev");
      setAuthError(null);
      setUser({
        id: backendUser.id,
        email: backendUser.email,
        role: backendRole,
        name: backendUser.name,
        index: backendUser.indexNumber || null,
        isDev: true
      });
      if (options.redirect !== false) {
        navigate(backendRole === "student" ? "/student" : "/teacher");
      }
    } catch (err) {
      console.error("Dev login failed:", err);
      localStorage.removeItem("clerkToken");
      setAuthError(err.message || "Nie udało się zalogować w trybie dev");
      setUser(null);
    }
  };

  const logout = async () => {
    localStorage.removeItem("clerkToken");
    localStorage.removeItem("notus:authProvider");
    setUser(null);
    navigate("/login");
  };

  const teacherEmailLogin = async (email, password) => {
    try {
      const response = await apiPost("/api/auth/teacher/login", { email, password });
      if (response.token && response.user) {
      localStorage.setItem("clerkToken", response.token);
      localStorage.setItem("notus:selectedRole", "teacher");
      localStorage.setItem("notus:authProvider", "local");
        setAuthError(null);
        setUser({
          id: response.user.id,
          email: response.user.email,
          role: response.user.role.toLowerCase(),
          name: response.user.name,
          index: response.user.indexNumber || null,
          isLocalAuth: true
        });
        navigate("/teacher");
      } else if (response.message) {
        setAuthError(response.message);
      }
      return response;
    } catch (err) {
      setAuthError(err.message || "Nie udało się zalogować nauczyciela");
      throw err;
    }
  };

  const teacherEmailRegister = async ({ code, name, email, password }) => {
    try {
      const verification = await apiPost("/api/auth/teacher/verify-code", { code, email });
      const response = await apiPost("/api/auth/teacher/register", {
        registrationToken: verification.registrationToken,
        name,
        email,
        password
      });
      setAuthError(null);
      return response;
    } catch (err) {
      setAuthError(err.message || "Nie udało się zarejestrować nauczyciela");
      throw err;
    }
  };

  const applyAuthResponse = (response, fallbackRole) => {
    if (response.token && response.user) {
      const role = response.user.role.toLowerCase();
      localStorage.setItem("clerkToken", response.token);
      localStorage.setItem("notus:selectedRole", role);
      localStorage.setItem("notus:authProvider", "local");
      setAuthError(null);
      setUser({
        id: response.user.id,
        email: response.user.email,
        role,
        name: response.user.name,
        index: response.user.indexNumber || null,
        isLocalAuth: true
      });
      navigate(role === "student" ? "/student" : "/teacher");
    } else if (response.message) {
      setAuthError(response.message);
    } else if (fallbackRole) {
      setAuthError("Nie udało się zalogować.");
    }
    return response;
  };

  const studentEmailLogin = async (email, password) => {
    try {
      return applyAuthResponse(await apiPost("/api/auth/student/login", { email, password }), "student");
    } catch (err) {
      setAuthError(err.message || "Nie udało się zalogować ucznia");
      throw err;
    }
  };

  const studentEmailRegister = async ({ name, email, password }) => {
    try {
      return applyAuthResponse(await apiPost("/api/auth/student/register", { name, email, password }), "student");
    } catch (err) {
      setAuthError(err.message || "Nie udało się zarejestrować ucznia");
      throw err;
    }
  };

  const retryUserSync = async () => {
    const token = localStorage.getItem("clerkToken");
    const role = localStorage.getItem("notus:selectedRole");
    if (!token || !role) {
      setAuthError("Wybierz typ konta i użyj logowania dev");
      return;
    }

    const email = token.split(":").slice(2).join(":");
    await login(email, role);
  };

  const authValue = {
    user,
    login,
    logout,
    isLoaded: true,
    isSignedIn: Boolean(user),
    isAuthReady,
    authError,
    retryUserSync,
    getToken: async () => localStorage.getItem("clerkToken"),
    teacherEmailLogin,
    teacherEmailRegister,
    studentEmailLogin,
    studentEmailRegister
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

const ClerkAuthProvider = ({ children }) => {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  const syncUserToBackend = async () => {
    if (!(isLoaded && isSignedIn && clerkUser)) {
      return;
    }

    const token = await getToken();
    const name = clerkUser.fullName ||
                 (clerkUser.firstName && clerkUser.lastName ? `${clerkUser.firstName} ${clerkUser.lastName}` : null) ||
                 clerkUser.firstName ||
                 clerkUser.username ||
                 clerkUser.primaryEmailAddress?.emailAddress ||
                 "";
    const pendingInviteToken = localStorage.getItem("notus:pendingGroupInviteToken");
    const selectedRole = localStorage.getItem("notus:selectedRole") || (pendingInviteToken ? "student" : null);
    const registrationToken = localStorage.getItem("notus:teacherRegistrationToken");
    const backendPayload = selectedRole === "teacher"
      ? await apiPost("/api/auth/teacher/google-register", {
          idToken: token,
          registrationToken: registrationToken || null,
          email: clerkUser.primaryEmailAddress?.emailAddress || null,
          name,
          emailVerified: clerkUser.primaryEmailAddress?.verification?.status === "verified"
        })
      : selectedRole
        ? await apiPost("/api/me", {
            role: selectedRole.toUpperCase(),
            name,
            email: clerkUser.primaryEmailAddress?.emailAddress || null,
            teacherAccessCode: null
          }, token)
        : await apiGet("/api/me", { name }, token);

    const backendUser = backendPayload?.user || backendPayload;
    if (backendUser && backendUser.id) {
      localStorage.removeItem("notus:teacherAccessCode");
      localStorage.removeItem("notus:teacherRegistrationToken");
      if (selectedRole) {
        localStorage.setItem("notus:selectedRole", selectedRole);
      }
      setAuthError(null);
      setUser({
        id: backendUser.id,
        email: backendUser.email,
        role: backendUser.role.toLowerCase(),
        name: backendUser.name,
        index: backendUser.indexNumber || null,
        photoURL: clerkUser.imageUrl || null,
        clerkId: clerkUser.id,
        isDev: false
      });

      if (pendingInviteToken && window.location.pathname !== "/invite/group") {
        navigate(`/invite/group?token=${encodeURIComponent(pendingInviteToken)}`);
      }
    }
  };

  useEffect(() => {
    const syncToken = async () => {
      try {
        if (isLoaded && isSignedIn) {
          const t = await getToken();
          if (t) {
            localStorage.setItem("clerkToken", t);
          }
        } else if (
          isLoaded &&
          !isSignedIn &&
          !["local", "dev"].includes(localStorage.getItem("notus:authProvider"))
        ) {
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
    if (!isLoaded) {
      return;
    }

    let cancelled = false;
    const finish = () => {
      if (!cancelled) {
        setIsAuthReady(true);
      }
    };

    setIsAuthReady(false);

    try {
      if (isLoaded && isSignedIn && clerkUser) {
        syncUserToBackend().catch((err) => {
          console.error("Backend user sync failed:", err);
          setAuthError(err.message || "Nie udało się zsynchronizować konta");
          setUser(null);
        }).finally(finish);
      } else if (isLoaded && !isSignedIn) {
        const localToken = localStorage.getItem("clerkToken");
        if (localToken && localToken.startsWith("mock-dev-token:")) {
          const role = localStorage.getItem("notus:selectedRole");
          const email = localToken.split(":").slice(2).join(":");
          if (role && email) {
            login(email, role, { redirect: false }).finally(finish);
          } else {
            localStorage.removeItem("clerkToken");
            setUser(null);
            finish();
          }
        } else if (localToken) {
          apiGet("/api/me", null, localToken)
            .then((backendUser) => {
              setUser({
                id: backendUser.id,
                email: backendUser.email,
                role: backendUser.role.toLowerCase(),
                name: backendUser.name,
                index: backendUser.indexNumber || null,
                isLocalAuth: true
              });
            })
            .catch(() => localStorage.removeItem("clerkToken"))
            .finally(finish);
        } else {
          setUser(prev => (prev?.isDev || prev?.isLocalAuth ? prev : null));
          finish();
        }
      }
    } catch (err) {
      console.error("Error in AuthContext useEffect:", err);
      finish();
    }

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, clerkUser, getToken]);

  const logout = async () => {
    try {
      await signOut();
      localStorage.removeItem("clerkToken");
      localStorage.removeItem("notus:authProvider");
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const login = async (email, role = "student", options = { redirect: true }) => {
    const mockToken = `mock-dev-token:${role.toUpperCase()}:${email}`;
    localStorage.setItem("notus:selectedRole", role);

    try {
      const backendUser = await apiPost("/api/me", {
        role: role.toUpperCase(),
        name: "Dev Mode User",
        teacherAccessCode: role === "teacher"
          ? localStorage.getItem("notus:teacherAccessCode")
          : null
      }, mockToken);
      const backendRole = backendUser.role.toLowerCase();

      localStorage.setItem("clerkToken", mockToken);
      localStorage.setItem("notus:authProvider", "dev");
      setAuthError(null);
      setUser({
        id: backendUser.id,
        email: backendUser.email,
        role: backendRole,
        name: backendUser.name,
        index: backendUser.indexNumber || null,
        isDev: true
      });
      if (options.redirect !== false) {
        navigate(backendRole === "student" ? "/student" : "/teacher");
      }
    } catch (err) {
      console.error("Dev login failed:", err);
      localStorage.removeItem("clerkToken");
      setAuthError(err.message || "Nie udało się zalogować w trybie dev");
      setUser(null);
    }
  };

  const teacherEmailLogin = async (email, password) => {
    try {
      const response = await apiPost("/api/auth/teacher/login", { email, password });
      if (response.token && response.user) {
      localStorage.setItem("clerkToken", response.token);
      localStorage.setItem("notus:selectedRole", "teacher");
      localStorage.setItem("notus:authProvider", "local");
        setAuthError(null);
        setUser({
          id: response.user.id,
          email: response.user.email,
          role: response.user.role.toLowerCase(),
          name: response.user.name,
          index: response.user.indexNumber || null,
          isLocalAuth: true
        });
        navigate("/teacher");
      } else if (response.message) {
        setAuthError(response.message);
      }
      return response;
    } catch (err) {
      setAuthError(err.message || "Nie udało się zalogować nauczyciela");
      throw err;
    }
  };

  const teacherEmailRegister = async ({ code, name, email, password }) => {
    try {
      const verification = await apiPost("/api/auth/teacher/verify-code", { code, email });
      const response = await apiPost("/api/auth/teacher/register", {
        registrationToken: verification.registrationToken,
        name,
        email,
        password
      });
      setAuthError(null);
      return response;
    } catch (err) {
      setAuthError(err.message || "Nie udało się zarejestrować nauczyciela");
      throw err;
    }
  };

  const applyAuthResponse = (response, fallbackRole) => {
    if (response.token && response.user) {
      const role = response.user.role.toLowerCase();
      localStorage.setItem("clerkToken", response.token);
      localStorage.setItem("notus:selectedRole", role);
      localStorage.setItem("notus:authProvider", "local");
      setAuthError(null);
      setUser({
        id: response.user.id,
        email: response.user.email,
        role,
        name: response.user.name,
        index: response.user.indexNumber || null,
        isLocalAuth: true
      });
      navigate(role === "student" ? "/student" : "/teacher");
    } else if (response.message) {
      setAuthError(response.message);
    } else if (fallbackRole) {
      setAuthError("Nie udało się zalogować.");
    }
    return response;
  };

  const studentEmailLogin = async (email, password) => {
    try {
      return applyAuthResponse(await apiPost("/api/auth/student/login", { email, password }), "student");
    } catch (err) {
      setAuthError(err.message || "Nie udało się zalogować ucznia");
      throw err;
    }
  };

  const studentEmailRegister = async ({ name, email, password }) => {
    try {
      return applyAuthResponse(await apiPost("/api/auth/student/register", { name, email, password }), "student");
    } catch (err) {
      setAuthError(err.message || "Nie udało się zarejestrować ucznia");
      throw err;
    }
  };

  const getLocalToken = async () => {
    if (user?.isDev || user?.isLocalAuth) {
      return localStorage.getItem("clerkToken");
    }
    return await getToken();
  };

  const retryUserSync = async () => {
    try {
      await syncUserToBackend();
    } catch (err) {
      console.error("Backend user sync failed:", err);
      setAuthError(err.message || "Nie udało się zsynchronizować konta");
      setUser(null);
    }
  };

  const authValue = { user, login, logout, isLoaded, isSignedIn, isAuthReady, authError, retryUserSync, getToken: getLocalToken, teacherEmailLogin, teacherEmailRegister, studentEmailLogin, studentEmailRegister };

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
