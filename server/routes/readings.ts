import { Router, Response } from 'express';
import { localStore } from '../db/store.js';
import { verifyAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get readings for a connection or user
router.get('/', verifyAuth, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { connectionId } = req.query;

  let readings = localStore.readings.filter((r) => r.userId === userId);
  if (connectionId) {
    readings = readings.filter((r) => r.connectionId === connectionId);
  }

  // Sort descending by readingDate
  readings.sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime());

  res.json({ readings });
});

// Record new meter reading
router.post('/', verifyAuth, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { connectionId, previousReading, currentReading, readingDate, readingSource, meterPhotoUrl, notes } = req.body;

    if (!connectionId || previousReading === undefined || currentReading === undefined || !readingDate) {
      res.status(400).json({ error: 'Connection ID, previous reading, current reading, and reading date are required.' });
      return;
    }

    const prev = Number(previousReading);
    const curr = Number(currentReading);

    if (isNaN(prev) || isNaN(curr) || prev < 0 || curr < 0) {
      res.status(400).json({ error: 'Meter readings must be valid positive numbers.' });
      return;
    }

    // Logical consistency validation: Current reading must be >= Previous reading
    if (curr < prev) {
      res.status(400).json({
        error: `Logically inconsistent reading: Current reading (${curr}) cannot be lower than previous recorded reading (${prev}). If the meter rolled over or was replaced, please flag a meter replacement ticket.`,
      });
      return;
    }

    const unitsConsumed = curr - prev;

    const newReading = {
      id: `rdg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      connectionId,
      userId,
      previousReading: prev,
      currentReading: curr,
      unitsConsumed,
      readingDate,
      readingSource: readingSource || 'Self / Consumer',
      meterPhotoUrl: meterPhotoUrl || undefined,
      notes: notes || undefined,
      verified: true,
      createdAt: new Date().toISOString(),
    };

    localStore.readings.unshift(newReading);

    // Compute historical baseline to detect spikes
    const pastReadings = localStore.readings.filter(
      (r) => r.connectionId === connectionId && r.id !== newReading.id
    );

    let anomalyDetected = false;
    let anomalyMessage = '';

    if (pastReadings.length >= 2) {
      const avgUnits =
        pastReadings.slice(0, 3).reduce((sum, r) => sum + r.unitsConsumed, 0) /
        Math.min(pastReadings.length, 3);

      const percentChange = ((unitsConsumed - avgUnits) / avgUnits) * 100;

      if (percentChange > 65) {
        anomalyDetected = true;
        anomalyMessage = `Consumption spike: ${unitsConsumed} units is +${percentChange.toFixed(1)}% above your 3-month baseline (${Math.round(avgUnits)} units).`;

        // Create alert notification
        localStore.notifications.unshift({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId,
          title: 'Unusual Consumption Spike Detected',
          message: `${anomalyMessage} BijliWatch recommends verifying physical meter reading or filing a dispute if unexpected.`,
          type: 'alert',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    res.status(201).json({
      message: 'Meter reading recorded successfully.',
      reading: newReading,
      anomalyDetected,
      anomalyMessage,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record meter reading: ' + err.message });
  }
});

export default router;
