import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider as OidcAuthProvider } from 'react-oidc-context';
import { oidcConfig } from './config/oidc';
import AuthProvider from './context/AuthProvider';
import { AnalysisProvider } from './context/AnalysisContext';
import { NotificationProvider } from './context/NotificationContext';

import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import { InfoPage } from './pages/InfoPage';
import AdminDashboard from './pages/AdminDashboard';
import ResetPassword1 from './components/auth/ResetPassword1';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SsoStartPage from './pages/auth/SsoStartPage';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';

export default function App() {
  return (
    <BrowserRouter>
      <OidcAuthProvider {...oidcConfig}>
        <AuthProvider>
          <NotificationProvider>
            <AnalysisProvider>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/sso/start" element={<SsoStartPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/information" element={<InfoPage />} />
                <Route path="/forgot-password" element={<ResetPassword1 />} />

                {/* Protected Routes: Pengguna Aplikasi FlowGIS */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'analyst', 'user']} />}>
                  <Route path="/map" element={<Dashboard />} />
                </Route>

                {/* Protected Routes: Khusus Admin */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>
              </Routes>
            </AnalysisProvider>
          </NotificationProvider>
        </AuthProvider>
      </OidcAuthProvider>
    </BrowserRouter>
  );
}