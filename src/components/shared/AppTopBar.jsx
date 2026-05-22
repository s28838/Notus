import React from "react";

const AppTopBar = ({
  title,
  leftIcon,
  onLeftClick,
  leftAriaLabel,
  rightIcon,
  onRightClick,
  rightAriaLabel,
  right,
  showRightPlaceholder = true,
  className = "",
}) => (
  <header className={`top-bar ${className}`.trim()}>
    {leftIcon ? (
      <button className="icon-btn" onClick={onLeftClick} aria-label={leftAriaLabel || title}>
        <span className="material-symbols-outlined">{leftIcon}</span>
      </button>
    ) : (
      <div style={{ width: "2.5rem" }} />
    )}

    <h2 className="top-bar-title">{title}</h2>

    {right || (rightIcon ? (
      <button className="icon-btn" onClick={onRightClick} aria-label={rightAriaLabel || title}>
        <span className="material-symbols-outlined">{rightIcon}</span>
      </button>
    ) : showRightPlaceholder ? (
      <div style={{ width: "2.5rem" }} />
    ) : null)}
  </header>
);

export default AppTopBar;
