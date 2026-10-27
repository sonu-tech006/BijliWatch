import React, { useState, useEffect } from 'react';
import {
  Shield,
  Layers,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Filter,
  Search,
  ExternalLink,
  Wrench,
  ChevronRight,
  ShieldCheck,
  CheckSquare,
  RotateCcw,
  Sliders,
  FileSpreadsheet,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Complaint, ComplaintStatus, UserRole } from '../types/index.js';
import ComplaintTimeline from '../components/complaints/ComplaintTimeline.js';
import ResolutionFormModal from '../components/complaints/ResolutionFormModal.js';

export default function AdminDashboard() {
  const { user, token } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'analytics' | 'tariffs' | 'audit_logs'>('queue');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [overviewMetrics, setOverviewMetrics] = useState<any>(null);
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Status Action Modal
  const [actionModal, setActionModal] = useState<{
    complaintId: string;
    action: 'assign' | 'status' | 'verify';
    statusTarget?: string;
  } | null>(null);
  const [assignForm, setAssignForm] = useState({
    officerName: 'Anil Sharma (Junior Engineer)',
    department: 'Subdivision 4 - Rampur Distribution Unit',
    estimatedResolutionDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
    notes: '',
  });
  const [statusNote, setStatusNote] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [cmpRes, ovrRes] = await Promise.all([
        fetch(
          `/api/complaints?status=${statusFilter}&category=${categoryFilter}&severity=${severityFilter}&search=${searchQuery}`,
          { headers }
        ),
        fetch('/api/admin/overview', { headers }),
      ]);

      const [cmps, ovr] = await Promise.all([cmpRes.json(), ovrRes.json()]);

      setComplaints(cmps.complaints || []);
      setOverviewMetrics(ovr);

      if (user?.role === 'state_admin') {
        const trfRes = await fetch('/api/admin/tariffs', { headers });
        const trfData = await trfRes.json();
        setTariffs(trfData.tariffs || []);
      }

      if (user?.role === 'state_admin' || user?.role === 'district_admin') {
        const logRes = await fetch('/api/admin/audit-logs', { headers });
        const logData = await logRes.json();
        setAuditLogs(logData.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token, statusFilter, categoryFilter, severityFilter, searchQuery]);

  // Assign Complaint
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/complaints/${actionModal.complaintId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(assignForm),
      });

      if (res.ok) {
        setActionModal(null);
        fetchAdminData();
        setSelectedComplaint(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Transition Status (In Progress, More Info, Escalated)
  const handleStatusTransition = async (status: string) => {
    if (!actionModal) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/complaints/${actionModal.complaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, note: statusNote }),
      });

      if (res.ok) {
        setActionModal(null);
        setStatusNote('');
        fetchAdminData();
        setSelectedComplaint(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Resolution Details via Modal
  const handleResolutionSubmit = async (data: any) => {
    if (!selectedComplaint) return;
    const res = await fetch(`/api/complaints/${selectedComplaint.id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit resolution');
    }

    fetchAdminData();
    setSelectedComplaint(null);
  };

  // Verify Resolution (District / State Admin)
  const handleVerifyResolution = async (approved: boolean) => {
    if (!actionModal) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/complaints/${actionModal.complaintId}/verify-resolution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ approved, rejectionReason: verificationFeedback }),
      });

      if (res.ok) {
        setActionModal(null);
        setVerificationFeedback('');
        fetchAdminData();
        setSelectedComplaint(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // CSV Export
  const handleExportCSV = async () => {
    try {
      const res = await fetch('/api/admin/export', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bijliwatch_export_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const roleNameMap: Record<UserRole, string> = {
    consumer: 'Consumer',
    local_admin: 'Panchayat & Local Unit Administration',
    district_admin: 'District Electricity Circle Administration',
    state_admin: 'State Regulatory Commission Administration',
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header with Jurisdiction Scope */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">
              {roleNameMap[user?.role || 'local_admin']}
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Jurisdiction:{' '}
            <strong className="text-slate-200">
              {user?.role === 'state_admin'
                ? `State of ${user.state} (Statewide)`
                : user?.role === 'district_admin'
                ? `District: ${user.district}, ${user.state}`
                : `Locality: ${user?.locality || 'Rampur'}, District: ${user?.district}`}
            </strong>
            {user?.department && ` · Department: ${user.department}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(user?.role === 'district_admin' || user?.role === 'state_admin') && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview KPI Cards */}
      {overviewMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Total Queue</span>
            <span className="text-xl font-bold font-mono text-white">
              {overviewMetrics.metrics.total}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">New Submissions</span>
            <span className="text-xl font-bold font-mono text-cyan-400">
              {overviewMetrics.metrics.submitted}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">In Progress</span>
            <span className="text-xl font-bold font-mono text-amber-400">
              {overviewMetrics.metrics.inProgress}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Pending Verification</span>
            <span className="text-xl font-bold font-mono text-blue-400">
              {overviewMetrics.metrics.resolutionSubmitted}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Resolved</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {overviewMetrics.metrics.resolved}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Safety Hazards</span>
            <span className="text-xl font-bold font-mono text-rose-400">
              {overviewMetrics.metrics.emergencyCount}
            </span>
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => { setActiveSubTab('queue'); setSelectedComplaint(null); }}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeSubTab === 'queue' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Grievance Queue</span>
        </button>

        {user?.role === 'state_admin' && (
          <button
            onClick={() => { setActiveSubTab('tariffs'); setSelectedComplaint(null); }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeSubTab === 'tariffs' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tariff Slabs Management</span>
          </button>
        )}

        {(user?.role === 'state_admin' || user?.role === 'district_admin') && (
          <button
            onClick={() => { setActiveSubTab('audit_logs'); setSelectedComplaint(null); }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeSubTab === 'audit_logs' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Immutable Audit Trail</span>
          </button>
        )}
      </div>

      {/* SUBTAB 1: GRIEVANCE QUEUE */}
      {activeSubTab === 'queue' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reference ID, consumer, or locality..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
              >
                <option value="all">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolution Submitted">Resolution Submitted</option>
                <option value="Resolved">Resolved</option>
                <option value="Escalated">Escalated</option>
                <option value="Reopened">Reopened</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
              >
                <option value="all">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Emergency / Hazardous">Emergency / Hazardous</option>
              </select>
            </div>
          </div>

          {/* Selected Complaint Detail View */}
          {selectedComplaint ? (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  ← Back to jurisdiction queue
                </button>

                {/* Admin Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Action 1: Assign work */}
                  {selectedComplaint.status === 'Submitted' || selectedComplaint.status === 'Under Review' ? (
                    <button
                      onClick={() => setActionModal({ complaintId: selectedComplaint.id, action: 'assign' })}
                      className="px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 text-xs font-semibold hover:bg-cyan-300"
                    >
                      Assign Lineworker / JE
                    </button>
                  ) : null}

                  {/* Action 2: Update Progress / In Progress */}
                  {selectedComplaint.status === 'Assigned' && (
                    <button
                      onClick={() =>
                        setActionModal({
                          complaintId: selectedComplaint.id,
                          action: 'status',
                          statusTarget: 'In Progress',
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30"
                    >
                      Set In Progress
                    </button>
                  )}

                  {/* Action 3: Complete Work & Submit Resolution (Authorized Local or District Admin) */}
                  {['Assigned', 'In Progress'].includes(selectedComplaint.status) && (
                    <button
                      onClick={() => setShowResolutionModal(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-semibold hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                    >
                      Mark Work Completed & Submit Proof
                    </button>
                  )}

                  {/* Action 4: District / State Verification of submitted resolution */}
                  {selectedComplaint.status === 'Resolution Submitted' &&
                    (user?.role === 'district_admin' || user?.role === 'state_admin') && (
                      <button
                        onClick={() =>
                          setActionModal({ complaintId: selectedComplaint.id, action: 'verify' })
                        }
                        className="px-3.5 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-400"
                      >
                        Verify & Approve Resolution
                      </button>
                    )}
                </div>
              </div>

              <ComplaintTimeline complaint={selectedComplaint} canReopen={false} />
            </div>
          ) : (
            /* Queue Table */
            <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                    <th className="py-3 px-4 text-left">Ref ID</th>
                    <th className="py-3 px-4 text-left">Category & Title</th>
                    <th className="py-3 px-4 text-left">Locality</th>
                    <th className="py-3 px-4 text-left">Severity</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Assigned To</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No complaints matching current filters in this jurisdiction.
                      </td>
                    </tr>
                  ) : (
                    complaints.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedComplaint(c)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-cyan-400 font-bold whitespace-nowrap">
                          {c.referenceId}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <span className="font-semibold text-slate-200 block truncate">{c.title}</span>
                          <span className="text-[11px] text-slate-400">{c.category}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{c.locality}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              c.severity === 'Emergency / Hazardous'
                                ? 'bg-rose-500/20 text-rose-300'
                                : c.severity === 'High'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {c.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              c.status === 'Resolved'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : c.status === 'Resolution Submitted'
                                ? 'bg-blue-500/20 text-blue-300'
                                : c.status === 'In Progress'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {c.assignedTo?.officerName || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedComplaint(c);
                            }}
                            className="text-cyan-400 hover:underline font-medium"
                          >
                            Inspect →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: TARIFF SLABS MANAGEMENT (STATE ADMIN) */}
      {activeSubTab === 'tariffs' && user?.role === 'state_admin' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-white">Regulatory Tariff Slab Matrices</h2>
              <p className="text-xs text-slate-400">
                State-level gazetted electricity consumption slabs, fixed charges, and fuel surcharges
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {tariffs.map((t) => (
              <div key={t.id} className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{t.discom}</h3>
                    <span className="text-xs text-slate-400 font-mono">Category: {t.tariffCategory}</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">BERC Approved Gazette</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-800/80">
                  <div>Fixed Load Charge: <strong className="font-mono text-cyan-400 block">₹{t.fixedChargePerKw}/kW</strong></div>
                  <div>Electricity Duty: <strong className="font-mono text-cyan-400 block">{t.electricityDutyPercent}%</strong></div>
                  <div>Fuel Surcharge: <strong className="font-mono text-cyan-400 block">₹{t.fuelSurchargePerUnit}/u</strong></div>
                  <div>Last Updated: <strong className="font-mono text-slate-300 block">{new Date(t.updatedAt).toLocaleDateString()}</strong></div>
                </div>

                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-300 block mb-2">Telescopic Slabs</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {t.slabs.map((s: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                        <span className="text-slate-400 block">
                          {s.maxUnits ? `${s.minUnits}-${s.maxUnits} units` : `Above ${s.minUnits} units`}
                        </span>
                        <span className="text-sm font-bold font-mono text-white mt-1 block">
                          ₹{s.ratePerUnit.toFixed(2)}/kWh
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: IMMUTABLE AUDIT TRAIL */}
      {activeSubTab === 'audit_logs' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base font-semibold text-white">Immutable Administrative Audit Log</h2>
            <p className="text-xs text-slate-400">
              Cryptographically timestamped records of every assignment, status escalation, and resolution decision
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                  <th className="py-2.5 px-3 text-left">Action</th>
                  <th className="py-2.5 px-3 text-left">Actor</th>
                  <th className="py-2.5 px-3 text-left">Role</th>
                  <th className="py-2.5 px-3 text-left">Target ID</th>
                  <th className="py-2.5 px-3 text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-cyan-400">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-200 font-sans">{log.actorName}</td>
                    <td className="py-2.5 px-3 text-slate-400">{log.actorRole}</td>
                    <td className="py-2.5 px-3 text-slate-300">{log.targetId}</td>
                    <td className="py-2.5 px-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resolution Submission Modal (Triggered by "Mark work as completed") */}
      {showResolutionModal && selectedComplaint && (
        <ResolutionFormModal
          complaint={selectedComplaint}
          onClose={() => setShowResolutionModal(false)}
          onSubmitResolution={handleResolutionSubmit}
        />
      )}

      {/* Action Dialog: Assignment Modal */}
      {actionModal?.action === 'assign' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setActionModal(null)} className="absolute top-5 right-5 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-semibold text-white mb-4">Assign Complaint to Field Staff</h3>
            <form onSubmit={handleAssign} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Field Officer Name</label>
                <input
                  type="text"
                  value={assignForm.officerName}
                  onChange={(e) => setAssignForm({ ...assignForm, officerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Assigned Department / Substation</label>
                <input
                  type="text"
                  value={assignForm.department}
                  onChange={(e) => setAssignForm({ ...assignForm, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Estimated Resolution Target Date</label>
                <input
                  type="date"
                  value={assignForm.estimatedResolutionDate}
                  onChange={(e) => setAssignForm({ ...assignForm, estimatedResolutionDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-cyan-400 text-slate-950 text-xs font-semibold hover:bg-cyan-300"
                >
                  {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Dialog: Verify Resolution Modal */}
      {actionModal?.action === 'verify' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setActionModal(null)} className="absolute top-5 right-5 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-semibold text-white mb-2">District Resolution Verification</h3>
            <p className="text-xs text-slate-400 mb-4">
              Review submitted completion proof, meter calibration photographs, and technician notes before granting regulatory closure.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Verification Remarks / Return Feedback
                </label>
                <textarea
                  value={verificationFeedback}
                  onChange={(e) => setVerificationFeedback(e.target.value)}
                  placeholder="Optional review notes or rejection reason..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleVerifyResolution(false)}
                  disabled={actionLoading}
                  className="px-3 py-2 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/30"
                >
                  Return for Additional Proof
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyResolution(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 text-xs font-semibold hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                >
                  {actionLoading ? 'Verifying...' : 'Approve & Mark Resolved'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
