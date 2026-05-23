import React from "react";
import AppTopBar from "./AppTopBar";
import LoadingState from "./LoadingState";

const AppPageLayout = ({
  title,
  leftIcon,
  onLeftClick,
  leftAriaLabel,
  rightIcon,
  onRightClick,
  rightAriaLabel,
  right,
  showRightPlaceholder,
  loading = false,
  loadingLabel,
  children,
  bottomNav,
  shell = "app",
  className = "",
  contentClassName = "",
}) => {
  const shellClassName =
    shell === "teacher" || shell === "student"
      ? "schedule-page-container groups-page app-page-layout"
      : "app-container app-page-layout";

  return (
    <div className={`${shellClassName} ${className}`.trim()}>
      <AppTopBar
        title={title}
        leftIcon={leftIcon}
        onLeftClick={onLeftClick}
        leftAriaLabel={leftAriaLabel}
        rightIcon={rightIcon}
        onRightClick={onRightClick}
        rightAriaLabel={rightAriaLabel}
        right={right}
        showRightPlaceholder={showRightPlaceholder}
      />

      <main className={`app-page-content ${contentClassName}`.trim()}>
        {loading ? (
          <div className="app-page-loading-slot">
            <LoadingState label={loadingLabel} />
          </div>
        ) : children}
      </main>

      {bottomNav}
    </div>
  );
};

export default AppPageLayout;
