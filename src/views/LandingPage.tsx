import React, { useState } from 'react';
import {
  Zap,
  Shield,
  Activity,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Layers,
  FileCheck,
  Phone,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import ElectricGridScene from '../components/3d/ElectricGridScene.js';
import PublicComplaintTracker from './PublicComplaintTracker.js';
import TariffCalculatorView from './TariffCalculatorView.js';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../types/index.js';

interface LandingPageProps {
  onNavigateTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export default function LandingPage({ onNavigateTab, onOpenAuth }: LandingPageProps) {
  const { user, switchDemoRole } = useAuth();
  const [quickTrackRef, setQuickTrackRef] = useState('');
  const [quickTrackMob, setQuickTrackMob] = useState('');

  const demoAccounts: Array<{ role: UserRole; title: string; name: string; jurisdiction: string; desc: string }> = [
    {
      role: 'consumer',
      title: 'Consumer / Citizen',
      name: 'Rajesh Kumar Verma',
      jurisdiction: 'Rampur, Patna (Bihar)',
      desc: 'View 2 connections, meter readings, 140% spike alert, lodge grievances and review photographic resolution proof.',
    },
    {
      role: 'local_admin',
      title: 'Local Panchayat / JE Admin',
      name: 'Anil Sharma (Junior Engineer)',
      jurisdiction: 'Subdivision 4 - Rampur Locality',
      desc: 'Inspect meter photos, assign work to lineworkers, execute the "Mark work as completed" resolution workflow.',
    },
    {
      role: 'district_admin',
      title: 'District Nodal Officer',
      name: 'Er. Priya Sen',
      jurisdiction: 'Patna Electric Circle',
      desc: 'District-wide supervision, approve/verify resolution evidence to grant closure, export CSV audit reports.',
    },
    {
      role: 'state_admin',
      title: 'State Commissioner (IAS)',
      name: 'Vikramaditya Roy, IAS',
      jurisdiction: 'State Electricity Commission (Statewide)',
      desc: 'Statewide analytics, configure gazetted tariff slab rates, review immutable audit trails across all circles.',
    },
  ];

  return (
    <div className="space-y-16 py-8">
      {/* 1. Hero Section with 3D Electric Grid Digital Twin */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-xs font-semibold text-cyan-300">
              <Zap className="w-3.5 h-3.5" />
              <span>Smart Power Governance & Redressal</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15] text-balance">
              End Electricity Billing Shocks. Enforce Rapid Resolution.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              BijliWatch empowers electricity consumers with explainable anomaly detection, mathematical tariff verification, and photographic work resolution proof across Panchayat, District, and State administration tiers.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigateTab(user?.role === 'consumer' ? 'user_dashboard' : 'admin_dashboard')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-400 text-slate-950 font-semibold text-xs sm:text-sm hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-400/20"
              >
                <span>Launch {user?.role === 'consumer' ? 'Consumer Dashboard' : 'Admin Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigateTab('tracker')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs sm:text-sm font-medium text-slate-200 transition-colors"
              >
                <Search className="w-4 h-4 text-cyan-400" />
                <span>Track Existing Ticket</span>
              </button>
            </div>

            {/* Emergency Hotline Trust Marker */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-800 text-xs text-slate-400">
              <Phone className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                24x7 Electrical Hazard & Outage Helpline: <strong className="text-white font-mono text-sm">1912</strong>
              </span>
            </div>
          </div>

          {/* 3D Scene Interactive Viewport */}
          <div className="lg:col-span-7">
            <ElectricGridScene />
          </div>
        </div>
      </section>

      {/* 2. Interactive One-Click Role Switcher (For Evaluators & Reviewers) */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wide block">
                Evaluation & Testing Sandbox
              </span>
              <h2 className="text-base font-bold text-white">Experience All 4 Platform Tiers Instantly</h2>
            </div>
            <p className="text-xs text-slate-400">
              One-click simulation with authentic synthetic domain records
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {demoAccounts.map((acc) => (
              <div
                key={acc.role}
                onClick={() => {
                  switchDemoRole(acc.role);
                  onNavigateTab(acc.role === 'consumer' ? 'user_dashboard' : 'admin_dashboard');
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  user?.role === acc.role
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-cyan-400">{acc.title}</span>
                    {user?.role === acc.role && (
                      <span className="text-[10px] font-mono font-bold bg-cyan-400 text-slate-950 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white">{acc.name}</h4>
                  <p className="text-[11px] font-mono text-slate-400">{acc.jurisdiction}</p>
                  <p className="text-[11px] text-slate-400 leading-snug pt-1">{acc.desc}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-900 flex items-center justify-between text-xs font-semibold text-cyan-400">
                  <span>Switch Role</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Problem vs Solution Contrast Strip */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Transforming Power Grievance Redressal
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Traditional utility complaint portals fail consumers with black-box delays and phantom ticket closures. BijliWatch introduces algorithmic accountability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Explainable Anomaly Alerts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When consumption surges over historical averages, our statistical engine compares billing days, seasonal factors, and neutral leakage without making unsubstantiated tampering claims.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Proof-Backed Resolution</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lineworkers and Junior Engineers must attach photographic evidence and completion notes before tickets can transition. District nodal officers verify proof before formal closure.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Multi-Tier Jurisdiction RBAC</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Panchayat staff only access local cases; District officers manage circle queues; State commissioners review statewide tariffs and system-wide SLAs. No user can self-escalate privileges.
            </p>
          </div>
        </div>
      </section>

      {/* 4. How It Works: 4-Step Process */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wide">Standardized Workflow</span>
            <h2 className="text-xl sm:text-2xl font-bold text-white">The 4-Step Transparent Resolution Cycle</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <span className="text-3xl font-extrabold font-mono text-slate-700">01</span>
              <h4 className="text-sm font-semibold text-white">Consumer Submission</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log reading dials, attach bill or broken wire photos, and pinpoint GPS location via interactive Leaflet map.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-3xl font-extrabold font-mono text-slate-700">02</span>
              <h4 className="text-sm font-semibold text-white">Automated Jurisdiction Triage</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                System routes ticket directly to the authorized local subdivision and assigns designated junior engineer.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-3xl font-extrabold font-mono text-slate-700">03</span>
              <h4 className="text-sm font-semibold text-white">Field Work & Evidence</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Field team executes physical repair, uploads resolution photograph, and checks 'Mark work as completed'.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-3xl font-extrabold font-mono text-slate-700">04</span>
              <h4 className="text-sm font-semibold text-white">District Verification & Closure</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                District Nodal Officer approves proof; consumer is notified with option to reopen if fault persists.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-400">Everything consumers and electricity administrative staff need to know</p>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <h4 className="text-sm font-semibold text-slate-200">How does BijliWatch detect billing anomalies?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              We compute your rolling 3-month baseline average. If a new meter reading jumps beyond configured regulatory thresholds (typically &gt;60%), the engine flags a spike with explainable factors (seasonal cooling, faulty neutral line, or punch error).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <h4 className="text-sm font-semibold text-slate-200">Can an administrator mark a complaint resolved without proof?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              No. Our system enforces server-side validation requiring work performed descriptions, completion timestamps, and photographic evidence. A single checkbox click alone cannot transition a ticket to Resolved.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <h4 className="text-sm font-semibold text-slate-200">Are public complaint status lookups secure?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yes. Public tracking requires both the unique Complaint Reference ID (e.g. BW-2026-94812) and the consumer's registered 10-digit mobile number, preventing unauthorized data harvesting.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
