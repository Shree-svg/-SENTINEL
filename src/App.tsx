// src/App.tsx
// Main application router connecting all SENTINEL dashboard views

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Shell from "./components/Shell";
import LiveStatusPanel from "./components/LiveStatusPanel";
import AlertHistoryList from "./components/AlertHistoryList";
import CaregiverView from "./components/CaregiverView";
import AdminCalibrationView from "./components/AdminCalibrationView";
import NotificationSettingsView from "./components/NotificationSettingsView";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shell />}>
          <Route index element={<Navigate to="/monitor" replace />} />
          <Route path="monitor" element={<LiveStatusPanel />} />
          <Route path="alerts" element={<AlertHistoryList />} />
          <Route path="caregiver" element={<CaregiverView />} />
          <Route path="admin" element={<AdminCalibrationView />} />
          <Route path="settings" element={<NotificationSettingsView />} />
          <Route path="*" element={<Navigate to="/monitor" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
