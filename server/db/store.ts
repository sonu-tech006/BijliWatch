import bcrypt from 'bcryptjs';
import { isDbConnected } from './connection.js';
import {
  UserModel,
  ConnectionModel,
  MeterReadingModel,
  BillModel,
  ComplaintModel,
  TariffModel,
  NotificationModel,
  AuditLogModel,
} from './models.js';

// In-memory persistent caches for ultra-fast, zero-breakage development/demo
export interface LocalStoreState {
  users: any[];
  connections: any[];
  readings: any[];
  bills: any[];
  complaints: any[];
  tariffs: any[];
  notifications: any[];
  auditLogs: any[];
}

export const localStore: LocalStoreState = {
  users: [],
  connections: [],
  readings: [],
  bills: [],
  complaints: [],
  tariffs: [],
  notifications: [],
  auditLogs: [],
};

let isSeeded = false;

export async function initializeSeedData() {
  if (isSeeded) return;

  const defaultPassword = 'DemoPassword123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Initial Users
  const seedUsers = [
    {
      id: 'usr_consumer_1',
      _id: 'usr_consumer_1',
      name: 'Rajesh Kumar Verma',
      email: 'rajesh.consumer@bijliwatch.gov.in',
      mobile: '+91 98765 43210',
      passwordHash,
      role: 'consumer',
      state: 'Bihar',
      district: 'Patna',
      locality: 'Rampur',
      panchayat: 'Rampur Gram Panchayat',
      consumerNumber: '1002948193',
      active: true,
      createdAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'usr_local_1',
      _id: 'usr_local_1',
      name: 'Anil Sharma (Junior Engineer)',
      email: 'anil.panchayat@bijliwatch.gov.in',
      mobile: '+91 98765 11223',
      passwordHash,
      role: 'local_admin',
      state: 'Bihar',
      district: 'Patna',
      locality: 'Rampur',
      panchayat: 'Rampur Gram Panchayat',
      department: 'Subdivision 4 - Rampur Distribution Unit',
      active: true,
      createdAt: '2026-01-05T09:00:00Z',
    },
    {
      id: 'usr_district_1',
      _id: 'usr_district_1',
      name: 'Er. Priya Sen (District Nodal Officer)',
      email: 'priya.district@bijliwatch.gov.in',
      mobile: '+91 98765 99887',
      passwordHash,
      role: 'district_admin',
      state: 'Bihar',
      district: 'Patna',
      department: 'Patna Central Electric Supply Circle',
      active: true,
      createdAt: '2026-01-01T08:00:00Z',
    },
    {
      id: 'usr_state_1',
      _id: 'usr_state_1',
      name: 'Vikramaditya Roy, IAS (State Commissioner)',
      email: 'vikram.state@bijliwatch.gov.in',
      mobile: '+91 98765 55443',
      passwordHash,
      role: 'state_admin',
      state: 'Bihar',
      district: 'Patna',
      department: 'State Electricity Regulatory Directorate',
      active: true,
      createdAt: '2025-12-01T08:00:00Z',
    },
  ];

  // 2. Initial Connections
  const seedConnections = [
    {
      id: 'conn_1',
      _id: 'conn_1',
      userId: 'usr_consumer_1',
      consumerNumber: '1002948193',
      consumerName: 'Rajesh Kumar Verma',
      discom: 'SBPDCL - South Bihar Power Distribution',
      tariffCategory: 'Domestic (DS-II)',
      sanctionedLoadKw: 3.0,
      meterNumber: 'MTR-SB-98214',
      meterType: 'Smart Digital',
      serviceAddress: 'House 42, Ward 4, Near Primary Health Sub-Centre, Rampur',
      locality: 'Rampur',
      district: 'Patna',
      state: 'Bihar',
      pincode: '800014',
      status: 'active',
      createdAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'conn_2',
      _id: 'conn_2',
      userId: 'usr_consumer_1',
      consumerNumber: '1004817290',
      consumerName: 'Rajesh Kumar Verma',
      discom: 'SBPDCL - South Bihar Power Distribution',
      tariffCategory: 'Agricultural',
      sanctionedLoadKw: 5.0,
      meterNumber: 'MTR-AG-44109',
      meterType: 'Electronic',
      serviceAddress: 'Tubewell Plot 18, Rampur Agricultural Sector',
      locality: 'Rampur',
      district: 'Patna',
      state: 'Bihar',
      pincode: '800014',
      status: 'active',
      createdAt: '2026-02-01T11:00:00Z',
    },
  ];

  // 3. Historical Meter Readings
  const seedReadings = [
    {
      id: 'rdg_1',
      _id: 'rdg_1',
      connectionId: 'conn_1',
      userId: 'usr_consumer_1',
      previousReading: 4120,
      currentReading: 4340,
      unitsConsumed: 220,
      readingDate: '2026-07-28',
      readingSource: 'Utility Lineman',
      verified: true,
      createdAt: '2026-07-28T09:00:00Z',
    },
    {
      id: 'rdg_2',
      _id: 'rdg_2',
      connectionId: 'conn_1',
      userId: 'usr_consumer_1',
      previousReading: 4340,
      currentReading: 4575,
      unitsConsumed: 235,
      readingDate: '2026-08-28',
      readingSource: 'Automated Smart Meter',
      verified: true,
      createdAt: '2026-08-28T09:00:00Z',
    },
    {
      id: 'rdg_3',
      _id: 'rdg_3',
      connectionId: 'conn_1',
      userId: 'usr_consumer_1',
      previousReading: 4575,
      currentReading: 4815,
      unitsConsumed: 240,
      readingDate: '2026-09-28',
      readingSource: 'Automated Smart Meter',
      verified: true,
      createdAt: '2026-09-28T09:00:00Z',
    },
    {
      id: 'rdg_4',
      _id: 'rdg_4',
      connectionId: 'conn_1',
      userId: 'usr_consumer_1',
      previousReading: 4815,
      currentReading: 5395, // Unusual spike! 580 units (over 140% spike!)
      unitsConsumed: 580,
      readingDate: '2026-10-25',
      readingSource: 'Self / Consumer',
      notes: 'Unexpected sudden surge shown on digital display after line earthing repair',
      verified: true,
      createdAt: '2026-10-25T14:30:00Z',
    },
  ];

  // 4. Bills
  const seedBills = [
    {
      id: 'bill_1',
      _id: 'bill_1',
      connectionId: 'conn_1',
      userId: 'usr_consumer_1',
      billNumber: 'SB-BILL-2026-08',
      billingPeriod: 'Aug 2026',
      billingStartDate: '2026-07-28',
      billingEndDate: '2026-08-27',
      unitsConsumed: 235,
      fixedCharges: 150,
      energyCharges: 1460,
      taxesAndDuty: 96,
      subsidiesOrRebates: 100,
      totalAmountDue: 1606,
      dueDate: '2026-09-15',
      paymentStatus: 'Paid',
      billDocumentUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      isOfficialVerification: false,
      createdAt: '2026-08-28T10:00:00Z',
    },
    {
      id: 'bill_2',
      _id: 'bill_2',
      connectionId: 'conn_1',
      userId: 'usr_consumer_1',
      billNumber: 'SB-BILL-2026-09',
      billingPeriod: 'Sep 2026',
      billingStartDate: '2026-08-28',
      billingEndDate: '2026-09-27',
      unitsConsumed: 240,
      fixedCharges: 150,
      energyCharges: 1495,
      taxesAndDuty: 98,
      subsidiesOrRebates: 100,
      totalAmountDue: 1643,
      dueDate: '2026-10-15',
      paymentStatus: 'Paid',
      billDocumentUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      isOfficialVerification: false,
      createdAt: '2026-09-28T10:00:00Z',
    },
    {
      id: 'bill_3',
      _id: 'bill_3',
      connectionId: 'conn_1',
      userId: 'usr_consumer_1',
      billNumber: 'SB-BILL-2026-10',
      billingPeriod: 'Oct 2026',
      billingStartDate: '2026-09-28',
      billingEndDate: '2026-10-27',
      unitsConsumed: 580,
      fixedCharges: 150,
      energyCharges: 4120,
      taxesAndDuty: 256,
      subsidiesOrRebates: 0,
      totalAmountDue: 4526, // Shocking surge!
      dueDate: '2026-11-12',
      paymentStatus: 'Unpaid',
      billDocumentUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      isOfficialVerification: false,
      createdAt: '2026-10-26T10:00:00Z',
    },
  ];

  // 5. Complaints
  const seedComplaints = [
    {
      id: 'cmp_1',
      _id: 'cmp_1',
      referenceId: 'BW-2026-94812',
      userId: 'usr_consumer_1',
      consumerName: 'Rajesh Kumar Verma',
      consumerMobile: '+91 98765 43210',
      connectionId: 'conn_1',
      consumerNumber: '1002948193',
      category: 'Unexpectedly High Bill',
      severity: 'High',
      title: 'October Bill 140% higher than historical 3-month baseline',
      description: 'Our regular consumption has stayed between 220-240 units for the past 6 months. October bill suddenly billed 580 units (Rs. 4,526). There are no new appliances added. Meter display appears to count fast intermittently.',
      occurrenceDateTime: '2026-10-26T10:00:00Z',
      state: 'Bihar',
      district: 'Patna',
      locality: 'Rampur',
      address: 'House 42, Ward 4, Rampur',
      latitude: 25.5941,
      longitude: 85.1376,
      contactPreference: 'SMS / WhatsApp',
      evidenceFiles: [
        {
          url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
          type: 'image',
          title: 'Official Discom Bill Copy Oct 2026',
          uploadedAt: '2026-10-26T11:00:00Z',
        },
      ],
      status: 'Assigned',
      assignedTo: {
        officerId: 'usr_local_1',
        officerName: 'Anil Sharma (Junior Engineer)',
        department: 'Subdivision 4 - Rampur Distribution Unit',
        role: 'local_admin',
        assignedAt: '2026-10-26T14:00:00Z',
      },
      estimatedResolutionDate: '2026-10-30',
      adminNotes: [
        'Initial triage: Consumption jumped from 240 kWh to 580 kWh. Dispatched field technician to inspect meter pulse calibration and neutral earthing.',
      ],
      auditTrail: [
        {
          status: 'Submitted',
          changedBy: 'Rajesh Kumar Verma',
          role: 'consumer',
          timestamp: '2026-10-26T10:15:00Z',
          comment: 'Complaint lodged online through consumer portal.',
        },
        {
          status: 'Under Review',
          changedBy: 'Patna Electric Circle Automated Router',
          role: 'system',
          timestamp: '2026-10-26T10:16:00Z',
          comment: 'Jurisdiction verified as Rampur Local Panchayat.',
        },
        {
          status: 'Assigned',
          changedBy: 'Er. Priya Sen (District Nodal Officer)',
          role: 'district_admin',
          timestamp: '2026-10-26T14:00:00Z',
          comment: 'Assigned to JE Anil Sharma for on-site physical meter testing.',
        },
      ],
      createdAt: '2026-10-26T10:15:00Z',
      updatedAt: '2026-10-26T14:00:00Z',
    },
    {
      id: 'cmp_2',
      _id: 'cmp_2',
      referenceId: 'BW-2026-78103',
      userId: 'usr_consumer_1',
      consumerName: 'Rajesh Kumar Verma',
      consumerMobile: '+91 98765 43210',
      category: 'Damaged / Exposed Equipment',
      severity: 'Emergency / Hazardous',
      title: 'Sparking low-tension wire near Rampur Girls School',
      description: 'Overhead 440V line has snapped partially and is hanging 2 meters above ground. Constant sparking when wind blows.',
      occurrenceDateTime: '2026-10-20T16:30:00Z',
      state: 'Bihar',
      district: 'Patna',
      locality: 'Rampur',
      address: 'Main Road opposite Girls High School, Ward 4, Rampur',
      latitude: 25.5992,
      longitude: 85.1412,
      contactPreference: 'Phone Call',
      evidenceFiles: [
        {
          url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
          type: 'image',
          title: 'Damaged Cable Photo',
          uploadedAt: '2026-10-20T16:35:00Z',
        },
      ],
      status: 'Resolved',
      assignedTo: {
        officerId: 'usr_local_1',
        officerName: 'Anil Sharma (Junior Engineer)',
        department: 'Subdivision 4 - Rampur Distribution Unit',
        role: 'local_admin',
        assignedAt: '2026-10-20T16:45:00Z',
      },
      resolution: {
        workPerformed: 'Emergency response team isolated feeder #3. Replaced 65 meters of damaged LT conductor cable with new insulated aerial bunched cable (ABC). Tightened pole stay-wire and restored safe clearance.',
        completionDate: '2026-10-20T18:45:00Z',
        resolutionNotes: 'Conductor replaced and clearance restored to 5.8m above ground. Feeder re-energized safely.',
        evidenceUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=600&auto=format&fit=crop&q=80',
        resolvedByOfficerName: 'Anil Sharma (Junior Engineer)',
        resolvedByOfficerId: 'usr_local_1',
        resolvedAt: '2026-10-20T19:00:00Z',
        verifiedByOfficerId: 'usr_district_1',
        verifiedByOfficerName: 'Er. Priya Sen (District Nodal Officer)',
        verifiedAt: '2026-10-20T19:30:00Z',
      },
      adminNotes: [
        'Priority 1 emergency dispatched within 12 minutes.',
        'District safety approval granted after photographic evidence inspection.',
      ],
      auditTrail: [
        {
          status: 'Submitted',
          changedBy: 'Rajesh Kumar Verma',
          role: 'consumer',
          timestamp: '2026-10-20T16:35:00Z',
          comment: 'Emergency report logged.',
        },
        {
          status: 'Assigned',
          changedBy: 'System Auto-Escalation',
          role: 'system',
          timestamp: '2026-10-20T16:40:00Z',
          comment: 'Urgent routing to local quick response team.',
        },
        {
          status: 'In Progress',
          changedBy: 'Anil Sharma',
          role: 'local_admin',
          timestamp: '2026-10-20T17:10:00Z',
          comment: 'Line crew arrived at site.',
        },
        {
          status: 'Resolution Submitted',
          changedBy: 'Anil Sharma',
          role: 'local_admin',
          timestamp: '2026-10-20T19:00:00Z',
          comment: 'Work completed. Insulated ABC cable installed.',
        },
        {
          status: 'Resolved',
          changedBy: 'Er. Priya Sen',
          role: 'district_admin',
          timestamp: '2026-10-20T19:30:00Z',
          comment: 'Photographic proof verified and safety compliance cleared.',
        },
      ],
      createdAt: '2026-10-20T16:35:00Z',
      updatedAt: '2026-10-20T19:30:00Z',
    },
    {
      id: 'cmp_3',
      _id: 'cmp_3',
      referenceId: 'BW-2026-45120',
      userId: 'usr_consumer_1',
      consumerName: 'Rajesh Kumar Verma',
      consumerMobile: '+91 98765 43210',
      connectionId: 'conn_2',
      consumerNumber: '1004817290',
      category: 'Voltage Fluctuation',
      severity: 'Medium',
      title: 'Low voltage dropping below 140V during evening hours',
      description: 'Agricultural pump fails to start from 6 PM to 10 PM daily due to severe voltage sag.',
      occurrenceDateTime: '2026-10-24T18:00:00Z',
      state: 'Bihar',
      district: 'Patna',
      locality: 'Rampur',
      address: 'Tubewell Plot 18, Rampur Agricultural Sector',
      latitude: 25.5890,
      longitude: 85.1290,
      contactPreference: 'SMS / WhatsApp',
      evidenceFiles: [],
      status: 'Under Review',
      adminNotes: ['Distribution transformer DT-14 load balancing report requested.'],
      auditTrail: [
        {
          status: 'Submitted',
          changedBy: 'Rajesh Kumar Verma',
          role: 'consumer',
          timestamp: '2026-10-24T18:30:00Z',
          comment: 'Complaint logged.',
        },
        {
          status: 'Under Review',
          changedBy: 'Er. Priya Sen',
          role: 'district_admin',
          timestamp: '2026-10-25T11:00:00Z',
          comment: 'Under technical assessment by sub-station team.',
        },
      ],
      createdAt: '2026-10-24T18:30:00Z',
      updatedAt: '2026-10-25T11:00:00Z',
    },
  ];

  // 6. Tariff Configuration
  const seedTariffs = [
    {
      id: 'trf_1',
      _id: 'trf_1',
      state: 'Bihar',
      discom: 'SBPDCL - South Bihar Power Distribution',
      tariffCategory: 'Domestic (DS-II)',
      fixedChargePerKw: 50,
      slabs: [
        { minUnits: 0, maxUnits: 100, ratePerUnit: 6.10 },
        { minUnits: 101, maxUnits: 200, ratePerUnit: 6.95 },
        { minUnits: 201, maxUnits: 300, ratePerUnit: 7.75 },
        { minUnits: 301, maxUnits: null, ratePerUnit: 8.50 },
      ],
      electricityDutyPercent: 6.0,
      fuelSurchargePerUnit: 0.25,
      updatedAt: '2026-04-01T00:00:00Z',
    },
  ];

  // 7. Notifications
  const seedNotifications = [
    {
      id: 'notif_1',
      _id: 'notif_1',
      userId: 'usr_consumer_1',
      title: 'Complaint Assigned to Field Officer',
      message: 'Your high bill grievance (BW-2026-94812) has been assigned to JE Anil Sharma for on-site inspection.',
      type: 'info',
      complaintId: 'cmp_1',
      referenceId: 'BW-2026-94812',
      read: false,
      createdAt: '2026-10-26T14:00:00Z',
    },
    {
      id: 'notif_2',
      _id: 'notif_2',
      userId: 'usr_consumer_1',
      title: 'Emergency Hazardous Line Resolved',
      message: 'Grievance BW-2026-78103 has been verified and safely resolved. Replacement cable energized.',
      type: 'success',
      complaintId: 'cmp_2',
      referenceId: 'BW-2026-78103',
      read: true,
      createdAt: '2026-10-20T19:30:00Z',
    },
    {
      id: 'notif_3',
      _id: 'notif_3',
      userId: 'usr_consumer_1',
      title: 'High Consumption Alert',
      message: 'Your recent recorded meter reading (580 units) represents an anomalous 141.7% surge over your normal baseline.',
      type: 'alert',
      read: false,
      createdAt: '2026-10-25T14:35:00Z',
    },
  ];

  // 8. Audit Logs
  const seedAuditLogs = [
    {
      id: 'aud_1',
      _id: 'aud_1',
      action: 'RESOLUTION_VERIFIED',
      actorId: 'usr_district_1',
      actorName: 'Er. Priya Sen (District Nodal Officer)',
      actorRole: 'district_admin',
      targetId: 'BW-2026-78103',
      targetType: 'Complaint',
      details: {
        previousStatus: 'Resolution Submitted',
        newStatus: 'Resolved',
        evidenceReviewed: true,
      },
      createdAt: '2026-10-20T19:30:00Z',
    },
    {
      id: 'aud_2',
      _id: 'aud_2',
      action: 'COMPLAINT_ASSIGNED',
      actorId: 'usr_district_1',
      actorName: 'Er. Priya Sen (District Nodal Officer)',
      actorRole: 'district_admin',
      targetId: 'BW-2026-94812',
      targetType: 'Complaint',
      details: {
        assignedToOfficer: 'Anil Sharma (Junior Engineer)',
        department: 'Subdivision 4 - Rampur Distribution Unit',
      },
      createdAt: '2026-10-26T14:00:00Z',
    },
  ];

  localStore.users = seedUsers;
  localStore.connections = seedConnections;
  localStore.readings = seedReadings;
  localStore.bills = seedBills;
  localStore.complaints = seedComplaints;
  localStore.tariffs = seedTariffs;
  localStore.notifications = seedNotifications;
  localStore.auditLogs = seedAuditLogs;

  // If MongoDB Atlas is active, sync initial seed into MongoDB collections if empty
  if (isDbConnected()) {
    try {
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        console.log('[BijliWatch DB] Seeding initial data into MongoDB Atlas...');
        await UserModel.insertMany(seedUsers);
        await ConnectionModel.insertMany(seedConnections);
        await MeterReadingModel.insertMany(seedReadings);
        await BillModel.insertMany(seedBills);
        await ComplaintModel.insertMany(seedComplaints);
        await TariffModel.insertMany(seedTariffs);
        await NotificationModel.insertMany(seedNotifications);
        await AuditLogModel.insertMany(seedAuditLogs);
        console.log('[BijliWatch DB] MongoDB Atlas collections seeded successfully!');
      }
    } catch (err: any) {
      console.warn('[BijliWatch DB] Atlas seed sync info:', err.message);
    }
  }

  isSeeded = true;
  console.log('[BijliWatch DB] Initialized demo accounts and synthetic domain records.');
}
