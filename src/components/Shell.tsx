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
import { getHardwareStatus, enableDemoMode, disableDemoMode, setDemoScenario } from "../api";

const DEMO_SCENARIOS = [
  { id: "normal", label: "Normal air" },
  { id: "steam", label: "Kitchen steam" },
  { id: "cooking", label: "Cooking" },
  { id: "gas_leak", label: "Gas leak" },
  { id: "adc_saturation", label: "Sensor overflow" },
  { id: "sensor_fault", label: "Sensor fault" },
];

export default function Shell() {
  const [hwStatus, setHwStatus] = useState<{
    hardwareConnected: boolean;
    port: string | null;
    sensorSuite: string;
    baudRate: number;
    watchdogStatus: string;
    demoActive?: boolean;
    scenario?: string;
    realDeviceActive?: boolean;
    demoNotice?: string | null;
  }>({
    hardwareConnected: false,
    port: null,
    sensorSuite: "MQ2 (A0) + DHT11 (D2)",
    baudRate: 9600,
    watchdogStatus: "Scanning...",
    demoActive: false,
    scenario: "normal",
    realDeviceActive: false,
    demoNotice: null
  });

  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = () => {
      getHardwareStatus().then((status) => {
        setHwStatus(status);
        if (status.demoNotice) {
          setNoticeMessage(status.demoNotice);
        }
      });
    };

    fetchStatus();
    const id = setInterval(fetchStatus, 2000);
    return () => clearInterval(id);
  }, []);

  const isRealActive = Boolean(hwStatus.realDeviceActive || hwStatus.hardwareConnected);
  const isDemoActive = Boolean(hwStatus.demoActive);

  const handleToggleDemo = async () => {
    if (isDemoActive) {
      await disableDemoMode();
    } else {
      if (isRealActive) return;
      try {
        await enableDemoMode();
      } catch (err: any) {
        setNoticeMessage(err.message || "Real device connected");
      }
    }
    const updated = await getHardwareStatus();
    setHwStatus(updated);
  };

  const handleScenarioChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sc = e.target.value;
    await setDemoScenario(sc);
    const updated = await getHardwareStatus();
    setHwStatus(updated);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F5F7] text-[#1E293B]">
      
      {/* Top Application Header */}
      <header className="sticky top-0 z-30 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Notice alert when real device pre-empts demo mode */}
        {noticeMessage && (
          <div className="bg-[#FEF3C7] border-b border-[#FDE68A] text-[#92400E] px-4 py-2 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
              <span>{noticeMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setNoticeMessage(null)}
              className="text-xs font-bold text-[#92400E] hover:underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between min-h-18 py-2 gap-3">
            
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

            {/* Header Right Controls: Demo Toggle & Navigation */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Demo readings toggle switch & badge & dropdown */}
              <div className="flex items-center space-x-2 bg-[#FAFBFD] border border-[#E2E8F0] px-3 py-1.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                {/* Visible DEMO READINGS badge when ON */}
                {isDemoActive && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] mr-1.5"></span>
                    DEMO READINGS
                  </span>
                )}

                {/* Scenario dropdown when ON */}
                {isDemoActive && (
                  <select
                    value={hwStatus.scenario || "normal"}
                    onChange={handleScenarioChange}
                    className="text-xs bg-[#FFFFFF] border border-[#CBD5E1] text-[#0F172A] font-semibold rounded-lg px-2 py-0.5 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#0E7054] cursor-pointer"
                  >
                    {DEMO_SCENARIOS.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.label}
                      </option>
                    ))}
                  </select>
                )}

                {/* Demo readings toggle switch */}
                <div 
                  className="flex items-center space-x-2"
                  title={isRealActive ? "Real device connected" : "Toggle synthetic demo readings streaming"}
                >
                  <span className={`text-xs font-semibold select-none ${isRealActive ? "text-[#94A3B8]" : "text-[#334155]"}`}>
                    Demo readings
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isDemoActive}
                    disabled={isRealActive}
                    onClick={handleToggleDemo}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isRealActive
                        ? "bg-[#CBD5E1] cursor-not-allowed opacity-50"
                        : isDemoActive
                        ? "bg-[#0E7054]"
                        : "bg-[#CBD5E1] hover:bg-[#94A3B8]"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isDemoActive ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
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
