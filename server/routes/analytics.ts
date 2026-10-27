import { Router, Response } from 'express';
import { localStore } from '../db/store.js';
import { verifyAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Consumption analytics for user
router.get('/consumption', verifyAuth, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { connectionId } = req.query;

  let readings = localStore.readings.filter((r) => r.userId === userId);
  if (connectionId) {
    readings = readings.filter((r) => r.connectionId === connectionId);
  }

  // Sort ascending by date for chart
  readings.sort((a, b) => new Date(a.readingDate).getTime() - new Date(b.readingDate).getTime());

  // Aggregate monthly data
  const monthlyData = readings.map((r) => ({
    date: r.readingDate,
    period: new Date(r.readingDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    units: r.unitsConsumed,
    source: r.readingSource,
    verified: r.verified,
  }));

  // Calculate current vs previous month
  const totalReadings = readings.length;
  const currentUnits = totalReadings > 0 ? readings[totalReadings - 1].unitsConsumed : 0;
  const previousUnits = totalReadings > 1 ? readings[totalReadings - 2].unitsConsumed : 0;
  const deltaPercent =
    previousUnits > 0 ? (((currentUnits - previousUnits) / previousUnits) * 100).toFixed(1) : '0.0';

  // Anomaly check
  let anomaly: any = null;
  if (totalReadings >= 3) {
    const historicalSlice = readings.slice(0, totalReadings - 1);
    const baseline =
      historicalSlice.reduce((sum, r) => sum + r.unitsConsumed, 0) / historicalSlice.length;
    const percentAbove = ((currentUnits - baseline) / baseline) * 100;

    if (percentAbove > 60) {
      anomaly = {
        isAnomaly: true,
        type: 'SPIKE',
        severity: percentAbove > 100 ? 'high' : 'moderate',
        observedUnits: currentUnits,
        baselineUnits: Math.round(baseline),
        percentChange: Number(percentAbove.toFixed(1)),
        thresholdPercent: 60,
        billingDays: 30,
        normalizedDailyUsage: Number((currentUnits / 30).toFixed(2)),
        reason: `Current consumption of ${currentUnits} units is ${percentAbove.toFixed(1)}% higher than your historical baseline (${Math.round(baseline)} units).`,
        possibleCauses: [
          'High ambient summer/winter cooling or heating load',
          'Faulty line earthing or neutral wire leakage',
          'Mechanical friction or electronic pulse drift in meter',
          'Human recording/punching error in meter register',
        ],
        recommendedAction:
          'Conduct a physical meter verification. If high billing persists without high appliance load, lodge a high-bill investigation request with photograph proof.',
      };
    }
  }

  res.json({
    monthlyData,
    currentUnits,
    previousUnits,
    deltaPercent: Number(deltaPercent),
    anomaly,
  });
});

// Transparent Bill Estimator
router.post('/estimate-bill', (req: AuthRequest, res: Response) => {
  const { units, sanctionedLoadKw = 2, tariffCategory = 'Domestic (DS-II)' } = req.body;

  const unitsNum = Number(units);
  if (isNaN(unitsNum) || unitsNum < 0) {
    res.status(400).json({ error: 'Please enter a valid positive number of units.' });
    return;
  }

  // Tariff configuration (defaults or from store)
  const tariff = localStore.tariffs[0] || {
    fixedChargePerKw: 50,
    slabs: [
      { minUnits: 0, maxUnits: 100, ratePerUnit: 6.10 },
      { minUnits: 101, maxUnits: 200, ratePerUnit: 6.95 },
      { minUnits: 201, maxUnits: 300, ratePerUnit: 7.75 },
      { minUnits: 301, maxUnits: null, ratePerUnit: 8.50 },
    ],
    electricityDutyPercent: 6.0,
    fuelSurchargePerUnit: 0.25,
  };

  const fixedCharge = Number(sanctionedLoadKw) * tariff.fixedChargePerKw;

  let remaining = unitsNum;
  let energyCharge = 0;
  const slabBreakdown = [];

  for (const slab of tariff.slabs) {
    if (remaining <= 0) break;
    const slabSpan = slab.maxUnits ? slab.maxUnits - slab.minUnits + (slab.minUnits === 0 ? 0 : 1) : remaining;
    const unitsInThisSlab = Math.min(remaining, slabSpan);

    const charge = unitsInThisSlab * slab.ratePerUnit;
    energyCharge += charge;
    remaining -= unitsInThisSlab;

    slabBreakdown.push({
      range: slab.maxUnits ? `${slab.minUnits}-${slab.maxUnits} units` : `Above ${slab.minUnits} units`,
      units: unitsInThisSlab,
      rate: slab.ratePerUnit,
      amount: Number(charge.toFixed(2)),
    });
  }

  const fuelSurcharge = Number((unitsNum * tariff.fuelSurchargePerUnit).toFixed(2));
  const subtotal = fixedCharge + energyCharge + fuelSurcharge;
  const electricityDuty = Number(((subtotal * tariff.electricityDutyPercent) / 100).toFixed(2));
  const totalEstimatedAmount = Math.round(subtotal + electricityDuty);

  res.json({
    units: unitsNum,
    sanctionedLoadKw: Number(sanctionedLoadKw),
    tariffCategory,
    fixedCharge,
    energyCharge: Number(energyCharge.toFixed(2)),
    fuelSurcharge,
    electricityDuty,
    totalEstimatedAmount,
    slabBreakdown,
    disclaimer:
      'This estimate is generated using approved regulatory tariff formulas. Actual official utility bills may include municipal surcharges, arrears, or power factor penalties.',
  });
});

export default router;
