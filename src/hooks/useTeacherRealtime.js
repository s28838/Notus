import { useEffect } from "react";
import { API_BASE } from "../services/api";

export const TEACHER_REALTIME_EVENTS = [
  "attendance.checked_in",
  "grade.created",
  "grade.updated",
  "grade.deleted",
  "grade.quiz_saved",
  "group.student_joined",
  "group.student_updated",
  "group.student_removed",
  "group.invitation_created",
  "group.invitation_updated",
  "group.invitation_cancelled",
  "group.invitation_accepted",
];

export function useTeacherRealtime(eventNames, handler, enabled = true) {
  const eventKey = eventNames.join("|");

  useEffect(() => {
    const token = localStorage.getItem("clerkToken");
    if (!enabled || !token || typeof EventSource === "undefined") return undefined;

    const streamUrl = `${API_BASE}/api/teacher/realtime/stream?token=${encodeURIComponent(token)}`;
    const source = new EventSource(streamUrl);

    const listeners = eventNames.map((eventName) => {
      const listener = (event) => {
        let data = null;
        try {
          data = JSON.parse(event.data);
        } catch {
          data = { type: eventName, payload: {} };
        }
        handler(data, eventName);
      };

      source.addEventListener(eventName, listener);
      return { eventName, listener };
    });

    return () => {
      listeners.forEach(({ eventName, listener }) => {
        source.removeEventListener(eventName, listener);
      });
      source.close();
    };
  }, [enabled, eventKey, handler]);
}
