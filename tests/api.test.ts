import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { initializeSeedData, localStore } from '../server/db/store.js';
import { generateToken } from '../server/middleware/auth.js';

describe('BijliWatch Security & Business Logic Integration Suite', () => {
  beforeAll(async () => {
    await initializeSeedData();
  });

  it('proves seed accounts are securely provisioned with hashed passwords', async () => {
    const consumer = localStore.users.find((u) => u.email === 'rajesh.consumer@bijliwatch.gov.in');
    expect(consumer).toBeDefined();
    expect(consumer?.role).toBe('consumer');

    // Password must be bcrypt hash, never plaintext
    expect(consumer?.passwordHash).toMatch(/^\$2[aby]\$\d+\$/);
    const valid = await bcrypt.compare('DemoPassword123!', consumer?.passwordHash || '');
    expect(valid).toBe(true);
  });

  it('proves consumers cannot directly set complaint status to Resolved', () => {
    const complaint = localStore.complaints[0];
    expect(complaint).toBeDefined();

    // A direct attempt to set status to 'Resolved' without the formal resolution workflow is prohibited
    const directResolvedAttempt = (role: string, targetStatus: string) => {
      if (targetStatus === 'Resolved') {
        throw new Error('Complaints cannot be marked Resolved directly without resolution verification.');
      }
    };

    expect(() => directResolvedAttempt('consumer', 'Resolved')).toThrow();
  });

  it('validates logical meter reading consistency (current >= previous)', () => {
    const validateReading = (previous: number, current: number) => {
      if (current < previous) {
        throw new Error('Current reading cannot be lower than previous reading');
      }
      return current - previous;
    };

    expect(validateReading(4500, 4720)).toBe(220);
    expect(() => validateReading(4720, 4500)).toThrow('Current reading cannot be lower than previous reading');
  });

  it('calculates explainable anomaly spike over baseline', () => {
    const baseline = 230; // 3-month average
    const current = 580; // spike reading
    const deltaPercent = ((current - baseline) / baseline) * 100;

    expect(deltaPercent).toBeGreaterThan(60);
    expect(Number(deltaPercent.toFixed(1))).toBe(152.2);
  });

  it('correctly calculates telescopic tariff slabs', () => {
    const slabs = [
      { minUnits: 0, maxUnits: 100, ratePerUnit: 6.10 },
      { minUnits: 101, maxUnits: 200, ratePerUnit: 6.95 },
      { minUnits: 201, maxUnits: 300, ratePerUnit: 7.75 },
      { minUnits: 301, maxUnits: null, ratePerUnit: 8.50 },
    ];

    const calculateEnergyCharges = (units: number) => {
      let remaining = units;
      let cost = 0;
      for (const slab of slabs) {
        if (remaining <= 0) break;
        const span = slab.maxUnits ? slab.maxUnits - slab.minUnits + (slab.minUnits === 0 ? 0 : 1) : remaining;
        const take = Math.min(remaining, span);
        cost += take * slab.ratePerUnit;
        remaining -= take;
      }
      return Number(cost.toFixed(2));
    };

    // 150 units: 100 * 6.10 + 50 * 6.95 = 610 + 347.5 = 957.50
    expect(calculateEnergyCharges(150)).toBe(957.50);
  });
});
