/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import LoginPage from "./pages/LoginPage";
import StudentDashboardPage from "./pages/StudentDashboardPage";
import SmartCorrectionLab from "./pages/correction/SmartCorrectionLab";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherImageCorrectionPage from "./pages/teacher/TeacherImageCorrectionPage";
import TeacherBatchCorrectionPage from "./pages/correction/TeacherBatchCorrectionPage";
import PlagiarismDashboard from "./pages/plagiarism/PlagiarismDashboard";
import TeacherAnalyticsDashboard from "./pages/analytics/TeacherAnalyticsDashboard";
import PedagogicalReportsPage from "./pages/reports/PedagogicalReportsPage";
import SettingsPage from "./pages/settings/SettingsPage";

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "ALUNO")
    return <Navigate to="/student/dashboard" replace />;
  if (user.role === "PROFESSOR")
    return <Navigate to="/teacher/dashboard" replace />;
  if (user.role === "ADMIN")
    return <Navigate to="/admin/dashboard" replace />;

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardRouter />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["ALUNO"]} />}>
              <Route
                path="/student/dashboard"
                element={<StudentDashboardPage />}
              />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>

            <Route
              element={<ProtectedRoute allowedRoles={["PROFESSOR", "ADMIN"]} />}
            >
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route
                path="/teacher/quick-correction"
                element={<SmartCorrectionLab />}
              />
              <Route
                path="/teacher/image-correction"
                element={<TeacherImageCorrectionPage />}
              />
              <Route
                path="/teacher/batch-correction"
                element={<TeacherBatchCorrectionPage />}
              />
              <Route
                path="/teacher/reports"
                element={<PedagogicalReportsPage />}
              />
              <Route
                path="/teacher/similarity"
                element={<PlagiarismDashboard />}
              />
              <Route
                path="/teacher/analytics"
                element={<TeacherAnalyticsDashboard />}
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
