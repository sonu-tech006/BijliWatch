import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, BarChart3, HelpCircle } from 'lucide-react';
import { AnomalyReport } from '../../types/index.js';

interface MonthlyDataPoint {
  date: string;
  period: string;
  units: number;
  source: string;
  verified: boolean;
}

interface EnergyChartProps {
  monthlyData: MonthlyDataPoint[];
  currentUnits: number;
  previousUnits: number;
  deltaPercent: number;
  anomaly?: AnomalyReport | null;
}

export default function EnergyChart({
  monthlyData,
  currentUnits,
  previousUnits,
  deltaPercent,
  anomaly,
}: EnergyChartProps) {
  const maxUnits = Math.max(...monthlyData.map((d) => d.units), 350) * 1.15;

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Current Month Usage</span>
            <BarChart3 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-white">{currentUnits}</span>
            <span className="text-xs text-slate-400">kWh (Units)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Logged from smart meter reading</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Month-over-Month Delta</span>
            <TrendingUp className={`w-4 h-4 ${deltaPercent > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                deltaPercent > 50 ? 'text-amber-400' : deltaPercent > 0 ? 'text-cyan-400' : 'text-emerald-400'
              }`}
            >
              {deltaPercent > 0 ? `+${deltaPercent}%` : `${deltaPercent}%`}
            </span>
            <span className="text-xs text-slate-400">
              ({currentUnits - previousUnits > 0 ? `+${currentUnits - previousUnits}` : currentUnits - previousUnits} units)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Compared with previous billing cycle ({previousUnits} kWh)</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Consumption Pattern</span>
            {anomaly?.isAnomaly ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-base font-semibold ${
                anomaly?.isAnomaly ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {anomaly?.isAnomaly ? 'Unusual Surge Detected' : 'Nominal Within Bounds'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {anomaly?.isAnomaly ? 'Triggered explainable anomaly rule' : 'Consistent with 6-month historical baseline'}
          </p>
        </div>
      </div>

      {/* SVG Bar Chart with Baseline & Anomaly Highlights */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Consumption Timeline & Trend Analysis</h3>
            <p className="text-xs text-slate-400">Monthly units consumed across verified meter recordings</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded-sm bg-cyan-500 inline-block" />
              <span>Normal Usage</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
              <span>Spike Alert</span>
            </div>
          </div>
        </div>

        {/* SVG Render */}
        <div className="w-full h-64 relative flex items-end justify-between gap-4 pt-6 pb-2 px-2 border-b border-slate-800">
          {monthlyData.map((d, idx) => {
            const heightPercent = Math.min(100, Math.round((d.units / maxUnits) * 100));
            const isSpike = anomaly?.isAnomaly && idx === monthlyData.length - 1;

            return (
              <div key={d.date} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                {/* Floating Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-20 font-mono">
                  <strong>{d.units} units</strong> · {d.source}
                </div>

                {/* Units label above bar */}
                <span className="text-[11px] font-mono tabular-nums text-slate-400 mb-1.5">
                  {d.units}
                </span>

                {/* Animated Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[48px] rounded-t-md transition-all duration-500 relative ${
                    isSpike
                      ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-lg shadow-amber-500/20'
                      : 'bg-gradient-to-t from-cyan-700 to-cyan-500 group-hover:from-cyan-600 group-hover:to-cyan-400'
                  }`}
                />

                {/* X-axis label */}
                <span className="text-xs text-slate-400 mt-2 font-medium">
                  {d.period}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explainable Anomaly Breakdown Card */}
      {anomaly && anomaly.isAnomaly && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-amber-300">Explainable Anomaly Detection Report</h4>
                <span className="text-xs font-mono text-amber-400/90 font-medium px-2 py-0.5 rounded bg-amber-500/20">
                  +{anomaly.percentChange}% Delta
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {anomaly.reason}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Observed vs Baseline</span>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Baseline Average:</span>
                    <span className="text-slate-200">{anomaly.baselineUnits} kWh</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Current Reading:</span>
                    <span className="text-amber-400 font-bold">{anomaly.observedUnits} kWh</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Alert Trigger Rule:</span>
                    <span className="text-slate-300">&gt;{anomaly.thresholdPercent}% spike</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Potential Technical Causes</span>
                  <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                    {anomaly.possibleCauses.map((cause, i) => (
                      <li key={i}>{cause}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
                <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  <strong>Ethical Disclose:</strong> An elevated reading does not prove meter tampering or utility fault without physical inspection.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
