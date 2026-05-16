import React from "react";
import notusLogo from "../../assets/notus-logo2.png";

const LoadingState = ({ label = "Ładowanie...", compact = false, className = "" }) => (
  <div className={`notus-loading-state ${compact ? "compact" : ""} ${className}`.trim()}>
    <div className="notus-loading-logo-wrap" aria-hidden="true">
      <img src={notusLogo} alt="" className="notus-loading-logo" />
    </div>
    <p>{label}</p>
  </div>
);

export default LoadingState;
