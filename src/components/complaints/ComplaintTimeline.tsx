import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  UserCheck,
  Wrench,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Complaint, ComplaintStatus } from '../../types/index.js';

interface ComplaintTimelineProps {
  complaint: Complaint;
  onReopen?: (reason: string) => void;
  canReopen?: boolean;
}

const ORDERED_STEPS: ComplaintStatus[] = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolution Submitted',
  'Resolved',
];

export default function ComplaintTimeline({ complaint, onReopen, canReopen }: ComplaintTimelineProps) {
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenInput, setShowReopenInput] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const currentStepIndex = ORDERED_STEPS.indexOf(complaint.status);
  const isSpecialState = ['More Information Required', 'Rejected with Reason', 'Escalated', 'Reopened'].includes(
    complaint.status
  );

  return (
    <div className="space-y-6">
      {/* Top Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <span className="text-xs text-slate-400 block">Complaint Reference</span>
          <span className="text-lg font-bold font-mono text-cyan-400">{complaint.referenceId}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Current Status:</span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              complaint.status === 'Resolved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : complaint.status === 'Resolution Submitted'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : complaint.status === 'In Progress' || complaint.status === 'Assigned'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : complaint.status === 'Escalated' || complaint.status === 'More Information Required'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {complaint.status}
          </span>
        </div>
      </div>

      {/* Main Visual Progress Stepper */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-6">
          Lifecycle Progression
        </h4>

        <div className="relative">
          {/* Track line */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-800 -z-0 hidden md:block" />

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {ORDERED_STEPS.map((step, idx) => {
              const isPast = currentStepIndex >= idx;
              const isCurrent = complaint.status === step;

              return (
                <div key={step} className="flex flex-col items-center text-center relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isPast
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">{idx + 1}</span>}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      isCurrent
                        ? 'text-cyan-400 font-semibold'
                        : isPast
                        ? 'text-slate-200'
                        : 'text-slate-500'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {isSpecialState && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Note:</strong> Ticket is currently marked as{' '}
              <span className="font-semibold">{complaint.status}</span>.
            </span>
          </div>
        )}
      </div>

      {/* Resolution Details & Evidence Section (if submitted or resolved) */}
      {complaint.resolution && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <h4 className="text-sm font-semibold text-white">Work Completion & Official Resolution</h4>
            </div>
            {complaint.resolution.verifiedAt && (
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Verified by District Authority
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="font-medium text-slate-400 block mb-1">Work Performed / Solution:</span>
              <p className="text-slate-200 bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 leading-relaxed font-sans">
                {complaint.resolution.workPerformed}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-400 font-medium">Actual Completion Date:</span>
                <p className="text-slate-200 font-mono mt-0.5">
                  {new Date(complaint.resolution.completionDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Resolving Officer:</span>
                <p className="text-slate-200 mt-0.5 font-medium">{complaint.resolution.resolvedByOfficerName}</p>
              </div>
            </div>

            {/* Resolution Photo / Proof Evidence */}
            {complaint.resolution.evidenceUrl && (
              <div className="pt-2">
                <span className="font-medium text-slate-400 block mb-2">Photographic Work Evidence:</span>
                <div className="relative inline-block group rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <img
                    src={complaint.resolution.evidenceUrl}
                    alt="Work Resolution Evidence"
                    className="w-48 h-32 object-cover transition-transform group-hover:scale-105 cursor-pointer"
                    onClick={() => setPreviewImage(complaint.resolution?.evidenceUrl || null)}
                  />
                  <button
                    onClick={() => setPreviewImage(complaint.resolution?.evidenceUrl || null)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs gap-1 transition-opacity"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Full Evidence</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Immutable Audit Trail Log */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
          Status & Action Audit Trail
        </h4>
        <div className="space-y-4">
          {complaint.auditTrail.map((entry, i) => (
            <div key={i} className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-200">{entry.status}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">{entry.changedBy} ({entry.role})</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                {entry.comment && <p className="text-slate-300 mt-1">{entry.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Consumer Reopen / Appeal Action */}
      {canReopen && complaint.status === 'Resolved' && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-xs font-semibold text-slate-200">Not Satisfied With Resolution?</h5>
              <p className="text-[11px] text-slate-400">You may reopen this ticket if the issue reoccurs or was not fully repaired.</p>
            </div>
            {!showReopenInput && (
              <button
                onClick={() => setShowReopenInput(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium hover:bg-amber-500/30 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen Ticket</span>
              </button>
            )}
          </div>

          {showReopenInput && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-[11px] text-slate-300 font-medium">
                Reason for Reopening / Appeal Details:
              </label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Explain why the issue is unresolved or recurring..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowReopenInput(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onReopen && reopenReason.trim()) {
                      onReopen(reopenReason.trim());
                      setShowReopenInput(false);
                    }
                  }}
                  disabled={!reopenReason.trim()}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  Submit Appeal
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Zoom Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-3xl max-h-[90vh] bg-slate-900 p-2 rounded-xl border border-slate-700">
            <img src={previewImage} alt="Full resolution evidence" className="max-h-[80vh] w-auto rounded object-contain" />
            <p className="text-center text-xs text-slate-400 mt-2">Click anywhere to close preview</p>
          </div>
        </div>
      )}
    </div>
  );
}
