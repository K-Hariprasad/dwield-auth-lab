import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FeatureFlagsProvider } from './context/FeatureFlagsContext.jsx';
import { ProtectedRoute } from './components/common/ProtectedRoute.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { Header } from './components/layout/Header.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';

import { OverviewPage } from './pages/OverviewPage.jsx';
import { DeviceSignalsPage } from './pages/DeviceSignalsPage.jsx';
import { RiskAssessmentPage } from './pages/RiskAssessmentPage.jsx';
import { PasskeyEnrollmentPage } from './pages/PasskeyEnrollmentPage.jsx';
import { PasskeyAuthenticationPage } from './pages/PasskeyAuthenticationPage.jsx';
import { AdaptiveAuthenticationPage } from './pages/AdaptiveAuthenticationPage.jsx';
import { SpeechBiometricsPage } from './pages/SpeechBiometricsPage.jsx';
import { CredentialsPage } from './pages/CredentialsPage.jsx';
import { TestScenariosPage } from './pages/TestScenariosPage.jsx';
import { ActivityLogsPage } from './pages/ActivityLogsPage.jsx';
import { ConfigurationPage } from './pages/ConfigurationPage.jsx';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <FeatureFlagsProvider>
      <BrowserRouter>
        <div className="app-container">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="main-content">
            <Header onMenuClick={() => setSidebarOpen((prev) => !prev)} />
            <main className="workspace">
              <ErrorBoundary>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute featureKey="overview" title="Overview Dashboard Disabled">
                        <OverviewPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/signals"
                    element={
                      <ProtectedRoute featureKey="signals" title="Device Signals Module Disabled">
                        <DeviceSignalsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/risk"
                    element={
                      <ProtectedRoute featureKey="risk" title="Risk Assessment Module Disabled">
                        <RiskAssessmentPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/enrollment"
                    element={
                      <ProtectedRoute featureKey="enrollment" title="Passkey Enrollment Module Disabled">
                        <PasskeyEnrollmentPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/authentication"
                    element={
                      <ProtectedRoute featureKey="authentication" title="Passkey Authentication Module Disabled">
                        <PasskeyAuthenticationPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/adaptive"
                    element={
                      <ProtectedRoute featureKey="adaptive" title="Adaptive Auth Workflow Disabled">
                        <AdaptiveAuthenticationPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/speech"
                    element={
                      <ProtectedRoute featureKey="speech" title="Speech & Biometrics Module Disabled">
                        <SpeechBiometricsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/credentials"
                    element={
                      <ProtectedRoute featureKey="credentials" title="Credentials Module Disabled">
                        <CredentialsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/scenarios"
                    element={
                      <ProtectedRoute featureKey="scenarios" title="Test Scenarios Module Disabled">
                        <TestScenariosPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/logs"
                    element={
                      <ProtectedRoute featureKey="logs" title="Activity Logs Module Disabled">
                        <ActivityLogsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/configuration"
                    element={
                      <ProtectedRoute featureKey="configuration" title="Configuration Module Disabled">
                        <ConfigurationPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </ErrorBoundary>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </FeatureFlagsProvider>
  );
}
