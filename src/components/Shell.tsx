// src/components/Shell.tsx
// Redesigned with Product UI Styleguide: Clean tactile clay/porcelain surfaces & mint accents

import { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { 
  ShieldAlert, 
  Activity, 
  History, 
  HeartHandshake, 
  Sliders, 
  Bell,
  AlertTriangle,
  Usb,
  Cpu
} from "lucide-react";
import { getHardwareStatus } from "../api";

export default function Shell() {
  const [hwStatus, setHwStatus] = useState<{
    hardwareConnected: boolean;
    port: string | null;
    sensorSuite: string;
    baudRate: number;
    watchdogStatus: string;
  }>({
    hardwareConnected: false,
    port: null,
    sensorSuite: "MQ2 (A0) + DHT11 (D2)",
    baudRate: 115200,
    watchdogStatus: "Scanning..."
  });

  useEffect(() => {
    getHardwareStatus().then(setHwStatus);
    const id = setInterval(() => {
      getHardwareStatus().then(setHwStatus);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F5F7] text-[#1E293B]">
      
      {/* Top Application Header */}
      <header className="sticky top-0 z-30 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-2">
            
            {/* Brand Logo & Telemetry Status */}
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#E8FAF4] border border-[#A8EBD9] flex items-center justify-center shadow-[0_2px_8px_rgba(16,185,129,0.12)]">
                <ShieldAlert className="w-5 h-5 text-[#0E7054]" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="font-extrabold text-lg tracking-tight text-[#0F172A]">SENTINEL</span>
                  
                  {hwStatus.hardwareConnected ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold alert-pill-success">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5 animate-pulse"></span>
                      Connected ({hwStatus.port || "USB"})
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold alert-pill-warning">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mr-1.5 animate-ping"></span>
                      Scanning USB Ports...
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#64748B] font-medium hidden sm:block">
                  Dual-Tier Cyber-Physical Cross-Sensitivity Compensation
                </p>
              </div>
            </div>

            {/* Tactile Segmented Pill Tab Navigation (per Styleguide) */}
            <nav className="recessed-inset p-1 rounded-full flex items-center space-x-1">
              <NavLink
                to="/monitor"
                className={({ isActive }) =>
                  `flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#FFFFFF] text-[#0F172A] shadow-[0_2px_6px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] border border-[#E2E8F0]"
                      : "text-[#64748B] hover:text-[#1E293B]"
                  }`
                }
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Monitor</span>
              </NavLink>

              <NavLink
                to="/alerts"
                className={({ isActive }) =>
                  `flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#FFFFFF] text-[#0F172A] shadow-[0_2px_6px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] border border-[#E2E8F0]"
                      : "text-[#64748B] hover:text-[#1E293B]"
                  }`
                }
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Alerts</span>
              </NavLink>

              <NavLink
                to="/caregiver"
                className={({ isActive }) =>
                  `flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#FFFFFF] text-[#0F172A] shadow-[0_2px_6px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] border border-[#E2E8F0]"
                      : "text-[#64748B] hover:text-[#1E293B]"
                  }`
                }
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Caregiver</span>
              </NavLink>

              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#FFFFFF] text-[#0F172A] shadow-[0_2px_6px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] border border-[#E2E8F0]"
                      : "text-[#64748B] hover:text-[#1E293B]"
                  }`
                }
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Calibration</span>
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#FFFFFF] text-[#0F172A] shadow-[0_2px_6px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] border border-[#E2E8F0]"
                      : "text-[#64748B] hover:text-[#1E293B]"
                  }`
                }
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Notifications</span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Minimalist Sub-Status Bar */}
        <div className="bg-[#FAFBFD] border-t border-[#EDF0F4] px-4 py-1.5 text-xs text-[#64748B]">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Usb className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="text-[11px] font-medium">
                {hwStatus.hardwareConnected ? (
                  <span className="text-[#0E7054] font-mono font-semibold">Active Port: {hwStatus.port} (115200 baud)</span>
                ) : (
                  <span className="text-[#92400E]">Auto-Reconnect Watchdog: Searching for Arduino Nano...</span>
                )}
              </span>
            </div>

            <div className="text-[11px] text-[#94A3B8] font-mono flex items-center space-x-2">
              <Cpu className="w-3 h-3 text-[#94A3B8]" />
              <span>Sensors: MQ2 (A0) • DHT11 (D2) • Alarm (D8)</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Tactile Safety Disclaimer Banner (Rules §1.3) */}
      <footer className="bg-[#FFFFFF] border-t border-[#E5E7EB] py-3.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2 text-xs text-[#64748B]">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
          <span className="font-medium">
            SAFETY COMPLIANCE NOTICE: This system supplements, not replaces, certified gas-safety practice and local alarm compliance.
          </span>
        </div>
      </footer>
    </div>
  );
}
