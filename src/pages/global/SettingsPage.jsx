import React, { useContext, useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { apiGet, apiPut, apiPost } from "../../services/api";
import TeacherBottomNav from "../../components/teacher/TeacherBottomNav";
import StudentBottomNav from "../../components/student/StudentBottomNav";
import Toast from "../../components/shared/Toast";
import SectionCard from "../../components/settings/SectionCard";
import SettingRow from "../../components/settings/SettingRow";
import { SETTINGS_STRINGS as S, VALIDATION, MOCK_SESSIONS } from "../../config/settings";

// ─── helpers ─────────────────────────────────────────────────────────────────

const Field = ({ label, value, icon }) => {
  if (icon === "fingerprint") return null;
  value = icon === "school" ? (value === "Student" ? "Uczeń" : "Nauczyciel") : value;

  return (
  <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.75rem 0", borderBottom:"1px solid var(--border-light)" }}>
    <span className="material-symbols-outlined" style={{ color:"var(--text-tertiary)", fontSize:"1.2rem" }}>{icon}</span>
    <div style={{ flex:1 }}>
      <p style={{ margin:0, fontSize:"0.7rem", color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:700 }}>{label}</p>
      <p style={{ margin:"0.1rem 0 0", fontSize:"0.9rem", fontWeight:600, color:"var(--text-primary)" }}>{value || "—"}</p>
    </div>
  </div>
  );
};

const FormInput = ({ id, label, type="text", value, onChange, placeholder, error, autoComplete, disabled = false }) => (
  <div style={{ marginBottom:"0.875rem" }}>
    <label htmlFor={id} style={{ display:"block", fontSize:"0.75rem", fontWeight:700, color:"var(--text-secondary)", marginBottom:"0.375rem", textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</label>
    <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} disabled={disabled}
      style={{ width:"100%", padding:"0.75rem 1rem", boxSizing:"border-box", borderRadius:"0.625rem",
        border: error ? "1px solid #ef4444" : "1px solid var(--border-light)",
        background: disabled ? "var(--border-light)" : "var(--bg-light)", color:"var(--text-primary)", fontSize:"0.9rem", fontFamily:"inherit", outline:"none" }} />
    {error && <p style={{ margin:"0.25rem 0 0", fontSize:"0.75rem", color:"#ef4444" }}>{error}</p>}
  </div>
);

// ─── [SCRUM-215] Personal data ────────────────────────────────────────────────
const PersonalSection = ({ user }) => (
  <SectionCard icon="person" title={S.sections.personal}>
    <Field icon="badge"        label={S.personal.name}  value={user?.name} />
    <Field icon="school"       label={S.personal.role}  value={user?.role === "student" ? "Student" : "Wykładowca"} />
    {user?.role === "student" && <Field icon="tag" label={S.personal.index} value={user?.index} />}
    <Field icon="alternate_email" label={S.personal.email}   value={user?.email} />
    <Field icon="fingerprint"  label={S.personal.clerkId} value={user?.clerkId ? `…${user.clerkId.slice(-8)}` : "—"} />
  </SectionCard>
);

// ─── [SCRUM-216] Contact form ─────────────────────────────────────────────────
const ContactSection = ({ showToast, user }) => {
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [phoneLocked, setPhoneLocked] = useState(false);

  const validate = () => {
    const e = {};
    if (email && !VALIDATION.email.test(email)) e.email = "Podaj poprawny adres e-mail.";
    if (phone && !VALIDATION.phone.test(phone.replace(/\s/g, ""))) e.phone = "Podaj poprawny numer (np. +48 123 456 789).";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setSaving(true);
    try {
      showToast("Dane kontaktowe zostały zapisane.", "success");
      if (phone.trim()) setPhoneLocked(true);
    } catch (err) {
      showToast("Nie udało się zapisać danych.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard icon="contact_mail" title={S.sections.contact}>
      <FormInput id="contact-email" label={S.contact.email} type="email" value={email}
        onChange={e => setEmail(e.target.value)} placeholder={S.contact.emailPlaceholder}
        error={errors.email} autoComplete="email" />
      <FormInput id="contact-phone" label={S.contact.phone} type="tel" value={phone}
        onChange={e => setPhone(e.target.value)} placeholder={S.contact.phonePlaceholder}
        error={errors.phone} autoComplete="tel" disabled={phoneLocked} />
      <div style={{ display:"flex", gap:"0.625rem", marginTop:"0.25rem" }}>
        <button id="btn-save-contact" className="btn-primary" onClick={handleSave} disabled={saving || phoneLocked} style={{ flex:1 }}>
          {saving ? S.contact.saving : S.contact.save}
        </button>
        {phoneLocked && (
          <button type="button" className="secondary-action-btn" onClick={() => setPhoneLocked(false)}>
            Edytuj
          </button>
        )}
      </div>
    </SectionCard>
  );
};

// ─── [SCRUM-217] Security ─────────────────────────────────────────────────────
const SecuritySection = ({ showToast }) => {
  const { user: clerkUser } = useUser();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwErrors,  setPwErrors]  = useState({});
  const [savingPw,  setSavingPw]  = useState(false);
  const [twoFA,     setTwoFA]     = useState(clerkUser?.twoFactorEnabled ?? false);
  const [sessions,  setSessions]  = useState(MOCK_SESSIONS);

  const validatePw = () => {
    const e = {};
    if (!currentPw)                           e.currentPw  = "Podaj obecne hasło.";
    if (newPw.length < VALIDATION.passwordMin) e.newPw      = `Minimum ${VALIDATION.passwordMin} znaków.`;
    if (newPw !== confirmPw)                  e.confirmPw  = "Hasła nie są identyczne.";
    return e;
  };

  const handleChangePw = async () => {
    const e = validatePw();
    if (Object.keys(e).length) { setPwErrors(e); return; }
    setPwErrors({});
    setSavingPw(true);
    try {
      await clerkUser.updatePassword({ currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      showToast("Hasło zostało zmienione.", "success");
    } catch (err) {
      showToast(err.errors?.[0]?.message || "Nie udało się zmienić hasła.", "error");
    } finally {
      setSavingPw(false);
    }
  };

  const handleRevokeOthers = () => {
    setSessions(prev => prev.filter(s => s.current));
    showToast("Pozostałe sesje zostały wylogowane.", "info");
  };

  return (
    <SectionCard icon="shield" title={S.sections.security}>
      <p style={{ margin:"0 0 0.75rem", fontSize:"0.8rem", fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{S.security.changePassword}</p>
      <FormInput id="current-pw" label={S.security.currentPassword} type="password" value={currentPw} onChange={e=>setCurrentPw(e.target.value)} error={pwErrors.currentPw} autoComplete="current-password"/>
      <FormInput id="new-pw"     label={S.security.newPassword}     type="password" value={newPw}     onChange={e=>setNewPw(e.target.value)}     error={pwErrors.newPw}     autoComplete="new-password"/>
      <FormInput id="confirm-pw" label={S.security.confirmPassword} type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} error={pwErrors.confirmPw} autoComplete="new-password"/>
      <button id="btn-change-password" className="btn-primary" onClick={handleChangePw} disabled={savingPw} style={{ marginBottom:"1.25rem" }}>
        {savingPw ? "Zapisywanie..." : S.security.savePassword}
      </button>

      <div style={{ height:"1px", background:"var(--border-light)", margin:"0.5rem 0 1rem" }}/>

      <SettingRow id="toggle-2fa" icon="lock" label={S.security.twoFactor} description={S.security.twoFactorDesc}
        checked={twoFA} onChange={v => { setTwoFA(v); showToast(v ? "2FA włączone." : "2FA wyłączone.", "info"); }}/>

      <div style={{ height:"1px", background:"var(--border-light)", margin:"0.75rem 0 1rem" }}/>

      <p style={{ margin:"0 0 0.75rem", fontSize:"0.8rem", fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{S.security.sessions}</p>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem", marginBottom:"0.875rem" }}>
        {sessions.map(s => (
          <div key={s.id} style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.75rem", borderRadius:"0.75rem",
            background: s.current ? "rgba(244,89,37,0.06)" : "var(--bg-light)",
            border:`1px solid ${s.current ? "rgba(244,89,37,0.2)" : "var(--border-light)"}` }}>
            <span className="material-symbols-outlined" style={{ color: s.current ? "var(--color-primary)" : "var(--text-secondary)" }}>{s.icon}</span>
            <div style={{ flex:1 }}>
              <p style={{ margin:0, fontWeight:600, fontSize:"0.85rem", color:"var(--text-primary)" }}>{s.device}</p>
              <p style={{ margin:0, fontSize:"0.75rem", color:"var(--text-secondary)" }}>{s.location} · {s.lastSeen}</p>
            </div>
            {s.current && <span style={{ fontSize:"0.7rem", fontWeight:700, color:"var(--color-primary)", background:"rgba(244,89,37,0.1)", padding:"0.2rem 0.5rem", borderRadius:"999px" }}>{S.security.thisDevice}</span>}
          </div>
        ))}
      </div>
      {sessions.length > 1 && (
        <button id="btn-revoke-sessions" onClick={handleRevokeOthers} style={{ width:"100%", padding:"0.65rem", borderRadius:"0.625rem", background:"none", border:"1px solid var(--border-light)", color:"var(--text-secondary)", fontWeight:600, fontSize:"0.85rem", cursor:"pointer" }}>
          {S.security.revokeOthers}
        </button>
      )}
    </SectionCard>
  );
};

// ─── [SCRUM-218] Account management ──────────────────────────────────────────
const AccountManagementSection = ({ showToast, deactivatedStatus }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deactivated,   setDeactivated]   = useState(deactivatedStatus);

  useEffect(() => { setDeactivated(deactivatedStatus); }, [deactivatedStatus]);

  const handleDeactivate = async () => {
    try {
      const res = await apiPost("/api/users/settings/deactivate", {});
      setDeactivated(res.deactivated);
      showToast(res.deactivated ? "Konto deaktywowane." : "Konto reaktywowane.", "info");
    } catch (err) {
      showToast("Błąd zmiany statusu konta.", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await apiPost("/api/users/settings/delete", {});
      setConfirmDelete(false);
      showToast("Wniosek przyjęty. Konto zostanie usunięte po 30 dniach.", "error");
    } catch (err) {
      showToast("Nie udało się wysłać wniosku.", "error");
    }
  };

  return (
    <SectionCard icon="manage_accounts" title={S.sections.account} defaultOpen={false}>
      {/* Deactivate */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:"0.75rem", padding:"0.875rem", borderRadius:"0.75rem", background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", marginBottom:"0.875rem" }}>
        <span className="material-symbols-outlined" style={{ color:"#d97706", flexShrink:0 }}>pause_circle</span>
        <div style={{ flex:1 }}>
          <p style={{ margin:"0 0 0.25rem", fontWeight:700, fontSize:"0.875rem", color:"var(--text-primary)" }}>{S.account.deactivate}</p>
          <p style={{ margin:"0 0 0.625rem", fontSize:"0.78rem", color:"var(--text-secondary)" }}>{S.account.deactivateDesc}</p>
          <button id="btn-deactivate-account" onClick={handleDeactivate}
            style={{ padding:"0.5rem 1rem", borderRadius:"0.5rem", background: deactivated ? "#22c55e" : "#d97706", color:"white", border:"none", fontWeight:700, fontSize:"0.8rem", cursor:"pointer" }}>
            {deactivated ? "Reaktywuj konto" : S.account.deactivate}
          </button>
        </div>
      </div>

      {/* Delete */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:"0.75rem", padding:"0.875rem", borderRadius:"0.75rem", background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)" }}>
        <span className="material-symbols-outlined" style={{ color:"#dc2626", flexShrink:0 }}>delete_forever</span>
        <div style={{ flex:1 }}>
          <p style={{ margin:"0 0 0.25rem", fontWeight:700, fontSize:"0.875rem", color:"var(--text-primary)" }}>{S.account.delete}</p>
          <p style={{ margin:"0 0 0.625rem", fontSize:"0.78rem", color:"var(--text-secondary)" }}>{S.account.deleteDesc}</p>
          {confirmDelete ? (
            <>
              <div style={{ padding:"0.625rem", borderRadius:"0.5rem", background:"rgba(239,68,68,0.1)", marginBottom:"0.75rem" }}>
                <p style={{ margin:0, fontSize:"0.78rem", color:"#dc2626", fontWeight:500 }}>{S.account.deleteWarning}</p>
              </div>
              <div style={{ display:"flex", gap:"0.5rem" }}>
                <button id="btn-confirm-delete" onClick={handleDelete} style={{ flex:1, padding:"0.6rem", borderRadius:"0.5rem", background:"#dc2626", color:"white", border:"none", fontWeight:700, fontSize:"0.8rem", cursor:"pointer" }}>{S.account.confirmDelete}</button>
                <button id="btn-cancel-delete" onClick={()=>setConfirmDelete(false)} style={{ flex:1, padding:"0.6rem", borderRadius:"0.5rem", background:"none", border:"1px solid var(--border-light)", fontWeight:700, fontSize:"0.8rem", cursor:"pointer", color:"var(--text-secondary)" }}>{S.account.cancelDelete}</button>
              </div>
            </>
          ) : (
            <button id="btn-delete-account" onClick={()=>setConfirmDelete(true)} style={{ padding:"0.5rem 1rem", borderRadius:"0.5rem", background:"#dc2626", color:"white", border:"none", fontWeight:700, fontSize:"0.8rem", cursor:"pointer" }}>{S.account.delete}</button>
          )}
        </div>
      </div>
    </SectionCard>
  );
};

// ─── [SCRUM-219/220/221] Notifications ───────────────────────────────────────
const NotificationsSection = ({ showToast, backendSettings }) => {
  const [channels, setChannels] = useState({ push:true, email:true, sms:false });
  const [academic, setAcademic] = useState({ grades:true, announcements:true, schedule:true });
  const [admin,    setAdmin]    = useState({ applications:true, payments:false });
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (backendSettings) {
      setChannels({ push: backendSettings.notifyPush, email: backendSettings.notifyEmail, sms: backendSettings.notifySms });
      setAcademic({ grades: backendSettings.notifyGrades, announcements: backendSettings.notifyAnnouncements, schedule: backendSettings.notifySchedule });
      setAdmin({ applications: backendSettings.notifyApplications, payments: backendSettings.notifyPayments });
    }
  }, [backendSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPut("/api/users/settings", {
        notifyPush: channels.push, notifyEmail: channels.email, notifySms: channels.sms,
        notifyGrades: academic.grades, notifyAnnouncements: academic.announcements, notifySchedule: academic.schedule,
        notifyApplications: admin.applications, notifyPayments: admin.payments
      });
      showToast("Ustawienia powiadomień zapisane.", "success");
    } catch (err) {
      showToast("Błąd zapisu ustawień.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard icon="notifications" title={S.sections.notifications}>
      <p style={{ margin:"0 0 0.75rem", fontSize:"0.8rem", fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:"0.05em" }}>Kanały powiadomień</p>
      <SettingRow id="notif-push"  icon="notifications_active" label={S.notifChannels.push}  checked={channels.push}  onChange={v=>setChannels(p=>({...p,push:v}))}/>
      <SettingRow id="notif-email" icon="mail"                  label={S.notifChannels.email} checked={channels.email} onChange={v=>setChannels(p=>({...p,email:v}))}/>
      <SettingRow id="notif-sms"   icon="sms"                   label={S.notifChannels.sms}   checked={channels.sms}   onChange={v=>setChannels(p=>({...p,sms:v}))} last/>

      <div style={{ height:"1px", background:"var(--border-light)", margin:"1rem 0" }}/>
      <p style={{ margin:"0 0 0.75rem", fontSize:"0.8rem", fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{S.notifAcademic.heading}</p>
      <SettingRow id="notif-grades"        icon="grade"      label={S.notifAcademic.grades}        description={S.notifAcademic.gradesDesc}        checked={academic.grades}        onChange={v=>setAcademic(p=>({...p,grades:v}))}/>
      <SettingRow id="notif-announcements" icon="campaign"   label={S.notifAcademic.announcements} description={S.notifAcademic.announcementsDesc} checked={academic.announcements} onChange={v=>setAcademic(p=>({...p,announcements:v}))}/>
      <SettingRow id="notif-schedule"      icon="event_busy" label={S.notifAcademic.schedule}      description={S.notifAcademic.scheduleDesc}      checked={academic.schedule}      onChange={v=>setAcademic(p=>({...p,schedule:v}))} last/>

      <div style={{ height:"1px", background:"var(--border-light)", margin:"1rem 0" }}/>
      <p style={{ margin:"0 0 0.75rem", fontSize:"0.8rem", fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{S.notifAdmin.heading}</p>
      <SettingRow id="notif-applications" icon="assignment_turned_in" label={S.notifAdmin.applications} description={S.notifAdmin.applicationsDesc} checked={admin.applications} onChange={v=>setAdmin(p=>({...p,applications:v}))}/>
      <SettingRow id="notif-payments"     icon="payments"             label={S.notifAdmin.payments}     description={S.notifAdmin.paymentsDesc}     checked={admin.payments}     onChange={v=>setAdmin(p=>({...p,payments:v}))} last/>

      <button id="btn-save-notifications" className="btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop:"1rem" }}>
        {saving ? "Zapisywanie..." : "Zapisz ustawienia"}
      </button>
    </SectionCard>
  );
};

// ─── Theme selector ───────────────────────────────────────────────────────────
const ThemeSection = () => {
  const { mode, setThemeMode } = useTheme();

  const options = [
    { value:"system", icon:"brightness_auto", label:"Systemowy" },
    { value:"light",  icon:"light_mode",      label:"Jasny"     },
    { value:"dark",   icon:"dark_mode",       label:"Ciemny"    },
  ];

  return (
    <SectionCard icon="palette" title="Motyw aplikacji">
      <div style={{ display:"flex", gap:"0.625rem" }}>
        {options.map(o => (
          <button key={o.value} id={`theme-${o.value}`} onClick={() => setThemeMode(o.value)}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"0.375rem",
              padding:"0.75rem 0.5rem", borderRadius:"0.75rem", cursor:"pointer", fontWeight:700, fontSize:"0.75rem",
              border: mode === o.value ? "2px solid var(--color-primary)" : "1px solid var(--border-light)",
              background: mode === o.value ? "rgba(244,89,37,0.08)" : "var(--bg-light)",
              color: mode === o.value ? "var(--color-primary)" : "var(--text-secondary)",
              transition:"all 0.2s" }}>
            <span className="material-symbols-outlined" style={{ fontSize:"1.5rem" }}>{o.icon}</span>
            {o.label}
          </button>
        ))}
      </div>
      <p style={{ margin:"0.75rem 0 0", fontSize:"0.75rem", color:"var(--text-tertiary)", textAlign:"center" }}>
        Motyw systemowy automatycznie dostosowuje się do ustawień Twojego urządzenia.
      </p>
    </SectionCard>
  );
};

// ─── [SCRUM-222] About ────────────────────────────────────────────────────────
const AboutSection = () => (
  <SectionCard icon="info" title={S.sections.about} defaultOpen={false}>
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"1rem 0 0.5rem" }}>
      <div style={{ width:"72px", height:"72px", borderRadius:"50%", background:"linear-gradient(135deg,#0059C9,#003d8f)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(0,89,201,0.35)", marginBottom:"0.75rem" }}>
        <span className="material-symbols-outlined" style={{ color:"white", fontSize:"2rem" }}>school</span>
      </div>
      <p style={{ margin:"0 0 0.25rem", fontWeight:800, fontSize:"1rem", color:"var(--text-primary)", textAlign:"center" }}>{S.about.appName}</p>
      <p style={{ margin:0, fontSize:"0.8rem", color:"var(--text-secondary)" }}>{S.about.version}</p>
    </div>
    <div style={{ height:"1px", background:"var(--border-light)", margin:"1rem 0" }}/>
    <p style={{ margin:"0 0 0.5rem", fontSize:"0.8rem", fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{S.about.university}</p>
    <p style={{ margin:"0 0 1rem", fontSize:"0.875rem", color:"var(--text-primary)", lineHeight:1.5 }}>Notus wspiera nauczycieli i uczniów w zarządzaniu grupami, frekwencją, ocenami oraz quizami.</p>
    <p style={{ margin:"0 0 0.5rem", fontSize:"0.8rem", fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{S.about.creators}</p>
    <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem", marginBottom:"1rem" }}>
      {S.about.creatorsList.map((c,i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <span className="material-symbols-outlined" style={{ color:"var(--color-primary)", fontSize:"1rem" }}>person</span>
          <span style={{ fontSize:"0.875rem", color:"var(--text-primary)" }}>{c}</span>
        </div>
      ))}
    </div>
    <p style={{ margin:0, fontSize:"0.75rem", color:"var(--text-tertiary)", textAlign:"center" }}>{S.about.legal}</p>
  </SectionCard>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const SettingsPage = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate  = useNavigate();
  const [toast, setToast] = useState({ message:"", type:"success" });
  const [backendSettings, setBackendSettings] = useState(null);

  const showToast = useCallback((message, type="success") => setToast({ message, type }), []);

  useEffect(() => {
    apiGet("/api/users/settings").then(setBackendSettings).catch(console.error);
  }, []);

  const goToHome     = () => navigate(user?.role==="teacher" ? "/teacher"          : "/student");
  const goToSchedule = () => navigate(user?.role==="teacher" ? "/teacher/schedule" : "/student/schedule");
  const goToStats    = () => navigate(user?.role==="teacher" ? "/teacher/stats"    : "/student/stats");
  const handleLogout = () => logout();

  return (
    <div className="app-container">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message:"", type:"success" })}/>

      <header className="top-bar">
        <button className="icon-btn" onClick={() => navigate(-1)} id="btn-back-settings">
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="top-bar-title">{S.pageTitle}</h1>
        <div style={{ width:"2.5rem" }}/>
      </header>

      <div style={{ padding:"1rem", display:"flex", flexDirection:"column", gap:"0.875rem" }}>
        <PersonalSection user={user}/>
        <ContactSection showToast={showToast} user={user}/>
        <ThemeSection/>
        <AccountManagementSection showToast={showToast} deactivatedStatus={backendSettings?.deactivated} />
        <AboutSection/>
        <button
          className="secondary-action-btn"
          onClick={handleLogout}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", alignSelf:"flex-start" }}
        >
          <span className="material-symbols-outlined">logout</span>
          Wyloguj się
        </button>
      </div>

      {user?.role === "teacher" ? (
        <TeacherBottomNav/>
      ) : (
        <StudentBottomNav/>
      )}
    </div>
  );
};

export default SettingsPage;
