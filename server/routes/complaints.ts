import { Router, Request, Response } from 'express';
import { localStore } from '../db/store.js';
import { verifyAuth, requireRole, auditLog, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Public complaint tracking: requires complaint reference + consumer mobile for safe verification
router.get('/public-track', (req: Request, res: Response) => {
  const { referenceId, mobile } = req.query;

  if (!referenceId || !mobile) {
    res.status(400).json({ error: 'Complaint Reference ID and registered Mobile Number are required.' });
    return;
  }

  const cleanRef = String(referenceId).trim().toUpperCase();
  const cleanMob = String(mobile).replace(/\D/g, '').slice(-10);

  const complaint = localStore.complaints.find((c) => {
    const cRef = c.referenceId.toUpperCase();
    const cMob = c.consumerMobile.replace(/\D/g, '').slice(-10);
    return cRef === cleanRef && cMob === cleanMob;
  });

  if (!complaint) {
    res.status(404).json({ error: 'No matching complaint found. Please verify the Reference ID and Mobile Number.' });
    return;
  }

  // Return public-safe tracking view (redact private notes)
  res.json({
    complaint: {
      referenceId: complaint.referenceId,
      category: complaint.category,
      severity: complaint.severity,
      title: complaint.title,
      description: complaint.description,
      occurrenceDateTime: complaint.occurrenceDateTime,
      status: complaint.status,
      state: complaint.state,
      district: complaint.district,
      locality: complaint.locality,
      assignedDepartment: complaint.assignedTo?.department,
      assignedOfficer: complaint.assignedTo?.officerName,
      estimatedResolutionDate: complaint.estimatedResolutionDate,
      resolution: complaint.resolution
        ? {
            workPerformed: complaint.resolution.workPerformed,
            completionDate: complaint.resolution.completionDate,
            evidenceUrl: complaint.resolution.evidenceUrl,
            resolvedAt: complaint.resolution.resolvedAt,
            verifiedAt: complaint.resolution.verifiedAt,
          }
        : undefined,
      auditTrail: complaint.auditTrail,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
    },
  });
});

// List complaints based on authenticated user role and jurisdiction
router.get('/', verifyAuth, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  let complaints = [...localStore.complaints];

  if (user.role === 'consumer') {
    complaints = complaints.filter((c) => c.userId === user.id);
  } else if (user.role === 'local_admin') {
    // Local / Panchayat jurisdiction: filter by locality or panchayat
    const loc = user.locality?.toLowerCase() || '';
    complaints = complaints.filter(
      (c) => c.locality.toLowerCase().includes(loc) || (c.district.toLowerCase() === user.district.toLowerCase())
    );
  } else if (user.role === 'district_admin') {
    // District jurisdiction
    complaints = complaints.filter(
      (c) => c.district.toLowerCase() === user.district.toLowerCase()
    );
  } else if (user.role === 'state_admin') {
    // State jurisdiction
    complaints = complaints.filter(
      (c) => c.state.toLowerCase() === user.state.toLowerCase()
    );
  }

  // Support query filters
  const { status, category, severity, search } = req.query;
  if (status && status !== 'all') {
    complaints = complaints.filter((c) => c.status === status);
  }
  if (category && category !== 'all') {
    complaints = complaints.filter((c) => c.category === category);
  }
  if (severity && severity !== 'all') {
    complaints = complaints.filter((c) => c.severity === severity);
  }
  if (search) {
    const q = String(search).toLowerCase();
    complaints = complaints.filter(
      (c) =>
        c.referenceId.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.consumerName.toLowerCase().includes(q) ||
        c.locality.toLowerCase().includes(q)
    );
  }

  // Sort by recent first
  complaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ complaints, total: complaints.length });
});

// Get single complaint details
router.get('/:id', verifyAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  const complaint = localStore.complaints.find((c) => c.id === id || c.referenceId === id);
  if (!complaint) {
    res.status(404).json({ error: 'Complaint not found.' });
    return;
  }

  // Role jurisdiction check
  if (user.role === 'consumer' && complaint.userId !== user.id) {
    res.status(403).json({ error: 'Unauthorized to view this complaint.' });
    return;
  }

  res.json({ complaint });
});

