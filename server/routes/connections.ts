import { Router, Response } from 'express';
import { localStore } from '../db/store.js';
import { verifyAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get connections for current logged-in user
router.get('/', verifyAuth, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const connections = localStore.connections.filter((c) => c.userId === userId && c.status !== 'disconnected');
  res.json({ connections });
});

// Add new electricity connection
router.post('/', verifyAuth, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const {
      consumerNumber,
      consumerName,
      discom,
      tariffCategory,
      sanctionedLoadKw,
      meterNumber,
      meterType,
      serviceAddress,
      locality,
      district,
      state,
      pincode,
    } = req.body;

    if (!consumerNumber || !consumerName || !discom || !serviceAddress) {
      res.status(400).json({ error: 'Consumer number, name, distribution company, and service address are required.' });
      return;
    }

    const newConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      consumerNumber: consumerNumber.trim(),
      consumerName: consumerName.trim(),
      discom: discom.trim(),
      tariffCategory: tariffCategory || 'Domestic (DS-II)',
      sanctionedLoadKw: Number(sanctionedLoadKw) || 2.0,
      meterNumber: meterNumber ? meterNumber.trim() : `MTR-${Math.floor(100000 + Math.random() * 900000)}`,
      meterType: meterType || 'Smart Digital',
      serviceAddress: serviceAddress.trim(),
      locality: locality?.trim() || req.user?.locality || 'Rampur',
      district: district?.trim() || req.user?.district || 'Patna',
      state: state?.trim() || req.user?.state || 'Bihar',
      pincode: pincode?.trim() || '800001',
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    };

    localStore.connections.unshift(newConnection);

    res.status(201).json({
      message: 'Electricity connection registered successfully.',
      connection: newConnection,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create connection: ' + err.message });
  }
});

// Update connection
router.put('/:id', verifyAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const index = localStore.connections.findIndex((c) => c.id === id && c.userId === userId);
  if (index === -1) {
    res.status(404).json({ error: 'Connection not found or unauthorized.' });
    return;
  }

  const existing = localStore.connections[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    userId: existing.userId, // immutable ownership
  };

  localStore.connections[index] = updated;
  res.json({ message: 'Connection updated successfully.', connection: updated });
});

// Deactivate connection
router.delete('/:id', verifyAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const index = localStore.connections.findIndex((c) => c.id === id && c.userId === userId);
  if (index === -1) {
    res.status(404).json({ error: 'Connection not found or unauthorized.' });
    return;
  }

  localStore.connections[index].status = 'disconnected';
  res.json({ message: 'Connection deactivated successfully.' });
});

export default router;
