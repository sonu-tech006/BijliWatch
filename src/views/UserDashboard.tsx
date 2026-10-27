import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Zap,
  Gauge,
  Receipt,
  BarChart3,
  MessageSquarePlus,
  ListFilter,
  Plus,
  Upload,
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock,
  Printer,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import {
  ElectricityConnection,
  MeterReading,
  ElectricityBill,
  Complaint,
  ComplaintCategory,
  ComplaintSeverity,
} from '../types/index.js';
import EnergyChart from '../components/analytics/EnergyChart.js';
import ComplaintTimeline from '../components/complaints/ComplaintTimeline.js';
import LocationPicker from '../components/maps/LocationPicker.js';

export default function UserDashboard() {
  const { user, token } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'connections' | 'readings' | 'bills' | 'analytics' | 'complaints' | 'new_complaint'>('overview');

  // Data states
  const [connections, setConnections] = useState<ElectricityConnection[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [bills, setBills] = useState<ElectricityBill[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  // Forms states
  // 1. Connection Modal
  const [showConnModal, setShowConnModal] = useState(false);
  const [editingConnId, setEditingConnId] = useState<string | null>(null);
  const [connForm, setConnForm] = useState<{
    consumerNumber: string;
    consumerName: string;
    discom: string;
    tariffCategory: ElectricityConnection['tariffCategory'];
    sanctionedLoadKw: number;
    meterNumber: string;
    meterType: ElectricityConnection['meterType'];
    serviceAddress: string;
    locality: string;
    district: string;
    state: string;
    pincode: string;
  }>({
    consumerNumber: '',
    consumerName: user?.name || '',
    discom: 'SBPDCL - South Bihar Power Distribution',
    tariffCategory: 'Domestic (DS-II)',
    sanctionedLoadKw: 2.0,
    meterNumber: '',
    meterType: 'Smart Digital',
    serviceAddress: '',
    locality: user?.locality || 'Rampur',
    district: user?.district || 'Patna',
    state: user?.state || 'Bihar',
    pincode: '800014',
  });

  // 2. Meter Reading Form
  const [readingForm, setReadingForm] = useState({
    connectionId: '',
    previousReading: 0,
    currentReading: 0,
    readingDate: new Date().toISOString().split('T')[0],
    readingSource: 'Self / Consumer' as const,
    notes: '',
  });

  // 3. Bill Upload Form
  const [billForm, setBillForm] = useState({
    connectionId: '',
    billNumber: '',
    billingPeriod: '',
    billingStartDate: '',
    billingEndDate: '',
    unitsConsumed: 0,
    totalAmountDue: 0,
    dueDate: '',
    billDocumentUrl: '',
  });
  const [uploadingBill, setUploadingBill] = useState(false);

  // 4. Complaint Form
  const [complaintForm, setComplaintForm] = useState<{
    connectionId: string;
    category: ComplaintCategory;
    severity: ComplaintSeverity;
    title: string;
    description: string;
    occurrenceDateTime: string;
    state: string;
    district: string;
    locality: string;
    address: string;
    latitude?: number;
    longitude?: number;
    contactPreference: 'Phone Call' | 'SMS / WhatsApp' | 'Email';
    evidenceFiles: Array<{ url: string; type: string; title: string; uploadedAt: string }>;
  }>({
    connectionId: '',
    category: 'Unexpectedly High Bill',
    severity: 'Medium',
    title: '',
    description: '',
    occurrenceDateTime: new Date().toISOString().slice(0, 16),
    state: user?.state || 'Bihar',
    district: user?.district || 'Patna',
    locality: user?.locality || 'Rampur',
    address: '',
    latitude: 25.5941,
    longitude: 85.1376,
    contactPreference: 'SMS / WhatsApp',
    evidenceFiles: [],
  });
  const [uploadingComplaintFile, setUploadingComplaintFile] = useState(false);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load all user data
  const fetchData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [connRes, readRes, billRes, compRes, anaRes] = await Promise.all([
        fetch('/api/connections', { headers }),
        fetch('/api/readings', { headers }),
        fetch('/api/bills', { headers }),
        fetch('/api/complaints', { headers }),
        fetch('/api/analytics/consumption', { headers }),
      ]);

      const [conns, reads, bls, cmps, ana] = await Promise.all([
        connRes.json(),
        readRes.json(),
        billRes.json(),
        compRes.json(),
        anaRes.json(),
      ]);

      setConnections(conns.connections || []);
      setReadings(reads.readings || []);
      setBills(bls.bills || []);
      setComplaints(cmps.complaints || []);
      setAnalyticsData(ana);

      // Pre-select connection in forms if available
      if (conns.connections?.length > 0) {
        const firstConnId = conns.connections[0].id;
        setReadingForm((prev) => ({
          ...prev,
          connectionId: firstConnId,
          previousReading: reads.readings?.[0]?.currentReading || 4500,
          currentReading: (reads.readings?.[0]?.currentReading || 4500) + 120,
        }));
        setBillForm((prev) => ({ ...prev, connectionId: firstConnId }));
        setComplaintForm((prev) => ({ ...prev, connectionId: firstConnId }));
      }
    } catch (e) {
      console.error('Error fetching dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Handle Connection submission
  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingConnId ? `/api/connections/${editingConnId}` : '/api/connections';
      const method = editingConnId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(connForm),
      });

      if (res.ok) {
        setShowConnModal(false);
        setEditingConnId(null);
        fetchData();
        setStatusMessage({ type: 'success', text: 'Connection details saved successfully.' });
      } else {
        const err = await res.json();
        setStatusMessage({ type: 'error', text: err.error || 'Failed to save connection.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // Handle Meter Reading submission
  const handleRecordReading = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(readingForm),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: data.anomalyDetected
            ? `Reading logged. WARNING: ${data.anomalyMessage}`
            : 'Meter reading recorded and units calculated successfully.',
        });
        fetchData();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to record meter reading.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // Handle Bill Upload / Entry
  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(billForm),
      });

      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Electricity bill added to records.' });
        fetchData();
        setBillForm({
          connectionId: connections[0]?.id || '',
          billNumber: '',
          billingPeriod: '',
          billingStartDate: '',
          billingEndDate: '',
          unitsConsumed: 0,
          totalAmountDue: 0,
          dueDate: '',
          billDocumentUrl: '',
        });
      } else {
        const err = await res.json();
        setStatusMessage({ type: 'error', text: err.error || 'Failed to save bill.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // Upload Bill Document handler
  const handleBillFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingBill(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: reader.result,
            fileName: file.name,
            mimeType: file.type,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setBillForm((prev) => ({ ...prev, billDocumentUrl: data.url }));
        }
        setUploadingBill(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadingBill(false);
    }
  };

  // Handle Complaint Evidence Upload
  const handleComplaintFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingComplaintFile(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: reader.result,
            fileName: file.name,
            mimeType: file.type,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setComplaintForm((prev) => ({
            ...prev,
            evidenceFiles: [
              ...prev.evidenceFiles,
              {
                url: data.url,
                type: file.type.includes('pdf') ? 'pdf' : 'image',
                title: file.name,
                uploadedAt: new Date().toISOString(),
              },
            ],
          }));
        }
        setUploadingComplaintFile(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadingComplaintFile(false);
    }
  };

  // Submit Complaint
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingComplaint(true);
      setStatusMessage(null);

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(complaintForm),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: `Complaint submitted successfully! Your Reference ID is ${data.referenceId}.`,
        });
        fetchData();
        setActiveTab('complaints');
        // Reset form
        setComplaintForm({
          connectionId: connections[0]?.id || '',
          category: 'Unexpectedly High Bill',
          severity: 'Medium',
          title: '',
          description: '',
          occurrenceDateTime: new Date().toISOString().slice(0, 16),
          state: user?.state || 'Bihar',
          district: user?.district || 'Patna',
          locality: user?.locality || 'Rampur',
          address: '',
          latitude: 25.5941,
          longitude: 85.1376,
          contactPreference: 'SMS / WhatsApp',
          evidenceFiles: [],
        });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to submit complaint.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Reopen Complaint handler
  const handleReopenComplaint = async (complaintId: string, reason: string) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Complaint ticket has been reopened.' });
        fetchData();
        setSelectedComplaint(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-xs text-slate-400">Loading consumer utility telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Top Banner & Profile Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{user?.name}</h1>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
              Consumer Portal
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {user?.locality}, {user?.district}, {user?.state} · Consumer ID:{' '}
            <strong className="font-mono text-slate-200">
              {connections[0]?.consumerNumber ? `••••${connections[0].consumerNumber.slice(-4)}` : 'No connection'}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('new_complaint')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-400 text-slate-950 text-xs font-semibold hover:bg-cyan-300 transition-colors shadow-sm shadow-cyan-400/20"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Lodge Grievance</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => { setActiveTab('overview'); setSelectedComplaint(null); }}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'overview' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => { setActiveTab('connections'); setSelectedComplaint(null); }}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'connections' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Connections ({connections.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('readings'); setSelectedComplaint(null); }}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'readings' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Meter Readings</span>
        </button>

        <button
          onClick={() => { setActiveTab('bills'); setSelectedComplaint(null); }}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'bills' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Bills & Receipts</span>
        </button>

        <button
          onClick={() => { setActiveTab('analytics'); setSelectedComplaint(null); }}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'analytics' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Energy Analytics</span>
        </button>

        <button
          onClick={() => { setActiveTab('complaints'); setSelectedComplaint(null); }}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'complaints' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Complaint Center ({complaints.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Registered Connections</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">{connections.length}</span>
                <span className="text-xs text-slate-400">Active</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Current Month Usage</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-cyan-400">
                  {analyticsData?.currentUnits || 0}
                </span>
                <span className="text-xs text-slate-400">kWh</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Estimated Current Bill</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">
                  ₹{bills[0]?.totalAmountDue ? bills[0].totalAmountDue.toLocaleString() : '1,840'}
                </span>
                <span className="text-xs text-slate-400">approx.</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Active Complaints</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-amber-400">
                  {complaints.filter((c) => c.status !== 'Resolved').length}
                </span>
                <span className="text-xs text-slate-400">
                  ({complaints.filter((c) => c.status === 'Resolved').length} resolved)
                </span>
              </div>
            </div>
          </div>

          {/* Anomaly Callout if Spike is detected */}
          {analyticsData?.anomaly?.isAnomaly && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-xs text-amber-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <strong className="text-amber-300 block">Unusual Consumption Spike Alert</strong>
                  <span>{analyticsData.anomaly.reason}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('new_complaint')}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 whitespace-nowrap shrink-0"
              >
                Dispute Spike
              </button>
            </div>
          )}

          {/* Energy Chart */}
          {analyticsData && (
            <EnergyChart
              monthlyData={analyticsData.monthlyData || []}
              currentUnits={analyticsData.currentUnits || 0}
              previousUnits={analyticsData.previousUnits || 0}
              deltaPercent={analyticsData.deltaPercent || 0}
              anomaly={analyticsData.anomaly}
            />
          )}

          {/* Recent Complaints Summary Strip */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Recent Grievance Redressal Status</h3>
              <button
                onClick={() => setActiveTab('complaints')}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>View All ({complaints.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {complaints.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  onClick={() => { setSelectedComplaint(c); setActiveTab('complaints'); }}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 cursor-pointer flex items-center justify-between transition-colors text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-semibold">{c.referenceId}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-300 font-medium">{c.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{c.category} · {c.locality}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      c.status === 'Resolved'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONNECTIONS */}
      {activeTab === 'connections' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Registered Electricity Connections</h2>
              <p className="text-xs text-slate-400">Manage multiple consumer numbers and sanctioned load allocations</p>
            </div>
            <button
              onClick={() => {
                setEditingConnId(null);
                setConnForm({
                  consumerNumber: '',
                  consumerName: user?.name || '',
                  discom: 'SBPDCL - South Bihar Power Distribution',
                  tariffCategory: 'Domestic (DS-II)',
                  sanctionedLoadKw: 2.0,
                  meterNumber: '',
                  meterType: 'Smart Digital',
                  serviceAddress: '',
                  locality: user?.locality || 'Rampur',
                  district: user?.district || 'Patna',
                  state: user?.state || 'Bihar',
                  pincode: '800014',
                });
                setShowConnModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-400 text-slate-950 text-xs font-semibold hover:bg-cyan-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Connection</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connections.map((conn) => (
              <div key={conn.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] text-cyan-400 font-mono block">
                      Consumer No: ••••{conn.consumerNumber.slice(-4)}
                    </span>
                    <h3 className="text-sm font-semibold text-white mt-0.5">{conn.consumerName}</h3>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {conn.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80 font-mono">
                  <div>Discom: <span className="font-sans text-slate-400 block truncate">{conn.discom}</span></div>
                  <div>Tariff: <span className="font-sans text-slate-400 block">{conn.tariffCategory}</span></div>
                  <div>Load: <span className="text-cyan-400 font-bold block">{conn.sanctionedLoadKw} kW</span></div>
                  <div>Meter: <span className="text-slate-400 block">{conn.meterNumber}</span></div>
                </div>

                <p className="text-xs text-slate-400 pt-1 truncate">
                  Address: {conn.serviceAddress}, {conn.locality}
                </p>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      setEditingConnId(conn.id);
                      setConnForm({
                        consumerNumber: conn.consumerNumber,
                        consumerName: conn.consumerName,
                        discom: conn.discom,
                        tariffCategory: conn.tariffCategory,
                        sanctionedLoadKw: conn.sanctionedLoadKw,
                        meterNumber: conn.meterNumber,
                        meterType: conn.meterType,
                        serviceAddress: conn.serviceAddress,
                        locality: conn.locality,
                        district: conn.district,
                        state: conn.state,
                        pincode: conn.pincode,
                      });
                      setShowConnModal(true);
                    }}
                    className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: METER READINGS */}
      {activeTab === 'readings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Logger Form */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span>Record Physical Meter Reading</span>
            </h3>

            <form onSubmit={handleRecordReading} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target Connection</label>
                <select
                  value={readingForm.connectionId}
                  onChange={(e) => setReadingForm({ ...readingForm, connectionId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                >
                  {connections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.consumerName} (••••{c.consumerNumber.slice(-4)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Previous Reading (kWh)</label>
                  <input
                    type="number"
                    min="0"
                    value={readingForm.previousReading}
                    onChange={(e) => setReadingForm({ ...readingForm, previousReading: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Current Reading (kWh)</label>
                  <input
                    type="number"
                    min="0"
                    value={readingForm.currentReading}
                    onChange={(e) => setReadingForm({ ...readingForm, currentReading: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-cyan-400 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Automatic Units Preview */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Calculated Units Consumed:</span>
                <span className="font-mono font-bold text-sm text-cyan-400">
                  {Math.max(0, readingForm.currentReading - readingForm.previousReading)} kWh
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Reading Date</label>
                  <input
                    type="date"
                    value={readingForm.readingDate}
                    onChange={(e) => setReadingForm({ ...readingForm, readingDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Reading Source</label>
                  <select
                    value={readingForm.readingSource}
                    onChange={(e) => setReadingForm({ ...readingForm, readingSource: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="Self / Consumer">Self / Consumer Entry</option>
                    <option value="Utility Lineman">Utility Lineman Visit</option>
                    <option value="Automated Smart Meter">Automated Smart Meter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Remarks or Display Notes (Optional)</label>
                <input
                  type="text"
                  value={readingForm.notes}
                  onChange={(e) => setReadingForm({ ...readingForm, notes: e.target.value })}
                  placeholder="e.g. Verified dial after replacement"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-cyan-400 text-slate-950 text-xs font-semibold hover:bg-cyan-300 transition-colors"
              >
                Log & Validate Meter Reading
              </button>
            </form>
          </div>

          {/* Historical Readings Table */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white">Meter Reading Audit Register</h3>
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                    <th className="py-2.5 px-3 text-left">Date</th>
                    <th className="py-2.5 px-3 text-right">Prev Dial</th>
                    <th className="py-2.5 px-3 text-right">Curr Dial</th>
                    <th className="py-2.5 px-3 text-right">Units</th>
                    <th className="py-2.5 px-3 text-left">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {readings.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 text-slate-300">{r.readingDate}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{r.previousReading}</td>
                      <td className="py-2.5 px-3 text-right text-slate-200">{r.currentReading}</td>
                      <td className="py-2.5 px-3 text-right text-cyan-400 font-bold">{r.unitsConsumed}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-sans">{r.readingSource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BILLS & RECEIPTS */}
      {activeTab === 'bills' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Electricity Bills & Cloud Receipts</h2>
              <p className="text-xs text-slate-400">Upload authentic bill scans or PDF statements to maintain audited ledger history</p>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById('bill-upload-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Add Bill Entry</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bills.map((b) => (
              <div key={b.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-400 font-semibold">{b.billNumber}</span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      b.paymentStatus === 'Paid'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {b.paymentStatus}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-400">Billing Period:</span>
                  <h4 className="text-sm font-semibold text-white">{b.billingPeriod}</h4>
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Units Billed</span>
                    <span className="text-sm font-bold font-mono text-slate-200">{b.unitsConsumed} kWh</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Amount Due</span>
                    <span className="text-base font-bold font-mono text-cyan-400">₹{b.totalAmountDue.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 font-mono">Due Date: {b.dueDate}</p>

                {b.billDocumentUrl && (
                  <a
                    href={b.billDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline pt-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Official Bill Copy</span>
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Add / Upload Bill Form */}
          <div id="bill-upload-section" className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 max-w-2xl">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-cyan-400" />
              <span>Record New Electricity Bill</span>
            </h3>

            <form onSubmit={handleSaveBill} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Billing Period</label>
                  <input
                    type="text"
                    value={billForm.billingPeriod}
                    onChange={(e) => setBillForm({ ...billForm, billingPeriod: e.target.value })}
                    placeholder="e.g. Nov 2026"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Bill Number</label>
                  <input
                    type="text"
                    value={billForm.billNumber}
                    onChange={(e) => setBillForm({ ...billForm, billNumber: e.target.value })}
                    placeholder="e.g. SB-2026-11"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Units Consumed (kWh)</label>
                  <input
                    type="number"
                    min="0"
                    value={billForm.unitsConsumed}
                    onChange={(e) => setBillForm({ ...billForm, unitsConsumed: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Total Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={billForm.totalAmountDue}
                    onChange={(e) => setBillForm({ ...billForm, totalAmountDue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-cyan-400 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={billForm.dueDate}
                    onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Attach Bill Scan / PDF</label>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-950 border border-dashed border-slate-700 text-xs text-slate-300 hover:border-cyan-500 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{uploadingBill ? 'Uploading...' : billForm.billDocumentUrl ? 'Uploaded ✓' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleBillFileUpload}
                      className="hidden"
                      disabled={uploadingBill}
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-cyan-400 text-slate-950 text-xs font-semibold hover:bg-cyan-300 transition-colors"
              >
                Save Bill Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: ENERGY ANALYTICS */}
      {activeTab === 'analytics' && analyticsData && (
        <div className="space-y-6">
          <EnergyChart
            monthlyData={analyticsData.monthlyData || []}
            currentUnits={analyticsData.currentUnits || 0}
            previousUnits={analyticsData.previousUnits || 0}
            deltaPercent={analyticsData.deltaPercent || 0}
            anomaly={analyticsData.anomaly}
          />
        </div>
      )}

      {/* TAB 6: COMPLAINT CENTER */}
      {activeTab === 'complaints' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Your Grievances & Redressal Timeline</h2>
              <p className="text-xs text-slate-400">Track investigation progress, lineworker assignments, and verified work proof</p>
            </div>
            <button
              onClick={() => setActiveTab('new_complaint')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-400 text-slate-950 text-xs font-semibold hover:bg-cyan-300 transition-colors shadow-sm shadow-cyan-400/20"
            >
              <Plus className="w-4 h-4" />
              <span>Submit New Grievance</span>
            </button>
          </div>

          {selectedComplaint ? (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mb-2"
              >
                ← Back to complaint queue
              </button>
              <ComplaintTimeline
                complaint={selectedComplaint}
                canReopen={true}
                onReopen={(reason) => handleReopenComplaint(selectedComplaint.id, reason)}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No open grievances</p>
                  <p className="text-xs text-slate-500 mt-1">All your electricity services and billings are operating normally.</p>
                </div>
              ) : (
                complaints.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedComplaint(c)}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-400 font-bold text-xs">{c.referenceId}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs font-semibold text-white">{c.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Category: {c.category} · Priority: {c.severity} · Incident at: {c.locality}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          c.status === 'Resolved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-cyan-500/20 text-cyan-300'
                        }`}
                      >
                        {c.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: LODGE NEW COMPLAINT */}
      {activeTab === 'new_complaint' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 max-w-3xl mx-auto">
          <div>
            <h2 className="text-lg font-bold text-white">Lodge Electricity Complaint</h2>
            <p className="text-xs text-slate-400">
              Submit billing disputes, line hazards, or meter faults for rapid automated routing to authorized local officers.
            </p>
          </div>

          <form onSubmit={handleSubmitComplaint} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Grievance Category <span className="text-rose-400">*</span>
                </label>
                <select
                  value={complaintForm.category}
                  onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value as ComplaintCategory })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  required
                >
                  <option value="Unexpectedly High Bill">Unexpectedly High Bill</option>
                  <option value="Incorrect Meter Reading">Incorrect Meter Reading</option>
                  <option value="Suspected Faulty Meter">Suspected Faulty Meter</option>
                  <option value="Power Outage">Power Outage</option>
                  <option value="Voltage Fluctuation">Voltage Fluctuation</option>
                  <option value="Damaged / Exposed Equipment">Damaged / Exposed Equipment</option>
                  <option value="Billing Correction">Billing Correction</option>
                  <option value="Delay in Service Connection">Delay in Service Connection</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Severity Level <span className="text-rose-400">*</span>
                </label>
                <select
                  value={complaintForm.severity}
                  onChange={(e) => setComplaintForm({ ...complaintForm, severity: e.target.value as ComplaintSeverity })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  required
                >
                  <option value="Low">Low - Informational inquiry</option>
                  <option value="Medium">Medium - Routine service ticket</option>
                  <option value="High">High - Substantial overbilling or outage</option>
                  <option value="Emergency / Hazardous">Emergency / Hazardous - Sparking line, public safety threat</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Summary Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={complaintForm.title}
                onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                placeholder="e.g. October bill jumped 140% without appliance change"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Detailed Incident Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={complaintForm.description}
                onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                rows={3}
                placeholder="Provide appliance context, meter display readouts, or exact time duration of the outage/fluctuation..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            {/* Incident Location & Leaflet GPS Map */}
            <LocationPicker
              state={complaintForm.state}
              district={complaintForm.district}
              locality={complaintForm.locality}
              address={complaintForm.address}
              initialLat={complaintForm.latitude}
              initialLng={complaintForm.longitude}
              onLocationChange={(loc) => {
                setComplaintForm((prev) => ({
                  ...prev,
                  state: loc.state,
                  district: loc.district,
                  locality: loc.locality,
                  address: loc.address,
                  latitude: loc.lat,
                  longitude: loc.lng,
                }));
              }}
            />

            {/* Evidence Photograph / PDF Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Meter / Bill / Hazardous Equipment Photograph
              </label>
              <label className="flex items-center justify-center gap-2 p-4 rounded-xl bg-slate-950 border border-dashed border-slate-700 hover:border-cyan-500 cursor-pointer text-xs text-slate-300">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>
                  {uploadingComplaintFile
                    ? 'Uploading image to secure storage...'
                    : 'Click to attach photo or bill document (JPG, PNG, PDF up to 10MB)'}
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleComplaintFileUpload}
                  className="hidden"
                  disabled={uploadingComplaintFile}
                />
              </label>

              {complaintForm.evidenceFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {complaintForm.evidenceFiles.map((ev, i) => (
                    <span key={i} className="text-[11px] text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-lg">
                      ✓ {ev.title}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('complaints')}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingComplaint || uploadingComplaintFile}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-400 text-slate-950 text-xs font-semibold hover:bg-cyan-300 transition-colors disabled:opacity-50 shadow-md shadow-cyan-400/20"
              >
                {submittingComplaint ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                <span>Submit Grievance to Administration</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Connection Modal (Add/Edit) */}
      {showConnModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setShowConnModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-semibold text-white mb-4">
              {editingConnId ? 'Edit Connection' : 'Register Electricity Connection'}
            </h3>

            <form onSubmit={handleSaveConnection} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Consumer Number</label>
                <input
                  type="text"
                  value={connForm.consumerNumber}
                  onChange={(e) => setConnForm({ ...connForm, consumerNumber: e.target.value })}
                  placeholder="e.g. 1002948193"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Consumer Name on Utility Record</label>
                <input
                  type="text"
                  value={connForm.consumerName}
                  onChange={(e) => setConnForm({ ...connForm, consumerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Sanctioned Load (kW)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={connForm.sanctionedLoadKw}
                    onChange={(e) => setConnForm({ ...connForm, sanctionedLoadKw: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Meter Number</label>
                  <input
                    type="text"
                    value={connForm.meterNumber}
                    onChange={(e) => setConnForm({ ...connForm, meterNumber: e.target.value })}
                    placeholder="MTR-8921"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Service Address</label>
                <input
                  type="text"
                  value={connForm.serviceAddress}
                  onChange={(e) => setConnForm({ ...connForm, serviceAddress: e.target.value })}
                  placeholder="House 42, Ward 4..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConnModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-400 text-slate-950 text-xs font-semibold hover:bg-cyan-300"
                >
                  Save Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
