// src/config/settings.js
// Centralised text strings and config for the Settings & Notifications modules.

export const SETTINGS_STRINGS = {
  // Page title
  pageTitle: "Ustawienia",

  // Section headings
  sections: {
    personal: "Dane osobowe",
    contact: "Dane kontaktowe",
    security: "Bezpieczeństwo",
    account: "Zarządzanie kontem",
    notifications: "Powiadomienia",
    about: "O aplikacji",
  },

  // Personal data (read-only)
  personal: {
    name: "Imię i nazwisko",
    role: "Rola",
    index: "Nr indeksu",
    clerkId: "ID konta",
    email: "E-mail",
  },

  // Contact form
  contact: {
    email: "Adres e-mail",
    emailPlaceholder: "twoj@email.pl",
    save: "Zapisz dane kontaktowe",
    saving: "Zapisywanie...",
  },

  // Security
  security: {
    changePassword: "Zmień hasło",
    currentPassword: "Obecne hasło",
    newPassword: "Nowe hasło",
    confirmPassword: "Potwierdź nowe hasło",
    savePassword: "Zmień hasło",
    twoFactor: "Logowanie dwuetapowe (2FA)",
    twoFactorDesc: "Dodatkowa warstwa bezpieczeństwa dla Twojego konta",
    sessions: "Aktywne sesje",
    sessionsDesc: "Urządzenia zalogowane na Twoim koncie",
    thisDevice: "To urządzenie",
    revokeOthers: "Wyloguj pozostałe sesje",
  },

  // Account management
  account: {
    deactivate: "Deaktywuj konto",
    deactivateDesc: "Tymczasowo wyłącz dostęp do konta",
    delete: "Usuń konto",
    deleteDesc: "Konto zostanie trwale usunięte po 30 dniach od potwierdzenia",
    deleteWarning:
      "Uwaga: Usunięcie konta jest nieodwracalne. Po potwierdzeniu masz 30 dni karencji, w ciągu których możesz anulować operację.",
    confirmDelete: "Tak, usuń moje konto",
    cancelDelete: "Anuluj",
  },

  // Notification channels
  notifChannels: {
    push: "Powiadomienia Push",
    email: "Powiadomienia E-mail",
    sms: "Powiadomienia SMS",
  },

  // Notification categories – academic
  notifAcademic: {
    heading: "Kategorie akademickie",
    grades: "Oceny",
    gradesDesc: "Informuj mnie o nowych ocenach",
    announcements: "Ogłoszenia wykładowców",
    announcementsDesc: "Ogłoszenia od prowadzących zajęcia",
    schedule: "Zmiany w planie zajęć",
    scheduleDesc: "Powiadamiaj o zmianach lub odwołaniach",
  },

  // Notification categories – administrative
  notifAdmin: {
    heading: "Kategorie administracyjne",
    applications: "Statusy wniosków",
    applicationsDesc: "Aktualizacje statusu złożonych wniosków",
    payments: "Przypomnienia o płatnościach",
    paymentsDesc: "Terminy i potwierdzenia płatności",
  },

  // About section
  about: {
    heading: "O aplikacji",
    appName: "Notus",
    version: "Wersja 1.0.0",
    university: "Aplikacja edukacyjna do zarządzania grupami, frekwencją, ocenami i quizami.",
    creators: "Twórcy systemu",
    creatorsList: [
      "Kacper Ruta",
      "Bartosz Dembowski",
      "Oskar Szyszko",
    ],
    legal: "© 2026 Notus. Wszelkie prawa zastrzeżone.",
  },
};

// Validation rules
export const VALIDATION = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  passwordMin: 8,
};

// Mock active sessions data
export const MOCK_SESSIONS = [
  {
    id: "s1",
    device: "Chrome – MacOS",
    icon: "laptop_mac",
    location: "Warszawa, PL",
    lastSeen: "Teraz",
    current: true,
  },
  {
    id: "s2",
    device: "Safari – iPhone",
    icon: "phone_iphone",
    location: "Warszawa, PL",
    lastSeen: "2 godziny temu",
    current: false,
  },
  {
    id: "s3",
    device: "Firefox – Windows",
    icon: "desktop_windows",
    location: "Kraków, PL",
    lastSeen: "Wczoraj",
    current: false,
  },
];
