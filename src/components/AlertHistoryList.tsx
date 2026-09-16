// src/components/AlertHistoryList.tsx
// Alert history list styled with Product UI Styleguide (Recessed Inset Filters, Tactile Pill Chips & Buttons)

import { useState, useEffect, useCallback } from "react";
import { getAlerts, acknowledgeAlert } from "../api";
import type { Alert } from "../types";
import ContributingFactors from "./ContributingFactors";
import { 
  Flame, 
  CloudFog, 
  CheckCircle2, 
  Filter, 
  Clock, 
  ChevronRight, 
  RefreshCw,
  AlertTriangle
} from "lucide-react";

interface Props {
  readOnly?: boolean;
}

export default function AlertHistoryList({ readOnly = false }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [ackLoadingId, setAckLoadingId] = useState<string | null>(null);

  const fetchAlertsData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAlerts({
        ...(filterStatus && { status: filterStatus }),
        ...(filterSeverity && { severity: filterSeverity })
      });
      setAlerts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load alert history");
    } finally {
      setLoading(false);
    }
  }, [filterSeverity, filterStatus]);

  useEffect(() => {
    fetchAlertsData();
  }, [fetchAlertsData]);

  const handleAcknowledge = async (id: string) => {
    setAckLoadingId(id);
    try {
      await acknowledgeAlert(id);
      setAlerts((prev) =>
        prev.map((a) =>
          a._id === id
            ? { ...a, status: "acknowledged", acknowledgedAt: new Date().toISOString() }
            : a
        )
      );
    } catch (e) {
      console.error("Failed to acknowledge alert", e);
    } finally {
      setAckLoadingId(null);
    }
  };

  const activeCount = alerts.filter((a) => a.status === "active").length;
  const suppressedCount = alerts.filter((a) => a.status === "suppressed").length;
  const acknowledgedCount = alerts.filter((a) => a.status === "acknowledged").length;

  return (
    <div className="space-y-6">
      
      {/* Error banner if fetch fails */}
      {error && (
        <div className="alert-pill-danger rounded-2xl p-4 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-[#B91C1C]" />
          <span>{error}</span>
        </div>
      )}

      {/* Header & Stats Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-[#0F172A]">
              Alert &amp; Classification History
            </h2>
            {readOnly && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold alert-pill-success">
                Caregiver Read-Only
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Chronological audit trail of physical sensor excitations, classifications, and safety overrides.
          </p>
        </div>

        <button
          onClick={fetchAlertsData}
          className="btn-secondary-clay self-start sm:self-auto px-4 py-2 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Summary metric chips (Elevated Styleguide Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="elevation-1 p-4 rounded-2xl">
          <span className="text-[11px] font-bold text-[#64748B] uppercase">Total Logged</span>
          <div className="text-2xl font-extrabold font-mono text-[#0F172A] mt-0.5">{alerts.length}</div>
        </div>
        <div className="elevation-1 p-4 rounded-2xl border-l-4 border-l-[#EF4444]">
          <span className="text-[11px] font-bold text-[#B91C1C] uppercase">Active Alerts</span>
          <div className="text-2xl font-extrabold font-mono text-[#B91C1C] mt-0.5">{activeCount}</div>
        </div>
        <div className="elevation-1 p-4 rounded-2xl border-l-4 border-l-[#F59E0B]">
          <span className="text-[11px] font-bold text-[#92400E] uppercase">Suppressed (Interference)</span>
          <div className="text-2xl font-extrabold font-mono text-[#92400E] mt-0.5">{suppressedCount}</div>
        </div>
        <div className="elevation-1 p-4 rounded-2xl border-l-4 border-l-[#10B981]">
          <span className="text-[11px] font-bold text-[#0E7054] uppercase">Acknowledged</span>
          <div className="text-2xl font-extrabold font-mono text-[#0E7054] mt-0.5">{acknowledgedCount}</div>
        </div>
      </div>

      {/* Recessed Inset Filter Bar (per Styleguide) */}
      <div className="recessed-inset p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5 text-xs text-[#64748B] font-bold px-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-[#FFFFFF] border border-[#CBD5E1] text-[#1E293B] text-xs font-medium rounded-full px-3.5 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A3E7D8]"
          >
            <option value="">All Severities</option>
            <option value="low">Low Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="high">High Severity (Urgent)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#FFFFFF] border border-[#CBD5E1] text-[#1E293B] text-xs font-medium rounded-full px-3.5 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A3E7D8]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Alerts</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="suppressed">Suppressed</option>
          </select>

          {(filterSeverity || filterStatus) && (
            <button
              onClick={() => {
                setFilterSeverity("");
                setFilterStatus("");
              }}
              className="text-xs text-[#0E7054] hover:underline font-semibold px-2"
            >
              Reset
            </button>
          )}
        </div>

        <div className="text-xs text-[#64748B] font-medium px-2">
          <span>{alerts.length}</span> recorded events
        </div>
      </div>

      {/* Elevated Table of Events */}
      <div className="elevation-1 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E2E8F0] text-left">
            <thead className="bg-[#FAFBFD] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-5">Classification &amp; Label</th>
                <th className="py-3.5 px-5">Confidence</th>
                <th className="py-3.5 px-5">Severity</th>
                <th className="py-3.5 px-5">Alert Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F3F6] text-xs text-[#334155]">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#64748B]">
                    <div className="max-w-sm mx-auto space-y-1">
                      <div className="font-semibold text-[#0F172A]">No alerts logged yet</div>
                      <p className="text-xs text-[#94A3B8]">
                        Real alerts captured from the connected hardware sensor node will appear here automatically.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => {
                  const isLeak = alert.classification.label === "Genuine Leak";
                  const isInterference = alert.classification.label === "Background Interference";
                  const isLowConf = alert.classification.confidence < 0.75;
                  const isAckLoading = ackLoadingId === alert._id;

                  return (
                    <tr
                      key={alert._id}
                      onClick={() => setSelectedAlert(alert)}
                      className="hover:bg-[#F8FAFC] cursor-pointer transition"
                    >
                      {/* Timestamp */}
                      <td className="py-4 px-5 font-mono text-[#64748B] whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span className="font-semibold text-[#0F172A]">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-[10px] text-[#94A3B8]">{new Date(alert.createdAt).toLocaleDateString()}</div>
                      </td>

                      {/* Classification Badge */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              isLeak
                                ? "alert-pill-danger"
                                : isInterference
                                ? "alert-pill-warning"
                                : "alert-pill-success"
                            }`}
                          >
                            {isLeak ? (
                              <Flame className="w-3.5 h-3.5 mr-1 text-[#B91C1C]" />
                            ) : isInterference ? (
                              <CloudFog className="w-3.5 h-3.5 mr-1 text-[#B45309]" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#0E7054]" />
                            )}
                            {alert.classification.label}
                          </span>

                          {isLowConf && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold alert-pill-danger font-mono">
                              LOW CONF
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Confidence Score */}
                      <td className="py-4 px-5 font-mono text-[#0F172A] whitespace-nowrap font-bold">
                        <div className="flex items-center space-x-2">
                          <div className="w-12 bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#10B981] rounded-full"
                              style={{ width: `${Math.round(alert.classification.confidence * 100)}%` }}
                            />
                          </div>
                          <span>{Math.round(alert.classification.confidence * 100)}%</span>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            alert.classification.severity === "high"
                              ? "alert-pill-danger"
                              : alert.classification.severity === "medium"
                              ? "alert-pill-warning"
                              : "alert-pill-success"
                          }`}
                        >
                          {alert.classification.severity}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="capitalize font-semibold text-[#475569]">
                          {alert.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          {alert.status === "active" && !readOnly && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcknowledge(alert._id);
                              }}
                              disabled={isAckLoading}
                              className="btn-primary-mint px-3.5 py-1 rounded-full text-xs font-semibold transition disabled:opacity-50"
                            >
                              {isAckLoading ? "..." : "Acknowledge"}
                            </button>
                          )}
                          <span className="text-[#94A3B8]">
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-in ContributingFactors Drawer when an alert is selected */}
      {selectedAlert && (
        <ContributingFactors
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAcknowledge={handleAcknowledge}
          readOnly={readOnly}
        />
      )}

    </div>
  );
}
