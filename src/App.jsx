// src/App.jsx

import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import LoginPage from "./pages/global/LoginPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentActivityPage from "./pages/student/StudentActivityPage";
import StudentGroupsPage from "./pages/student/StudentGroupsPage";
import StudentGroupGradesPage from "./pages/student/StudentGroupGradesPage";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherActivityPage from "./pages/teacher/TeacherActivityPage";
import TeacherStatsPage from "./pages/teacher/TeacherStatsPage";
import ProfilePage from "./pages/global/ProfilePage";
import SchedulePage from "./pages/student/SchedulePage";
import ScanQRPage from "./pages/student/ScanQRPage";
import StatsPage from "./pages/student/StatsPage";
import CreateSessionPage from "./pages/teacher/CreateSessionPage";
import AttendanceListPage from "./pages/teacher/AttendanceListPage";
import QuizzesPage from "./pages/teacher/QuizzesPage";
import CreateQuizPage from "./pages/teacher/CreateQuizPage";
import QuizViewPage from "./pages/teacher/QuizViewPage";
import TeacherAssignQuizPage from "./pages/teacher/TeacherAssignQuizPage";
import StudentQuizPage from "./pages/student/StudentQuizPage";
import StudentQuizReviewPage from "./pages/student/StudentQuizReviewPage";
import TeacherReviewPage from "./pages/teacher/TeacherReviewPage";
import CreateLessonPage from "./pages/teacher/CreateLessonPage";
import EditLessonPage from "./pages/teacher/EditLessonPage";
import TeacherLessonDetailPage from "./pages/teacher/LessonDetailPage";
import StudentLessonDetailPage from "./pages/student/LessonDetailPage";
import SettingsPage from "./pages/global/SettingsPage";
import TeacherGroupsPage from "./pages/teacher/groups/TeacherGroupsPage";
import TeacherGroupDetailsPage from "./pages/teacher/groups/TeacherGroupDetailsPage";
import StudentAttendancePage from "./pages/teacher/groups/StudentAttendancePage";
import StudentGradesPage from "./pages/teacher/groups/StudentGradesPage";
import GroupInviteAcceptPage from "./pages/global/GroupInviteAcceptPage";
import EmailVerificationPage from "./pages/global/EmailVerificationPage";

const RequireRole = ({ role, children }) => {
  const { user, isAuthReady } = useContext(AuthContext);
  if (!isAuthReady) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== role) return <Navigate to="/" />;
  return children;
};

