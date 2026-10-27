import React, { useState, useEffect } from 'react';
import { Calculator, Zap, Info, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export default function TariffCalculatorView() {
  const [units, setUnits] = useState(240);
  const [sanctionedLoad, setSanctionedLoad] = useState(2);
  const [category, setCategory] = useState('Domestic (DS-II)');
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculateEstimate = async (unitsVal: number, loadVal: number, catVal: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/estimate-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          units: unitsVal,
          sanctionedLoadKw: loadVal,
          tariffCategory: catVal,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEstimate(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateEstimate(units, sanctionedLoad, category);
  }, [units, sanctionedLoad, category]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Transparent Electricity Bill Estimator
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Understand the exact slab-by-slab mathematical formula, fixed load charges, and regulatory duty governing your power bill.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs Card */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Tariff Parameters</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Monthly Consumption Units (kWh)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="5000"
                value={units}
                onChange={(e) => setUnits(Math.max(0, Number(e.target.value)))}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm font-mono text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Units</span>
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-2 mt-2">
              {[100, 200, 250, 400, 600].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setUnits(preset)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                    units === preset
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {preset}u
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Sanctioned Load (Kilowatts)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 5].map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => setSanctionedLoad(kw)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                    sanctionedLoad === kw
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {kw} kW
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tariff Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="Domestic (DS-II)">Domestic / Residential (DS-II)</option>
              <option value="Commercial (NDS)">Commercial Non-Domestic (NDS)</option>
              <option value="Agricultural">Agricultural Pump Set (IAS-I)</option>
              <option value="Industrial (LTIS)">Low-Tension Industrial (LTIS)</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Tariffs are synced with Bihar State Electricity Regulatory Commission (BERC) gazette tariff schedules.
            </span>
          </div>
        </div>

        {/* Right Output Card */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Itemized Bill Calculation</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{category}</span>
          </div>

          {estimate && (
            <div className="space-y-5">
              {/* Grand Total Hero Box */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide block">
                    Estimated Bill Amount
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-extrabold font-mono tabular-nums text-white">
                      ₹{estimate.totalEstimatedAmount.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400">approx.</span>
                  </div>
                </div>

                <div className="text-right text-xs font-mono text-slate-400">
                  <div>Load: <strong className="text-slate-200">{sanctionedLoad} kW</strong></div>
                  <div>Units: <strong className="text-cyan-400">{estimate.units} kWh</strong></div>
                </div>
              </div>

              {/* Slabs Breakdown Table */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2.5">
                  Telescopic Slab-by-Slab Breakdown
                </h4>
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                        <th className="py-2.5 px-3 text-left">Consumption Slab</th>
                        <th className="py-2.5 px-3 text-right">Units</th>
                        <th className="py-2.5 px-3 text-right">Rate / Unit</th>
                        <th className="py-2.5 px-3 text-right">Charge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {estimate.slabBreakdown.map((s: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 text-slate-300 font-sans">{s.range}</td>
                          <td className="py-2.5 px-3 text-right text-slate-300">{s.units}</td>
                          <td className="py-2.5 px-3 text-right text-slate-400">₹{s.rate.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right text-slate-200 font-semibold">₹{s.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fixed & Duty Charges Summary */}
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Energy Charges (Slab Subtotal):</span>
                  <span className="font-mono">₹{estimate.energyCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Sanctioned Load Fixed Charge (₹50/kW):</span>
                  <span className="font-mono">₹{estimate.fixedCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Fuel & Power Purchase Adjustment (FPPCA @ ₹0.25/u):</span>
                  <span className="font-mono">₹{estimate.fuelSurcharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>State Electricity Duty (6%):</span>
                  <span className="font-mono">₹{estimate.electricityDuty.toFixed(2)}</span>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[11px] text-slate-500 italic leading-relaxed pt-2">
                * Note: {estimate.disclaimer}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
