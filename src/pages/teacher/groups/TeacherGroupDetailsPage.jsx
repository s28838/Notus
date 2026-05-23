import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TeacherBottomNav from "../../../components/teacher/TeacherBottomNav";
import { apiDelete, apiGet, apiPost, apiPut } from "../../../services/api";
import AppPageLayout from "../../../components/shared/AppPageLayout";
import { useTeacherRealtime } from "../../../hooks/useTeacherRealtime";

const TeacherGroupDetailsPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [studentSearchPending, setStudentSearchPending] = useState(false);
  const [invitationsRefreshing, setInvitationsRefreshing] = useState(false);
  const [pendingInvitationActions, setPendingInvitationActions] = useState({});
  const [editingStudent, setEditingStudent] = useState(null);
  const [gradeForm, setGradeForm] = useState({
    value: "5",
    weight: 1,
    semester: group?.semester || "2",
    title: "",
    description: "",
    comment: "",
  });

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const [groupData, studentData] = await Promise.all([
        apiGet(`/api/teacher/groups/${groupId}`),
        apiGet(`/api/teacher/groups/${groupId}/students`),
      ]);
      setGroup(groupData);
      setStudents(studentData);
      apiGet(`/api/teacher/groups/${groupId}/invitations`)
        .then((data) => setInvitations(Array.isArray(data) ? data : []))
        .catch(() => setInvitations([]));
    } catch {
      setError("Nie masz uprawnień do tej grupy albo nie udało się jej pobrać.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);


  const refreshGroupFromRealtime = useCallback((data) => {
    const payloadGroupId = data?.payload?.groupId;
    if (!payloadGroupId || Number(payloadGroupId) === Number(groupId)) {
      load({ silent: true });
    }
  }, [groupId, load]);

  useTeacherRealtime([
    "group.student_joined",
    "group.student_updated",
    "group.student_removed",
    "group.invitation_created",
    "group.invitation_updated",
    "group.invitation_cancelled",
    "group.invitation_accepted",
    "grade.created",
    "grade.updated",
    "grade.deleted",
    "grade.quiz_saved",
    "attendance.checked_in",
  ], refreshGroupFromRealtime);

  useEffect(() => {
    if (!showInvite) {
      setStudentSuggestions([]);
      setStudentSearchPending(false);
      return;
    }

    const query = inviteEmail.trim();
    if (query.length < 3) {
      setStudentSuggestions([]);
      setStudentSearchPending(false);
      return;
    }

    let active = true;
    setStudentSearchPending(true);
    const timeout = window.setTimeout(async () => {
      try {
        const results = await apiGet(`/api/teacher/groups/${groupId}/students/search`, { email: query });
        if (active) setStudentSuggestions(results);
      } catch {
        if (active) setStudentSuggestions([]);
      } finally {
        if (active) setStudentSearchPending(false);
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [groupId, inviteEmail, showInvite]);

  const matchingSuggestion = studentSuggestions.find(
    (student) => student.email.toLowerCase() === inviteEmail.trim().toLowerCase()
  );
  const acceptedInvitationEmails = new Set(
    invitations
      .filter((invitation) => invitation.status === "ACCEPTED")
      .map((invitation) => invitation.email?.toLowerCase())
      .filter(Boolean)
  );

  const sendInvite = async (event) => {
    event.preventDefault();
    setNotice("");
    setError("");
    setInviteError("");
    if (matchingSuggestion?.alreadyInGroup) {
      setInviteError("Ten uczeń jest już w grupie.");
      return;
    }
    try {
      const response = await apiPost(`/api/teacher/groups/${groupId}/students/invite`, { email: inviteEmail });
      if (!response.success) throw new Error(response.message);
      setInviteEmail("");
      setStudentSuggestions([]);
      setShowInvite(false);
      setNotice("Zaproszenie zostało wysłane.");
      await refreshInvitations();
    } catch (inviteError) {
      setInviteError(inviteError.message || "Nie udało się zaprosić ucznia. Skontaktuj się z administratorem.");
    }
  };

  const saveStudent = async (event) => {
    event.preventDefault();
    setNotice("");
    setError("");
    try {
      await apiPut(`/api/teacher/groups/${groupId}/students/${editingStudent.id}`, {
        displayName: editingStudent.fullName,
        email: editingStudent.email,
      });
      setEditingStudent(null);
      setNotice("Dane ucznia zostały zaktualizowane.");
      await load();
    } catch {
      setError("Nie udało się zaktualizować danych ucznia.");
    }
  };

  const saveGrade = async () => {
    if (!editingStudent) return;
    setNotice("");
    setError("");
    try {
      await apiPost(`/api/teacher/groups/${groupId}/students/${editingStudent.id}/grades`, {
        value: gradeForm.value,
        weight: Number(gradeForm.weight),
        semester: gradeForm.semester,
        title: gradeForm.title,
        description: gradeForm.description,
        comment: gradeForm.comment,
        gradeDate: new Date().toISOString().slice(0, 10),
      });
      setNotice("Ocena została wystawiona.");
      setEditingStudent(null);
      setGradeForm({
        value: "5",
        weight: 1,
        semester: group?.semester || "2",
        title: "",
        description: "",
        comment: "",
      });
      await load();
    } catch {
      setError("Nie udało się wystawić oceny.");
    }
  };

  const removeStudent = async (student) => {
    if (!window.confirm("Czy na pewno chcesz usunąć tego ucznia z grupy?")) return;
    setNotice("");
    setError("");
    try {
      await apiDelete(`/api/teacher/groups/${groupId}/students/${student.id}`);
      setNotice("Uczeń został usunięty z grupy.");
      await load();
    } catch {
      setError("Nie udało się usunąć ucznia z grupy.");
    }
  };

  const refreshInvitations = async ({ showPending = false } = {}) => {
    if (showPending) setInvitationsRefreshing(true);
    try {
      const data = await apiGet(`/api/teacher/groups/${groupId}/invitations`);
      setInvitations(Array.isArray(data) ? data : []);
    } catch {
      setInvitations([]);
    } finally {
      if (showPending) setInvitationsRefreshing(false);
    }
  };

  const resendInvitation = async (invitation) => {
    setNotice("");
    setError("");
    if (isResendCoolingDown(invitation)) {
      setError(`Zaproszenie można ponowić za ${formatCooldown(invitation.resendAvailableAt)}.`);
      return;
    }
    setPendingInvitationActions((current) => ({ ...current, [invitation.id]: "resend" }));
    try {
      const updatedInvitation = await apiPost(`/api/teacher/groups/${groupId}/invitations/${invitation.id}/resend`, {});
      setInvitations((current) => current.map((item) => (
        item.id === updatedInvitation.id ? updatedInvitation : item
      )));
      setNotice("Zaproszenie zostało wysłane ponownie.");
    } catch (err) {
      setError(err.message || "Nie udało się ponowić zaproszenia.");
    } finally {
      setPendingInvitationActions((current) => {
        const next = { ...current };
        delete next[invitation.id];
        return next;
      });
    }
  };

  const cancelInvitation = async (invitation) => {
    if (!window.confirm("Czy na pewno chcesz anulować to zaproszenie?")) return;
    setNotice("");
    setError("");
    try {
      await apiPost(`/api/teacher/groups/${groupId}/invitations/${invitation.id}/cancel`, {});
      setNotice("Zaproszenie zostało anulowane.");
      await refreshInvitations();
    } catch (err) {
      setError(err.message || "Nie udało się anulować zaproszenia.");
    }
  };

  const copyInvitationLink = async (invitation) => {
    if (!invitation.invitationLink) {
      setError("To zaproszenie nie ma zapisanego linku.");
      return;
    }

    try {
      await navigator.clipboard.writeText(invitation.invitationLink);
      setNotice("Link zaproszenia zostal skopiowany.");
    } catch {
      setError("Nie udalo sie skopiowac linku.");
    }
  };

  const formatInvitationDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const invitationStatusLabel = (status) => ({
    PENDING: "Oczekuje",
    ACCEPTED: "Zaakceptowane",
    FAILED: "Błąd wysyłki",
    CANCELLED: "Anulowane",
    EXPIRED: "Wygasłe",
  }[status] || status);

  const isResendCoolingDown = (invitation) => {
    if (invitation.status === "FAILED" || invitation.status === "ACCEPTED") return false;
    const availableAt = invitation.resendAvailableAt ? new Date(invitation.resendAvailableAt).getTime() : 0;
    return availableAt > Date.now();
  };

  const formatCooldown = (value) => {
    if (!value) return "24 godz.";
    const diffMs = Math.max(0, new Date(value).getTime() - Date.now());
    const totalMinutes = Math.max(1, Math.ceil(diffMs / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours <= 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} godz.`;
    return `${hours} godz. ${minutes} min`;
  };

  const resendButtonLabel = (invitation) => {
    if (pendingInvitationActions[invitation.id] === "resend") return "Wysyłam...";
    if (invitation.status === "ACCEPTED" || acceptedInvitationEmails.has(invitation.email?.toLowerCase())) return "Uczeń już w grupie";
    if (isResendCoolingDown(invitation)) return `Ponów za ${formatCooldown(invitation.resendAvailableAt)}`;
    return "Ponów";
  };

  if (loading) {
    return (
      <AppPageLayout
        title="Szczegóły grupy"
        leftIcon="arrow_back"
        onLeftClick={() => navigate("/teacher/groups")}
        leftAriaLabel="Powrót do grup"
        loading
        loadingLabel="Ładowanie grupy..."
        bottomNav={<TeacherBottomNav />}
        shell="teacher"
      />
    );
  }

  return (
    <AppPageLayout
      title="Szczegóły grupy"
      leftIcon="arrow_back"
      onLeftClick={() => navigate("/teacher/groups")}
      leftAriaLabel="Powrót do grup"
      bottomNav={<TeacherBottomNav />}
      shell="teacher"
    >

      {group && (
        <div className="details-header">
          <div>
            <p className="eyebrow">Szczegóły grupy</p>
            <h1>{group.name}</h1>
            <p>Przedmiot: {group.subject || "-"} | Rok szkolny: {group.schoolYear || "-"} | Semestr: {group.semester || "-"}</p>
          </div>
          <button
            className="primary-action-btn"
            onClick={() => {
              setInviteError("");
              setShowInvite(true);
            }}
          >
            <span className="material-symbols-outlined">person_add</span>
            Dodaj ucznia
          </button>
        </div>
      )}

      {notice && <div className="success-banner">{notice}</div>}
      {error && <div className="error-banner">{error}</div>}

      <section className="data-panel student-roster-panel">
        <h2>Uczniowie</h2>
        {students.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined">person_add</span>
            <h3>Brak uczniów w grupie</h3>
            <p>Użyj przycisku Dodaj ucznia, żeby wysłać zaproszenie email.</p>
          </div>
        ) : (
          <div className="responsive-table student-roster-table">
            <table>
              <thead>
                <tr>
                  <th>Imię i nazwisko</th>
                  <th>Email</th>
                  <th>Frekwencja</th>
                  <th>Średnia ocen</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.fullName}</td>
                    <td>{student.email}</td>
                    <td>
                      <button className="table-link" onClick={() => navigate(`/teacher/groups/${groupId}/students/${student.id}/attendance`)}>
                        <span className="attendance-meter" aria-label={`Frekwencja ${student.attendancePercentage}%`}>
                          <span className="attendance-meter-track">
                            <span
                              className="attendance-meter-fill"
                              style={{ width: `${Math.max(0, Math.min(100, Number(student.attendancePercentage) || 0))}%` }}
                            />
                          </span>
                          <strong>{student.attendancePercentage}%</strong>
                        </span>
                      </button>
                    </td>
                    <td>
                      <button className="table-link" onClick={() => navigate(`/teacher/groups/${groupId}/students/${student.id}/grades`)}>
                        {Number(student.averageGrade).toFixed(2)}
                      </button>
                    </td>
                    <td className="table-actions">
                      <button onClick={() => setEditingStudent({ ...student })}>Edytuj</button>
                      <button className="danger-link" onClick={() => removeStudent(student)}>Usuń</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="data-panel invitations-panel">
        <div className="panel-title-row">
          <div>
            <h2>Zaproszenia</h2>
            <p>Zarządzaj wysłanymi linkami do tej grupy: ponawiaj wysyłkę albo anuluj nieaktualne zaproszenia.</p>
          </div>
          <button className="secondary-action-btn" onClick={() => refreshInvitations({ showPending: true })} disabled={invitationsRefreshing}>
            <span className={`material-symbols-outlined ${invitationsRefreshing ? "spin-icon" : ""}`}>refresh</span>
            {invitationsRefreshing ? "Odświeżam..." : "Odśwież"}
          </button>
        </div>

        {invitations.length === 0 ? (
          <div className="empty-state compact">
            <span className="material-symbols-outlined">outgoing_mail</span>
            <h3>Brak zaproszeń</h3>
            <p>Po wysłaniu zaproszenia do ucznia zobaczysz tutaj jego status.</p>
          </div>
        ) : (
          <div className="responsive-table invitations-table">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Link</th>
                  <th>Status</th>
                  <th>Wysłano</th>
                  <th>Wygasa</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => {
                  const emailAccepted = acceptedInvitationEmails.has(invitation.email?.toLowerCase());
                  const canManage = invitation.status !== "ACCEPTED" && !emailAccepted;
                  const resendPending = pendingInvitationActions[invitation.id] === "resend";
                  const resendLocked = isResendCoolingDown(invitation);
                  const canResend = canManage && !resendPending && !resendLocked;
                  return (
                    <tr key={invitation.id}>
                      <td>{invitation.email}</td>
                      <td>
                        {invitation.invitationLink ? (
                          <button
                            type="button"
                            className="table-link invite-link-cell"
                            onClick={() => copyInvitationLink(invitation)}
                            title={invitation.invitationLink}
                          >
                            <span className="material-symbols-outlined">content_copy</span>
                            Skopiuj link
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <span className={`status-pill ${String(invitation.status).toLowerCase()}`}>
                          {invitationStatusLabel(invitation.status)}
                        </span>
                      </td>
                      <td>{formatInvitationDate(invitation.createdAt)}</td>
                      <td>{formatInvitationDate(invitation.expiresAt)}</td>
                      <td className="table-actions">
                        <button
                          className={resendPending ? "action-loading" : ""}
                          onClick={() => resendInvitation(invitation)}
                          disabled={!canResend}
                          title={resendLocked ? `Ponowienie będzie dostępne: ${formatInvitationDate(invitation.resendAvailableAt)}` : undefined}
                        >
                          {resendPending && <span className="button-spinner" aria-hidden="true" />}
                          {resendButtonLabel(invitation)}
                        </button>
                        {canManage && (
                          <button className="danger-link" onClick={() => cancelInvitation(invitation)}>
                            Anuluj
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showInvite && (
        <div className="modal-backdrop" onClick={() => setShowInvite(false)}>
          <form className="modal-card" onSubmit={sendInvite} onClick={(event) => event.stopPropagation()}>
            <h2>Dodaj ucznia do grupy</h2>
            <label>
              Email ucznia
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteError("");
                }}
                autoComplete="off"
                required
              />
            </label>
            {inviteEmail.trim().length >= 3 && (
              <div className="student-suggestions" aria-live="polite">
                <p>Podpowiedzi</p>
                {studentSearchPending ? (
                  <span className="suggestion-muted">Szukam uczniów...</span>
                ) : studentSuggestions.length > 0 ? (
                  studentSuggestions.map((student) => (
                    <button
                      type="button"
                      key={student.id}
                      className={`student-suggestion ${student.alreadyInGroup ? "disabled" : ""}`}
                      onClick={() => setInviteEmail(student.email)}
                    >
                      <span>
                        <strong>{student.fullName}</strong>
                        <small>{student.email}</small>
                      </span>
                      {student.alreadyInGroup && <em>już w grupie</em>}
                    </button>
                  ))
                ) : (
                  <span className="suggestion-muted">Brak pasujących uczniów. Nadal możesz wysłać zaproszenie na ten email.</span>
                )}
              </div>
            )}
            {(inviteError || matchingSuggestion?.alreadyInGroup) && (
              <div className="modal-inline-error" role="alert">
                {inviteError || "Ten uczeń jest już w grupie."}
              </div>
            )}
            <div className="modal-actions">
              <button type="button" onClick={() => setShowInvite(false)}>Anuluj</button>
              <button className="primary-action-btn" type="submit">
                Wyślij zaproszenie
              </button>
            </div>
          </form>
        </div>
      )}

      {editingStudent && (
        <div className="modal-backdrop" onClick={() => setEditingStudent(null)}>
          <form className="modal-card student-edit-modal" onSubmit={saveStudent} onClick={(event) => event.stopPropagation()}>
            <h2>Edytuj ucznia</h2>
            <label>
              Imię i nazwisko
              <input value={editingStudent.fullName} onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })} required />
            </label>
            <div className="student-readonly-info" aria-label="Informacje o uczniu">
              <span>
                <strong>Email</strong>
                {editingStudent.email || "-"}
              </span>
              <span>
                <strong>Frekwencja</strong>
                {editingStudent.attendancePercentage ?? 0}%
              </span>
              <span>
                <strong>Średnia ocen</strong>
                {Number(editingStudent.averageGrade || 0).toFixed(2)}
              </span>
            </div>
            <div className="grade-form-section">
              <h3>Wystaw ocenę</h3>
              <div className="form-grid">
                <label>
                  Ocena
                  <input value={gradeForm.value} onChange={(e) => setGradeForm({ ...gradeForm, value: e.target.value })} />
                </label>
                <label>
                  Waga
                  <input type="number" min="1" value={gradeForm.weight} onChange={(e) => setGradeForm({ ...gradeForm, weight: e.target.value })} />
                </label>
                <label>
                  Semestr
                  <input value={gradeForm.semester} onChange={(e) => setGradeForm({ ...gradeForm, semester: e.target.value })} />
                </label>
                <label>
                  Z czego
                  <input value={gradeForm.title} onChange={(e) => setGradeForm({ ...gradeForm, title: e.target.value })} placeholder="Kartkówka" />
                </label>
              </div>
              <label>
                Opis
                <input value={gradeForm.description} onChange={(e) => setGradeForm({ ...gradeForm, description: e.target.value })} placeholder="Ułamki zwykłe" />
              </label>
              <label>
                Komentarz
                <textarea value={gradeForm.comment} onChange={(e) => setGradeForm({ ...gradeForm, comment: e.target.value })} placeholder="Bardzo dobra praca" />
              </label>
              <button className="primary-action-btn" type="button" onClick={saveGrade}>
                Zapisz ocenę
              </button>
            </div>
            <div className="modal-actions sticky-actions">
              <button type="button" onClick={() => setEditingStudent(null)}>Anuluj</button>
              <button className="primary-action-btn" type="submit">Zapisz zmiany</button>
            </div>
          </form>
        </div>
      )}

    </AppPageLayout>
  );
};

export default TeacherGroupDetailsPage;
