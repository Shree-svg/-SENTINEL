// src/components/CaregiverView.tsx
// Role-gated read-only caregiver dashboard (Product UI Styleguide)

import { useState, useEffect } from "react";
import LiveStatusPanel from "./LiveStatusPanel";
import AlertHistoryList from "./AlertHistoryList";
import { getCaregiverLinks, toggleCaregiverLink } from "../api";
import type { CaregiverLink } from "../types";
import { 
  HeartHandshake, 
  Phone, 
  MapPin, 
  UserCheck, 
  Lock, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Eye
} from "lucide-react";

export default function CaregiverView() {
  const [links, setLinks] = useState<CaregiverLink[]>([]);
  const [activeTab, setActiveTab] = useState<"live" | "alerts" | "resident">("live");

  useEffect(() => {
    getCaregiverLinks().then(setLinks);
  }, []);

  const handleToggleLink = async (linkId: string, currentActive: boolean) => {
    await toggleCaregiverLink(linkId, !currentActive);
    setLinks((prev) =>
      prev.map((l) => (l._id === linkId ? { ...l, active: !currentActive } : l))
    );
  };

  const primaryLink = links[0] || {
    _id: "cg-01",
    residentName: "Shreedhar Sharma",
    residentAddress: "Residential Node 01",
    caregiverName: "Shreedhar Sharma",
    caregiverPhone: "+91 ••••• •••••",
    relationship: "Primary Caregiver",
    active: true,
    linkedAt: "2026-08-15T10:00:00.000Z"
  };

  return (
    <div className="space-y-6">
      
      {/* Caregiver Profile Header Card (Elevated Clay Styleguide Card) */}
      <div className="elevation-2 p-6 sm:p-7 rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          
          <div className="flex items-start space-x-4">
            <div className="p-3.5 rounded-2xl bg-[#E8FAF4] border border-[#A8EBD9] text-[#0E7054] flex-shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0E7054]">
                  Remote Caregiver Portal
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold alert-pill-success">
                  <Lock className="w-2.5 h-2.5 mr-1" />
                  Read-Only Access
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] mt-1">
                Monitoring: {primaryLink.residentName}
              </h2>
              <p className="text-xs text-[#64748B] flex items-center mt-1 space-x-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>{primaryLink.residentAddress}</span>
              </p>
            </div>
          </div>

          {/* Quick Emergency Call Button */}
          <div className="flex items-center space-x-3 self-start md:self-auto">
            <a
              href="tel:112"
              className="px-4 py-2.5 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-[#FFFFFF] text-xs font-bold flex items-center space-x-1.5 transition shadow-[0_2px_8px_rgba(239,68,68,0.25)]"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Emergency Services (112)</span>
            </a>

            <div className="recessed-inset px-4 py-2 rounded-2xl text-right text-xs hidden sm:block">
              <div className="text-[10px] text-[#64748B] font-semibold">Relationship</div>
              <div className="text-[#0F172A] font-bold">{primaryLink.relationship}</div>
            </div>
          </div>

        </div>
      </div>

      {/* Recessed Sub-Tab Navigation */}
      <div className="recessed-inset p-1.5 rounded-full inline-flex items-center space-x-1">
        <button
          onClick={() => setActiveTab("live")}
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center space-x-2 transition ${
            activeTab === "live"
              ? "bg-[#FFFFFF] text-[#0F172A] shadow-sm border border-[#E2E8F0]"
              : "text-[#64748B] hover:text-[#1E293B]"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Real-time Environment</span>
        </button>

        <button
          onClick={() => setActiveTab("alerts")}
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center space-x-2 transition ${
            activeTab === "alerts"
              ? "bg-[#FFFFFF] text-[#0F172A] shadow-sm border border-[#E2E8F0]"
              : "text-[#64748B] hover:text-[#1E293B]"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Event History</span>
        </button>

        <button
          onClick={() => setActiveTab("resident")}
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center space-x-2 transition ${
            activeTab === "resident"
              ? "bg-[#FFFFFF] text-[#0F172A] shadow-sm border border-[#E2E8F0]"
              : "text-[#64748B] hover:text-[#1E293B]"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Permissions (SRS §5.5)</span>
        </button>
      </div>

      {/* Sub-Tab 1: Live Status */}
      {activeTab === "live" && (
        <div className="space-y-4">
          <div className="elevation-1 px-4 py-2.5 rounded-2xl text-xs text-[#64748B] flex items-center justify-between">
            <span className="flex items-center font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#0E7054] mr-2" />
              Viewing live telemetry stream from sensor node `mq2-dht11-vit-01`.
            </span>
            <span className="font-mono text-[11px] text-[#94A3B8]">Interval: 2.0s</span>
          </div>

          <LiveStatusPanel />
        </div>
      )}

      {/* Sub-Tab 2: Alert History */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          <div className="elevation-1 px-4 py-2.5 rounded-2xl text-xs text-[#64748B] flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 text-[#0E7054]" />
            <span>
              All write operations and direct alert acknowledgments are disabled in Caregiver mode.
            </span>
          </div>

          <AlertHistoryList readOnly={true} />
        </div>
      )}

      {/* Sub-Tab 3: Caregiver Permissions */}
      {activeTab === "resident" && (
        <div className="elevation-2 p-6 sm:p-8 rounded-3xl space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-[#0F172A]">Resident Link Protocol (SRS §5.5)</h3>
            <p className="text-xs text-[#64748B] mt-1">
              Caregiver access requires explicit resident-initiated linking and can be revoked at any time.
            </p>
          </div>

          <div className="space-y-3">
            {links.map((link) => (
              <div
                key={link._id}
                className="recessed-inset p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-[#0F172A]">{link.caregiverName}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      link.active ? "alert-pill-success" : "alert-pill-warning"
                    }`}>
                      {link.active ? "AUTHORIZED & ACTIVE" : "REVOKED / INACTIVE"}
                    </span>
                  </div>
                  <div className="text-xs text-[#64748B] mt-1">
                    Phone: {link.caregiverPhone} • Relationship: {link.relationship}
                  </div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5">
                    Granted: {new Date(link.linkedAt).toLocaleDateString()}
                  </div>
                </div>

                <button
                  onClick={() => handleToggleLink(link._id, link.active)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                    link.active
                      ? "btn-secondary-clay text-[#B91C1C]"
                      : "btn-primary-mint"
                  }`}
                >
                  {link.active ? "Revoke Access" : "Authorize Access"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
