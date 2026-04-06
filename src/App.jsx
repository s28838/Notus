// src/App.jsx

import { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import LoginPage from "./pages/global/LoginPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
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
        element={<AttendanceListPage />}
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

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </ThemeProvider>
);

export default App;