const AppRoutes = () => {
  const { user, isAuthReady } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-email" element={<EmailVerificationPage />} />

      {/* GŁÓWNA ŚCIEŻKA STUDENTA */}
      <Route
        path="/student"
        element={
          <RequireRole role="student">
            <StudentDashboard />
          </RequireRole>
        }
      />

      {/* ŚCIEŻKA PROFILU DLA STUDENTA */}
      <Route
        path="/student/profile"
        element={
          <RequireRole role="student">
            <ProfilePage />
          </RequireRole>
        }
      />

      {/* ŚCIEŻKA USTAWIEŃ DLA STUDENTA */}
      <Route
        path="/student/settings"
        element={
          <RequireRole role="student">
            <SettingsPage />
          </RequireRole>
        }
      />

      {/* ŚCIEŻKA PLANU ZAJĘĆ DLA STUDENTA */}
      <Route
        path="/student/schedule"
        element={
          <RequireRole role="student">
            <SchedulePage />
          </RequireRole>
        }
      />

      {/* ŚCIEŻKA SKANU KODU QR DLA STUDENTA */}
      <Route
        path="/student/scan-qr"
        element={
          <RequireRole role="student">
            <ScanQRPage />
          </RequireRole>
        }
      />

      {/* ŚCIEŻKA STATYSTYK DLA STUDENTA */}
      <Route
        path="/student/stats"
        element={
          <RequireRole role="student">
            <StatsPage />
          </RequireRole>
        }
      />

      <Route
        path="/student/activity"
        element={
          <RequireRole role="student">
            <StudentActivityPage />
          </RequireRole>
        }
      />

      <Route
        path="/student/groups"
        element={
          <RequireRole role="student">
            <StudentGroupsPage />
          </RequireRole>
        }
      />
      <Route
        path="/student/groups/:groupId/grades"
        element={
          <RequireRole role="student">
            <StudentGroupGradesPage />
          </RequireRole>
        }
      />

      {/* GŁÓWNA ŚCIEŻKA NAUCZYCIELA */}
      <Route
        path="/teacher"
        element={
          <RequireRole role="teacher">
            <TeacherDashboard />
          </RequireRole>
        }
      />

      {/* ŚCIEŻKA PROFILU DLA NAUCZYCIELA */}
      <Route
        path="/teacher/profile"
        element={
          <RequireRole role="teacher">
            <ProfilePage />
          </RequireRole>
        }
      />
      <Route
        path="/teacher/activity"
        element={
          <RequireRole role="teacher">
            <TeacherActivityPage />
          </RequireRole>
        }
      />

      {/* ŚCIEŻKA USTAWIEŃ DLA NAUCZYCIELA */}
      <Route
        path="/teacher/settings"
        element={
          <RequireRole role="teacher">
            <SettingsPage />
          </RequireRole>
        }
      />

      {/* ŚCIEŻKA PLANU ZAJĘĆ DLA NAUCZYCIELA */}
      <Route
        path="/teacher/schedule"
        element={
          <RequireRole role="teacher">
            <SchedulePage />
          </RequireRole>
        }
      />
      <Route
        path="/teacher/groups"
        element={
          <RequireRole role="teacher">
            <TeacherGroupsPage />
          </RequireRole>
        }
      />
      <Route
        path="/teacher/groups/:groupId"
        element={
          <RequireRole role="teacher">
            <TeacherGroupDetailsPage />
          </RequireRole>
        }
      />
      <Route
        path="/teacher/groups/:groupId/students/:studentId/attendance"
        element={
          <RequireRole role="teacher">
            <StudentAttendancePage />
          </RequireRole>
        }
      />
      <Route
        path="/teacher/groups/:groupId/students/:studentId/grades"
        element={
          <RequireRole role="teacher">
            <StudentGradesPage />
          </RequireRole>
        }
      />
      <Route
        path="/teacher/create-lesson"
        element={
          <RequireRole role="teacher">
            <CreateLessonPage />
          </RequireRole>
        }
      />
      <Route
        path="/teacher/lesson/:id"
        element={
          <RequireRole role="teacher">
            <TeacherLessonDetailPage />
          </RequireRole>
        }
      />
      <Route
        path="/teacher/edit-lesson/:id"
        element={
          <RequireRole role="teacher">
            <EditLessonPage />
          </RequireRole>
        }
      />
      <Route
        path="/student/lesson/:id"
        element={
          <RequireRole role="student">
            <StudentLessonDetailPage />
          </RequireRole>
        }
      />

      {/* ŚCIEŻKA STATYSTYK DLA NAUCZYCIELA */}
      <Route
        path="/teacher/stats"
        element={
          <RequireRole role="teacher">
            <TeacherStatsPage />
          </RequireRole>
        }
      />
      {/*Lista obecnosci*/}
      <Route
        path="/teacher/attendance/:sessionId"
        element={
          <RequireRole role="teacher">
            <AttendanceListPage />
          </RequireRole>
        }
      />

      {/* GŁÓWNA ŚCIEŻKA PRZEKIEROWUJĄCA */}
      <Route
        path="/"
        element={
          !isAuthReady ? null : user ? (
            <Navigate to={user.role === "student" ? "/student" : "/teacher"} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* ŚCIEŻKA TWORZENIA SESJI */}
      <Route
        path="/teacher/create-session"
        element={
          <RequireRole role="teacher">
            <CreateSessionPage />
          </RequireRole>
        }
      />

      {/* ŚCIEŻKI QUIZÓW */}
      <Route
        path="/teacher/quizzes"
        element={
          <RequireRole role="teacher">
            <QuizzesPage />
          </RequireRole>
        }
      />
      <Route
        path="/teacher/create-quiz"
        element={
          <RequireRole role="teacher">
            <CreateQuizPage />
          </RequireRole>
        }
      />
      <Route
        path="/teacher/quiz/:quizId"
        element={
          <RequireRole role="teacher">
            <QuizViewPage />
          </RequireRole>
        }
      />
      <Route
        path="/teacher/assign-quiz/:scheduleId"
        element={
          <RequireRole role="teacher">
            <TeacherAssignQuizPage />
          </RequireRole>
        }
      />
      <Route
        path="/student/quiz/:assignmentId"
        element={
          <RequireRole role="student">
            <StudentQuizPage />
          </RequireRole>
        }
      />
      <Route
        path="/student/quiz-review/:assignmentId"
        element={
          <RequireRole role="student">
            <StudentQuizReviewPage />
          </RequireRole>
        }
      />
      <Route
        path="/teacher/review/:submissionId"
        element={
          <RequireRole role="teacher">
            <TeacherReviewPage />
          </RequireRole>
        }
      />
    </Routes>
  );
};

const AuthenticatedApp = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

const App = () => (
  <ThemeProvider>
    <Routes>
      <Route path="/invite/group" element={<GroupInviteAcceptPage />} />
      <Route path="/*" element={<AuthenticatedApp />} />
    </Routes>
  </ThemeProvider>
);

export default App;
