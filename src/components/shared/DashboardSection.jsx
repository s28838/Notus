import React from "react";

export const DashboardSection = ({ title, children, className = "" }) => (
  <>
    <h3 className="section-title">{title}</h3>
    <div className={`list-container ${className}`.trim()}>{children}</div>
  </>
);

export const DashboardListItem = ({
  children,
  onClick,
  className = "",
  style,
  actionIcon = "chevron_right",
  showAction,
}) => {
  const isInteractive = Boolean(onClick);
  const shouldShowAction = showAction ?? isInteractive;

  return (
    <div
      className={`list-item ${className}`.trim()}
      onClick={onClick}
      style={{ cursor: isInteractive ? "pointer" : "default", ...style }}
    >
      {children}
      {shouldShowAction && (
        <div className="list-item-action">
          <span className="material-symbols-outlined">{actionIcon}</span>
        </div>
      )}
    </div>
  );
};

export const DashboardItemContent = ({ tag, tagStyle = "primary", title, details = [] }) => (
  <div className="list-item-content">
    {tag && (
      <div className="list-item-top">
        <p className={`list-item-tag ${tagStyle}`}>{tag}</p>
      </div>
    )}
    <h4 className="list-item-title">{title}</h4>
    {details.length > 0 && (
      <div className="list-item-details">
        {details.map((detail, index) => (
          <div className="detail-pill" key={`${detail.icon}-${index}`}>
            <span className="material-symbols-outlined">{detail.icon}</span>
            <p style={{ margin: 0 }}>{detail.label}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

export const DashboardSkeletonItem = ({ lines = 2 }) => (
  <DashboardListItem style={{ opacity: 0.4 }} showAction={false}>
    <div className="list-item-content">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          style={{
            height: index === 0 ? "0.85rem" : "0.75rem",
            width: index === 0 ? "60%" : "40%",
            background: "var(--border-light)",
            borderRadius: "4px",
            marginBottom: index < lines - 1 ? "0.5rem" : 0,
          }}
        />
      ))}
    </div>
  </DashboardListItem>
);
