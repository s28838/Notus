import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/react";
import App from "./App";
import "./styles/styles.css";
import "./styles/stitch-theme.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY || PUBLISHABLE_KEY.includes("replace_me")) {
  console.error("Missing valid Clerk Publishable Key in .env");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      {PUBLISHABLE_KEY && !PUBLISHABLE_KEY.includes("replace_me") ? (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
          <App />
        </ClerkProvider>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', padding: '2rem', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#ef4444' }}>Missing Clerk Key</h2>
          <p>Please add a valid <code>VITE_CLERK_PUBLISHABLE_KEY</code> to your <code>.env</code> file.</p>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>App will load once the key is provided.</p>
        </div>
      )}
    </BrowserRouter>
  </React.StrictMode>
);