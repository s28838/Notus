import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherBottomNav from "../../components/teacher/TeacherBottomNav";
import LoadingState from "../../components/shared/LoadingState";
import { apiGet } from "../../services/api";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
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

const READ_NOTIFICATIONS_KEY = "notus_teacher_read_notifications";

const loadReadNotificationIds = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

const TeacherActivityPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [activity, setActivity] = useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState(loadReadNotificationIds);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isNotificationRead = useCallback((item) => item.read || readNotificationIds.has(item.id), [readNotificationIds]);
  const unreadCount = notifications.filter((item) => !isNotificationRead(item)).length;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [notificationsResponse, activityResponse] = await Promise.all([
        apiGet("/api/teacher/notifications"),
        apiGet("/api/teacher/activity"),
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
      const serialized = JSON.stringify(Array.from(next).slice(-200));
      localStorage.setItem(READ_NOTIFICATIONS_KEY, serialized);
      window.dispatchEvent(new Event("teacher-notifications:read"));
      return next;
    });
  }, []);

  return (
    <div className="schedule-page-container groups-page activity-page">
      <div className="details-header activity-header">
        <div>
          <p className="eyebrow">Centrum nauczyciela</p>
          <h1>Aktywność i powiadomienia</h1>
          <p>Najważniejsze zdarzenia z grup, zaproszeń, ocen, quizów i obecności.</p>
        </div>
        <button className="secondary-action-btn" onClick={load}>
          <span className="material-symbols-outlined">refresh</span>
          Odśwież
        </button>
      </div>

      {loading ? (
        <LoadingState label="Ładowanie aktywności..." />
      ) : (
        <>
          {error && <div className="error-banner">{error}</div>}

          <section className="data-panel notifications-panel">
            <div className="panel-title-row">
              <div>
                <h2>Powiadomienia</h2>
                <p>{unreadCount > 0 ? `${unreadCount} nowych zdarzeń do sprawdzenia` : "Brak pilnych alertów"}</p>
              </div>
              <span className="notification-count">{unreadCount}</span>
            </div>

            {notifications.length === 0 ? (
              <div className="empty-state compact">
                <span className="material-symbols-outlined">notifications_off</span>
                <h3>Spokojnie, nic pilnego</h3>
                <p>Tu pojawią się problemy z wysyłką, wygasające zaproszenia i zaakceptowane dołączenia.</p>
              </div>
            ) : (
              <div className="notification-list">
                {notifications.map((item) => (
                  <button
                    key={item.id}
                    className={`notification-item ${item.severity || "info"} ${!isNotificationRead(item) ? "unread" : ""}`}
                    onMouseEnter={() => markNotificationRead(item.id)}
                    onClick={() => {
                      markNotificationRead(item.id);
                      if (item.actionUrl) navigate(item.actionUrl);
                    }}
                  >
                    <span className="material-symbols-outlined">
                      {severityIcon[item.severity] || severityIcon.info}
                    </span>
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
              </div>
            )}
          </section>

          <section className="data-panel activity-timeline-panel">
            <h2>Centrum aktywności</h2>
            {activity.length === 0 ? (
              <div className="empty-state compact">
                <span className="material-symbols-outlined">timeline</span>
                <h3>Jeszcze brak aktywności</h3>
                <p>Gdy pojawią się oceny, sesje obecności, quizy lub zaproszenia, zobaczysz je tutaj.</p>
              </div>
            ) : (
              <div className="activity-timeline">
                {activity.map((item) => (
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
              </div>
            )}
          </section>
        </>
      )}

      <TeacherBottomNav />
    </div>
  );
};

export default TeacherActivityPage;
