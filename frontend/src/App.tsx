import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { JobSearchPage } from './pages/JobSearchPage';
import { JobDetailsPage } from './pages/JobDetailsPage';
import { SavedJobsPage } from './pages/SavedJobsPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ApplicationDetailsPage } from './pages/ApplicationDetailsPage';
import { ResumePage } from './pages/ResumePage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="jobs" element={<JobSearchPage />} />
            <Route path="jobs/:id" element={<JobDetailsPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="saved-jobs"
              element={
                <ProtectedRoute>
                  <SavedJobsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="applications"
              element={
                <ProtectedRoute>
                  <ApplicationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="applications/:id"
              element={
                <ProtectedRoute>
                  <ApplicationDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="resume"
              element={
                <ProtectedRoute>
                  <ResumePage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
