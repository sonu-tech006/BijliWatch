import React, { useState } from 'react';
import { X, CheckSquare, Upload, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { Complaint } from '../../types/index.js';

interface ResolutionFormModalProps {
  complaint: Complaint;
  onClose: () => void;
  onSubmitResolution: (data: {
    workPerformed: string;
    completionDate: string;
    resolutionNotes: string;
    evidenceUrl?: string;
    officerConfirmed: boolean;
  }) => Promise<void>;
}

export default function ResolutionFormModal({
  complaint,
  onClose,
  onSubmitResolution,
}: ResolutionFormModalProps) {
  const [isCompletedChecked, setIsCompletedChecked] = useState(false);
  const [workPerformed, setWorkPerformed] = useState('');
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [officerConfirmed, setOfficerConfirmed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must not exceed 10MB.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: base64Data,
            fileName: file.name,
            mimeType: file.type,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setEvidenceUrl(data.url);
        } else {
          const errData = await res.json();
          setError(errData.error || 'Upload failed');
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError('Upload error: ' + err.message);
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCompletedChecked) {
      setError('Please check "Mark work as completed" to initiate resolution workflow.');
      return;
    }
    if (!workPerformed.trim()) {
      setError('Work performed / solution description is required.');
      return;
    }
    if (!completionDate) {
      setError('Actual completion date is required.');
      return;
    }
    if (!resolutionNotes.trim()) {
      setError('Resolution notes are required.');
      return;
    }
    if (!officerConfirmed) {
      setError('You must check the officer confirmation statement.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmitResolution({
        workPerformed,
        completionDate,
        resolutionNotes,
        evidenceUrl: evidenceUrl || undefined,
        officerConfirmed,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit resolution');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-semibold text-white">
            Administrative Resolution Workflow
          </h3>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Ticket: <strong className="text-cyan-400 font-mono">{complaint.referenceId}</strong></span>
            <span>Category: <strong className="text-slate-200">{complaint.category}</strong></span>
          </div>
          <p className="text-slate-300 font-medium mt-1 truncate">{complaint.title}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Visible Checkbox labelled "Mark work as completed" */}
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isCompletedChecked}
                onChange={(e) => setIsCompletedChecked(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-cyan-500"
              />
              <span className="text-sm font-semibold text-cyan-300">
                Mark work as completed
              </span>
            </label>
            <p className="text-[11px] text-slate-400 mt-1 pl-7">
              Checking this triggers the formal resolution verification workflow. Required completion evidence must be attached.
            </p>
          </div>

          {/* Revealed Required Fields */}
          {isCompletedChecked && (
            <div className="space-y-4 pt-2 transition-all">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Work Performed / Solution Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={workPerformed}
                  onChange={(e) => setWorkPerformed(e.target.value)}
                  placeholder="Detail the technical repair, replacement, or billing ledger correction performed..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Actual Completion Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Resolution Proof (Photo/Document)
                  </label>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-950 border border-dashed border-slate-700 text-xs text-slate-300 hover:border-cyan-500 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{uploading ? 'Uploading...' : evidenceUrl ? 'Change Evidence File' : 'Attach Photo/PDF'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              {evidenceUrl && (
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span className="truncate max-w-xs text-cyan-400">✓ Evidence attached successfully</span>
                  <button
                    type="button"
                    onClick={() => setEvidenceUrl('')}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resolution Notes & Remarks <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Internal notes, transformer load measurements, or follow-up recommendations..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={officerConfirmed}
                    onChange={(e) => setOfficerConfirmed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-cyan-500"
                    required
                  />
                  <span className="text-xs text-slate-300 leading-snug">
                    I confirm that the physical or administrative repair work has been verified according to safety regulations and quality standards.
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isCompletedChecked || submitting || uploading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors disabled:opacity-50 shadow-md shadow-cyan-500/20"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
              <span>Submit Resolution for Verification</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
