import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AnalysisProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            {/* <Route path="/map" element={<Dashboard />} /> */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/information" element={<InfoPage />}></Route>
            <Route path="/forgot-password" element={<ResetPassword1 />}></Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'analyst', 'user']} />}>
              <Route path="/map" element={<Dashboard />} />
            </Route>
            {/* <Route path="/admin" element={<AdminDashboard />} /> */}
            {/* Protected Routes: Khusus Admin */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </AnalysisProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}