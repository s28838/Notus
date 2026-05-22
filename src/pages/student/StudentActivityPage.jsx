import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingState from "../../components/shared/LoadingState";
import AppTopBar from "../../components/shared/AppTopBar";
import StudentBottomNav from "../../components/student/StudentBottomNav";
import { apiGet, apiPost } from "../../services/api";

const READ_NOTIFICATIONS_KEY = "notus_student_read_notifications";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const severityIcon = {
  error: "error",
  warning: "warning",
  success: "check_circle",
  info: "notifications",
};

const loadReadNotificationIds = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

const syncNotificationRead = (id) => {
  if (typeof id !== "string") return;
  if (id.startsWith("student-grade-")) {
    const gradeId = id.replace("student-grade-", "");
    apiPost(`/api/grades/${gradeId}/mark-seen`, {}).catch(() => {});
  }
  if (id.startsWith("student-review-")) {
    const submissionId = id.replace("student-review-", "");
    apiPost(`/api/quiz-assignments/submissions/${submissionId}/mark-seen`, {}).catch(() => {});
  }
};

const StudentActivityPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [activity, setActivity] = useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState(loadReadNotificationIds);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);

  const isNotificationRead = useCallback((item) => item.read || readNotificationIds.has(item.id), [readNotificationIds]);
  const unreadCount = notifications.filter((item) => !isNotificationRead(item)).length;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [notificationsResponse, activityResponse] = await Promise.all([
        apiGet("/api/student/notifications"),
        apiGet("/api/student/activity"),
      ]);
      setNotifications(notificationsResponse.notifications || []);
      setActivity(activityResponse.items || []);
    } catch (err) {
      setError(err.message || "Nie udało się pobrać aktywności.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markNotificationRead = useCallback((id) => {
    if (!id) return;
    setReadNotificationIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(Array.from(next).slice(-200)));
      syncNotificationRead(id);
      window.dispatchEvent(new Event("student-notifications:read"));
      return next;
    });
  }, []);

  const visibleNotifications = showAllNotifications ? notifications : notifications.slice(0, 3);
  const visibleActivity = showAllActivity ? activity : activity.slice(0, 3);

  return (
    <div className="app-container student-groups-page activity-page">
      <AppTopBar
        title="Aktywność"
        leftIcon="arrow_back"
        onLeftClick={() => navigate("/student")}
        leftAriaLabel="Wróć do strony głównej"
        rightIcon="refresh"
        onRightClick={load}
        rightAriaLabel="Odśwież aktywność"
      />

      <main className="student-groups-content">
        {loading ? (
          <LoadingState label="Ładowanie aktywności..." />
        ) : (
          <>
            {error && <div className="error-state"><span className="material-symbols-outlined">error</span>{error}</div>}

            <section className="student-group-card notifications-panel">
              <div className="panel-title-row">
                <div>
                  <p className="eyebrow">Centrum ucznia</p>
                  <h3>Powiadomienia</h3>
                  <p>{unreadCount > 0 ? `${unreadCount} nowych zdarzeń` : "Brak nowych powiadomień"}</p>
                </div>
                <span className="notification-count">{unreadCount}</span>
              </div>

              {notifications.length === 0 ? (
                <div className="empty-state compact">
                  <span className="material-symbols-outlined">notifications_off</span>
                  <h3>Nic nowego</h3>
                  <p>Nowe oceny i sprawdzone quizy pojawią się tutaj.</p>
                </div>
              ) : (
                <div className="notification-list">
                  {visibleNotifications.map((item) => (
                    <button
                      key={item.id}
                      className={`notification-item ${item.severity || "info"} ${!isNotificationRead(item) ? "unread" : ""}`}
                      onMouseEnter={() => markNotificationRead(item.id)}
                      onClick={() => {
                        markNotificationRead(item.id);
                        if (item.actionUrl) navigate(item.actionUrl);
                      }}
                    >
                      <span className="material-symbols-outlined">{severityIcon[item.severity] || severityIcon.info}</span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.body}</small>
                      </span>
                      <span className="notification-meta">
                        {!isNotificationRead(item) && <span className="new-badge">Nowe</span>}
                        <em>{formatDateTime(item.createdAt)}</em>
                      </span>
                    </button>
                  ))}
                  {notifications.length > 3 && (
                    <button className="secondary-action-btn" onClick={() => setShowAllNotifications((value) => !value)}>
                      {showAllNotifications ? "Pokaż tylko najnowsze" : `Pokaż starsze (${notifications.length - 3})`}
                    </button>
                  )}
                </div>
              )}
            </section>

            <section className="student-group-card activity-timeline-panel">
              <h3>Ostatnia aktywność</h3>
              {activity.length === 0 ? (
                <div className="empty-state compact">
                  <span className="material-symbols-outlined">timeline</span>
                  <h3>Jeszcze brak aktywności</h3>
                  <p>Tu zobaczysz oceny, obecności, quizy i dołączenia do grup.</p>
                </div>
              ) : (
                <div className="activity-timeline">
                  {visibleActivity.map((item) => (
                    <button
                      key={item.id}
                      className="activity-item"
                      onClick={() => item.actionUrl && navigate(item.actionUrl)}
                    >
                      <span className="activity-icon material-symbols-outlined">{item.icon || "bolt"}</span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.description}</small>
                      </span>
                      <em>{formatDateTime(item.occurredAt)}</em>
                    </button>
                  ))}
                  {activity.length > 3 && (
                    <button className="secondary-action-btn" onClick={() => setShowAllActivity((value) => !value)}>
                      {showAllActivity ? "Pokaż tylko najnowsze" : `Pokaż starsze (${activity.length - 3})`}
                    </button>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <StudentBottomNav />
    </div>
  );
};

export default StudentActivityPage;
