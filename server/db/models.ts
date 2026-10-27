import mongoose, { Schema, Document } from 'mongoose';

// 1. User Model
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  mobile: string;
  role: 'consumer' | 'local_admin' | 'district_admin' | 'state_admin';
  state: string;
  district: string;
  locality?: string;
  panchayat?: string;
  consumerNumber?: string;
  department?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    mobile: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['consumer', 'local_admin', 'district_admin', 'state_admin'],
      default: 'consumer',
    },
    state: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    locality: { type: String, trim: true },
    panchayat: { type: String, trim: true },
    consumerNumber: { type: String, trim: true },
    department: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 2. Electricity Connection Model
export interface IElectricityConnection extends Document {
  userId: mongoose.Types.ObjectId;
  consumerNumber: string;
  consumerName: string;
  discom: string;
  tariffCategory: string;
  sanctionedLoadKw: number;
  meterNumber: string;
  meterType: string;
  serviceAddress: string;
  locality: string;
  district: string;
  state: string;
  pincode: string;
  status: 'active' | 'disconnected' | 'temporary_hold';
  createdAt: Date;
}

const ConnectionSchema = new Schema<IElectricityConnection>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    consumerNumber: { type: String, required: true, trim: true, index: true },
    consumerName: { type: String, required: true, trim: true },
    discom: { type: String, required: true, trim: true },
    tariffCategory: { type: String, required: true },
    sanctionedLoadKw: { type: Number, required: true, min: 0.5 },
    meterNumber: { type: String, required: true, trim: true },
    meterType: { type: String, default: 'Smart Digital' },
    serviceAddress: { type: String, required: true },
    locality: { type: String, required: true, index: true },
    district: { type: String, required: true, index: true },
    state: { type: String, required: true, index: true },
    pincode: { type: String, required: true },
    status: { type: String, enum: ['active', 'disconnected', 'temporary_hold'], default: 'active' },
  },
  { timestamps: true }
);

// 3. Meter Reading Model
export interface IMeterReading extends Document {
  connectionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  readingDate: string;
  readingSource: string;
  meterPhotoUrl?: string;
  notes?: string;
  verified: boolean;
  createdAt: Date;
}

