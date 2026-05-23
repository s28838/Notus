import React from "react";

const mergeClassNames = (...names) => names.filter(Boolean).join(" ");

const PageState = ({
  kind = "empty",
  icon,
  title,
  children,
  action,
  compact = false,
  className = "",
  style,
  iconStyle,
  titleAs: TitleTag = "h3",
  titleStyle,
}) => {
  const stateClass = kind === "error" ? "error-state" : "empty-state";

  return (
    <div className={mergeClassNames(stateClass, compact && "compact", className)} style={style}>
      {icon && (
        <span className="material-symbols-outlined" style={iconStyle}>
          {icon}
        </span>
      )}
      {title && <TitleTag style={titleStyle}>{title}</TitleTag>}
      {children}
      {action}
    </div>
  );
};

export const EmptyState = (props) => <PageState kind="empty" {...props} />;
export const ErrorState = (props) => <PageState kind="error" icon="error" {...props} />;
export const SuccessState = (props) => <PageState kind="success" icon="check_circle" {...props} />;

export default PageState;