// Submit new complaint (Consumers & Citizens)
router.post('/', verifyAuth, (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      connectionId,
      consumerNumber,
      category,
      severity,
      title,
      description,
      occurrenceDateTime,
      state,
      district,
      locality,
      address,
      latitude,
      longitude,
      contactPreference,
      evidenceFiles,
    } = req.body;

    if (!category || !severity || !title || !description || !address) {
      res.status(400).json({ error: 'Category, severity, title, detailed description, and address are required.' });
      return;
    }

    // Generate unique reference: BW-YYYY-XXXXX
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const referenceId = `BW-${year}-${randomSuffix}`;

    const newComplaint = {
      id: `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      referenceId,
      userId: user.id,
      consumerName: user.name,
      consumerMobile: (req.body.consumerMobile || user.email).toString(),
      connectionId: connectionId || undefined,
      consumerNumber: consumerNumber || undefined,
      category,
      severity,
      title: title.trim(),
      description: description.trim(),
      occurrenceDateTime: occurrenceDateTime || new Date().toISOString(),
      state: state?.trim() || user.state || 'Bihar',
      district: district?.trim() || user.district || 'Patna',
      locality: locality?.trim() || user.locality || 'Rampur',
      address: address.trim(),
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      contactPreference: contactPreference || 'SMS / WhatsApp',
      evidenceFiles: Array.isArray(evidenceFiles) ? evidenceFiles : [],
      status: 'Submitted' as const,
      adminNotes: [],
      auditTrail: [
        {
          status: 'Submitted' as const,
          changedBy: user.name,
          role: user.role,
          timestamp: new Date().toISOString(),
          comment: 'Complaint registered successfully by consumer.',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStore.complaints.unshift(newComplaint);

    // Add in-app confirmation notification
    localStore.notifications.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      title: 'Complaint Registered Successfully',
      message: `Your complaint (${referenceId}) has been logged under ${category}. Track status live on your dashboard.`,
      type: 'info',
      complaintId: newComplaint.id,
      referenceId,
      read: false,
      createdAt: new Date().toISOString(),
    });

    auditLog('COMPLAINT_CREATED', user, referenceId, 'Complaint', { category, severity, title });

    res.status(201).json({
      message: 'Complaint submitted successfully.',
      referenceId,
      complaint: newComplaint,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit complaint: ' + err.message });
  }
});

// Assign complaint to local staff / lineworker (Local Admin or District Admin)
router.post('/:id/assign', verifyAuth, requireRole('local_admin', 'district_admin', 'state_admin'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const { officerName, department, estimatedResolutionDate, notes } = req.body;

  const complaint = localStore.complaints.find((c) => c.id === id || c.referenceId === id);
  if (!complaint) {
    res.status(404).json({ error: 'Complaint not found.' });
    return;
  }

  complaint.status = 'Assigned';
  complaint.assignedTo = {
    officerId: user.id,
    officerName: officerName || user.name,
    department: department || user.department || 'Local Distribution Unit',
    role: user.role,
    assignedAt: new Date().toISOString(),
  };

  if (estimatedResolutionDate) {
    complaint.estimatedResolutionDate = estimatedResolutionDate;
  }

  if (notes) {
    complaint.adminNotes = complaint.adminNotes || [];
    complaint.adminNotes.push(`[${new Date().toLocaleDateString()}] ${notes}`);
  }

  complaint.auditTrail.push({
    status: 'Assigned',
    changedBy: user.name,
    role: user.role,
    timestamp: new Date().toISOString(),
    comment: `Assigned to ${complaint.assignedTo.officerName} (${complaint.assignedTo.department}).`,
  });

  complaint.updatedAt = new Date().toISOString();

  // Notify consumer
  localStore.notifications.unshift({
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: complaint.userId,
    title: 'Grievance Assigned to Field Officer',
    message: `Your complaint (${complaint.referenceId}) has been assigned to ${complaint.assignedTo.officerName}. Target resolution: ${complaint.estimatedResolutionDate || '3 working days'}.`,
    type: 'info',
    complaintId: complaint.id,
    referenceId: complaint.referenceId,
    read: false,
    createdAt: new Date().toISOString(),
  });

  auditLog('COMPLAINT_ASSIGNED', user, complaint.referenceId, 'Complaint', { assignedTo: complaint.assignedTo });

  res.json({ message: 'Complaint assigned successfully.', complaint });
});

// Update complaint progress / status (In Progress, More Info, Escalated)
router.patch('/:id/status', verifyAuth, requireRole('local_admin', 'district_admin', 'state_admin'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const { status, note } = req.body;

  // Security rule: Admin CANNOT directly set status to 'Resolved' through this route!
  // Resolution requires the completion workflow with evidence and verification.
  if (status === 'Resolved') {
    res.status(400).json({
      error: 'Complaints cannot be marked Resolved directly. You must complete the formal resolution workflow with completion evidence and verification.',
    });
    return;
  }

  const complaint = localStore.complaints.find((c) => c.id === id || c.referenceId === id);
  if (!complaint) {
    res.status(404).json({ error: 'Complaint not found.' });
    return;
  }

  const prevStatus = complaint.status;
  complaint.status = status;

  if (note) {
    complaint.adminNotes = complaint.adminNotes || [];
    complaint.adminNotes.push(`[${new Date().toLocaleDateString()} - ${status}] ${note}`);
  }

  complaint.auditTrail.push({
    status,
    changedBy: user.name,
    role: user.role,
    timestamp: new Date().toISOString(),
    comment: note || `Status transitioned from ${prevStatus} to ${status}.`,
  });

  complaint.updatedAt = new Date().toISOString();

  // Notify consumer
  localStore.notifications.unshift({
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: complaint.userId,
    title: `Complaint Status: ${status}`,
    message: `Grievance ${complaint.referenceId} is now '${status}'. ${note ? `Note: ${note}` : ''}`,
    type: status === 'More Information Required' ? 'warning' : 'info',
    complaintId: complaint.id,
    referenceId: complaint.referenceId,
    read: false,
    createdAt: new Date().toISOString(),
  });

  auditLog('STATUS_CHANGE', user, complaint.referenceId, 'Complaint', { prevStatus, newStatus: status, note });

  res.json({ message: `Status updated to ${status}.`, complaint });
});

// Submit Resolution Workflow (Authorized Admin: Local or District)
// Triggered when "Mark work as completed" is checked
router.post('/:id/resolve', verifyAuth, requireRole('local_admin', 'district_admin', 'state_admin'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const { workPerformed, completionDate, resolutionNotes, evidenceUrl, officerConfirmed } = req.body;

  if (!workPerformed || !completionDate || !resolutionNotes || officerConfirmed !== true) {
    res.status(400).json({
      error: 'All fields are mandatory: Work performed description, completion date, resolution notes, and officer confirmation checkbox.',
    });
    return;
  }

  const complaint = localStore.complaints.find((c) => c.id === id || c.referenceId === id);
  if (!complaint) {
    res.status(404).json({ error: 'Complaint not found.' });
    return;
  }

  complaint.resolution = {
    workPerformed: workPerformed.trim(),
    completionDate: completionDate.trim(),
    resolutionNotes: resolutionNotes.trim(),
    evidenceUrl: evidenceUrl || undefined,
    resolvedByOfficerName: user.name,
    resolvedByOfficerId: user.id,
    resolvedAt: new Date().toISOString(),
  };

  // Explicit status set to "Resolution Submitted" (Pending district review or instant if district/state officer)
  if (user.role === 'district_admin' || user.role === 'state_admin') {
    complaint.status = 'Resolved';
    complaint.resolution.verifiedByOfficerId = user.id;
    complaint.resolution.verifiedByOfficerName = user.name;
    complaint.resolution.verifiedAt = new Date().toISOString();
  } else {
    complaint.status = 'Resolution Submitted';
  }

  complaint.auditTrail.push({
    status: complaint.status,
    changedBy: user.name,
    role: user.role,
    timestamp: new Date().toISOString(),
    comment: `Work completed by ${user.name}: ${workPerformed.slice(0, 100)}... Evidence attached.`,
  });

  complaint.updatedAt = new Date().toISOString();

  // Notify consumer
  localStore.notifications.unshift({
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: complaint.userId,
    title: complaint.status === 'Resolved' ? 'Grievance Resolved' : 'Resolution Submitted by Field Officer',
    message: `Resolution details submitted for ${complaint.referenceId}. ${workPerformed}`,
    type: 'success',
    complaintId: complaint.id,
    referenceId: complaint.referenceId,
    read: false,
    createdAt: new Date().toISOString(),
  });

  auditLog('RESOLUTION_SUBMITTED', user, complaint.referenceId, 'Complaint', {
    status: complaint.status,
    workPerformed,
    evidenceUrl,
  });

  res.json({
    message: complaint.status === 'Resolved' ? 'Complaint successfully resolved.' : 'Resolution submitted for district verification.',
    complaint,
  });
});

// District / State Verification & Approval of Resolution
router.post('/:id/verify-resolution', verifyAuth, requireRole('district_admin', 'state_admin'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const { approved, rejectionReason } = req.body;

  const complaint = localStore.complaints.find((c) => c.id === id || c.referenceId === id);
  if (!complaint) {
    res.status(404).json({ error: 'Complaint not found.' });
    return;
  }

  if (complaint.status !== 'Resolution Submitted') {
    res.status(400).json({ error: 'Can only verify complaints in "Resolution Submitted" state.' });
    return;
  }

  if (approved) {
    complaint.status = 'Resolved';
    if (complaint.resolution) {
      complaint.resolution.verifiedByOfficerId = user.id;
      complaint.resolution.verifiedByOfficerName = user.name;
      complaint.resolution.verifiedAt = new Date().toISOString();
    }

    complaint.auditTrail.push({
      status: 'Resolved',
      changedBy: user.name,
      role: user.role,
      timestamp: new Date().toISOString(),
      comment: 'Resolution proof verified and approved by District Administration.',
    });

    localStore.notifications.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: complaint.userId,
      title: 'Complaint Formally Resolved & Verified',
      message: `Grievance ${complaint.referenceId} has been verified and closed by ${user.name}.`,
      type: 'success',
      complaintId: complaint.id,
      referenceId: complaint.referenceId,
      read: false,
      createdAt: new Date().toISOString(),
    });

    auditLog('RESOLUTION_VERIFIED', user, complaint.referenceId, 'Complaint', { approved: true });
  } else {
    // Return for additional work or evidence
    complaint.status = 'In Progress';
    complaint.adminNotes = complaint.adminNotes || [];
    complaint.adminNotes.push(`[Resolution Returned by ${user.name}] Reason: ${rejectionReason || 'Insufficient photographic proof or incomplete repair.'}`);

    complaint.auditTrail.push({
      status: 'In Progress',
      changedBy: user.name,
      role: user.role,
      timestamp: new Date().toISOString(),
      comment: `Resolution returned by District Admin. Reason: ${rejectionReason || 'Incomplete work'}`,
    });

    auditLog('RESOLUTION_REJECTED', user, complaint.referenceId, 'Complaint', { rejectionReason });
  }

  complaint.updatedAt = new Date().toISOString();
  res.json({ message: approved ? 'Resolution approved.' : 'Resolution returned for remediation.', complaint });
});

// Reopen / Appeal by consumer
router.post('/:id/reopen', verifyAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const { reason } = req.body;

  const complaint = localStore.complaints.find((c) => c.id === id || c.referenceId === id);
  if (!complaint) {
    res.status(404).json({ error: 'Complaint not found.' });
    return;
  }

  if (complaint.userId !== user.id) {
    res.status(403).json({ error: 'Unauthorized to reopen this complaint.' });
    return;
  }

  if (complaint.status !== 'Resolved') {
    res.status(400).json({ error: 'Only resolved complaints can be reopened.' });
    return;
  }

  complaint.status = 'Reopened';
  complaint.userRemarks = reason || 'Issue recurs or resolution was unsatisfactory.';

  complaint.auditTrail.push({
    status: 'Reopened',
    changedBy: user.name,
    role: user.role,
    timestamp: new Date().toISOString(),
    comment: `Consumer reopened complaint: ${complaint.userRemarks}`,
  });

  complaint.updatedAt = new Date().toISOString();

  auditLog('COMPLAINT_REOPENED', user, complaint.referenceId, 'Complaint', { reason: complaint.userRemarks });

  res.json({ message: 'Complaint has been reopened for administrative review.', complaint });
});

export default router;
