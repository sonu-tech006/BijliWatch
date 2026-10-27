import { Router, Response } from 'express';
import { localStore } from '../db/store.js';
import { verifyAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get bills
router.get('/', verifyAuth, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { connectionId } = req.query;

  let bills = localStore.bills.filter((b) => b.userId === userId);
  if (connectionId) {
    bills = bills.filter((b) => b.connectionId === connectionId);
  }

  bills.sort((a, b) => new Date(b.billingEndDate || b.createdAt).getTime() - new Date(a.billingEndDate || a.createdAt).getTime());

  res.json({ bills });
});

// Create / Enter bill
router.post('/', verifyAuth, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const {
      connectionId,
      billNumber,
      billingPeriod,
      billingStartDate,
      billingEndDate,
      unitsConsumed,
      fixedCharges,
      energyCharges,
      taxesAndDuty,
      subsidiesOrRebates,
      totalAmountDue,
      dueDate,
      billDocumentUrl,
    } = req.body;

    if (!connectionId || !billingPeriod || unitsConsumed === undefined || totalAmountDue === undefined || !dueDate) {
      res.status(400).json({ error: 'Connection ID, billing period, units consumed, total amount, and due date are required.' });
      return;
    }

    const newBill = {
      id: `bill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      connectionId,
      userId,
      billNumber: billNumber?.trim() || `BILL-${Date.now().toString().slice(-6)}`,
      billingPeriod: billingPeriod.trim(),
      billingStartDate: billingStartDate || new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      billingEndDate: billingEndDate || new Date().toISOString().split('T')[0],
      unitsConsumed: Number(unitsConsumed),
      fixedCharges: Number(fixedCharges) || 0,
      energyCharges: Number(energyCharges) || Number(totalAmountDue) * 0.85,
      taxesAndDuty: Number(taxesAndDuty) || Number(totalAmountDue) * 0.06,
      subsidiesOrRebates: Number(subsidiesOrRebates) || 0,
      totalAmountDue: Number(totalAmountDue),
      dueDate,
      paymentStatus: 'Unpaid' as const,
      billDocumentUrl: billDocumentUrl || undefined,
      isOfficialVerification: false, // Standard disclosure: user-logged bill, not certified discom direct ledger
      createdAt: new Date().toISOString(),
    };

    localStore.bills.unshift(newBill);

    res.status(201).json({
      message: 'Electricity bill recorded successfully.',
      bill: newBill,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record bill: ' + err.message });
  }
});

// Mark bill payment status
router.patch('/:id/payment', verifyAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // 'Paid' | 'Unpaid'
  const userId = req.user?.id;

  const bill = localStore.bills.find((b) => b.id === id && b.userId === userId);
  if (!bill) {
    res.status(404).json({ error: 'Bill not found.' });
    return;
  }

  bill.paymentStatus = status === 'Paid' ? 'Paid' : 'Unpaid';
  res.json({ message: `Bill status updated to ${bill.paymentStatus}.`, bill });
});

export default router;
