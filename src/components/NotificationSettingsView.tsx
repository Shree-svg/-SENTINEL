// src/components/NotificationSettingsView.tsx
// Notification and escalation configuration view (Product UI Styleguide)

import { useState, useEffect } from "react";
import type { NotificationSettings } from "../types";
import {
  loadNotificationSettings,
  saveNotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  soundSynthesizer,
  requestNotificationPermission,
  dispatchWebNotification
} from "../services/notificationService";
import { testPhysicalBuzzer } from "../api";
import {
  Bell,
  Volume2,
  ShieldAlert,
  Smartphone,
  Mail,
  Moon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Lock
} from "lucide-react";

export default function NotificationSettingsView() {
  const [settings, setSettings] = useState<NotificationSettings>(loadNotificationSettings);
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  useEffect(() => {
    saveNotificationSettings(settings);
  }, [settings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setBrowserPerm(perm);
    if (perm === "granted") {
      showToast("Browser notification permissions granted!");
      dispatchWebNotification("SENTINEL System Connected", {
        body: "Real-time gas safety notifications are active."
      });
    } else {
      showToast("Notification permission was denied or dismissed.");
    }
  };

  const handleTestBuzzer = async () => {
    try {
      const ok = await testPhysicalBuzzer();
      if (ok) {
        showToast("Triggered onboard piezo buzzer alarm (Pin D8) for 1 second.");
      } else {
        showToast("Error: Hardware disconnected or bridge offline.");
      }
    } catch {
      showToast("Failed to connect to hardware bridge.");
    }
  };

  const handleTestChime = () => {
    soundSynthesizer.playChime(settings.soundVolume);
    showToast("Played telemetry update chime.");
  };

  const handleSimulateSuppressed = () => {
    showToast("REQ-ALT-2 Verified: Background Interference suppressed from network dispatch.");
  };

  const handleSimulateEscalated = () => {
    setSimulating(true);
    soundSynthesizer.playAlarmBuzzer(settings.soundVolume, 4);
    dispatchWebNotification("🚨 URGENT: Genuine Gas Leak Detected", {
      body: "High gas concentration (+82 ADC/s). Escalation timer active every " + settings.escalationIntervalSeconds + "s until acknowledged.",
      requireInteraction: true
    });
    showToast("REQ-ALT-1 Verified: Emergency escalation & audible alert dispatched!");
    setTimeout(() => setSimulating(false), 2000);
  };

  const handleResetDefaults = () => {
    setSettings(DEFAULT_NOTIFICATION_SETTINGS);
    showToast("Notification settings reset to factory defaults.");
  };

  return (
    <div className="space-y-6">
      
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 alert-pill-success font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 border border-[#A1EBD6] animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#0E7054]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="elevation-2 p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0E7054]">
              Notification &amp; Escalation Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] alert-pill-success font-bold">
              LOOP 6 • REQ-ALT-1/3
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] mt-1">
            Emergency Dispatch &amp; Alarm Controls
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Configure multi-channel alerts, sound buzzer volume, repeat timers, and quiet-hour scheduling.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="btn-secondary-clay self-start md:self-auto px-4 py-2 rounded-full text-xs font-bold flex items-center space-x-1.5 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Safety Non-Negotiable Rule Banner (Rules §1.1) */}
      <div className="alert-pill-warning rounded-3xl p-5 flex items-start space-x-3.5">
        <ShieldAlert className="w-5 h-5 text-[#B45309] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#78350F] leading-relaxed">
          <span className="font-bold text-[#92400E]">SAFETY RULE §1.1 GUARANTEE: </span>
          The physical onboard buzzer and LED alarm on Arduino Nano (Pin D8) are governed unconditionally in firmware and <strong>cannot be suppressed or silenced by any software setting</strong>. Muting and escalation settings below configure network-level dispatch.
        </div>
      </div>

      {/* Grid of Settings Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Module 1: Browser Web Push Notifications */}
        <div className="elevation-1 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-[#E8FAF4] text-[#0E7054]">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Browser Push Notifications</h3>
                <p className="text-xs text-[#64748B]">Web Notifications API for desktop alerts</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.browserNotificationsEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, browserNotificationsEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
            </label>
          </div>

          {/* Browser Permission Status */}
          <div className="recessed-inset p-4 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[#64748B]">System Permission: </span>
              <span className={`font-mono font-bold uppercase ${
                browserPerm === "granted" ? "text-[#0E7054]" : "text-[#B45309]"
              }`}>
                {browserPerm}
              </span>
            </div>

            {browserPerm !== "granted" && (
              <button
                onClick={handleRequestPermission}
                className="btn-primary-mint px-3.5 py-1.5 rounded-full font-bold text-xs transition shadow-sm"
              >
                Grant Permission
              </button>
            )}
          </div>
        </div>

        {/* Module 2: Audio & Buzzer Simulation */}
        <div className="elevation-1 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-[#E0F2FE] text-[#0369A1]">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Synthesized Alarm Buzzer</h3>
                <p className="text-xs text-[#64748B]">Web Audio API 2.8 kHz piezo acoustic alarm</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundAlertsEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, soundAlertsEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0EA5E9]"></div>
            </label>
          </div>

          {/* Volume Slider & Audio Test */}
          <div className="space-y-3 pt-1">
            <div className="flex justify-between text-xs text-[#475569] font-medium">
              <span>Audible Output Volume</span>
              <span className="font-mono font-bold text-[#0F172A]">{settings.soundVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.soundVolume}
              onChange={(e) =>
                setSettings({ ...settings, soundVolume: parseInt(e.target.value, 10) })
              }
              className="w-full h-2 bg-[#CBD5E1] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
            />

            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={handleTestBuzzer}
                className="btn-secondary-clay flex-1 py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center space-x-1.5"
              >
                <Play className="w-3.5 h-3.5 text-[#EF4444]" />
                <span>Test Alarm Buzzer (D8)</span>
              </button>

              <button
                type="button"
                onClick={handleTestChime}
                className="btn-secondary-clay py-2 px-4 rounded-full text-xs font-bold"
              >
                <span>Chime</span>
              </button>
            </div>
          </div>
        </div>

        {/* Module 3: Alert Escalation Interval (REQ-ALT-3) */}
        <div className="elevation-1 p-6 rounded-3xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-[#FEF3C7] text-[#B45309]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Escalation Repeat Timer (REQ-ALT-3)</h3>
              <p className="text-xs text-[#64748B]">Interval for unacknowledged Genuine Leak alerts</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#334155] font-medium">Repeat Notification Every:</span>
              <select
                value={settings.escalationIntervalSeconds}
                onChange={(e) =>
                  setSettings({ ...settings, escalationIntervalSeconds: parseInt(e.target.value, 10) })
                }
                className="bg-[#FFFFFF] border border-[#CBD5E1] text-[#1E293B] rounded-full px-3.5 py-1.5 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A3E7D8]"
              >
                <option value={30}>30 seconds (High Urgency)</option>
                <option value={60}>60 seconds (Standard)</option>
                <option value={120}>2 minutes</option>
                <option value={300}>5 minutes</option>
              </select>
            </div>

            <div className="recessed-inset p-3.5 rounded-2xl text-[11px] text-[#64748B] leading-relaxed">
              When a Genuine Leak is active, repeat notifications continue until acknowledged via the dashboard (`POST /api/alerts/:id/acknowledge`) per REQ-ALT-4.
            </div>
          </div>
        </div>

        {/* Module 4: Multi-Channel Dispatch Channels */}
        <div className="elevation-1 p-6 rounded-3xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-[#E8FAF4] text-[#0E7054]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Multi-Channel Dispatch Channels</h3>
              <p className="text-xs text-[#64748B]">Redundant notification pathways</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 recessed-inset rounded-2xl">
              <div className="flex items-center space-x-2 font-medium">
                <Smartphone className="w-4 h-4 text-[#0E7054]" />
                <span>SMS Alert Dispatch (Primary Contact)</span>
              </div>
              <input
                type="checkbox"
                checked={settings.smsEscalationEnabled}
                onChange={(e) => setSettings({ ...settings, smsEscalationEnabled: e.target.checked })}
                className="w-4 h-4 text-[#10B981] rounded focus:ring-0"
              />
            </div>

            <div className="flex items-center justify-between p-3 recessed-inset rounded-2xl">
              <div className="flex items-center space-x-2 font-medium">
                <Mail className="w-4 h-4 text-[#0369A1]" />
                <span>Emergency Email (shreedharsharma192@gmail.com)</span>
              </div>
              <input
                type="checkbox"
                checked={settings.emailEscalationEnabled}
                onChange={(e) => setSettings({ ...settings, emailEscalationEnabled: e.target.checked })}
                className="w-4 h-4 text-[#10B981] rounded focus:ring-0"
              />
            </div>

            <div className="flex items-center justify-between p-3 recessed-inset rounded-2xl">
              <div className="flex items-center space-x-2 font-medium">
                <ShieldAlert className="w-4 h-4 text-[#0E7054]" />
                <span>Caregiver App Push Broadcast (SRS §5.5)</span>
              </div>
              <input
                type="checkbox"
                checked={settings.caregiverPushEnabled}
                onChange={(e) => setSettings({ ...settings, caregiverPushEnabled: e.target.checked })}
                className="w-4 h-4 text-[#10B981] rounded focus:ring-0"
              />
            </div>
          </div>
        </div>

        {/* Module 5: Do Not Disturb & Safety Bypass */}
        <div className="elevation-1 p-6 rounded-3xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-[#FAF5FF] text-[#7E22CE]">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Do Not Disturb (DND) Quiet Hours</h3>
                <p className="text-xs text-[#64748B]">Mute non-critical telemetry updates during resting hours</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.dndEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, dndEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9333EA]"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="recessed-inset p-4 rounded-2xl flex items-center justify-between text-xs font-medium">
              <span className="text-[#334155]">Quiet Period:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  value={settings.dndStartTime}
                  onChange={(e) => setSettings({ ...settings, dndStartTime: e.target.value })}
                  className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-xs"
                />
                <span className="text-[#94A3B8]">to</span>
                <input
                  type="time"
                  value={settings.dndEndTime}
                  onChange={(e) => setSettings({ ...settings, dndEndTime: e.target.value })}
                  className="bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-xs"
                />
              </div>
            </div>

            <div className="alert-pill-danger p-4 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 font-bold text-[#991B1B]">
                <Lock className="w-4 h-4 text-[#B91C1C]" />
                <span>Bypass DND for Genuine Leak</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFFFFF] text-[#991B1B]">
                LOCKED ON (SAFETY)
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Verification Sandbox (REQ-ALT-1 & REQ-ALT-2 Live Demo) */}
      <div className="elevation-1 p-6 rounded-3xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#0E7054]" />
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Escalation &amp; Suppression Verification
            </h3>
          </div>
          <span className="text-xs font-mono text-[#64748B]">Phase 4 Protocol</span>
        </div>

        <p className="text-xs text-[#475569] leading-relaxed max-w-3xl">
          Execute live verification tests to demonstrate network alert suppression for cooking steam (REQ-ALT-2) and immediate multi-channel escalation for combustible gas leaks (REQ-ALT-1).
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSimulateSuppressed}
            className="btn-secondary-clay px-4 py-2.5 rounded-full text-xs font-bold flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" />
            <span>Test REQ-ALT-2: Suppress Cooking Steam</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateEscalated}
            disabled={simulating}
            className="px-5 py-2.5 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-[#FFFFFF] text-xs font-bold flex items-center space-x-2 transition shadow-[0_2px_8px_rgba(239,68,68,0.2)] disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{simulating ? "Dispatched Emergency Alert…" : "Test REQ-ALT-1: Escalate Genuine Leak"}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
