import React, { useState } from 'react';
import { Search, ShieldAlert, CheckCircle, Clock, MapPin, Wrench, AlertCircle, Loader2 } from 'lucide-react';
import ComplaintTimeline from '../components/complaints/ComplaintTimeline.js';
import { Complaint } from '../types/index.js';

export default function PublicComplaintTracker() {
  const [referenceId, setReferenceId] = useState('BW-2026-94812');
  const [mobile, setMobile] = useState('9876543210');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complaint, setComplaint] = useState<Complaint | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceId.trim() || !mobile.trim()) {
      setError('Please provide both Complaint Reference ID and registered Mobile Number.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setComplaint(null);

      const res = await fetch(
        `/api/complaints/public-track?referenceId=${encodeURIComponent(
          referenceId.trim()
        )}&mobile=${encodeURIComponent(mobile.trim())}`
      );

      const data = await res.json();
      if (res.ok && data.complaint) {
        setComplaint(data.complaint);
      } else {
        setError(data.error || 'No matching complaint found.');
      }
    } catch (err: any) {
      setError('Network error while querying complaint status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Public Grievance Tracker
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Verify live investigation progress, technician assignments, and photographic repair proof in full transparency.
        </p>
      </div>

      {/* Query Form */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl max-w-2xl mx-auto">
        <form onSubmit={handleTrack} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Complaint Reference ID <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. BW-2026-94812"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Registered Mobile Number <span className="text-cyan-400">*</span>
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500">
              Try sample reference: <button type="button" onClick={() => { setReferenceId('BW-2026-94812'); setMobile('9876543210'); }} className="text-cyan-400 underline">BW-2026-94812</button>
            </span>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-400 text-slate-950 text-xs font-semibold hover:bg-cyan-300 transition-colors disabled:opacity-50 shadow-md shadow-cyan-400/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Track Grievance</span>
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Result Display */}
      {complaint && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-2xl">
          <ComplaintTimeline complaint={complaint} canReopen={false} />
        </div>
      )}
    </div>
  );
}