const MeterReadingSchema = new Schema<IMeterReading>(
  {
    connectionId: { type: Schema.Types.ObjectId, ref: 'ElectricityConnection', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    previousReading: { type: Number, required: true, min: 0 },
    currentReading: { type: Number, required: true, min: 0 },
    unitsConsumed: { type: Number, required: true, min: 0 },
    readingDate: { type: String, required: true },
    readingSource: { type: String, default: 'Self / Consumer' },
    meterPhotoUrl: { type: String },
    notes: { type: String },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 4. Electricity Bill Model
export interface IElectricityBill extends Document {
  connectionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  billNumber: string;
  billingPeriod: string;
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
  isOfficialVerification: boolean;
  createdAt: Date;
}

const ElectricityBillSchema = new Schema<IElectricityBill>(
  {
    connectionId: { type: Schema.Types.ObjectId, ref: 'ElectricityConnection', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    billNumber: { type: String, required: true, trim: true },
    billingPeriod: { type: String, required: true },
    billingStartDate: { type: String, required: true },
    billingEndDate: { type: String, required: true },
    unitsConsumed: { type: Number, required: true },
    fixedCharges: { type: Number, default: 0 },
    energyCharges: { type: Number, required: true },
    taxesAndDuty: { type: Number, default: 0 },
    subsidiesOrRebates: { type: Number, default: 0 },
    totalAmountDue: { type: Number, required: true },
    dueDate: { type: String, required: true },
    paymentStatus: { type: String, enum: ['Paid', 'Unpaid', 'Overdue'], default: 'Unpaid' },
    billDocumentUrl: { type: String },
    isOfficialVerification: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 5. Complaint Model
export interface IComplaint extends Document {
  referenceId: string;
  userId: mongoose.Types.ObjectId;
  consumerName: string;
  consumerMobile: string;
  connectionId?: mongoose.Types.ObjectId;
  consumerNumber?: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  occurrenceDateTime: string;
  state: string;
  district: string;
  locality: string;
  address: string;
  latitude?: number;
  longitude?: number;
  contactPreference: string;
  evidenceFiles: Array<{ url: string; type: string; title?: string; uploadedAt: string }>;
  status: string;
  assignedTo?: {
    officerId: string;
    officerName: string;
    department: string;
    role: string;
    assignedAt: string;
  };
  resolution?: {
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
  };
  adminNotes: string[];
  userRemarks?: string;
  estimatedResolutionDate?: string;
  auditTrail: Array<{
    status: string;
    changedBy: string;
    role: string;
    timestamp: string;
    comment?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    referenceId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    consumerName: { type: String, required: true },
    consumerMobile: { type: String, required: true, index: true },
    connectionId: { type: Schema.Types.ObjectId, ref: 'ElectricityConnection' },
    consumerNumber: { type: String },
    category: { type: String, required: true, index: true },
    severity: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    occurrenceDateTime: { type: String, required: true },
    state: { type: String, required: true, index: true },
    district: { type: String, required: true, index: true },
    locality: { type: String, required: true, index: true },
    address: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    contactPreference: { type: String, default: 'SMS / WhatsApp' },
    evidenceFiles: [
      {
        url: { type: String, required: true },
        type: { type: String, default: 'image' },
        title: { type: String },
        uploadedAt: { type: String },
      },
    ],
    status: {
      type: String,
      enum: [
        'Submitted',
        'Under Review',
        'Assigned',
        'In Progress',
        'Resolution Submitted',
        'Resolved',
        'More Information Required',
        'Rejected with Reason',
        'Escalated',
        'Reopened',
      ],
      default: 'Submitted',
      index: true,
    },
    assignedTo: {
      officerId: { type: String },
      officerName: { type: String },
      department: { type: String },
      role: { type: String },
      assignedAt: { type: String },
    },
    resolution: {
      workPerformed: { type: String },
      completionDate: { type: String },
      resolutionNotes: { type: String },
      evidenceUrl: { type: String },
      resolvedByOfficerName: { type: String },
      resolvedByOfficerId: { type: String },
      resolvedAt: { type: String },
      verifiedByOfficerId: { type: String },
      verifiedByOfficerName: { type: String },
      verifiedAt: { type: String },
    },
    adminNotes: [{ type: String }],
    userRemarks: { type: String },
    estimatedResolutionDate: { type: String },
    auditTrail: [
      {
        status: { type: String, required: true },
        changedBy: { type: String, required: true },
        role: { type: String, required: true },
        timestamp: { type: String, required: true },
        comment: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// 6. Tariff Configuration Model
export interface ITariffConfig extends Document {
  state: string;
  discom: string;
  tariffCategory: string;
  fixedChargePerKw: number;
  slabs: Array<{ minUnits: number; maxUnits: number | null; ratePerUnit: number }>;
  electricityDutyPercent: number;
  fuelSurchargePerUnit: number;
}

const TariffSchema = new Schema<ITariffConfig>(
  {
    state: { type: String, required: true, index: true },
    discom: { type: String, required: true, index: true },
    tariffCategory: { type: String, required: true },
    fixedChargePerKw: { type: Number, required: true, default: 50 },
    slabs: [
      {
        minUnits: { type: Number, required: true },
        maxUnits: { type: Number, default: null },
        ratePerUnit: { type: Number, required: true },
      },
    ],
    electricityDutyPercent: { type: Number, default: 6 },
    fuelSurchargePerUnit: { type: Number, default: 0.25 },
  },
  { timestamps: true }
);

// 7. In-App Notification Model
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: string;
  complaintId?: string;
  referenceId?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    complaintId: { type: String },
    referenceId: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 8. Audit Log Model
export interface IAuditLog extends Document {
  action: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  targetId: string;
  targetType: string;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    actorId: { type: String, required: true, index: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, required: true },
    targetId: { type: String, required: true, index: true },
    targetType: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const ConnectionModel = mongoose.models.ElectricityConnection || mongoose.model<IElectricityConnection>('ElectricityConnection', ConnectionSchema);
export const MeterReadingModel = mongoose.models.MeterReading || mongoose.model<IMeterReading>('MeterReading', MeterReadingSchema);
export const BillModel = mongoose.models.ElectricityBill || mongoose.model<IElectricityBill>('ElectricityBill', ElectricityBillSchema);
export const ComplaintModel = mongoose.models.Complaint || mongoose.model<IComplaint>('Complaint', ComplaintSchema);
export const TariffModel = mongoose.models.TariffConfig || mongoose.model<ITariffConfig>('TariffConfig', TariffSchema);
export const NotificationModel = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
