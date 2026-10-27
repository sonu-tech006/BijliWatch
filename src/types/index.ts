export type UserRole = 'consumer' | 'local_admin' | 'district_admin' | 'state_admin';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  state: string;
  district: string;
  locality?: string;
  panchayat?: string;
  consumerNumber?: string;
  department?: string;
  active: boolean;
  createdAt?: string;
}

export interface ElectricityConnection {
  id: string;
  _id?: string;
  userId: string;
  consumerNumber: string; // e.g. "1002948193"
  consumerName: string;
  discom: string; // e.g. "SBPDCL - South Bihar Power Distribution", "TPDDL", "BESCOM", "MSEDCL"
  tariffCategory: 'Domestic (DS-II)' | 'Commercial (NDS)' | 'Agricultural' | 'Industrial (LTIS)';
  sanctionedLoadKw: number;
  meterNumber: string;
  meterType: 'Smart Digital' | 'Electronic' | 'Prepaid Smart' | 'Analog';
  serviceAddress: string;
  locality: string;
  district: string;
  state: string;
  pincode: string;
  status: 'active' | 'disconnected' | 'temporary_hold';
  createdAt?: string;
}

export interface MeterReading {
  id: string;
  _id?: string;
  connectionId: string;
  userId: string;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  readingDate: string;
  readingSource: 'Self / Consumer' | 'Utility Lineman' | 'Automated Smart Meter';
  meterPhotoUrl?: string;
  notes?: string;
  verified: boolean;
  createdAt?: string;
}

export interface ElectricityBill {
  id: string;
  _id?: string;
  connectionId: string;
  userId: string;
  billNumber: string;
  billingPeriod: string; // e.g. "Oct 2026"
  billingStartDate: string;
  billingEndDate: string;
  unitsConsumed: number;
  fixedCharges: number;
  energyCharges: number;
  taxesAndDuty: number;
  subsidiesOrRebates: number;
  totalAmountDue: number;
  dueDate: string;
  paymentStatus: 'Paid' | 'Unpaid' | 'Overdue';
  billDocumentUrl?: string;
  isOfficialVerification: boolean; // Must not claim verified unless genuine provider
  createdAt?: string;
}

export type ComplaintCategory =
  | 'Unexpectedly High Bill'
  | 'Incorrect Meter Reading'
  | 'Suspected Faulty Meter'
  | 'Power Outage'
  | 'Voltage Fluctuation'
  | 'Damaged / Exposed Equipment'
  | 'Billing Correction'
  | 'Delay in Service Connection';

export type ComplaintSeverity = 'Low' | 'Medium' | 'High' | 'Emergency / Hazardous';

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolution Submitted'
  | 'Resolved'
  | 'More Information Required'
  | 'Rejected with Reason'
  | 'Escalated'
  | 'Reopened';

export interface ComplaintEvidence {
  url: string;
  type: 'image' | 'pdf' | 'document';
  title?: string;
  uploadedAt: string;
}

export interface ResolutionData {
  workPerformed: string;
  completionDate: string;
  resolutionNotes: string;
  evidenceUrl?: string;
  resolvedByOfficerName: string;
  resolvedByOfficerId: string;
  resolvedAt: string;
  verifiedByOfficerId?: string;
  verifiedByOfficerName?: string;
  verifiedAt?: string;
}

export interface ComplaintAuditEntry {
  status: ComplaintStatus;
  changedBy: string;
  role: string;
  timestamp: string;
  comment?: string;
}

export interface Complaint {
  id: string;
  _id?: string;
  referenceId: string; // e.g. "BW-2026-94812"
  userId: string;
  consumerName: string;
  consumerMobile: string;
  connectionId?: string;
  consumerNumber?: string;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  title: string;
  description: string;
  occurrenceDateTime: string;
  state: string;
  district: string;
  locality: string;
  address: string;
  latitude?: number;
  longitude?: number;
  contactPreference: 'Phone Call' | 'SMS / WhatsApp' | 'Email';
  evidenceFiles: ComplaintEvidence[];
  status: ComplaintStatus;
  assignedTo?: {
    officerId: string;
    officerName: string;
    department: string;
    role: string;
    assignedAt: string;
  };
  resolution?: ResolutionData;
  adminNotes?: string[];
  userRemarks?: string;
  estimatedResolutionDate?: string;
  auditTrail: ComplaintAuditEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface TariffSlab {
  minUnits: number;
  maxUnits: number | null; // null means above
  ratePerUnit: number;
}

export interface TariffConfiguration {
  id: string;
  state: string;
  discom: string;
  tariffCategory: string;
  fixedChargePerKw: number;
  slabs: TariffSlab[];
  electricityDutyPercent: number;
  fuelSurchargePerUnit: number;
  updatedAt: string;
}

export interface InAppNotification {
  id: string;
  _id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  complaintId?: string;
  referenceId?: string;
  read: boolean;
  createdAt: string;
}

export interface AnomalyReport {
  isAnomaly: boolean;
  type: 'SPIKE' | 'DROP' | 'NEGATIVE_DELTA' | 'NORMAL';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  observedUnits: number;
  baselineUnits: number;
  percentChange: number;
  thresholdPercent: number;
  billingDays: number;
  normalizedDailyUsage: number;
  reason: string;
  possibleCauses: string[];
  recommendedAction: string;
}
