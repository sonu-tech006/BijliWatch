import React from 'react';
import { Phone, Shield, Zap, Info, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800 bg-slate-950 text-slate-400 py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span className="text-base font-bold text-white">BijliWatch</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Smart Electricity Usage, Explainable Anomaly Detection & Multi-Tier Grievance Redressal Architecture.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wide mb-3">
              Consumer Helplines
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Toll-Free Emergency: <strong>1912</strong></span>
              </div>
              <p className="text-[11px] text-slate-500">24x7 Outage & Hazard Control Centre</p>
              <div className="text-slate-400 pt-1">
                SMS Support: <span className="font-mono text-slate-300">BIJLI &lt;Consumer No&gt; to 56161</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wide mb-3">
              Governance Framework
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>Panchayat & Ward Resolution Standards</li>
              <li>District Electricity Grievance SLA</li>
              <li>State Regulatory Tariff Directives</li>
              <li>Public Audit Trail Accountability</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wide mb-3">
              Security & Compliance
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-emerald-400">
                <Shield className="w-4 h-4" />
                <span>Encrypted RBAC Authorization</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Immutable audit logs prevent unauthorized status tampering or privileged role self-assignment.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} BijliWatch. Public Utility Monitoring Platform.</p>
          <div className="flex items-center gap-6">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
            <span>Citizen Charter</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
