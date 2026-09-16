// src/services/notificationService.ts
// Handles browser web notifications and synthesized alarm buzzer audio (REQ-ALT-1, REQ-ALT-2, REQ-ALT-3)

import type { NotificationSettings } from "../types";

const STORAGE_KEY = "sentinel_notification_settings_v1";

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  browserNotificationsEnabled: true,
  soundAlertsEnabled: true,
  soundVolume: 80,
  escalationIntervalSeconds: 60, // REQ-ALT-3: repeat every 60s
  emailEscalationEnabled: true,
  smsEscalationEnabled: true,
  caregiverPushEnabled: true,
  suppressInterferenceAlerts: true, // REQ-ALT-2: suppress network alerts for steam/cooking
  dndEnabled: false,
  dndStartTime: "22:00",
  dndEndTime: "07:00",
  dndBypassForGenuineLeak: true // Non-negotiable safety rule
};

export function loadNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to persist notification settings", e);
  }
}

/**
 * Synthesize hardware buzzer audio via Web Audio API
 */
class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Play an emergency pulsed alarm buzzer tone (2800 Hz alarm pattern)
   */
  public playAlarmBuzzer(volumePct: number = 80, pulses: number = 3): void {
    try {
      const ctx = this.getContext();
      const gainNode = ctx.createGain();
      const masterVol = Math.max(0, Math.min(1, volumePct / 100)) * 0.3; // safe ear-level cap
      gainNode.gain.setValueAtTime(masterVol, ctx.currentTime);
      gainNode.connect(ctx.destination);

      for (let i = 0; i < pulses; i++) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(2800, ctx.currentTime + i * 0.2); // 2.8kHz piezo buzzer frequency
        osc.connect(gainNode);

        const startTime = ctx.currentTime + i * 0.2;
        const stopTime = startTime + 0.12;

        osc.start(startTime);
        osc.stop(stopTime);
      }
    } catch (e) {
      console.warn("Web Audio API not allowed without user interaction yet", e);
    }
  }

  /**
   * Play a mild notification chime for info updates
   */
  public playChime(volumePct: number = 80): void {
    try {
      const ctx = this.getContext();
      const gainNode = ctx.createGain();
      const masterVol = Math.max(0, Math.min(1, volumePct / 100)) * 0.2;
      gainNode.gain.setValueAtTime(masterVol, ctx.currentTime);
      gainNode.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
      osc.connect(gainNode);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Web Audio chime failed", e);
    }
  }
}

export const soundSynthesizer = new SoundSynthesizer();

/**
 * Check or request browser Web Notifications API permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") {
    return "granted";
  }
  return await Notification.requestPermission();
}

/**
 * Dispatch an emergency browser push notification
 */
export function dispatchWebNotification(
  title: string,
  options: {
    body: string;
    tag?: string;
    icon?: string;
    requireInteraction?: boolean;
  }
): boolean {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return false;
  }

  try {
    new Notification(title, {
      body: options.body,
      tag: options.tag || "sentinel-alert",
      requireInteraction: options.requireInteraction ?? true
    });
    return true;
  } catch (e) {
    console.warn("Notification constructor failed", e);
    return false;
  }
}
